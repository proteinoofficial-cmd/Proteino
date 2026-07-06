import { useState, useEffect } from 'react';
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
  Clock
} from 'lucide-react';
import { Product, ActiveSubscription } from '../types';
import { PRODUCTS } from '../data';

interface DashboardProps {
  onProductClick: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  cartCount: number;
  userGoal: 'gain' | 'loss' | 'maintain';
  userName: string;
  onCartClick?: () => void;
  activeSubscriptions: ActiveSubscription[];
  onViewActivePlans: () => void;
}

export default function Dashboard({ 
  onProductClick, 
  onAddToCart, 
  cartCount,
  userGoal,
  userName,
  onCartClick,
  activeSubscriptions,
  onViewActivePlans
}: DashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'weight_gain' | 'weight_loss' | 'salad'>('all');
  const [vegOnly, setVegOnly] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, text: 'Your fitness plan recommendation is ready! Check Profile.', read: false },
    { id: 2, text: 'Get 15% off on our 50P Super Protein plan this week.', read: false },
  ]);

  // Filtering products
  const filteredProducts = PRODUCTS.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
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
      
      {/* Top Header Section */}
      <div className="sticky top-0 bg-[#FAF9F6]/95 backdrop-blur-md z-30 px-5 pt-5 pb-3 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-brand-green tracking-wider font-display italic">
            PROTEINO
          </h1>
          <p className="text-xs font-semibold text-brand-navy/50">
            Hi, {userName || 'Fitness Enthusiast'} 👋
          </p>
        </div>
        
        {/* Notification Bell & Cart Icon Row */}
        <div className="flex items-center gap-2">
          {/* Cart Icon Button */}
          <button 
            onClick={onCartClick}
            className="relative p-2.5 rounded-xl bg-white border border-brand-navy/5 shadow-sm active:scale-95 transition-all duration-200 cursor-pointer"
          >
            <ShoppingBag className="w-5 h-5 text-brand-navy" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-brand-green text-white text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border border-white">
                {cartCount}
              </span>
            )}
          </button>

          {/* Notification Bell Icon */}
          <div className="relative">
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
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>

      <div className="px-5 flex flex-col gap-5">
        
        {/* Interactive Search Bar */}
        <div className="relative flex items-center bg-white rounded-2xl border border-brand-navy/5 shadow-sm px-4 py-3">
          <Search className="w-5 h-5 text-brand-navy/30 mr-3" />
          <input 
            type="text" 
            placeholder="Search weight goals, salads..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-sm font-semibold text-brand-navy placeholder:text-brand-navy/35 w-full focus:outline-none"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="text-xs font-bold text-brand-navy/50 hover:text-brand-navy"
            >
              Clear
            </button>
          )}
        </div>

        {/* Active Gym Subscriptions Highlight Card */}
        {activeSubscriptions.length > 0 && (
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
                    {activeSubscriptions.length} ACTIVE {activeSubscriptions.length === 1 ? 'PLAN' : 'PLANS'}
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

        {/* Category cards ("What would you like?") */}
        <div>
          <h3 className="font-extrabold text-base text-brand-navy mb-3 tracking-tight">
            What would you like?
          </h3>
          <div className="grid grid-cols-2 gap-4">
            
            {/* Meals Option */}
            <button 
              onClick={() => setSelectedCategory('weight_gain')}
              className={`relative flex flex-col justify-between text-left p-4 rounded-3xl border transition-all duration-200 shadow-sm cursor-pointer ${selectedCategory === 'weight_gain' || selectedCategory === 'weight_loss' ? 'bg-[#EBF4E0] border-brand-green/30' : 'bg-white border-brand-navy/5 hover:border-brand-navy/10'}`}
            >
              <div>
                <span className="text-2xl mb-1 block">🍛</span>
                <h4 className="font-extrabold text-sm text-brand-navy">Meals</h4>
                <p className="text-[10px] text-brand-navy/50 font-medium leading-normal mt-0.5">
                  Wholesome & balanced meals
                </p>
              </div>
              <div className="flex items-center justify-between mt-4">
                <div className={`p-1.5 rounded-full flex items-center justify-center ${selectedCategory === 'weight_gain' || selectedCategory === 'weight_loss' ? 'bg-brand-green text-white' : 'bg-[#FAF9F6] text-brand-navy/30'}`}>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
                {/* Micro illustration inside card */}
                <span className="text-sm opacity-40">🔥</span>
              </div>
            </button>

            {/* Salads Option */}
            <button 
              onClick={() => setSelectedCategory('salad')}
              className={`relative flex flex-col justify-between text-left p-4 rounded-3xl border transition-all duration-200 shadow-sm cursor-pointer ${selectedCategory === 'salad' ? 'bg-[#EBF4E0] border-brand-green/30' : 'bg-white border-brand-navy/5 hover:border-brand-navy/10'}`}
            >
              <div>
                <span className="text-2xl mb-1 block">🥗</span>
                <h4 className="font-extrabold text-sm text-brand-navy">Salads</h4>
                <p className="text-[10px] text-brand-navy/50 font-medium leading-normal mt-0.5">
                  Fresh & nutritious salads
                </p>
              </div>
              <div className="flex items-center justify-between mt-4">
                <div className={`p-1.5 rounded-full flex items-center justify-center ${selectedCategory === 'salad' ? 'bg-brand-green text-white' : 'bg-[#FAF9F6] text-brand-navy/30'}`}>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
                {/* Micro illustration inside card */}
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
              className={`px-3 py-1.5 rounded-full text-[11px] font-bold tracking-tight border transition-all cursor-pointer ${selectedCategory === 'all' ? 'bg-brand-green border-brand-green text-white' : 'bg-white border-brand-navy/5 text-brand-navy/60 hover:bg-gray-50'}`}
            >
              All Items
            </button>
            <button
              onClick={() => setSelectedCategory('weight_gain')}
              className={`px-3 py-1.5 rounded-full text-[11px] font-bold tracking-tight border transition-all cursor-pointer ${selectedCategory === 'weight_gain' ? 'bg-brand-green border-brand-green text-white' : 'bg-white border-brand-navy/5 text-brand-navy/60 hover:bg-gray-50'}`}
            >
              Weight Gain
            </button>
            <button
              onClick={() => setSelectedCategory('weight_loss')}
              className={`px-3 py-1.5 rounded-full text-[11px] font-bold tracking-tight border transition-all cursor-pointer ${selectedCategory === 'weight_loss' ? 'bg-brand-green border-brand-green text-white' : 'bg-white border-brand-navy/5 text-brand-navy/60 hover:bg-gray-50'}`}
            >
              Weight Loss
            </button>
            <button
              onClick={() => setSelectedCategory('salad')}
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
            <h3 className="font-extrabold text-base text-brand-navy tracking-tight">Explore</h3>
            <span className="text-xs font-bold text-brand-green hover:underline cursor-pointer">View all ({filteredProducts.length})</span>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 bg-white border border-brand-navy/5 rounded-3xl text-center">
              <span className="text-3xl mb-2">🍽️</span>
              <p className="text-sm font-bold text-brand-navy/70">No meals fit this filter</p>
              <p className="text-xs text-brand-navy/40 mt-1">Try resetting the search or veg filters</p>
              <button 
                onClick={() => { setSearchQuery(''); setSelectedCategory('all'); setVegOnly(false); }}
                className="mt-4 px-4 py-2 bg-brand-green text-white font-bold text-xs rounded-xl"
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
                  {/* Food Image Container */}
                  <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-gray-50 mb-3 border border-brand-navy/5">
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                    
                    {/* Diet Dot badge (Green for Veg, Red/Orange for Non-Veg) */}
                    <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm p-1 rounded-md flex items-center justify-center border border-black/5">
                      <div className={`w-2.5 h-2.5 border ${product.isVeg ? 'border-green-600 bg-green-500 rounded-full' : 'border-red-600 bg-red-500 rounded-sm'}`} />
                    </div>

                    {/* Calories floating badge */}
                    <div className="absolute bottom-2 left-2 bg-brand-navy/80 backdrop-blur-sm px-2 py-0.5 rounded-full text-[9px] font-extrabold text-white">
                      {product.calories} Kcal
                    </div>
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
                    <div className="flex items-center justify-between mt-3.5 pt-2 border-t border-brand-navy/5">
                      <span className="font-extrabold text-sm text-brand-navy">
                        ₹{product.price}
                      </span>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onProductClick(product);
                        }}
                        id={`btn-add-${product.id}`}
                        className="p-1.5 rounded-xl bg-[#EBF4E0] text-brand-green hover:bg-brand-green hover:text-white transition-all active:scale-90 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
