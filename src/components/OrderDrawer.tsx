import React, { useState, useMemo } from 'react';
import { useTrading } from '../context/TradingContext';
import { Stock, ProductType, OrderType, TransactionType } from '../types';
import {
  X,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Info,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { calculateBrokerageAndCharges, formatINR } from '../utils/formatters';

interface OrderDrawerProps {
  stock: Stock;
  initialType: TransactionType;
  onClose: () => void;
}

export const OrderDrawer: React.FC<OrderDrawerProps> = ({ stock, initialType, onClose }) => {
  const { mode, placeOrder, cashBalance, openConfirmationModal } = useTrading();

  const [txType, setTxType] = useState<TransactionType>(initialType);
  const [product, setProduct] = useState<ProductType>('CNC');
  const [orderType, setOrderType] = useState<OrderType>('MARKET');
  const [quantity, setQuantity] = useState<number>(mode === 'beginner' ? 1 : 10);
  const [limitPrice, setLimitPrice] = useState<number>(stock.price);
  const [triggerPrice, setTriggerPrice] = useState<number>(Number((stock.price * 0.98).toFixed(2)));
  const [showBrokerageBreakdown, setShowBrokerageBreakdown] = useState<boolean>(true);
  const [acknowledgedRisk, setAcknowledgedRisk] = useState<boolean>(false);

  const effectivePrice = orderType === 'MARKET' ? stock.price : limitPrice;

  // Real-time pre-trade charges computation
  const charges = useMemo(() => {
    return calculateBrokerageAndCharges({
      price: effectivePrice,
      quantity,
      product,
      isBuy: txType === 'BUY',
    });
  }, [effectivePrice, quantity, product, txType]);

  // Margin calculation: CNC is 1x, MIS is 5x leverage (20% margin), MTF is 4x leverage (25% margin)
  const marginRequired = useMemo(() => {
    if (txType === 'SELL' && product === 'CNC') return 0;
    if (product === 'CNC') return charges.netAmount;
    if (product === 'MIS') return charges.netAmount * 0.20;
    return charges.netAmount * 0.25; // MTF
  }, [charges.netAmount, product, txType]);

  const hasSufficientMargin = txType === 'SELL' || cashBalance >= marginRequired;

  const handleSubmitOrder = () => {
    // If high leverage intraday trade in Beginner mode and risk not acknowledged, prompt user
    if ((product === 'MIS' || product === 'MTF') && mode === 'beginner' && !acknowledgedRisk) {
      setAcknowledgedRisk(true);
      return;
    }

    // Trigger pre-operation safety verification pop-up modal
    openConfirmationModal({
      title: `Confirm ${txType} Order`,
      description: `Please review your order specifications before sending to the National Stock Exchange (NSE).`,
      confirmLabel: `Authorize & Place ${txType} Order`,
      confirmVariant: txType === 'BUY' ? 'success' : 'danger',
      educationalTip:
        mode === 'beginner'
          ? product === 'CNC'
            ? '🌟 Zero Brokerage Delivery: You are purchasing actual shares that will be safely credited to your CDSL Demat account. No rush to sell!'
            : '⚠️ Intraday Warning: MIS trades must be manually closed or will be automatically squared off at 3:20 PM today.'
          : undefined,
      details: [
        { label: 'Company / Symbol', value: `${stock.name} (${stock.symbol})` },
        { label: 'Action & Type', value: `${txType} • ${orderType}` },
        {
          label: 'Product Segment',
          value:
            product === 'CNC'
              ? 'Delivery (CNC) - Long Term Demat'
              : product === 'MIS'
              ? 'Intraday (MIS) - 5x Leverage'
              : 'Margin (MTF) - 4x Leverage',
        },
        { label: 'Number of Shares', value: `${quantity} Share(s)`, highlight: true },
        {
          label: 'Price per Share',
          value: orderType === 'MARKET' ? `Market (~${formatINR(stock.price)})` : formatINR(limitPrice),
        },
        { label: 'Total Order Value', value: formatINR(effectivePrice * quantity), highlight: true },
        {
          label: 'Brokerage Fee',
          value: product === 'CNC' ? '₹0.00 (Zero Delivery Brokerage)' : formatINR(charges.brokerage),
        },
        { label: 'Govt Taxes & SEBI Fee', value: formatINR(charges.totalCharges - charges.brokerage) },
      ],
      onConfirm: () => {
        const success = placeOrder({
          symbol: stock.symbol,
          type: txType,
          product,
          orderType,
          quantity,
          price: effectivePrice,
          triggerPrice: orderType === 'SL' || orderType === 'SL_M' ? triggerPrice : undefined,
        });

        if (success) {
          onClose();
        }
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full sm:max-w-md bg-[#161B26] border-t border-x sm:border border-slate-800 rounded-t-3xl sm:rounded-2xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-200">
        
        {/* Top Header with Buy/Sell Toggle */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setTxType('BUY')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  txType === 'BUY'
                    ? 'bg-[#00E676] text-slate-950 shadow-md shadow-[#00E676]/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                BUY
              </button>
              <button
                onClick={() => setTxType('SELL')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  txType === 'SELL'
                    ? 'bg-[#FF5252] text-white shadow-md shadow-[#FF5252]/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                SELL
              </button>
            </div>

            <div>
              <h3 className="font-bold text-white text-sm">{stock.symbol}</h3>
              <p className="text-[10px] text-slate-400 font-mono">LTP {formatINR(stock.price)}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Order Form */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {/* Beginner Guidance Pill */}
          {mode === 'beginner' && (
            <div className="p-3 rounded-2xl bg-gradient-to-r from-indigo-950/70 via-slate-900 to-indigo-950/70 border border-indigo-500/30 text-xs space-y-1.5">
              <div className="flex items-center justify-between text-indigo-300 font-bold">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#00E676]" />
                  <span>Beginner Safe Investing</span>
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-[#00E676] px-2 py-0.5 rounded-full font-mono font-bold">
                  ₹0 BROKERAGE
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {stock.beginnerInsight?.whyInvest ||
                  `You are purchasing shares of ${stock.name}. With Delivery (CNC), you own the stock permanently in your Demat account with zero time pressure.`}
              </p>
            </div>
          )}
          
          {/* Product Type Selector */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-slate-300">Product</label>
              {mode === 'beginner' && (
                <span className="text-[10px] text-indigo-400 flex items-center gap-0.5">
                  <Info className="w-3 h-3" /> Tap badges for info
                </span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'CNC', label: 'Delivery (CNC)', desc: 'Buy & hold long term, ₹0 brokerage' },
                { id: 'MIS', label: 'Intraday (MIS)', desc: 'Auto square-off 3:20 PM, 5x leverage' },
                { id: 'MTF', label: 'Margin (MTF)', desc: '4x buying power with low interest' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setProduct(item.id as ProductType)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    product === item.id
                      ? 'bg-[#6C5CE7]/15 border-[#6C5CE7] text-white'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="text-xs font-bold leading-tight">{item.label}</div>
                  <div className="text-[9px] text-slate-400 mt-1 leading-snug">{item.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* High Leverage Margin Risk Warning for Intraday MIS / MTF */}
          {(product === 'MIS' || product === 'MTF') && (
            <div className="p-3 rounded-xl bg-amber-950/25 border border-amber-500/30 text-xs text-amber-300 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-amber-400">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Margin Risk Notice (5x Leverage)</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-200/90">
                Intraday positions are subject to volatile price swings. Vanguard Trade auto-squares off unclosed MIS positions at <strong>03:20 PM IST</strong>. Maintain a Stop-Loss to safeguard capital.
              </p>
            </div>
          )}

          {/* Order Type Selector */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Order Type</label>
            <div className="grid grid-cols-3 gap-2">
              {(['MARKET', 'LIMIT', 'SL'] as OrderType[]).map((ot) => (
                <button
                  key={ot}
                  onClick={() => setOrderType(ot)}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                    orderType === ot
                      ? 'bg-slate-800 border-slate-600 text-white shadow-sm'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {ot === 'MARKET' ? 'Market' : ot === 'LIMIT' ? 'Limit Price' : 'Stop-Loss (SL)'}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity Stepper & Quick Multipliers */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-slate-300">Quantity (Shares)</label>
              <span className="text-[10px] font-mono text-slate-400">
                Lot size: 1 share
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 10))}
                className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white font-bold text-base"
              >
                -
              </button>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="flex-1 h-10 bg-slate-900 border border-slate-800 rounded-xl px-3 font-mono font-bold text-center text-white text-sm focus:outline-hidden focus:border-[#6C5CE7]"
              />
              <button
                onClick={() => setQuantity((q) => q + 10)}
                className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white font-bold text-base"
              >
                +
              </button>
            </div>

            {/* Quick Multiplier Badges */}
            <div className="flex items-center gap-1.5 mt-2">
              {[10, 25, 50, 100, 250].map((qtyVal) => (
                <button
                  key={qtyVal}
                  onClick={() => setQuantity(qtyVal)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-mono font-medium border ${
                    quantity === qtyVal
                      ? 'bg-[#6C5CE7]/20 border-[#6C5CE7] text-white'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-300'
                  }`}
                >
                  +{qtyVal}
                </button>
              ))}
            </div>
          </div>

          {/* Price Input (if Limit or SL) */}
          {orderType !== 'MARKET' && (
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Limit Price (₹)
              </label>
              <input
                type="number"
                step="0.05"
                value={limitPrice}
                onChange={(e) => setLimitPrice(parseFloat(e.target.value) || stock.price)}
                className="w-full h-10 bg-slate-900 border border-slate-800 rounded-xl px-3 font-mono font-bold text-white text-sm focus:outline-hidden focus:border-[#6C5CE7]"
              />
            </div>
          )}

          {/* Trigger Price Input (if SL) */}
          {orderType === 'SL' && (
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Trigger Stop-Loss Price (₹)
              </label>
              <input
                type="number"
                step="0.05"
                value={triggerPrice}
                onChange={(e) => setTriggerPrice(parseFloat(e.target.value) || 0)}
                className="w-full h-10 bg-slate-900 border border-slate-800 rounded-xl px-3 font-mono font-bold text-white text-sm focus:outline-hidden focus:border-[#FF5252]"
              />
            </div>
          )}

          {/* PRE-TRADE TRANSPARENCY DRAWER (Smart Brokerage Calculator) */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5">
            <button
              onClick={() => setShowBrokerageBreakdown(!showBrokerageBreakdown)}
              className="w-full flex items-center justify-between text-xs font-semibold text-slate-200"
            >
              <div className="flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-[#6C5CE7]" />
                <span>Statutory & Brokerage Charges Breakdown</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
                <span>{formatINR(charges.totalCharges)}</span>
                {showBrokerageBreakdown ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </div>
            </button>

            {showBrokerageBreakdown && (
              <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-1.5 text-[11px] font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>Turnover:</span>
                  <span className="text-white">{formatINR(charges.turnover)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Brokerage:</span>
                  <span className="text-emerald-400 font-semibold">
                    {charges.brokerage === 0 ? '₹0.00 (Zero Delivery)' : formatINR(charges.brokerage)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>STT (Securities Transaction Tax):</span>
                  <span className="text-white">{formatINR(charges.stt)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Exchange Turnover Fee (NSE):</span>
                  <span className="text-white">{formatINR(charges.exchangeFee)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>SEBI Turnover Charge:</span>
                  <span className="text-white">{formatINR(charges.sebiFee)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Stamp Duty:</span>
                  <span className="text-white">{formatINR(charges.stampDuty)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>GST (18% on fees):</span>
                  <span className="text-white">{formatINR(charges.gst)}</span>
                </div>

                <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-xs">
                  <span className="text-indigo-300">Breakeven Per Share:</span>
                  <span className="text-indigo-300 font-mono">
                    +{formatINR(charges.breakevenPerShare)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Available Cash & Required Margin Indicator */}
          <div className="flex justify-between items-center text-xs px-1">
            <span className="text-slate-400">
              Available Cash: <strong className="text-white font-mono">{formatINR(cashBalance)}</strong>
            </span>
            <span className="text-slate-400">
              Margin Needed: <strong className="text-[#6C5CE7] font-mono">{formatINR(marginRequired)}</strong>
            </span>
          </div>

          {!hasSufficientMargin && (
            <div className="p-2.5 rounded-xl bg-red-950/30 border border-red-500/30 text-xs text-red-300 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>Insufficient funds in wallet to cover required margin.</span>
            </div>
          )}
        </div>

        {/* Sticky Confirm Button */}
        <div className="p-4 bg-slate-950 border-t border-slate-800">
          <button
            onClick={handleSubmitOrder}
            disabled={!hasSufficientMargin}
            className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm shadow-xl flex items-center justify-center gap-2 transition-all transform active:scale-95 disabled:opacity-40 disabled:pointer-events-none ${
              txType === 'BUY'
                ? 'bg-[#00E676] hover:bg-[#00c864] text-slate-950 shadow-[#00E676]/25'
                : 'bg-[#FF5252] hover:bg-[#e04343] text-white shadow-[#FF5252]/25'
            }`}
          >
            {acknowledgedRisk ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm & Place {txType} Order</span>
              </>
            ) : (
              <>
                <span>
                  {txType} {quantity} {stock.symbol} ({product})
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
