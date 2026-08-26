import React, { useState, useEffect, useMemo, useRef } from "react";
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
  Check,
  BarChart3,
  CalendarDays,
  Flame,
  ArrowUpRight,
  Filter,
  Layers,
  Volume2,
  VolumeX,
  Bell,
  X
} from "lucide-react";
import { Order, ActiveSubscription } from "../types";
import { PRODUCTS } from "../data";
import { apiFetch } from "../utils/api";
import { playOrderAlertSound, initAudioUnlock } from "../utils/audio";

interface NewOrderNotification {
  id: string;
  category: "single" | "subscription";
  title: string;
  customerName: string;
  customerPhone: string;
  gymName?: string;
  amount: number;
  timeStr: string;
  dateStr: string;
  createdAt: number;
  expiresAt: number; // 1 minute (60,000 ms) after creation
}

interface AdminPanelProps {
  onBackToApp: () => void;
}

export default function AdminPanel({ onBackToApp }: AdminPanelProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [activeTab, setActiveTab] = useState<"single" | "plan" | "total">("single");
  const [timeFilter, setTimeFilter] = useState<"24h" | "month" | "all">("24h");
  const [typeFilter, setTypeFilter] = useState<"all" | "single" | "subscription">("all");

  // Sound toggle state (defaults to true for active kitchen/admin alerting)
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);

  // Notifications state (pops up on the left side, active for 1 minute / 60 seconds)
  const [activeAlerts, setActiveAlerts] = useState<NewOrderNotification[]>([]);

  // Server data states
  const [orders, setOrders] = useState<Order[]>([]);
  const [subscriptions, setSubscriptions] = useState<ActiveSubscription[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Refs for tracking seen orders to trigger sound and popups only on new incoming arrivals
  const hasInitializedRef = useRef(false);
  const knownOrderIdsRef = useRef<Set<string>>(new Set());
  const knownSubIdsRef = useRef<Set<string>>(new Set());

  // Ticking state for subscriptions countdown & 1-minute popup countdowns
  const [now, setNow] = useState(Date.now());

  // Periodically refresh countdown ticking every second and clean up expired 1-minute popups
  useEffect(() => {
    const interval = setInterval(() => {
      const currentNow = Date.now();
      setNow(currentNow);
      
      // Auto-close alerts that reached their 1-minute expiration
      setActiveAlerts(prev => prev.filter(alert => alert.expiresAt > currentNow));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Helper to accurately format order placement time & date for display
  const formatOrderDateTime = (createdAt?: string, dateStr?: string) => {
    if (createdAt) {
      const d = new Date(createdAt);
      if (!isNaN(d.getTime())) {
        const time = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
        const date = d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
        return { time, date, display: `${time}, ${date}` };
      }
    }
    if (dateStr) {
      // If it's already a full formatted string like "02:30 PM, 26 Aug 2026"
      if (dateStr.includes(",") || dateStr.toLowerCase().includes("am") || dateStr.toLowerCase().includes("pm")) {
        return { time: dateStr.split(",")[0]?.trim() || dateStr, date: dateStr.split(",")[1]?.trim() || "", display: dateStr };
      }
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        const time = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
        const date = d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
        return { time, date, display: `${time}, ${date}` };
      }
      return { time: dateStr, date: "", display: dateStr };
    }
    return { time: "Just now", date: "", display: "Just now" };
  };

  // Trigger an alert popup and sound effect
  const triggerOrderAlert = (alert: NewOrderNotification) => {
    if (isSoundEnabled) {
      playOrderAlertSound();
    }
    setActiveAlerts(prev => [alert, ...prev.filter(a => a.id !== alert.id)].slice(0, 5));
  };

  // Dismiss a popup manually if admin clicks close
  const dismissAlert = (alertId: string) => {
    setActiveAlerts(prev => prev.filter(a => a.id !== alertId));
  };

  // Test sound function for admin
  const testAlertSound = () => {
    initAudioUnlock();
    playOrderAlertSound();
    const nowTime = new Date();
    const formattedTime = nowTime.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
    const formattedDate = nowTime.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

    const testAlert: NewOrderNotification = {
      id: `TEST-${Date.now().toString().slice(-4)}`,
      category: "single",
      title: "1x High Protein Chicken Rice Bowl",
      customerName: "Chef / Admin Preview",
      customerPhone: "9876543210",
      gymName: "Cult.Fit Indiranagar",
      amount: 249,
      timeStr: formattedTime,
      dateStr: formattedDate,
      createdAt: Date.now(),
      expiresAt: Date.now() + 60000 // 1 minute
    };
    setActiveAlerts(prev => [testAlert, ...prev]);
  };

  // Fetch all orders and subscriptions from the backend server
  const fetchData = async (isBackground = false) => {
    if (!isBackground) setIsLoading(true);
    try {
      const [ordersRes, subsRes] = await Promise.all([
        apiFetch("/api/orders?admin=true"),
        apiFetch("/api/subscriptions?admin=true")
      ]);

      let newOrdersList: Order[] = [];
      let newSubsList: ActiveSubscription[] = [];

      if (ordersRes.ok && ordersRes.headers.get('content-type')?.includes('application/json')) {
        newOrdersList = await ordersRes.json();
        setOrders(newOrdersList);
      }
      if (subsRes.ok && subsRes.headers.get('content-type')?.includes('application/json')) {
        newSubsList = await subsRes.json();
        setSubscriptions(newSubsList);
      }

      // Check for newly arrived orders / subscriptions to trigger loud sound & 1-minute left popup
      if (hasInitializedRef.current) {
        // Detect new Single Meal Orders
        newOrdersList.forEach(o => {
          if (!knownOrderIdsRef.current.has(o.id)) {
            knownOrderIdsRef.current.add(o.id);
            const itemsSummary = o.items.map(i => `${i.quantity}x ${i.product.name}`).join(", ");
            const dt = formatOrderDateTime(o.createdAt, o.date);

            triggerOrderAlert({
              id: o.id,
              category: "single",
              title: itemsSummary || "Single Meal Order",
              customerName: o.customerName || "Customer",
              customerPhone: o.customerPhone || "",
              gymName: o.gymName,
              amount: o.total || 0,
              timeStr: dt.time,
              dateStr: dt.date,
              createdAt: Date.now(),
              expiresAt: Date.now() + 60000 // 1 minute (60 seconds)
            });
          }
        });

        // Detect new Gym Subscription Orders
        newSubsList.forEach(s => {
          if (!knownSubIdsRef.current.has(s.id)) {
            knownSubIdsRef.current.add(s.id);
            const dt = formatOrderDateTime(s.createdAt || s.startDate, s.date || s.startDate);

            triggerOrderAlert({
              id: s.id,
              category: "subscription",
              title: s.planName || "26-Day Gym Subscription Plan",
              customerName: s.customerName || "Subscriber",
              customerPhone: s.customerPhone || "",
              gymName: s.gymName,
              amount: s.price || 0,
              timeStr: dt.time,
              dateStr: dt.date,
              createdAt: Date.now(),
              expiresAt: Date.now() + 60000 // 1 minute (60 seconds)
            });
          }
        });
      } else {
        // First initial load: mark existing IDs as seen
        newOrdersList.forEach(o => knownOrderIdsRef.current.add(o.id));
        newSubsList.forEach(s => knownSubIdsRef.current.add(s.id));
        hasInitializedRef.current = true;
      }

    } catch (err) {
      console.error("Failed to fetch admin data:", err);
    } finally {
      if (!isBackground) setIsLoading(false);
    }
  };

  // Unlock audio on initial mount or user click
  useEffect(() => {
    const handleUserInteraction = () => {
      initAudioUnlock();
    };
    window.addEventListener("click", handleUserInteraction, { once: false });
    window.addEventListener("keydown", handleUserInteraction, { once: false });
    return () => {
      window.removeEventListener("click", handleUserInteraction);
      window.removeEventListener("keydown", handleUserInteraction);
    };
  }, []);

  // Initial load and fast 4-second live background polling for real-time kitchen incoming orders
  useEffect(() => {
    if (isAuthenticated) {
      initAudioUnlock();
      fetchData(false);
      const pollInterval = setInterval(() => {
        fetchData(true);
      }, 4000);
      return () => clearInterval(pollInterval);
    }
  }, [isAuthenticated, isSoundEnabled]);

  // Handle password submit
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    initAudioUnlock();
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

  // Helper to normalize phone numbers for accurate customer re-order tracking
  const normalizePhone = (phone?: string) => {
    if (!phone) return "";
    const digits = phone.replace(/\D/g, "");
    if (digits.length >= 10) {
      return digits.slice(-10);
    }
    return digits || phone.trim().toLowerCase();
  };

  // Compute customer order frequency and lifetime totals across both single meals and subscriptions by phone
  const customerStatsByPhone = React.useMemo(() => {
    const map = new Map<string, { singleCount: number; subCount: number; totalOrders: number; name: string }>();

    orders.forEach(o => {
      const key = normalizePhone(o.customerPhone);
      if (!key) return;
      const existing = map.get(key) || { singleCount: 0, subCount: 0, totalOrders: 0, name: o.customerName };
      existing.singleCount += 1;
      existing.totalOrders += 1;
      if (o.customerName) existing.name = o.customerName;
      map.set(key, existing);
    });

    subscriptions.forEach(s => {
      const key = normalizePhone(s.customerPhone);
      if (!key) return;
      const existing = map.get(key) || { singleCount: 0, subCount: 0, totalOrders: 0, name: s.customerName };
      existing.subCount += 1;
      existing.totalOrders += 1;
      if (s.customerName) existing.name = s.customerName;
      map.set(key, existing);
    });

    return map;
  }, [orders, subscriptions]);

  // Helper to get order statistics for any phone number
  const getCustomerStats = (phone?: string) => {
    const key = normalizePhone(phone);
    if (!key) return { totalOrders: 1, singleCount: 1, subCount: 0, isReOrdered: false };
    const stats = customerStatsByPhone.get(key);
    if (!stats) return { totalOrders: 1, singleCount: 1, subCount: 0, isReOrdered: false };
    return {
      ...stats,
      isReOrdered: stats.totalOrders > 1
    };
  };

  // Helper to extract numeric timestamp from order/subscription dates
  const getOrderTimestamp = (createdAt?: string, dateStr?: string, defaultOffset: number = 0): number => {
    if (createdAt) {
      const t = new Date(createdAt).getTime();
      if (!isNaN(t)) return t;
    }
    if (dateStr) {
      if (dateStr.toLowerCase().includes("today")) {
        return Date.now() - defaultOffset;
      }
      const t = Date.parse(dateStr);
      if (!isNaN(t)) return t;
    }
    return Date.now() - defaultOffset;
  };

  // Build unified chronological list of all orders (Single Meals + Gym Subscriptions)
  const unifiedOrdersList = useMemo(() => {
    const list: Array<{
      id: string;
      type: 'single' | 'subscription';
      dateStr: string;
      timestamp: number;
      customerName: string;
      customerPhone: string;
      gymName?: string;
      gymLocation?: string;
      deliveryTimeSlot?: string;
      amount: number;
      status: string;
      is24h: boolean;
      isThisMonth: boolean;
      itemsCount: number;
      summaryTitle: string;
      singleOrder?: Order;
      subscription?: ActiveSubscription;
    }> = [];

    const nowDate = new Date(now);

    // 1. Process Single Meal Orders
    orders.forEach((o, index) => {
      const ts = getOrderTimestamp(o.createdAt, o.date, index * 60000);
      const orderDate = new Date(ts);
      const is24h = (now - ts) <= (24 * 60 * 60 * 1000) && (ts <= now + 60000);
      const isThisMonth = orderDate.getFullYear() === nowDate.getFullYear() && orderDate.getMonth() === nowDate.getMonth();
      const itemsSummary = o.items.map(i => `${i.quantity}x ${i.product.name}`).join(", ");

      list.push({
        id: o.id,
        type: 'single',
        dateStr: o.date || new Date(ts).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
        timestamp: ts,
        customerName: o.customerName || 'Customer',
        customerPhone: o.customerPhone || '',
        gymName: o.gymName,
        gymLocation: o.gymLocation,
        deliveryTimeSlot: o.deliveryTimeSlot,
        amount: o.total || 0,
        status: o.status,
        is24h,
        isThisMonth,
        itemsCount: o.items.reduce((acc, i) => acc + i.quantity, 0),
        summaryTitle: itemsSummary || 'Custom Meal Order',
        singleOrder: o
      });
    });

    // 2. Process Gym Subscriptions
    subscriptions.forEach((s, index) => {
      const ts = getOrderTimestamp(s.startDate, s.startDate, index * 60000);
      const orderDate = new Date(ts);
      const is24h = (now - ts) <= (24 * 60 * 60 * 1000) && (ts <= now + 60000);
      const isThisMonth = orderDate.getFullYear() === nowDate.getFullYear() && orderDate.getMonth() === nowDate.getMonth();

      list.push({
        id: s.id,
        type: 'subscription',
        dateStr: new Date(ts).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        timestamp: ts,
        customerName: s.customerName || 'Subscriber',
        customerPhone: s.customerPhone || '',
        gymName: s.gymName,
        gymLocation: s.gymLocation,
        deliveryTimeSlot: s.timeSlot,
        amount: s.price || 0,
        status: s.status || (s.isPaused ? 'paused' : 'active'),
        is24h,
        isThisMonth,
        itemsCount: 1,
        summaryTitle: s.planName,
        subscription: s
      });
    });

    // Sort descending (latest first)
    return list.sort((a, b) => b.timestamp - a.timestamp);
  }, [orders, subscriptions, now]);

  // Statistics for Per Day (24 Hours)
  const stats24h = useMemo(() => {
    const list = unifiedOrdersList.filter(o => o.is24h);
    return {
      totalCount: list.length,
      revenue: list.reduce((acc, o) => acc + o.amount, 0),
      singleCount: list.filter(o => o.type === 'single').length,
      subCount: list.filter(o => o.type === 'subscription').length
    };
  }, [unifiedOrdersList]);

  // Statistics for This Month
  const statsMonth = useMemo(() => {
    const list = unifiedOrdersList.filter(o => o.isThisMonth);
    return {
      totalCount: list.length,
      revenue: list.reduce((acc, o) => acc + o.amount, 0),
      singleCount: list.filter(o => o.type === 'single').length,
      subCount: list.filter(o => o.type === 'subscription').length,
      monthName: new Date(now).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    };
  }, [unifiedOrdersList, now]);

  // Statistics for All Time
  const statsAll = useMemo(() => {
    return {
      totalCount: unifiedOrdersList.length,
      revenue: unifiedOrdersList.reduce((acc, o) => acc + o.amount, 0),
      singleCount: unifiedOrdersList.filter(o => o.type === 'single').length,
      subCount: unifiedOrdersList.filter(o => o.type === 'subscription').length
    };
  }, [unifiedOrdersList]);

  // Filtered unified orders for the Total Orders view
  const filteredUnifiedOrders = useMemo(() => {
    return unifiedOrdersList.filter(o => {
      // Time filter (24 hours vs this month vs all)
      if (timeFilter === '24h' && !o.is24h) return false;
      if (timeFilter === 'month' && !o.isThisMonth) return false;

      // Type filter (Single vs Subscription vs All)
      if (typeFilter === 'single' && o.type !== 'single') return false;
      if (typeFilter === 'subscription' && o.type !== 'subscription') return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchId = o.id.toLowerCase().includes(q);
        const matchName = o.customerName.toLowerCase().includes(q);
        const matchPhone = o.customerPhone.includes(q);
        const matchGym = o.gymName ? o.gymName.toLowerCase().includes(q) : false;
        const matchSummary = o.summaryTitle.toLowerCase().includes(q);
        if (!matchId && !matchName && !matchPhone && !matchGym && !matchSummary) return false;
      }

      return true;
    });
  }, [unifiedOrdersList, timeFilter, typeFilter, searchQuery]);

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
    subs,
    stats: getCustomerStats(phone)
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

        <div className="flex items-center gap-2.5">
          {/* Live Sound Toggle Button */}
          <button
            onClick={() => setIsSoundEnabled(!isSoundEnabled)}
            className={`px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
              isSoundEnabled 
                ? "bg-amber-500 hover:bg-amber-600 text-white shadow-xs" 
                : "bg-white/10 text-white/50 hover:bg-white/15"
            }`}
            title={isSoundEnabled ? "Alert Sound Active (Click to Mute)" : "Alert Sound Muted (Click to Unmute)"}
          >
            {isSoundEnabled ? <Volume2 className="w-4 h-4 animate-pulse" /> : <VolumeX className="w-4 h-4" />}
            <span className="text-[10px] uppercase tracking-wider hidden sm:inline">
              {isSoundEnabled ? "Sound ON" : "Muted"}
            </span>
          </button>

          {/* Test Sound Button */}
          <button
            onClick={testAlertSound}
            className="px-2.5 py-2 bg-white/10 hover:bg-white/20 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all flex items-center gap-1 cursor-pointer"
            title="Simulate incoming order chime and 1-minute left popup"
          >
            <Bell className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">Test Sound</span>
          </button>

          <button
            onClick={() => fetchData(false)}
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
            <div className="flex gap-2 p-1 bg-[#FAF9F6] border border-slate-200/60 rounded-2xl w-fit mt-3 flex-wrap">
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
              <button
                onClick={() => setActiveTab("total")}
                className={`py-2 px-4 rounded-xl text-xs font-black tracking-tight transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === "total"
                    ? "bg-brand-navy text-white shadow-sm"
                    : "text-brand-navy/60 hover:bg-slate-100"
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span>Total Orders</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === 'total' ? 'bg-amber-500 text-white' : 'bg-slate-200 text-brand-navy/60'}`}>
                  {unifiedOrdersList.length}
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
                {filteredOrders.map((order) => {
                  const stats = getCustomerStats(order.customerPhone);

                  return (
                    <div key={order.id} className="bg-white rounded-3xl border border-slate-200/70 p-5 shadow-xs hover:border-brand-green/30 transition-all flex flex-col gap-4">
                      
                      {/* Header: ID, Date & Preferred Slot */}
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div>
                          <p className="text-[10px] font-black text-brand-navy/40 uppercase tracking-wider">ORDER ID</p>
                          <div className="flex items-center gap-2 flex-wrap mt-0.5">
                            <p className="font-black text-brand-navy text-sm font-mono">{order.id}</p>
                            {stats.isReOrdered && (
                              <span className="inline-flex items-center gap-1 bg-amber-500 text-white text-[9.5px] font-black px-2 py-0.5 rounded-full shadow-xs uppercase tracking-tight">
                                <Repeat className="w-2.5 h-2.5" /> Re-ordered ({stats.totalOrders}x Orders)
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center justify-end gap-1.5 text-[11px] font-black text-brand-navy">
                            <Clock className="w-3.5 h-3.5 text-brand-green shrink-0" />
                            <span>{formatOrderDateTime(order.createdAt, order.date).display}</span>
                          </div>
                          {order.deliveryTimeSlot && (
                            <span className="inline-block mt-1 bg-[#EBF4E0] text-brand-green text-[9px] font-black px-2 py-0.5 rounded-full">
                              🕒 Slot: {order.deliveryTimeSlot} Preferred
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Customer & Destination Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Recipient */}
                        <div className="bg-[#FAF9F6] p-3 rounded-2xl border border-slate-100">
                          <div className="flex items-center justify-between mb-1.5">
                            <p className="text-[9px] font-black text-brand-navy/30 uppercase tracking-widest">RECIPIENT CUSTOMER</p>
                            {stats.isReOrdered && (
                              <span className="text-[8px] font-black text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded uppercase">
                                🔁 Re-ordered Customer
                              </span>
                            )}
                          </div>
                          <p className="font-black text-brand-navy flex items-center gap-1.5 text-xs">
                            <User className="w-3.5 h-3.5 text-brand-green shrink-0" />
                            <span>{order.customerName}</span>
                          </p>
                          <div className="text-[10px] text-brand-navy/60 font-mono mt-1 flex items-center justify-between gap-1">
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{order.customerPhone || "N/A"}</span>
                            </span>
                            {stats.isReOrdered && (
                              <span className="text-[9px] font-bold text-amber-700">
                                {stats.totalOrders} total orders
                              </span>
                            )}
                          </div>
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
                  );
                })}
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
                {groupedSubscriptionsList.map(({ phone, customerName, subs, stats }) => (
                  <div key={phone} className="bg-white rounded-3xl border border-slate-200/60 p-5 shadow-xs flex flex-col gap-4">
                    
                    {/* Customer Identity Section (Member name & phone) */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">MEMBER:</span>
                        <h4 className="font-black text-brand-navy text-sm leading-none">{customerName}</h4>
                        <span className="text-[10px] text-slate-400 font-mono font-bold">({phone})</span>
                        {stats.isReOrdered && (
                          <span className="bg-amber-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase flex items-center gap-1 shadow-xs">
                            <Repeat className="w-2.5 h-2.5" /> Re-ordered ({stats.totalOrders}x Orders)
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {stats.isReOrdered && (
                          <span className="text-[9px] bg-amber-100 text-amber-800 font-extrabold px-2 py-0.5 rounded-md uppercase">
                            Repeat Customer
                          </span>
                        )}
                        <span className="text-[9px] bg-brand-green/10 text-brand-green font-black px-2 py-0.5 rounded-full uppercase">
                          {subs.length} Active {subs.length === 1 ? 'Plan' : 'Plans'}
                        </span>
                      </div>
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
                            <div className="flex items-center justify-between flex-wrap gap-2">
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
                                {stats.isReOrdered && (
                                  <span className="text-[8px] bg-amber-50 text-amber-700 font-black px-1.5 py-0.5 rounded border border-amber-200 uppercase">
                                    🔁 Re-order
                                  </span>
                                )}
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

                            {/* Ends Date / Order Date Indicator */}
                            <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex-wrap gap-2">
                              <span className="flex items-center gap-1 font-mono text-brand-navy">
                                <Clock className="w-3 h-3 text-indigo-500 shrink-0" />
                                <span>Ordered: {formatOrderDateTime(sub.createdAt || sub.startDate, sub.date || sub.startDate).display}</span>
                              </span>
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

          {activeTab === "total" && (
            /* COLUMN 3: TOTAL CONSOLIDATED ORDERS (PER DAY 24H & THIS MONTH) */
            <div className="space-y-5">
              
              {/* Header Banner */}
              <div className="flex items-center justify-between bg-brand-navy text-white px-5 py-4 rounded-3xl shadow-sm">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm tracking-tight">Total Orders & Period Reports</h3>
                    <p className="text-[9px] text-white/50 font-bold uppercase tracking-wider">
                      Consolidated single meals & gym subscriptions with daily & monthly logs
                    </p>
                  </div>
                </div>
                <span className="bg-amber-500 text-white text-[11px] font-black px-3 py-1 rounded-full shadow-xs uppercase tracking-tight">
                  {filteredUnifiedOrders.length} {filteredUnifiedOrders.length === 1 ? 'ORDER' : 'ORDERS'}
                </span>
              </div>

              {/* Top Analytics / Summary Metric Cards (Per Day 24h & This Month & All Time) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                
                {/* 1. Per Day (Last 24 Hours) Card */}
                <button
                  type="button"
                  onClick={() => setTimeFilter("24h")}
                  className={`p-4 rounded-3xl text-left transition-all border cursor-pointer ${
                    timeFilter === "24h"
                      ? "bg-amber-500 text-white border-amber-600 shadow-md ring-2 ring-amber-400/50 scale-[1.01]"
                      : "bg-white text-brand-navy border-slate-200/70 hover:border-amber-400/50 hover:bg-amber-50/20 shadow-xs"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[9px] font-black tracking-widest uppercase flex items-center gap-1 ${
                      timeFilter === "24h" ? "text-amber-100" : "text-amber-600"
                    }`}>
                      <Clock className="w-3 h-3" /> PER DAY (24 HOURS)
                    </span>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                      timeFilter === "24h" ? "bg-white/20 text-white" : "bg-amber-100 text-amber-800"
                    }`}>
                      {stats24h.totalCount} Orders
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between mt-1">
                    <p className="text-2xl font-black tracking-tight leading-none">{stats24h.totalCount}</p>
                    <p className={`text-base font-black ${timeFilter === "24h" ? "text-white" : "text-brand-green"}`}>
                      ₹{stats24h.revenue.toLocaleString("en-IN")}
                    </p>
                  </div>
                  <p className={`text-[10px] font-semibold mt-2 ${timeFilter === "24h" ? "text-white/80" : "text-slate-400"}`}>
                    📦 {stats24h.singleCount} Single • ⚡ {stats24h.subCount} Subscriptions
                  </p>
                  <div className={`mt-2 pt-2 border-t text-[9px] font-bold flex items-center justify-between ${
                    timeFilter === "24h" ? "border-white/20 text-amber-100" : "border-slate-100 text-slate-400"
                  }`}>
                    <span>{timeFilter === "24h" ? "✓ Currently Viewing" : "Click to view 24h orders"}</span>
                    <span>→</span>
                  </div>
                </button>

                {/* 2. This Month Card */}
                <button
                  type="button"
                  onClick={() => setTimeFilter("month")}
                  className={`p-4 rounded-3xl text-left transition-all border cursor-pointer ${
                    timeFilter === "month"
                      ? "bg-brand-navy text-white border-brand-navy shadow-md ring-2 ring-brand-navy/30 scale-[1.01]"
                      : "bg-white text-brand-navy border-slate-200/70 hover:border-brand-navy/30 hover:bg-slate-50 shadow-xs"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[9px] font-black tracking-widest uppercase flex items-center gap-1 ${
                      timeFilter === "month" ? "text-brand-green" : "text-brand-navy/60"
                    }`}>
                      <CalendarDays className="w-3 h-3" /> THIS MONTH
                    </span>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                      timeFilter === "month" ? "bg-white/10 text-white" : "bg-slate-100 text-brand-navy/70"
                    }`}>
                      {statsMonth.monthName}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between mt-1">
                    <p className="text-2xl font-black tracking-tight leading-none">{statsMonth.totalCount}</p>
                    <p className={`text-base font-black ${timeFilter === "month" ? "text-brand-green" : "text-brand-navy"}`}>
                      ₹{statsMonth.revenue.toLocaleString("en-IN")}
                    </p>
                  </div>
                  <p className={`text-[10px] font-semibold mt-2 ${timeFilter === "month" ? "text-white/80" : "text-slate-400"}`}>
                    📦 {statsMonth.singleCount} Single • ⚡ {statsMonth.subCount} Subscriptions
                  </p>
                  <div className={`mt-2 pt-2 border-t text-[9px] font-bold flex items-center justify-between ${
                    timeFilter === "month" ? "border-white/10 text-brand-green" : "border-slate-100 text-slate-400"
                  }`}>
                    <span>{timeFilter === "month" ? "✓ Currently Viewing" : "Click to view month orders"}</span>
                    <span>→</span>
                  </div>
                </button>

                {/* 3. All Time Total Card */}
                <button
                  type="button"
                  onClick={() => setTimeFilter("all")}
                  className={`p-4 rounded-3xl text-left transition-all border cursor-pointer ${
                    timeFilter === "all"
                      ? "bg-[#6B9E35] text-white border-[#59832B] shadow-md ring-2 ring-[#6B9E35]/40 scale-[1.01]"
                      : "bg-white text-brand-navy border-slate-200/70 hover:border-brand-green/40 hover:bg-[#EBF4E0]/20 shadow-xs"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[9px] font-black tracking-widest uppercase flex items-center gap-1 ${
                      timeFilter === "all" ? "text-white" : "text-brand-green"
                    }`}>
                      <Layers className="w-3 h-3" /> ALL TIME TOTAL
                    </span>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                      timeFilter === "all" ? "bg-white/20 text-white" : "bg-[#EBF4E0] text-brand-green"
                    }`}>
                      Lifetime
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between mt-1">
                    <p className="text-2xl font-black tracking-tight leading-none">{statsAll.totalCount}</p>
                    <p className={`text-base font-black ${timeFilter === "all" ? "text-white" : "text-brand-green"}`}>
                      ₹{statsAll.revenue.toLocaleString("en-IN")}
                    </p>
                  </div>
                  <p className={`text-[10px] font-semibold mt-2 ${timeFilter === "all" ? "text-white/80" : "text-slate-400"}`}>
                    📦 {statsAll.singleCount} Single • ⚡ {statsAll.subCount} Subscriptions
                  </p>
                  <div className={`mt-2 pt-2 border-t text-[9px] font-bold flex items-center justify-between ${
                    timeFilter === "all" ? "border-white/20 text-white" : "border-slate-100 text-slate-400"
                  }`}>
                    <span>{timeFilter === "all" ? "✓ Currently Viewing" : "Click to view all orders"}</span>
                    <span>→</span>
                  </div>
                </button>

              </div>

              {/* Sub-Filters & Controls Toolbar */}
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200/70 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                
                {/* Time Range Selector */}
                <div className="flex items-center gap-1.5 p-1 bg-[#FAF9F6] border border-slate-200/60 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setTimeFilter("24h")}
                    className={`py-1.5 px-3 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                      timeFilter === "24h"
                        ? "bg-amber-500 text-white shadow-xs"
                        : "text-brand-navy/60 hover:bg-slate-200/60"
                    }`}
                  >
                    <span>⏱️ Per Day (24h)</span>
                    <span className={`text-[9px] px-1.5 py-0.2 rounded-full ${timeFilter === "24h" ? "bg-white/20 text-white" : "bg-slate-200 text-brand-navy/60"}`}>
                      {stats24h.totalCount}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTimeFilter("month")}
                    className={`py-1.5 px-3 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                      timeFilter === "month"
                        ? "bg-brand-navy text-white shadow-xs"
                        : "text-brand-navy/60 hover:bg-slate-200/60"
                    }`}
                  >
                    <span>📅 This Month</span>
                    <span className={`text-[9px] px-1.5 py-0.2 rounded-full ${timeFilter === "month" ? "bg-brand-green text-white" : "bg-slate-200 text-brand-navy/60"}`}>
                      {statsMonth.totalCount}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTimeFilter("all")}
                    className={`py-1.5 px-3 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                      timeFilter === "all"
                        ? "bg-brand-green text-white shadow-xs"
                        : "text-brand-navy/60 hover:bg-slate-200/60"
                    }`}
                  >
                    <span>🌐 All Orders</span>
                    <span className={`text-[9px] px-1.5 py-0.2 rounded-full ${timeFilter === "all" ? "bg-white/20 text-white" : "bg-slate-200 text-brand-navy/60"}`}>
                      {statsAll.totalCount}
                    </span>
                  </button>
                </div>

                {/* Type Selector (All vs Single vs Subscriptions) */}
                <div className="flex items-center gap-1 text-[10px] font-black">
                  <span className="text-slate-400 uppercase text-[9px] mr-1 hidden sm:inline">TYPE:</span>
                  <button
                    type="button"
                    onClick={() => setTypeFilter("all")}
                    className={`py-1.5 px-2.5 rounded-lg transition-all cursor-pointer ${
                      typeFilter === "all"
                        ? "bg-brand-navy text-white"
                        : "bg-slate-100 text-brand-navy/60 hover:bg-slate-200"
                    }`}
                  >
                    All Types
                  </button>
                  <button
                    type="button"
                    onClick={() => setTypeFilter("single")}
                    className={`py-1.5 px-2.5 rounded-lg transition-all cursor-pointer ${
                      typeFilter === "single"
                        ? "bg-brand-green text-white"
                        : "bg-slate-100 text-brand-navy/60 hover:bg-slate-200"
                    }`}
                  >
                    📦 Single
                  </button>
                  <button
                    type="button"
                    onClick={() => setTypeFilter("subscription")}
                    className={`py-1.5 px-2.5 rounded-lg transition-all cursor-pointer ${
                      typeFilter === "subscription"
                        ? "bg-brand-green text-white"
                        : "bg-slate-100 text-brand-navy/60 hover:bg-slate-200"
                    }`}
                  >
                    ⚡ Subscriptions
                  </button>
                </div>

              </div>

              {/* Feed of Unified Orders */}
              {filteredUnifiedOrders.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/60 shadow-xs text-slate-400 font-bold space-y-2">
                  <p className="text-base font-black text-brand-navy">No orders found in this view.</p>
                  <p className="text-xs text-slate-400 font-medium">
                    {timeFilter === "24h"
                      ? "No orders were placed in the last 24 hours."
                      : timeFilter === "month"
                      ? `No orders placed during ${statsMonth.monthName}.`
                      : "No orders found matching your search filter."}
                  </p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[750px] overflow-y-auto pr-1">
                  {filteredUnifiedOrders.map((unifiedOrder) => {
                    const stats = getCustomerStats(unifiedOrder.customerPhone);
                    const isSingle = unifiedOrder.type === "single";

                    return (
                      <div
                        key={`${unifiedOrder.type}-${unifiedOrder.id}`}
                        className="bg-white rounded-3xl border border-slate-200/70 p-5 shadow-xs hover:border-brand-green/30 transition-all flex flex-col gap-4"
                      >
                        {/* Header: Type Tag, Order ID, Date & Re-order Tag */}
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`inline-flex items-center gap-1 text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-tight ${
                              isSingle
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                : "bg-indigo-100 text-indigo-800 border border-indigo-200"
                            }`}>
                              {isSingle ? "📦 SINGLE MEAL" : "⚡ GYM SUBSCRIPTION (26-DAY)"}
                            </span>
                            <span className="font-black text-brand-navy text-xs font-mono">{unifiedOrder.id}</span>
                            {stats.isReOrdered && (
                              <span className="inline-flex items-center gap-1 bg-amber-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-xs uppercase tracking-tight">
                                <Repeat className="w-2.5 h-2.5" /> Re-ordered ({stats.totalOrders}x Orders)
                              </span>
                            )}
                          </div>

                          <div className="text-right flex items-center gap-1.5">
                            {unifiedOrder.is24h && (
                              <span className="bg-amber-100 text-amber-800 text-[8.5px] font-black px-1.5 py-0.5 rounded uppercase">
                                ⏱️ In 24h
                              </span>
                            )}
                            <span className="text-[10px] text-slate-400 font-bold">{unifiedOrder.dateStr}</span>
                          </div>
                        </div>

                        {/* Recipient Customer & Gym Destination */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Recipient */}
                          <div className="bg-[#FAF9F6] p-3 rounded-2xl border border-slate-100">
                            <div className="flex items-center justify-between mb-1.5">
                              <p className="text-[9px] font-black text-brand-navy/30 uppercase tracking-widest">RECIPIENT CUSTOMER</p>
                              {stats.isReOrdered && (
                                <span className="text-[8px] font-black text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded uppercase">
                                  🔁 Repeat Buyer
                                </span>
                              )}
                            </div>
                            <p className="font-black text-brand-navy flex items-center gap-1.5 text-xs">
                              <User className="w-3.5 h-3.5 text-brand-green shrink-0" />
                              <span>{unifiedOrder.customerName}</span>
                            </p>
                            <div className="text-[10px] text-brand-navy/60 font-mono mt-1 flex items-center justify-between gap-1">
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                                <span>{unifiedOrder.customerPhone || "N/A"}</span>
                              </span>
                              <span className="text-[9px] font-bold text-slate-400">
                                {stats.totalOrders} lifetime {stats.totalOrders === 1 ? 'order' : 'orders'}
                              </span>
                            </div>
                          </div>

                          {/* Gym Destination */}
                          <div className="bg-[#EBF4E0]/60 p-3 rounded-2xl border border-brand-green/10">
                            <div className="flex items-center justify-between mb-1.5">
                              <p className="text-[9px] font-black text-brand-green uppercase tracking-widest">DESTINATION PARTNER GYM</p>
                              {unifiedOrder.deliveryTimeSlot && (
                                <span className="text-[9px] bg-white text-brand-navy/70 font-bold px-1.5 py-0.2 rounded border border-brand-green/20">
                                  🕒 {unifiedOrder.deliveryTimeSlot}
                                </span>
                              )}
                            </div>
                            {unifiedOrder.gymName ? (
                              <>
                                <p className="font-black text-brand-navy text-xs flex items-center gap-1 truncate">
                                  <span>🏋️</span> {unifiedOrder.gymName}
                                </p>
                                <p className="text-[10px] text-brand-navy/60 font-medium mt-0.5 leading-tight truncate">
                                  📍 {unifiedOrder.gymLocation}
                                </p>
                              </>
                            ) : (
                              <p className="text-slate-400 font-bold italic text-xs">Direct/No Gym Assigned</p>
                            )}
                          </div>
                        </div>

                        {/* Order Content Checklist / Plan Details */}
                        <div className="bg-[#0F1E36]/5 p-3.5 rounded-2xl">
                          <p className="text-[9px] font-black text-brand-navy/30 uppercase tracking-widest mb-2">
                            {isSingle ? "ORDERED MEALS CHECKLIST" : "26-DAY SUBSCRIPTION PLAN DETAILS"}
                          </p>
                          
                          {isSingle && unifiedOrder.singleOrder ? (
                            <div className="space-y-1.5">
                              {unifiedOrder.singleOrder.items.map((item, idx) => (
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
                          ) : (
                            <div className="flex justify-between items-center text-xs">
                              <p className="font-black text-brand-navy flex items-center gap-1.5">
                                <span className="text-brand-green font-black">⚡ 1x</span>
                                <span>{unifiedOrder.summaryTitle}</span>
                              </p>
                              <span className="text-[10px] bg-white text-slate-500 font-bold px-2 py-0.5 rounded border border-slate-100">
                                26 Days Plan
                              </span>
                            </div>
                          )}

                          <div className="flex justify-between items-center border-t border-slate-200/50 mt-3 pt-2">
                            <span className="text-[10px] font-black uppercase text-brand-navy/40">TOTAL BILL PAID</span>
                            <span className="font-black text-sm text-brand-green">₹{unifiedOrder.amount}</span>
                          </div>
                        </div>

                        {/* Status Row & Live Control Actions */}
                        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                          <div>
                            <p className="text-[8px] font-black text-brand-navy/40 uppercase tracking-widest">ORDER FULFILLMENT STATE</p>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                unifiedOrder.status === "cooking"
                                  ? "bg-amber-100 text-amber-700"
                                  : unifiedOrder.status === "out_for_delivery"
                                  ? "bg-blue-100 text-blue-700"
                                  : unifiedOrder.status === "delivered" || unifiedOrder.status === "completed"
                                  ? "bg-[#EBF4E0] text-brand-green"
                                  : "bg-slate-200 text-slate-700"
                              }`}>
                                {unifiedOrder.status === "cooking" && <Clock className="w-3 h-3 animate-spin-slow" />}
                                {unifiedOrder.status === "out_for_delivery" && <Truck className="w-3.5 h-3.5 animate-bounce-slow" />}
                                {(unifiedOrder.status === "delivered" || unifiedOrder.status === "completed") && <CheckCircle className="w-3 h-3" />}
                                <span>
                                  {unifiedOrder.status === "cooking"
                                    ? "Cooking"
                                    : unifiedOrder.status === "out_for_delivery"
                                    ? "On the Way"
                                    : unifiedOrder.status === "delivered"
                                    ? "Complete"
                                    : unifiedOrder.status === "completed"
                                    ? "Plan Completed"
                                    : unifiedOrder.status === "active"
                                    ? "Active Subscription"
                                    : "Active"}
                                </span>
                              </span>
                            </div>
                          </div>

                          {/* Action controls if single order */}
                          {isSingle && unifiedOrder.singleOrder ? (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleUpdateOrderStatus(unifiedOrder.id, "cooking")}
                                disabled={unifiedOrder.status === "cooking"}
                                className={`flex-1 sm:flex-none py-2 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                                  unifiedOrder.status === "cooking"
                                    ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                                    : "bg-amber-500 hover:bg-amber-600 text-white shadow-xs active:scale-95"
                                }`}
                              >
                                Cooking
                              </button>

                              <button
                                onClick={() => handleUpdateOrderStatus(unifiedOrder.id, "out_for_delivery")}
                                disabled={unifiedOrder.status === "out_for_delivery"}
                                className={`flex-1 sm:flex-none py-2 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                                  unifiedOrder.status === "out_for_delivery"
                                    ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                                    : "bg-blue-500 hover:bg-blue-600 text-white shadow-xs active:scale-95"
                                }`}
                              >
                                On the Way
                              </button>

                              <button
                                onClick={() => handleUpdateOrderStatus(unifiedOrder.id, "delivered")}
                                disabled={unifiedOrder.status === "delivered"}
                                className={`flex-1 sm:flex-none py-2 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                                  unifiedOrder.status === "delivered"
                                    ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                                    : "bg-brand-green hover:bg-brand-green/90 text-white shadow-xs active:scale-95"
                                }`}
                              >
                                Complete
                              </button>
                            </div>
                          ) : unifiedOrder.subscription ? (
                            <div className="flex items-center gap-1.5">
                              {unifiedOrder.status !== "completed" && (
                                <button
                                  onClick={() => handleUpdateSubscriptionStatus(unifiedOrder.id, "completed")}
                                  className="py-2 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer bg-[#6B9E35] hover:bg-[#59832B] text-white shadow-xs active:scale-95 flex items-center gap-1"
                                >
                                  <Check className="w-3 h-3" />
                                  <span>Complete Plan</span>
                                </button>
                              )}
                            </div>
                          ) : null}

                        </div>

                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          )}

        </div>

      </main>

      {/* LEFT-SIDE LIVE ORDER INCOMING POPUP ALERTS (ACTIVE FOR 1 MINUTE / 60s) */}
      {activeAlerts.length > 0 && (
        <div className="fixed bottom-6 left-6 z-50 flex flex-col-reverse gap-3 max-w-sm w-[calc(100vw-3rem)] pointer-events-auto">
          {activeAlerts.map((alert) => {
            const isSingle = alert.category === "single";
            const secondsLeft = Math.max(0, Math.ceil((alert.expiresAt - now) / 1000));
            const progressPercent = Math.min(100, Math.max(0, (secondsLeft / 60) * 100));

            return (
              <div
                key={alert.id}
                className={`rounded-3xl p-4 shadow-2xl border transition-all animate-in slide-in-from-left duration-300 backdrop-blur-md ${
                  isSingle
                    ? "bg-white/95 border-emerald-400 text-brand-navy shadow-emerald-950/15 ring-2 ring-emerald-500/30"
                    : "bg-white/95 border-indigo-400 text-brand-navy shadow-indigo-950/15 ring-2 ring-indigo-500/30"
                }`}
              >
                {/* Header Row: Category Badge, Audio Ping Icon, 1-Min Timer and Close Button */}
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="p-1.5 rounded-lg bg-amber-500 text-white animate-bounce-slow">
                      <Bell className="w-3.5 h-3.5" />
                    </span>
                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                      isSingle
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        : "bg-indigo-100 text-indigo-800 border border-indigo-200"
                    }`}>
                      {isSingle ? "📦 SINGLE MEAL ORDER" : "⚡ GYM SUBSCRIPTION ORDER"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3" /> {secondsLeft}s
                    </span>
                    <button
                      onClick={() => dismissAlert(alert.id)}
                      className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                      title="Close notification"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Content: Meal / Plan title, Amount, Customer & Gym */}
                <div className="mt-3 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-black text-brand-navy leading-tight">
                        {alert.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-[10px] font-mono font-bold text-slate-400">
                          ID: {alert.id}
                        </span>
                        <span className="text-[10px] font-mono font-black text-brand-green bg-[#EBF4E0] px-1.5 py-0.2 rounded flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" /> {alert.timeStr}
                        </span>
                      </div>
                    </div>
                    <span className="text-sm font-black text-brand-green shrink-0">
                      ₹{alert.amount}
                    </span>
                  </div>

                  {/* Customer details */}
                  <div className="bg-[#FAF9F6] p-2 rounded-xl text-[11px] font-bold text-brand-navy/80 flex items-center justify-between border border-slate-100">
                    <span className="flex items-center gap-1 truncate">
                      <User className="w-3 h-3 text-brand-green shrink-0" />
                      <span className="truncate">{alert.customerName}</span>
                    </span>
                    {alert.customerPhone && (
                      <span className="text-[10px] text-slate-500 font-mono flex items-center gap-0.5 shrink-0">
                        <Phone className="w-2.5 h-2.5" /> {alert.customerPhone}
                      </span>
                    )}
                  </div>

                  {/* Destination Gym if present */}
                  {alert.gymName && (
                    <p className="text-[10px] font-semibold text-brand-navy/60 flex items-center gap-1 bg-[#EBF4E0]/50 px-2 py-1 rounded-lg border border-brand-green/20">
                      <span>🏋️</span>
                      <span className="truncate">{alert.gymName}</span>
                    </p>
                  )}
                </div>

                {/* Quick Action Button to switch tabs and view details immediately */}
                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      if (isSingle) {
                        setActiveTab("single");
                      } else {
                        setActiveTab("plan");
                      }
                      dismissAlert(alert.id);
                    }}
                    className={`text-[10px] font-black uppercase tracking-wider py-1.5 px-3 rounded-xl transition-all flex items-center gap-1 cursor-pointer ${
                      isSingle
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                        : "bg-indigo-600 hover:bg-indigo-700 text-white"
                    }`}
                  >
                    <span>View in {isSingle ? "Single Orders" : "Subscriptions"}</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </button>

                  <span className="text-[9px] font-bold text-slate-400">
                    Auto closes in {secondsLeft}s
                  </span>
                </div>

                {/* 60-Second Auto-dismiss Progress Bar */}
                <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden mt-2.5">
                  <div 
                    className={`h-full transition-all duration-1000 ${
                      isSingle ? "bg-emerald-500" : "bg-indigo-500"
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
