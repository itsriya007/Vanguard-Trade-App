import React, { useState } from 'react';
import { useTrading } from '../context/TradingContext';
import {
  TrendingUp,
  TrendingDown,
  Building2,
  Newspaper,
  Compass,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Layers,
} from 'lucide-react';
import { formatCompactINR } from '../utils/formatters';

export const NewsPulseTab: React.FC = () => {
  const { news, institutionalFlows, setSelectedStock, stocks, addToast } = useTrading();
  const [pulseSection, setPulseSection] = useState<'NEWS' | 'FII_DII' | 'SECTORS'>('NEWS');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const categories = [
    'ALL',
    'Economy & RBI',
    'Tech & Startups',
    'SEBI & Rules',
    'Earnings',
    'Energy & Commodities',
  ];

  const filteredNews = news.filter((item) =>
    selectedCategory === 'ALL' ? true : item.category === selectedCategory
  );

  const bullishCount = news.filter((n) => n.sentiment === 'BULLISH').length;
  const neutralCount = news.filter((n) => n.sentiment === 'NEUTRAL').length;
  const bearishCount = news.filter((n) => n.sentiment === 'BEARISH').length;

  const handleRefreshWire = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      addToast('info', 'Market Wire Synced', 'Live PTI/Reuters Indian market feeds up to date.');
    }, 600);
  };

  const handleSymbolClick = (symbol: string) => {
    const stock = stocks.find((s) => s.symbol === symbol);
    if (stock) {
      setSelectedStock(stock);
    }
  };

  const sectors = [
    { name: 'Nifty Auto', change: 2.18, value: '25,480.20' },
    { name: 'Nifty Bank', change: -0.16, value: '51,420.15' },
    { name: 'Nifty IT', change: -0.44, value: '41,890.60' },
    { name: 'Nifty Metal', change: 1.45, value: '9,340.10' },
    { name: 'Nifty FMCG', change: 0.65, value: '62,180.50' },
    { name: 'Nifty Energy', change: 1.12, value: '38,920.40' },
  ];

  return (
    <div className="space-y-4 pb-20">
      {/* Sub Tabs */}
      <div className="px-3">
        <div className="grid grid-cols-3 gap-1 p-1 bg-slate-900/90 rounded-xl border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setPulseSection('NEWS')}
            className={`py-2 rounded-lg transition-all text-center flex items-center justify-center gap-1.5 ${
              pulseSection === 'NEWS'
                ? 'bg-[#6C5CE7] text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Newspaper className="w-3.5 h-3.5" />
            <span>Market News</span>
          </button>
          <button
            onClick={() => setPulseSection('FII_DII')}
            className={`py-2 rounded-lg transition-all text-center flex items-center justify-center gap-1.5 ${
              pulseSection === 'FII_DII'
                ? 'bg-[#6C5CE7] text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>FII / DII Flows</span>
          </button>
          <button
            onClick={() => setPulseSection('SECTORS')}
            className={`py-2 rounded-lg transition-all text-center flex items-center justify-center gap-1.5 ${
              pulseSection === 'SECTORS'
                ? 'bg-[#6C5CE7] text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Sector Pulse</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: FINANCIAL NEWS WITH SENTIMENT BADGES */}
      {pulseSection === 'NEWS' && (
        <div className="px-3 space-y-3">
          {/* Live Market Sentiment Bar & Refresh Trigger */}
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00E676] animate-pulse" />
              <div className="text-xs">
                <span className="text-slate-400">Indian Market Sentiment: </span>
                <strong className="text-[#00E676]">{bullishCount} Bullish</strong>
                <span className="text-slate-500"> • </span>
                <span className="text-slate-300">{neutralCount} Neutral</span>
                <span className="text-slate-500"> • </span>
                <span className="text-rose-400">{bearishCount} Bearish</span>
              </div>
            </div>

            <button
              onClick={handleRefreshWire}
              disabled={isRefreshing}
              className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all flex items-center gap-1 active:scale-95"
            >
              <span className={`w-1.5 h-1.5 rounded-full bg-[#6C5CE7] ${isRefreshing ? 'animate-ping' : ''}`} />
              <span>{isRefreshing ? 'Syncing...' : 'Sync Wire'}</span>
            </button>
          </div>

          {/* Category Filter Pills */}
          <div className="overflow-x-auto no-scrollbar flex items-center gap-1.5 py-0.5">
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

          {/* News Cards Feed */}
          {filteredNews.map((item) => {
            const isBullish = item.sentiment === 'BULLISH';
            const isBearish = item.sentiment === 'BEARISH';

            return (
              <div
                key={item.id}
                className={`p-4 rounded-2xl bg-[#161B26] border transition-all space-y-2.5 shadow-sm relative overflow-hidden ${
                  item.isBreaking
                    ? 'border-indigo-500/40 bg-gradient-to-b from-indigo-950/20 to-[#161B26]'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Breaking banner if applicable */}
                {item.isBreaking && (
                  <div className="flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-wider text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20 w-fit mb-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF5252] animate-ping" />
                    <span>Breaking Market Alert</span>
                  </div>
                )}

                {/* Header with Sentiment Badge */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 ${
                        isBullish
                          ? 'bg-emerald-500/15 text-[#00E676] border border-[#00E676]/30'
                          : isBearish
                          ? 'bg-rose-500/15 text-[#FF5252] border border-[#FF5252]/30'
                          : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}
                    >
                      {isBullish ? (
                        <TrendingUp className="w-3 h-3 inline" />
                      ) : isBearish ? (
                        <TrendingDown className="w-3 h-3 inline" />
                      ) : null}
                      {item.sentiment}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">{item.source}</span>
                    {item.category && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800/80 text-slate-400">
                        {item.category}
                      </span>
                    )}
                  </div>

                  <span className="text-[10px] text-slate-500 font-mono">{item.timeAgo}</span>
                </div>

                <h4 className="font-bold text-white text-xs leading-relaxed">{item.title}</h4>
                <p className="text-[11px] text-slate-400 leading-normal">{item.summary}</p>

                {/* Related Symbols - Tappable directly to open stock depth */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-slate-500">Related Stocks:</span>
                  {item.relatedSymbols.map((sym) => (
                    <button
                      key={sym}
                      onClick={() => handleSymbolClick(sym)}
                      className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-indigo-300 hover:text-white hover:border-[#6C5CE7] transition-all cursor-pointer"
                    >
                      {sym} ↗
                    </button>
                  ))}
                </div>
              </div>
            );
          })}

          {filteredNews.length === 0 && (
            <div className="p-8 text-center text-slate-500 text-xs bg-[#161B26] rounded-2xl border border-slate-800">
              No news items under this category. Select "ALL" to view full market wire.
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: INSTITUTIONAL FII / DII FLOWS IN CRORES */}
      {pulseSection === 'FII_DII' && (
        <div className="px-3 space-y-3">
          <div className="p-4 rounded-2xl bg-[#161B26] border border-slate-800 space-y-3">
            <div>
              <h4 className="font-bold text-white text-sm">Institutional Net Cash Flows (₹ Crores)</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Foreign Institutional Investors (FII) & Domestic Mutual Funds (DII) activity in cash market
              </p>
            </div>

            {/* Live Today Snapshot Card */}
            {institutionalFlows[0] && (
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center font-mono">
                <div>
                  <span className="text-[10px] text-slate-400 block font-sans">FII Net (Today)</span>
                  <span
                    className={`text-sm font-bold ${
                      institutionalFlows[0].fiiCashNetCr >= 0 ? 'text-[#00E676]' : 'text-[#FF5252]'
                    }`}
                  >
                    {institutionalFlows[0].fiiCashNetCr >= 0 ? '+' : ''}
                    ₹{institutionalFlows[0].fiiCashNetCr.toFixed(2)} Cr
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-sans">DII Net (Today)</span>
                  <span
                    className={`text-sm font-bold ${
                      institutionalFlows[0].diiCashNetCr >= 0 ? 'text-[#00E676]' : 'text-[#FF5252]'
                    }`}
                  >
                    {institutionalFlows[0].diiCashNetCr >= 0 ? '+' : ''}
                    ₹{institutionalFlows[0].diiCashNetCr.toFixed(2)} Cr
                  </span>
                </div>
              </div>
            )}

            {/* Historical Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 text-[10px]">
                    <th className="pb-2 font-normal">Date</th>
                    <th className="pb-2 text-right font-normal">FII Cash</th>
                    <th className="pb-2 text-right font-normal">DII Cash</th>
                    <th className="pb-2 text-right font-normal">Sentiment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {institutionalFlows.map((flow, i) => (
                    <tr key={i} className="text-[11px]">
                      <td className="py-2.5 text-white">{flow.date}</td>
                      <td
                        className={`py-2.5 text-right font-bold ${
                          flow.fiiCashNetCr >= 0 ? 'text-[#00E676]' : 'text-[#FF5252]'
                        }`}
                      >
                        {flow.fiiCashNetCr >= 0 ? '+' : ''}₹{flow.fiiCashNetCr.toFixed(1)} Cr
                      </td>
                      <td
                        className={`py-2.5 text-right font-bold ${
                          flow.diiCashNetCr >= 0 ? 'text-[#00E676]' : 'text-[#FF5252]'
                        }`}
                      >
                        {flow.diiCashNetCr >= 0 ? '+' : ''}₹{flow.diiCashNetCr.toFixed(1)} Cr
                      </td>
                      <td className="py-2.5 text-right">
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-sans font-bold ${
                            flow.sentiment === 'Bullish'
                              ? 'bg-emerald-500/20 text-[#00E676]'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {flow.sentiment}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: SECTOR PULSE */}
      {pulseSection === 'SECTORS' && (
        <div className="px-3 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {sectors.map((sec) => {
              const isSecPositive = sec.change >= 0;
              return (
                <div
                  key={sec.name}
                  className="p-3.5 rounded-2xl bg-[#161B26] border border-slate-800 space-y-1.5"
                >
                  <span className="text-xs font-bold text-white block">{sec.name}</span>
                  <div className="flex items-baseline justify-between font-mono">
                    <span className="text-xs text-slate-400">{sec.value}</span>
                    <span
                      className={`text-xs font-bold flex items-center ${
                        isSecPositive ? 'text-[#00E676]' : 'text-[#FF5252]'
                      }`}
                    >
                      {isSecPositive ? (
                        <ArrowUpRight className="w-3.5 h-3.5 mr-0.5 inline" />
                      ) : (
                        <ArrowDownRight className="w-3.5 h-3.5 mr-0.5 inline" />
                      )}
                      {isSecPositive ? '+' : ''}
                      {sec.change.toFixed(2)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
