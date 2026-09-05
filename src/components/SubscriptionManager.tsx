import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Clock, 
  Check, 
  Calendar, 
  MapPin, 
  User, 
  X, 
  Moon, 
  Sun, 
  Zap,
  AlertTriangle,
  AlertCircle
} from 'lucide-react';
import { Product, UserProfile, ActiveSubscription } from '../types';
import { PRODUCTS, GYMS } from '../data';
import { useStoreHours } from '../utils/storeHours';
import DeliverySlotPicker from './DeliverySlotPicker';
import { MORNING_DELIVERY_SLOTS, calculateMealsRemaining, validateCustomDeliveryTime } from '../utils/deliverySlots';

interface SubscriptionManagerProps {
  profile: UserProfile | null;
  activeSubscription: ActiveSubscription | null;
  onBuySubscription: (newSub: any) => void;
  onCancelSubscription: () => void;
  onTogglePause: () => void;
  onRequireAuth?: (message?: string) => void;
}

export default function SubscriptionManager({
  profile,
  activeSubscription,
  onBuySubscription,
  onCancelSubscription,
  onTogglePause,
  onRequireAuth
}: SubscriptionManagerProps) {
  const storeStatus = useStoreHours();
  // Buy plan states
  const [selectedProductId, setSelectedProductId] = useState<string>(PRODUCTS[0].id);
  const [selectedGymId, setSelectedGymId] = useState<string>(GYMS[0].id);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>(MORNING_DELIVERY_SLOTS[0]);
  const [durationMonths, setDurationMonths] = useState<1 | 2 | 3>(1); // 1 Month, 2 Months, 3 Months
  const [isTimeSlotValid, setIsTimeSlotValid] = useState<boolean>(true);

  // Client verification form
  const [customerName, setCustomerName] = useState<string>(profile?.name || '');
  const [customerPhone, setCustomerPhone] = useState<string>(profile?.phone || '');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [showClosedModal, setShowClosedModal] = useState<boolean>(false);

  React.useEffect(() => {
    setCustomerName(profile?.name || '');
    setCustomerPhone(profile?.phone || '');
  }, [profile]);

  const selectedProduct = PRODUCTS.find(p => p.id === selectedProductId) || PRODUCTS[0];
  const selectedGym = GYMS.find(g => g.id === selectedGymId) || GYMS[0];

  // Base 26-day monthly cycle (Excluding Sundays)
  const numDeliveryDays = durationMonths * 26; // 26, 52, 78 meals
  const originalTotalPrice = selectedProduct.price * numDeliveryDays;
  const singleMonthPrice = selectedProduct.monthlyPrice || Math.round(selectedProduct.price * 26 * 0.85);
  const finalPrice = singleMonthPrice * durationMonths;
  const moneySaved = Math.max(0, originalTotalPrice - finalPrice);

  const handleSubscribeSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!profile) {
      if (onRequireAuth) {
        onRequireAuth('Please sign in or create an account to activate your gym meal subscription.');
      }
      return;
    }

    if (!customerName.trim()) {
      setErrorMsg('Full name is required.');
      return;
    }
    if (!customerPhone.trim() || customerPhone.length < 10) {
      setErrorMsg('A valid 10-digit mobile number is required.');
      return;
    }

    // Validate delivery time
    if (selectedTimeSlot.toLowerCase().includes('custom')) {
      const validation = validateCustomDeliveryTime(selectedTimeSlot);
      if (!validation.isValid) {
        setErrorMsg(`We cannot deliver at this time! ${validation.message}`);
        return;
      }
    }

    setErrorMsg('');
    setShowConfirmModal(true);
  };

  const handleFinalConfirmOrder = () => {
    const monthLabel = durationMonths === 1 ? '1-Month' : durationMonths === 2 ? '2-Month' : '3-Month';
    const newSubPayload = {
      planId: selectedProduct.id,
      planName: `${selectedProduct.name} ${monthLabel} Subscription (${numDeliveryDays} Meals)`,
      price: finalPrice,
      durationDays: numDeliveryDays,
      customerName,
      customerPhone,
      gymId: selectedGym.id,
      gymName: selectedGym.name,
      gymLocation: selectedGym.location,
      timeSlot: selectedTimeSlot,
      isPaused: false
    };

    onBuySubscription(newSubPayload);
    setShowConfirmModal(false);
    setSuccessMsg(true);
  };

  return (
    <div className="flex flex-col gap-6 pb-28 select-none">
      
      {/* Title block */}
      <div className="bg-brand-navy text-white rounded-3xl p-6 relative overflow-hidden shadow-md">
        <div className="absolute right-[-10px] top-[-10px] w-28 h-28 rounded-full bg-brand-green/10 blur-xl pointer-events-none" />
        <span className="bg-brand-green/20 text-brand-green text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-brand-green/10">
          🔥 HIGH PERFORMANCE PLANS
        </span>
        <h2 className="text-xl font-black mt-3 leading-tight font-display tracking-tight">Gym Partner Subscription Panel</h2>
        <p className="text-xs text-white/60 font-medium mt-1.5 leading-relaxed">
          Unlock maximum convenience with daily warm drop-offs directly to your partner gym desk. Includes premium heat-insulated boxes, high biological value proteins, and 15% permanent discount.
        </p>
      </div>

      {/* Store Operating Hours & Ordering Session Banner */}
      <div 
        className={`rounded-3xl p-4 border shadow-sm transition-all relative overflow-hidden ${
          storeStatus.isOpen
            ? 'bg-gradient-to-r from-[#0F1E36] to-[#1a2f4c] text-white border-brand-green/30'
            : 'bg-gradient-to-r from-[#0F1E36] via-[#162742] to-[#1E3250] text-white border-amber-400/40'
        }`}
      >
        <div className="flex items-start gap-3.5 relative z-10">
          <div className={`p-2.5 rounded-2xl shrink-0 flex items-center justify-center ${
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
              <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                storeStatus.isOpen
                  ? 'bg-brand-green/20 text-brand-green border-brand-green/30'
                  : 'bg-amber-400/20 text-amber-300 border-amber-400/30'
              }`}>
                {storeStatus.isOpen ? '● Ordering Live Now' : '● Pre-orders & Subscriptions Open'}
              </span>
              <span className="text-[10px] font-extrabold text-white/50">{storeStatus.currentTimeString}</span>
            </div>
            <h4 className="text-xs sm:text-sm font-black text-white leading-snug">
              {storeStatus.headline}
            </h4>
            <p className="text-[11px] font-semibold text-white/80 mt-1">
              {storeStatus.statusMessage}
            </p>
            <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center gap-2 text-[10px] font-bold text-white/70 flex-wrap">
              <span className="bg-white/10 px-2 py-0.5 rounded-md">🌅 Morning: 6:00 AM – 10:00 AM</span>
              <span className="bg-white/10 px-2 py-0.5 rounded-md">🌆 Evening: 5:00 PM – 10:00 PM</span>
            </div>
          </div>
        </div>
      </div>

      {/* RENDER ACTIVE SUBSCRIPTION IF WE HAVE ONE */}
      {activeSubscription ? (
        (() => {
          const stats = calculateMealsRemaining(
            activeSubscription.startDate,
            activeSubscription.durationDays,
            activeSubscription.isPaused,
            activeSubscription.pausedAt
          );

          return (
            <div className="bg-white rounded-3xl p-6 border border-slate-200/50 shadow-sm flex flex-col gap-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${activeSubscription.isPaused ? 'bg-amber-100 text-amber-700' : 'bg-brand-green/10 text-brand-green'}`}>
                    ● {activeSubscription.isPaused ? 'PAUSED' : 'ACTIVE GYM PLAN'}
                  </span>
                  <h3 className="font-extrabold text-brand-navy text-sm mt-1">{activeSubscription.planName}</h3>
                </div>
                <span className="font-black text-sm text-brand-green">₹{activeSubscription.price}</span>
              </div>

              {/* Prominent Meals Remaining Tracker */}
              <div className="bg-[#0F1E36] text-white p-5 rounded-2xl flex flex-col gap-3 relative overflow-hidden border border-brand-green/20 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-brand-green font-black tracking-wider uppercase flex items-center gap-1.5">
                    🍱 MEALS REMAINING
                  </span>
                  <span className="text-[10px] font-black text-brand-green bg-brand-green/20 px-2.5 py-0.5 rounded-full border border-brand-green/30">
                    {stats.percentage}% Completed
                  </span>
                </div>
                
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-white font-display">
                    {stats.mealsRemaining}
                  </span>
                  <span className="text-sm font-bold text-white/70">
                    Meals Remaining (out of {stats.totalMeals})
                  </span>
                </div>

                <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="h-full bg-brand-green rounded-full transition-all duration-500"
                    style={{ width: `${stats.percentage}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] text-white/60 font-semibold pt-1">
                  <span>Delivered: {stats.mealsDelivered} Meals</span>
                  <span>Schedule: Mon–Sat (Excl. Sundays)</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                <div className="bg-[#FAF9F6] p-3 rounded-2xl flex flex-col gap-1 border border-slate-200/20">
                  <span className="text-[9px] font-black uppercase text-brand-navy/40">Drop-off Point</span>
                  <p className="text-brand-navy font-black text-[11px] truncate">🏋️ {activeSubscription.gymName}</p>
                  <p className="text-[10px] text-slate-400 font-medium truncate">{activeSubscription.gymLocation}</p>
                </div>
                <div className="bg-[#FAF9F6] p-3 rounded-2xl flex flex-col gap-1 border border-slate-200/20">
                  <span className="text-[9px] font-black uppercase text-brand-navy/40">Preferred Time Slot</span>
                  <p className="text-brand-navy font-black text-[11px]">🕒 {activeSubscription.timeSlot}</p>
                  <p className="text-[10px] text-brand-green font-bold">Mon - Sat (Excl. Sundays)</p>
                </div>
              </div>
            </div>
          );
        })()
      ) : null}

      {/* SUBSCRIBE FORM FOR GYM PLANS */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-sm flex flex-col gap-5">
        <h3 className="font-extrabold text-base text-brand-navy tracking-tight flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-brand-green" />
          <span>Setup Gym Meal Subscription</span>
        </h3>

        {/* Success Alert */}
        {successMsg && (
          <div className="bg-[#EBF4E0] border border-brand-green text-brand-navy p-4 rounded-2xl flex items-center gap-3">
            <Check className="w-5 h-5 text-brand-green shrink-0" />
            <div>
              <h4 className="font-extrabold text-xs">Subscription Confirmed & Active!</h4>
              <p className="text-[11px] text-brand-navy/70 mt-0.5">Your fresh gym meal deliveries have been scheduled Monday to Saturday (Excluding Sundays).</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubscribeSubmit} className="flex flex-col gap-4">
          
          {/* 1. Choose Product */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-black uppercase tracking-wider text-brand-navy/40">
              1. Select Muscle Building Meal
            </label>
            <div className="grid grid-cols-1 gap-2">
              {PRODUCTS.map(product => (
                <div
                  key={product.id}
                  onClick={() => setSelectedProductId(product.id)}
                  className={`flex items-center justify-between p-3 rounded-2xl border-2 cursor-pointer transition-all ${selectedProductId === product.id ? 'bg-[#EBF4E0] border-brand-green' : 'bg-white border-slate-100 hover:border-slate-200'}`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${product.isVeg ? 'bg-green-500' : 'bg-red-500'}`} />
                    <div>
                      <h4 className="font-extrabold text-xs text-brand-navy leading-tight">{product.name}</h4>
                      <p className="text-[10px] text-brand-navy/50 font-semibold mt-0.5">💪 {product.protein}g Protein | {product.calories} Kcal</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-xs text-brand-green block">₹{product.monthlyPrice}/mo</span>
                    <span className="text-[9px] text-brand-navy/40 font-bold block">One-time: ₹{product.price}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900 text-[11px] font-semibold mt-1">
              <span>🍗</span>
              <span>Non-Veg gym meal subscriptions coming soon in 1–2 months!</span>
            </div>
          </div>

          {/* 2. Select Gym Partner */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-black uppercase tracking-wider text-brand-navy/40">
              2. Choose Destination Gym Partner
            </label>
            <div className="grid grid-cols-1 gap-2">
              {GYMS.map(gym => (
                <div
                  key={gym.id}
                  onClick={() => setSelectedGymId(gym.id)}
                  className={`flex items-start gap-2.5 p-3 rounded-2xl border-2 cursor-pointer transition-all ${selectedGymId === gym.id ? 'bg-[#EBF4E0] border-brand-green' : 'bg-white border-slate-100 hover:border-slate-200'}`}
                >
                  <MapPin className="w-4 h-4 text-brand-green shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-extrabold text-xs text-brand-navy leading-tight">{gym.name}</h4>
                    <p className="text-[9px] text-brand-navy/40 font-semibold mt-0.5">{gym.location}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Duration Select: 1 Month, 2 Months, 3 Months (Excluding Sundays) */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-[9px] font-black uppercase tracking-wider text-brand-navy/40">
                3. Select Plan Duration
              </label>
              <span className="text-[9.5px] font-black text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-300/60">
                Excluding Sundays 🚫
              </span>
            </div>

            <div className="bg-emerald-50 border border-emerald-200/80 text-emerald-950 p-2.5 rounded-xl flex items-center gap-2 text-[11px] font-bold">
              <Calendar className="w-4 h-4 text-brand-green shrink-0" />
              <span>Deliveries: <strong className="text-brand-navy">Monday to Saturday (Excluding Sundays)</strong></span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { months: 1 as const, label: '1 Month', meals: '26 Meals', desc: 'Excl. Sundays' },
                { months: 2 as const, label: '2 Months', meals: '52 Meals', desc: 'Excl. Sundays' },
                { months: 3 as const, label: '3 Months', meals: '78 Meals', desc: 'Excl. Sundays' },
              ].map(opt => (
                <button
                  type="button"
                  key={opt.months}
                  onClick={() => setDurationMonths(opt.months)}
                  className={`py-3 px-2 rounded-2xl border-2 flex flex-col items-center justify-center transition-all cursor-pointer ${
                    durationMonths === opt.months 
                      ? 'bg-brand-navy border-brand-navy text-white shadow-sm' 
                      : 'bg-white border-slate-200 text-brand-navy hover:border-brand-green/40 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-xs font-black leading-tight">{opt.label}</span>
                  <span className="text-[10px] font-extrabold text-brand-green mt-0.5 leading-none">{opt.meals}</span>
                  <span className={`text-[8.5px] font-bold mt-1 leading-none ${durationMonths === opt.months ? 'text-white/70' : 'text-slate-400'}`}>
                    {opt.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 4. Select Time Slot */}
          <div className="bg-[#FAF9F6] p-3.5 rounded-2xl border border-slate-200/60">
            <DeliverySlotPicker
              value={selectedTimeSlot}
              onChange={(slot) => {
                setSelectedTimeSlot(slot);
                setErrorMsg('');
              }}
              onValidationChange={(isValid) => setIsTimeSlotValid(isValid)}
              title="4. Daily Delivery Time Slot"
            />
          </div>

          {/* 5. Personal Checkout Verification */}
          <div className="bg-[#FAF9F6] p-4 rounded-2xl border border-slate-200/50 flex flex-col gap-3">
            <span className="text-[9px] font-black uppercase tracking-wider text-brand-navy/40 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-brand-green" /> Deliveries Recipient Details
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1 text-left">
                <label className="text-[8px] font-extrabold text-brand-navy/50 uppercase">Your Name</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="Full name"
                  className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:border-brand-green"
                />
              </div>
              <div className="flex flex-col gap-1 text-left">
                <label className="text-[8px] font-extrabold text-brand-navy/50 uppercase">Mobile Phone</label>
                <input
                  type="text"
                  required
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  placeholder="10 digit phone"
                  className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:border-brand-green"
                />
              </div>
            </div>
          </div>

          {/* Summary / Cost block */}
          <div className="bg-[#EBF4E0] border border-brand-green/10 rounded-2xl p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs font-extrabold text-brand-navy">
              <span>Standard Single Meal Total ({numDeliveryDays} meals):</span>
              <span className="line-through text-slate-400">₹{originalTotalPrice}</span>
            </div>
            <div className="flex items-center justify-between text-xs font-black text-brand-green">
              <span>Subscription Discount Savings (15% OFF):</span>
              <span>-₹{moneySaved}</span>
            </div>
            <div className="border-t border-brand-green/10 pt-2 flex items-center justify-between">
              <div>
                <span className="font-extrabold text-xs text-brand-navy block">Total Plan Price:</span>
                <span className="text-[9px] font-bold text-brand-navy/60">Delivered Mon–Sat (Excluding Sundays)</span>
              </div>
              <span className="font-black text-base text-brand-green">₹{finalPrice}</span>
            </div>
          </div>

          {/* Grand Opening & Payment Method COD */}
          <div className="flex flex-col gap-2">
            <div className="bg-emerald-50 border border-emerald-200/90 rounded-2xl p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">💵</span>
                <div>
                  <p className="text-xs font-black text-emerald-950">Payment Method: Cash on Delivery (COD)</p>
                  <p className="text-[10px] text-emerald-700 font-semibold">Pay cash on daily gym drop-offs / front desk collection</p>
                </div>
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white px-2.5 py-1 rounded-lg">
                COD
              </span>
            </div>

            <div className="bg-sky-50 border border-sky-200/80 rounded-2xl p-3 flex items-start gap-2 text-xs">
              <span className="text-base shrink-0">🎉</span>
              <div>
                <p className="text-xs font-black text-sky-950">Proteino Grand Opening on 7th September</p>
                <p className="text-[10px] text-sky-700 font-semibold leading-relaxed">
                  Daily meal subscriptions will commence delivery starting 7th of September directly to your gym partner desk.
                </p>
              </div>
            </div>
          </div>

          {errorMsg && (
            <div className="text-xs font-bold text-red-900 bg-red-100 p-3 rounded-xl border border-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={!isTimeSlotValid}
            className={`w-full py-4 font-black text-xs uppercase tracking-wider rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 ${
              isTimeSlotValid
                ? 'bg-brand-green hover:bg-brand-green-hover text-white active:scale-98 cursor-pointer'
                : 'bg-slate-300 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Zap className="w-4 h-4 text-white fill-current" /> Confirm {durationMonths}-Month Subscription • ₹{finalPrice}
          </button>

        </form>
      </div>

      {/* Subscription Confirmation Modal */}
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
                    <p className="text-[10.5px] font-bold text-slate-400">{numDeliveryDays}-Day Gym Drop-off Meal Plan</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Prompt */}
              <p className="text-xs font-bold text-brand-navy mt-4 mb-3">
                Do you want to confirm this order and subscription?
              </p>

              {/* Summary Card */}
              <div className="bg-[#FAF9F6] border border-slate-200/60 rounded-2xl p-3.5 flex flex-col gap-2 text-xs font-medium text-brand-navy/80">
                <div className="flex justify-between items-start">
                  <span className="text-[11px] font-bold text-slate-500">Plan:</span>
                  <span className="font-extrabold text-brand-navy text-right max-w-[200px]">{selectedProduct.name} ({durationMonths} Mo - {numDeliveryDays} Meals)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold text-slate-500">Total Price:</span>
                  <span className="font-black text-brand-green text-sm">₹{finalPrice}</span>
                </div>
                <div className="flex justify-between items-start border-t border-slate-200/40 pt-1.5">
                  <span className="text-[11px] font-bold text-slate-500">Partner Gym:</span>
                  <span className="font-bold text-brand-navy text-right max-w-[190px] truncate">
                    {selectedGym.name}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold text-slate-500">Delivery Slot:</span>
                  <span className="font-bold text-brand-navy">{selectedTimeSlot}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold text-slate-500">Schedule:</span>
                  <span className="font-bold text-brand-green">Mon–Sat (Excl. Sundays)</span>
                </div>
                <div className="flex justify-between items-center border-t border-slate-200/40 pt-1.5">
                  <span className="text-[11px] font-bold text-slate-500">Subscriber:</span>
                  <span className="font-bold text-brand-navy">{customerName} (+91 {customerPhone.replace(/[^0-9]/g, '')})</span>
                </div>
              </div>

              {/* Confirm & Cancel Buttons */}
              <div className="grid grid-cols-2 gap-2.5 mt-5">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold text-xs transition-all active:scale-95 cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleFinalConfirmOrder}
                  className="py-3 px-4 rounded-xl bg-brand-green hover:bg-brand-green-hover text-white font-extrabold text-xs shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Confirm Order</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Store Closed Modal Dialog */}
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
