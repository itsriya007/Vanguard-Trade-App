import React from 'react';
import { useTrading } from '../context/TradingContext';
import {
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  ShieldAlert,
  X,
  ArrowRight,
} from 'lucide-react';

export const GlobalConfirmationModal: React.FC = () => {
  const { confirmationModal, closeConfirmationModal, mode } = useTrading();

  if (!confirmationModal || !confirmationModal.isOpen) return null;

  const {
    title,
    description,
    details,
    confirmLabel,
    confirmVariant = 'primary',
    onConfirm,
    educationalTip,
  } = confirmationModal;

  const handleProceed = () => {
    onConfirm();
    closeConfirmationModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-md p-0 sm:p-4">
      <div className="w-full sm:max-w-md bg-[#161B26] border border-slate-800 rounded-t-3xl sm:rounded-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`p-2 rounded-xl ${
                confirmVariant === 'danger'
                  ? 'bg-rose-500/20 text-rose-400'
                  : confirmVariant === 'success'
                  ? 'bg-emerald-500/20 text-[#00E676]'
                  : 'bg-indigo-500/20 text-[#6C5CE7]'
              }`}
            >
              {confirmVariant === 'danger' ? (
                <ShieldAlert className="w-5 h-5" />
              ) : (
                <CheckCircle2 className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">{title}</h3>
              <p className="text-[10px] text-slate-400">Pre-Execution Safety Verification</p>
            </div>
          </div>
          <button
            onClick={closeConfirmationModal}
            className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 space-y-3.5 overflow-y-auto">
          <p className="text-xs text-slate-300 leading-relaxed">{description}</p>

          {/* Details Table */}
          {details && details.length > 0 && (
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 divide-y divide-slate-800/80 text-xs">
              {details.map((item, idx) => (
                <div key={idx} className="py-1.5 flex justify-between items-center first:pt-0 last:pb-0">
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
          )}

          {/* Contextual Beginner Tip */}
          {(educationalTip || mode === 'beginner') && (
            <div className="p-3 rounded-xl bg-indigo-950/25 border border-indigo-500/30 text-xs text-indigo-300 flex items-start gap-2">
              <HelpCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed">
                {educationalTip ||
                  'Beginner Protection active: Vanguard Trade verifies funds, risk leverage, and Demat delivery eligibility before transmitting orders to exchange matching engines.'}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 grid grid-cols-2 gap-3">
          <button
            onClick={closeConfirmationModal}
            className="py-3 px-4 rounded-xl font-semibold text-xs bg-slate-900 border border-slate-700 text-slate-300 hover:text-white transition-all"
          >
            Cancel / Go Back
          </button>

          <button
            onClick={handleProceed}
            className={`py-3 px-4 rounded-xl font-bold text-xs shadow-lg flex items-center justify-center gap-1.5 transition-all transform active:scale-95 ${
              confirmVariant === 'danger'
                ? 'bg-[#FF5252] hover:bg-[#e04343] text-white shadow-rose-900/30'
                : confirmVariant === 'success'
                ? 'bg-[#00E676] hover:bg-[#00c864] text-slate-950 shadow-emerald-900/30'
                : 'bg-[#6C5CE7] hover:bg-[#5a48e0] text-white shadow-[#6C5CE7]/30'
            }`}
          >
            <span>{confirmLabel}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
