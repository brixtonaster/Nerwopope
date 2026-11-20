import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAccount, useSwitchChain } from 'wagmi';
import { TxStatusBanner } from '../components/TxStatusBanner';
import { WalletGate } from '../components/WalletGate';
import { arcChain, SUPPORTED_TOKENS } from '../config/chain';
import { CONTRACT_ADDRESS, ERC20_ABI } from '../config/contracts';
import {
  useContractAbi,
  useTokenMetadata,
  useTxLifecycle,
} from '../hooks/useContractData';
import {
  formatTokenAmount,
  parseTokenAmount,
  shortenAddress,
  validateCreatePoolInput,
} from '../lib/poolMath';

export const StartPoolPage: React.FC = () => {
  const { address, isConnected, chainId } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { data: contractMeta } = useContractAbi();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [beneficiary, setBeneficiary] = useState('');
  const [tokenAddress, setTokenAddress] = useState<`0x${string}`>(
    SUPPORTED_TOKENS[0].address
  );
  const [matchAmount, setMatchAmount] = useState('');
  const [deadlineLocal, setDeadlineLocal] = useState('');
  const [submittedErrors, setSubmittedErrors] = useState<Record<string, string>>({});

  const {
    decimals,
    symbol,
    balance,
    allowance,
    isLoadingDecimals,
    refetchAllowance,
    refetchBalance,
  } = useTokenMetadata(tokenAddress);

  const resolvedDecimals = decimals ?? 6;
  const resolvedSymbol = symbol ?? 'USDC';

  const parsedAmount = useMemo(
    () => parseTokenAmount(matchAmount, resolvedDecimals),
    [matchAmount, resolvedDecimals]
  );

  const needsApproval =
    parsedAmount !== null &&
    allowance !== undefined &&
    allowance < parsedAmount;

  const approveTx = useTxLifecycle(() => {
    refetchAllowance();
  });

  const createTx = useTxLifecycle(() => {
    refetchBalance();
    refetchAllowance();
  });

  const onSelectToken = (addr: `0x${string}`) => {
    setTokenAddress(addr);
    approveTx.reset();
    createTx.reset();
  };

  const handleUseMax = () => {
    if (balance === undefined) return;
    const raw = (Number(balance) / 10 ** resolvedDecimals).toString();
    setMatchAmount(raw);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors = validateCreatePoolInput({
      name,
      description,
      beneficiary,
      matchAmount,
      deadlineLocal,
      decimals: resolvedDecimals,
      walletBalance: balance,
    });

    if (Object.keys(errors).length > 0) {
      setSubmittedErrors(errors as Record<string, string>);
      return;
    }
    setSubmittedErrors({});

    if (!CONTRACT_ADDRESS || !parsedAmount || !contractMeta) return;

    if (chainId !== arcChain.id) {
      await switchChainAsync({ chainId: arcChain.id });
    }

    if (needsApproval) {
      await approveTx.writeContractAsync({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [CONTRACT_ADDRESS, parsedAmount],
        chainId: arcChain.id,
      });
      return;
    }

    const deadlineSeconds = BigInt(Math.floor(Date.parse(deadlineLocal) / 1000));
    await createTx.writeContractAsync({
      address: CONTRACT_ADDRESS,
      abi: contractMeta.abi,
      functionName: contractMeta.fns.createPool,
      args: [
        name.trim(),
        description.trim(),
        beneficiary.trim() as `0x${string}`,
        tokenAddress,
        parsedAmount,
        deadlineSeconds,
      ],
      chainId: arcChain.id,
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-10">
      <div className="space-y-3 max-w-2xl">
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#163828] tracking-tight text-balance">
          Start a match pool
        </h1>
        <p className="text-base text-[#163828]/85 leading-relaxed">
          Lock USDC or EURC for a beneficiary on Arc. Every gift sent before the
          deadline receives an equal one for one match until the pool runs empty.
        </p>
      </div>

      {!isConnected ? (
        <WalletGate
          title="Connect your wallet to start a pool"
          description="Pool creation requires signing an ERC20 approval and locking your matching reserve on Arc."
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <form
            onSubmit={handleSubmit}
            noValidate
            className="lg:col-span-7 rounded-2xl bg-[#FFFFFF] border border-[#E2D7C0] p-6 sm:p-8 space-y-6"
          >
            {!CONTRACT_ADDRESS && (
              <div className="rounded-xl bg-[#F1E9D8] border border-[#E2D7C0] p-4 text-sm text-[#163828]">
                Contract address is not configured in environment variables yet. Set{' '}
                <span className="font-mono font-semibold">VITE_CONTRACT_ADDRESS</span> to
                submit pools on Arc.
              </div>
            )}

            {/* Pool Name */}
            <div className="space-y-2">
              <label
                htmlFor="pool-name"
                className="block text-sm font-semibold text-[#163828]"
              >
                Pool name
              </label>
              <input
                id="pool-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Clean Water Well Repair"
                className="w-full rounded-xl border border-[#E2D7C0] bg-[#FAF6EE] px-4 py-3 text-sm text-[#163828] placeholder:text-[#163828]/45 focus:outline-none focus:border-[#163828]"
              />
              {submittedErrors.name && (
                <p className="text-xs font-medium text-[#B91C1C]">
                  {submittedErrors.name}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label
                htmlFor="pool-description"
                className="block text-sm font-semibold text-[#163828]"
              >
                Description
              </label>
              <textarea
                id="pool-description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain what donations support and who manages the beneficiary address."
                className="w-full rounded-xl border border-[#E2D7C0] bg-[#FAF6EE] px-4 py-3 text-sm text-[#163828] placeholder:text-[#163828]/45 focus:outline-none focus:border-[#163828]"
              />
              {submittedErrors.description && (
                <p className="text-xs font-medium text-[#B91C1C]">
                  {submittedErrors.description}
                </p>
              )}
            </div>

            {/* Beneficiary */}
            <div className="space-y-2">
              <label
                htmlFor="pool-beneficiary"
                className="block text-sm font-semibold text-[#163828]"
              >
                Beneficiary address
              </label>
              <input
                id="pool-beneficiary"
                type="text"
                value={beneficiary}
                onChange={(e) => setBeneficiary(e.target.value)}
                placeholder="0x..."
                className="w-full rounded-xl border border-[#E2D7C0] bg-[#FAF6EE] px-4 py-3 text-sm font-mono text-[#163828] placeholder:text-[#163828]/45 focus:outline-none focus:border-[#163828]"
              />
              {submittedErrors.beneficiary && (
                <p className="text-xs font-medium text-[#B91C1C]">
                  {submittedErrors.beneficiary}
                </p>
              )}
            </div>

            {/* Token Selector */}
            <div className="space-y-2">
              <span className="block text-sm font-semibold text-[#163828]">
                Match token
              </span>
              <div className="grid grid-cols-2 gap-3">
                {SUPPORTED_TOKENS.map((token) => {
                  const selected =
                    token.address.toLowerCase() === tokenAddress.toLowerCase();
                  return (
                    <button
                      key={token.address}
                      type="button"
                      onClick={() => onSelectToken(token.address)}
                      className={`rounded-xl px-4 py-3 border text-left transition-colors cursor-pointer ${
                        selected
                          ? 'bg-[#163828] text-[#FAF6EE] border-[#163828]'
                          : 'bg-[#FAF6EE] text-[#163828] border-[#E2D7C0] hover:border-[#163828]'
                      }`}
                    >
                      <div className="text-sm font-bold">{token.symbol}</div>
                      <div
                        className={`text-xs ${
                          selected ? 'text-[#FAF6EE]/80' : 'text-[#163828]/70'
                        }`}
                      >
                        {token.name}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Match Amount */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor="pool-amount"
                  className="block text-sm font-semibold text-[#163828]"
                >
                  Match amount to lock ({resolvedSymbol})
                </label>
                <div className="text-xs text-[#163828]/80 tabular-nums flex items-center gap-2">
                  <span>
                    Balance:{' '}
                    {balance !== undefined
                      ? `${formatTokenAmount(balance, resolvedDecimals)} ${resolvedSymbol}`
                      : isLoadingDecimals
                        ? 'Reading'
                        : '0'}
                  </span>
                  {balance !== undefined && balance > 0n && (
                    <button
                      type="button"
                      onClick={handleUseMax}
                      className="font-semibold underline underline-offset-2 cursor-pointer text-[#163828]"
                    >
                      Max
                    </button>
                  )}
                </div>
              </div>
              <input
                id="pool-amount"
                type="text"
                inputMode="decimal"
                value={matchAmount}
                onChange={(e) => setMatchAmount(e.target.value)}
                placeholder="500"
                className="w-full rounded-xl border border-[#E2D7C0] bg-[#FAF6EE] px-4 py-3 text-sm font-mono tabular-nums text-[#163828] placeholder:text-[#163828]/45 focus:outline-none focus:border-[#163828]"
              />
              {submittedErrors.matchAmount && (
                <p className="text-xs font-medium text-[#B91C1C]">
                  {submittedErrors.matchAmount}
                </p>
              )}
            </div>

            {/* Deadline */}
            <div className="space-y-2">
              <label
                htmlFor="pool-deadline"
                className="block text-sm font-semibold text-[#163828]"
              >
                Pool deadline
              </label>
              <input
                id="pool-deadline"
                type="datetime-local"
                value={deadlineLocal}
                onChange={(e) => setDeadlineLocal(e.target.value)}
                className="w-full rounded-xl border border-[#E2D7C0] bg-[#FAF6EE] px-4 py-3 text-sm text-[#163828] focus:outline-none focus:border-[#163828]"
              />
              {submittedErrors.deadlineLocal && (
                <p className="text-xs font-medium text-[#B91C1C]">
                  {submittedErrors.deadlineLocal}
                </p>
              )}
            </div>

            <TxStatusBanner
              phase={approveTx.phase}
              actionLabel={`Approve ${resolvedSymbol}`}
              hash={approveTx.hash}
              errorMessage={approveTx.errorMessage}
              onReset={approveTx.reset}
            />

            <TxStatusBanner
              phase={createTx.phase}
              actionLabel="Create match pool"
              hash={createTx.hash}
              errorMessage={createTx.errorMessage}
              onReset={createTx.reset}
            />

            {createTx.phase === 'confirmed' && (
              <div className="pt-1">
                <Link
                  to="/pools"
                  className="inline-flex items-center text-sm font-bold text-[#163828] underline underline-offset-4"
                >
                  View all pools
                </Link>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={
                  !CONTRACT_ADDRESS ||
                  approveTx.phase === 'pending' ||
                  approveTx.phase === 'confirming' ||
                  createTx.phase === 'pending' ||
                  createTx.phase === 'confirming'
                }
                className="w-full py-3.5 px-6 rounded-xl bg-[#163828] text-[#FAF6EE] text-sm font-bold hover:bg-[#0F271C] disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                {needsApproval
                  ? `Approve ${resolvedSymbol} first`
                  : 'Create Match Pool'}
              </button>
            </div>
          </form>

          {/* Summary Sidebar */}
          <aside className="lg:col-span-5 rounded-2xl bg-[#163828] text-[#FAF6EE] p-6 sm:p-8 space-y-6">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-[#F2B705]">
                Pool summary
              </p>
              <h2 className="font-display text-2xl font-bold text-[#FFFFFF]">
                {name.trim() || 'Untitled match pool'}
              </h2>
            </div>

            <dl className="space-y-4 text-sm border-t border-[#2D6A4F] pt-5">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-[#FAF6EE]/75">Sponsor</dt>
                <dd className="font-mono text-[#FFFFFF]">
                  {address ? shortenAddress(address) : ''}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-[#FAF6EE]/75">Beneficiary</dt>
                <dd className="font-mono text-[#FFFFFF]">
                  {beneficiary.trim() ? shortenAddress(beneficiary.trim()) : 'Not set'}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-[#FAF6EE]/75">Locked reserve</dt>
                <dd className="font-mono font-semibold text-[#F2B705] tabular-nums">
                  {parsedAmount
                    ? `${formatTokenAmount(parsedAmount, resolvedDecimals)} ${resolvedSymbol}`
                    : `0 ${resolvedSymbol}`}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-[#FAF6EE]/75">Token decimals</dt>
                <dd className="font-mono text-[#FFFFFF] tabular-nums">
                  {decimals !== undefined ? decimals : 'Reading'}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-[#FAF6EE]/75">Match ratio</dt>
                <dd className="font-semibold text-[#FFFFFF]">1 for 1</dd>
              </div>
            </dl>

            <div className="rounded-xl bg-[#1E4633] p-4 text-xs text-[#FAF6EE]/90 leading-relaxed space-y-1.5">
              <p className="font-semibold text-[#FFFFFF]">Two step approval</p>
              <p>
                Arc checks your {resolvedSymbol} allowance first. If your current
                allowance is below the match amount, you will approve {resolvedSymbol}{' '}
                before locking the pool.
              </p>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};
