import React from 'react';
import { useTrading } from '../context/TradingContext';
import {
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  Share2,
  ArrowRight,
  ShieldCheck,
  X,
} from 'lucide-react';

export const GlobalReceiptModal: React.FC = () => {
  const { receiptModal, closeReceiptModal, setActiveTab } = useTrading();

  if (!receiptModal || !receiptModal.isOpen) return null;

  const { title, status, referenceId, timestamp, details, nextSteps } = receiptModal;

  const isSuccess = status === 'SUCCESS';
  const isPending = status === 'PENDING';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-md p-0 sm:p-4">
      <div className="w-full sm:max-w-md bg-[#161B26] border border-slate-800 rounded-t-3xl sm:rounded-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Top Status Banner */}
        <div className="p-5 text-center bg-gradient-to-b from-slate-900 to-[#161B26] border-b border-slate-800 relative">
          <button
            onClick={closeReceiptModal}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800/80 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>

          <div
            className={`w-14 h-14 mx-auto rounded-full flex items-center justify-center shadow-xl ring-4 ${
              isSuccess
                ? 'bg-[#00E676] text-slate-950 ring-[#00E676]/20'
                : isPending
                ? 'bg-amber-400 text-slate-950 ring-amber-400/20'
                : 'bg-[#FF5252] text-white ring-[#FF5252]/20'
            }`}
          >
            {isSuccess ? (
              <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
            ) : isPending ? (
              <Clock className="w-8 h-8 stroke-[2.5]" />
            ) : (
              <XCircle className="w-8 h-8 stroke-[2.5]" />
            )}
          </div>

          <h3 className="font-extrabold text-white text-base mt-3">{title}</h3>
          <p className="text-[11px] font-mono text-slate-400 mt-0.5">
            Ref ID: <strong className="text-indigo-400">{referenceId || 'N/A'}</strong> • {timestamp}
          </p>
        </div>

        {/* Modal Receipt Breakdown */}
        <div className="p-4 space-y-3 overflow-y-auto">
          <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 divide-y divide-slate-800/80 text-xs">
            {details.map((item, idx) => (
              <div key={idx} className="py-2 flex justify-between items-center first:pt-0 last:pb-0">
                <span className="text-slate-400 text-[11px]">{item.label}</span>
                <span
                  className={`font-mono text-xs font-semibold ${
                    item.highlight ? 'text-[#00E676] font-bold text-sm' : 'text-white'
                  }`}
                >
                  {item.value}
                </span>
              </div>
            ))}
          </div>

          {/* Next Steps / Guidance */}
          {nextSteps && nextSteps.length > 0 && (
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                What Happens Next?
              </span>
              <ul className="space-y-1 text-[11px] text-slate-300">
                {nextSteps.map((step, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-[#00E676] shrink-0 font-bold">•</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-[#00E676]" />
            <span>Digital contract note generated & SEBI compliant</span>
          </div>
        </div>

        {/* Footer Button */}
        <div className="p-4 bg-slate-950 border-t border-slate-800">
          <button
            onClick={closeReceiptModal}
            className="w-full py-3.5 px-4 rounded-xl font-bold text-xs bg-[#6C5CE7] hover:bg-[#5a48e0] text-white shadow-xl shadow-[#6C5CE7]/30 flex items-center justify-center gap-2 transition-all transform active:scale-95"
          >
            <span>Done / Return to Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
