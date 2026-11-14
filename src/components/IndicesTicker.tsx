import React from 'react';
import { useTrading } from '../context/TradingContext';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatINR } from '../utils/formatters';

export const IndicesTicker: React.FC = () => {
  const { indices } = useTrading();

  return (
    <div className="w-full bg-[#161B26]/60 border-b border-slate-800/60 overflow-x-auto no-scrollbar py-2 px-3">
      <div className="flex items-center gap-2.5 min-w-max">
        {indices.map((idx) => {
          const isPositive = idx.change >= 0;
          return (
            <div
              key={idx.symbol}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800/80 hover:border-slate-700 transition-all cursor-pointer group"
            >
              <div>
                <div className="flex items-center gap-1">
                  <span className="text-[11px] font-bold text-slate-300 group-hover:text-white transition-colors">
                    {idx.symbol}
                  </span>
                  {idx.symbol === 'INDIA VIX' && (
                    <span className="text-[9px] px-1 rounded bg-slate-800 text-slate-400">VIX</span>
                  )}
                </div>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-xs font-mono font-semibold text-white">
                    {idx.symbol === 'INDIA VIX' ? idx.price.toFixed(2) : formatINR(idx.price, false)}
                  </span>
                  <div
                    className={`flex items-center text-[10px] font-mono font-medium ${
                      isPositive ? 'text-[#00E676]' : 'text-[#FF5252]'
                    }`}
                  >
                    {isPositive ? (
                      <TrendingUp className="w-2.5 h-2.5 mr-0.5 inline" />
                    ) : (
                      <TrendingDown className="w-2.5 h-2.5 mr-0.5 inline" />
                    )}
                    <span>
                      {isPositive ? '+' : ''}
                      {idx.change.toFixed(1)} ({isPositive ? '+' : ''}
                      {idx.changePercent.toFixed(2)}%)
                    </span>
                  </div>
                </div>
              </div>

              {/* Mini Sparkline SVG */}
              <div className="w-12 h-6 pl-1 flex items-center">
                <svg className="w-full h-full" viewBox="0 0 50 20" preserveAspectRatio="none">
                  {(() => {
                    const min = Math.min(...idx.sparkline);
                    const max = Math.max(...idx.sparkline);
                    const range = max - min || 1;
                    const points = idx.sparkline
                      .map((val, i) => {
                        const x = (i / (idx.sparkline.length - 1)) * 50;
                        const y = 18 - ((val - min) / range) * 16;
                        return `${x},${y}`;
                      })
                      .join(' ');

                    return (
                      <polyline
                        fill="none"
                        stroke={isPositive ? '#00E676' : '#FF5252'}
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={points}
                      />
                    );
                  })()}
                </svg>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
