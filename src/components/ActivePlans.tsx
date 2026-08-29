import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Clock, 
  MapPin, 
  Repeat, 
  Calendar, 
  Sparkles, 
  CheckCircle2, 
  RotateCcw,
  ChevronRight,
  ShieldCheck,
  TrendingUp
} from 'lucide-react';
import { ActiveSubscription } from '../types';
import { PRODUCTS } from '../data';

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
  const [now, setNow] = useState<number>(Date.now());

  // Separate Subscriptions into Current vs Past (Completed)
  const currentSubscriptions = activeSubscriptions.filter(s => s.status !== 'completed');
  const pastSubscriptions = activeSubscriptions.filter(s => s.status === 'completed');

  // Sub-tab state ('current' vs 'past')
  // Default to 'current' if active plans exist, else 'past' if past plans exist
  const [activeTab, setActiveTab] = useState<'current' | 'past'>(() => {
    return currentSubscriptions.length > 0 ? 'current' : pastSubscriptions.length > 0 ? 'past' : 'current';
  });

  // Auto-switch tabs when a subscription completes or a new one is added
  useEffect(() => {
    if (currentSubscriptions.length > 0 && pastSubscriptions.length === 0) {
      setActiveTab('current');
    }
  }, [currentSubscriptions.length, pastSubscriptions.length]);

  // Ticking live countdown timer every second
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Helper to calculate countdown time remaining
  const getSubscriptionCountdown = (expiryDateStr: string, isPaused: boolean, pausedAt?: string) => {
    const expiry = new Date(expiryDateStr).getTime();
    let diff = expiry - now;

    if (isPaused && pausedAt) {
      const pausedTime = new Date(pausedAt).getTime();
      diff = expiry - pausedTime;
    }

    if (diff <= 0) return "Term Completed";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  };

  // Helper to calculate days passed out of 26
  const getDaysProgress = (startDateStr: string, expiryDateStr: string) => {
    const start = new Date(startDateStr).getTime();
    const expiry = new Date(expiryDateStr).getTime();
    const totalDuration = Math.max(1, expiry - start);
    const elapsed = Math.max(0, Math.min(totalDuration, now - start));
    const percentage = Math.min(100, Math.round((elapsed / totalDuration) * 100));
    const daysElapsed = Math.min(26, Math.max(1, Math.round((elapsed / totalDuration) * 26)));
    return { percentage, daysElapsed };
  };

  return (
    <div className="flex flex-col h-full bg-[#FAF9F6] p-5 pb-28 overflow-y-auto select-none">
      
      {/* Top Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <span className="text-[10px] bg-[#EBF4E0] text-brand-green font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
            26-DAY MEAL PLANS
          </span>
        </div>
        <h2 className="text-2xl font-black text-brand-navy tracking-tight mt-1">Gym Subscriptions</h2>
        <p className="text-xs font-semibold text-brand-navy/50 mt-0.5">
          Live daily drop-off countdowns & subscription history
        </p>
      </div>

      {/* Guest Mode Notice */}
      {isGuest && (
        <div className="mb-5 bg-white border border-brand-green/20 rounded-3xl p-5 shadow-sm flex flex-col items-center text-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#EBF4E0] text-brand-green flex items-center justify-center text-2xl">
            ⚡
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-brand-navy">Track Your Gym Subscriptions</h3>
            <p className="text-xs text-brand-navy/60 max-w-[260px] mt-1 leading-relaxed">
              Sign in to monitor your 26-day meal plan status, daily delivery countdowns, and renewal records.
            </p>
          </div>
          <button
            onClick={onSignInClick}
            className="w-full py-2.5 bg-brand-green hover:bg-brand-green-hover text-white text-xs font-black rounded-xl shadow-sm cursor-pointer transition-all active:scale-95"
          >
            Sign In to View Subscriptions
          </button>
        </div>
      )}

      {/* Dual Sub-Tabs (Current Subscription vs Past Subscription) */}
      <div className="bg-white p-1.5 rounded-2xl border border-brand-navy/5 shadow-xs flex items-center gap-1.5 mb-5">
        <button
          onClick={() => setActiveTab('current')}
          id="tab-current-subscription"
          className={`relative flex-1 py-2.5 px-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'current'
              ? 'bg-[#0F1E36] text-white shadow-sm'
              : 'text-brand-navy/60 hover:text-brand-navy hover:bg-brand-navy/5'
          }`}
        >
          <span>Current Subscription</span>
          {currentSubscriptions.length > 0 && (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              activeTab === 'current' 
                ? 'bg-brand-green text-white animate-pulse' 
                : 'bg-brand-green/20 text-brand-green'
            }`}>
              {currentSubscriptions.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('past')}
          id="tab-past-subscription"
          className={`relative flex-1 py-2.5 px-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'past'
              ? 'bg-[#0F1E36] text-white shadow-sm'
              : 'text-brand-navy/60 hover:text-brand-navy hover:bg-brand-navy/5'
          }`}
        >
          <span>Past Subscription</span>
          {pastSubscriptions.length > 0 && (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              activeTab === 'past' 
                ? 'bg-white/20 text-white' 
                : 'bg-brand-navy/10 text-brand-navy/70'
            }`}>
              {pastSubscriptions.length}
            </span>
          )}
        </button>
      </div>

      {/* TAB CONTENT: CURRENT SUBSCRIPTION */}
      {activeTab === 'current' && (
        <div className="flex flex-col gap-4">
          {currentSubscriptions.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 border border-slate-200/50 shadow-xs flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-brand-green border border-slate-200/50">
                <Repeat className="w-8 h-8 text-slate-400" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-brand-navy">No Active Subscriptions</h3>
                <p className="text-xs text-brand-navy/50 font-medium mt-1.5 max-w-xs leading-relaxed">
                  You don't have any ongoing 26-day gym meal subscriptions at this time.
                </p>
              </div>
              <button
                onClick={onExploreClick}
                className="px-5 py-2.5 bg-brand-green hover:bg-brand-green-hover text-white text-xs font-black rounded-xl shadow-sm cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
              >
                <span>Explore 26-Day Gym Plans</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            currentSubscriptions.map((sub, idx) => {
              const product = PRODUCTS.find(p => p.id === sub.planId);
              const isVeg = product ? product.isVeg : sub.planName.toLowerCase().includes('veg');
              const { percentage, daysElapsed } = getDaysProgress(sub.startDate, sub.expiryDate);

              return (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: idx * 0.08 }}
                  key={sub.id || idx}
                  className="bg-white rounded-3xl p-5 border border-slate-200/60 shadow-xs flex flex-col gap-4 relative overflow-hidden"
                >
                  {/* Decorative Left Border */}
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-brand-green" />

                  {/* Header: Status Pill & Plan ID & Price */}
                  <div className="flex items-start justify-between pl-1">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[8px] font-black uppercase px-2.5 py-0.5 rounded-full bg-[#EBF4E0] text-brand-green flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse" />
                          <span>ACTIVE MEAL PLAN</span>
                        </span>
                        <span className="text-[9px] text-slate-400 font-mono font-bold">#{sub.id}</span>
                      </div>
                      <h3 className="font-black text-brand-navy text-[14px] mt-1.5 leading-tight tracking-tight">
                        {sub.planName}
                      </h3>
                      <p className="text-[10.5px] font-semibold text-slate-400 mt-0.5">
                        26 Daily Drop-offs • 1 Fresh Meal / Day
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

                  {/* 26-Day Progress Bar */}
                  <div className="bg-[#FAF9F6] p-3.5 rounded-2xl border border-slate-200/40 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-[10px] font-black">
                      <span className="text-brand-navy flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5 text-brand-green" />
                        <span>Cycle Progress</span>
                      </span>
                      <span className="text-brand-green font-mono">
                        Day {daysElapsed} / 26 ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden">
                      <div 
                        className="h-full rounded-full bg-brand-green transition-all duration-500" 
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Countdown Timer & Gym Drop-off Desk Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    
                    {/* Live Timer Countdown */}
                    <div className="bg-[#0F1E36] text-white p-3.5 rounded-2xl border border-brand-green/10 flex flex-col justify-between relative overflow-hidden shadow-xs">
                      <div className="absolute right-2.5 top-2.5 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-green opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-green"></span>
                      </div>
                      <span className="text-[7.5px] text-brand-green font-black uppercase tracking-wider flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        ⏳ TIME REMAINING
                      </span>
                      <p className="font-mono font-black text-xs text-white mt-1.5 tracking-tight">
                        {getSubscriptionCountdown(sub.expiryDate, false)}
                      </p>
                    </div>

                    {/* Destination Desk */}
                    <div className="bg-[#FAF9F6] p-3.5 rounded-2xl border border-slate-200/40 flex flex-col justify-between">
                      <span className="text-[7.5px] text-brand-navy/40 font-black uppercase tracking-wider flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-brand-green" />
                        PARTNER GYM DROP-OFF
                      </span>
                      <div>
                        <p className="font-extrabold text-[11px] text-brand-navy mt-1 truncate">
                          🏋️ {sub.gymName}
                        </p>
                        <p className="text-[9.5px] text-brand-navy/60 font-medium truncate mt-0.5">
                          {sub.gymLocation} • {sub.timeSlot}
                        </p>
                      </div>
                    </div>

                  </div>

                  {/* Schedule Dates & Live Desk Status */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-3 border-t border-slate-100 text-[10px] font-bold text-slate-500">
                    <div className="flex items-center gap-1 text-slate-500">
                      <Calendar className="w-3.5 h-3.5 text-brand-green shrink-0" />
                      <span>Started: {new Date(sub.startDate).toLocaleDateString("en-IN", { day: '2-digit', month: 'short' })}</span>
                      <span className="mx-1">•</span>
                      <span>Expires: {new Date(sub.expiryDate).toLocaleDateString("en-IN", { day: '2-digit', month: 'short' })}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-brand-navy/70 text-[9.5px] font-bold">
                      <ShieldCheck className="w-3.5 h-3.5 text-brand-green" />
                      <span>Daily Fulfillment at Front Desk</span>
                    </div>
                  </div>

                </motion.div>
              );
            })
          )}
        </div>
      )}

      {/* TAB CONTENT: PAST SUBSCRIPTION */}
      {activeTab === 'past' && (
        <div className="flex flex-col gap-4">
          {pastSubscriptions.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 border border-slate-200/50 shadow-xs flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-200/50">
                <CheckCircle2 className="w-8 h-8 text-slate-300" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-brand-navy">No Past Subscriptions</h3>
                <p className="text-xs text-brand-navy/50 font-medium mt-1.5 max-w-xs leading-relaxed">
                  When your 26-day meal plan cycles complete their delivery term, they will be archived here.
                </p>
              </div>
              <button
                onClick={onExploreClick}
                className="px-5 py-2.5 bg-brand-green hover:bg-brand-green-hover text-white text-xs font-black rounded-xl shadow-sm cursor-pointer transition-all active:scale-95"
              >
                Browse Gym Plans
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
                        26/26 Meals Delivered Successfully
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="font-black text-brand-navy text-base">₹{sub.price}</span>
                      <p className="text-[9px] font-bold text-emerald-600 uppercase">Accomplished</p>
                    </div>
                  </div>

                  {/* Macromolecules Bar */}
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

                  {/* Completion Certificate Banner */}
                  <div className="bg-emerald-50/60 border border-emerald-500/20 p-3.5 rounded-2xl flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-brand-navy">
                          🎉 Term Accomplished!
                        </p>
                        <p className="text-[10px] text-brand-navy/60 font-semibold mt-0.5 leading-relaxed">
                          All 26 daily high-protein drop-offs were completed at {sub.gymName}.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Summary Details & Re-subscribe Action */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
                    <div className="flex flex-col gap-0.5 text-[10px] text-slate-500 font-semibold">
                      <span>🏋️ Drop-off Gym: <strong className="text-brand-navy">{sub.gymName}</strong></span>
                      <span>📅 Term: {new Date(sub.startDate).toLocaleDateString("en-IN", { day: '2-digit', month: 'short' })} — {new Date(sub.expiryDate).toLocaleDateString("en-IN", { day: '2-digit', month: 'short' })}</span>
                    </div>

                    <button
                      onClick={() => onRenewSub && onRenewSub(sub.planId)}
                      className="w-full sm:w-auto px-4 py-2.5 bg-brand-green hover:bg-brand-green-hover text-white font-extrabold text-xs rounded-xl shadow-xs transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Renew 26-Day Plan</span>
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
