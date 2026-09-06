import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  MapPin, 
  Calendar, 
  Sparkles, 
  CheckCircle2, 
  RotateCcw, 
  ShieldCheck, 
  TrendingUp,
  Utensils,
  PauseCircle,
  AlertCircle,
  X
} from 'lucide-react';
import { ActiveSubscription } from '../types';
import { PRODUCTS } from '../data';
import { calculateMealsRemaining } from '../utils/deliverySlots';

interface ActivePlansProps {
  activeSubscriptions: ActiveSubscription[];
  onSubscriptionUpdate?: (subs: ActiveSubscription[]) => void;
  onRenewSub?: (planId: string) => void;
  onExploreClick?: () => void;
  isGuest?: boolean;
  onSignInClick?: () => void;
}

export default function ActivePlans({ 
  activeSubscriptions, 
  onSubscriptionUpdate,
  onRenewSub,
  onExploreClick,
  isGuest, 
  onSignInClick 
}: ActivePlansProps) {
  // Separate Subscriptions into Current vs Past (Completed)
  const currentSubscriptions = activeSubscriptions.filter(s => s.status !== 'completed');
  const pastSubscriptions = activeSubscriptions.filter(s => s.status === 'completed');

  // Sub-tab state ('current' vs 'past')
  const [activeTab, setActiveTab] = useState<'current' | 'past'>(() => {
    return currentSubscriptions.length > 0 ? 'current' : pastSubscriptions.length > 0 ? 'past' : 'current';
  });

  // Auto-switch tabs when a subscription completes or a new one is added
  useEffect(() => {
    if (currentSubscriptions.length > 0 && pastSubscriptions.length === 0) {
      setActiveTab('current');
    }
  }, [currentSubscriptions.length, pastSubscriptions.length]);

  // Declined Subscription Notification State
  const [declinedNotice, setDeclinedNotice] = useState<{ planName?: string; date?: string } | null>(null);
  const [isDeclinedDismissed, setIsDeclinedDismissed] = useState<boolean>(false);

  useEffect(() => {
    const checkDeclined = async () => {
      try {
        const lastDeclinedRaw = localStorage.getItem('proteino_last_declined_sub');
        if (lastDeclinedRaw) {
          const parsed = JSON.parse(lastDeclinedRaw);
          if (Date.now() - (parsed.timestamp || 0) < 24 * 60 * 60 * 1000) {
            setDeclinedNotice({ planName: parsed.planName || 'Gym High-Protein Plan', date: parsed.date || 'Recent' });
          }
        }

        const phone = localStorage.getItem('proteino_last_order_phone') || '';
        if (phone) {
          const clean = phone.replace(/\D/g, '').slice(-10);
          const res = await fetch(`/api/subscriptions/deleted?phone=${encodeURIComponent(clean)}`);
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
              const latest = data[0];
              setDeclinedNotice({ planName: latest.planName, date: latest.deletedDate || 'Recent' });
            }
          }
        }
      } catch (e) {}
    };

    checkDeclined();

    const handleDeclined = (e: any) => {
      setDeclinedNotice({
        planName: e.detail?.planName || 'Gym High-Protein Plan',
        date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      setIsDeclinedDismissed(false);
    };

    window.addEventListener('proteino_subscription_declined', handleDeclined);

    let bc: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      bc = new BroadcastChannel('proteino_sync');
      bc.onmessage = (msg) => {
        if (msg.data && msg.data.type === 'subscription_declined') {
          setDeclinedNotice({
            planName: msg.data.planName || 'Gym High-Protein Plan',
            date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          });
          setIsDeclinedDismissed(false);
        }
      };
    }

    return () => {
      window.removeEventListener('proteino_subscription_declined', handleDeclined);
      if (bc) bc.close();
    };
  }, []);

  return (
    <div className="flex flex-col h-full bg-[#FAF9F6] p-5 pb-28 overflow-y-auto select-none">
      
      {/* Top Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <span className="text-[10px] bg-[#EBF4E0] text-brand-green font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
            HIGH-PROTEIN MEAL PLANS
          </span>
        </div>
        <h2 className="text-2xl font-black text-brand-navy tracking-tight mt-1">Gym Subscriptions</h2>
        <p className="text-xs font-semibold text-brand-navy/50 mt-0.5">
          Real-time meal tracking & drop-off history (Excluding Sundays)
        </p>
      </div>

      {/* Customer Notification: Subscription Declined */}
      {declinedNotice && !isDeclinedDismissed && (
        <div className="mb-5 bg-red-50 border-2 border-red-300 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-red-600 text-white font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Subscription Declined
                </span>
                <span className="text-[10px] font-mono font-bold text-red-600">
                  {declinedNotice.date}
                </span>
              </div>
              <h3 className="text-sm font-black text-red-950 mt-1">
                Your subscription is declined. Please order again later.
              </h3>
              <p className="text-xs font-semibold text-red-800/80 mt-0.5">
                The kitchen administrator has declined your subscription plan{declinedNotice.planName ? ` (${declinedNotice.planName})` : ''}. You can order again at a later time.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-center">
            {onExploreClick && (
              <button
                onClick={onExploreClick}
                className="py-2 px-3.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black transition-all cursor-pointer whitespace-nowrap shadow-xs"
              >
                Order Again Later
              </button>
            )}
            <button
              onClick={() => setIsDeclinedDismissed(true)}
              className="p-1.5 rounded-xl hover:bg-red-100 text-red-600 border border-red-200 text-xs font-black cursor-pointer transition-all"
              title="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Guest Mode Notice */}
      {isGuest && (
        <div className="mb-5 bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-xs text-brand-navy">You are browsing as Guest</h3>
              <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
                Sign in to sync your active gym drop-offs and meal deliveries across devices.
              </p>
            </div>
          </div>
          {onSignInClick && (
            <button
              onClick={onSignInClick}
              className="py-2.5 px-4 rounded-xl bg-brand-navy text-white text-xs font-black hover:bg-brand-navy/90 transition-all cursor-pointer whitespace-nowrap self-end sm:self-center"
            >
              Sign In
            </button>
          )}
        </div>
      )}

      {/* Sub-Tabs: Current Subscriptions vs Past Subscriptions */}
      <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-200/60 rounded-2xl mb-5">
        <button
          onClick={() => setActiveTab('current')}
          className={`py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'current'
              ? 'bg-white text-brand-navy shadow-xs'
              : 'text-slate-500 hover:text-brand-navy'
          }`}
        >
          <span>Active Plans</span>
          {currentSubscriptions.length > 0 && (
            <span className="text-[10px] bg-brand-green text-white px-1.5 py-0.2 rounded-full font-mono">
              {currentSubscriptions.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('past')}
          className={`py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'past'
              ? 'bg-white text-brand-navy shadow-xs'
              : 'text-slate-500 hover:text-brand-navy'
          }`}
        >
          <span>Past Subscriptions</span>
          {pastSubscriptions.length > 0 && (
            <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.2 rounded-full font-mono">
              {pastSubscriptions.length}
            </span>
          )}
        </button>
      </div>

      {/* TAB CONTENT: CURRENT SUBSCRIPTIONS */}
      {activeTab === 'current' ? (
        currentSubscriptions.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 border border-slate-200/60 shadow-xs flex flex-col items-center justify-center text-center my-auto py-12">
            <div className="w-16 h-16 rounded-2xl bg-[#EBF4E0] text-brand-green flex items-center justify-center mb-4">
              <Utensils className="w-8 h-8" />
            </div>
            <h3 className="text-base font-black text-brand-navy">No Active Subscriptions</h3>
            <p className="text-xs font-semibold text-slate-400 max-w-xs mt-1.5 leading-relaxed">
              You don't have any ongoing gym meal subscriptions. Subscribe now to save 15% on fresh high-protein meals with convenient gym desk drop-off.
            </p>
            {onExploreClick && (
              <button
                onClick={onExploreClick}
                className="mt-6 py-3 px-6 rounded-2xl bg-brand-green text-white font-black text-xs hover:bg-brand-green-hover transition-all shadow-sm active:scale-95 cursor-pointer"
              >
                Explore Gym Meal Plans
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {currentSubscriptions.map((sub, idx) => {
              const product = PRODUCTS.find(p => p.id === sub.planId);
              const isVeg = product ? product.isVeg : sub.planName.toLowerCase().includes('veg');
              const stats = calculateMealsRemaining(sub.startDate, sub.durationDays, sub.isPaused, sub.pausedAt);

              return (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: idx * 0.08 }}
                  key={sub.id || idx}
                  className="bg-white rounded-3xl p-5 border border-slate-200/60 shadow-xs flex flex-col gap-4 relative overflow-hidden"
                >
                  {/* Decorative Left Border */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${sub.isPaused ? 'bg-amber-400' : 'bg-brand-green'}`} />

                  {/* Header: Status Pill & Plan ID & Price */}
                  <div className="flex items-start justify-between pl-1">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[8px] font-black uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                          sub.isPaused ? 'bg-amber-100 text-amber-700' : 'bg-[#EBF4E0] text-brand-green'
                        }`}>
                          {sub.isPaused ? (
                            <>
                              <PauseCircle className="w-2.5 h-2.5 text-amber-600" />
                              <span>PLAN PAUSED</span>
                            </>
                          ) : (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse" />
                              <span>ACTIVE GYM PLAN</span>
                            </>
                          )}
                        </span>
                        <span className="text-[9px] text-slate-400 font-mono font-bold">#{sub.id}</span>
                      </div>
                      <h3 className="font-black text-brand-navy text-[14px] mt-1.5 leading-tight tracking-tight">
                        {sub.planName}
                      </h3>
                      <p className="text-[10.5px] font-semibold text-slate-400 mt-0.5">
                        {stats.totalMeals} Scheduled Meals • Mon–Sat (Excl. Sundays)
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="font-black text-brand-green text-base">₹{sub.price}</span>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Paid Plan</p>
                    </div>
                  </div>

                  {/* Macro Nutrients Bar */}
                  {product && (
                    <div className="bg-[#FAF9F6] p-3 rounded-2xl border border-slate-200/40 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${isVeg ? 'border-green-600' : 'border-red-600'}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${isVeg ? 'bg-green-600' : 'bg-red-600'}`} />
                        </div>
                        <div>
                          <span className="text-[11px] font-extrabold text-brand-navy">{product.name}</span>
                          <p className="text-[9px] text-slate-400 font-semibold">{product.category.replace('_', ' ').toUpperCase()}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-[10px] text-brand-green font-black">💪 {product.protein}g</span>
                          <p className="text-[8px] text-slate-400 font-extrabold leading-none uppercase">Protein</p>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-brand-navy font-black">🔥 {product.calories}</span>
                          <p className="text-[8px] text-slate-400 font-extrabold leading-none uppercase">Calories</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Meals Remaining Highlight Banner (Replaces Timer Countdown) */}
                  <div className="bg-[#0F1E36] text-white p-4 rounded-2xl border border-brand-green/10 flex flex-col gap-2.5 relative overflow-hidden shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[8px] text-brand-green font-black uppercase tracking-wider flex items-center gap-1">
                        🍱 MEALS REMAINING
                      </span>
                      <span className="text-[10px] font-black text-brand-green bg-brand-green/20 px-2.5 py-0.5 rounded-full border border-brand-green/30">
                        {stats.percentage}% Delivered
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between">
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-white font-display">
                          {stats.mealsRemaining}
                        </span>
                        <span className="text-xs font-bold text-white/70">
                          Meals Remaining (out of {stats.totalMeals})
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-white/50">
                        Delivered: {stats.mealsDelivered}
                      </span>
                    </div>

                    <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                      <div 
                        className="h-full rounded-full bg-brand-green transition-all duration-500" 
                        style={{ width: `${stats.percentage}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[9.5px] text-white/60 font-semibold pt-0.5">
                      <span>Cycle: Day {stats.mealsDelivered + 1} of {stats.totalMeals}</span>
                      <span>Delivery: Mon–Sat (Excl. Sundays)</span>
                    </div>
                  </div>

                  {/* Gym Drop-off Desk Details */}
                  <div className="bg-[#FAF9F6] p-3.5 rounded-2xl border border-slate-200/40 flex flex-col justify-between">
                    <span className="text-[7.5px] text-brand-navy/40 font-black uppercase tracking-wider flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-brand-green" />
                      PARTNER GYM DROP-OFF DESK
                    </span>
                    <div className="flex items-center justify-between mt-1">
                      <div>
                        <p className="font-extrabold text-[11px] text-brand-navy truncate">
                          🏋️ {sub.gymName}
                        </p>
                        <p className="text-[9.5px] text-brand-navy/60 font-medium truncate mt-0.5">
                          {sub.gymLocation}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10.5px] font-black text-brand-green bg-brand-green/10 px-2.5 py-1 rounded-xl border border-brand-green/20">
                          🕒 {sub.timeSlot}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Schedule Dates & Live Desk Status */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-3 border-t border-slate-100 text-[10px] font-bold text-slate-500">
                    <div className="flex items-center gap-1 text-slate-500">
                      <Calendar className="w-3.5 h-3.5 text-brand-green shrink-0" />
                      <span>Started: {new Date(sub.startDate).toLocaleDateString("en-IN", { day: '2-digit', month: 'short' })}</span>
                      <span className="mx-1">•</span>
                      <span>Schedule: Mon–Sat (Excl. Sundays)</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-brand-navy/70 text-[9.5px] font-bold">
                      <ShieldCheck className="w-3.5 h-3.5 text-brand-green" />
                      <span>Daily Fulfillment at Front Desk</span>
                    </div>
                  </div>

                </motion.div>
              );
            })}
          </div>
        )
      ) : (
        /* TAB CONTENT: PAST SUBSCRIPTIONS */
        <div className="flex flex-col gap-4">
          {pastSubscriptions.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 border border-slate-200/50 shadow-xs flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-200/50">
                <CheckCircle2 className="w-8 h-8 text-slate-300" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-brand-navy">No Past Subscriptions</h3>
                <p className="text-xs text-brand-navy/50 font-medium mt-1.5 max-w-xs leading-relaxed">
                  When your meal plan cycles complete their delivery term, they will be archived here.
                </p>
              </div>
              <button
                onClick={onExploreClick}
                className="px-5 py-2.5 bg-brand-green hover:bg-brand-green-hover text-white text-xs font-black rounded-xl shadow-sm cursor-pointer transition-all active:scale-95"
              >
                Browse Monthly Subscriptions
              </button>
            </div>
          ) : (
            pastSubscriptions.map((sub, idx) => {
              const product = PRODUCTS.find(p => p.id === sub.planId);
              const isVeg = product ? product.isVeg : sub.planName.toLowerCase().includes('veg');

              return (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: idx * 0.08 }}
                  key={sub.id || idx}
                  className="bg-white rounded-3xl p-5 border border-slate-200/60 shadow-xs flex flex-col gap-4 relative overflow-hidden"
                >
                  {/* Decorative Completed Border */}
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-500" />

                  {/* Header: Completed Badge & ID & Price */}
                  <div className="flex items-start justify-between pl-1">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[8px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 flex items-center gap-1 border border-emerald-200/60">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>COMPLETED PLAN</span>
                        </span>
                        <span className="text-[9px] text-slate-400 font-mono font-bold">#{sub.id}</span>
                      </div>
                      <h3 className="font-black text-brand-navy text-[14px] mt-1.5 leading-tight tracking-tight">
                        {sub.planName}
                      </h3>
                      <p className="text-[10.5px] font-semibold text-slate-400 mt-0.5">
                        {sub.durationDays} Meals Delivered Successfully
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="font-black text-brand-navy text-base">₹{sub.price}</span>
                      <p className="text-[9px] font-bold text-emerald-600 uppercase">Accomplished</p>
                    </div>
                  </div>

                  {/* Macro Nutrients Bar */}
                  {product && (
                    <div className="bg-[#FAF9F6] p-3 rounded-2xl border border-slate-200/30 flex items-center justify-between opacity-85">
                      <div className="flex items-center gap-2">
                        <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${isVeg ? 'border-green-600' : 'border-red-600'}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${isVeg ? 'bg-green-600' : 'bg-red-600'}`} />
                        </div>
                        <span className="text-[11px] font-extrabold text-brand-navy">{product.name}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-[10px] text-brand-green font-black">💪 {product.protein}g</span>
                          <p className="text-[8px] text-slate-400 font-extrabold leading-none uppercase">Protein</p>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-brand-navy font-black">🔥 {product.calories}</span>
                          <p className="text-[8px] text-slate-400 font-extrabold leading-none uppercase">Calories</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Summary Details & Re-subscribe Action */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
                    <div className="flex flex-col gap-0.5 text-[10px] text-slate-500 font-semibold">
                      <span>🏋️ Drop-off Gym: <strong className="text-brand-navy">{sub.gymName}</strong></span>
                      <span>📅 Schedule: Mon–Sat (Excl. Sundays)</span>
                    </div>

                    <button
                      onClick={() => onRenewSub && onRenewSub(sub.planId)}
                      className="w-full sm:w-auto px-4 py-2.5 bg-brand-green hover:bg-brand-green-hover text-white font-extrabold text-xs rounded-xl shadow-xs transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Renew Plan</span>
                    </button>
                  </div>

                </motion.div>
              );
            })
          )}
        </div>
      )}

    </div>
  );
}
