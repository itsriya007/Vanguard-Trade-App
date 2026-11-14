import React from 'react';
import { useTrading } from '../context/TradingContext';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

export const MobileFrameContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { viewMode, setViewMode, toasts, removeToast } = useTrading();

  return (
    <div className="min-h-screen bg-[#07090D] flex flex-col items-center justify-start py-0 md:py-6 sm:px-4">
      {/* View Mode Switcher Header for Desktop testers */}
      <div className="hidden md:flex items-center justify-between w-full max-w-4xl mb-3 px-4 py-2 bg-slate-900/60 rounded-xl border border-slate-800 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#00E676] animate-pulse" />
          <strong className="text-white">Vanguard Trade</strong>
          <span>• Indian Equities, IPOs & Mutual Funds</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('mobile-frame')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'mobile-frame'
                ? 'bg-[#6C5CE7] text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Compact Mobile View
          </button>
          <button
            onClick={() => setViewMode('responsive')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'responsive'
                ? 'bg-[#6C5CE7] text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Full Width View
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div
        className={`w-full transition-all duration-300 ${
          viewMode === 'mobile-frame'
            ? 'md:max-w-[430px] md:rounded-3xl md:border md:border-slate-800/90 md:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] md:overflow-hidden bg-[#0B0E14] relative md:ring-1 md:ring-white/10 min-h-screen md:min-h-0'
            : 'max-w-3xl bg-[#0B0E14] min-h-screen md:rounded-3xl md:border md:border-slate-800/80 shadow-2xl relative'
        }`}
      >
        {/* Child Components */}
        <div className="min-h-screen md:min-h-[840px] flex flex-col relative">{children}</div>

        {/* Global Toast Stack */}
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[70] flex flex-col gap-2 w-full max-w-sm px-4 pointer-events-none">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`p-3 rounded-2xl border shadow-xl flex items-start justify-between gap-2.5 backdrop-blur-xl animate-in slide-in-from-bottom-4 pointer-events-auto ${
                toast.type === 'success'
                  ? 'bg-emerald-950/90 border-[#00E676]/40 text-emerald-100'
                  : toast.type === 'error'
                  ? 'bg-rose-950/90 border-[#FF5252]/40 text-rose-100'
                  : toast.type === 'warning'
                  ? 'bg-amber-950/90 border-amber-500/40 text-amber-100'
                  : 'bg-indigo-950/90 border-indigo-500/40 text-indigo-100'
              }`}
            >
              <div className="flex items-start gap-2">
                {toast.type === 'success' && <CheckCircle className="w-4 h-4 text-[#00E676] shrink-0 mt-0.5" />}
                {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-[#FF5252] shrink-0 mt-0.5" />}
                {toast.type === 'warning' && <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />}
                {toast.type === 'info' && <Info className="w-4 h-4 text-[#6C5CE7] shrink-0 mt-0.5" />}

                <div>
                  <h5 className="font-bold text-xs">{toast.message}</h5>
                  {toast.detail && <p className="text-[11px] opacity-80 mt-0.5">{toast.detail}</p>}
                </div>
              </div>

              <button
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
