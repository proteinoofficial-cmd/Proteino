import { useState, useEffect } from 'react';
import { 
  User, 
  Target, 
  Scale, 
  Ruler, 
  Calculator, 
  Flame, 
  Beef, 
  Sparkles,
  ChevronRight,
  TrendingUp,
  Check,
  Lock,
  Mail,
  Heart,
  Plus,
  Trash2,
  Utensils,
  ClipboardList,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { UserProfile, Product } from '../types';
import { PRODUCTS } from '../data';

interface ProfileViewProps {
  profile: UserProfile | null;
  favorites?: string[];
  onToggleFavorite?: (id: string) => void;
  onAddToCart?: (product: Product) => void;
  onUpdateProfile: (profile: UserProfile) => void;
  onSelectProduct: (product: Product) => void;
  onSignInClick?: () => void;
}

export default function ProfileView({ 
  profile, 
  favorites = [],
  onToggleFavorite,
  onAddToCart,
  onUpdateProfile, 
  onSelectProduct, 
  onSignInClick 
}: ProfileViewProps) {
  const [showAllGuestFavorites, setShowAllGuestFavorites] = useState(false);
  const [showAllFavorites, setShowAllFavorites] = useState(false);

  const favoriteProducts = PRODUCTS.filter(p => favorites.includes(p.id));
  const dietSheetCalories = favoriteProducts.reduce((sum, p) => sum + p.calories, 0);
  const dietSheetProtein = favoriteProducts.reduce((sum, p) => sum + p.protein, 0);

  if (!profile) {
    const displayedGuestFavorites = showAllGuestFavorites ? favoriteProducts : favoriteProducts.slice(0, 3);

    return (
      <div className="flex flex-col h-full bg-[#FAF9F6] p-5 pb-28 overflow-y-auto select-none">
        <div className="mb-6">
          <h2 className="text-2xl font-black text-brand-navy tracking-tight">Fitness Profile</h2>
          <p className="text-xs font-semibold text-brand-navy/50 mt-0.5">Explore Proteino macro intelligence</p>
        </div>

        <div className="bg-white border border-brand-navy/5 rounded-3xl p-6 shadow-sm flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-3xl bg-brand-green/10 text-brand-green flex items-center justify-center border border-brand-green/20">
            <User className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-black text-brand-navy">Guest Explorer</h3>
            <p className="text-xs text-brand-navy/60 mt-1 max-w-xs leading-relaxed">
              Create an account or sign in to calculate your custom daily calorie & protein targets, save fitness goals, and track your gym delivery orders.
            </p>
          </div>

          <button
            onClick={onSignInClick}
            className="w-full py-4 bg-brand-green hover:bg-brand-green-hover text-white font-extrabold text-sm rounded-2xl shadow-md active:scale-95 transition-all duration-200 cursor-pointer mt-2"
          >
            Sign In / Create Account
          </button>
        </div>

        {/* Diet Sheet & Favorite Meals for Guest */}
        <div className="mt-6 bg-white border border-brand-navy/5 rounded-3xl p-5 shadow-xs flex flex-col gap-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-brand-green/15 text-brand-green flex items-center justify-center">
                <ClipboardList className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-brand-navy">Diet Sheet (Favorites)</h3>
                <p className="text-[10px] font-semibold text-brand-navy/50">Your custom daily macro meal sheet</p>
              </div>
            </div>
            {favoriteProducts.length > 3 && (
              <button
                type="button"
                onClick={() => setShowAllGuestFavorites(!showAllGuestFavorites)}
                className="text-[11px] font-black text-brand-green bg-[#EBF4E0] hover:bg-[#dfeecd] px-2.5 py-1 rounded-full border border-brand-green/20 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>{showAllGuestFavorites ? 'Show Less' : `View All (${favoriteProducts.length})`}</span>
                {showAllGuestFavorites ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            )}
            {favoriteProducts.length <= 3 && (
              <span className="text-[11px] font-mono font-black text-brand-green bg-[#EBF4E0] px-2.5 py-0.5 rounded-full">
                {favoriteProducts.length} {favoriteProducts.length === 1 ? 'Meal' : 'Meals'}
              </span>
            )}
          </div>

          {/* Diet Sheet Macro Summary */}
          {favoriteProducts.length > 0 && (
            <div className="grid grid-cols-2 gap-2 p-2.5 bg-[#FAF9F6] rounded-2xl border border-brand-navy/5 text-center">
              <div>
                <span className="text-[9px] font-black text-brand-navy/40 uppercase tracking-wider block">Total Sheet Energy</span>
                <span className="text-xs font-black text-brand-navy font-display">{dietSheetCalories} Kcal</span>
              </div>
              <div className="border-l border-brand-navy/10">
                <span className="text-[9px] font-black text-brand-navy/40 uppercase tracking-wider block">Total Sheet Protein</span>
                <span className="text-xs font-black text-brand-green font-display">{dietSheetProtein}g Protein</span>
              </div>
            </div>
          )}

          {favoriteProducts.length === 0 ? (
            <div className="bg-[#FAF9F6] rounded-2xl p-5 border border-brand-navy/5 text-center flex flex-col items-center gap-2">
              <ClipboardList className="w-8 h-8 text-slate-300" />
              <p className="text-xs font-bold text-brand-navy/70">Your diet sheet is empty</p>
              <p className="text-[10px] text-brand-navy/50 max-w-xs leading-normal">
                Tap the heart icon (❤️) on any meal in the menu to add it to your custom diet sheet for quick daily orders.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {displayedGuestFavorites.map((product, idx) => (
                <div 
                  key={product.id}
                  className="bg-[#FAF9F6] border border-brand-navy/5 rounded-2xl p-3 flex items-center justify-between hover:border-brand-green/30 transition-all shadow-2xs"
                >
                  <div 
                    onClick={() => onSelectProduct(product)}
                    className="flex items-center gap-3 cursor-pointer flex-grow min-w-0 mr-2"
                  >
                    <div className="relative">
                      <img 
                        src={product.image} 
                        alt={product.name} 
                        className="w-12 h-12 rounded-xl object-cover border border-brand-navy/5 shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <span className="absolute -top-1.5 -left-1.5 bg-brand-navy text-[8px] font-black text-white px-1.5 py-0.2 rounded-md shadow-xs">
                        #{idx + 1}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-xs text-brand-navy truncate">{product.name}</h4>
                      <p className="text-[10px] text-brand-navy/50 font-semibold mt-0.5 truncate">
                        🔥 {product.calories} Kcal • 💪 {product.protein}g Protein
                      </p>
                      <span className="font-black text-xs text-brand-green">₹{product.price}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {onAddToCart && (
                      <button
                        onClick={() => onAddToCart(product)}
                        className="px-3 py-1.5 bg-brand-green hover:bg-brand-green-hover text-white text-[11px] font-black rounded-xl shadow-xs active:scale-95 transition-all cursor-pointer flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    )}
                    {onToggleFavorite && (
                      <button
                        onClick={() => onToggleFavorite(product.id)}
                        className="p-1.5 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors cursor-pointer"
                        title="Remove from diet sheet"
                      >
                        <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {favoriteProducts.length > 3 && (
                <button
                  type="button"
                  onClick={() => setShowAllGuestFavorites(!showAllGuestFavorites)}
                  className="w-full mt-1 py-2 bg-slate-50 hover:bg-slate-100 text-brand-navy font-bold text-xs rounded-xl border border-slate-200/80 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>{showAllGuestFavorites ? 'Show Less (First 3 Meals)' : `View All (${favoriteProducts.length} Meals in Diet Sheet)`}</span>
                  {showAllGuestFavorites ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Feature Highlights */}
        <div className="mt-6 flex flex-col gap-3">
          <h4 className="text-xs font-black uppercase tracking-wider text-brand-navy/40 px-1">Why Sign In?</h4>
          
          <div className="bg-white border border-brand-navy/5 rounded-2xl p-4 flex items-center gap-3.5 shadow-xs">
            <div className="p-2.5 rounded-xl bg-orange-50 text-orange-500 shrink-0">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-brand-navy">Personalized Macro Targets</p>
              <p className="text-[10px] text-brand-navy/50">Auto-calculate exact protein & calorie intake based on your weight goals.</p>
            </div>
          </div>

          <div className="bg-white border border-brand-navy/5 rounded-2xl p-4 flex items-center gap-3.5 shadow-xs">
            <div className="p-2.5 rounded-xl bg-brand-green/10 text-brand-green shrink-0">
              <Beef className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-brand-navy">Daily Protein Log & Streak</p>
              <p className="text-[10px] text-brand-navy/50">Keep track of your muscle building and fat loss journey with real-time logs.</p>
            </div>
          </div>

          <div className="bg-white border border-brand-navy/5 rounded-2xl p-4 flex items-center gap-3.5 shadow-xs">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-500 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-brand-navy">26-Day Gym Subscriptions</p>
              <p className="text-[10px] text-brand-navy/50">Enjoy 15% subscriber discounts and effortless daily desk drop-offs at your gym.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const [name, setName] = useState(profile.name);
  const [weight, setWeight] = useState(profile.weight);
  const [height, setHeight] = useState(profile.height);
  const [goal, setGoal] = useState<'gain' | 'loss' | 'maintain'>(profile.goal);
  const [phone, setPhone] = useState(profile.phone || '');
  const [password, setPassword] = useState(profile.password || '');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setName(profile.name);
    setWeight(profile.weight);
    setHeight(profile.height);
    setGoal(profile.goal);
    setPhone(profile.phone || '');
    setPassword(profile.password || '');
  }, [profile]);

  // Recalculate dynamic targets whenever weight, height or goal changes
  const calculateTargets = (w: number, h: number, g: 'gain' | 'loss' | 'maintain') => {
    let calories = Math.round(w * 30);
    let protein = Math.round(w * 1.8);

    if (g === 'gain') {
      calories = Math.round(w * 38);
      protein = Math.round(w * 2.2);
    } else if (g === 'loss') {
      calories = Math.round(w * 24);
      protein = Math.round(w * 2.0);
    }

    return { calories, protein };
  };

  const handleSave = () => {
    const { calories, protein } = calculateTargets(Number(weight), Number(height), goal);
    onUpdateProfile({
      name,
      email: profile.email,
      goal,
      weight: Number(weight),
      height: Number(height),
      dailyCalorieGoal: calories,
      dailyProteinGoal: protein,
      phone,
      password
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  // Recommendations matching the active goal
  const recommendedProducts = PRODUCTS.filter(p => {
    if (goal === 'gain') return p.category === 'weight_gain';
    if (goal === 'loss') return p.category === 'weight_loss' || p.category === 'salad';
    return true; // maintain gets a mix
  }).slice(0, 3);

  const displayedFavorites = showAllFavorites ? favoriteProducts : favoriteProducts.slice(0, 3);

  return (
    <div className="flex flex-col h-full bg-[#FAF9F6] p-5 pb-24 overflow-y-auto select-none">
      
      {/* Top Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-black text-brand-navy tracking-tight">Your Fitness Profile</h2>
        <p className="text-xs font-semibold text-brand-navy/50 mt-0.5">Customize your personal nutritional goals</p>
      </div>

      <div className="flex flex-col gap-6">
        
        {/* Profile Card & Inputs */}
        <div className="bg-white border border-brand-navy/5 rounded-3xl p-5 shadow-sm flex flex-col gap-4">
          
          {/* Name Field */}
          <div className="flex flex-col gap-1.5 opacity-75">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black uppercase tracking-wider text-brand-navy/40">Full Name</label>
              <span className="text-[9px] font-bold text-brand-navy/30 flex items-center gap-0.5">
                <Lock className="w-2.5 h-2.5" /> Locked
              </span>
            </div>
            <div className="flex items-center bg-brand-navy/5 border border-brand-navy/10 rounded-2xl px-3.5 py-3 cursor-not-allowed">
              <User className="w-4 h-4 text-brand-navy/35 mr-2.5" />
              <input 
                type="text" 
                value={name}
                readOnly
                placeholder="Enter your name"
                className="bg-transparent text-sm font-semibold text-brand-navy/60 w-full focus:outline-none cursor-not-allowed"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="flex flex-col gap-1.5 opacity-75">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black uppercase tracking-wider text-brand-navy/40">Password</label>
              <span className="text-[9px] font-bold text-brand-navy/30 flex items-center gap-0.5">
                <Lock className="w-2.5 h-2.5" /> Locked
              </span>
            </div>
            <div className="flex items-center bg-brand-navy/5 border border-brand-navy/10 rounded-2xl px-3.5 py-3 cursor-not-allowed">
              <Lock className="w-4 h-4 text-brand-navy/35 mr-2.5" />
              <input 
                type="password" 
                value={password}
                readOnly
                placeholder="Password"
                className="bg-transparent text-sm font-semibold text-brand-navy/60 w-full focus:outline-none cursor-not-allowed"
              />
            </div>
          </div>

          {/* Goal Selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-brand-navy/40">Your Health Target</label>
            <div className="grid grid-cols-2 gap-3">
              
              <button
                onClick={() => setGoal('gain')}
                className={`py-3 px-2 rounded-2xl border-2 text-xs font-extrabold flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${goal === 'gain' ? 'bg-[#EBF4E0] border-brand-green text-brand-green' : 'bg-[#FAF9F6] border-brand-navy/5 text-brand-navy/55'}`}
              >
                <TrendingUp className="w-4 h-4" />
                <span>Weight Gain (Bulk)</span>
              </button>

              <button
                onClick={() => setGoal('loss')}
                className={`py-3 px-2 rounded-2xl border-2 text-xs font-extrabold flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${goal === 'loss' ? 'bg-[#EBF4E0] border-brand-green text-brand-green' : 'bg-[#FAF9F6] border-brand-navy/5 text-brand-navy/55'}`}
              >
                <Scale className="w-4 h-4" />
                <span>Weight Loss (Lean)</span>
              </button>

            </div>
          </div>

          {/* Metrics Row: Weight & Height */}
          <div className="grid grid-cols-2 gap-4">
            
            {/* Weight Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-brand-navy/40">Weight (KG)</label>
              <div className="flex items-center bg-[#FAF9F6] border border-brand-navy/5 rounded-2xl px-3.5 py-2.5">
                <Scale className="w-4 h-4 text-brand-navy/35 mr-2.5" />
                <input 
                  type="number" 
                  value={weight}
                  onChange={(e) => setWeight(Number(e.target.value))}
                  placeholder="KG"
                  className="bg-transparent text-sm font-semibold text-brand-navy w-full focus:outline-none"
                />
              </div>
            </div>

            {/* Height Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-brand-navy/40">Height (CM)</label>
              <div className="flex items-center bg-[#FAF9F6] border border-brand-navy/5 rounded-2xl px-3.5 py-2.5">
                <Ruler className="w-4 h-4 text-brand-navy/35 mr-2.5" />
                <input 
                  type="number" 
                  value={height}
                  onChange={(e) => setHeight(Number(e.target.value))}
                  placeholder="CM"
                  className="bg-transparent text-sm font-semibold text-brand-navy w-full focus:outline-none"
                />
              </div>
            </div>

          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            id="btn-save-profile"
            className={`w-full py-3.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer border-0 ${isSaved ? 'bg-brand-navy text-brand-green' : 'bg-brand-green hover:bg-brand-green-hover text-white'} transition-all`}
          >
            {isSaved ? (
              <>
                <Check className="w-4 h-4" />
                <span>Profile Target Saved!</span>
              </>
            ) : (
              <>
                <Calculator className="w-4 h-4" />
                <span>Calculate & Save Macro Plan</span>
              </>
            )}
          </button>

        </div>

        {/* Calculated Daily Target Ring/Card */}
        <div className="bg-[#0F1E36] text-white rounded-3xl p-5 shadow-lg relative overflow-hidden flex flex-col gap-4">
          <div className="absolute right-[-10px] bottom-[-10px] w-36 h-36 rounded-full bg-brand-green/10 blur-xl pointer-events-none" />
          
          <div className="flex items-center gap-2 border-b border-white/10 pb-2.5">
            <Sparkles className="w-4 h-4 text-brand-green animate-spin" />
            <h4 className="text-xs font-black uppercase tracking-wider text-white/70">Calculated Daily Macro Goal</h4>
          </div>

          <div className="grid grid-cols-2 gap-4">
            
            {/* Calories Goal Box */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
              <div className="w-8 h-8 rounded-full bg-orange-500/10 text-orange-400 flex items-center justify-center mx-auto mb-2">
                <Flame className="w-4 h-4 fill-orange-400 text-orange-400" />
              </div>
              <p className="text-lg font-black text-white font-display">{profile.dailyCalorieGoal} <span className="text-[10px] text-white/40 uppercase">Kcal</span></p>
              <p className="text-[9px] font-bold text-white/50 uppercase tracking-tight mt-1">Calorie Budget</p>
            </div>

            {/* Protein Goal Box */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
              <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto mb-2">
                <Beef className="w-4 h-4 text-blue-400" />
              </div>
              <p className="text-lg font-black text-white font-display">{profile.dailyProteinGoal} <span className="text-[10px] text-white/40 uppercase">g</span></p>
              <p className="text-[9px] font-bold text-white/50 uppercase tracking-tight mt-1">Protein Target</p>
            </div>

          </div>
        </div>

        {/* Dynamic Meal Recommendations based on Target */}
        <div>
          <div className="flex items-center justify-between mb-3.5">
            <h3 className="font-extrabold text-base text-brand-navy tracking-tight">Recommended For Your Goal</h3>
            <span className="text-[10px] font-black uppercase tracking-wider text-brand-green bg-[#EBF4E0] border border-brand-green/20 px-2 py-0.5 rounded-full">
              {goal === 'gain' ? 'Bulk Up' : 'Lean Shred'} Plan
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {recommendedProducts.map(product => (
              <div 
                key={product.id}
                onClick={() => onSelectProduct(product)}
                className="bg-white border border-brand-navy/5 rounded-2xl p-3 shadow-sm hover:shadow-md transition-all flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <img 
                    src={product.image} 
                    alt={product.name} 
                    className="w-12 h-12 rounded-xl object-cover border border-brand-navy/5"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h4 className="font-extrabold text-xs text-brand-navy">{product.name}</h4>
                    <p className="text-[10px] text-brand-navy/40 font-semibold mt-0.5">
                      {product.calories} Kcal • {product.protein}g Protein
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-black text-xs text-brand-navy">₹{product.price}</span>
                  <div className="p-1 rounded-lg bg-[#FAF9F6] text-brand-navy/40">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* DIET SHEET & FAVORITES SECTION - LOCATED AT THE LAST / DOWN OF RECOMMENDED FOR YOUR GOAL */}
        <div id="favorites-diet-sheet" className="bg-white border border-brand-navy/5 rounded-3xl p-5 shadow-xs flex flex-col gap-4 scroll-mt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-brand-green/15 text-brand-green flex items-center justify-center shadow-xs">
                <ClipboardList className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-brand-navy">My Diet Sheet (Favorites)</h3>
                <p className="text-[10px] font-semibold text-brand-navy/50">Your custom daily macro meal selection</p>
              </div>
            </div>
            
            {/* View All Option Button / Count Tag */}
            {favoriteProducts.length > 3 ? (
              <button
                type="button"
                onClick={() => setShowAllFavorites(!showAllFavorites)}
                className="text-[11px] font-black text-brand-green bg-[#EBF4E0] hover:bg-[#dfeecd] px-2.5 py-1 rounded-full border border-brand-green/20 transition-all flex items-center gap-1 cursor-pointer"
              >
                <span>{showAllFavorites ? 'Show Less' : `View All (${favoriteProducts.length})`}</span>
                {showAllFavorites ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            ) : (
              <span className="text-[11px] font-mono font-black text-brand-green bg-[#EBF4E0] px-2.5 py-0.5 rounded-full border border-brand-green/20">
                {favoriteProducts.length} {favoriteProducts.length === 1 ? 'Meal' : 'Meals'}
              </span>
            )}
          </div>

          {/* Diet Sheet Macros Combined Banner */}
          {favoriteProducts.length > 0 && (
            <div className="grid grid-cols-2 gap-2 p-3 bg-[#FAF9F6] rounded-2xl border border-brand-navy/5 text-center shadow-2xs">
              <div>
                <span className="text-[9px] font-black text-brand-navy/40 uppercase tracking-wider block">Total Sheet Energy</span>
                <span className="text-sm font-black text-brand-navy font-display">{dietSheetCalories} <span className="text-[10px] font-bold text-brand-navy/40">Kcal</span></span>
              </div>
              <div className="border-l border-brand-navy/10">
                <span className="text-[9px] font-black text-brand-navy/40 uppercase tracking-wider block">Total Sheet Protein</span>
                <span className="text-sm font-black text-brand-green font-display">{dietSheetProtein}g <span className="text-[10px] font-bold text-brand-green/60">Protein</span></span>
              </div>
            </div>
          )}

          {favoriteProducts.length === 0 ? (
            <div className="bg-[#FAF9F6] rounded-2xl p-6 border border-brand-navy/5 text-center flex flex-col items-center gap-2.5">
              <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-slate-400 shadow-xs border border-slate-100">
                <ClipboardList className="w-6 h-6 text-brand-green/60" />
              </div>
              <p className="text-xs font-bold text-brand-navy/75">Your diet sheet is currently empty</p>
              <p className="text-[10.5px] text-brand-navy/50 max-w-xs leading-normal">
                Tap the heart icon (❤️) on any meal in our menu to curate your custom daily diet sheet here for quick reordering.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {displayedFavorites.map((product, index) => (
                <div 
                  key={product.id}
                  className="bg-[#FAF9F6] border border-brand-navy/5 rounded-2xl p-3.5 flex items-center justify-between hover:border-brand-green/30 transition-all shadow-2xs group"
                >
                  <div 
                    onClick={() => onSelectProduct(product)}
                    className="flex items-center gap-3 cursor-pointer flex-grow min-w-0 mr-2"
                  >
                    <div className="relative">
                      <img 
                        src={product.image} 
                        alt={product.name} 
                        className="w-12 h-12 rounded-xl object-cover border border-brand-navy/5 shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <span className="absolute -top-1.5 -left-1.5 bg-brand-navy text-[8px] font-black text-white px-1.5 py-0.2 rounded-md shadow-xs">
                        #{index + 1}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-xs text-brand-navy truncate group-hover:text-brand-green transition-colors">{product.name}</h4>
                      <p className="text-[10px] text-brand-navy/55 font-semibold mt-0.5 truncate">
                        🔥 {product.calories} Kcal • 💪 {product.protein}g Protein
                      </p>
                      <span className="font-black text-xs text-brand-green">₹{product.price}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {onAddToCart && (
                      <button
                        onClick={() => onAddToCart(product)}
                        className="px-3 py-1.5 bg-brand-green hover:bg-brand-green-hover text-white text-[11px] font-black rounded-xl shadow-xs active:scale-95 transition-all cursor-pointer flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    )}
                    {onToggleFavorite && (
                      <button
                        onClick={() => onToggleFavorite(product.id)}
                        className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-500 transition-colors cursor-pointer"
                        title="Remove from diet sheet"
                      >
                        <Heart className="w-3.5 h-3.5 fill-red-500 text-red-500" />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {/* View All Bottom Bar for Diet Sheet */}
              {favoriteProducts.length > 3 && (
                <button
                  type="button"
                  onClick={() => setShowAllFavorites(!showAllFavorites)}
                  className="w-full mt-1 py-2.5 bg-slate-50 hover:bg-slate-100 text-brand-navy font-bold text-xs rounded-xl border border-slate-200/80 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>{showAllFavorites ? 'Show Less (First 3 Meals)' : `View All (${favoriteProducts.length} Meals in Diet Sheet)`}</span>
                  {showAllFavorites ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}

