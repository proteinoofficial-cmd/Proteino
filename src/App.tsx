import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, 
  UtensilsCrossed, 
  Repeat, 
  Clock, 
  User, 
  Plus, 
  Minus, 
  Trash2, 
  MapPin, 
  Lock, 
  Settings, 
  ShieldCheck, 
  Activity, 
  ChevronRight, 
  X, 
  ChevronLeft, 
  CheckCircle2, 
  Sparkles, 
  Flame, 
  Heart, 
  TrendingUp,
  Key,
  Check,
  Moon,
  Sun
} from 'lucide-react';

import Dashboard from './components/Dashboard';
import Onboarding from './components/Onboarding';
import ProductDetails from './components/ProductDetails';
import ActivePlans from './components/ActivePlans';
import SubscriptionManager from './components/SubscriptionManager';
import OrdersTracker from './components/OrdersTracker';
import ProfileView from './components/ProfileView';
import AdminPanel from './components/AdminPanel';

import { PRODUCTS, GYMS } from './data';
import { Product, UserProfile, ActiveSubscription, Order, CartItem } from './types';
import { apiFetch } from './utils/api';
import { auth, googleProvider } from './lib/firebase';
import { signInWithPopup } from 'firebase/auth';
import { useStoreHours } from './utils/storeHours';
import DeliverySlotPicker from './components/DeliverySlotPicker';
import { MORNING_DELIVERY_SLOTS, getTomorrowFormatted } from './utils/deliverySlots';

export default function App() {
  // --- Profile State ---
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('proteino_profile');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.error("Failed to parse proteino_profile from localStorage:", e);
      return null;
    }
  });

  // --- Core Lists ---
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeSubscriptions, setActiveSubscriptions] = useState<ActiveSubscription[]>([]);
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('proteino_cart');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to parse proteino_cart from localStorage:", e);
      return [];
    }
  });
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('proteino_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to parse proteino_favorites from localStorage:", e);
      return [];
    }
  });
  const [favoriteToast, setFavoriteToast] = useState<{ show: boolean; product: Product } | null>(null);
  const favoriteToastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // --- UI Routing States ---
  const [currentView, setCurrentView] = useState<'dashboard' | 'product_details' | 'active_plans' | 'orders' | 'profile' | 'subscriptions' | 'admin'>('dashboard');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [dashboardScrollY, setDashboardScrollY] = useState(0);
  const [showCart, setShowCart] = useState(false);

  // --- Auth Modal Overlay State ---
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalStep, setAuthModalStep] = useState<'welcome' | 'register' | 'login' | 'forgot'>('welcome');
  const [authModalNotice, setAuthModalNotice] = useState<string>('');

  // --- Floating Non-Veg Coming Soon Notice State ---
  const [showFloatingNotice, setShowFloatingNotice] = useState<boolean>(() => {
    return localStorage.getItem('proteino_hide_nonveg_floating_notice') !== 'true';
  });

  // --- Store Operating Sessions (6-10 AM, 5-10 PM) ---
  const storeStatus = useStoreHours();
  const [showClosedStoreModal, setShowClosedStoreModal] = useState<boolean>(false);

  const handleDismissNotice = () => {
    setShowFloatingNotice(false);
    localStorage.setItem('proteino_hide_nonveg_floating_notice', 'true');
  };

  // --- Checkout Form States ---
  const [checkoutName, setCheckoutName] = useState('');
  const [checkoutPhone, setCheckoutPhone] = useState('');
  const [selectedGymId, setSelectedGymId] = useState('g1');
  const [checkoutTimeSlot, setCheckoutTimeSlot] = useState(MORNING_DELIVERY_SLOTS[0]);
  const [orderScheduleMode, setOrderScheduleMode] = useState<'preorder' | 'instant'>('preorder');
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [showCheckoutConfirmModal, setShowCheckoutConfirmModal] = useState(false);

  // Pre-fill checkout form whenever profile changes
  useEffect(() => {
    if (profile) {
      setCheckoutName(profile.name);
      setCheckoutPhone(profile.phone || '');
    }
  }, [profile]);

  // --- Sync with Backend Server ---
  const fetchUserData = async () => {
    if (!profile?.phone) return;
    try {
      const [ordersRes, subsRes] = await Promise.all([
        apiFetch(`/api/orders?phone=${profile.phone}`),
        apiFetch(`/api/subscriptions?phone=${profile.phone}`)
      ]);
      if (ordersRes.ok && ordersRes.headers.get('content-type')?.includes('application/json')) {
        const oData = await ordersRes.json();
        setOrders(oData);
      }
      if (subsRes.ok && subsRes.headers.get('content-type')?.includes('application/json')) {
        const sData = await subsRes.json();
        setActiveSubscriptions(sData);
      }
    } catch (err) {
      console.error("Failed to fetch user data:", err);
    }
  };

  useEffect(() => {
    if (profile?.phone) {
      fetchUserData();
      const pollTimer = setInterval(() => {
        fetchUserData();
      }, 3500);
      return () => clearInterval(pollTimer);
    }
  }, [profile?.phone]);

  // Handle Firebase Google Sign-In redirect results on page load (essential for mobile devices!)
  useEffect(() => {
    const handleRedirect = async () => {
      try {
        const { auth } = await import('./lib/firebase');
        const { getRedirectResult } = await import('firebase/auth');
        const result = await getRedirectResult(auth);
        
        if (result && result.user) {
          const user = result.user;
          if (user.email) {
            console.log("Firebase Google Redirect Sign-In success:", user.email);
            const response = await apiFetch('/api/auth/google', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: user.displayName,
                email: user.email,
                uid: user.uid,
                avatar: user.photoURL
              })
            });
            
            if (response.ok) {
              const data = await response.json();
              setProfile(data);
              localStorage.setItem('proteino_profile', JSON.stringify(data));
              setCurrentView('dashboard');
            } else {
              console.error("Backend failed to authenticate user after redirect");
            }
          }
        }
      } catch (err) {
        console.error("Failed to handle Firebase Google Redirect Sign-In:", err);
      }
    };
    handleRedirect();
  }, []);

  // Listen for Google Auth / OAuth success messages from the popup, storage events, and window focus
  useEffect(() => {
    const handleOAuthSuccess = (uProfile: any) => {
      setProfile(uProfile);
      localStorage.setItem('proteino_profile', JSON.stringify(uProfile));
      setShowAuthModal(false);
      setAuthModalNotice('');
      setCurrentView('dashboard');
    };

    const handleOAuthMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS' && event.data?.profile) {
        handleOAuthSuccess(event.data.profile);
      }
    };

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'proteino_profile' && event.newValue) {
        try {
          const uProfile = JSON.parse(event.newValue);
          setProfile(uProfile);
          setCurrentView('dashboard');
        } catch (e) {
          console.error("Failed to parse profile from storage event:", e);
        }
      }
    };

    const handleWindowFocus = () => {
      const saved = localStorage.getItem('proteino_profile');
      if (saved) {
        try {
          const uProfile = JSON.parse(saved);
          if (!profile || profile.phone !== uProfile.phone) {
            handleOAuthSuccess(uProfile);
          }
        } catch (e) {
          console.error("Failed to parse profile on focus:", e);
        }
      }
    };

    window.addEventListener('message', handleOAuthMessage);
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleWindowFocus);

    // Also run a regular interval check in case focus/storage fails to trigger in sandboxed frames
    const interval = setInterval(() => {
      const saved = localStorage.getItem('proteino_profile');
      if (saved) {
        try {
          const uProfile = JSON.parse(saved);
          if (!profile || profile.phone !== uProfile.phone) {
            handleOAuthSuccess(uProfile);
          }
        } catch (e) {}
      }
    }, 1000);

    return () => {
      window.removeEventListener('message', handleOAuthMessage);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleWindowFocus);
      clearInterval(interval);
    };
  }, [profile]);

  // Handle /admin.proteino routing natively
  useEffect(() => {
    const checkPath = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;
      if (
        path === '/admin.proteino' || 
        path.endsWith('/admin.proteino') || 
        hash === '#/admin.proteino' || 
        hash === 'admin.proteino'
      ) {
        setCurrentView('admin');
      }
    };
    checkPath();
    window.addEventListener('popstate', checkPath);
    window.addEventListener('hashchange', checkPath);
    return () => {
      window.removeEventListener('popstate', checkPath);
      window.removeEventListener('hashchange', checkPath);
    };
  }, []);

  // --- Onboarding Actions ---
  const handleRegister = async (name: string, phone: string, pass: string) => {
    try {
      const response = await apiFetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, password: pass })
      });
      const text = await response.text();
      let data: any = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch (jsonErr) {
        console.error("Non-JSON register response:", text);
        return { success: false, error: `Server error (${response.status}): ${text.slice(0, 150)}` };
      }
      if (!response.ok) {
        return { success: false, error: data.error || 'Registration failed' };
      }
      // Success: Save user profile locally and update state
      setProfile(data);
      localStorage.setItem('proteino_profile', JSON.stringify(data));
      setShowAuthModal(false);
      setAuthModalNotice('');
      setCurrentView('dashboard');
      return { success: true };
    } catch (err: any) {
      console.error("Register catch error:", err);
      return { success: false, error: `Network/Server error: ${err.message || 'Please try again.'}` };
    }
  };

  const handleLogin = async (phone: string, pass: string) => {
    try {
      const response = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password: pass })
      });
      const text = await response.text();
      let data: any = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch (jsonErr) {
        console.error("Non-JSON login response:", text);
        return { success: false, error: `Server error (${response.status}): ${text.slice(0, 150)}` };
      }
      if (!response.ok) {
        return { success: false, error: data.error || 'Login failed' };
      }
      // Success: Save user profile locally and update state
      setProfile(data);
      localStorage.setItem('proteino_profile', JSON.stringify(data));
      setShowAuthModal(false);
      setAuthModalNotice('');
      setCurrentView('dashboard');
      return { success: true };
    } catch (err: any) {
      console.error("Login catch error:", err);
      return { success: false, error: `Network/Server error: ${err.message || 'Please try again.'}` };
    }
  };

  const handleResetPassword = async (phone: string, pass: string) => {
    try {
      const response = await apiFetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password: pass })
      });
      const text = await response.text();
      let data: any = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch (jsonErr) {
        console.error("Non-JSON reset response:", text);
        return { success: false, error: `Server error (${response.status}): ${text.slice(0, 150)}` };
      }
      if (!response.ok) {
        return { success: false, error: data.error || 'Password reset failed' };
      }
      return { success: true };
    } catch (err: any) {
      console.error("Reset password catch error:", err);
      return { success: false, error: `Network/Server error: ${err.message || 'Please try again.'}` };
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const { auth, googleProvider } = await import('./lib/firebase');
      
      console.log("Initiating Firebase Google Sign-In with popup...");
      const { signInWithPopup } = await import('firebase/auth');
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      if (!user.email) {
        throw new Error('Failed to retrieve email from Google Account.');
      }
      
      const response = await apiFetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: user.displayName,
          email: user.email,
          uid: user.uid,
          avatar: user.photoURL
        })
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Authentication with database failed');
      }
      
      setProfile(data);
      localStorage.setItem('proteino_profile', JSON.stringify(data));
      setShowAuthModal(false);
      setAuthModalNotice('');
      setCurrentView('dashboard');
      return { success: true };
    } catch (err: any) {
      console.warn("Native Firebase Google Sign-In failed or was skipped. Falling back to robust backend OAuth / Simulator flow. Details:", err);
      
      // If native popup failed due to domain whitelisting, iframe constraints, cookie policy, or not running in a top-level window,
      // fallback to our custom server-side OAuth / Sandbox Simulator flow!
      try {
        const resUrl = await apiFetch(`/api/auth/google/url?origin=${encodeURIComponent(window.location.origin)}`);
        if (!resUrl.ok) {
          throw new Error('Failed to fetch Google login URL from backend');
        }
        const { url, isMock } = await resUrl.json();
        
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (isMobile) {
          // On mobile, direct window redirect is 100% reliable, never blocked by popup blockers,
          // and works flawlessly since the backend callback will redirect the user back on success!
          console.log("Mobile browser detected for fallback. Redirecting page to:", url);
          window.location.href = url;
          // Return a pending promise to keep the button loading state active
          return new Promise<{ success: boolean }>(() => {});
        } else {
          // Open the popup window perfectly centered on desktop
          const popupWidth = 500;
          const popupHeight = 600;
          const left = window.screenX + (window.outerWidth - popupWidth) / 2;
          const top = window.screenY + (window.outerHeight - popupHeight) / 2;
          
          const popup = window.open(
            url,
            'google_oauth_popup',
            `width=${popupWidth},height=${popupHeight},left=${left},top=${top},scrollbars=yes,status=no`
          );
          
          if (!popup) {
            return { success: false, error: 'Popup blocked by browser. Please allow popups or use a mobile device.' };
          }
          
          return new Promise<{ success: boolean; error?: string }>((resolve) => {
            let resolved = false;
            
            const messageHandler = (event: MessageEvent) => {
              if (event.data?.type === 'OAUTH_AUTH_SUCCESS' && event.data?.profile) {
                cleanup();
                resolved = true;
                
                const profileData = event.data.profile;
                setProfile(profileData);
                localStorage.setItem('proteino_profile', JSON.stringify(profileData));
                setShowAuthModal(false);
                setAuthModalNotice('');
                setCurrentView('dashboard');
                resolve({ success: true });
              }
            };
            
            const timer = setInterval(() => {
              if (popup.closed) {
                cleanup();
                if (!resolved) {
                  const saved = localStorage.getItem('proteino_profile');
                  if (saved) {
                    setProfile(JSON.parse(saved));
                    setCurrentView('dashboard');
                    resolve({ success: true });
                  } else {
                    const customClientIdTip = !isMock 
                      ? '. (Tip: If you see "deleted_client", please delete GOOGLE_CLIENT_ID from Secrets settings to use the sandbox simulator inside the preview)'
                      : '';
                    resolve({ success: false, error: 'Sign-in window was closed before completion' + customClientIdTip + '.' });
                  }
                }
              }
            }, 500);
            
            const cleanup = () => {
              window.removeEventListener('message', messageHandler);
              clearInterval(timer);
            };
            
            window.addEventListener('message', messageHandler);
          });
        }
      } catch (fallbackErr: any) {
        console.error("Popup/Redirect Fallback Error:", fallbackErr);
        return { success: false, error: fallbackErr.message || 'Failed to authenticate via Google.' };
      }
    }
  };

  // --- Favorites Toggle ---
  const handleToggleFavorite = (id: string) => {
    setFavorites(prev => {
      const isAdding = !prev.includes(id);
      const next = isAdding ? [...prev, id] : prev.filter(f => f !== id);
      localStorage.setItem('proteino_favorites', JSON.stringify(next));

      if (isAdding) {
        const prod = PRODUCTS.find(p => p.id === id);
        if (prod) {
          if (favoriteToastTimeoutRef.current) {
            clearTimeout(favoriteToastTimeoutRef.current);
          }
          setFavoriteToast({ show: true, product: prod });
          favoriteToastTimeoutRef.current = setTimeout(() => {
            setFavoriteToast(null);
          }, 5000); // closes automatically after 5 seconds
        }
      }
      return next;
    });
  };

  // --- Cart Actions ---
  const handleAddToCart = (item: CartItem) => {
    // If store is closed for live kitchen orders, seamlessly set mode to pre-order for tomorrow
    if (!storeStatus.isOpen && item.purchaseOption === 'single') {
      setOrderScheduleMode('preorder');
    }

    setCart(prev => {
      const idx = prev.findIndex(i => i.product.id === item.product.id && i.purchaseOption === item.purchaseOption);
      let next;
      if (idx !== -1) {
        next = [...prev];
        next[idx] = {
          ...next[idx],
          quantity: next[idx].quantity + item.quantity
        };
      } else {
        next = [...prev, item];
      }
      localStorage.setItem('proteino_cart', JSON.stringify(next));
      return next;
    });
  };

  const handleDashboardAddToCart = (product: Product) => {
    handleAddToCart({
      product,
      quantity: 1,
      purchaseOption: 'single'
    });
  };

  const handleRemoveFromCart = (index: number) => {
    setCart(prev => {
      const next = prev.filter((_, i) => i !== index);
      localStorage.setItem('proteino_cart', JSON.stringify(next));
      return next;
    });
  };

  const handleUpdateCartQty = (index: number, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveFromCart(index);
      return;
    }
    setCart(prev => {
      const next = [...prev];
      next[index] = { ...next[index], quantity: newQty };
      localStorage.setItem('proteino_cart', JSON.stringify(next));
      return next;
    });
  };

  // --- Checkout Action ---
  const handleCheckoutPrompt = () => {
    const hasSingleMeals = cart.some(item => item.purchaseOption === 'single');
    
    // If user requested instant live prep during closed hours, switch them to pre-order for tomorrow
    if (hasSingleMeals && orderScheduleMode === 'instant' && !storeStatus.isOpen) {
      setOrderScheduleMode('preorder');
    }

    // If not authenticated, require authentication before placing the order
    if (!profile) {
      setAuthModalNotice('Please sign in or create an account to confirm and place your order.');
      setAuthModalStep('welcome');
      setShowAuthModal(true);
      return;
    }

    if (!checkoutName.trim()) {
      setCheckoutError('Please enter recipient name');
      return;
    }
    const cleanPhone = checkoutPhone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      setCheckoutError('Please enter a valid 10-digit mobile number');
      return;
    }
    setCheckoutError('');
    setShowCheckoutConfirmModal(true);
  };

  const executeCheckout = async () => {
    const hasSingleMeals = cart.some(item => item.purchaseOption === 'single');
    if (hasSingleMeals && orderScheduleMode === 'instant' && !storeStatus.isOpen) {
      setShowCheckoutConfirmModal(false);
      setShowClosedStoreModal(true);
      return;
    }

    setIsCheckingOut(true);
    setCheckoutError('');

    const gym = GYMS.find(g => g.id === selectedGymId) || GYMS[0];
    const cleanPhone = checkoutPhone.replace(/[^0-9]/g, '');
    const cleanName = checkoutName.trim() || profile?.name || 'Valued Customer';

    // Persist phone and name directly to user profile
    const updatedProfile: UserProfile = {
      ...(profile || {
        id: 'user_' + Date.now(),
        name: cleanName,
        email: '',
        goal: 'gain',
        dietaryPreference: 'veg',
        targetCalories: 2200,
        targetProtein: 140
      }),
      name: cleanName,
      phone: cleanPhone
    };
    setProfile(updatedProfile);
    localStorage.setItem('proteino_profile', JSON.stringify(updatedProfile));

    // Filter single meal items and subscription items
    const singleMealItems = cart.filter(item => item.purchaseOption === 'single');
    const subscriptionItems = cart.filter(item => item.purchaseOption === 'subscription');

    try {
      const nowObj = new Date();
      const formattedDateStr = nowObj.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      });
      const formattedTimeStr = nowObj.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      });
      const orderDateDisplay = `${formattedTimeStr}, ${formattedDateStr}`;
      const tomorrowInfo = getTomorrowFormatted();

      // 1. If we have single meal items, place a single order on the server
      if (singleMealItems.length > 0) {
        const isPreOrderMeal = orderScheduleMode === 'preorder' || !storeStatus.isOpen;
        const finalDeliverySlot = isPreOrderMeal ? checkoutTimeSlot : 'Immediate Live Prep';
        const finalScheduledDate = isPreOrderMeal ? tomorrowInfo.label : 'Today (Live Session)';

        const orderPayload = {
          items: singleMealItems,
          total: singleMealItems.reduce((acc, item) => acc + (item.product.price * item.quantity), 0),
          status: 'cooking' as const,
          deliveryTimeRemaining: 25, // mins for simulator countdown
          customerName: cleanName,
          customerPhone: cleanPhone,
          gymName: gym.name,
          gymLocation: gym.location,
          deliveryTimeSlot: finalDeliverySlot,
          isPreOrder: isPreOrderMeal,
          orderType: isPreOrderMeal ? 'preorder' : 'instant',
          scheduledDate: finalScheduledDate,
          createdAt: nowObj.toISOString(),
          date: orderDateDisplay
        };

        const orderRes = await apiFetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderPayload)
        });

        if (!orderRes.ok) {
          throw new Error('Failed to submit single delivery order');
        }
      }

      // 2. Process subscription items - creates separate subscription entries for each unit of quantity!
      if (subscriptionItems.length > 0) {
        for (const item of subscriptionItems) {
          const itemSubPrice = item.product.monthlyPrice || Math.round(item.product.price * 26 * 0.85);
          for (let q = 0; q < item.quantity; q++) {
            const subPayload = {
              planId: item.product.id,
              planName: `${item.product.name} 26-Day Subscription`,
              price: itemSubPrice,
              durationDays: 26,
              customerName: cleanName,
              customerPhone: cleanPhone,
              gymId: gym.id,
              gymName: gym.name,
              gymLocation: gym.location,
              timeSlot: checkoutTimeSlot,
              isPaused: false,
              startDate: nowObj.toISOString(),
              createdAt: nowObj.toISOString(),
              date: orderDateDisplay
            };

            const subRes = await apiFetch('/api/subscriptions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(subPayload)
            });

            if (!subRes.ok) {
              console.error('Failed to register subscription for item:', item.product.id);
            }
          }
        }
      }

      // Successful Transaction
      setCart([]);
      localStorage.removeItem('proteino_cart');
      setShowCheckoutConfirmModal(false);
      setShowCart(false);

      // Refresh data
      const [ordersRes, subsRes] = await Promise.all([
        apiFetch(`/api/orders?phone=${cleanPhone}`),
        apiFetch(`/api/subscriptions?phone=${cleanPhone}`)
      ]);
      if (ordersRes.ok && ordersRes.headers.get('content-type')?.includes('application/json')) {
        setOrders(await ordersRes.json());
      }
      if (subsRes.ok && subsRes.headers.get('content-type')?.includes('application/json')) {
        setActiveSubscriptions(await subsRes.json());
      }

      // Redirect view based on checkout item types
      if (subscriptionItems.length > 0 && singleMealItems.length === 0) {
        setCurrentView('active_plans');
      } else {
        setCurrentView('orders');
      }

    } catch (err: any) {
      setCheckoutError(err.message || 'Server checkout error. Please try again.');
      setShowCheckoutConfirmModal(false);
    } finally {
      setIsCheckingOut(false);
    }
  };

  // --- Profile Targets & Details Update ---
  const handleUpdateProfile = (updated: UserProfile) => {
    setProfile(updated);
    localStorage.setItem('proteino_profile', JSON.stringify(updated));
    setCheckoutName(updated.name);
    setCheckoutPhone(updated.phone || '');
  };

  // --- Orders Simulator Ticks ---
  const handleOrdersUpdate = (updatedOrders: Order[]) => {
    setOrders(updatedOrders);
    // Sync simulator changes to the database/endpoint
    updatedOrders.forEach(async (newOrder) => {
      const existing = orders.find(o => o.id === newOrder.id);
      if (existing && existing.status !== newOrder.status) {
        try {
          await apiFetch(`/api/orders/${newOrder.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newOrder.status })
          });
        } catch (err) {
          console.error("Failed to sync simulator order status with server:", err);
        }
      }
    });
  };

  // --- Subscription Controls ---
  const handleBuySubscriptionDirect = async (newSub: ActiveSubscription) => {
    if (!storeStatus.isOpen) {
      setShowClosedStoreModal(true);
      return;
    }

    if (!profile) {
      setAuthModalNotice('Please sign in or create an account to activate your gym meal subscription.');
      setAuthModalStep('welcome');
      setShowAuthModal(true);
      return;
    }

    const subPhone = newSub.customerPhone;
    const subName = newSub.customerName;
    if (subPhone) {
      const updatedProfile: UserProfile = {
        ...profile,
        name: subName || profile.name,
        phone: subPhone
      };
      setProfile(updatedProfile);
      localStorage.setItem('proteino_profile', JSON.stringify(updatedProfile));
    }

    try {
      const res = await apiFetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSub)
      });
      if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
        const savedSub = await res.json();
        setActiveSubscriptions(prev => [savedSub, ...prev.filter(s => s.id !== savedSub.id)]);
        if (subPhone) {
          const subsRes = await apiFetch(`/api/subscriptions?phone=${subPhone}`);
          if (subsRes.ok && subsRes.headers.get('content-type')?.includes('application/json')) {
            setActiveSubscriptions(await subsRes.json());
          }
        }
        setCurrentView('active_plans');
      }
    } catch (err) {
      console.error("Failed to buy subscription:", err);
    }
  };

  const handleCancelSubscriptionDirect = async () => {
    if (activeSubscriptions.length === 0) return;
    const subId = activeSubscriptions[0].id;
    try {
      const res = await apiFetch(`/api/subscriptions/${subId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setActiveSubscriptions(prev => prev.filter(s => s.id !== subId));
      }
    } catch (err) {
      console.error("Failed to cancel subscription:", err);
    }
  };

  const handleTogglePauseSubscription = async (subId: string) => {
    try {
      const res = await apiFetch(`/api/subscriptions/${subId}/pause`, {
        method: 'PUT'
      });
      if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
        const updatedSub = await res.json();
        setActiveSubscriptions(prev => prev.map(s => s.id === subId ? updatedSub : s));
      }
    } catch (err) {
      console.error("Failed to toggle pause:", err);
    }
  };

  const handleCompleteSubscription = async (subId: string) => {
    try {
      const res = await apiFetch(`/api/subscriptions/${subId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' })
      });
      if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
        const updatedSub = await res.json();
        setActiveSubscriptions(prev => prev.map(s => s.id === subId ? updatedSub : s));
      }
    } catch (err) {
      console.error("Failed to complete subscription:", err);
    }
  };

  const handleRenewSubscription = (planId: string) => {
    const prod = PRODUCTS.find(p => p.id === planId);
    if (prod) {
      setSelectedProduct(prod);
      setCurrentView('product_details');
    } else {
      setCurrentView('dashboard');
    }
  };

  const handleTogglePauseDirect = async () => {
    if (activeSubscriptions.length === 0) return;
    const subId = activeSubscriptions[0].id;
    await handleTogglePauseSubscription(subId);
  };

  // Logout utility
  const handleLogout = () => {
    localStorage.removeItem('proteino_profile');
    localStorage.removeItem('proteino_cart');
    localStorage.removeItem('proteino_favorites');
    setProfile(null);
    setCart([]);
    setFavorites([]);
    setOrders([]);
    setActiveSubscriptions([]);
    setCurrentView('dashboard');
  };

  // Calculated properties
  const cartCount = cart.reduce((acc, i) => acc + i.quantity, 0);
  const cartTotal = cart.reduce((acc, item) => {
    if (item.purchaseOption === 'subscription') {
      const subPrice = item.product.monthlyPrice || Math.round(item.product.price * 26 * 0.85);
      return acc + (subPrice * item.quantity);
    }
    return acc + (item.product.price * item.quantity);
  }, 0);

  // --- ROOT SWITCH RENDER ---
  if (currentView === 'admin') {
    return (
      <AdminPanel 
        onBackToApp={() => { 
          setCurrentView('dashboard'); 
          fetchUserData(); 
        }} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between select-none">
      
      {/* Premium Centered Frame wrapper */}
      <div className="w-full max-w-md mx-auto bg-[#FAF9F6] min-h-screen shadow-2xl flex flex-col relative overflow-x-hidden border-x border-slate-200/50">
        
        {/* Main Content Viewport */}
        <div className="flex-grow">
          {currentView === 'dashboard' && (
            <Dashboard 
              onProductClick={(p) => {
                const currentY = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
                setDashboardScrollY(currentY);
                try {
                  sessionStorage.setItem('proteino_dashboard_scroll', currentY.toString());
                } catch (e) {}
                setSelectedProduct(p);
                setCurrentView('product_details');
              }}
              onAddToCart={handleDashboardAddToCart}
              cartCount={cartCount}
              userGoal={profile?.goal || 'gain'}
              userName={profile?.name || ''}
              isGuest={!profile}
              onSignInClick={() => {
                setAuthModalNotice('');
                setAuthModalStep('welcome');
                setShowAuthModal(true);
              }}
              onCartClick={() => setShowCart(true)}
              activeSubscriptions={activeSubscriptions}
              onViewActivePlans={() => setCurrentView('active_plans')}
              cart={cart}
              favorites={favorites}
              onToggleFavorite={handleToggleFavorite}
              savedScrollY={dashboardScrollY}
            />
          )}

          {currentView === 'product_details' && selectedProduct && (
            <ProductDetails 
              product={selectedProduct}
              profile={profile}
              onBack={() => setCurrentView('dashboard')}
              onAddToCart={handleAddToCart}
              onSubscribeDirect={handleBuySubscriptionDirect}
              favorites={favorites}
              onToggleFavorite={handleToggleFavorite}
              cart={cart}
              onRequireAuth={(msg) => {
                setAuthModalNotice(msg || 'Please sign in or create an account to continue.');
                setAuthModalStep('welcome');
                setShowAuthModal(true);
              }}
            />
          )}

          {currentView === 'active_plans' && (
            <ActivePlans 
              activeSubscriptions={activeSubscriptions}
              onSubscriptionUpdate={setActiveSubscriptions}
              onRenewSub={handleRenewSubscription}
              onExploreClick={() => setCurrentView('dashboard')}
              isGuest={!profile}
              onSignInClick={() => {
                setAuthModalNotice('');
                setAuthModalStep('welcome');
                setShowAuthModal(true);
              }}
            />
          )}

          {currentView === 'orders' && (
            <OrdersTracker 
              orders={orders}
              onOrderUpdate={handleOrdersUpdate}
              isGuest={!profile}
              onSignInClick={() => {
                setAuthModalNotice('');
                setAuthModalStep('welcome');
                setShowAuthModal(true);
              }}
              onExploreClick={() => setCurrentView('explore')}
              onReorder={(items) => {
                items.forEach(item => handleAddToCart(item));
                setShowCart(true);
              }}
            />
          )}

          {currentView === 'profile' && (
            <ProfileView 
              profile={profile}
              favorites={favorites}
              onToggleFavorite={handleToggleFavorite}
              onAddToCart={handleDashboardAddToCart}
              onUpdateProfile={handleUpdateProfile}
              onSelectProduct={(p) => {
                setSelectedProduct(p);
                setCurrentView('product_details');
              }}
              onSignInClick={() => {
                setAuthModalNotice('');
                setAuthModalStep('welcome');
                setShowAuthModal(true);
              }}
            />
          )}

          {currentView === 'subscriptions' && (
            <SubscriptionManager 
              profile={profile}
              activeSubscription={activeSubscriptions.find(s => s.status !== 'completed') || null}
              onBuySubscription={handleBuySubscriptionDirect}
              onCancelSubscription={handleCancelSubscriptionDirect}
              onTogglePause={handleTogglePauseDirect}
              onRequireAuth={(msg) => {
                setAuthModalNotice(msg || 'Please sign in or create an account to activate your gym subscription.');
                setAuthModalStep('welcome');
                setShowAuthModal(true);
              }}
            />
          )}
        </div>

        {/* --- Global Floating Highlighted Notice: Non-Veg Meals Coming Soon --- */}
        <AnimatePresence>
          {showFloatingNotice && (
            <motion.div
              initial={{ opacity: 0, y: 25, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className={`fixed left-1/2 -translate-x-1/2 w-[calc(100%-1.5rem)] max-w-[410px] z-30 transition-all duration-300 ${
                cartCount > 0
                  ? (currentView === 'product_details' ? 'bottom-[145px]' : 'bottom-[142px]')
                  : (currentView === 'product_details' ? 'bottom-22' : 'bottom-20')
              }`}
            >
              <div className="bg-gradient-to-r from-amber-600 via-orange-500 to-amber-600 text-white px-3.5 py-3 rounded-2xl shadow-xl shadow-orange-950/25 border border-amber-300/50 flex items-center justify-between gap-2.5 backdrop-blur-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-lg shrink-0 border border-white/25 shadow-xs">
                    🍗
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[9px] font-black uppercase tracking-wider bg-white/25 text-white px-1.5 py-0.5 rounded-sm leading-none">
                        Coming Soon
                      </span>
                      <span className="text-[10px] font-extrabold text-amber-100 leading-none">
                        In 1–2 Months ⏳
                      </span>
                    </div>
                    <p className="text-[11px] font-bold text-white leading-tight mt-1 truncate">
                      Non-Veg fitness meals launching soon!
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleDismissNotice}
                  aria-label="Close notification"
                  className="w-6 h-6 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center shrink-0 transition-all cursor-pointer active:scale-90"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* =========================================================
            ZEPTO-STYLE FLOATING CART BAR
            ========================================================= */}
        <AnimatePresence>
          {cartCount > 0 && !showCart && (
            <motion.div
              initial={{ opacity: 0, y: 35, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 35, scale: 0.95 }}
              transition={{ type: 'spring', damping: 22, stiffness: 260 }}
              className={`fixed left-1/2 -translate-x-1/2 w-[calc(100%-1.25rem)] max-w-[410px] z-35 transition-all duration-300 ${
                currentView === 'product_details' ? 'bottom-20' : 'bottom-[74px]'
              }`}
            >
              <div 
                onClick={() => setShowCart(true)}
                className="group relative bg-[#0F1E36] hover:bg-[#132542] text-white p-3 rounded-2xl shadow-2xl shadow-brand-navy/60 border border-brand-green/40 flex items-center justify-between gap-3 cursor-pointer transition-all duration-200 active:scale-[0.98]"
              >
                {/* Subtle luminous top border */}
                <div className="absolute top-0 left-6 right-6 h-[1.5px] bg-gradient-to-r from-transparent via-brand-green to-transparent" />

                {/* Left section: Icon + items count + Total */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative w-10 h-10 rounded-xl bg-brand-green flex items-center justify-center text-white shrink-0 shadow-md shadow-brand-green/30">
                    <ShoppingBag className="w-5 h-5 text-white" />
                    <span className="absolute -top-1.5 -right-1.5 bg-[#0F1E36] text-brand-green border border-brand-green text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center">
                      {cartCount}
                    </span>
                  </div>

                  <div className="flex flex-col min-w-0">
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-black text-base text-white tracking-tight leading-none">
                        ₹{cartTotal}
                      </span>
                      <span className="text-[10px] text-white/60 font-bold uppercase tracking-wider">
                        • {cartCount} {cartCount === 1 ? 'item' : 'items'}
                      </span>
                    </div>
                    <p className="text-[10.5px] font-bold text-brand-green leading-tight mt-1 truncate flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse" />
                      <span>Ready to order & gym drop-off</span>
                    </p>
                  </div>
                </div>

                {/* Right CTA section: View Cart */}
                <div className="flex items-center gap-1 bg-brand-green hover:bg-brand-green-hover text-white px-3.5 py-2 rounded-xl text-xs font-black shrink-0 shadow-sm transition-all group-hover:pl-4">
                  <span>View Cart</span>
                  <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 stroke-[2.5]" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- Sticky Tab Navigation Footer --- */}
        {currentView !== 'product_details' && (
          <nav className="fixed bottom-0 max-w-md w-full bg-[#FAF9F6]/95 backdrop-blur-md border-t border-slate-200/50 flex items-center justify-around py-3.5 z-40 shadow-lg px-2 rounded-t-[24px]">
            {/* Explore Button */}
            <button 
              onClick={() => setCurrentView('dashboard')}
              className={`flex flex-col items-center gap-1 cursor-pointer ${currentView === 'dashboard' ? 'text-brand-green' : 'text-brand-navy/40'}`}
            >
              <UtensilsCrossed className="w-5 h-5" />
              <span className="text-[10px] font-bold">Explore</span>
            </button>

            {/* Gym Plans Button */}
            <button 
              onClick={() => setCurrentView('subscriptions')}
              className={`flex flex-col items-center gap-1 cursor-pointer ${currentView === 'subscriptions' ? 'text-brand-green' : 'text-brand-navy/40'}`}
            >
              <Repeat className="w-5 h-5" />
              <span className="text-[10px] font-bold">Gym Plans</span>
            </button>

            {/* Active Tracker Button */}
            <button 
              onClick={() => setCurrentView('active_plans')}
              className={`flex flex-col items-center gap-1 relative cursor-pointer ${currentView === 'active_plans' ? 'text-brand-green' : 'text-brand-navy/40'}`}
            >
              <Activity className="w-5 h-5" />
              {activeSubscriptions.length > 0 && (
                <span className="absolute top-0 right-1 w-2 h-2 bg-brand-green rounded-full animate-pulse" />
              )}
              <span className="text-[10px] font-bold">Active Track</span>
            </button>

            {/* Orders Button */}
            <button 
              onClick={() => setCurrentView('orders')}
              className={`flex flex-col items-center gap-1 cursor-pointer ${currentView === 'orders' ? 'text-brand-green' : 'text-brand-navy/40'}`}
            >
              <ShoppingBag className="w-5 h-5" />
              <span className="text-[10px] font-bold">Orders</span>
            </button>

            {/* Profile Button */}
            <button 
              onClick={() => setCurrentView('profile')}
              className={`flex flex-col items-center gap-1 cursor-pointer ${currentView === 'profile' ? 'text-brand-green' : 'text-brand-navy/40'}`}
            >
              <User className="w-5 h-5" />
              <span className="text-[10px] font-bold">Profile</span>
            </button>
          </nav>
        )}

        {/* --- Floating Logout Button in Profile screen only --- */}
        {currentView === 'profile' && profile && (
          <div className="px-5 mt-4 mb-24 shrink-0">
            <button
              onClick={handleLogout}
              className="w-full py-3 border border-red-500/25 bg-red-50 text-red-600 font-extrabold text-xs rounded-2xl hover:bg-red-100 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              🚫 Reset Profile & Clear Cache
            </button>
          </div>
        )}

        {/* =========================================================
            SLIDING CART & CHECKOUT PANEL MODAL (Tailwind & motion)
            ========================================================= */}
        <AnimatePresence>
          {showCart && (
            <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
              
              {/* Overlay Backdrop */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowCart(false)}
                className="absolute inset-0 bg-black/60 cursor-pointer"
              />

              {/* Cart Panel Sheet */}
              <motion.div 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                className="bg-[#FAF9F6] w-full max-w-md h-full z-10 shadow-2xl flex flex-col relative"
              >
                {/* Header */}
                <div className="px-5 pt-6 pb-4 border-b border-slate-200/50 flex items-center justify-between bg-white">
                  <div>
                    <h2 className="text-lg font-black text-brand-navy flex items-center gap-2">
                      <ShoppingBag className="w-5 h-5 text-brand-green animate-bounce" />
                      <span>Your Plan Basket</span>
                    </h2>
                    <p className="text-[10px] text-brand-navy/40 font-bold uppercase tracking-wider mt-0.5">
                      {cartCount} items selected
                    </p>
                  </div>
                  <button 
                    onClick={() => setShowCart(false)}
                    className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-brand-navy cursor-pointer transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Items and Checkout Form */}
                <div className="flex-grow overflow-y-auto px-5 py-4 flex flex-col gap-6">
                  {/* Store Closed Banner inside Cart if ordering is currently outside session hours */}
                  {!storeStatus.isOpen && (
                    <div className="bg-gradient-to-r from-[#0F1E36] to-[#1E3250] text-white p-3.5 rounded-2xl border border-amber-400/40 shadow-sm flex items-start gap-2.5">
                      <Moon className="w-4 h-4 text-amber-300 shrink-0 mt-0.5 animate-pulse" />
                      <div className="flex-grow">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[9.5px] font-black uppercase text-amber-300">● Orders Paused</span>
                          <span className="text-[9px] font-bold text-white/50">{storeStatus.currentTimeString}</span>
                        </div>
                        <p className="text-xs font-black text-white mt-0.5">{storeStatus.headline}</p>
                        <p className="text-[10px] text-white/80 font-medium mt-0.5">{storeStatus.statusMessage}</p>
                      </div>
                    </div>
                  )}

                  {cart.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center flex-grow">
                      <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center text-3xl mb-4">
                        🧺
                      </div>
                      <h3 className="font-extrabold text-brand-navy text-sm">Basket is empty</h3>
                      <p className="text-xs text-slate-400 font-semibold max-w-[200px] mt-1.5 leading-relaxed">
                        Explore customized high-protein meals and start building your gains!
                      </p>
                      <button 
                        onClick={() => setShowCart(false)}
                        className="mt-6 px-4 py-2.5 bg-brand-green text-white font-extrabold text-xs rounded-xl hover:bg-brand-green-hover shadow-sm cursor-pointer"
                      >
                        Explore Menu Options
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Cart Items List */}
                      <div className="flex flex-col gap-3">
                        <h4 className="text-[10px] font-black uppercase tracking-wider text-brand-navy/40 border-b border-slate-100 pb-1.5">
                          Selected Items
                        </h4>
                        
                        {cart.map((item, idx) => {
                          const isSub = item.purchaseOption === 'subscription';
                          const itemPrice = isSub 
                            ? (item.product.monthlyPrice || Math.round(item.product.price * 26 * 0.85)) 
                            : item.product.price;
                          
                          return (
                             <div 
                              key={idx} 
                              className="bg-white border border-slate-200/50 rounded-2xl p-3 flex items-center justify-between shadow-xs hover:border-brand-green/20 transition-all gap-3"
                            >
                              <img 
                                src={item.product.image} 
                                alt={item.product.name} 
                                className="w-12 h-12 rounded-xl object-cover border border-slate-100 shrink-0"
                              />
                              <div className="flex-grow min-w-0">
                                <h5 className="font-extrabold text-xs text-brand-navy truncate">{item.product.name}</h5>
                                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                  {isSub ? (
                                    <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded tracking-wide bg-brand-navy text-brand-green flex items-center gap-0.5">
                                      <span>⚡ 26-Day Sub</span>
                                    </span>
                                  ) : (
                                    <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded tracking-wide bg-slate-100 text-brand-navy/60">
                                      Meal Prep
                                    </span>
                                  )}
                                  <span className="text-[10px] text-brand-green font-black">₹{itemPrice}</span>
                                </div>
                              </div>

                              {/* Controls */}
                              <div className="flex items-center gap-2.5 bg-[#FAF9F6] p-1 rounded-xl shrink-0">
                                <button 
                                  onClick={() => handleUpdateCartQty(idx, item.quantity - 1)}
                                  className="p-1 rounded bg-white text-brand-navy border border-slate-100 hover:bg-gray-50 active:scale-90 cursor-pointer"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="text-xs font-black text-brand-navy w-3 text-center">
                                  {item.quantity}
                                </span>
                                <button 
                                  onClick={() => handleUpdateCartQty(idx, item.quantity + 1)}
                                  className="p-1 rounded bg-white text-brand-navy border border-slate-100 hover:bg-gray-50 active:scale-90 cursor-pointer"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>

                              {/* Delete Trash Button */}
                              <button 
                                onClick={() => handleRemoveFromCart(idx)}
                                className="p-1.5 rounded-xl text-red-500 hover:bg-red-50 cursor-pointer transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          );
                        })}
                      </div>

                      {/* Checkout Details Form Section */}
                      <div className="flex flex-col gap-4 bg-white border border-slate-200/50 rounded-3xl p-4 shadow-xs">
                        <h4 className="text-[10px] font-black uppercase tracking-wider text-brand-navy/40 border-b border-slate-50 pb-2 flex items-center gap-1.5">
                          <span>📋</span>
                          <span>Delivery & Location Setup</span>
                        </h4>

                        {/* Error box */}
                        {checkoutError && (
                          <div className="bg-red-50 border border-red-100 text-red-600 rounded-xl p-3 text-[11px] font-bold flex items-center gap-1.5">
                            <span>⚠️</span>
                            <span>{checkoutError}</span>
                          </div>
                        )}

                        {/* Name Input */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[9px] font-black uppercase tracking-wider text-brand-navy/40">Recipient Name</label>
                          <div className="flex items-center bg-[#FAF9F6] border border-slate-200 rounded-xl px-3 py-2.5">
                            <User className="w-3.5 h-3.5 text-brand-navy/35 mr-2" />
                            <input 
                              type="text" 
                              value={checkoutName}
                              onChange={(e) => setCheckoutName(e.target.value)}
                              placeholder="Recipient Name"
                              className="bg-transparent text-xs font-semibold text-brand-navy w-full focus:outline-none"
                            />
                          </div>
                        </div>

                        {/* Phone Input */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[9px] font-black uppercase tracking-wider text-brand-navy/40">10-Digit Phone Number</label>
                          <div className="flex items-center bg-[#FAF9F6] border border-slate-200 rounded-xl px-3 py-2.5">
                            <span className="text-xs font-bold text-brand-navy/35 mr-2">+91</span>
                            <input 
                              type="tel" 
                              value={checkoutPhone}
                              onChange={(e) => setCheckoutPhone(e.target.value.replace(/[^0-9]/g, ''))}
                              maxLength={10}
                              placeholder="Recipient Phone"
                              className="bg-transparent text-xs font-semibold text-brand-navy w-full focus:outline-none"
                            />
                          </div>
                        </div>

                        {/* Partner Gym Selector */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[9px] font-black uppercase tracking-wider text-brand-navy/40">Partner Gym Delivery Point</label>
                          <select
                            value={selectedGymId}
                            onChange={(e) => setSelectedGymId(e.target.value)}
                            className="bg-[#FAF9F6] border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-brand-navy focus:outline-none w-full cursor-pointer"
                          >
                            {GYMS.map(gym => (
                              <option key={gym.id} value={gym.id}>
                                {gym.name}
                              </option>
                            ))}
                          </select>
                          {GYMS.find(g => g.id === selectedGymId) && (
                            <p className="text-[9px] text-brand-green font-semibold flex items-start gap-1 px-1">
                              <span className="text-xs shrink-0">📍</span>
                              <span>{GYMS.find(g => g.id === selectedGymId)?.location}</span>
                            </p>
                          )}
                        </div>

                        {/* Pre-Order for Tomorrow vs Live Prep Delivery Option */}
                        {cart.some(item => item.purchaseOption === 'single') ? (
                          <div className="flex flex-col gap-2 bg-[#FAF9F6] p-3.5 rounded-2xl border border-slate-200/60">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black uppercase tracking-wider text-brand-navy/50">Single Meal Delivery Type</span>
                              {orderScheduleMode === 'preorder' && (
                                <span className="text-[9px] font-black bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full border border-sky-200">
                                  🗓️ {getTomorrowFormatted().label}
                                </span>
                              )}
                            </div>

                            <div className="grid grid-cols-2 gap-1.5 p-1 bg-white rounded-xl border border-slate-200/60">
                              <button
                                type="button"
                                onClick={() => setOrderScheduleMode('preorder')}
                                className={`py-2 px-2 rounded-lg text-[10.5px] font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                                  orderScheduleMode === 'preorder'
                                    ? 'bg-[#0F1E36] text-white shadow-xs'
                                    : 'text-slate-600 hover:text-brand-navy'
                                }`}
                              >
                                <span>🗓️ Pre-Order (Tomorrow)</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  if (!storeStatus.isOpen) {
                                    setShowClosedStoreModal(true);
                                  } else {
                                    setOrderScheduleMode('instant');
                                  }
                                }}
                                className={`py-2 px-2 rounded-lg text-[10.5px] font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                                  orderScheduleMode === 'instant'
                                    ? 'bg-brand-green text-white shadow-xs'
                                    : storeStatus.isOpen
                                    ? 'text-slate-600 hover:text-brand-navy'
                                    : 'text-slate-400 opacity-60'
                                }`}
                              >
                                <span>⚡ Live Kitchen Prep</span>
                                {!storeStatus.isOpen && <span className="text-[8px] bg-slate-200 text-slate-600 px-1 py-0.2 rounded font-bold">Closed</span>}
                              </button>
                            </div>

                            {orderScheduleMode === 'preorder' ? (
                              <div className="mt-1">
                                <DeliverySlotPicker
                                  value={checkoutTimeSlot}
                                  onChange={setCheckoutTimeSlot}
                                  title="Select Tomorrow's Delivery Slot"
                                  isPreOrder={true}
                                  scheduledDateText={getTomorrowFormatted().label}
                                />
                              </div>
                            ) : (
                              <p className="text-[10px] text-brand-green font-bold bg-brand-green/10 p-2.5 rounded-xl border border-brand-green/20">
                                ⚡ Live order: Fresh kitchen prep starts immediately during our active open session.
                              </p>
                            )}
                          </div>
                        ) : (
                          /* Subscription Delivery Slot Picker */
                          <div className="flex flex-col gap-1.5">
                            <DeliverySlotPicker
                              value={checkoutTimeSlot}
                              onChange={setCheckoutTimeSlot}
                              title="Daily Subscription Delivery Slot"
                            />
                          </div>
                        )}
                      </div>

                      {/* Cost Summary Section */}
                      <div className="border-t border-slate-200/50 pt-4 flex flex-col gap-2 font-semibold text-xs text-brand-navy/75">
                        <div className="flex justify-between">
                          <span>Subtotal</span>
                          <span className="font-extrabold text-brand-navy">₹{cartTotal}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Insulated Pack & Delivery</span>
                          <span className="text-brand-green font-black">FREE</span>
                        </div>
                        <div className="border-t border-slate-100 my-1 pt-2 flex justify-between text-brand-navy text-sm font-black">
                          <span>Total Amount</span>
                          <span className="text-brand-green text-lg">₹{cartTotal}</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Confirm Footer checkout button row */}
                {cart.length > 0 && (
                  <div className="sticky bottom-0 bg-white border-t border-slate-200/50 p-4 z-20">
                    <button
                      onClick={handleCheckoutPrompt}
                      disabled={isCheckingOut}
                      id="btn-cart-order-now"
                      className="w-full py-4 bg-[#6B9E35] hover:bg-[#59832B] disabled:opacity-50 text-white font-extrabold text-sm rounded-2xl shadow-md transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isCheckingOut ? (
                        <span>Placing Meal Orders...</span>
                      ) : (
                        <>
                          <ShieldCheck className="w-5 h-5" />
                          <span>Order Now • ₹{cartTotal}</span>
                        </>
                      )}
                    </button>
                    <p className="text-[9px] text-center text-slate-400 mt-2.5 px-4 leading-relaxed">
                      Delivery packages are packed in insulated boxes and dropped off directly to gym partner desks.
                    </p>
                  </div>
                )}

              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* =========================================================
            CART ORDER CONFIRMATION MODAL OVERLAY (Single & Subscription Confirmation)
            ========================================================= */}
        <AnimatePresence>
          {showCheckoutConfirmModal && (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => !isCheckingOut && setShowCheckoutConfirmModal(false)}
                className="fixed inset-0 bg-[#0F1E36]/75 backdrop-blur-xs cursor-pointer z-40"
              />

              {/* Modal Box */}
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 20 }}
                className="relative bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200/80 z-50 overflow-hidden"
              >
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-brand-green/15 text-brand-green flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-brand-navy">Order Confirmation</h3>
                      <p className="text-[10.5px] font-bold text-slate-400">Insulated Gym Drop-off Delivery</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowCheckoutConfirmModal(false)}
                    disabled={isCheckingOut}
                    className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Prompt */}
                <p className="text-xs font-bold text-brand-navy mt-4 mb-3">
                  {cart.some(i => i.purchaseOption === 'subscription') 
                    ? 'Do you want to confirm this order and subscription?' 
                    : 'Do you want to confirm this meal order?'}
                </p>

                {/* Order Summary Details */}
                <div className="bg-[#FAF9F6] border border-slate-200/60 rounded-2xl p-3.5 flex flex-col gap-2 text-xs font-medium text-brand-navy/80 max-h-48 overflow-y-auto">
                  <div className="flex flex-col gap-1 border-b border-slate-200/40 pb-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Order Items</span>
                    {cart.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs">
                        <span className="font-bold text-brand-navy truncate max-w-[190px]">
                          {item.quantity}x {item.product.name}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-500">
                          {item.purchaseOption === 'subscription' ? '(26-Day Sub)' : '(Single)'}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center pt-0.5">
                    <span className="text-[11px] font-bold text-slate-500">Total Price:</span>
                    <span className="font-black text-brand-green text-sm">₹{cartTotal}</span>
                  </div>

                  <div className="flex justify-between items-start border-t border-slate-200/40 pt-1.5">
                    <span className="text-[11px] font-bold text-slate-500">Partner Gym:</span>
                    <span className="font-bold text-brand-navy text-right max-w-[180px] truncate">
                      {GYMS.find(g => g.id === selectedGymId)?.name || "Gold's Gym"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center border-t border-slate-200/40 pt-1.5">
                    <span className="text-[11px] font-bold text-slate-500">Order Timing:</span>
                    <span className="font-bold text-brand-navy">
                      {cart.some(i => i.purchaseOption === 'single')
                        ? (orderScheduleMode === 'preorder' ? `Pre-Order (${getTomorrowFormatted().label})` : 'Live Prep (Immediate)')
                        : 'Daily Subscription Delivery'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-slate-500">Delivery Slot:</span>
                    <span className="font-bold text-brand-navy">
                      {cart.some(i => i.purchaseOption === 'single') && orderScheduleMode === 'instant'
                        ? 'Immediate Dispatch'
                        : checkoutTimeSlot}
                    </span>
                  </div>

                  <div className="flex justify-between items-center border-t border-slate-200/40 pt-1.5">
                    <span className="text-[11px] font-bold text-slate-500">Recipient:</span>
                    <span className="font-bold text-brand-navy truncate max-w-[190px]">
                      {checkoutName} (+91 {checkoutPhone.replace(/[^0-9]/g, '')})
                    </span>
                  </div>
                </div>

                {/* Confirm & Cancel Buttons */}
                <div className="grid grid-cols-2 gap-2.5 mt-5">
                  <button
                    type="button"
                    onClick={() => setShowCheckoutConfirmModal(false)}
                    disabled={isCheckingOut}
                    className="py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold text-xs transition-all active:scale-95 cursor-pointer text-center"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={executeCheckout}
                    disabled={isCheckingOut}
                    className="py-3 px-4 rounded-xl bg-brand-green hover:bg-brand-green-hover text-white font-extrabold text-xs shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {isCheckingOut ? (
                      <span>Placing Order...</span>
                    ) : (
                      <>
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>Confirm Order</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* =========================================================
            POPUP AUTH / ONBOARDING MODAL OVERLAY (Guest Sign In & Ordering)
            ========================================================= */}
        <AnimatePresence>
          {showAuthModal && (
            <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-0 sm:p-4">
              {/* Backdrop */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowAuthModal(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-xs cursor-pointer z-40"
              />

              {/* Modal Container */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="relative w-full max-w-md bg-[#FAF9F6] sm:rounded-3xl shadow-2xl z-50 min-h-screen sm:min-h-0 sm:max-h-[92vh] overflow-y-auto flex flex-col border border-slate-200/60"
              >
                <Onboarding 
                  onRegister={handleRegister} 
                  onLogin={handleLogin} 
                  onResetPassword={handleResetPassword} 
                  onGoogleSignIn={handleGoogleSignIn}
                  onClose={() => setShowAuthModal(false)}
                  initialStep={authModalStep}
                  noticeMessage={authModalNotice}
                />
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* =========================================================
            STORE CLOSED / SESSION TIMING MODAL OVERLAY
            ========================================================= */}
        <AnimatePresence>
          {showClosedStoreModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowClosedStoreModal(false)}
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
                  onClick={() => setShowClosedStoreModal(false)}
                  className="w-full py-3 bg-[#0F1E36] hover:bg-brand-navy text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer transition-all active:scale-95"
                >
                  Understood, I'll Wait
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* 5-Second Auto-Closing "Added to Favorites" Floating Popup */}
        <AnimatePresence>
          {favoriteToast && favoriteToast.show && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className="fixed bottom-24 inset-x-4 max-w-sm mx-auto z-50 bg-[#0F1E36] text-white p-3.5 rounded-2xl shadow-2xl border border-brand-green/20 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center shrink-0 border border-red-500/30">
                  <Heart className="w-5 h-5 fill-red-400 text-red-400" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-black text-white">Added to Favorites</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse" />
                  </div>
                  <p className="text-[10px] text-white/60 font-semibold truncate max-w-[140px]">
                    {favoriteToast.product.name}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => {
                    setFavoriteToast(null);
                    setCurrentView('profile');
                  }}
                  className="px-3 py-1.5 bg-brand-green hover:bg-brand-green-hover text-white text-xs font-black rounded-xl shadow-xs active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                >
                  Open Favorites
                </button>
                <button
                  onClick={() => setFavoriteToast(null)}
                  className="p-1 text-white/40 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
