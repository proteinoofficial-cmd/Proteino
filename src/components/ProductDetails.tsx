import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  ChevronDown, 
  ChevronUp, 
  Heart, 
  Flame, 
  Beef, 
  Wheat, 
  Droplets, 
  Minus, 
  Plus, 
  ShoppingBag, 
  Sparkles, 
  Zap, 
  Info, 
  MapPin, 
  Clock, 
  Calendar, 
  User, 
  Phone, 
  CheckCircle2, 
  Check, 
  X,
  Moon,
  Sun,
  AlertCircle
} from 'lucide-react';
import { Product, CartItem, ActiveSubscription, UserProfile } from '../types';
import { GYMS } from '../data';
import ProductImageSlider from './ProductImageSlider';
import { useStoreHours } from '../utils/storeHours';
import DeliverySlotPicker from './DeliverySlotPicker';
import { MORNING_DELIVERY_SLOTS } from '../utils/deliverySlots';

interface ProductDetailsProps {
  product: Product;
  profile: UserProfile | null;
  onBack: () => void;
  onAddToCart: (item: CartItem) => void;
  onSubscribeDirect: (sub: any) => Promise<void>;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  onRequireAuth?: (message?: string) => void;
  cart?: CartItem[];
}

export default function ProductDetails({ 
  product, 
  profile,
  onBack, 
  onAddToCart,
  onSubscribeDirect,
  favorites,
  onToggleFavorite,
  onRequireAuth,
  cart = []
}: ProductDetailsProps) {
  const [quantity, setQuantity] = useState(1);
  const [purchaseOption, setPurchaseOption] = useState<'single' | 'subscription'>('single');
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Direct Subscription configuration state
  const [selectedGymId, setSelectedGymId] = useState('g1');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(MORNING_DELIVERY_SLOTS[0]);
  
  // Subscriber info (linked directly to user details)
  const [customerName, setCustomerName] = useState(profile?.name || '');
  const [customerPhone, setCustomerPhone] = useState(profile?.phone || '');

  // Always force scroll to the very top (photos/pictures) when opened
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }

    const t1 = setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      if (containerRef.current) {
        containerRef.current.scrollTop = 0;
      }
    }, 10);

    const t2 = setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      if (containerRef.current) {
        containerRef.current.scrollTop = 0;
      }
    }, 60);

    const t3 = setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      if (containerRef.current) {
        containerRef.current.scrollTop = 0;
      }
    }, 180);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [product.id]);

  useEffect(() => {
    setCustomerName(profile?.name || '');
    setCustomerPhone(profile?.phone || '');
  }, [profile]);

  const [isAdded, setIsAdded] = useState(false);
  const [isSubmittingSub, setIsSubmittingSub] = useState(false);
  const [subSuccess, setSubSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showDietSheet, setShowDietSheet] = useState(false);
  const [showClosedModal, setShowClosedModal] = useState(false);
  const storeStatus = useStoreHours();

  const isFavorited = favorites.includes(product.id);

  // Determine if this item is in the cart or was just added
  const isInCart = cart.some(item => item.product.id === product.id && item.purchaseOption === 'single');
  const isItemAdded = isAdded || isInCart;

  // Reset states when product changes
  useEffect(() => {
    setQuantity(1);
    setPurchaseOption('single');
    setIsAdded(false);
    setSubSuccess(false);
    setShowConfirmModal(false);
    setShowDietSheet(false);
    setShowClosedModal(false);
    setErrorMsg('');
  }, [product]);

  const handleIncrement = () => setQuantity(prev => Math.min(prev + 1, 10));
  const handleDecrement = () => setQuantity(prev => Math.max(prev - 1, 1));

  // Determine pricing
  const calculatedPrice = product.price * quantity;
  const subscriptionPrice = product.monthlyPrice || Math.round(product.price * 26 * 0.85); // Official 26-day monthly subscription price
  const subscriptionSavings = Math.max(0, (product.price * 26) - subscriptionPrice);

  const handleActionClick = () => {
    if (purchaseOption === 'single') {
      setIsAdded(true);
      onAddToCart({
        product,
        quantity,
        purchaseOption: 'single'
      });
      setTimeout(() => setIsAdded(false), 2000);
    } else {
      // Validate subscription details before opening confirmation prompt
      if (!profile) {
        if (onRequireAuth) {
          onRequireAuth('Please sign in or create an account to activate your gym subscription.');
        }
        return;
      }

      if (!customerName.trim()) {
        setErrorMsg('Please enter recipient name');
        return;
      }
      const cleanPhone = customerPhone.replace(/[^0-9]/g, '');
      if (cleanPhone.length < 10) {
        setErrorMsg('Please enter a 10-digit mobile number');
        return;
      }
      setErrorMsg('');
      setShowConfirmModal(true);
    }
  };

  const handleConfirmSubscription = async () => {
    if (!storeStatus.isOpen) {
      setShowConfirmModal(false);
      setShowClosedModal(true);
      return;
    }
    setIsSubmittingSub(true);
    setErrorMsg('');

    const gym = GYMS.find(g => g.id === selectedGymId) || GYMS[0];
    const cleanPhone = customerPhone.replace(/[^0-9]/g, '');
    const nowObj = new Date();
    const formattedDateStr = nowObj.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
    const formattedTimeStr = nowObj.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
    const orderDateDisplay = `${formattedTimeStr}, ${formattedDateStr}`;

    const newSub = {
      planId: product.id,
      planName: `${product.name} 26-Day Subscription`,
      price: subscriptionPrice,
      durationDays: 26,
      customerName: customerName.trim(),
      customerPhone: cleanPhone,
      gymId: gym.id,
      gymName: gym.name,
      gymLocation: gym.location,
      timeSlot: selectedTimeSlot,
      isPaused: false,
      startDate: nowObj.toISOString(),
      createdAt: nowObj.toISOString(),
      date: orderDateDisplay
    };

    try {
      await onSubscribeDirect(newSub);
      setShowConfirmModal(false);
      setSubSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to place direct subscription. Please try again.');
      setShowConfirmModal(false);
    } finally {
      setIsSubmittingSub(false);
    }
  };

  return (
    <div ref={containerRef} className="flex flex-col h-full bg-[#FAF9F6] pb-24 select-none relative">
      
      {/* Absolute Top Header Actions */}
      <div className="absolute top-0 inset-x-0 z-30 px-5 pt-5 flex items-center justify-between pointer-events-none">
        <button
          onClick={onBack}
          id="btn-details-back"
          className="p-3 rounded-2xl bg-[#FAF9F6]/80 backdrop-blur-md border border-brand-navy/5 shadow-sm active:scale-95 transition-all pointer-events-auto cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5 text-brand-navy" />
        </button>

        <button
          onClick={() => onToggleFavorite(product.id)}
          className="p-3 rounded-2xl bg-[#FAF9F6]/80 backdrop-blur-md border border-brand-navy/5 shadow-sm active:scale-95 transition-all pointer-events-auto cursor-pointer"
        >
          <Heart className={`w-5 h-5 ${isFavorited ? 'text-red-500 fill-red-500 scale-110' : 'text-brand-navy'} transition-transform`} />
        </button>
      </div>

      {/* Hero Product Image Slider (3x auto sliding every 2.5s) */}
      <div className="relative w-full aspect-[4/3] bg-gray-100 overflow-hidden border-b border-brand-navy/5 shadow-sm">
        <ProductImageSlider
          images={product.images || [product.image]}
          fallbackImage={product.image}
          alt={product.name}
          intervalMs={2500}
          aspectClassName="aspect-[4/3]"
          showDots={true}
          showArrows={true}
          overlayBadge={
            <>
              {/* Diet Indicator Badge */}
              <div className="absolute bottom-4 left-5 bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold shadow-sm flex items-center gap-1.5 border border-black/5 z-10">
                <div className={`w-2.5 h-2.5 border ${product.isVeg ? 'border-green-600 bg-green-500 rounded-full' : 'border-red-600 bg-red-500 rounded-sm'}`} />
                <span className="text-brand-navy">{product.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}</span>
              </div>
            </>
          }
        />
      </div>

      {/* Info Body */}
      <div className="p-5 flex flex-col gap-6">
        
        {/* Title Block */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="text-[10px] bg-brand-green/10 text-brand-green px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider">
              {product.category === 'weight_gain' ? '🔥 Muscle Bulk' : '⚡ Shred & Lean'}
            </span>
            <h2 className="text-xl font-black text-brand-navy mt-1.5 leading-tight">
              {product.name}
            </h2>
            <p className="text-xs font-bold text-brand-green uppercase tracking-widest mt-1 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{product.category.replace('_', ' ')} Target</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-xl font-black text-brand-green font-display">
              ₹{product.price}
            </p>
            <p className="text-[10px] text-brand-navy/40 font-semibold uppercase tracking-wider mt-0.5">Per Meal</p>
          </div>
        </div>

        {/* Description */}
        <div>
          <p className="text-sm font-medium text-brand-navy/70 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Nutrition Macro Row */}
        <div className="grid grid-cols-4 gap-3 bg-white p-4 rounded-3xl border border-brand-navy/5 shadow-sm">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="w-9 h-9 rounded-full bg-orange-50 flex items-center justify-center mb-1.5">
              <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
            </div>
            <span className="text-xs font-extrabold text-brand-navy">{product.calories}</span>
            <span className="text-[9px] font-bold text-brand-navy/40 uppercase tracking-tight mt-0.5">Kcal</span>
          </div>

          <div className="flex flex-col items-center justify-center text-center">
            <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center mb-1.5">
              <Beef className="w-4 h-4 text-blue-500" />
            </div>
            <span className="text-xs font-extrabold text-brand-navy">{product.protein}g</span>
            <span className="text-[9px] font-bold text-brand-navy/40 uppercase tracking-tight mt-0.5">Protein</span>
          </div>

          <div className="flex flex-col items-center justify-center text-center">
            <div className="w-9 h-9 rounded-full bg-yellow-50 flex items-center justify-center mb-1.5">
              <Wheat className="w-4 h-4 text-yellow-600" />
            </div>
            <span className="text-xs font-extrabold text-brand-navy">{product.carbs}g</span>
            <span className="text-[9px] font-bold text-brand-navy/40 uppercase tracking-tight mt-0.5">Carbs</span>
          </div>

          <div className="flex flex-col items-center justify-center text-center">
            <div className="w-9 h-9 rounded-full bg-teal-50 flex items-center justify-center mb-1.5">
              <Droplets className="w-4 h-4 text-teal-500 fill-teal-500" />
            </div>
            <span className="text-xs font-extrabold text-brand-navy">{product.fats}g</span>
            <span className="text-[9px] font-bold text-brand-navy/40 uppercase tracking-tight mt-0.5">Fats</span>
          </div>
        </div>

        {/* Store Operating Hours & Ordering Session Banner */}
        <div 
          className={`rounded-2xl p-3.5 border shadow-sm transition-all relative overflow-hidden ${
            storeStatus.isOpen
              ? 'bg-gradient-to-r from-[#0F1E36] to-[#1a2f4c] text-white border-brand-green/30'
              : 'bg-gradient-to-r from-[#0F1E36] via-[#162742] to-[#1E3250] text-white border-amber-400/40'
          }`}
        >
          <div className="flex items-start gap-3 relative z-10">
            <div className={`p-2.5 rounded-xl shrink-0 flex items-center justify-center ${
              storeStatus.isOpen ? 'bg-brand-green/20 text-brand-green border border-brand-green/40' : 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
            }`}>
              {storeStatus.isOpen ? (
                <Sun className="w-5 h-5 text-brand-green" />
              ) : (
                <Moon className="w-5 h-5 text-amber-300 animate-pulse" />
              )}
            </div>
            <div className="flex-grow">
              <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                  storeStatus.isOpen
                    ? 'bg-brand-green/20 text-brand-green border-brand-green/30'
                    : 'bg-amber-400/20 text-amber-300 border-amber-400/30'
                }`}>
                  {storeStatus.isOpen ? '● Ordering Live Now' : '● Ordering Closed'}
                </span>
                <span className="text-[10px] font-extrabold text-white/50">{storeStatus.currentTimeString}</span>
              </div>
              <h4 className="text-xs sm:text-sm font-black text-white leading-snug">
                {storeStatus.headline}
              </h4>
              <p className="text-[11px] font-semibold text-white/80 mt-0.5">
                {storeStatus.isOpen ? storeStatus.statusMessage : storeStatus.statusMessage}
              </p>
              <div className="mt-2 pt-1.5 border-t border-white/10 flex items-center gap-1.5 text-[9.5px] font-bold text-white/70">
                <span>🌅 6:00 AM – 10:00 AM</span>
                <span>•</span>
                <span>🌆 5:00 PM – 10:00 PM</span>
              </div>
            </div>
          </div>
        </div>

        {/* Compact Blur Rectangular Box for Diet Sheet & Macro Ingredients */}
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => setShowDietSheet(!showDietSheet)}
            id="btn-toggle-diet-sheet"
            className="w-full bg-[#0F1E36]/90 hover:bg-[#0F1E36] backdrop-blur-md text-white p-4 rounded-3xl border border-brand-green/30 hover:border-brand-green/70 shadow-md transition-all active:scale-[0.99] cursor-pointer text-left relative overflow-hidden group"
          >
            {/* Subtle Ambient Glow */}
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-brand-green/15 rounded-full blur-xl pointer-events-none group-hover:bg-brand-green/25 transition-colors" />

            <div className="flex items-center justify-between gap-3 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-brand-green/20 border border-brand-green/40 flex items-center justify-center text-brand-green shrink-0 group-hover:scale-105 transition-transform">
                  <Sparkles className="w-5 h-5 fill-brand-green/20 text-brand-green" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-black text-white tracking-wide uppercase">
                      {showDietSheet ? 'Tap to Hide Diet Sheet' : 'Tap to Show Diet Sheet'}
                    </span>
                    <span className="text-[9px] bg-brand-green/20 text-brand-green font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {product.totalWeight || 'Real Food'}
                    </span>
                  </div>
                  <p className="text-[10px] font-semibold text-white/60 mt-0.5">
                    Macro ingredients, amino profile & itemized nutrition breakdown
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 border border-white/10 group-hover:border-brand-green/40 transition-colors shrink-0">
                <span className="text-[10.5px] font-extrabold text-brand-green">
                  {showDietSheet ? 'Hide' : 'View'}
                </span>
                {showDietSheet ? (
                  <ChevronUp className="w-4 h-4 text-brand-green" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-brand-green animate-bounce" />
                )}
              </div>
            </div>
          </button>

          {/* Expandable Diet Sheet & Macro Breakdown */}
          <AnimatePresence>
            {showDietSheet && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="flex flex-col gap-3.5 overflow-hidden"
              >
                {/* Macro-Ingredient Breakdown */}
                {product.ingredients && product.ingredients.length > 0 && (
                  <div className="bg-white p-4 rounded-3xl border border-brand-navy/10 shadow-sm flex flex-col gap-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-brand-navy">
                        <div className="w-6 h-6 rounded-lg bg-brand-green/15 text-brand-green flex items-center justify-center">
                          <Info className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-black uppercase tracking-wide">Macro-Ingredient Breakdown</span>
                      </div>
                      <span className="text-[9px] font-bold text-slate-400">100% Clean Ingredients</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {product.ingredients.map((ing, idx) => (
                        <span 
                          key={idx} 
                          className="text-xs bg-[#FAF9F6] border border-brand-navy/10 text-brand-navy/80 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-green" />
                          <span>{ing}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Amino Acid Profile & Serving Size */}
                {(product.bcaa || product.eaa || product.totalWeight) && (
                  <div className="grid grid-cols-3 gap-3 bg-[#0F1E36] text-white p-3.5 rounded-3xl shadow-sm border border-brand-green/20">
                    {product.totalWeight && (
                      <div className="flex flex-col items-center justify-center text-center border-r border-white/10">
                        <span className="text-[9px] font-bold text-white/50 uppercase tracking-wider">Serving Size</span>
                        <span className="text-xs font-black text-brand-green mt-0.5">{product.totalWeight}</span>
                      </div>
                    )}
                    {product.bcaa && (
                      <div className="flex flex-col items-center justify-center text-center border-r border-white/10">
                        <span className="text-[9px] font-bold text-white/50 uppercase tracking-wider">BCAA Amino</span>
                        <span className="text-xs font-black text-brand-green mt-0.5">{product.bcaa}g</span>
                      </div>
                    )}
                    {product.eaa && (
                      <div className="flex flex-col items-center justify-center text-center">
                        <span className="text-[9px] font-bold text-white/50 uppercase tracking-wider">EAA Amino</span>
                        <span className="text-xs font-black text-brand-green mt-0.5">{product.eaa}g</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Meal Items Breakdown Table */}
                {product.mealItems && product.mealItems.length > 0 && (
                  <div className="bg-white rounded-3xl border border-brand-navy/10 shadow-sm overflow-hidden">
                    <div className="bg-[#0F1E36] text-white px-4 py-3.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-brand-green" />
                        <span className="text-xs font-black uppercase tracking-wider">Itemized Diet Sheet Table</span>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-wider bg-brand-green/20 text-brand-green px-2 py-0.5 rounded-full">
                        {product.totalWeight || 'Real Food'}
                      </span>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[640px]">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-extrabold text-brand-navy/60 uppercase tracking-wider">
                            <th className="px-4 py-3 pl-5">Item</th>
                            <th className="px-3 py-3 text-center">Qty</th>
                            <th className="px-3 py-3 text-center">Protein (g)</th>
                            <th className="px-3 py-3 text-center">Carbs (g)</th>
                            <th className="px-3 py-3 text-center">Fats (g)</th>
                            <th className="px-3 py-3 text-center">Kcal</th>
                            <th className="px-3 py-3 text-center">BCAA (g)</th>
                            <th className="px-3 py-3 text-center">EAA (g)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-xs text-brand-navy/80">
                          {product.mealItems.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors font-semibold">
                              <td className="px-4 py-3 pl-5 font-black text-brand-navy">{idx + 1}) {item.name}</td>
                              <td className="px-3 py-3 text-center font-bold text-slate-500">{item.quantity}</td>
                              <td className="px-3 py-3 text-center font-black text-brand-green bg-brand-green/5">{item.protein}g</td>
                              <td className="px-3 py-3 text-center font-bold">{item.carbs}g</td>
                              <td className="px-3 py-3 text-center font-bold">{item.fats}g</td>
                              <td className="px-3 py-3 text-center font-bold text-orange-600">{item.calories}</td>
                              <td className="px-3 py-3 text-center text-teal-600 font-bold">{item.bcaa}g</td>
                              <td className="px-3 py-3 text-center text-blue-600 font-bold">{item.eaa}g</td>
                            </tr>
                          ))}
                          {/* TOTAL Row */}
                          <tr className="bg-brand-green/10 border-t-2 border-brand-green/20 font-black text-brand-navy">
                            <td className="px-4 py-3.5 pl-5 uppercase tracking-wider text-xs">Total Plan</td>
                            <td className="px-3 py-3.5 text-center text-xs">{product.totalWeight}</td>
                            <td className="px-3 py-3.5 text-center text-xs text-brand-green font-black bg-brand-green/15">{product.protein}g+</td>
                            <td className="px-3 py-3.5 text-center text-xs">{product.carbs}g</td>
                            <td className="px-3 py-3.5 text-center text-xs">{product.fats}g</td>
                            <td className="px-3 py-3.5 text-center text-xs text-orange-600">{product.calories} kcal</td>
                            <td className="px-3 py-3.5 text-center text-xs text-teal-600">{product.bcaa || 'N/A'}g</td>
                            <td className="px-3 py-3.5 text-center text-xs text-blue-600">{product.eaa || 'N/A'}g</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div className="bg-slate-50 border-t border-slate-100 px-4 py-2.5 flex items-center justify-between text-[10px] font-bold text-slate-400">
                      <span className="flex items-center gap-1">
                        <span>Swipe horizontally for all nutrition details</span>
                        <span>↔️</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowDietSheet(false)}
                        className="text-brand-navy hover:text-brand-green font-extrabold cursor-pointer"
                      >
                        Hide Sheet ▲
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Purchase Options Selector (Directly as requested by the user!) */}
        <div className="bg-white p-4 rounded-3xl border border-brand-navy/5 shadow-sm flex flex-col gap-3">
          <h3 className="font-extrabold text-xs text-brand-navy uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-brand-green" />
            <span>Choose Purchase Option</span>
          </h3>

          <div className="grid grid-cols-1 gap-3">
            {/* Single Meal Option */}
            <label 
              onClick={() => setPurchaseOption('single')}
              className={`flex items-center justify-between p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${purchaseOption === 'single' ? 'bg-[#EBF4E0] border-brand-green' : 'bg-white border-slate-100 hover:border-slate-200'}`}
            >
              <div className="flex items-center gap-2.5">
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${purchaseOption === 'single' ? 'border-brand-green bg-brand-green' : 'border-slate-300'}`}>
                  {purchaseOption === 'single' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <div>
                  <p className="font-extrabold text-xs text-brand-navy">Single Meal Only</p>
                  <p className="text-[9px] text-brand-navy/40 font-semibold mt-0.5">Add to cart & combine orders</p>
                </div>
              </div>
              <span className="font-extrabold text-xs text-brand-navy">₹{product.price}</span>
            </label>

            {/* Subscriptions Option (Bypasses cart, orders here directly!) */}
            <label 
              onClick={() => setPurchaseOption('subscription')}
              className={`flex items-center justify-between p-3.5 rounded-2xl border-2 cursor-pointer transition-all relative overflow-hidden ${purchaseOption === 'subscription' ? 'bg-[#EBF4E0] border-brand-green' : 'bg-white border-slate-100 hover:border-slate-200'}`}
            >
              {subscriptionSavings > 0 && (
                <div className="absolute top-0 right-0 bg-[#0F1E36] text-brand-green text-[7.5px] font-black px-2 py-0.5 rounded-bl uppercase tracking-tight">
                  Save ₹{subscriptionSavings}
                </div>
              )}
              <div className="flex items-center gap-2.5">
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${purchaseOption === 'subscription' ? 'border-brand-green bg-brand-green' : 'border-slate-300'}`}>
                  {purchaseOption === 'subscription' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <div>
                  <p className="font-extrabold text-xs text-brand-navy flex items-center gap-1">
                    <span>26-Day Gym Subscription</span>
                  </p>
                  <p className="text-[9px] text-brand-green font-black uppercase mt-0.5">Excludes Sundays • Daily Delivery</p>
                </div>
              </div>
              <div className="text-right">
                <span className="font-black text-xs text-brand-green">₹{subscriptionPrice}</span>
                <span className="block text-[8px] text-brand-navy/40 font-bold uppercase">/ 26 Days</span>
              </div>
            </label>
          </div>
        </div>

        {/* Conditionally Render Inputs based on choice */}
        <AnimatePresence mode="wait">
          {purchaseOption === 'subscription' ? (
            <motion.div 
              key="sub-details"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white p-5 rounded-3xl border border-brand-navy/10 shadow-md flex flex-col gap-4"
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="bg-brand-navy text-white text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-lg w-fit">
                  ⚡ Gym Subscription Preferences
                </div>
                <span className="text-[9px] font-extrabold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                  Excluding Sundays 🚫
                </span>
              </div>

              <div className="bg-emerald-50 border border-emerald-200/70 text-emerald-950 p-2.5 rounded-xl text-[11px] font-bold flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-brand-green shrink-0" />
                <span>26 Meals Delivery Cycle: <strong className="text-brand-navy">Monday to Saturday (Excluding Sundays)</strong></span>
              </div>

              {/* Gym Linker */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase text-brand-navy/40 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-brand-green" />
                  <span>Select Delivery Destination Gym</span>
                </label>
                <select 
                  value={selectedGymId}
                  onChange={(e) => setSelectedGymId(e.target.value)}
                  className="bg-[#FAF9F6] border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-brand-navy focus:outline-none focus:border-brand-green/30"
                >
                  {GYMS.map(g => (
                    <option key={g.id} value={g.id}>{g.name} — {g.location}</option>
                  ))}
                </select>
              </div>

              {/* Time Slot Selection */}
              <div className="bg-[#FAF9F6] p-3.5 rounded-2xl border border-slate-200/60">
                <DeliverySlotPicker
                  value={selectedTimeSlot}
                  onChange={(slot) => setSelectedTimeSlot(slot)}
                  title="Choose Daily Delivery Slot"
                />
              </div>

              {/* Subscriber Information Fields (prefilled) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-black uppercase text-brand-navy/40 flex items-center gap-1">
                    <User className="w-3 h-3" />
                    <span>Recipient Name</span>
                  </label>
                  <input 
                    type="text" 
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="E.g. John Doe"
                    className="bg-[#FAF9F6] border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-brand-navy"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-black uppercase text-brand-navy/40 flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    <span>Mobile (10-digit)</span>
                  </label>
                  <input 
                    type="tel" 
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="9876543210"
                    className="bg-[#FAF9F6] border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-brand-navy font-mono"
                  />
                </div>
              </div>

              {/* Error indicator */}
              {errorMsg && (
                <p className="text-[10px] text-red-500 font-extrabold mt-1">⚠️ {errorMsg}</p>
              )}
            </motion.div>
          ) : (
            /* Quantity selection (Only applies to Single Meal Orders) */
            <motion.div 
              key="qty-selector"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center justify-between bg-white px-5 py-4 rounded-3xl border border-brand-navy/5 shadow-sm"
            >
              <div>
                <p className="font-extrabold text-xs text-brand-navy uppercase tracking-wider">Meal Quantity</p>
                <p className="text-[10px] text-brand-navy/40 font-semibold mt-0.5">Select how many meal boxes to add</p>
              </div>
              <div className="flex items-center gap-4 bg-[#FAF9F6] border border-brand-navy/5 p-1 rounded-2xl">
                <button 
                  onClick={handleDecrement}
                  type="button"
                  className="p-2 rounded-xl bg-white text-brand-navy border border-brand-navy/5 hover:bg-gray-100 active:scale-90 cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="font-black text-sm text-brand-navy w-4 text-center font-mono">
                  {quantity}
                </span>
                <button 
                  onClick={handleIncrement}
                  type="button"
                  className="p-2 rounded-xl bg-white text-brand-navy border border-brand-navy/5 hover:bg-gray-100 active:scale-90 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Specialty tags */}
        <div className="flex flex-wrap gap-1.5">
          {product.tags.map((tag, idx) => (
            <span 
              key={idx}
              className="px-3 py-1 rounded-full bg-[#EBF4E0] border border-brand-green/20 text-brand-green text-[10px] font-extrabold uppercase tracking-wide"
            >
              {tag}
            </span>
          ))}
          <span className="px-3 py-1 rounded-full bg-gray-50 border border-gray-100 text-gray-400 text-[10px] font-extrabold uppercase tracking-wide">
            No Preservatives
          </span>
        </div>

      </div>

      {/* Subscription Confirmation Modal Overlay */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 bg-[#0F1E36]/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200/80 overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-brand-green/15 text-brand-green flex items-center justify-center">
                    <Zap className="w-5 h-5 fill-brand-green" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-brand-navy">Confirm Subscription</h3>
                    <p className="text-[10.5px] font-bold text-slate-400">26-Day Gym Drop-off Meal Plan</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Question prompt */}
              <p className="text-xs font-bold text-brand-navy mt-4 mb-3">
                Do you want to confirm this order and subscription?
              </p>

              {/* Summary Details Card */}
              <div className="bg-[#FAF9F6] border border-slate-200/60 rounded-2xl p-3.5 flex flex-col gap-2 text-xs font-medium text-brand-navy/80">
                <div className="flex justify-between items-start">
                  <span className="text-[11px] font-bold text-slate-500">Plan:</span>
                  <span className="font-extrabold text-brand-navy text-right max-w-[200px]">{product.name} (26 Meals)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold text-slate-500">Total Price:</span>
                  <div className="text-right">
                    <span className="font-black text-brand-green text-sm">₹{subscriptionPrice}</span>
                    {subscriptionSavings > 0 && (
                      <span className="text-[10px] text-brand-navy/50 font-bold ml-1.5 line-through">₹{product.price * 26}</span>
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-start border-t border-slate-200/40 pt-1.5">
                  <span className="text-[11px] font-bold text-slate-500">Partner Gym:</span>
                  <span className="font-bold text-brand-navy text-right max-w-[190px] truncate">
                    {GYMS.find(g => g.id === selectedGymId)?.name || "Gold's Gym"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold text-slate-500">Delivery Slot:</span>
                  <span className="font-bold text-brand-navy">{selectedTimeSlot} Daily</span>
                </div>
                <div className="flex justify-between items-center border-t border-slate-200/40 pt-1.5">
                  <span className="text-[11px] font-bold text-slate-500">Subscriber:</span>
                  <span className="font-bold text-brand-navy">{customerName} (+91 {customerPhone.replace(/[^0-9]/g, '')})</span>
                </div>
              </div>

              {/* Action Buttons: Confirm & Cancel */}
              <div className="grid grid-cols-2 gap-2.5 mt-5">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  disabled={isSubmittingSub}
                  className="py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold text-xs transition-all active:scale-95 cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSubscription}
                  disabled={isSubmittingSub}
                  className="py-3 px-4 rounded-xl bg-brand-green hover:bg-brand-green-hover text-white font-extrabold text-xs shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {isSubmittingSub ? (
                    <span>Confirming...</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Confirm Order</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Success Modal Overlay */}
      {subSuccess && (
        <div className="absolute inset-0 bg-brand-navy/90 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6 text-center text-white">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center"
          >
            <div className="w-16 h-16 bg-brand-green text-white rounded-full flex items-center justify-center mb-5 shadow-lg shadow-brand-green/20 animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-black tracking-tight">Membership Subscribed!</h3>
            <p className="text-xs text-white/70 font-bold mt-2 max-w-xs">
              Your 26-Day subscription for {product.name} is now active at {GYMS.find(g => g.id === selectedGymId)?.name || "Gold's Gym"}.
            </p>
            <div className="bg-white/10 p-4 rounded-2xl border border-white/5 mt-6 w-full text-left flex flex-col gap-1.5 text-xs font-mono">
              <p>📍 Gym: <span className="text-brand-green font-bold">{GYMS.find(g => g.id === selectedGymId)?.name}</span></p>
              <p>🕒 Delivery slot: <span className="text-brand-green font-bold">{selectedTimeSlot} Daily</span></p>
              <p>👤 Subscriber: <span>{customerName}</span></p>
            </div>
            <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest mt-8 animate-pulse">
              Syncing status... Direct to tracker...
            </p>
          </motion.div>
        </div>
      )}

      {/* Persistent Bottom Action Bar */}
      <div className="sticky bottom-0 bg-[#FAF9F6]/90 backdrop-blur-md border-t border-brand-navy/5 p-4 z-20 flex gap-4">
        <button
          onClick={handleActionClick}
          disabled={isSubmittingSub}
          id="btn-add-to-cart-action"
          className={`flex-grow py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2.5 active:scale-98 transition-all shadow-md cursor-pointer ${
            purchaseOption === 'single'
              ? (isItemAdded ? 'bg-[#0F1E36] text-brand-green border border-brand-green/30' : 'bg-brand-green hover:bg-brand-green-hover text-white')
              : 'bg-[#0F1E36] text-brand-green border border-brand-green hover:bg-[#1a3359]'
          }`}
        >
          {purchaseOption === 'single' ? (
            <>
              {isItemAdded ? (
                <Check className="w-5 h-5 text-brand-green stroke-[3]" />
              ) : (
                <ShoppingBag className="w-5 h-5" />
              )}
              <span className={isItemAdded ? "text-brand-green font-black" : ""}>
                {isItemAdded ? 'Added to Cart' : `Add to Cart • ₹${calculatedPrice}`}
              </span>
            </>
          ) : (
            <>
              <Zap className="w-5 h-5 fill-brand-green" />
              <span>
                {isSubmittingSub ? 'Processing...' : `Confirm Subscription • ₹${subscriptionPrice}`}
              </span>
            </>
          )}
        </button>
      </div>

      {/* Store Closed Modal Overlay */}
      <AnimatePresence>
        {showClosedModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowClosedModal(false)}
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
                onClick={() => setShowClosedModal(false)}
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
