import React, { useState } from 'react';
import { motion } from 'motion/react';
import type { User } from 'firebase/auth';
import {
  AlertCircle,
  Check,
  CloudCheck,
  Copy,
  Globe2,
  Heart,
  KeyRound,
  LogIn,
  LogOut,
  RefreshCw,
  RotateCcw,
  Sparkles,
  CalendarDays,
  UserPlus,
} from 'lucide-react';
import { AuthPageMode, CountryCode } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

interface ProfileViewProps {
  country: CountryCode;
  onChangeCountry: (country: CountryCode) => void;
  favoritesCount: number;
  plannedMealsCount: number;
  onReplayOnboarding: () => void;
  onResetAllData: () => void;
  onCopySuccess: (label: string) => void;
  user: User | null;
  isSyncing: boolean;
  onSignInGoogle: () => void;
  onOpenAuth: (mode: AuthPageMode) => void;
  onSignOut: () => void;
  onResendVerification: () => void;
  onRefreshVerification: () => void;
}

const BINANCE_ID = '1139580808';
const WEB3_WALLET = '0xB27B87e0979f85221502D43277980a4d86aB2F55';

export const ProfileView: React.FC<ProfileViewProps> = ({
  country,
  onChangeCountry,
  favoritesCount,
  plannedMealsCount,
  onReplayOnboarding,
  onResetAllData,
  onCopySuccess,
  user,
  isSyncing,
  onSignInGoogle,
  onOpenAuth,
  onSignOut,
  onResendVerification,
  onRefreshVerification,
}) => {
  const [copiedId, setCopiedId] = useState<'binance' | 'web3' | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const handleCopy = async (kind: 'binance' | 'web3', value: string) => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Fallback copy via textarea if clipboard permission restricted
      const ta = document.createElement('textarea');
      ta.value = value;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopiedId(kind);
    onCopySuccess('Copied!');
    window.setTimeout(() => setCopiedId(null), 2000);
  };

  const userInitial = (user?.displayName || user?.email || 'F').trim().charAt(0).toUpperCase();
  const hasPasswordProvider = Boolean(
    user?.providerData?.some((provider) => provider.providerId === 'password')
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className="pb-28 pt-5 px-4 sm:px-6 max-w-3xl mx-auto relative z-10 space-y-5"
    >
      <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#1C2B1A]">
        Profile & Support
      </h1>

      {/* Account & Cloud Sync Card */}
      <div className="fresh-card p-5 space-y-4">
        {user ? (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User avatar'}
                    referrerPolicy="no-referrer"
                    className="h-14 w-14 rounded-full object-cover border-2 border-[#DCEBCE] shrink-0"
                  />
                ) : (
                  <div className="h-14 w-14 rounded-full bg-[#DCEBCE] text-[#4E8A1F] font-display text-xl font-extrabold flex items-center justify-center shrink-0">
                    {userInitial}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="font-display text-base sm:text-lg font-bold text-[#1C2B1A] truncate">
                    {user.displayName || 'FreshPlate User'}
                  </div>
                  <div className="text-xs text-[#7A8A76] truncate">{user.email}</div>
                  {user.emailVerified ? (
                    <div className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-[#4E8A1F]">
                      <CloudCheck className="h-3.5 w-3.5 shrink-0" />
                      <span>{isSyncing ? 'Syncing with Firestore...' : 'Synced with Firestore'}</span>
                    </div>
                  ) : (
                    <div className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-[#E4572E]">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      <span>Email not verified — cloud sync paused</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {hasPasswordProvider && (
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={() => onOpenAuth('reset')}
                    className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[#E9F2E3] hover:bg-[#DCEBCE] px-4 py-2.5 text-xs font-bold text-[#1C2B1A] min-h-[44px]"
                  >
                    <KeyRound className="h-3.5 w-3.5 text-[#4E8A1F]" />
                    <span>Change Password</span>
                  </motion.button>
                )}
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={onSignOut}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#F4F9F0] hover:bg-[#E9F2E3] px-4 py-2.5 text-xs font-bold text-[#1C2B1A] min-h-[44px]"
                >
                  <LogOut className="h-4 w-4 text-[#7A8A76]" />
                  <span>Sign out</span>
                </motion.button>
              </div>
            </div>

            {!user.emailVerified && (
              <div className="rounded-2xl bg-[#FFF9EC] border border-[#FFC53D]/40 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-xs text-[#495846] leading-relaxed">
                  Check <strong className="text-[#1C2B1A]">{user.email}</strong> for a verification link to unlock Firestore cloud backup.
                </p>
                <div className="flex flex-wrap gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={onRefreshVerification}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#8DC63F] hover:bg-[#7CB342] px-3.5 py-2 text-xs font-bold text-white min-h-[40px]"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>I&apos;ve verified</span>
                  </button>
                  <button
                    type="button"
                    onClick={onResendVerification}
                    className="rounded-full bg-white hover:bg-[#E9F2E3] px-3.5 py-2 text-xs font-bold text-[#1C2B1A] min-h-[40px]"
                  >
                    Resend email
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1">
              <h2 className="font-display text-lg font-bold text-[#1C2B1A]">
                Save & Sync Your Meal Plans
              </h2>
              <p className="text-xs text-[#7A8A76] leading-relaxed">
                Sign in or create an account to back up your 7-day planner, favorite recipes, BMI, and grocery budgets across devices.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => onOpenAuth('login')}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#8DC63F] hover:bg-[#7CB342] px-5 py-2.5 text-sm font-bold text-white shadow-[0_6px_16px_rgba(124,179,66,0.3)] min-h-[44px] whitespace-nowrap"
              >
                <LogIn className="h-4 w-4" />
                <span>Sign in</span>
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => onOpenAuth('register')}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#E9F2E3] hover:bg-[#DCEBCE] px-4 py-2.5 text-xs sm:text-sm font-bold text-[#1C2B1A] min-h-[44px] whitespace-nowrap"
              >
                <UserPlus className="h-4 w-4 text-[#4E8A1F]" />
                <span>Create account</span>
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={onSignInGoogle}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#F4F9F0] hover:bg-[#E9F2E3] border border-[#DCEBCE] px-4 py-2.5 text-xs sm:text-sm font-bold text-[#1C2B1A] min-h-[44px] whitespace-nowrap"
              >
                <span>Google Sign-In</span>
              </motion.button>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-[#7A8A76]">
              <button
                type="button"
                onClick={() => onOpenAuth('forgot')}
                className="font-semibold text-[#4E8A1F] hover:underline py-1"
              >
                Forgot password?
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Quick Activity Stats */}
      <div className="grid grid-cols-2 gap-3.5">
        <div className="fresh-card p-4 flex items-center gap-3">
          <span className="h-11 w-11 rounded-full bg-[#FFF0EC] text-[#E4572E] flex items-center justify-center shrink-0">
            <Heart className="h-5 w-5 fill-[#E4572E]" />
          </span>
          <div>
            <div className="font-display text-2xl font-extrabold text-[#1C2B1A] tabular-nums">
              {favoritesCount}
            </div>
            <div className="text-xs font-medium text-[#7A8A76]">Saved Recipes</div>
          </div>
        </div>
        <div className="fresh-card p-4 flex items-center gap-3">
          <span className="h-11 w-11 rounded-full bg-[#E9F2E3] text-[#4E8A1F] flex items-center justify-center shrink-0">
            <CalendarDays className="h-5 w-5" />
          </span>
          <div>
            <div className="font-display text-2xl font-extrabold text-[#1C2B1A] tabular-nums">
              {plannedMealsCount}
            </div>
            <div className="text-xs font-medium text-[#7A8A76]">Planned Meals</div>
          </div>
        </div>
      </div>

      {/* Country Selector Card */}
      <div className="fresh-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <Globe2 className="h-5 w-5 text-[#7CB342]" />
          <h2 className="font-display text-lg font-bold text-[#1C2B1A]">Shopping Country & Market</h2>
        </div>
        <p className="text-xs text-[#7A8A76] mb-3.5">
          Switch anytime — all recipe costs and budget tables update instantly.
        </p>
        <div className="grid grid-cols-2 gap-3">
          {(
            [
              { code: 'BD', title: 'Bangladesh', sub: '৳ Taka · Dhaka bazaar' },
              { code: 'US', title: 'United States', sub: '$ Dollars · Walmart' },
            ] as const
          ).map((c) => {
            const active = country === c.code;
            return (
              <motion.button
                key={c.code}
                whileTap={{ scale: 0.96 }}
                onClick={() => onChangeCountry(c.code)}
                className={`rounded-2xl p-3.5 text-left transition-all flex items-center justify-between gap-2 min-h-[60px] ${
                  active
                    ? 'bg-[#7CB342] text-white shadow-md'
                    : 'bg-[#F4F9F0] text-[#1C2B1A] hover:bg-[#E9F2E3]'
                }`}
              >
                <div>
                  <div className="font-display text-sm font-bold">{c.title}</div>
                  <div className={`text-xs ${active ? 'text-white/90' : 'text-[#7A8A76]'}`}>
                    {c.sub}
                  </div>
                </div>
                {active && (
                  <span className="h-6 w-6 rounded-full bg-white text-[#7CB342] flex items-center justify-center shrink-0">
                    <Check className="h-3.5 w-3.5 stroke-[3]" />
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* PWA Install Card */}
      <div className="fresh-card p-5 space-y-3">
        <h2 className="font-display text-lg font-bold text-[#1C2B1A]">Install on Your Phone</h2>
        <p className="text-xs text-[#7A8A76]">
          Add FreshPlate to your home screen for instant offline access without an app store.
        </p>
        <PWAInstallButton variant="card" />
      </div>

      {/* Free Forever + Support This App Card */}
      <div className="fresh-card p-5 sm:p-6 bg-[#FFF9EC] space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-[#7CB342]" />
          <h2 className="font-display text-xl font-bold text-[#1C2B1A]">Support this app</h2>
        </div>

        <p className="text-sm text-[#1C2B1A] leading-relaxed">
          This app is free forever. If it helped you, you can support it here — totally optional.
        </p>

        {/* Donation Card 1: Binance ID */}
        <div className="rounded-2xl bg-white p-4 shadow-sm flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs font-semibold text-[#7A8A76]">Binance ID</div>
            <div className="font-display text-base font-bold text-[#1C2B1A] tabular-nums select-all">
              {BINANCE_ID}
            </div>
          </div>
          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={() => handleCopy('binance', BINANCE_ID)}
            className={`rounded-full px-4 py-2 text-xs font-bold flex items-center gap-1.5 transition-colors min-h-[40px] shrink-0 ${
              copiedId === 'binance'
                ? 'bg-[#7CB342] text-white'
                : 'bg-[#E9F2E3] text-[#1C2B1A] hover:bg-[#DCEBCE]'
            }`}
          >
            {copiedId === 'binance' ? (
              <>
                <Check className="h-4 w-4 stroke-[3]" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy</span>
              </>
            )}
          </motion.button>
        </div>

        {/* Donation Card 2: Web3 Wallet */}
        <div className="rounded-2xl bg-white p-4 shadow-sm flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold text-[#7A8A76]">Web3 wallet</div>
            <div className="font-mono text-xs sm:text-sm font-semibold text-[#1C2B1A] truncate select-all">
              {WEB3_WALLET}
            </div>
          </div>
          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={() => handleCopy('web3', WEB3_WALLET)}
            className={`rounded-full px-4 py-2 text-xs font-bold flex items-center gap-1.5 transition-colors min-h-[40px] shrink-0 ${
              copiedId === 'web3'
                ? 'bg-[#7CB342] text-white'
                : 'bg-[#E9F2E3] text-[#1C2B1A] hover:bg-[#DCEBCE]'
            }`}
          >
            {copiedId === 'web3' ? (
              <>
                <Check className="h-4 w-4 stroke-[3]" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy</span>
              </>
            )}
          </motion.button>
        </div>
      </div>

      {/* Preferences & Reset */}
      <div className="fresh-card p-5 flex flex-wrap items-center justify-between gap-3">
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={onReplayOnboarding}
          className="rounded-full bg-[#E9F2E3] hover:bg-[#DCEBCE] px-4 py-2.5 text-xs font-bold text-[#1C2B1A] min-h-[42px]"
        >
          Replay 3D Welcome Tour
        </motion.button>

        {!confirmReset ? (
          <button
            onClick={() => setConfirmReset(true)}
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-xs font-bold text-[#E4572E] hover:bg-[#FFF0EC] min-h-[42px]"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset saved data</span>
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onResetAllData();
                setConfirmReset(false);
              }}
              className="rounded-full bg-[#E4572E] px-4 py-2 text-xs font-bold text-white min-h-[40px]"
            >
              Confirm reset
            </button>
            <button
              onClick={() => setConfirmReset(false)}
              className="rounded-full bg-[#E9F2E3] px-3 py-2 text-xs font-bold text-[#1C2B1A] min-h-[40px]"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};
