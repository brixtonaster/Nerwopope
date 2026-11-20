import { isAddress } from 'viem';

const env = (import.meta as { env?: Record<string, string | undefined> }).env ?? {};
const rawContractAddress = env.VITE_CONTRACT_ADDRESS?.trim() ?? '';
const rawWalletConnectId = env.VITE_WALLETCONNECT_PROJECT_ID?.trim() ?? '';
const rawAdminWallet = env.VITE_ADMIN_WALLET?.trim() ?? '';

export function isValidConfiguredAddress(value: string): value is `0x${string}` {
  return (
    Boolean(value) &&
    !value.startsWith('[') &&
    isAddress(value) &&
    value.toLowerCase() !== '0x0000000000000000000000000000000000000000'
  );
}

export const CONTRACT_ADDRESS: `0x${string}` | null = isValidConfiguredAddress(rawContractAddress)
  ? rawContractAddress
  : null;

export const ADMIN_WALLET: `0x${string}` | null = isValidConfiguredAddress(rawAdminWallet)
  ? rawAdminWallet
  : null;

export const WALLETCONNECT_PROJECT_ID: string | null =
  rawWalletConnectId && !rawWalletConnectId.startsWith('[') ? rawWalletConnectId : null;

export const ERC20_ABI = [
  {
    type: 'function',
    name: 'decimals',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
  },
  {
    type: 'function',
    name: 'symbol',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
  },
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'allowance',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'approve',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;

export const NERWOPOPE_FALLBACK_ABI = [
  {
    type: 'function',
    name: 'createPool',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'name', type: 'string' },
      { name: 'description', type: 'string' },
      { name: 'beneficiary', type: 'address' },
      { name: 'token', type: 'address' },
      { name: 'matchAmount', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
    ],
    outputs: [{ name: 'poolId', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'donate',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'poolId', type: 'uint256' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: 'matched', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'reclaim',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'poolId', type: 'uint256' }],
    outputs: [{ name: 'reclaimedAmount', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'getPool',
    stateMutability: 'view',
    inputs: [{ name: 'poolId', type: 'uint256' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'id', type: 'uint256' },
          { name: 'name', type: 'string' },
          { name: 'description', type: 'string' },
          { name: 'sponsor', type: 'address' },
          { name: 'beneficiary', type: 'address' },
          { name: 'token', type: 'address' },
          { name: 'initialMatch', type: 'uint256' },
          { name: 'remainingMatch', type: 'uint256' },
          { name: 'totalDonated', type: 'uint256' },
          { name: 'totalMatched', type: 'uint256' },
          { name: 'deadline', type: 'uint256' },
          { name: 'createdAt', type: 'uint256' },
          { name: 'reclaimed', type: 'bool' },
        ],
      },
    ],
  },
  {
    type: 'function',
    name: 'getDonations',
    stateMutability: 'view',
    inputs: [{ name: 'poolId', type: 'uint256' }],
    outputs: [
      {
        name: '',
        type: 'tuple[]',
        components: [
          { name: 'poolId', type: 'uint256' },
          { name: 'donor', type: 'address' },
          { name: 'amount', type: 'uint256' },
          { name: 'matched', type: 'uint256' },
          { name: 'timestamp', type: 'uint256' },
        ],
      },
    ],
  },
  {
    type: 'function',
    name: 'getPoolsBySponsor',
    stateMutability: 'view',
    inputs: [{ name: 'sponsor', type: 'address' }],
    outputs: [{ name: '', type: 'uint256[]' }],
  },
  {
    type: 'function',
    name: 'getDonationsByDonor',
    stateMutability: 'view',
    inputs: [{ name: 'donor', type: 'address' }],
    outputs: [
      {
        name: '',
        type: 'tuple[]',
        components: [
          { name: 'poolId', type: 'uint256' },
          { name: 'donor', type: 'address' },
          { name: 'amount', type: 'uint256' },
          { name: 'matched', type: 'uint256' },
          { name: 'timestamp', type: 'uint256' },
        ],
      },
    ],
  },
  {
    type: 'function',
    name: 'getPlatformStats',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      { name: 'totalPools', type: 'uint256' },
      { name: 'totalDonated', type: 'uint256' },
      { name: 'totalMatched', type: 'uint256' },
      { name: 'activePools', type: 'uint256' },
    ],
  },
  {
    type: 'function',
    name: 'poolCount',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;
