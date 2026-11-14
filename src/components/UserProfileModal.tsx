import React, { useState } from 'react';
import { useTrading } from '../context/TradingContext';
import {
  X,
  User,
  ShieldCheck,
  Building2,
  CreditCard,
  Lock,
  LogOut,
  KeyRound,
  CheckCircle2,
  Copy,
  Sparkles,
  Zap,
  Fingerprint,
} from 'lucide-react';

export const UserProfileModal: React.FC = () => {
  const {
    isProfileModalOpen,
    closeProfileModal,
    firebaseUser,
    userProfile,
    signOutFirebase,
    lockSession,
    mode,
    setMode,
    mpin,
    setMpin,
    biometricEnabled,
    setBiometricEnabled,
    resetPassword,
    addToast,
  } = useTrading();

  const [isChangingPin, setIsChangingPin] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [copiedBoid, setCopiedBoid] = useState(false);

  if (!isProfileModalOpen) return null;

  const displayName = userProfile?.displayName || firebaseUser?.displayName || 'Vanguard Investor';
  const email = userProfile?.email || firebaseUser?.email || 'trader@vanguard.in';
  const cdslBOID = userProfile?.cdslBOID || '1208160029481029';
  const panMask = userProfile?.panMask || 'ABCDE8412F';

  const handleCopyBoid = () => {
    navigator.clipboard?.writeText(cdslBOID);
    setCopiedBoid(true);
    addToast('info', 'CDSL BOID Copied', '16-digit Demat Account number copied to clipboard.');
    setTimeout(() => setCopiedBoid(false), 2000);
  };

  const handleSavePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      addToast('error', 'Invalid PIN', 'Trading PIN must be exactly 4 digits.');
      return;
    }
    setMpin(newPin);
    setIsChangingPin(false);
    setNewPin('');
    addToast('success', 'Trading PIN Updated', 'Your 4-digit quick authorization MPIN has been updated.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-[#161B26] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#6C5CE7] to-[#8c7bf7] flex items-center justify-center text-white font-bold text-sm shadow-md">
              {displayName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                <span>{displayName}</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/10 text-[#00E676] border border-[#00E676]/30 flex items-center gap-0.5">
                  <ShieldCheck className="w-2.5 h-2.5" />
                  KYC VERIFIED
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">{email}</p>
            </div>
          </div>

          <button
            onClick={closeProfileModal}
            className="p-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs">
          {/* Demat & Depository Details */}
          <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-3.5 space-y-2.5">
            <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase block">
              Demat & Regulatory Credentials
            </span>

            <div className="flex items-center justify-between bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
              <div>
                <span className="text-[10px] text-slate-400 block">CDSL Beneficiary ID (BOID)</span>
                <span className="font-mono font-bold text-slate-200 text-xs tracking-wider">{cdslBOID}</span>
              </div>
              <button
                onClick={handleCopyBoid}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 flex items-center gap-1 text-[10px] transition-all"
                title="Copy CDSL BOID"
              >
                {copiedBoid ? <CheckCircle2 className="w-3.5 h-3.5 text-[#00E676]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedBoid ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800/60">
                <span className="text-[10px] text-slate-400 block">PAN Card</span>
                <span className="font-mono font-semibold text-slate-200">{panMask}</span>
              </div>
              <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800/60">
                <span className="text-[10px] text-slate-400 block">Depository</span>
                <span className="font-semibold text-slate-200">CDSL (India)</span>
              </div>
            </div>
          </div>

          {/* Linked Bank & Brokerage Tier */}
          <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-3.5 space-y-2.5">
            <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase block">
              Banking & Brokerage Plan
            </span>

            <div className="flex items-center gap-2.5 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-[#6C5CE7]">
                <Building2 className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <span className="text-xs font-semibold text-white block">HDFC Bank Ltd</span>
                <span className="text-[10px] text-slate-400 font-mono">Primary Verified Mandate • ***4910</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-[#00E676] font-bold">
                UPI Active
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] p-2 rounded-xl bg-slate-950/40">
              <span className="text-slate-400">Equity Delivery (CNC)</span>
              <span className="font-bold text-[#00E676]">₹0 Free Brokerage</span>
            </div>
            <div className="flex items-center justify-between text-[11px] p-2 rounded-xl bg-slate-950/40">
              <span className="text-slate-400">Intraday (MIS) & F&O</span>
              <span className="font-bold text-slate-200">Flat ₹20 / order</span>
            </div>
          </div>

          {/* Security & 4-Digit Trading MPIN */}
          <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-3.5 space-y-2.5">
            <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase block">
              Security & Access Control
            </span>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Fingerprint className="w-4 h-4 text-indigo-400" />
                <span className="text-slate-200">Biometric / FaceID Unlock</span>
              </div>
              <button
                onClick={() => setBiometricEnabled(!biometricEnabled)}
                className={`w-10 h-5 rounded-full transition-colors relative ${
                  biometricEnabled ? 'bg-[#00E676]' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-slate-950 absolute top-0.5 transition-transform ${
                    biometricEnabled ? 'right-0.5' : 'left-0.5'
                  }`}
                />
              </button>
            </div>

            {/* Change MPIN Section */}
            {!isChangingPin ? (
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-300">4-Digit Trading PIN</span>
                </div>
                <button
                  onClick={() => setIsChangingPin(true)}
                  className="text-xs text-[#6C5CE7] hover:underline font-bold"
                >
                  Change PIN
                </button>
              </div>
            ) : (
              <form onSubmit={handleSavePin} className="space-y-2 pt-1 border-t border-slate-800">
                <span className="text-[11px] text-slate-400 block">Enter New 4-Digit Trading PIN:</span>
                <div className="flex gap-2">
                  <input
                    type="password"
                    maxLength={4}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 5821"
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-center font-mono font-bold tracking-widest text-white text-sm focus:outline-hidden focus:border-[#6C5CE7]"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-xl bg-[#6C5CE7] hover:bg-[#5a48e0] text-white font-bold text-xs"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsChangingPin(false);
                      setNewPin('');
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Account Password Reset Link */}
            {email && !firebaseUser?.isAnonymous && (
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/70">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-300">Account Password</span>
                </div>
                <button
                  type="button"
                  onClick={() => resetPassword(email)}
                  className="text-xs text-[#00E676] hover:underline font-bold cursor-pointer"
                >
                  Send Reset Link
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between gap-2.5">
          <button
            onClick={() => {
              closeProfileModal();
              lockSession();
            }}
            className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all"
          >
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>Lock Session</span>
          </button>

          <button
            onClick={() => {
              signOutFirebase();
            }}
            className="flex-1 py-2.5 px-3 rounded-xl bg-red-950/40 hover:bg-red-950/70 border border-red-500/30 text-red-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};
