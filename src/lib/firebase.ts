import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithCredential,
  signInAnonymously,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  confirmPasswordReset,
  verifyPasswordResetCode,
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  getDocFromServer,
  collection,
  onSnapshot,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App singleton
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Auth
export const auth = getAuth(app);

// Initialize Firestore with custom database ID if specified in config
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Test Connection as mandated by Firebase Skill
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('[Firebase] Client is offline or database initializing.');
    }
  }
}
testConnection();

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

// Pending registration metadata to avoid race condition between createUserWithEmailAndPassword and onAuthStateChanged
let pendingRegistrationMeta: {
  displayName?: string;
  panMask?: string;
  preferredMode?: 'beginner' | 'pro';
} | null = null;

export function setPendingRegistrationMeta(meta: {
  displayName?: string;
  panMask?: string;
  preferredMode?: 'beginner' | 'pro';
} | null) {
  pendingRegistrationMeta = meta;
}

// Map Firebase Auth Errors to user-friendly messages
export function getAuthErrorMessage(error: any): string {
  if (!error) return 'Authentication error occurred.';
  const code = error.code || '';
  const rawMessage = typeof error.message === 'string' ? error.message : '';

  switch (code) {
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please verify your credentials or reset your password.';
    case 'auth/email-already-in-use':
      return 'An account already exists with this email address. Try signing in or resetting your password.';
    case 'auth/weak-password':
      return 'Password is too weak. Please use at least 6 characters with letters and numbers.';
    case 'auth/invalid-email':
    case 'auth/missing-email':
      return 'Please enter a valid email address.';
    case 'auth/operation-not-allowed':
      return 'This sign-in method is currently disabled in Firebase Console (Authentication → Sign-in method).';
    case 'auth/admin-restricted-operation':
      return 'Guest / anonymous sign-in is disabled in Firebase Console. Use Open Demat, Sign In, or Google.';
    case 'auth/unauthorized-domain': {
      const host = typeof window !== 'undefined' ? window.location.hostname : 'this domain';
      return `Google Sign-In requires "${host}" to be added in Firebase Console → Authentication → Settings → Authorized domains. You can still use Email / Open Demat or Demo Guest right now.`;
    }
    case 'auth/popup-closed-by-user':
      return 'Google sign-in popup was closed before completing.';
    case 'auth/popup-blocked':
      return 'Popup was blocked by your browser. Please allow popups for this site and try again.';
    case 'auth/cancelled-popup-request':
      return 'Another sign-in popup is already open. Please complete or close it first.';
    case 'auth/too-many-requests':
      return 'Too many attempts detected. Please wait a few minutes before trying again.';
    case 'auth/network-request-failed':
      return 'Network connection issue. Please check your internet connection.';
    case 'auth/expired-action-code':
      return 'This password reset link has expired. Please request a new reset link.';
    case 'auth/invalid-action-code':
      return 'This password reset link is invalid or has already been used. Please request a new one.';
    default:
      if (rawMessage.includes('PASSWORD_DOES_NOT_MEET_REQUIREMENTS')) {
        return 'Password does not meet security requirements. Include uppercase, lowercase, a number, and a special character.';
      }
      return error.message || 'Authentication failed. Please try again.';
  }
}

// Fetch or create user profile document in Firestore
export async function fetchOrCreateUserProfile(
  user: FirebaseUser,
  overrides?: {
    displayName?: string;
    panMask?: string;
    preferredMode?: 'beginner' | 'pro';
  }
): Promise<UserProfile> {
  const userRef = doc(db, 'users', user.uid);
  const effectiveMeta = overrides || pendingRegistrationMeta || {};

  try {
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const existing = snap.data() as UserProfile;
      // If overrides were passed explicitly (e.g. right after registration), ensure displayName/panMask are synced
      if (overrides?.displayName && existing.displayName !== overrides.displayName) {
        const patch: Partial<UserProfile> = {
          displayName: overrides.displayName,
          updatedAt: new Date().toISOString(),
        };
        if (overrides.panMask) patch.panMask = overrides.panMask;
        if (overrides.preferredMode) patch.preferredMode = overrides.preferredMode;
        try {
          await updateDoc(userRef, patch);
          return { ...existing, ...patch };
        } catch {
          return { ...existing, ...patch };
        }
      }
      return existing;
    }
  } catch (err) {
    console.warn('Could not read user profile from Firestore, creating fallback:', err);
  }

  // Generate deterministic mock CDSL BOID & KYC for demo
  const cdslBOID = '12081600' + Math.floor(10000000 + Math.random() * 90000000).toString();
  const resolvedName =
    effectiveMeta.displayName?.trim() ||
    user.displayName ||
    (user.isAnonymous ? 'Guest Trader' : user.email?.split('@')[0] || 'Vanguard Trader');
  const resolvedPan =
    effectiveMeta.panMask?.trim().toUpperCase() ||
    'ABCDE' + Math.floor(1000 + Math.random() * 9000) + 'F';

  const newProfile: UserProfile = {
    uid: user.uid,
    email: user.email || (user.isAnonymous ? 'guest.trader@vanguard.in' : 'investor@vanguard.in'),
    displayName: resolvedName,
    photoURL: user.photoURL || '',
    kycStatus: 'VERIFIED',
    cdslBOID,
    panMask: resolvedPan,
    bankName: 'HDFC Bank Ltd (***4910)',
    preferredMode: effectiveMeta.preferredMode || 'beginner',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isAnonymous: user.isAnonymous,
  };

  try {
    await setDoc(userRef, newProfile, { merge: true });
  } catch (err) {
    console.warn('Could not persist new user profile to Firestore:', err);
  }

  return newProfile;
}

// Update User Profile
export async function updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
  const userRef = doc(db, 'users', uid);
  try {
    await updateDoc(userRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('Failed to update user profile in Firestore:', err);
  }
}

// Sign in with Google Identity Services ID token (from accounts.google.com)
export async function signInWithGoogleIdToken(idToken: string) {
  const credential = GoogleAuthProvider.credential(idToken);
  return await signInWithCredential(auth, credential);
}

// Sign in with Google Popup (Official Firebase Auth Provider)
export async function signInWithGooglePopup() {
  return await signInWithPopup(auth, googleProvider);
}

// Verify & Complete Password Reset from OOB Action Code
export async function verifyResetActionCode(oobCode: string): Promise<string> {
  return await verifyPasswordResetCode(auth, oobCode);
}

export async function completeResetWithCode(oobCode: string, newPassword: string): Promise<void> {
  return await confirmPasswordReset(auth, oobCode, newPassword);
}


