export type MarketMode = 'beginner' | 'pro';

export type ProductType = 'CNC' | 'MIS' | 'MTF';
export type OrderType = 'MARKET' | 'LIMIT' | 'SL' | 'SL_M';
export type TransactionType = 'BUY' | 'SELL';
export type OrderStatus = 'COMPLETE' | 'OPEN' | 'CANCELLED' | 'REJECTED';

export interface MarketDepthItem {
  orders: number;
  qty: number;
  price: number;
}

export interface Stock {
  symbol: string;
  name: string;
  exchange: 'NSE' | 'BSE';
  price: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  marketCap: number; // in Crores
  peRatio: number;
  week52High: number;
  week52Low: number;
  upperCircuit: number;
  lowerCircuit: number;
  category: 'NIFTY 50' | 'BANK' | 'IT' | 'AUTO' | 'F&O' | 'ENERGY' | 'FMCG' | 'INFRA';
  beginnerInsight?: {
    summary: string;
    whyInvest: string;
    riskLevel: 'Low' | 'Moderate' | 'High';
    idealFor: string;
    googleSearchQuery: string;
    dividendYield?: string;
  };
  depth: {
    bids: MarketDepthItem[];
    asks: MarketDepthItem[];
    totalBidQty: number;
    totalAskQty: number;
  };
  chartData: { time: string; price: number; volume: number }[];
  technical: {
    rsi: number;
    macd: 'Bullish' | 'Bearish' | 'Neutral';
    vwap: number;
    pivot: number;
  };
}

export interface IndexTicker {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  sparkline: number[];
}

export interface Order {
  id: string;
  symbol: string;
  stockName: string;
  type: TransactionType;
  product: ProductType;
  orderType: OrderType;
  quantity: number;
  price: number;
  triggerPrice?: number;
  status: OrderStatus;
  timestamp: string;
  executionPrice?: number;
  totalCharges: number;
}

export interface Position {
  id: string;
  symbol: string;
  stockName: string;
  product: ProductType;
  quantity: number;
  buyAvg: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
}

export interface Holding {
  symbol: string;
  stockName: string;
  quantity: number;
  avgBuyPrice: number;
  currentPrice: number;
  investedValue: number;
  currentValue: number;
  pnl: number;
  pnlPercent: number;
  dayPnl: number;
  dayPnlPercent: number;
  isLossHarvestEligible?: boolean;
}

export interface IPO {
  id: string;
  companyName: string;
  symbol: string;
  priceBandMin: number;
  priceBandMax: number;
  lotSize: number;
  issueSizeCr: number;
  openDate: string;
  closeDate: string;
  listingDate: string;
  minInvestment: number;
  gmp: number; // Grey Market Premium
  gmpPercent: number;
  status: 'OPEN' | 'UPCOMING' | 'CLOSED';
  subscription: {
    qib: number;
    nii: number;
    retail: number;
    total: number;
  };
  highlights: string[];
}

export interface IPOApplication {
  id: string;
  ipoId: string;
  companyName: string;
  symbol: string;
  lots: number;
  shares: number;
  bidPrice: number;
  totalAmount: number;
  upiId: string;
  applicationNo: string;
  status: 'APPLIED' | 'MANDATE_PENDING' | 'MANDATE_APPROVED' | 'ALLOTTED' | 'REFUNDED';
  appliedAt: string;
}

export interface MutualFund {
  id: string;
  name: string;
  category: 'High Growth' | 'Tax Saver (ELSS)' | 'Index Funds' | 'Liquid Funds' | 'Debt';
  cagr1Y: number;
  cagr3Y: number;
  cagr5Y: number;
  expenseRatio: number;
  aumCr: number;
  nav: number;
  risk: 'Low' | 'Moderate' | 'High' | 'Very High';
  minSip: number;
  minLumpsum: number;
  fundManager: string;
  rating: number;
  topHoldings: { name: string; allocation: number }[];
}

export interface SIPOrder {
  id: string;
  fundId: string;
  fundName: string;
  category: string;
  amount: number;
  frequency: 'Monthly' | 'Quarterly';
  sipDate: number; // e.g. 5th of every month
  status: 'ACTIVE' | 'PAUSED';
  totalInvested: number;
  nextDebitDate: string;
  upiId: string;
}

export interface NewsItem {
  id: string;
  title: string;
  source: string;
  timeAgo: string;
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  summary: string;
  impactScore: number; // 1-10
  relatedSymbols: string[];
  category?: 'Economy & RBI' | 'Tech & Startups' | 'SEBI & Rules' | 'Earnings' | 'Energy & Commodities';
  isBreaking?: boolean;
}

export interface InstitutionalFlow {
  date: string;
  fiiCashNetCr: number; // in Crores
  diiCashNetCr: number;
  fiiDerivativesNetCr: number;
  sentiment: 'Bullish' | 'Bearish' | 'Neutral';
}

export interface BrokerageCalculation {
  turnover: number;
  brokerage: number;
  stt: number;
  exchangeFee: number;
  sebiFee: number;
  stampDuty: number;
  gst: number;
  totalCharges: number;
  netAmount: number;
  breakevenPerShare: number;
}

export interface ModalDetailItem {
  label: string;
  value: string;
  highlight?: boolean;
}

export interface ConfirmationModalState {
  isOpen: boolean;
  type?: 'ORDER' | 'CANCEL_ORDER' | 'SQUARE_OFF' | 'PANIC_EXIT' | 'HARVEST_LOSS' | 'SIP_SETUP' | 'IPO_MANDATE';
  title: string;
  description: string;
  details?: ModalDetailItem[];
  confirmLabel: string;
  confirmVariant?: 'primary' | 'danger' | 'success';
  onConfirm: () => void;
  onCancel?: () => void;
  educationalTip?: string;
}

export interface OperationReceiptModalState {
  isOpen: boolean;
  title: string;
  status: 'SUCCESS' | 'CANCELLED' | 'PENDING';
  referenceId?: string;
  timestamp: string;
  details: ModalDetailItem[];
  nextSteps?: string[];
}

export interface PriceAlert {
  id: string;
  symbol: string;
  stockName: string;
  targetPrice: number;
  condition: 'ABOVE' | 'BELOW'; // 'ABOVE' = rises to or above target; 'BELOW' = falls to or below target
  createdPrice: number;
  createdAt: string;
  triggeredAt?: string;
  isTriggered: boolean;
  isActive: boolean;
  note?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  kycStatus: 'VERIFIED' | 'PENDING';
  cdslBOID: string;
  panMask: string;
  bankName: string;
  preferredMode: 'beginner' | 'pro';
  createdAt: string;
  updatedAt: string;
  isAnonymous?: boolean;
}

