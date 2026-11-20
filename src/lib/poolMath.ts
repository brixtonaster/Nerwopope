import { formatUnits, isAddress, parseUnits } from 'viem';

export type PoolStatus = 'Active' | 'Depleted' | 'Ended';

export interface MatchPool {
  id: bigint;
  name: string;
  description: string;
  sponsor: `0x${string}`;
  beneficiary: `0x${string}`;
  token: `0x${string}`;
  initialMatch: bigint;
  remainingMatch: bigint;
  totalDonated: bigint;
  totalMatched: bigint;
  deadline: bigint;
  createdAt: bigint;
  reclaimed: boolean;
}

export interface PoolDonation {
  poolId: bigint;
  donor: `0x${string}`;
  amount: bigint;
  matched: bigint;
  timestamp: bigint;
}

export interface PlatformStats {
  totalPools: bigint;
  totalDonated: bigint;
  totalMatched: bigint;
  activePools: bigint;
}

export function parseTokenAmount(input: string, decimals: number): bigint | null {
  const cleaned = input.trim();
  if (!cleaned) return null;
  if (!/^\d+(\.\d+)?$/.test(cleaned)) return null;
  const [, frac = ''] = cleaned.split('.');
  if (frac.length > decimals) return null;
  try {
    const parsed = parseUnits(cleaned, decimals);
    return parsed > 0n ? parsed : null;
  } catch {
    return null;
  }
}

export function formatTokenAmount(
  amount: bigint,
  decimals: number,
  maxFractionDigits = 2
): string {
  const raw = formatUnits(amount, decimals);
  const [intPart, fracPart = ''] = raw.split('.');
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  if (!fracPart || maxFractionDigits <= 0) return formattedInt;
  const trimmedFrac = fracPart.slice(0, maxFractionDigits).replace(/0+$/, '');
  return trimmedFrac ? `${formattedInt}.${trimmedFrac}` : formattedInt;
}

export function calculateMatchPreview(
  donation: bigint,
  remainingMatch: bigint
): {
  matched: bigint;
  totalToBeneficiary: bigint;
  capped: boolean;
} {
  if (donation <= 0n) {
    return { matched: 0n, totalToBeneficiary: 0n, capped: false };
  }
  if (remainingMatch <= 0n) {
    return { matched: 0n, totalToBeneficiary: donation, capped: true };
  }
  const matched = donation <= remainingMatch ? donation : remainingMatch;
  return {
    matched,
    totalToBeneficiary: donation + matched,
    capped: donation > remainingMatch,
  };
}

export function derivePoolStatus(
  pool: Pick<MatchPool, 'remainingMatch' | 'deadline'>,
  nowSeconds: bigint
): PoolStatus {
  if (pool.remainingMatch <= 0n) {
    return 'Depleted';
  }
  if (nowSeconds >= pool.deadline) {
    return 'Ended';
  }
  return 'Active';
}

export function computePoolProgress(
  initialMatch: bigint,
  remainingMatch: bigint
): number {
  if (initialMatch <= 0n) return 0;
  const used = initialMatch > remainingMatch ? initialMatch - remainingMatch : 0n;
  const basisPoints = Number((used * 10000n) / initialMatch);
  return Math.min(100, Math.max(0, basisPoints / 100));
}

export function canSponsorReclaim(
  pool: Pick<MatchPool, 'sponsor' | 'remainingMatch' | 'deadline' | 'reclaimed'>,
  connectedAddress: string | undefined,
  nowSeconds: bigint
): boolean {
  if (!connectedAddress) return false;
  if (pool.sponsor.toLowerCase() !== connectedAddress.toLowerCase()) return false;
  if (pool.reclaimed) return false;
  if (pool.remainingMatch <= 0n) return false;
  return nowSeconds >= pool.deadline;
}

export interface CreatePoolFormInput {
  name: string;
  description: string;
  beneficiary: string;
  matchAmount: string;
  deadlineLocal: string;
  decimals: number;
  walletBalance?: bigint;
  nowMs?: number;
}

export interface CreatePoolValidationErrors {
  name?: string;
  description?: string;
  beneficiary?: string;
  matchAmount?: string;
  deadlineLocal?: string;
}

export function validateCreatePoolInput(
  input: CreatePoolFormInput
): CreatePoolValidationErrors {
  const errors: CreatePoolValidationErrors = {};
  const nowMs = input.nowMs ?? Date.now();

  if (!input.name.trim()) {
    errors.name = 'Enter a pool name.';
  } else if (input.name.trim().length > 80) {
    errors.name = 'Pool name must be 80 characters or fewer.';
  }

  if (!input.description.trim()) {
    errors.description = 'Enter a short description of what this pool supports.';
  }

  if (!input.beneficiary.trim()) {
    errors.beneficiary = 'Enter the beneficiary wallet address.';
  } else if (!isAddress(input.beneficiary.trim())) {
    errors.beneficiary = 'Enter a valid EVM address starting with 0x.';
  }

  const parsedAmount = parseTokenAmount(input.matchAmount, input.decimals);
  if (!input.matchAmount.trim()) {
    errors.matchAmount = 'Enter the match amount to lock.';
  } else if (!parsedAmount) {
    errors.matchAmount = 'Enter a positive token amount.';
  } else if (input.walletBalance !== undefined && parsedAmount > input.walletBalance) {
    errors.matchAmount = 'Amount exceeds your wallet balance.';
  }

  if (!input.deadlineLocal.trim()) {
    errors.deadlineLocal = 'Select a deadline date and time.';
  } else {
    const deadlineMs = Date.parse(input.deadlineLocal);
    if (Number.isNaN(deadlineMs)) {
      errors.deadlineLocal = 'Enter a valid date and time.';
    } else if (deadlineMs <= nowMs + 60_000) {
      errors.deadlineLocal = 'Deadline must be at least 1 minute in the future.';
    }
  }

  return errors;
}

export function shortenAddress(address: string): string {
  if (address.length < 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatDeadlineDate(timestampSeconds: bigint): string {
  const ms = Number(timestampSeconds) * 1000;
  if (!Number.isFinite(ms) || ms <= 0) return 'Unknown';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(ms));
}

export function formatRemainingTime(deadlineSeconds: bigint, nowSeconds: bigint): string {
  const diff = Number(deadlineSeconds - nowSeconds);
  if (diff <= 0) return 'Deadline passed';
  const days = Math.floor(diff / 86400);
  const hours = Math.floor((diff % 86400) / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${Math.max(1, minutes)}m left`;
}
