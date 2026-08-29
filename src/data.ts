import { Product, Gym } from './types';

// Let's import or use the correct generated image paths.
// Since Vite can import them, we can use the relative strings directly in our image tags,
// but we must make sure we reference them correctly. We can also import them as assets.
import highProteinMealImg from './assets/images/high_protein_meal_1783093326321.jpg';
import saladBowlImg from './assets/images/fresh_salad_bowl_1783093339839.jpg';

export const PRODUCTS: Product[] = [
  // --- WEIGHT GAIN MEALS ---
  {
    id: 'veg-bulk-50p',
    name: 'Bulk 50P – Weight Gain Meal (Veg)',
    category: 'weight_gain',
    price: 99,
    monthlyPrice: 2499,
    protein: 52.9,
    calories: 574.0,
    carbs: 70.0,
    fats: 13.4,
    bcaa: 9.42,
    eaa: 21.05,
    totalWeight: '250g (Total)',
    description: 'Vegetarian protein to support strength and healthy weight gain. Premium vegetarian mass builder meal with optimal amino acid profile to fuel recovery and muscle protein synthesis.',
    ingredients: ['Soya Chunks', 'Paneer', 'Sprouts', 'Roasted Chana', 'Mixed Fruits', 'Dry Fruits (Dates, Cashews, Raisins, Pumpkin Seeds)'],
    tags: ['50g+ Protein', 'Bulk 50P', 'Weight Gain', 'Veg Plan', 'BCAA 9.42g', 'EAA 21.05g'],
    image: highProteinMealImg,
    images: [
      highProteinMealImg,
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80'
    ],
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
    id: 'veg-bulk-35p',
    name: 'Bulk 35P – Weight Gain Meal (Veg)',
    category: 'weight_gain',
    price: 69,
    monthlyPrice: 1699,
    protein: 35.1,
    calories: 420.3,
    carbs: 54.3,
    fats: 7.0,
    bcaa: 6.17,
    eaa: 13.93,
    totalWeight: '195g (Total)',
    description: 'Balanced vegetarian nutrition for everyday strength and growth. Moderate-calorie muscle builder for steady mass accumulation without unwanted fat.',
    ingredients: ['Soya Chunks', 'Sprouts', 'Roasted Chana', 'Mixed Fruits', 'Dry Fruits (Dates, Cashews, Raisins, Pumpkin Seeds)'],
    tags: ['35g+ Protein', 'Bulk 35P', 'Weight Gain', 'Veg Plan', 'BCAA 6.17g', 'EAA 13.93g'],
    image: highProteinMealImg,
    images: [
      'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
      highProteinMealImg,
      'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=800&q=80'
    ],
    isVeg: true,
    mealItems: [
      { name: 'Soya Chunks', quantity: '40g', protein: 20.9, carbs: 14.2, fats: 0.2, calories: 142.0, bcaa: 3.82, eaa: 8.54 },
      { name: 'Sprouts', quantity: '60g', protein: 4.8, carbs: 7.2, fats: 0.3, calories: 51.0, bcaa: 0.81, eaa: 1.98 },
      { name: 'Roasted Chana', quantity: '25g', protein: 4.6, carbs: 13.8, fats: 1.3, calories: 86.3, bcaa: 0.87, eaa: 1.81 },
      { name: 'Mixed Fruits', quantity: '50g', protein: 0.8, carbs: 7.5, fats: 0.1, calories: 30.0, bcaa: 0.11, eaa: 0.22 },
      { name: 'Dry Fruits (Dates 10g + Cashews 1 pc + Raisins 4 pcs + Pumpkin Seeds 5g)', quantity: '20g (Total)', protein: 4.0, carbs: 11.6, fats: 5.1, calories: 111.0, bcaa: 0.56, eaa: 1.38 }
    ]
  },

  // --- WEIGHT LOSS MEALS ---
  {
    id: 'veg-lean-50p',
    name: 'Lean 50P – Weight Loss Meal (Veg)',
    category: 'weight_loss',
    price: 99,
    monthlyPrice: 2499,
    protein: 50.1,
    calories: 483.0,
    carbs: 57.2,
    fats: 10.76,
    bcaa: 9.33,
    eaa: 20.60,
    totalWeight: '238g (Total)',
    description: 'High-protein vegetarian nutrition for a leaner, stronger you. High protein fat shred meal with dense textured soya, paneer, and fresh low-calorie greens.',
    ingredients: ['Soya Chunks', 'Paneer', 'Sprouts', 'Roasted Chana', 'Veggies (Cucumber, Carrot, Capsicum, Tomato, Lettuce, etc.)', 'Pumpkin Seeds'],
    tags: ['50g+ Protein', 'Lean 50P', 'Weight Loss', 'Veg Plan', 'BCAA 9.33g', 'EAA 20.60g'],
    image: highProteinMealImg,
    images: [
      'https://images.unsplash.com/photo-1547496502-affa22d38842?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=800&q=80',
      highProteinMealImg
    ],
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
    id: 'veg-lean-35p',
    name: 'Lean 35P – Weight Loss Meal (Veg)',
    category: 'weight_loss',
    price: 69,
    monthlyPrice: 1699,
    protein: 36.2,
    calories: 319.0,
    carbs: 43.8,
    fats: 3.17,
    bcaa: 6.22,
    eaa: 13.78,
    totalWeight: '178g (Total)',
    description: 'Light, balanced nutrition to keep you fuelled and satisfied. Calorie-controlled vegetarian shred option using dense protein textures and nutrient-rich greens.',
    ingredients: ['Soya Chunks', 'Sprouts', 'Roasted Chana', 'Veggies (Cucumber, Carrot, Capsicum, Tomato, Lettuce, etc.)', 'Pumpkin Seeds'],
    tags: ['35g+ Protein', 'Lean 35P', 'Weight Loss', 'Veg Plan', 'BCAA 6.22g', 'EAA 13.78g'],
    image: highProteinMealImg,
    images: [
      'https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80'
    ],
    isVeg: true,
    mealItems: [
      { name: 'Soya Chunks', quantity: '45g', protein: 23.6, carbs: 20.4, fats: 0.27, calories: 159.8, bcaa: 4.32, eaa: 9.61 },
      { name: 'Sprouts', quantity: '60g', protein: 4.8, carbs: 7.2, fats: 0.3, calories: 51.0, bcaa: 0.81, eaa: 1.98 },
      { name: 'Roasted Chana', quantity: '20g', protein: 3.7, carbs: 11.0, fats: 1.0, calories: 69.2, bcaa: 0.70, eaa: 1.45 },
      { name: 'Veggies (Cucumber, Carrot, Capsicum, Tomato, Lettuce, etc.)', quantity: '50g', protein: 1.2, carbs: 4.5, fats: 0.2, calories: 22.0, bcaa: 0.21, eaa: 0.42 },
      { name: 'Pumpkin Seeds', quantity: '3g', protein: 0.9, carbs: 0.7, fats: 1.4, calories: 17.0, bcaa: 0.18, eaa: 0.32 }
    ]
  },

  // --- SALADS ---
  {
    id: 'panner-salad',
    name: 'Paneer Salad',
    category: 'salad',
    price: 109,
    monthlyPrice: 2699,
    protein: 22,
    calories: 360,
    carbs: 16,
    fats: 18,
    description: 'Cottage cheese with fresh veggies and a light dressing. Soft high-protein paneer tossed with bell peppers, cucumber, and herbs.',
    ingredients: ['Tandoori Spiced Paneer', 'Tri-color Bell Peppers', 'English Cucumber', 'Cracked Walnuts', 'Thick Mint Greek Yogurt Dressing'],
    tags: ['Paneer Salad', 'Cottage Cheese', 'Veg Protein', 'Keto Friendly'],
    image: saladBowlImg,
    images: [
      'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800&q=80',
      saladBowlImg,
      'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80'
    ],
    isVeg: true
  },
  {
    id: 'fruit-salad',
    name: 'Fruit Salad',
    category: 'salad',
    price: 49,
    monthlyPrice: 1249,
    protein: 4,
    calories: 240,
    carbs: 52,
    fats: 1,
    description: 'A refreshing mix of seasonal fruits. Antioxidant-rich bowl filled with fresh seasonal fruits and a light natural honey mint glaze.',
    ingredients: ['Strawberries', 'Blueberries', 'Kiwi Slices', 'Crispy Apple', 'Pomegranate Pearls', 'Fresh Mint', 'Organic Honey Drizzle'],
    tags: ['Fruit Salad', 'Antioxidant Rich', 'Vitamin Bomb', 'Super Fresh', 'Low Fat'],
    image: saladBowlImg,
    images: [
      'https://images.unsplash.com/photo-1568899307548-490f230554ef?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1519996529931-28324d5a630e?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1490818387583-1baba5e638af?auto=format&fit=crop&w=800&q=80'
    ],
    isVeg: true
  },
  {
    id: 'sprouts-salad',
    name: 'Sprouts Salad',
    category: 'salad',
    price: 45,
    monthlyPrice: 1149,
    protein: 14,
    calories: 280,
    carbs: 42,
    fats: 4,
    description: 'Protein rich sprouts with crunchy veggies and herbs. Traditional protein booster with sprouted green gram, kala chana, cucumber, and lemon chaat masala.',
    ingredients: ['Sprouted Moong', 'Sprouted Kala Chana', 'Crunchy Cucumber', 'Fresh Tomatoes', 'Coriander Leaves', 'Tangy Lemon Juice', 'Chaat Masala'],
    tags: ['Sprouts Salad', 'Digestive Health', 'High Fiber', 'Traditional Food', 'Zero Oil'],
    image: saladBowlImg,
    images: [
      'https://images.unsplash.com/photo-1505576399279-565b52d4ac71?auto=format&fit=crop&w=800&q=80',
      saladBowlImg,
      'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80'
    ],
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
