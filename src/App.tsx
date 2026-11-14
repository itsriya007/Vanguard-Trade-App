import React from 'react';
import { TradingProvider, useTrading } from './context/TradingContext';
import { HeaderNav } from './components/HeaderNav';
import { IndicesTicker } from './components/IndicesTicker';
import { WatchlistTab } from './components/WatchlistTab';
import { OrdersTab } from './components/OrdersTab';
import { PortfolioTab } from './components/PortfolioTab';
import { InvestTabContainer } from './components/InvestTabContainer';
import { NewsPulseTab } from './components/NewsPulseTab';
import { BottomNavigation } from './components/BottomNavigation';
import { StockDetailModal } from './components/StockDetailModal';
import { OrderDrawer } from './components/OrderDrawer';
import { AuthModal } from './components/AuthModal';
import { MobileFrameContainer } from './components/MobileFrameContainer';
import { BeginnerGuideModal } from './components/BeginnerGuideModal';
import { StockMasterChatModal } from './components/StockMasterChatModal';
import { GlobalConfirmationModal } from './components/GlobalConfirmationModal';
import { GlobalReceiptModal } from './components/GlobalReceiptModal';
import { PriceAlertModal } from './components/PriceAlertModal';
import { UserProfileModal } from './components/UserProfileModal';

import { Bot } from 'lucide-react';

const AppContent: React.FC = () => {
  const {
    activeTab,
    selectedStock,
    setSelectedStock,
    orderSheetOpen,
    closeOrderSheet,
    orderSheetInitialType,
    stocks,
    setStockMasterModalOpen,
    isAlertModalOpen,
    closePriceAlertModal,
    selectedStockForAlert,
  } = useTrading();

  const currentOrderStock = stocks.find((s) => s.symbol === selectedStock?.symbol) || stocks[0];

  return (
    <MobileFrameContainer>
      {/* Top App Bar */}
      <HeaderNav />

      {/* Real-time Tickers (NIFTY 50, BANKNIFTY, SENSEX, INDIA VIX) */}
      <IndicesTicker />

      {/* Main Tab Routing */}
      <main className="flex-1 overflow-y-auto">
        {activeTab === 'watchlist' && (
          <WatchlistTab onSelectStock={(stock) => setSelectedStock(stock)} />
        )}
        {activeTab === 'orders' && <OrdersTab />}
        {activeTab === 'portfolio' && <PortfolioTab />}
        {activeTab === 'invest' && <InvestTabContainer />}
        {activeTab === 'pulse' && <NewsPulseTab />}
      </main>

      {/* Floating DhanGuru AI Stock Master Button */}
      <button
        onClick={() => setStockMasterModalOpen(true)}
        className="fixed bottom-18 right-4 md:right-6 z-30 flex items-center gap-2 px-3 py-2 rounded-full bg-gradient-to-r from-[#6C5CE7] to-[#00E676] text-slate-950 font-bold text-xs shadow-xl shadow-[#6C5CE7]/30 hover:shadow-[#00E676]/40 hover:scale-105 active:scale-95 transition-all group ring-2 ring-white/20 cursor-pointer"
        title="Ask DhanGuru AI - Stock Market Master"
      >
        <div className="w-5 h-5 rounded-full bg-slate-950 flex items-center justify-center text-[#00E676]">
          <Bot className="w-3.5 h-3.5" />
        </div>
        <span className="font-extrabold tracking-tight">Ask DhanGuru AI</span>
        <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping hidden sm:inline-block" />
      </button>

      {/* Bottom Sticky Mobile Navigation */}
      <BottomNavigation />

      {/* Interactive Stock Detail & Level 2 Depth Modal */}
      {selectedStock && (
        <StockDetailModal
          stock={selectedStock}
          onClose={() => setSelectedStock(null)}
        />
      )}

      {/* Sliding Order Placement Drawer with Smart Brokerage Calculator */}
      {orderSheetOpen && (
        <OrderDrawer
          stock={currentOrderStock}
          initialType={orderSheetInitialType}
          onClose={closeOrderSheet}
        />
      )}

      {/* Biometric & MPIN Authentication Lock Modal */}
      <AuthModal />

      {/* Demat Investor Profile & Security Settings Modal */}
      <UserProfileModal />

      {/* 5-Step Interactive Beginner Investor Guide & Glossary */}
      <BeginnerGuideModal />

      {/* AI Stock Market Master Chatbot (DhanGuru) */}
      <StockMasterChatModal />

      {/* Pre-Operation Confirmation Pop-up Modal */}
      <GlobalConfirmationModal />

      {/* Post-Operation Receipt & Settlement Pop-up Modal */}
      <GlobalReceiptModal />

      {/* Custom Price Alerts & Browser Notification Modal */}
      <PriceAlertModal
        isOpen={isAlertModalOpen}
        onClose={closePriceAlertModal}
        initialStock={selectedStockForAlert}
      />
    </MobileFrameContainer>
  );
};

export default function App() {
  return (
    <TradingProvider>
      <AppContent />
    </TradingProvider>
  );
}
