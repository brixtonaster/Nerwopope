import { defineChain } from 'viem';

export const ARC_CHAIN_ID = 5042002;
export const ARC_RPC_URL = 'https://rpc.testnet.arc.network';
export const ARC_EXPLORER_URL = 'https://testnet.arcscan.app';

export const arcChain = defineChain({
  id: ARC_CHAIN_ID,
  name: 'Arc',
  nativeCurrency: {
    name: 'USDC',
    symbol: 'USDC',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [ARC_RPC_URL],
    },
  },
  blockExplorers: {
    default: {
      name: 'ArcScan',
      url: ARC_EXPLORER_URL,
    },
  },
});

export interface SupportedToken {
  symbol: 'USDC' | 'EURC';
  name: string;
  address: `0x${string}`;
}

export const SUPPORTED_TOKENS: readonly SupportedToken[] = [
  {
    symbol: 'USDC',
    name: 'USD Coin',
    address: '0x3600000000000000000000000000000000000000',
  },
  {
    symbol: 'EURC',
    name: 'Euro Coin',
    address: '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a',
  },
] as const;

export function getTokenMetaByAddress(address?: string): SupportedToken | undefined {
  if (!address) return undefined;
  const normalized = address.toLowerCase();
  return SUPPORTED_TOKENS.find((t) => t.address.toLowerCase() === normalized);
}

export function getExplorerTxUrl(hash: string): string {
  return `${ARC_EXPLORER_URL}/tx/${hash}`;
}

export function getExplorerAddressUrl(address: string): string {
  return `${ARC_EXPLORER_URL}/address/${address}`;
}
