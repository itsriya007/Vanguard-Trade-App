import React, { useState } from 'react';
import { useTrading } from '../context/TradingContext';
import { Clock, CheckCircle2, XCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { formatINR } from '../utils/formatters';

export const OrdersTab: React.FC = () => {
  const { orders, cancelOrder, openConfirmationModal } = useTrading();
  const [filter, setFilter] = useState<'ALL' | 'OPEN' | 'EXECUTED'>('ALL');

  const handleCancelClick = (order: typeof orders[0]) => {
    openConfirmationModal({
      title: `Cancel Order #${order.id}`,
      description: `Are you sure you want to withdraw this order from the exchange book?`,
      confirmLabel: 'Confirm Order Cancellation',
      confirmVariant: 'danger',
      details: [
        { label: 'Symbol', value: order.symbol },
        { label: 'Company', value: order.stockName },
        { label: 'Order Action', value: `${order.type} • ${order.product}` },
        { label: 'Quantity', value: `${order.quantity} shares`, highlight: true },
        { label: 'Order Price', value: formatINR(order.price) },
      ],
      onConfirm: () => cancelOrder(order.id),
    });
  };

  const filteredOrders = orders.filter((o) => {
    if (filter === 'OPEN') return o.status === 'OPEN';
    if (filter === 'EXECUTED') return o.status === 'COMPLETE';
    return true;
  });

  return (
    <div className="space-y-3 pb-20">
      {/* Filter Tabs */}
      <div className="px-3">
        <div className="grid grid-cols-3 gap-1 p-1 bg-slate-900/90 rounded-xl border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setFilter('ALL')}
            className={`py-1.5 rounded-lg transition-all text-center ${
              filter === 'ALL'
                ? 'bg-[#6C5CE7] text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Orders ({orders.length})
          </button>
          <button
            onClick={() => setFilter('OPEN')}
            className={`py-1.5 rounded-lg transition-all text-center ${
              filter === 'OPEN'
                ? 'bg-[#6C5CE7] text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Open ({orders.filter((o) => o.status === 'OPEN').length})
          </button>
          <button
            onClick={() => setFilter('EXECUTED')}
            className={`py-1.5 rounded-lg transition-all text-center ${
              filter === 'EXECUTED'
                ? 'bg-[#6C5CE7] text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Executed ({orders.filter((o) => o.status === 'COMPLETE').length})
          </button>
        </div>
      </div>

      {/* Orders List */}
      <div className="px-3 space-y-2.5">
        {filteredOrders.map((order) => {
          const isBuy = order.type === 'BUY';
          const isComplete = order.status === 'COMPLETE';
          const isOpen = order.status === 'OPEN';

          return (
            <div
              key={order.id}
              className="p-3.5 rounded-2xl bg-[#161B26] border border-slate-800 space-y-2"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                        isBuy
                          ? 'bg-emerald-500/15 text-[#00E676] border border-[#00E676]/30'
                          : 'bg-rose-500/15 text-[#FF5252] border border-[#FF5252]/30'
                      }`}
                    >
                      {order.type}
                    </span>
                    <span className="font-bold text-white text-sm">{order.symbol}</span>
                    <span className="text-[10px] font-mono px-1 rounded bg-slate-800 text-slate-400">
                      {order.product}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      {order.orderType}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">{order.stockName}</p>
                </div>

                <div className="text-right">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                      isComplete
                        ? 'bg-emerald-500/10 text-[#00E676] border border-[#00E676]/20'
                        : isOpen
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isComplete ? (
                      <CheckCircle2 className="w-3 h-3" />
                    ) : isOpen ? (
                      <Clock className="w-3 h-3 animate-spin" />
                    ) : (
                      <XCircle className="w-3 h-3" />
                    )}
                    {order.status}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono block mt-1">
                    {order.timestamp}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-[11px] font-mono text-slate-400">
                <div>
                  <span className="text-[10px] text-slate-500 block">Quantity</span>
                  <span className="text-white font-semibold">{order.quantity} shares</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Price</span>
                  <span className="text-white font-semibold">{formatINR(order.price)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Charges</span>
                  <span className="text-indigo-300 font-semibold">{formatINR(order.totalCharges)}</span>
                </div>
              </div>

              {isOpen && (
                <div className="pt-2 border-t border-slate-800/80 flex justify-end">
                  <button
                    onClick={() => handleCancelClick(order)}
                    className="px-3 py-1 rounded-lg text-xs font-semibold bg-rose-950/40 text-[#FF5252] border border-[#FF5252]/30 hover:bg-[#FF5252] hover:text-white transition-all active:scale-95"
                  >
                    Cancel Order
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {filteredOrders.length === 0 && (
          <div className="p-8 text-center text-slate-500 text-xs bg-[#161B26] rounded-2xl border border-slate-800">
            No orders found in this category.
          </div>
        )}
      </div>
    </div>
  );
};
