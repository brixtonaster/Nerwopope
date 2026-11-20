import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Menu, X } from 'lucide-react';
import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { NerwopopeLogo } from './NerwopopeLogo';

const NAV_ITEMS = [
  { to: '/', label: 'Home', end: true },
  { to: '/pools', label: 'Browse Pools', end: false },
  { to: '/create', label: 'Start a Match Pool', end: false },
  { to: '/activity', label: 'My Activity', end: false },
];

export const Navbar: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-[#FAF6EE]/95 backdrop-blur-sm border-b border-[#E2D7C0]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand mark */}
        <Link
          to="/"
          className="flex items-center gap-2.5 text-[#163828] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#163828] rounded-md"
        >
          <NerwopopeLogo className="w-8 h-8 shrink-0" />
          <span className="font-display text-xl font-bold tracking-tight">
            Nerwopope
          </span>
        </Link>

        {/* Zone 2: Navigation links */}
        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-7"
        >
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `text-sm font-semibold whitespace-nowrap shrink-0 pb-0.5 transition-colors ${
                  isActive
                    ? 'text-[#163828] border-b-2 border-[#163828]'
                    : 'text-[#163828]/75 hover:text-[#163828]'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Zone 3: Single primary wallet action + mobile toggle */}
        <div className="flex items-center gap-3 shrink-0">
          <ConnectButton.Custom>
            {({
              account,
              chain,
              openAccountModal,
              openChainModal,
              openConnectModal,
              mounted,
            }) => {
              const ready = mounted;
              const connected = ready && account && chain;

              if (!ready) {
                return (
                  <div
                    aria-hidden="true"
                    className="h-10 w-36 rounded-xl bg-[#F1E9D8]"
                  />
                );
              }

              if (!connected) {
                return (
                  <button
                    type="button"
                    onClick={openConnectModal}
                    className="px-4 py-2.5 rounded-xl bg-[#163828] text-[#FAF6EE] text-sm font-semibold hover:bg-[#0F271C] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#163828]"
                  >
                    Connect Wallet
                  </button>
                );
              }

              if (chain.unsupported) {
                return (
                  <button
                    type="button"
                    onClick={openChainModal}
                    className="px-4 py-2.5 rounded-xl bg-[#F2B705] text-[#0F271C] text-sm font-semibold hover:bg-[#DDA400] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Switch to Arc
                  </button>
                );
              }

              return (
                <button
                  type="button"
                  onClick={openAccountModal}
                  className="px-4 py-2.5 rounded-xl bg-[#163828] text-[#FAF6EE] text-sm font-semibold hover:bg-[#0F271C] transition-colors whitespace-nowrap shrink-0 font-mono tabular-nums cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#163828]"
                >
                  {account.displayName}
                </button>
              );
            }}
          </ConnectButton.Custom>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="md:hidden p-2 rounded-lg text-[#163828] hover:bg-[#F1E9D8] transition-colors cursor-pointer"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile navigation drawer */}
      {mobileOpen && (
        <nav
          aria-label="Mobile navigation"
          className="md:hidden border-t border-[#E2D7C0] bg-[#FAF6EE] px-4 py-3 flex flex-col gap-1"
        >
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-[#163828] text-[#FAF6EE]'
                    : 'text-[#163828] hover:bg-[#F1E9D8]'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  );
};
