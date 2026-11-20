import type { Abi, AbiFunction } from 'viem';
import { ARC_EXPLORER_URL } from '../config/chain';
import { NERWOPOPE_FALLBACK_ABI } from '../config/contracts';
import type { MatchPool, PlatformStats, PoolDonation } from './poolMath';

export interface ResolvedContractFunctions {
  createPool: string;
  donate: string;
  reclaim: string;
  getPool: string;
  getDonations: string;
  getPoolsBySponsor: string;
  getDonationsByDonor: string;
  getPlatformStats: string | null;
  poolCount: string | null;
}

const CREATE_POOL_CANDIDATES = ['createPool', 'startPool', 'newPool', 'createMatchPool'];
const DONATE_CANDIDATES = ['donate', 'contribute', 'donateToPool'];
const RECLAIM_CANDIDATES = ['reclaim', 'reclaimUnused', 'reclaimMatch', 'withdrawUnused'];
const GET_POOL_CANDIDATES = ['getPool', 'pools', 'poolInfo', 'getMatchPool'];
const GET_DONATIONS_CANDIDATES = ['getDonations', 'getPoolDonations', 'donationsForPool'];
const GET_SPONSOR_POOLS_CANDIDATES = ['getPoolsBySponsor', 'getSponsorPools', 'sponsorPools'];
const GET_DONOR_DONATIONS_CANDIDATES = ['getDonationsByDonor', 'getDonorDonations', 'donorDonations'];
const GET_STATS_CANDIDATES = ['getPlatformStats', 'platformStats', 'getStats'];
const POOL_COUNT_CANDIDATES = ['poolCount', 'totalPools', 'nextPoolId', 'getPoolCount'];

function findMatchingFunctionName(
  fnNames: Set<string>,
  candidates: string[],
  fallback: string
): string {
  for (const candidate of candidates) {
    if (fnNames.has(candidate)) return candidate;
  }
  return fallback;
}

function findOptionalFunctionName(
  fnNames: Set<string>,
  candidates: string[]
): string | null {
  for (const candidate of candidates) {
    if (fnNames.has(candidate)) return candidate;
  }
  return null;
}

export function resolveContractInterface(abi: Abi): ResolvedContractFunctions {
  const fnNames = new Set(
    abi
      .filter((item): item is AbiFunction => item.type === 'function')
      .map((item) => item.name)
  );

  return {
    createPool: findMatchingFunctionName(fnNames, CREATE_POOL_CANDIDATES, 'createPool'),
    donate: findMatchingFunctionName(fnNames, DONATE_CANDIDATES, 'donate'),
    reclaim: findMatchingFunctionName(fnNames, RECLAIM_CANDIDATES, 'reclaim'),
    getPool: findMatchingFunctionName(fnNames, GET_POOL_CANDIDATES, 'getPool'),
    getDonations: findMatchingFunctionName(fnNames, GET_DONATIONS_CANDIDATES, 'getDonations'),
    getPoolsBySponsor: findMatchingFunctionName(
      fnNames,
      GET_SPONSOR_POOLS_CANDIDATES,
      'getPoolsBySponsor'
    ),
    getDonationsByDonor: findMatchingFunctionName(
      fnNames,
      GET_DONOR_DONATIONS_CANDIDATES,
      'getDonationsByDonor'
    ),
    getPlatformStats: findOptionalFunctionName(fnNames, GET_STATS_CANDIDATES),
    poolCount: findOptionalFunctionName(fnNames, POOL_COUNT_CANDIDATES),
  };
}

const abiCache = new Map<string, Abi>();

export async function fetchContractAbi(contractAddress: `0x${string}`): Promise<Abi> {
  const key = contractAddress.toLowerCase();
  const cached = abiCache.get(key);
  if (cached) return cached;

  const fallback = NERWOPOPE_FALLBACK_ABI as unknown as Abi;

  try {
    const v2Resp = await fetch(
      `${ARC_EXPLORER_URL}/api/v2/smart-contracts/${contractAddress}`,
      { headers: { Accept: 'application/json' } }
    );
    if (v2Resp.ok) {
      const data = (await v2Resp.json()) as { abi?: Abi };
      if (Array.isArray(data?.abi) && data.abi.length > 0) {
        abiCache.set(key, data.abi);
        return data.abi;
      }
    }
  } catch {
    // Fall through to legacy explorer endpoint or baseline ABI
  }

  try {
    const legacyResp = await fetch(
      `${ARC_EXPLORER_URL}/api?module=contract&action=getabi&address=${contractAddress}`,
      { headers: { Accept: 'application/json' } }
    );
    if (legacyResp.ok) {
      const data = (await legacyResp.json()) as { status?: string; result?: string };
      if (data?.status === '1' && typeof data.result === 'string') {
        const parsed = JSON.parse(data.result) as Abi;
        if (Array.isArray(parsed) && parsed.length > 0) {
          abiCache.set(key, parsed);
          return parsed;
        }
      }
    }
  } catch {
    // Fall back to baseline ABI
  }

  return fallback;
}

function toBigInt(value: unknown): bigint {
  if (typeof value === 'bigint') return value;
  if (typeof value === 'number') return BigInt(value);
  if (typeof value === 'string' && value.length > 0) return BigInt(value);
  return 0n;
}

function toAddress(value: unknown): `0x${string}` {
  if (typeof value === 'string' && value.startsWith('0x')) {
    return value as `0x${string}`;
  }
  return '0x0000000000000000000000000000000000000000';
}

export function normalizePoolRecord(raw: unknown, fallbackId: bigint): MatchPool | null {
  if (!raw) return null;

  if (Array.isArray(raw)) {
    if (raw.length < 11) return null;
    return {
      id: toBigInt(raw[0] ?? fallbackId),
      name: String(raw[1] ?? ''),
      description: String(raw[2] ?? ''),
      sponsor: toAddress(raw[3]),
      beneficiary: toAddress(raw[4]),
      token: toAddress(raw[5]),
      initialMatch: toBigInt(raw[6]),
      remainingMatch: toBigInt(raw[7]),
      totalDonated: toBigInt(raw[8]),
      totalMatched: toBigInt(raw[9]),
      deadline: toBigInt(raw[10]),
      createdAt: toBigInt(raw[11] ?? 0n),
      reclaimed: Boolean(raw[12] ?? false),
    };
  }

  if (typeof raw === 'object') {
    const rec = raw as Record<string, unknown>;
    return {
      id: toBigInt(rec.id ?? rec.poolId ?? fallbackId),
      name: String(rec.name ?? ''),
      description: String(rec.description ?? ''),
      sponsor: toAddress(rec.sponsor),
      beneficiary: toAddress(rec.beneficiary),
      token: toAddress(rec.token),
      initialMatch: toBigInt(rec.initialMatch ?? rec.matchAmount ?? rec.totalMatch),
      remainingMatch: toBigInt(rec.remainingMatch ?? rec.remaining),
      totalDonated: toBigInt(rec.totalDonated ?? rec.donated),
      totalMatched: toBigInt(rec.totalMatched ?? rec.matched),
      deadline: toBigInt(rec.deadline),
      createdAt: toBigInt(rec.createdAt ?? 0n),
      reclaimed: Boolean(rec.reclaimed ?? false),
    };
  }

  return null;
}

export function normalizeDonationRecord(raw: unknown): PoolDonation | null {
  if (!raw) return null;

  if (Array.isArray(raw)) {
    if (raw.length < 5) return null;
    return {
      poolId: toBigInt(raw[0]),
      donor: toAddress(raw[1]),
      amount: toBigInt(raw[2]),
      matched: toBigInt(raw[3]),
      timestamp: toBigInt(raw[4]),
    };
  }

  if (typeof raw === 'object') {
    const rec = raw as Record<string, unknown>;
    return {
      poolId: toBigInt(rec.poolId),
      donor: toAddress(rec.donor),
      amount: toBigInt(rec.amount ?? rec.donationAmount),
      matched: toBigInt(rec.matched ?? rec.matchedAmount),
      timestamp: toBigInt(rec.timestamp ?? rec.createdAt),
    };
  }

  return null;
}

export function normalizePlatformStats(raw: unknown): PlatformStats {
  if (Array.isArray(raw)) {
    return {
      totalPools: toBigInt(raw[0]),
      totalDonated: toBigInt(raw[1]),
      totalMatched: toBigInt(raw[2]),
      activePools: toBigInt(raw[3]),
    };
  }

  if (raw && typeof raw === 'object') {
    const rec = raw as Record<string, unknown>;
    return {
      totalPools: toBigInt(rec.totalPools ?? rec.poolCount),
      totalDonated: toBigInt(rec.totalDonated),
      totalMatched: toBigInt(rec.totalMatched),
      activePools: toBigInt(rec.activePools),
    };
  }

  return {
    totalPools: 0n,
    totalDonated: 0n,
    totalMatched: 0n,
    activePools: 0n,
  };
}
