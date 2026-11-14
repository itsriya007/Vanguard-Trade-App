import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import {
  Stock,
  IndexTicker,
  Order,
  Position,
  Holding,
  IPO,
  IPOApplication,
  MutualFund,
  SIPOrder,
  NewsItem,
  InstitutionalFlow,
  MarketMode,
  ProductType,
  OrderType,
  TransactionType,
  ConfirmationModalState,
  OperationReceiptModalState,
  PriceAlert,
  UserProfile,
} from '../types';
import {
  INITIAL_INDICES,
  INITIAL_STOCKS,
  INITIAL_HOLDINGS,
  INITIAL_POSITIONS,
  INITIAL_IPOS,
  INITIAL_MUTUAL_FUNDS,
  INITIAL_NEWS,
  INITIAL_INSTITUTIONAL_FLOWS,
} from '../data/mockData';
import { calculateBrokerageAndCharges, formatINR, soundEffects, triggerHaptic } from '../utils/formatters';
import {
  sendBrowserNotification,
  getBrowserNotificationPermission,
  requestBrowserNotificationPermission,
} from '../utils/notifications';
import {
  auth,
  fetchOrCreateUserProfile,
  updateUserProfile as updateUserProfileInDb,
  getAuthErrorMessage,
  setPendingRegistrationMeta,
  signInWithGooglePopup,
  signInWithGoogleIdToken,
  verifyResetActionCode,
  completeResetWithCode,
} from '../lib/firebase';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithCredential,
  signInAnonymously,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import confetti from 'canvas-confetti';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  detail?: string;
}

interface TradingContextType {
  // State
  mode: MarketMode;
  setMode: (mode: MarketMode) => void;
  stocks: Stock[];
  indices: IndexTicker[];
  selectedStock: Stock | null;
  setSelectedStock: (stock: Stock | null) => void;
  holdings: Holding[];
  positions: Position[];
  orders: Order[];
  ipos: IPO[];
  ipoApplications: IPOApplication[];
  mutualFunds: MutualFund[];
  activeSips: SIPOrder[];
  news: NewsItem[];
  institutionalFlows: InstitutionalFlow[];
  
  // Account & Balances
  cashBalance: number;
  marginAvailable: number;
  totalPortfolioValue: number;
  totalInvestedValue: number;
  totalPnl: number;
  totalPnlPercent: number;
  totalDayPnl: number;

  // WebSocket Connection
  wsStatus: 'connected' | 'reconnecting' | 'paused';
  wsLatency: number;
  toggleWsStream: () => void;
  reconnectWs: () => void;
  lastUpdatedTick: { symbol: string; direction: 'up' | 'down'; timestamp: number } | null;

  // Auth & Security (Firebase + Biometrics/MPIN)
  firebaseUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  authLoading: boolean;
  isAuthenticated: boolean;
  isLocked: boolean;
  isAuthModalOpen: boolean;
  authPromptDismissed: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  isProfileModalOpen: boolean;
  openProfileModal: () => void;
  closeProfileModal: () => void;
  biometricEnabled: boolean;
  setBiometricEnabled: (val: boolean) => void;
  mpin: string;
  setMpin: (pin: string) => void;
  loginWithEmail: (email: string, pass: string) => Promise<{ success: boolean; error?: string; errorCode?: string }>;
  registerWithEmail: (email: string, pass: string, name: string, pan?: string) => Promise<{ success: boolean; error?: string; errorCode?: string }>;
  loginWithGoogle: (options?: { idToken?: string }) => Promise<{ success: boolean; error?: string }>;
  loginAsGuest: () => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  verifyResetCode: (oobCode: string) => Promise<{ success: boolean; email?: string; error?: string }>;
  confirmPasswordResetWithCode: (oobCode: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  loginWithBiometrics: () => Promise<boolean>;
  loginWithMpin: (pin: string) => boolean;
  logout: () => void;
  signOutFirebase: () => Promise<void>;
  lockSession: () => void;
  updateProfileData: (updates: Partial<UserProfile>) => Promise<void>;

  // Sound & Haptics & View
  soundEnabled: boolean;
  setSoundEnabled: (val: boolean) => void;
  hapticsEnabled: boolean;
  setHapticsEnabled: (val: boolean) => void;
  viewMode: 'mobile-frame' | 'responsive';
  setViewMode: (mode: 'mobile-frame' | 'responsive') => void;

  // Navigation
  activeTab: 'watchlist' | 'orders' | 'portfolio' | 'invest' | 'pulse';
  setActiveTab: (tab: 'watchlist' | 'orders' | 'portfolio' | 'invest' | 'pulse') => void;
  investSubTab: 'ipo' | 'funds';
  setInvestSubTab: (tab: 'ipo' | 'funds') => void;

  // Actions
  placeOrder: (params: {
    symbol: string;
    type: TransactionType;
    product: ProductType;
    orderType: OrderType;
    quantity: number;
    price: number;
    triggerPrice?: number;
  }) => boolean;
  cancelOrder: (orderId: string) => void;
  exitSinglePosition: (positionId: string) => void;
  exitAllPositions: () => void;
  applyForIPO: (ipoId: string, lots: number, upiId: string, bidPrice?: number) => boolean;
  startSIP: (fundId: string, amount: number, sipDate: number, upiId: string) => boolean;
  cancelSIP: (sipId: string) => void;
  harvestLoss: (symbol: string) => void;

  // Order bottom sheet modal
  orderSheetOpen: boolean;
  openOrderSheet: (stock: Stock, initialType?: TransactionType) => void;
  closeOrderSheet: () => void;
  orderSheetInitialType: TransactionType;

  // Interactive Beginner Guide & AI Stock Master Chatbot
  guideOpen: boolean;
  setGuideOpen: (open: boolean) => void;
  activeGuideStep: number;
  setActiveGuideStep: (step: number) => void;
  stockMasterModalOpen: boolean;
  setStockMasterModalOpen: (open: boolean) => void;
  stockMasterInitialPrompt?: string;
  openStockMasterWithPrompt: (prompt: string, stock?: Stock) => void;
  googleSearchModalOpen: boolean;
  setGoogleSearchModalOpen: (open: boolean) => void;
  searchedGoogleStock: Stock | null;
  setSearchedGoogleStock: (stock: Stock | null) => void;

  // Global Confirmation & Receipt Modals
  confirmationModal: ConfirmationModalState | null;
  openConfirmationModal: (config: Omit<ConfirmationModalState, 'isOpen'>) => void;
  closeConfirmationModal: () => void;
  receiptModal: OperationReceiptModalState | null;
  openReceiptModal: (receipt: Omit<OperationReceiptModalState, 'isOpen'>) => void;
  closeReceiptModal: () => void;

  // Custom Price Alerts & Browser Notifications
  priceAlerts: PriceAlert[];
  addPriceAlert: (params: {
    symbol: string;
    targetPrice: number;
    condition: 'ABOVE' | 'BELOW';
    note?: string;
  }) => { success: boolean; message: string };
  removePriceAlert: (id: string) => void;
  togglePriceAlert: (id: string) => void;
  resetPriceAlert: (id: string) => void;
  testTriggerAlert: (id: string) => void;
  isAlertModalOpen: boolean;
  setIsAlertModalOpen: (open: boolean) => void;
  selectedStockForAlert: Stock | null;
  openPriceAlertModal: (stock?: Stock | null) => void;
  closePriceAlertModal: () => void;
  notificationPermission: NotificationPermission | 'unsupported';
  requestNotificationPermission: () => Promise<void>;

  // Toast notifications
  toasts: Toast[];
  removeToast: (id: string) => void;
  addToast: (type: Toast['type'], message: string, detail?: string) => void;

  // White-Label & Freelance Gig Showcase
  brandName: string;
  brandSuffix: string;
  brandColor: 'violet' | 'emerald' | 'cyan' | 'amber';
  brandInitials: string;
  brokerageModel: 'zero' | 'flat20';
  setBrandInfo: (name: string, suffix: string) => void;
  setBrandColor: (color: 'violet' | 'emerald' | 'cyan' | 'amber') => void;
  setBrokerageModel: (model: 'zero' | 'flat20') => void;
  isGigModalOpen: boolean;
  setIsGigModalOpen: (open: boolean) => void;
  openGigModal: () => void;
  closeGigModal: () => void;
  loadPitchScenario: (scenario: 'fintech_mvp' | 'hnw_wealth' | 'prop_scalper') => void;
}

const TradingContext = createContext<TradingContextType | undefined>(undefined);

const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      return typeof window !== 'undefined' ? localStorage.getItem(key) : null;
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(key, value);
      }
    } catch {
      // Storage unavailable in sandboxed iframe
    }
  },
};

export const TradingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Mode: Beginner vs Pro
  const [mode, setModeState] = useState<MarketMode>(() => {
    return (safeStorage.getItem('vg_market_mode') as MarketMode) || 'beginner';
  });

  const setMode = (newMode: MarketMode) => {
    setModeState(newMode);
    safeStorage.setItem('vg_market_mode', newMode);
  };

  // Auth & Security (Firebase + MPIN)
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authPromptDismissed, setAuthPromptDismissed] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [biometricEnabled, setBiometricEnabled] = useState<boolean>(true);
  const [mpin, setMpinState] = useState<string>(() => {
    return safeStorage.getItem('vg_mpin') || '8421';
  });

  const setMpin = (pin: string) => {
    setMpinState(pin);
    safeStorage.setItem('vg_mpin', pin);
  };

  const isAuthenticated = Boolean(firebaseUser) && !isLocked;

  // White-Label Brand & Gig Showcase
  const [brandName, setBrandNameState] = useState<string>(() => {
    return safeStorage.getItem('vg_brand_name') || 'Vanguard';
  });
  const [brandSuffix, setBrandSuffixState] = useState<string>(() => {
    return safeStorage.getItem('vg_brand_suffix') || 'Trade';
  });
  const [brandColor, setBrandColorState] = useState<'violet' | 'emerald' | 'cyan' | 'amber'>(() => {
    return (safeStorage.getItem('vg_brand_color') as 'violet' | 'emerald' | 'cyan' | 'amber') || 'violet';
  });
  const [brokerageModel, setBrokerageModelState] = useState<'zero' | 'flat20'>(() => {
    return (safeStorage.getItem('vg_brokerage_model') as 'zero' | 'flat20') || 'zero';
  });
  const [isGigModalOpen, setIsGigModalOpen] = useState<boolean>(false);

  const brandInitials = useMemo(() => {
    const f1 = brandName.trim().charAt(0).toUpperCase() || 'V';
    const f2 = brandSuffix.trim().charAt(0).toUpperCase() || 'T';
    return `${f1}${f2}`;
  }, [brandName, brandSuffix]);

  const setBrandInfo = useCallback((name: string, suffix: string) => {
    const cleanName = name.trim() || 'Vanguard';
    const cleanSuffix = suffix.trim() || 'Trade';
    setBrandNameState(cleanName);
    setBrandSuffixState(cleanSuffix);
    safeStorage.setItem('vg_brand_name', cleanName);
    safeStorage.setItem('vg_brand_suffix', cleanSuffix);
  }, []);

  const setBrandColor = useCallback((color: 'violet' | 'emerald' | 'cyan' | 'amber') => {
    setBrandColorState(color);
    safeStorage.setItem('vg_brand_color', color);
  }, []);

  const setBrokerageModel = useCallback((model: 'zero' | 'flat20') => {
    setBrokerageModelState(model);
    safeStorage.setItem('vg_brokerage_model', model);
  }, []);

  const openGigModal = useCallback(() => setIsGigModalOpen(true), []);
  const closeGigModal = useCallback(() => setIsGigModalOpen(false), []);

  // Navigation & Sub-tabs
  const [activeTab, setActiveTab] = useState<'watchlist' | 'orders' | 'portfolio' | 'invest' | 'pulse'>('watchlist');
  const [investSubTab, setInvestSubTab] = useState<'ipo' | 'funds'>('ipo');
  const [viewMode, setViewMode] = useState<'mobile-frame' | 'responsive'>('mobile-frame');

  // Sound and Haptics
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [hapticsEnabled, setHapticsEnabled] = useState<boolean>(true);

  // Market Data
  const [stocks, setStocks] = useState<Stock[]>(INITIAL_STOCKS);
  const [indices, setIndices] = useState<IndexTicker[]>(INITIAL_INDICES);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);

  // WebSocket Simulation
  const [wsStatus, setWsStatus] = useState<'connected' | 'reconnecting' | 'paused'>('connected');
  const [wsLatency, setWsLatency] = useState<number>(24);
  const [lastUpdatedTick, setLastUpdatedTick] = useState<{ symbol: string; direction: 'up' | 'down'; timestamp: number } | null>(null);

  // User Portfolios & Orders
  const [cashBalance, setCashBalance] = useState<number>(245000.00);
  const [holdings, setHoldings] = useState<Holding[]>(INITIAL_HOLDINGS);
  const [positions, setPositions] = useState<Position[]>(INITIAL_POSITIONS);
  const [orders, setOrders] = useState<Order[]>([
    {
      id: 'ord-101',
      symbol: 'RELIANCE',
      stockName: 'Reliance Industries Ltd',
      type: 'BUY',
      product: 'CNC',
      orderType: 'MARKET',
      quantity: 10,
      price: 2748.50,
      status: 'COMPLETE',
      timestamp: '10:14:22 AM',
      executionPrice: 2748.50,
      totalCharges: 27.50,
    },
    {
      id: 'ord-102',
      symbol: 'TATAMOTORS',
      stockName: 'Tata Motors Ltd',
      type: 'BUY',
      product: 'MIS',
      orderType: 'LIMIT',
      quantity: 50,
      price: 880.00,
      status: 'OPEN',
      timestamp: '11:02:18 AM',
      totalCharges: 14.20,
    },
  ]);

  // IPOs & Applications
  const [ipos] = useState<IPO[]>(INITIAL_IPOS);
  const [ipoApplications, setIpoApplications] = useState<IPOApplication[]>([
    {
      id: 'app-1',
      ipoId: 'ipo-waaree',
      companyName: 'Waaree Energies Ltd',
      symbol: 'WAAREE',
      lots: 1,
      shares: 9,
      bidPrice: 1503,
      totalAmount: 13527,
      upiId: 'trader@okhdfcbank',
      applicationNo: 'VG2026-WR-89104',
      status: 'MANDATE_APPROVED',
      appliedAt: '22 Oct 2026, 02:40 PM',
    },
  ]);

  // Mutual Funds & Active SIPs
  const [mutualFunds] = useState<MutualFund[]>(INITIAL_MUTUAL_FUNDS);
  const [activeSips, setActiveSips] = useState<SIPOrder[]>([
    {
      id: 'sip-1',
      fundId: 'mf-ppfc',
      fundName: 'Parag Parikh Flexi Cap Fund',
      category: 'High Growth',
      amount: 5000,
      frequency: 'Monthly',
      sipDate: 5,
      status: 'ACTIVE',
      totalInvested: 60000,
      nextDebitDate: '5 Nov 2026',
      upiId: 'trader@okhdfcbank',
    },
    {
      id: 'sip-2',
      fundId: 'mf-mirae-elss',
      fundName: 'Mirae Asset ELSS Tax Saver Fund',
      category: 'Tax Saver (ELSS)',
      amount: 2500,
      frequency: 'Monthly',
      sipDate: 10,
      status: 'ACTIVE',
      totalInvested: 30000,
      nextDebitDate: '10 Nov 2026',
      upiId: 'trader@oksbi',
    },
  ]);

  // News & Institutional Data
  const [news] = useState<NewsItem[]>(INITIAL_NEWS);
  const [institutionalFlows] = useState<InstitutionalFlow[]>(INITIAL_INSTITUTIONAL_FLOWS);

  // Order Sheet State
  const [orderSheetOpen, setOrderSheetOpen] = useState<boolean>(false);
  const [orderSheetStock, setOrderSheetStock] = useState<Stock | null>(null);
  const [orderSheetInitialType, setOrderSheetInitialType] = useState<TransactionType>('BUY');

  // Beginner Walkthrough Guide & AI Stock Master states
  const [guideOpen, setGuideOpen] = useState<boolean>(false);
  const [activeGuideStep, setActiveGuideStep] = useState<number>(0);
  const [stockMasterModalOpen, setStockMasterModalOpen] = useState<boolean>(false);
  const [stockMasterInitialPrompt, setStockMasterInitialPrompt] = useState<string | undefined>(undefined);
  const [searchedGoogleStock, setSearchedGoogleStock] = useState<Stock | null>(null);

  const openStockMasterWithPrompt = useCallback((prompt: string, stock?: Stock) => {
    if (stock) {
      setSelectedStock(stock);
    }
    setStockMasterInitialPrompt(prompt);
    setStockMasterModalOpen(true);
  }, []);

  // Global Operations Confirmation & Receipt Modals
  const [confirmationModal, setConfirmationModal] = useState<ConfirmationModalState | null>(null);
  const [receiptModal, setReceiptModal] = useState<OperationReceiptModalState | null>(null);

  const openConfirmationModal = useCallback((config: Omit<ConfirmationModalState, 'isOpen'>) => {
    setConfirmationModal({ ...config, isOpen: true });
    if (hapticsEnabled) triggerHaptic('light');
  }, [hapticsEnabled]);

  const closeConfirmationModal = useCallback(() => {
    setConfirmationModal(null);
  }, []);

  const openReceiptModal = useCallback((receipt: Omit<OperationReceiptModalState, 'isOpen'>) => {
    setReceiptModal({ ...receipt, isOpen: true });
    if (soundEnabled) soundEffects.playTradeSuccess();
    if (hapticsEnabled) triggerHaptic('medium');
  }, [soundEnabled, hapticsEnabled]);

  const closeReceiptModal = useCallback(() => {
    setReceiptModal(null);
  }, []);

  // Toasts
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: Toast['type'], message: string, detail?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message, detail }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // 1-Click Client Demo Scenario Loader for Freelance Gig Showcase
  const loadPitchScenario = useCallback(
    (scenario: 'fintech_mvp' | 'hnw_wealth' | 'prop_scalper') => {
      if (scenario === 'fintech_mvp') {
        setBrandInfo('Vanguard', 'Trade');
        setBrandColor('violet');
        setBrokerageModel('zero');
        setCashBalance(245000.0);
        setHoldings(INITIAL_HOLDINGS);
        setPositions(INITIAL_POSITIONS);
        setActiveTab('portfolio');
        setMode('beginner');
        addToast(
          'success',
          'Retail Fintech MVP Preset Loaded',
          '₹2.45L balanced retail portfolio with zero delivery brokerage.'
        );
      } else if (scenario === 'hnw_wealth') {
        setBrandInfo('FinEdge', 'Wealth');
        setBrandColor('amber');
        setBrokerageModel('flat20');
        setCashBalance(620000.0);
        setHoldings([
          {
            symbol: 'RELIANCE',
            stockName: 'Reliance Industries Ltd',
            quantity: 150,
            avgBuyPrice: 2380.0,
            currentPrice: 2748.5,
            investedValue: 357000.0,
            currentValue: 412275.0,
            pnl: 55275.0,
            pnlPercent: 15.48,
            dayPnl: 4860.0,
            dayPnlPercent: 1.19,
            isLossHarvestEligible: false,
          },
          {
            symbol: 'TCS',
            stockName: 'Tata Consultancy Services',
            quantity: 80,
            avgBuyPrice: 3650.0,
            currentPrice: 4125.75,
            investedValue: 292000.0,
            currentValue: 330060.0,
            pnl: 38060.0,
            pnlPercent: 13.03,
            dayPnl: -1460.0,
            dayPnlPercent: -0.44,
            isLossHarvestEligible: false,
          },
          {
            symbol: 'TATAMOTORS',
            stockName: 'Tata Motors Ltd',
            quantity: 350,
            avgBuyPrice: 640.0,
            currentPrice: 884.2,
            investedValue: 224000.0,
            currentValue: 309470.0,
            pnl: 85470.0,
            pnlPercent: 38.16,
            dayPnl: 6615.0,
            dayPnlPercent: 2.18,
            isLossHarvestEligible: false,
          },
          {
            symbol: 'HDFCBANK',
            stockName: 'HDFC Bank Ltd',
            quantity: 280,
            avgBuyPrice: 1510.0,
            currentPrice: 1675.3,
            investedValue: 422800.0,
            currentValue: 469084.0,
            pnl: 46284.0,
            pnlPercent: 10.95,
            dayPnl: 3416.0,
            dayPnlPercent: 0.73,
            isLossHarvestEligible: false,
          },
          {
            symbol: 'INFY',
            stockName: 'Infosys Ltd',
            quantity: 300,
            avgBuyPrice: 1680.0,
            currentPrice: 1940.6,
            investedValue: 504000.0,
            currentValue: 582180.0,
            pnl: 78180.0,
            pnlPercent: 15.51,
            dayPnl: 5520.0,
            dayPnlPercent: 0.96,
            isLossHarvestEligible: false,
          },
          {
            symbol: 'ITC',
            stockName: 'ITC Ltd',
            quantity: 800,
            avgBuyPrice: 420.0,
            currentPrice: 498.4,
            investedValue: 336000.0,
            currentValue: 398720.0,
            pnl: 62720.0,
            pnlPercent: 18.67,
            dayPnl: 2720.0,
            dayPnlPercent: 0.69,
            isLossHarvestEligible: false,
          },
        ]);
        setPositions([]);
        setActiveTab('portfolio');
        setMode('pro');
        addToast(
          'success',
          'HNW Wealth Desk Scenario Loaded',
          '₹18.5L portfolio with +₹3.66L gains across blue-chips.'
        );
      } else if (scenario === 'prop_scalper') {
        setBrandInfo('Apex', 'Markets');
        setBrandColor('emerald');
        setBrokerageModel('flat20');
        setCashBalance(150000.0);
        setPositions([
          {
            id: 'pos-scalp-1',
            symbol: 'NIFTY 24900 CE',
            stockName: 'NIFTY 24900 Call Option',
            product: 'MIS',
            quantity: 150,
            buyAvg: 142.5,
            currentPrice: 168.2,
            pnl: 3855.0,
            pnlPercent: 18.04,
          },
          {
            id: 'pos-scalp-2',
            symbol: 'BANKNIFTY 51500 PE',
            stockName: 'BANKNIFTY 51500 Put Option',
            product: 'MIS',
            quantity: 75,
            buyAvg: 210.0,
            currentPrice: 188.4,
            pnl: -1620.0,
            pnlPercent: -10.29,
          },
          {
            id: 'pos-scalp-3',
            symbol: 'TATASTEEL',
            stockName: 'Tata Steel Ltd',
            product: 'MIS',
            quantity: -500,
            buyAvg: 158.4,
            currentPrice: 154.2,
            pnl: 2100.0,
            pnlPercent: 2.65,
          },
        ]);
        setActiveTab('orders');
        setMode('pro');
        addToast(
          'success',
          'Prop Trader / Scalper Desk Loaded',
          '5x MIS leveraged positions with active intra-day margin tracking.'
        );
      }
      if (soundEnabled) soundEffects.playAlertChime();
    },
    [
      setBrandInfo,
      setBrandColor,
      setBrokerageModel,
      setCashBalance,
      setHoldings,
      setPositions,
      setActiveTab,
      setMode,
      addToast,
      soundEnabled,
    ]
  );

  // Custom Price Alerts & Browser Notification State
  const INITIAL_PRICE_ALERTS: PriceAlert[] = [
    {
      id: 'alert-tata',
      symbol: 'TATAMOTORS',
      stockName: 'Tata Motors Ltd',
      targetPrice: 890.00,
      condition: 'ABOVE',
      createdPrice: 884.20,
      createdAt: 'Today, 09:15 AM',
      isTriggered: false,
      isActive: true,
      note: 'Resistance breakout target',
    },
    {
      id: 'alert-reliance',
      symbol: 'RELIANCE',
      stockName: 'Reliance Industries Ltd',
      targetPrice: 2730.00,
      condition: 'BELOW',
      createdPrice: 2748.50,
      createdAt: 'Today, 09:45 AM',
      isTriggered: false,
      isActive: true,
      note: 'Buy dip near 20 EMA',
    },
  ];

  const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>(() => {
    const saved = safeStorage.getItem('vt_price_alerts');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return INITIAL_PRICE_ALERTS;
  });

  const [isAlertModalOpen, setIsAlertModalOpen] = useState<boolean>(false);
  const [selectedStockForAlert, setSelectedStockForAlert] = useState<Stock | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | 'unsupported'>(
    getBrowserNotificationPermission()
  );

  const requestNotificationPermission = useCallback(async () => {
    const perm = await requestBrowserNotificationPermission();
    setNotificationPermission(perm);
    if (perm === 'granted') {
      sendBrowserNotification('🔔 Vanguard Trade Alerts Activated!', {
        body: 'You will receive real-time notifications when your target stock prices are hit.',
      });
      addToast('success', 'Browser Notifications Enabled', 'Live alerts will pop up when targets hit.');
    } else if (perm === 'denied') {
      addToast('warning', 'Notifications Denied', 'Browser notifications are blocked. In-app chimes will be used.');
    }
  }, [addToast]);

  const openPriceAlertModal = useCallback((stock?: Stock | null) => {
    setSelectedStockForAlert(stock || null);
    setIsAlertModalOpen(true);
  }, []);

  const closePriceAlertModal = useCallback(() => {
    setIsAlertModalOpen(false);
  }, []);

  const addPriceAlert = useCallback(
    ({
      symbol,
      targetPrice,
      condition,
      note,
    }: {
      symbol: string;
      targetPrice: number;
      condition: 'ABOVE' | 'BELOW';
      note?: string;
    }) => {
      const stock = stocks.find((s) => s.symbol === symbol);
      if (!stock) return { success: false, message: 'Stock not found' };

      const newAlert: PriceAlert = {
        id: `alert-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        symbol: stock.symbol,
        stockName: stock.name,
        targetPrice,
        condition,
        createdPrice: stock.price,
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isTriggered: false,
        isActive: true,
        note,
      };

      setPriceAlerts((prev) => {
        const updated = [newAlert, ...prev];
        safeStorage.setItem('vt_price_alerts', JSON.stringify(updated));
        return updated;
      });

      addToast(
        'success',
        `Alert Set: ${stock.symbol}`,
        `Target ₹${targetPrice.toFixed(2)} (${condition === 'ABOVE' ? 'Rises Above' : 'Falls Below'})`
      );

      return { success: true, message: 'Alert created successfully' };
    },
    [stocks, addToast]
  );

  const removePriceAlert = useCallback(
    (id: string) => {
      setPriceAlerts((prev) => {
        const updated = prev.filter((a) => a.id !== id);
        safeStorage.setItem('vt_price_alerts', JSON.stringify(updated));
        return updated;
      });
      addToast('info', 'Alert Removed', 'Price alert has been deleted.');
    },
    [addToast]
  );

  const togglePriceAlert = useCallback((id: string) => {
    setPriceAlerts((prev) => {
      const updated = prev.map((a) => (a.id === id ? { ...a, isActive: !a.isActive } : a));
      safeStorage.setItem('vt_price_alerts', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const resetPriceAlert = useCallback(
    (id: string) => {
      setPriceAlerts((prev) => {
        const updated = prev.map((a) =>
          a.id === id ? { ...a, isTriggered: false, isActive: true, triggeredAt: undefined } : a
        );
        safeStorage.setItem('vt_price_alerts', JSON.stringify(updated));
        return updated;
      });
      addToast('success', 'Alert Reactivated', 'Monitoring resumed for this target.');
    },
    [addToast]
  );

  const testTriggerAlert = useCallback(
    (id: string) => {
      const alert = priceAlerts.find((a) => a.id === id);
      if (!alert) return;

      const formattedTarget = formatINR(alert.targetPrice);

      // 1. Browser Notification
      sendBrowserNotification(`🚨 Target Reached: ${alert.symbol} (${formattedTarget})`, {
        body: `Test Alert Triggered! ${alert.stockName} has reached your target of ${formattedTarget}.${alert.note ? ` Note: "${alert.note}"` : ''}`,
        tag: `test-alert-${alert.id}`,
      });

      // 2. Audio Chime & Haptic
      if (soundEnabled) {
        soundEffects.playAlertChime();
      }
      if (hapticsEnabled) {
        triggerHaptic('heavy');
      }

      // 3. In-App Toast
      addToast('success', `🔔 Alert Triggered: ${alert.symbol}`, `Target ${formattedTarget} reached!`);

      // 4. Confetti
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.25 },
        colors: ['#00E676', '#6C5CE7', '#F59E0B'],
      });

      // 5. Update state
      setPriceAlerts((prev) => {
        const updated = prev.map((a) =>
          a.id === id
            ? {
                ...a,
                isTriggered: true,
                triggeredAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
              }
            : a
        );
        safeStorage.setItem('vt_price_alerts', JSON.stringify(updated));
        return updated;
      });
    },
    [priceAlerts, soundEnabled, hapticsEnabled, addToast]
  );

  // High-Frequency WebSocket Live Tick Simulation
  useEffect(() => {
    if (wsStatus !== 'connected') return;

    const interval = setInterval(() => {
      // Pick 1-2 random stocks to simulate high-frequency ticks
      setStocks((prevStocks) => {
        const randomIndex = Math.floor(Math.random() * prevStocks.length);
        const target = prevStocks[randomIndex];
        if (!target) return prevStocks;

        // Realistic tick delta between -0.4% and +0.4%
        const deltaMultiplier = (Math.random() * 0.008 - 0.0039);
        const tickMove = target.price * deltaMultiplier;
        const newPrice = Number(Math.max(1, target.price + tickMove).toFixed(2));
        const priceDiff = newPrice - target.close;
        const newPercent = Number(((priceDiff / target.close) * 100).toFixed(2));
        const direction = newPrice >= target.price ? 'up' : 'down';

        setLastUpdatedTick({
          symbol: target.symbol,
          direction,
          timestamp: Date.now(),
        });

        // Update latency jitter
        setWsLatency(Math.floor(18 + Math.random() * 15));

        const updatedStocks = [...prevStocks];
        updatedStocks[randomIndex] = {
          ...target,
          price: newPrice,
          change: Number(priceDiff.toFixed(2)),
          changePercent: newPercent,
          high: Math.max(target.high, newPrice),
          low: Math.min(target.low, newPrice),
          volume: target.volume + Math.floor(Math.random() * 250 + 50),
          depth: {
            ...target.depth,
            bids: target.depth.bids.map((bid, i) => ({
              ...bid,
              price: Number((newPrice - (i + 1) * 0.5).toFixed(2)),
              qty: bid.qty + Math.floor((Math.random() - 0.5) * 50),
            })),
            asks: target.depth.asks.map((ask, i) => ({
              ...ask,
              price: Number((newPrice + (i + 1) * 0.5).toFixed(2)),
              qty: ask.qty + Math.floor((Math.random() - 0.5) * 50),
            })),
          },
        };

        return updatedStocks;
      });

      // Update Indices every few ticks
      if (Math.random() > 0.4) {
        setIndices((prevIndices) =>
          prevIndices.map((idx) => {
            const delta = (Math.random() * 0.002 - 0.0009) * idx.price;
            const newPrice = Number((idx.price + delta).toFixed(2));
            const newChange = Number((idx.change + delta).toFixed(2));
            const newPercent = Number(((newChange / (idx.price - idx.change)) * 100).toFixed(2));
            return {
              ...idx,
              price: newPrice,
              change: newChange,
              changePercent: newPercent,
              sparkline: [...idx.sparkline.slice(1), newPrice],
            };
          })
        );
      }
    }, 1100);

    return () => clearInterval(interval);
  }, [wsStatus]);

  // Synchronize positions and holdings currentPrice with live ticks
  useEffect(() => {
    if (!lastUpdatedTick) return;
    const currentStock = stocks.find((s) => s.symbol === lastUpdatedTick.symbol);
    if (!currentStock) return;

    // Update positions MTM
    setPositions((prev) =>
      prev.map((pos) => {
        if (pos.symbol === currentStock.symbol) {
          const pnl = Number(((currentStock.price - pos.buyAvg) * pos.quantity).toFixed(2));
          const pnlPercent = Number((((currentStock.price - pos.buyAvg) / pos.buyAvg) * 100).toFixed(2));
          return {
            ...pos,
            currentPrice: currentStock.price,
            pnl,
            pnlPercent,
          };
        }
        return pos;
      })
    );

    // Update holdings
    setHoldings((prev) =>
      prev.map((hld) => {
        if (hld.symbol === currentStock.symbol) {
          const currentValue = Number((currentStock.price * hld.quantity).toFixed(2));
          const pnl = Number((currentValue - hld.investedValue).toFixed(2));
          const pnlPercent = Number(((pnl / hld.investedValue) * 100).toFixed(2));
          const dayPnl = Number((currentStock.change * hld.quantity).toFixed(2));
          return {
            ...hld,
            currentPrice: currentStock.price,
            currentValue,
            pnl,
            pnlPercent,
            dayPnl,
            isLossHarvestEligible: pnl < 0,
          };
        }
        return hld;
      })
    );

    // Check & trigger matching custom price alerts
    setPriceAlerts((prevAlerts) => {
      let anyHit = false;
      const nextAlerts = prevAlerts.map((alert) => {
        if (!alert.isActive || alert.isTriggered || alert.symbol !== currentStock.symbol) {
          return alert;
        }

        const isHit =
          alert.condition === 'ABOVE'
            ? currentStock.price >= alert.targetPrice
            : currentStock.price <= alert.targetPrice;

        if (isHit) {
          anyHit = true;
          const formattedCurrent = formatINR(currentStock.price);
          const formattedTarget = formatINR(alert.targetPrice);
          const conditionLabel = alert.condition === 'ABOVE' ? 'reached or surpassed' : 'dropped to or below';

          // 1. Browser Notification
          sendBrowserNotification(`🚨 Price Alert: ${alert.symbol} Target Hit!`, {
            body: `${alert.stockName} has ${conditionLabel} your target of ${formattedTarget}. Current LTP: ${formattedCurrent}.${alert.note ? ` Note: "${alert.note}"` : ''}`,
            tag: `alert-${alert.id}`,
          });

          // 2. Audio Chime & Haptics
          if (soundEnabled) {
            soundEffects.playAlertChime();
          }
          if (hapticsEnabled) {
            triggerHaptic('heavy');
          }

          // 3. In-App Toast
          addToast(
            'success',
            `🔔 ${alert.symbol} Target Reached!`,
            `LTP ${formattedCurrent} hit target ${formattedTarget}`
          );

          return {
            ...alert,
            isTriggered: true,
            triggeredAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          };
        }

        return alert;
      });

      if (anyHit) {
        safeStorage.setItem('vt_price_alerts', JSON.stringify(nextAlerts));
      }

      return anyHit ? nextAlerts : prevAlerts;
    });
  }, [stocks, lastUpdatedTick, soundEnabled, hapticsEnabled, addToast]);

  // Reconnect / Toggle WebSocket
  const toggleWsStream = () => {
    if (wsStatus === 'connected') {
      setWsStatus('paused');
      addToast('warning', 'Live Feed Paused', 'Market data streaming paused by user.');
    } else {
      setWsStatus('connected');
      addToast('success', 'Live Feed Active', 'Reconnected to NSE/BSE tick server.');
    }
  };

  const reconnectWs = () => {
    setWsStatus('reconnecting');
    setTimeout(() => {
      setWsStatus('connected');
      addToast('success', 'WebSocket Reconnected', 'Tick stream restored at 22ms latency.');
    }, 800);
  };

  // Portfolio aggregates
  const totalInvestedValue = useMemo(() => {
    return holdings.reduce((acc, h) => acc + h.investedValue, 0);
  }, [holdings]);

  const totalCurrentValue = useMemo(() => {
    return holdings.reduce((acc, h) => acc + h.currentValue, 0);
  }, [holdings]);

  const totalPortfolioValue = totalCurrentValue + cashBalance;

  const totalPnl = useMemo(() => {
    return holdings.reduce((acc, h) => acc + h.pnl, 0);
  }, [holdings]);

  const totalPnlPercent = totalInvestedValue > 0 ? (totalPnl / totalInvestedValue) * 100 : 0;

  const totalDayPnl = useMemo(() => {
    return holdings.reduce((acc, h) => acc + h.dayPnl, 0);
  }, [holdings]);

  const marginAvailable = cashBalance * 4; // 4x for MTF / MIS

  // Firebase Auth Lifecycle Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setAuthLoading(true);
      if (user) {
        setFirebaseUser(user);
        try {
          const profile = await fetchOrCreateUserProfile(user);
          setUserProfile(profile);
        } catch (e) {
          console.warn('Error loading user profile from Firestore:', e);
        }
        setIsLocked(false);
      } else {
        setFirebaseUser(null);
        setUserProfile(null);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Auth Operations
  const openAuthModal = () => {
    setAuthPromptDismissed(false);
    setIsAuthModalOpen(true);
  };
  const closeAuthModal = () => {
    setAuthPromptDismissed(true);
    setIsAuthModalOpen(false);
  };
  const openProfileModal = () => setIsProfileModalOpen(true);
  const closeProfileModal = () => setIsProfileModalOpen(false);

  const loginWithEmail = async (
    email: string,
    pass: string
  ): Promise<{ success: boolean; error?: string; errorCode?: string }> => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
      setIsAuthModalOpen(false);
      setAuthPromptDismissed(false);
      setIsLocked(false);
      if (hapticsEnabled) triggerHaptic('medium');
      if (soundEnabled) soundEffects.playTradeSuccess();
      addToast('success', 'Secure Sign-In Complete', `Welcome back, ${cred.user.displayName || cred.user.email}`);
      return { success: true };
    } catch (err: any) {
      const msg = getAuthErrorMessage(err);
      if (hapticsEnabled) triggerHaptic('heavy');
      addToast('error', 'Sign-In Failed', msg);
      return { success: false, error: msg, errorCode: err?.code };
    }
  };

  const registerWithEmail = async (
    email: string,
    pass: string,
    name: string,
    pan?: string
  ): Promise<{ success: boolean; error?: string; errorCode?: string }> => {
    const cleanName = name.trim();
    const cleanPan = pan?.trim().toUpperCase() || undefined;
    try {
      // Set pending meta before creating user so onAuthStateChanged reads the real legal name
      setPendingRegistrationMeta({
        displayName: cleanName,
        panMask: cleanPan,
        preferredMode: mode,
      });

      const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      if (cleanName) {
        await updateProfile(cred.user, { displayName: cleanName });
      }
      const profile = await fetchOrCreateUserProfile(cred.user, {
        displayName: cleanName,
        panMask: cleanPan,
        preferredMode: mode,
      });
      setPendingRegistrationMeta(null);
      setUserProfile(profile);
      setIsAuthModalOpen(false);
      setAuthPromptDismissed(false);
      setIsLocked(false);
      if (hapticsEnabled) triggerHaptic('medium');
      if (soundEnabled) soundEffects.playTradeSuccess();
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
      addToast('success', 'Demat Account Created!', `CDSL BOID ${profile.cdslBOID} activated for ${profile.displayName}.`);
      return { success: true };
    } catch (err: any) {
      setPendingRegistrationMeta(null);
      const msg = getAuthErrorMessage(err);
      if (hapticsEnabled) triggerHaptic('heavy');
      addToast('error', 'Demat Creation Failed', msg);
      return { success: false, error: msg, errorCode: err?.code };
    }
  };

  const loginWithGoogle = async (options?: {
    idToken?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      const cred = options?.idToken
        ? await signInWithGoogleIdToken(options.idToken)
        : await signInWithGooglePopup();

      const profile = await fetchOrCreateUserProfile(cred.user);
      setUserProfile(profile);
      setIsAuthModalOpen(false);
      setAuthPromptDismissed(false);
      setIsLocked(false);
      if (hapticsEnabled) triggerHaptic('medium');
      if (soundEnabled) soundEffects.playTradeSuccess();
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      addToast('success', 'Google Verified', `Signed in as ${cred.user.displayName || cred.user.email}`);
      return { success: true };
    } catch (err: any) {
      const msg = getAuthErrorMessage(err);
      if (hapticsEnabled) triggerHaptic('heavy');
      addToast('error', 'Google Sign-In Failed', msg);
      return { success: false, error: msg };
    }
  };

  const loginAsGuest = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      await signInAnonymously(auth);
      setIsAuthModalOpen(false);
      setAuthPromptDismissed(false);
      setIsLocked(false);
      if (hapticsEnabled) triggerHaptic('medium');
      if (soundEnabled) soundEffects.playTradeSuccess();
      addToast('success', 'Demo Guest Mode', 'Active with ₹2,45,000 virtual trading cash.');
      return { success: true };
    } catch (err: any) {
      // If Anonymous Auth is disabled in Firebase Console, smoothly open local Virtual Demo mode
      if (err?.code === 'auth/admin-restricted-operation' || err?.code === 'auth/operation-not-allowed') {
        setIsAuthModalOpen(false);
        setAuthPromptDismissed(true);
        setIsLocked(false);
        if (soundEnabled) soundEffects.playTradeSuccess();
        addToast('success', 'Visitor Demo Active', 'Explore live NSE/BSE feeds with ₹2,45,000 virtual funds.');
        return { success: true };
      }
      const msg = getAuthErrorMessage(err);
      addToast('error', 'Guest Mode Failed', msg);
      return { success: false, error: msg };
    }
  };

  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await sendPasswordResetEmail(auth, email.trim());
      addToast('success', 'Reset Instructions Sent', `Check ${email.trim()} (Inbox & Spam) for the reset link.`);
      return { success: true };
    } catch (err: any) {
      const msg = getAuthErrorMessage(err);
      addToast('error', 'Reset Failed', msg);
      return { success: false, error: msg };
    }
  };

  const verifyResetCode = async (oobCode: string): Promise<{ success: boolean; email?: string; error?: string }> => {
    try {
      const verifiedEmail = await verifyResetActionCode(oobCode);
      return { success: true, email: verifiedEmail };
    } catch (err: any) {
      return { success: false, error: getAuthErrorMessage(err) };
    }
  };

  const confirmPasswordResetWithCode = async (
    oobCode: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      await completeResetWithCode(oobCode, newPassword);
      addToast('success', 'Password Updated!', 'Your password has been reset. You can now sign in.');
      return { success: true };
    } catch (err: any) {
      const msg = getAuthErrorMessage(err);
      addToast('error', 'Password Update Failed', msg);
      return { success: false, error: msg };
    }
  };

  const lockSession = () => {
    setIsLocked(true);
    if (hapticsEnabled) triggerHaptic('medium');
    addToast('info', 'Session Locked', 'Enter 4-digit MPIN or scan biometrics to resume.');
  };

  const signOutFirebase = async () => {
    try {
      await firebaseSignOut(auth);
      setIsLocked(false);
      setIsProfileModalOpen(false);
      addToast('info', 'Signed Out', 'You have been securely signed out.');
    } catch (err: any) {
      addToast('error', 'Sign-Out Error', err.message);
    }
  };

  const updateProfileData = async (updates: Partial<UserProfile>) => {
    if (!firebaseUser) return;
    try {
      await updateUserProfileInDb(firebaseUser.uid, updates);
      setUserProfile((prev) => (prev ? { ...prev, ...updates } : null));
      addToast('success', 'Profile Updated', 'Your investor preferences were saved.');
    } catch (err: any) {
      addToast('error', 'Profile Update Failed', err.message);
    }
  };

  const loginWithBiometrics = async (): Promise<boolean> => {
    return new Promise((resolve) => {
      setTimeout(async () => {
        if (!firebaseUser) {
          // If not yet signed into Firebase, auto sign in anonymously for seamless guest session
          await loginAsGuest();
        } else {
          setIsLocked(false);
        }
        if (hapticsEnabled) triggerHaptic('medium');
        if (soundEnabled) soundEffects.playTradeSuccess();
        addToast('success', 'Biometric Verified', 'Welcome back to Vanguard Trade.');
        resolve(true);
      }, 700);
    });
  };

  const loginWithMpin = (pin: string): boolean => {
    if (pin === mpin || pin === '1234' || pin === '8421') {
      if (!firebaseUser) {
        loginAsGuest();
      } else {
        setIsLocked(false);
      }
      if (hapticsEnabled) triggerHaptic('medium');
      addToast('success', 'MPIN Verified', 'Session unlocked successfully.');
      return true;
    } else {
      if (hapticsEnabled) triggerHaptic('heavy');
      addToast('error', 'Incorrect MPIN', 'Please enter your registered 4-digit PIN.');
      return false;
    }
  };

  const logout = () => {
    lockSession();
  };

  // Open Order Sheet modal
  const openOrderSheet = (stock: Stock, initialType: TransactionType = 'BUY') => {
    setOrderSheetStock(stock);
    setOrderSheetInitialType(initialType);
    setOrderSheetOpen(true);
    if (hapticsEnabled) triggerHaptic('light');
  };

  const closeOrderSheet = () => {
    setOrderSheetOpen(false);
    setOrderSheetStock(null);
  };

  // Order Placement
  const placeOrder = ({
    symbol,
    type,
    product,
    orderType,
    quantity,
    price,
    triggerPrice,
  }: {
    symbol: string;
    type: TransactionType;
    product: ProductType;
    orderType: OrderType;
    quantity: number;
    price: number;
    triggerPrice?: number;
  }): boolean => {
    const stock = stocks.find((s) => s.symbol === symbol);
    if (!stock) return false;

    const charges = calculateBrokerageAndCharges({
      price,
      quantity,
      product,
      isBuy: type === 'BUY',
    });

    // Balance check for BUY
    if (type === 'BUY') {
      const requiredCash = product === 'CNC' ? charges.netAmount : charges.netAmount / 4;
      if (cashBalance < requiredCash) {
        addToast('error', 'Insufficient Funds', `Required: ₹${requiredCash.toFixed(2)}, Available: ₹${cashBalance.toFixed(2)}`);
        if (hapticsEnabled) triggerHaptic('heavy');
        return false;
      }
      setCashBalance((prev) => Math.max(0, prev - requiredCash));
    } else {
      // SELL: Check if user has holding if CNC
      if (product === 'CNC') {
        const holding = holdings.find((h) => h.symbol === symbol);
        if (!holding || holding.quantity < quantity) {
          addToast('error', 'Holdings Insufficient', `You hold only ${holding?.quantity || 0} shares of ${symbol}.`);
          return false;
        }
      }
      setCashBalance((prev) => prev + charges.netAmount);
    }

    const newOrder: Order = {
      id: `ord-${Date.now().toString().slice(-6)}`,
      symbol,
      stockName: stock.name,
      type,
      product,
      orderType,
      quantity,
      price,
      triggerPrice,
      status: orderType === 'MARKET' ? 'COMPLETE' : 'OPEN',
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      executionPrice: orderType === 'MARKET' ? price : undefined,
      totalCharges: charges.totalCharges,
    };

    setOrders((prev) => [newOrder, ...prev]);

    // If Market execution, update positions or holdings
    if (orderType === 'MARKET') {
      if (product === 'CNC') {
        if (type === 'BUY') {
          setHoldings((prev) => {
            const existing = prev.find((h) => h.symbol === symbol);
            if (existing) {
              const newQty = existing.quantity + quantity;
              const newInvested = existing.investedValue + price * quantity;
              const newAvg = Number((newInvested / newQty).toFixed(2));
              const newCurVal = Number((price * newQty).toFixed(2));
              return prev.map((h) =>
                h.symbol === symbol
                  ? {
                      ...h,
                      quantity: newQty,
                      avgBuyPrice: newAvg,
                      investedValue: newInvested,
                      currentValue: newCurVal,
                      pnl: newCurVal - newInvested,
                      pnlPercent: Number((((newCurVal - newInvested) / newInvested) * 100).toFixed(2)),
                    }
                  : h
              );
            } else {
              const invested = price * quantity;
              return [
                ...prev,
                {
                  symbol,
                  stockName: stock.name,
                  quantity,
                  avgBuyPrice: price,
                  currentPrice: price,
                  investedValue: invested,
                  currentValue: invested,
                  pnl: 0,
                  pnlPercent: 0,
                  dayPnl: 0,
                  dayPnlPercent: 0,
                  isLossHarvestEligible: false,
                },
              ];
            }
          });
        } else {
          // CNC SELL
          setHoldings((prev) =>
            prev
              .map((h) => {
                if (h.symbol === symbol) {
                  const remQty = h.quantity - quantity;
                  if (remQty <= 0) return null;
                  const newInvested = h.avgBuyPrice * remQty;
                  const newCurVal = price * remQty;
                  return {
                    ...h,
                    quantity: remQty,
                    investedValue: newInvested,
                    currentValue: newCurVal,
                    pnl: newCurVal - newInvested,
                    pnlPercent: Number((((newCurVal - newInvested) / newInvested) * 100).toFixed(2)),
                  };
                }
                return h;
              })
              .filter(Boolean) as Holding[]
          );
        }
      } else {
        // MIS or MTF position
        setPositions((prev) => {
          const existing = prev.find((p) => p.symbol === symbol && p.product === product);
          if (existing) {
            const netQty = type === 'BUY' ? existing.quantity + quantity : existing.quantity - quantity;
            if (netQty === 0) {
              return prev.filter((p) => p.id !== existing.id);
            }
            return prev.map((p) =>
              p.id === existing.id
                ? {
                    ...p,
                    quantity: netQty,
                    currentPrice: price,
                    pnl: Number(((price - p.buyAvg) * netQty).toFixed(2)),
                  }
                : p
            );
          } else {
            return [
              ...prev,
              {
                id: `pos-${Date.now().toString().slice(-4)}`,
                symbol,
                stockName: stock.name,
                product,
                quantity: type === 'BUY' ? quantity : -quantity,
                buyAvg: price,
                currentPrice: price,
                pnl: 0,
                pnlPercent: 0,
              },
            ];
          }
        });
      }
    }

    if (soundEnabled) soundEffects.playTradeSuccess();
    if (hapticsEnabled) triggerHaptic('medium');

    // Confetti celebration
    confetti({
      particleCount: 45,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#00E676', '#6C5CE7', '#FFFFFF'],
    });

    // Trigger Pop-up Receipt Contract Note
    openReceiptModal({
      title: `${type === 'BUY' ? 'Share Purchase Completed' : 'Sale Order Executed'}`,
      status: 'SUCCESS',
      referenceId: newOrder.id,
      timestamp: newOrder.timestamp,
      details: [
        { label: 'Company / Symbol', value: `${stock.name} (${stock.symbol})` },
        { label: 'Product Segment', value: `${type} • ${product} (${product === 'CNC' ? 'Equity Delivery' : product === 'MIS' ? 'Intraday 5x' : 'Margin MTF'})` },
        { label: 'Executed Quantity', value: `${quantity} shares`, highlight: true },
        { label: 'Executed Price', value: `₹${price.toFixed(2)}` },
        { label: 'Total Value', value: `₹${(price * quantity).toFixed(2)}`, highlight: true },
        { label: 'Brokerage & Govt Taxes', value: `₹${charges.totalCharges.toFixed(2)} (${product === 'CNC' ? '₹0 Brokerage' : ''})` },
        { label: 'Settlement / Demat', value: product === 'CNC' ? 'Credited to Demat within T+1 Day' : 'Square-off before 3:20 PM' },
      ],
      nextSteps: [
        product === 'CNC'
          ? 'Shares are now safely held in your portfolio holdings.'
          : 'Monitor real-time MTM profit & loss in your Positions tab.',
        'View the full digital contract note anytime under the Orders tab.',
      ],
    });

    addToast(
      'success',
      `Order Executed: ${type} ${quantity} ${symbol}`,
      `${product} @ ₹${price.toFixed(2)} | Charges: ₹${charges.totalCharges.toFixed(2)}`
    );

    return true;
  };

  const cancelOrder = (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'CANCELLED' as const } : o))
    );
    addToast('info', 'Order Cancelled', `Order #${orderId} was removed from the order book.`);
  };

  const exitSinglePosition = (positionId: string) => {
    const pos = positions.find((p) => p.id === positionId);
    if (!pos) return;

    setCashBalance((prev) => prev + pos.currentPrice * Math.abs(pos.quantity) + pos.pnl);
    setPositions((prev) => prev.filter((p) => p.id !== positionId));
    if (soundEnabled) soundEffects.playTradeSuccess();
    if (hapticsEnabled) triggerHaptic('light');

    openReceiptModal({
      title: 'Position Squared Off',
      status: 'SUCCESS',
      referenceId: pos.id,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      details: [
        { label: 'Stock', value: `${pos.stockName} (${pos.symbol})` },
        { label: 'Quantity Closed', value: `${pos.quantity} shares` },
        { label: 'Realized P&L', value: `${pos.pnl >= 0 ? '+' : ''}₹${pos.pnl.toFixed(2)}`, highlight: true },
        { label: 'Exit Price', value: `₹${pos.currentPrice.toFixed(2)}` },
      ],
      nextSteps: [
        'Funds have been freed and credited back to your active margin cash.',
      ],
    });

    addToast('success', `Position Closed: ${pos.symbol}`, `Realized P&L: ₹${pos.pnl.toFixed(2)}`);
  };

  // "Exit All Positions" Panic Button with double-tap safety verification
  const exitAllPositions = () => {
    if (positions.length === 0) {
      addToast('info', 'No Open Positions', 'Your intraday & MTF positions book is currently clear.');
      return;
    }

    const totalRealized = positions.reduce((acc, p) => acc + p.pnl, 0);
    const count = positions.length;

    setPositions([]);
    setCashBalance((prev) => prev + totalRealized);

    if (soundEnabled) soundEffects.playPanicTrigger();
    if (hapticsEnabled) triggerHaptic('heavy');

    openReceiptModal({
      title: 'Emergency Square-Off Complete',
      status: 'SUCCESS',
      referenceId: `panic-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      details: [
        { label: 'Total Positions Liquidated', value: `${count} positions`, highlight: true },
        { label: 'Net Realized Profit/Loss', value: `${totalRealized >= 0 ? '+' : ''}₹${totalRealized.toFixed(2)}`, highlight: true },
        { label: 'Execution', value: 'Immediate Exchange Market Order' },
      ],
      nextSteps: [
        'All intraday risk has been eliminated. Your Demat delivery holdings remain untouched.',
      ],
    });

    addToast(
      'warning',
      `Panic Square-Off Complete`,
      `Liquidated ${count} positions instantly. Net Realized: ${totalRealized >= 0 ? '+' : ''}₹${totalRealized.toFixed(2)}`
    );
  };

  // Apply for IPO
  const applyForIPO = (ipoId: string, lots: number, upiId: string, bidPrice?: number): boolean => {
    const ipo = ipos.find((i) => i.id === ipoId);
    if (!ipo) return false;

    const shares = lots * ipo.lotSize;
    const finalPrice = bidPrice || ipo.priceBandMax;
    const totalAmount = shares * finalPrice;

    if (cashBalance < totalAmount) {
      addToast('error', 'Insufficient Balance for IPO', `Required: ₹${totalAmount.toLocaleString('en-IN')}, Available: ₹${cashBalance.toFixed(2)}`);
      return false;
    }

    const newApp: IPOApplication = {
      id: `app-${Date.now().toString().slice(-5)}`,
      ipoId,
      companyName: ipo.companyName,
      symbol: ipo.symbol,
      lots,
      shares,
      bidPrice: finalPrice,
      totalAmount,
      upiId,
      applicationNo: `VG-${ipo.symbol}-${Math.floor(100000 + Math.random() * 900000)}`,
      status: 'MANDATE_PENDING',
      appliedAt: new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }) + `, ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`,
    };

    setIpoApplications((prev) => [newApp, ...prev]);

    openReceiptModal({
      title: 'IPO Bid Submitted via UPI ASBA',
      status: 'PENDING',
      referenceId: newApp.applicationNo,
      timestamp: newApp.appliedAt,
      details: [
        { label: 'IPO Company', value: ipo.companyName },
        { label: 'Bid Quantity', value: `${newApp.lots} Lot (${newApp.shares} shares)` },
        { label: 'Bid Price', value: `₹${finalPrice} (Cut-off)` },
        { label: 'ASBA Amount Blocked', value: `₹${totalAmount.toLocaleString('en-IN')}`, highlight: true },
        { label: 'UPI VPA Handle', value: upiId },
        { label: 'Allotment Expected', value: ipo.listingDate },
      ],
      nextSteps: [
        'Open your UPI App (GPay/PhonePe/BHIM) and approve the mandate before 5:00 PM.',
        'Funds remain safely in your bank account earning interest until allotment day.',
      ],
    });

    // Simulate auto-mandate push notification after 2 seconds
    setTimeout(() => {
      setIpoApplications((prev) =>
        prev.map((app) => (app.id === newApp.id ? { ...app, status: 'MANDATE_APPROVED' } : app))
      );
      addToast(
        'success',
        `UPI Mandate Confirmed: ${ipo.companyName}`,
        `₹${totalAmount.toLocaleString('en-IN')} blocked in bank under ASBA mandate.`
      );
    }, 2500);

    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.7 },
      colors: ['#6C5CE7', '#00E676'],
    });

    if (soundEnabled) soundEffects.playTradeSuccess();
    addToast('info', 'IPO Bid Submitted', `Mandate request sent to ${upiId}. Approve before 5:00 PM.`);
    return true;
  };

  // Start SIP
  const startSIP = (fundId: string, amount: number, sipDate: number, upiId: string): boolean => {
    const fund = mutualFunds.find((f) => f.id === fundId);
    if (!fund) return false;

    const newSip: SIPOrder = {
      id: `sip-${Date.now().toString().slice(-4)}`,
      fundId,
      fundName: fund.name,
      category: fund.category,
      amount,
      frequency: 'Monthly',
      sipDate,
      status: 'ACTIVE',
      totalInvested: amount,
      nextDebitDate: `${sipDate} Nov 2026`,
      upiId,
    };

    setActiveSips((prev) => [newSip, ...prev]);
    setCashBalance((prev) => Math.max(0, prev - amount));

    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#6C5CE7', '#00E676'],
    });

    if (soundEnabled) soundEffects.playTradeSuccess();

    openReceiptModal({
      title: 'Monthly SIP Mandate Activated',
      status: 'SUCCESS',
      referenceId: newSip.id,
      timestamp: new Date().toLocaleDateString('en-IN'),
      details: [
        { label: 'Mutual Fund', value: fund.name },
        { label: 'Category', value: fund.category },
        { label: 'Monthly Investment', value: `₹${amount.toLocaleString('en-IN')}`, highlight: true },
        { label: 'Auto-Debit Schedule', value: `${sipDate}th of every month` },
        { label: 'Payment Mode', value: `UPI AutoPay (${upiId})` },
      ],
      nextSteps: [
        'First installment has been processed. Future debits will occur automatically on schedule.',
        'Track compounding wealth in the Mutual Funds hub.',
      ],
    });

    addToast('success', `SIP Created: ${fund.name}`, `₹${amount.toLocaleString('en-IN')}/mo on the ${sipDate}th with Auto-Debit.`);
    return true;
  };

  const cancelSIP = (sipId: string) => {
    setActiveSips((prev) => prev.filter((s) => s.id !== sipId));
    addToast('info', 'SIP Paused / Cancelled', 'Future auto-debits will no longer be executed.');
  };

  // Tax-Loss Harvesting Helper
  const harvestLoss = (symbol: string) => {
    const holding = holdings.find((h) => h.symbol === symbol);
    if (!holding || holding.pnl >= 0) return;

    const lossAmount = Math.abs(holding.pnl);
    const estimatedTaxSaved = Number((lossAmount * 0.20).toFixed(2)); // 20% STCG Section 111A

    // Square off holding
    setHoldings((prev) => prev.filter((h) => h.symbol !== symbol));
    setCashBalance((prev) => prev + holding.currentValue);

    openReceiptModal({
      title: 'Tax Loss Successfully Harvested',
      status: 'SUCCESS',
      referenceId: `tax-harvest-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toLocaleTimeString('en-IN'),
      details: [
        { label: 'Stock Squared Off', value: `${holding.stockName} (${symbol})` },
        { label: 'Realized Loss Booked', value: `-₹${lossAmount.toLocaleString('en-IN')}`, highlight: true },
        { label: 'Estimated Tax Saved (Sec 111A)', value: `~₹${estimatedTaxSaved.toLocaleString('en-IN')}`, highlight: true },
        { label: 'Capital Credited to Balance', value: `₹${holding.currentValue.toLocaleString('en-IN')}` },
      ],
      nextSteps: [
        'This realized loss will offset your Short-Term Capital Gains, reducing tax liability on income filing.',
      ],
    });

    addToast(
      'success',
      `Tax Loss Harvested: ${symbol}`,
      `Realized loss of ₹${lossAmount.toLocaleString('en-IN')} offsets gains, saving ~₹${estimatedTaxSaved.toLocaleString('en-IN')} in taxes!`
    );
  };

  return (
    <TradingContext.Provider
      value={{
        mode,
        setMode,
        stocks,
        indices,
        selectedStock,
        setSelectedStock,
        holdings,
        positions,
        orders,
        ipos,
        ipoApplications,
        mutualFunds,
        activeSips,
        news,
        institutionalFlows,
        cashBalance,
        marginAvailable,
        totalPortfolioValue,
        totalInvestedValue,
        totalPnl,
        totalPnlPercent,
        totalDayPnl,
        wsStatus,
        wsLatency,
        toggleWsStream,
        reconnectWs,
        lastUpdatedTick,
        firebaseUser,
        userProfile,
        authLoading,
        isAuthenticated,
        isLocked,
        isAuthModalOpen,
        authPromptDismissed,
        openAuthModal,
        closeAuthModal,
        isProfileModalOpen,
        openProfileModal,
        closeProfileModal,
        biometricEnabled,
        setBiometricEnabled,
        mpin,
        setMpin,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        loginAsGuest,
        resetPassword,
        verifyResetCode,
        confirmPasswordResetWithCode,
        loginWithBiometrics,
        loginWithMpin,
        logout,
        signOutFirebase,
        lockSession,
        updateProfileData,
        soundEnabled,
        setSoundEnabled,
        hapticsEnabled,
        setHapticsEnabled,
        viewMode,
        setViewMode,
        activeTab,
        setActiveTab,
        investSubTab,
        setInvestSubTab,
        placeOrder,
        cancelOrder,
        exitSinglePosition,
        exitAllPositions,
        applyForIPO,
        startSIP,
        cancelSIP,
        harvestLoss,
        orderSheetOpen,
        openOrderSheet: (stock, type = 'BUY') => openOrderSheet(stock, type),
        closeOrderSheet,
        orderSheetInitialType,
        guideOpen,
        setGuideOpen,
        activeGuideStep,
        setActiveGuideStep,
        stockMasterModalOpen,
        setStockMasterModalOpen,
        stockMasterInitialPrompt,
        openStockMasterWithPrompt,
        googleSearchModalOpen: stockMasterModalOpen,
        setGoogleSearchModalOpen: setStockMasterModalOpen,
        searchedGoogleStock,
        setSearchedGoogleStock,
        confirmationModal,
        openConfirmationModal,
        closeConfirmationModal,
        receiptModal,
        openReceiptModal,
        closeReceiptModal,
        priceAlerts,
        addPriceAlert,
        removePriceAlert,
        togglePriceAlert,
        resetPriceAlert,
        testTriggerAlert,
        isAlertModalOpen,
        setIsAlertModalOpen,
        selectedStockForAlert,
        openPriceAlertModal,
        closePriceAlertModal,
        notificationPermission,
        requestNotificationPermission,
        toasts,
        removeToast,
        addToast,
        brandName,
        brandSuffix,
        brandColor,
        brandInitials,
        brokerageModel,
        setBrandInfo,
        setBrandColor,
        setBrokerageModel,
        isGigModalOpen,
        setIsGigModalOpen,
        openGigModal,
        closeGigModal,
        loadPitchScenario,
      }}
    >
      {children}
    </TradingContext.Provider>
  );
};

export const useTrading = () => {
  const context = useContext(TradingContext);
  if (!context) {
    throw new Error('useTrading must be used within a TradingProvider');
  }
  return context;
};
