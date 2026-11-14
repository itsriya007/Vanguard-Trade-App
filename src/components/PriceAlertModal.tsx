import React, { useState, useEffect, useMemo } from 'react';
import { useTrading } from '../context/TradingContext';
import { Stock, PriceAlert } from '../types';
import { formatINR } from '../utils/formatters';
import {
  Bell,
  BellRing,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertCircle,
  X,
  Volume2,
  Sparkles,
  Play,
  RotateCcw,
  Sliders,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

interface PriceAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialStock?: Stock | null;
}

export const PriceAlertModal: React.FC<PriceAlertModalProps> = ({
  isOpen,
  onClose,
  initialStock,
}) => {
  const {
    stocks,
    priceAlerts,
    addPriceAlert,
    removePriceAlert,
    togglePriceAlert,
    resetPriceAlert,
    testTriggerAlert,
    notificationPermission,
    requestNotificationPermission,
    mode,
  } = useTrading();

  const [activeTab, setActiveTab] = useState<'CREATE' | 'LIST'>('CREATE');
  const [selectedStockSymbol, setSelectedStockSymbol] = useState<string>(
    initialStock?.symbol || stocks[0]?.symbol || 'TATAMOTORS'
  );
  const [condition, setCondition] = useState<'ABOVE' | 'BELOW'>('ABOVE');
  const [targetPrice, setTargetPrice] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Sync selected stock when initialStock changes
  useEffect(() => {
    if (initialStock) {
      setSelectedStockSymbol(initialStock.symbol);
      const defaultTarget =
        condition === 'ABOVE'
          ? Number((initialStock.price * 1.02).toFixed(2))
          : Number((initialStock.price * 0.98).toFixed(2));
      setTargetPrice(defaultTarget.toString());
    }
  }, [initialStock]);

  const currentStock = useMemo(() => {
    return stocks.find((s) => s.symbol === selectedStockSymbol) || stocks[0];
  }, [stocks, selectedStockSymbol]);

  // Set default target price when stock changes
  useEffect(() => {
    if (currentStock && (!targetPrice || targetPrice === '0')) {
      const defaultTarget =
        condition === 'ABOVE'
          ? Number((currentStock.price * 1.015).toFixed(2))
          : Number((currentStock.price * 0.985).toFixed(2));
      setTargetPrice(defaultTarget.toString());
    }
  }, [currentStock, condition]);

  if (!isOpen) return null;

  const currentLtp = currentStock ? currentStock.price : 0;
  const numTargetPrice = parseFloat(targetPrice) || 0;
  const priceDifference = numTargetPrice - currentLtp;
  const percentDifference = currentLtp > 0 ? (priceDifference / currentLtp) * 100 : 0;

  // Quick percentage helpers
  const handlePercentOffset = (offsetPct: number) => {
    if (!currentStock) return;
    const computed = Number((currentStock.price * (1 + offsetPct / 100)).toFixed(2));
    setTargetPrice(computed.toString());
    if (offsetPct >= 0) {
      setCondition('ABOVE');
    } else {
      setCondition('BELOW');
    }
  };

  const handleCreateAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStock || numTargetPrice <= 0) {
      setFeedbackMsg({ type: 'error', text: 'Please enter a valid target price greater than ₹0.' });
      return;
    }

    if (condition === 'ABOVE' && numTargetPrice <= currentStock.price) {
      setFeedbackMsg({
        type: 'error',
        text: `Target price (₹${numTargetPrice}) must be greater than current price (₹${currentStock.price}) for "Rises Above" condition.`,
      });
      return;
    }

    if (condition === 'BELOW' && numTargetPrice >= currentStock.price) {
      setFeedbackMsg({
        type: 'error',
        text: `Target price (₹${numTargetPrice}) must be less than current price (₹${currentStock.price}) for "Falls Below" condition.`,
      });
      return;
    }

    const res = addPriceAlert({
      symbol: currentStock.symbol,
      targetPrice: numTargetPrice,
      condition,
      note: note.trim() || undefined,
    });

    if (res.success) {
      setFeedbackMsg({ type: 'success', text: `Alert set for ${currentStock.symbol} at ${formatINR(numTargetPrice)}!` });
      setTimeout(() => {
        setFeedbackMsg(null);
        setActiveTab('LIST');
      }, 900);
    } else {
      setFeedbackMsg({ type: 'error', text: res.message });
    }
  };

  const activeAlerts = priceAlerts.filter((a) => a.isActive && !a.isTriggered);
  const triggeredAlerts = priceAlerts.filter((a) => a.isTriggered);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg max-h-[92vh] bg-[#161B26] border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#6C5CE7] to-[#00E676] flex items-center justify-center shadow-md shadow-[#6C5CE7]/20 text-slate-950 font-bold">
              <BellRing className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-sm text-white leading-none">Custom Price Alerts</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-indigo-300 font-bold border border-slate-700">
                  {priceAlerts.length} Total
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Real-time browser notifications & local audio alerts
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Browser Notification Permission Banner */}
        <div className="px-4 py-2.5 bg-slate-950/70 border-b border-slate-800/80">
          <div className="flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  notificationPermission === 'granted'
                    ? 'bg-[#00E676] animate-pulse'
                    : notificationPermission === 'denied'
                    ? 'bg-rose-500'
                    : 'bg-amber-400 animate-ping'
                }`}
              />
              <span className="text-[11px] text-slate-300">
                {notificationPermission === 'granted' ? (
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Browser Notifications Enabled
                  </span>
                ) : notificationPermission === 'denied' ? (
                  <span className="text-rose-400 font-medium">
                    Browser notifications blocked in settings (Audio & In-App active)
                  </span>
                ) : (
                  <span className="text-amber-300 font-medium">
                    Browser notifications not yet enabled
                  </span>
                )}
              </span>
            </div>

            {notificationPermission !== 'granted' && notificationPermission !== 'unsupported' && (
              <button
                onClick={requestNotificationPermission}
                className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] transition-all shadow-sm active:scale-95 shrink-0"
              >
                Enable Notifications
              </button>
            )}
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="px-4 pt-3 pb-1 border-b border-slate-800/60">
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('CREATE')}
              className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'CREATE'
                  ? 'bg-[#6C5CE7] text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Set New Alert</span>
            </button>
            <button
              onClick={() => setActiveTab('LIST')}
              className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'LIST'
                  ? 'bg-[#6C5CE7] text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Manage Alerts</span>
              {activeAlerts.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/20 text-[#00E676] font-mono font-bold">
                  {activeAlerts.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {/* TAB 1: CREATE ALERT */}
          {activeTab === 'CREATE' && (
            <form onSubmit={handleCreateAlert} className="space-y-4">
              
              {/* Beginner Guidance Tip */}
              {mode === 'beginner' && (
                <div className="p-3 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-[#00E676] shrink-0 mt-0.5" />
                  <div className="text-xs space-y-0.5">
                    <p className="font-semibold text-white">Smart Trading with Price Alerts</p>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Instead of constantly watching the screen, set a target price. When the stock hits your target, Vanguard Trade will alert you instantly with sound and browser notifications!
                    </p>
                  </div>
                </div>
              )}

              {/* 1. Stock Selector */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Select Stock
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 max-h-36 overflow-y-auto p-1.5 bg-slate-900/80 rounded-2xl border border-slate-800">
                  {stocks.map((s) => {
                    const isSelected = s.symbol === selectedStockSymbol;
                    return (
                      <button
                        type="button"
                        key={s.symbol}
                        onClick={() => {
                          setSelectedStockSymbol(s.symbol);
                          const newTarget =
                            condition === 'ABOVE'
                              ? Number((s.price * 1.02).toFixed(2))
                              : Number((s.price * 0.98).toFixed(2));
                          setTargetPrice(newTarget.toString());
                        }}
                        className={`p-2 rounded-xl text-left border transition-all ${
                          isSelected
                            ? 'bg-[#6C5CE7]/20 border-[#6C5CE7] text-white shadow-xs'
                            : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <div className="font-bold text-xs truncate">{s.symbol}</div>
                        <div className="text-[10px] font-mono text-slate-300 mt-0.5">
                          {formatINR(s.price)}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Current Stock Banner */}
              {currentStock && (
                <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-white text-sm">{currentStock.symbol}</span>
                      <span className="text-[10px] font-mono px-1 rounded bg-slate-800 text-slate-400">
                        {currentStock.exchange}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">{currentStock.name}</p>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                      Live Price (LTP)
                    </span>
                    <span className="text-sm font-mono font-bold text-white">
                      {formatINR(currentStock.price)}
                    </span>
                    <span
                      className={`text-[10px] font-mono font-semibold block ${
                        currentStock.change >= 0 ? 'text-[#00E676]' : 'text-[#FF5252]'
                      }`}
                    >
                      {currentStock.change >= 0 ? '+' : ''}
                      {currentStock.change.toFixed(2)} ({currentStock.changePercent.toFixed(2)}%)
                    </span>
                  </div>
                </div>
              )}

              {/* 2. Alert Trigger Condition */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Trigger Condition
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCondition('ABOVE');
                      if (currentStock) {
                        setTargetPrice(Number((currentStock.price * 1.02).toFixed(2)).toString());
                      }
                    }}
                    className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-all ${
                      condition === 'ABOVE'
                        ? 'bg-emerald-950/30 border-[#00E676] text-white shadow-xs'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-[#00E676] flex items-center justify-center shrink-0">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-white">Rises Above (≥)</div>
                      <div className="text-[10px] text-slate-400">Triggers on upside targets</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCondition('BELOW');
                      if (currentStock) {
                        setTargetPrice(Number((currentStock.price * 0.98).toFixed(2)).toString());
                      }
                    }}
                    className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-all ${
                      condition === 'BELOW'
                        ? 'bg-rose-950/30 border-[#FF5252] text-white shadow-xs'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-xl bg-rose-500/20 text-[#FF5252] flex items-center justify-center shrink-0">
                      <TrendingDown className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-white">Falls Below (≤)</div>
                      <div className="text-[10px] text-slate-400">Triggers on dips / stop triggers</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* 3. Target Price Input & Quick Offset Pills */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">Target Price (₹)</label>
                  {currentStock && numTargetPrice > 0 && (
                    <span
                      className={`text-[11px] font-mono font-bold ${
                        priceDifference >= 0 ? 'text-[#00E676]' : 'text-[#FF5252]'
                      }`}
                    >
                      {priceDifference >= 0 ? '+' : ''}
                      {formatINR(priceDifference)} ({percentDifference >= 0 ? '+' : ''}
                      {percentDifference.toFixed(2)}% from LTP)
                    </span>
                  )}
                </div>

                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold text-sm">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="0.05"
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(e.target.value)}
                    placeholder="Enter target price"
                    className="w-full bg-[#161B26] border border-slate-700 rounded-xl pl-8 pr-4 py-2.5 text-sm font-mono font-bold text-white focus:outline-hidden focus:border-[#6C5CE7] transition-all"
                    required
                  />
                </div>

                {/* Quick Percentage Offset Chips */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[10px] text-slate-500 font-semibold mr-1">Quick:</span>
                  {condition === 'ABOVE' ? (
                    <>
                      {[0.5, 1.0, 2.0, 3.5, 5.0].map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => handlePercentOffset(pct)}
                          className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[10px] font-mono text-emerald-400 hover:bg-emerald-950/40 hover:border-emerald-500/40 transition-all"
                        >
                          +{pct}%
                        </button>
                      ))}
                    </>
                  ) : (
                    <>
                      {[-0.5, -1.0, -2.0, -3.5, -5.0].map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => handlePercentOffset(pct)}
                          className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[10px] font-mono text-rose-400 hover:bg-rose-950/40 hover:border-rose-500/40 transition-all"
                        >
                          {pct}%
                        </button>
                      ))}
                    </>
                  )}
                </div>
              </div>

              {/* 4. Optional Custom Note */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Custom Strategy Note <span className="text-slate-500 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Take profit 50%, Buy 20 shares dip, Breakout retest"
                  className="w-full bg-[#161B26] border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-[#6C5CE7] transition-all"
                />
              </div>

              {/* Feedback messages */}
              {feedbackMsg && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    feedbackMsg.type === 'success'
                      ? 'bg-emerald-950/30 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-950/30 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{feedbackMsg.text}</span>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#6C5CE7] to-[#00E676] hover:opacity-95 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#6C5CE7]/20 transition-all active:scale-95"
                >
                  <Bell className="w-4 h-4 text-slate-950" />
                  <span>
                    Set Alert for {currentStock?.symbol} at {formatINR(numTargetPrice || 0)}
                  </span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: ACTIVE & TRIGGERED ALERTS LIST */}
          {activeTab === 'LIST' && (
            <div className="space-y-4">
              
              {/* Active Alerts Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#00E676] animate-pulse" />
                    <span>Active Monitoring ({activeAlerts.length})</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Scanned on every market tick
                  </span>
                </div>

                {activeAlerts.map((alert) => {
                  const stock = stocks.find((s) => s.symbol === alert.symbol);
                  const ltp = stock ? stock.price : alert.createdPrice;
                  const diff = alert.targetPrice - ltp;
                  const diffPct = ltp > 0 ? (diff / ltp) * 100 : 0;
                  const isRising = alert.condition === 'ABOVE';

                  return (
                    <div
                      key={alert.id}
                      className="p-3.5 rounded-2xl bg-[#161B26] border border-slate-800 space-y-2.5 relative group hover:border-slate-700 transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white text-sm">{alert.symbol}</span>
                            <span
                              className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider ${
                                isRising
                                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                              }`}
                            >
                              {isRising ? 'Rises Above' : 'Falls Below'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400">{alert.stockName}</p>
                          {alert.note && (
                            <p className="text-[10px] text-indigo-300 italic mt-0.5">
                              "{alert.note}"
                            </p>
                          )}
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] text-slate-500 block">Target Price</span>
                          <span className="text-sm font-mono font-bold text-white">
                            {formatINR(alert.targetPrice)}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                            LTP: {formatINR(ltp)}
                          </span>
                        </div>
                      </div>

                      {/* Distance metric */}
                      <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
                        <span className="text-slate-400">Distance to trigger:</span>
                        <span
                          className={`font-bold ${
                            Math.abs(diffPct) < 1.0 ? 'text-amber-400 animate-pulse' : 'text-slate-200'
                          }`}
                        >
                          {formatINR(Math.abs(diff))} ({Math.abs(diffPct).toFixed(2)}% away)
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-xs">
                        <span className="text-[10px] text-slate-500">
                          Set at {alert.createdAt}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {/* Test Trigger Button */}
                          <button
                            type="button"
                            onClick={() => testTriggerAlert(alert.id)}
                            className="px-2 py-1 rounded-lg bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-300 border border-indigo-500/30 text-[10px] font-semibold flex items-center gap-1 transition-all active:scale-95"
                            title="Test fire browser notification and chime now"
                          >
                            <Play className="w-2.5 h-2.5" />
                            <span>Test Alert</span>
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => removePriceAlert(alert.id)}
                            className="p-1 rounded-lg bg-slate-900 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition-colors"
                            title="Delete Alert"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {activeAlerts.length === 0 && (
                  <div className="p-6 text-center text-slate-500 text-xs bg-slate-900/40 rounded-2xl border border-slate-800/60 space-y-1">
                    <p className="font-semibold text-slate-400">No Active Alerts</p>
                    <p className="text-[11px]">
                      Switch to "Set New Alert" to create custom price targets for any stock.
                    </p>
                  </div>
                )}
              </div>

              {/* Triggered Alerts History Section */}
              {triggeredAlerts.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-800/80">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                    <span>Triggered Alerts ({triggeredAlerts.length})</span>
                    <span className="text-[10px] text-emerald-400 font-mono">Notification sent</span>
                  </div>

                  {triggeredAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="p-3 rounded-2xl bg-emerald-950/15 border border-emerald-500/20 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#00E676]" />
                          <span className="font-bold text-white">{alert.symbol}</span>
                          <span className="text-[10px] font-mono text-emerald-400">
                            Target {formatINR(alert.targetPrice)} Hit
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          Triggered at {alert.triggeredAt || 'Market Tick'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => resetPriceAlert(alert.id)}
                          className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold flex items-center gap-1 transition-colors"
                          title="Re-activate this alert"
                        >
                          <RotateCcw className="w-3 h-3 text-indigo-400" />
                          <span>Reactivate</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => removePriceAlert(alert.id)}
                          className="p-1 rounded-lg text-slate-500 hover:text-rose-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>Dual Trigger: Local Audio Chime + Browser Notification</span>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition-colors"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
