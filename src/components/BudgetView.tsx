import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Check,
  Minus,
  Plus,
  Store,
  ChevronDown,
  ChevronUp,
  PartyPopper,
} from 'lucide-react';
import { CountryCode } from '../types';
import {
  BD_DHAKA_PRICES,
  US_WALMART_PRICES,
  formatCurrency,
  generateBudgetPlan,
} from '../data/prices';
import { CountUpNumber } from './CountUpNumber';

interface BudgetViewProps {
  country: CountryCode;
  savedBudget: { amount: number; period: 'week' | 'month'; people: number };
  onSaveBudget: (val: { amount: number; period: 'week' | 'month'; people: number }) => void;
}

const CONFETTI_COLORS = ['#7CB342', '#8DC63F', '#FFC53D', '#E4572E', '#FFFFFF'];

export const BudgetView: React.FC<BudgetViewProps> = ({
  country,
  savedBudget,
  onSaveBudget,
}) => {
  const [amountInput, setAmountInput] = useState<string>(
    String(
      savedBudget.amount || (country === 'BD' ? 5000 : 100)
    )
  );
  const [period, setPeriod] = useState<'week' | 'month'>(savedBudget.period);
  const [people, setPeople] = useState<number>(savedBudget.people);
  const [submittedKey, setSubmittedKey] = useState<number>(1);
  const [checkedItems, setCheckedItems] = useState<string[]>([]);
  const [showRefTable, setShowRefTable] = useState(false);

  const minBudget = country === 'BD' ? 500 : 10;
  const maxBudget = country === 'BD' ? 5000000 : 50000;
  const rawParsed = Number(amountInput);
  const numericAmount = Math.max(
    minBudget,
    Math.min(maxBudget, Number.isFinite(rawParsed) && rawParsed > 0 ? rawParsed : country === 'BD' ? 5000 : 100)
  );

  const plan = useMemo(() => {
    return generateBudgetPlan(country, numericAmount, period, people);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country, numericAmount, period, people, submittedKey]);

  const handleShowPlan = (e?: React.FormEvent) => {
    e?.preventDefault();
    const safePeople = Math.max(1, Math.min(12, Math.round(people || 1)));
    setAmountInput(String(numericAmount));
    setPeople(safePeople);
    onSaveBudget({ amount: numericAmount, period, people: safePeople });
    setCheckedItems([]);
    setSubmittedKey((k) => k + 1);
  };

  const presets = country === 'BD' ? [3000, 5000, 8000, 15000] : [60, 100, 150, 350];

  // Progress ring math
  const ringRadius = 46;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ratio = Math.min(1, plan.totalSpend / Math.max(1, plan.budgetAmount));
  const strokeDashoffset = ringCircumference * (1 - ratio);

  const toggleItem = (id: string) => {
    setCheckedItems((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const referenceRows = country === 'BD' ? BD_DHAKA_PRICES : US_WALMART_PRICES;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className="pb-28 pt-5 px-4 sm:px-6 max-w-4xl mx-auto relative z-10"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#1C2B1A]">
            Budget Your Wallet
          </h1>
          <p className="mt-1 text-sm text-[#7A8A76]">
            Fixed {country === 'BD' ? 'Dhaka bazaar' : 'Walmart US'} estimates — never live fetched. Every price is an estimate.
          </p>
        </div>
      </div>

      {/* Three Big Friendly Inputs Card */}
      <form onSubmit={handleShowPlan} className="mt-5 fresh-card p-5 sm:p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Input 1: Budget Amount */}
          <div>
            <label htmlFor="budget-amount" className="block text-xs font-bold text-[#7A8A76] mb-1.5">
              Your Budget ({country === 'BD' ? '৳ Taka' : '$ Dollars'})
            </label>
            <div className="flex items-center rounded-2xl bg-[#F4F9F0] px-4 py-3 border border-[#DCEBCE]">
              <span className="font-display text-xl font-extrabold text-[#4E8A1F] mr-1.5">
                {country === 'BD' ? '৳' : '$'}
              </span>
              <input
                id="budget-amount"
                type="number"
                min={minBudget}
                max={maxBudget}
                step={country === 'BD' ? 100 : 5}
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                className="w-full bg-transparent font-display text-2xl font-extrabold text-[#1C2B1A] focus:outline-none tabular-nums"
              />
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {presets.map((p) => (
                <button
                  type="button"
                  key={p}
                  onClick={() => {
                    setAmountInput(String(p));
                    if (p >= (country === 'BD' ? 12000 : 300)) setPeriod('month');
                    else setPeriod('week');
                  }}
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-colors tabular-nums ${
                    Number(amountInput) === p
                      ? 'bg-[#7CB342] text-white'
                      : 'bg-[#E9F2E3] text-[#4E8A1F]'
                  }`}
                >
                  {formatCurrency(p, country)}
                </button>
              ))}
            </div>
          </div>

          {/* Input 2: Period (Week / Month) */}
          <div>
            <span className="block text-xs font-bold text-[#7A8A76] mb-1.5">Period</span>
            <div className="grid grid-cols-2 gap-2 rounded-2xl bg-[#F4F9F0] p-1.5 border border-[#DCEBCE]">
              {(['week', 'month'] as const).map((p) => (
                <motion.button
                  type="button"
                  key={p}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setPeriod(p)}
                  className={`rounded-xl py-3 text-sm font-bold capitalize transition-all min-h-[46px] ${
                    period === p
                      ? 'bg-[#7CB342] text-white shadow-sm'
                      : 'text-[#7A8A76] hover:text-[#1C2B1A]'
                  }`}
                >
                  {p}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Input 3: Household Size */}
          <div>
            <span className="block text-xs font-bold text-[#7A8A76] mb-1.5">How Many People</span>
            <div className="flex items-center justify-between rounded-2xl bg-[#F4F9F0] px-3 py-2 border border-[#DCEBCE] min-h-[58px]">
              <motion.button
                type="button"
                whileTap={{ scale: 0.9 }}
                onClick={() => setPeople((n) => Math.max(1, n - 1))}
                className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-[#1C2B1A] shadow-sm"
                aria-label="Decrease people"
              >
                <Minus className="h-4 w-4" />
              </motion.button>
              <div className="text-center">
                <span className="font-display text-2xl font-extrabold text-[#1C2B1A] tabular-nums">
                  {people}
                </span>
                <span className="ml-1 text-xs font-semibold text-[#7A8A76]">
                  {people === 1 ? 'person' : 'people'}
                </span>
              </div>
              <motion.button
                type="button"
                whileTap={{ scale: 0.9 }}
                onClick={() => setPeople((n) => Math.min(12, n + 1))}
                className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-[#1C2B1A] shadow-sm"
                aria-label="Increase people"
              >
                <Plus className="h-4 w-4" />
              </motion.button>
            </div>
          </div>
        </div>

        <motion.button
          type="submit"
          whileTap={{ scale: 0.96 }}
          className="w-full rounded-full bg-[#8DC63F] hover:bg-[#7CB342] text-white font-display text-base font-bold py-4 shadow-[0_10px_24px_rgba(141,198,63,0.34)] transition-colors min-h-[52px]"
        >
          Show my plan
        </motion.button>
      </form>

      {/* Under-budget Confetti Celebration Banner */}
      <AnimatePresence mode="wait">
        {plan.isUnderBudget && plan.savedAmount > 0 && (
          <motion.div
            key={`confetti-${submittedKey}-${plan.totalSpend}`}
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-5 relative overflow-hidden rounded-[24px] bg-[#FFF9EC] border border-[#FFE5A3] p-4 sm:p-5 flex items-center justify-between gap-3 shadow-sm"
          >
            {/* Bursting confetti particles */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
              {Array.from({ length: 16 }).map((_, i) => (
                <motion.span
                  key={i}
                  initial={{
                    x: '50%',
                    y: '60%',
                    scale: 0,
                    opacity: 1,
                  }}
                  animate={{
                    x: `${10 + ((i * 53) % 85)}%`,
                    y: `${10 + ((i * 37) % 80)}%`,
                    scale: [0, 1.15, 0.9],
                    opacity: [1, 1, 0],
                    rotate: i * 45,
                  }}
                  transition={{ duration: 1.3, delay: i * 0.03, ease: 'easeOut' }}
                  style={{ backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length] }}
                  className="absolute w-2.5 h-2.5 rounded-sm"
                />
              ))}
            </div>

            <div className="relative z-10 flex items-center gap-3">
              <span className="h-11 w-11 rounded-full bg-[#FFC53D]/30 text-[#B45309] flex items-center justify-center shrink-0">
                <PartyPopper className="h-5 w-5" />
              </span>
              <div>
                <div className="font-display text-base sm:text-lg font-extrabold text-[#1C2B1A]">
                  You saved {formatCurrency(plan.savedAmount, country)} this {plan.period}!
                </div>
                <p className="text-xs text-[#7A8A76]">
                  Extra room left for spices, seasonal fruit, or snacks.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Animated Result Summary + Progress Ring */}
      <motion.div
        key={`summary-${submittedKey}-${plan.totalSpend}`}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
        className="mt-5 fresh-card p-5 sm:p-6"
      >
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* SVG Progress Ring */}
          <div className="relative w-32 h-32 shrink-0 flex items-center justify-center">
            <svg className="w-32 h-32 -rotate-90" viewBox="0 0 112 112">
              <circle
                cx="56"
                cy="56"
                r={ringRadius}
                stroke="#E9F2E3"
                strokeWidth="11"
                fill="none"
              />
              <motion.circle
                cx="56"
                cy="56"
                r={ringRadius}
                stroke={plan.isUnderBudget ? '#7CB342' : '#E4572E'}
                strokeWidth="11"
                strokeLinecap="round"
                fill="none"
                strokeDasharray={ringCircumference}
                initial={{ strokeDashoffset: ringCircumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 0.85, ease: 'easeOut' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="font-display text-lg font-extrabold text-[#1C2B1A] tabular-nums">
                {Math.round(ratio * 100)}%
              </span>
              <span className="text-[11px] font-medium text-[#7A8A76]">of budget</span>
            </div>
          </div>

          {/* Key Totals */}
          <div className="flex-1 w-full grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs font-semibold text-[#7A8A76]">Estimated Spend</div>
              <div className="font-display text-2xl sm:text-3xl font-extrabold text-[#1C2B1A] mt-0.5">
                <CountUpNumber
                  value={plan.totalSpend}
                  decimals={country === 'BD' ? 0 : 2}
                  prefix={plan.currencySymbol}
                />
              </div>
              <div className="text-[11px] text-[#7A8A76] flex items-center gap-1 mt-0.5">
                <Store className="h-3.5 w-3.5 text-[#7CB342]" />
                {plan.storeName}
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold text-[#7A8A76]">Cost Per Meal (est.)</div>
              <div className="font-display text-2xl sm:text-3xl font-extrabold text-[#4E8A1F] mt-0.5">
                <CountUpNumber
                  value={plan.costPerMeal}
                  decimals={country === 'BD' ? 0 : 2}
                  prefix={plan.currencySymbol}
                />
              </div>
              <div className="text-[11px] text-[#7A8A76] tabular-nums mt-0.5">
                Covers {plan.totalMeals} meals ({plan.householdSize} × 3 × {plan.period === 'week' ? 7 : 30}d)
              </div>
            </div>

            <div className="col-span-2 pt-3 border-t border-[#F0F5EC] flex items-center justify-between text-sm">
              <span className="text-[#7A8A76]">Cost per person ({plan.period})</span>
              <span className="font-display font-bold text-[#1C2B1A] tabular-nums">
                ~{formatCurrency(plan.costPerPerson, country)} est.
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Full Shopping List with Staggered Slide-In & Check-off */}
      <div className="mt-5 fresh-card p-5 sm:p-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-display text-xl font-bold text-[#1C2B1A]">
              Suggested Shopping List
            </h2>
            <p className="text-xs text-[#7A8A76]">
              Tap items as you shop to strike them off · all prices are estimates
            </p>
          </div>
          <span className="text-xs font-bold text-[#4E8A1F] tabular-nums">
            {checkedItems.length} / {plan.items.length} bought
          </span>
        </div>

        <ul className="divide-y divide-[#F0F5EC]">
          {plan.items.map((item, idx) => {
            const checked = checkedItems.includes(item.id);
            return (
              <motion.li
                key={`${submittedKey}-${item.id}`}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.045, duration: 0.22 }}
              >
                <button
                  onClick={() => toggleItem(item.id)}
                  className="w-full py-3.5 flex items-center justify-between gap-3 text-left min-h-[52px]"
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
                        className={`text-sm font-bold truncate transition-colors ${
                          checked ? 'line-through text-[#7A8A76]' : 'text-[#1C2B1A]'
                        }`}
                      >
                        {item.name}
                      </div>
                      <div className="text-xs text-[#7A8A76]">
                        {item.quantityLabel} · {item.aisle} · {item.unitNote}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className={`font-display text-sm font-bold tabular-nums ${
                        checked ? 'line-through text-[#7A8A76]' : 'text-[#1C2B1A]'
                      }`}
                    >
                      ~{formatCurrency(item.estimatedPrice, country)}
                    </span>
                  </div>
                </button>
              </motion.li>
            );
          })}
        </ul>

        <div className="mt-4 pt-4 border-t border-[#E9F2E3] flex items-center justify-between">
          <span className="font-display text-base font-bold text-[#1C2B1A]">Estimated Basket Total</span>
          <span className="font-display text-2xl font-extrabold text-[#4E8A1F] tabular-nums">
            ~{formatCurrency(plan.totalSpend, country)}
          </span>
        </div>
      </div>

      {/* Expandable Fixed Market Price Reference Table */}
      <div className="mt-5 fresh-card overflow-hidden">
        <button
          onClick={() => setShowRefTable((s) => !s)}
          className="w-full p-5 flex items-center justify-between text-left min-h-[56px]"
        >
          <div>
            <h3 className="font-display text-base font-bold text-[#1C2B1A]">
              {country === 'BD' ? 'Dhaka Bazaar Reference Prices (Est.)' : 'Walmart US Reference Prices (Est.)'}
            </h3>
            <p className="text-xs text-[#7A8A76]">
              Fixed local baseline prices used for all app estimates
            </p>
          </div>
          {showRefTable ? (
            <ChevronUp className="h-5 w-5 text-[#7A8A76]" />
          ) : (
            <ChevronDown className="h-5 w-5 text-[#7A8A76]" />
          )}
        </button>

        <AnimatePresence>
          {showRefTable && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden px-5 pb-5"
            >
              <div className="divide-y divide-[#F0F5EC] border-t border-[#F0F5EC]">
                {referenceRows.map((row) => (
                  <div key={row.id} className="py-2.5 flex items-center justify-between text-sm">
                    <div>
                      <span className="font-medium text-[#1C2B1A]">{row.item}</span>
                      <span className="text-xs text-[#7A8A76] ml-2">({row.unit})</span>
                    </div>
                    <span className="font-semibold text-[#4E8A1F] tabular-nums">
                      ~{formatCurrency(row.price, country)} est.
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
