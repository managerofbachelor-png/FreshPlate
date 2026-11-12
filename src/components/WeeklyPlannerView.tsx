import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShoppingBasket,
  Plus,
  Trash2,
  Check,
  X,
  Search,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import {
  Aisle,
  CountryCode,
  DayOfWeek,
  MealSlot,
  Recipe,
  WeeklyPlan,
} from '../types';
import { getRecipeEstimatedCost } from '../data/recipes';
import { formatCurrency } from '../data/prices';
import { PlateFoodPhoto } from './PlateFoodPhoto';

interface WeeklyPlannerViewProps {
  recipes: Recipe[];
  country: CountryCode;
  weeklyPlan: WeeklyPlan;
  onAssignMeal: (day: DayOfWeek, slot: MealSlot, recipeId: string, servings: number) => void;
  onRemoveMeal: (day: DayOfWeek, slot: MealSlot) => void;
  onOpenRecipe: (recipe: Recipe) => void;
  onBrowseRecipes: () => void;
}

const DAYS: DayOfWeek[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const SLOTS: Array<{ id: MealSlot; label: string }> = [
  { id: 'breakfast', label: 'Breakfast' },
  { id: 'lunch', label: 'Lunch' },
  { id: 'dinner', label: 'Dinner' },
];

const AISLES: Aisle[] = ['Produce', 'Meat & Fish', 'Dairy', 'Pantry'];

export const WeeklyPlannerView: React.FC<WeeklyPlannerViewProps> = ({
  recipes,
  country,
  weeklyPlan,
  onAssignMeal,
  onRemoveMeal,
  onOpenRecipe,
  onBrowseRecipes,
}) => {
  const [activeDay, setActiveDay] = useState<DayOfWeek>('Monday');
  const [pickerSlot, setPickerSlot] = useState<{ day: DayOfWeek; slot: MealSlot } | null>(null);
  const [pickerSearch, setPickerSearch] = useState('');
  const [showShoppingList, setShowShoppingList] = useState(false);
  const [boughtKeys, setBoughtKeys] = useState<string[]>([]);

  const recipeMap = useMemo(() => {
    const map = new Map<string, Recipe>();
    recipes.forEach((r) => map.set(r.id, r));
    return map;
  }, [recipes]);

  const totalPlannedMeals = useMemo(() => {
    let count = 0;
    for (const day of DAYS) {
      const d = weeklyPlan[day];
      if (!d) continue;
      if (d.breakfast) count++;
      if (d.lunch) count++;
      if (d.dinner) count++;
    }
    return count;
  }, [weeklyPlan]);

  // Aggregate shopping list grouped by aisle
  const shoppingByAisle = useMemo(() => {
    const agg = new Map<
      string,
      { key: string; name: string; amount: number; unit: string; aisle: Aisle; cost: number }
    >();

    for (const day of DAYS) {
      const slots = weeklyPlan[day];
      if (!slots) continue;
      for (const s of SLOTS) {
        const entry = slots[s.id];
        if (!entry) continue;
        const recipe = recipeMap.get(entry.recipeId);
        if (!recipe) continue;
        const mult = (entry.servings || recipe.servings) / Math.max(1, recipe.servings);

        for (const ing of recipe.ingredients) {
          const key = `${ing.name.toLowerCase()}__${ing.unit.toLowerCase()}__${ing.aisle}`;
          const prev = agg.get(key);
          const ingCost = (country === 'BD' ? ing.bdCostPerBase : ing.usCostPerBase) * mult;
          if (prev) {
            prev.amount += ing.amount * mult;
            prev.cost += ingCost;
          } else {
            agg.set(key, {
              key,
              name: ing.name,
              amount: ing.amount * mult,
              unit: ing.unit,
              aisle: ing.aisle,
              cost: ingCost,
            });
          }
        }
      }
    }

    const grouped: Record<Aisle, Array<{ key: string; name: string; amount: number; unit: string; cost: number }>> = {
      Produce: [],
      'Meat & Fish': [],
      Dairy: [],
      Pantry: [],
    };
    let grandTotal = 0;
    agg.forEach((item) => {
      grouped[item.aisle].push(item);
      grandTotal += item.cost;
    });
    return { grouped, grandTotal };
  }, [weeklyPlan, recipeMap, country]);

  const filteredPickerRecipes = useMemo(() => {
    const q = pickerSearch.trim().toLowerCase();
    if (!q) return recipes;
    return recipes.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.ingredients.some((i) => i.name.toLowerCase().includes(q))
    );
  }, [recipes, pickerSearch]);

  const toggleBought = (key: string) => {
    setBoughtKeys((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className="pb-32 pt-5 px-4 sm:px-6 max-w-5xl mx-auto relative z-10"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#1C2B1A]">
            Weekly Planner
          </h1>
          <p className="mt-1 text-sm text-[#7A8A76]">
            Tap any meal slot to fill your Monday–Sunday menu ({totalPlannedMeals} meals planned).
          </p>
        </div>
        {totalPlannedMeals > 0 && (
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => setShowShoppingList(true)}
            className="inline-flex items-center gap-2 rounded-full bg-[#8DC63F] hover:bg-[#7CB342] text-white px-4 py-2.5 text-xs sm:text-sm font-bold shadow-md min-h-[44px] whitespace-nowrap shrink-0"
          >
            <ShoppingBasket className="h-4 w-4" />
            <span>Shopping List</span>
          </motion.button>
        )}
      </div>

      {/* Mobile Day Selector Pills + Full 7-Day Grid on md+ */}
      <div className="mt-5 flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 md:hidden">
        {DAYS.map((day) => {
          const daySlots = weeklyPlan[day] || {};
          const filledCount = SLOTS.filter((s) => !!daySlots[s.id]).length;
          const isActive = activeDay === day;
          return (
            <motion.button
              key={day}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveDay(day)}
              className={`rounded-full px-4 py-2 text-xs font-bold whitespace-nowrap shrink-0 min-h-[40px] flex items-center gap-1.5 transition-colors ${
                isActive ? 'bg-[#7CB342] text-white shadow-sm' : 'bg-white text-[#1C2B1A] shadow-sm'
              }`}
            >
              <span>{day.slice(0, 3)}</span>
              {filledCount > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full tabular-nums ${
                    isActive ? 'bg-white/25 text-white' : 'bg-[#E9F2E3] text-[#4E8A1F]'
                  }`}
                >
                  {filledCount}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Responsive Planner Grid: Active Day on mobile, 7-day cards on desktop */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {DAYS.map((day, dIdx) => {
          const isVisibleOnMobile = day === activeDay;
          const daySlots = weeklyPlan[day] || {};
          return (
            <motion.section
              key={day}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: dIdx * 0.04, duration: 0.22 }}
              className={`fresh-card p-4 sm:p-5 ${isVisibleOnMobile ? 'block' : 'hidden md:block'}`}
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display text-lg font-bold text-[#1C2B1A]">{day}</h2>
                <span className="text-xs font-medium text-[#7A8A76] tabular-nums">
                  {SLOTS.filter((s) => !!daySlots[s.id]).length} / 3 meals
                </span>
              </div>

              <div className="space-y-2.5">
                {SLOTS.map((slot) => {
                  const planned = daySlots[slot.id];
                  const recipe = planned ? recipeMap.get(planned.recipeId) : undefined;

                  if (recipe && planned) {
                    const estCost = getRecipeEstimatedCost(recipe, country, planned.servings);
                    return (
                      <motion.div
                        key={slot.id}
                        initial={{ scale: 0.92, opacity: 0.6 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 360, damping: 24 }}
                        className="rounded-2xl bg-[#F4F9F0] p-2.5 flex items-center justify-between gap-2.5"
                      >
                        <button
                          onClick={() => onOpenRecipe(recipe)}
                          className="flex items-center gap-2.5 flex-1 text-left min-w-0 min-h-[44px]"
                        >
                          <PlateFoodPhoto src={recipe.image} alt={recipe.title} size="sm" showGarnish={false} />
                          <div className="min-w-0 flex-1">
                            <div className="text-[11px] font-semibold text-[#4E8A1F]">{slot.label}</div>
                            <div className="font-display text-sm font-bold text-[#1C2B1A] truncate">
                              {recipe.title}
                            </div>
                            <div className="text-xs text-[#7A8A76] tabular-nums">
                              {recipe.calories} kcal · ~{formatCurrency(estCost, country)} est.
                            </div>
                          </div>
                        </button>

                        <div className="flex items-center gap-1 shrink-0">
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setPickerSlot({ day, slot: slot.id })}
                            className="h-9 px-2.5 rounded-full bg-white text-xs font-semibold text-[#1C2B1A] shadow-xs"
                            aria-label={`Swap ${day} ${slot.label}`}
                          >
                            Swap
                          </motion.button>
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => onRemoveMeal(day, slot.id)}
                            className="h-9 w-9 rounded-full bg-white text-[#E4572E] flex items-center justify-center shadow-xs"
                            aria-label={`Remove ${day} ${slot.label}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </motion.button>
                        </div>
                      </motion.div>
                    );
                  }

                  return (
                    <motion.button
                      key={slot.id}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        setPickerSearch('');
                        setPickerSlot({ day, slot: slot.id });
                      }}
                      className="w-full rounded-2xl border-2 border-dashed border-[#D3E4C6] hover:border-[#7CB342] bg-[#FAFDF7] hover:bg-[#F3F9EE] p-3 flex items-center justify-between transition-colors min-h-[56px]"
                    >
                      <div className="text-left">
                        <div className="text-[11px] font-semibold text-[#7A8A76]">{slot.label}</div>
                        <div className="text-sm font-semibold text-[#4E8A1F]">Tap to pick a recipe</div>
                      </div>
                      <span className="h-9 w-9 rounded-full bg-[#E9F2E3] text-[#4E8A1F] flex items-center justify-center">
                        <Plus className="h-4 w-4" />
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.section>
          );
        })}
      </div>

      {/* Empty Week Helpful Card OR Bottom Combined Shopping List CTA */}
      {totalPlannedMeals === 0 ? (
        <div className="mt-6 fresh-card p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          <svg className="w-24 h-24 shrink-0" viewBox="0 0 100 100" fill="none" aria-hidden="true">
            <rect x="20" y="38" width="60" height="40" rx="14" fill="#E9F2E3" stroke="#7CB342" strokeWidth="3" />
            <path d="M35 38C35 25 65 25 65 38" stroke="#4E8A1F" strokeWidth="3" strokeLinecap="round" />
            <circle cx="42" cy="56" r="6" fill="#E4572E" />
            <path d="M54 62C54 51 62 45 70 48C70 57 63 63 54 62Z" fill="#8DC63F" />
          </svg>
          <div className="flex-1">
            <h3 className="font-display text-lg font-bold text-[#1C2B1A]">Your weekly basket is waiting</h3>
            <p className="mt-1 text-sm text-[#7A8A76]">
              Tap any Breakfast, Lunch, or Dinner slot above — or explore recipes and tap “Add to planner” to build your combined grocery list by aisle.
            </p>
          </div>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={onBrowseRecipes}
            className="rounded-full bg-[#8DC63F] hover:bg-[#7CB342] text-white font-display font-bold text-sm px-5 py-3 shadow-md min-h-[44px] whitespace-nowrap"
          >
            Browse recipes
          </motion.button>
        </div>
      ) : (
        <div className="mt-6 fresh-card p-5 flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#FFF9EC]">
          <div>
            <div className="font-display text-lg font-bold text-[#1C2B1A] tabular-nums">
              {totalPlannedMeals} meals planned · Est. {formatCurrency(shoppingByAisle.grandTotal, country)}
            </div>
            <p className="text-xs sm:text-sm text-[#7A8A76]">
              All ingredients combined & sorted by Produce, Meat & Fish, Dairy, and Pantry.
            </p>
          </div>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => setShowShoppingList(true)}
            className="w-full sm:w-auto rounded-full bg-[#8DC63F] hover:bg-[#7CB342] text-white font-display font-bold text-sm px-6 py-3.5 shadow-md flex items-center justify-center gap-2 min-h-[48px] whitespace-nowrap"
          >
            <ShoppingBasket className="h-4 w-4" />
            <span>Open Combined Shopping List</span>
            <ChevronRight className="h-4 w-4" />
          </motion.button>
        </div>
      )}

      {/* Recipe Picker Sheet */}
      <AnimatePresence>
        {pickerSlot && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#1C2B1A]/35 flex items-end sm:items-center justify-center p-2 sm:p-4"
            onClick={() => setPickerSlot(null)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ duration: 0.22 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg max-h-[82vh] flex flex-col rounded-[24px] bg-white p-5 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-display text-lg font-bold text-[#1C2B1A]">
                    Pick {pickerSlot.day} {pickerSlot.slot}
                  </h3>
                  <p className="text-xs text-[#7A8A76]">Tap any dish to add it immediately</p>
                </div>
                <button
                  onClick={() => setPickerSlot(null)}
                  className="h-10 w-10 rounded-full bg-[#E9F2E3] flex items-center justify-center text-[#1C2B1A]"
                  aria-label="Close recipe picker"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-center gap-2 rounded-full bg-[#E9F2E3] px-4 py-2 mb-3">
                <Search className="h-4 w-4 text-[#7A8A76]" />
                <input
                  type="search"
                  maxLength={100}
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value.replace(/[\u0000-\u001F\u007F]/g, '').slice(0, 100))}
                  placeholder="Search dishes or ingredients..."
                  className="w-full bg-transparent text-sm text-[#1C2B1A] placeholder:text-[#7A8A76] focus:outline-none"
                />
              </div>

              <div className="overflow-y-auto space-y-2 pr-1">
                {filteredPickerRecipes.map((r) => (
                  <motion.button
                    key={r.id}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      onAssignMeal(pickerSlot.day, pickerSlot.slot, r.id, r.servings);
                      setPickerSlot(null);
                    }}
                    className="w-full rounded-2xl bg-[#F8FBF5] hover:bg-[#E9F2E3] p-2.5 flex items-center justify-between gap-3 text-left transition-colors min-h-[60px]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <PlateFoodPhoto src={r.image} alt={r.title} size="sm" showGarnish={false} />
                      <div className="min-w-0">
                        <div className="font-display text-sm font-bold text-[#1C2B1A] truncate">
                          {r.title}
                        </div>
                        <div className="text-xs text-[#7A8A76] tabular-nums">
                          {r.calories} kcal · {r.protein}g protein · ~{formatCurrency(getRecipeEstimatedCost(r, country), country)} est.
                        </div>
                      </div>
                    </div>
                    <span className="h-9 w-9 rounded-full bg-[#8DC63F] text-white flex items-center justify-center shrink-0">
                      <Plus className="h-4 w-4" />
                    </span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Combined Aisle-Grouped Shopping List Modal */}
      <AnimatePresence>
        {showShoppingList && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#1C2B1A]/35 flex items-end sm:items-center justify-center p-2 sm:p-4"
            onClick={() => setShowShoppingList(false)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ duration: 0.22 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg max-h-[85vh] flex flex-col rounded-[24px] bg-white p-5 sm:p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-display text-xl font-bold text-[#1C2B1A]">
                    Combined Shopping List
                  </h3>
                  <p className="text-xs text-[#7A8A76]">
                    {country === 'BD' ? 'Dhaka Bazaar estimates' : 'Walmart US estimates'} · grouped by aisle
                  </p>
                </div>
                <button
                  onClick={() => setShowShoppingList(false)}
                  className="h-10 w-10 rounded-full bg-[#E9F2E3] flex items-center justify-center text-[#1C2B1A]"
                  aria-label="Close shopping list"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="overflow-y-auto space-y-5 pr-1 flex-1">
                {AISLES.map((aisle) => {
                  const rows = shoppingByAisle.grouped[aisle];
                  if (rows.length === 0) return null;
                  return (
                    <div key={aisle}>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-display text-sm font-bold text-[#4E8A1F] flex items-center gap-1.5">
                          <Sparkles className="h-3.5 w-3.5" />
                          {aisle}
                        </h4>
                        <span className="text-xs text-[#7A8A76] tabular-nums">{rows.length} items</span>
                      </div>
                      <ul className="divide-y divide-[#F0F5EC] rounded-2xl bg-[#FAFDF7] px-3">
                        {rows.map((item, idx) => {
                          const checked = boughtKeys.includes(item.key);
                          return (
                            <motion.li
                              key={item.key}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.03 }}
                            >
                              <button
                                onClick={() => toggleBought(item.key)}
                                className="w-full py-3 flex items-center justify-between gap-3 text-left min-h-[44px]"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <span
                                    className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                                      checked
                                        ? 'bg-[#7CB342] text-white'
                                        : 'border-2 border-[#C7D9B9] bg-white'
                                    }`}
                                  >
                                    {checked && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                                  </span>
                                  <div className="min-w-0">
                                    <div
                                      className={`text-sm font-semibold truncate ${
                                        checked ? 'line-through text-[#7A8A76]' : 'text-[#1C2B1A]'
                                      }`}
                                    >
                                      {item.name}
                                    </div>
                                    <div className="text-xs text-[#7A8A76] tabular-nums">
                                      {Number.isInteger(item.amount)
                                        ? item.amount
                                        : item.amount.toFixed(1)}{' '}
                                      {item.unit}
                                    </div>
                                  </div>
                                </div>
                                <span className="text-sm font-bold text-[#1C2B1A] tabular-nums shrink-0">
                                  ~{formatCurrency(item.cost, country)}
                                </span>
                              </button>
                            </motion.li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 pt-3 border-t border-[#E9F2E3] flex items-center justify-between">
                <div>
                  <div className="text-xs text-[#7A8A76]">Estimated Basket Total</div>
                  <div className="font-display text-2xl font-extrabold text-[#1C2B1A] tabular-nums">
                    ~{formatCurrency(shoppingByAisle.grandTotal, country)}
                  </div>
                </div>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setShowShoppingList(false)}
                  className="rounded-full bg-[#8DC63F] px-6 py-3 text-sm font-bold text-white shadow-md min-h-[44px]"
                >
                  Done
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
