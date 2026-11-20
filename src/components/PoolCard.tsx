import React from 'react';
import { Link } from 'react-router-dom';
import { useTokenMetadata } from '../hooks/useContractData';
import {
  computePoolProgress,
  derivePoolStatus,
  formatRemainingTime,
  formatTokenAmount,
  shortenAddress,
  type MatchPool,
} from '../lib/poolMath';

interface PoolCardProps {
  pool: MatchPool;
  nowSeconds: bigint;
}

export const PoolCard: React.FC<PoolCardProps> = ({ pool, nowSeconds }) => {
  const { decimals, symbol } = useTokenMetadata(pool.token);
  const resolvedDecimals = decimals ?? 6;
  const resolvedSymbol = symbol ?? 'TOKEN';
  const status = derivePoolStatus(pool, nowSeconds);
  const progress = computePoolProgress(pool.initialMatch, pool.remainingMatch);
  const timeText = formatRemainingTime(pool.deadline, nowSeconds);

  return (
    <Link
      to={`/pools/${pool.id.toString()}`}
      className="group block rounded-2xl bg-[#FFFFFF] border border-[#E2D7C0] p-6 transition-colors hover:border-[#163828] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#163828]"
    >
      <div className="flex flex-col gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-medium text-[#163828]/75">
            <span>{resolvedSymbol}</span>
            <span aria-hidden="true">·</span>
            <span>{status}</span>
            <span aria-hidden="true">·</span>
            <span>{timeText}</span>
          </div>
          <h3 className="font-display text-xl font-bold text-[#163828] group-hover:underline underline-offset-4">
            {pool.name}
          </h3>
          <p className="text-sm text-[#163828]/80 line-clamp-2 leading-relaxed">
            {pool.description}
          </p>
        </div>

        <div className="space-y-2 pt-1">
          <div className="flex items-baseline justify-between text-xs font-semibold text-[#163828] tabular-nums">
            <span>
              {formatTokenAmount(pool.remainingMatch, resolvedDecimals)} {resolvedSymbol} remaining
            </span>
            <span className="text-[#163828]/70">
              of {formatTokenAmount(pool.initialMatch, resolvedDecimals)} {resolvedSymbol}
            </span>
          </div>
          <div
            className="h-2.5 w-full rounded-full bg-[#F1E9D8] overflow-hidden"
            role="progressbar"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Match pool used"
          >
            <div
              className="h-full bg-[#2D6A4F] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="pt-3 border-t border-[#E2D7C0] flex items-center justify-between text-xs text-[#163828]/80 tabular-nums">
          <span>
            Beneficiary{' '}
            <span className="font-mono font-medium text-[#163828]">
              {shortenAddress(pool.beneficiary)}
            </span>
          </span>
          <span className="font-semibold text-[#163828]">
            {formatTokenAmount(pool.totalDonated, resolvedDecimals)} {resolvedSymbol} donated
          </span>
        </div>
      </div>
    </Link>
  );
};
