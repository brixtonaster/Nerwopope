import test from 'node:test';
import assert from 'node:assert/strict';
import type { Abi } from 'viem';
import {
  normalizeDonationRecord,
  normalizePlatformStats,
  normalizePoolRecord,
  resolveContractInterface,
} from './abiAdapter';

test('resolveContractInterface adapts to alternative deployed ABI function names', () => {
  const customAbi = [
    { type: 'function', name: 'startPool', stateMutability: 'nonpayable', inputs: [], outputs: [] },
    { type: 'function', name: 'donateToPool', stateMutability: 'nonpayable', inputs: [], outputs: [] },
    { type: 'function', name: 'reclaimUnused', stateMutability: 'nonpayable', inputs: [], outputs: [] },
    { type: 'function', name: 'getMatchPool', stateMutability: 'view', inputs: [], outputs: [] },
    { type: 'function', name: 'getPoolDonations', stateMutability: 'view', inputs: [], outputs: [] },
    { type: 'function', name: 'getSponsorPools', stateMutability: 'view', inputs: [], outputs: [] },
    { type: 'function', name: 'getDonorDonations', stateMutability: 'view', inputs: [], outputs: [] },
    { type: 'function', name: 'platformStats', stateMutability: 'view', inputs: [], outputs: [] },
  ] as unknown as Abi;

  const resolved = resolveContractInterface(customAbi);
  assert.equal(resolved.createPool, 'startPool');
  assert.equal(resolved.donate, 'donateToPool');
  assert.equal(resolved.reclaim, 'reclaimUnused');
  assert.equal(resolved.getPool, 'getMatchPool');
  assert.equal(resolved.getDonations, 'getPoolDonations');
  assert.equal(resolved.getPoolsBySponsor, 'getSponsorPools');
  assert.equal(resolved.getDonationsByDonor, 'getDonorDonations');
  assert.equal(resolved.getPlatformStats, 'platformStats');
});

test('normalizePoolRecord parses both tuple arrays and named structs', () => {
  const fromTuple = normalizePoolRecord(
    [
      3n,
      'Community Library',
      '1:1 match for open books',
      '0x1111111111111111111111111111111111111111',
      '0x2222222222222222222222222222222222222222',
      '0x3600000000000000000000000000000000000000',
      1000_000000n,
      400_000000n,
      600_000000n,
      600_000000n,
      1900000000n,
      1800000000n,
      false,
    ],
    3n
  );

  assert.equal(fromTuple?.id, 3n);
  assert.equal(fromTuple?.name, 'Community Library');
  assert.equal(fromTuple?.remainingMatch, 400_000000n);
  assert.equal(fromTuple?.reclaimed, false);

  const fromObj = normalizePoolRecord(
    {
      poolId: 4n,
      name: 'Garden Fund',
      description: 'Seeds and tools',
      sponsor: '0x1111111111111111111111111111111111111111',
      beneficiary: '0x2222222222222222222222222222222222222222',
      token: '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a',
      matchAmount: 500_000000n,
      remaining: 500_000000n,
      donated: 0n,
      matched: 0n,
      deadline: 1950000000n,
    },
    4n
  );

  assert.equal(fromObj?.id, 4n);
  assert.equal(fromObj?.initialMatch, 500_000000n);
  assert.equal(fromObj?.remainingMatch, 500_000000n);
});

test('normalizeDonationRecord and normalizePlatformStats parse contract outputs', () => {
  const donation = normalizeDonationRecord([
    2n,
    '0x3333333333333333333333333333333333333333',
    50_000000n,
    50_000000n,
    1800000500n,
  ]);
  assert.equal(donation?.poolId, 2n);
  assert.equal(donation?.amount, 50_000000n);
  assert.equal(donation?.matched, 50_000000n);

  const stats = normalizePlatformStats([5n, 1200n, 1000n, 2n]);
  assert.deepEqual(stats, {
    totalPools: 5n,
    totalDonated: 1200n,
    totalMatched: 1000n,
    activePools: 2n,
  });
});
