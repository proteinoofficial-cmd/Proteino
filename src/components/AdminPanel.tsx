import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  Lock, 
  ShoppingBag, 
  Repeat, 
  MapPin, 
  Clock, 
  User, 
  Phone, 
  CheckCircle, 
  Truck, 
  Play, 
  LogOut, 
  RefreshCw,
  Search,
  Calendar,
  Zap,
  Check
} from "lucide-react";
import { Order, ActiveSubscription } from "../types";
import { PRODUCTS } from "../data";
import { apiFetch } from "../utils/api";

interface AdminPanelProps {
  onBackToApp: () => void;
}

export default function AdminPanel({ onBackToApp }: AdminPanelProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [activeTab, setActiveTab] = useState<"single" | "plan">("single");

  // Server data states
  const [orders, setOrders] = useState<Order[]>([]);
  const [subscriptions, setSubscriptions] = useState<ActiveSubscription[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Ticking state for subscriptions countdown
  const [now, setNow] = useState(Date.now());

  // Periodically refresh countdown ticking every second
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch all orders and subscriptions from the backend server
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [ordersRes, subsRes] = await Promise.all([
        apiFetch("/api/orders?admin=true"),
        apiFetch("/api/subscriptions?admin=true")
      ]);
      if (ordersRes.ok && ordersRes.headers.get('content-type')?.includes('application/json')) {
        const oData = await ordersRes.json();
        setOrders(oData);
      }
      if (subsRes.ok && subsRes.headers.get('content-type')?.includes('application/json')) {
        const sData = await subsRes.json();
        setSubscriptions(sData);
      }
    } catch (err) {
      console.error("Failed to fetch admin data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  // Handle password submit
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "ADMIN" || password === "admin") {
      setIsAuthenticated(true);
      setLoginError("");
    } else {
      setLoginError("Incorrect password. Please enter 'ADMIN' or 'admin'.");
    }
  };

  // Update order status on server & locally
  const handleUpdateOrderStatus = async (orderId: string, newStatus: "cooking" | "out_for_delivery" | "delivered") => {
    try {
      const res = await apiFetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
        const updatedOrder = await res.json();
        setOrders(prev => prev.map(o => o.id === orderId ? updatedOrder : o));
      }
    } catch (err) {
      console.error("Failed to update order status:", err);
    }
  };

  // Update subscription status on server & locally
  const handleUpdateSubscriptionStatus = async (subId: string, status: "active" | "completed") => {
    try {
      const res = await apiFetch(`/api/subscriptions/${subId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
        const updatedSub = await res.json();
        setSubscriptions(prev => prev.map(s => s.id === subId ? updatedSub : s));
      }
    } catch (err) {
      console.error("Failed to update subscription status:", err);
    }
  };

  // Delete subscription from server & locally (keep the delete plan in admin panel)
  const handleDeleteSubscription = async (subId: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this subscription plan? This cannot be undone.")) {
      return;
    }
    try {
      const res = await apiFetch(`/api/subscriptions/${subId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setSubscriptions(prev => prev.filter(s => s.id !== subId));
      }
    } catch (err) {
      console.error("Failed to delete subscription:", err);
    }
  };

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

  // Filter lists based on search query (by phone, customer name, gym, etc.)
  const filteredOrders = orders.filter(o => 
    o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.customerPhone.includes(searchQuery) ||
    (o.gymName && o.gymName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredSubscriptions = subscriptions.filter(sub => 
    sub.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sub.customerPhone.includes(searchQuery) ||
    sub.gymName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sub.planName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group subscriptions by customer phone number
  const groupedSubscriptionsMap = new Map<string, ActiveSubscription[]>();
  filteredSubscriptions.forEach(sub => {
    const key = sub.customerPhone || 'unknown';
    if (!groupedSubscriptionsMap.has(key)) {
      groupedSubscriptionsMap.set(key, []);
    }
    groupedSubscriptionsMap.get(key)!.push(sub);
  });

  const groupedSubscriptionsList = Array.from(groupedSubscriptionsMap.entries()).map(([phone, subs]) => ({
    phone,
    customerName: subs[0].customerName,
    subs
  }));

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center p-6 select-none">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-slate-200/60 shadow-xl flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#EBF4E0] text-brand-green flex items-center justify-center mb-4 border border-brand-green/20">
            <ShieldCheck className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-black text-brand-navy tracking-tight font-display">Proteino Admin Portal</h2>
          <p className="text-xs text-brand-navy/50 font-medium mt-1">Authorized access only. Enter administrative passcode to proceed.</p>

          <form onSubmit={handleLoginSubmit} className="w-full mt-6 flex flex-col gap-4">
            <div className="flex flex-col text-left gap-1.5 relative">
              <label className="text-[9px] font-black uppercase tracking-wider text-brand-navy/40 flex items-center gap-1">
                <Lock className="w-3 h-3 text-brand-green" /> Passcode
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter ADMIN or admin"
                className="bg-[#FAF9F6] border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-brand-navy focus:outline-none focus:border-brand-green/40 shadow-sm w-full"
                autoFocus
              />
            </div>

            {loginError && (
              <p className="text-[11px] font-bold text-red-500 bg-red-50 p-2.5 rounded-lg border border-red-100">
                {loginError}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-3.5 bg-brand-navy text-white text-xs font-black uppercase tracking-wider rounded-xl hover:bg-brand-navy/90 active:scale-98 transition-all cursor-pointer"
            >
              Verify Administrative Credentials
            </button>
          </form>

          <button
            onClick={onBackToApp}
            className="text-xs font-bold text-brand-green hover:underline mt-6 cursor-pointer"
          >
            ← Return to Proteino Store
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col select-none">
      
      {/* Top Admin Header Bar */}
      <header className="bg-brand-navy text-white px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-green text-white flex items-center justify-center font-black">
            👑
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight flex items-center gap-2">
              <span>Proteino Admin Panel</span>
              <span className="bg-brand-green/20 text-brand-green text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">LIVE DATA</span>
            </h1>
            <p className="text-[10px] text-white/50 font-bold">Synchronized across all administrative dashboards</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            disabled={isLoading}
            className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-white transition-all disabled:opacity-50 cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => setIsAuthenticated(false)}
            className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-all cursor-pointer"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
          <button
            onClick={onBackToApp}
            className="px-4 py-2 bg-brand-green text-white text-[10px] font-black uppercase tracking-wider rounded-xl hover:bg-brand-green/90 transition-all cursor-pointer"
          >
            Store App
          </button>
        </div>
      </header>

      {/* Main Admin Contents */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto pb-24">
        
        {/* Search Input Box & Overview Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-white p-5 rounded-3xl border border-slate-200/60 shadow-xs">
          <div>
            <h2 className="text-lg font-black text-brand-navy tracking-tight">Administrative Control Dashboard</h2>
            <p className="text-[11px] text-brand-navy/50 font-bold mt-0.5">Real-time status synchronizer & fulfillment terminal</p>
            
            {/* Tabs Selector at the top as requested */}
            <div className="flex gap-2 p-1 bg-[#FAF9F6] border border-slate-200/60 rounded-2xl w-fit mt-3">
              <button
                onClick={() => setActiveTab("single")}
                className={`py-2 px-4 rounded-xl text-xs font-black tracking-tight transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === "single"
                    ? "bg-brand-navy text-white shadow-sm"
                    : "text-brand-navy/60 hover:bg-slate-100"
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Single Meal Orders</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === 'single' ? 'bg-brand-green text-white' : 'bg-slate-200 text-brand-navy/60'}`}>
                  {filteredOrders.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab("plan")}
                className={`py-2 px-4 rounded-xl text-xs font-black tracking-tight transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === "plan"
                    ? "bg-brand-navy text-white shadow-sm"
                    : "text-brand-navy/60 hover:bg-slate-100"
                }`}
              >
                <Repeat className="w-3.5 h-3.5" />
                <span>Subscription Orders</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === 'plan' ? 'bg-brand-green text-white' : 'bg-slate-200 text-brand-navy/60'}`}>
                  {subscriptions.length}
                </span>
              </button>
            </div>
          </div>
          <div className="relative max-w-xs w-full self-start md:self-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by phone, name, gym, meal..."
              className="bg-[#FAF9F6] border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs font-semibold text-brand-navy focus:outline-none focus:border-brand-green/30 w-full shadow-inner"
            />
          </div>
        </div>

        {/* TABBED CONTENTS IN A BALANCED MAX-W CONTAINER */}
        <div className="max-w-4xl mx-auto">
          {activeTab === "single" && (
            /* COLUMN 1: SINGLE MEAL ORDERS */
            <div className="space-y-4">
            <div className="flex items-center justify-between bg-brand-navy text-white px-5 py-4 rounded-3xl shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-white/10 rounded-xl text-brand-green">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm tracking-tight">Single Meal Orders</h3>
                  <p className="text-[9px] text-white/50 font-bold uppercase tracking-wider">Kitchen & Dispatch Queue</p>
                </div>
              </div>
              <span className="bg-brand-green text-white text-[11px] font-black px-3 py-1 rounded-full shadow-xs">
                {filteredOrders.length} ORDERS
              </span>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/60 shadow-xs text-slate-400 font-bold">
                No single orders found matching search criteria.
              </div>
            ) : (
              <div className="space-y-4 max-h-[750px] overflow-y-auto pr-1">
                {filteredOrders.map((order) => (
                  <div key={order.id} className="bg-white rounded-3xl border border-slate-200/70 p-5 shadow-xs hover:border-brand-green/30 transition-all flex flex-col gap-4">
                    
                    {/* Header: ID, Date & Preferred Slot */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <p className="text-[10px] font-black text-brand-navy/40 uppercase tracking-wider">ORDER ID</p>
                        <p className="font-black text-brand-navy text-sm">{order.id}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-slate-400 font-bold">{order.date}</p>
                        {order.deliveryTimeSlot && (
                          <span className="inline-block mt-1 bg-[#EBF4E0] text-brand-green text-[9px] font-black px-2 py-0.5 rounded-full">
                            🕒 {order.deliveryTimeSlot} Preferred
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Customer & Destination Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Recipient */}
                      <div className="bg-[#FAF9F6] p-3 rounded-2xl border border-slate-100">
                        <p className="text-[9px] font-black text-brand-navy/30 uppercase tracking-widest mb-1.5">RECIPIENT CUSTOMER</p>
                        <p className="font-black text-brand-navy flex items-center gap-1.5 text-xs">
                          <User className="w-3.5 h-3.5 text-brand-green shrink-0" />
                          <span>{order.customerName}</span>
                        </p>
                        <p className="text-[10px] text-brand-navy/60 font-mono mt-1 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{order.customerPhone || "N/A"}</span>
                        </p>
                      </div>

                      {/* Gym Linked Destination */}
                      <div className="bg-[#EBF4E0]/60 p-3 rounded-2xl border border-brand-green/10">
                        <p className="text-[9px] font-black text-brand-green uppercase tracking-widest mb-1.5">DESTINATION PARTNER GYM</p>
                        {order.gymName ? (
                          <>
                            <p className="font-black text-brand-navy text-xs flex items-center gap-1">
                              <span>🏋️</span> {order.gymName}
                            </p>
                            <p className="text-[10px] text-brand-navy/60 font-medium mt-0.5 leading-tight">
                              📍 {order.gymLocation}
                            </p>
                          </>
                        ) : (
                          <p className="text-slate-400 font-bold italic text-xs">No Gym Linked</p>
                        )}
                      </div>
                    </div>

                    {/* Items & Total amount */}
                    <div className="bg-[#0F1E36]/5 p-3.5 rounded-2xl">
                      <p className="text-[9px] font-black text-brand-navy/30 uppercase tracking-widest mb-2">MEALS PREP CHECKLIST</p>
                      <div className="space-y-1.5">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center text-xs">
                            <p className="font-semibold text-brand-navy">
                              <span className="text-brand-green font-black">{item.quantity}x</span> {item.product.name}
                            </p>
                            <span className="text-[10px] bg-white text-slate-500 font-bold px-1.5 py-0.5 rounded border border-slate-100">
                              ₹{item.product.price}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between items-center border-t border-slate-200/50 mt-3 pt-2">
                        <span className="text-[10px] font-black uppercase text-brand-navy/40">TOTAL BILL PAID</span>
                        <span className="font-black text-sm text-brand-green">₹{order.total}</span>
                      </div>
                    </div>

                    {/* Live Linked Delivery Status & Actions Row */}
                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                      <div>
                        <p className="text-[8px] font-black text-brand-navy/40 uppercase tracking-widest">LIVE TRACKER STATE</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                            order.status === "cooking"
                              ? "bg-amber-100 text-amber-700"
                              : order.status === "out_for_delivery"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-[#EBF4E0] text-brand-green"
                          }`}>
                            {order.status === "cooking" && <Clock className="w-3 h-3 animate-spin-slow" />}
                            {order.status === "out_for_delivery" && <Truck className="w-3.5 h-3.5 animate-bounce-slow" />}
                            {order.status === "delivered" && <CheckCircle className="w-3 h-3" />}
                            <span>
                              {order.status === "cooking" ? "Cooking" : order.status === "out_for_delivery" ? "On the Way" : "Complete"}
                            </span>
                          </span>
                        </div>
                      </div>

                      {/* Status controllers linked directly to customer order tracker */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleUpdateOrderStatus(order.id, "cooking")}
                          disabled={order.status === "cooking"}
                          className={`flex-1 sm:flex-none py-2 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                            order.status === "cooking"
                              ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                              : "bg-amber-500 hover:bg-amber-600 text-white shadow-xs active:scale-95"
                          }`}
                        >
                          Cooking
                        </button>

                        <button
                          onClick={() => handleUpdateOrderStatus(order.id, "out_for_delivery")}
                          disabled={order.status === "out_for_delivery"}
                          className={`flex-1 sm:flex-none py-2 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                            order.status === "out_for_delivery"
                              ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                              : "bg-blue-500 hover:bg-blue-600 text-white shadow-xs active:scale-95"
                          }`}
                        >
                          On the Way
                        </button>

                        <button
                          onClick={() => handleUpdateOrderStatus(order.id, "delivered")}
                          disabled={order.status === "delivered"}
                          className={`flex-1 sm:flex-none py-2 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                            order.status === "delivered"
                              ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                              : "bg-brand-green hover:bg-brand-green/90 text-white shadow-xs active:scale-95"
                          }`}
                        >
                          Complete
                        </button>
                      </div>

                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
          )}

          {activeTab === "plan" && (
            /* COLUMN 2: GYM PLAN MEMBERSHIPS */
            <div className="space-y-4">
            <div className="flex items-center justify-between bg-brand-green text-white px-5 py-4 rounded-3xl shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-white/15 rounded-xl text-white">
                  <Repeat className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm tracking-tight">Gym Plan Subscriptions</h3>
                  <p className="text-[9px] text-white/70 font-bold uppercase tracking-wider">Multi-Day Recurring Deliveries</p>
                </div>
              </div>
              <span className="bg-[#0F1E36] text-white text-[11px] font-black px-3 py-1 rounded-full shadow-xs">
                {subscriptions.length} PLANS
              </span>
            </div>

            {groupedSubscriptionsList.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/60 shadow-xs text-slate-400 font-bold">
                No active memberships found matching search criteria.
              </div>
            ) : (
              <div className="space-y-5 max-h-[750px] overflow-y-auto pr-1">
                {groupedSubscriptionsList.map(({ phone, customerName, subs }) => (
                  <div key={phone} className="bg-white rounded-3xl border border-slate-200/60 p-5 shadow-xs flex flex-col gap-4">
                    
                    {/* Customer Identity Section (Member name & phone) */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">MEMBER:</span>
                        <h4 className="font-black text-brand-navy text-sm leading-none">{customerName}</h4>
                        <span className="text-[10px] text-slate-400 font-mono font-bold">({phone})</span>
                      </div>
                      <span className="text-[9px] bg-brand-green/10 text-brand-green font-black px-2 py-0.5 rounded-full uppercase">
                        {subs.length} Active {subs.length === 1 ? 'Plan' : 'Plans'}
                      </span>
                    </div>

                    {/* Sequential simplified list of member's active plans */}
                    <div className="divide-y divide-slate-100">
                      {subs.map((sub, index) => {
                        const mealProduct = PRODUCTS.find(p => p.id === sub.planId);
                        const mealName = mealProduct ? mealProduct.name : sub.planName.replace(" 26-Day Subscription", "").replace("Subscription", "").trim();
                        const isVeg = mealProduct ? mealProduct.isVeg : (sub.planName.toLowerCase().includes("veg") && !sub.planName.toLowerCase().includes("non-veg"));

                        return (
                          <div key={sub.id || index} className={`py-4 ${index === 0 ? 'pt-1' : ''} ${index === subs.length - 1 ? 'pb-1' : ''} flex flex-col gap-3`}>
                            
                            {/* Sequential title and indicator */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-black text-brand-green font-mono">
                                  {index + 1}.
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${isVeg ? 'border-green-600 bg-green-50' : 'border-red-600 bg-red-50'}`}>
                                    <div className={`w-1.5 h-1.5 rounded-full ${isVeg ? 'bg-green-600' : 'bg-red-600'}`} />
                                  </div>
                                  <h4 className="font-black text-xs text-brand-navy uppercase tracking-tight">{mealName}</h4>
                                </div>
                              </div>
                              <span className="text-[9px] bg-[#FAF9F6] border border-slate-200 text-brand-navy/60 font-black px-2 py-0.5 rounded font-mono">
                                🕒 {sub.timeSlot}
                              </span>
                            </div>

                            {/* Highlighted Gym & Countdown Timer */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                              
                              {/* Highlighted Gym Info */}
                              <div className="bg-[#EBF4E0] border border-brand-green/35 rounded-xl p-3 flex flex-col justify-center">
                                <p className="text-[8px] font-black text-brand-green tracking-widest uppercase">DELIVERY DESTINATION GYM</p>
                                <p className="font-black text-brand-navy text-xs mt-1 tracking-tight flex items-center gap-1 truncate">
                                  <span>🏋️</span> {sub.gymName}
                                </p>
                                <p className="text-[9px] text-brand-navy/60 font-semibold mt-0.5 truncate leading-none">
                                  {sub.gymLocation}
                                </p>
                              </div>

                              {/* Highlighted Live Countdown Timer */}
                              <div className="bg-[#0F1E36] text-white rounded-xl p-3 border border-brand-navy/10 shadow-sm flex flex-col justify-center relative">
                                <div className="absolute right-2 top-2 flex h-1.5 w-1.5">
                                  {!sub.isPaused && sub.status !== "completed" && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-green opacity-75"></span>}
                                  <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${sub.status === "completed" ? "bg-green-500" : sub.isPaused ? 'bg-amber-400' : 'bg-brand-green'}`}></span>
                                </div>
                                <p className="text-[8px] font-black text-brand-green tracking-widest uppercase leading-none">
                                  {sub.status === "completed" ? "🏆 COMPLETED" : sub.isPaused ? "⏸️ TIMER PAUSED" : "⚡ LIVE TIMER COUNTDOWN"}
                                </p>
                                <p className="text-[12px] font-black font-mono tracking-wider mt-1.5 text-white leading-none">
                                  {sub.status === "completed" ? "Plan Completed" : getSubscriptionCountdown(sub.expiryDate, sub.isPaused, sub.pausedAt)}
                                </p>
                              </div>

                            </div>

                            {/* Ends Date / Completion Indicator */}
                            <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold">
                              <span>
                                {sub.status === "completed" ? "Completed: " : "Expires: "}
                                {new Date(sub.expiryDate).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' })} • Excludes Sundays
                              </span>
                            </div>

                            {/* Administrative Controls for Subscription */}
                            <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-1">
                              <div className="flex items-center gap-1">
                                <span className="text-[9px] font-black uppercase text-brand-navy/40">Status:</span>
                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                                  sub.status === "completed"
                                    ? "bg-green-100 text-green-700"
                                    : sub.isPaused
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-[#EBF4E0] text-brand-green"
                                }`}>
                                  {sub.status === "completed" ? "🏆 Completed" : sub.isPaused ? "Paused" : "Active"}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                {sub.status !== "completed" && (
                                  <button
                                    onClick={() => handleUpdateSubscriptionStatus(sub.id, "completed")}
                                    className="px-2.5 py-1.5 bg-[#6B9E35] hover:bg-[#59832B] text-white text-[9px] font-black uppercase tracking-wider rounded-lg shadow-xs transition-all cursor-pointer flex items-center gap-1"
                                  >
                                    <Check className="w-3 h-3" />
                                    <span>Complete Plan</span>
                                  </button>
                                )}

                                <button
                                  onClick={() => handleDeleteSubscription(sub.id)}
                                  className="px-2.5 py-1.5 bg-red-500 hover:bg-red-600 text-white text-[9px] font-black uppercase tracking-wider rounded-lg shadow-xs transition-all cursor-pointer flex items-center gap-1"
                                  title="Delete Plan"
                                >
                                  <span>🗑️ Delete Plan</span>
                                </button>
                              </div>
                            </div>

                          </div>
                        );
                      })}
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
          )}

        </div>

      </main>
    </div>
  );
}
