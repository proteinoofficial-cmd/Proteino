import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Package, 
  ChefHat, 
  Bike, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  Calendar,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Order } from '../types';

interface OrdersTrackerProps {
  orders: Order[];
  onOrderUpdate: (orders: Order[]) => void;
  isGuest?: boolean;
  onSignInClick?: () => void;
}

export default function OrdersTracker({ orders, onOrderUpdate, isGuest, onSignInClick }: OrdersTrackerProps) {
  // Simulator ticking effect
  useEffect(() => {
    const interval = setInterval(() => {
      const updated = orders.map(order => {
        if (order.status === 'cooking' && order.deliveryTimeRemaining <= 15) {
          return {
            ...order,
            status: 'out_for_delivery' as const,
            deliveryTimeRemaining: Math.max(0, order.deliveryTimeRemaining - 1)
          };
        } else if (order.status === 'out_for_delivery' && order.deliveryTimeRemaining === 0) {
          return {
            ...order,
            status: 'delivered' as const
          };
        } else if (order.deliveryTimeRemaining > 0) {
          return {
            ...order,
            deliveryTimeRemaining: order.deliveryTimeRemaining - 1
          };
        }
        return order;
      });

      // Simple shallow check to prevent infinite re-renders
      const hasChanges = JSON.stringify(updated) !== JSON.stringify(orders);
      if (hasChanges) {
        onOrderUpdate(updated);
      }
    }, 10000); // check status every 10s

    return () => clearInterval(interval);
  }, [orders, onOrderUpdate]);

  const activeOrders = orders.filter(o => o.status !== 'delivered' && !o.items.some(item => item.purchaseOption === 'subscription'));
  const pastOrders = orders.filter(o => o.status === 'delivered' && !o.items.some(item => item.purchaseOption === 'subscription'));

  return (
    <div className="flex flex-col h-full bg-[#FAF9F6] p-5 pb-24 overflow-y-auto select-none">
      
      {/* Top Title */}
      <div className="mb-6">
        <h2 className="text-2xl font-black text-brand-navy tracking-tight">Your Orders</h2>
        <p className="text-xs font-semibold text-brand-navy/50 mt-0.5">Track your gourmet clean meals live</p>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center bg-white border border-brand-navy/5 rounded-3xl p-6 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-[#EBF4E0] flex items-center justify-center text-3xl mb-4">
            🍱
          </div>
          <h3 className="font-extrabold text-base text-brand-navy">
            {isGuest ? 'Track Live Meal Orders' : 'No active orders found'}
          </h3>
          <p className="text-xs text-brand-navy/55 max-w-[240px] mt-1.5 leading-relaxed">
            {isGuest 
              ? 'Sign in to access your placed meal orders, live kitchen timers, and gym delivery desk drop-offs.'
              : 'Choose a customized bulk or lean plan to jumpstart your daily fitness goals!'}
          </p>
          {isGuest && (
            <button
              onClick={onSignInClick}
              className="mt-4 px-5 py-2.5 bg-brand-green hover:bg-brand-green-hover text-white text-xs font-black rounded-xl shadow-sm cursor-pointer transition-all active:scale-95"
            >
              Sign In to View Orders
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          
          {/* Active Orders Section */}
          {activeOrders.length > 0 && (
            <div className="flex flex-col gap-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-brand-navy/50 flex items-center gap-2">
                <span className="w-2 h-2 bg-brand-green rounded-full animate-ping" />
                <span>Live Tracker</span>
              </h3>

              {activeOrders.map(order => (
                <div 
                  key={order.id} 
                  className="bg-[#0F1E36] rounded-3xl p-5 text-white shadow-md border border-white/5 flex flex-col gap-5"
                >
                  {/* Order ID & Header */}
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div>
                      <p className="text-[10px] text-white/50 font-bold uppercase tracking-wider">Order Reference</p>
                      <p className="text-xs font-black text-brand-green tracking-mono mt-0.5">{order.id}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-white/50 font-bold uppercase tracking-wider">Estimate Delivery</p>
                      <p className="text-xs font-black text-white mt-0.5 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-brand-green" />
                        <span>{order.deliveryTimeRemaining > 0 ? `${order.deliveryTimeRemaining} mins` : 'Any moment!'}</span>
                      </p>
                    </div>
                  </div>

                  {/* Status Steps Row */}
                  <div className="relative flex items-center justify-between px-2">
                    {/* Status Line Background & Progress Wrapper */}
                    <div className="absolute top-4 inset-x-8 h-1 z-0">
                      <div className="absolute inset-0 bg-white/10 rounded-full" />
                      <div 
                        className="absolute left-0 top-0 bottom-0 bg-brand-green rounded-full transition-all duration-500" 
                        style={{ 
                          width: order.status === 'cooking' ? '0%' : order.status === 'out_for_delivery' ? '50%' : '100%' 
                        }} 
                      />
                    </div>

                    {/* Step 1: Cooking */}
                    <div className="relative z-10 flex flex-col items-center">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                        order.status === 'cooking' 
                          ? 'bg-brand-green text-white scale-110 shadow-lg' 
                          : 'bg-brand-green/30 text-brand-green'
                      }`}>
                        <ChefHat className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-bold mt-2 text-white">Cooking</span>
                    </div>

                    {/* Step 2: On The Way */}
                    <div className="relative z-10 flex flex-col items-center">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                        order.status === 'out_for_delivery' 
                          ? 'bg-brand-green text-white scale-110 shadow-lg' 
                          : order.status === 'cooking' 
                            ? 'bg-white/10 text-white/40' 
                            : 'bg-brand-green/30 text-brand-green'
                      }`}>
                        <Bike className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-bold mt-2 text-white/70">On the Way</span>
                    </div>

                    {/* Step 3: Delivered */}
                    <div className="relative z-10 flex flex-col items-center">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all bg-white/10 text-white/40`}>
                        <MapPin className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-bold mt-2 text-white/50">Arrived</span>
                    </div>
                  </div>

                  {/* Delivery Details Block */}
                  {(order.customerName || order.gymName) && (
                    <div className="bg-white/5 rounded-2xl p-3 border border-white/5 flex flex-col gap-1 text-xs">
                      <p className="text-[9px] text-white/40 font-bold uppercase tracking-wider">Delivery Details</p>
                      {order.customerName && (
                        <p className="font-semibold text-white">
                          Recipient: <span className="text-brand-green font-extrabold">{order.customerName}</span> {order.customerPhone && <span className="text-white/60">({order.customerPhone})</span>}
                        </p>
                      )}
                      <p className="font-medium text-white/80 mt-0.5 flex items-start gap-1">
                        <span className="text-xs shrink-0">{order.gymName ? '🏋️' : '🏠'}</span>
                        <span>
                          {order.gymName ? (
                            <>
                              Partner Gym: <span className="font-extrabold text-brand-green">{order.gymName}</span>
                              <span className="block text-[10px] text-white/50">{order.gymLocation}</span>
                            </>
                          ) : (
                            'Home Delivery'
                          )}
                        </span>
                      </p>
                      {order.deliveryTimeSlot && (
                        <p className="text-[10px] font-semibold text-white/70 mt-1 flex items-center gap-1">
                          <span className="text-brand-green bg-brand-green/10 px-1.5 py-0.5 rounded text-[9px] font-black">{order.deliveryTimeSlot}</span>
                          <span>Preferred delivery slot</span>
                        </p>
                      )}
                    </div>
                  )}

                  {/* Order items info list */}
                  <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-xs py-1.5 first:pt-0 last:pb-0 border-b border-white/5 last:border-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-brand-green">{item.quantity}x</span>
                          <span className="font-semibold text-white">{item.product.name}</span>
                          <span className="text-[9px] font-bold uppercase tracking-wider text-white/40 px-1.5 bg-white/10 rounded">
                            {item.purchaseOption}
                          </span>
                        </div>
                        <span className="font-black text-white/80">₹{item.product.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>

                  {/* Bottom total status */}
                  <div className="flex justify-between items-center text-xs mt-1">
                    <span className="text-white/60 font-semibold">Total paid (incl. tax)</span>
                    <span className="font-black text-brand-green text-base">₹{order.total}</span>
                  </div>

                  {/* Fast-forward simulation control */}
                  <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                    <span className="text-white/45 font-semibold">Simulator fast-forward:</span>
                    <button 
                      onClick={() => {
                        const updated = orders.map(o => {
                          if (o.id !== order.id) return o;
                          const nextTime = Math.max(0, o.deliveryTimeRemaining - 5);
                          let nextStatus = o.status;
                          if (nextTime <= 0) {
                            nextStatus = 'delivered';
                          } else if (nextTime <= 15) {
                            nextStatus = 'out_for_delivery';
                          }
                          return {
                            ...o,
                            deliveryTimeRemaining: nextTime,
                            status: nextStatus
                          };
                        });
                        onOrderUpdate(updated);
                      }}
                      className="bg-brand-green text-white font-extrabold px-3 py-1.5 rounded-xl hover:bg-brand-green/80 transition-all text-[10px] cursor-pointer"
                    >
                      ⚡ Advance 5 mins
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Past Orders Section */}
          {pastOrders.length > 0 && (
            <div className="flex flex-col gap-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-brand-navy/40">
                Order History
              </h3>

              {pastOrders.map(order => (
                <div 
                  key={order.id} 
                  className="bg-white border border-brand-navy/5 rounded-3xl p-4 shadow-sm flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#EBF4E0] text-brand-green flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-brand-green" />
                    </div>
                    <div>
                      <p className="font-extrabold text-sm text-brand-navy">Delivered successfully</p>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-brand-navy/40 font-semibold flex-wrap">
                        <span className="font-mono text-brand-green font-bold">{order.id}</span>
                        <span>•</span>
                        <span>{order.date}</span>
                        {order.gymName && (
                          <>
                            <span>•</span>
                            <span className="text-brand-green font-black bg-[#EBF4E0] px-1.5 py-0.5 rounded">🏋️ {order.gymName}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-black text-sm text-brand-navy">₹{order.total}</p>
                    <p className="text-[9px] text-brand-green font-bold mt-0.5">Clean Eating</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Interactive Help Card */}
          <div className="bg-white p-5 rounded-3xl border border-brand-navy/5 shadow-sm flex flex-col gap-3">
            <div className="flex items-center gap-2 text-brand-green">
              <Sparkles className="w-5 h-5" />
              <h4 className="font-extrabold text-sm text-brand-navy">Daily Meal Schedules</h4>
            </div>
            <p className="text-xs font-medium text-brand-navy/60 leading-relaxed">
              We deliver your meals fresh twice daily: Morning slots (7:00 AM - 9:00 AM) and Evening slots (6:30 PM - 8:30 PM). Portion sizes are scientifically tailored.
            </p>
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-brand-green hover:underline cursor-pointer pt-1">
              <span>View custom macro schedule</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
