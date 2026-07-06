import { Product, Gym } from './types';

// Let's import or use the correct generated image paths.
// Since Vite can import them, we can use the relative strings directly in our image tags,
// but we must make sure we reference them correctly. We can also import them as assets.
import highProteinMealImg from './assets/images/high_protein_meal_1783093326321.jpg';
import saladBowlImg from './assets/images/fresh_salad_bowl_1783093339839.jpg';

export const PRODUCTS: Product[] = [
  // --- WEIGHT GAIN MEALS ---
  {
    id: 'veg-bulk-35p',
    name: 'Weight Gain Meal Plan – 35g+ Protein (Veg)',
    category: 'weight_gain',
    price: 199,
    protein: 35.1,
    calories: 420.3,
    carbs: 54.3,
    fats: 7.0,
    bcaa: 6.17,
    eaa: 13.93,
    totalWeight: '195g (Total)',
    description: 'Real Food. Real Nutrition. Real Gains. Perfectly balanced moderate-calorie muscle builder for steady, high-quality mass accumulation without unwanted fat storage.',
    ingredients: ['Soya Chunks', 'Sprouts', 'Roasted Chana', 'Mixed Fruits', 'Dry Fruits (Dates, Cashews, Raisins, Pumpkin Seeds)'],
    tags: ['35g+ Protein', 'Weight Gain', 'Veg Plan', 'BCAA 6.17g', 'EAA 13.93g'],
    image: highProteinMealImg,
    isVeg: true,
    mealItems: [
      { name: 'Soya Chunks', quantity: '40g', protein: 20.9, carbs: 14.2, fats: 0.2, calories: 142.0, bcaa: 3.82, eaa: 8.54 },
      { name: 'Sprouts', quantity: '60g', protein: 4.8, carbs: 7.2, fats: 0.3, calories: 51.0, bcaa: 0.81, eaa: 1.98 },
      { name: 'Roasted Chana', quantity: '25g', protein: 4.6, carbs: 13.8, fats: 1.3, calories: 86.3, bcaa: 0.87, eaa: 1.81 },
      { name: 'Mixed Fruits', quantity: '50g', protein: 0.8, carbs: 7.5, fats: 0.1, calories: 30.0, bcaa: 0.11, eaa: 0.22 },
      { name: 'Dry Fruits (Dates 10g + Cashews 1 pc + Raisins 4 pcs + Pumpkin Seeds 5g)', quantity: '20g (Total)', protein: 4.0, carbs: 11.6, fats: 5.1, calories: 111.0, bcaa: 0.56, eaa: 1.38 }
    ]
  },
  {
    id: 'veg-bulk-50p',
    name: 'Weight Gain Meal Plan – 50g+ Protein (Veg)',
    category: 'weight_gain',
    price: 249,
    protein: 52.9,
    calories: 574.0,
    carbs: 70.0,
    fats: 13.4,
    bcaa: 9.42,
    eaa: 21.05,
    totalWeight: '250g (Total)',
    description: 'Real Food. Real Nutrition. Real Gains. Premium vegetarian mass builder meal with optimal amino acid profile to fuel recovery and muscle protein synthesis.',
    ingredients: ['Soya Chunks', 'Paneer', 'Sprouts', 'Roasted Chana', 'Mixed Fruits', 'Dry Fruits (Dates, Cashews, Raisins, Pumpkin Seeds)'],
    tags: ['50g+ Protein', 'Weight Gain', 'Veg Plan', 'BCAA 9.42g', 'EAA 21.05g'],
    image: highProteinMealImg,
    isVeg: true,
    mealItems: [
      { name: 'Soya Chunks', quantity: '60g', protein: 31.4, carbs: 27.2, fats: 0.36, calories: 213.0, bcaa: 5.76, eaa: 12.84 },
      { name: 'Paneer', quantity: '30g', protein: 5.4, carbs: 0.9, fats: 6.0, calories: 65.0, bcaa: 1.14, eaa: 2.46 },
      { name: 'Sprouts', quantity: '60g', protein: 4.8, carbs: 7.2, fats: 0.3, calories: 51.0, bcaa: 0.81, eaa: 1.98 },
      { name: 'Roasted Chana', quantity: '30g', protein: 5.5, carbs: 16.6, fats: 1.5, calories: 104.0, bcaa: 1.04, eaa: 2.17 },
      { name: 'Mixed Fruits', quantity: '50g', protein: 0.8, carbs: 7.5, fats: 0.1, calories: 30.0, bcaa: 0.11, eaa: 0.22 },
      { name: 'Dry Fruits (Dates 10g + Cashews 1 pc + Raisins 4 pcs + Pumpkin Seeds 5g)', quantity: '20g (Total)', protein: 4.0, carbs: 11.6, fats: 5.1, calories: 111.0, bcaa: 0.56, eaa: 1.38 }
    ]
  },
  {
    id: 'nonveg-bulk-35p',
    name: 'Weight Gain Meal Plan – 35g+ Protein (Non-Veg)',
    category: 'weight_gain',
    price: 229,
    protein: 39.6,
    calories: 310.0,
    carbs: 12.7,
    fats: 10.74,
    bcaa: 7.35,
    eaa: 17.10,
    totalWeight: '~198g (Total)',
    description: 'Real Food. Real Nutrition. Real Results. Optimized mass gainer meal utilizing high-bioavailability poultry and egg proteins along with dense amino sources.',
    ingredients: ['Chicken (Boiled/Grilled)', 'Whole Eggs', 'Soya Chunks (Dry)', 'Sprouts', 'Pumpkin Seeds'],
    tags: ['35g+ Protein', 'Weight Gain', 'Non-Veg', 'BCAA 7.35g', 'EAA 17.10g'],
    image: highProteinMealImg,
    isVeg: false,
    mealItems: [
      { name: 'Chicken (Boiled/Grilled)', quantity: '55g', protein: 17.4, carbs: 0.0, fats: 1.9, calories: 92.0, bcaa: 3.40, eaa: 7.90 },
      { name: 'Whole Eggs (1.5 Eggs ~75g)', quantity: '1.5 (~75g)', protein: 9.5, carbs: 0.6, fats: 7.1, calories: 107.0, bcaa: 1.65, eaa: 4.00 },
      { name: 'Soya Chunks (Dry)', quantity: '15g', protein: 7.8, carbs: 5.4, fats: 0.09, calories: 52.0, bcaa: 1.44, eaa: 3.20 },
      { name: 'Sprouts', quantity: '50g', protein: 4.0, carbs: 6.0, fats: 0.25, calories: 42.0, bcaa: 0.68, eaa: 1.68 },
      { name: 'Pumpkin Seeds', quantity: '3g', protein: 0.9, carbs: 0.7, fats: 1.4, calories: 17.0, bcaa: 0.18, eaa: 0.32 }
    ]
  },
  {
    id: 'nonveg-bulk-50p',
    name: 'Weight Gain Meal Plan – 50g+ Protein (Non-Veg)',
    category: 'weight_gain',
    price: 279,
    protein: 54.0,
    calories: 446.0,
    carbs: 25.6,
    fats: 14.58,
    bcaa: 9.95,
    eaa: 23.29,
    totalWeight: '~266g (Total)',
    description: 'Real Food. Real Nutrition. Real Results. Heavy-duty non-veg bulk meal loaded with premium amino acids and healthy fats for extreme recovery.',
    ingredients: ['Chicken (Boiled/Grilled)', 'Whole Eggs', 'Soya Chunks', 'Sprouts', 'Dry Fruits (Pumpkin Seeds 3g + Dates 10g)'],
    tags: ['50g+ Protein', 'Weight Gain', 'Non-Veg', 'BCAA 9.95g', 'EAA 23.29g'],
    image: highProteinMealImg,
    isVeg: false,
    mealItems: [
      { name: 'Chicken (Boiled/Grilled)', quantity: '65g', protein: 20.2, carbs: 0.0, fats: 2.3, calories: 107.0, bcaa: 3.95, eaa: 9.25 },
      { name: 'Whole Eggs (2 Eggs ~100g)', quantity: '2 (~100g)', protein: 12.6, carbs: 0.7, fats: 10.0, calories: 143.0, bcaa: 2.20, eaa: 5.40 },
      { name: 'Soya Chunks', quantity: '28g', protein: 14.5, carbs: 10.1, fats: 0.18, calories: 98.0, bcaa: 2.68, eaa: 5.93 },
      { name: 'Sprouts', quantity: '60g', protein: 4.8, carbs: 7.2, fats: 0.30, calories: 51.0, bcaa: 0.82, eaa: 1.98 },
      { name: 'Dry Fruits (Pumpkin Seeds 3g + Dates 10g)', quantity: '13g Total', protein: 1.8, carbs: 7.6, fats: 1.8, calories: 47.0, bcaa: 0.30, eaa: 0.73 }
    ]
  },

  // --- WEIGHT LOSS MEALS ---
  {
    id: 'veg-lean-35p',
    name: 'Weight Loss Meal Plan – 35g+ Protein (Veg)',
    category: 'weight_loss',
    price: 179,
    protein: 36.2,
    calories: 319.0,
    carbs: 43.8,
    fats: 3.17,
    bcaa: 6.22,
    eaa: 13.78,
    totalWeight: '178g (Total)',
    description: 'Real Food. Real Nutrition. Real Results. Calorie-controlled vegetarian shred option using dense protein textures and fresh nutrient-rich greens.',
    ingredients: ['Soya Chunks', 'Sprouts', 'Roasted Chana', 'Veggies (Cucumber, Carrot, Capsicum, Tomato, Lettuce, etc.)', 'Pumpkin Seeds'],
    tags: ['35g+ Protein', 'Weight Loss', 'Veg Plan', 'BCAA 6.22g', 'EAA 13.78g'],
    image: highProteinMealImg,
    isVeg: true,
    mealItems: [
      { name: 'Soya Chunks', quantity: '45g', protein: 23.6, carbs: 20.4, fats: 0.27, calories: 159.8, bcaa: 4.32, eaa: 9.61 },
      { name: 'Sprouts', quantity: '60g', protein: 4.8, carbs: 7.2, fats: 0.3, calories: 51.0, bcaa: 0.81, eaa: 1.98 },
      { name: 'Roasted Chana', quantity: '20g', protein: 3.7, carbs: 11.0, fats: 1.0, calories: 69.2, bcaa: 0.70, eaa: 1.45 },
      { name: 'Veggies (Cucumber, Carrot, Capsicum, Tomato, Lettuce, etc.)', quantity: '50g', protein: 1.2, carbs: 4.5, fats: 0.2, calories: 22.0, bcaa: 0.21, eaa: 0.42 },
      { name: 'Pumpkin Seeds', quantity: '3g', protein: 0.9, carbs: 0.7, fats: 1.4, calories: 17.0, bcaa: 0.18, eaa: 0.32 }
    ]
  },
  {
    id: 'veg-lean-50p',
    name: 'Weight Loss Meal Plan – 50g+ Protein (Veg)',
    category: 'weight_loss',
    price: 229,
    protein: 50.1,
    calories: 483.0,
    carbs: 57.2,
    fats: 10.76,
    bcaa: 9.33,
    eaa: 20.60,
    totalWeight: '238g (Total)',
    description: 'Real Food. Real Nutrition. Real Results. High protein fat shred meal with dense textured soya, paneer, and fresh low-calorie greens to maximize satiety.',
    ingredients: ['Soya Chunks', 'Paneer', 'Sprouts', 'Roasted Chana', 'Veggies (Cucumber, Carrot, Capsicum, Tomato, Lettuce, etc.)', 'Pumpkin Seeds'],
    tags: ['50g+ Protein', 'Weight Loss', 'Veg Plan', 'BCAA 9.33g', 'EAA 20.60g'],
    image: highProteinMealImg,
    isVeg: true,
    mealItems: [
      { name: 'Soya Chunks', quantity: '60g', protein: 31.4, carbs: 27.2, fats: 0.36, calories: 213.0, bcaa: 5.76, eaa: 12.84 },
      { name: 'Paneer', quantity: '35g', protein: 6.3, carbs: 1.0, fats: 7.0, calories: 76.0, bcaa: 1.33, eaa: 2.87 },
      { name: 'Sprouts', quantity: '60g', protein: 4.8, carbs: 7.2, fats: 0.3, calories: 51.0, bcaa: 0.81, eaa: 1.98 },
      { name: 'Roasted Chana', quantity: '30g', protein: 5.5, carbs: 16.6, fats: 1.5, calories: 104.0, bcaa: 1.04, eaa: 2.17 },
      { name: 'Veggies (Cucumber, Carrot, Capsicum, Tomato, Lettuce, etc.)', quantity: '50g', protein: 1.2, carbs: 4.5, fats: 0.2, calories: 22.0, bcaa: 0.21, eaa: 0.42 },
      { name: 'Pumpkin Seeds', quantity: '3g', protein: 0.9, carbs: 0.7, fats: 1.4, calories: 17.0, bcaa: 0.18, eaa: 0.32 }
    ]
  },
  {
    id: 'nonveg-lean-35p',
    name: 'Weight Loss Meal Plan – 35g+ Protein (Non-Veg)',
    category: 'weight_loss',
    price: 199,
    protein: 37.5,
    calories: 247.0,
    carbs: 17.0,
    fats: 2.62,
    bcaa: 7.13,
    eaa: 16.48,
    totalWeight: '215g (Total)',
    description: 'Real Food. Real Nutrition. Real Results. Maximum fat loss efficiency featuring steamed chicken breast, egg whites, and fiber-packed veggies.',
    ingredients: ['Chicken (Boiled/Grilled)', 'Egg Whites', 'Soya Chunks', 'Sprouts', 'Veggies (Cucumber, Carrot, Capsicum, Tomato, Lettuce, etc.)'],
    tags: ['35g+ Protein', 'Weight Loss', 'Non-Veg', 'BCAA 7.13g', 'EAA 16.48g'],
    image: highProteinMealImg,
    isVeg: false,
    mealItems: [
      { name: 'Chicken (Boiled/Grilled)', quantity: '55g', protein: 17.1, carbs: 0.0, fats: 2.0, calories: 95.0, bcaa: 3.35, eaa: 7.85 },
      { name: 'Egg Whites (1.5 Eggs ~50g)', quantity: '1.5 (~50g)', protein: 5.5, carbs: 0.5, fats: 0.1, calories: 25.0, bcaa: 1.10, eaa: 2.60 },
      { name: 'Soya Chunks', quantity: '20g', protein: 10.5, carbs: 7.2, fats: 0.12, calories: 71.0, bcaa: 1.93, eaa: 4.28 },
      { name: 'Sprouts', quantity: '40g', protein: 3.2, carbs: 4.8, fats: 0.2, calories: 34.0, bcaa: 0.54, eaa: 1.33 },
      { name: 'Veggies (Cucumber, Carrot, Capsicum, Tomato, Lettuce, etc.)', quantity: '50g', protein: 1.2, carbs: 4.5, fats: 0.2, calories: 22.0, bcaa: 0.21, eaa: 0.42 }
    ]
  },
  {
    id: 'nonveg-lean-50p',
    name: 'Weight Loss Meal Plan – 50g+ Protein (Non-Veg)',
    category: 'weight_loss',
    price: 249,
    protein: 53.3,
    calories: 353.0,
    carbs: 24.5,
    fats: 4.67,
    bcaa: 10.15,
    eaa: 23.36,
    totalWeight: '260g (Total)',
    description: 'Real Food. Real Nutrition. Real Results. Ultimate high-satiety shred program utilizing pure high-bioavailability poultry, egg white, and seed nutrients.',
    ingredients: ['Chicken (Boiled/Grilled)', 'Egg Whites', 'Soya Chunks', 'Sprouts', 'Veggies (Cucumber, Carrot, Capsicum, Tomato, Lettuce, etc.)', 'Pumpkin Seeds'],
    tags: ['50g+ Protein', 'Weight Loss', 'Non-Veg', 'BCAA 10.15g', 'EAA 23.36g'],
    image: highProteinMealImg,
    isVeg: false,
    mealItems: [
      { name: 'Chicken (Boiled/Grilled)', quantity: '70g', protein: 21.7, carbs: 0.0, fats: 2.5, calories: 115.0, bcaa: 4.25, eaa: 9.95 },
      { name: 'Egg Whites (2 Eggs ~66g)', quantity: '2 (~66g)', protein: 7.3, carbs: 0.7, fats: 0.1, calories: 34.0, bcaa: 1.46, eaa: 3.50 },
      { name: 'Soya Chunks', quantity: '35g', protein: 18.2, carbs: 12.6, fats: 0.22, calories: 123.0, bcaa: 3.37, eaa: 7.49 },
      { name: 'Sprouts', quantity: '50g', protein: 4.0, carbs: 6.0, fats: 0.25, calories: 42.0, bcaa: 0.68, eaa: 1.68 },
      { name: 'Veggies (Cucumber, Carrot, Capsicum, Tomato, Lettuce, etc.)', quantity: '50g', protein: 1.2, carbs: 4.5, fats: 0.2, calories: 22.0, bcaa: 0.21, eaa: 0.42 },
      { name: 'Pumpkin Seeds', quantity: '3g', protein: 0.9, carbs: 0.7, fats: 1.4, calories: 17.0, bcaa: 0.18, eaa: 0.32 }
    ]
  },

  // --- SALADS ---
  {
    id: 'fruit-salad',
    name: 'Fruit salad',
    category: 'salad',
    price: 129,
    protein: 4,
    calories: 240,
    carbs: 52,
    fats: 1,
    description: 'Refreshing antioxidant-rich bowl filled with seasonal berries, pomegranate pearls, apples, kiwi, and honey mint glaze.',
    ingredients: ['Strawberries', 'Blueberries', 'Kiwi Slices', 'Crispy Apple', 'Pomegranate Pearls', 'Fresh Mint', 'Organic Honey Drizzle'],
    tags: ['Antioxidant Rich', 'Vitamin Bomb', 'Super Fresh', 'Low Fat'],
    image: saladBowlImg,
    isVeg: true
  },
  {
    id: 'sprouts-salad',
    name: 'Sprouts salad',
    category: 'salad',
    price: 119,
    protein: 14,
    calories: 280,
    carbs: 42,
    fats: 4,
    description: 'Traditional protein booster with organic sprouted green gram, Bengal gram, cucumber, tomatoes, and lemon chaat masala.',
    ingredients: ['Sprouted Moong', 'Sprouted Kala Chana', 'Crunchy Cucumber', 'Fresh Tomatoes', 'Coriander Leaves', 'Tangy Lemon Juice', 'Chaat Masala'],
    tags: ['Digestive Health', 'High Fiber', 'Traditional Food', 'Zero Oil'],
    image: saladBowlImg,
    isVeg: true
  },
  {
    id: 'chicken-salad',
    name: 'Chicken salad',
    category: 'salad',
    price: 189,
    protein: 32,
    calories: 380,
    carbs: 18,
    fats: 12,
    description: 'Crispy lettuce bed topped with smoked chicken cubes, cherry tomatoes, olives, and a light caesar yogurt dressing.',
    ingredients: ['Smoked Chicken Breasts', 'Crisp Romaine Lettuce', 'Cherry Tomatoes', 'Black Olives', 'Baked Herb Croutons', 'Light Yogurt Caesar Dressing'],
    tags: ['Low Carb Salad', 'Pro Lean', 'Very Satiating', 'Gourmet Greens'],
    image: saladBowlImg,
    isVeg: false
  },
  {
    id: 'panner-salad',
    name: 'Paneer salad',
    category: 'salad',
    price: 169,
    protein: 22,
    calories: 360,
    carbs: 16,
    fats: 18,
    description: 'Soft tandoori paneer cubes tossed with mixed bell peppers, cucumber, walnuts, and mint yoghurt dressing.',
    ingredients: ['Tandoori Spiced Paneer', 'Tri-color Bell Peppers', 'English Cucumber', 'Cracked Walnuts', 'Thick Mint Greek Yogurt Dressing'],
    tags: ['Creamy & Healthy', 'Good Fats', 'Veg Protein', 'Keto Friendly'],
    image: saladBowlImg,
    isVeg: true
  },
  {
    id: 'soya-salad',
    name: 'Soya salad',
    category: 'salad',
    price: 139,
    protein: 24,
    calories: 310,
    carbs: 24,
    fats: 10,
    description: 'High-protein vegan salad with air-fried soya chunks, roasted peanuts, onion, tomatoes, and spicy lemon tamarind dressing.',
    ingredients: ['Air-fried Soya Chunks', 'Roasted Peanuts', 'Red Onions', 'Juicy Tomatoes', 'Fresh Coriander', 'Lemon Tamarind Dressing'],
    tags: ['100% Vegan', 'High Plant Protein', 'Crunchy Texture', 'Spicy Kick'],
    image: saladBowlImg,
    isVeg: true
  }
];

export const GYMS: Gym[] = [
  { id: 'g1', name: "Gold's Gym", location: 'Downtown Fitness Hub, Sector 4' },
  { id: 'g2', name: 'Cult.fit Center', location: 'Active Life Park, Phase 1' },
  { id: 'g3', name: 'Anytime Fitness', location: 'Metro Plaza, Level 2, Sector 15' },
  { id: 'g4', name: 'Talwalkars Gym', location: 'High Street Galleria, Block C' },
  { id: 'g5', name: 'Powerhouse Gym', location: 'Iron Arena Street, Sector 12' }
];
