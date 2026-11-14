import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Proxy /__/auth/* to Firebase Auth domain so popup/redirect stays on app domain without exposing *.firebaseapp.com
app.use('/__/auth', async (req: Request, res: Response) => {
  try {
    const targetUrl = `https://resounding-outpost-d8f9p.firebaseapp.com/__/auth${req.url}`;
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        host: 'resounding-outpost-d8f9p.firebaseapp.com',
        accept: req.headers.accept || '*/*',
      },
    });
    res.status(response.status);
    response.headers.forEach((val, key) => {
      if (key.toLowerCase() !== 'content-encoding') {
        res.setHeader(key, val);
      }
    });
    const text = await response.text();
    res.send(text);
  } catch (err: any) {
    console.error('Failed to proxy /__/auth:', err);
    res.status(500).send('Auth proxy error');
  }
});

// In-memory response cache for lightning-fast repeat queries (<5ms)
const chatResponseCache = new Map<string, string>();
const MAX_CACHE_SIZE = 150;

function setCachedResponse(key: string, value: string) {
  if (chatResponseCache.size >= MAX_CACHE_SIZE) {
    const firstKey = chatResponseCache.keys().next().value;
    if (firstKey) chatResponseCache.delete(firstKey);
  }
  chatResponseCache.set(key.toLowerCase().trim(), value);
}

function getCachedResponse(key: string): string | undefined {
  return chatResponseCache.get(key.toLowerCase().trim());
}

// Initialize Gemini SDK with User-Agent header for telemetry
const getGenAIClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  // If API key is missing or is the default template placeholder, return null immediately to avoid 2-second network timeout
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.startsWith('MY_') || apiKey.length < 15) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// Built-in High-Performance Indian Stock Market Knowledge Base
const masterStockKnowledge: Record<string, string> = {
  'best stock to invest today': `🏆 **DhanGuru Top Conviction Pick: Tata Motors (\`TATAMOTORS\`)** 🇮🇳🚗

If you are looking for the **single best stock** to invest in today based on current Dalal Street fundamentals, the highest conviction pick is **Tata Motors**:

• **Live Accumulation Zone:** ~₹780–₹820 range via **Delivery (CNC)**.
• **Top 3 Catalysts Making it the #1 Pick Today:**
  1. **EV Monopoly in India:** Commands 70%+ market share in passenger electric vehicles (Nexon EV, Punch EV, Curvv EV).
  2. **JLR Deleveraging:** Record cash flows from Jaguar Land Rover (Defender & Range Rover) with auto net debt reduced to zero.
  3. **Demerger Value Unlock:** Splitting into two pure-play listed entities (Commercial Vehicles & Passenger/EV) in 2025, unlocking standalone value for shareholders.

• **How to Invest Today (Safety-First):**
  - **Product:** Buy via **Delivery (CNC)** with **₹0 Brokerage** on Vanguard Trade (zero 3:20 PM forced square-off risk).
  - **Strategy:** Stagger in tranches (buy 40% today, keep 60% for dips).
  - **Horizon & Tax:** 12+ months (qualifies for 12.5% LTCG with first ₹1.25L profit 100% tax-free!).

💡 *Defensive Alternative: **Reliance (\`RELIANCE\`)** for low-volatility large-cap safety, or ask **"Give me a diversified stock basket"** if you want to see multiple sectors!*`,

  'which stock to invest today': `**DhanGuru Market Intelligence: Where to Invest Today (Current Market Setup)** 🇮🇳📊

*SEBI Investor Framework: Never buy on unverified tips. Here is how institutional desks structure current market opportunities across risk profiles:*

### 1. 🛡️ Foundation Compounders Basket (Low Risk • 1–3 Year Horizon)
• **Tata Motors (\`TATAMOTORS\`):**
  - *Why Today:* Undisputed EV leader (70%+ passenger EV market share in India); record JLR cash flows and aggressive net debt reduction; upcoming demerger into Commercial Vehicles (CV) and Passenger/EV (PV) unlocking shareholder value.
  - *Action:* Accumulate via **Delivery (CNC)** on dips with zero time pressure.
• **Reliance Industries (\`RELIANCE\`):**
  - *Why Today:* Heavyweight cornerstone of NIFTY 50 (~9% index weight). Relentless 5G monetization (Jio with 500M+ users), 18,000+ retail stores, and multi-gigawatt Jamnagar green hydrogen/solar ecosystem.
  - *Action:* Ideal core holding for safe compounding and low volatility.
• **HDFC Bank (\`HDFCBANK\`):**
  - *Why Today:* India's banking titan trading at attractive historical valuation multiples post-merger. Strong credit expansion and pristine asset quality.

### 2. 🚀 Hyper-Growth & Energy Transition Basket (Moderate Risk)
• **Zomato (\`ZOMATO\`):**
  - *Why Today:* Quick commerce leader via **Blinkit** expanding dark stores rapidly with turning positive adjusted EBITDA. Resilient food delivery cash engine.
• **Waaree Energies (\`WAAREE\`):**
  - *Why Today:* India's largest solar PV module manufacturer (13+ GW capacity) riding government tailwinds from *PM Surya Ghar Muft Bijli Yojana* and booming US export orders.

---

### 💡 3 Golden Rules for Investing Today:
1. **The Tranche Method (30-30-40):** Never deploy 100% cash in one go. Buy 35% today, reserve 35% for minor market pullbacks, and 30% after confirmation.
2. **Delivery (CNC) Over Intraday:** Always choose **Delivery (CNC)** with **₹0 Brokerage** on Vanguard Trade. You own actual shares in CDSL Demat with zero forced 3:20 PM square-off risk.
3. **Budget 2024 Tax Advantage:** Hold for more than 12 months to qualify for **12.5% Long-Term Capital Gains (LTCG)** — and remember your first **₹1.25 Lakh profit is 100% tax-free**!`,

  'beginner vs pro': `**Beginner Mode vs Pro Mode in Vanguard Trade** ⚖️

Here is how the two modes compare across UI, Risk Safeguards, and Execution:

| Feature / Aspect | 🌟 Beginner Mode | ⚡ Pro Mode |
| :--- | :--- | :--- |
| **Primary Goal** | Safe, low-stress investing & wealth building | High-speed active trading & intraday momentum |
| **Watchlist UI** | Plain-English summaries (e.g. "Google of India"), Risk badges (Low/Moderate/High), and "Why Invest" rationale | High-density technical tape with VWAP, 52W High/Low range, Volume (Lakhs), and Breadth (Advance/Decline) |
| **Default Product** | **Delivery (CNC)** (100% upfront cash, ₹0 brokerage, shares credited to Demat) | Open access to **Intraday (MIS)** (5x leverage) & **Margin (MTF)** (4x leverage) |
| **Default Quantity** | 1 Share (capital-safe testing) | 10+ Shares (customizable lot sizing) |
| **Safety Intercepts** | Mandatory **Risk Warning & Confirmation Dialog** before entering high-leverage Intraday (MIS) trades explaining 3:20 PM auto square-off | Streamlined 1-click execution designed for low latency |
| **AI Stock Master** | Jargon-free explanations, plain analogies, tax advice (LTCG vs STCG), and step-by-step investing guides | Deep technical breakdowns, option Greeks, volume profile, VWAP pivot levels, and institutional net flows |
| **Ideal For** | First-time investors, college students, salaried SIP builders | Day traders, scalpers, and technical analysts |

💡 *Tip:* You can switch modes anytime via the toggle in the top header bar!`,

  'cnc vs mis': `**CNC (Cash & Carry / Delivery) vs MIS (Margin Intraday Square-off)**

1. **Delivery (CNC):**
• **Holding Period:** You own the shares permanently in your Demat account (CDSL/NSDL).
• **Capital Required:** 100% upfront cash (₹0 borrowed leverage).
• **Risk:** Low risk. No forced square-off. You can hold through market dips.
• **Brokerage:** ₹0 (Zero delivery brokerage on Vanguard Trade).
• **Best For:** Beginners, long-term wealth builders, and peaceful compounding.

2. **Intraday (MIS):**
• **Holding Period:** Must be closed before **3:20 PM IST** on the same trading day.
• **Leverage:** Up to **5x leverage** (e.g. trade ₹50,000 worth of shares with ₹10,000 capital).
• **Risk:** High risk. If not closed before 3:20 PM, our RMS system auto-squares off your position with a penalty charge.
• **Best For:** Full-time traders exploiting intraday momentum and volatility.`,

  'stt': `**What is STT (Securities Transaction Tax) in India?**

STT is a direct statutory tax levied by the Government of India on all equity market transactions:

• **Delivery (CNC):** 0.1% on total trade turnover (charged on both Buy and Sell).
• **Intraday (MIS):** 0.025% on the transaction value (charged **only on Sell**).
• **Equity Futures:** 0.02% on sell turnover.
• **Equity Options:** 0.1% on the option premium (sell side).

*Example:* Buying ₹10,000 worth of Reliance shares in CNC incurs just ₹10 STT. Vanguard Trade calculates this transparently in the pre-order brokerage drawer!`,

  'tax': `**Indian Stock Market Taxes (Post Budget 2024-25 Rules)**

1. **Short-Term Capital Gains (STCG - Section 111A):**
• Applicable when shares or equity mutual funds are held for **less than 12 months**.
• **Tax Rate:** **20% flat** on net profits (revised from 15% in July 2024).

2. **Long-Term Capital Gains (LTCG - Section 112A):**
• Applicable when shares are held for **more than 12 months**.
• **Exemption:** The first **₹1.25 Lakh** in total LTCG per financial year is **100% tax-free**!
• **Tax Rate:** **12.5%** on profits exceeding ₹1.25 Lakh.

3. **Intraday Trading:** Classified as *Speculative Business Income* taxed at your personal income tax slab.
💡 *Tip:* Use our **Tax-Loss Harvesting** feature in the Portfolio tab before March 31 to offset short-term gains against book losses!`,

  't+1': `**How T+1 Settlement Works in Indian Stock Markets**

India was the first major global economy to implement **T+1 (Trade + 1 Business Day) Rolling Settlement** for all NSE & BSE equities:

• **When You BUY Shares (e.g., Monday):**
Shares are transferred by the clearing corporation and credited directly to your Demat account by **Tuesday evening**.

• **When You SELL Shares (e.g., Monday):**
**80% of sale proceeds** are credited instantly for immediate re-trading on Monday itself (under SEBI peak margin rules). The remaining 20% unblocks by Tuesday morning, ready for bank withdrawal.`,

  'pe ratio': `**What is P/E (Price-to-Earnings) Ratio?**

The P/E Ratio indicates how many rupees investors are willing to pay for every ₹1 of net annual earnings:

• **Formula:** \`P/E = Current Stock Price ÷ Earnings Per Share (EPS)\`
• **Benchmarking Guide:**
  - **Low P/E (< 18x):** Value stock or cyclical sector (e.g. PSU Banks, Metal, Energy).
  - **Fair P/E (20x - 35x):** Mature FMCG, private banks, steady IT compounders (e.g. TCS, HDFC Bank).
  - **High P/E (> 50x+):** High-growth disruptors (e.g. Zomato, Trent, Waaree Energies).
• **Golden Rule:** Never look at P/E in isolation—always compare with sector median and 5-year historical average!`,

  'vwap': `**What is VWAP (Volume-Weighted Average Price)?**

VWAP measures the true average trading price of a stock during the day, weighted by trading volume at each price tick:

• **Why Big Institutions Care:** Mutual funds, FIIs, and algorithmic desks execute bulk orders near VWAP to prevent slippage.
• **Trading Strategy:**
  - **Price above VWAP:** Bullish bias—buyers are aggressively controlling the tape.
  - **Price below VWAP:** Bearish bias—sellers are dumping on bounces.
  - **Support/Resistance:** VWAP acts as a primary institutional pivot throughout the session.`,

  'asba': `**What is ASBA & UPI Mandate in IPO Applications?**

**ASBA** (*Application Supported by Blocked Amount*) guarantees 100% safety for retail IPO investors:

1. **Zero Upfront Deduction:** Money is **NEVER** debited when applying. Your bank simply places a **lien (freeze)** on the bid amount (e.g. ₹14,500).
2. **If Allotted:** The exact lot amount is debited on allotment day, and shares credit to your Demat.
3. **If Not Allotted:** Your bank automatically unblocks the funds within 24–48 hours without any manual refund hassle.
4. **UPI Autopay:** Approve the mandate in Google Pay / PhonePe / Paytm / BHIM before 5:00 PM on the IPO closing day.`,

  'sip': `**Why SIP (Systematic Investment Plan) is Best for Beginners**

A SIP invests a predetermined sum (e.g. ₹1,000, ₹5,000/month) into mutual funds or index ETFs automatically:

1. **Rupee Cost Averaging:** Automatically buys more units when markets crash and fewer when markets peak. No need to time the market!
2. **Compounding Wonder:** ₹5,000/month at 14% historical CAGR turns into **₹1.39 Crores** in 25 years on total principal of only ₹15 Lakhs!
3. **Automated Discipline:** Runs on autopilot on your chosen date (e.g. 5th of every month right after salary).`,

  'circuits': `**What Happens When a Stock Hits Upper or Lower Circuit?**

Stock exchanges (NSE/BSE) set daily price fluctuation limits (usually 5%, 10%, or 20%) to curb extreme panic:

• **Upper Circuit:** Price jumps to the maximum ceiling. Only buyers remain in the order book (sellers = 0). You cannot buy because nobody is selling!
• **Lower Circuit:** Price drops to the minimum floor. Only sellers remain (buyers = 0). You cannot sell because there is no counterparty liquidity!
• **Note on F&O Stocks:** Stocks in the Derivatives (F&O) segment do not have fixed circuit freezes—instead, trading halts for 15 minutes when dynamic bands (10%) are touched to allow cooling off.`,

  'stop loss': `**How Stop Loss (SL) Protects Your Hard-Earned Capital**

A Stop Loss order automatically exits your position if the price falls to a level you cannot afford to breach:

• **Why it is Mandatory:** In the stock market, preserving your principal is priority #1. A 10% loss requires an 11% gain to recover; a 50% loss requires a 100% gain!
• **Order Types:**
  - **SL-Limit:** You set a Trigger Price and a Limit Price to avoid excessive slippage.
  - **SL-Market (SL-M):** Order converts to a market order instantly when trigger is hit.
• **Golden Rule for Beginners:** Never enter an Intraday (MIS) trade without setting your Stop Loss beforehand!`,

  'market vs limit': `**Market Order vs Limit Order: Which Should You Choose?**

1. **Market Order:**
• **Execution:** Executes immediately at the best available prevailing market price.
• **Risk:** Risk of slippage in fast-moving or low-liquidity stocks (you might buy higher or sell lower than expected).
• **When to use:** When instant execution matters more than a few paisas.

2. **Limit Order:**
• **Execution:** Executes **ONLY** at your specified price or better.
• **Risk:** If market moves away, your order remains pending and may not execute.
• **When to use:** High-value trades, illiquid smallcaps, or when buying dips at planned price points.`,

  'loss': `**Can You Lose More Money Than You Invested?**

• **In Delivery (CNC):** **NO.** You can never lose more than 100% of your invested capital. Even in worst-case bankruptcy, your loss is capped at the cash paid upfront. Your balance never goes negative.
• **In Intraday (MIS) or F&O (Futures & Options):** **YES, POTENTIALLY.** Because you are trading with borrowed leverage (up to 5x), a sudden gap-down or circuit freeze could breach your stop loss and deplete more than your margin, leaving a negative cash deficit.
• **Beginner Advice:** Always start with Delivery (CNC) to learn peacefully with zero forced liquidation risk!`,

  'reliance': `**Stock Master Breakdown: Reliance Industries Limited (RELIANCE)**

• **Business Engines:**
  1. **Retail:** India's largest retail empire with 18,000+ stores across grocery, consumer electronics, and fashion.
  2. **Jio Telecom:** 470M+ subscribers, dominant 5G rollout, and digital ecosystem monetization.
  3. **O2C (Oil-to-Chemicals):** World-class refining complex in Jamnagar generating steady free cash flow.
  4. **New Green Energy:** Multi-gigawatt solar, battery, and green hydrogen manufacturing ecosystem.
• **Portfolio Role:** High stability, quintessential NIFTY 50 anchor (~9% index weight).
• **Execution Tip:** Ideal for staggered accumulation via Delivery (CNC).`,

  'tatamotors': `**Stock Master Breakdown: Tata Motors Limited (TATAMOTORS)**

• **Key Catalysts:**
  1. **EV Dominance:** Commands over 70% of India's electric passenger vehicle market (Nexon EV, Punch EV, Curvv EV).
  2. **JLR Turnaround:** Record order book, premium vehicle margins (Defender, Range Rover), and aggressive deleveraging to net cash.
  3. **Demerger Value Unlock:** Splitting into two distinct listed companies: Commercial Vehicles (CV) and Passenger Vehicles (PV + EV + JLR).
• **Risk Profile:** Moderate cyclicality. Long-term structural play on Indian mobility and manufacturing.`,

  'zomato': `**Stock Master Breakdown: Zomato Limited (ZOMATO)**

• **Growth Drivers:**
  1. **Blinkit (Quick Commerce):** The primary growth catalyst! Rapid dark-store expansion across Tier-1/2 cities with positive adjusted EBITDA.
  2. **Food Delivery:** Resilient duopoly with Swiggy generating steady positive free cash flows and advertising income.
  3. **Going-Out (District):** Live events, concerts, dining-out reservation ecosystem.
• **Valuation Note:** Premium valuation due to explosive quick-commerce growth. High beta stock best suited for growth-oriented investors.`,

  'swiggy': `**Stock Master Breakdown: Swiggy Limited (SWIGGY)**

• **Business Overview:** Integrated consumer services ecosystem comprising Food Delivery, Instamart (Quick Commerce), Dineout, and Genie courier services.
• **Key Differentiation:** Deep moat in Southern India, massive focus on increasing dark store density and private label items.
• **Strategic Focus:** Deploying IPO capital to expand Instamart fulfillment network and improve contribution margins.`,

  'waaree': `**Stock Master Breakdown: Waaree Energies Limited (WAAREE)**

• **Market Position:** India's largest manufacturer of solar PV modules with 13+ GW installed capacity and huge global export footprint (especially USA).
• **Tailwinds:** High beneficiary of the Government's PM Surya Ghar Muft Bijli Yojana, ALMM module mandates, and PLI incentives.
• **Key Metrics to Track:** Domestic vs export realization rates, cell manufacturing backward integration, and policy tariff dynamics.`,

  'hdfc': `**Stock Master Breakdown: HDFC Bank Limited (HDFCBANK)**

• **Status:** India's largest private sector bank and cornerstone of the financial system.
• **Post-Merger Dynamics:** Normalizing its Credit-to-Deposit (LDR) ratio following the monumental merger with parent HDFC Ltd.
• **Investment Verdict:** Institutional favorite with pristine asset quality (low Gross NPAs). Excellent long-term compounder at attractive risk-reward multiples.`,

  'login': `**SEBI Mandated 2FA & Secure Demat Login in India** 🔐🇮🇳

Under SEBI Master Circular guidelines, every Indian stock trading terminal enforces rigorous Two-Factor Authentication (2FA):

1. **Authentication Factor 1 (Knowledge):** Your registered Email & Password, or verified Google Single Sign-On (SSO).
2. **Authentication Factor 2 (Possession/Biometric):** 4-Digit Trading MPIN or Device Biometrics (Fingerprint / FaceID).
3. **CDSL Beneficiary Owner ID (BOID):** A unique 16-digit depository number allocated to you in CDSL to safeguard your equity delivery holdings.
4. **Session Auto-Lock:** Protects your orders and portfolio from unauthorized access when stepping away from your trading desk!`,
};

function getSmartFallbackReply(query: string, contextStock?: any): string {
  const q = query.toLowerCase();

  if (q.includes('login') || q.includes('sign in') || q.includes('2fa') || q.includes('two factor') || q.includes('boid') || q.includes('demat security') || q.includes('mpin')) {
    return masterStockKnowledge['login'];
  }

  // Check if user explicitly asked for an entire list / basket / multiple stocks
  const isListRequest =
    q.includes('entire list') ||
    q.includes('list of stocks') ||
    q.includes('stock list') ||
    q.includes('stocks list') ||
    q.includes('all stocks') ||
    q.includes('basket') ||
    q.includes('multiple stocks') ||
    q.includes('several stocks') ||
    q.includes('top 5') ||
    q.includes('top 3') ||
    q.includes('diversified') ||
    q.includes('portfolio basket') ||
    q.includes('show list');

  // Single Best Stock / Top Pick request (focus on #1 conviction pick, avoid dumping entire list)
  const isBestStockRequest =
    q.includes('best stock') ||
    q.includes('top stock') ||
    q.includes('top pick') ||
    q.includes('best share') ||
    q.includes('single stock') ||
    q.includes('one stock') ||
    q.includes('1 stock') ||
    q.includes('which stock') ||
    q.includes('what stock') ||
    q.includes('which stock do i need') ||
    q.includes('what stock do i need') ||
    q.includes('which stock should i') ||
    q.includes('what stock should i') ||
    q.includes('what to buy') ||
    q.includes('what should i buy') ||
    q.includes('stock to buy') ||
    q.includes('invest today') ||
    q.includes('buy today');

  if (isBestStockRequest && !isListRequest) {
    return masterStockKnowledge['best stock to invest today'];
  }

  if (isListRequest || q.includes('where to invest') || q.includes('stocks to buy') || q.includes('market setup')) {
    return masterStockKnowledge['which stock to invest today'];
  }

  if (q.includes('beginner') || q.includes('begineer') || q.includes('pro mode') || q.includes('beginner vs pro') || q.includes('difference between beginner')) return masterStockKnowledge['beginner vs pro'];
  if (q.includes('reliance')) return masterStockKnowledge['reliance'];
  if (q.includes('tata motor') || q.includes('tatamotors')) return masterStockKnowledge['tatamotors'];
  if (q.includes('zomato')) return masterStockKnowledge['zomato'];
  if (q.includes('swiggy')) return masterStockKnowledge['swiggy'];
  if (q.includes('waaree')) return masterStockKnowledge['waaree'];
  if (q.includes('hdfc')) return masterStockKnowledge['hdfc'];
  if (q.includes('cnc') || q.includes('mis') || q.includes('delivery') || q.includes('intraday')) return masterStockKnowledge['cnc vs mis'];
  if (q.includes('stt') || q.includes('sebi charge') || q.includes('turnover fee') || q.includes('brokerage fee')) return masterStockKnowledge['stt'];
  if (q.includes('tax') || q.includes('stcg') || q.includes('ltcg') || q.includes('budget') || q.includes('capital gain')) return masterStockKnowledge['tax'];
  if (q.includes('t+1') || q.includes('settlement') || q.includes('demat credit') || q.includes('trade plus')) return masterStockKnowledge['t+1'];
  if (q.includes('pe ratio') || q.includes('p/e') || q.includes('price to earnings') || q.includes('valuation')) return masterStockKnowledge['pe ratio'];
  if (q.includes('vwap') || q.includes('volume weight')) return masterStockKnowledge['vwap'];
  if (q.includes('asba') || q.includes('ipo') || q.includes('mandate') || q.includes('lot size') || q.includes('allotment')) return masterStockKnowledge['asba'];
  if (q.includes('sip') || q.includes('mutual fund') || q.includes('compounding') || q.includes('lumpsum')) return masterStockKnowledge['sip'];
  if (q.includes('circuit') || q.includes('upper circuit') || q.includes('lower circuit') || q.includes('freeze')) return masterStockKnowledge['circuits'];
  if (q.includes('stop loss') || q.includes('stop-loss') || q.includes('sl-m') || q.includes('capital protect')) return masterStockKnowledge['stop loss'];
  if (q.includes('market order') || q.includes('limit order') || q.includes('limit vs market')) return masterStockKnowledge['market vs limit'];
  if (q.includes('lose more') || q.includes('negative balance') || q.includes('debt') || q.includes('risk of loss')) return masterStockKnowledge['loss'];

  if (contextStock) {
    return `**DhanGuru Quick Breakdown: ${contextStock.name} (${contextStock.symbol})**

• **Live Price:** ₹${contextStock.price.toFixed(2)} (${contextStock.changePercent >= 0 ? '+' : ''}${contextStock.changePercent.toFixed(2)}%)
• **Valuation Metric:** ${contextStock.peRatio ? `${contextStock.peRatio}x P/E` : 'Industry standard valuation'}
• **Capitalization:** ${contextStock.marketCap || 'Large Cap Heavyweight'}

**Investor Game Plan:**
1. **For Beginners:** Buy via **Delivery (CNC)**. Zero leverage means zero forced liquidation or 3:20 PM square-off stress.
2. **Strategy:** Stagger purchases across 2-3 tranches (buy-on-dips or SIP style).
3. **Horizon:** Maintain a 1-3 year horizon for optimal compounding under 12.5% LTCG rules.

Ask me about its support levels, quarterly earnings, or brokerage calculations!`;
  }

  return `**DhanGuru AI - Indian Stock Market Master** 🇮🇳

I can instantly decode any stock term, check taxation, or analyze companies:

1. **Trading Mechanics:** CNC vs MIS, T+1 Rolling Settlement, Stop Loss, Upper/Lower Circuits.
2. **SEBI & Taxes:** STCG 20%, LTCG 12.5% (> ₹1.25L exempt), STT & GST calculations.
3. **Primary Markets:** IPO ASBA UPI mandates, Lot sizes, Mutual Fund SIP compounding.
4. **Stock Breakdowns:** Reliance, Tata Motors, HDFC Bank, Zomato, Waaree, Swiggy, and any NSE/BSE counter.

What stock or concept should we review right now?`;
}

// Built-in Unique Out-of-Scope Responses
const OUT_OF_SCOPE_RESPONSES = [
  `🎯 **Radar Out-of-Scope: That's outside Dalal Street territory!** 📉🚫

Namaste! I am **DhanGuru**, your Vanguard Indian Stock Market & Wealth Master. My neural algorithms are strictly calibrated for:
• **Bulls, Bears & Market Ticks:** NSE, BSE, NIFTY 50, SENSEX, BANKNIFTY
• **Trading Mechanics:** Delivery (CNC) vs Intraday (MIS), Stop-Loss triggers, T+1 settlement
• **Wealth & Tax Strategies:** Mutual Fund SIPs, Budget 2024 STCG (20%) & LTCG (12.5%) rules
• **Stock Valuations:** Reliance, Tata Motors, HDFC Bank, Zomato, Waaree Energies, etc.

*I leave non-financial topics to others — my sole obsession is compounding wealth and keeping your capital safe!*

💡 **Try asking me a market question instead:**
1. *"Explain CNC vs MIS with zero delivery brokerage"*
2. *"How does T+1 Demat credit work in India?"*
3. *"Analyze Tata Motors EV market share & demerger"*`,

  `🛑 **Off-Market Query Detected: Outside DhanGuru's Trading Scope!** 📊

I specialize exclusively in **Indian equities, trading mechanics, and financial wealth creation**. While your inquiry is interesting, it lies completely outside Dalal Street!

Think of it like trying to execute an equity order on a Sunday night — the exchange simply isn't open for non-financial trades! 😉

🧭 **Let's redirect your focus back to compounding wealth:**
• **Beginner Doubts:** *"Can I lose more money than invested in delivery vs MIS?"*
• **Tax Optimization:** *"How does Tax-Loss Harvesting save money before March 31?"*
• **Execution Disciplines:** *"What happens when a stock hits Upper Circuit?"*

Ask me about any stock symbol, trading concept, or SEBI regulation!`,

  `🔔 **Dalal Street Boundary: Non-Financial Topic!** 🇮🇳

As **DhanGuru**, my mission is helping retail investors conquer the Indian stock market with zero fear and 100% clarity.

I do not process requests outside of investing, trading, taxation, company valuations, and wealth strategies.

📈 **What we CAN decode together right now:**
• **Stock Valuations:** Live P/E ratios, earnings, and competitive moats for *Reliance, TCS, Zomato, or Waaree*
• **Primary Markets:** How ASBA and UPI mandates guarantee 100% safety in IPOs
• **Risk Management:** Why setting a Stop-Loss (SL) protects your hard-earned capital

Which Indian company or stock term would you like to explore?`,

  `⚠️ **Financial Terminal Boundary: Query is Out of Scope!** 💼

Your question falls outside the financial markets and investing domain.

My engine is hardcoded exclusively for **NSE/BSE equities, SEBI regulations, derivatives risk, and portfolio compounding**. Non-market queries are filtered out so we can focus entirely on building your financial freedom.

🚀 **Ready to talk markets? Ask me:**
• *"What is the difference between Beginner and Pro mode?"*
• *"What is VWAP and why do big mutual funds execute orders near it?"*
• *"Explain STT taxes and SEBI turnover fees on equity trades"*`
];

let outOfScopeIndex = 0;
function getNextOutOfScopeResponse(): string {
  const resp = OUT_OF_SCOPE_RESPONSES[outOfScopeIndex % OUT_OF_SCOPE_RESPONSES.length];
  outOfScopeIndex++;
  return resp;
}

// Deterministic Out-of-Scope Relevance Classifier
function isOutOfScopeQuery(query: string, contextStock?: any): boolean {
  if (contextStock) return false;
  const q = query.toLowerCase().trim();
  if (!q) return false;

  // 1. Polite greetings / intro queries are in-scope
  const isGreeting =
    q === 'hi' ||
    q === 'hello' ||
    q === 'hey' ||
    q === 'namaste' ||
    q === 'pranam' ||
    q.startsWith('good morning') ||
    q.startsWith('good afternoon') ||
    q.startsWith('good evening') ||
    q.includes('who are you') ||
    q.includes('what are you') ||
    q.includes('what can you do') ||
    q.includes('help me') ||
    q === 'start';

  if (isGreeting) return false;

  // 2. Explicit non-financial patterns that should be declined immediately
  const outOfScopePatterns = [
    'recipe', 'cook', 'bake', 'baking', 'cake', 'pasta', 'pizza', 'biryani', 'curry', 'ingredient', 'make food', 'food',
    'movie', 'film', 'actor', 'actress', 'cinema', 'song', 'lyrics', 'singer', 'album', 'hollywood', 'bollywood',
    'cricket', 'football', 'soccer', 'ipl', 'world cup', 'messi', 'ronaldo', 'virat', 'dhoni', 'rohit sharma',
    'weather', 'forecast', 'rain today', 'temperature today', 'climate',
    'dating', 'girlfriend', 'boyfriend', 'marry me', 'divorce', 'breakup', 'love advice', 'relationship',
    'tell me a joke', 'tell a joke', 'riddle', 'write a poem', 'love poem', 'story about', 'essay on',
    'homework', 'solve 2+2', 'capital of', 'president of', 'prime minister of france', 'history of rome', 'dinosaur',
    'python code to', 'javascript code to', 'html code', 'css code', 'c++ code', 'java program', 'write a function',
    'pubg', 'minecraft', 'fortnite', 'anime', 'manga', 'naruto'
  ];

  for (const pattern of outOfScopePatterns) {
    if (q.includes(pattern)) {
      return true;
    }
  }

  // 3. Known financial/stock market keywords
  const financialKeywords = [
    'stock', 'stocks', 'share', 'shares', 'equity', 'equities', 'market', 'markets',
    'trade', 'trading', 'invest', 'investing', 'investment', 'investor',
    'nse', 'bse', 'nifty', 'sensex', 'banknifty', 'finnifty', 'midcap', 'vix',
    'sebi', 'rbi', 'cdsl', 'nsdl', 'demat', 'cnc', 'mis', 'mtf', 'delivery', 'intraday',
    'ipo', 'asba', 'upi', 'gmp', 'sip', 'mutual fund', 'etf', 'elss', 'cagr', 'nav',
    'pe ratio', 'p/e', 'eps', 'market cap', 'dividend', 'vwap', 'rsi', 'macd',
    'candlestick', 'chart', 'technical', 'support', 'resistance', 'pivot',
    'circuit', 'stop loss', 'sl-m', 'target', 'order', 'brokerage', 'stt', 'gst',
    'tax', 'taxes', 'stcg', 'ltcg', 'harvest', 'pnl', 'margin', 'leverage', 'portfolio',
    'reliance', 'tata', 'tatamotors', 'tcs', 'infy', 'infosys', 'hdfc', 'sbin', 'sbi', 'icici',
    'zomato', 'swiggy', 'waaree', 'paytm', 'itc', 'airtel', 'bharti', 'l&t',
    'beginner', 'pro mode', 'rupee', 'rupees', 'inr', 'crore', 'crores', 'lakh', 'lakhs', 'money', 'wealth',
    'bull', 'bear', 'bullish', 'bearish', 'earnings', 'quarterly', 'fii', 'dii', 'compounding', 'loss'
  ];

  const hasFinancialKeyword = financialKeywords.some((kw) => q.includes(kw));

  // If query is longer than 15 characters and does not match ANY financial keyword, flag as out of scope
  if (!hasFinancialKeyword && q.length > 15) {
    return true;
  }

  return false;
}

// System instruction generator
function buildSystemInstruction(mode?: string, contextStock?: any): string {
  return `You are "DhanGuru" (Vanguard Stock Master AI), the leading SEBI-knowledgeable educator and expert financial analyst for Indian retail investors.
Provide snappy, razor-sharp, highly practical responses (under 160 words).

CRITICAL DOMAIN RESTRICTION:
You ONLY answer questions about Indian equities (NSE/BSE), NIFTY 50, SENSEX, trading mechanics (CNC/MIS), taxes, IPOs, SIPs, Demat, and wealth creation.
If the user asks ANY question that is out of scope (e.g. food recipes, cooking, entertainment, movies, sports/cricket, general non-financial programming, weather, relationship advice, creative writing, or general trivia):
You MUST politely refuse and state clearly that this is out of scope for DhanGuru. In your signature market style, explain that your radar is only tuned for Dalal Street, Bulls, Bears, and compounding wealth, and suggest 2-3 Indian stock market topics they can ask instead.

Core Financial Knowledge to use when relevant:
- Indian equities (NSE/BSE), NIFTY 50, SENSEX, BANKNIFTY, IPOs, SIPs, Demat (CDSL/NSDL).
- Union Budget 2024-25 capital gains tax: STCG is 20%, LTCG is 12.5% (first ₹1.25L tax-free).
- Always use the Indian Rupee symbol (₹).
- Format with clean bullet points and bold key terms.
- Mode: ${mode === 'pro' ? 'Pro Trader (technical, VWAP, market depth, Greeks)' : 'Beginner Friendly (clear, jargon-free, safety-first)'}
${contextStock ? `- User Stock Context: ${contextStock.symbol} (${contextStock.name}) at ₹${contextStock.price}` : ''}

WHEN ASKED "BEST STOCK" OR A SINGULAR RECOMMENDATION (e.g. "best stock to invest today", "provide me best stock", "which stock to buy"):
- DO NOT dump a massive entire list of 5+ stocks! The user is asking for ONE top pick.
- Spotlight ONE definitive #1 Top Conviction Pick: Tata Motors (TATAMOTORS).
- Explain its live accumulation zone, 3 key business catalysts (EV monopoly 70%+ share, JLR cash cow, demerger value unlock), Delivery (CNC) execution with ₹0 brokerage, and 12-month horizon.
- Mention a 1-line conservative alternative (Reliance RELIANCE) and note they can ask for a full diversified basket if they want multiple options.

WHEN EXPLICITLY ASKED FOR A LIST OR DIVERSIFIED BASKET (e.g. "give me a list of stocks", "show basket"):
- Provide two distinct baskets: Foundation Compounders (TATAMOTORS, RELIANCE, HDFCBANK) and Hyper-Growth (ZOMATO, WAAREE) with tranche guidelines (30-30-40) and Budget 2024 LTCG rules.`;
}

// Optimized Gemini Caller with low thinking latency & fast fallback timeout
async function generateWithTimeout(
  ai: GoogleGenAI,
  prompt: string,
  systemInstruction: string,
  timeoutMs = 1800
): Promise<string> {
  const apiPromise = ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: prompt,
    config: {
      systemInstruction,
      thinkingConfig: {
        thinkingLevel: ThinkingLevel.LOW, // Minimizes latency and reasoning delay
      },
    },
  });

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('GEMINI_TIMEOUT')), timeoutMs)
  );

  const result = await Promise.race([apiPromise, timeoutPromise]);
  return result.text || '';
}

// POST /api/chat: Ultra-Fast Stock Master Endpoint
app.post('/api/chat', async (req: Request, res: Response) => {
  const startTime = Date.now();
  try {
    const { message, contextStock, mode, fastOnly } = req.body;

    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Message string is required.' });
      return;
    }

    const trimmedMsg = message.trim();
    const cacheKey = `${trimmedMsg}_${contextStock?.symbol || 'none'}_${mode || 'beginner'}`;

    // 1. Check in-memory fast cache (< 3ms)
    const cached = getCachedResponse(cacheKey);
    if (cached) {
      res.json({
        reply: cached,
        source: 'cache',
        latencyMs: Date.now() - startTime,
      });
      return;
    }

    // 2. Intercept Out-Of-Scope Non-Financial Queries (< 3ms)
    if (isOutOfScopeQuery(trimmedMsg, contextStock)) {
      const outOfScopeReply = getNextOutOfScopeResponse();
      setCachedResponse(cacheKey, outOfScopeReply);
      res.json({
        reply: outOfScopeReply,
        source: 'out_of_scope_guardrail',
        latencyMs: Date.now() - startTime,
      });
      return;
    }

    // 3. Check if query is an immediate fast-path match (e.g. predefined chips, core terms)
    const qLower = trimmedMsg.toLowerCase();
    const isDirectMatch =
      qLower.includes('best stock') ||
      qLower.includes('top stock') ||
      qLower.includes('top pick') ||
      qLower.includes('best share') ||
      qLower.includes('single stock') ||
      qLower.includes('one stock') ||
      qLower.includes('1 stock') ||
      qLower.includes('which stock') ||
      qLower.includes('what stock') ||
      qLower.includes('invest today') ||
      qLower.includes('buy today') ||
      qLower.includes('where to invest') ||
      qLower.includes('where should i invest') ||
      qLower.includes('what should i invest') ||
      qLower.includes('what should i buy') ||
      qLower.includes('what to buy') ||
      qLower.includes('stock to buy') ||
      qLower.includes('stocks to buy') ||
      qLower.includes('recommend') ||
      qLower.includes('current market') ||
      qLower.includes('market setup') ||
      qLower.includes('cnc') ||
      qLower.includes('mis') ||
      qLower.includes('stt') ||
      qLower.includes('sebi') ||
      qLower.includes('tax') ||
      qLower.includes('stcg') ||
      qLower.includes('ltcg') ||
      qLower.includes('t+1') ||
      qLower.includes('settlement') ||
      qLower.includes('pe ratio') ||
      qLower.includes('p/e') ||
      qLower.includes('vwap') ||
      qLower.includes('asba') ||
      qLower.includes('ipo') ||
      qLower.includes('circuit') ||
      qLower.includes('stop loss') ||
      qLower.includes('sip') ||
      qLower.includes('lumpsum') ||
      qLower.includes('market order') ||
      qLower.includes('limit order') ||
      qLower.includes('reliance') ||
      qLower.includes('tata motor') ||
      qLower.includes('tatamotors') ||
      qLower.includes('zomato') ||
      qLower.includes('swiggy') ||
      qLower.includes('waaree') ||
      qLower.includes('hdfc') ||
      qLower.includes('lose more') ||
      qLower.includes('negative balance') ||
      fastOnly === true;

    // Direct match: return instant master knowledge in <10ms
    if (isDirectMatch) {
      const fastReply = getSmartFallbackReply(trimmedMsg, contextStock);
      setCachedResponse(cacheKey, fastReply);
      res.json({
        reply: fastReply,
        source: 'knowledge_engine_instant',
        latencyMs: Date.now() - startTime,
      });
      return;
    }

    const ai = getGenAIClient();

    // 3. If Gemini is available, call with ThinkingLevel.LOW and 3.2s timeout
    if (ai) {
      try {
        const systemInstruction = buildSystemInstruction(mode, contextStock);
        const promptText = contextStock
          ? `[Stock Context: ${contextStock.symbol} at ₹${contextStock.price}] ${trimmedMsg}`
          : trimmedMsg;

        const reply = await generateWithTimeout(ai, promptText, systemInstruction, 3200);

        if (reply && reply.trim().length > 10) {
          setCachedResponse(cacheKey, reply);
          res.json({
            reply,
            source: 'gemini_fast',
            latencyMs: Date.now() - startTime,
          });
          return;
        }
      } catch (geminiErr: any) {
        console.log(`[DhanGuru AI] Gemini fast-failover (${geminiErr?.message}), serving local master engine`);
      }
    }

    // 4. Instant Fallback to Expert Knowledge Base (< 5ms)
    const fallbackReply = getSmartFallbackReply(trimmedMsg, contextStock);
    setCachedResponse(cacheKey, fallbackReply);
    res.json({
      reply: fallbackReply,
      source: 'knowledge_engine',
      latencyMs: Date.now() - startTime,
    });
  } catch (err: any) {
    console.error('Server error handling /api/chat:', err);
    res.status(500).json({ error: 'Internal server error processing stock query.' });
  }
});

// GET /api/chat/stream: Real-Time Server-Sent Events (SSE) Streaming Endpoint
app.get('/api/chat/stream', async (req: Request, res: Response) => {
  const message = (req.query.message as string) || '';
  const mode = (req.query.mode as string) || 'beginner';
  const stockSymbol = (req.query.stockSymbol as string) || '';
  const stockPrice = (req.query.stockPrice as string) || '';

  if (!message) {
    res.status(400).send('Message is required');
    return;
  }

  // Set SSE Headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const sendChunk = (text: string) => {
    res.write(`data: ${JSON.stringify({ text })}\n\n`);
  };

  const endStream = () => {
    res.write('data: [DONE]\n\n');
    res.end();
  };

  const contextStock = stockSymbol
    ? { symbol: stockSymbol, price: parseFloat(stockPrice) || 0, name: stockSymbol }
    : undefined;

  // Intercept Out-Of-Scope Non-Financial Queries in stream
  if (isOutOfScopeQuery(message, contextStock)) {
    const outOfScopeReply = getNextOutOfScopeResponse();
    const words = outOfScopeReply.split(' ');
    for (let i = 0; i < words.length; i += 4) {
      const chunk = words.slice(i, i + 4).join(' ') + ' ';
      sendChunk(chunk);
      await new Promise((r) => setTimeout(r, 15));
    }
    endStream();
    return;
  }

  const qLower = message.toLowerCase().trim();
  const isDirectMatch =
    qLower.includes('best stock') ||
    qLower.includes('top stock') ||
    qLower.includes('top pick') ||
    qLower.includes('best share') ||
    qLower.includes('single stock') ||
    qLower.includes('one stock') ||
    qLower.includes('1 stock') ||
    qLower.includes('which stock') ||
    qLower.includes('what stock') ||
    qLower.includes('invest today') ||
    qLower.includes('buy today') ||
    qLower.includes('where to invest') ||
    qLower.includes('where should i invest') ||
    qLower.includes('what should i invest') ||
    qLower.includes('what should i buy') ||
    qLower.includes('what to buy') ||
    qLower.includes('stock to buy') ||
    qLower.includes('stocks to buy') ||
    qLower.includes('recommend') ||
    qLower.includes('current market') ||
    qLower.includes('market setup') ||
    qLower.includes('cnc') ||
    qLower.includes('mis') ||
    qLower.includes('stt') ||
    qLower.includes('sebi') ||
    qLower.includes('tax') ||
    qLower.includes('stcg') ||
    qLower.includes('ltcg') ||
    qLower.includes('t+1') ||
    qLower.includes('settlement') ||
    qLower.includes('pe ratio') ||
    qLower.includes('p/e') ||
    qLower.includes('vwap') ||
    qLower.includes('asba') ||
    qLower.includes('ipo') ||
    qLower.includes('circuit') ||
    qLower.includes('stop loss') ||
    qLower.includes('sip') ||
    qLower.includes('lumpsum') ||
    qLower.includes('market order') ||
    qLower.includes('limit order') ||
    qLower.includes('reliance') ||
    qLower.includes('tata motor') ||
    qLower.includes('tatamotors') ||
    qLower.includes('zomato') ||
    qLower.includes('swiggy') ||
    qLower.includes('waaree') ||
    qLower.includes('hdfc') ||
    qLower.includes('lose more');

  // If query is a core stock term/chip, stream immediately for zero-perceived-latency
  if (isDirectMatch) {
    const fullText = getSmartFallbackReply(message, contextStock);
    const words = fullText.split(' ');
    for (let i = 0; i < words.length; i += 4) {
      const chunk = words.slice(i, i + 4).join(' ') + ' ';
      sendChunk(chunk);
      await new Promise((r) => setTimeout(r, 12));
    }
    endStream();
    return;
  }

  const ai = getGenAIClient();

  if (ai) {
    try {
      const systemInstruction = buildSystemInstruction(mode, contextStock);
      const promptText = contextStock
        ? `[Stock Context: ${contextStock.symbol} at ₹${contextStock.price}] ${message}`
        : message;

      const responseStream = await ai.models.generateContentStream({
        model: 'gemini-3.8-flash',
        contents: promptText,
        config: {
          systemInstruction,
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.LOW,
          },
        },
      });

      for await (const chunk of responseStream) {
        if (chunk.text) {
          sendChunk(chunk.text);
        }
      }

      endStream();
      return;
    } catch (err: any) {
      console.log('[DhanGuru AI SSE] Stream error, streaming instant knowledge base:', err?.message);
    }
  }

  // If Gemini not available or stream errored, stream fallback answer in smooth fast words
  const fullText = getSmartFallbackReply(message, contextStock);
  const words = fullText.split(' ');
  for (let i = 0; i < words.length; i += 4) {
    const chunk = words.slice(i, i + 4).join(' ') + ' ';
    sendChunk(chunk);
    // tiny delay for natural streaming cadence
    await new Promise((r) => setTimeout(r, 18));
  }
  endStream();
});

// Setup Vite or static serving
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Vanguard Trade Full-Stack Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
