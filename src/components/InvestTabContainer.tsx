import React from 'react';
import { useTrading } from '../context/TradingContext';
import { IPOMarketTab } from './IPOMarketTab';
import { MutualFundsTab } from './MutualFundsTab';
import { Sparkles, TrendingUp, PiggyBank, ArrowUpRight } from 'lucide-react';

export const InvestTabContainer: React.FC = () => {
  const { investSubTab, setInvestSubTab, ipos } = useTrading();
  const liveIpoCount = ipos.filter((i) => i.status === 'OPEN').length;

  return (
    <div className="space-y-3">
      {/* Top Invest Module Selector Switch */}
      <div className="px-3 pt-1">
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-900/90 rounded-2xl border border-slate-800 text-xs font-bold">
          <button
            onClick={() => setInvestSubTab('ipo')}
            className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              investSubTab === 'ipo'
                ? 'bg-[#6C5CE7] text-white shadow-md shadow-[#6C5CE7]/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>IPOs & Primary Market</span>
            {liveIpoCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#00E676] text-slate-950 font-mono font-bold">
                {liveIpoCount} Live
              </span>
            )}
          </button>

          <button
            onClick={() => setInvestSubTab('funds')}
            className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              investSubTab === 'funds'
                ? 'bg-[#6C5CE7] text-white shadow-md shadow-[#6C5CE7]/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <PiggyBank className="w-3.5 h-3.5" />
            <span>Mutual Funds & SIPs</span>
          </button>
        </div>
      </div>

      {/* Render selected sub-module */}
      {investSubTab === 'ipo' ? <IPOMarketTab /> : <MutualFundsTab />}
    </div>
  );
};
