import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAccount, useSwitchChain } from 'wagmi';
import { TxStatusBanner } from '../components/TxStatusBanner';
import { WalletGate } from '../components/WalletGate';
import { arcChain } from '../config/chain';
import { ADMIN_WALLET, CONTRACT_ADDRESS } from '../config/contracts';
import {
  useContractAbi,
  useMyActivity,
  usePoolDetail,
  useTokenMetadata,
  useTxLifecycle,
} from '../hooks/useContractData';
import {
  canSponsorReclaim,
  derivePoolStatus,
  formatDeadlineDate,
  formatTokenAmount,
  shortenAddress,
  type MatchPool,
} from '../lib/poolMath';

type ActivityTab = 'sponsored' | 'donations';

const SponsoredPoolRow: React.FC<{
  pool: MatchPool;
  nowSeconds: bigint;
  onReclaimed: () => void;
}> = ({ pool, nowSeconds, onReclaimed }) => {
  const { address, chainId } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { data: contractMeta } = useContractAbi();
  const { decimals, symbol } = useTokenMetadata(pool.token);
  const reclaimTx = useTxLifecycle(onReclaimed);

  const resolvedDecimals = decimals ?? 6;
  const resolvedSymbol = symbol ?? 'TOKEN';
  const status = derivePoolStatus(pool, nowSeconds);
  const reclaimAllowed = canSponsorReclaim(pool, address, nowSeconds);

  const handleReclaim = async () => {
    if (!CONTRACT_ADDRESS || !contractMeta || !reclaimAllowed) return;
    if (chainId !== arcChain.id) {
      await switchChainAsync({ chainId: arcChain.id });
    }
    await reclaimTx.writeContractAsync({
      address: CONTRACT_ADDRESS,
      abi: contractMeta.abi,
      functionName: contractMeta.fns.reclaim,
      args: [pool.id],
      chainId: arcChain.id,
    });
  };

  return (
    <div className="rounded-2xl bg-[#FFFFFF] border border-[#E2D7C0] p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#163828]/75">
            <span>Pool #{pool.id.toString()}</span>
            <span aria-hidden="true">·</span>
            <span>{resolvedSymbol}</span>
            <span aria-hidden="true">·</span>
            <span>{status}</span>
          </div>
          <Link
            to={`/pools/${pool.id.toString()}`}
            className="font-display text-xl font-bold text-[#163828] hover:underline underline-offset-4 block"
          >
            {pool.name}
          </Link>
          <p className="text-xs text-[#163828]/75">
            Beneficiary{' '}
            <span className="font-mono font-semibold text-[#163828]">
              {shortenAddress(pool.beneficiary)}
            </span>{' '}
            · Ends {formatDeadlineDate(pool.deadline)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 tabular-nums">
          <div className="text-left sm:text-right">
            <div className="text-xs text-[#163828]/70">Remaining match</div>
            <div className="font-display text-lg font-bold text-[#163828]">
              {formatTokenAmount(pool.remainingMatch, resolvedDecimals)} {resolvedSymbol}
            </div>
          </div>

          {reclaimAllowed && (
            <button
              type="button"
              onClick={handleReclaim}
              disabled={
                reclaimTx.phase === 'pending' || reclaimTx.phase === 'confirming'
              }
              className="px-4 py-2.5 rounded-xl bg-[#F2B705] text-[#0F271C] text-xs font-bold hover:bg-[#DDA400] disabled:opacity-50 transition-colors cursor-pointer whitespace-nowrap"
            >
              Reclaim Unused Match
            </button>
          )}
        </div>
      </div>

      <TxStatusBanner
        phase={reclaimTx.phase}
        actionLabel="Reclaim unused match"
        hash={reclaimTx.hash}
        errorMessage={reclaimTx.errorMessage}
        onReset={reclaimTx.reset}
      />
    </div>
  );
};

const MyDonationRow: React.FC<{
  poolId: bigint;
  amount: bigint;
  matched: bigint;
  timestamp: bigint;
}> = ({ poolId, amount, matched, timestamp }) => {
  const { data: detail } = usePoolDetail(poolId.toString());
  const pool = detail?.pool ?? null;
  const { decimals, symbol } = useTokenMetadata(pool?.token);
  const resolvedDecimals = decimals ?? 6;
  const resolvedSymbol = symbol ?? 'TOKEN';

  return (
    <tr>
      <td className="py-3 pr-4">
        <Link
          to={`/pools/${poolId.toString()}`}
          className="font-semibold text-[#163828] hover:underline"
        >
          {pool?.name || `Pool #${poolId.toString()}`}
        </Link>
      </td>
      <td className="py-3 pr-4 text-right font-semibold text-[#163828]">
        {formatTokenAmount(amount, resolvedDecimals)} {resolvedSymbol}
      </td>
      <td className="py-3 pr-4 text-right font-semibold text-[#163828]">
        +{formatTokenAmount(matched, resolvedDecimals)} {resolvedSymbol}
      </td>
      <td className="py-3 text-right text-xs text-[#163828]/75">
        {formatDeadlineDate(timestamp)}
      </td>
    </tr>
  );
};

export const MyActivityPage: React.FC = () => {
  const { address, isConnected } = useAccount();
  const { data, isLoading, refetch } = useMyActivity();
  const [activeTab, setActiveTab] = useState<ActivityTab>('sponsored');

  const nowSeconds = BigInt(Math.floor(Date.now() / 1000));
  const sponsoredPools = data?.sponsoredPools ?? [];
  const myDonations = data?.myDonations ?? [];
  const isAdmin =
    Boolean(ADMIN_WALLET && address) &&
    ADMIN_WALLET!.toLowerCase() === address!.toLowerCase();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-8">
      <div className="space-y-2.5 max-w-2xl">
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#163828] tracking-tight text-balance">
          My activity
        </h1>
        <p className="text-base text-[#163828]/85 leading-relaxed">
          Match pools you sponsored and donations sent from your connected wallet.
        </p>
      </div>

      {!isConnected ? (
        <WalletGate
          title="Connect your wallet to view activity"
          description="Wallet specific records stay hidden until you connect your wallet on Arc."
        />
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FFFFFF] border border-[#E2D7C0] rounded-2xl p-4">
            <div className="flex items-center gap-1 bg-[#FAF6EE] p-1 rounded-xl border border-[#E2D7C0] w-fit">
              <button
                type="button"
                onClick={() => setActiveTab('sponsored')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === 'sponsored'
                    ? 'bg-[#163828] text-[#FAF6EE]'
                    : 'text-[#163828]/75 hover:text-[#163828]'
                }`}
              >
                Sponsored Pools ({sponsoredPools.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('donations')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === 'donations'
                    ? 'bg-[#163828] text-[#FAF6EE]'
                    : 'text-[#163828]/75 hover:text-[#163828]'
                }`}
              >
                My Donations ({myDonations.length})
              </button>
            </div>

            <div className="text-xs text-[#163828]/80 font-mono">
              Wallet {address ? shortenAddress(address) : ''}
              {isAdmin ? ' · Admin' : ''}
            </div>
          </div>

          {!CONTRACT_ADDRESS ? (
            <div className="rounded-2xl bg-[#FFFFFF] border border-[#E2D7C0] p-10 text-center space-y-3">
              <h2 className="font-display text-2xl font-bold text-[#163828]">
                Contract address not configured yet
              </h2>
              <p className="text-sm text-[#163828]/80 max-w-md mx-auto">
                Configure <span className="font-mono font-semibold">VITE_CONTRACT_ADDRESS</span>{' '}
                to read activity for your connected wallet on Arc.
              </p>
            </div>
          ) : isLoading ? (
            <div className="rounded-2xl bg-[#FFFFFF] border border-[#E2D7C0] p-10 h-44 animate-pulse" />
          ) : activeTab === 'sponsored' ? (
            sponsoredPools.length === 0 ? (
              <div className="rounded-2xl bg-[#FFFFFF] border border-[#E2D7C0] p-10 text-center space-y-4">
                <h2 className="font-display text-2xl font-bold text-[#163828]">
                  No sponsored pools yet
                </h2>
                <p className="text-sm text-[#163828]/80 max-w-md mx-auto">
                  This wallet has not created any match pools on Arc yet.
                </p>
                <Link
                  to="/create"
                  className="inline-flex px-5 py-2.5 rounded-xl bg-[#163828] text-[#FAF6EE] text-sm font-semibold"
                >
                  Start a Match Pool
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {sponsoredPools.map((pool) => (
                  <SponsoredPoolRow
                    key={pool.id.toString()}
                    pool={pool}
                    nowSeconds={nowSeconds}
                    onReclaimed={() => refetch()}
                  />
                ))}
              </div>
            )
          ) : myDonations.length === 0 ? (
            <div className="rounded-2xl bg-[#FFFFFF] border border-[#E2D7C0] p-10 text-center space-y-4">
              <h2 className="font-display text-2xl font-bold text-[#163828]">
                No donations from this wallet yet
              </h2>
              <p className="text-sm text-[#163828]/80 max-w-md mx-auto">
                Explore active match pools to send a gift that gets matched one for one.
              </p>
              <Link
                to="/pools"
                className="inline-flex px-5 py-2.5 rounded-xl bg-[#163828] text-[#FAF6EE] text-sm font-semibold"
              >
                Browse Pools
              </Link>
            </div>
          ) : (
            <div className="rounded-2xl bg-[#FFFFFF] border border-[#E2D7C0] overflow-x-auto p-6">
              <table className="w-full text-left text-sm tabular-nums">
                <thead>
                  <tr className="border-b border-[#E2D7C0] text-xs font-semibold text-[#163828]/70">
                    <th className="py-2.5 pr-4">Pool</th>
                    <th className="py-2.5 pr-4 text-right">Your gift</th>
                    <th className="py-2.5 pr-4 text-right">Matched</th>
                    <th className="py-2.5 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2D7C0]">
                  {myDonations.map((don, idx) => (
                    <MyDonationRow
                      key={`${don.poolId.toString()}-${don.timestamp.toString()}-${idx}`}
                      poolId={don.poolId}
                      amount={don.amount}
                      matched={don.matched}
                      timestamp={don.timestamp}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
