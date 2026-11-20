import { injected, mock } from '@wagmi/core';
import { safe } from '@wagmi-safe-raw';
import { walletConnect } from '@wagmi-walletconnect-raw';

export { injected, mock, safe, walletConnect };

export const version = '5.0.0';

export function metaMask() {
  return injected({ target: 'metaMask' });
}

export function coinbaseWallet() {
  return injected({ target: 'coinbaseWallet' });
}
