import { motion } from 'framer-motion';
import { ArrowRight, ChevronDown } from 'lucide-react';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { JoiningHalvesIllustration } from '../components/NerwopopeLogo';
import { useAllPools } from '../hooks/useContractData';

const ROADMAP_PHASES = [
  {
    phase: 'Phase 1',
    title: 'Core pools live',
    detail:
      'One for one matching pools in USDC and EURC with direct beneficiary transfers and sponsor reclaim after the deadline.',
  },
  {
    phase: 'Phase 2',
    title: 'Match ratios beyond one for one',
    detail:
      'Custom match multipliers such as two for one or half match pools configured by the sponsor at creation.',
  },
  {
    phase: 'Phase 3',
    title: 'Multiple sponsors per pool',
    detail:
      'Shared matching reserves where several sponsors can contribute into the same pool for a single beneficiary.',
  },
  {
    phase: 'Phase 4',
    title: 'Matching for recurring donations',
    detail:
      'Scheduled donor pledges that draw from active matching pools over multiple periods automatically.',
  },
];

const FAQ_ITEMS = [
  {
    question: 'Who receives the money',
    answer:
      'Every donation and its matching amount are sent straight to the beneficiary address set when the pool was created. Nerwopope never holds donor funds in custody.',
  },
  {
    question: 'What if the pool runs out mid donation',
    answer:
      'Your full donation still goes to the beneficiary, and the matching transfer from the pool is capped at whatever balance remains inside the pool at that moment.',
  },
  {
    question: 'Can the sponsor take the match back',
    answer:
      'Only after the pool deadline passes. While the pool is open before the deadline, locked funds stay reserved for matching gifts. Afterward, the sponsor can reclaim any unmatched remainder.',
  },
  {
    question: 'Is there a minimum donation',
    answer:
      'Any positive token amount greater than zero is accepted by the contract, down to the smallest unit of the pool token.',
  },
];

export const HomePage: React.FC = () => {
  const { data: poolsData, isLoading } = useAllPools();
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const stats = poolsData?.stats;
  const configured = poolsData?.configured ?? false;

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="bg-[#163828] text-[#FAF6EE] border-b border-[#1F4D38]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-20 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="lg:col-span-7 space-y-6"
          >
            <p className="text-sm font-semibold text-[#F2B705]">
              Built on Arc
            </p>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-[54px] font-bold leading-[1.06] tracking-tight text-[#FFFFFF] text-balance">
              Double every gift that lands
            </h1>
            <p className="text-base sm:text-lg text-[#FAF6EE]/90 leading-relaxed max-w-xl">
              A sponsor locks a matching pool in USDC or EURC for a named beneficiary.
              Each donation goes straight to the beneficiary and the pool adds an equal
              amount until the reserve runs out or the deadline passes.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                to="/pools"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#F2B705] text-[#0F271C] text-sm font-bold hover:bg-[#DDA400] transition-colors whitespace-nowrap"
              >
                <span>Browse Pools</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/create"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl border border-[#FAF6EE]/40 text-[#FAF6EE] text-sm font-semibold hover:bg-[#1F4D38] transition-colors whitespace-nowrap"
              >
                <span>Start a Match Pool</span>
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.08 }}
            className="lg:col-span-5"
          >
            <JoiningHalvesIllustration />
          </motion.div>
        </div>
      </section>

      {/* Live Contract Stats Strip */}
      <section className="bg-[#F1E9D8] border-b border-[#E2D7C0]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <p className="text-xs font-semibold text-[#163828]/75">
                Pools on record
              </p>
              <p className="font-display text-2xl sm:text-3xl font-bold text-[#163828] tabular-nums mt-1">
                {isLoading ? 'Loading' : configured ? stats?.totalPools.toString() ?? '0' : '0'}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-[#163828]/75">
                Active pools
              </p>
              <p className="font-display text-2xl sm:text-3xl font-bold text-[#163828] tabular-nums mt-1">
                {isLoading ? 'Loading' : configured ? stats?.activePools.toString() ?? '0' : '0'}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-[#163828]/75">
                Supported assets
              </p>
              <p className="font-display text-2xl sm:text-3xl font-bold text-[#163828] mt-1">
                USDC · EURC
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-[#163828]/75">
                Contract status
              </p>
              <p className="font-display text-2xl sm:text-3xl font-bold text-[#163828] mt-1">
                {configured ? 'Live on Arc' : 'Awaiting address'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="bg-[#FAF6EE] py-16 sm:py-20 border-b border-[#E2D7C0]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-10">
          <div className="max-w-2xl space-y-3">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#163828] tracking-tight text-balance">
              How one for one matching works
            </h2>
            <p className="text-base text-[#163828]/85 leading-relaxed">
              Matching happens directly inside the contract at the moment a donation settles.
              No off chain tallies, no waiting weeks for payouts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl bg-[#FFFFFF] border border-[#E2D7C0] p-6 space-y-2.5">
              <p className="font-mono text-xs font-semibold text-[#163828]/70">01</p>
              <h3 className="font-display text-xl font-bold text-[#163828]">
                Sponsor locks the reserve
              </h3>
              <p className="text-sm text-[#163828]/85 leading-relaxed">
                A sponsor picks a beneficiary address, chooses USDC or EURC, locks the
                matching reserve, and sets a clear deadline.
              </p>
            </div>

            <div className="rounded-2xl bg-[#FFFFFF] border border-[#E2D7C0] p-6 space-y-2.5">
              <p className="font-mono text-xs font-semibold text-[#163828]/70">02</p>
              <h3 className="font-display text-xl font-bold text-[#163828]">
                Each gift triggers an equal match
              </h3>
              <p className="text-sm text-[#163828]/85 leading-relaxed">
                When a donor sends a gift, both the donation and an equal match from the
                pool arrive at the beneficiary wallet in the same transaction.
              </p>
            </div>

            <div className="rounded-2xl bg-[#FFFFFF] border border-[#E2D7C0] p-6 space-y-2.5">
              <p className="font-mono text-xs font-semibold text-[#163828]/70">03</p>
              <h3 className="font-display text-xl font-bold text-[#163828]">
                Low pools cap cleanly
              </h3>
              <p className="text-sm text-[#163828]/85 leading-relaxed">
                If a pool has less left than a donor gives, the full donation still
                reaches the beneficiary and the match uses every token left in the pool.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Roadmap Section */}
      <section className="bg-[#F1E9D8] py-16 sm:py-20 border-b border-[#E2D7C0]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-10">
          <div className="max-w-2xl space-y-3">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#163828] tracking-tight text-balance">
              Where Nerwopope builds next
            </h2>
            <p className="text-base text-[#163828]/85 leading-relaxed">
              Planned capabilities moving from single sponsor matching toward shared and
              ongoing support.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {ROADMAP_PHASES.map((item) => (
              <div
                key={item.phase}
                className="rounded-2xl bg-[#FFFFFF] border border-[#E2D7C0] p-6 space-y-2"
              >
                <p className="font-mono text-xs font-semibold text-[#163828]/70">
                  {item.phase}
                </p>
                <h3 className="font-display text-xl font-bold text-[#163828]">
                  {item.title}
                </h3>
                <p className="text-sm text-[#163828]/85 leading-relaxed">
                  {item.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-[#FAF6EE] py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="space-y-3">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#163828] tracking-tight text-balance">
              Questions people ask
            </h2>
            <p className="text-base text-[#163828]/85 leading-relaxed">
              Straight answers on custody, partial matches, and sponsor reclaim rules.
            </p>
          </div>

          <div className="divide-y divide-[#E2D7C0] border-y border-[#E2D7C0]">
            {FAQ_ITEMS.map((item, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div key={item.question} className="py-5">
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between gap-4 text-left cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#163828] rounded"
                  >
                    <span className="font-display text-lg sm:text-xl font-bold text-[#163828]">
                      {item.question}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-[#163828] shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <p className="pt-3 text-sm sm:text-base text-[#163828]/85 leading-relaxed max-w-2xl">
                      {item.answer}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};
