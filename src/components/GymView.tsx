import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Dumbbell, Flame, Drumstick, Leaf, ArrowRight } from 'lucide-react';
import { CountryCode, GymGoal, Recipe } from '../types';
import { getRecipeEstimatedCost } from '../data/recipes';
import { formatCurrency } from '../data/prices';
import { PlateFoodPhoto } from './PlateFoodPhoto';
import { CountUpNumber } from './CountUpNumber';

interface GymViewProps {
  recipes: Recipe[];
  country: CountryCode;
  savedGym: { weightKg: number; goal: GymGoal };
  onSaveGym: (val: { weightKg: number; goal: GymGoal }) => void;
  onOpenRecipe: (recipe: Recipe) => void;
}

export const GymView: React.FC<GymViewProps> = ({
  recipes,
  country,
  savedGym,
  onSaveGym,
  onOpenRecipe,
}) => {
  const [unit, setUnit] = useState<'kg' | 'lb'>('kg');
  const [weightInput, setWeightInput] = useState<string>(String(savedGym.weightKg || 72));
  const [goal, setGoal] = useState<GymGoal>(savedGym.goal || 'build');

  const weightKg = useMemo(() => {
    const raw = Math.max(30, Number(weightInput) || 70);
    return unit === 'kg' ? raw : raw * 0.453592;
  }, [weightInput, unit]);

  const targets = useMemo(() => {
    let minFactor = 1.8;
    let maxFactor = 2.2;
    let calMult = 35;

    if (goal === 'maintain') {
      minFactor = 1.4;
      maxFactor = 1.7;
      calMult = 30;
    } else if (goal === 'lose') {
      minFactor = 1.8;
      maxFactor = 2.1;
      calMult = 25;
    }

    const proteinMin = Math.round(weightKg * minFactor);
    const proteinMax = Math.round(weightKg * maxFactor);
    const proteinMid = Math.round((proteinMin + proteinMax) / 2);
    const calories = Math.round(weightKg * calMult);

    return { proteinMin, proteinMax, proteinMid, calories };
  }, [weightKg, goal]);

  const handleGoalChange = (nextGoal: GymGoal) => {
    setGoal(nextGoal);
    const safeKg = Math.max(30, Math.min(250, Math.round(weightKg)));
    onSaveGym({ weightKg: safeKg, goal: nextGoal });
  };

  const handleWeightChange = (val: string) => {
    setWeightInput(val);
    const rawNum = Number(val);
    const num = Number.isFinite(rawNum) && rawNum > 0 ? rawNum : 70;
    const kg = unit === 'kg' ? num : num * 0.453592;
    const safeKg = Math.max(30, Math.min(250, Math.round(kg)));
    onSaveGym({ weightKg: safeKg, goal });
  };

  const gymMeals = useMemo(() => {
    return recipes
      .filter((r) => r.isGym || r.protein >= 20)
      .sort((a, b) => b.protein - a.protein);
  }, [recipes]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className="pb-28 pt-5 px-4 sm:px-6 max-w-5xl mx-auto relative z-10"
    >
      <div className="flex items-center gap-3">
        <span className="h-11 w-11 rounded-full bg-[#7CB342] text-white flex items-center justify-center shadow-md shrink-0">
          <Dumbbell className="h-5 w-5" />
        </span>
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#1C2B1A]">
            Gym & Protein Guide
          </h1>
          <p className="text-sm text-[#7A8A76]">
            Daily protein target calculator + high-protein meals for muscle & recovery.
          </p>
        </div>
      </div>

      {/* Protein & Calorie Calculator Card */}
      <div className="mt-5 fresh-card p-5 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="gym-weight" className="text-xs font-bold text-[#7A8A76]">
                Body Weight
              </label>
              <div className="inline-flex rounded-full bg-[#E9F2E3] p-1">
                {(['kg', 'lb'] as const).map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => {
                      if (u !== unit) {
                        const current = Number(weightInput) || 70;
                        const converted =
                          u === 'lb' ? Math.round(current * 2.20462) : Math.round(current * 0.453592);
                        setUnit(u);
                        setWeightInput(String(converted));
                      }
                    }}
                    className={`rounded-full px-3.5 py-1 text-xs font-bold transition-colors min-h-[32px] ${
                      unit === u ? 'bg-[#7CB342] text-white' : 'text-[#1C2B1A]'
                    }`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center rounded-2xl bg-[#F4F9F0] border border-[#DCEBCE] px-4 py-3">
              <input
                id="gym-weight"
                type="number"
                min={30}
                max={450}
                value={weightInput}
                onChange={(e) => handleWeightChange(e.target.value)}
                className="w-full bg-transparent font-display text-2xl font-extrabold text-[#1C2B1A] focus:outline-none tabular-nums"
              />
              <span className="text-sm font-bold text-[#7A8A76] ml-2">{unit}</span>
            </div>

            <div>
              <span className="block text-xs font-bold text-[#7A8A76] mb-1.5">Fitness Goal</span>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { id: 'build', label: 'Build Muscle' },
                    { id: 'maintain', label: 'Maintain' },
                    { id: 'lose', label: 'Lose Fat' },
                  ] as const
                ).map((g) => (
                  <motion.button
                    key={g.id}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => handleGoalChange(g.id)}
                    className={`rounded-full py-2.5 px-2 text-xs font-bold transition-colors min-h-[42px] whitespace-nowrap ${
                      goal === g.id
                        ? 'bg-[#7CB342] text-white shadow-sm'
                        : 'bg-[#E9F2E3] text-[#1C2B1A]'
                    }`}
                  >
                    {g.label}
                  </motion.button>
                ))}
              </div>
            </div>
          </div>

          {/* Daily Target Result Panel */}
          <div className="fresh-hero-gradient rounded-[22px] p-5 text-white shadow-lg">
            <div className="text-xs font-semibold text-white/85">
              Recommended Daily Targets (Est.)
            </div>
            <div className="mt-3 grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-white/85">Daily Protein</div>
                <div className="font-display text-3xl sm:text-4xl font-extrabold text-white mt-0.5">
                  <CountUpNumber value={targets.proteinMid} suffix="g" />
                </div>
                <div className="text-xs text-white/90 tabular-nums mt-0.5">
                  Range: {targets.proteinMin}–{targets.proteinMax}g / day
                </div>
              </div>
              <div>
                <div className="text-xs text-white/85">Daily Calories</div>
                <div className="font-display text-3xl sm:text-4xl font-extrabold text-white mt-0.5">
                  <CountUpNumber value={targets.calories} />
                </div>
                <div className="text-xs text-white/90 mt-0.5">kcal / day guide</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* High-Protein Meals List */}
      <div className="mt-7 flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold text-[#1C2B1A]">High-Protein Gym Meals</h2>
        <span className="text-xs font-medium text-[#7A8A76]">{gymMeals.length} meals</span>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {gymMeals.map((meal, idx) => {
          const estCost = getRecipeEstimatedCost(meal, country);
          return (
            <motion.article
              key={meal.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05, duration: 0.22 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onOpenRecipe(meal)}
              className="fresh-card p-4 flex items-center gap-4 cursor-pointer hover:shadow-[0_12px_28px_rgba(28,43,26,0.12)] transition-shadow"
            >
              <PlateFoodPhoto src={meal.image} alt={meal.title} size="md" showGarnish={false} />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#4E8A1F]">
                  <Dumbbell className="h-3.5 w-3.5" />
                  <span>High-Protein · ~{formatCurrency(estCost, country)} est.</span>
                </div>
                <h3 className="font-display text-lg font-bold text-[#1C2B1A] truncate mt-0.5">
                  {meal.title}
                </h3>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-[#1C2B1A] tabular-nums">
                  <span className="inline-flex items-center gap-1">
                    <Flame className="h-3.5 w-3.5 text-[#E4572E]" />
                    {meal.calories} kcal
                  </span>
                  <span className="inline-flex items-center gap-1 text-[#4E8A1F]">
                    <Drumstick className="h-3.5 w-3.5" />
                    {meal.protein}g protein
                  </span>
                  <span className="inline-flex items-center gap-1 text-[#7A8A76]">
                    <Leaf className="h-3.5 w-3.5 text-[#7CB342]" />
                    {meal.carbs}g carbs · {meal.fat}g fat
                  </span>
                </div>
              </div>

              <ArrowRight className="h-5 w-5 text-[#7A8A76] shrink-0" />
            </motion.article>
          );
        })}
      </div>
    </motion.div>
  );
};
