import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateMatchPreview,
  canSponsorReclaim,
  computePoolProgress,
  derivePoolStatus,
  formatTokenAmount,
  parseTokenAmount,
  validateCreatePoolInput,
} from './poolMath';

test('parseTokenAmount handles 6-decimal USDC and 18-decimal tokens accurately', () => {
  assert.equal(parseTokenAmount('250', 6), 250_000_000n);
  assert.equal(parseTokenAmount('12.345678', 6), 12_345_678n);
  assert.equal(parseTokenAmount('12.1234567', 6), null);
  assert.equal(parseTokenAmount('0', 6), null);
  assert.equal(parseTokenAmount('-5', 6), null);
  assert.equal(parseTokenAmount('1.5', 18), 1_500_000_000_000_000_000n);
});

test('formatTokenAmount formats thousands separators and trims trailing zeros', () => {
  assert.equal(formatTokenAmount(1_250_500_000n, 6), '1,250.5');
  assert.equal(formatTokenAmount(1_000_000_000n, 6), '1,000');
  assert.equal(formatTokenAmount(250_000n, 6), '0.25');
});

test('calculateMatchPreview caps match at remaining pool balance when pool runs low', () => {
  const fullMatch = calculateMatchPreview(100_000_000n, 500_000_000n);
  assert.deepEqual(fullMatch, {
    matched: 100_000_000n,
    totalToBeneficiary: 200_000_000n,
    capped: false,
  });

  const partialMatch = calculateMatchPreview(100_000_000n, 40_000_000n);
  assert.deepEqual(partialMatch, {
    matched: 40_000_000n,
    totalToBeneficiary: 140_000_000n,
    capped: true,
  });

  const depleted = calculateMatchPreview(100_000_000n, 0n);
  assert.deepEqual(depleted, {
    matched: 0n,
    totalToBeneficiary: 100_000_000n,
    capped: true,
  });
});

test('derivePoolStatus distinguishes Active, Depleted, and Ended correctly', () => {
  assert.equal(derivePoolStatus({ remainingMatch: 50n, deadline: 1000n }, 999n), 'Active');
  assert.equal(derivePoolStatus({ remainingMatch: 50n, deadline: 1000n }, 1000n), 'Ended');
  assert.equal(derivePoolStatus({ remainingMatch: 0n, deadline: 1000n }, 500n), 'Depleted');
});

test('computePoolProgress returns used percentage safely', () => {
  assert.equal(computePoolProgress(1000n, 250n), 75);
  assert.equal(computePoolProgress(1000n, 1000n), 0);
  assert.equal(computePoolProgress(0n, 0n), 0);
});

test('canSponsorReclaim allows only sponsor after deadline when unmatched funds remain', () => {
  const sponsor = '0x1111111111111111111111111111111111111111';
  const other = '0x2222222222222222222222222222222222222222';
  const pool = {
    sponsor: sponsor as `0x${string}`,
    remainingMatch: 500n,
    deadline: 2000n,
    reclaimed: false,
  };

  assert.equal(canSponsorReclaim(pool, sponsor, 2000n), true);
  assert.equal(canSponsorReclaim(pool, sponsor.toUpperCase(), 2001n), true);
  assert.equal(canSponsorReclaim(pool, sponsor, 1999n), false);
  assert.equal(canSponsorReclaim(pool, other, 2001n), false);
  assert.equal(canSponsorReclaim({ ...pool, reclaimed: true }, sponsor, 2001n), false);
  assert.equal(canSponsorReclaim({ ...pool, remainingMatch: 0n }, sponsor, 2001n), false);
});

test('validateCreatePoolInput rejects empty fields, bad addresses, and past deadlines', () => {
  const now = 1_700_000_000_000;
  const bad = validateCreatePoolInput({
    name: '',
    description: '',
    beneficiary: 'not-an-address',
    matchAmount: '0',
    deadlineLocal: '2020-01-01T00:00',
    decimals: 6,
    nowMs: now,
  });

  assert.ok(bad.name);
  assert.ok(bad.description);
  assert.ok(bad.beneficiary);
  assert.ok(bad.matchAmount);
  assert.ok(bad.deadlineLocal);

  const good = validateCreatePoolInput({
    name: 'Clean Water Grant',
    description: 'Matching gifts for local well maintenance',
    beneficiary: '0x1111111111111111111111111111111111111111',
    matchAmount: '500',
    deadlineLocal: new Date(now + 3600_000).toISOString(),
    decimals: 6,
    walletBalance: 1_000_000_000n,
    nowMs: now,
  });

  assert.deepEqual(good, {});
});
