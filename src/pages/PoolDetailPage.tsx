import { ArrowLeft, ExternalLink } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAccount, useSwitchChain } from 'wagmi';
import { TxStatusBanner } from '../components/TxStatusBanner';
import { WalletGate } from '../components/WalletGate';
import { arcChain, getExplorerAddressUrl } from '../config/chain';
import { CONTRACT_ADDRESS, ERC20_ABI } from '../config/contracts';
import {
  useContractAbi,
  usePoolDetail,
  useTokenMetadata,
  useTxLifecycle,
} from '../hooks/useContractData';
import {
  calculateMatchPreview,
  canSponsorReclaim,
  computePoolProgress,
  derivePoolStatus,
  formatDeadlineDate,
  formatRemainingTime,
  formatTokenAmount,
  parseTokenAmount,
  shortenAddress,
} from '../lib/poolMath';

export const PoolDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { address, isConnected, chainId } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { data: contractMeta } = useContractAbi();
  const { data, isLoading, refetch } = usePoolDetail(id);

  const pool = data?.pool ?? null;
  const donations = data?.donations ?? [];

  const {
    decimals,
    symbol,
    balance,
    allowance,
    refetchAllowance,
    refetchBalance,
  } = useTokenMetadata(pool?.token);

  const resolvedDecimals = decimals ?? 6;
  const resolvedSymbol = symbol ?? 'TOKEN';

  const [donationInput, setDonationInput] = useState('');
  const [donationError, setDonationError] = useState<string | null>(null);

  const parsedDonation = useMemo(
    () => parseTokenAmount(donationInput, resolvedDecimals),
    [donationInput, resolvedDecimals]
  );

  const matchPreview = useMemo(() => {
    if (!pool || !parsedDonation) {
      return { matched: 0n, totalToBeneficiary: 0n, capped: false };
    }
    return calculateMatchPreview(parsedDonation, pool.remainingMatch);
  }, [pool, parsedDonation]);

  const needsApproval =
    parsedDonation !== null &&
    allowance !== undefined &&
    allowance < parsedDonation;

  const approveTx = useTxLifecycle(() => {
    refetchAllowance();
  });

  const donateTx = useTxLifecycle(() => {
    setDonationInput('');
    refetchBalance();
    refetchAllowance();
    refetch();
  });

  const reclaimTx = useTxLifecycle(() => {
    refetch();
  });

  const nowSeconds = BigInt(Math.floor(Date.now() / 1000));

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
        <div className="rounded-2xl bg-[#FFFFFF] border border-[#E2D7C0] p-10 h-72 animate-pulse" />
      </div>
    );
  }

  if (!pool) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 space-y-6 text-center">
        <h1 className="font-display text-3xl font-bold text-[#163828]">
          Pool not found
        </h1>
        <p className="text-sm sm:text-base text-[#163828]/80">
          {CONTRACT_ADDRESS
            ? 'No pool exists at this ID on the Nerwopope contract.'
            : 'Contract address is not configured yet.'}
        </p>
        <Link
          to="/pools"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#163828] text-[#FAF6EE] text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Browse Pools</span>
        </Link>
      </div>
    );
  }

  const status = derivePoolStatus(pool, nowSeconds);
  const progress = computePoolProgress(pool.initialMatch, pool.remainingMatch);
  const reclaimAllowed = canSponsorReclaim(pool, address, nowSeconds);
  const isSponsor =
    Boolean(address) && pool.sponsor.toLowerCase() === address!.toLowerCase();

  const handleDonateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDonationError(null);

    if (!parsedDonation) {
      setDonationError('Enter a positive donation amount.');
      return;
    }
    if (balance !== undefined && parsedDonation > balance) {
      setDonationError('Donation exceeds your wallet balance.');
      return;
    }
    if (!CONTRACT_ADDRESS || !contractMeta) return;

    if (chainId !== arcChain.id) {
      await switchChainAsync({ chainId: arcChain.id });
    }

    if (needsApproval) {
      await approveTx.writeContractAsync({
        address: pool.token,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [CONTRACT_ADDRESS, parsedDonation],
        chainId: arcChain.id,
      });
      return;
    }

    await donateTx.writeContractAsync({
      address: CONTRACT_ADDRESS,
      abi: contractMeta.abi,
      functionName: contractMeta.fns.donate,
      args: [pool.id, parsedDonation],
      chainId: arcChain.id,
    });
  };

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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-10">
      <Link
        to="/pools"
        className="inline-flex items-center gap-2 text-sm font-semibold text-[#163828] hover:underline underline-offset-4"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>All match pools</span>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left column: Pool overview + Donations history */}
        <div className="lg:col-span-7 space-y-8">
          <div className="rounded-2xl bg-[#FFFFFF] border border-[#E2D7C0] p-6 sm:p-8 space-y-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#163828]/75">
                <span>Pool #{pool.id.toString()}</span>
                <span aria-hidden="true">·</span>
                <span>{resolvedSymbol}</span>
                <span aria-hidden="true">·</span>
                <span>{status}</span>
                <span aria-hidden="true">·</span>
                <span>{formatRemainingTime(pool.deadline, nowSeconds)}</span>
              </div>
              <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#163828] tracking-tight text-balance">
                {pool.name}
              </h1>
              <p className="text-base text-[#163828]/85 leading-relaxed">
                {pool.description}
              </p>
            </div>

            {/* Match Reserve Progress */}
            <div className="space-y-2.5 pt-2">
              <div className="flex items-baseline justify-between text-sm font-semibold text-[#163828] tabular-nums">
                <span>
                  {formatTokenAmount(pool.remainingMatch, resolvedDecimals)} {resolvedSymbol}{' '}
                  left to match
                </span>
                <span className="text-[#163828]/70">
                  {formatTokenAmount(pool.initialMatch, resolvedDecimals)} {resolvedSymbol}{' '}
                  initial
                </span>
              </div>
              <div
                className="h-3 w-full rounded-full bg-[#F1E9D8] overflow-hidden"
                role="progressbar"
                aria-valuenow={Math.round(progress)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Match reserve used"
              >
                <div
                  className="h-full bg-[#2D6A4F] transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Key Metrics */}
            <dl className="grid grid-cols-2 sm:grid-cols-3 gap-5 pt-4 border-t border-[#E2D7C0] tabular-nums">
              <div>
                <dt className="text-xs font-semibold text-[#163828]/70">Total donated</dt>
                <dd className="font-display text-xl font-bold text-[#163828] mt-0.5">
                  {formatTokenAmount(pool.totalDonated, resolvedDecimals)} {resolvedSymbol}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-[#163828]/70">Total matched</dt>
                <dd className="font-display text-xl font-bold text-[#163828] mt-0.5">
                  {formatTokenAmount(pool.totalMatched, resolvedDecimals)} {resolvedSymbol}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-[#163828]/70">Deadline</dt>
                <dd className="text-sm font-semibold text-[#163828] mt-1">
                  {formatDeadlineDate(pool.deadline)}
                </dd>
              </div>
            </dl>

            {/* Addresses */}
            <div className="pt-4 border-t border-[#E2D7C0] grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-[#163828]/70 font-semibold block">Sponsor</span>
                <a
                  href={getExplorerAddressUrl(pool.sponsor)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-mono font-semibold text-[#163828] hover:underline"
                >
                  <span>{shortenAddress(pool.sponsor)}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="space-y-1">
                <span className="text-[#163828]/70 font-semibold block">Beneficiary</span>
                <a
                  href={getExplorerAddressUrl(pool.beneficiary)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-mono font-semibold text-[#163828] hover:underline"
                >
                  <span>{shortenAddress(pool.beneficiary)}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          {/* Sponsor Reclaim Card (Sponsor only) */}
          {isSponsor && (
            <div className="rounded-2xl bg-[#163828] text-[#FAF6EE] p-6 space-y-4">
              <div className="space-y-1">
                <h2 className="font-display text-xl font-bold text-[#FFFFFF]">
                  Sponsor reclaim
                </h2>
                <p className="text-sm text-[#FAF6EE]/85 leading-relaxed">
                  {pool.reclaimed
                    ? 'You have already reclaimed the unused match reserve from this pool.'
                    : reclaimAllowed
                      ? `${formatTokenAmount(pool.remainingMatch, resolvedDecimals)} ${resolvedSymbol} was unmatched after the deadline and can be returned to your wallet.`
                      : nowSeconds < pool.deadline
                        ? 'Locked match funds remain reserved until the pool deadline passes.'
                        : 'No unmatched balance remains in this pool.'}
                </p>
              </div>

              <TxStatusBanner
                phase={reclaimTx.phase}
                actionLabel="Reclaim unused match"
                hash={reclaimTx.hash}
                errorMessage={reclaimTx.errorMessage}
                onReset={reclaimTx.reset}
              />

              {reclaimAllowed && (
                <button
                  type="button"
                  onClick={handleReclaim}
                  disabled={
                    reclaimTx.phase === 'pending' || reclaimTx.phase === 'confirming'
                  }
                  className="px-5 py-3 rounded-xl bg-[#F2B705] text-[#0F271C] text-sm font-bold hover:bg-[#DDA400] disabled:opacity-50 transition-colors cursor-pointer"
                >
                  Reclaim Unused Match
                </button>
              )}
            </div>
          )}

          {/* Donations History */}
          <div className="rounded-2xl bg-[#FFFFFF] border border-[#E2D7C0] p-6 sm:p-8 space-y-4">
            <h2 className="font-display text-2xl font-bold text-[#163828]">
              Donations in this pool
            </h2>
            {donations.length === 0 ? (
              <p className="text-sm text-[#163828]/75">
                No donations have been recorded for this pool yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm tabular-nums">
                  <thead>
                    <tr className="border-b border-[#E2D7C0] text-xs font-semibold text-[#163828]/70">
                      <th className="py-2.5 pr-4">Donor</th>
                      <th className="py-2.5 pr-4 text-right">Gift</th>
                      <th className="py-2.5 pr-4 text-right">Matched</th>
                      <th className="py-2.5 text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2D7C0]">
                    {donations.map((don, idx) => (
                      <tr key={`${don.donor}-${don.timestamp.toString()}-${idx}`}>
                        <td className="py-3 pr-4 font-mono text-xs text-[#163828]">
                          {shortenAddress(don.donor)}
                        </td>
                        <td className="py-3 pr-4 text-right font-semibold text-[#163828]">
                          {formatTokenAmount(don.amount, resolvedDecimals)} {resolvedSymbol}
                        </td>
                        <td className="py-3 pr-4 text-right font-semibold text-[#163828]">
                          +{formatTokenAmount(don.matched, resolvedDecimals)} {resolvedSymbol}
                        </td>
                        <td className="py-3 text-right text-xs text-[#163828]/75">
                          {formatDeadlineDate(don.timestamp)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right column: Donate & Match Panel */}
        <div className="lg:col-span-5">
          {!isConnected ? (
            <WalletGate
              title="Connect your wallet to donate"
              description="Send a gift in USDC or EURC directly to the beneficiary and trigger an equal match from this pool."
            />
          ) : (
            <form
              onSubmit={handleDonateSubmit}
              className="rounded-2xl bg-[#FFFFFF] border border-[#E2D7C0] p-6 sm:p-8 space-y-5"
            >
              <div className="space-y-1">
                <h2 className="font-display text-2xl font-bold text-[#163828]">
                  Donate to this pool
                </h2>
                <p className="text-sm text-[#163828]/80">
                  {status === 'Active'
                    ? 'Your gift and its match go straight to the beneficiary.'
                    : status === 'Depleted'
                      ? 'This pool has used its entire match reserve. Gifts still reach the beneficiary without a match.'
                      : 'This pool has passed its deadline. Matching is closed.'}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-[#163828]/80 tabular-nums">
                  <label htmlFor="donate-amount" className="font-semibold text-[#163828]">
                    Gift amount ({resolvedSymbol})
                  </label>
                  <span>
                    Balance:{' '}
                    {balance !== undefined
                      ? `${formatTokenAmount(balance, resolvedDecimals)} ${resolvedSymbol}`
                      : '0'}
                  </span>
                </div>
                <input
                  id="donate-amount"
                  type="text"
                  inputMode="decimal"
                  value={donationInput}
                  onChange={(e) => setDonationInput(e.target.value)}
                  placeholder="25"
                  disabled={status === 'Ended'}
                  className="w-full rounded-xl border border-[#E2D7C0] bg-[#FAF6EE] px-4 py-3 text-sm font-mono tabular-nums text-[#163828] placeholder:text-[#163828]/45 focus:outline-none focus:border-[#163828] disabled:opacity-60"
                />
                {donationError && (
                  <p className="text-xs font-medium text-[#B91C1C]">{donationError}</p>
                )}
              </div>

              {/* Match Calculation Preview */}
              <div className="rounded-xl bg-[#FAF6EE] border border-[#E2D7C0] p-4 space-y-2.5 text-sm tabular-nums">
                <div className="flex items-center justify-between">
                  <span className="text-[#163828]/80">Your gift</span>
                  <span className="font-mono font-semibold text-[#163828]">
                    {parsedDonation
                      ? `${formatTokenAmount(parsedDonation, resolvedDecimals)} ${resolvedSymbol}`
                      : `0 ${resolvedSymbol}`}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#163828]/80">Pool match</span>
                  <span className="font-mono font-semibold text-[#163828]">
                    {status === 'Ended'
                      ? `0 ${resolvedSymbol}`
                      : `+${formatTokenAmount(matchPreview.matched, resolvedDecimals)} ${resolvedSymbol}`}
                  </span>
                </div>
                <div className="pt-2 border-t border-[#E2D7C0] flex items-center justify-between font-bold text-[#163828]">
                  <span>Beneficiary receives</span>
                  <span className="font-mono">
                    {status === 'Ended' && parsedDonation
                      ? `${formatTokenAmount(parsedDonation, resolvedDecimals)} ${resolvedSymbol}`
                      : `${formatTokenAmount(matchPreview.totalToBeneficiary, resolvedDecimals)} ${resolvedSymbol}`}
                  </span>
                </div>
                {matchPreview.capped && status === 'Active' && (
                  <p className="text-xs text-[#163828]/80 leading-relaxed pt-1">
                    Match is capped at the remaining pool balance. Your full gift still
                    goes to the beneficiary.
                  </p>
                )}
              </div>

              <TxStatusBanner
                phase={approveTx.phase}
                actionLabel={`Approve ${resolvedSymbol}`}
                hash={approveTx.hash}
                errorMessage={approveTx.errorMessage}
                onReset={approveTx.reset}
              />

              <TxStatusBanner
                phase={donateTx.phase}
                actionLabel="Donate"
                hash={donateTx.hash}
                errorMessage={donateTx.errorMessage}
                onReset={donateTx.reset}
              />

              <button
                type="submit"
                disabled={
                  !CONTRACT_ADDRESS ||
                  status === 'Ended' ||
                  approveTx.phase === 'pending' ||
                  approveTx.phase === 'confirming' ||
                  donateTx.phase === 'pending' ||
                  donateTx.phase === 'confirming'
                }
                className="w-full py-3.5 px-6 rounded-xl bg-[#163828] text-[#FAF6EE] text-sm font-bold hover:bg-[#0F271C] disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                {status === 'Ended'
                  ? 'Pool Deadline Passed'
                  : needsApproval
                    ? `Approve ${resolvedSymbol} first`
                    : 'Donate and Match'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
