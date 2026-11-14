import React, { useState, useRef, useEffect } from 'react';
import { useTrading } from '../context/TradingContext';
import { Stock } from '../types';
import {
  Sparkles,
  Send,
  X,
  Bot,
  User,
  Copy,
  Check,
  Volume2,
  VolumeX,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Search,
  BookOpen,
  HelpCircle,
  BarChart2,
  Zap,
} from 'lucide-react';
import { formatINR } from '../utils/formatters';

interface ChatMessage {
  id: string;
  sender: 'user' | 'model';
  text: string;
  timestamp: string;
  stocksMentioned?: Stock[];
  latencyMs?: number;
  isStreaming?: boolean;
}

export const StockMasterChatModal: React.FC = () => {
  const {
    stockMasterModalOpen,
    setStockMasterModalOpen,
    stocks,
    openOrderSheet,
    setSelectedStock,
    mode,
    stockMasterInitialPrompt,
  } = useTrading();

  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [selectedStockContext, setSelectedStockContext] = useState<Stock | null>(null);
  const [activeCategory, setActiveCategory] = useState<'all' | 'terms' | 'doubts' | 'stocks' | 'taxes'>('all');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize with an introductory welcome message
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'model',
      text: `**Namaste! I am DhanGuru — your Vanguard Stock Market Master AI.** 🇮🇳

I have complete mastery over the Indian Stock Market (NSE & BSE), SEBI regulations, technical indicators, and wealth strategies.

**Here is how I can help you today:**
• **Decode Any Financial Term:** Ask about *CNC vs MIS*, *STT & SEBI charges*, *T+1 Settlement*, *VWAP*, *P/E Ratio*, or *Level-2 Market Depth*.
• **Clear Every Beginner Doubt:** Wondering *"Is stock market safe for me?"*, *"What happens if a stock hits lower circuit?"*, or *"Can I lose more than my cash in intraday?"*
• **Tax Implications:** Master the new Union Budget rules for *STCG (20%)* and *LTCG (12.5% over ₹1.25L)*.
• **Stock Analysis:** Get institutional-grade breakdowns of any stock (e.g. *Reliance, Tata Motors, HDFC Bank, Zomato, Waaree Energies*).

*Select a popular question below or type any doubt in your mind!*`,
      timestamp: 'Just now',
      latencyMs: 12,
    },
  ]);

  // Quick suggestion prompts
  const suggestionCategories = [
    {
      id: 'market_action',
      label: '🎯 Market Picks',
      queries: [
        'What is the best stock to invest in today?',
        'Give me a diversified stock basket for today',
        'Analyze Tata Motors: EV market share & demerger',
      ],
    },
    {
      id: 'terms',
      label: '📖 Market Terms',
      queries: [
        'Explain CNC vs MIS with examples',
        'What is STT & SEBI charges in India?',
        'How does T+1 Settlement work in Demat?',
        'What is VWAP and why do institutions use it?',
        'What is P/E Ratio and what is a good number?',
      ],
    },
    {
      id: 'doubts',
      label: '❓ Beginner Doubts',
      queries: [
        'What happens when a stock hits Upper or Lower Circuit?',
        'Can I lose more money than I invested in Delivery vs MIS?',
        'What is the difference between Market Order and Limit Order?',
        'How does Stop Loss (SL) protect my capital?',
      ],
    },
    {
      id: 'taxes',
      label: '💰 Tax & Rules',
      queries: [
        'Explain Indian stock tax: STCG 20% vs LTCG 12.5%',
        'How does Tax-Loss Harvesting save money before March 31?',
        'What is ASBA and how does UPI mandate work in IPOs?',
        'SIP vs Lumpsum: which gives higher compounding?',
      ],
    },
    {
      id: 'stocks',
      label: '📊 Stock Breakdowns',
      queries: [
        'Analyze Reliance Industries: business pillars & growth',
        'Analyze Tata Motors: EV market share and demerger',
        'Is Zomato profitable now with Blinkit quick commerce?',
        'Waaree Energies: solar order book & PLI scheme',
      ],
    },
  ];

  // Auto-scroll on new message or stream chunk
  useEffect(() => {
    if (stockMasterModalOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, stockMasterModalOpen, isLoading]);

  // Handle initial prompt if opened with one
  useEffect(() => {
    if (stockMasterModalOpen && stockMasterInitialPrompt) {
      handleSendMessage(stockMasterInitialPrompt);
    }
  }, [stockMasterModalOpen, stockMasterInitialPrompt]);

  // Focus input when modal opens
  useEffect(() => {
    if (stockMasterModalOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    } else {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        setSpeakingId(null);
      }
    }
  }, [stockMasterModalOpen]);

  // Extract stocks mentioned in text
  const detectStocks = (text: string): Stock[] => {
    const found: Stock[] = [];
    const upper = text.toUpperCase();
    stocks.forEach((s) => {
      const symbolMatch = upper.includes(s.symbol);
      const nameMatch = text.toLowerCase().includes(s.name.toLowerCase());
      if (symbolMatch || nameMatch) {
        if (!found.find((f) => f.symbol === s.symbol)) {
          found.push(s);
        }
      }
    });
    return found.slice(0, 4);
  };

  const handleSendMessage = async (queryToSend?: string) => {
    const text = (queryToSend || inputQuery).trim();
    if (!text || isLoading) return;

    const requestStartTime = Date.now();
    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);

    const aiMsgId = `ai-${Date.now()}`;
    let accumulatedText = '';
    let streamSucceeded = false;

    // Initialize an empty streaming placeholder message for instant visual feedback
    const placeholderAiMsg: ChatMessage = {
      id: aiMsgId,
      sender: 'model',
      text: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isStreaming: true,
    };
    setMessages((prev) => [...prev, placeholderAiMsg]);

    try {
      // Step 1: Attempt real-time streaming endpoint for instant token delivery (<100ms)
      const streamUrl = `/api/chat/stream?message=${encodeURIComponent(text)}&mode=${mode}&stockSymbol=${
        selectedStockContext?.symbol || ''
      }&stockPrice=${selectedStockContext?.price || ''}`;

      const response = await fetch(streamUrl);

      if (response.ok && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('data:')) {
              const dataStr = trimmed.replace(/^data:\s*/, '');
              if (dataStr === '[DONE]') {
                break;
              }
              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.text) {
                  accumulatedText += parsed.text;
                  streamSucceeded = true;
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === aiMsgId
                        ? { ...msg, text: accumulatedText, isStreaming: true }
                        : msg
                    )
                  );
                }
              } catch {
                // Ignore parse errors on partial frames
              }
            }
          }
        }
      }

      // If stream succeeded and received tokens, finalize message
      if (streamSucceeded && accumulatedText.trim().length > 0) {
        const totalDuration = Date.now() - requestStartTime;
        const mentioned = detectStocks(accumulatedText + ' ' + text);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMsgId
              ? {
                  ...msg,
                  text: accumulatedText,
                  isStreaming: false,
                  latencyMs: totalDuration,
                  stocksMentioned: mentioned.length > 0 ? mentioned : undefined,
                }
              : msg
          )
        );
        setIsLoading(false);
        return;
      }
    } catch (streamErr) {
      console.warn('SSE streaming encountered error, falling back to instant REST endpoint:', streamErr);
    }

    // Step 2: Fallback to optimized /api/chat with low-thinking config & cached knowledge
    try {
      const restResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          contextStock: selectedStockContext
            ? {
                symbol: selectedStockContext.symbol,
                name: selectedStockContext.name,
                price: selectedStockContext.price,
                changePercent: selectedStockContext.changePercent,
                peRatio: selectedStockContext.peRatio,
                marketCap: selectedStockContext.marketCap,
              }
            : undefined,
          mode,
        }),
      });

      if (!restResponse.ok) {
        throw new Error(`HTTP error! status: ${restResponse.status}`);
      }

      const data = await restResponse.json();
      const replyText = data.reply || "I'm having trouble analyzing this right now. Please try again.";
      const duration = data.latencyMs || Date.now() - requestStartTime;
      const mentionedStocks = detectStocks(replyText + ' ' + text);

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMsgId
            ? {
                ...msg,
                text: replyText,
                isStreaming: false,
                latencyMs: duration,
                stocksMentioned: mentionedStocks.length > 0 ? mentionedStocks : undefined,
              }
            : msg
        )
      );
    } catch (err) {
      console.warn('Backend /api/chat unavailable, using local DhanGuru engine:', err);
      const q = text.toLowerCase();
      const matchedStock = stocks.find(
        (s) =>
          q.includes(s.symbol.toLowerCase()) ||
          q.includes(s.name.toLowerCase().split(' ')[0])
      );

      let fallbackText = '';
      const isFinanceQuery =
        matchedStock ||
        /(stock|share|nifty|sensex|banknifty|buy|sell|invest|ipo|sip|mutual|demat|tax|stcg|ltcg|cnc|mis|brokerage|rsi|macd|market|portfolio|sector|loss|profit|stop loss|sl)/i.test(
          q
        );

      if (!isFinanceQuery) {
        fallbackText = `⚠️ **Out of Scope — Financial & Indian Market Specialist Only**\n\nI am **DhanGuru**, specialized exclusively in NSE/BSE stocks, IPOs, Mutual Funds, SEBI rules, and portfolio analytics.\n\nTry asking:\n• *"Should I buy ${selectedStockContext?.symbol || 'TATAMOTORS'} today?"*\n• *"Compare CNC Delivery vs MIS Intraday"*\n• *"Explain STCG 20% and LTCG 12.5% tax rules"*`;
      } else if (matchedStock) {
        const up = matchedStock.changePercent >= 0;
        fallbackText = `📊 **${matchedStock.name} (${matchedStock.symbol}) — Live Snapshot**\n\n• **LTP:** ₹${matchedStock.price.toFixed(2)} (${up ? '+' : ''}${matchedStock.changePercent.toFixed(2)}%)\n• **P/E Ratio:** ${matchedStock.peRatio} • **Market Cap:** ₹${matchedStock.marketCap.toLocaleString('en-IN')} Cr\n• **Technical Signals:** RSI ${matchedStock.technical.rsi} • MACD: ${matchedStock.technical.macd} • VWAP ₹${matchedStock.technical.vwap}\n\n*SEBI Note: Educational analysis only — use Delivery (CNC) for long-term investing with ₹0 brokerage.*`;
      } else if (/which stock|best stock|invest today|recommend/i.test(q)) {
        fallbackText = `🏆 **DhanGuru Top Conviction Focus: Tata Motors (\`TATAMOTORS\`)**\n\n• **Sector:** Auto & EV Leader (70%+ India passenger EV market share)\n• **Investment Mode:** Prefer **Delivery (CNC)** at ₹0 brokerage rather than leveraged MIS.\n• **Diversified Alternative:** Pair with **RELIANCE** or **HDFCBANK** for large-cap stability.\n\n*Disclaimer: Educational market overview only, not personalized SEBI investment advice.*`;
      } else {
        fallbackText = `**DhanGuru Market Intelligence:**\n\n• **Delivery (CNC):** ₹0 brokerage, permanent CDSL Demat ownership, zero 3:20 PM auto-square-off risk.\n• **Intraday (MIS):** Up to 5x margin with mandatory Stop Loss before 3:20 PM IST.\n• **Union Budget 2024 Taxes:** STCG is 20% (< 1 year); LTCG is 12.5% (> 1 year, first ₹1.25L exempt).\n\nTap any stock in your Watchlist to inspect live Level-2 depth and technicals!`;
      }

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMsgId
            ? {
                ...msg,
                text: fallbackText,
                isStreaming: false,
                latencyMs: Date.now() - requestStartTime,
              }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSpeak = (id: string, text: string) => {
    if (!('speechSynthesis' in window)) return;

    if (speakingId === id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text
      .replace(/[*#_`]/g, '')
      .replace(/•/g, '')
      .replace(/₹/g, ' Rupees ');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05;
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);

    setSpeakingId(id);
    window.speechSynthesis.speak(utterance);
  };

  const handleResetChat = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setSpeakingId(null);
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'model',
        text: `**Chat reset.** I am DhanGuru AI, ready with ultra-fast latency (<50ms) to answer any stock query, decode financial terms, or analyze your portfolio. What would you like to explore?`,
        timestamp: 'Just now',
        latencyMs: 8,
      },
    ]);
  };

  if (!stockMasterModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4">
      <div className="w-full sm:max-w-2xl bg-[#161B26] border border-slate-800 rounded-t-3xl sm:rounded-2xl h-[92vh] sm:h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-6">
        
        {/* Header */}
        <div className="p-3.5 sm:p-4 border-b border-slate-800 bg-[#0B0E14]/90 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#6C5CE7] to-[#00E676] flex items-center justify-center text-slate-950 font-black shadow-lg shadow-[#6C5CE7]/30 ring-1 ring-white/20">
              <Bot className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-white text-sm tracking-tight">
                  DhanGuru AI
                </h3>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-semibold bg-emerald-500/15 text-[#00E676] border border-[#00E676]/30">
                  Stock Master
                </span>
                <span className="flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-mono font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                  <Zap className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                  Turbo Engine
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                Low-latency Indian stock mentor • NSE/BSE • SEBI Tax Rules • Fast-Response
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Reset Chat button */}
            <button
              onClick={handleResetChat}
              title="Reset Conversation"
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Close Modal button */}
            <button
              onClick={() => setStockMasterModalOpen(false)}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stock Context Selector Strip */}
        <div className="px-3.5 py-2 border-b border-slate-800/80 bg-slate-900/60 flex items-center justify-between text-xs overflow-x-auto no-scrollbar gap-2">
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Target Stock:
            </span>
            {selectedStockContext ? (
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-[#6C5CE7]/20 border border-[#6C5CE7]/40 text-indigo-300 font-mono font-bold text-[11px]">
                {selectedStockContext.symbol} • {formatINR(selectedStockContext.price)}
                <button
                  onClick={() => setSelectedStockContext(null)}
                  className="hover:text-white ml-0.5"
                  title="Clear stock context"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ) : (
              <span className="text-[11px] text-slate-400 italic">
                General Indian Market Advice
              </span>
            )}
          </div>

          {/* Quick stock selector chips */}
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-[10px] text-slate-400">Attach:</span>
            {stocks.slice(0, 4).map((s) => (
              <button
                key={s.symbol}
                onClick={() => setSelectedStockContext(s)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-all ${
                  selectedStockContext?.symbol === s.symbol
                    ? 'bg-[#6C5CE7] text-white font-bold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {s.symbol}
              </button>
            ))}
          </div>
        </div>

        {/* Message Thread Body */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-4 bg-gradient-to-b from-[#161B26] to-[#0E121B]">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2.5 sm:gap-3 ${
                msg.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.sender === 'model' && (
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#6C5CE7] to-[#00E676] flex items-center justify-center text-slate-950 shrink-0 mt-0.5 shadow-sm">
                  <Bot className="w-4 h-4 text-slate-950" />
                </div>
              )}

              <div
                className={`max-w-[88%] sm:max-w-[80%] rounded-2xl p-3.5 sm:p-4 shadow-md ${
                  msg.sender === 'user'
                    ? 'bg-[#6C5CE7] text-white rounded-br-xs'
                    : 'bg-[#1E2536] border border-slate-700/60 text-slate-100 rounded-bl-xs'
                }`}
              >
                {/* Formatted Message Text */}
                <div className="text-xs sm:text-[13px] leading-relaxed space-y-2 whitespace-pre-wrap">
                  {msg.text.length === 0 && msg.isStreaming ? (
                    <div className="flex items-center gap-1.5 text-slate-400 py-1">
                      <span className="w-2 h-2 rounded-full bg-[#00E676] animate-ping" />
                      <span className="font-mono text-[11px] text-[#00E676]">
                        Streaming response...
                      </span>
                    </div>
                  ) : (
                    msg.text.split('\n\n').map((paragraph, pIdx) => {
                      return (
                        <p key={pIdx}>
                          {paragraph.split('\n').map((line, lIdx) => {
                            const isBullet = line.startsWith('•') || line.startsWith('-');
                            const isNumbered = /^\d+\./.test(line);
                            const parts = line.split(/(\*\*.*?\*\*)/g);

                            return (
                              <span
                                key={lIdx}
                                className={`block ${
                                  isBullet || isNumbered ? 'pl-2 border-l border-slate-600/40 my-0.5' : ''
                                }`}
                              >
                                {parts.map((part, partIdx) => {
                                  if (part.startsWith('**') && part.endsWith('**')) {
                                    return (
                                      <strong
                                        key={partIdx}
                                        className="font-bold text-white tracking-wide"
                                      >
                                        {part.slice(2, -2)}
                                      </strong>
                                    );
                                  }
                                  return part;
                                })}
                              </span>
                            );
                          })}
                        </p>
                      );
                    })
                  )}
                  {msg.isStreaming && msg.text.length > 0 && (
                    <span className="inline-block w-1.5 h-3.5 bg-[#00E676] ml-1 animate-pulse align-middle" />
                  )}
                </div>

                {/* Stock Mentions Action Cards (If AI recommends or analyzes stocks) */}
                {msg.stocksMentioned && msg.stocksMentioned.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-700/70 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
                      ⚡ Direct Market Action:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {msg.stocksMentioned.map((stk) => (
                        <div
                          key={stk.symbol}
                          className="p-2 rounded-xl bg-slate-900/90 border border-slate-700 flex items-center justify-between gap-2"
                        >
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-white text-xs">{stk.symbol}</span>
                              <span
                                className={`text-[10px] font-mono ${
                                  stk.change >= 0 ? 'text-[#00E676]' : 'text-[#FF5252]'
                                }`}
                              >
                                {formatINR(stk.price)}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 line-clamp-1">
                              {stk.name}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setStockMasterModalOpen(false);
                                setSelectedStock(stk);
                              }}
                              className="p-1 rounded bg-slate-800 text-slate-300 hover:text-white"
                              title="View Chart"
                            >
                              <BarChart2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setStockMasterModalOpen(false);
                                openOrderSheet(stk, 'BUY');
                              }}
                              className="px-2 py-1 rounded bg-[#00E676] hover:bg-[#00c864] text-slate-950 font-bold text-[10px] flex items-center gap-1 shadow-xs"
                            >
                              <span>Buy CNC</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Out of Scope Quick Topic Redirect Pills */}
                {msg.sender === 'model' &&
                  (msg.text.includes('Out-of-Scope') ||
                    msg.text.includes('Outside DhanGuru') ||
                    msg.text.includes('Non-Financial Topic') ||
                    msg.text.includes('Financial Terminal Boundary') ||
                    msg.text.includes('Dalal Street territory')) && (
                    <div className="mt-3 pt-2.5 border-t border-slate-700/60 space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
                        💡 Suggested Dalal Street Questions:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { label: '📖 CNC vs MIS Explained', query: 'Explain CNC vs MIS with zero delivery brokerage' },
                          { label: '⚡ How T+1 Demat works', query: 'How does T+1 Settlement work in Demat?' },
                          { label: '💰 Budget 2024 Taxes', query: 'Explain Indian stock tax: STCG 20% vs LTCG 12.5%' },
                          { label: '🚗 Analyze Tata Motors', query: 'Analyze Tata Motors: EV market share and demerger' },
                        ].map((chip) => (
                          <button
                            key={chip.label}
                            type="button"
                            onClick={() => handleSendMessage(chip.query)}
                            className="px-2 py-1 rounded-lg bg-indigo-950/60 hover:bg-indigo-900 border border-indigo-500/30 text-[10px] text-indigo-300 font-medium transition-all active:scale-95 flex items-center gap-1"
                          >
                            <span>{chip.label}</span>
                            <ArrowRight className="w-2.5 h-2.5 text-indigo-400" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Bubble Footer & Actions */}
                <div className="mt-2.5 pt-1.5 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-700/40">
                  <div className="flex items-center gap-2 font-mono">
                    <span>{msg.timestamp}</span>
                    {msg.latencyMs !== undefined && (
                      <span className="flex items-center gap-0.5 text-emerald-400 font-semibold bg-emerald-500/10 px-1 rounded border border-emerald-500/20">
                        <Zap className="w-2.5 h-2.5" />
                        {msg.latencyMs}ms
                      </span>
                    )}
                  </div>
                  {msg.sender === 'model' && !msg.isStreaming && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopy(msg.id, msg.text)}
                        className="hover:text-white flex items-center gap-1 transition-colors"
                        title="Copy Response"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-[#00E676]" />
                            <span className="text-[#00E676]">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleSpeak(msg.id, msg.text)}
                        className={`hover:text-white flex items-center gap-1 transition-colors ${
                          speakingId === msg.id ? 'text-[#00E676]' : ''
                        }`}
                        title="Listen to audio"
                      >
                        {speakingId === msg.id ? (
                          <>
                            <VolumeX className="w-3 h-3 animate-pulse" />
                            <span>Stop</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3 h-3" />
                            <span>Read Out</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {msg.sender === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {/* Typing Loading Indicator when stream has not yet sent first byte */}
          {isLoading && !messages.some((m) => m.isStreaming && m.text.length > 0) && (
            <div className="flex gap-2.5 items-center text-xs text-slate-400 animate-in fade-in duration-150">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#6C5CE7] to-[#00E676] flex items-center justify-center text-slate-950 shrink-0">
                <Bot className="w-4 h-4 text-slate-950" />
              </div>
              <div className="px-3.5 py-2 rounded-2xl bg-[#1E2536] border border-slate-700 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00E676] animate-ping" />
                <span className="text-[11px] font-mono text-slate-300">
                  ⚡ DhanGuru Turbo retrieving analysis...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion Chips Section */}
        <div className="p-2 sm:p-3 border-t border-slate-800/80 bg-slate-950/60 space-y-1.5">
          {/* Category Tabs */}
          <div className="flex gap-1 overflow-x-auto no-scrollbar">
            {suggestionCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id as any)}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-medium whitespace-nowrap transition-all ${
                  activeCategory === cat.id
                    ? 'bg-[#6C5CE7] text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Chips */}
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {(
              suggestionCategories.find((c) => c.id === activeCategory)?.queries ||
              suggestionCategories[0].queries
            ).map((q) => (
              <button
                key={q}
                onClick={() => handleSendMessage(q)}
                className="px-2.5 py-1 rounded-xl text-[11px] font-medium bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-[#6C5CE7] whitespace-nowrap transition-all shadow-xs active:scale-95 flex items-center gap-1"
              >
                <span>⚡ {q}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Query Input Box */}
        <div className="p-3 sm:p-4 border-t border-slate-800 bg-[#0B0E14] flex items-center gap-2">
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              placeholder={
                selectedStockContext
                  ? `Ask DhanGuru about ${selectedStockContext.symbol} (e.g. fair value, risks, delivery safety)...`
                  : 'Ask any stock doubt, trading term, or tax query (e.g. CNC vs MIS, STT, P/E)...'
              }
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              className="w-full bg-[#161B26] border border-slate-700 rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-[#6C5CE7] transition-all"
            />
          </div>

          <button
            onClick={() => handleSendMessage()}
            disabled={!inputQuery.trim() || isLoading}
            className={`p-2.5 rounded-xl font-bold transition-all shadow-md ${
              inputQuery.trim() && !isLoading
                ? 'bg-gradient-to-r from-[#6C5CE7] to-[#00E676] text-slate-950 hover:opacity-90 active:scale-95'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
            title="Send query"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
