import React, { useState } from 'react';
import { useTrading } from '../context/TradingContext';
import {
  TrendingUp,
  TrendingDown,
  AlertOctagon,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  Percent,
  CheckCircle,
  HelpCircle,
  Scissors,
  PieChart as PieChartIcon,
  ListFilter,
} from 'lucide-react';
import { formatINR, formatCompactINR } from '../utils/formatters';
import { SectorAllocationChart } from './SectorAllocationChart';

export const PortfolioTab: React.FC = () => {
  const {
    holdings,
    positions,
    stocks,
    totalPortfolioValue,
    totalInvestedValue,
    totalPnl,
    totalPnlPercent,
    totalDayPnl,
    cashBalance,
    exitSinglePosition,
    exitAllPositions,
    harvestLoss,
    mode,
    openConfirmationModal,
  } = useTrading();

  const [activeSubTab, setActiveSubTab] = useState<'HOLDINGS' | 'POSITIONS'>('HOLDINGS');
  const [holdingsDisplayMode, setHoldingsDisplayMode] = useState<'both' | 'chart_only' | 'list_only'>('both');
  const [panicVerifyStep, setPanicVerifyStep] = useState<0 | 1 | 2>(0);
  const [selectedHarvestStock, setSelectedHarvestStock] = useState<string | null>(null);

  const isTotalPnlPositive = totalPnl >= 0;
  const isDayPnlPositive = totalDayPnl >= 0;

  // Find tax-loss harvesting candidates
  const lossHoldings = holdings.filter((h) => h.pnl < 0);
  const totalHarvestableLoss = lossHoldings.reduce((acc, h) => acc + Math.abs(h.pnl), 0);
  const potentialTaxSaving = Math.round(totalHarvestableLoss * 0.20); // 20% Short-Term Capital Gains under Section 111A

  const handlePanicClick = () => {
    if (positions.length === 0) return;
    const totalRealized = positions.reduce((acc, p) => acc + p.pnl, 0);

    openConfirmationModal({
      title: '🚨 Emergency Panic Exit All Positions',
      description: `This will instantly transmit market-order square-offs for ALL ${positions.length} active positions to protect against extreme market volatility.`,
      confirmLabel: 'YES, EMERGENCY EXIT ALL POSITIONS',
      confirmVariant: 'danger',
      educationalTip:
        '⚠️ Panic Control: All open intraday MIS & MTF positions will be squared off at current market bid/ask immediately.',
      details: [
        { label: 'Total Positions', value: `${positions.length} active contracts`, highlight: true },
        {
          label: 'Estimated Realized P&L',
          value: `${totalRealized >= 0 ? '+' : ''}${formatINR(totalRealized)}`,
          highlight: true,
        },
      ],
      onConfirm: () => {
        exitAllPositions();
        setPanicVerifyStep(0);
      },
    });
  };

  const handleSquareOffClick = (pos: (typeof positions)[0]) => {
    openConfirmationModal({
      title: `Square Off ${pos.symbol} (${pos.product})`,
      description: `You are closing your active position for ${Math.abs(pos.quantity)} shares of ${pos.stockName}.`,
      confirmLabel: 'Confirm Position Exit',
      confirmVariant: 'danger',
      details: [
        { label: 'Stock', value: `${pos.stockName} (${pos.symbol})` },
        { label: 'Position', value: `${pos.product} • ${pos.quantity > 0 ? 'BUY' : 'SELL'}` },
        { label: 'Quantity', value: `${Math.abs(pos.quantity)} shares` },
        { label: 'Entry Price', value: formatINR(pos.buyAvg) },
        { label: 'Current LTP', value: formatINR(pos.currentPrice) },
        {
          label: 'Realized MTM P&L',
          value: `${pos.pnl >= 0 ? '+' : ''}${formatINR(pos.pnl)}`,
          highlight: true,
        },
      ],
      onConfirm: () => exitSinglePosition(pos.id),
    });
  };

  const handleHarvestClick = (holding: (typeof holdings)[0]) => {
    openConfirmationModal({
      title: `Tax-Loss Harvest: ${holding.symbol}`,
      description: `Under Section 111A of Income Tax Act, booking this loss offsets taxable capital gains and saves up to 20% in taxes.`,
      confirmLabel: 'Book Loss & Offset Taxes',
      confirmVariant: 'primary',
      educationalTip:
        '💡 Tax-Loss Harvesting: Offset short-term capital gains with realized losses to lower your annual tax bill.',
      details: [
        { label: 'Stock', value: `${holding.stockName} (${holding.symbol})` },
        { label: 'Booked Loss', value: formatINR(Math.abs(holding.pnl)), highlight: true },
        {
          label: 'Estimated Tax Saved (20%)',
          value: formatINR(Math.round(Math.abs(holding.pnl) * 0.20)),
          highlight: true,
        },
      ],
      onConfirm: () => harvestLoss(holding.symbol),
    });
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Portfolio Overview Card */}
      <div className="px-3">
        <div className="p-4 rounded-3xl bg-gradient-to-br from-[#161B26] to-[#121620] border border-slate-800 shadow-xl space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Total Portfolio Value
              </span>
              <div className="text-2xl font-black font-mono text-white mt-0.5">
                {formatINR(totalPortfolioValue)}
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400 block font-medium">Free Margin Cash</span>
              <span className="text-xs font-mono font-bold text-indigo-300">
                {formatINR(cashBalance)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800/80">
            {/* Total P&L */}
            <div>
              <span className="text-[10px] text-slate-400 block">Total Returns (P&L)</span>
              <div
                className={`flex items-center text-sm font-mono font-bold mt-0.5 ${
                  isTotalPnlPositive ? 'text-[#00E676]' : 'text-[#FF5252]'
                }`}
              >
                {isTotalPnlPositive ? (
                  <TrendingUp className="w-3.5 h-3.5 mr-1" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5 mr-1" />
                )}
                <span>
                  {isTotalPnlPositive ? '+' : ''}
                  {formatINR(totalPnl)} ({isTotalPnlPositive ? '+' : ''}
                  {totalPnlPercent.toFixed(2)}%)
                </span>
              </div>
            </div>

            {/* Today's P&L */}
            <div>
              <span className="text-[10px] text-slate-400 block">1-Day Change</span>
              <div
                className={`flex items-center text-sm font-mono font-bold mt-0.5 ${
                  isDayPnlPositive ? 'text-[#00E676]' : 'text-[#FF5252]'
                }`}
              >
                {isDayPnlPositive ? (
                  <TrendingUp className="w-3.5 h-3.5 mr-1" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5 mr-1" />
                )}
                <span>
                  {isDayPnlPositive ? '+' : ''}
                  {formatINR(totalDayPnl)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TAX-LOSS HARVESTING ALERT HELPER */}
      {lossHoldings.length > 0 && (
        <div className="px-3">
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/30 via-slate-900 to-indigo-950/30 border border-amber-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                <Scissors className="w-4 h-4 text-amber-400" />
                <span>Tax-Loss Harvesting Alert (Sec 111A)</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30">
                Save ~{formatINR(potentialTaxSaving)}
              </span>
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed">
              You hold <strong>{lossHoldings[0].symbol}</strong> at an unrealized loss of{' '}
              <span className="text-[#FF5252] font-mono font-semibold">
                {formatINR(Math.abs(lossHoldings[0].pnl))}
              </span>
              . Realizing this loss can directly offset taxable capital gains, reducing your income tax liability.
            </p>

            <button
              onClick={() => handleHarvestClick(lossHoldings[0])}
              className="w-full py-2 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95"
            >
              <span>Harvest Loss in {lossHoldings[0].symbol}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* SUB-TABS: HOLDINGS VS POSITIONS */}
      <div className="px-3">
        <div className="grid grid-cols-2 gap-1 p-1 bg-slate-900/90 rounded-xl border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveSubTab('HOLDINGS')}
            className={`py-2 rounded-lg transition-all text-center ${
              activeSubTab === 'HOLDINGS'
                ? 'bg-[#6C5CE7] text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Holdings ({holdings.length})
          </button>
          <button
            onClick={() => setActiveSubTab('POSITIONS')}
            className={`py-2 rounded-lg transition-all text-center relative ${
              activeSubTab === 'POSITIONS'
                ? 'bg-[#6C5CE7] text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Positions ({positions.length})
            {positions.length > 0 && (
              <span className="ml-1 w-2 h-2 rounded-full bg-[#00E676] inline-block animate-pulse" />
            )}
          </button>
        </div>
      </div>

      {/* POSITIONS TAB (Intraday MIS / MTF) with PANIC BUTTON */}
      {activeSubTab === 'POSITIONS' && (
        <div className="px-3 space-y-3">
          {/* Panic Control Button */}
          {positions.length > 0 && (
            <div className="p-3 rounded-2xl bg-rose-950/25 border border-rose-900/40 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-rose-400 flex items-center gap-1">
                  <AlertOctagon className="w-4 h-4 text-rose-500" />
                  <span>Volatility Panic Control</span>
                </span>
                <span className="text-[10px] text-slate-400">
                  {panicVerifyStep === 1
                    ? '⚠️ Tap again to confirm immediate liquidating!'
                    : 'Instant square-off during market drops'}
                </span>
              </div>

              <button
                onClick={handlePanicClick}
                className={`py-2 px-3.5 rounded-xl text-xs font-extrabold transition-all transform active:scale-95 shadow-md ${
                  panicVerifyStep === 1
                    ? 'bg-rose-600 text-white animate-pulse ring-2 ring-rose-400'
                    : 'bg-rose-950 text-rose-400 border border-rose-800 hover:bg-rose-900'
                }`}
              >
                {panicVerifyStep === 1 ? 'CONFIRM EXIT ALL' : 'EXIT ALL POSITIONS'}
              </button>
            </div>
          )}

          {/* Positions List */}
          {positions.map((pos) => {
            const isPosProfit = pos.pnl >= 0;
            return (
              <div
                key={pos.id}
                className="p-3.5 rounded-2xl bg-[#161B26] border border-slate-800 space-y-2.5"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-white text-sm">{pos.symbol}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300">
                        {pos.product}
                      </span>
                    </div>
                    <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                      Qty: {pos.quantity} • Avg: {formatINR(pos.buyAvg)} • LTP: {formatINR(pos.currentPrice)}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block">MTM P&L</span>
                    <span
                      className={`text-sm font-mono font-bold ${
                        isPosProfit ? 'text-[#00E676]' : 'text-[#FF5252]'
                      }`}
                    >
                      {isPosProfit ? '+' : ''}
                      {formatINR(pos.pnl)} ({isPosProfit ? '+' : ''}
                      {pos.pnlPercent.toFixed(2)}%)
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">Auto square-off: 03:20 PM IST</span>
                  <button
                    onClick={() => handleSquareOffClick(pos)}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-900 border border-slate-800 text-slate-300 hover:text-red-400 transition-colors active:scale-95"
                  >
                    Square Off
                  </button>
                </div>
              </div>
            );
          })}

          {positions.length === 0 && (
            <div className="p-8 text-center text-slate-500 text-xs bg-[#161B26] rounded-2xl border border-slate-800">
              No open intraday or MTF positions. Trades placed in MIS/MTF appear here with live Mark-to-Market.
            </div>
          )}
        </div>
      )}

      {/* HOLDINGS TAB (Long Term Delivery CNC) */}
      {activeSubTab === 'HOLDINGS' && (
        <div className="px-3 space-y-3.5">
          {/* Sector Asset Allocation Visual Breakdown (Pie / Donut Chart) */}
          {holdingsDisplayMode !== 'list_only' && (
            <SectorAllocationChart
              holdings={holdings}
              stocks={stocks}
              mode={mode}
            />
          )}

          {/* Holdings Section Controls Header */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Holding Positions
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-indigo-300 font-bold">
                {holdings.length} {holdings.length === 1 ? 'Stock' : 'Stocks'}
              </span>
            </div>

            <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[10px]">
              <button
                onClick={() => setHoldingsDisplayMode('both')}
                className={`px-2 py-0.5 rounded font-medium transition-all ${
                  holdingsDisplayMode === 'both'
                    ? 'bg-[#6C5CE7] text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Show both Sector Pie Chart and Stock List"
              >
                All
              </button>
              <button
                onClick={() => setHoldingsDisplayMode('chart_only')}
                className={`px-2 py-0.5 rounded font-medium transition-all ${
                  holdingsDisplayMode === 'chart_only'
                    ? 'bg-[#6C5CE7] text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Show only Sector Pie Chart"
              >
                Chart Only
              </button>
              <button
                onClick={() => setHoldingsDisplayMode('list_only')}
                className={`px-2 py-0.5 rounded font-medium transition-all ${
                  holdingsDisplayMode === 'list_only'
                    ? 'bg-[#6C5CE7] text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Show only Stock List"
              >
                List Only
              </button>
            </div>
          </div>

          {/* Holdings List Cards */}
          {holdingsDisplayMode !== 'chart_only' && (
            <div className="space-y-2.5">
              {holdings.map((hld) => {
                const isProfit = hld.pnl >= 0;
                return (
                  <div
                    key={hld.symbol}
                    className="p-3.5 rounded-2xl bg-[#161B26] border border-slate-800 hover:border-slate-700 transition-all space-y-2"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white text-sm">{hld.symbol}</span>
                          <span className="text-[10px] font-mono px-1 rounded bg-slate-800 text-slate-400">
                            CNC
                          </span>
                          {hld.isLossHarvestEligible && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300">
                              Tax Harvest
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">{hld.stockName}</p>
                      </div>

                      <div className="text-right">
                        <span
                          className={`text-sm font-mono font-bold ${
                            isProfit ? 'text-[#00E676]' : 'text-[#FF5252]'
                          }`}
                        >
                          {isProfit ? '+' : ''}
                          {formatINR(hld.pnl)} ({isProfit ? '+' : ''}
                          {hld.pnlPercent.toFixed(2)}%)
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                          Cur: {formatINR(hld.currentValue)}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-[11px] font-mono text-slate-400">
                      <div>
                        <span className="text-[10px] text-slate-500 block">Quantity</span>
                        <span className="text-white font-semibold">{hld.quantity} shares</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Avg Buy Price</span>
                        <span className="text-white font-semibold">{formatINR(hld.avgBuyPrice)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">LTP</span>
                        <span className="text-white font-semibold">{formatINR(hld.currentPrice)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
