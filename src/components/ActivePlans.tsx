import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Clock, 
  MapPin, 
  Flame, 
  Activity, 
  Repeat, 
  TrendingUp, 
  Calendar, 
  Sparkles,
  Zap,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { ActiveSubscription } from '../types';
import { PRODUCTS } from '../data';

interface ActivePlansProps {
  activeSubscriptions: ActiveSubscription[];
  isGuest?: boolean;
  onSignInClick?: () => void;
}

export default function ActivePlans({ activeSubscriptions, isGuest, onSignInClick }: ActivePlansProps) {
  const [now, setNow] = useState<number>(Date.now());

  // Ticking state update for the live timer
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

    if (diff <= 0) return "Expired";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  };

  return (
    <div className="flex flex-col gap-6 pb-28 select-none">
      
      {/* Visual Header */}
      <div className="bg-brand-navy text-white rounded-3xl p-6 relative overflow-hidden shadow-md">
        <div className="absolute right-[-20px] top-[-20px] w-24 h-24 rounded-full bg-brand-green/10 blur-xl pointer-events-none" />
        
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-brand-green animate-pulse" />
          <span className="text-[9px] bg-brand-green/20 text-brand-green font-black px-2 py-0.5 rounded uppercase tracking-wider">
            LIVE TRACKER
          </span>
        </div>

        <h2 className="text-xl font-black mt-3 leading-tight font-display tracking-tight">Active Plan Dashboards</h2>
        <p className="text-xs text-white/60 font-medium mt-1.5 leading-relaxed">
          Monitor your ongoing gym meal subscription terms, remaining countdown delivery times, daily calorie drops, and nutritional compliance logs.
        </p>
      </div>

      {activeSubscriptions.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 border border-slate-200/50 shadow-sm flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-brand-green border border-slate-200/50">
            <AlertCircle className="w-8 h-8 text-slate-400" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-brand-navy">
              {isGuest ? 'Track Active Gym Subscriptions' : 'No Subscriptions Found'}
            </h3>
            <p className="text-xs text-brand-navy/50 font-medium mt-1.5 max-w-xs leading-relaxed">
              {isGuest 
                ? 'Sign in to view and manage your 26-day gym meal subscriptions, daily countdown delivery timers, and pause controls.'
                : 'Configure or checkout a subscription plan from the "Gym Plans" tab to view real-time countdown delivery tracking.'}
            </p>
          </div>
          {isGuest && (
            <button
              onClick={onSignInClick}
              className="px-5 py-2.5 bg-brand-green hover:bg-brand-green-hover text-white text-xs font-black rounded-xl shadow-sm cursor-pointer transition-all active:scale-95"
            >
              Sign In to View Plans
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          
          {/* Active / Running Subscriptions Section */}
          {activeSubscriptions.filter(s => s.status !== 'completed').length > 0 && (
            <div className="flex flex-col gap-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-brand-navy/40 pl-2">
                Active Subscriptions ({activeSubscriptions.filter(s => s.status !== 'completed').length})
              </h3>
              {activeSubscriptions.filter(s => s.status !== 'completed').map((sub, idx) => {
                const product = PRODUCTS.find(p => p.id === sub.planId);
                const isVeg = product ? product.isVeg : (sub.planName.toLowerCase().includes("veg"));

                return (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.1 }}
                    key={sub.id || idx}
                    className="bg-white rounded-3xl p-5 border border-slate-200/50 shadow-xs flex flex-col gap-4 relative overflow-hidden"
                  >
                    {/* Decorative Side Tag */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${sub.isPaused ? 'bg-amber-400' : 'bg-brand-green'}`} />

                    {/* Sub Name & Live Status badge */}
                    <div className="flex items-start justify-between">
                      <div className="pl-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${sub.isPaused ? 'bg-amber-100 text-amber-700' : 'bg-[#EBF4E0] text-brand-green'}`}>
                            {sub.isPaused ? 'Paused' : 'LIVE TRACKING'}
                          </span>
                          <span className="text-[9px] text-slate-400 font-mono font-bold">#{sub.id || 'SUB-ID'}</span>
                        </div>
                        <h3 className="font-black text-brand-navy text-[13px] mt-1.5 leading-tight tracking-tight">
                          {sub.planName}
                        </h3>
                      </div>

                      <span className="font-black text-brand-green text-sm">₹{sub.price}</span>
                    </div>

                    {/* Macromolecules Bar */}
                    {product && (
                      <div className="bg-[#FAF9F6] p-3 rounded-2xl border border-slate-200/10 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${isVeg ? 'border-green-600' : 'border-red-600'}`}>
                            <div className={`w-1 h-1 rounded-full ${isVeg ? 'bg-green-600' : 'bg-red-600'}`} />
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

                    {/* Live Countdown Grid Section */}
                    <div className="grid grid-cols-2 gap-3.5">
                      
                      {/* Countdown Timer */}
                      <div className="bg-[#0F1E36] text-white p-3.5 rounded-2xl border border-brand-green/10 flex flex-col justify-between relative overflow-hidden">
                        <div className="absolute right-2 top-2 flex h-1.5 w-1.5">
                          {!sub.isPaused && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-green opacity-75"></span>}
                          <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${sub.isPaused ? 'bg-amber-400' : 'bg-brand-green'}`}></span>
                        </div>
                        <span className="text-[7px] text-brand-green font-black uppercase tracking-wider">
                          {sub.isPaused ? "⏸️ TIMER PAUSED" : "⏳ TIME REMAINING"}
                        </span>
                        <p className="font-mono font-black text-xs text-white mt-1.5 tracking-tight">
                          {getSubscriptionCountdown(sub.expiryDate, sub.isPaused, sub.pausedAt)}
                        </p>
                      </div>

                      {/* Destination Desk */}
                      <div className="bg-[#FAF9F6] p-3.5 rounded-2xl border border-slate-200/30 flex flex-col justify-between">
                        <span className="text-[7px] text-brand-navy/40 font-black uppercase tracking-wider">
                          📍 DESK LOCATION
                        </span>
                        <div>
                          <p className="font-extrabold text-[10px] text-brand-navy mt-1 truncate">
                            🏋️ {sub.gymName}
                          </p>
                          <p className="text-[9px] text-brand-navy/50 font-medium truncate mt-0.5">
                            {sub.gymLocation}
                          </p>
                        </div>
                      </div>

                    </div>

                    {/* Dates Box */}
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 border-t border-slate-100 pt-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-brand-green" />
                        <span>Started {new Date(sub.startDate).toLocaleDateString("en-IN", { day: '2-digit', month: 'short' })}</span>
                      </span>
                      <span>Ends {new Date(sub.expiryDate).toLocaleDateString("en-IN", { day: '2-digit', month: 'short' })}</span>
                    </div>

                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Completed Subscriptions Section */}
          {activeSubscriptions.filter(s => s.status === 'completed').length > 0 && (
            <div className="flex flex-col gap-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-brand-navy/40 pl-2">
                🏆 Completed Plans History ({activeSubscriptions.filter(s => s.status === 'completed').length})
              </h3>
              {activeSubscriptions.filter(s => s.status === 'completed').map((sub, idx) => {
                const product = PRODUCTS.find(p => p.id === sub.planId);
                const isVeg = product ? product.isVeg : (sub.planName.toLowerCase().includes("veg"));

                return (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.1 }}
                    key={sub.id || idx}
                    className="bg-white rounded-3xl p-5 border border-slate-200/50 shadow-xs flex flex-col gap-4 relative overflow-hidden"
                  >
                    {/* Decorative Side Tag (Completed Green) */}
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-500" />

                    {/* Sub Name & Completed Status badge */}
                    <div className="flex items-start justify-between">
                      <div className="pl-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 flex items-center gap-1">
                            <span>🏆 COMPLETED</span>
                          </span>
                          <span className="text-[9px] text-slate-400 font-mono font-bold">#{sub.id || 'SUB-ID'}</span>
                        </div>
                        <h3 className="font-black text-brand-navy text-[13px] mt-1.5 leading-tight tracking-tight">
                          {sub.planName}
                        </h3>
                      </div>

                      <span className="font-black text-brand-navy text-sm">₹{sub.price}</span>
                    </div>

                    {/* Macromolecules Bar */}
                    {product && (
                      <div className="bg-[#FAF9F6] p-3 rounded-2xl border border-slate-200/10 flex items-center justify-between opacity-80">
                        <div className="flex items-center gap-2">
                          <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${isVeg ? 'border-green-600' : 'border-red-600'}`}>
                            <div className={`w-1 h-1 rounded-full ${isVeg ? 'bg-green-600' : 'bg-red-600'}`} />
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

                    {/* Completion Message Box */}
                    <div className="bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-2xl flex flex-col justify-between relative overflow-hidden">
                      <div className="flex items-center gap-2 text-emerald-600">
                        <Sparkles className="w-4 h-4 animate-bounce" />
                        <span className="text-[8px] font-black uppercase tracking-wider">CONGRATULATIONS</span>
                      </div>
                      <p className="text-xs text-brand-navy font-black mt-2">
                        🎉 Term Successfully Accomplished!
                      </p>
                      <p className="text-[10px] text-brand-navy/60 font-semibold mt-1 leading-relaxed">
                        Your high-protein gym delivery subscription plan has completed its cycle. Re-subscribe or talk to your gym desk to start a fresh term!
                      </p>
                    </div>

                    {/* Desk Location and Dates Summary */}
                    <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold border-t border-slate-100 pt-3">
                      <span className="truncate max-w-[180px]">🏋️ {sub.gymName} Drop-off</span>
                      <span>Ended {new Date(sub.expiryDate).toLocaleDateString("en-IN", { day: '2-digit', month: 'short' })}</span>
                    </div>

                  </motion.div>
                );
              })}
            </div>
          )}

        </div>
      )}

    </div>
  );
}
