import React, { useState, useEffect, useMemo, useRef } from "react";
import { 
  ShieldCheck, 
  Lock, 
  ShoppingBag, 
  Repeat, 
  Clock, 
  User, 
  Phone, 
  CheckCircle, 
  Truck, 
  LogOut, 
  RefreshCw,
  Search,
  Calendar,
  Check,
  CalendarDays,
  ArrowUpRight,
  Filter,
  Layers,
  Volume2,
  VolumeX,
  Bell,
  X,
  Trash2,
  RotateCcw,
  Sparkles,
  Power,
  Dumbbell,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Bike,
  ChefHat
} from "lucide-react";
import { Order, ActiveSubscription, DeletedSubscription } from "../types";
import { PRODUCTS, GYMS } from "../data";
import { apiFetch } from "../utils/api";
import { playOrderAlertSound, playSubscriptionAlertSound, playKitchenOpeningAlertSound, initAudioUnlock } from "../utils/audio";
import { calculateMealsRemaining } from "../utils/deliverySlots";
import { setLocalKitchenStatus } from "../utils/storeHours";

interface NewOrderNotification {
  id: string;
  category: "single" | "subscription" | "preorder";
  isPreOrder?: boolean;
  title: string;
  customerName: string;
  customerPhone: string;
  gymName?: string;
  amount: number;
  timeStr: string;
  dateStr: string;
  deliverySlot?: string;
  createdAt: number;
  expiresAt: number; // 15 seconds (15,000 ms)
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

interface AdminPanelProps {
  onBackToApp: () => void;
}

export default function AdminPanel({ onBackToApp }: AdminPanelProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<"single" | "plan" | "gym" | "total">("single");
  const [singleOrderSubTab, setSingleOrderSubTab] = useState<"all" | "past" | "declined">("all");
  const [subscriptionSubTab, setSubscriptionSubTab] = useState<"current" | "past" | "declined">("current");
  const [timeFilter, setTimeFilter] = useState<"24h" | "month" | "all">("24h");
  const [typeFilter, setTypeFilter] = useState<"all" | "single" | "subscription">("all");

  // Past Orders Filters (Daily, Weekly, Monthly with all 12 months)
  const [pastFilterType, setPastFilterType] = useState<"all" | "daily" | "weekly" | "monthly">("all");
  const [selectedDailyMode, setSelectedDailyMode] = useState<"today" | "yesterday" | "custom">("today");
  const [customDailyDate, setCustomDailyDate] = useState<string>(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [selectedWeeklyRange, setSelectedWeeklyRange] = useState<"this_week" | "last_week" | "past_14d">("this_week");
  const [selectedMonth, setSelectedMonth] = useState<number>(() => new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(() => new Date().getFullYear());

  // Past Subscriptions Filters (Daily, Weekly, Monthly with all 12 months)
  const [subPastFilterType, setSubPastFilterType] = useState<"all" | "daily" | "weekly" | "monthly">("monthly");
  const [subSelectedDailyMode, setSubSelectedDailyMode] = useState<"today" | "yesterday" | "custom">("today");
  const [subCustomDailyDate, setSubCustomDailyDate] = useState<string>(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [subSelectedWeeklyRange, setSubSelectedWeeklyRange] = useState<"this_week" | "last_week" | "past_14d">("this_week");
  const [subSelectedMonth, setSubSelectedMonth] = useState<number>(() => new Date().getMonth());
  const [subSelectedYear, setSubSelectedYear] = useState<number>(() => new Date().getFullYear());

  // Gym Orders Filters (Daily, Weekly, Monthly with all 12 months, and Gym selector)
  const [selectedGymFilter, setSelectedGymFilter] = useState<string>("all");
  const [gymOrderTypeFilter, setGymOrderTypeFilter] = useState<"all" | "single" | "subscription">("all");
  const [gymPastFilterType, setGymPastFilterType] = useState<"all" | "daily" | "weekly" | "monthly">("all");
  const [gymSelectedDailyMode, setGymSelectedDailyMode] = useState<"today" | "yesterday" | "custom">("today");
  const [gymCustomDailyDate, setGymCustomDailyDate] = useState<string>(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [gymSelectedWeeklyRange, setGymSelectedWeeklyRange] = useState<"this_week" | "last_week" | "past_14d">("this_week");
  const [gymSelectedMonth, setGymSelectedMonth] = useState<number>(() => new Date().getMonth());
  const [gymSelectedYear, setGymSelectedYear] = useState<number>(() => new Date().getFullYear());

  // Sound toggle & 15-sec notifications state
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [activeAlerts, setActiveAlerts] = useState<NewOrderNotification[]>([]);
  const [now, setNow] = useState(Date.now());

  // Kitchen live status state
  const [isKitchenLive, setIsKitchenLive] = useState<boolean>(true);
  const [isTogglingKitchen, setIsTogglingKitchen] = useState<boolean>(false);

  // 30-Second Kitchen Opening Alert state (6:00 AM & 6:00 PM session open)
  const [kitchenOpeningAlert, setKitchenOpeningAlert] = useState<{
    session: 'Morning' | 'Evening';
    timeStr: string;
    message: string;
    expiresAt: number;
  } | null>(null);

  // Gym horizontal scroll ref (shows 2 cards at a time, scrollable on cursor hover/wheel)
  const gymScrollRef = useRef<HTMLDivElement>(null);
  const scrollGyms = (direction: "left" | "right") => {
    if (gymScrollRef.current) {
      const cardWidth = gymScrollRef.current.clientWidth / 2;
      gymScrollRef.current.scrollBy({ left: direction === "left" ? -cardWidth * 2 : cardWidth * 2, behavior: "smooth" });
    }
  };
  const [openingAlertSecondsLeft, setOpeningAlertSecondsLeft] = useState<number>(30);
  const lastOpeningAlertKeyRef = useRef<string>("");

  // Server data states
  const [orders, setOrders] = useState<Order[]>([]);
  const [subscriptions, setSubscriptions] = useState<ActiveSubscription[]>([]);
  const [deletedSubscriptions, setDeletedSubscriptions] = useState<DeletedSubscription[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Tracking seen orders for audio & popup alerts
  const hasInitializedRef = useRef(false);
  const knownOrderIdsRef = useRef<Set<string>>(new Set());
  const knownSubIdsRef = useRef<Set<string>>(new Set());
  const lastAlertTimestampRef = useRef<Record<string, number>>({});

  // Countdown effect for 30-second Kitchen Opening Alert
  useEffect(() => {
    if (!kitchenOpeningAlert) return;
    const remaining = Math.max(0, kitchenOpeningAlert.expiresAt - Date.now());
    setOpeningAlertSecondsLeft(Math.ceil(remaining / 1000));

    const countdownInterval = setInterval(() => {
      const left = Math.max(0, kitchenOpeningAlert.expiresAt - Date.now());
      const sec = Math.ceil(left / 1000);
      setOpeningAlertSecondsLeft(sec);
      if (left <= 0) {
        setKitchenOpeningAlert(null);
      }
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, [kitchenOpeningAlert]);

  // Check for Kitchen Opening Time (6:00 AM & 6:00 PM) every 5 seconds
  useEffect(() => {
    const checkOpeningSession = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const todayDateStr = now.toISOString().split('T')[0];

      // Morning session check: 6:00 AM
      if (hours === 6 && minutes === 0) {
        const sessionKey = `${todayDateStr}-morning`;
        if (lastOpeningAlertKeyRef.current !== sessionKey) {
          lastOpeningAlertKeyRef.current = sessionKey;
          triggerKitchenOpeningAlert("Morning", "6:00 AM");
        }
      }

      // Evening session check: 6:00 PM
      if (hours === 18 && minutes === 0) {
        const sessionKey = `${todayDateStr}-evening`;
        if (lastOpeningAlertKeyRef.current !== sessionKey) {
          lastOpeningAlertKeyRef.current = sessionKey;
          triggerKitchenOpeningAlert("Evening", "6:00 PM");
        }
      }
    };

    checkOpeningSession();
    const timer = setInterval(checkOpeningSession, 5000);
    return () => clearInterval(timer);
  }, [isSoundEnabled]);

  const triggerKitchenOpeningAlert = (session: 'Morning' | 'Evening', timeStr: string) => {
    if (isSoundEnabled) {
      playKitchenOpeningAlertSound();
    }
    const expiresAt = Date.now() + 30000; // 30 seconds duration
    setKitchenOpeningAlert({
      session,
      timeStr,
      message: `Our ${session} Session will open at ${timeStr}! Turn Kitchen ON now to allow customer orders.`,
      expiresAt
    });
  };

  const handleToggleKitchen = async () => {
    initAudioUnlock();
    const nextState = !isKitchenLive;
    setIsKitchenLive(nextState);
    setLocalKitchenStatus(nextState);
    setIsTogglingKitchen(true);

    try {
      const res = await fetch("/api/kitchen/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isLive: nextState, updatedBy: "Admin" })
      });
      if (res.ok) {
        const data = await res.json();
        setIsKitchenLive(data.isLive);
        setLocalKitchenStatus(data.isLive);
        setActionNotice(data.isLive ? "🟢 Kitchen is now LIVE! Customers can place orders." : "🔴 Kitchen turned OFF. Customer ordering paused.");
        setTimeout(() => setActionNotice(null), 3500);
      }
    } catch (e) {
      console.error("Toggle kitchen error:", e);
    } finally {
      setIsTogglingKitchen(false);
    }
  };

  const handleTurnKitchenOn = async () => {
    initAudioUnlock();
    setIsKitchenLive(true);
    setLocalKitchenStatus(true);
    setIsTogglingKitchen(true);

    try {
      const res = await fetch("/api/kitchen/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isLive: true, updatedBy: "Admin" })
      });
      if (res.ok) {
        const data = await res.json();
        setIsKitchenLive(data.isLive);
        setLocalKitchenStatus(data.isLive);
        setActionNotice("🟢 Kitchen is now LIVE! Session orders open.");
        setTimeout(() => setActionNotice(null), 3500);
      }
    } catch (e) {
      console.error("Turn kitchen on error:", e);
    } finally {
      setIsTogglingKitchen(false);
    }
  };

  const testKitchenOpeningAlert = () => {
    initAudioUnlock();
    const nowHours = new Date().getHours();
    const session = nowHours >= 14 ? "Evening" : "Morning";
    const timeStr = session === "Evening" ? "6:00 PM" : "6:00 AM";
    triggerKitchenOpeningAlert(session, timeStr);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const currentNow = Date.now();
      setNow(currentNow);
      setActiveAlerts(prev => prev.filter(alert => alert.expiresAt > currentNow));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Helper to check if an order is a pre-order
  const isPreOrderCheck = (order: Order) => {
    if (order.isPreOrder) return true;
    if (order.orderType === 'preorder') return true;
    const slot = (order.deliveryTimeSlot || '').toLowerCase();
    const sched = (order.scheduledDate || '').toLowerCase();
    return (
      slot.includes('tomorrow') ||
      sched.includes('tomorrow') ||
      slot.includes('pre-order') ||
      sched.includes('pre-order') ||
      slot.includes('7th') ||
      sched.includes('7th') ||
      slot.includes('sep') ||
      sched.includes('sep') ||
      slot.includes('opening') ||
      sched.includes('opening')
    );
  };

  // Helper to accurately format order placement time & date
  const formatOrderDateTime = (createdAt?: string, dateStr?: string) => {
    if (createdAt) {
      const d = new Date(createdAt);
      if (!isNaN(d.getTime())) {
        const time = d.toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: true });
        const date = d.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric" });
        return { time, date, display: `${time}, ${date}` };
      }
    }
    if (dateStr) {
      if (dateStr.includes(",") || dateStr.toLowerCase().includes("am") || dateStr.toLowerCase().includes("pm")) {
        return { time: dateStr.split(",")[0]?.trim() || dateStr, date: dateStr.split(",")[1]?.trim() || "", display: dateStr };
      }
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        const time = d.toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: true });
        const date = d.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric" });
        return { time, date, display: `${time}, ${date}` };
      }
      return { time: dateStr, date: "", display: dateStr };
    }
    return { time: "Just now", date: "", display: "Just now" };
  };

  // Trigger an alert popup and sound effect (15s duration with distinct subscription chime)
  const triggerOrderAlert = (alert: NewOrderNotification) => {
    const alertKey = `${alert.customerPhone || ''}_${alert.category}_${alert.title || ''}`;
    const nowMs = Date.now();
    if (lastAlertTimestampRef.current[alertKey] && (nowMs - lastAlertTimestampRef.current[alertKey] < 15000)) {
      return;
    }
    lastAlertTimestampRef.current[alertKey] = nowMs;

    if (isSoundEnabled) {
      if (alert.category === "subscription") {
        playSubscriptionAlertSound();
      } else {
        playOrderAlertSound();
      }
    }
    setActiveAlerts(prev => [alert, ...prev.filter(a => a.id !== alert.id && !(a.customerPhone === alert.customerPhone && a.category === alert.category))].slice(0, 5));
  };

  const dismissAlert = (alertId: string) => {
    setActiveAlerts(prev => prev.filter(a => a.id !== alertId));
  };

  const toggleSound = () => {
    initAudioUnlock();
    const nextState = !isSoundEnabled;
    setIsSoundEnabled(nextState);
    if (nextState) {
      playOrderAlertSound();
    }
  };

  // Test standard live order sound & 15-second popup
  const testAlertSound = () => {
    initAudioUnlock();
    playOrderAlertSound();
    const nowTime = new Date();
    const formattedTime = nowTime.toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: true });
    const formattedDate = nowTime.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric" });

    const testAlert: NewOrderNotification = {
      id: `TEST-${Date.now().toString().slice(-4)}`,
      category: "single",
      title: "1x High Protein Chicken Rice Bowl",
      customerName: "Chef / Admin Preview",
      customerPhone: "9876543210",
      gymName: "R11 Fitness (Vidya Nagar, Hubballi)",
      amount: 249,
      timeStr: formattedTime,
      dateStr: formattedDate,
      createdAt: Date.now(),
      expiresAt: Date.now() + 15000 // 15 seconds
    };
    setActiveAlerts(prev => [testAlert, ...prev]);
  };

  // Test distinct monthly subscription order sound effect & 15-second popup
  const testSubscriptionAlertSound = () => {
    initAudioUnlock();
    playSubscriptionAlertSound();
    const nowTime = new Date();
    const formattedTime = nowTime.toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: true });
    const formattedDate = nowTime.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric" });

    const testSubAlert: NewOrderNotification = {
      id: `SUB-${Date.now().toString().slice(-4)}`,
      category: "subscription",
      title: "🌟 26-Day Elite Monthly Plan",
      customerName: "Karthik (Subscriber)",
      customerPhone: "9988776655",
      gymName: "R11 Fitness (Vidya Nagar, Hubballi)",
      amount: 3999,
      timeStr: formattedTime,
      dateStr: formattedDate,
      createdAt: Date.now(),
      expiresAt: Date.now() + 15000 // 15 seconds
    };
    setActiveAlerts(prev => [testSubAlert, ...prev]);
  };

  // Fetch all orders, subscriptions & deleted plans from the backend
  const fetchData = async (isBackground = false) => {
    if (!isBackground) setIsLoading(true);
    try {
      const [ordersRes, subsRes, deletedRes, kitchenRes] = await Promise.all([
        apiFetch("/api/orders?admin=true"),
        apiFetch("/api/subscriptions?admin=true"),
        apiFetch("/api/subscriptions/deleted?admin=true"),
        apiFetch("/api/kitchen/status")
      ]);

      if (kitchenRes && kitchenRes.ok && kitchenRes.headers.get('content-type')?.includes('application/json')) {
        const kData = await kitchenRes.json();
        if (kData && typeof kData.isLive === 'boolean') {
          setIsKitchenLive(kData.isLive);
          setLocalKitchenStatus(kData.isLive);
        }
      }

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
      if (deletedRes.ok && deletedRes.headers.get('content-type')?.includes('application/json')) {
        const deletedList: DeletedSubscription[] = await deletedRes.json();
        setDeletedSubscriptions(deletedList);
      }

      // Check for newly arrived orders / subscriptions to trigger sound & 15-second popup
      if (hasInitializedRef.current) {
        // Detect new Single Meal Orders
        newOrdersList.forEach(o => {
          if (!knownOrderIdsRef.current.has(o.id)) {
            knownOrderIdsRef.current.add(o.id);
            const itemsSummary = o.items.map(i => `${i.quantity}x ${i.product.name}`).join(", ");
            const dt = formatOrderDateTime(o.createdAt, o.date);
            const isPreOrder = isPreOrderCheck(o);

            triggerOrderAlert({
              id: o.id,
              category: isPreOrder ? "preorder" : "single",
              isPreOrder,
              title: itemsSummary || (isPreOrder ? "Pre-Order For Tomorrow" : "Single Meal Order"),
              customerName: o.customerName || "Customer",
              customerPhone: o.customerPhone || "",
              gymName: o.gymName,
              deliverySlot: o.deliveryTimeSlot,
              amount: o.total || 0,
              timeStr: dt.time,
              dateStr: dt.date,
              createdAt: Date.now(),
              expiresAt: Date.now() + 15000 // 15 seconds
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
              expiresAt: Date.now() + 15000 // 15 seconds
            });
          }
        });
      } else {
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

  useEffect(() => {
    const handleUserInteraction = () => {
      initAudioUnlock();
    };
    window.addEventListener("click", handleUserInteraction);
    window.addEventListener("keydown", handleUserInteraction);
    return () => {
      window.removeEventListener("click", handleUserInteraction);
      window.removeEventListener("keydown", handleUserInteraction);
    };
  }, []);

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

  const handleUpdateOrderStatus = async (orderId: string, newStatus: "placed" | "accepted" | "cooking" | "declined" | "out_for_delivery" | "delivered") => {
    const nowIso = new Date().toISOString();
    const now = new Date();
    const formattedDeletedDate = now.toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
    const formattedDeletedTime = now.toLocaleTimeString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
    const declinedDateStr = `${formattedDeletedTime}, ${formattedDeletedDate}`;

    if (newStatus === "declined") {
      setActionNotice("Order declined & moved to Declined tab.");
      setTimeout(() => setActionNotice(null), 3500);
    } else if (newStatus === "cooking" || newStatus === "accepted") {
      setActionNotice("Order accepted! Cooking started with 30-min timer.");
      setTimeout(() => setActionNotice(null), 3500);
    } else if (newStatus === "out_for_delivery") {
      setActionNotice("Order status updated: On the Way!");
      setTimeout(() => setActionNotice(null), 3500);
    } else if (newStatus === "delivered") {
      setActionNotice("Order marked as Delivered!");
      setTimeout(() => setActionNotice(null), 3500);
    }

    // Instant optimistic update for Admin UI
    let updatedList: Order[] = [];
    setOrders(prev => {
      updatedList = prev.map(o => o.id === orderId ? {
        ...o,
        status: newStatus,
        declinedDate: newStatus === 'declined' ? (o.declinedDate || declinedDateStr) : o.declinedDate,
        declinedAt: newStatus === 'declined' ? (o.declinedAt || nowIso) : o.declinedAt,
        acceptedAt: (newStatus === 'cooking' || newStatus === 'accepted' || newStatus === 'out_for_delivery') ? (o.acceptedAt || nowIso) : o.acceptedAt,
        deliveredAt: newStatus === 'delivered' ? (o.deliveredAt || nowIso) : o.deliveredAt,
        deliveryTimeRemaining: newStatus === 'delivered' ? 0 : o.deliveryTimeRemaining
      } : o);
      return updatedList;
    });

    try {
      if (updatedList.length > 0) {
        localStorage.setItem('proteino_orders', JSON.stringify(updatedList));
      }
      localStorage.setItem('proteino_order_sync_trigger', Date.now().toString());
      window.dispatchEvent(new CustomEvent('proteino_orders_updated', { 
        detail: { 
          orderId, 
          status: newStatus, 
          declinedAt: newStatus === 'declined' ? nowIso : undefined,
          declinedDate: newStatus === 'declined' ? declinedDateStr : undefined,
          acceptedAt: (newStatus === 'cooking' || newStatus === 'accepted' || newStatus === 'out_for_delivery') ? nowIso : undefined,
          deliveredAt: newStatus === 'delivered' ? nowIso : undefined
        } 
      }));
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('proteino_sync');
        bc.postMessage({ 
          type: 'order_updated', 
          orderId, 
          status: newStatus, 
          declinedAt: newStatus === 'declined' ? nowIso : undefined,
          declinedDate: newStatus === 'declined' ? declinedDateStr : undefined,
          acceptedAt: (newStatus === 'cooking' || newStatus === 'accepted' || newStatus === 'out_for_delivery') ? nowIso : undefined,
          deliveredAt: newStatus === 'delivered' ? nowIso : undefined
        });
        bc.close();
      }
    } catch (e) {}

    try {
      const res = await apiFetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          status: newStatus,
          declinedAt: newStatus === 'declined' ? nowIso : undefined,
          declinedDate: newStatus === 'declined' ? declinedDateStr : undefined,
          acceptedAt: (newStatus === 'cooking' || newStatus === 'accepted' || newStatus === 'out_for_delivery') ? nowIso : undefined,
          deliveredAt: newStatus === 'delivered' ? nowIso : undefined,
          deliveryTimeRemaining: newStatus === 'delivered' ? 0 : undefined
        })
      });
      if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
        const updatedOrder = await res.json();
        setOrders(prev => {
          const next = prev.map(o => o.id === orderId ? updatedOrder : o);
          try {
            localStorage.setItem('proteino_orders', JSON.stringify(next));
          } catch (e) {}
          return next;
        });
        try {
          localStorage.setItem('proteino_order_sync_trigger', Date.now().toString());
          window.dispatchEvent(new CustomEvent('proteino_orders_updated', { detail: { orderId, status: newStatus } }));
          if (typeof BroadcastChannel !== 'undefined') {
            const bc = new BroadcastChannel('proteino_sync');
            bc.postMessage({ type: 'order_updated', orderId, status: newStatus });
            bc.close();
          }
        } catch (e) {}
      }
    } catch (err) {
      console.error("Failed to update order status:", err);
    }
  };

  const handleAdjustSubscriptionMeals = async (subId: string, newDeliveredCount: number) => {
    const sub = subscriptions.find(s => s.id === subId);
    if (!sub) return;
    const totalMeals = sub.durationDays === 78 ? 78 : sub.durationDays === 52 ? 52 : 26;
    const safeCount = Math.max(0, Math.min(totalMeals, newDeliveredCount));
    const newStatus = safeCount >= totalMeals ? "completed" : "active";

    // Optimistic UI update
    setSubscriptions(prev => prev.map(s => s.id === subId ? { ...s, mealsDelivered: safeCount, status: newStatus } : s));

    try {
      const res = await apiFetch(`/api/subscriptions/${subId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mealsDelivered: safeCount, status: newStatus })
      });
      if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
        const updatedSub = await res.json();
        setSubscriptions(prev => prev.map(s => s.id === subId ? updatedSub : s));
      }
    } catch (err) {
      console.error("Failed to adjust subscription meals:", err);
    }
  };

  const handleUpdateSubscriptionStatus = async (subId: string, status: "active" | "completed") => {
    const sub = subscriptions.find(s => s.id === subId);
    const totalMeals = sub?.durationDays === 78 ? 78 : sub?.durationDays === 52 ? 52 : 26;
    const targetMeals = status === "completed" ? totalMeals : (sub?.mealsDelivered || 0);

    // Optimistic UI update
    setSubscriptions(prev => prev.map(s => s.id === subId ? { ...s, status, mealsDelivered: targetMeals } : s));

    try {
      const res = await apiFetch(`/api/subscriptions/${subId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, mealsDelivered: targetMeals })
      });
      if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
        const updatedSub = await res.json();
        setSubscriptions(prev => prev.map(s => s.id === subId ? updatedSub : s));
      }
    } catch (err) {
      console.error("Failed to update subscription status:", err);
    }
  };

  // Delete subscription & move to Deleted Plans list
  const handleDeleteSubscription = async (subId: string) => {
    const sub = subscriptions.find(s => s.id === subId);

    const now = new Date();
    const formattedDeletedDate = now.toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
    const formattedDeletedTime = now.toLocaleTimeString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
    const deletedDateStr = `${formattedDeletedTime}, ${formattedDeletedDate}`;

    const archivedSub: DeletedSubscription = {
      ...(sub || {
        id: subId,
        customerName: "Athlete",
        customerPhone: "",
        planId: "protein-bowl",
        planName: "Gym Plan",
        gymName: "Partner Gym",
        gymLocation: "City",
        price: 349,
        startDate: new Date().toISOString(),
        timeSlot: "Morning",
        status: "active",
        createdAt: new Date().toISOString(),
        date: new Date().toISOString()
      }),
      deletedAt: now.toISOString(),
      deletedDate: deletedDateStr,
      deletedBy: "Admin",
      reason: "Subscription Declined / Deleted by Admin"
    };

    // Optimistic state update in Admin UI
    setSubscriptions(prev => prev.filter(s => s.id !== subId));
    setDeletedSubscriptions(prev => [archivedSub, ...prev.filter(d => d.id !== subId)]);
    setActionNotice("Plan declined & archived in Deleted Plans. Customer notified.");
    setTimeout(() => setActionNotice(null), 4000);

    // Notify customer site immediately via broadcast & localStorage
    try {
      const payload = {
        id: subId,
        planName: sub?.planName || 'Gym High-Protein Plan',
        phone: sub?.customerPhone || '',
        date: deletedDateStr,
        timestamp: Date.now(),
        message: "Your plan was declined. Please order again later."
      };
      localStorage.setItem('proteino_last_declined_sub', JSON.stringify(payload));
      window.dispatchEvent(new CustomEvent('proteino_subscription_declined', { detail: payload }));
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('proteino_sync');
        bc.postMessage({ type: 'subscription_declined', ...payload });
        bc.close();
      }
    } catch (e) {}

    try {
      const res = await apiFetch(`/api/subscriptions/${encodeURIComponent(subId)}`, {
        method: "DELETE"
      });
      if (res.ok) {
        fetchData(true);
      } else {
        fetchData(true);
      }
    } catch (err) {
      console.error("Failed to delete subscription:", err);
      fetchData(true);
    }
  };

  // Restore deleted subscription back to active
  const handleRestoreSubscription = async (subId: string) => {
    try {
      const res = await apiFetch(`/api/subscriptions/deleted/${subId}/restore`, {
        method: "POST"
      });
      if (res.ok) {
        fetchData(true);
        setActionNotice("Subscription plan successfully restored to active!");
        setTimeout(() => setActionNotice(null), 4000);
      }
    } catch (err) {
      console.error("Failed to restore subscription:", err);
    }
  };

  // Permanently purge deleted subscription
  const handlePurgeDeletedSubscription = async (subId: string) => {
    if (!window.confirm("Permanently purge this record from deleted history?")) {
      return;
    }
    try {
      const res = await apiFetch(`/api/subscriptions/deleted/${subId}/purge`, {
        method: "DELETE"
      });
      if (res.ok) {
        setDeletedSubscriptions(prev => prev.filter(d => d.id !== subId));
        setActionNotice("Deleted plan permanently purged.");
        setTimeout(() => setActionNotice(null), 4000);
      }
    } catch (err) {
      console.error("Failed to purge deleted subscription:", err);
    }
  };

  const normalizePhone = (phone?: string) => {
    if (!phone) return "";
    const digits = phone.replace(/\D/g, "");
    if (digits.length >= 10) return digits.slice(-10);
    return digits || phone.trim().toLowerCase();
  };

  const customerStatsByPhone = useMemo(() => {
    const map = new Map<string, { singleCount: number; subCount: number; totalOrders: number; name: string }>();

    orders.forEach(o => {
      const key = normalizePhone(o.customerPhone);
      if (!key) return;
      const existing = map.get(key) || { singleCount: 0, subCount: 0, totalOrders: 0, name: o.customerName || "" };
      existing.singleCount += 1;
      existing.totalOrders += 1;
      if (o.customerName) existing.name = o.customerName;
      map.set(key, existing);
    });

    subscriptions.forEach(s => {
      const key = normalizePhone(s.customerPhone);
      if (!key) return;
      const existing = map.get(key) || { singleCount: 0, subCount: 0, totalOrders: 0, name: s.customerName || "" };
      existing.subCount += 1;
      existing.totalOrders += 1;
      if (s.customerName) existing.name = s.customerName;
      map.set(key, existing);
    });

    return map;
  }, [orders, subscriptions]);

  const getCustomerStats = (phone?: string) => {
    const key = normalizePhone(phone);
    if (!key) return { totalOrders: 1, singleCount: 1, subCount: 0, isReOrdered: false };
    const stats = customerStatsByPhone.get(key);
    if (!stats) return { totalOrders: 1, singleCount: 1, subCount: 0, isReOrdered: false };
    return { ...stats, isReOrdered: stats.totalOrders > 1 };
  };

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

  // Helper date checker for Daily, Weekly, Monthly filtering
  const matchDateFilter = (
    itemDateObj: Date,
    filterMode: "all" | "daily" | "weekly" | "monthly",
    dailyMode: "today" | "yesterday" | "custom",
    customDateStr: string,
    weeklyRange: "this_week" | "last_week" | "past_14d",
    targetMonth: number,
    targetYear: number
  ): boolean => {
    if (filterMode === "all") return true;

    const todayObj = new Date();
    const todayStart = new Date(todayObj.getFullYear(), todayObj.getMonth(), todayObj.getDate()).getTime();
    const itemDayStart = new Date(itemDateObj.getFullYear(), itemDateObj.getMonth(), itemDateObj.getDate()).getTime();
    const oneDayMs = 24 * 60 * 60 * 1000;

    if (filterMode === "daily") {
      if (dailyMode === "today") {
        return itemDayStart === todayStart;
      }
      if (dailyMode === "yesterday") {
        return itemDayStart === (todayStart - oneDayMs);
      }
      if (dailyMode === "custom" && customDateStr) {
        const [cy, cm, cd] = customDateStr.split("-").map(Number);
        return (
          itemDateObj.getFullYear() === cy &&
          itemDateObj.getMonth() === cm - 1 &&
          itemDateObj.getDate() === cd
        );
      }
      return true;
    }

    if (filterMode === "weekly") {
      const daysDiff = (todayStart - itemDayStart) / oneDayMs;
      if (weeklyRange === "this_week") {
        return daysDiff >= 0 && daysDiff <= 7;
      }
      if (weeklyRange === "last_week") {
        return daysDiff > 7 && daysDiff <= 14;
      }
      if (weeklyRange === "past_14d") {
        return daysDiff >= 0 && daysDiff <= 14;
      }
      return true;
    }

    if (filterMode === "monthly") {
      return (
        itemDateObj.getFullYear() === targetYear &&
        itemDateObj.getMonth() === targetMonth
      );
    }

    return true;
  };

  // Filter single meal orders
  const filteredOrders = useMemo(() => {
    return orders.filter(o => 
      o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.customerName && o.customerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (o.customerPhone && o.customerPhone.includes(searchQuery)) ||
      (o.gymName && o.gymName.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [orders, searchQuery]);

  const activeSingleOrders = useMemo(() => {
    return filteredOrders.filter(o => o.status !== 'declined');
  }, [filteredOrders]);

  const currentSingleOrders = useMemo(() => {
    return filteredOrders.filter(o => o.status !== 'delivered' && o.status !== 'declined');
  }, [filteredOrders]);

  const allPastSingleOrders = useMemo(() => {
    return filteredOrders.filter(o => o.status === 'delivered');
  }, [filteredOrders]);

  const deletedSingleOrders = useMemo(() => {
    return filteredOrders.filter(o => o.status === 'declined');
  }, [filteredOrders]);

  // Filtered Past Single Orders based on Daily, Weekly, Monthly filter
  const filteredPastSingleOrders = useMemo(() => {
    return allPastSingleOrders.filter(o => {
      const ts = getOrderTimestamp(o.createdAt, o.date);
      const d = new Date(ts);
      return matchDateFilter(
        d,
        pastFilterType,
        selectedDailyMode,
        customDailyDate,
        selectedWeeklyRange,
        selectedMonth,
        selectedYear
      );
    });
  }, [allPastSingleOrders, pastFilterType, selectedDailyMode, customDailyDate, selectedWeeklyRange, selectedMonth, selectedYear]);

  // Statistics calculation for Past Single Orders
  const pastSingleStats = useMemo(() => {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const oneDayMs = 24 * 60 * 60 * 1000;

    let todayCount = 0;
    let thisWeekCount = 0;
    let thisMonthCount = 0;

    allPastSingleOrders.forEach(o => {
      const ts = getOrderTimestamp(o.createdAt, o.date);
      const d = new Date(ts);
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      const daysDiff = (todayStart - dayStart) / oneDayMs;

      if (dayStart === todayStart) todayCount++;
      if (daysDiff >= 0 && daysDiff <= 7) thisWeekCount++;
      if (d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth()) thisMonthCount++;
    });

    const activeFilteredTotalRevenue = filteredPastSingleOrders.reduce((sum, o) => sum + (o.total || 0), 0);

    return {
      todayCount,
      thisWeekCount,
      thisMonthCount,
      totalPastCount: allPastSingleOrders.length,
      currentFilterCount: filteredPastSingleOrders.length,
      currentFilterRevenue: activeFilteredTotalRevenue
    };
  }, [allPastSingleOrders, filteredPastSingleOrders]);

  // Subscriptions filtering
  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter(sub => 
      sub.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.customerPhone.includes(searchQuery) ||
      sub.gymName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.planName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [subscriptions, searchQuery]);

  const currentSubscriptions = useMemo(() => {
    return filteredSubscriptions.filter(s => s.status !== 'completed');
  }, [filteredSubscriptions]);

  const allPastSubscriptions = useMemo(() => {
    return filteredSubscriptions.filter(s => s.status === 'completed');
  }, [filteredSubscriptions]);

  // Filtered Past Subscriptions based on Daily, Weekly, Monthly filter
  const filteredPastSubscriptions = useMemo(() => {
    return allPastSubscriptions.filter(s => {
      const ts = getOrderTimestamp(s.createdAt || s.startDate, s.date || s.startDate);
      const d = new Date(ts);
      return matchDateFilter(
        d,
        subPastFilterType,
        subSelectedDailyMode,
        subCustomDailyDate,
        subSelectedWeeklyRange,
        subSelectedMonth,
        subSelectedYear
      );
    });
  }, [allPastSubscriptions, subPastFilterType, subSelectedDailyMode, subCustomDailyDate, subSelectedWeeklyRange, subSelectedMonth, subSelectedYear]);

  // Past Subscriptions Stats
  const pastSubStats = useMemo(() => {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const oneDayMs = 24 * 60 * 60 * 1000;

    let todayCount = 0;
    let thisWeekCount = 0;
    let thisMonthCount = 0;

    allPastSubscriptions.forEach(s => {
      const ts = getOrderTimestamp(s.createdAt || s.startDate, s.date || s.startDate);
      const d = new Date(ts);
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      const daysDiff = (todayStart - dayStart) / oneDayMs;

      if (dayStart === todayStart) todayCount++;
      if (daysDiff >= 0 && daysDiff <= 7) thisWeekCount++;
      if (d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth()) thisMonthCount++;
    });

    const activeFilteredTotalRevenue = filteredPastSubscriptions.reduce((sum, s) => sum + (s.price || 0), 0);

    return {
      todayCount,
      thisWeekCount,
      thisMonthCount,
      totalPastCount: allPastSubscriptions.length,
      currentFilterCount: filteredPastSubscriptions.length,
      currentFilterRevenue: activeFilteredTotalRevenue
    };
  }, [allPastSubscriptions, filteredPastSubscriptions]);

  // Filtered Deleted Subscriptions
  const filteredDeletedSubscriptions = useMemo(() => {
    return deletedSubscriptions.filter(d => 
      d.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.customerPhone.includes(searchQuery) ||
      d.gymName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.planName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [deletedSubscriptions, searchQuery]);

  // Group current subscriptions by customer phone
  const groupedCurrentSubsList = useMemo(() => {
    const map = new Map<string, ActiveSubscription[]>();
    currentSubscriptions.forEach(sub => {
      const key = sub.customerPhone || 'unknown';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(sub);
    });
    return Array.from(map.entries()).map(([phone, subs]) => ({
      phone,
      customerName: subs[0].customerName || 'Valued Subscriber',
      subs,
      stats: getCustomerStats(phone)
    }));
  }, [currentSubscriptions]);

  // Group past subscriptions by customer phone
  const groupedPastSubsList = useMemo(() => {
    const map = new Map<string, ActiveSubscription[]>();
    filteredPastSubscriptions.forEach(sub => {
      const key = sub.customerPhone || 'unknown';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(sub);
    });
    return Array.from(map.entries()).map(([phone, subs]) => ({
      phone,
      customerName: subs[0].customerName || 'Valued Subscriber',
      subs,
      stats: getCustomerStats(phone)
    }));
  }, [filteredPastSubscriptions]);

  // Unified Orders List for Total Orders tab
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
      isPreOrder?: boolean;
      itemsCount: number;
      summaryTitle: string;
      singleOrder?: Order;
      subscription?: ActiveSubscription;
    }> = [];

    const nowDate = new Date(now);

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
        isPreOrder: isPreOrderCheck(o),
        itemsCount: o.items.reduce((acc, i) => acc + i.quantity, 0),
        summaryTitle: itemsSummary || 'Custom Meal Order',
        singleOrder: o
      });
    });

    subscriptions.forEach((s, index) => {
      const ts = getOrderTimestamp(s.createdAt || s.startDate, s.date || s.startDate, index * 60000);
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

    return list.sort((a, b) => b.timestamp - a.timestamp);
  }, [orders, subscriptions, now]);

  const stats24h = useMemo(() => {
    const list = unifiedOrdersList.filter(o => o.is24h);
    return {
      totalCount: list.length,
      revenue: list.reduce((acc, o) => acc + o.amount, 0),
      singleCount: list.filter(o => o.type === 'single').length,
      subCount: list.filter(o => o.type === 'subscription').length
    };
  }, [unifiedOrdersList]);

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

  const statsAll = useMemo(() => {
    return {
      totalCount: unifiedOrdersList.length,
      revenue: unifiedOrdersList.reduce((acc, o) => acc + o.amount, 0),
      singleCount: unifiedOrdersList.filter(o => o.type === 'single').length,
      subCount: unifiedOrdersList.filter(o => o.type === 'subscription').length
    };
  }, [unifiedOrdersList]);

  const filteredUnifiedOrders = useMemo(() => {
    return unifiedOrdersList.filter(o => {
      if (timeFilter === '24h' && !o.is24h) return false;
      if (timeFilter === 'month' && !o.isThisMonth) return false;
      if (typeFilter === 'single' && o.type !== 'single') return false;
      if (typeFilter === 'subscription' && o.type !== 'subscription') return false;

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

  // Gym Orders List & Statistics
  const gymOrdersList = useMemo(() => {
    const list: Array<{
      id: string;
      orderType: 'single' | 'subscription';
      dateStr: string;
      timestamp: number;
      customerName: string;
      customerPhone: string;
      gymName: string;
      gymLocation: string;
      deliveryTimeSlot?: string;
      totalPieces: number;
      totalAmount: number;
      status: string;
      itemsList: Array<{ name: string; quantity: number; price: number }>;
      isBulk: boolean;
      singleOrder?: Order;
      subscription?: ActiveSubscription;
    }> = [];

    const resolveValidGymName = (rawName?: string): string => {
      if (!rawName) return GYMS[0].name;
      const direct = GYMS.find(g => g.name === rawName);
      if (direct) return direct.name;
      const match = GYMS.find(g => 
        g.name.toLowerCase().includes(rawName.toLowerCase()) || 
        rawName.toLowerCase().includes(g.name.toLowerCase())
      );
      if (match) return match.name;
      return GYMS[0].name;
    };

    orders.forEach((o, index) => {
      const ts = getOrderTimestamp(o.createdAt, o.date, index * 60000);
      const totalPieces = o.items.reduce((acc, i) => acc + i.quantity, 0);
      const itemsList = o.items.map(i => ({ name: i.product.name, quantity: i.quantity, price: i.product.price }));
      const gymName = resolveValidGymName(o.gymName);
      const gymObj = GYMS.find(g => g.name === gymName) || GYMS[0];
      list.push({
        id: o.id,
        orderType: 'single',
        dateStr: formatOrderDateTime(o.createdAt, o.date).display,
        timestamp: ts,
        customerName: o.customerName || 'Customer',
        customerPhone: o.customerPhone || '',
        gymName: gymName,
        gymLocation: gymObj.location,
        deliveryTimeSlot: o.deliveryTimeSlot || 'Live Kitchen Delivery',
        totalPieces,
        totalAmount: o.total || 0,
        status: o.status,
        itemsList,
        isBulk: totalPieces >= 10,
        singleOrder: o
      });
    });

    subscriptions.forEach((s, index) => {
      const ts = getOrderTimestamp(s.createdAt || s.startDate, s.date || s.startDate, index * 60000);
      const totalPieces = s.durationDays || 26;
      const gymName = resolveValidGymName(s.gymName);
      const gymObj = GYMS.find(g => g.name === gymName) || GYMS[0];
      list.push({
        id: s.id,
        orderType: 'subscription',
        dateStr: new Date(ts).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        timestamp: ts,
        customerName: s.customerName || 'Subscriber',
        customerPhone: s.customerPhone || '',
        gymName: gymName,
        gymLocation: gymObj.location,
        deliveryTimeSlot: s.timeSlot || 'Morning Delivery Slot',
        totalPieces,
        totalAmount: s.price || 0,
        status: s.status,
        itemsList: [{ name: s.planName, quantity: totalPieces, price: Math.round(s.price / totalPieces) }],
        isBulk: true,
        subscription: s
      });
    });

    return list.sort((a, b) => b.timestamp - a.timestamp);
  }, [orders, subscriptions]);

  const gymOverviewStats = useMemo(() => {
    const map: Record<string, {
      gymName: string;
      gymLocation: string;
      totalOrders: number;
      totalPieces: number;
      totalRevenue: number;
    }> = {};

    // Strictly initialize ONLY the 15 gyms
    GYMS.forEach(g => {
      map[g.name] = {
        gymName: g.name,
        gymLocation: g.location,
        totalOrders: 0,
        totalPieces: 0,
        totalRevenue: 0
      };
    });

    gymOrdersList.forEach(entry => {
      const name = entry.gymName || GYMS[0].name;
      if (map[name]) {
        map[name].totalOrders += 1;
        map[name].totalPieces += entry.totalPieces;
        map[name].totalRevenue += entry.totalAmount;
      }
    });

    // Strictly return only the 15 gyms from GYMS
    return GYMS.map(g => map[g.name]);
  }, [gymOrdersList]);

  const filteredGymOrders = useMemo(() => {
    return gymOrdersList.filter(item => {
      if (selectedGymFilter !== "all" && item.gymName !== selectedGymFilter) {
        return false;
      }
      if (gymOrderTypeFilter !== "all" && item.orderType !== gymOrderTypeFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesQuery = (
          item.customerName.toLowerCase().includes(q) ||
          item.customerPhone.includes(q) ||
          item.gymName.toLowerCase().includes(q) ||
          item.id.toLowerCase().includes(q) ||
          item.itemsList.some(i => i.name.toLowerCase().includes(q))
        );
        if (!matchesQuery) return false;
      }
      const d = new Date(item.timestamp);
      return matchDateFilter(
        d,
        gymPastFilterType,
        gymSelectedDailyMode,
        gymCustomDailyDate,
        gymSelectedWeeklyRange,
        gymSelectedMonth,
        gymSelectedYear
      );
    });
  }, [gymOrdersList, selectedGymFilter, gymOrderTypeFilter, searchQuery, gymPastFilterType, gymSelectedDailyMode, gymCustomDailyDate, gymSelectedWeeklyRange, gymSelectedMonth, gymSelectedYear]);

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
            <p className="text-[10px] text-white/50 font-bold">Real-time alerts & comprehensive filter terminal</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Admin Kitchen Live / Off Toggle Switch */}
          <div className="flex items-center gap-2.5 bg-black/40 border border-white/15 px-3.5 py-1.5 rounded-2xl shadow-inner">
            <div className="flex items-center gap-1.5">
              <span className={`w-3 h-3 rounded-full ${isKitchenLive ? 'bg-emerald-400 animate-pulse shadow-[0_0_10px_#34d399]' : 'bg-red-500'}`} />
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-wider text-white">
                  {isKitchenLive ? 'Kitchen is ON' : 'Kitchen is OFF'}
                </span>
                <span className="text-[8.5px] font-semibold text-white/50">
                  {isKitchenLive ? 'Orders Open Live' : 'Customer Site Paused'}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleToggleKitchen}
              disabled={isTogglingKitchen}
              className={`px-3 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 active:scale-95 ${
                isKitchenLive 
                  ? 'bg-red-500 hover:bg-red-600 text-white shadow-xs' 
                  : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-xs'
              }`}
              title={isKitchenLive ? "Click to turn kitchen OFF (Pauses customer orders)" : "Click to turn kitchen ON (Live customer ordering)"}
            >
              <Power className="w-3.5 h-3.5" />
              <span>{isKitchenLive ? 'TURN OFF' : 'TURN ON'}</span>
            </button>
          </div>

          {/* Live Sound Toggle */}
          <button
            onClick={toggleSound}
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

          {/* Test Live Normal Order Sound */}
          <button
            onClick={testAlertSound}
            className="px-2.5 py-2 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all flex items-center gap-1 cursor-pointer border border-emerald-500/30"
            title="Simulate instant order sound & 15-second popup"
          >
            <Bell className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden md:inline">Test Live Sound</span>
          </button>

          {/* Test Subscription Order Sound */}
          <button
            onClick={testSubscriptionAlertSound}
            className="px-2.5 py-2 bg-sky-500/30 hover:bg-sky-500/50 text-sky-200 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all flex items-center gap-1 cursor-pointer border border-sky-400/40"
            title="Simulate distinct subscription order sound effect & 15-second popup"
          >
            <Repeat className="w-3.5 h-3.5 text-sky-300" />
            <span className="hidden md:inline">Test Subscription Sound</span>
          </button>

          {/* Test Kitchen Opening Alert (30s) */}
          <button
            onClick={testKitchenOpeningAlert}
            className="px-2.5 py-2 bg-purple-500/30 hover:bg-purple-500/50 text-purple-200 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all flex items-center gap-1 cursor-pointer border border-purple-400/40"
            title="Simulate 6:00 AM / 6:00 PM session opening alert sound & 30-second banner"
          >
            <Clock className="w-3.5 h-3.5 text-purple-300" />
            <span className="hidden lg:inline">Test Session Alert (30s)</span>
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

      {/* 30-Second Kitchen Opening Alert Banner */}
      {kitchenOpeningAlert && (
        <div className="bg-gradient-to-r from-purple-900 via-[#1d1136] to-indigo-950 text-white border-b-2 border-purple-400/50 shadow-xl px-5 py-3.5 relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-500/25 border border-purple-400/50 flex items-center justify-center shrink-0 shadow-inner">
                <Clock className="w-5 h-5 text-purple-300 animate-spin" style={{ animationDuration: '6s' }} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="bg-purple-500 text-white text-[9.5px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                    ⏰ SESSION OPENING ALERT ({openingAlertSecondsLeft}s)
                  </span>
                  <span className="text-xs font-black text-purple-200">
                    {kitchenOpeningAlert.session} Session ({kitchenOpeningAlert.timeStr})
                  </span>
                </div>
                <p className="text-xs font-bold text-white/95 mt-1">
                  {kitchenOpeningAlert.message}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end md:self-auto">
              {!isKitchenLive && (
                <button
                  onClick={async () => {
                    await handleTurnKitchenOn();
                    setKitchenOpeningAlert(null);
                  }}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black rounded-xl shadow-md cursor-pointer transition-all flex items-center gap-1.5 active:scale-95"
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>Turn Kitchen ON Now 🟢</span>
                </button>
              )}
              <button
                onClick={() => setKitchenOpeningAlert(null)}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                title="Dismiss alert"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 30-Second Countdown Progress Bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-950/80">
            <div 
              className="h-full bg-gradient-to-r from-purple-400 via-emerald-400 to-amber-400 transition-all duration-1000 ease-linear"
              style={{ width: `${Math.max(0, Math.min(100, (openingAlertSecondsLeft / 30) * 100))}%` }}
            />
          </div>
        </div>
      )}

      {/* Action Notice Banner */}
      {actionNotice && (
        <div className="bg-emerald-600 text-white text-xs font-bold text-center py-2 px-4 shadow-sm animate-in fade-in">
          ✓ {actionNotice}
        </div>
      )}

      {/* Main Admin Contents */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto pb-24">
        
        {/* Search Input Box & Tab Selection */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-white p-5 rounded-3xl border border-slate-200/60 shadow-xs">
          <div>
            <h2 className="text-lg font-black text-brand-navy tracking-tight">Administrative Control Dashboard</h2>
            <p className="text-[11px] text-brand-navy/50 font-bold mt-0.5">Kitchen dispatch, gym recurring plans & historical filter queries</p>
            
            {/* Primary View Tabs */}
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
                onClick={() => setActiveTab("gym")}
                className={`py-2 px-4 rounded-xl text-xs font-black tracking-tight transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === "gym"
                    ? "bg-brand-navy text-white shadow-sm"
                    : "text-brand-navy/60 hover:bg-slate-100"
                }`}
              >
                <Dumbbell className="w-3.5 h-3.5 text-emerald-400" />
                <span>Gym Orders</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === 'gym' ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-brand-navy/60'}`}>
                  {gymOrdersList.length}
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
              placeholder="Search phone, name, gym, meal..."
              className="bg-[#FAF9F6] border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs font-semibold text-brand-navy focus:outline-none focus:border-brand-green/30 w-full shadow-inner"
            />
          </div>
        </div>

        {/* TAB CONTENTS */}
        <div className="max-w-4xl mx-auto">
          
          {/* TAB 1: SINGLE MEAL ORDERS */}
          {activeTab === "single" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-brand-navy text-white px-5 py-4 rounded-3xl shadow-sm">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-white/10 rounded-xl text-brand-green">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm tracking-tight">Single Meal Orders</h3>
                    <p className="text-[9px] text-white/50 font-bold uppercase tracking-wider">Kitchen prep, live orders & past delivered logs</p>
                  </div>
                </div>
                <span className="bg-brand-green text-white text-[11px] font-black px-3 py-1 rounded-full shadow-xs">
                  {filteredOrders.length} TOTAL ORDERS
                </span>
              </div>

              {/* Sub-tabs: All Orders vs Past Orders vs Declined Meals */}
              <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200/60">
                <button
                  type="button"
                  onClick={() => setSingleOrderSubTab("all")}
                  className={`py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    singleOrderSubTab === "all"
                      ? "bg-[#0F1E36] text-white shadow-xs"
                      : "text-slate-600 hover:text-brand-navy"
                  }`}
                >
                  <ShoppingBag className="w-3.5 h-3.5 text-brand-green shrink-0" />
                  <span>All Orders</span>
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                    singleOrderSubTab === "all" ? "bg-brand-green text-white" : "bg-slate-200 text-slate-700"
                  }`}>
                    {activeSingleOrders.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSingleOrderSubTab("past")}
                  className={`py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    singleOrderSubTab === "past"
                      ? "bg-[#0F1E36] text-white shadow-xs"
                      : "text-slate-600 hover:text-brand-navy"
                  }`}
                >
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Past</span>
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                    singleOrderSubTab === "past" ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-700"
                  }`}>
                    {allPastSingleOrders.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSingleOrderSubTab("declined")}
                  className={`py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    singleOrderSubTab === "declined"
                      ? "bg-red-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-red-600"
                  }`}
                >
                  <X className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  <span>Declined</span>
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                    singleOrderSubTab === "declined" ? "bg-white text-red-700" : "bg-red-100 text-red-700"
                  }`}>
                    {deletedSingleOrders.length}
                  </span>
                </button>
              </div>

              {/* PAST ORDERS FILTER CONTROLS (DAILY, WEEKLY, MONTHLY FOR ALL 12 MONTHS) */}
              {singleOrderSubTab === "past" && (
                <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4 text-emerald-600" />
                      <h4 className="text-xs font-black text-brand-navy uppercase tracking-wider">
                        Past Orders Time Filters
                      </h4>
                    </div>
                    
                    {/* Filter Type Selector */}
                    <div className="flex items-center gap-1 bg-[#FAF9F6] p-1 rounded-xl border border-slate-200/60">
                      <button
                        onClick={() => setPastFilterType("daily")}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                          pastFilterType === "daily" ? "bg-brand-navy text-white shadow-xs" : "text-slate-600 hover:text-brand-navy"
                        }`}
                      >
                        📅 Daily
                      </button>
                      <button
                        onClick={() => setPastFilterType("weekly")}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                          pastFilterType === "weekly" ? "bg-brand-navy text-white shadow-xs" : "text-slate-600 hover:text-brand-navy"
                        }`}
                      >
                        ⏱️ Weekly
                      </button>
                      <button
                        onClick={() => setPastFilterType("monthly")}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                          pastFilterType === "monthly" ? "bg-brand-navy text-white shadow-xs" : "text-slate-600 hover:text-brand-navy"
                        }`}
                      >
                        🗓️ Monthly
                      </button>
                      <button
                        onClick={() => setPastFilterType("all")}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                          pastFilterType === "all" ? "bg-brand-navy text-white shadow-xs" : "text-slate-600 hover:text-brand-navy"
                        }`}
                      >
                        🌐 All Past
                      </button>
                    </div>
                  </div>

                  {/* Summary Metric Counter Chips */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="bg-[#FAF9F6] p-3 rounded-2xl border border-slate-100">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Today's Past</p>
                      <p className="text-base font-black text-brand-navy mt-0.5">{pastSingleStats.todayCount} Orders</p>
                    </div>
                    <div className="bg-[#FAF9F6] p-3 rounded-2xl border border-slate-100">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">This Week</p>
                      <p className="text-base font-black text-brand-navy mt-0.5">{pastSingleStats.thisWeekCount} Orders</p>
                    </div>
                    <div className="bg-[#FAF9F6] p-3 rounded-2xl border border-slate-100">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">This Month</p>
                      <p className="text-base font-black text-brand-navy mt-0.5">{pastSingleStats.thisMonthCount} Orders</p>
                    </div>
                    <div className="bg-[#EBF4E0] p-3 rounded-2xl border border-brand-green/20">
                      <p className="text-[9px] font-black text-brand-green uppercase tracking-widest">Active Filter</p>
                      <p className="text-base font-black text-brand-green mt-0.5">
                        {pastSingleStats.currentFilterCount} Orders (₹{pastSingleStats.currentFilterRevenue})
                      </p>
                    </div>
                  </div>

                  {/* Sub-selectors based on active filter */}
                  {pastFilterType === "daily" && (
                    <div className="flex items-center gap-2 flex-wrap bg-[#FAF9F6] p-3 rounded-2xl border border-slate-100">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Select Day:</span>
                      <button
                        onClick={() => setSelectedDailyMode("today")}
                        className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer ${
                          selectedDailyMode === "today" ? "bg-emerald-600 text-white shadow-xs" : "bg-white text-slate-700 border border-slate-200"
                        }`}
                      >
                        Today
                      </button>
                      <button
                        onClick={() => setSelectedDailyMode("yesterday")}
                        className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer ${
                          selectedDailyMode === "yesterday" ? "bg-emerald-600 text-white shadow-xs" : "bg-white text-slate-700 border border-slate-200"
                        }`}
                      >
                        Yesterday
                      </button>
                      <button
                        onClick={() => setSelectedDailyMode("custom")}
                        className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer ${
                          selectedDailyMode === "custom" ? "bg-emerald-600 text-white shadow-xs" : "bg-white text-slate-700 border border-slate-200"
                        }`}
                      >
                        Custom Date
                      </button>
                      {selectedDailyMode === "custom" && (
                        <input
                          type="date"
                          value={customDailyDate}
                          onChange={(e) => setCustomDailyDate(e.target.value)}
                          className="bg-white border border-slate-300 rounded-xl px-2.5 py-1 text-xs font-bold text-brand-navy focus:outline-none"
                        />
                      )}
                    </div>
                  )}

                  {pastFilterType === "weekly" && (
                    <div className="flex items-center gap-2 flex-wrap bg-[#FAF9F6] p-3 rounded-2xl border border-slate-100">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Select Week Range:</span>
                      <button
                        onClick={() => setSelectedWeeklyRange("this_week")}
                        className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer ${
                          selectedWeeklyRange === "this_week" ? "bg-emerald-600 text-white shadow-xs" : "bg-white text-slate-700 border border-slate-200"
                        }`}
                      >
                        This Week (Last 7 Days)
                      </button>
                      <button
                        onClick={() => setSelectedWeeklyRange("last_week")}
                        className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer ${
                          selectedWeeklyRange === "last_week" ? "bg-emerald-600 text-white shadow-xs" : "bg-white text-slate-700 border border-slate-200"
                        }`}
                      >
                        Previous Week (8-14 Days Ago)
                      </button>
                      <button
                        onClick={() => setSelectedWeeklyRange("past_14d")}
                        className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer ${
                          selectedWeeklyRange === "past_14d" ? "bg-emerald-600 text-white shadow-xs" : "bg-white text-slate-700 border border-slate-200"
                        }`}
                      >
                        Past 14 Days
                      </button>
                    </div>
                  )}

                  {pastFilterType === "monthly" && (
                    <div className="space-y-2 bg-[#FAF9F6] p-3 rounded-2xl border border-slate-100">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                          Select Month of {selectedYear}:
                        </span>
                        <div className="flex items-center gap-1 text-xs font-bold">
                          <button
                            onClick={() => setSelectedYear(y => y - 1)}
                            className="px-2 py-0.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
                          >
                            ← {selectedYear - 1}
                          </button>
                          <span className="px-2 font-black">{selectedYear}</span>
                          <button
                            onClick={() => setSelectedYear(y => y + 1)}
                            className="px-2 py-0.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
                          >
                            {selectedYear + 1} →
                          </button>
                        </div>
                      </div>
                      
                      {/* Grid of ALL 12 MONTHS */}
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-1.5">
                        {MONTH_NAMES.map((mName, mIdx) => (
                          <button
                            key={mName}
                            onClick={() => setSelectedMonth(mIdx)}
                            className={`py-1.5 px-2 rounded-xl text-[10px] font-black transition-all cursor-pointer text-center ${
                              selectedMonth === mIdx
                                ? "bg-emerald-600 text-white shadow-xs"
                                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                            }`}
                          >
                            {mName}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Indicator banner showing what is currently filtered */}
                  <div className="text-[11px] font-black text-brand-navy/70 flex items-center justify-between">
                    <span>
                      Showing <strong>{filteredPastSingleOrders.length}</strong> past orders
                      {pastFilterType === "daily" && ` (${selectedDailyMode === "today" ? "Today" : selectedDailyMode === "yesterday" ? "Yesterday" : customDailyDate})`}
                      {pastFilterType === "weekly" && ` (${selectedWeeklyRange.replace("_", " ")})`}
                      {pastFilterType === "monthly" && ` (${MONTH_NAMES[selectedMonth]} ${selectedYear})`}
                    </span>
                    <span className="text-emerald-700 font-mono">
                      Revenue: ₹{pastSingleStats.currentFilterRevenue}
                    </span>
                  </div>
                </div>
              )}

              {/* Render Single Meal Orders Cards */}
              {singleOrderSubTab !== "declined" && (() => {
                const listToRender = singleOrderSubTab === 'all' 
                  ? activeSingleOrders 
                  : filteredPastSingleOrders;
                if (listToRender.length === 0) {
                  return (
                    <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/60 shadow-xs text-slate-400 font-bold">
                      {singleOrderSubTab === "all"
                        ? "No single meal orders found."
                        : "No past delivered orders match the selected filter."}
                    </div>
                  );
                }

                return (
                  <div className="space-y-4 max-h-[750px] overflow-y-auto pr-1">
                    {listToRender.map((order) => {
                      const stats = getCustomerStats(order.customerPhone);
                      const isOrderPreOrder = isPreOrderCheck(order);

                      return (
                        <div key={order.id} className={`bg-white rounded-3xl border p-5 shadow-xs transition-all flex flex-col gap-4 ${
                          isOrderPreOrder 
                            ? "border-sky-300/80 hover:border-sky-400 ring-1 ring-sky-100" 
                            : "border-slate-200/70 hover:border-brand-green/30"
                        }`}>
                          
                          {/* Pre-Order Banner */}
                          {isOrderPreOrder && (
                            <div className="bg-gradient-to-r from-sky-50 to-indigo-50/70 border border-sky-200/80 rounded-2xl px-3.5 py-2 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-base">🗓️</span>
                                <div>
                                  <p className="text-[11px] font-black text-sky-950">Pre-Order For Tomorrow</p>
                                  <p className="text-[9.5px] font-bold text-sky-700">{order.scheduledDate || "Tomorrow Delivery"}</p>
                                </div>
                              </div>
                              <span className="text-[10.5px] font-black text-sky-900 bg-sky-200/90 px-3 py-1 rounded-full border border-sky-300/50 shadow-2xs">
                                🕒 Slot: {order.deliveryTimeSlot || "Morning Section"}
                              </span>
                            </div>
                          )}

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
                                {!isOrderPreOrder && (
                                  <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[9px] font-black px-2 py-0.5 rounded-full uppercase">
                                    ⚡ Live Order
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center justify-end gap-1.5 text-[11px] font-black text-brand-navy">
                                <Clock className="w-3.5 h-3.5 text-brand-green shrink-0" />
                                <span>{formatOrderDateTime(order.createdAt, order.date).display}</span>
                              </div>
                              {order.deliveryTimeSlot && !isOrderPreOrder && (
                                <span className="inline-block mt-1 bg-[#EBF4E0] text-brand-green text-[9px] font-black px-2 py-0.5 rounded-full">
                                  🕒 Slot: {order.deliveryTimeSlot}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Customer & Destination Info */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-[#FAF9F6] p-3 rounded-2xl border border-slate-100">
                              <p className="text-[9px] font-black text-brand-navy/30 uppercase tracking-widest mb-1.5">RECIPIENT CUSTOMER</p>
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

                          {/* Items Checklist */}
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
                              <span className="text-[10px] font-black uppercase text-brand-navy/40">TOTAL BILL</span>
                              <span className="font-black text-sm text-brand-green">₹{order.total}</span>
                            </div>
                            <div className="flex justify-between items-center pt-1.5 text-xs">
                              <span className="text-[10px] font-black uppercase text-brand-navy/40">PAYMENT METHOD</span>
                              <span className="font-extrabold text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                                💵 Cash on Delivery (COD)
                              </span>
                            </div>
                          </div>

                          {/* Status and Action Buttons */}
                          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                            <div>
                              <p className="text-[8px] font-black text-brand-navy/40 uppercase tracking-widest">LIVE TRACKER STATE</p>
                              <div className="flex items-center gap-1.5 mt-1">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                  order.status === "placed"
                                    ? "bg-amber-100 text-amber-800 border border-amber-300"
                                    : (order.status === "cooking" || order.status === "accepted")
                                    ? "bg-orange-100 text-orange-800 border border-orange-300"
                                    : order.status === "out_for_delivery"
                                    ? "bg-blue-100 text-blue-800 border border-blue-300"
                                    : order.status === "declined"
                                    ? "bg-red-100 text-red-800 border border-red-300"
                                    : "bg-[#EBF4E0] text-brand-green border border-brand-green/30"
                                }`}>
                                  {order.status === "placed" && <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />}
                                  {(order.status === "cooking" || order.status === "accepted") && <ChefHat className="w-3.5 h-3.5 text-orange-600" />}
                                  {order.status === "out_for_delivery" && <Bike className="w-3.5 h-3.5 text-blue-600" />}
                                  {order.status === "declined" && <X className="w-3 h-3 text-red-600" />}
                                  {order.status === "delivered" && <CheckCircle className="w-3 h-3" />}
                                  <span>
                                    {order.status === "placed"
                                      ? "Waiting for Accept"
                                      : (order.status === "cooking" || order.status === "accepted")
                                      ? "Cooking (EST 30 Mins)"
                                      : order.status === "out_for_delivery"
                                      ? "On the Way"
                                      : order.status === "declined"
                                      ? "Declined"
                                      : "Delivered"}
                                  </span>
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 flex-wrap">
                              {/* Option 1: Accept -> cooking (est 30 mins) */}
                              <button
                                onClick={() => handleUpdateOrderStatus(order.id, "cooking")}
                                className={`flex-1 sm:flex-none py-2 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 ${
                                  order.status === "cooking" || order.status === "accepted"
                                    ? "bg-orange-100 text-orange-800 border border-orange-400 font-extrabold shadow-inner"
                                    : "bg-orange-500 hover:bg-orange-600 text-white shadow-xs active:scale-95"
                                }`}
                              >
                                <ChefHat className="w-3 h-3" />
                                <span>{order.status === "cooking" || order.status === "accepted" ? "✓ Cooking" : "Accept"}</span>
                              </button>

                              {/* Option 2: Decline -> declined (moves to Declined tab) */}
                              <button
                                onClick={() => handleUpdateOrderStatus(order.id, "declined")}
                                className={`flex-1 sm:flex-none py-2 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 ${
                                  order.status === "declined"
                                    ? "bg-red-100 text-red-800 border border-red-400 font-extrabold shadow-inner"
                                    : "bg-red-600 hover:bg-red-700 text-white shadow-xs active:scale-95"
                                }`}
                              >
                                <X className="w-3 h-3" />
                                <span>{order.status === "declined" ? "✕ Declined" : "Decline"}</span>
                              </button>

                              {/* Option 3: On the Way -> out_for_delivery */}
                              <button
                                onClick={() => handleUpdateOrderStatus(order.id, "out_for_delivery")}
                                className={`flex-1 sm:flex-none py-2 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 ${
                                  order.status === "out_for_delivery"
                                    ? "bg-blue-100 text-blue-800 border border-blue-400 font-extrabold shadow-inner"
                                    : "bg-blue-600 hover:bg-blue-700 text-white shadow-xs active:scale-95"
                                }`}
                              >
                                <Bike className="w-3 h-3" />
                                <span>{order.status === "out_for_delivery" ? "✓ On the Way" : "On the Way"}</span>
                              </button>

                              {/* Option 4: Mark as Delivered -> delivered */}
                              <button
                                onClick={() => handleUpdateOrderStatus(order.id, "delivered")}
                                className={`flex-1 sm:flex-none py-2 px-3.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 ${
                                  order.status === "delivered"
                                    ? "bg-slate-200 text-slate-500 border border-slate-300 font-extrabold"
                                    : "bg-brand-green hover:bg-brand-green/90 text-white shadow-xs active:scale-95"
                                }`}
                              >
                                <Check className="w-3 h-3" />
                                <span>{order.status === "delivered" ? "✓ Delivered" : "Mark as Delivered"}</span>
                              </button>
                            </div>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                );
              })()}

              {/* 3. DECLINED MEALS VIEW */}
              {singleOrderSubTab === "declined" && (
                <div className="space-y-4">
                  <div className="bg-red-50 border border-red-200 rounded-3xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <X className="w-5 h-5 text-red-600" />
                      <div>
                        <h4 className="text-xs font-black text-red-950 uppercase tracking-wider">
                          Declined Single Meals Archive
                        </h4>
                        <p className="text-[10px] text-red-700 font-medium">
                          All declined single meal orders with exact date and time timestamps.
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-black bg-red-600 text-white px-3 py-1 rounded-full">
                      {deletedSingleOrders.length} DECLINED
                    </span>
                  </div>

                  {deletedSingleOrders.length === 0 ? (
                    <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/60 shadow-xs text-slate-400 font-bold">
                      No declined single meal orders found.
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[750px] overflow-y-auto pr-1">
                      {deletedSingleOrders.map((order) => {
                        const dtInfo = formatOrderDateTime(order.createdAt, order.date);
                        return (
                          <div key={order.id} className="bg-white rounded-3xl border border-red-200 p-5 shadow-xs flex flex-col gap-3 relative">
                            <div className="bg-red-100/80 border border-red-300/80 rounded-2xl px-3.5 py-2.5 flex items-center justify-between flex-wrap gap-2">
                              <div className="flex items-center gap-2">
                                <span className="text-base">❌</span>
                                <div>
                                  <p className="text-[11px] font-black text-red-950">
                                    Declined On: {order.declinedDate || dtInfo.display}
                                  </p>
                                  <p className="text-[9px] font-bold text-red-700">
                                    By: Admin • Status: Order Declined
                                  </p>
                                </div>
                              </div>
                              <span className="text-[10px] font-mono font-black text-red-900 bg-red-200/90 px-3 py-1 rounded-xl border border-red-300 shadow-2xs">
                                ⏱️ {order.declinedDate || dtInfo.display}
                              </span>
                            </div>

                            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                              <div>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">ORDER #{order.id}</span>
                                <h4 className="font-black text-sm text-brand-navy">{order.customerName}</h4>
                              </div>
                              <span className="font-mono text-xs font-black text-brand-navy">📞 {order.customerPhone}</span>
                            </div>

                            <div className="space-y-1.5">
                              {order.items.map((it, idx) => (
                                <div key={idx} className="flex justify-between items-center text-xs font-semibold text-slate-700">
                                  <span>{it.quantity}x {it.product.name}</span>
                                  <span className="font-mono font-bold">₹{it.product.price * it.quantity}</span>
                                </div>
                              ))}
                            </div>

                            <div className="flex justify-between items-center border-t border-slate-200/50 mt-2 pt-2 text-xs">
                              <span className="font-black uppercase text-slate-400">Total Bill</span>
                              <span className="font-black text-brand-green">₹{order.total}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

          {/* TAB 2: GYM SUBSCRIPTION ORDERS & DELETED PLANS */}
          {activeTab === "plan" && (
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
                  {filteredSubscriptions.length} TOTAL PLANS
                </span>
              </div>

              {/* Sub-tabs: Current Plans vs Past Plans vs Deleted Plans */}
              <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200/60">
                <button
                  type="button"
                  onClick={() => setSubscriptionSubTab("current")}
                  className={`py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    subscriptionSubTab === "current"
                      ? "bg-[#0F1E36] text-white shadow-xs"
                      : "text-slate-600 hover:text-brand-navy"
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 text-brand-green" />
                  <span>Current Plans</span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                    subscriptionSubTab === "current" ? "bg-brand-green text-white" : "bg-slate-200 text-slate-700"
                  }`}>
                    {currentSubscriptions.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSubscriptionSubTab("past")}
                  className={`py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    subscriptionSubTab === "past"
                      ? "bg-[#0F1E36] text-white shadow-xs"
                      : "text-slate-600 hover:text-brand-navy"
                  }`}
                >
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Past Plans</span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                    subscriptionSubTab === "past" ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-700"
                  }`}>
                    {allPastSubscriptions.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSubscriptionSubTab("declined")}
                  className={`py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    subscriptionSubTab === "declined"
                      ? "bg-red-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-red-600"
                  }`}
                >
                  <X className="w-3.5 h-3.5 text-red-400" />
                  <span>Declined Plans</span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                    subscriptionSubTab === "declined" ? "bg-white text-red-700" : "bg-red-100 text-red-700"
                  }`}>
                    {filteredDeletedSubscriptions.length}
                  </span>
                </button>
              </div>

              {/* PAST SUBSCRIPTIONS FILTER (DAILY, WEEKLY, MONTHLY FOR ALL 12 MONTHS) */}
              {subscriptionSubTab === "past" && (
                <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4 text-emerald-600" />
                      <h4 className="text-xs font-black text-brand-navy uppercase tracking-wider">
                        Past Plans Time Filters
                      </h4>
                    </div>

                    <div className="flex items-center gap-1 bg-[#FAF9F6] p-1 rounded-xl border border-slate-200/60">
                      <button
                        onClick={() => setSubPastFilterType("daily")}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                          subPastFilterType === "daily" ? "bg-brand-navy text-white shadow-xs" : "text-slate-600 hover:text-brand-navy"
                        }`}
                      >
                        📅 Daily
                      </button>
                      <button
                        onClick={() => setSubPastFilterType("weekly")}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                          subPastFilterType === "weekly" ? "bg-brand-navy text-white shadow-xs" : "text-slate-600 hover:text-brand-navy"
                        }`}
                      >
                        ⏱️ Weekly
                      </button>
                      <button
                        onClick={() => setSubPastFilterType("monthly")}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                          subPastFilterType === "monthly" ? "bg-brand-navy text-white shadow-xs" : "text-slate-600 hover:text-brand-navy"
                        }`}
                      >
                        🗓️ Monthly
                      </button>
                      <button
                        onClick={() => setSubPastFilterType("all")}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                          subPastFilterType === "all" ? "bg-brand-navy text-white shadow-xs" : "text-slate-600 hover:text-brand-navy"
                        }`}
                      >
                        🌐 All Past
                      </button>
                    </div>
                  </div>

                  {/* Summary Metric Chips */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="bg-[#FAF9F6] p-3 rounded-2xl border border-slate-100">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Today's Past</p>
                      <p className="text-base font-black text-brand-navy mt-0.5">{pastSubStats.todayCount} Plans</p>
                    </div>
                    <div className="bg-[#FAF9F6] p-3 rounded-2xl border border-slate-100">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">This Week</p>
                      <p className="text-base font-black text-brand-navy mt-0.5">{pastSubStats.thisWeekCount} Plans</p>
                    </div>
                    <div className="bg-[#FAF9F6] p-3 rounded-2xl border border-slate-100">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">This Month</p>
                      <p className="text-base font-black text-brand-navy mt-0.5">{pastSubStats.thisMonthCount} Plans</p>
                    </div>
                    <div className="bg-[#EBF4E0] p-3 rounded-2xl border border-brand-green/20">
                      <p className="text-[9px] font-black text-brand-green uppercase tracking-widest">Active Filter</p>
                      <p className="text-base font-black text-brand-green mt-0.5">
                        {pastSubStats.currentFilterCount} Plans (₹{pastSubStats.currentFilterRevenue})
                      </p>
                    </div>
                  </div>

                  {/* Sub-selector for Monthly (All 12 Months) */}
                  {subPastFilterType === "monthly" && (
                    <div className="space-y-2 bg-[#FAF9F6] p-3 rounded-2xl border border-slate-100">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                          Select Month of {subSelectedYear}:
                        </span>
                        <div className="flex items-center gap-1 text-xs font-bold">
                          <button
                            onClick={() => setSubSelectedYear(y => y - 1)}
                            className="px-2 py-0.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
                          >
                            ← {subSelectedYear - 1}
                          </button>
                          <span className="px-2 font-black">{subSelectedYear}</span>
                          <button
                            onClick={() => setSubSelectedYear(y => y + 1)}
                            className="px-2 py-0.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
                          >
                            {subSelectedYear + 1} →
                          </button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-1.5">
                        {MONTH_NAMES.map((mName, mIdx) => (
                          <button
                            key={mName}
                            onClick={() => setSubSelectedMonth(mIdx)}
                            className={`py-1.5 px-2 rounded-xl text-[10px] font-black transition-all cursor-pointer text-center ${
                              subSelectedMonth === mIdx
                                ? "bg-emerald-600 text-white shadow-xs"
                                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                            }`}
                          >
                            {mName}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {subPastFilterType === "daily" && (
                    <div className="flex items-center gap-2 flex-wrap bg-[#FAF9F6] p-3 rounded-2xl border border-slate-100">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Select Day:</span>
                      <button
                        onClick={() => setSubSelectedDailyMode("today")}
                        className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer ${
                          subSelectedDailyMode === "today" ? "bg-emerald-600 text-white shadow-xs" : "bg-white text-slate-700 border border-slate-200"
                        }`}
                      >
                        Today
                      </button>
                      <button
                        onClick={() => setSubSelectedDailyMode("yesterday")}
                        className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer ${
                          subSelectedDailyMode === "yesterday" ? "bg-emerald-600 text-white shadow-xs" : "bg-white text-slate-700 border border-slate-200"
                        }`}
                      >
                        Yesterday
                      </button>
                      <button
                        onClick={() => setSubSelectedDailyMode("custom")}
                        className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer ${
                          subSelectedDailyMode === "custom" ? "bg-emerald-600 text-white shadow-xs" : "bg-white text-slate-700 border border-slate-200"
                        }`}
                      >
                        Custom Date
                      </button>
                      {subSelectedDailyMode === "custom" && (
                        <input
                          type="date"
                          value={subCustomDailyDate}
                          onChange={(e) => setSubCustomDailyDate(e.target.value)}
                          className="bg-white border border-slate-300 rounded-xl px-2.5 py-1 text-xs font-bold text-brand-navy focus:outline-none"
                        />
                      )}
                    </div>
                  )}

                  {subPastFilterType === "weekly" && (
                    <div className="flex items-center gap-2 flex-wrap bg-[#FAF9F6] p-3 rounded-2xl border border-slate-100">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Select Range:</span>
                      <button
                        onClick={() => setSubSelectedWeeklyRange("this_week")}
                        className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer ${
                          subSelectedWeeklyRange === "this_week" ? "bg-emerald-600 text-white shadow-xs" : "bg-white text-slate-700 border border-slate-200"
                        }`}
                      >
                        This Week (Last 7 Days)
                      </button>
                      <button
                        onClick={() => setSubSelectedWeeklyRange("last_week")}
                        className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer ${
                          subSelectedWeeklyRange === "last_week" ? "bg-emerald-600 text-white shadow-xs" : "bg-white text-slate-700 border border-slate-200"
                        }`}
                      >
                        Previous Week
                      </button>
                      <button
                        onClick={() => setSubSelectedWeeklyRange("past_14d")}
                        className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer ${
                          subSelectedWeeklyRange === "past_14d" ? "bg-emerald-600 text-white shadow-xs" : "bg-white text-slate-700 border border-slate-200"
                        }`}
                      >
                        Past 14 Days
                      </button>
                    </div>
                  )}

                  <div className="text-[11px] font-black text-brand-navy/70 flex items-center justify-between">
                    <span>
                      Showing <strong>{filteredPastSubscriptions.length}</strong> past completed plans
                      {subPastFilterType === "daily" && ` (${subSelectedDailyMode === "today" ? "Today" : subSelectedDailyMode === "yesterday" ? "Yesterday" : subCustomDailyDate})`}
                      {subPastFilterType === "weekly" && ` (${subSelectedWeeklyRange.replace("_", " ")})`}
                      {subPastFilterType === "monthly" && ` (${MONTH_NAMES[subSelectedMonth]} ${subSelectedYear})`}
                    </span>
                    <span className="text-emerald-700 font-mono">
                      Total: ₹{pastSubStats.currentFilterRevenue}
                    </span>
                  </div>
                </div>
              )}

              {/* 1. DECLINED PLANS VIEW (WITH DECLINE DATE & TIME) */}
              {subscriptionSubTab === "declined" && (
                <div className="space-y-4">
                  <div className="bg-red-50 border border-red-200 rounded-3xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <X className="w-5 h-5 text-red-600" />
                      <div>
                        <h4 className="text-xs font-black text-red-950 uppercase tracking-wider">
                          Declined Subscription Plans Archive
                        </h4>
                        <p className="text-[10px] text-red-700 font-medium">
                          All declined plans with exact date and time timestamps. You can restore them anytime.
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-black bg-red-600 text-white px-3 py-1 rounded-full">
                      {filteredDeletedSubscriptions.length} DECLINED
                    </span>
                  </div>

                  {filteredDeletedSubscriptions.length === 0 ? (
                    <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/60 shadow-xs text-slate-400 font-bold">
                      No declined subscription plans found.
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[750px] overflow-y-auto pr-1">
                      {filteredDeletedSubscriptions.map((delSub) => {
                        const mealProduct = PRODUCTS.find(p => p.id === delSub.planId);
                        const isVeg = mealProduct ? mealProduct.isVeg : delSub.planName.toLowerCase().includes("veg");
                        const proteinGrams = mealProduct ? mealProduct.protein : 40;

                        return (
                          <div key={delSub.id} className="bg-white rounded-3xl border border-red-200 p-5 shadow-xs flex flex-col gap-3 relative">
                            
                            {/* Decline Date & Time Prominent Header Badge */}
                            <div className="bg-red-100/80 border border-red-300/80 rounded-2xl px-3.5 py-2.5 flex items-center justify-between flex-wrap gap-2">
                              <div className="flex items-center gap-2">
                                <span className="text-base">❌</span>
                                <div>
                                  <p className="text-[11px] font-black text-red-950">
                                    Declined On: {delSub.deletedDate || (delSub.deletedAt ? new Date(delSub.deletedAt).toLocaleString('en-IN') : 'N/A')}
                                  </p>
                                  <p className="text-[9px] font-bold text-red-700">
                                    By: {delSub.deletedBy || "Admin"} • {delSub.reason || "Declined by Admin"}
                                  </p>
                                </div>
                              </div>

                              <span className="text-[10px] font-mono font-black text-red-900 bg-red-200/90 px-3 py-1 rounded-xl border border-red-300 shadow-2xs">
                                ⏱️ {delSub.deletedDate || (delSub.deletedAt ? new Date(delSub.deletedAt).toLocaleString('en-IN') : 'N/A')}
                              </span>
                            </div>

                            {/* Plan details */}
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                              <div className="flex items-center gap-2">
                                <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${isVeg ? 'border-green-600 bg-green-50' : 'border-red-600 bg-red-50'}`}>
                                  <div className={`w-1.5 h-1.5 rounded-full ${isVeg ? 'bg-green-600' : 'bg-red-600'}`} />
                                </div>
                                <h4 className="font-black text-sm text-brand-navy">{delSub.planName}</h4>
                                <span className="text-[9px] bg-slate-100 text-slate-700 font-extrabold px-2 py-0.5 rounded-md">
                                  💪 {proteinGrams}g Protein
                                </span>
                              </div>
                              <span className="font-black text-xs text-brand-green">₹{delSub.price}</span>
                            </div>

                            {/* Customer & Gym */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                              <div className="bg-[#FAF9F6] p-2.5 rounded-xl border border-slate-100">
                                <p className="text-[9px] font-black text-slate-400 uppercase">Customer</p>
                                <p className="font-black text-brand-navy">{delSub.customerName}</p>
                                <p className="text-[10px] text-slate-500 font-mono">📞 {delSub.customerPhone}</p>
                              </div>
                              <div className="bg-[#EBF4E0]/50 p-2.5 rounded-xl border border-brand-green/20">
                                <p className="text-[9px] font-black text-brand-green uppercase">Gym Destination</p>
                                <p className="font-black text-brand-navy">🏋️ {delSub.gymName}</p>
                                <p className="text-[10px] text-slate-500">🕒 Slot: {delSub.timeSlot}</p>
                              </div>
                            </div>

                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* 2. CURRENT OR PAST SUBSCRIPTIONS LIST */}
              {subscriptionSubTab !== "deleted" && (
                (() => {
                  const groupsToRender = subscriptionSubTab === "current" ? groupedCurrentSubsList : groupedPastSubsList;
                  if (groupsToRender.length === 0) {
                    return (
                      <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/60 shadow-xs text-slate-400 font-bold">
                        {subscriptionSubTab === "current"
                          ? "No active subscriptions found matching search criteria."
                          : "No past completed subscriptions match the selected filter."}
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-5 max-h-[750px] overflow-y-auto pr-1">
                      {groupsToRender.map(({ phone, customerName, subs, stats }) => (
                        <div key={phone} className="bg-white rounded-3xl border border-slate-200/60 p-5 shadow-xs flex flex-col gap-4">
                          
                          {/* Customer Header */}
                          <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">CUSTOMER:</span>
                              <h4 className="font-black text-brand-navy text-sm leading-none">{customerName}</h4>
                              <span className="text-xs text-brand-navy/70 font-mono font-bold bg-slate-100 px-2 py-0.5 rounded-md">📞 {phone}</span>
                              {stats.isReOrdered && (
                                <span className="bg-amber-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase flex items-center gap-1 shadow-xs">
                                  <Repeat className="w-2.5 h-2.5" /> Re-ordered ({stats.totalOrders}x Orders)
                                </span>
                              )}
                            </div>
                            <span className="text-[9px] bg-brand-green/10 text-brand-green font-black px-2 py-0.5 rounded-full uppercase">
                              {subs.length} {subscriptionSubTab === 'current' ? 'Active' : 'Past'} {subs.length === 1 ? 'Plan' : 'Plans'}
                            </span>
                          </div>

                          {/* Member Plans List */}
                          <div className="divide-y divide-slate-100">
                            {subs.map((sub, index) => {
                              const mealProduct = PRODUCTS.find(p => p.id === sub.planId);
                              const mealName = mealProduct ? mealProduct.name : sub.planName.replace(" 26-Day Subscription", "").replace("Subscription", "").trim();
                              const isVeg = mealProduct ? mealProduct.isVeg : sub.planName.toLowerCase().includes("veg");
                              const proteinGrams = mealProduct ? mealProduct.protein : 40;
                              const caloriesKcal = mealProduct ? mealProduct.calories : 520;
                              
                               const mealInfo = calculateMealsRemaining(
                                sub.startDate,
                                sub.durationDays || 26,
                                sub.isPaused,
                                sub.pausedAt,
                                sub.status,
                                sub.mealsDelivered
                              );
                              const durationLabel = sub.durationDays === 78 ? "78 Meals (3 Months)" : sub.durationDays === 52 ? "52 Meals (2 Months)" : "26 Meals (1 Month)";

                              return (
                                <div key={sub.id || index} className={`py-4 ${index === 0 ? 'pt-1' : ''} ${index === subs.length - 1 ? 'pb-1' : ''} flex flex-col gap-3.5`}>
                                  
                                  <div className="flex items-center justify-between flex-wrap gap-2">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-sm font-black text-brand-green font-mono">
                                        #{index + 1}
                                      </span>
                                      <div className="flex items-center gap-1.5">
                                        <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${isVeg ? 'border-green-600 bg-green-50' : 'border-red-600 bg-red-50'}`}>
                                          <div className={`w-1.5 h-1.5 rounded-full ${isVeg ? 'bg-green-600' : 'bg-red-600'}`} />
                                        </div>
                                        <h4 className="font-black text-sm text-brand-navy tracking-tight">{mealName}</h4>
                                      </div>
                                      <span className="text-[9px] bg-slate-100 text-slate-700 font-extrabold px-2 py-0.5 rounded-md">
                                        💪 {proteinGrams}g Protein • {caloriesKcal} Kcal
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[9px] bg-[#FAF9F6] border border-slate-200 text-brand-navy/80 font-black px-2 py-0.5 rounded font-mono">
                                        🕒 {sub.timeSlot}
                                      </span>
                                      <span className="text-[9px] bg-emerald-50 border border-emerald-200 text-emerald-800 font-extrabold px-2 py-0.5 rounded">
                                        💵 COD
                                      </span>
                                    </div>
                                  </div>

                                  {/* Delivery Gym & Meals Tracker */}
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                    <div className="bg-[#EBF4E0] border border-brand-green/35 rounded-xl p-3 flex flex-col justify-center">
                                      <p className="text-[8px] font-black text-brand-green tracking-widest uppercase">DELIVERY DESTINATION GYM</p>
                                      <p className="font-black text-brand-navy text-xs mt-1 tracking-tight flex items-center gap-1 truncate">
                                        <span>🏋️</span> {sub.gymName}
                                      </p>
                                      <p className="text-[9px] text-brand-navy/60 font-semibold mt-0.5 truncate leading-none">
                                        {sub.gymLocation}
                                      </p>
                                    </div>

                                    <div className="bg-[#0F1E36] text-white rounded-xl p-3 border border-brand-navy/10 shadow-sm flex flex-col justify-between relative">
                                      <div className="flex items-center justify-between">
                                        <p className="text-[8px] font-black text-brand-green tracking-widest uppercase leading-none">
                                          {sub.status === "completed" ? "🏆 PLAN COMPLETED" : "🥗 MEALS PROGRESS"}
                                        </p>
                                        <span className="text-[8px] font-black bg-white/10 text-white/80 px-1.5 py-0.5 rounded">
                                          {durationLabel}
                                        </span>
                                      </div>
                                      
                                      <div className="my-1.5">
                                        <p className="text-sm font-black font-mono tracking-tight text-white leading-none">
                                          {sub.status === "completed" 
                                            ? `${mealInfo.totalMeals} of ${mealInfo.totalMeals} Meals Delivered (100%)` 
                                            : `${mealInfo.mealsDelivered} of ${mealInfo.totalMeals} Meals Delivered`}
                                        </p>
                                        <p className="text-[9px] text-white/70 font-semibold mt-1">
                                          {sub.status === "completed" 
                                            ? `All ${mealInfo.totalMeals} daily meals delivered to gym • Plan Finished` 
                                            : `${mealInfo.mealsRemaining} meals remaining to deliver • Excludes Sundays`}
                                        </p>
                                      </div>

                                      <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                                        <div 
                                          className="bg-brand-green h-full rounded-full transition-all duration-500"
                                          style={{ width: `${mealInfo.percentage}%` }}
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  {/* Dates & Action Controls */}
                                  <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-1 flex-wrap gap-2">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-[10px] text-slate-500 font-mono">
                                        Ordered: {formatOrderDateTime(sub.createdAt || sub.startDate, sub.date || sub.startDate).display}
                                      </span>
                                      <span className="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">
                                        Payment Method: COD
                                      </span>
                                    </div>

                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      {/* Meal Count Adjusters for Active Plans */}
                                      {sub.status !== "completed" && (
                                        <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                                          <button
                                            type="button"
                                            onClick={() => handleAdjustSubscriptionMeals(sub.id, Math.max(0, mealInfo.mealsDelivered - 1))}
                                            className="px-1.5 py-1 text-slate-600 hover:text-brand-navy text-[10px] font-black cursor-pointer"
                                            title="Decrement 1 meal delivered"
                                          >
                                            -1
                                          </button>
                                          <span className="px-2 text-[10px] font-mono font-black text-brand-navy">
                                            {mealInfo.mealsDelivered} / {mealInfo.totalMeals}
                                          </span>
                                          <button
                                            type="button"
                                            onClick={() => handleAdjustSubscriptionMeals(sub.id, Math.min(mealInfo.totalMeals, mealInfo.mealsDelivered + 1))}
                                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-black cursor-pointer shadow-2xs"
                                            title="Record +1 meal delivered"
                                          >
                                            +1 Delivered
                                          </button>
                                        </div>
                                      )}

                                      {sub.status !== "completed" ? (
                                        <button
                                          onClick={() => handleUpdateSubscriptionStatus(sub.id, "completed")}
                                          className="px-2.5 py-1.5 bg-[#6B9E35] hover:bg-[#59832B] text-white text-[9px] font-black uppercase tracking-wider rounded-lg shadow-xs transition-all cursor-pointer flex items-center gap-1"
                                        >
                                          <Check className="w-3 h-3" />
                                          <span>Complete Plan ({mealInfo.totalMeals}/{mealInfo.totalMeals})</span>
                                        </button>
                                      ) : (
                                        <button
                                          onClick={() => handleUpdateSubscriptionStatus(sub.id, "active")}
                                          className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[9px] font-black uppercase tracking-wider rounded-lg border border-slate-200 transition-all cursor-pointer flex items-center gap-1"
                                        >
                                          <RotateCcw className="w-3 h-3" />
                                          <span>Re-open Plan</span>
                                        </button>
                                      )}

                                      <button
                                        onClick={() => handleDeleteSubscription(sub.id)}
                                        className="px-2.5 py-1.5 bg-red-500 hover:bg-red-600 text-white text-[9px] font-black uppercase tracking-wider rounded-lg shadow-xs transition-all cursor-pointer flex items-center gap-1"
                                        title="Move to Declined Plans"
                                      >
                                        <X className="w-3 h-3" />
                                        <span>Decline Plan</span>
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
                  );
                })()
              )}
            </div>
          )}

          {/* TAB 3: GYM ORDERS */}
          {activeTab === "gym" && (
            <div className="space-y-5">
              <div className="flex items-center justify-between bg-emerald-800 text-white px-5 py-4 rounded-3xl shadow-sm">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-white/15 text-emerald-300 rounded-xl">
                    <Dumbbell className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm tracking-tight">Partner Gym Orders & Bulk Quantities</h3>
                    <p className="text-[9px] text-white/70 font-bold uppercase tracking-wider">
                      Orders grouped by partner gym with date & time filters
                    </p>
                  </div>
                </div>
                <span className="bg-emerald-600 text-white text-[11px] font-black px-3 py-1 rounded-full shadow-xs uppercase tracking-tight">
                  {filteredGymOrders.length} GYM {filteredGymOrders.length === 1 ? 'ORDER' : 'ORDERS'}
                </span>
              </div>

              {/* Gym Selector Horizontal Strip: Shows 2 cards at a time, scrollable on cursor hover/wheel */}
              <div className="relative group px-1">
                {/* Left Scroll Arrow */}
                <button
                  type="button"
                  onClick={() => scrollGyms("left")}
                  className="absolute -left-2 sm:-left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white shadow-md border border-slate-200 flex items-center justify-center text-brand-navy hover:bg-slate-50 transition-all cursor-pointer opacity-80 hover:opacity-100 hover:scale-105"
                  title="Previous Gyms"
                >
                  <ChevronLeft className="w-5 h-5 text-brand-navy" />
                </button>

                <div 
                  ref={gymScrollRef}
                  onWheel={(e) => {
                    if (e.deltaY !== 0) {
                      e.currentTarget.scrollLeft += e.deltaY;
                    }
                  }}
                  className="flex overflow-x-auto gap-3.5 pb-3 pt-1 scroll-smooth snap-x snap-mandatory scrollbar-thin scrollbar-thumb-emerald-500/50 hover:scrollbar-thumb-emerald-600"
                  style={{ scrollSnapType: "x mandatory" }}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedGymFilter("all")}
                    className={`w-[calc(50%-7px)] min-w-[240px] shrink-0 snap-start p-4 rounded-3xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 shadow-xs ${
                      selectedGymFilter === "all"
                        ? "bg-brand-navy text-white border-brand-navy shadow-sm"
                        : "bg-white text-brand-navy border-slate-200 hover:border-brand-green/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase">All Partner Gyms</span>
                      <Dumbbell className={`w-4 h-4 ${selectedGymFilter === "all" ? "text-brand-green" : "text-slate-400"}`} />
                    </div>
                    <div>
                      <p className="text-xl font-black font-mono">{gymOrdersList.length}</p>
                      <p className={`text-[10px] font-semibold ${selectedGymFilter === "all" ? "text-white/70" : "text-slate-500"}`}>
                        Total Gym Orders
                      </p>
                    </div>
                  </button>

                  {gymOverviewStats.map(gym => (
                    <button
                      key={gym.gymName}
                      type="button"
                      onClick={() => setSelectedGymFilter(gym.gymName)}
                      className={`w-[calc(50%-7px)] min-w-[240px] shrink-0 snap-start p-4 rounded-3xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 shadow-xs ${
                        selectedGymFilter === gym.gymName
                          ? "bg-emerald-700 text-white border-emerald-700 shadow-sm"
                          : "bg-white text-brand-navy border-slate-200 hover:border-brand-green/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black truncate max-w-[170px]" title={gym.gymName}>{gym.gymName.split('(')[0]}</span>
                        <MapPin className={`w-3.5 h-3.5 shrink-0 ${selectedGymFilter === gym.gymName ? "text-white" : "text-emerald-600"}`} />
                      </div>
                      <div>
                        <div className="flex items-baseline gap-1.5">
                          <p className="text-xl font-black font-mono">{gym.totalOrders}</p>
                          <span className={`text-[10px] font-bold ${selectedGymFilter === gym.gymName ? "text-white/90" : "text-emerald-700 font-mono"}`}>
                            ({gym.totalPieces}P)
                          </span>
                        </div>
                        <p className={`text-[10px] font-medium truncate ${selectedGymFilter === gym.gymName ? "text-white/70" : "text-slate-500"}`} title={gym.gymLocation}>
                          📍 {gym.gymLocation}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Right Scroll Arrow */}
                <button
                  type="button"
                  onClick={() => scrollGyms("right")}
                  className="absolute -right-2 sm:-right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white shadow-md border border-slate-200 flex items-center justify-center text-brand-navy hover:bg-slate-50 transition-all cursor-pointer opacity-80 hover:opacity-100 hover:scale-105"
                  title="Next Gyms"
                >
                  <ChevronRight className="w-5 h-5 text-brand-navy" />
                </button>
              </div>

              {/* Gym Order Type & Time Filters */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-emerald-600" />
                    <h4 className="text-xs font-black text-brand-navy uppercase tracking-wider">
                      Gym Orders Filter & Period Range
                    </h4>
                  </div>
                  
                  {/* Order Type Toggle */}
                  <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setGymOrderTypeFilter("all")}
                      className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${gymOrderTypeFilter === "all" ? "bg-brand-navy text-white shadow-2xs" : "text-slate-600 hover:text-brand-navy"}`}
                    >
                      All Types
                    </button>
                    <button
                      type="button"
                      onClick={() => setGymOrderTypeFilter("single")}
                      className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${gymOrderTypeFilter === "single" ? "bg-brand-navy text-white shadow-2xs" : "text-slate-600 hover:text-brand-navy"}`}
                    >
                      Single Meals
                    </button>
                    <button
                      type="button"
                      onClick={() => setGymOrderTypeFilter("subscription")}
                      className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${gymOrderTypeFilter === "subscription" ? "bg-brand-navy text-white shadow-2xs" : "text-slate-600 hover:text-brand-navy"}`}
                    >
                      Subscriptions
                    </button>
                  </div>
                </div>

                {/* Period Range Buttons (Daily, Weekly, Monthly, All) */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setGymPastFilterType("all")}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      gymPastFilterType === "all" ? "bg-emerald-700 text-white shadow-xs" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    All Time
                  </button>
                  <button
                    type="button"
                    onClick={() => setGymPastFilterType("daily")}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      gymPastFilterType === "daily" ? "bg-emerald-700 text-white shadow-xs" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    📅 Daily
                  </button>
                  <button
                    type="button"
                    onClick={() => setGymPastFilterType("weekly")}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      gymPastFilterType === "weekly" ? "bg-emerald-700 text-white shadow-xs" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    ⏱️ Weekly
                  </button>
                  <button
                    type="button"
                    onClick={() => setGymPastFilterType("monthly")}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      gymPastFilterType === "monthly" ? "bg-emerald-700 text-white shadow-xs" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    🗓️ Monthly
                  </button>
                </div>

                {/* Daily Sub-controls */}
                {gymPastFilterType === "daily" && (
                  <div className="flex items-center gap-2 flex-wrap bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Day:</span>
                    <button
                      type="button"
                      onClick={() => setGymSelectedDailyMode("today")}
                      className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer ${
                        gymSelectedDailyMode === "today" ? "bg-emerald-600 text-white shadow-xs" : "bg-white text-slate-700 border border-slate-200"
                      }`}
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={() => setGymSelectedDailyMode("yesterday")}
                      className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer ${
                        gymSelectedDailyMode === "yesterday" ? "bg-emerald-600 text-white shadow-xs" : "bg-white text-slate-700 border border-slate-200"
                      }`}
                    >
                      Yesterday
                    </button>
                    <button
                      type="button"
                      onClick={() => setGymSelectedDailyMode("custom")}
                      className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer ${
                        gymSelectedDailyMode === "custom" ? "bg-emerald-600 text-white shadow-xs" : "bg-white text-slate-700 border border-slate-200"
                      }`}
                    >
                      Custom Date
                    </button>
                    {gymSelectedDailyMode === "custom" && (
                      <input
                        type="date"
                        value={gymCustomDailyDate}
                        onChange={(e) => setGymCustomDailyDate(e.target.value)}
                        className="bg-white border border-slate-200 rounded-xl px-3 py-1 text-xs font-bold text-slate-700"
                      />
                    )}
                  </div>
                )}

                {/* Weekly Sub-controls */}
                {gymPastFilterType === "weekly" && (
                  <div className="flex items-center gap-2 flex-wrap bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Range:</span>
                    <button
                      type="button"
                      onClick={() => setGymSelectedWeeklyRange("this_week")}
                      className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer ${
                        gymSelectedWeeklyRange === "this_week" ? "bg-emerald-600 text-white shadow-xs" : "bg-white text-slate-700 border border-slate-200"
                      }`}
                    >
                      This Week (Last 7 Days)
                    </button>
                    <button
                      type="button"
                      onClick={() => setGymSelectedWeeklyRange("last_week")}
                      className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer ${
                        gymSelectedWeeklyRange === "last_week" ? "bg-emerald-600 text-white shadow-xs" : "bg-white text-slate-700 border border-slate-200"
                      }`}
                    >
                      Previous Week
                    </button>
                    <button
                      type="button"
                      onClick={() => setGymSelectedWeeklyRange("past_14d")}
                      className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer ${
                        gymSelectedWeeklyRange === "past_14d" ? "bg-emerald-600 text-white shadow-xs" : "bg-white text-slate-700 border border-slate-200"
                      }`}
                    >
                      Past 14 Days
                    </button>
                  </div>
                )}

                {/* Monthly Sub-controls */}
                {gymPastFilterType === "monthly" && (
                  <div className="flex items-center gap-2 flex-wrap bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Month:</span>
                    <select
                      value={gymSelectedMonth}
                      onChange={(e) => setGymSelectedMonth(Number(e.target.value))}
                      className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700"
                    >
                      {MONTH_NAMES.map((m, idx) => (
                        <option key={idx} value={idx}>{m}</option>
                      ))}
                    </select>
                    <select
                      value={gymSelectedYear}
                      onChange={(e) => setGymSelectedYear(Number(e.target.value))}
                      className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700"
                    >
                      <option value={2025}>2025</option>
                      <option value={2026}>2026</option>
                      <option value={2027}>2027</option>
                    </select>
                  </div>
                )}

                <div className="text-[11px] font-black text-brand-navy/70 flex items-center justify-between">
                  <span>
                    Showing <strong>{filteredGymOrders.length}</strong> gym orders
                    {selectedGymFilter !== "all" && ` for ${selectedGymFilter}`}
                  </span>
                  <span className="text-emerald-700 font-mono">
                    Total Revenue: ₹{filteredGymOrders.reduce((s, o) => s + o.totalAmount, 0)}
                  </span>
                </div>
              </div>

              {/* Gym Orders List */}
              {filteredGymOrders.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/60 shadow-xs text-slate-400 font-bold">
                  No gym orders found matching the selected filter criteria.
                </div>
              ) : (
                <div className="space-y-4 max-h-[750px] overflow-y-auto pr-1">
                  {filteredGymOrders.map((order) => (
                    <div key={order.id} className="bg-white rounded-3xl border border-slate-200/60 p-5 shadow-xs flex flex-col gap-4 relative">
                      
                      {/* Gym & Quantity Badge Header */}
                      <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl px-4 py-2.5 flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-base">🏋️</span>
                          <div>
                            <p className="text-xs font-black text-brand-navy">{order.gymName}</p>
                            <p className="text-[10px] text-slate-500 font-medium">📍 {order.gymLocation}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-black px-3 py-1 rounded-xl uppercase tracking-wider ${
                            order.isBulk ? 'bg-amber-500 text-white shadow-2xs' : 'bg-emerald-600 text-white'
                          }`}>
                            🔥 {order.orderType === 'single' ? (order.isBulk ? `Bulk ${order.totalPieces}P` : `${order.totalPieces} Meals`) : `${order.totalPieces}-Day Subscription`}
                          </span>
                          <span className="text-[10px] font-mono font-black text-slate-700 bg-white px-3 py-1 rounded-xl border border-slate-200">
                            🗓️ {order.dateStr}
                          </span>
                        </div>
                      </div>

                      {/* Customer & Items */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div className="bg-[#FAF9F6] p-3 rounded-2xl border border-slate-100 flex flex-col justify-center">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Customer Details</span>
                          <p className="font-black text-brand-navy mt-0.5">{order.customerName}</p>
                          <p className="text-[11px] text-slate-600 font-mono font-bold">📞 {order.customerPhone}</p>
                        </div>

                        <div className="bg-[#0F1E36]/5 p-3 rounded-2xl flex flex-col justify-center">
                          <span className="text-[9px] font-black text-brand-navy/40 uppercase tracking-wider">Ordered Items</span>
                          <div className="space-y-1 mt-1">
                            {order.itemsList.map((it, i) => (
                              <div key={i} className="flex justify-between items-center text-xs font-semibold text-brand-navy">
                                <span>{it.quantity}x {it.name}</span>
                                <span className="font-mono text-slate-500 font-bold">₹{it.price * it.quantity}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                        <span className="text-slate-400 font-black uppercase tracking-wider text-[10px]">Payment & Status</span>
                        <div className="flex items-center gap-3">
                          <span className="font-extrabold text-[10px] text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                            💵 Cash on Delivery (COD)
                          </span>
                          <span className="font-black text-brand-green font-mono text-sm">
                            ₹{order.totalAmount}
                          </span>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: TOTAL ORDERS */}
          {activeTab === "total" && (
            <div className="space-y-5">
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

              {/* Analytics Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
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
                </button>

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
                </button>

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
                </button>
              </div>

              {/* Feed of Unified Orders */}
              <div className="space-y-4 max-h-[750px] overflow-y-auto pr-1">
                {filteredUnifiedOrders.map((unifiedOrder) => {
                  const stats = getCustomerStats(unifiedOrder.customerPhone);
                  const isSingle = unifiedOrder.type === "single";

                  return (
                    <div
                      key={`${unifiedOrder.type}-${unifiedOrder.id}`}
                      className="bg-white rounded-3xl border border-slate-200/70 p-5 shadow-xs hover:border-brand-green/30 transition-all flex flex-col gap-4"
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`inline-flex items-center gap-1 text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-tight ${
                            isSingle
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : "bg-indigo-100 text-indigo-800 border border-indigo-200"
                          }`}>
                            {isSingle ? "📦 SINGLE MEAL" : "⚡ GYM SUBSCRIPTION"}
                          </span>
                          <span className="font-black text-brand-navy text-xs font-mono">{unifiedOrder.id}</span>
                          {stats.isReOrdered && (
                            <span className="inline-flex items-center gap-1 bg-amber-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-xs uppercase tracking-tight">
                              <Repeat className="w-2.5 h-2.5" /> Re-ordered ({stats.totalOrders}x Orders)
                            </span>
                          )}
                        </div>

                        <span className="text-[10px] text-slate-400 font-bold">{unifiedOrder.dateStr}</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-[#FAF9F6] p-3 rounded-2xl border border-slate-100">
                          <p className="text-[9px] font-black text-brand-navy/30 uppercase tracking-widest mb-1.5">RECIPIENT CUSTOMER</p>
                          <p className="font-black text-brand-navy text-xs flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-brand-green shrink-0" />
                            <span>{unifiedOrder.customerName}</span>
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono mt-1">📞 {unifiedOrder.customerPhone || "N/A"}</p>
                        </div>

                        <div className="bg-[#EBF4E0]/60 p-3 rounded-2xl border border-brand-green/10">
                          <p className="text-[9px] font-black text-brand-green uppercase tracking-widest mb-1.5">DESTINATION GYM</p>
                          <p className="font-black text-brand-navy text-xs">🏋️ {unifiedOrder.gymName || "No Gym Linked"}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">🕒 Slot: {unifiedOrder.deliveryTimeSlot || "Direct"}</p>
                        </div>
                      </div>

                      <div className="bg-[#0F1E36]/5 p-3.5 rounded-2xl flex items-center justify-between">
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Order Summary</p>
                          <p className="text-xs font-bold text-brand-navy mt-0.5">{unifiedOrder.summaryTitle}</p>
                        </div>
                        <span className="font-black text-sm text-brand-green">₹{unifiedOrder.amount}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          )}

        </div>

      </main>

      {/* LEFT-SIDE LIVE ORDER & PRE-ORDER INCOMING POPUP ALERTS (ACTIVE FOR 15 SECONDS) */}
      {activeAlerts.length > 0 && (
        <div className="fixed bottom-6 left-6 z-50 flex flex-col-reverse gap-3 max-w-sm w-[calc(100vw-3rem)] pointer-events-auto">
          {activeAlerts.map((alert) => {
            const isPreOrder = alert.category === "preorder" || alert.isPreOrder;
            const isSingle = alert.category === "single";
            const secondsLeft = Math.max(0, Math.ceil((alert.expiresAt - now) / 1000));
            const progressPercent = Math.min(100, Math.max(0, (secondsLeft / 15) * 100));

            return (
              <div
                key={alert.id}
                className={`rounded-3xl p-4 shadow-2xl border transition-all animate-in slide-in-from-left duration-300 backdrop-blur-md ${
                  isPreOrder
                    ? "bg-white/95 border-sky-400 text-brand-navy shadow-sky-950/20 ring-2 ring-sky-400/40"
                    : isSingle
                    ? "bg-white/95 border-emerald-400 text-brand-navy shadow-emerald-950/15 ring-2 ring-emerald-500/30"
                    : "bg-white/95 border-indigo-400 text-brand-navy shadow-indigo-950/15 ring-2 ring-indigo-500/30"
                }`}
              >
                {/* Header Row */}
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`p-1.5 rounded-lg text-white ${isPreOrder ? "bg-sky-600" : "bg-amber-500"}`}>
                      {isPreOrder ? <Sparkles className="w-3.5 h-3.5" /> : <Bell className="w-3.5 h-3.5 animate-bounce" />}
                    </span>
                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                      isPreOrder
                        ? "bg-sky-100 text-sky-900 border border-sky-300"
                        : isSingle
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        : "bg-indigo-100 text-indigo-800 border border-indigo-200"
                    }`}>
                      {isPreOrder ? "🗓️ PRE-ORDER FOR TOMORROW" : isSingle ? "📦 SINGLE MEAL ORDER" : "⚡ GYM SUBSCRIPTION"}
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

                {/* Content */}
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

                  {alert.deliverySlot && (
                    <p className="text-[10.5px] font-bold text-sky-800 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-200/60 flex items-center gap-1">
                      <span>🕒</span> <span>Slot: {alert.deliverySlot}</span>
                    </p>
                  )}

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

                  {alert.gymName && (
                    <p className="text-[10px] font-semibold text-brand-navy/60 flex items-center gap-1 bg-[#EBF4E0]/50 px-2 py-1 rounded-lg border border-brand-green/20">
                      <span>🏋️</span>
                      <span className="truncate">{alert.gymName}</span>
                    </p>
                  )}
                </div>

                {/* Quick Action Button */}
                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      if (isSingle || isPreOrder) {
                        setActiveTab("single");
                      } else {
                        setActiveTab("plan");
                      }
                      dismissAlert(alert.id);
                    }}
                    className={`text-[10px] font-black uppercase tracking-wider py-1.5 px-3 rounded-xl transition-all flex items-center gap-1 cursor-pointer ${
                      isPreOrder
                        ? "bg-sky-600 hover:bg-sky-700 text-white"
                        : isSingle
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                        : "bg-indigo-600 hover:bg-indigo-700 text-white"
                    }`}
                  >
                    <span>View in {isSingle || isPreOrder ? "Single Orders" : "Subscriptions"}</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </button>

                  <span className="text-[9px] font-bold text-slate-400">
                    Closes in {secondsLeft}s
                  </span>
                </div>

                {/* 15-Second Progress Bar */}
                <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden mt-2.5">
                  <div 
                    className={`h-full transition-all duration-1000 ${
                      isPreOrder ? "bg-sky-500" : isSingle ? "bg-emerald-500" : "bg-indigo-500"
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
