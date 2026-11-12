import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft,
  Heart,
  Flame,
  Leaf,
  Drumstick,
  Minus,
  Plus,
  Check,
  Clock,
  CalendarPlus,
  X,
} from 'lucide-react';
import { CountryCode, DayOfWeek, MealSlot, Recipe } from '../types';
import { getRecipeEstimatedCost } from '../data/recipes';
import { formatCurrency } from '../data/prices';
import { PlateFoodPhoto } from './PlateFoodPhoto';

interface RecipeDetailViewProps {
  recipe: Recipe;
  country: CountryCode;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onBack: () => void;
  onAddToPlanner: (day: DayOfWeek, slot: MealSlot, servings: number) => void;
}

const DAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const SLOTS: { id: MealSlot; label: string }[] = [
  { id: 'breakfast', label: 'Breakfast' },
  { id: 'lunch', label: 'Lunch' },
  { id: 'dinner', label: 'Dinner' },
];

export const RecipeDetailView: React.FC<RecipeDetailViewProps> = ({
  recipe,
  country,
  isFavorite,
  onToggleFavorite,
  onBack,
  onAddToPlanner,
}) => {
  const [servings, setServings] = useState<number>(recipe.servings);
  const [checkedIds, setCheckedIds] = useState<string[]>([]);
  const [showSlotPicker, setShowSlotPicker] = useState(false);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('Tuesday');
  const [selectedSlot, setSelectedSlot] = useState<MealSlot>('lunch');

  const multiplier = servings / Math.max(1, recipe.servings);
  const perServingCost = getRecipeEstimatedCost(recipe, country, 1);
  const scaledTotalCost = getRecipeEstimatedCost(recipe, country, servings);

  const toggleIngredient = (id: string) => {
    setCheckedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const formatQty = (amt: number) => {
    const val = amt * multiplier;
    if (Number.isInteger(val)) return val.toString();
    return val.toFixed(1).replace(/\.0$/, '');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 18 }}
      transition={{ duration: 0.24, ease: 'easeOut' }}
      className="min-h-screen pb-28 pt-4 px-4 sm:px-6 max-w-3xl mx-auto relative z-20"
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={onBack}
          className="h-11 w-11 rounded-full bg-white shadow-[0_6px_16px_rgba(28,43,26,0.08)] flex items-center justify-center text-[#1C2B1A]"
          aria-label="Go back"
        >
          <ChevronLeft className="h-5 w-5" />
        </motion.button>
        <span className="font-display text-base font-bold text-[#1C2B1A]">Details</span>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onToggleFavorite}
          className="h-11 w-11 rounded-full bg-white shadow-[0_6px_16px_rgba(28,43,26,0.08)] flex items-center justify-center"
          aria-label={isFavorite ? 'Remove favorite' : 'Add to favorites'}
        >
          <Heart
            className={`h-5 w-5 transition-colors ${
              isFavorite ? 'text-[#E4572E] fill-[#E4572E]' : 'text-[#7A8A76]'
            }`}
          />
        </motion.button>
      </div>

      {/* Big Circular Plated Dish Photo (shared-element scale-up feel) */}
      <motion.div
        initial={{ scale: 0.86, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.28, ease: 'easeOut' }}
        className="mt-5 flex justify-center"
      >
        <PlateFoodPhoto src={recipe.image} alt={recipe.title} size="lg" />
      </motion.div>

      {/* Main White Details Card */}
      <div className="mt-6 fresh-card p-5 sm:p-7">
        {/* Title left + Price per serving right */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl sm:text-[28px] font-bold text-[#1C2B1A] leading-tight">
              {recipe.title}
            </h1>
            <div className="mt-1 flex items-center gap-2 text-xs text-[#7A8A76]">
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-[#7CB342]" />
                {recipe.prepMinutes} min
              </span>
              <span aria-hidden="true">·</span>
              <span>{recipe.fat}g fat est.</span>
            </div>
          </div>

          <div className="text-right shrink-0">
            <div className="font-display text-2xl font-extrabold text-[#1C2B1A] tabular-nums">
              ~{formatCurrency(perServingCost, country)}
            </div>
            <div className="text-[11px] font-medium text-[#7A8A76]">est. / serving</div>
          </div>
        </div>

        {/* 3-Stat Macro Row */}
        <div className="mt-5 grid grid-cols-3 divide-x divide-[#E9F2E3] rounded-2xl bg-[#F6FAF2] py-3 px-2 text-center">
          <div className="flex items-center justify-center gap-1.5 text-xs sm:text-sm font-semibold text-[#1C2B1A] tabular-nums">
            <Flame className="h-4 w-4 text-[#E4572E] shrink-0" />
            <span>{recipe.calories} kcal</span>
          </div>
          <div className="flex items-center justify-center gap-1.5 text-xs sm:text-sm font-semibold text-[#1C2B1A] tabular-nums">
            <Leaf className="h-4 w-4 text-[#7CB342] shrink-0" />
            <span>{recipe.carbs}g Carbs</span>
          </div>
          <div className="flex items-center justify-center gap-1.5 text-xs sm:text-sm font-semibold text-[#1C2B1A] tabular-nums">
            <Drumstick className="h-4 w-4 text-[#D97706] shrink-0" />
            <span>{recipe.protein}g Protein</span>
          </div>
        </div>

        <p className="mt-4 text-sm text-[#7A8A76] leading-relaxed">{recipe.description}</p>
        <p className="mt-1 text-[11px] text-[#7A8A76]">
          Nutrition & market costs are estimates based on {country === 'BD' ? 'Dhaka bazaar' : 'Walmart US'} tables.
        </p>

        {/* Ingredients List with Checkboxes */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg font-bold text-[#1C2B1A]">Ingredients</h2>
            <span className="text-xs font-semibold text-[#4E8A1F] tabular-nums">
              For {servings} {servings === 1 ? 'serving' : 'servings'} (~{formatCurrency(scaledTotalCost, country)} est.)
            </span>
          </div>

          <ul className="divide-y divide-[#F0F5EC]">
            {recipe.ingredients.map((ing) => {
              const checked = checkedIds.includes(ing.id);
              const ingCost = (country === 'BD' ? ing.bdCostPerBase : ing.usCostPerBase) * multiplier;
              return (
                <li key={ing.id}>
                  <button
                    onClick={() => toggleIngredient(ing.id)}
                    className="w-full py-3 flex items-center justify-between gap-3 text-left min-h-[44px]"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`h-6 w-6 rounded-full flex items-center justify-center transition-colors shrink-0 ${
                          checked
                            ? 'bg-[#7CB342] text-white'
                            : 'border-2 border-[#C7D9B9] bg-white'
                        }`}
                      >
                        {checked && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                      </span>
                      <span
                        className={`text-sm font-medium transition-colors ${
                          checked ? 'line-through text-[#7A8A76]' : 'text-[#1C2B1A]'
                        }`}
                      >
                        {ing.name}
                      </span>
                    </div>

                    <div className="text-right shrink-0 tabular-nums">
                      <span className="text-sm font-semibold text-[#1C2B1A]">
                        {formatQty(ing.amount)} {ing.unit}
                      </span>
                      <span className="ml-2 text-xs text-[#7A8A76]">
                        ~{formatCurrency(ingCost, country)}
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Numbered Cooking Steps */}
        <div className="mt-7">
          <h2 className="font-display text-lg font-bold text-[#1C2B1A] mb-3">Cooking Steps</h2>
          <ol className="space-y-3">
            {recipe.steps.map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="h-7 w-7 rounded-full bg-[#E9F2E3] text-[#4E8A1F] font-display text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 tabular-nums">
                  {i + 1}
                </span>
                <p className="text-sm text-[#1C2B1A] leading-relaxed">{step}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Bottom Sticky Servings Scaler + "Add to planner" Bar */}
      <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-24px)] max-w-lg">
        <div className="rounded-[28px] bg-white/95 p-2.5 shadow-[0_12px_32px_rgba(28,43,26,0.16)] flex items-center justify-between gap-3">
          {/* Servings Stepper */}
          <div className="flex items-center gap-2 rounded-full bg-[#E9F2E3] px-2 py-1">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setServings((s) => Math.max(1, s - 1))}
              className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-[#1C2B1A] shadow-sm"
              aria-label="Decrease servings"
            >
              <Minus className="h-4 w-4" />
            </motion.button>
            <span className="font-display text-base font-bold text-[#1C2B1A] w-7 text-center tabular-nums">
              {servings}
            </span>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setServings((s) => Math.min(12, s + 1))}
              className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-[#1C2B1A] shadow-sm"
              aria-label="Increase servings"
            >
              <Plus className="h-4 w-4" />
            </motion.button>
          </div>

          {/* Add to planner CTA (NOT Add to cart) */}
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => setShowSlotPicker(true)}
            className="flex-1 rounded-full bg-[#8DC63F] hover:bg-[#7CB342] text-white font-display font-bold text-sm sm:text-base py-3 px-5 shadow-[0_8px_20px_rgba(141,198,63,0.35)] flex items-center justify-center gap-2 min-h-[48px] transition-colors whitespace-nowrap"
          >
            <CalendarPlus className="h-5 w-5" />
            <span>Add to planner</span>
          </motion.button>
        </div>
      </div>

      {/* Day & Slot Bottom Sheet */}
      <AnimatePresence>
        {showSlotPicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#1C2B1A]/35 flex items-end sm:items-center justify-center p-3 sm:p-4"
            onClick={() => setShowSlotPicker(false)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-[24px] bg-white p-5 sm:p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-lg font-bold text-[#1C2B1A]">
                  Add to Weekly Planner
                </h3>
                <button
                  onClick={() => setShowSlotPicker(false)}
                  className="h-10 w-10 rounded-full bg-[#E9F2E3] flex items-center justify-center text-[#1C2B1A]"
                  aria-label="Close slot picker"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <p className="text-xs font-semibold text-[#7A8A76] mb-2">Choose Day</p>
              <div className="grid grid-cols-4 gap-2 mb-4">
                {DAYS.map((day) => {
                  const active = selectedDay === day;
                  return (
                    <motion.button
                      key={day}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => setSelectedDay(day)}
                      className={`rounded-full py-2 px-2 text-xs font-semibold min-h-[40px] transition-colors ${
                        active ? 'bg-[#7CB342] text-white' : 'bg-[#E9F2E3] text-[#1C2B1A]'
                      }`}
                    >
                      {day.slice(0, 3)}
                    </motion.button>
                  );
                })}
              </div>

              <p className="text-xs font-semibold text-[#7A8A76] mb-2">Choose Meal Slot</p>
              <div className="grid grid-cols-3 gap-2 mb-5">
                {SLOTS.map((sl) => {
                  const active = selectedSlot === sl.id;
                  return (
                    <motion.button
                      key={sl.id}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => setSelectedSlot(sl.id)}
                      className={`rounded-full py-2.5 text-xs font-semibold min-h-[42px] transition-colors ${
                        active ? 'bg-[#7CB342] text-white' : 'bg-[#E9F2E3] text-[#1C2B1A]'
                      }`}
                    >
                      {sl.label}
                    </motion.button>
                  );
                })}
              </div>

              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => {
                  onAddToPlanner(selectedDay, selectedSlot, servings);
                  setShowSlotPicker(false);
                }}
                className="w-full rounded-full bg-[#8DC63F] hover:bg-[#7CB342] py-3.5 text-sm font-bold text-white shadow-md min-h-[48px]"
              >
                Save to {selectedDay} {selectedSlot}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
