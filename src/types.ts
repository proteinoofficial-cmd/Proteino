export type Category = 'weight_gain' | 'weight_loss' | 'salad';

export interface MealSubItem {
  name: string;
  quantity: string;
  protein: number;
  carbs: number;
  fats: number;
  calories: number;
  bcaa: number;
  eaa: number;
}

export interface Product {
  id: string;
  name: string;
  category: Category;
  price: number; // One-time price (₹)
  monthlyPrice: number; // 26-Day monthly subscription price (₹)
  protein: number; // e.g. 35 or 50
  calories: number;
  carbs: number;
  fats: number;
  description: string;
  ingredients: string[];
  tags: string[];
  image: string;
  isVeg: boolean;
  bcaa?: number;
  eaa?: number;
  totalWeight?: string;
  mealItems?: MealSubItem[];
}

export interface CartItem {
  product: Product;
  quantity: number;
  purchaseOption: 'single' | 'subscription';
}

export interface Order {
  id: string;
  date: string;
  createdAt?: string;
  items: CartItem[];
  total: number;
  status: 'cooking' | 'out_for_delivery' | 'delivered';
  deliveryTimeRemaining: number; // in minutes for simulator
  customerName?: string;
  customerPhone?: string;
  gymName?: string;
  gymLocation?: string;
  deliveryTimeSlot?: string;
}

export interface UserProfile {
  name: string;
  email: string;
  goal: 'gain' | 'loss' | 'maintain';
  weight: number; // kg
  height: number; // cm
  dailyProteinGoal: number; // g
  dailyCalorieGoal: number; // kcal
  phone?: string;
  password?: string;
  avatar?: string;
}

export interface Gym {
  id: string;
  name: string;
  location: string;
}

export interface ActiveSubscription {
  id: string;
  planId: string;
  planName: string;
  price: number;
  durationDays: number;
  startDate: string;
  createdAt?: string;
  date?: string;
  expiryDate: string;
  customerName: string;
  customerPhone: string;
  gymId: string;
  gymName: string;
  gymLocation: string;
  timeSlot: string;
  isPaused: boolean;
  pausedAt?: string;
  status?: 'active' | 'completed';
}

