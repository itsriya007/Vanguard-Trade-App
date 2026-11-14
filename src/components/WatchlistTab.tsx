import React, { useState } from 'react';
import { useTrading } from '../context/TradingContext';
import { Stock } from '../types';
import {
  Search,
  TrendingUp,
  TrendingDown,
  Info,
  ChevronRight,
  Filter,
  Sparkles,
  Zap,
  ShieldCheck,
  HelpCircle,
  ExternalLink,
  Activity,
  CheckCircle2,
  Bot,
  Bell,
} from 'lucide-react';
import { formatINR } from '../utils/formatters';

interface WatchlistTabProps {
  onSelectStock: (stock: Stock) => void;
}

export const WatchlistTab: React.FC<WatchlistTabProps> = ({ onSelectStock }) => {
  const {
    stocks,
    mode,
    openOrderSheet,
    lastUpdatedTick,
    news,
    setActiveTab,
    setGuideOpen,
    setStockMasterModalOpen,
    openStockMasterWithPrompt,
    openPriceAlertModal,
    priceAlerts,
  } = useTrading();

  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories = ['ALL', 'NIFTY 50', 'BANK', 'IT', 'AUTO', 'F&O', 'ENERGY', 'FMCG', 'INFRA'];

  const breakingNews = news.filter((n) => n.isBreaking);
  const [breakingIndex] = useState(0);

  const filteredStocks = stocks.filter((stock) => {
    const matchesCategory = filterCategory === 'ALL' || stock.category === filterCategory;
    const matchesSearch =
      stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stock.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (stock.beginnerInsight?.googleSearchQuery &&
        stock.beginnerInsight.googleSearchQuery.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-3 pb-24">
      {/* Live Breaking News Alert Ticker */}
      {breakingNews.length > 0 && (
        <div className="px-3 pt-1">
          <div
            onClick={() => setActiveTab('pulse')}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-indigo-950/70 via-slate-900 to-indigo-950/70 border border-indigo-500/30 cursor-pointer hover:border-indigo-400/50 transition-all group"
          >
            <div className="flex items-center gap-1 shrink-0">
              <span className="w-2 h-2 rounded-full bg-[#FF5252] animate-ping" />
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                LIVE WIRE
              </span>
            </div>
            <p className="text-[11px] text-slate-200 line-clamp-1 flex-1 font-medium group-hover:text-white transition-colors">
              {breakingNews[breakingIndex]?.title}
            </p>
            <span className="text-[10px] text-indigo-400 shrink-0 font-semibold group-hover:underline">
              Read Pulse →
            </span>
          </div>
        </div>
      )}

      {/* BEGINNER MODE: Hero Action Card for AI Stock Master & Guide */}
      {mode === 'beginner' && (
        <div className="px-3">
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-950/80 via-[#161B26] to-slate-900 border border-indigo-500/30 shadow-lg relative overflow-hidden">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#00E676] animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[#00E676] flex items-center gap-1">
                    <Bot className="w-3.5 h-3.5" />
                    DhanGuru AI Stock Master
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white leading-snug">
                  Have doubts or confused by market terms? Ask our Stock Master.
                </h3>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Get instant answers for CNC vs MIS, STT taxes, T+1 settlement, circuit limits, and institutional stock analysis before putting in your money.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-slate-800">
              <button
                onClick={() => setStockMasterModalOpen(true)}
                className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-[#6C5CE7] to-[#00E676] hover:opacity-95 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-[#00E676]/20 transition-all active:scale-95"
              >
                <Bot className="w-4 h-4 text-slate-950" />
                <span>Ask AI Stock Master</span>
              </button>
              <button
                onClick={() => setGuideOpen(true)}
                className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition-all active:scale-95"
              >
                <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
                <span>5-Step Guide</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRO MODE: High-density Market Breadth & Volatility Summary */}
      {mode === 'pro' && (
        <div className="px-3">
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-[10px] font-mono">
            <div className="flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-slate-400">NIFTY Breadth:</span>
              <span className="text-[#00E676] font-bold">34 Adv</span>
              <span className="text-slate-600">/</span>
              <span className="text-[#FF5252] font-bold">16 Dec</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">PCR:</span>
              <span className="text-white font-bold">1.14</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400">India VIX:</span>
              <span className="text-emerald-400 font-bold">14.82 (-2.1%)</span>
            </div>
          </div>
        </div>
      )}

      {/* Search Input Bar */}
      <div className="px-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={
              mode === 'beginner'
                ? "Search any stock (e.g., 'Tata Motors', 'Swiggy', 'Reliance')..."
                : "Search NIFTY 50, BSE stocks, options, sectors..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#161B26] border border-slate-800/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-[#6C5CE7] transition-all"
          />
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="px-3 overflow-x-auto no-scrollbar flex items-center gap-1.5">
        <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0 mr-1" />
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              filterCategory === cat
                ? 'bg-[#6C5CE7] text-white shadow-sm shadow-[#6C5CE7]/30'
                : 'bg-slate-900/80 border border-slate-800/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Stock List Cards */}
      <div className="px-3 space-y-2.5">
        {filteredStocks.map((stock) => {
          const isPositive = stock.change >= 0;
          const isTicked = lastUpdatedTick?.symbol === stock.symbol;
          const tickDir = lastUpdatedTick?.direction;
          const insight = stock.beginnerInsight;

          return (
            <div
              key={stock.symbol}
              onClick={() => onSelectStock(stock)}
              className={`group p-3.5 rounded-2xl bg-[#161B26] border border-slate-800/80 hover:border-slate-700 transition-all cursor-pointer shadow-sm relative overflow-hidden ${
                isTicked ? (tickDir === 'up' ? 'tick-flash-up' : 'tick-flash-down') : ''
              }`}
            >
              {/* Main Stock Row */}
              <div className="flex items-start justify-between">
                {/* Left: Symbol & Exchange */}
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-white text-sm group-hover:text-indigo-300 transition-colors">
                      {stock.symbol}
                    </span>
                    <span className="text-[10px] font-mono px-1 rounded bg-slate-800 text-slate-400">
                      {stock.exchange}
                    </span>
                    {mode === 'beginner' && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-800 text-indigo-300 font-medium">
                        {stock.category}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-1 max-w-[170px] sm:max-w-xs">
                    {stock.name}
                  </p>
                </div>

                {/* Right: Live Price & Day Change */}
                <div className="text-right">
                  <div
                    className={`font-mono font-bold text-sm transition-colors ${
                      isTicked
                        ? tickDir === 'up'
                          ? 'text-[#00E676]'
                          : 'text-[#FF5252]'
                        : 'text-white'
                    }`}
                  >
                    {formatINR(stock.price)}
                  </div>
                  <div
                    className={`flex items-center justify-end text-[11px] font-mono font-semibold ${
                      isPositive ? 'text-[#00E676]' : 'text-[#FF5252]'
                    }`}
                  >
                    {isPositive ? (
                      <TrendingUp className="w-3 h-3 mr-0.5" />
                    ) : (
                      <TrendingDown className="w-3 h-3 mr-0.5" />
                    )}
                    <span>
                      {isPositive ? '+' : ''}
                      {stock.change.toFixed(2)} ({isPositive ? '+' : ''}
                      {stock.changePercent.toFixed(2)}%)
                    </span>
                  </div>
                </div>
              </div>

              {/* BEGINNER MODE: Plain-English Company Summary & Risk Tag */}
              {mode === 'beginner' && insight && (
                <div className="mt-2.5 p-2.5 rounded-xl bg-slate-900/90 border border-slate-800/80 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-300 font-medium">
                      {insight.summary}
                    </span>
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 ${
                        insight.riskLevel === 'Low'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : insight.riskLevel === 'Moderate'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {insight.riskLevel} Risk
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/60">
                    <span className="line-clamp-1">
                      💡 <strong>Why Invest:</strong> {insight.whyInvest}
                    </span>
                    <span className="text-emerald-400 font-bold shrink-0 ml-2">
                      ₹0 Brokerage (CNC)
                    </span>
                  </div>
                </div>
              )}

              {/* PRO MODE: Technical Indicator Ribbon */}
              {mode === 'pro' && (
                <div className="mt-2 py-1 px-2 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span>VWAP: <strong className="text-slate-200">₹{stock.technical.vwap.toFixed(2)}</strong></span>
                  <span>52W H: <strong className="text-slate-200">₹{stock.week52High.toFixed(2)}</strong></span>
                  <span>52W L: <strong className="text-slate-200">₹{stock.week52Low.toFixed(2)}</strong></span>
                  <span>Vol: <strong className="text-slate-200">{(stock.volume / 100000).toFixed(2)}L</strong></span>
                </div>
              )}

              {/* Bottom Quick Action Bar */}
              <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between">
                <div className="text-[10px] font-mono text-slate-500">
                  {mode === 'beginner' ? (
                    <span className="text-indigo-300 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-[#00E676]" />
                      CDSL Demat Ready
                    </span>
                  ) : (
                    <span>NSE L2 Order Feed</span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Custom Price Alert Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openPriceAlertModal(stock);
                    }}
                    className={`p-1.5 rounded-xl border transition-all ${
                      priceAlerts.some((a) => a.symbol === stock.symbol && a.isActive && !a.isTriggered)
                        ? 'bg-emerald-950/50 border-[#00E676]/50 text-[#00E676]'
                        : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                    }`}
                    title={`Set Custom Price Alert for ${stock.symbol}`}
                  >
                    <Bell className="w-3.5 h-3.5" />
                  </button>

                  {mode === 'beginner' ? (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openStockMasterWithPrompt(`Analyze ${stock.name} (${stock.symbol}) and tell me if it is safe for a beginner investor`, stock);
                        }}
                        className="px-2 py-1.5 rounded-xl text-xs font-semibold bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-300 border border-indigo-500/30 transition-all flex items-center gap-1"
                        title={`Ask DhanGuru AI about ${stock.symbol}`}
                      >
                        <Bot className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Ask AI</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openOrderSheet(stock, 'BUY');
                        }}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#00E676] text-slate-950 hover:bg-[#00c864] transition-all shadow-sm active:scale-95 flex items-center gap-1"
                      >
                        <span>Invest {formatINR(stock.price)}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openOrderSheet(stock, 'BUY');
                        }}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-950/40 text-[#00E676] border border-[#00E676]/30 hover:bg-[#00E676] hover:text-slate-950 transition-all active:scale-95"
                      >
                        BUY
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openOrderSheet(stock, 'SELL');
                        }}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-950/40 text-[#FF5252] border border-[#FF5252]/30 hover:bg-[#FF5252] hover:text-white transition-all active:scale-95"
                      >
                        SELL
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectStock(stock);
                        }}
                        className="p-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                        title="View L2 Depth Book"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filteredStocks.length === 0 && (
          <div className="text-center py-12 text-slate-500 text-xs">
            No stocks found matching "{searchQuery}".
          </div>
        )}
      </div>
    </div>
  );
};
