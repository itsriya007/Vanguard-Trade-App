# 🇮🇳 Vanguard Trade - Indian Stock Market & Wealth Mobile Platform

> **Vanguard Trade** is a high-performance, institutional-grade Indian stock trading, IPO application, and Mutual Fund SIP mobile application built with React Native / Expo, TypeScript, and Tailwind CSS.

---

## 🎨 Theme & Design System

The application strictly adheres to the Vanguard Trade Design Specifications:
- **Deep Midnight Charcoal (`#0B0E14`)**: Main background canvas.
- **Elevated Slate Glass (`#161B26`)**: Card surfaces, modal sheets, and floating layers with 16px blur backdrop.
- **Electric Indigo Accent (`#6C5CE7`)**: Primary actions, active tabs, and branding highlights.
- **Neon Mint Bullish (`#00E676`)**: Up-ticks, positive P&L, Buy action badges, and call-to-actions.
- **Vivid Crimson Bearish (`#FF5252`)**: Down-ticks, negative P&L, Sell triggers, and panic exit controls.
- **Global Currency Formatting**: Formatted in Indian Rupee (`₹`) using Indian numbering standards (`₹1,23,456.78`, `₹12.50 Cr`, `₹45.20 L`).

---

## 🚀 Key Modules & Architecture

### 1. Authentication & Onboarding Flow
- **Biometric Authentication**: Simulated FaceID and Fingerprint scanner with haptic feedback.
- **MPIN Pad**: 4-digit rapid security pin keypad with tactile taps.
- **Mode Toggle**:
  - **Beginner Mode (👶)**: Plain-English explanations, contextual tooltips (ⓘ), margin risk prompts, and safety checks.
  - **Pro Mode (⚡)**: Direct 1-tap trade execution, Level-2 5-depth order book ladder, and technical signals (RSI 14, VWAP, Pivots).

### 2. Real-Time Watchlist & High-Frequency WebSocket Feed
- **Index Tickers**: NIFTY 50, BANKNIFTY, SENSEX, FINNIFTY, and INDIA VIX with live sparkline trends.
- **WebSocket Feed**: Dynamic tick simulation with green/red flash animations, latency jitter monitoring (18–35ms), and reconnection resilience.
- **Quick Swipe Actions**: Immediate Mint Green `BUY` and Crimson `SELL` triggers.

### 3. Smart Brokerage Calculator & Order Placement
- **Products Supported**:
  - `CNC` (Cash & Carry Delivery: Long-term equity with ₹0 brokerage).
  - `MIS` (Margin Intraday Square-off: 5x leverage, auto square-off at 03:20 PM IST).
  - `MTF` (Margin Trading Facility: 4x leverage).
- **Statutory Charges Breakdown**:
  - Brokerage (₹0 for Delivery, max ₹20 / 0.03% for Intraday)
  - STT (Securities Transaction Tax)
  - Exchange Turnover Fee (NSE 0.00297%)
  - SEBI Turnover Fee (₹10 / Crore)
  - Stamp Duty (0.015% Delivery / 0.003% Intraday)
  - GST (18% on statutory fees)
  - **Breakeven Points per share** required to cover all trade fees.

### 4. IPO Application Module (Primary Markets)
- Live, Upcoming, and Closed Indian IPO listings with Price Band, Lot Size, Issue Size in ₹ Cr, and Grey Market Premium (GMP).
- **One-Tap Apply via UPI**: Virtual Payment Address validation (`@okhdfcbank`, `@oksbi`, `@paytm`, `@upi`), lot counter, and Cut-off price option.
- **ASBA Mandate Timeline**: Step-by-step confirmation tracker (Applied → Mandate Requested → Funds Blocked in Bank → Allotted / Refunded).

### 5. Mutual Funds & Systematic Investment Plan (SIP) Hub
- Categorized funds: High Growth, Tax Saver (ELSS), Index Funds, Liquid Funds, and Debt.
- Fund details: 1Y, 3Y, 5Y CAGR returns, Expense Ratio, AUM in ₹ Cr, and SEBI Risk-o-meter.
- **Interactive SIP Calculator Widget**: Sliders for Monthly Investment, Expected Returns (%), and Horizon (Years) with visual compound growth projections.
- One-click "Start SIP" checkout with auto-debit date picker (1st, 5th, 10th, 15th) and UPI AutoPay mandate.

### 6. Portfolio, Positions & Panic Controls
- Consolidated holdings with Total P&L and Day P&L metrics.
- **MTM Positions**: Real-time Mark-to-Market ticking for intraday trades.
- **"Exit All Positions" Panic Button**: Double-tap safety verification to instantly square off all open positions during volatile market crashes.
- **Tax-Loss Harvesting Alert**: Computes unrealized losses (e.g., PayTM) and highlights potential savings under Section 111A/112A of the Indian Income Tax Act.

### 7. Market Pulse & Institutional Flows
- Indian Financial News with sentiment classification (`[Bullish]`, `[Bearish]`, `[Neutral]`).
- Live FII / DII net cash market flows in ₹ Crores.

---

## 💻 Local Development & Running Instructions

### 1. Web Preview & Dev Server
```bash
# Install dependencies
npm install

# Start the Vite development server (Port 3000)
npm run dev

# Run TypeScript typechecks
npm run lint

# Create production web build
npm run build
```

### 2. Mobile Native Development (Expo / React Native)
```bash
# Start Expo development client
npx expo start

# Run on Android Emulator or connected device
npx expo run:android

# Run on iOS Simulator (macOS only)
npx expo run:ios
```

---

## 📦 Generating Mobile Store Artifacts

### Android: Google Play Store App Bundle (`.aab`)
```bash
# Login to Expo Application Services
npx eas login

# Configure project ID
npx eas project:init

# Build production Android App Bundle
npx eas build --platform android --profile production
```
Artifact generated: `dist/vanguard-trade-release.aab`

### iOS: Apple App Store Package (`.ipa`)
```bash
# Build production iOS IPA with App Store provisioning profile
npx eas build --platform ios --profile production
```
Artifact generated: `dist/vanguard-trade-release.ipa`

---

## 📝 Step-by-Step Store Publishing Checklist

### Google Play Console Checklist (Android)
1. **Target SDK & Android App Bundle**: Ensure `targetSdkVersion` is at least 34+ and upload the `.aab` file generated by EAS.
2. **Financial Services Declaration**:
   - Provide SEBI Registered Broker / Sub-broker ARN / INZ license details under the *Financial features* declaration.
   - Disclose trading risks and leverage terms.
3. **App Content & Permissions**:
   - Declare `USE_BIOMETRIC` for fingerprint/face authentication.
   - Declare `INTERNET` and `VIBRATE` for real-time market data streaming and tactile feedback.
4. **Internal Testing Track**:
   - Deploy to 20 internal testers for mandatory 14-day closed testing before production rollout.
5. **Store Listing Assets**:
   - High-res icon (512x512 PNG, Midnight background `#0B0E14`)
   - Feature graphic (1024x500 PNG)
   - Minimum 4 phone screenshots (1080x1920) showcasing Watchlist, Level-2 Depth, IPO Apply, and SIP Calculator.

### Apple App Store Connect Checklist (iOS)
1. **App Store Review Guidelines (Section 3.1.5 / Financial Apps)**:
   - Financial trading apps must be submitted under an accredited legal organization D-U-N-S account (not an individual developer account).
2. **Privacy & Info.plist**:
   - `NSFaceIDUsageDescription`: Documented in `app.json` ("Allow Vanguard Trade to use FaceID to secure your stock portfolio").
3. **App Privacy Nutrition Labels**:
   - Declare collection of Financial Info (UPI VPA, portfolio values) and Diagnostics.
4. **TestFlight Build**:
   - Upload via `eas submit -p ios` and distribute to internal and external beta groups.
5. **App Store Review Notes**:
   - Provide a functional demo login test account (MPIN: `1234`) with pre-seeded demo margin for Apple review team.

---

## 🛡️ CI/CD Pipeline

The `.github/workflows/deploy.yml` pipeline runs on every push to `main`:
1. Executes `npm run lint` to enforce clean TypeScript compilation.
2. Runs `npm run build` to verify the web bundle.
3. Triggers automated cloud builds on EAS for `.aab` (Android) and `.ipa` (iOS).
4. Submits automatically to the Google Play Internal Track and Apple TestFlight.
