import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, Dumbbell, Scale } from 'lucide-react';
import {
  AuthPageMode,
  BmiInputs,
  CountryCode,
  DayOfWeek,
  GymGoal,
  MealSlot,
  Recipe,
  ScreenFlow,
  TabId,
  WeeklyPlan,
} from './types';
import { RECIPES } from './data/recipes';
import { useLocalStorage } from './hooks/useLocalStorage';
import { LocalUserData, useFirebaseSync } from './hooks/useFirebaseSync';
import {
  applyEmailActionCode,
  getFirebaseAuthErrorMessage,
  resendVerificationEmail,
  signInWithGoogle,
  signOutFromFirebase,
} from './firebase';
import { FreshBackground } from './components/FreshBackground';
import { SplashScreen } from './components/SplashScreen';
import { OnboardingScreen } from './components/OnboardingScreen';
import { CountrySelectScreen } from './components/CountrySelectScreen';
import { AuthPages } from './components/AuthPages';
import { HomeView } from './components/HomeView';
import { RecipeDetailView } from './components/RecipeDetailView';
import { WeeklyPlannerView } from './components/WeeklyPlannerView';
import { BudgetView } from './components/BudgetView';
import { BmiView } from './components/BmiView';
import { GymView } from './components/GymView';
import { ProfileView } from './components/ProfileView';
import { BottomNav } from './components/BottomNav';
import { OfflineBanner } from './components/PWAInstallButton';

const EMPTY_PLAN: WeeklyPlan = {
  Monday: {},
  Tuesday: {},
  Wednesday: {},
  Thursday: {},
  Friday: {},
  Saturday: {},
  Sunday: {},
};

const DEFAULT_BMI: BmiInputs = {
  unit: 'metric',
  cm: 172,
  kg: 70,
  feet: 5,
  inches: 8,
  lbs: 154,
};

const clampNum = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, Number.isFinite(n) ? n : min));

export default function App() {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useLocalStorage<boolean>(
    'mp_onboarded_v1',
    false
  );
  const [savedCountry, setSavedCountry] = useLocalStorage<CountryCode | null>(
    'mp_country_v1',
    null
  );
  const [favorites, setFavorites] = useLocalStorage<string[]>('mp_favorites_v1', ['fresh-salad']);
  const [weeklyPlan, setWeeklyPlan] = useLocalStorage<WeeklyPlan>('mp_weekly_plan_v1', EMPTY_PLAN);
  const [savedBudgetUs, setSavedBudgetUs] = useLocalStorage('mp_budget_us_v1', {
    amount: 100,
    period: 'week' as 'week' | 'month',
    people: 4,
  });
  const [savedBudgetBd, setSavedBudgetBd] = useLocalStorage('mp_budget_bd_v1', {
    amount: 5000,
    period: 'week' as 'week' | 'month',
    people: 4,
  });
  const [savedBmi, setSavedBmi] = useLocalStorage<BmiInputs>('mp_bmi_v1', DEFAULT_BMI);
  const [savedGym, setSavedGym] = useLocalStorage<{ weightKg: number; goal: GymGoal }>(
    'mp_gym_v1',
    { weightKg: 72, goal: 'build' }
  );

  const urlParams = new URLSearchParams(window.location.search);
  const urlResetCode =
    urlParams.get('mode') === 'resetPassword' ? urlParams.get('oobCode') : null;

  const [screen, setScreen] = useState<ScreenFlow>(urlResetCode ? 'auth' : 'splash');
  const [authMode, setAuthMode] = useState<AuthPageMode>(urlResetCode ? 'reset' : 'login');
  const [pendingOobCode, setPendingOobCode] = useState<string | null>(urlResetCode);
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [wellnessMode, setWellnessMode] = useState<'gym' | 'bmi'>('gym');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isTransitionLoading, setIsTransitionLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const gymSyncTimerRef = useRef<number | null>(null);

  const country: CountryCode = savedCountry ?? 'US';

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => {
      setToast((curr) => (curr === msg ? null : curr));
    }, 2600);
  }, []);

  const handleHydrateFromCloud = useCallback(
    (cloudData: Partial<LocalUserData>) => {
      if (cloudData.country !== undefined) setSavedCountry(cloudData.country);
      if (cloudData.favorites !== undefined) setFavorites(cloudData.favorites);
      if (cloudData.weeklyPlan !== undefined) setWeeklyPlan(cloudData.weeklyPlan);
      if (cloudData.savedBmi !== undefined) setSavedBmi(cloudData.savedBmi);
      if (cloudData.savedGym !== undefined) setSavedGym(cloudData.savedGym);
      if (cloudData.savedBudgetUs !== undefined) setSavedBudgetUs(cloudData.savedBudgetUs);
      if (cloudData.savedBudgetBd !== undefined) setSavedBudgetBd(cloudData.savedBudgetBd);
    },
    [
      setSavedCountry,
      setFavorites,
      setWeeklyPlan,
      setSavedBmi,
      setSavedGym,
      setSavedBudgetUs,
      setSavedBudgetBd,
    ]
  );

  const {
    user,
    isSyncing,
    refreshVerification,
    syncProfileFields,
    syncMealSlot,
    deleteMealSlot,
    syncResetAll,
  } = useFirebaseSync({
    localData: {
      country,
      favorites,
      weeklyPlan,
      savedBudgetUs,
      savedBudgetBd,
      savedBmi,
      savedGym,
    },
    onHydrateFromCloud: handleHydrateFromCloud,
    onSyncNotice: showToast,
  });

  // Detect Firebase email verification link (?mode=verifyEmail&oobCode=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');
    const oobCode = params.get('oobCode');

    if (mode === 'verifyEmail' && oobCode) {
      void applyEmailActionCode(oobCode)
        .then(async () => {
          await refreshVerification();
          window.history.replaceState({}, '', window.location.pathname);
          showToast('Email verified — cloud sync enabled!');
        })
        .catch((err) => {
          showToast(getFirebaseAuthErrorMessage(err));
        });
    }
  }, [refreshVerification, showToast]);

  const openAuthPage = (mode: AuthPageMode) => {
    setAuthMode(mode);
    setScreen('auth');
  };

  const exitAuthToApp = () => {
    if (!hasCompletedOnboarding) {
      setScreen('onboarding');
    } else if (!savedCountry) {
      setScreen('country');
    } else {
      setScreen('app');
    }
  };

  const handleGoogleSignIn = async () => {
    const signedInUser = await signInWithGoogle();
    const firstName = signedInUser.displayName?.split(/\s+/)[0] || 'friend';
    showToast(`Signed in as ${firstName}`);
    exitAuthToApp();
  };

  const handleGoogleSignInFromProfile = async () => {
    try {
      await handleGoogleSignIn();
    } catch (err: unknown) {
      showToast(getFirebaseAuthErrorMessage(err));
    }
  };

  const handleGoogleSignOut = async () => {
    try {
      await signOutFromFirebase();
      showToast('Signed out — local data stays saved');
    } catch (err) {
      console.error('Sign-out failed:', err);
      showToast('Could not sign out right now');
    }
  };

  const handleResendVerification = async () => {
    try {
      await resendVerificationEmail();
      showToast('Verification email sent!');
    } catch (err) {
      showToast(getFirebaseAuthErrorMessage(err));
    }
  };

  const handleRefreshVerification = async () => {
    try {
      const ok = await refreshVerification();
      showToast(
        ok
          ? 'Email verified — cloud sync enabled!'
          : 'Not verified yet — click the link in your email first.'
      );
    } catch (err) {
      showToast(getFirebaseAuthErrorMessage(err));
    }
  };

  const handleSplashDone = () => {
    if (pendingOobCode) {
      setScreen('auth');
    } else if (!hasCompletedOnboarding) {
      setScreen('onboarding');
    } else if (!savedCountry) {
      setScreen('country');
    } else {
      setScreen('app');
    }
  };

  const handleGetStarted = () => {
    setHasCompletedOnboarding(true);
    if (!savedCountry) {
      setScreen('country');
    } else {
      setScreen('app');
    }
  };

  const handleSelectCountry = (code: CountryCode) => {
    setSavedCountry(code);
    void syncProfileFields({ country: code });
    setIsTransitionLoading(true);
    setScreen('app');
    setActiveTab('home');
    window.setTimeout(() => setIsTransitionLoading(false), 260);
  };

  const toggleFavorite = (id: string) => {
    const nextFavorites = favorites.includes(id)
      ? favorites.filter((item) => item !== id)
      : [...favorites, id].slice(0, 50);
    setFavorites(nextFavorites);
    void syncProfileFields({ favoriteRecipeIds: nextFavorites });
  };

  const handleAssignMeal = (
    day: DayOfWeek,
    slot: MealSlot,
    recipeId: string,
    servings: number
  ) => {
    const safeServings = clampNum(Math.round(servings), 1, 12);
    setWeeklyPlan((prev) => ({
      ...prev,
      [day]: {
        ...(prev[day] || {}),
        [slot]: { recipeId, servings: safeServings },
      },
    }));
    void syncMealSlot(day, slot, recipeId, safeServings);
    showToast(`Added to ${day} ${slot}`);
  };

  const handleRemoveMeal = (day: DayOfWeek, slot: MealSlot) => {
    setWeeklyPlan((prev) => {
      const nextDay = { ...(prev[day] || {}) };
      delete nextDay[slot];
      return { ...prev, [day]: nextDay };
    });
    void deleteMealSlot(day, slot);
    showToast(`Removed from ${day} ${slot}`);
  };

  const handleSaveBudget = (val: { amount: number; period: 'week' | 'month'; people: number }) => {
    if (country === 'BD') {
      const clamped = {
        amount: clampNum(val.amount, 500, 5000000),
        period: val.period,
        people: clampNum(Math.round(val.people), 1, 12),
      };
      setSavedBudgetBd(clamped);
      void syncProfileFields({
        budgetBdAmount: clamped.amount,
        budgetBdPeriod: clamped.period,
        budgetBdPeople: clamped.people,
      });
    } else {
      const clamped = {
        amount: clampNum(val.amount, 10, 50000),
        period: val.period,
        people: clampNum(Math.round(val.people), 1, 12),
      };
      setSavedBudgetUs(clamped);
      void syncProfileFields({
        budgetUsAmount: clamped.amount,
        budgetUsPeriod: clamped.period,
        budgetUsPeople: clamped.people,
      });
    }
  };

  const handleSaveBmi = (val: BmiInputs) => {
    const clamped: BmiInputs = {
      unit: val.unit === 'imperial' ? 'imperial' : 'metric',
      cm: clampNum(val.cm, 100, 240),
      kg: clampNum(val.kg, 25, 250),
      feet: clampNum(val.feet, 3, 8),
      inches: clampNum(val.inches, 0, 11),
      lbs: clampNum(val.lbs, 55, 550),
    };
    setSavedBmi(clamped);
    void syncProfileFields({
      bmiUnit: clamped.unit,
      bmiCm: clamped.cm,
      bmiKg: clamped.kg,
      bmiFeet: clamped.feet,
      bmiInches: clamped.inches,
      bmiLbs: clamped.lbs,
    });
  };

  const handleSaveGym = (val: { weightKg: number; goal: GymGoal }) => {
    const clamped = {
      weightKg: clampNum(Math.round(val.weightKg), 30, 250),
      goal: val.goal,
    };
    setSavedGym(clamped);
    if (gymSyncTimerRef.current) {
      window.clearTimeout(gymSyncTimerRef.current);
    }
    gymSyncTimerRef.current = window.setTimeout(() => {
      void syncProfileFields({
        gymWeightKg: clamped.weightKg,
        gymGoal: clamped.goal,
      });
    }, 350);
  };

  const plannedMealsCount = useMemo(() => {
    let count = 0;
    for (const day of Object.keys(weeklyPlan) as DayOfWeek[]) {
      const slots = weeklyPlan[day];
      if (!slots) continue;
      if (slots.breakfast) count++;
      if (slots.lunch) count++;
      if (slots.dinner) count++;
    }
    return count;
  }, [weeklyPlan]);

  const handleResetAll = () => {
    const defaultUs = { amount: 100, period: 'week' as const, people: 4 };
    const defaultBd = { amount: 5000, period: 'week' as const, people: 4 };
    const defaultGym = { weightKg: 72, goal: 'build' as GymGoal };
    setFavorites(['fresh-salad']);
    setWeeklyPlan(EMPTY_PLAN);
    setSavedBmi(DEFAULT_BMI);
    setSavedGym(defaultGym);
    setSavedBudgetUs(defaultUs);
    setSavedBudgetBd(defaultBd);
    void syncResetAll({
      country,
      favorites: ['fresh-salad'],
      weeklyPlan: EMPTY_PLAN,
      savedBudgetUs: defaultUs,
      savedBudgetBd: defaultBd,
      savedBmi: DEFAULT_BMI,
      savedGym: defaultGym,
    });
    showToast('Saved data reset');
  };

  return (
    <div className="min-h-screen w-full relative text-[#1C2B1A] selection:bg-[#8DC63F]/30">
      <OfflineBanner />

      {screen === 'app' || screen === 'country' || screen === 'auth' ? <FreshBackground /> : null}

      <AnimatePresence mode="wait">
        {screen === 'splash' && (
          <SplashScreen key="splash" onComplete={handleSplashDone} />
        )}

        {screen === 'onboarding' && (
          <OnboardingScreen key="onboarding" onGetStarted={handleGetStarted} />
        )}

        {screen === 'country' && (
          <CountrySelectScreen
            key="country"
            currentCountry={savedCountry}
            onSelectCountry={handleSelectCountry}
          />
        )}

        {screen === 'auth' && (
          <AuthPages
            key="auth"
            mode={authMode}
            onChangeMode={setAuthMode}
            onBackToApp={exitAuthToApp}
            onAuthSuccess={(msg) => {
              showToast(msg);
              exitAuthToApp();
            }}
            onGoogleSignIn={handleGoogleSignIn}
            initialOobCode={pendingOobCode}
            onClearOobCode={() => {
              setPendingOobCode(null);
              window.history.replaceState({}, '', window.location.pathname);
            }}
            currentUser={user}
            onRefreshVerification={refreshVerification}
          />
        )}

        {screen === 'app' && (
          <motion.div
            key="app-shell"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className={`min-h-screen relative z-10 ${
              selectedRecipe || isTransitionLoading ? '' : 'pt-[68px]'
            }`}
          >
            {isTransitionLoading ? (
              /* Soft green shimmer skeleton (never a spinner on white screen) */
              <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 space-y-5">
                <div className="h-8 w-44 rounded-full fresh-shimmer" />
                <div className="h-12 w-3/4 rounded-3xl fresh-shimmer" />
                <div className="h-40 w-full rounded-[24px] fresh-shimmer" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((n) => (
                    <div key={n} className="h-52 rounded-[24px] fresh-shimmer" />
                  ))}
                </div>
              </div>
            ) : selectedRecipe ? (
              <RecipeDetailView
                recipe={selectedRecipe}
                country={country}
                isFavorite={favorites.includes(selectedRecipe.id)}
                onToggleFavorite={() => toggleFavorite(selectedRecipe.id)}
                onBack={() => setSelectedRecipe(null)}
                onAddToPlanner={(day, slot, servings) =>
                  handleAssignMeal(day, slot, selectedRecipe.id, servings)
                }
              />
            ) : (
              <>
                <AnimatePresence mode="wait">
                  {activeTab === 'home' && (
                    <HomeView
                      key="tab-home"
                      recipes={RECIPES}
                      country={country}
                      favorites={favorites}
                      onToggleFavorite={toggleFavorite}
                      onOpenRecipe={(r) => setSelectedRecipe(r)}
                      onGoToPlanner={() => setActiveTab('planner')}
                      onGoToBudget={() => setActiveTab('budget')}
                      onGoToBmi={() => {
                        setWellnessMode('bmi');
                        setActiveTab('gym');
                      }}
                      onGoToProfile={() => setActiveTab('profile')}
                      user={user}
                      onSignIn={() => openAuthPage('login')}
                    />
                  )}

                  {activeTab === 'planner' && (
                    <WeeklyPlannerView
                      key="tab-planner"
                      recipes={RECIPES}
                      country={country}
                      weeklyPlan={weeklyPlan}
                      onAssignMeal={handleAssignMeal}
                      onRemoveMeal={handleRemoveMeal}
                      onOpenRecipe={(r) => setSelectedRecipe(r)}
                      onBrowseRecipes={() => setActiveTab('home')}
                    />
                  )}

                  {activeTab === 'budget' && (
                    <BudgetView
                      key={`tab-budget-${country}`}
                      country={country}
                      savedBudget={country === 'BD' ? savedBudgetBd : savedBudgetUs}
                      onSaveBudget={handleSaveBudget}
                    />
                  )}

                  {activeTab === 'gym' && (
                    <div key="tab-gym">
                      {/* Wellness Switcher: Gym & Protein | BMI Checker */}
                      <div className="pt-5 px-4 sm:px-6 max-w-5xl mx-auto relative z-10">
                        <div className="inline-flex rounded-full bg-white p-1.5 shadow-[0_6px_18px_rgba(28,43,26,0.08)]">
                          <button
                            onClick={() => setWellnessMode('gym')}
                            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs sm:text-sm font-bold transition-colors min-h-[40px] ${
                              wellnessMode === 'gym'
                                ? 'bg-[#7CB342] text-white shadow-sm'
                                : 'text-[#7A8A76] hover:text-[#1C2B1A]'
                            }`}
                          >
                            <Dumbbell className="h-4 w-4" />
                            <span>Gym & Protein</span>
                          </button>
                          <button
                            onClick={() => setWellnessMode('bmi')}
                            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs sm:text-sm font-bold transition-colors min-h-[40px] ${
                              wellnessMode === 'bmi'
                                ? 'bg-[#7CB342] text-white shadow-sm'
                                : 'text-[#7A8A76] hover:text-[#1C2B1A]'
                            }`}
                          >
                            <Scale className="h-4 w-4" />
                            <span>BMI Checker</span>
                          </button>
                        </div>
                      </div>

                      {wellnessMode === 'gym' ? (
                        <GymView
                          recipes={RECIPES}
                          country={country}
                          savedGym={savedGym}
                          onSaveGym={handleSaveGym}
                          onOpenRecipe={(r) => setSelectedRecipe(r)}
                        />
                      ) : (
                        <BmiView savedBmi={savedBmi} onSaveBmi={handleSaveBmi} />
                      )}
                    </div>
                  )}

                  {activeTab === 'profile' && (
                    <ProfileView
                      key="tab-profile"
                      country={country}
                      onChangeCountry={(c) => {
                        setSavedCountry(c);
                        void syncProfileFields({ country: c });
                        showToast(
                          c === 'BD'
                            ? 'Switched to Bangladesh (৳ Dhaka bazaar)'
                            : 'Switched to United States ($ Walmart)'
                        );
                      }}
                      favoritesCount={favorites.length}
                      plannedMealsCount={plannedMealsCount}
                      onReplayOnboarding={() => setScreen('onboarding')}
                      onResetAllData={handleResetAll}
                      onCopySuccess={(msg) => showToast(msg)}
                      user={user}
                      isSyncing={isSyncing}
                      onSignInGoogle={handleGoogleSignInFromProfile}
                      onOpenAuth={openAuthPage}
                      onSignOut={handleGoogleSignOut}
                      onResendVerification={handleResendVerification}
                      onRefreshVerification={handleRefreshVerification}
                    />
                  )}
                </AnimatePresence>

                <BottomNav
                  activeTab={activeTab}
                  onSelectTab={(tab) => {
                    setSelectedRecipe(null);
                    setActiveTab(tab);
                  }}
                  plannedCount={plannedMealsCount}
                />
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.94 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-full bg-[#1C2B1A] text-white px-5 py-2.5 text-xs sm:text-sm font-semibold shadow-xl flex items-center gap-2 whitespace-nowrap"
          >
            <CheckCircle2 className="h-4 w-4 text-[#8DC63F]" />
            <span>{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
