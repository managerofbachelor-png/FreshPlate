import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { User } from 'firebase/auth';
import {
  Search,
  SlidersHorizontal,
  Heart,
  Sparkles,
  Sun,
  ArrowRight,
  Utensils,
  Sandwich,
  Soup,
  Salad,
  Dumbbell,
  Flame,
  LogIn,
  X,
} from 'lucide-react';
import { CategoryChip, CountryCode, Recipe } from '../types';
import { getRecipeEstimatedCost } from '../data/recipes';
import { formatCurrency } from '../data/prices';
import { PlateFoodPhoto } from './PlateFoodPhoto';
import { PWAInstallButton } from './PWAInstallButton';

interface HomeViewProps {
  recipes: Recipe[];
  country: CountryCode;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  onOpenRecipe: (recipe: Recipe) => void;
  onGoToPlanner: () => void;
  onGoToBudget: () => void;
  onGoToBmi: () => void;
  onGoToProfile: () => void;
  user?: User | null;
  onSignIn?: () => void;
}

const CATEGORIES: Array<{ id: CategoryChip; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'All', label: 'All', icon: Utensils },
  { id: 'Burger', label: 'Burger', icon: Sandwich },
  { id: 'Noodles', label: 'Noodles', icon: Soup },
  { id: 'Salad', label: 'Salad', icon: Salad },
  { id: 'Rice', label: 'Rice', icon: Flame },
  { id: 'Gym', label: 'Gym', icon: Dumbbell },
  { id: 'Bangladeshi', label: 'Bangladeshi', icon: Sparkles },
];

type ExtraFilter = 'quick' | 'highProtein' | 'vegetarian' | 'favorites';

function getGreeting(firstName?: string): string {
  const hour = new Date().getHours();
  const base = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  return firstName ? `${base}, ${firstName}!` : `${base}!`;
}

export const HomeView: React.FC<HomeViewProps> = ({
  recipes,
  country,
  favorites,
  onToggleFavorite,
  onOpenRecipe,
  onGoToPlanner,
  onGoToBudget,
  onGoToBmi,
  onGoToProfile,
  user,
  onSignIn,
}) => {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryChip>('All');
  const [showFilters, setShowFilters] = useState(false);
  const [extraFilters, setExtraFilters] = useState<ExtraFilter[]>([]);

  const toggleExtraFilter = (f: ExtraFilter) => {
    setExtraFilters((prev) => (prev.includes(f) ? prev.filter((item) => item !== f) : [...prev, f]));
  };

  const clearAll = () => {
    setSearch('');
    setActiveCategory('All');
    setExtraFilters([]);
  };

  const filteredRecipes = useMemo(() => {
    const q = search.trim().toLowerCase();
    return recipes.filter((r) => {
      if (activeCategory !== 'All' && !r.categories.includes(activeCategory)) return false;
      if (extraFilters.includes('quick') && r.prepMinutes > 20) return false;
      if (extraFilters.includes('highProtein') && r.protein < 25) return false;
      if (extraFilters.includes('vegetarian') && !r.isVegetarian) return false;
      if (extraFilters.includes('favorites') && !favorites.includes(r.id)) return false;
      if (q) {
        const titleHit = r.title.toLowerCase().includes(q);
        const ingHit = r.ingredients.some((i) => i.name.toLowerCase().includes(q));
        const descHit = r.description.toLowerCase().includes(q);
        if (!titleHit && !ingHit && !descHit) return false;
      }
      return true;
    });
  }, [recipes, activeCategory, extraFilters, favorites, search]);

  const firstName = user?.displayName?.trim().split(/\s+/)[0];
  const greeting = getGreeting(firstName);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className="pb-28 pt-5 px-4 sm:px-6 max-w-5xl mx-auto relative z-10"
    >
      {/* Top Brand & Avatar Row */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-10 w-10 flex items-center justify-center shrink-0">
            <img
              src="/assets/aistudio/freshplate_transparent_1b70ecf0.png"
              alt="FreshPlate logo"
              className="w-full h-full object-contain drop-shadow-[0_3px_8px_rgba(28,43,26,0.14)]"
            />
          </div>
          <span className="font-display text-lg sm:text-xl font-extrabold text-[#1C2B1A] tracking-tight truncate">
            FreshPlate
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <PWAInstallButton variant="compact" />
          {!user && onSignIn && (
            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={onSignIn}
              className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-xs font-bold text-[#1C2B1A] shadow-[0_6px_18px_rgba(28,43,26,0.08)] hover:bg-[#F7FBF3] min-h-[40px]"
            >
              <LogIn className="h-3.5 w-3.5 text-[#7CB342]" />
              <span>Sign in</span>
            </motion.button>
          )}
          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={onGoToProfile}
            className="h-11 w-11 rounded-full bg-white shadow-[0_6px_18px_rgba(28,43,26,0.10)] flex items-center justify-center overflow-hidden border-2 border-white shrink-0"
            aria-label="Open profile and market settings"
          >
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'Profile'}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            ) : (
              <svg viewBox="0 0 40 40" className="w-full h-full">
                <rect width="40" height="40" fill="#DCEBCE" />
                <circle cx="20" cy="15" r="7" fill="#7AB648" />
                <path d="M8 36C9 27 14 23 20 23C26 23 31 27 32 36" fill="#4E8A1F" />
              </svg>
            )}
          </motion.button>
        </div>
      </div>

      {/* Greeting Sub-row */}
      <div className="mt-3.5 flex items-center gap-2 text-sm font-medium text-[#7A8A76] min-w-0">
        <Sun className="h-4 w-4 text-[#FFC53D] fill-[#FFC53D] shrink-0" />
        <span className="truncate">{greeting}</span>
        <span aria-hidden="true" className="hidden sm:inline">·</span>
        <span className="hidden sm:inline text-[#4E8A1F] font-semibold shrink-0">
          {country === 'BD' ? 'Dhaka Bazaar ৳' : 'Walmart US $'}
        </span>
      </div>

      {/* Main Question Headline */}
      <h1 className="mt-1.5 font-display text-[30px] sm:text-[38px] leading-[1.15] font-extrabold text-[#1C2B1A] tracking-tight max-w-xl text-balance">
        What are you wanna eat today?
      </h1>

      {/* Search Bar with Filter Icon */}
      <div className="mt-5 flex items-center gap-2.5">
        <div className="flex-1 flex items-center gap-2.5 rounded-full bg-white px-4 py-2.5 shadow-[0_6px_20px_rgba(28,43,26,0.06)] min-h-[48px]">
          <Search className="h-5 w-5 text-[#7A8A76] shrink-0" />
          <input
            type="search"
            maxLength={100}
            value={search}
            onChange={(e) => setSearch(e.target.value.replace(/[\u0000-\u001F\u007F]/g, '').slice(0, 100))}
            placeholder="Search any foods or ingredients..."
            aria-label="Search recipes or ingredients"
            className="w-full bg-transparent text-sm text-[#1C2B1A] placeholder:text-[#7A8A76] focus:outline-none"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="h-7 w-7 rounded-full bg-[#E9F2E3] flex items-center justify-center text-[#1C2B1A]"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={() => setShowFilters((s) => !s)}
            className={`h-9 w-9 rounded-full flex items-center justify-center transition-colors shrink-0 ${
              showFilters || extraFilters.length > 0
                ? 'bg-[#7CB342] text-white'
                : 'bg-[#E9F2E3] text-[#1C2B1A]'
            }`}
            aria-label="Toggle recipe filters"
            aria-expanded={showFilters}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </motion.button>
        </div>
      </div>

      {/* Collapsible Filter Buttons */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-3 flex flex-wrap gap-2">
              {(
                [
                  { id: 'quick', label: 'Quick under 20m' },
                  { id: 'highProtein', label: 'High-protein (25g+)' },
                  { id: 'vegetarian', label: 'Vegetarian' },
                  { id: 'favorites', label: `Saved (${favorites.length})` },
                ] as const
              ).map((flt) => {
                const active = extraFilters.includes(flt.id);
                return (
                  <motion.button
                    key={flt.id}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => toggleExtraFilter(flt.id)}
                    className={`rounded-full px-3.5 py-2 text-xs font-semibold transition-colors min-h-[38px] whitespace-nowrap ${
                      active
                        ? 'bg-[#7CB342] text-white shadow-sm'
                        : 'bg-white text-[#1C2B1A] shadow-sm hover:bg-[#F5FAEE]'
                    }`}
                  >
                    {flt.label}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Horizontal Pill Category Chips */}
      <div className="mt-4 flex items-center gap-2.5 overflow-x-auto no-scrollbar pb-1">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <motion.button
              key={cat.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveCategory(cat.id)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shrink-0 min-h-[42px] ${
                isActive
                  ? 'bg-[#7CB342] text-white shadow-[0_6px_16px_rgba(124,179,66,0.30)]'
                  : 'bg-white text-[#1C2B1A] shadow-[0_4px_12px_rgba(28,43,26,0.06)] hover:bg-[#F7FBF3]'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-[#7CB342]'}`} />
              <span>{cat.label}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Hero Green Promo Banner */}
      <div className="mt-5 fresh-hero-gradient rounded-[24px] p-5 sm:p-6 text-white shadow-[0_12px_28px_rgba(78,138,31,0.24)] flex items-center justify-between gap-4 overflow-hidden relative">
        <div className="relative z-10 max-w-[62%]">
          <h2 className="font-display text-lg sm:text-2xl font-bold leading-snug text-white">
            Plan your week — save money, eat better
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-white/90">
            Build your 7-day menu or calculate a real {country === 'BD' ? 'Dhaka bazaar' : 'Walmart'} budget.
          </p>
          <div className="mt-3.5 flex flex-wrap gap-2">
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={onGoToBudget}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#8DC63F] hover:bg-[#9BD34E] px-4 py-2 text-xs font-bold text-white shadow-md min-h-[38px] whitespace-nowrap"
            >
              <span>Budget Plan</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={onGoToPlanner}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/20 hover:bg-white/30 px-4 py-2 text-xs font-bold text-white min-h-[38px] whitespace-nowrap"
            >
              <span>7-Day Grid</span>
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={onGoToBmi}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/20 hover:bg-white/30 px-4 py-2 text-xs font-bold text-white min-h-[38px] whitespace-nowrap"
            >
              <span>BMI Check</span>
            </motion.button>
          </div>
        </div>

        <div className="relative z-10 shrink-0">
          <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full p-1.5 bg-white/90 shadow-xl overflow-hidden">
            <img
              src="/images/food/banner-meal.jpg"
              alt="Fresh balanced meal bowl"
              referrerPolicy="no-referrer"
              className="w-full h-full rounded-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* Recommendation Section Header */}
      <div className="mt-7 flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold text-[#1C2B1A]">Recommendation</h2>
        {(activeCategory !== 'All' || extraFilters.length > 0 || search) ? (
          <button
            onClick={clearAll}
            className="text-sm font-semibold text-[#4E8A1F] hover:underline min-h-[40px] px-2"
          >
            See all ({recipes.length})
          </button>
        ) : (
          <span className="text-xs font-medium text-[#7A8A76]">
            {recipes.length} recipes · prices est.
          </span>
        )}
      </div>

      {/* 2-Column Recipe Card Grid (Responsive 2 -> 3 -> 4 cols on desktop) */}
      {filteredRecipes.length > 0 ? (
        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-5">
          {filteredRecipes.map((recipe, idx) => {
            const isFav = favorites.includes(recipe.id);
            const estCost = getRecipeEstimatedCost(recipe, country);
            return (
              <motion.article
                key={recipe.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(idx * 0.06, 0.42), duration: 0.24, ease: 'easeOut' }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onOpenRecipe(recipe)}
                className="fresh-card p-3.5 sm:p-4 flex flex-col justify-between cursor-pointer hover:shadow-[0_12px_28px_rgba(28,43,26,0.12)] transition-shadow relative group"
              >
                {/* Heart favorite button */}
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(recipe.id);
                  }}
                  aria-label={isFav ? `Remove ${recipe.title} from favorites` : `Save ${recipe.title} to favorites`}
                  className="absolute top-2.5 right-2.5 z-20 h-10 w-10 rounded-full bg-white/95 shadow-sm flex items-center justify-center"
                >
                  <Heart
                    className={`h-4 w-4 transition-colors ${
                      isFav ? 'text-[#E4572E] fill-[#E4572E]' : 'text-[#7A8A76]'
                    }`}
                  />
                </motion.button>

                {/* Circular plated dish photo */}
                <div className="flex justify-center pt-2 pb-3">
                  <PlateFoodPhoto src={recipe.image} alt={recipe.title} size="md" />
                </div>

                {/* Title & clean unboxed metadata */}
                <div>
                  <h3 className="font-display text-[16px] sm:text-[17px] font-bold text-[#1C2B1A] leading-snug line-clamp-2">
                    {recipe.title}
                  </h3>
                  <div className="mt-1.5 flex items-center flex-wrap gap-x-1.5 gap-y-0.5 text-xs text-[#7A8A76] tabular-nums">
                    <span className="inline-flex items-center gap-1 text-[#1C2B1A] font-semibold">
                      <Flame className="h-3.5 w-3.5 text-[#E4572E]" />
                      {recipe.calories} kcal
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{recipe.prepMinutes} min</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#4E8A1F] tabular-nums">
                      ~{formatCurrency(estCost, country)} est.
                    </span>
                    <span className="text-[#7A8A76] tabular-nums">{recipe.protein}g pro</span>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      ) : (
        /* Cute Empty Plate Illustration State */
        <div className="mt-6 fresh-card p-8 text-center flex flex-col items-center">
          <svg className="w-24 h-24 mb-3" viewBox="0 0 100 100" fill="none" aria-hidden="true">
            <circle cx="50" cy="54" r="36" fill="#F2F8ED" stroke="#DCEBCE" strokeWidth="4" />
            <circle cx="50" cy="54" r="24" stroke="#B7D79E" strokeWidth="2" strokeDasharray="4 4" />
            <path d="M38 60C38 45 48 36 62 38C63 52 53 62 38 60Z" fill="#7CB342" />
            <path d="M36 62C44 54 52 46 60 40" stroke="#4E8A1F" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <h3 className="font-display text-lg font-bold text-[#1C2B1A]">No dishes match your filter</h3>
          <p className="mt-1 text-sm text-[#7A8A76] max-w-xs">
            Try clearing your search or switching back to All categories to browse every Fresh Market meal.
          </p>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={clearAll}
            className="mt-4 rounded-full bg-[#8DC63F] px-6 py-2.5 text-sm font-bold text-white shadow-sm min-h-[44px]"
          >
            Show all recipes
          </motion.button>
        </div>
      )}
    </motion.div>
  );
};
