import { BrokerageCalculation, ProductType } from '../types';

/**
 * Format numbers according to Indian numbering system (Lakhs and Crores)
 * e.g., 1234567.89 -> ₹12,34,567.89
 */
export function formatINR(val: number, showDecimals: boolean = true): string {
  if (isNaN(val)) return '₹0.00';
  const isNegative = val < 0;
  const absVal = Math.abs(val);

  const parts = absVal.toFixed(showDecimals ? 2 : 0).split('.');
  let integerPart = parts[0];
  const decimalPart = parts[1] ? `.${parts[1]}` : '';

  // Indian comma separation: last 3 digits, then every 2 digits
  let lastThree = integerPart.substring(integerPart.length - 3);
  const otherNumbers = integerPart.substring(0, integerPart.length - 3);
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  const formattedInteger = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;

  return `${isNegative ? '-' : ''}₹${formattedInteger}${decimalPart}`;
}

/**
 * Compact Indian Rupee notation (Crores, Lakhs, Thousands)
 */
export function formatCompactINR(val: number): string {
  if (isNaN(val)) return '₹0';
  const isNegative = val < 0;
  const absVal = Math.abs(val);

  let formatted = '';
  if (absVal >= 10000000) {
    formatted = `₹${(absVal / 10000000).toFixed(2)} Cr`;
  } else if (absVal >= 100000) {
    formatted = `₹${(absVal / 100000).toFixed(2)} L`;
  } else if (absVal >= 1000) {
    formatted = `₹${(absVal / 1000).toFixed(1)} K`;
  } else {
    formatted = `₹${absVal.toFixed(2)}`;
  }

  return `${isNegative ? '-' : ''}${formatted}`;
}

export function formatPercent(val: number): string {
  const sign = val > 0 ? '+' : '';
  return `${sign}${val.toFixed(2)}%`;
}

/**
 * Smart Brokerage & Statutory SEBI/Govt Charges Calculator
 */
export function calculateBrokerageAndCharges({
  price,
  quantity,
  product,
  isBuy,
}: {
  price: number;
  quantity: number;
  product: ProductType;
  isBuy: boolean;
}): BrokerageCalculation {
  const turnover = price * quantity;
  if (turnover <= 0) {
    return {
      turnover: 0,
      brokerage: 0,
      stt: 0,
      exchangeFee: 0,
      sebiFee: 0,
      stampDuty: 0,
      gst: 0,
      totalCharges: 0,
      netAmount: 0,
      breakevenPerShare: 0,
    };
  }

  // 1. Brokerage: Zero for Delivery (CNC), min(20, 0.03%) for Intraday (MIS) & MTF
  let brokerage = 0;
  if (product === 'CNC') {
    brokerage = 0; // ₹0 brokerage on equity delivery
  } else {
    brokerage = Math.min(20, Math.max(0.01, turnover * 0.0003));
  }

  // 2. STT (Securities Transaction Tax)
  let stt = 0;
  if (product === 'CNC' || product === 'MTF') {
    stt = Math.round(turnover * 0.001); // 0.1% on buy & sell
  } else if (product === 'MIS') {
    // 0.025% on sell only for intraday
    stt = isBuy ? 0 : Math.round(turnover * 0.00025);
  }

  // 3. Exchange Turnover Charge (NSE 0.00297%)
  const exchangeFee = Number((turnover * 0.0000297).toFixed(2));

  // 4. SEBI Turnover Fee (₹10 per Crore)
  const sebiFee = Number((turnover * 0.000001).toFixed(2));

  // 5. Stamp Duty (applicable on BUY only: 0.015% for CNC/MTF, 0.003% for MIS)
  let stampDuty = 0;
  if (isBuy) {
    stampDuty =
      product === 'MIS'
        ? Math.round(turnover * 0.00003)
        : Math.round(turnover * 0.00015);
  }

  // 6. GST: 18% on (Brokerage + Exchange turnover charges + SEBI charges)
  const gst = Number(((brokerage + exchangeFee + sebiFee) * 0.18).toFixed(2));

  // Total Charges
  const totalCharges = Number(
    (brokerage + stt + exchangeFee + sebiFee + stampDuty + gst).toFixed(2)
  );

  // Net Cash needed or received
  const netAmount = isBuy ? turnover + totalCharges : turnover - totalCharges;

  // Breakeven price movement needed per share to cover all charges
  const breakevenPerShare = quantity > 0 ? Number((totalCharges / quantity).toFixed(2)) : 0;

  return {
    turnover,
    brokerage,
    stt,
    exchangeFee,
    sebiFee,
    stampDuty,
    gst,
    totalCharges,
    netAmount,
    breakevenPerShare,
  };
}

/**
 * Web Audio API synthesizer for tactile trade feedback
 */
class SoundEngine {
  private ctx: AudioContext | null = null;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTradeSuccess() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.12); // G5
      osc.frequency.exponentialRampToValueAtTime(1046.50, now + 0.25); // C6

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } catch {
      // Audio not permitted or background
    }
  }

  playPanicTrigger() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.3);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } catch {
      // Audio fallback
    }
  }

  playTickClick() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);

      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    } catch {
      // Audio fallback
    }
  }

  playAlertChime() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      
      // Chime 1
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(1046.5, now); // C6
      gain1.gain.setValueAtTime(0.2, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.25);

      // Chime 2
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1318.51, now + 0.12); // E6
      gain2.gain.setValueAtTime(0.22, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.45);
    } catch {
      // Audio fallback
    }
  }
}

export const soundEffects = new SoundEngine();

export function triggerHaptic(type: 'light' | 'medium' | 'heavy' = 'light') {
  try {
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      if (type === 'light') navigator.vibrate(10);
      else if (type === 'medium') navigator.vibrate([15, 20, 15]);
      else navigator.vibrate([30, 40, 50]);
    }
  } catch {
    // Vibration not permitted in sandboxed iframe
  }
}

