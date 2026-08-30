import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Package, 
  ChefHat, 
  Bike, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  Sparkles,
  ArrowRight,
  RotateCcw,
  ShoppingBag,
  Check,
  Flame,
  ChevronRight
} from 'lucide-react';
import { Order, CartItem } from '../types';

interface OrdersTrackerProps {
  orders: Order[];
  onOrderUpdate: (orders: Order[]) => void;
  isGuest?: boolean;
  onSignInClick?: () => void;
  onExploreClick?: () => void;
  onReorder?: (items: CartItem[]) => void;
}

export default function OrdersTracker({ 
  orders, 
  onOrderUpdate, 
  isGuest, 
  onSignInClick,
  onExploreClick,
  onReorder
}: OrdersTrackerProps) {
  // Separate orders: Current (ongoing: cooking or out_for_delivery) vs Past (delivered)
  const currentOrders = orders.filter(
    o => o.status !== 'delivered' && !o.items.some(item => item.purchaseOption === 'subscription')
  );
  const pastOrders = orders.filter(
    o => o.status === 'delivered' && !o.items.some(item => item.purchaseOption === 'subscription')
  );

  // Active sub-tab state ('current' vs 'past')
  // Default to 'current' if there are active orders, else 'past' if there are past orders
  const [activeTab, setActiveTab] = useState<'current' | 'past'>(() => {
    return currentOrders.length > 0 ? 'current' : pastOrders.length > 0 ? 'past' : 'current';
  });

  const [reorderedOrderIds, setReorderedOrderIds] = useState<string[]>([]);

  // Auto-switch tabs when orders transition or new orders arrive
  useEffect(() => {
    if (currentOrders.length > 0 && pastOrders.length === 0) {
      setActiveTab('current');
    }
  }, [currentOrders.length, pastOrders.length]);

  const handleReorderClick = (order: Order) => {
    if (onReorder) {
      onReorder(order.items);
      setReorderedOrderIds(prev => prev.includes(order.id) ? prev : [...prev, order.id]);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#FAF9F6] p-5 pb-28 overflow-y-auto select-none">
      
      {/* Top Header */}
      <div className="mb-4">
        <h2 className="text-2xl font-black text-brand-navy tracking-tight">Your Orders</h2>
        <p className="text-xs font-semibold text-brand-navy/50 mt-0.5">
          Live kitchen tracking & order history
        </p>
      </div>

      {/* Guest Mode Notice */}
      {isGuest && (
        <div className="mb-5 bg-white border border-brand-green/20 rounded-3xl p-5 shadow-sm flex flex-col items-center text-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#EBF4E0] text-brand-green flex items-center justify-center text-2xl">
            🍱
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-brand-navy">Track & Reorder Your Meals</h3>
            <p className="text-xs text-brand-navy/60 max-w-[260px] mt-1 leading-relaxed">
              Sign in to view your live orders, gym drop-off status, and instant 1-tap reordering.
            </p>
          </div>
          <button
            onClick={onSignInClick}
            className="w-full py-2.5 bg-brand-green hover:bg-brand-green-hover text-white text-xs font-black rounded-xl shadow-sm cursor-pointer transition-all active:scale-95"
          >
            Sign In to View Orders
          </button>
        </div>
      )}

      {/* Dual Sub-Tabs (Current Orders vs Past Orders) */}
      <div className="bg-white p-1.5 rounded-2xl border border-brand-navy/5 shadow-xs flex items-center gap-1.5 mb-5">
        <button
          onClick={() => setActiveTab('current')}
          className={`relative flex-1 py-2.5 px-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'current'
              ? 'bg-[#0F1E36] text-white shadow-sm'
              : 'text-brand-navy/60 hover:text-brand-navy hover:bg-brand-navy/5'
          }`}
        >
          <span>Current Orders</span>
          {currentOrders.length > 0 && (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              activeTab === 'current' 
                ? 'bg-brand-green text-white animate-pulse' 
                : 'bg-brand-green/20 text-brand-green'
            }`}>
              {currentOrders.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('past')}
          className={`relative flex-1 py-2.5 px-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'past'
              ? 'bg-[#0F1E36] text-white shadow-sm'
              : 'text-brand-navy/60 hover:text-brand-navy hover:bg-brand-navy/5'
          }`}
        >
          <span>Past Orders</span>
          {pastOrders.length > 0 && (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              activeTab === 'past' 
                ? 'bg-white/20 text-white' 
                : 'bg-brand-navy/10 text-brand-navy/70'
            }`}>
              {pastOrders.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab Content Display */}
      <AnimatePresence mode="wait">
        
        {/* ================= CURRENT ORDERS TAB ================= */}
        {activeTab === 'current' && (
          <motion.div
            key="current-tab"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-4"
          >
            {currentOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center bg-white border border-brand-navy/5 rounded-3xl p-6 shadow-sm">
                <div className="w-16 h-16 rounded-full bg-[#EBF4E0] flex items-center justify-center text-3xl mb-3">
                  🛵
                </div>
                <h3 className="font-extrabold text-base text-brand-navy">
                  No active orders right now
                </h3>
                <p className="text-xs text-brand-navy/55 max-w-[260px] mt-1.5 leading-relaxed">
                  When you order meals, they will appear here with live kitchen preparation and gym desk drop-off status.
                </p>
                {onExploreClick && (
                  <button
                    onClick={onExploreClick}
                    className="mt-4 px-6 py-2.5 bg-brand-green hover:bg-brand-green-hover text-white text-xs font-black rounded-2xl shadow-sm cursor-pointer transition-all active:scale-95 flex items-center gap-2"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Order Fresh Meal</span>
                  </button>
                )}
              </div>
            ) : (
              currentOrders.map(order => (
                <div 
                  key={order.id} 
                  className="bg-[#0F1E36] rounded-3xl p-5 text-white shadow-lg border border-white/10 flex flex-col gap-4.5"
                >
                  {/* Order Reference & Live Status Header */}
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-brand-green animate-ping" />
                        <p className="text-[10px] text-white/60 font-black uppercase tracking-wider">Live Status</p>
                      </div>
                      <p className="text-xs font-black text-brand-green tracking-mono mt-0.5">{order.id}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-white/50 font-bold uppercase tracking-wider">Current Stage</p>
                      <p className="text-xs font-black text-white mt-0.5 flex items-center gap-1.5 justify-end">
                        <Clock className="w-3.5 h-3.5 text-brand-green" />
                        <span>
                          {order.status === 'cooking' ? 'Preparing in Kitchen' : 'Out for Delivery'}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Visual Status Progress Stepper */}
                  <div className="relative flex items-center justify-between px-2 pt-1 pb-1">
                    {/* Background line */}
                    <div className="absolute top-5 inset-x-8 h-1 z-0">
                      <div className="absolute inset-0 bg-white/10 rounded-full" />
                      <div 
                        className="absolute left-0 top-0 bottom-0 bg-brand-green rounded-full transition-all duration-500" 
                        style={{ 
                          width: order.status === 'cooking' ? '20%' : '75%' 
                        }} 
                      />
                    </div>

                    {/* Step 1: Cooking */}
                    <div className="relative z-10 flex flex-col items-center">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                        order.status === 'cooking' 
                          ? 'bg-brand-green text-white scale-110 shadow-lg shadow-brand-green/30 ring-4 ring-brand-green/20' 
                          : 'bg-brand-green/40 text-brand-green'
                      }`}>
                        <ChefHat className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-extrabold mt-1.5 text-white">Cooking</span>
                    </div>

                    {/* Step 2: On The Way */}
                    <div className="relative z-10 flex flex-col items-center">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                        order.status === 'out_for_delivery' 
                          ? 'bg-brand-green text-white scale-110 shadow-lg shadow-brand-green/30 ring-4 ring-brand-green/20' 
                          : 'bg-white/10 text-white/40'
                      }`}>
                        <Bike className="w-4 h-4" />
                      </div>
                      <span className={`text-[10px] font-extrabold mt-1.5 ${order.status === 'out_for_delivery' ? 'text-white font-black' : 'text-white/60'}`}>
                        On the Way
                      </span>
                    </div>

                    {/* Step 3: Arrived */}
                    <div className="relative z-10 flex flex-col items-center">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center transition-all bg-white/10 text-white/40">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-bold mt-1.5 text-white/45">Arrived</span>
                    </div>
                  </div>

                  {/* Delivery Location Details */}
                  {(order.customerName || order.gymName) && (
                    <div className="bg-white/5 rounded-2xl p-3.5 border border-white/5 flex flex-col gap-1.5 text-xs">
                      <p className="text-[9px] text-white/40 font-black uppercase tracking-wider">Drop-off Destination</p>
                      {order.customerName && (
                        <p className="font-semibold text-white">
                          Customer: <span className="text-brand-green font-extrabold">{order.customerName}</span> {order.customerPhone && <span className="text-white/60">({order.customerPhone})</span>}
                        </p>
                      )}
                      <p className="font-medium text-white/90 flex items-start gap-1.5">
                        <span className="text-sm shrink-0">{order.gymName ? '🏋️' : '🏠'}</span>
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
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-brand-green bg-brand-green/20 px-2 py-0.5 rounded text-[9.5px] font-black">{order.deliveryTimeSlot}</span>
                          <span className="text-[10px] text-white/60">Scheduled Time Slot</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Order Items List */}
                  <div className="bg-white/5 rounded-2xl p-3 border border-white/5 flex flex-col gap-2">
                    <p className="text-[9px] text-white/40 font-black uppercase tracking-wider">Items in this order</p>
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs py-1 first:pt-0 last:pb-0 border-b border-white/5 last:border-0">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg overflow-hidden bg-white/10 shrink-0">
                            <img 
                              src={item.product.image} 
                              alt={item.product.name} 
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div>
                            <p className="font-bold text-white leading-tight">
                              <span className="text-brand-green font-black mr-1">{item.quantity}x</span>
                              {item.product.name}
                            </p>
                            <p className="text-[9.5px] text-white/50 font-medium">
                              {item.product.protein}g Protein • {item.product.calories} Kcal
                            </p>
                          </div>
                        </div>
                        <span className="font-black text-white/90">₹{item.product.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>

                  {/* Total Amount */}
                  <div className="flex justify-between items-center text-xs px-1">
                    <span className="text-white/60 font-semibold">Total Paid (incl. taxes)</span>
                    <span className="font-black text-brand-green text-base">₹{order.total}</span>
                  </div>

                  {/* Live Status Notice */}
                  <div className="pt-2 border-t border-white/10 flex items-center justify-center text-center">
                    <p className="text-[10px] text-brand-green/90 font-bold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse" />
                      Status updates live as the kitchen & delivery team fulfill your meal
                    </p>
                  </div>

                </div>
              ))
            )}
          </motion.div>
        )}

        {/* ================= PAST ORDERS TAB ================= */}
        {activeTab === 'past' && (
          <motion.div
            key="past-tab"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-3.5"
          >
            {pastOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center bg-white border border-brand-navy/5 rounded-3xl p-6 shadow-sm">
                <div className="w-16 h-16 rounded-full bg-[#EBF4E0] flex items-center justify-center text-3xl mb-3">
                  📦
                </div>
                <h3 className="font-extrabold text-base text-brand-navy">
                  No past orders yet
                </h3>
                <p className="text-xs text-brand-navy/55 max-w-[260px] mt-1.5 leading-relaxed">
                  When the admin delivers your order, it will automatically move here for quick 1-tap reordering and macro review.
                </p>
                {onExploreClick && (
                  <button
                    onClick={onExploreClick}
                    className="mt-4 px-6 py-2.5 bg-brand-green hover:bg-brand-green-hover text-white text-xs font-black rounded-2xl shadow-sm cursor-pointer transition-all active:scale-95 flex items-center gap-2"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Explore Meal Menu</span>
                  </button>
                )}
              </div>
            ) : (
              pastOrders.map(order => (
                <div 
                  key={order.id} 
                  className="bg-white border border-brand-navy/5 rounded-3xl p-4.5 shadow-sm flex flex-col gap-3 hover:border-brand-green/30 transition-all"
                >
                  {/* Past Order Header */}
                  <div className="flex items-center justify-between border-b border-brand-navy/5 pb-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-2xl bg-[#EBF4E0] text-brand-green flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-4.5 h-4.5 text-brand-green" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-brand-navy">Delivered</span>
                          <span className="text-[9px] font-mono text-brand-green font-extrabold bg-[#EBF4E0] px-1.5 py-0.2 rounded">
                            {order.id}
                          </span>
                        </div>
                        <p className="text-[10px] font-semibold text-brand-navy/45 mt-0.5">
                          {order.date || 'Completed Order'}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-black text-sm text-brand-navy">₹{order.total}</p>
                      <span className="text-[9px] font-bold text-brand-green bg-[#EBF4E0] px-1.5 py-0.5 rounded-full inline-block mt-0.5">
                        Delivered & Paid
                      </span>
                    </div>
                  </div>

                  {/* Delivery Location Tag */}
                  {order.gymName && (
                    <div className="flex items-center gap-1.5 text-xs text-brand-navy/70 bg-[#FAF9F6] px-3 py-1.5 rounded-xl border border-brand-navy/5">
                      <span className="text-xs">🏋️</span>
                      <span className="font-bold text-[11px] text-brand-navy">{order.gymName}</span>
                      <span className="text-[10px] text-brand-navy/40">• {order.gymLocation || 'Front Desk'}</span>
                    </div>
                  )}

                  {/* Meals Ordered in this past order */}
                  <div className="flex flex-col gap-2">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs bg-gray-50/70 p-2 rounded-xl">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-lg overflow-hidden bg-gray-200 shrink-0">
                            <img 
                              src={item.product.image} 
                              alt={item.product.name} 
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div>
                            <p className="font-extrabold text-xs text-brand-navy">
                              {item.quantity}x {item.product.name}
                            </p>
                            <div className="flex items-center gap-1.5 text-[10px] text-brand-navy/50 font-medium">
                              <span className="text-brand-green font-bold flex items-center gap-0.5">
                                <Flame className="w-2.5 h-2.5 text-brand-green fill-brand-green" />
                                {item.product.protein}g Protein
                              </span>
                              <span>•</span>
                              <span>{item.product.calories} Kcal</span>
                            </div>
                          </div>
                        </div>
                        <span className="font-black text-xs text-brand-navy">₹{item.product.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>

                  {/* Reorder Action Button */}
                  <div className="pt-1 flex items-center justify-between">
                    <p className="text-[10px] font-semibold text-brand-navy/40">
                      {order.items.length} {order.items.length === 1 ? 'meal' : 'meals'} delivered
                    </p>
                    {onReorder && (
                      <button
                        onClick={() => handleReorderClick(order)}
                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                          reorderedOrderIds.includes(order.id)
                            ? 'bg-[#0F1E36] text-brand-green border border-brand-green/30 shadow-xs'
                            : 'bg-[#EBF4E0] hover:bg-brand-green hover:text-white text-brand-navy border border-brand-green/20'
                        }`}
                        title={reorderedOrderIds.includes(order.id) ? "Added to Cart" : "Reorder this meal"}
                      >
                        {reorderedOrderIds.includes(order.id) ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-brand-green" />
                            <span>Added to Cart</span>
                          </>
                        ) : (
                          <>
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Reorder Meal</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                </div>
              ))
            )}
          </motion.div>
        )}

      </AnimatePresence>

      {/* Helpful Schedule Info Footer */}
      <div className="mt-5 bg-white p-4.5 rounded-3xl border border-brand-navy/5 shadow-xs flex flex-col gap-2">
        <div className="flex items-center gap-2 text-brand-green">
          <Sparkles className="w-4 h-4" />
          <h4 className="font-extrabold text-xs text-brand-navy">Daily Meal Schedules</h4>
        </div>
        <p className="text-[11px] font-medium text-brand-navy/60 leading-relaxed">
          Morning slots (7:00 AM – 9:00 AM) and Evening slots (6:30 PM – 8:30 PM). Portion sizes and macros are scientifically weighed.
        </p>
      </div>

    </div>
  );
}
