import { Search } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PoolCard } from '../components/PoolCard';
import { SUPPORTED_TOKENS } from '../config/chain';
import { useAllPools } from '../hooks/useContractData';
import { derivePoolStatus, type PoolStatus } from '../lib/poolMath';

type StatusFilter = 'All' | PoolStatus;
type TokenFilter = 'ALL' | 'USDC' | 'EURC';

export const BrowsePoolsPage: React.FC = () => {
  const { data, isLoading, isError, refetch } = useAllPools();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [tokenFilter, setTokenFilter] = useState<TokenFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const nowSeconds = BigInt(Math.floor(Date.now() / 1000));
  const pools = data?.pools ?? [];
  const configured = data?.configured ?? false;

  const filteredPools = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return pools.filter((pool) => {
      const status = derivePoolStatus(pool, nowSeconds);
      if (statusFilter !== 'All' && status !== statusFilter) return false;

      if (tokenFilter !== 'ALL') {
        const tokenMeta = SUPPORTED_TOKENS.find((t) => t.symbol === tokenFilter);
        if (
          tokenMeta &&
          pool.token.toLowerCase() !== tokenMeta.address.toLowerCase()
        ) {
          return false;
        }
      }

      if (query) {
        const matchName = pool.name.toLowerCase().includes(query);
        const matchDesc = pool.description.toLowerCase().includes(query);
        const matchSponsor = pool.sponsor.toLowerCase().includes(query);
        const matchBeneficiary = pool.beneficiary.toLowerCase().includes(query);
        if (!matchName && !matchDesc && !matchSponsor && !matchBeneficiary) {
          return false;
        }
      }

      return true;
    });
  }, [pools, statusFilter, tokenFilter, searchQuery, nowSeconds]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2.5 max-w-2xl">
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#163828] tracking-tight text-balance">
            Browse match pools
          </h1>
          <p className="text-base text-[#163828]/85 leading-relaxed">
            Live matching reserves read directly from the Nerwopope contract on Arc.
          </p>
        </div>
        <Link
          to="/create"
          className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-[#163828] text-[#FAF6EE] text-sm font-bold hover:bg-[#0F271C] transition-colors whitespace-nowrap shrink-0"
        >
          Start a Match Pool
        </Link>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between bg-[#FFFFFF] border border-[#E2D7C0] rounded-2xl p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div
            role="group"
            aria-label="Filter pools by status"
            className="flex items-center gap-1 bg-[#FAF6EE] p-1 rounded-xl border border-[#E2D7C0]"
          >
            {(['All', 'Active', 'Depleted', 'Ended'] as StatusFilter[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                  statusFilter === tab
                    ? 'bg-[#163828] text-[#FAF6EE]'
                    : 'text-[#163828]/75 hover:text-[#163828]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div
            role="group"
            aria-label="Filter pools by token"
            className="flex items-center gap-1 bg-[#FAF6EE] p-1 rounded-xl border border-[#E2D7C0]"
          >
            {(['ALL', 'USDC', 'EURC'] as TokenFilter[]).map((tok) => (
              <button
                key={tok}
                type="button"
                onClick={() => setTokenFilter(tok)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                  tokenFilter === tok
                    ? 'bg-[#163828] text-[#FAF6EE]'
                    : 'text-[#163828]/75 hover:text-[#163828]'
                }`}
              >
                {tok === 'ALL' ? 'All Tokens' : tok}
              </button>
            ))}
          </div>
        </div>

        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 text-[#163828]/50 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name or address"
            aria-label="Search pools by name or address"
            className="w-full rounded-xl border border-[#E2D7C0] bg-[#FAF6EE] pl-10 pr-4 py-2 text-sm text-[#163828] placeholder:text-[#163828]/45 focus:outline-none focus:border-[#163828]"
          />
        </div>
      </div>

      {/* States */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((n) => (
            <div
              key={n}
              className="rounded-2xl bg-[#FFFFFF] border border-[#E2D7C0] p-6 h-52 animate-pulse"
            />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-2xl bg-[#FFFFFF] border border-[#E2D7C0] p-10 text-center space-y-4">
          <h2 className="font-display text-2xl font-bold text-[#163828]">
            Unable to read contract pools
          </h2>
          <p className="text-sm text-[#163828]/80 max-w-md mx-auto">
            The Arc RPC did not return pool data. Check your network connection and try
            again.
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="px-5 py-2.5 rounded-xl bg-[#163828] text-[#FAF6EE] text-sm font-semibold cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : !configured ? (
        <div className="rounded-2xl bg-[#FFFFFF] border border-[#E2D7C0] p-10 text-center space-y-4">
          <h2 className="font-display text-2xl font-bold text-[#163828]">
            Contract address not configured yet
          </h2>
          <p className="text-sm text-[#163828]/80 max-w-lg mx-auto leading-relaxed">
            No sample pools are displayed here because every figure on Nerwopope comes
            from a real contract read. Set{' '}
            <span className="font-mono font-semibold">VITE_CONTRACT_ADDRESS</span> to
            load live pools on Arc.
          </p>
        </div>
      ) : filteredPools.length === 0 ? (
        <div className="rounded-2xl bg-[#FFFFFF] border border-[#E2D7C0] p-10 text-center space-y-4">
          <h2 className="font-display text-2xl font-bold text-[#163828]">
            {pools.length === 0 ? 'No match pools created yet' : 'No pools match your filter'}
          </h2>
          <p className="text-sm text-[#163828]/80 max-w-md mx-auto leading-relaxed">
            {pools.length === 0
              ? 'Be the first sponsor to lock a matching reserve for a beneficiary on Arc.'
              : 'Adjust your status, token, or search filters to view other pools.'}
          </p>
          {pools.length === 0 && (
            <Link
              to="/create"
              className="inline-flex px-5 py-2.5 rounded-xl bg-[#163828] text-[#FAF6EE] text-sm font-semibold"
            >
              Start a Match Pool
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredPools.map((pool) => (
            <PoolCard key={pool.id.toString()} pool={pool} nowSeconds={nowSeconds} />
          ))}
        </div>
      )}
    </div>
  );
};
