import React, { useState, useMemo } from 'react';
import { useTrading } from '../context/TradingContext';
import { MutualFund } from '../types';
import {
  Calculator,
  Calendar,
  Sparkles,
  PieChart,
  ShieldCheck,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  X,
  Play,
  Pause,
} from 'lucide-react';
import { formatINR, formatCompactINR } from '../utils/formatters';

export const MutualFundsTab: React.FC = () => {
  const { mutualFunds, activeSips, startSIP, cancelSIP, cashBalance, openConfirmationModal } =
    useTrading();

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [showCalculator, setShowCalculator] = useState<boolean>(true);
  const [selectedFundForSip, setSelectedFundForSip] = useState<MutualFund | null>(null);

  // SIP Calculator Parameters
  const [calcMonthlyAmount, setCalcMonthlyAmount] = useState<number>(5000);
  const [calcReturnRate, setCalcReturnRate] = useState<number>(15);
  const [calcYears, setCalcYears] = useState<number>(10);

  // SIP Checkout Modal Form
  const [sipAmount, setSipAmount] = useState<number>(2000);
  const [sipDate, setSipDate] = useState<number>(5);
  const [upiId, setUpiId] = useState<string>('trader@okhdfcbank');

  const categories = [
    'ALL',
    'High Growth',
    'Tax Saver (ELSS)',
    'Index Funds',
    'Liquid Funds',
    'Debt',
  ];

  const filteredFunds = mutualFunds.filter((fund) =>
    selectedCategory === 'ALL' ? true : fund.category === selectedCategory
  );

  // SIP Compound Interest Calculation:
  // M = P * ({[1 + i]^n - 1} / i) * (1 + i)
  const sipResult = useMemo(() => {
    const P = calcMonthlyAmount;
    const i = calcReturnRate / 100 / 12;
    const n = calcYears * 12;

    const totalInvested = P * n;
    const maturityValue = Math.round(P * (((Math.pow(1 + i, n) - 1) / i) * (1 + i)));
    const estimatedGains = Math.max(0, maturityValue - totalInvested);

    return {
      totalInvested,
      maturityValue,
      estimatedGains,
      gainMultiplier: (maturityValue / totalInvested).toFixed(1),
    };
  }, [calcMonthlyAmount, calcReturnRate, calcYears]);

  const handleStartSipSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFundForSip) return;

    openConfirmationModal({
      title: `Confirm Monthly SIP: ${selectedFundForSip.name}`,
      description: `You are creating an automated monthly SIP mandate under NPCI eNACH/UPI AutoPay.`,
      confirmLabel: 'Set Up SIP AutoPay Mandate',
      confirmVariant: 'primary',
      educationalTip:
        '💡 Compounding discipline: Monthly SIPs average out market dips and reinvest dividends automatically.',
      details: [
        { label: 'Fund Name', value: selectedFundForSip.name },
        { label: 'Category', value: selectedFundForSip.category },
        { label: 'Monthly SIP Amount', value: formatINR(sipAmount), highlight: true },
        { label: 'Debit Day', value: `${sipDate}th of every month` },
        { label: 'UPI AutoPay Handle', value: upiId },
        { label: '3Y Historical Return', value: `${selectedFundForSip.cagr3Y}% CAGR` },
      ],
      onConfirm: () => {
        const success = startSIP(selectedFundForSip.id, sipAmount, sipDate, upiId);
        if (success) {
          setSelectedFundForSip(null);
        }
      },
    });
  };

  const handleCancelSipClick = (sip: (typeof activeSips)[0]) => {
    openConfirmationModal({
      title: `Cancel SIP: ${sip.fundName}`,
      description: `Are you sure you want to pause and revoke this monthly AutoPay SIP mandate? Existing units remain in your folio.`,
      confirmLabel: 'Confirm Mandate Revocation',
      confirmVariant: 'danger',
      details: [
        { label: 'Fund Name', value: sip.fundName },
        { label: 'Monthly SIP', value: formatINR(sip.amount) },
        { label: 'Next Scheduled SIP', value: sip.nextDebitDate },
      ],
      onConfirm: () => cancelSIP(sip.id),
    });
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Category Pills */}
      <div className="px-3 overflow-x-auto no-scrollbar flex items-center gap-1.5">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-[#6C5CE7] text-white shadow-sm shadow-[#6C5CE7]/30'
                : 'bg-slate-900/80 border border-slate-800/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* SIP CALCULATOR WIDGET */}
      <div className="px-3">
        <div className="p-4 rounded-2xl bg-[#161B26] border border-slate-800 space-y-3.5 shadow-md">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-[#6C5CE7]/20 text-[#6C5CE7]">
                <Calculator className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Interactive SIP Wealth Calculator</h3>
                <p className="text-[10px] text-slate-400">Power of rupee cost averaging & compounding</p>
              </div>
            </div>
            <button
              onClick={() => setShowCalculator(!showCalculator)}
              className="text-xs text-[#6C5CE7] hover:underline font-semibold"
            >
              {showCalculator ? 'Collapse' : 'Expand'}
            </button>
          </div>

          {showCalculator && (
            <div className="space-y-3 pt-1">
              {/* Monthly Investment Slider */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Monthly SIP Amount</span>
                  <span className="font-mono font-bold text-white">
                    {formatINR(calcMonthlyAmount, false)}
                  </span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="100000"
                  step="500"
                  value={calcMonthlyAmount}
                  onChange={(e) => setCalcMonthlyAmount(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              {/* Expected Return Rate Slider */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Expected Annual Return (CAGR)</span>
                  <span className="font-mono font-bold text-[#00E676]">{calcReturnRate}%</span>
                </div>
                <input
                  type="range"
                  min="6"
                  max="30"
                  step="0.5"
                  value={calcReturnRate}
                  onChange={(e) => setCalcReturnRate(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              {/* Time Horizon Slider */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Time Horizon</span>
                  <span className="font-mono font-bold text-indigo-400">{calcYears} Years</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="30"
                  step="1"
                  value={calcYears}
                  onChange={(e) => setCalcYears(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              {/* Result Summary Card */}
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 grid grid-cols-3 gap-2 text-center font-mono">
                <div>
                  <span className="text-[10px] text-slate-500 block">Total Invested</span>
                  <span className="text-xs font-bold text-slate-300">
                    {formatCompactINR(sipResult.totalInvested)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Est. Wealth Gain</span>
                  <span className="text-xs font-bold text-[#00E676]">
                    +{formatCompactINR(sipResult.estimatedGains)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Total Corpus</span>
                  <span className="text-xs font-bold text-indigo-400">
                    {formatCompactINR(sipResult.maturityValue)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ACTIVE SIPS SUB-SECTION */}
      {activeSips.length > 0 && (
        <div className="px-3 space-y-2">
          <div className="flex justify-between items-center text-xs text-slate-400 px-1">
            <span>Active Automated SIP Mandates ({activeSips.length})</span>
          </div>

          {activeSips.map((sip) => (
            <div
              key={sip.id}
              className="p-3.5 rounded-2xl bg-indigo-950/20 border border-indigo-500/25 flex items-center justify-between"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-white text-xs">{sip.fundName}</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300">
                    {sip.category}
                  </span>
                </div>
                <div className="text-[11px] font-mono text-slate-400">
                  <strong className="text-white">{formatINR(sip.amount)}</strong>/mo • Next: {sip.nextDebitDate}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCancelSipClick(sip)}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-900 border border-slate-800 text-slate-400 hover:text-red-400 transition-colors"
                >
                  Cancel / Pause
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MUTUAL FUND DETAIL CARDS */}
      <div className="px-3 space-y-3">
        <div className="flex justify-between items-center text-xs text-slate-400 px-1">
          <span>Top Rated Direct Mutual Funds</span>
          <span>Showing {filteredFunds.length} Funds</span>
        </div>

        {filteredFunds.map((fund) => (
          <div
            key={fund.id}
            className="p-4 rounded-2xl bg-[#161B26] border border-slate-800 hover:border-slate-700 transition-all space-y-3"
          >
            {/* Header */}
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-bold text-white text-sm">{fund.name}</h4>
                <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                  <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                    {fund.category}
                  </span>
                  <span>Fund Mgr: {fund.fundManager}</span>
                </div>
              </div>

              {/* SEBI Risk-o-meter */}
              <div className="text-right">
                <span className="text-[9px] text-slate-500 block uppercase">Risk-o-Meter</span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    fund.risk === 'Very High'
                      ? 'bg-rose-500/20 text-rose-400'
                      : fund.risk === 'High'
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-emerald-500/20 text-emerald-400'
                  }`}
                >
                  {fund.risk}
                </span>
              </div>
            </div>

            {/* CAGR Returns Table */}
            <div className="grid grid-cols-4 gap-1 p-2.5 rounded-xl bg-slate-900/80 text-center font-mono text-xs">
              <div>
                <span className="text-[10px] text-slate-500 block">1Y CAGR</span>
                <span className="text-[#00E676] font-bold">+{fund.cagr1Y}%</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">3Y CAGR</span>
                <span className="text-[#00E676] font-bold">+{fund.cagr3Y}%</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">5Y CAGR</span>
                <span className="text-[#00E676] font-bold">+{fund.cagr5Y}%</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Expense</span>
                <span className="text-slate-300 font-bold">{fund.expenseRatio}%</span>
              </div>
            </div>

            {/* Top Holdings Preview */}
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <span className="text-slate-500">Top Holdings:</span>
              <span className="truncate text-slate-300">
                {fund.topHoldings.map((h) => `${h.name} (${h.allocation}%)`).join(', ')}
              </span>
            </div>

            {/* Bottom Actions */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
              <div className="text-xs font-mono text-slate-400">
                AUM: <strong className="text-white">{formatCompactINR(fund.aumCr * 10000000)}</strong>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSelectedFundForSip(fund);
                    setSipAmount(fund.minSip);
                  }}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#6C5CE7] hover:bg-[#5a48e0] text-white shadow-md shadow-[#6C5CE7]/30 flex items-center gap-1 transition-all active:scale-95"
                >
                  <span>Start SIP</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* START SIP CHECKOUT MODAL */}
      {selectedFundForSip && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4">
          <div className="w-full sm:max-w-md bg-[#161B26] border border-slate-800 rounded-t-3xl sm:rounded-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-6">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-white text-base">Setup Monthly SIP</h3>
                <p className="text-xs text-slate-400 truncate max-w-[280px]">
                  {selectedFundForSip.name}
                </p>
              </div>
              <button
                onClick={() => setSelectedFundForSip(null)}
                className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleStartSipSubmit} className="p-4 space-y-4">
              {/* Amount Input & Stepper */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Monthly Installment (₹)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="500"
                    min={selectedFundForSip.minSip}
                    value={sipAmount}
                    onChange={(e) => setSipAmount(parseInt(e.target.value) || selectedFundForSip.minSip)}
                    className="flex-1 h-10 bg-slate-900 border border-slate-800 rounded-xl px-3 font-mono font-bold text-white text-sm focus:outline-hidden focus:border-[#6C5CE7]"
                  />
                  <div className="flex gap-1">
                    {[1000, 2500, 5000].map((val) => (
                      <button
                        type="button"
                        key={val}
                        onClick={() => setSipAmount(val)}
                        className="px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-400 hover:text-white"
                      >
                        +{val}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* SIP Auto-Debit Date Picker */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Monthly Auto-Debit Date
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 5, 10, 15].map((d) => (
                    <button
                      type="button"
                      key={d}
                      onClick={() => setSipDate(d)}
                      className={`py-2 rounded-xl border text-xs font-mono font-bold transition-all ${
                        sipDate === d
                          ? 'bg-[#6C5CE7] text-white border-[#6C5CE7]'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {d}th of month
                    </button>
                  ))}
                </div>
              </div>

              {/* UPI Mandate Setup */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  UPI AutoPay Mandate VPA
                </label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-hidden focus:border-[#6C5CE7]"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>First Installment Debit:</span>
                  <span className="text-white font-mono font-bold">Immediate (Today)</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Next Auto-Debit:</span>
                  <span className="text-indigo-400 font-mono font-bold">{sipDate} Nov 2026</span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl font-bold text-sm bg-[#6C5CE7] hover:bg-[#5a48e0] text-white shadow-xl shadow-[#6C5CE7]/30 flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Authorize SIP Mandate & Pay {formatINR(sipAmount)}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
