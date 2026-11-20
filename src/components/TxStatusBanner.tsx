import { CheckCircle2, ExternalLink, Loader2, AlertCircle } from 'lucide-react';
import React from 'react';
import { getExplorerTxUrl } from '../config/chain';
import type { TxPhase } from '../hooks/useContractData';

interface TxStatusBannerProps {
  phase: TxPhase;
  actionLabel: string;
  hash?: `0x${string}`;
  errorMessage?: string | null;
  onReset?: () => void;
}

export const TxStatusBanner: React.FC<TxStatusBannerProps> = ({
  phase,
  actionLabel,
  hash,
  errorMessage,
  onReset,
}) => {
  if (phase === 'idle') return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`rounded-xl p-4 border text-sm flex flex-col gap-2 ${
        phase === 'confirmed'
          ? 'bg-[#163828] text-[#FAF6EE] border-[#2D6A4F]'
          : phase === 'error'
            ? 'bg-[#FFFFFF] text-[#7F1D1D] border-[#DC2626]'
            : 'bg-[#F1E9D8] text-[#163828] border-[#E2D7C0]'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 font-semibold">
          {phase === 'pending' && (
            <>
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              <span>Confirm {actionLabel} in your wallet</span>
            </>
          )}
          {phase === 'confirming' && (
            <>
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              <span>Confirming {actionLabel} on Arc</span>
            </>
          )}
          {phase === 'confirmed' && (
            <>
              <CheckCircle2 className="w-4 h-4 text-[#F2B705] shrink-0" />
              <span>{actionLabel} confirmed on Arc</span>
            </>
          )}
          {phase === 'error' && (
            <>
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{actionLabel} did not complete</span>
            </>
          )}
        </div>

        {(phase === 'confirmed' || phase === 'error') && onReset && (
          <button
            type="button"
            onClick={onReset}
            className="text-xs font-semibold underline underline-offset-2 cursor-pointer shrink-0"
          >
            Dismiss
          </button>
        )}
      </div>

      {phase === 'error' && errorMessage && (
        <p className="text-xs leading-relaxed break-words">{errorMessage}</p>
      )}

      {hash && (
        <a
          href={getExplorerTxUrl(hash)}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-1.5 text-xs font-semibold underline underline-offset-2 w-fit ${
            phase === 'confirmed' ? 'text-[#F2B705]' : 'text-[#163828]'
          }`}
        >
          <span>View on ArcScan</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      )}
    </div>
  );
};
