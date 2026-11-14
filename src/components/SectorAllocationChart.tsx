import React, { useState, useMemo } from 'react';
import { Holding, Stock, MarketMode } from '../types';
import { formatINR } from '../utils/formatters';
import {
  PieChart as PieChartIcon,
  Layers,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Info,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface SectorAllocationChartProps {
  holdings: Holding[];
  stocks: Stock[];
  mode: MarketMode;
}

export interface SectorData {
  sector: string;
  color: string;
  badgeBg: string;
  badgeBorder: string;
  value: number;
  invested: number;
  pnl: number;
  pnlPercent: number;
  percentage: number;
  stocks: {
    symbol: string;
    stockName: string;
    quantity: number;
    value: number;
    pnl: number;
    pnlPercent: number;
  }[];
}

// Map stock symbols to Indian equity sectors
const STOCK_SECTOR_MAP: Record<string, { sector: string; color: string; badgeBg: string; badgeBorder: string }> = {
  RELIANCE: {
    sector: 'Energy & Conglomerate',
    color: '#F59E0B', // Amber
    badgeBg: 'rgba(245, 158, 11, 0.12)',
    badgeBorder: 'rgba(245, 158, 11, 0.3)',
  },
  TCS: {
    sector: 'Information Tech (IT)',
    color: '#6C5CE7', // Electric Indigo
    badgeBg: 'rgba(108, 92, 231, 0.12)',
    badgeBorder: 'rgba(108, 92, 231, 0.3)',
  },
  INFY: {
    sector: 'Information Tech (IT)',
    color: '#6C5CE7',
    badgeBg: 'rgba(108, 92, 231, 0.12)',
    badgeBorder: 'rgba(108, 92, 231, 0.3)',
  },
  TATAMOTORS: {
    sector: 'Automobile & EV',
    color: '#00E676', // Neon Mint
    badgeBg: 'rgba(0, 230, 118, 0.12)',
    badgeBorder: 'rgba(0, 230, 118, 0.3)',
  },
  PAYTM: {
    sector: 'Fintech & Digital Payments',
    color: '#EC4899', // Pink
    badgeBg: 'rgba(236, 72, 153, 0.12)',
    badgeBorder: 'rgba(236, 72, 153, 0.3)',
  },
  ZOMATO: {
    sector: 'Consumer Tech & Quick Commerce',
    color: '#06B6D4', // Cyan
    badgeBg: 'rgba(6, 182, 212, 0.12)',
    badgeBorder: 'rgba(6, 182, 212, 0.3)',
  },
  SWIGGY: {
    sector: 'Consumer Tech & Quick Commerce',
    color: '#06B6D4',
    badgeBg: 'rgba(6, 182, 212, 0.12)',
    badgeBorder: 'rgba(6, 182, 212, 0.3)',
  },
  HDFCBANK: {
    sector: 'Banking & Financials',
    color: '#3B82F6', // Blue
    badgeBg: 'rgba(59, 130, 246, 0.12)',
    badgeBorder: 'rgba(59, 130, 246, 0.3)',
  },
  SBIN: {
    sector: 'Banking & Financials',
    color: '#3B82F6',
    badgeBg: 'rgba(59, 130, 246, 0.12)',
    badgeBorder: 'rgba(59, 130, 246, 0.3)',
  },
  ICICIBANK: {
    sector: 'Banking & Financials',
    color: '#3B82F6',
    badgeBg: 'rgba(59, 130, 246, 0.12)',
    badgeBorder: 'rgba(59, 130, 246, 0.3)',
  },
  ITC: {
    sector: 'FMCG & Consumer Goods',
    color: '#A855F7', // Purple
    badgeBg: 'rgba(168, 85, 247, 0.12)',
    badgeBorder: 'rgba(168, 85, 247, 0.3)',
  },
  WAAREE: {
    sector: 'Renewable Clean Energy',
    color: '#10B981', // Emerald
    badgeBg: 'rgba(16, 185, 129, 0.12)',
    badgeBorder: 'rgba(16, 185, 129, 0.3)',
  },
  BHARTIARTL: {
    sector: 'Telecommunications',
    color: '#F97316', // Orange
    badgeBg: 'rgba(249, 115, 22, 0.12)',
    badgeBorder: 'rgba(249, 115, 22, 0.3)',
  },
};

const DEFAULT_SECTOR_COLORS = [
  '#6C5CE7',
  '#00E676',
  '#06B6D4',
  '#F59E0B',
  '#EC4899',
  '#3B82F6',
  '#A855F7',
  '#10B981',
];

export const SectorAllocationChart: React.FC<SectorAllocationChartProps> = ({
  holdings,
  stocks,
  mode,
}) => {
  const [activeSectorIndex, setActiveSectorIndex] = useState<number | null>(null);
  const [chartType, setChartType] = useState<'donut' | 'pie'>('donut');
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  // Group holdings by sector
  const { sectorList, totalValue, totalInvested, maxSector } = useMemo(() => {
    const totalVal = holdings.reduce((sum, h) => sum + h.currentValue, 0);
    const totalInv = holdings.reduce((sum, h) => sum + h.investedValue, 0);

    const map = new Map<string, SectorData>();

    holdings.forEach((h, index) => {
      // Find sector info
      const mapped = STOCK_SECTOR_MAP[h.symbol];
      let sectorName = mapped?.sector;
      let sectorColor = mapped?.color;
      let badgeBg = mapped?.badgeBg;
      let badgeBorder = mapped?.badgeBorder;

      if (!sectorName) {
        // Fallback to stock category or generic
        const foundStock = stocks.find((s) => s.symbol === h.symbol);
        sectorName = foundStock?.category || 'Equities';
        const colorIdx = index % DEFAULT_SECTOR_COLORS.length;
        sectorColor = DEFAULT_SECTOR_COLORS[colorIdx];
        badgeBg = `${sectorColor}20`;
        badgeBorder = `${sectorColor}40`;
      }

      if (!map.has(sectorName)) {
        map.set(sectorName, {
          sector: sectorName,
          color: sectorColor,
          badgeBg: badgeBg || 'rgba(108, 92, 231, 0.15)',
          badgeBorder: badgeBorder || 'rgba(108, 92, 231, 0.3)',
          value: 0,
          invested: 0,
          pnl: 0,
          pnlPercent: 0,
          percentage: 0,
          stocks: [],
        });
      }

      const item = map.get(sectorName)!;
      item.value += h.currentValue;
      item.invested += h.investedValue;
      item.pnl += h.pnl;
      item.stocks.push({
        symbol: h.symbol,
        stockName: h.stockName,
        quantity: h.quantity,
        value: h.currentValue,
        pnl: h.pnl,
        pnlPercent: h.pnlPercent,
      });
    });

    const list: SectorData[] = Array.from(map.values()).map((sec) => {
      sec.percentage = totalVal > 0 ? (sec.value / totalVal) * 100 : 0;
      sec.pnlPercent = sec.invested > 0 ? (sec.pnl / sec.invested) * 100 : 0;
      return sec;
    });

    // Sort by largest value first
    list.sort((a, b) => b.value - a.value);

    const largest = list.length > 0 ? list[0] : null;

    return {
      sectorList: list,
      totalValue: totalVal,
      totalInvested: totalInv,
      maxSector: largest,
    };
  }, [holdings, stocks]);

  // SVG Geometry Constants
  const size = 260;
  const center = size / 2;
  const outerRadius = 100;
  const innerRadius = chartType === 'donut' ? 62 : 0;

  // Compute SVG Arc paths for Pie/Donut slices
  const slices = useMemo(() => {
    if (totalValue === 0 || sectorList.length === 0) return [];

    let currentAngle = -Math.PI / 2; // Start from top (12 o'clock)

    return sectorList.map((sec, idx) => {
      const sliceAngle = (sec.value / totalValue) * 2 * Math.PI;
      const startAngle = currentAngle;
      const endAngle = currentAngle + sliceAngle;
      currentAngle = endAngle;

      const isHovered = activeSectorIndex === idx;
      const offsetRadius = isHovered ? 6 : 0;

      // Center bisector angle for pop-out explosion effect on active slice
      const midAngle = (startAngle + endAngle) / 2;
      const offsetX = Math.cos(midAngle) * offsetRadius;
      const offsetY = Math.sin(midAngle) * offsetRadius;

      const x1 = center + offsetX + outerRadius * Math.cos(startAngle);
      const y1 = center + offsetY + outerRadius * Math.sin(startAngle);

      const x2 = center + offsetX + outerRadius * Math.cos(endAngle);
      const y2 = center + offsetY + outerRadius * Math.sin(endAngle);

      const largeArc = sliceAngle > Math.PI ? 1 : 0;

      let pathData = '';
      if (innerRadius === 0) {
        // Pure pie slice to center point
        pathData = `
          M ${center + offsetX} ${center + offsetY}
          L ${x1} ${y1}
          A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2} ${y2}
          Z
        `;
      } else {
        // Donut slice with inner radius
        const x3 = center + offsetX + innerRadius * Math.cos(endAngle);
        const y3 = center + offsetY + innerRadius * Math.sin(endAngle);

        const x4 = center + offsetX + innerRadius * Math.cos(startAngle);
        const y4 = center + offsetY + innerRadius * Math.sin(startAngle);

        pathData = `
          M ${x1} ${y1}
          A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2} ${y2}
          L ${x3} ${y3}
          A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4}
          Z
        `;
      }

      return {
        ...sec,
        index: idx,
        pathData,
        isHovered,
        midAngle,
      };
    });
  }, [sectorList, totalValue, activeSectorIndex, chartType, center, outerRadius, innerRadius]);

  const activeSector = activeSectorIndex !== null ? sectorList[activeSectorIndex] : null;

  // Diversification Rating Assessment
  const diversificationStatus = useMemo(() => {
    if (sectorList.length >= 4 && maxSector && maxSector.percentage <= 40) {
      return {
        level: 'Excellent',
        badge: 'text-[#00E676] bg-emerald-500/10 border-emerald-500/30',
        message: 'Well balanced across multiple uncorrelated sectors. Lower drawdown vulnerability.',
      };
    }
    if (sectorList.length >= 3 && maxSector && maxSector.percentage <= 55) {
      return {
        level: 'Moderate',
        badge: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
        message: `Concentrated in ${maxSector.sector} (${maxSector.percentage.toFixed(1)}%). Consider adding FMCG or Banking.`,
      };
    }
    return {
      level: 'Concentrated',
      badge: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
      message: 'High sector concentration risk. A drop in one industry can heavily impact portfolio value.',
    };
  }, [sectorList, maxSector]);

  if (holdings.length === 0) {
    return (
      <div className="p-4 rounded-3xl bg-[#161B26] border border-slate-800 text-center space-y-2">
        <PieChartIcon className="w-8 h-8 text-slate-500 mx-auto" />
        <h4 className="text-sm font-bold text-white">No Holdings to Display</h4>
        <p className="text-xs text-slate-400">
          Place Delivery (CNC) orders from the Watchlist to see your live sector asset allocation.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-gradient-to-br from-[#161B26] via-[#141923] to-[#0E121B] border border-slate-800 shadow-xl overflow-hidden">
      {/* Header Bar */}
      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <PieChartIcon className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-white leading-none">Sector Allocation</h3>
              <span
                className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${diversificationStatus.badge}`}
              >
                {diversificationStatus.level}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {sectorList.length} Sectors • {holdings.length} Companies
            </p>
          </div>
        </div>

        {/* View Controls */}
        <div className="flex items-center gap-1.5">
          {/* Chart Style Toggle (Donut vs Pie) */}
          <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[10px]">
            <button
              onClick={() => setChartType('donut')}
              className={`px-2 py-1 rounded-md font-semibold transition-all ${
                chartType === 'donut'
                  ? 'bg-[#6C5CE7] text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Donut Chart View"
            >
              Donut
            </button>
            <button
              onClick={() => setChartType('pie')}
              className={`px-2 py-1 rounded-md font-semibold transition-all ${
                chartType === 'pie'
                  ? 'bg-[#6C5CE7] text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Full Pie Chart View"
            >
              Pie
            </button>
          </div>

          {/* Minimize / Expand Toggle */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
            title={isExpanded ? 'Collapse breakdown' : 'Expand breakdown'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Beginner Mode Educational Insight */}
          {mode === 'beginner' && (
            <div className="p-3 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-[#00E676] shrink-0 mt-0.5" />
              <div className="text-xs space-y-0.5">
                <p className="font-semibold text-white">Why Sector Allocation Matters for Beginners</p>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {diversificationStatus.message} By diversifying across Technology, Energy, Auto, and Banking, you protect your capital if one sector experiences a market dip.
                </p>
              </div>
            </div>
          )}

          {/* Chart Display & Center Info */}
          <div className="relative flex flex-col items-center justify-center pt-1">
            <svg
              width={size}
              height={size}
              viewBox={`0 0 ${size} ${size}`}
              className="drop-shadow-xl overflow-visible"
            >
              <defs>
                {/* Subtle drop shadows and glow filters */}
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.4" />
                </filter>
              </defs>

              {/* Pie Slices */}
              {slices.map((slice) => {
                return (
                  <path
                    key={slice.sector}
                    d={slice.pathData}
                    fill={slice.color}
                    fillOpacity={slice.isHovered ? 1 : 0.88}
                    stroke="#0B0E14"
                    strokeWidth={slice.isHovered ? 3 : 2}
                    className="cursor-pointer transition-all duration-200"
                    style={{
                      transformOrigin: `${center}px ${center}px`,
                      filter: slice.isHovered ? 'url(#glow)' : undefined,
                    }}
                    onMouseEnter={() => setActiveSectorIndex(slice.index)}
                    onMouseLeave={() => setActiveSectorIndex(null)}
                    onClick={() =>
                      setActiveSectorIndex(activeSectorIndex === slice.index ? null : slice.index)
                    }
                  />
                );
              })}

              {/* Center Circle Content (Donut Mode) */}
              {chartType === 'donut' && (
                <circle
                  cx={center}
                  cy={center}
                  r={innerRadius - 4}
                  fill="#0E121B"
                  stroke="#1E293B"
                  strokeWidth="1.5"
                  className="pointer-events-none"
                />
              )}
            </svg>

            {/* Centered Dynamic Content Overlay in Donut */}
            {chartType === 'donut' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-6">
                {activeSector ? (
                  <div className="animate-in fade-in zoom-in-95 duration-150 max-w-[150px]">
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold block truncate">
                      {activeSector.sector}
                    </span>
                    <span className="text-base font-black font-mono text-white block mt-0.5">
                      {activeSector.percentage.toFixed(1)}%
                    </span>
                    <span className="text-[11px] font-mono font-bold text-slate-300 block">
                      {formatINR(activeSector.value)}
                    </span>
                    <span
                      className={`text-[9px] font-mono font-semibold block mt-0.5 ${
                        activeSector.pnl >= 0 ? 'text-[#00E676]' : 'text-[#FF5252]'
                      }`}
                    >
                      {activeSector.pnl >= 0 ? '+' : ''}
                      {formatINR(activeSector.pnl)} ({activeSector.pnlPercent.toFixed(1)}%)
                    </span>
                  </div>
                ) : (
                  <div className="max-w-[140px]">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                      Portfolio
                    </span>
                    <span className="text-sm font-black font-mono text-white block mt-0.5">
                      {formatINR(totalValue)}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {sectorList.length} Sectors
                    </span>
                    <span className="text-[9px] text-indigo-400 font-medium block mt-1">
                      Tap slice to inspect
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Interactive Legend / Filter Chips */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
            {sectorList.map((sec, idx) => {
              const isSelected = activeSectorIndex === idx;
              return (
                <button
                  key={sec.sector}
                  onClick={() => setActiveSectorIndex(isSelected ? null : idx)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold transition-all border ${
                    isSelected
                      ? 'bg-slate-800 text-white border-white/40 shadow-md ring-1 ring-white/20'
                      : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                    style={{ backgroundColor: sec.color }}
                  />
                  <span className="truncate max-w-[110px] sm:max-w-none">{sec.sector}</span>
                  <span className="text-[10px] font-mono text-slate-400 font-bold">
                    {sec.percentage.toFixed(1)}%
                  </span>
                </button>
              );
            })}
          </div>

          {/* Detailed Sector Breakdown Cards */}
          <div className="space-y-2 pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold px-1">
              <span>Sector & Holdings</span>
              <span>Value & Weight</span>
            </div>

            <div className="space-y-2">
              {sectorList.map((sec, idx) => {
                const isSelected = activeSectorIndex === idx;
                const isProfit = sec.pnl >= 0;

                return (
                  <div
                    key={sec.sector}
                    onClick={() => setActiveSectorIndex(isSelected ? null : idx)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-850 border-indigo-500/60 shadow-lg ring-1 ring-indigo-500/20'
                        : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-900 hover:border-slate-700'
                    }`}
                  >
                    {/* Top Row: Sector Header, Value & Percentage */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-md shrink-0 shadow-sm"
                          style={{ backgroundColor: sec.color }}
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-white">{sec.sector}</span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              ({sec.stocks.length} {sec.stocks.length === 1 ? 'stock' : 'stocks'})
                            </span>
                          </div>
                          {/* Stock symbol tags */}
                          <div className="flex flex-wrap gap-1 mt-1">
                            {sec.stocks.map((stk) => (
                              <span
                                key={stk.symbol}
                                className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800/90 text-slate-300 border border-slate-700/50"
                              >
                                {stk.symbol} ({stk.quantity})
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <span className="text-xs font-mono font-bold text-white">
                            {formatINR(sec.value)}
                          </span>
                          <span
                            className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md"
                            style={{ backgroundColor: sec.badgeBg, color: sec.color }}
                          >
                            {sec.percentage.toFixed(1)}%
                          </span>
                        </div>
                        <div
                          className={`text-[10px] font-mono font-semibold mt-0.5 flex items-center justify-end ${
                            isProfit ? 'text-[#00E676]' : 'text-[#FF5252]'
                          }`}
                        >
                          {isProfit ? (
                            <TrendingUp className="w-2.5 h-2.5 mr-0.5" />
                          ) : (
                            <TrendingDown className="w-2.5 h-2.5 mr-0.5" />
                          )}
                          <span>
                            {isProfit ? '+' : ''}
                            {formatINR(sec.pnl)} ({isProfit ? '+' : ''}
                            {sec.pnlPercent.toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar of Sector Weight */}
                    <div className="mt-2.5 w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(100, sec.percentage)}%`,
                          backgroundColor: sec.color,
                        }}
                      />
                    </div>

                    {/* Expanded Stock Details if this sector is selected */}
                    {isSelected && (
                      <div className="mt-3 pt-2.5 border-t border-slate-800/80 space-y-1.5 animate-in fade-in duration-150">
                        <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider block">
                          Companies in {sec.sector}
                        </span>
                        {sec.stocks.map((stk) => (
                          <div
                            key={stk.symbol}
                            className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-950/60 border border-slate-800/50"
                          >
                            <div>
                              <span className="font-bold text-white font-mono">{stk.symbol}</span>
                              <span className="text-[10px] text-slate-400 ml-1.5">
                                {stk.stockName}
                              </span>
                            </div>
                            <div className="text-right font-mono">
                              <span className="text-slate-200 font-semibold">
                                {formatINR(stk.value)}
                              </span>
                              <span
                                className={`ml-2 text-[10px] font-bold ${
                                  stk.pnl >= 0 ? 'text-[#00E676]' : 'text-[#FF5252]'
                                }`}
                              >
                                {stk.pnl >= 0 ? '+' : ''}
                                {formatINR(stk.pnl)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
