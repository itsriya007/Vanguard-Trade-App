import React, { useState } from 'react';
import { useTrading } from '../context/TradingContext';
import { IPO } from '../types';
import {
  Calendar,
  Layers,
  Sparkles,
  CheckCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  X,
} from 'lucide-react';
import { formatINR, formatCompactINR } from '../utils/formatters';

export const IPOMarketTab: React.FC = () => {
  const { ipos, ipoApplications, applyForIPO, cashBalance, openConfirmationModal } = useTrading();
  const [subSection, setSubSection] = useState<'OPEN' | 'UPCOMING' | 'CLOSED' | 'APPLICATIONS'>('OPEN');
  const [selectedIpoForApply, setSelectedIpoForApply] = useState<IPO | null>(null);

  // Apply Form State
  const [lots, setLots] = useState<number>(1);
  const [upiId, setUpiId] = useState<string>('trader@okhdfcbank');
  const [useCutoff, setUseCutoff] = useState<boolean>(true);
  const [customBidPrice, setCustomBidPrice] = useState<number>(0);
  const [upiError, setUpiError] = useState<string>('');

  const filteredIpos = ipos.filter((ipo) => ipo.status === subSection);

  const openApplyModal = (ipo: IPO) => {
    setSelectedIpoForApply(ipo);
    setLots(1);
    setUseCutoff(true);
    setCustomBidPrice(ipo.priceBandMax);
    setUpiError('');
  };

  const handleApplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIpoForApply) return;

    // Validate UPI ID format
    const upiRegex = /^[\w.-]+@[\w.-]+$/;
    if (!upiRegex.test(upiId.trim())) {
      setUpiError('Please enter a valid UPI Virtual Payment Address (e.g., name@okhdfcbank)');
      return;
    }

    const price = useCutoff ? selectedIpoForApply.priceBandMax : customBidPrice;
    const totalAmount = lots * selectedIpoForApply.lotSize * price;

    openConfirmationModal({
      title: `Confirm IPO Bid: ${selectedIpoForApply.companyName}`,
      description: `You are submitting an ASBA bid. Funds will only be blocked in your bank account, not debited.`,
      confirmLabel: 'Send UPI Mandate Request',
      confirmVariant: 'primary',
      educationalTip:
        '💡 ASBA Benefit: Your money stays in your bank account earning interest until shares are allotted.',
      details: [
        { label: 'Company', value: selectedIpoForApply.companyName },
        { label: 'Lots', value: `${lots} Lot (${lots * selectedIpoForApply.lotSize} shares)` },
        { label: 'Bid Price', value: formatINR(price) },
        { label: 'Amount to Block', value: formatINR(totalAmount), highlight: true },
        { label: 'UPI VPA Handle', value: upiId.trim() },
      ],
      onConfirm: () => {
        const success = applyForIPO(selectedIpoForApply.id, lots, upiId.trim(), price);
        if (success) {
          setSelectedIpoForApply(null);
          setSubSection('APPLICATIONS');
        }
      },
    });
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Sub Tabs */}
      <div className="px-3">
        <div className="grid grid-cols-4 gap-1 p-1 bg-slate-900/90 rounded-xl border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setSubSection('OPEN')}
            className={`py-1.5 rounded-lg transition-all text-center ${
              subSection === 'OPEN'
                ? 'bg-[#6C5CE7] text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Live ({ipos.filter((i) => i.status === 'OPEN').length})
          </button>
          <button
            onClick={() => setSubSection('UPCOMING')}
            className={`py-1.5 rounded-lg transition-all text-center ${
              subSection === 'UPCOMING'
                ? 'bg-[#6C5CE7] text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setSubSection('CLOSED')}
            className={`py-1.5 rounded-lg transition-all text-center ${
              subSection === 'CLOSED'
                ? 'bg-[#6C5CE7] text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Listed
          </button>
          <button
            onClick={() => setSubSection('APPLICATIONS')}
            className={`py-1.5 rounded-lg transition-all text-center relative ${
              subSection === 'APPLICATIONS'
                ? 'bg-[#6C5CE7] text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            My Bids
            {ipoApplications.length > 0 && (
              <span className="ml-1 w-2 h-2 rounded-full bg-[#00E676] inline-block" />
            )}
          </button>
        </div>
      </div>

      {/* APPLICATIONS TAB VIEW */}
      {subSection === 'APPLICATIONS' ? (
        <div className="px-3 space-y-3">
          <div className="flex justify-between items-center text-xs text-slate-400 px-1">
            <span>Submitted UPI ASBA Bids</span>
            <span>Total Bids: {ipoApplications.length}</span>
          </div>

          {ipoApplications.map((app) => (
            <div
              key={app.id}
              className="p-4 rounded-2xl bg-[#161B26] border border-slate-800 space-y-3"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-white text-sm">{app.companyName}</h4>
                  <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                    App No: <strong className="text-indigo-300">{app.applicationNo}</strong>
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-[#00E676] border border-[#00E676]/30">
                  {app.status === 'MANDATE_APPROVED'
                    ? 'Mandate Accepted'
                    : app.status === 'MANDATE_PENDING'
                    ? 'Pending Approval'
                    : 'Allotment in Process'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-900/80 text-xs font-mono">
                <div>
                  <span className="text-[10px] text-slate-500 block">Lots</span>
                  <span className="text-white font-bold">{app.lots} ({app.shares} sh)</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Bid Price</span>
                  <span className="text-white font-bold">{formatINR(app.bidPrice)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Blocked Amt</span>
                  <span className="text-[#00E676] font-bold">{formatINR(app.totalAmount)}</span>
                </div>
              </div>

              {/* ASBA Mandate Progress Tracker */}
              <div className="pt-2 border-t border-slate-800/80">
                <div className="text-[10px] text-slate-400 mb-2 font-medium">
                  UPI Mandate Status Tracker ({app.upiId})
                </div>
                <div className="grid grid-cols-4 gap-1 text-center">
                  <div className="space-y-1">
                    <div className="w-5 h-5 mx-auto rounded-full bg-[#00E676] text-slate-950 flex items-center justify-center text-[10px] font-bold">
                      ✓
                    </div>
                    <span className="text-[9px] text-[#00E676] block">Applied</span>
                  </div>
                  <div className="space-y-1">
                    <div className="w-5 h-5 mx-auto rounded-full bg-[#00E676] text-slate-950 flex items-center justify-center text-[10px] font-bold">
                      ✓
                    </div>
                    <span className="text-[9px] text-[#00E676] block">Mandate Sent</span>
                  </div>
                  <div className="space-y-1">
                    <div
                      className={`w-5 h-5 mx-auto rounded-full flex items-center justify-center text-[10px] font-bold ${
                        app.status === 'MANDATE_APPROVED'
                          ? 'bg-[#00E676] text-slate-950'
                          : 'bg-amber-500 text-slate-950 animate-pulse'
                      }`}
                    >
                      {app.status === 'MANDATE_APPROVED' ? '✓' : '•'}
                    </div>
                    <span
                      className={`text-[9px] block ${
                        app.status === 'MANDATE_APPROVED' ? 'text-[#00E676]' : 'text-amber-400'
                      }`}
                    >
                      Fund Blocked
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="w-5 h-5 mx-auto rounded-full bg-slate-800 text-slate-500 flex items-center justify-center text-[10px]">
                      •
                    </div>
                    <span className="text-[9px] text-slate-500 block">Allotment</span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {ipoApplications.length === 0 && (
            <div className="p-8 text-center text-slate-500 text-xs bg-[#161B26] rounded-2xl border border-slate-800">
              No active IPO bids found. Check the "Live" tab to apply.
            </div>
          )}
        </div>
      ) : (
        /* LISTINGS TAB VIEW (OPEN / UPCOMING / CLOSED) */
        <div className="px-3 space-y-3">
          {filteredIpos.map((ipo) => (
            <div
              key={ipo.id}
              className="p-4 rounded-2xl bg-[#161B26] border border-slate-800 hover:border-slate-700 transition-all shadow-sm space-y-3.5"
            >
              {/* Card Header */}
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-white text-sm">{ipo.companyName}</h4>
                    <span className="text-[10px] font-mono px-1 rounded bg-slate-800 text-slate-400">
                      {ipo.symbol}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                    <Calendar className="w-3 h-3 text-indigo-400" />
                    <span>
                      {ipo.openDate} - {ipo.closeDate}
                    </span>
                  </div>
                </div>

                {/* GMP (Grey Market Premium) Badge */}
                {ipo.gmp > 0 && (
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-medium">GMP Today</span>
                    <div className="flex items-center text-xs font-mono font-bold text-[#00E676]">
                      <TrendingUp className="w-3 h-3 mr-0.5 inline" />
                      +{formatINR(ipo.gmp)} ({ipo.gmpPercent.toFixed(1)}%)
                    </div>
                  </div>
                )}
              </div>

              {/* Grid Metrics */}
              <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-900/70 border border-slate-800/80 text-xs font-mono">
                <div>
                  <span className="text-[10px] text-slate-500 block">Price Band</span>
                  <span className="text-white font-bold">
                    ₹{ipo.priceBandMin} - ₹{ipo.priceBandMax}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Lot Size</span>
                  <span className="text-white font-bold">{ipo.lotSize} shares</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Min Investment</span>
                  <span className="text-indigo-400 font-bold">{formatINR(ipo.minInvestment)}</span>
                </div>
              </div>

              {/* Subscription Breakdown */}
              {ipo.status === 'OPEN' && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Overall Subscription:</span>
                    <strong className="text-[#00E676] font-mono">{ipo.subscription.total}x</strong>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] font-mono">
                    <div className="p-1 rounded bg-slate-900 border border-slate-800">
                      <span className="text-slate-500 block">QIB</span>
                      <span className="text-white font-bold">{ipo.subscription.qib}x</span>
                    </div>
                    <div className="p-1 rounded bg-slate-900 border border-slate-800">
                      <span className="text-slate-500 block">NII (HNI)</span>
                      <span className="text-white font-bold">{ipo.subscription.nii}x</span>
                    </div>
                    <div className="p-1 rounded bg-slate-900 border border-slate-800">
                      <span className="text-slate-500 block">Retail</span>
                      <span className="text-[#00E676] font-bold">{ipo.subscription.retail}x</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Bottom Action */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-mono">
                  Issue Size: {formatCompactINR(ipo.issueSizeCr * 10000000)}
                </span>

                {ipo.status === 'OPEN' ? (
                  <button
                    onClick={() => openApplyModal(ipo)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-[#6C5CE7] hover:bg-[#5a48e0] text-white shadow-lg shadow-[#6C5CE7]/30 flex items-center gap-1.5 transition-all active:scale-95"
                  >
                    <span>Apply via UPI</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : ipo.status === 'UPCOMING' ? (
                  <span className="px-3 py-1 rounded-lg text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    Opening Soon
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-lg text-xs font-medium bg-slate-800 text-slate-400">
                    Closed & Listed
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ONE-TAP APPLY VIA UPI MODAL */}
      {selectedIpoForApply && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4">
          <div className="w-full sm:max-w-md bg-[#161B26] border border-slate-800 rounded-t-3xl sm:rounded-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-6">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-white text-base">
                  Apply for {selectedIpoForApply.companyName}
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Cut-off Price: ₹{selectedIpoForApply.priceBandMax} | Lot Size: {selectedIpoForApply.lotSize} sh
                </p>
              </div>
              <button
                onClick={() => setSelectedIpoForApply(null)}
                className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleApplySubmit} className="p-4 space-y-4 overflow-y-auto">
              {/* Lots Stepper */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">Lots to Bid</label>
                  <span className="text-[11px] font-mono text-indigo-400">
                    Total: {lots * selectedIpoForApply.lotSize} shares
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setLots((l) => Math.max(1, l - 1))}
                    className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 text-white font-bold"
                  >
                    -
                  </button>
                  <div className="flex-1 h-10 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center font-mono font-bold text-white">
                    {lots} {lots === 1 ? 'Lot' : 'Lots'}
                  </div>
                  <button
                    type="button"
                    onClick={() => setLots((l) => Math.min(13, l + 1))} // max retail limit approx ₹2 Lakhs
                    className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 text-white font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Cut-off Price Toggle */}
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-white block">Bid at Cut-off Price</span>
                  <span className="text-[10px] text-slate-400">
                    Recommended to maximize allotment probability
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={useCutoff}
                  onChange={(e) => setUseCutoff(e.target.checked)}
                  className="w-4 h-4 accent-[#6C5CE7] rounded"
                />
              </div>

              {/* UPI ID Input & Validation */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Virtual Payment Address (UPI ID)
                </label>
                <input
                  type="text"
                  placeholder="e.g. mobile@okhdfcbank, user@oksbi"
                  value={upiId}
                  onChange={(e) => {
                    setUpiId(e.target.value);
                    setUpiError('');
                  }}
                  className={`w-full bg-slate-900 border rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 font-mono focus:outline-hidden ${
                    upiError ? 'border-red-500' : 'border-slate-800 focus:border-[#6C5CE7]'
                  }`}
                />
                {upiError && (
                  <p className="text-[11px] text-red-400 mt-1">{upiError}</p>
                )}
                {/* Popular Handles */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {['@okhdfcbank', '@oksbi', '@paytm', '@upi', '@axisbank'].map((handle) => (
                    <button
                      type="button"
                      key={handle}
                      onClick={() => {
                        const prefix = upiId.split('@')[0] || 'trader';
                        setUpiId(`${prefix}${handle}`);
                        setUpiError('');
                      }}
                      className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                    >
                      {handle}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount Summary */}
              <div className="p-3 rounded-xl bg-indigo-950/20 border border-indigo-500/20 flex justify-between items-center text-xs">
                <span className="text-slate-300">Total ASBA Block Amount:</span>
                <span className="text-base font-bold font-mono text-[#00E676]">
                  {formatINR(lots * selectedIpoForApply.lotSize * (useCutoff ? selectedIpoForApply.priceBandMax : customBidPrice))}
                </span>
              </div>

              <div className="text-[10px] text-slate-400 flex items-center gap-1.5 leading-snug">
                <CheckCircle className="w-3.5 h-3.5 text-[#00E676] shrink-0" />
                <span>
                  Funds remain in your bank account earning interest until share allotment date.
                </span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3.5 rounded-xl font-bold text-sm bg-[#6C5CE7] hover:bg-[#5a48e0] text-white shadow-xl shadow-[#6C5CE7]/30 flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <span>Authorize & Send Mandate</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
