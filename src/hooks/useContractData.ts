import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';
import type { Abi } from 'viem';
import {
  useAccount,
  usePublicClient,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi';
import { arcChain, getTokenMetaByAddress } from '../config/chain';
import {
  CONTRACT_ADDRESS,
  ERC20_ABI,
  NERWOPOPE_FALLBACK_ABI,
} from '../config/contracts';
import {
  fetchContractAbi,
  normalizeDonationRecord,
  normalizePlatformStats,
  normalizePoolRecord,
  resolveContractInterface,
} from '../lib/abiAdapter';
import type { MatchPool, PlatformStats, PoolDonation } from '../lib/poolMath';

const EMPTY_STATS: PlatformStats = {
  totalPools: 0n,
  totalDonated: 0n,
  totalMatched: 0n,
  activePools: 0n,
};

export function useContractAbi() {
  const fallback = NERWOPOPE_FALLBACK_ABI as unknown as Abi;
  return useQuery({
    queryKey: ['nerwopope-abi', CONTRACT_ADDRESS],
    queryFn: async () => {
      if (!CONTRACT_ADDRESS) {
        return {
          abi: fallback,
          fns: resolveContractInterface(fallback),
          isLiveAbi: false,
        };
      }
      const abi = await fetchContractAbi(CONTRACT_ADDRESS);
      return {
        abi,
        fns: resolveContractInterface(abi),
        isLiveAbi: true,
      };
    },
    initialData: !CONTRACT_ADDRESS
      ? {
          abi: fallback,
          fns: resolveContractInterface(fallback),
          isLiveAbi: false,
        }
      : undefined,
    staleTime: 5 * 60 * 1000,
  });
}

export function useTokenMetadata(tokenAddress?: `0x${string}`) {
  const { address: userAddress } = useAccount();
  const knownMeta = getTokenMetaByAddress(tokenAddress);

  const decimalsRead = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'decimals',
    chainId: arcChain.id,
    query: {
      enabled: Boolean(tokenAddress),
    },
  });

  const symbolRead = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'symbol',
    chainId: arcChain.id,
    query: {
      enabled: Boolean(tokenAddress),
    },
  });

  const balanceRead = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: userAddress ? [userAddress] : undefined,
    chainId: arcChain.id,
    query: {
      enabled: Boolean(tokenAddress && userAddress),
    },
  });

  const allowanceRead = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: userAddress && CONTRACT_ADDRESS ? [userAddress, CONTRACT_ADDRESS] : undefined,
    chainId: arcChain.id,
    query: {
      enabled: Boolean(tokenAddress && userAddress && CONTRACT_ADDRESS),
    },
  });

  return {
    decimals: decimalsRead.data !== undefined ? Number(decimalsRead.data) : undefined,
    symbol: (symbolRead.data as string | undefined) ?? knownMeta?.symbol,
    balance: balanceRead.data as bigint | undefined,
    allowance: allowanceRead.data as bigint | undefined,
    isLoadingDecimals: decimalsRead.isLoading,
    refetchAllowance: allowanceRead.refetch,
    refetchBalance: balanceRead.refetch,
  };
}

export function useAllPools() {
  const publicClient = usePublicClient({ chainId: arcChain.id });
  const { data: contractMeta } = useContractAbi();

  return useQuery({
    queryKey: ['nerwopope-pools', CONTRACT_ADDRESS, contractMeta?.isLiveAbi],
    queryFn: async (): Promise<{
      configured: boolean;
      pools: MatchPool[];
      stats: PlatformStats;
    }> => {
      if (!CONTRACT_ADDRESS || !publicClient || !contractMeta) {
        return { configured: false, pools: [], stats: EMPTY_STATS };
      }

      const { abi, fns } = contractMeta;
      let stats: PlatformStats = EMPTY_STATS;

      if (fns.getPlatformStats) {
        try {
          const rawStats = await publicClient.readContract({
            address: CONTRACT_ADDRESS,
            abi,
            functionName: fns.getPlatformStats,
          });
          stats = normalizePlatformStats(rawStats);
        } catch {
          stats = EMPTY_STATS;
        }
      }

      let count = stats.totalPools;
      if (count === 0n && fns.poolCount) {
        try {
          const rawCount = await publicClient.readContract({
            address: CONTRACT_ADDRESS,
            abi,
            functionName: fns.poolCount,
          });
          count = typeof rawCount === 'bigint' ? rawCount : BigInt(Number(rawCount ?? 0));
          stats = { ...stats, totalPools: count };
        } catch {
          count = 0n;
        }
      }

      const numericCount = Number(count);
      if (!Number.isFinite(numericCount) || numericCount <= 0) {
        return { configured: true, pools: [], stats };
      }

      const pools: MatchPool[] = [];
      for (let i = 1; i <= numericCount; i++) {
        try {
          const rawPool = await publicClient.readContract({
            address: CONTRACT_ADDRESS,
            abi,
            functionName: fns.getPool,
            args: [BigInt(i)],
          });
          const normalized = normalizePoolRecord(rawPool, BigInt(i));
          if (normalized && normalized.name.trim().length > 0) {
            pools.push(normalized);
          }
        } catch {
          // Skip invalid or uninitialized IDs
        }
      }

      return { configured: true, pools, stats };
    },
    initialData: !CONTRACT_ADDRESS
      ? { configured: false, pools: [], stats: EMPTY_STATS }
      : undefined,
    enabled: Boolean(contractMeta),
  });
}

export function usePoolDetail(poolIdParam?: string) {
  const publicClient = usePublicClient({ chainId: arcChain.id });
  const { data: contractMeta } = useContractAbi();

  let parsedPoolId: bigint | null = null;
  if (poolIdParam && /^\d+$/.test(poolIdParam)) {
    parsedPoolId = BigInt(poolIdParam);
  }

  return useQuery({
    queryKey: ['nerwopope-pool-detail', CONTRACT_ADDRESS, parsedPoolId?.toString()],
    queryFn: async (): Promise<{
      configured: boolean;
      pool: MatchPool | null;
      donations: PoolDonation[];
    }> => {
      if (!CONTRACT_ADDRESS || !publicClient || !contractMeta || parsedPoolId === null) {
        return { configured: Boolean(CONTRACT_ADDRESS), pool: null, donations: [] };
      }

      const { abi, fns } = contractMeta;

      const rawPool = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi,
        functionName: fns.getPool,
        args: [parsedPoolId],
      });

      const pool = normalizePoolRecord(rawPool, parsedPoolId);
      if (!pool || !pool.name.trim()) {
        return { configured: true, pool: null, donations: [] };
      }

      let donations: PoolDonation[] = [];
      try {
        const rawDonations = await publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi,
          functionName: fns.getDonations,
          args: [parsedPoolId],
        });
        if (Array.isArray(rawDonations)) {
          donations = rawDonations
            .map((entry) => normalizeDonationRecord(entry))
            .filter((entry): entry is PoolDonation => entry !== null);
        }
      } catch {
        donations = [];
      }

      return { configured: true, pool, donations };
    },
    enabled: Boolean(contractMeta),
  });
}

export function useMyActivity() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient({ chainId: arcChain.id });
  const { data: contractMeta } = useContractAbi();

  return useQuery({
    queryKey: ['nerwopope-my-activity', CONTRACT_ADDRESS, address],
    queryFn: async (): Promise<{
      configured: boolean;
      sponsoredPools: MatchPool[];
      myDonations: PoolDonation[];
    }> => {
      if (!CONTRACT_ADDRESS || !publicClient || !contractMeta || !isConnected || !address) {
        return {
          configured: Boolean(CONTRACT_ADDRESS),
          sponsoredPools: [],
          myDonations: [],
        };
      }

      const { abi, fns } = contractMeta;
      const sponsoredPools: MatchPool[] = [];
      let myDonations: PoolDonation[] = [];

      try {
        const rawPoolIds = await publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi,
          functionName: fns.getPoolsBySponsor,
          args: [address],
        });

        if (Array.isArray(rawPoolIds)) {
          for (const rawId of rawPoolIds) {
            const id = typeof rawId === 'bigint' ? rawId : BigInt(Number(rawId));
            try {
              const rawPool = await publicClient.readContract({
                address: CONTRACT_ADDRESS,
                abi,
                functionName: fns.getPool,
                args: [id],
              });
              const normalized = normalizePoolRecord(rawPool, id);
              if (normalized) sponsoredPools.push(normalized);
            } catch {
              // Skip unreadable pool
            }
          }
        }
      } catch {
        // Sponsor read failed or empty
      }

      try {
        const rawDonations = await publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi,
          functionName: fns.getDonationsByDonor,
          args: [address],
        });
        if (Array.isArray(rawDonations)) {
          myDonations = rawDonations
            .map((d) => normalizeDonationRecord(d))
            .filter((d): d is PoolDonation => d !== null);
        }
      } catch {
        myDonations = [];
      }

      return {
        configured: true,
        sponsoredPools,
        myDonations,
      };
    },
    enabled: Boolean(contractMeta && isConnected && address),
  });
}

export type TxPhase = 'idle' | 'pending' | 'confirming' | 'confirmed' | 'error';

export function useTxLifecycle(onConfirmed?: () => void) {
  const queryClient = useQueryClient();
  const {
    data: hash,
    isPending,
    error: writeError,
    writeContractAsync,
    reset: resetWrite,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: receiptError,
  } = useWaitForTransactionReceipt({
    hash,
    chainId: arcChain.id,
  });

  useEffect(() => {
    if (isConfirmed) {
      queryClient.invalidateQueries({ queryKey: ['nerwopope-pools'] });
      queryClient.invalidateQueries({ queryKey: ['nerwopope-pool-detail'] });
      queryClient.invalidateQueries({ queryKey: ['nerwopope-my-activity'] });
      onConfirmed?.();
    }
  }, [isConfirmed, onConfirmed, queryClient]);

  const phase: TxPhase = isPending
    ? 'pending'
    : isConfirming
      ? 'confirming'
      : isConfirmed
        ? 'confirmed'
        : writeError || receiptError
          ? 'error'
          : 'idle';

  const errorMessage =
    (writeError as { shortMessage?: string } | null)?.shortMessage ??
    writeError?.message ??
    (receiptError as { shortMessage?: string } | null)?.shortMessage ??
    receiptError?.message ??
    null;

  const reset = useCallback(() => {
    resetWrite();
  }, [resetWrite]);

  return {
    hash,
    phase,
    errorMessage,
    writeContractAsync,
    reset,
  };
}
