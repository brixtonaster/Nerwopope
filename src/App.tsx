import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { WagmiProvider } from 'wagmi';
import { Footer } from './components/Footer';
import { Navbar } from './components/Navbar';
import { arcChain } from './config/chain';
import { nerwopopeRainbowTheme, wagmiConfig } from './config/wagmi';
import { BrowsePoolsPage } from './pages/BrowsePoolsPage';
import { HomePage } from './pages/HomePage';
import { MyActivityPage } from './pages/MyActivityPage';
import { PoolDetailPage } from './pages/PoolDetailPage';
import { StartPoolPage } from './pages/StartPoolPage';

const queryClient = new QueryClient();

export default function App() {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          initialChain={arcChain}
          theme={nerwopopeRainbowTheme}
          modalSize="compact"
        >
          <BrowserRouter>
            <div className="min-h-screen flex flex-col bg-[#FAF6EE] text-[#163828]">
              <Navbar />
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/pools" element={<BrowsePoolsPage />} />
                  <Route path="/pools/:id" element={<PoolDetailPage />} />
                  <Route path="/create" element={<StartPoolPage />} />
                  <Route path="/activity" element={<MyActivityPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
              <Footer />
            </div>
          </BrowserRouter>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
