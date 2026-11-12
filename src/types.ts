export type CountryCode = 'US' | 'BD';

export type ScreenFlow = 'splash' | 'onboarding' | 'country' | 'auth' | 'app';

export type AuthPageMode = 'login' | 'register' | 'forgot' | 'reset';

export type TabId = 'home' | 'planner' | 'budget' | 'gym' | 'profile';

export type CategoryChip =
  | 'All'
  | 'Burger'
  | 'Noodles'
  | 'Salad'
  | 'Rice'
  | 'Gym'
  | 'Bangladeshi';

export type Aisle = 'Produce' | 'Meat & Fish' | 'Dairy' | 'Pantry';

export type DayOfWeek =
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday'
  | 'Sunday';

export type MealSlot = 'breakfast' | 'lunch' | 'dinner';

export interface RecipeIngredient {
  id: string;
  name: string;
  amount: number;
  unit: string;
  aisle: Aisle;
  usCostPerBase: number;
  bdCostPerBase: number;
}

export interface Recipe {
  id: string;
  title: string;
  image: string;
  description: string;
  prepMinutes: number;
  servings: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  categories: CategoryChip[];
  isGym: boolean;
  isVegetarian: boolean;
  isBangladeshi: boolean;
  ingredients: RecipeIngredient[];
  steps: string[];
}

export interface PlannedMeal {
  recipeId: string;
  servings: number;
}

export type WeeklyPlan = Record<DayOfWeek, Partial<Record<MealSlot, PlannedMeal>>>;

export interface BudgetLineItem {
  id: string;
  name: string;
  quantityLabel: string;
  aisle: Aisle;
  estimatedPrice: number;
  unitNote: string;
}

export interface BudgetPlanResult {
  country: CountryCode;
  storeName: string;
  currencySymbol: string;
  budgetAmount: number;
  period: 'week' | 'month';
  householdSize: number;
  totalMeals: number;
  totalSpend: number;
  costPerMeal: number;
  costPerPerson: number;
  savedAmount: number;
  isUnderBudget: boolean;
  items: BudgetLineItem[];
}

export interface BmiInputs {
  unit: 'metric' | 'imperial';
  cm: number;
  kg: number;
  feet: number;
  inches: number;
  lbs: number;
}

export type GymGoal = 'build' | 'maintain' | 'lose';

export interface PriceReferenceRow {
  id: string;
  item: string;
  unit: string;
  price: number;
  aisle: Aisle;
}
