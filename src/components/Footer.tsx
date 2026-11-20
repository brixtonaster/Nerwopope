import React from 'react';
import { Link } from 'react-router-dom';
import { NerwopopeLogo } from './NerwopopeLogo';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#163828] text-[#FAF6EE] border-t border-[#1F4D38] mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        <div className="space-y-2.5">
          <div className="flex items-center gap-2.5">
            <NerwopopeLogo className="w-7 h-7" />
            <span className="font-display text-lg font-bold text-[#FAF6EE]">
              Nerwopope
            </span>
          </div>
          <p className="text-sm font-semibold text-[#FAF6EE]">
            Built by Brixton
          </p>
          <p className="text-sm text-[#FAF6EE]/85 max-w-md">
            Nerwopope is a small independent project available on Arc.
          </p>
        </div>

        <nav
          aria-label="Footer navigation"
          className="flex flex-wrap items-center gap-6 text-sm font-medium text-[#FAF6EE]/90"
        >
          <Link to="/" className="hover:text-[#F2B705] transition-colors">
            Home
          </Link>
          <Link to="/pools" className="hover:text-[#F2B705] transition-colors">
            Browse Pools
          </Link>
          <Link to="/create" className="hover:text-[#F2B705] transition-colors">
            Start a Match Pool
          </Link>
          <Link to="/activity" className="hover:text-[#F2B705] transition-colors">
            My Activity
          </Link>
        </nav>
      </div>
    </footer>
  );
};
