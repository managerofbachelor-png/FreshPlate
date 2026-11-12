import { Aisle, BudgetLineItem, BudgetPlanResult, CountryCode, PriceReferenceRow } from '../types';

export const US_WALMART_PRICES: PriceReferenceRow[] = [
  { id: 'us-eggs', item: 'Eggs', unit: '12 pack', price: 3.50, aisle: 'Dairy' },
  { id: 'us-milk', item: 'Whole Milk', unit: '1 gallon', price: 3.80, aisle: 'Dairy' },
  { id: 'us-chicken-breast', item: 'Chicken Breast', unit: '5 lb pack', price: 15.00, aisle: 'Meat & Fish' },
  { id: 'us-chicken-thighs', item: 'Chicken Thighs', unit: '3 lb pack', price: 8.00, aisle: 'Meat & Fish' },
  { id: 'us-rice', item: 'Long Grain Rice', unit: '5 lb bag', price: 3.50, aisle: 'Pantry' },
  { id: 'us-pasta', item: 'Pasta', unit: '2 lb box', price: 2.00, aisle: 'Pantry' },
  { id: 'us-oats', item: 'Rolled Oats', unit: '32 oz canister', price: 3.50, aisle: 'Pantry' },
  { id: 'us-bread', item: 'Wholemeal Bread Loaf', unit: '20 oz loaf', price: 2.50, aisle: 'Pantry' },
  { id: 'us-potatoes', item: 'Russet Potatoes', unit: '5 lb bag', price: 3.50, aisle: 'Produce' },
  { id: 'us-onions', item: 'Yellow Onions', unit: '3 lb bag', price: 2.50, aisle: 'Produce' },
  { id: 'us-bananas', item: 'Bananas', unit: '1 bunch (~3 lb)', price: 1.50, aisle: 'Produce' },
  { id: 'us-frozen-veg', item: 'Frozen Mixed Vegetables', unit: '32 oz bag', price: 5.00, aisle: 'Produce' },
  { id: 'us-canned-beans', item: 'Canned Beans & Chickpeas', unit: '4-pack', price: 4.00, aisle: 'Pantry' },
  { id: 'us-oil', item: 'Cooking Oil', unit: '48 oz bottle', price: 4.00, aisle: 'Pantry' },
  { id: 'us-pb', item: 'Peanut Butter', unit: '28 oz jar', price: 3.50, aisle: 'Pantry' },
  { id: 'us-tuna', item: 'Canned Tuna', unit: '4-pack', price: 3.00, aisle: 'Meat & Fish' },
  { id: 'us-tomatoes', item: 'Fresh Tomatoes', unit: '2 lb', price: 2.50, aisle: 'Produce' },
  { id: 'us-carrots', item: 'Carrots', unit: '2 lb bag', price: 1.50, aisle: 'Produce' },
  { id: 'us-lentils', item: 'Dry Red Lentils', unit: '2 lb bag', price: 2.50, aisle: 'Pantry' },
  { id: 'us-cheese', item: 'Shredded Cheese', unit: '16 oz block', price: 4.00, aisle: 'Dairy' },
];

export const BD_DHAKA_PRICES: PriceReferenceRow[] = [
  { id: 'bd-broiler', item: 'Broiler Chicken', unit: '1 kg', price: 180, aisle: 'Meat & Fish' },
  { id: 'bd-sonali', item: 'Sonali Chicken', unit: '1 kg', price: 320, aisle: 'Meat & Fish' },
  { id: 'bd-beef', item: 'Beef', unit: '1 kg', price: 800, aisle: 'Meat & Fish' },
  { id: 'bd-rui', item: 'Rui Fish (medium)', unit: '1 kg', price: 350, aisle: 'Meat & Fish' },
  { id: 'bd-pangas', item: 'Pangas Fish', unit: '1 kg', price: 190, aisle: 'Meat & Fish' },
  { id: 'bd-eggs', item: 'Farm Eggs', unit: '1 dozen (12 pcs)', price: 135, aisle: 'Dairy' },
  { id: 'bd-rice-coarse', item: 'Coarse Rice (Swarna)', unit: '1 kg', price: 55, aisle: 'Pantry' },
  { id: 'bd-rice-fine', item: 'Fine Rice (Miniket)', unit: '1 kg', price: 78, aisle: 'Pantry' },
  { id: 'bd-oil', item: 'Soybean Oil', unit: '1 litre', price: 195, aisle: 'Pantry' },
  { id: 'bd-dal', item: 'Masoor Dal (Red Lentils)', unit: '1 kg', price: 140, aisle: 'Pantry' },
  { id: 'bd-potatoes', item: 'Potatoes', unit: '1 kg', price: 28, aisle: 'Produce' },
  { id: 'bd-onions', item: 'Onions', unit: '1 kg', price: 50, aisle: 'Produce' },
  { id: 'bd-beans', item: 'Green Beans / Sheem', unit: '1 kg', price: 55, aisle: 'Produce' },
  { id: 'bd-cauliflower', item: 'Cauliflower', unit: '1 piece', price: 35, aisle: 'Produce' },
  { id: 'bd-cabbage', item: 'Cabbage', unit: '1 piece', price: 45, aisle: 'Produce' },
  { id: 'bd-seasonal-veg', item: 'Seasonal Vegetables', unit: '1 kg', price: 55, aisle: 'Produce' },
];

export function formatCurrency(amount: number, country: CountryCode): string {
  if (country === 'BD') {
    return `৳${Math.round(amount).toLocaleString('en-US')}`;
  }
  return `$${amount.toFixed(2)}`;
}

interface StapleTemplate {
  id: string;
  name: string;
  aisle: Aisle;
  baseQtyPerWeek4People: number;
  unitSingular: string;
  unitPlural: string;
  unitPrice: number;
  tier: 1 | 2 | 3; // 1 = essential core, 2 = balanced protein/produce, 3 = variety/extras
}

const US_STAPLES: StapleTemplate[] = [
  { id: 'rice', name: 'Long Grain Rice', aisle: 'Pantry', baseQtyPerWeek4People: 2, unitSingular: '5 lb bag', unitPlural: '5 lb bags', unitPrice: 3.50, tier: 1 },
  { id: 'oats', name: 'Rolled Oats', aisle: 'Pantry', baseQtyPerWeek4People: 2, unitSingular: 'canister', unitPlural: 'canisters', unitPrice: 3.50, tier: 1 },
  { id: 'bread', name: 'Wholemeal Bread', aisle: 'Pantry', baseQtyPerWeek4People: 2, unitSingular: 'loaf', unitPlural: 'loaves', unitPrice: 2.50, tier: 1 },
  { id: 'pasta', name: 'Pasta', aisle: 'Pantry', baseQtyPerWeek4People: 2, unitSingular: '2 lb box', unitPlural: '2 lb boxes', unitPrice: 2.00, tier: 1 },
  { id: 'eggs', name: 'Large Eggs (12 pk)', aisle: 'Dairy', baseQtyPerWeek4People: 3, unitSingular: 'dozen', unitPlural: 'dozens', unitPrice: 3.50, tier: 1 },
  { id: 'milk', name: 'Milk', aisle: 'Dairy', baseQtyPerWeek4People: 2, unitSingular: 'gallon', unitPlural: 'gallons', unitPrice: 3.80, tier: 1 },
  { id: 'chicken-breast', name: 'Chicken Breast (5 lb)', aisle: 'Meat & Fish', baseQtyPerWeek4People: 1, unitSingular: '5 lb pack', unitPlural: '5 lb packs', unitPrice: 15.00, tier: 1 },
  { id: 'chicken-thighs', name: 'Chicken Thighs (3 lb)', aisle: 'Meat & Fish', baseQtyPerWeek4People: 1, unitSingular: '3 lb pack', unitPlural: '3 lb packs', unitPrice: 8.00, tier: 2 },
  { id: 'potatoes', name: 'Russet Potatoes', aisle: 'Produce', baseQtyPerWeek4People: 1, unitSingular: '5 lb bag', unitPlural: '5 lb bags', unitPrice: 3.50, tier: 1 },
  { id: 'onions', name: 'Yellow Onions', aisle: 'Produce', baseQtyPerWeek4People: 1, unitSingular: '3 lb bag', unitPlural: '3 lb bags', unitPrice: 2.50, tier: 1 },
  { id: 'bananas', name: 'Bananas', aisle: 'Produce', baseQtyPerWeek4People: 3, unitSingular: 'bunch', unitPlural: 'bunches', unitPrice: 1.50, tier: 1 },
  { id: 'carrots', name: 'Fresh Carrots', aisle: 'Produce', baseQtyPerWeek4People: 2, unitSingular: '2 lb bag', unitPlural: '2 lb bags', unitPrice: 1.50, tier: 1 },
  { id: 'tomatoes', name: 'Fresh Tomatoes', aisle: 'Produce', baseQtyPerWeek4People: 2, unitSingular: '2 lb pack', unitPlural: '2 lb packs', unitPrice: 2.50, tier: 2 },
  { id: 'frozen-veg', name: 'Frozen Mixed Vegetables', aisle: 'Produce', baseQtyPerWeek4People: 2, unitSingular: '32 oz bag', unitPlural: '32 oz bags', unitPrice: 5.00, tier: 1 },
  { id: 'beans', name: 'Canned Beans & Chickpeas', aisle: 'Pantry', baseQtyPerWeek4People: 1, unitSingular: '4-pack', unitPlural: '4-packs', unitPrice: 4.00, tier: 2 },
  { id: 'lentils', name: 'Red Lentils', aisle: 'Pantry', baseQtyPerWeek4People: 1, unitSingular: '2 lb bag', unitPlural: '2 lb bags', unitPrice: 2.50, tier: 2 },
  { id: 'pb', name: 'Peanut Butter', aisle: 'Pantry', baseQtyPerWeek4People: 1, unitSingular: 'jar', unitPlural: 'jars', unitPrice: 3.50, tier: 2 },
  { id: 'oil', name: 'Cooking Oil', aisle: 'Pantry', baseQtyPerWeek4People: 1, unitSingular: 'bottle', unitPlural: 'bottles', unitPrice: 4.00, tier: 2 },
  { id: 'tuna', name: 'Canned Tuna (4-pack)', aisle: 'Meat & Fish', baseQtyPerWeek4People: 1, unitSingular: '4-pack', unitPlural: '4-packs', unitPrice: 3.00, tier: 3 },
  { id: 'cheese', name: 'Cheese Block', aisle: 'Dairy', baseQtyPerWeek4People: 1, unitSingular: '16 oz block', unitPlural: '16 oz blocks', unitPrice: 4.00, tier: 3 },
];

const BD_STAPLES: StapleTemplate[] = [
  { id: 'rice', name: 'Rice (Coarse & Fine Mix)', aisle: 'Pantry', baseQtyPerWeek4People: 10, unitSingular: 'kg', unitPlural: 'kg', unitPrice: 60, tier: 1 },
  { id: 'dal', name: 'Masoor Dal (Red Lentils)', aisle: 'Pantry', baseQtyPerWeek4People: 2, unitSingular: 'kg', unitPlural: 'kg', unitPrice: 140, tier: 1 },
  { id: 'oil', name: 'Soybean Cooking Oil', aisle: 'Pantry', baseQtyPerWeek4People: 2, unitSingular: 'litre', unitPlural: 'litres', unitPrice: 195, tier: 1 },
  { id: 'broiler', name: 'Broiler Chicken', aisle: 'Meat & Fish', baseQtyPerWeek4People: 3, unitSingular: 'kg', unitPlural: 'kg', unitPrice: 180, tier: 1 },
  { id: 'eggs', name: 'Farm Eggs', aisle: 'Dairy', baseQtyPerWeek4People: 2, unitSingular: 'dozen', unitPlural: 'dozens', unitPrice: 135, tier: 1 },
  { id: 'potatoes', name: 'Potatoes', aisle: 'Produce', baseQtyPerWeek4People: 5, unitSingular: 'kg', unitPlural: 'kg', unitPrice: 28, tier: 1 },
  { id: 'onions', name: 'Onions', aisle: 'Produce', baseQtyPerWeek4People: 3, unitSingular: 'kg', unitPlural: 'kg', unitPrice: 50, tier: 1 },
  { id: 'seasonal-veg', name: 'Seasonal Vegetables (Cauliflower, Cabbage, Beans)', aisle: 'Produce', baseQtyPerWeek4People: 7, unitSingular: 'kg', unitPlural: 'kg', unitPrice: 57, tier: 1 },
  { id: 'rui', name: 'Rui Fish', aisle: 'Meat & Fish', baseQtyPerWeek4People: 2, unitSingular: 'kg', unitPlural: 'kg', unitPrice: 350, tier: 2 },
  { id: 'pangas', name: 'Pangas / Tilapia Fish', aisle: 'Meat & Fish', baseQtyPerWeek4People: 2, unitSingular: 'kg', unitPlural: 'kg', unitPrice: 190, tier: 2 },
  { id: 'spices', name: 'Ginger, Garlic, Turmeric & Masala', aisle: 'Pantry', baseQtyPerWeek4People: 1, unitSingular: 'weekly bundle', unitPlural: 'weekly bundles', unitPrice: 240, tier: 2 },
  { id: 'bananas', name: 'Ripe Bananas & Fruit', aisle: 'Produce', baseQtyPerWeek4People: 2, unitSingular: 'dozen', unitPlural: 'dozens', unitPrice: 120, tier: 2 },
  { id: 'milk', name: 'Fresh Milk', aisle: 'Dairy', baseQtyPerWeek4People: 2, unitSingular: 'litre', unitPlural: 'litres', unitPrice: 95, tier: 3 },
  { id: 'beef', name: 'Beef (Weekend Curry)', aisle: 'Meat & Fish', baseQtyPerWeek4People: 1, unitSingular: 'kg', unitPlural: 'kg', unitPrice: 800, tier: 3 },
];

export function generateBudgetPlan(
  country: CountryCode,
  budgetAmount: number,
  period: 'week' | 'month',
  householdSize: number
): BudgetPlanResult {
  const safePeople = Math.max(1, Math.min(12, Math.round(householdSize || 1)));
  const safeBudget = Math.max(country === 'BD' ? 500 : 15, budgetAmount || 0);
  const days = period === 'week' ? 7 : 30;
  const totalMeals = safePeople * 3 * days;

  const peopleFactor = safePeople / 4;
  const timeFactor = period === 'week' ? 1 : 4.28;
  const scaleFactor = peopleFactor * timeFactor;

  const templates = country === 'BD' ? BD_STAPLES : US_STAPLES;

  // First build scaled tier-1 core list
  const buildCandidate = (maxTier: number, multiplier: number): BudgetLineItem[] => {
    const list: BudgetLineItem[] = [];
    for (const tpl of templates) {
      if (tpl.tier > maxTier) continue;
      const rawQty = tpl.baseQtyPerWeek4People * scaleFactor * multiplier;
      const qty = Math.max(1, Math.round(rawQty));
      const price = Number((qty * tpl.unitPrice).toFixed(2));
      const unitWord = qty === 1 ? tpl.unitSingular : tpl.unitPlural;
      list.push({
        id: tpl.id,
        name: tpl.name,
        quantityLabel: `${qty} ${unitWord}`,
        aisle: tpl.aisle,
        estimatedPrice: price,
        unitNote: `~${formatCurrency(tpl.unitPrice, country)} / ${tpl.unitSingular} est.`,
      });
    }
    return list;
  };

  // Pick tier richness based on budget fit
  let chosen = buildCandidate(3, 1);
  let total = chosen.reduce((s, i) => s + i.estimatedPrice, 0);

  if (total > safeBudget) {
    chosen = buildCandidate(2, 1);
    total = chosen.reduce((s, i) => s + i.estimatedPrice, 0);
  }
  if (total > safeBudget) {
    // Try fitting Tier 1 + selective Tier 2 items that fit under budget
    const tier1 = buildCandidate(1, 1);
    let running = tier1.reduce((s, i) => s + i.estimatedPrice, 0);
    if (running <= safeBudget) {
      const tier2Only = buildCandidate(2, 1).filter(
        (item) => !tier1.some((t1) => t1.id === item.id)
      );
      for (const extra of tier2Only) {
        if (running + extra.estimatedPrice <= safeBudget) {
          tier1.push(extra);
          running += extra.estimatedPrice;
        }
      }
      chosen = tier1;
      total = running;
    } else {
      // Scale down quantities proportionally so even very tight budgets stay realistic
      const ratio = Math.max(0.45, (safeBudget * 0.94) / running);
      chosen = buildCandidate(1, ratio);
      total = chosen.reduce((s, i) => s + i.estimatedPrice, 0);
      // Trim tail items if still slightly above
      while (chosen.length > 4 && total > safeBudget) {
        const removed = chosen.pop()!;
        total -= removed.estimatedPrice;
      }
    }
  } else if (total < safeBudget * 0.72) {
    // Upgrade quantities slightly for generous budgets so meals feel abundant
    const boost = Math.min(1.45, (safeBudget * 0.88) / Math.max(1, total));
    const boosted = buildCandidate(3, boost);
    const boostedTotal = boosted.reduce((s, i) => s + i.estimatedPrice, 0);
    if (boostedTotal <= safeBudget) {
      chosen = boosted;
      total = boostedTotal;
    }
  }

  const roundedTotal = country === 'BD' ? Math.round(total) : Number(total.toFixed(2));
  const savedAmount = Math.max(
    0,
    country === 'BD' ? Math.round(safeBudget - roundedTotal) : Number((safeBudget - roundedTotal).toFixed(2))
  );

  return {
    country,
    storeName: country === 'BD' ? 'Dhaka Bazaar (Est.)' : 'Walmart US (Est.)',
    currencySymbol: country === 'BD' ? '৳' : '$',
    budgetAmount: safeBudget,
    period,
    householdSize: safePeople,
    totalMeals,
    totalSpend: roundedTotal,
    costPerMeal: country === 'BD' ? Math.round(roundedTotal / totalMeals) : Number((roundedTotal / totalMeals).toFixed(2)),
    costPerPerson: country === 'BD' ? Math.round(roundedTotal / safePeople) : Number((roundedTotal / safePeople).toFixed(2)),
    savedAmount,
    isUnderBudget: roundedTotal <= safeBudget,
    items: chosen,
  };
}
