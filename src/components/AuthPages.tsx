import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { User } from 'firebase/auth';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  RefreshCw,
  ShieldCheck,
  User as UserIcon,
  UserPlus,
} from 'lucide-react';
import { AuthPageMode } from '../types';
import {
  changeSignedInPassword,
  confirmNewPassword,
  getFirebaseAuthErrorMessage,
  loginWithEmail,
  registerWithEmail,
  requestPasswordReset,
  resendVerificationEmail,
  verifyResetActionCode,
} from '../firebase';
import {
  checkAuthRateLimit,
  isValidEmail,
  recordAuthAttempt,
  resetAuthRateLimit,
  sanitizeText,
} from '../utils/security';

interface AuthPagesProps {
  mode: AuthPageMode;
  onChangeMode: (next: AuthPageMode) => void;
  onBackToApp: () => void;
  onAuthSuccess: (message: string) => void;
  onGoogleSignIn: () => Promise<void>;
  initialOobCode?: string | null;
  onClearOobCode?: () => void;
  currentUser: User | null;
  onRefreshVerification: () => Promise<boolean>;
}

const MODE_TABS: Array<{ id: AuthPageMode; label: string }> = [
  { id: 'login', label: 'Sign In' },
  { id: 'register', label: 'Register' },
  { id: 'forgot', label: 'Forgot Password' },
];

function getPasswordStrength(pw: string): { label: string; score: number; barColor: string } {
  if (!pw) return { label: 'Enter at least 6 characters', score: 0, barColor: 'bg-[#DCEBCE]' };
  let score = 0;
  if (pw.length >= 6) score += 1;
  if (pw.length >= 10) score += 1;
  if (/[A-Z]/.test(pw) && /[0-9!@#$%^&*]/.test(pw)) score += 1;
  if (score <= 1) return { label: 'Fair — add numbers or uppercase for stronger security', score: 1, barColor: 'bg-[#FFC53D]' };
  if (score === 2) return { label: 'Good password strength', score: 2, barColor: 'bg-[#8DC63F]' };
  return { label: 'Strong password', score: 3, barColor: 'bg-[#4E8A1F]' };
}

export const AuthPages: React.FC<AuthPagesProps> = ({
  mode,
  onChangeMode,
  onBackToApp,
  onAuthSuccess,
  onGoogleSignIn,
  initialOobCode,
  onClearOobCode,
  currentUser,
  onRefreshVerification,
}) => {
  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPw, setShowLoginPw] = useState(false);

  // Register state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [showRegPw, setShowRegPw] = useState(false);
  const [awaitingVerification, setAwaitingVerification] = useState(false);

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSentTo, setForgotSentTo] = useState<string | null>(null);

  // Reset password state
  const [resetCode, setResetCode] = useState(initialOobCode || '');
  const [verifiedResetEmail, setVerifiedResetEmail] = useState<string | null>(null);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPw, setConfirmNewPw] = useState('');
  const [showNewPw, setShowNewPw] = useState(false);
  const [resetCompleted, setResetCompleted] = useState(false);
  const [preferCodeReset, setPreferCodeReset] = useState(Boolean(initialOobCode));

  // Shared UI status
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  const hasPasswordProvider = useMemo(
    () => Boolean(currentUser?.providerData?.some((p) => p.providerId === 'password')),
    [currentUser]
  );

  // Clear banners when switching auth pages
  const switchMode = (next: AuthPageMode) => {
    setErrorMsg(null);
    setInfoMsg(null);
    setResetCompleted(false);
    onChangeMode(next);
  };

  // Auto-verify oobCode if launched from Firebase email link
  useEffect(() => {
    if (!initialOobCode) return;
    setResetCode(initialOobCode);
    setPreferCodeReset(true);
    let active = true;
    setVerifyingCode(true);
    setErrorMsg(null);
    verifyResetActionCode(initialOobCode)
      .then((email) => {
        if (!active) return;
        setVerifiedResetEmail(email);
      })
      .catch((err) => {
        if (!active) return;
        setErrorMsg(getFirebaseAuthErrorMessage(err));
      })
      .finally(() => {
        if (active) setVerifyingCode(false);
      });
    return () => {
      active = false;
    };
  }, [initialOobCode]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);

    const rl = checkAuthRateLimit('login');
    if (!rl.allowed) {
      setErrorMsg(`Too many sign-in attempts. Please wait ${rl.retryAfterSec}s before trying again.`);
      return;
    }

    const cleanEmail = sanitizeText(loginEmail, 160).toLowerCase();
    if (!isValidEmail(cleanEmail) || !loginPassword || loginPassword.length > 128) {
      setErrorMsg('Please enter a valid email address and password.');
      return;
    }

    setBusy(true);
    try {
      const signedIn = await loginWithEmail(cleanEmail, loginPassword);
      resetAuthRateLimit('login');
      if (!signedIn.emailVerified) {
        setAwaitingVerification(true);
        setInfoMsg('Signed in! Verify your email address to enable cloud backup across devices.');
      } else {
        const firstName = sanitizeText(signedIn.displayName || '', 80).split(/\s+/)[0] || 'back';
        onAuthSuccess(`Welcome ${firstName}!`);
      }
    } catch (err) {
      const attempt = recordAuthAttempt('login');
      if (attempt.blocked) {
        setErrorMsg(`Too many failed attempts. Sign-in paused for ${attempt.retryAfterSec}s.`);
      } else {
        setErrorMsg(getFirebaseAuthErrorMessage(err));
      }
    } finally {
      setBusy(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);

    const rl = checkAuthRateLimit('register');
    if (!rl.allowed) {
      setErrorMsg(`Too many registration attempts. Please wait ${rl.retryAfterSec}s and try again.`);
      return;
    }

    const cleanName = sanitizeText(regName, 80);
    const cleanEmail = sanitizeText(regEmail, 160).toLowerCase();
    if (cleanName.length < 2) {
      setErrorMsg('Please enter your name (at least 2 characters).');
      return;
    }
    if (!isValidEmail(cleanEmail)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (regPassword.length < 6 || regPassword.length > 128 || !regPassword.trim()) {
      setErrorMsg('Password must be 6–128 characters and cannot be blank.');
      return;
    }
    if (regPassword !== regConfirm) {
      setErrorMsg('Passwords do not match. Please re-enter them.');
      return;
    }

    const attempt = recordAuthAttempt('register');
    if (attempt.blocked) {
      setErrorMsg(`Too many signup attempts. Please wait ${attempt.retryAfterSec}s.`);
      return;
    }

    setBusy(true);
    try {
      await registerWithEmail(cleanName, cleanEmail, regPassword);
      setAwaitingVerification(true);
      setInfoMsg(`Verification email sent to ${cleanEmail}. Check your inbox to activate cloud sync.`);
    } catch (err) {
      setErrorMsg(getFirebaseAuthErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const handleResendVerification = async () => {
    setErrorMsg(null);
    setInfoMsg(null);
    const rl = checkAuthRateLimit('verify');
    if (!rl.allowed) {
      setErrorMsg(`Please wait ${rl.retryAfterSec}s before requesting another verification email.`);
      return;
    }
    const attempt = recordAuthAttempt('verify');
    if (attempt.blocked) {
      setErrorMsg(`Too many verification emails requested. Wait ${attempt.retryAfterSec}s.`);
      return;
    }
    setBusy(true);
    try {
      await resendVerificationEmail();
      setInfoMsg('Verification email resent! Please check your inbox and spam folder.');
    } catch (err) {
      setErrorMsg(getFirebaseAuthErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const handleCheckVerification = async () => {
    setErrorMsg(null);
    setInfoMsg(null);
    setBusy(true);
    try {
      const verified = await onRefreshVerification();
      if (verified) {
        setAwaitingVerification(false);
        onAuthSuccess('Email verified — cloud sync enabled!');
      } else {
        setInfoMsg('Still waiting for email verification. Click the link in your inbox, then try again.');
      }
    } catch (err) {
      setErrorMsg(getFirebaseAuthErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);

    const rl = checkAuthRateLimit('forgot');
    if (!rl.allowed) {
      setErrorMsg(`Too many reset requests. Please wait ${rl.retryAfterSec}s before retrying.`);
      return;
    }

    const target = sanitizeText(forgotEmail, 160).toLowerCase();
    if (!isValidEmail(target)) {
      setErrorMsg('Please enter a valid account email address.');
      return;
    }

    const attempt = recordAuthAttempt('forgot');
    if (attempt.blocked) {
      setErrorMsg(`Reset limit reached. Please wait ${attempt.retryAfterSec}s.`);
      return;
    }

    setBusy(true);
    try {
      await requestPasswordReset(target);
      setForgotSentTo(target);
      setInfoMsg(`Password reset link sent to ${target}.`);
    } catch (err) {
      setErrorMsg(getFirebaseAuthErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const handleVerifyManualCode = async () => {
    setErrorMsg(null);
    setInfoMsg(null);
    const rl = checkAuthRateLimit('reset');
    if (!rl.allowed) {
      setErrorMsg(`Too many code checks. Please wait ${rl.retryAfterSec}s.`);
      return;
    }
    const cleanCode = sanitizeText(resetCode, 256);
    if (!cleanCode) {
      setErrorMsg('Please paste the password reset code from your email.');
      return;
    }
    setVerifyingCode(true);
    try {
      const email = await verifyResetActionCode(cleanCode);
      setVerifiedResetEmail(email);
      setInfoMsg(`Reset code verified for ${email}. Choose a new password below.`);
    } catch (err) {
      recordAuthAttempt('reset');
      setVerifiedResetEmail(null);
      setErrorMsg(getFirebaseAuthErrorMessage(err));
    } finally {
      setVerifyingCode(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);

    const rl = checkAuthRateLimit('reset');
    if (!rl.allowed) {
      setErrorMsg(`Too many reset attempts. Please wait ${rl.retryAfterSec}s.`);
      return;
    }

    if (newPassword.length < 6 || newPassword.length > 128 || !newPassword.trim()) {
      setErrorMsg('New password must be 6–128 characters and cannot be blank.');
      return;
    }
    if (newPassword !== confirmNewPw) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setBusy(true);
    try {
      if (currentUser && hasPasswordProvider && !preferCodeReset) {
        await changeSignedInPassword(newPassword);
        resetAuthRateLimit('reset');
        setResetCompleted(true);
        setNewPassword('');
        setConfirmNewPw('');
        onAuthSuccess('Your password has been updated!');
      } else {
        const cleanCode = sanitizeText(resetCode, 256);
        if (!cleanCode) {
          setErrorMsg('Please enter the reset code from your email first.');
          setBusy(false);
          return;
        }
        await confirmNewPassword(cleanCode, newPassword);
        resetAuthRateLimit('reset');
        setResetCompleted(true);
        setNewPassword('');
        setConfirmNewPw('');
        onClearOobCode?.();
      }
    } catch (err) {
      recordAuthAttempt('reset');
      setErrorMsg(getFirebaseAuthErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const handleGoogleClick = async () => {
    setErrorMsg(null);
    setInfoMsg(null);
    setBusy(true);
    try {
      await onGoogleSignIn();
    } catch (err) {
      setErrorMsg(getFirebaseAuthErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const regStrength = getPasswordStrength(regPassword);
  const resetStrength = getPasswordStrength(newPassword);

  const pageMeta: Record<AuthPageMode, { title: string; subtitle: string; badge: string }> = {
    login: {
      title: 'Welcome back',
      subtitle: 'Sign in to sync your 7-day meal planner, grocery budgets, and saved recipes.',
      badge: 'Account Sign In',
    },
    register: {
      title: 'Create your account',
      subtitle: 'Join FreshPlate to back up your menu and nutrition goals everywhere.',
      badge: 'New Registration',
    },
    forgot: {
      title: 'Forgot your password?',
      subtitle: 'Enter your email address and we will send you a secure Firebase reset link.',
      badge: 'Account Recovery',
    },
    reset: {
      title: 'Set a new password',
      subtitle: 'Complete your password recovery using the reset code from your email or your signed-in session.',
      badge: 'Account Recovery · Step 2',
    },
  };

  const currentMeta = pageMeta[mode];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className="relative z-10 min-h-screen px-4 sm:px-6 py-6 sm:py-10 max-w-5xl mx-auto flex flex-col justify-center"
    >
      {/* Top Bar: Back + 3-Page Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <button
          type="button"
          onClick={onBackToApp}
          className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs sm:text-sm font-bold text-[#1C2B1A] shadow-[0_6px_18px_rgba(28,43,26,0.08)] hover:bg-[#F7FBF3] min-h-[44px] whitespace-nowrap shrink-0"
        >
          <ArrowLeft className="h-4 w-4 text-[#4E8A1F]" />
          <span>Back to FreshPlate</span>
        </button>

        <div
          role="tablist"
          aria-label="Account pages"
          className="flex items-center gap-1 rounded-full bg-white p-1 shadow-[0_6px_18px_rgba(28,43,26,0.08)] overflow-x-auto no-scrollbar max-w-full"
        >
          {MODE_TABS.map((tab) => {
            const active = mode === tab.id || (tab.id === 'forgot' && mode === 'reset');
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => switchMode(tab.id)}
                className={`rounded-full px-3.5 py-2 text-xs font-bold transition-colors min-h-[40px] whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-[#7CB342] text-white shadow-sm'
                    : 'text-[#7A8A76] hover:text-[#1C2B1A]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Responsive Split Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left Fresh Market Visual Panel (Desktop Showcase + Compact Mobile Header) */}
        <div className="lg:col-span-5 fresh-hero-gradient rounded-[28px] p-6 sm:p-8 text-white shadow-[0_14px_34px_rgba(78,138,31,0.24)] flex flex-col justify-between gap-6">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 flex items-center justify-center shrink-0">
                <img
                  src="/assets/aistudio/freshplate_transparent_1b70ecf0.png"
                  alt="FreshPlate logo"
                  className="w-full h-full object-contain drop-shadow-[0_4px_10px_rgba(28,43,26,0.22)]"
                />
              </div>
              <p className="text-xs font-bold tracking-wide text-white/90">
                FreshPlate · {currentMeta.badge}
              </p>
            </div>
            <h1 className="mt-2 font-display text-3xl sm:text-[34px] font-extrabold leading-tight text-white text-balance">
              {currentMeta.title}
            </h1>
            <p className="mt-2.5 text-sm text-white/90 leading-relaxed">
              {currentMeta.subtitle}
            </p>
          </div>

          <div className="hidden lg:flex items-center gap-4 rounded-[22px] bg-white/15 p-4 backdrop-blur-sm">
            <div className="h-20 w-20 rounded-full p-1 bg-white/90 shadow-lg shrink-0 overflow-hidden">
              <img
                src="/images/food/banner-meal.jpg"
                alt="Fresh balanced meal bowl"
                referrerPolicy="no-referrer"
                className="w-full h-full rounded-full object-cover"
              />
            </div>
            <div className="text-xs sm:text-sm text-white/95 space-y-1">
              <div className="font-display font-bold text-base">Sync across every device</div>
              <p className="text-white/85 leading-snug">
                Your Dhaka bazaar &amp; Walmart budgets, 7-day planner, and high-protein targets stay safe in Firestore.
              </p>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-2 text-xs text-white/85">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            <span>Protected by Firebase Authentication</span>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="lg:col-span-7 fresh-card p-6 sm:p-8 flex flex-col justify-center">
          {/* Error / Info Alerts */}
          <AnimatePresence mode="wait">
            {errorMsg && (
              <motion.div
                key="auth-err"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                role="alert"
                className="mb-4 rounded-2xl bg-[#FFF0EC] border border-[#E4572E]/25 px-4 py-3 text-xs sm:text-sm text-[#A93514] flex items-start gap-2.5"
              >
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-[#E4572E]" />
                <span>{errorMsg}</span>
              </motion.div>
            )}
            {infoMsg && !errorMsg && (
              <motion.div
                key="auth-info"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="mb-4 rounded-2xl bg-[#EEF6E7] border border-[#7CB342]/30 px-4 py-3 text-xs sm:text-sm text-[#356312] flex items-start gap-2.5"
              >
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-[#4E8A1F]" />
                <span>{infoMsg}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Email Verification Pending Banner (after email registration or unverified login) */}
          {awaitingVerification && currentUser && !currentUser.emailVerified ? (
            <div className="space-y-4">
              <div className="rounded-2xl bg-[#FFF9EC] border border-[#FFC53D]/40 p-5 space-y-2">
                <div className="flex items-center gap-2 font-display text-lg font-bold text-[#1C2B1A]">
                  <Mail className="h-5 w-5 text-[#E4572E]" />
                  <span>Verify your email address</span>
                </div>
                <p className="text-sm text-[#495846] leading-relaxed">
                  We sent a verification link to <strong className="text-[#1C2B1A]">{currentUser.email}</strong>. Click the link in your email so Firestore can unlock cloud sync for your account.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleCheckVerification}
                  className="flex-1 min-w-[180px] inline-flex items-center justify-center gap-2 rounded-full bg-[#8DC63F] hover:bg-[#7CB342] disabled:opacity-60 px-5 py-3 text-sm font-bold text-white shadow-md min-h-[48px]"
                >
                  <RefreshCw className={`h-4 w-4 ${busy ? 'animate-spin' : ''}`} />
                  <span>I&apos;ve verified — Continue</span>
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleResendVerification}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#E9F2E3] hover:bg-[#DCEBCE] disabled:opacity-60 px-5 py-3 text-sm font-bold text-[#1C2B1A] min-h-[48px]"
                >
                  <span>Resend email</span>
                </button>
              </div>

              <button
                type="button"
                onClick={onBackToApp}
                className="w-full rounded-full py-2.5 text-xs font-bold text-[#7A8A76] hover:text-[#1C2B1A] min-h-[44px]"
              >
                Continue using FreshPlate offline for now
              </button>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {/* 1. LOGIN PAGE */}
              {mode === 'login' && (
                <motion.form
                  key="form-login"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.18 }}
                  onSubmit={handleLoginSubmit}
                  className="space-y-4"
                >
                  <div>
                    <label htmlFor="login-email" className="block text-xs font-bold text-[#7A8A76] mb-1.5">
                      Email Address
                    </label>
                    <div className="flex items-center gap-2.5 rounded-2xl bg-[#F4F9F0] border border-[#DCEBCE] px-4 min-h-[48px] focus-within:border-[#7CB342]">
                      <Mail className="h-4 w-4 text-[#7A8A76] shrink-0" />
                      <input
                        id="login-email"
                        type="email"
                        autoComplete="email"
                        maxLength={160}
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full bg-transparent text-sm text-[#1C2B1A] placeholder:text-[#7A8A76]/70 focus:outline-none py-2.5"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label htmlFor="login-password" className="text-xs font-bold text-[#7A8A76]">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setForgotEmail(loginEmail);
                          switchMode('forgot');
                        }}
                        className="text-xs font-bold text-[#4E8A1F] hover:underline py-1"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="flex items-center gap-2.5 rounded-2xl bg-[#F4F9F0] border border-[#DCEBCE] px-4 min-h-[48px] focus-within:border-[#7CB342]">
                      <Lock className="h-4 w-4 text-[#7A8A76] shrink-0" />
                      <input
                        id="login-password"
                        type={showLoginPw ? 'text' : 'password'}
                        autoComplete="current-password"
                        maxLength={128}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="w-full bg-transparent text-sm text-[#1C2B1A] placeholder:text-[#7A8A76]/70 focus:outline-none py-2.5"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPw((s) => !s)}
                        aria-label={showLoginPw ? 'Hide password' : 'Show password'}
                        className="h-9 w-9 rounded-full flex items-center justify-center text-[#7A8A76] hover:text-[#1C2B1A]"
                      >
                        {showLoginPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={busy}
                    className="w-full rounded-full bg-[#8DC63F] hover:bg-[#7CB342] disabled:opacity-60 py-3.5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(124,179,66,0.3)] min-h-[48px]"
                  >
                    {busy ? 'Signing in...' : 'Sign In'}
                  </motion.button>

                  <div className="relative py-2 flex items-center justify-center">
                    <span className="h-px bg-[#E9F2E3] w-full" />
                    <span className="px-3 text-xs font-medium text-[#7A8A76] bg-white whitespace-nowrap">
                      or continue with
                    </span>
                    <span className="h-px bg-[#E9F2E3] w-full" />
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    disabled={busy}
                    onClick={handleGoogleClick}
                    className="w-full inline-flex items-center justify-center gap-2.5 rounded-full bg-[#F4F9F0] hover:bg-[#E9F2E3] border border-[#DCEBCE] py-3 text-sm font-bold text-[#1C2B1A] min-h-[48px]"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96z"
                      />
                    </svg>
                    <span>Continue with Google</span>
                  </motion.button>

                  <p className="pt-1 text-center text-xs sm:text-sm text-[#7A8A76]">
                    New to FreshPlate?{' '}
                    <button
                      type="button"
                      onClick={() => switchMode('register')}
                      className="font-bold text-[#4E8A1F] hover:underline py-1"
                    >
                      Create an account
                    </button>
                  </p>
                </motion.form>
              )}

              {/* 2. NEW REGISTRATION PAGE */}
              {mode === 'register' && (
                <motion.form
                  key="form-register"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.18 }}
                  onSubmit={handleRegisterSubmit}
                  className="space-y-4"
                >
                  <div>
                    <label htmlFor="reg-name" className="block text-xs font-bold text-[#7A8A76] mb-1.5">
                      Full Name
                    </label>
                    <div className="flex items-center gap-2.5 rounded-2xl bg-[#F4F9F0] border border-[#DCEBCE] px-4 min-h-[48px] focus-within:border-[#7CB342]">
                      <UserIcon className="h-4 w-4 text-[#7A8A76] shrink-0" />
                      <input
                        id="reg-name"
                        type="text"
                        autoComplete="name"
                        maxLength={80}
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="e.g. Ayesha Rahman"
                        className="w-full bg-transparent text-sm text-[#1C2B1A] placeholder:text-[#7A8A76]/70 focus:outline-none py-2.5"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="reg-email" className="block text-xs font-bold text-[#7A8A76] mb-1.5">
                      Email Address
                    </label>
                    <div className="flex items-center gap-2.5 rounded-2xl bg-[#F4F9F0] border border-[#DCEBCE] px-4 min-h-[48px] focus-within:border-[#7CB342]">
                      <Mail className="h-4 w-4 text-[#7A8A76] shrink-0" />
                      <input
                        id="reg-email"
                        type="email"
                        autoComplete="email"
                        maxLength={160}
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full bg-transparent text-sm text-[#1C2B1A] placeholder:text-[#7A8A76]/70 focus:outline-none py-2.5"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label htmlFor="reg-password" className="block text-xs font-bold text-[#7A8A76] mb-1.5">
                        Password
                      </label>
                      <div className="flex items-center gap-2 rounded-2xl bg-[#F4F9F0] border border-[#DCEBCE] px-3.5 min-h-[48px] focus-within:border-[#7CB342]">
                        <Lock className="h-4 w-4 text-[#7A8A76] shrink-0" />
                        <input
                          id="reg-password"
                          type={showRegPw ? 'text' : 'password'}
                          autoComplete="new-password"
                          maxLength={128}
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder="Min. 6 characters"
                          className="w-full bg-transparent text-sm text-[#1C2B1A] placeholder:text-[#7A8A76]/70 focus:outline-none py-2.5"
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegPw((s) => !s)}
                          aria-label={showRegPw ? 'Hide password' : 'Show password'}
                          className="h-9 w-9 rounded-full flex items-center justify-center text-[#7A8A76] hover:text-[#1C2B1A]"
                        >
                          {showRegPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="reg-confirm" className="block text-xs font-bold text-[#7A8A76] mb-1.5">
                        Confirm Password
                      </label>
                      <div className="flex items-center gap-2 rounded-2xl bg-[#F4F9F0] border border-[#DCEBCE] px-3.5 min-h-[48px] focus-within:border-[#7CB342]">
                        <Lock className="h-4 w-4 text-[#7A8A76] shrink-0" />
                        <input
                          id="reg-confirm"
                          type={showRegPw ? 'text' : 'password'}
                          autoComplete="new-password"
                          maxLength={128}
                          value={regConfirm}
                          onChange={(e) => setRegConfirm(e.target.value)}
                          placeholder="Repeat password"
                          className="w-full bg-transparent text-sm text-[#1C2B1A] placeholder:text-[#7A8A76]/70 focus:outline-none py-2.5"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Password strength meter paired with explicit text */}
                  <div>
                    <div className="grid grid-cols-3 gap-1.5 h-1.5">
                      {[1, 2, 3].map((step) => (
                        <div
                          key={step}
                          className={`rounded-full transition-colors ${
                            regStrength.score >= step ? regStrength.barColor : 'bg-[#E9F2E3]'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="mt-1.5 text-xs text-[#7A8A76]">{regStrength.label}</p>
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={busy}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#8DC63F] hover:bg-[#7CB342] disabled:opacity-60 py-3.5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(124,179,66,0.3)] min-h-[48px]"
                  >
                    <UserPlus className="h-4 w-4" />
                    <span>{busy ? 'Creating account...' : 'Create Account'}</span>
                  </motion.button>

                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    disabled={busy}
                    onClick={handleGoogleClick}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#F4F9F0] hover:bg-[#E9F2E3] border border-[#DCEBCE] py-3 text-sm font-bold text-[#1C2B1A] min-h-[48px]"
                  >
                    <span>Or sign up instantly with Google</span>
                  </motion.button>

                  <p className="pt-1 text-center text-xs sm:text-sm text-[#7A8A76]">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => switchMode('login')}
                      className="font-bold text-[#4E8A1F] hover:underline py-1"
                    >
                      Sign in
                    </button>
                  </p>
                </motion.form>
              )}

              {/* 3. FORGOT PASSWORD PAGE */}
              {mode === 'forgot' && (
                <motion.div
                  key="form-forgot"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.18 }}
                  className="space-y-4"
                >
                  {forgotSentTo ? (
                    <div className="space-y-4">
                      <div className="rounded-2xl bg-[#F4F9F0] border border-[#DCEBCE] p-5 space-y-2">
                        <div className="flex items-center gap-2 font-display text-lg font-bold text-[#1C2B1A]">
                          <CheckCircle2 className="h-5 w-5 text-[#7CB342]" />
                          <span>Reset email on its way</span>
                        </div>
                        <p className="text-sm text-[#495846] leading-relaxed">
                          If an account exists for <strong className="text-[#1C2B1A]">{forgotSentTo}</strong>, a password reset email has been dispatched. Open the link in your inbox—or copy the <code className="text-xs bg-white px-1.5 py-0.5 rounded">oobCode</code> from the URL—to finish resetting your password.
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setPreferCodeReset(true);
                            switchMode('reset');
                          }}
                          className="flex-1 min-w-[170px] rounded-full bg-[#8DC63F] hover:bg-[#7CB342] px-5 py-3 text-sm font-bold text-white shadow-md min-h-[48px]"
                        >
                          Enter reset code
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => setForgotSentTo(null)}
                          className="rounded-full bg-[#E9F2E3] hover:bg-[#DCEBCE] px-5 py-3 text-sm font-bold text-[#1C2B1A] min-h-[48px]"
                        >
                          Try another email
                        </button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleForgotSubmit} className="space-y-4">
                      <div>
                        <label htmlFor="forgot-email" className="block text-xs font-bold text-[#7A8A76] mb-1.5">
                          Account Email Address
                        </label>
                        <div className="flex items-center gap-2.5 rounded-2xl bg-[#F4F9F0] border border-[#DCEBCE] px-4 min-h-[48px] focus-within:border-[#7CB342]">
                          <Mail className="h-4 w-4 text-[#7A8A76] shrink-0" />
                          <input
                            id="forgot-email"
                            type="email"
                            autoComplete="email"
                            maxLength={160}
                            value={forgotEmail}
                            onChange={(e) => setForgotEmail(e.target.value)}
                            placeholder="you@example.com"
                            className="w-full bg-transparent text-sm text-[#1C2B1A] placeholder:text-[#7A8A76]/70 focus:outline-none py-2.5"
                          />
                        </div>
                      </div>

                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={busy}
                        className="w-full rounded-full bg-[#8DC63F] hover:bg-[#7CB342] disabled:opacity-60 py-3.5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(124,179,66,0.3)] min-h-[48px]"
                      >
                        {busy ? 'Sending reset link...' : 'Send Reset Link'}
                      </motion.button>
                    </form>
                  )}

                  <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm text-[#7A8A76]">
                    <button
                      type="button"
                      onClick={() => switchMode('login')}
                      className="font-bold text-[#4E8A1F] hover:underline py-1"
                    >
                      Back to Sign In
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPreferCodeReset(true);
                        switchMode('reset');
                      }}
                      className="font-semibold text-[#1C2B1A] hover:underline py-1"
                    >
                      Already have a reset code?
                    </button>
                  </div>
                </motion.div>
              )}

              {/* 4. PASSWORD RESET PAGE */}
              {mode === 'reset' && (
                <motion.div
                  key="form-reset"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.18 }}
                  className="space-y-4"
                >
                  {resetCompleted ? (
                    <div className="space-y-4">
                      <div className="rounded-2xl bg-[#F4F9F0] border border-[#DCEBCE] p-5 space-y-2">
                        <div className="flex items-center gap-2 font-display text-lg font-bold text-[#1C2B1A]">
                          <CheckCircle2 className="h-5 w-5 text-[#7CB342]" />
                          <span>Password updated!</span>
                        </div>
                        <p className="text-sm text-[#495846] leading-relaxed">
                          Your new password is active. You can sign in right away with your updated credentials.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => switchMode('login')}
                        className="w-full rounded-full bg-[#8DC63F] hover:bg-[#7CB342] py-3.5 text-sm font-bold text-white shadow-md min-h-[48px]"
                      >
                        Go to Sign In
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleResetSubmit} className="space-y-4">
                      {currentUser && hasPasswordProvider && (
                        <div className="flex items-center justify-between gap-2 rounded-2xl bg-[#F4F9F0] px-4 py-3 text-xs">
                          <span className="text-[#495846]">
                            {preferCodeReset
                              ? 'Using email reset code'
                              : `Updating password for ${currentUser.email}`}
                          </span>
                          <button
                            type="button"
                            onClick={() => setPreferCodeReset((v) => !v)}
                            className="font-bold text-[#4E8A1F] hover:underline shrink-0"
                          >
                            {preferCodeReset ? 'Use current session' : 'Use reset code instead'}
                          </button>
                        </div>
                      )}

                      {(!currentUser || !hasPasswordProvider || preferCodeReset) && (
                        <div>
                          <label htmlFor="reset-code" className="block text-xs font-bold text-[#7A8A76] mb-1.5">
                            Password Reset Code
                          </label>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 flex items-center gap-2 rounded-2xl bg-[#F4F9F0] border border-[#DCEBCE] px-4 min-h-[48px] focus-within:border-[#7CB342]">
                              <KeyRound className="h-4 w-4 text-[#7A8A76] shrink-0" />
                              <input
                                id="reset-code"
                                type="text"
                                maxLength={256}
                                value={resetCode}
                                onChange={(e) => {
                                  setResetCode(e.target.value);
                                  setVerifiedResetEmail(null);
                                }}
                                placeholder="Paste code from reset link"
                                className="w-full bg-transparent text-sm text-[#1C2B1A] placeholder:text-[#7A8A76]/70 focus:outline-none py-2.5"
                              />
                            </div>
                            <button
                              type="button"
                              disabled={verifyingCode || !resetCode.trim()}
                              onClick={handleVerifyManualCode}
                              className="rounded-full bg-[#E9F2E3] hover:bg-[#DCEBCE] disabled:opacity-50 px-4 py-2.5 text-xs font-bold text-[#1C2B1A] min-h-[48px] shrink-0"
                            >
                              {verifyingCode ? 'Checking...' : 'Verify Code'}
                            </button>
                          </div>
                          {verifiedResetEmail && (
                            <p className="mt-1.5 text-xs font-semibold text-[#4E8A1F]">
                              Verified account: {verifiedResetEmail}
                            </p>
                          )}
                        </div>
                      )}

                      <div>
                        <label htmlFor="reset-new-pw" className="block text-xs font-bold text-[#7A8A76] mb-1.5">
                          New Password
                        </label>
                        <div className="flex items-center gap-2.5 rounded-2xl bg-[#F4F9F0] border border-[#DCEBCE] px-4 min-h-[48px] focus-within:border-[#7CB342]">
                          <Lock className="h-4 w-4 text-[#7A8A76] shrink-0" />
                          <input
                            id="reset-new-pw"
                            type={showNewPw ? 'text' : 'password'}
                            autoComplete="new-password"
                            maxLength={128}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="At least 6 characters"
                            className="w-full bg-transparent text-sm text-[#1C2B1A] placeholder:text-[#7A8A76]/70 focus:outline-none py-2.5"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPw((s) => !s)}
                            aria-label={showNewPw ? 'Hide password' : 'Show password'}
                            className="h-9 w-9 rounded-full flex items-center justify-center text-[#7A8A76] hover:text-[#1C2B1A]"
                          >
                            {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label htmlFor="reset-confirm-pw" className="block text-xs font-bold text-[#7A8A76] mb-1.5">
                          Confirm New Password
                        </label>
                        <div className="flex items-center gap-2.5 rounded-2xl bg-[#F4F9F0] border border-[#DCEBCE] px-4 min-h-[48px] focus-within:border-[#7CB342]">
                          <Lock className="h-4 w-4 text-[#7A8A76] shrink-0" />
                          <input
                            id="reset-confirm-pw"
                            type={showNewPw ? 'text' : 'password'}
                            autoComplete="new-password"
                            maxLength={128}
                            value={confirmNewPw}
                            onChange={(e) => setConfirmNewPw(e.target.value)}
                            placeholder="Repeat new password"
                            className="w-full bg-transparent text-sm text-[#1C2B1A] placeholder:text-[#7A8A76]/70 focus:outline-none py-2.5"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="grid grid-cols-3 gap-1.5 h-1.5">
                          {[1, 2, 3].map((step) => (
                            <div
                              key={step}
                              className={`rounded-full transition-colors ${
                                resetStrength.score >= step ? resetStrength.barColor : 'bg-[#E9F2E3]'
                              }`}
                            />
                          ))}
                        </div>
                        <p className="mt-1.5 text-xs text-[#7A8A76]">{resetStrength.label}</p>
                      </div>

                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={busy}
                        className="w-full rounded-full bg-[#8DC63F] hover:bg-[#7CB342] disabled:opacity-60 py-3.5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(124,179,66,0.3)] min-h-[48px]"
                      >
                        {busy ? 'Updating password...' : 'Save New Password'}
                      </motion.button>

                      <div className="pt-1 flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm text-[#7A8A76]">
                        <button
                          type="button"
                          onClick={() => switchMode('forgot')}
                          className="inline-flex items-center gap-1 font-bold text-[#4E8A1F] hover:underline py-1"
                        >
                          <ArrowLeft className="h-3.5 w-3.5" />
                          <span>Back to Forgot Password</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => switchMode('login')}
                          className="font-semibold text-[#1C2B1A] hover:underline py-1"
                        >
                          Back to Sign In
                        </button>
                      </div>
                    </form>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </div>
    </motion.div>
  );
};
