import { useCallback, useEffect, useRef, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { RECIPES } from '../data/recipes';
import { clampNumber, isValidSafeId, sanitizeText } from '../utils/security';
import {
  BmiInputs,
  CountryCode,
  DayOfWeek,
  GymGoal,
  MealSlot,
  WeeklyPlan,
} from '../types';

const VALID_RECIPE_IDS = new Set(RECIPES.map((r) => r.id));
const ALLOWED_DAYS = new Set<DayOfWeek>([
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
]);
const ALLOWED_SLOTS = new Set<MealSlot>(['breakfast', 'lunch', 'dinner']);

export interface LocalUserData {
  country: CountryCode;
  favorites: string[];
  weeklyPlan: WeeklyPlan;
  savedBudgetUs: { amount: number; period: 'week' | 'month'; people: number };
  savedBudgetBd: { amount: number; period: 'week' | 'month'; people: number };
  savedBmi: BmiInputs;
  savedGym: { weightKg: number; goal: GymGoal };
}

interface UseFirebaseSyncParams {
  localData: LocalUserData;
  onHydrateFromCloud: (cloudData: Partial<LocalUserData>) => void;
  onSyncNotice?: (msg: string) => void;
}

const clamp = clampNumber;

function sanitizeProfilePayload(user: User, d: LocalUserData) {
  const safeName = sanitizeText(user.displayName || user.email?.split('@')[0] || 'Fresh User', 80);
  const safeEmail = sanitizeText(user.email || 'user@example.com', 160).toLowerCase();
  const safeFavorites = d.favorites
    .filter((id) => isValidSafeId(id, 64) && VALID_RECIPE_IDS.has(id))
    .slice(0, 50);

  return {
    uid: user.uid,
    displayName: safeName || 'Fresh User',
    email: safeEmail,
    country: d.country === 'BD' ? 'BD' : 'US',
    favoriteRecipeIds: safeFavorites,
    bmiUnit: d.savedBmi.unit === 'imperial' ? 'imperial' : 'metric',
    bmiCm: clamp(d.savedBmi.cm, 100, 240),
    bmiKg: clamp(d.savedBmi.kg, 25, 250),
    bmiFeet: clamp(d.savedBmi.feet, 3, 8),
    bmiInches: clamp(d.savedBmi.inches, 0, 11),
    bmiLbs: clamp(d.savedBmi.lbs, 55, 550),
    gymWeightKg: clamp(d.savedGym.weightKg, 30, 250),
    gymGoal: (['build', 'maintain', 'lose'].includes(d.savedGym.goal)
      ? d.savedGym.goal
      : 'build') as GymGoal,
    budgetUsAmount: clamp(d.savedBudgetUs.amount, 10, 50000),
    budgetUsPeriod: d.savedBudgetUs.period === 'month' ? 'month' : 'week',
    budgetUsPeople: clamp(Math.round(d.savedBudgetUs.people), 1, 12),
    budgetBdAmount: clamp(d.savedBudgetBd.amount, 500, 5000000),
    budgetBdPeriod: d.savedBudgetBd.period === 'month' ? 'month' : 'week',
    budgetBdPeople: clamp(Math.round(d.savedBudgetBd.people), 1, 12),
  };
}

export function useFirebaseSync({
  localData,
  onHydrateFromCloud,
  onSyncNotice,
}: UseFirebaseSyncParams) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const localRef = useRef(localData);
  localRef.current = localData;

  const hydrateRef = useRef(onHydrateFromCloud);
  hydrateRef.current = onHydrateFromCloud;

  const noticeRef = useRef(onSyncNotice);
  noticeRef.current = onSyncNotice;

  const attachVerifiedSync = useCallback((verifiedUser: User) => {
    const profilePath = `users/${verifiedUser.uid}`;
    const slotsPath = `users/${verifiedUser.uid}/mealSlots`;
    const profileDocRef = doc(db, 'users', verifiedUser.uid);

    let unsubProfile: (() => void) | null = null;
    let unsubSlots: (() => void) | null = null;
    let cancelled = false;

    const init = async () => {
      setIsSyncing(true);
      try {
        const snap = await getDoc(profileDocRef);
        if (cancelled) return;
        if (!snap.exists()) {
          const payload = sanitizeProfilePayload(verifiedUser, localRef.current);
          try {
            await setDoc(profileDocRef, {
              ...payload,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          } catch (err) {
            handleFirestoreError(err, OperationType.CREATE, profilePath);
          }

          // Seed any locally planned slots into Firestore subcollection
          const batch = writeBatch(db);
          let hasSlots = false;
          for (const day of Object.keys(localRef.current.weeklyPlan) as DayOfWeek[]) {
            const daySlots = localRef.current.weeklyPlan[day];
            if (!daySlots) continue;
            for (const slot of ['breakfast', 'lunch', 'dinner'] as MealSlot[]) {
              const planned = daySlots[slot];
              if (!planned) continue;
              const slotId = `${day}_${slot}`;
              batch.set(doc(db, 'users', verifiedUser.uid, 'mealSlots', slotId), {
                ownerId: verifiedUser.uid,
                day,
                slot,
                recipeId: planned.recipeId,
                servings: clamp(Math.round(planned.servings || 1), 1, 12),
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              });
              hasSlots = true;
            }
          }
          if (hasSlots) {
            try {
              await batch.commit();
            } catch (err) {
              handleFirestoreError(err, OperationType.WRITE, slotsPath);
            }
          }
          noticeRef.current?.('Saved your data to your account');
        }
      } catch (err) {
        if (err instanceof Error && err.message.startsWith('{')) {
          console.error(err.message);
        } else {
          try {
            handleFirestoreError(err, OperationType.GET, profilePath);
          } catch {
            // logged cleanly
          }
        }
      } finally {
        if (!cancelled) setIsSyncing(false);
      }

      if (cancelled) return;

      // Attach real-time listeners only after auth is ready & user email is verified
      unsubProfile = onSnapshot(
        profileDocRef,
        (docSnap) => {
          if (!docSnap.exists()) return;
          const data = docSnap.data();
          const safeFavs = Array.isArray(data.favoriteRecipeIds)
            ? data.favoriteRecipeIds
                .filter((id: unknown): id is string => isValidSafeId(String(id), 64) && VALID_RECIPE_IDS.has(String(id)))
                .slice(0, 50)
            : [];
          hydrateRef.current({
            country: data.country === 'BD' ? 'BD' : 'US',
            favorites: safeFavs,
            savedBmi: {
              unit: data.bmiUnit === 'imperial' ? 'imperial' : 'metric',
              cm: clamp(Number(data.bmiCm) || 172, 100, 240),
              kg: clamp(Number(data.bmiKg) || 70, 25, 250),
              feet: clamp(Number(data.bmiFeet) || 5, 3, 8),
              inches: clamp(Number(data.bmiInches) || 8, 0, 11),
              lbs: clamp(Number(data.bmiLbs) || 154, 55, 550),
            },
            savedGym: {
              weightKg: clamp(Number(data.gymWeightKg) || 72, 30, 250),
              goal: (['build', 'maintain', 'lose'].includes(data.gymGoal)
                ? data.gymGoal
                : 'build') as GymGoal,
            },
            savedBudgetUs: {
              amount: clamp(Number(data.budgetUsAmount) || 100, 10, 50000),
              period: data.budgetUsPeriod === 'month' ? 'month' : 'week',
              people: clamp(Math.round(Number(data.budgetUsPeople) || 4), 1, 12),
            },
            savedBudgetBd: {
              amount: clamp(Number(data.budgetBdAmount) || 5000, 500, 5000000),
              period: data.budgetBdPeriod === 'month' ? 'month' : 'week',
              people: clamp(Math.round(Number(data.budgetBdPeople) || 4), 1, 12),
            },
          });
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, profilePath);
        }
      );

      const slotsQuery = query(
        collection(db, 'users', verifiedUser.uid, 'mealSlots'),
        where('ownerId', '==', verifiedUser.uid)
      );
      unsubSlots = onSnapshot(
        slotsQuery,
        (querySnap) => {
          const nextPlan: WeeklyPlan = {
            Monday: {},
            Tuesday: {},
            Wednesday: {},
            Thursday: {},
            Friday: {},
            Saturday: {},
            Sunday: {},
          };
          querySnap.forEach((docSnap) => {
            const d = docSnap.data();
            const day = d.day as DayOfWeek;
            const slot = d.slot as MealSlot;
            const recipeId = String(d.recipeId || '');
            if (
              ALLOWED_DAYS.has(day) &&
              ALLOWED_SLOTS.has(slot) &&
              isValidSafeId(recipeId, 64) &&
              VALID_RECIPE_IDS.has(recipeId)
            ) {
              nextPlan[day][slot] = {
                recipeId,
                servings: clamp(Math.round(Number(d.servings) || 1), 1, 12),
              };
            }
          });
          hydrateRef.current({ weeklyPlan: nextPlan });
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, slotsPath);
        }
      );
    };

    void init();

    return () => {
      cancelled = true;
      unsubProfile?.();
      unsubSlots?.();
    };
  }, []);

  const syncCleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (nextUser) => {
      syncCleanupRef.current?.();
      syncCleanupRef.current = null;

      setUser(nextUser);
      setAuthReady(true);

      if (!nextUser || !nextUser.emailVerified) {
        setIsSyncing(false);
        return;
      }

      syncCleanupRef.current = attachVerifiedSync(nextUser);
    });

    return () => {
      unsubAuth();
      syncCleanupRef.current?.();
    };
  }, [attachVerifiedSync]);

  const refreshVerification = useCallback(async (): Promise<boolean> => {
    const currentUser = auth.currentUser;
    if (!currentUser) return false;
    await currentUser.reload();
    await currentUser.getIdToken(true);
    const reloaded = auth.currentUser;
    setUser(reloaded);
    if (reloaded && reloaded.emailVerified) {
      syncCleanupRef.current?.();
      syncCleanupRef.current = attachVerifiedSync(reloaded);
      return true;
    }
    return false;
  }, [attachVerifiedSync]);

  const syncProfileFields = useCallback(
    async (fields: Record<string, unknown>) => {
      const currentUser = auth.currentUser;
      if (!currentUser || !currentUser.emailVerified) return;
      const profilePath = `users/${currentUser.uid}`;
      const profileRef = doc(db, 'users', currentUser.uid);
      try {
        await updateDoc(profileRef, {
          ...fields,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, profilePath);
      }
    },
    []
  );

  const syncMealSlot = useCallback(
    async (day: DayOfWeek, slot: MealSlot, recipeId: string, servings: number) => {
      const currentUser = auth.currentUser;
      if (!currentUser || !currentUser.emailVerified) return;
      if (!ALLOWED_DAYS.has(day) || !ALLOWED_SLOTS.has(slot)) return;
      if (!isValidSafeId(recipeId, 64) || !VALID_RECIPE_IDS.has(recipeId)) return;

      const slotId = `${day}_${slot}`;
      const slotPath = `users/${currentUser.uid}/mealSlots/${slotId}`;
      const slotRef = doc(db, 'users', currentUser.uid, 'mealSlots', slotId);
      const safeServings = clamp(Math.round(servings), 1, 12);

      try {
        const snap = await getDoc(slotRef);
        if (snap.exists()) {
          await updateDoc(slotRef, {
            recipeId,
            servings: safeServings,
            updatedAt: serverTimestamp(),
          });
        } else {
          await setDoc(slotRef, {
            ownerId: currentUser.uid,
            day,
            slot,
            recipeId,
            servings: safeServings,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, slotPath);
      }
    },
    []
  );

  const deleteMealSlot = useCallback(async (day: DayOfWeek, slot: MealSlot) => {
    const currentUser = auth.currentUser;
    if (!currentUser || !currentUser.emailVerified) return;
    if (!ALLOWED_DAYS.has(day) || !ALLOWED_SLOTS.has(slot)) return;
    const slotId = `${day}_${slot}`;
    const slotPath = `users/${currentUser.uid}/mealSlots/${slotId}`;
    try {
      await deleteDoc(doc(db, 'users', currentUser.uid, 'mealSlots', slotId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, slotPath);
    }
  }, []);

  const syncResetAll = useCallback(async (defaults: LocalUserData) => {
    const currentUser = auth.currentUser;
    if (!currentUser || !currentUser.emailVerified) return;
    const profilePath = `users/${currentUser.uid}`;
    const payload = sanitizeProfilePayload(currentUser, defaults);
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        ...payload,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, profilePath);
    }

    const batch = writeBatch(db);
    for (const day of ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as DayOfWeek[]) {
      for (const slot of ['breakfast', 'lunch', 'dinner'] as MealSlot[]) {
        batch.delete(doc(db, 'users', currentUser.uid, 'mealSlots', `${day}_${slot}`));
      }
    }
    try {
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${currentUser.uid}/mealSlots`);
    }
  }, []);

  return {
    user,
    authReady,
    isSyncing,
    isEmailVerified: Boolean(user?.emailVerified),
    refreshVerification,
    syncProfileFields,
    syncMealSlot,
    deleteMealSlot,
    syncResetAll,
  };
}
