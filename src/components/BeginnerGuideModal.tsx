import React, { useState } from 'react';
import { useTrading } from '../context/TradingContext';
import {
  Sparkles,
  BookOpen,
  HelpCircle,
  ShieldCheck,
  TrendingUp,
  Search,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  X,
  Zap,
  Info,
} from 'lucide-react';

export const BeginnerGuideModal: React.FC = () => {
  const {
    guideOpen,
    setGuideOpen,
    activeGuideStep,
    setActiveGuideStep,
    setGoogleSearchModalOpen,
    openOrderSheet,
    stocks,
  } = useTrading();

  const [activeTab, setActiveTab] = useState<'TUTORIAL' | 'GLOSSARY' | 'STARTER_STOCKS'>('TUTORIAL');

  if (!guideOpen) return null;

  const steps = [
    {
      step: 1,
      title: 'What does buying a stock really mean?',
      subtitle: 'Becoming a Fractional Business Owner',
      icon: TrendingUp,
      content: (
        <div className="space-y-2.5 text-xs text-slate-300">
          <p>
            When you buy 1 share of a company like <strong>Reliance Industries</strong>, <strong>Tata Motors</strong>, or <strong>HDFC Bank</strong>, you are literally buying a fractional piece of ownership in that business.
          </p>
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
            <div className="text-white font-bold flex items-center gap-1.5 text-xs">
              <span className="text-emerald-400">✓</span> How You Make Money:
            </div>
            <ul className="list-disc list-inside text-slate-400 space-y-1 pl-1 text-[11px]">
              <li>
                <strong>Capital Growth:</strong> As the company earns higher profits and expands, the share price rises over months and years.
              </li>
              <li>
                <strong>Dividends:</strong> Companies regularly pay cash profits directly into your linked bank account.
              </li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      step: 2,
      title: 'Delivery (CNC) vs Intraday (MIS)',
      subtitle: 'The #1 Rule for Every New Investor',
      icon: ShieldCheck,
      content: (
        <div className="space-y-2.5 text-xs text-slate-300">
          <p>
            As a beginner, <strong>always choose Delivery (CNC)</strong>. Here is why:
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30">
              <span className="text-emerald-400 font-bold block text-xs">Delivery (CNC) 🏆</span>
              <span className="text-[10px] text-slate-400 block mt-1 leading-snug">
                • <strong>₹0 Brokerage</strong> on Vanguard Trade.
                <br />• You own the shares permanently in your Demat.
                <br />• Zero daily rush: hold for days, months, or 10 years!
              </span>
            </div>
            <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/30">
              <span className="text-rose-400 font-bold block text-xs">Intraday (MIS) ⚠️</span>
              <span className="text-[10px] text-slate-400 block mt-1 leading-snug">
                • High risk day-trading.
                <br />• Must buy & sell before <strong>03:20 PM today</strong>.
                <br />• Auto-squared off by exchange with penalty if left open.
              </span>
            </div>
          </div>
        </div>
      ),
    },
    {
      step: 3,
      title: 'How to pick your first stock safely',
      subtitle: 'Invest in what you already know and trust',
      icon: Search,
      content: (
        <div className="space-y-2.5 text-xs text-slate-300">
          <p>
            You don't need a finance degree to start. The best first investment is usually an industry leader whose products you or your family use daily:
          </p>
          <div className="space-y-1.5">
            {[
              { name: 'Reliance Industries', desc: 'Jio 5G SIM, Trends, Smart Bazaar grocery stores' },
              { name: 'Tata Motors', desc: 'Electric vehicles (Nexon, Tiago) & commercial trucks' },
              { name: 'HDFC Bank', desc: 'India’s most trusted private bank for salary & savings' },
              { name: 'TCS', desc: 'Global technology giant employing 600,000+ IT engineers' },
            ].map((s) => (
              <div key={s.name} className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center text-[11px]">
                <strong className="text-white">{s.name}</strong>
                <span className="text-slate-400">{s.desc}</span>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      step: 4,
      title: 'How much money do you need?',
      subtitle: 'Start with just 1 single share (Even ₹500 or ₹1,000)',
      icon: HelpCircle,
      content: (
        <div className="space-y-2.5 text-xs text-slate-300">
          <p>
            In India, there is <strong>no minimum lot</strong> for regular stocks. You can buy exactly <strong>1 single share</strong> of any company!
          </p>
          <div className="p-3 rounded-xl bg-indigo-950/20 border border-indigo-500/30 space-y-1 text-xs">
            <span className="font-bold text-indigo-300 block">Example First Trade:</span>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Buy 1 share of Tata Motors @ ~₹884.
              <br />Brokerage = ₹0.
              <br />SEBI & Govt Taxes = ~₹1.30.
              <br />Total Needed = ₹885.30. That's it!
            </p>
          </div>
        </div>
      ),
    },
    {
      step: 5,
      title: 'Ready for your first investment?',
      subtitle: 'Use our Google Stock Helper or pick a starter stock',
      icon: CheckCircle2,
      content: (
        <div className="space-y-3 text-xs text-slate-300 text-center">
          <p>
            Did you search a stock on Google and want to invest? Or want to buy your first blue-chip share in 30 seconds?
          </p>
          <div className="space-y-2 pt-1">
            <button
              onClick={() => {
                setGuideOpen(false);
                setGoogleSearchModalOpen(true);
              }}
              className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-[#6C5CE7] to-[#00E676] text-slate-950 shadow-lg shadow-[#6C5CE7]/30 flex items-center justify-center gap-1.5 transition-all transform active:scale-95"
            >
              <Search className="w-4 h-4" />
              <span>Open "Search from Google" Stock Assistant</span>
            </button>
            <button
              onClick={() => {
                setGuideOpen(false);
                const rel = stocks.find((s) => s.symbol === 'RELIANCE') || stocks[0];
                openOrderSheet(rel, 'BUY');
              }}
              className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs bg-slate-900 border border-slate-700 text-white hover:bg-slate-800 transition-all"
            >
              Buy 1 Share of Reliance (Zero Brokerage Delivery)
            </button>
          </div>
        </div>
      ),
    },
  ];

  const glossaryItems = [
    { term: 'LTP (Last Traded Price)', desc: 'The exact real-time price at which the most recent share transaction occurred on the NSE or BSE.' },
    { term: 'CNC (Cash & Carry Delivery)', desc: 'Buying shares to keep permanently in your Demat account. Zero brokerage charged. Safe for long term.' },
    { term: 'MIS (Margin Intraday)', desc: 'Day-trading segment with 5x leverage where all trades must be closed before 3:20 PM on the same day.' },
    { term: 'Demat Account', desc: 'Your electronic digital vault maintained with CDSL/NSDL where your shares are safely credited.' },
    { term: 'Stop-Loss (SL)', desc: 'An automated safety order that sells your share if the price drops to a set trigger point, capping your loss.' },
    { term: 'STT (Securities Transaction Tax)', desc: 'A tiny statutory tax (0.1%) mandated by the Government of India on stock turnover.' },
    { term: 'Dividend', desc: 'A share of the company profits distributed directly in cash into your linked bank account.' },
    { term: 'Bullish vs Bearish', desc: 'Bullish means expecting prices to rise; Bearish means expecting prices to fall.' },
  ];

  const currentStepData = steps[activeGuideStep] || steps[0];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4">
      <div className="w-full sm:max-w-lg bg-[#161B26] border border-slate-800 rounded-t-3xl sm:rounded-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-6">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#6C5CE7] to-[#00E676] flex items-center justify-center text-slate-950 font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">New Investor Interactive Guide</h3>
              <p className="text-[10px] text-slate-400">Step-by-step masterclass for first-time investors</p>
            </div>
          </div>
          <button
            onClick={() => setGuideOpen(false)}
            className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-800 bg-slate-900/60 px-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('TUTORIAL')}
            className={`py-2.5 px-3 border-b-2 transition-all ${
              activeTab === 'TUTORIAL' ? 'border-[#6C5CE7] text-white' : 'border-transparent text-slate-400'
            }`}
          >
            5-Step Investing Tutorial
          </button>
          <button
            onClick={() => setActiveTab('GLOSSARY')}
            className={`py-2.5 px-3 border-b-2 transition-all ${
              activeTab === 'GLOSSARY' ? 'border-[#6C5CE7] text-white' : 'border-transparent text-slate-400'
            }`}
          >
            Jargon Glossary (Plain English)
          </button>
          <button
            onClick={() => setActiveTab('STARTER_STOCKS')}
            className={`py-2.5 px-3 border-b-2 transition-all ${
              activeTab === 'STARTER_STOCKS' ? 'border-[#6C5CE7] text-white' : 'border-transparent text-slate-400'
            }`}
          >
            Recommended Starter Stocks
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeTab === 'TUTORIAL' && (
            <div className="space-y-4">
              {/* Step indicator bar */}
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>Step {activeGuideStep + 1} of {steps.length}</span>
                <div className="flex gap-1.5">
                  {steps.map((_, i) => (
                    <div
                      key={i}
                      onClick={() => setActiveGuideStep(i)}
                      className={`w-6 h-1.5 rounded-full cursor-pointer transition-all ${
                        activeGuideStep === i ? 'bg-[#6C5CE7] scale-105' : 'bg-slate-800'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Current Step Card */}
              <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
                    <currentStepData.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">{currentStepData.title}</h4>
                    <span className="text-[11px] text-indigo-300">{currentStepData.subtitle}</span>
                  </div>
                </div>

                {currentStepData.content}
              </div>

              {/* Stepper Navigation Buttons */}
              <div className="flex items-center justify-between pt-1">
                <button
                  disabled={activeGuideStep === 0}
                  onClick={() => setActiveGuideStep(Math.max(0, activeGuideStep - 1))}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 font-semibold disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>

                {activeGuideStep < steps.length - 1 ? (
                  <button
                    onClick={() => setActiveGuideStep(Math.min(steps.length - 1, activeGuideStep + 1))}
                    className="px-4 py-2 rounded-xl bg-[#6C5CE7] hover:bg-[#5a48e0] text-xs text-white font-bold flex items-center gap-1 shadow-md shadow-[#6C5CE7]/30"
                  >
                    <span>Next Step</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setGuideOpen(false);
                      setGoogleSearchModalOpen(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-[#00E676] hover:bg-[#00c864] text-xs text-slate-950 font-bold flex items-center gap-1 shadow-md shadow-[#00E676]/30"
                  >
                    <span>Try Google Stock Helper</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {activeTab === 'GLOSSARY' && (
            <div className="space-y-2">
              <p className="text-xs text-slate-400">
                Tap or read common financial terms translated into simple human English:
              </p>
              <div className="space-y-2">
                {glossaryItems.map((item) => (
                  <div key={item.term} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-0.5">
                    <span className="text-xs font-bold text-indigo-300">{item.term}</span>
                    <p className="text-[11px] text-slate-300 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'STARTER_STOCKS' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400">
                Top NIFTY 50 blue-chip companies with established track records recommended for first-time retail investors:
              </p>
              <div className="space-y-2.5">
                {stocks.filter((s) => s.beginnerInsight).map((stock) => (
                  <div
                    key={stock.symbol}
                    className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 space-y-2"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white text-sm">{stock.symbol}</span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/15 text-[#00E676] font-semibold">
                            {stock.beginnerInsight?.riskLevel} Risk
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">{stock.name}</p>
                      </div>

                      <button
                        onClick={() => {
                          setGuideOpen(false);
                          openOrderSheet(stock, 'BUY');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-[#00E676] hover:bg-[#00c864] text-slate-950 font-bold text-xs"
                      >
                        Invest @ ₹{stock.price.toFixed(2)}
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-300 leading-snug">
                      {stock.beginnerInsight?.summary}
                    </p>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                      <span><strong>Ideal For:</strong> {stock.beginnerInsight?.idealFor}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
