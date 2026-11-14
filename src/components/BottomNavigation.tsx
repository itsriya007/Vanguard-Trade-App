import React from 'react';
import { useTrading } from '../context/TradingContext';
import {
  LineChart,
  ClipboardList,
  Briefcase,
  Layers,
  Radio,
} from 'lucide-react';

interface TabItem {
  id: 'watchlist' | 'orders' | 'portfolio' | 'invest' | 'pulse';
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | null;
}

export const BottomNavigation: React.FC = () => {
  const { activeTab, setActiveTab, positions } = useTrading();

  const tabs: TabItem[] = [
    { id: 'watchlist', label: 'Watchlist', icon: LineChart },
    { id: 'orders', label: 'Orders', icon: ClipboardList },
    { id: 'portfolio', label: 'Portfolio', icon: Briefcase, badge: positions.length > 0 ? positions.length : null },
    { id: 'invest', label: 'Invest', icon: Layers },
    { id: 'pulse', label: 'Pulse', icon: Radio },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0B0E14]/95 backdrop-blur-lg border-t border-slate-800/80 px-2 py-2">
      <div className="max-w-md mx-auto grid grid-cols-5 gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all relative ${
                isActive
                  ? 'text-[#6C5CE7]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 stroke-[2.5]' : ''}`} />
                {tab.badge && (
                  <span className="absolute -top-1 -right-2 w-4 h-4 rounded-full bg-[#00E676] text-slate-950 font-mono text-[9px] font-bold flex items-center justify-center ring-2 ring-[#0B0E14]">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] mt-1 font-medium ${isActive ? 'font-bold' : ''}`}>
                {tab.label}
              </span>
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-[#6C5CE7] mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
