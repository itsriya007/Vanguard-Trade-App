import React, { useState } from 'react';
import { Stock } from '../types';
import { useTrading } from '../context/TradingContext';
import {
  X,
  TrendingUp,
  TrendingDown,
  Info,
  BarChart2,
  Activity,
  Layers,
  ShieldAlert,
  Bell,
} from 'lucide-react';
import { formatINR, formatCompactINR } from '../utils/formatters';

interface StockDetailModalProps {
  stock: Stock;
  onClose: () => void;
}

export const StockDetailModal: React.FC<StockDetailModalProps> = ({ stock, onClose }) => {
  const { mode, openOrderSheet, lastUpdatedTick, openPriceAlertModal, priceAlerts } = useTrading();
  const [timeframe, setTimeframe] = useState<'1D' | '1W' | '1M' | '1Y' | '5Y'>('1D');
  const [chartType, setChartType] = useState<'area' | 'candle'>('area');
  const [activeTab, setActiveTab] = useState<'chart' | 'depth' | 'technicals'>('chart');
  const [showTooltip, setShowTooltip] = useState<string | null>(null);

  const isPositive = stock.change >= 0;
  const isTickActive = lastUpdatedTick?.symbol === stock.symbol;

  // Generate synthetic chart data points based on timeframe
  const getPoints = () => {
    const base = stock.price;
    const count = timeframe === '1D' ? 14 : timeframe === '1W' ? 20 : 25;
    const variance = timeframe === '1D' ? 0.015 : timeframe === '1W' ? 0.04 : 0.12;

    const points: number[] = [];
    let cur = base * (1 - (isPositive ? 0.02 : -0.02));
    for (let i = 0; i < count; i++) {
      cur += (Math.random() - 0.48) * (base * variance);
      points.push(cur);
    }
    points[points.length - 1] = stock.price;
    return points;
  };

  const chartPoints = getPoints();
  const minVal = Math.min(...chartPoints);
  const maxVal = Math.max(...chartPoints);
  const range = maxVal - minVal || 1;

  // SVG path coordinates
  const svgWidth = 360;
  const svgHeight = 160;
  const coordinates = chartPoints.map((val, idx) => {
    const x = (idx / (chartPoints.length - 1)) * svgWidth;
    const y = svgHeight - 15 - ((val - minVal) / range) * (svgHeight - 30);
    return `${x},${y}`;
  });

  const linePath = `M ${coordinates.join(' L ')}`;
  const areaPath = `M 0,${svgHeight} L ${coordinates.join(' L ')} L ${svgWidth},${svgHeight} Z`;

  // 52W range progress
  const range52 = stock.week52High - stock.week52Low || 1;
  const current52Pos = Math.min(100, Math.max(0, ((stock.price - stock.week52Low) / range52) * 100));

  // Buyer vs Seller ratio
  const totalDepth = stock.depth.totalBidQty + stock.depth.totalAskQty || 1;
  const bidRatio = Math.round((stock.depth.totalBidQty / totalDepth) * 100);
  const askRatio = 100 - bidRatio;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full sm:max-w-lg bg-[#161B26] border border-slate-800 rounded-t-3xl sm:rounded-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-6 duration-200">
        
        {/* Top Header */}
        <div className="p-4 border-b border-slate-800/80 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-white tracking-tight">{stock.symbol}</h2>
              <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                {stock.exchange}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                {stock.category}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{stock.name}</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div
                className={`text-lg font-mono font-bold transition-colors ${
                  isTickActive
                    ? lastUpdatedTick?.direction === 'up'
                      ? 'text-[#00E676]'
                      : 'text-[#FF5252]'
                    : 'text-white'
                }`}
              >
                {formatINR(stock.price)}
              </div>
              <div
                className={`flex items-center justify-end text-xs font-mono font-semibold ${
                  isPositive ? 'text-[#00E676]' : 'text-[#FF5252]'
                }`}
              >
                {isPositive ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
                {isPositive ? '+' : ''}{stock.change.toFixed(2)} ({isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%)
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => openPriceAlertModal(stock)}
                className={`p-2 rounded-xl border transition-all ${
                  priceAlerts.some((a) => a.symbol === stock.symbol && a.isActive && !a.isTriggered)
                    ? 'bg-emerald-950/50 border-[#00E676]/50 text-[#00E676]'
                    : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-[#00E676] border-slate-700/60'
                }`}
                title={`Set Price Alert for ${stock.symbol}`}
              >
                <Bell className="w-4 h-4" />
              </button>

              <button
                onClick={onClose}
                className="p-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center border-b border-slate-800/80 bg-slate-900/60 px-4">
          <button
            onClick={() => setActiveTab('chart')}
            className={`flex items-center gap-1.5 py-2.5 px-3 text-xs font-medium border-b-2 transition-all ${
              activeTab === 'chart'
                ? 'border-[#6C5CE7] text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Interactive Chart</span>
          </button>
          <button
            onClick={() => setActiveTab('depth')}
            className={`flex items-center gap-1.5 py-2.5 px-3 text-xs font-medium border-b-2 transition-all ${
              activeTab === 'depth'
                ? 'border-[#6C5CE7] text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Market Depth (L2)</span>
          </button>
          <button
            onClick={() => setActiveTab('technicals')}
            className={`flex items-center gap-1.5 py-2.5 px-3 text-xs font-medium border-b-2 transition-all ${
              activeTab === 'technicals'
                ? 'border-[#6C5CE7] text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Signals & Ratios</span>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* TAB 1: CHART */}
          {activeTab === 'chart' && (
            <div>
              {/* Timeframe & Chart Style Bar */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center bg-slate-900/90 rounded-lg p-0.5 border border-slate-800">
                  {(['1D', '1W', '1M', '1Y', '5Y'] as const).map((tf) => (
                    <button
                      key={tf}
                      onClick={() => setTimeframe(tf)}
                      className={`px-2.5 py-1 text-[11px] font-mono rounded-md font-medium transition-all ${
                        timeframe === tf
                          ? 'bg-[#6C5CE7] text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1 bg-slate-900/90 rounded-lg p-0.5 border border-slate-800 text-[11px]">
                  <button
                    onClick={() => setChartType('area')}
                    className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                      chartType === 'area' ? 'bg-slate-700 text-white' : 'text-slate-400'
                    }`}
                  >
                    Area
                  </button>
                  <button
                    onClick={() => setChartType('candle')}
                    className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                      chartType === 'candle' ? 'bg-slate-700 text-white' : 'text-slate-400'
                    }`}
                  >
                    Candles
                  </button>
                </div>
              </div>

              {/* Chart Canvas */}
              <div className="w-full bg-slate-950/80 rounded-xl p-3 border border-slate-800/80 relative">
                <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 mb-2">
                  <span>High: {formatINR(maxVal)}</span>
                  <span>Low: {formatINR(minVal)}</span>
                </div>

                {chartType === 'area' ? (
                  <svg className="w-full h-40 overflow-visible" viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
                    <defs>
                      <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={isPositive ? '#00E676' : '#FF5252'} stopOpacity="0.35" />
                        <stop offset="100%" stopColor={isPositive ? '#00E676' : '#FF5252'} stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Grid lines */}
                    <line x1="0" y1={svgHeight * 0.25} x2={svgWidth} y2={svgHeight * 0.25} stroke="rgba(255,255,255,0.05)" strokeDasharray="2 2" />
                    <line x1="0" y1={svgHeight * 0.5} x2={svgWidth} y2={svgHeight * 0.5} stroke="rgba(255,255,255,0.05)" strokeDasharray="2 2" />
                    <line x1="0" y1={svgHeight * 0.75} x2={svgWidth} y2={svgHeight * 0.75} stroke="rgba(255,255,255,0.05)" strokeDasharray="2 2" />

                    <path d={areaPath} fill="url(#chartGradient)" />
                    <path
                      d={linePath}
                      fill="none"
                      stroke={isPositive ? '#00E676' : '#FF5252'}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />

                    {/* Pulsing current price point */}
                    {coordinates.length > 0 && (() => {
                      const lastCoord = coordinates[coordinates.length - 1].split(',');
                      return (
                        <circle
                          cx={lastCoord[0]}
                          cy={lastCoord[1]}
                          r="4"
                          fill={isPositive ? '#00E676' : '#FF5252'}
                          className="animate-ping"
                        />
                      );
                    })()}
                  </svg>
                ) : (
                  /* Candlestick Mock Simulation */
                  <div className="h-40 flex items-end justify-between px-2 pt-4">
                    {chartPoints.slice(-14).map((pt, i) => {
                      const prev = i > 0 ? chartPoints.slice(-14)[i - 1] : pt;
                      const candleIsGreen = pt >= prev;
                      const height = Math.max(12, Math.abs(pt - prev) * 6);
                      return (
                        <div key={i} className="flex flex-col items-center flex-1">
                          <div
                            className={`w-0.5 ${candleIsGreen ? 'bg-[#00E676]' : 'bg-[#FF5252]'}`}
                            style={{ height: `${height + 8}px` }}
                          />
                          <div
                            className={`w-3 rounded-xs ${candleIsGreen ? 'bg-[#00E676]' : 'bg-[#FF5252]'}`}
                            style={{ height: `${height}px` }}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 mt-2 pt-2 border-t border-slate-900">
                  <span>09:15 AM</span>
                  <span>11:30 AM</span>
                  <span>01:30 PM</span>
                  <span>03:30 PM</span>
                </div>
              </div>

              {/* 52-Week Range Bar */}
              <div className="mt-4 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                  <span>52W Low: <strong className="text-white font-mono">{formatINR(stock.week52Low)}</strong></span>
                  <span>52W High: <strong className="text-white font-mono">{formatINR(stock.week52High)}</strong></span>
                </div>
                <div className="relative w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-red-500 via-amber-400 to-[#00E676] rounded-full"
                    style={{ width: '100%' }}
                  />
                  <div
                    className="absolute top-0 bottom-0 w-1.5 bg-white shadow ring-2 ring-white/50"
                    style={{ left: `${current52Pos}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MARKET DEPTH (LEVEL 2 ORDER BOOK) */}
          {activeTab === 'depth' && (
            <div className="space-y-3">
              {mode === 'beginner' && (
                <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-xl p-3 text-xs text-indigo-300 flex items-start gap-2">
                  <Info className="w-4 h-4 text-[#6C5CE7] shrink-0 mt-0.5" />
                  <div>
                    <strong>Beginner Note:</strong> Market Depth shows the 5 best real-time bids (buyers) vs asks (sellers) waiting in exchange queues. A larger green bar means stronger buying support.
                  </div>
                </div>
              )}

              {/* Buyer vs Seller Proportion Bar */}
              <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-800">
                <div className="flex justify-between text-xs font-mono mb-1.5">
                  <span className="text-[#00E676] font-semibold">Total Bids: {stock.depth.totalBidQty.toLocaleString('en-IN')} ({bidRatio}%)</span>
                  <span className="text-[#FF5252] font-semibold">Total Asks: {stock.depth.totalAskQty.toLocaleString('en-IN')} ({askRatio}%)</span>
                </div>
                <div className="h-2 w-full flex rounded-full overflow-hidden">
                  <div className="bg-[#00E676] transition-all duration-300" style={{ width: `${bidRatio}%` }} />
                  <div className="bg-[#FF5252] transition-all duration-300" style={{ width: `${askRatio}%` }} />
                </div>
              </div>

              {/* 5-Depth Ladder Table */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                {/* BID SIDE */}
                <div className="bg-emerald-950/15 border border-emerald-900/30 rounded-xl p-2.5">
                  <div className="flex justify-between text-[11px] text-emerald-400 font-bold border-b border-emerald-900/40 pb-1.5 mb-1.5">
                    <span>Orders</span>
                    <span>Qty</span>
                    <span>Bid (₹)</span>
                  </div>
                  <div className="space-y-1">
                    {stock.depth.bids.map((b, i) => (
                      <div key={i} className="flex justify-between text-slate-300 text-[11px]">
                        <span className="text-slate-500">{b.orders}</span>
                        <span>{b.qty}</span>
                        <span className="text-[#00E676] font-semibold">{b.price.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ASK SIDE */}
                <div className="bg-rose-950/15 border border-rose-900/30 rounded-xl p-2.5">
                  <div className="flex justify-between text-[11px] text-rose-400 font-bold border-b border-rose-900/40 pb-1.5 mb-1.5">
                    <span>Ask (₹)</span>
                    <span>Qty</span>
                    <span>Orders</span>
                  </div>
                  <div className="space-y-1">
                    {stock.depth.asks.map((a, i) => (
                      <div key={i} className="flex justify-between text-slate-300 text-[11px]">
                        <span className="text-[#FF5252] font-semibold">{a.price.toFixed(2)}</span>
                        <span>{a.qty}</span>
                        <span className="text-slate-500">{a.orders}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Circuit Limits */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-400">Lower Circuit:</span>
                  <span className="text-[#FF5252] font-bold">{formatINR(stock.lowerCircuit)}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-400">Upper Circuit:</span>
                  <span className="text-[#00E676] font-bold">{formatINR(stock.upperCircuit)}</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TECHNICALS & FUNDAMENTALS */}
          {activeTab === 'technicals' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800">
                  <div className="text-slate-400 text-[11px]">RSI (14)</div>
                  <div className="text-base font-bold font-mono text-white mt-1">
                    {stock.technical.rsi}{' '}
                    <span
                      className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                        stock.technical.rsi > 70
                          ? 'bg-red-500/20 text-red-400'
                          : stock.technical.rsi < 35
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {stock.technical.rsi > 70 ? 'Overbought' : stock.technical.rsi < 35 ? 'Oversold' : 'Neutral'}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800">
                  <div className="text-slate-400 text-[11px]">VWAP</div>
                  <div className="text-base font-bold font-mono text-indigo-400 mt-1">
                    {formatINR(stock.technical.vwap)}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800">
                  <div className="text-slate-400 text-[11px]">Market Cap</div>
                  <div className="text-base font-bold font-mono text-white mt-1">
                    {formatCompactINR(stock.marketCap * 10000000)}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800">
                  <div className="text-slate-400 text-[11px]">P/E Ratio</div>
                  <div className="text-base font-bold font-mono text-white mt-1">
                    {stock.peRatio.toFixed(1)}x
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800">
                  <div className="text-slate-400 text-[11px]">Volume Today</div>
                  <div className="text-base font-bold font-mono text-white mt-1">
                    {stock.volume.toLocaleString('en-IN')}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800">
                  <div className="text-slate-400 text-[11px]">Pivot Point</div>
                  <div className="text-base font-bold font-mono text-white mt-1">
                    {formatINR(stock.technical.pivot)}
                  </div>
                </div>
              </div>

              {/* Safety notice in Beginner Mode */}
              {mode === 'beginner' && (
                <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong>Risk Tip:</strong> Never risk more than 1-2% of your total capital on a single stock trade. Use Stop-Loss orders for intraday safety.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sticky Bottom Buy / Sell Action Bar */}
        <div className="p-3.5 bg-slate-950 border-t border-slate-800 grid grid-cols-2 gap-3">
          <button
            onClick={() => {
              onClose();
              openOrderSheet(stock, 'BUY');
            }}
            className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-[#00E676] hover:bg-[#00c864] text-slate-950 shadow-lg shadow-[#00E676]/25 transition-all transform active:scale-95 flex items-center justify-center gap-1.5"
          >
            <span>BUY</span>
            <span className="font-mono text-xs opacity-85">@ {formatINR(stock.price)}</span>
          </button>

          <button
            onClick={() => {
              onClose();
              openOrderSheet(stock, 'SELL');
            }}
            className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-[#FF5252] hover:bg-[#e04343] text-white shadow-lg shadow-[#FF5252]/25 transition-all transform active:scale-95 flex items-center justify-center gap-1.5"
          >
            <span>SELL</span>
            <span className="font-mono text-xs opacity-85">@ {formatINR(stock.price)}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
