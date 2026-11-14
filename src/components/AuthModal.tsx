import React, { useEffect, useState } from 'react';
import { useTrading } from '../context/TradingContext';
import {
  Fingerprint,
  Lock,
  Mail,
  KeyRound,
  User,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  Delete,
  Scan,
  Sparkles,
  Zap,
  ArrowRight,
  CreditCard,
  X,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';

export const AuthModal: React.FC = () => {
  const {
    firebaseUser,
    isLocked,
    isAuthModalOpen,
    authPromptDismissed,
    openAuthModal,
    closeAuthModal,
    loginWithEmail,
    registerWithEmail,
    loginWithGoogle,
    loginAsGuest,
    resetPassword,
    verifyResetCode,
    confirmPasswordResetWithCode,
    loginWithBiometrics,
    loginWithMpin,
    signOutFirebase,
    mode,
    setMode,
  } = useTrading();

  // Tab State
  const [activeTab, setActiveTab] = useState<'LOGIN' | 'GOOGLE' | 'REGISTER' | 'FORGOT' | 'RESET_CONFIRM'>('LOGIN');

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmNewPass, setConfirmNewPass] = useState('');
  const [fullName, setFullName] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formErrorCode, setFormErrorCode] = useState<string | null>(null);
  const [copiedDomain, setCopiedDomain] = useState(false);
  const [resetSentToEmail, setResetSentToEmail] = useState<string | null>(null);

  // In-app oobCode password reset state (if user clicks reset link returning to app)
  const [resetOobCode, setResetOobCode] = useState<string | null>(null);
  const [resetVerifiedEmail, setResetVerifiedEmail] = useState<string | null>(null);
  const [resetCompleted, setResetCompleted] = useState(false);

  // MPIN & Biometric Screen State (for locked session)
  const [enteredPin, setEnteredPin] = useState<string>('');
  const [isScanningBio, setIsScanningBio] = useState<boolean>(false);

  // Check URL for Firebase password reset action code (?mode=resetPassword&oobCode=...)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const actionMode = params.get('mode');
    const oobCode = params.get('oobCode');

    if (actionMode === 'resetPassword' && oobCode) {
      setResetOobCode(oobCode);
      setActiveTab('RESET_CONFIRM');
      openAuthModal();
      verifyResetCode(oobCode).then((res) => {
        if (res.success && res.email) {
          setResetVerifiedEmail(res.email);
          setEmail(res.email);
        } else {
          setFormError(res.error || 'Password reset link is invalid or expired.');
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Determine if the modal should be rendered
  if (!isLocked && !isAuthModalOpen && (firebaseUser || authPromptDismissed)) {
    return null;
  }

  // Handle Quick MPIN Keypad Input (when locked)
  const handleDigitPress = (digit: string) => {
    if (enteredPin.length < 4) {
      const nextPin = enteredPin + digit;
      setEnteredPin(nextPin);
      if (nextPin.length === 4) {
        setTimeout(() => {
          const success = loginWithMpin(nextPin);
          if (!success) {
            setEnteredPin('');
          }
        }, 150);
      }
    }
  };

  const handleDeleteDigit = () => {
    setEnteredPin((p) => p.slice(0, -1));
  };

  const handleBiometricClick = async () => {
    setIsScanningBio(true);
    await loginWithBiometrics();
    setIsScanningBio(false);
  };

  // Submit Email Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormErrorCode(null);
    if (!email.trim() || !password) {
      setFormError('Please enter both your email address and password.');
      return;
    }
    setSubmitting(true);
    const res = await loginWithEmail(email.trim(), password);
    setSubmitting(false);
    if (!res.success && res.error) {
      setFormError(res.error);
      setFormErrorCode(res.errorCode || null);
    }
  };

  // Submit Demat Registration
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormErrorCode(null);
    if (!fullName.trim()) {
      setFormError('Please enter your full legal name as per PAN card.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setFormError('Please enter a valid email address.');
      return;
    }
    if (panNumber.trim() && !/^[A-Za-z]{5}[0-9]{4}[A-Za-z]$/.test(panNumber.trim())) {
      setFormError('Invalid PAN format. Expected 10 characters like ABCDE1234F (or leave blank for instant demo PAN).');
      return;
    }
    if (password.length < 6) {
      setFormError('Password must be at least 6 characters long.');
      return;
    }
    setSubmitting(true);
    const res = await registerWithEmail(email.trim(), password, fullName.trim(), panNumber.trim());
    setSubmitting(false);
    if (!res.success && res.error) {
      setFormError(res.error);
      setFormErrorCode(res.errorCode || null);
    }
  };

  // Submit Password Reset Email Request
  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormErrorCode(null);
    if (!email.trim() || !email.includes('@')) {
      setFormError('Please enter your registered email address.');
      return;
    }
    setSubmitting(true);
    const res = await resetPassword(email.trim());
    setSubmitting(false);
    if (res.success) {
      setResetSentToEmail(email.trim());
    } else if (res.error) {
      setFormError(res.error);
    }
  };

  // Submit In-App Confirm New Password (via oobCode)
  const handleConfirmResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!resetOobCode) {
      setFormError('Missing reset verification code. Please request a new reset link.');
      return;
    }
    if (confirmNewPass.length < 6) {
      setFormError('New password must be at least 6 characters long.');
      return;
    }
    setSubmitting(true);
    const res = await confirmPasswordResetWithCode(resetOobCode, confirmNewPass);
    setSubmitting(false);
    if (res.success) {
      setResetCompleted(true);
      setConfirmNewPass('');
      if (typeof window !== 'undefined') {
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      }
    } else if (res.error) {
      setFormError(res.error);
    }
  };

  // Real Firebase Google Popup Sign-In
  const handleGooglePopupSignIn = async () => {
    setFormError(null);
    setFormErrorCode(null);
    setSubmitting(true);
    const res = await loginWithGoogle();
    setSubmitting(false);
    if (!res.success && res.error) {
      setFormError(res.error);
      setFormErrorCode(res.errorCode || null);
    }
  };

  // Instant Guest / Visitor Demo Mode
  const handleGuestSignIn = async () => {
    setFormError(null);
    setFormErrorCode(null);
    setSubmitting(true);
    const res = await loginAsGuest();
    setSubmitting(false);
    if (!res.success && res.error) {
      setFormError(res.error);
    }
  };

  // If the user is already authenticated with Firebase, but the session is locked with MPIN/Biometrics:
  if (firebaseUser && isLocked) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B0E14]/95 backdrop-blur-xl p-4 animate-in fade-in duration-200">
        <div className="w-full max-w-sm bg-[#161B26] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 text-center max-h-[92vh] overflow-y-auto">
          {/* Lock Header */}
          <div className="space-y-2">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-[#6C5CE7] to-[#8c7bf7] flex items-center justify-center shadow-lg shadow-[#6C5CE7]/30 ring-1 ring-white/20">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-lg font-extrabold text-white tracking-tight">
              Session Locked
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              {firebaseUser.displayName || firebaseUser.email || 'Vanguard Trader'}
            </p>
          </div>

          {/* PIN Indicators */}
          <div>
            <span className="text-xs text-slate-400 block mb-3 font-medium">
              Enter 4-Digit Trading PIN (Default: <strong className="text-indigo-400 font-mono">8421</strong>)
            </span>
            <div className="flex justify-center gap-4">
              {[0, 1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                    enteredPin.length > idx
                      ? 'bg-[#6C5CE7] scale-110 shadow-md shadow-[#6C5CE7]/50'
                      : 'border-2 border-slate-700 bg-slate-900'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Numeric Keypad */}
          <div className="grid grid-cols-3 gap-3 max-w-[240px] mx-auto">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                onClick={() => handleDigitPress(digit)}
                className="w-16 h-16 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 active:bg-slate-800 text-white font-mono font-bold text-xl flex items-center justify-center shadow-xs transition-all active:scale-90 cursor-pointer"
              >
                {digit}
              </button>
            ))}

            {/* Biometric Scan Trigger Button */}
            <button
              onClick={handleBiometricClick}
              disabled={isScanningBio}
              className="w-16 h-16 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-indigo-400 hover:text-white flex items-center justify-center transition-all active:scale-90 cursor-pointer"
              title="Unlock with Biometric FaceID / Fingerprint"
            >
              <Fingerprint className={`w-7 h-7 ${isScanningBio ? 'animate-pulse text-[#00E676]' : ''}`} />
            </button>

            <button
              onClick={() => handleDigitPress('0')}
              className="w-16 h-16 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 active:bg-slate-800 text-white font-mono font-bold text-xl flex items-center justify-center shadow-xs transition-all active:scale-90 cursor-pointer"
            >
              0
            </button>

            <button
              onClick={handleDeleteDigit}
              className="w-16 h-16 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 active:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-all active:scale-90 cursor-pointer"
            >
              <Delete className="w-5 h-5" />
            </button>
          </div>

          {/* FaceID Biometric Button */}
          <div className="pt-1">
            <button
              onClick={handleBiometricClick}
              className="w-full py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Scan className="w-4 h-4 text-[#00E676]" />
              <span>Simulate Biometric FaceID Unlock</span>
            </button>
          </div>

          {/* Switch Account */}
          <button
            onClick={() => signOutFirebase()}
            className="text-[11px] text-slate-400 hover:text-red-400 underline block mx-auto cursor-pointer"
          >
            Switch Account / Sign Out
          </button>
        </div>
      </div>
    );
  }

  // PRIMARY STATE: Full Firebase Sign-In / Open Demat / Forgot Password Modal
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#161B26] border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 text-left relative max-h-[92vh] overflow-y-auto">
        {/* Dismiss Button */}
        <button
          type="button"
          onClick={closeAuthModal}
          className="absolute top-4 right-4 p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          title="Close & Browse Markets"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Branding */}
        <div className="flex items-center gap-3 pr-8">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#6C5CE7] to-[#8c7bf7] flex items-center justify-center shadow-lg shadow-[#6C5CE7]/30 ring-1 ring-white/20 shrink-0">
            <span className="text-white font-extrabold text-lg tracking-tighter">VT</span>
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-white tracking-tight flex items-center gap-1.5">
              <span>Vanguard</span>
              <span className="text-[#6C5CE7]">Trade</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                2FA SECURE
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Indian Equity & Demat Trading Portal (NSE/BSE)
            </p>
          </div>
        </div>

        {/* Tab Toggle */}
        {activeTab !== 'RESET_CONFIRM' && (
          <div className="flex p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs gap-1">
            <button
              type="button"
              onClick={() => {
                setActiveTab('LOGIN');
                setFormError(null);
                setFormErrorCode(null);
              }}
              className={`flex-1 py-1.5 rounded-lg font-bold transition-all text-center cursor-pointer ${
                activeTab === 'LOGIN'
                  ? 'bg-[#6C5CE7] text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('GOOGLE');
                setFormError(null);
                setFormErrorCode(null);
              }}
              className={`flex-1 py-1.5 rounded-lg font-bold transition-all text-center cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'GOOGLE'
                  ? 'bg-slate-800 text-white shadow-xs border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Google</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('REGISTER');
                setFormError(null);
                setFormErrorCode(null);
              }}
              className={`flex-1 py-1.5 rounded-lg font-bold transition-all text-center cursor-pointer ${
                activeTab === 'REGISTER'
                  ? 'bg-[#6C5CE7] text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Open Demat
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('FORGOT');
                setFormError(null);
                setFormErrorCode(null);
                setResetSentToEmail(null);
              }}
              className={`flex-1 py-1.5 rounded-lg font-bold transition-all text-center cursor-pointer ${
                activeTab === 'FORGOT'
                  ? 'bg-[#6C5CE7] text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Reset
            </button>
          </div>
        )}

        {/* Error Alert */}
        {formError && (
          <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-xl text-red-300 text-xs space-y-2 animate-in fade-in">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
              <span>{formError}</span>
            </div>

            {formErrorCode === 'auth/email-already-in-use' && (
              <div className="flex flex-wrap gap-2 pl-6 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('LOGIN');
                    setFormError(null);
                    setFormErrorCode(null);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold text-[11px] cursor-pointer"
                >
                  Sign In Instead
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('FORGOT');
                    setFormError(null);
                    setFormErrorCode(null);
                    setResetSentToEmail(null);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-[#6C5CE7]/20 hover:bg-[#6C5CE7]/30 text-indigo-300 font-semibold text-[11px] cursor-pointer"
                >
                  Reset Password
                </button>
              </div>
            )}

            {formErrorCode === 'auth/unauthorized-domain' && (
              <div className="pl-6 pt-1 space-y-2">
                <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700/80">
                  <span className="font-mono text-[11px] text-white truncate">
                    {typeof window !== 'undefined' ? window.location.hostname : ''}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        navigator.clipboard?.writeText(window.location.hostname);
                        setCopiedDomain(true);
                        setTimeout(() => setCopiedDomain(false), 2000);
                      }
                    }}
                    className="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-semibold cursor-pointer"
                  >
                    {copiedDomain ? <Check className="w-3 h-3 text-[#00E676]" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedDomain ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <a
                    href="https://console.firebase.google.com/project/resounding-outpost-d8f9p/authentication/settings"
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold text-[11px] inline-flex items-center gap-1"
                  >
                    <span>Authorize Domain</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('REGISTER');
                      setFormError(null);
                      setFormErrorCode(null);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-[#00E676]/20 hover:bg-[#00E676]/30 text-[#00E676] font-semibold text-[11px] cursor-pointer"
                  >
                    Use Open Demat
                  </button>
                  <button
                    type="button"
                    onClick={handleGuestSignIn}
                    className="px-2.5 py-1 rounded-lg bg-[#6C5CE7]/25 hover:bg-[#6C5CE7]/40 text-indigo-200 font-semibold text-[11px] cursor-pointer"
                  >
                    Demo Guest
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 1: SIGN IN */}
        {activeTab === 'LOGIN' && (
          <form onSubmit={handleLoginSubmit} className="space-y-3.5">
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="investor@example.com"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-[#6C5CE7] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Password
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-[#6C5CE7] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center text-[11px]">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('REGISTER');
                  setFormError(null);
                  setFormErrorCode(null);
                }}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                New investor? <span className="text-[#00E676] font-semibold">Open Demat</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('FORGOT');
                  setFormError(null);
                  setFormErrorCode(null);
                  setResetSentToEmail(null);
                }}
                className="text-[#6C5CE7] hover:underline cursor-pointer font-semibold"
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#6C5CE7] to-[#5a48e0] hover:brightness-110 active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#6C5CE7]/30 transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Verifying Credentials...' : 'Sign In to Vanguard Trade'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        )}

        {/* TAB 2: GOOGLE AUTHENTICATION (Real Firebase Google OAuth Popup) */}
        {activeTab === 'GOOGLE' && (
          <div className="space-y-3.5 animate-in fade-in">
            <div className="p-3.5 bg-indigo-950/30 border border-indigo-500/20 rounded-2xl space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 block">
                Google OAuth Verification
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">
                Sign in with your verified Google account to activate your CDSL Demat portfolio and sync holdings securely in Cloud Firestore.
              </p>
            </div>

            <button
              type="button"
              onClick={handleGooglePopupSignIn}
              disabled={submitting}
              className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-slate-100 active:scale-98 text-slate-900 font-bold text-xs flex items-center justify-center gap-2.5 shadow-lg transition-all cursor-pointer disabled:opacity-50"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>{submitting ? 'Opening Google Sign-In...' : 'Continue with Google'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <p>
                Prefer signing in with a custom email &amp; password? Use{' '}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('REGISTER');
                    setFormError(null);
                  }}
                  className="text-[#00E676] font-semibold hover:underline cursor-pointer"
                >
                  Open Demat
                </button>{' '}
                to create a dedicated password-protected account.
              </p>
            </div>
          </div>
        )}

        {/* TAB 3: REGISTER DEMAT ACCOUNT */}
        {activeTab === 'REGISTER' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Full Legal Name (as per PAN)
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Riya Sharma"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-[#6C5CE7] transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-[#6C5CE7] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  PAN Card <span className="text-slate-500 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <CreditCard className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    maxLength={10}
                    value={panNumber}
                    onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                    placeholder="ABCDE1234F"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white font-mono uppercase placeholder-slate-500 focus:outline-hidden focus:border-[#6C5CE7] transition-colors"
                  />
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-slate-300">
                  Set Account Password
                </label>
                <span className={`text-[10px] font-mono ${password.length >= 6 ? 'text-[#00E676]' : 'text-slate-500'}`}>
                  {password.length >= 6 ? '✓ 6+ chars' : 'Min 6 chars'}
                </span>
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-[#6C5CE7] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Trading Mode Preference */}
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Preferred Initial Experience
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setMode('beginner')}
                  className={`p-2 rounded-xl border text-left flex items-center gap-1.5 transition-all cursor-pointer ${
                    mode === 'beginner'
                      ? 'bg-[#6C5CE7]/20 border-[#6C5CE7] text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#00E676]" />
                  <span>Beginner Mode</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMode('pro')}
                  className={`p-2 rounded-xl border text-left flex items-center gap-1.5 transition-all cursor-pointer ${
                    mode === 'pro'
                      ? 'bg-[#6C5CE7]/20 border-[#6C5CE7] text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5 text-[#6C5CE7]" />
                  <span>Pro Terminal</span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#00E676] to-[#00c864] hover:brightness-110 active:scale-98 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#00E676]/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Creating CDSL Demat Account...' : 'Open Free Demat Account (₹0 Delivery)'}
            </button>
          </form>
        )}

        {/* TAB 4: FORGOT PASSWORD */}
        {activeTab === 'FORGOT' && (
          <div className="space-y-3.5">
            {resetSentToEmail ? (
              <div className="p-4 rounded-2xl bg-emerald-950/30 border border-[#00E676]/30 space-y-3 animate-in fade-in">
                <div className="flex items-start gap-2.5">
                  <CheckCircle className="w-5 h-5 text-[#00E676] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-white">Reset Link Dispatched</h4>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      Firebase has processed a password reset request for <strong className="text-white font-mono">{resetSentToEmail}</strong>.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] text-slate-300 space-y-1.5">
                  <p className="font-semibold text-white">If you don&apos;t see the email within 1–2 minutes:</p>
                  <ul className="list-disc pl-4 space-y-1 text-slate-400">
                    <li>Check your <strong>Spam / Junk / Promotions</strong> folder (sender: <span className="font-mono text-slate-300">noreply@resounding-outpost-d8f9p.firebaseapp.com</span>).</li>
                    <li>
                      Firebase only delivers a reset email if this address was registered with an <strong>Email &amp; Password</strong> account in <strong>Open Demat</strong>. Accounts that only signed in with Google don&apos;t have a password to reset.
                    </li>
                  </ul>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('LOGIN');
                      setResetSentToEmail(null);
                    }}
                    className="flex-1 py-2 px-3 rounded-xl bg-[#6C5CE7] hover:bg-[#5a48e0] text-white font-bold text-xs cursor-pointer"
                  >
                    Back to Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('REGISTER');
                      setResetSentToEmail(null);
                    }}
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs cursor-pointer"
                  >
                    Open Demat
                  </button>
                  <button
                    type="button"
                    onClick={() => setResetSentToEmail(null)}
                    className="py-2 px-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white text-xs flex items-center gap-1 cursor-pointer"
                    title="Send to another email"
                  >
                    <RefreshCw className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-3.5">
                <p className="text-xs text-slate-400">
                  Enter the email address registered with your Demat account. We will dispatch a secure password reset link via Firebase Auth.
                </p>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Registered Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="investor@example.com"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-[#6C5CE7] transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 rounded-xl bg-[#6C5CE7] hover:bg-[#5a48e0] active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Dispatching Link...' : 'Send Password Reset Link'}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('LOGIN')}
                  className="text-xs text-slate-400 hover:text-white block mx-auto text-center cursor-pointer"
                >
                  ← Back to Sign In
                </button>
              </form>
            )}
          </div>
        )}

        {/* TAB 5: IN-APP PASSWORD RESET CONFIRMATION (?mode=resetPassword&oobCode=...) */}
        {activeTab === 'RESET_CONFIRM' && (
          <div className="space-y-3.5 animate-in fade-in">
            {resetCompleted ? (
              <div className="p-4 rounded-2xl bg-emerald-950/30 border border-[#00E676]/30 space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-[#00E676]" />
                  <h4 className="text-sm font-bold text-white">Password Successfully Updated</h4>
                </div>
                <p className="text-xs text-slate-300">
                  Your new password has been saved. Sign in now to access your Demat portfolio.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setResetCompleted(false);
                    setActiveTab('LOGIN');
                  }}
                  className="w-full py-2.5 rounded-xl bg-[#6C5CE7] hover:bg-[#5a48e0] text-white font-bold text-xs cursor-pointer"
                >
                  Continue to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleConfirmResetSubmit} className="space-y-3">
                <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-xs text-slate-300">
                  Setting a new password for{' '}
                  <strong className="text-white font-mono">{resetVerifiedEmail || email || 'your account'}</strong>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmNewPass}
                      onChange={(e) => setConfirmNewPass(e.target.value)}
                      placeholder="Enter at least 6 characters"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-[#6C5CE7]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-200 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#00E676] to-[#00c864] text-slate-950 font-bold text-xs cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Updating Password...' : 'Confirm New Password'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Alternative Sign-In Methods (Google OAuth & Demo Guest) */}
        {activeTab !== 'FORGOT' && activeTab !== 'GOOGLE' && activeTab !== 'RESET_CONFIRM' && (
          <div className="space-y-2.5 pt-2 border-t border-slate-800">
            <div className="relative flex py-1 items-center">
              <div className="grow border-t border-slate-800"></div>
              <span className="shrink mx-3 text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                Or Continue With
              </span>
              <div className="grow border-t border-slate-800"></div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {/* Google OAuth Button */}
              <button
                type="button"
                onClick={handleGooglePopupSignIn}
                disabled={submitting}
                className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs text-slate-200 font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
                title="Sign in with Google Account"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Google</span>
              </button>

              {/* Instant Guest Demo Trader */}
              <button
                type="button"
                onClick={handleGuestSignIn}
                disabled={submitting}
                className="py-2 px-3 rounded-xl bg-indigo-950/40 hover:bg-indigo-950/70 border border-indigo-500/30 text-xs text-indigo-300 font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                title="Instant Demo Trading with ₹2.45L Virtual Funds"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#00E676]" />
                <span>Demo Guest</span>
              </button>
            </div>
          </div>
        )}

        {/* Security & Regulatory Compliance Footer */}
        <div className="flex items-center justify-center gap-2 text-[10px] text-slate-500 pt-1">
          <ShieldCheck className="w-3.5 h-3.5 text-[#00E676]" />
          <span>SEBI Mandated 2FA & CDSL 256-Bit SSL Encrypted</span>
        </div>
      </div>
    </div>
  );
};
