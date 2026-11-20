import { connectorsForWallets, lightTheme } from '@rainbow-me/rainbowkit';
import {
  injectedWallet,
  walletConnectWallet,
} from '@rainbow-me/rainbowkit/wallets';
import { createConfig, http } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { ARC_RPC_URL, arcChain } from './chain';
import { WALLETCONNECT_PROJECT_ID } from './contracts';

const connectors = WALLETCONNECT_PROJECT_ID
  ? connectorsForWallets(
      [
        {
          groupName: 'Recommended',
          wallets: [injectedWallet, walletConnectWallet],
        },
      ],
      {
        appName: 'Nerwopope',
        projectId: WALLETCONNECT_PROJECT_ID,
      }
    )
  : [injected()];

export const wagmiConfig = createConfig({
  chains: [arcChain],
  connectors,
  transports: {
    [arcChain.id]: http(ARC_RPC_URL),
  },
  ssr: false,
});

export const nerwopopeRainbowTheme = lightTheme({
  accentColor: '#163828',
  accentColorForeground: '#FAF6EE',
  borderRadius: 'medium',
  fontStack: 'system',
  overlayBlur: 'small',
});
