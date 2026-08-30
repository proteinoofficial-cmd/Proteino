import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Bell, 
  Flame, 
  ShieldCheck, 
  ArrowRight, 
  Plus, 
  Check, 
  Sparkles,
  UtensilsCrossed,
  Leaf,
  Filter,
  ShoppingBag,
  Clock,
  LogIn,
  User,
  Moon,
  Sun,
  AlertCircle,
  X,
  Heart
} from 'lucide-react';
import { Product, ActiveSubscription, CartItem } from '../types';
import { PRODUCTS } from '../data';
import ProductImageSlider from './ProductImageSlider';
import { useStoreHours } from '../utils/storeHours';

interface DashboardProps {
  onProductClick: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  cartCount: number;
  userGoal?: 'gain' | 'loss' | 'maintain';
  userName?: string;
  isGuest?: boolean;
  onSignInClick?: () => void;
  onCartClick?: () => void;
  activeSubscriptions: ActiveSubscription[];
  onViewActivePlans: () => void;
  cart?: CartItem[];
  favorites?: string[];
  onToggleFavorite?: (id: string) => void;
  savedScrollY?: number;
}

export default function Dashboard({ 
  onProductClick, 
  onAddToCart, 
  cartCount,
  userGoal = 'gain',
  userName = '',
  isGuest = false,
  onSignInClick,
  onCartClick,
  activeSubscriptions,
  onViewActivePlans,
  cart = [],
  favorites = [],
  onToggleFavorite,
  savedScrollY = 0
}: DashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'meals' | 'weight_gain' | 'weight_loss' | 'salad'>('all');
  const [vegOnly, setVegOnly] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [addedProductId, setAddedProductId] = useState<string | null>(null);
  const [showClosedNoticeModal, setShowClosedNoticeModal] = useState(false);
  const storeStatus = useStoreHours();
  const notificationRef = useRef<HTMLDivElement>(null);

  // Restore scroll position when returning from product details or switching back to explore
  useEffect(() => {
    let targetY = savedScrollY || 0;
    try {
      const stored = sessionStorage.getItem('proteino_dashboard_scroll');
      if (stored) {
        const parsed = parseInt(stored, 10);
        if (!isNaN(parsed) && parsed > 0) {
          targetY = parsed;
        }
      }
    } catch (e) {}

    if (targetY > 0) {
      window.scrollTo({ top: targetY, behavior: 'instant' as ScrollBehavior });
      document.documentElement.scrollTop = targetY;
      document.body.scrollTop = targetY;

      // Delayed checks to account for image render & layout calculation
      const t1 = setTimeout(() => {
        window.scrollTo({ top: targetY, behavior: 'instant' as ScrollBehavior });
        document.documentElement.scrollTop = targetY;
        document.body.scrollTop = targetY;
      }, 50);

      const t2 = setTimeout(() => {
        window.scrollTo({ top: targetY, behavior: 'instant' as ScrollBehavior });
        document.documentElement.scrollTop = targetY;
        document.body.scrollTop = targetY;
      }, 150);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [savedScrollY]);

  // Keep track of scroll position continuously so navigating away preserves the exact position
  useEffect(() => {
    const onScroll = () => {
      const currentY = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
      if (currentY >= 0) {
        try {
          sessionStorage.setItem('proteino_dashboard_scroll', currentY.toString());
        } catch (e) {}
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  const [notifications, setNotifications] = useState([
    { id: 1, text: '🍗 Non-Veg High-Protein Meals coming soon in 1–2 months! Fresh grilled chicken & egg fitness meals are in the pipeline.', read: false },
    { id: 2, text: 'Your fitness plan recommendation is ready! Check Profile.', read: false },
    { id: 3, text: 'Get 15% off on our 50P Super Protein plan this week.', read: false },
  ]);

  // Close notifications if user clicks or taps anywhere outside
  useEffect(() => {
    if (!showNotifications) return;

    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [showNotifications]);

  // Normalize search query and tokenize
  const cleanQuery = searchQuery.trim().toLowerCase();
  const searchTokens = cleanQuery.split(/\s+/).filter(Boolean);

  // Robust, comprehensive filtering for search, category, and diet
  const filteredProducts = PRODUCTS.filter(product => {
    // 1. Search Query Matching across entire product data
    let matchesSearch = true;
    if (searchTokens.length > 0) {
      const categorySynonyms: Record<string, string> = {
        'weight_gain': 'weight gain bulk mass bulking muscle gainer calories 50p 35p high calorie',
        'weight_loss': 'weight loss lean shred shredded diet cutting fat loss 50p 35p calorie deficit',
        'salad': 'salad fresh green bowl veggies nutritious light keto fiber'
      };

      const productCorpus = [
        product.name,
        product.description,
        product.id,
        product.category,
        product.category.replace('_', ' '),
        categorySynonyms[product.category] || '',
        ...(product.tags || []),
        ...(product.ingredients || []),
        ...(product.mealItems ? product.mealItems.map(m => `${m.name} ${m.protein}g ${m.calories}cal`) : []),
        `${product.protein}g protein ${product.protein}p ${product.calories}kcal ${product.price}rs`,
        product.isVeg ? 'veg vegetarian pure veg' : 'non-veg nonveg'
      ].join(' ').toLowerCase();

      // Every word token in the search must match the product's corpus
      matchesSearch = searchTokens.every(token => productCorpus.includes(token));
    }

    // 2. Category matching
    let matchesCategory = true;
    if (cleanQuery.length > 0) {
      // When searching actively via the search bar, search globally across all categories so results like "Lean" are never hidden
      matchesCategory = true;
    } else {
      if (selectedCategory === 'all') {
        matchesCategory = true;
      } else if (selectedCategory === 'meals') {
        matchesCategory = product.category === 'weight_gain' || product.category === 'weight_loss';
      } else {
        matchesCategory = product.category === selectedCategory;
      }
    }

    // 3. Veg filter
    const matchesVeg = !vegOnly || product.isVeg;

    return matchesSearch && matchesCategory && matchesVeg;
  });

  const markNotificationsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
    setShowNotifications(false);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="flex flex-col h-full bg-[#FAF9F6] overflow-y-auto pb-24 select-none">
      
      {/* Top Header Section with Sign In button on Left/Top Header */}
      <div className="sticky top-0 bg-[#FAF9F6]/95 backdrop-blur-md z-30 px-5 pt-5 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Left Corner Sign In Button for Guest exploration */}
          {isGuest && (
            <button 
              onClick={onSignInClick}
              id="btn-home-signin-left"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-green hover:bg-brand-green-hover text-white text-xs font-black shadow-sm active:scale-95 transition-all duration-200 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}

          <div>
            <h1 className="text-2xl font-black text-brand-green tracking-wider font-display italic">
              PROTEINO
            </h1>
            <p className="text-xs font-semibold text-brand-navy/50">
              {isGuest ? (
                <span>
                  Hi, Guest Explorer 👋 • <button onClick={onSignInClick} className="text-brand-green font-bold hover:underline cursor-pointer bg-transparent border-0 p-0">Log in</button>
                </span>
              ) : (
                <span>Hi, {userName || 'Fitness Enthusiast'} 👋</span>
              )}
            </p>
          </div>
        </div>
        
        {/* Notification Bell Header Container */}
        <div className="flex items-center gap-2">
          {/* Notification Bell Icon & Container */}
          <div className="relative" ref={notificationRef}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2.5 rounded-xl bg-white border border-brand-navy/5 shadow-sm active:scale-95 transition-all duration-200 cursor-pointer"
            >
              <Bell className="w-5 h-5 text-brand-navy" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border border-white animate-pulse" />
              )}
            </button>

          {/* Notifications Dropdown */}
          <AnimatePresence>
            {showNotifications && (
              <>
                {/* Instant Tap/Click Anywhere Outside Backdrop */}
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowNotifications(false)} 
                />
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-brand-navy/10 p-4 z-50"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-sm text-brand-navy">Notifications</h3>
                    {unreadCount > 0 && (
                      <button 
                        onClick={markNotificationsRead}
                        className="text-xs text-brand-green font-bold hover:underline"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <div className="flex flex-col gap-2.5 max-h-60 overflow-y-auto">
                    {notifications.map(item => (
                      <div 
                        key={item.id} 
                        className={`p-2.5 rounded-xl text-xs ${item.read ? 'bg-gray-50 text-gray-500' : 'bg-[#EBF4E0] text-brand-navy border border-brand-green/20'}`}
                      >
                        <p className="font-medium">{item.text}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>

      {/* Guest Welcome Banner for quick sign in / info */}
      {isGuest && (
        <div className="mx-5 mb-2 p-3.5 bg-[#0F1E36] text-white rounded-2xl flex items-center justify-between shadow-sm border border-brand-green/20">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🥗</span>
            <div>
              <p className="text-xs font-bold text-white">Explore Pure High-Protein Meals</p>
              <p className="text-[10px] text-white/60">Sign in anytime to order single meals or gym plans</p>
            </div>
          </div>
          <button
            onClick={onSignInClick}
            className="px-3 py-1.5 bg-brand-green hover:bg-brand-green-hover text-white text-[11px] font-black rounded-xl shadow-xs cursor-pointer transition-all shrink-0 active:scale-95"
          >
            Sign In
          </button>
        </div>
      )}

      <div className="px-5 flex flex-col gap-4">

        {/* Short & Compact Proteino Store Operating Sessions Banner - Positioned right UP of the non-veg notice */}
        <div 
          id="proteino-session-banner"
          className={`rounded-2xl px-3.5 py-2.5 border shadow-2xs transition-all flex items-center justify-between gap-2.5 ${
            storeStatus.isOpen
              ? 'bg-[#0F1E36] border-emerald-500/40 text-white'
              : 'bg-gradient-to-r from-[#0B1528] via-[#102244] to-[#18335D] border-sky-400/30 text-white'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm shrink-0">
              {storeStatus.isOpen ? '🥗' : storeStatus.nextSession === 'evening' ? '🌆' : '🌅'}
            </span>
            <p className="text-xs font-black tracking-tight truncate text-white">
              {storeStatus.shortNotice}
            </p>
          </div>
          <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shrink-0 border ${
            storeStatus.isOpen 
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
              : 'bg-sky-500/20 text-sky-300 border-sky-400/40'
          }`}>
            {storeStatus.isOpen ? '● Live Now' : storeStatus.openBadgeText}
          </span>
        </div>

        {/* Compact Non-Veg Coming Soon Notice - Placed right below the session timing banner */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50/80 border border-amber-200 rounded-2xl px-3.5 py-2 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="text-sm shrink-0">🍗</span>
            <p className="text-xs font-black text-amber-950 tracking-tight">
              Non-veg meal coming soon in 1 to 2 months
            </p>
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded-full shrink-0">
            Stay Tuned
          </span>
        </div>

        {/* Active Gym Subscriptions Highlight Card */}
        {activeSubscriptions.filter(s => s.status !== 'completed').length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={onViewActivePlans}
            className="bg-gradient-to-r from-brand-green to-[#82a45a] text-white rounded-3xl p-5 shadow-md border border-brand-green/10 relative overflow-hidden cursor-pointer hover:shadow-lg transition-all"
          >
            {/* Ambient background accent */}
            <div className="absolute right-[-20px] top-[-20px] w-24 h-24 rounded-full bg-white/10 blur-xl pointer-events-none" />
            
            <div className="flex items-center gap-4 relative z-10">
              <div className="p-3.5 bg-[#0F1E36]/30 backdrop-blur-md rounded-2xl text-white">
                <Clock className="w-5 h-5 text-brand-green animate-pulse" />
              </div>
              <div className="flex-grow">
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] bg-white text-brand-green font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {activeSubscriptions.filter(s => s.status !== 'completed').length} ACTIVE {activeSubscriptions.filter(s => s.status !== 'completed').length === 1 ? 'PLAN' : 'PLANS'}
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/90">
                    Live Trackers Running
                  </span>
                </div>
                
                <h3 className="text-sm font-black text-white mt-1.5 tracking-tight">
                  Track Your Gym Meal Deliveries
                </h3>
                <p className="text-[11px] text-white/80 font-semibold mt-0.5 flex items-center gap-1">
                  <span>View live countdown timers & details</span>
                  <span className="text-xs">➔</span>
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Hero Interactive Banner (Navy blue card from mockup) */}
        <motion.div 
          whileHover={{ scale: 1.01 }}
          className="relative overflow-hidden bg-[#0F1E36] rounded-3xl p-6 text-white shadow-lg"
        >
          {/* Background graphical elements */}
          <div className="absolute right-[-20px] bottom-[-20px] w-48 h-48 rounded-full bg-brand-green/10 blur-2xl pointer-events-none" />
          <div className="absolute left-[-20px] top-[-20px] w-32 h-32 rounded-full bg-white/5 blur-xl pointer-events-none" />

          <div className="relative z-10 flex flex-col justify-between h-full">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-green/20 border border-brand-green/30 text-brand-green text-[10px] font-bold mb-3 uppercase tracking-wider">
                <Sparkles className="w-3 h-3 animate-spin" />
                <span>Fitness Fuel Engine</span>
              </div>
              <h2 className="text-2xl font-black leading-tight tracking-tight font-display">
                Fuel your best <br />
                <span className="text-brand-green">every day.</span>
              </h2>
            </div>

            {/* Icons row */}
            <div className="grid grid-cols-2 gap-3 mt-5 pt-3 border-t border-white/10">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-white/10 text-brand-green flex items-center justify-center">
                  <Flame className="w-4 h-4 text-brand-green fill-brand-green" />
                </div>
                <div>
                  <p className="text-[10px] text-white/50 font-semibold leading-none">Power Source</p>
                  <p className="text-xs font-bold text-white mt-0.5">High in Protein</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-white/10 text-brand-green flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-brand-green" />
                </div>
                <div>
                  <p className="text-[10px] text-white/50 font-semibold leading-none">Quality Check</p>
                  <p className="text-xs font-bold text-white mt-0.5">100% Clean</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Search Option - Positioned directly below the 'Fuel your best every day' banner */}
        <div className="flex flex-col gap-2">
          <div className="relative flex items-center bg-white rounded-2xl border-2 border-brand-navy/10 hover:border-brand-green/40 focus-within:border-brand-green shadow-xs px-4 py-3 transition-all">
            <Search className="w-5 h-5 text-brand-green mr-3 shrink-0" />
            <input 
              type="text" 
              placeholder="Search for meal..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-sm font-bold text-brand-navy placeholder:text-brand-navy/40 w-full focus:outline-none"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="px-2 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-xs font-black text-brand-navy/60 transition-colors cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Category cards ("What would you like?") */}
        <div>
          <h3 className="font-extrabold text-base text-brand-navy mb-3 tracking-tight">
            What would you like?
          </h3>
          <div className="grid grid-cols-2 gap-4">
            
            {/* Meals Option */}
            <button 
              onClick={() => {
                setSelectedCategory('meals');
                setSearchQuery('');
              }}
              className={`relative flex flex-col justify-between text-left p-4 rounded-3xl border transition-all duration-200 shadow-sm cursor-pointer ${selectedCategory === 'meals' || selectedCategory === 'weight_gain' || selectedCategory === 'weight_loss' ? 'bg-[#EBF4E0] border-brand-green/30' : 'bg-white border-brand-navy/5 hover:border-brand-navy/10'}`}
            >
              <div>
                <span className="text-2xl mb-1 block">🍛</span>
                <h4 className="font-extrabold text-sm text-brand-navy">Wholesome Meals</h4>
                <p className="text-[10px] text-brand-navy/50 font-medium leading-normal mt-0.5">
                  High-protein balanced meals
                </p>
              </div>
              <div className="flex items-center justify-between mt-4">
                <div className={`p-1.5 rounded-full flex items-center justify-center ${selectedCategory === 'meals' || selectedCategory === 'weight_gain' || selectedCategory === 'weight_loss' ? 'bg-brand-green text-white' : 'bg-[#FAF9F6] text-brand-navy/30'}`}>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
                <span className="text-sm opacity-40">🔥</span>
              </div>
            </button>

            {/* Salads Option */}
            <button 
              onClick={() => {
                setSelectedCategory('salad');
                setSearchQuery('');
              }}
              className={`relative flex flex-col justify-between text-left p-4 rounded-3xl border transition-all duration-200 shadow-sm cursor-pointer ${selectedCategory === 'salad' ? 'bg-[#EBF4E0] border-brand-green/30' : 'bg-white border-brand-navy/5 hover:border-brand-navy/10'}`}
            >
              <div>
                <span className="text-2xl mb-1 block">🥗</span>
                <h4 className="font-extrabold text-sm text-brand-navy">Salads</h4>
                <p className="text-[10px] text-brand-navy/50 font-medium leading-normal mt-0.5">
                  Fresh, crisp & nutritious bowls
                </p>
              </div>
              <div className="flex items-center justify-between mt-4">
                <div className={`p-1.5 rounded-full flex items-center justify-center ${selectedCategory === 'salad' ? 'bg-brand-green text-white' : 'bg-[#FAF9F6] text-brand-navy/30'}`}>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
                <span className="text-sm opacity-40">🌱</span>
              </div>
            </button>

          </div>
        </div>

        {/* Filters and Search Summary Row */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-full text-[11px] font-bold tracking-tight border transition-all cursor-pointer ${selectedCategory === 'all' && !searchQuery ? 'bg-brand-green border-brand-green text-white' : 'bg-white border-brand-navy/5 text-brand-navy/60 hover:bg-gray-50'}`}
            >
              All Items
            </button>
            <button
              onClick={() => { setSelectedCategory('meals'); setSearchQuery(''); }}
              className={`px-3 py-1.5 rounded-full text-[11px] font-bold tracking-tight border transition-all cursor-pointer ${selectedCategory === 'meals' ? 'bg-brand-green border-brand-green text-white' : 'bg-white border-brand-navy/5 text-brand-navy/60 hover:bg-gray-50'}`}
            >
              Meals
            </button>
            <button
              onClick={() => { setSelectedCategory('weight_gain'); setSearchQuery(''); }}
              className={`px-3 py-1.5 rounded-full text-[11px] font-bold tracking-tight border transition-all cursor-pointer ${selectedCategory === 'weight_gain' ? 'bg-brand-green border-brand-green text-white' : 'bg-white border-brand-navy/5 text-brand-navy/60 hover:bg-gray-50'}`}
            >
              Weight Gain
            </button>
            <button
              onClick={() => { setSelectedCategory('weight_loss'); setSearchQuery(''); }}
              className={`px-3 py-1.5 rounded-full text-[11px] font-bold tracking-tight border transition-all cursor-pointer ${selectedCategory === 'weight_loss' ? 'bg-brand-green border-brand-green text-white' : 'bg-white border-brand-navy/5 text-brand-navy/60 hover:bg-gray-50'}`}
            >
              Weight Loss
            </button>
            <button
              onClick={() => { setSelectedCategory('salad'); setSearchQuery(''); }}
              className={`px-3 py-1.5 rounded-full text-[11px] font-bold tracking-tight border transition-all cursor-pointer ${selectedCategory === 'salad' ? 'bg-brand-green border-brand-green text-white' : 'bg-white border-brand-navy/5 text-brand-navy/60 hover:bg-gray-50'}`}
            >
              Salads
            </button>
          </div>

          {/* Veg Only Toggle */}
          <button 
            onClick={() => setVegOnly(!vegOnly)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full border text-[11px] font-extrabold transition-all cursor-pointer ${vegOnly ? 'bg-[#EBF4E0] border-brand-green text-brand-green' : 'bg-white border-brand-navy/5 text-brand-navy/50'}`}
          >
            <Leaf className={`w-3 h-3 ${vegOnly ? 'text-brand-green fill-brand-green' : 'text-brand-navy/40'}`} />
            <span>Veg</span>
          </button>
        </div>

        {/* Explore Feed */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-extrabold text-base text-brand-navy tracking-tight">
                {searchQuery.trim() ? (
                  <span className="flex items-center gap-1.5 flex-wrap">
                    <span>Results for <span className="text-brand-green">"{searchQuery.trim()}"</span></span>
                    <span className="text-xs font-bold text-brand-navy/50">({filteredProducts.length} {filteredProducts.length === 1 ? 'item' : 'items'})</span>
                  </span>
                ) : (
                  <span>Explore Pure Veg Menu</span>
                )}
              </h3>
              {searchQuery.trim() && (
                <p className="text-[11px] text-brand-navy/60 font-semibold mt-0.5">
                  Showing matching meals, protein values & salads
                </p>
              )}
            </div>
            {searchQuery.trim() ? (
              <button 
                onClick={() => setSearchQuery('')}
                className="text-xs font-bold text-brand-green hover:underline cursor-pointer bg-transparent border-0 p-0"
              >
                Clear search
              </button>
            ) : (
              <span className="text-xs font-bold text-brand-green">({filteredProducts.length} items)</span>
            )}
          </div>

          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 bg-white border border-brand-navy/5 rounded-3xl text-center shadow-xs">
              <span className="text-3xl mb-2">🍽️</span>
              <p className="text-sm font-bold text-brand-navy/80">No meals found for "{searchQuery}"</p>
              <p className="text-xs text-brand-navy/50 mt-1">Try searching for 'Lean', 'Bulk', '50P', 'Paneer', or 'Salad'</p>
              <button 
                onClick={() => { setSearchQuery(''); setSelectedCategory('all'); setVegOnly(false); }}
                className="mt-4 px-4 py-2 bg-brand-green hover:bg-brand-green-hover text-white font-black text-xs rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {filteredProducts.map(product => (
                <motion.div
                  layout
                  key={product.id}
                  onClick={() => onProductClick(product)}
                  className="group bg-white rounded-3xl border border-brand-navy/5 p-3 flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden"
                >
                  {/* Food Image Slider (3x auto sliding every 2.5s) */}
                  <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-gray-50 mb-3 border border-brand-navy/5">
                    <ProductImageSlider
                      images={product.images || [product.image]}
                      fallbackImage={product.image}
                      alt={product.name}
                      intervalMs={2500}
                      aspectClassName="aspect-square"
                      showDots={true}
                      showArrows={false}
                      overlayBadge={
                        <>
                          {/* Diet Dot badge (Green for Veg, Red/Orange for Non-Veg) */}
                          <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm p-1 rounded-md flex items-center justify-center border border-black/5 z-10">
                            <div className={`w-2.5 h-2.5 border ${product.isVeg ? 'border-green-600 bg-green-500 rounded-full' : 'border-red-600 bg-red-500 rounded-sm'}`} />
                          </div>

                          {/* Heart Favorite Button */}
                          {onToggleFavorite && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleFavorite(product.id);
                              }}
                              className="absolute top-2 right-2 z-20 w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm border border-black/5 flex items-center justify-center shadow-xs hover:scale-110 active:scale-95 transition-all cursor-pointer"
                              title={favorites.includes(product.id) ? 'Remove from favorites' : 'Add to favorites'}
                            >
                              <Heart className={`w-3.5 h-3.5 ${favorites.includes(product.id) ? 'text-red-500 fill-red-500' : 'text-slate-400 hover:text-red-400'} transition-colors`} />
                            </button>
                          )}

                          {/* Calories floating badge */}
                          <div className="absolute bottom-2 left-2 bg-brand-navy/85 backdrop-blur-sm px-2 py-0.5 rounded-full text-[9px] font-extrabold text-white z-10">
                            {product.calories} Kcal
                          </div>
                        </>
                      }
                    />
                  </div>

                  {/* Text Details */}
                  <div className="flex-grow flex flex-col justify-between">
                    <div>
                      <h4 className="font-extrabold text-xs text-brand-navy leading-snug line-clamp-1 group-hover:text-brand-green transition-colors">
                        {product.name}
                      </h4>
                      
                      <div className="flex items-center gap-1.5 mt-1">
                        <Flame className="w-3 h-3 text-brand-green fill-brand-green" />
                        <span className="text-[10px] font-bold text-brand-navy/50">
                          {product.protein}g Protein
                        </span>
                      </div>
                    </div>

                    {/* Price and Add Button */}
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-brand-navy/5">
                      <div className="flex flex-col">
                        <div className="flex items-baseline gap-1">
                          <span className="font-extrabold text-sm text-brand-navy leading-none">
                            ₹{product.price}
                          </span>
                          <span className="text-[9px] font-bold text-brand-navy/40">/meal</span>
                        </div>
                        <span className="text-[9.5px] font-black text-brand-green leading-tight mt-0.5">
                          Sub: ₹{product.monthlyPrice}/mo
                        </span>
                      </div>
                      
                      {(() => {
                        const isInCart = cart.some(i => i.product.id === product.id && i.purchaseOption === 'single');
                        const isProductAdded = addedProductId === product.id || isInCart;
                        return (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onAddToCart(product);
                              setAddedProductId(product.id);
                              setTimeout(() => {
                                setAddedProductId(null);
                              }, 1600);
                            }}
                            id={`btn-add-${product.id}`}
                            className={`py-1.5 px-2.5 rounded-xl font-black text-xs transition-all duration-200 active:scale-95 cursor-pointer flex items-center gap-1 shrink-0 ${
                              isProductAdded
                                ? 'bg-[#0F1E36] text-brand-green border border-brand-green shadow-xs'
                                : 'bg-[#EBF4E0] hover:bg-brand-green hover:text-white text-brand-navy border border-brand-green/20 shadow-xs'
                            }`}
                            title="Add single meal to cart"
                          >
                            {isProductAdded ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-brand-green stroke-[3]" />
                                <span className="text-[10px] font-black text-brand-green">Added!</span>
                              </>
                            ) : (
                              <>
                                <Plus className="w-3.5 h-3.5 text-brand-green stroke-[2.5]" />
                                <span className="text-[10px] font-black">ADD</span>
                              </>
                            )}
                          </button>
                        );
                      })()}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Store Closed Modal Dialog */}
      <AnimatePresence>
        {showClosedNoticeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowClosedNoticeModal(false)}
              className="fixed inset-0 bg-[#0F1E36]/80 backdrop-blur-xs cursor-pointer z-40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-amber-200 z-50 overflow-hidden text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 mx-auto flex items-center justify-center mb-3.5 shadow-xs">
                <Clock className="w-7 h-7 animate-pulse text-amber-600" />
              </div>

              <span className="text-[10px] font-black uppercase tracking-widest text-amber-700 bg-amber-100 px-3 py-1 rounded-full inline-block mb-2">
                Ordering Currently Paused
              </span>

              <h3 className="text-base font-black text-brand-navy leading-snug">
                {storeStatus.headline}
              </h3>

              <p className="text-xs font-semibold text-slate-500 mt-2 leading-relaxed">
                {storeStatus.statusMessage}
              </p>

              <div className="bg-[#FAF9F6] border border-slate-200/80 rounded-2xl p-3.5 my-4 text-left flex flex-col gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Proteino Operating Hours:
                </span>
                <div className="flex flex-col gap-1.5 text-xs font-extrabold text-brand-navy">
                  <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-100">
                    <span className="flex items-center gap-1.5">
                      <span>🌅</span>
                      <span>Morning Session:</span>
                    </span>
                    <span className="text-brand-green">6:00 AM – 10:00 AM</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-100">
                    <span className="flex items-center gap-1.5">
                      <span>🌆</span>
                      <span>Evening Session:</span>
                    </span>
                    <span className="text-brand-green">5:00 PM – 10:00 PM</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowClosedNoticeModal(false)}
                className="w-full py-3 bg-[#0F1E36] hover:bg-brand-navy text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer transition-all active:scale-95"
              >
                Understood, I'll Wait
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
