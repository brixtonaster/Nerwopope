import { ConnectButton } from '@rainbow-me/rainbowkit';
import React from 'react';
import { NerwopopeLogo } from './NerwopopeLogo';

interface WalletGateProps {
  title: string;
  description: string;
}

export const WalletGate: React.FC<WalletGateProps> = ({ title, description }) => {
  return (
    <div className="rounded-2xl bg-[#163828] text-[#FAF6EE] p-8 sm:p-10 border border-[#2D6A4F] max-w-xl mx-auto text-center space-y-5">
      <div className="flex justify-center">
        <NerwopopeLogo className="w-12 h-12" />
      </div>
      <div className="space-y-2">
        <h2 className="font-display text-2xl font-bold text-[#FFFFFF]">
          {title}
        </h2>
        <p className="text-sm sm:text-base text-[#FAF6EE]/90 leading-relaxed max-w-md mx-auto">
          {description}
        </p>
      </div>
      <div className="pt-2 flex justify-center">
        <ConnectButton.Custom>
          {({ openConnectModal, mounted }) => (
            <button
              type="button"
              disabled={!mounted}
              onClick={openConnectModal}
              className="px-6 py-3 rounded-xl bg-[#F2B705] text-[#0F271C] text-sm font-bold hover:bg-[#DDA400] transition-colors cursor-pointer whitespace-nowrap"
            >
              Connect Wallet
            </button>
          )}
        </ConnectButton.Custom>
      </div>
    </div>
  );
};
