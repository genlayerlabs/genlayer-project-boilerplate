'use client'

import '@rainbow-me/rainbowkit/styles.css';
import { RainbowKitProvider, getDefaultWallets } from '@rainbow-me/rainbowkit';
import { createConfig, WagmiConfig } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import { http } from 'wagmi';
import { injected } from 'wagmi/connectors';

// Define studionet chain configuration
const studionet = {
  id: 61999, // Use a custom chain ID for studionet
  name: 'GenLayer StudioNet',
  network: 'studionet',
  nativeCurrency: {
    decimals: 18,
    name: 'GenLayer',
    symbol: 'GEN',
  },
  rpcUrls: {
    default: {
      http: ['https://studio.genlayer.com/api'],
    },
    public: {
      http: ['https://studio.genlayer.com/api'],
    },
  },
  blockExplorers: {
    default: { name: 'Explorer', url: '' },
  },
  testnet: true,
} as const;

const chains = [studionet] as const;

// Chỉ sử dụng MetaMask connector để tránh WalletConnect issues
const connectors = [injected()];

const wagmiConfig = createConfig({
  chains,
  connectors,
  transports: {
    [studionet.id]: http(),
  },
});

export function EVMProvider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiConfig config={wagmiConfig}>
      <RainbowKitProvider>
        {children}
      </RainbowKitProvider>
    </WagmiConfig>
  );
}

export { wagmiConfig, chains };
