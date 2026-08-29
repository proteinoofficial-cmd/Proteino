import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Clock, 
  Check, 
  Calendar, 
  Flame, 
  MapPin, 
  ShieldCheck, 
  Play, 
  Pause, 
  Trash2,
  Repeat,
  Compass,
  Zap,
  Phone,
  User,
  X,
  Dumbbell as GymIcon
} from 'lucide-react';
import { Product, UserProfile, ActiveSubscription, Gym } from '../types';
import { PRODUCTS, GYMS } from '../data';

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
  // Buy plan states
  const [selectedProductId, setSelectedProductId] = useState<string>(PRODUCTS[0].id);
  const [selectedGymId, setSelectedGymId] = useState<string>(GYMS[0].id);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('2 PM');
  const [durationWeeks, setDurationWeeks] = useState<number>(4); // Default 4 weeks = 26 days

  // Client verification form
  const [customerName, setCustomerName] = useState<string>(profile?.name || '');
  const [customerPhone, setCustomerPhone] = useState<string>(profile?.phone || '');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

  React.useEffect(() => {
    setCustomerName(profile?.name || '');
    setCustomerPhone(profile?.phone || '');
  }, [profile]);

  const selectedProduct = PRODUCTS.find(p => p.id === selectedProductId) || PRODUCTS[0];
  const selectedGym = GYMS.find(g => g.id === selectedGymId) || GYMS[0];

  // Subscription calculation
  // Base 26-day monthly cycle with exact plan pricing from menu
  const numDeliveryDays = durationWeeks === 4 ? 26 : durationWeeks === 8 ? 52 : 104;
  const cycleMultiplier = durationWeeks / 4;
  const originalTotalPrice = selectedProduct.price * numDeliveryDays;
  const finalPrice = Math.round((selectedProduct.monthlyPrice || Math.round(selectedProduct.price * 26 * 0.85)) * cycleMultiplier);
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

    setErrorMsg('');
    setShowConfirmModal(true);
  };

  const handleFinalConfirmOrder = () => {
    const newSubPayload = {
      planId: selectedProduct.id,
      planName: `${selectedProduct.name} ${numDeliveryDays}-Day Subscription`,
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

      {/* RENDER ACTIVE SUBSCRIPTION IF WE HAVE ONE */}
      {activeSubscription ? (
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

          <div className="bg-[#0F1E36] text-white p-4 rounded-2xl flex items-center justify-between relative overflow-hidden border border-brand-green/20 shadow-xs">
            <div>
              <p className="text-[8px] text-brand-green font-black tracking-wider uppercase">Subscription Status</p>
              <p className="text-xs font-black mt-1">26 Days Cycle • Monday to Saturday</p>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">Fresh daily gym drop-offs active (Excluding Sundays).</p>
            </div>
          </div>
        </div>
      ) : null}

      {/* SUBSCRIBE FORM FOR GYM PLANS */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-sm flex flex-col gap-5">
        <h3 className="font-extrabold text-base text-brand-navy tracking-tight flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-brand-green" />
          <span>Setup Gym Meal Subscription</span>
        </h3>

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

          {/* 3. Duration Select */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-[9px] font-black uppercase tracking-wider text-brand-navy/40">
                3. Select Plan Duration
              </label>
              <span className="text-[9px] font-black text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded-md">
                Excluding Sundays 🚫
              </span>
            </div>

            <div className="bg-emerald-50 border border-emerald-200/80 text-emerald-950 p-2.5 rounded-xl flex items-center gap-2 text-[11px] font-bold">
              <Calendar className="w-4 h-4 text-brand-green shrink-0" />
              <span>Deliveries: <strong className="text-brand-navy">Monday to Saturday (Excluding Sundays)</strong></span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { label: '26 Days', weeks: 4, desc: '1 Mo (Excl. Sun)' },
                { label: '52 Days', weeks: 8, desc: '2 Mo (Excl. Sun)' },
                { label: '104 Days', weeks: 16, desc: '4 Mo (Excl. Sun)' },
              ].map(opt => (
                <button
                  type="button"
                  key={opt.weeks}
                  onClick={() => setDurationWeeks(opt.weeks)}
                  className={`py-2.5 px-2 rounded-xl border-2 flex flex-col items-center justify-center transition-all cursor-pointer ${durationWeeks === opt.weeks ? 'bg-brand-navy border-brand-navy text-white shadow-xs' : 'bg-white border-slate-200 text-brand-navy/70 hover:border-slate-300'}`}
                >
                  <span className="text-xs font-black leading-none">{opt.label}</span>
                  <span className="text-[8px] font-bold mt-1 opacity-70 leading-none">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 4. Select Time Slot */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-black uppercase tracking-wider text-brand-navy/40">
              4. Daily Delivery Time Slot
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['11 AM', '2 PM', '8 PM'].map(slot => (
                <button
                  type="button"
                  key={slot}
                  onClick={() => setSelectedTimeSlot(slot)}
                  className={`py-2 px-3 rounded-xl border-2 flex flex-col items-center justify-center transition-all cursor-pointer ${selectedTimeSlot === slot ? 'bg-brand-green border-brand-green text-white' : 'bg-white border-slate-200 text-brand-navy/70'}`}
                >
                  <span className="text-xs font-black leading-none">{slot}</span>
                  <span className="text-[8px] font-bold mt-1 opacity-60 leading-none">{slot === '11 AM' ? 'Post-Workout' : slot === '2 PM' ? 'Lunch Meal' : 'Dinner Meal'}</span>
                </button>
              ))}
            </div>
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
              <span>Standard Rate ({numDeliveryDays} meals • Excl. Sundays):</span>
              <span className="line-through text-slate-400">₹{originalTotalPrice}</span>
            </div>
            <div className="flex items-center justify-between text-xs font-black text-brand-green">
              <span>Subscription Discount Savings:</span>
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

          {errorMsg && (
            <p className="text-[10px] font-bold text-red-500 bg-red-50 p-2.5 rounded-lg border border-red-100">
              ⚠️ {errorMsg}
            </p>
          )}

          <button
            type="submit"
            className="w-full py-4 bg-brand-green hover:bg-brand-green-hover text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-md active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4 text-white fill-current" /> Confirm Subscription • ₹{finalPrice}
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
                  <span className="font-extrabold text-brand-navy text-right max-w-[200px]">{selectedProduct.name} ({numDeliveryDays} Meals)</span>
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
                  <span className="font-bold text-brand-navy">{selectedTimeSlot} Daily</span>
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

    </div>
  );
}
