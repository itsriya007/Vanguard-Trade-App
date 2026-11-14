import React from 'react';
import { useTrading } from '../context/TradingContext';
import {
  Wifi,
  WifiOff,
  Volume2,
  VolumeX,
  Smartphone,
  Maximize2,
  Lock,
  Sparkles,
  Zap,
  HelpCircle,
  Bot,
  Bell,
  LogIn,
  ShieldCheck,
  User,
} from 'lucide-react';

export const HeaderNav: React.FC = () => {
  const {
    mode,
    setMode,
    wsStatus,
    wsLatency,
    toggleWsStream,
    reconnectWs,
    soundEnabled,
    setSoundEnabled,
    viewMode,
    setViewMode,
    logout,
    setGuideOpen,
    setStockMasterModalOpen,
    openPriceAlertModal,
    priceAlerts,
    firebaseUser,
    userProfile,
    openAuthModal,
    openProfileModal,
  } = useTrading();

  const activeAlertsCount = priceAlerts.filter((a) => a.isActive && !a.isTriggered).length;

  return (
    <header className="sticky top-0 z-40 bg-[#0B0E14]/95 backdrop-blur-md border-b border-slate-800/80 px-3.5 py-2.5">
      <div className="flex items-center justify-between gap-2">
        {/* Brand & Market Status */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#6C5CE7] to-[#8c7bf7] flex items-center justify-center shadow-lg shadow-[#6C5CE7]/30 ring-1 ring-white/20">
            <span className="text-white font-extrabold text-base tracking-tighter">VT</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-bold text-sm tracking-tight text-white leading-none">
                Vanguard<span className="text-[#6C5CE7]">Trade</span>
              </h1>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-medium bg-emerald-500/10 text-[#00E676] border border-[#00E676]/20">
                LIVE
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] text-slate-400 font-mono">NSE/BSE 09:15-15:30 IST</span>
            </div>
          </div>
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-1.5">
          {/* WebSocket Status Indicator */}
          <button
            onClick={wsStatus === 'paused' ? reconnectWs : toggleWsStream}
            title={
              wsStatus === 'connected'
                ? `WebSocket Connected (${wsLatency}ms) - Tap to Pause`
                : 'WebSocket Paused - Tap to Reconnect'
            }
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-mono transition-all border ${
              wsStatus === 'connected'
                ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400'
                : 'bg-amber-950/40 border-amber-500/30 text-amber-400'
            }`}
          >
            {wsStatus === 'connected' ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-[#00E676] animate-pulse" />
                <Wifi className="w-3 h-3" />
                <span className="hidden sm:inline text-[10px]">{wsLatency}ms</span>
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <WifiOff className="w-3 h-3" />
                <span className="hidden sm:inline text-[10px]">Paused</span>
              </>
            )}
          </button>

          {/* Mode Switch: Beginner vs Pro */}
          <div className="flex items-center bg-slate-900/90 p-0.5 rounded-lg border border-slate-800 text-[11px]">
            <button
              onClick={() => setMode('beginner')}
              className={`flex items-center gap-1 px-2 py-1 rounded-md font-medium transition-all ${
                mode === 'beginner'
                  ? 'bg-[#6C5CE7] text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Beginner Mode: Simplifies jargon with tooltips and trade safety warnings"
            >
              <Sparkles className="w-3 h-3" />
              <span className="text-[10px]">Beginner</span>
            </button>
            <button
              onClick={() => setMode('pro')}
              className={`flex items-center gap-1 px-2 py-1 rounded-md font-medium transition-all ${
                mode === 'pro'
                  ? 'bg-gradient-to-r from-[#6C5CE7] to-[#00E676] text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Pro Mode: Deep Level-2 market depth, rapid order shortcuts, technical signals"
            >
              <Zap className="w-3 h-3" />
              <span className="text-[10px]">Pro</span>
            </button>
          </div>

          {/* Price Alerts Button */}
          <button
            onClick={() => openPriceAlertModal()}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors relative"
            title={`Price Alerts (${activeAlertsCount} active)`}
          >
            <Bell className="w-3.5 h-3.5 text-slate-400 hover:text-[#00E676]" />
            {activeAlertsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#00E676] text-slate-950 font-black text-[8px] rounded-full flex items-center justify-center shadow-xs">
                {activeAlertsCount}
              </span>
            )}
          </button>

          {/* Sound Mute/Unmute */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            title={soundEnabled ? 'Mute Trade Sounds' : 'Enable Trade Sounds'}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          {/* Frame View Toggle (Mobile Frame vs Fluid View) */}
          <button
            onClick={() => setViewMode(viewMode === 'mobile-frame' ? 'responsive' : 'mobile-frame')}
            className="hidden md:flex p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-[#6C5CE7] transition-colors"
            title={
              viewMode === 'mobile-frame'
                ? 'Switch to Fluid Desktop View'
                : 'Switch to Flagship Mobile Frame'
            }
          >
            {viewMode === 'mobile-frame' ? (
              <Maximize2 className="w-3.5 h-3.5" />
            ) : (
              <Smartphone className="w-3.5 h-3.5" />
            )}
          </button>

          {/* User Profile Badge or Login Button */}
          {firebaseUser ? (
            <button
              onClick={openProfileModal}
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 transition-all text-xs cursor-pointer shadow-xs"
              title="View CDSL Demat Profile & Settings"
            >
              <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-[#6C5CE7] to-[#8c7bf7] text-white font-bold text-[10px] flex items-center justify-center">
                {(userProfile?.displayName || firebaseUser.displayName || firebaseUser.email || 'V').slice(0, 1).toUpperCase()}
              </div>
              <span className="hidden sm:inline font-semibold text-[11px] max-w-[75px] truncate">
                {userProfile?.displayName?.split(' ')[0] || (firebaseUser.isAnonymous ? 'Guest' : 'Investor')}
              </span>
              <ShieldCheck className="w-3 h-3 text-[#00E676]" />
            </button>
          ) : (
            <button
              onClick={openAuthModal}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-[#6C5CE7] to-[#5a48e0] hover:brightness-110 active:scale-95 text-white font-bold text-[11px] shadow-sm shadow-[#6C5CE7]/30 transition-all cursor-pointer"
            >
              <LogIn className="w-3 h-3" />
              <span>Login</span>
            </button>
          )}

          {/* Quick Lock Session Button */}
          {firebaseUser && (
            <button
              onClick={logout}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
              title="Lock Trading Session (Require MPIN / Biometric)"
            >
              <Lock className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Mode Banner Indicator in Beginner Mode */}
      {mode === 'beginner' ? (
        <div className="mt-2 p-2 bg-gradient-to-r from-indigo-950/60 via-slate-900 to-indigo-950/60 border border-indigo-500/30 rounded-xl flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-indigo-200 text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-[#00E676] shrink-0" />
            <span>
              <strong>New to Markets?</strong> We make investing simple & jargon-free.
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setGuideOpen(true)}
              className="px-2 py-1 rounded-lg text-[10px] font-bold bg-[#6C5CE7] hover:bg-[#5a48e0] text-white flex items-center gap-1 shadow-xs transition-colors"
            >
              <span>🎓 5-Step Guide</span>
            </button>
            <button
              onClick={() => setStockMasterModalOpen(true)}
              className="px-2 py-1 rounded-lg text-[10px] font-bold bg-gradient-to-r from-[#00E676] to-[#00c864] text-slate-950 flex items-center gap-1 shadow-xs transition-colors hover:brightness-105 active:scale-95"
            >
              <Bot className="w-3 h-3 text-slate-950" />
              <span>Ask AI Stock Master</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-2 px-2.5 py-1 bg-slate-950/80 border border-slate-800 rounded-lg flex items-center justify-between text-[10px] font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00E676] animate-pulse" />
            <span className="text-white font-bold">PRO TRADER TERMINAL</span>
            <span>• L2 Market Depth (5-Ask/5-Bid) • 5x MIS Active</span>
          </div>
          <button
            onClick={() => setStockMasterModalOpen(true)}
            className="flex items-center gap-1 text-[#00E676] hover:underline cursor-pointer font-bold"
          >
            <Bot className="w-3 h-3" />
            <span>AI Quant Analyst</span>
          </button>
        </div>
      )}
    </header>
  );
};
