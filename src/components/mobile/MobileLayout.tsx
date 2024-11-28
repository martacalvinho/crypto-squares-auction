import React from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export const MobileLayout = () => {
  return (
    <div className="min-h-screen">
      {/* Mobile Header */}
      <header className="border-b border-crypto-primary/10 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-xl font-bold bg-gradient-to-r from-crypto-primary to-crypto-light bg-clip-text text-transparent">
            Crypto 500
          </h1>
          <WalletMultiButton />
        </div>
      </header>
      
      {/* Mobile Content */}
      <main className="p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Mobile Version</h2>
          <p className="text-gray-400 mb-8">Coming soon to mobile devices!</p>
        </div>
      </main>
    </div>
  );
};
