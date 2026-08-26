import { useState, useEffect } from 'react';
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
  Key
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

  // --- UI Routing States ---
  const [currentView, setCurrentView] = useState<'dashboard' | 'product_details' | 'active_plans' | 'orders' | 'profile' | 'subscriptions' | 'admin'>('dashboard');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showCart, setShowCart] = useState(false);

  // --- Auth Modal Overlay State ---
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalStep, setAuthModalStep] = useState<'welcome' | 'register' | 'login' | 'forgot'>('welcome');
  const [authModalNotice, setAuthModalNotice] = useState<string>('');

  // --- Floating Non-Veg Coming Soon Notice State ---
  const [showFloatingNotice, setShowFloatingNotice] = useState<boolean>(() => {
    return localStorage.getItem('proteino_hide_nonveg_floating_notice') !== 'true';
  });

  const handleDismissNotice = () => {
    setShowFloatingNotice(false);
    localStorage.setItem('proteino_hide_nonveg_floating_notice', 'true');
  };

  // --- Checkout Form States ---
  const [checkoutName, setCheckoutName] = useState('');
  const [checkoutPhone, setCheckoutPhone] = useState('');
  const [selectedGymId, setSelectedGymId] = useState('g1');
  const [checkoutTimeSlot, setCheckoutTimeSlot] = useState('2 PM');
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

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
    if (profile) {
      fetchUserData();
    }
  }, [profile]);

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
      const next = prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id];
      localStorage.setItem('proteino_favorites', JSON.stringify(next));
      return next;
    });
  };

  // --- Cart Actions ---
  const handleAddToCart = (item: CartItem) => {
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
  const handleCheckout = async () => {
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
    if (checkoutPhone.length < 10) {
      setCheckoutError('Please enter a valid 10-digit mobile number');
      return;
    }
    setCheckoutError('');
    setIsCheckingOut(true);

    const gym = GYMS.find(g => g.id === selectedGymId) || GYMS[0];
    const totalAmount = cart.reduce((acc, item) => {
      if (item.purchaseOption === 'subscription') {
        const subPrice = item.product.monthlyPrice || Math.round(item.product.price * 26 * 0.85);
        return acc + (subPrice * item.quantity);
      }
      return acc + (item.product.price * item.quantity);
    }, 0);

    // Filter single meal items for placing the single delivery order
    const singleMealItems = cart.filter(item => item.purchaseOption === 'single');

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

      // 1. If we have single meal items, place a single order on the server
      if (singleMealItems.length > 0) {
        const orderPayload = {
          items: singleMealItems,
          total: singleMealItems.reduce((acc, item) => acc + (item.product.price * item.quantity), 0),
          status: 'cooking' as const,
          deliveryTimeRemaining: 25, // mins for simulator countdown
          customerName: checkoutName,
          customerPhone: checkoutPhone,
          gymName: gym.name,
          gymLocation: gym.location,
          deliveryTimeSlot: checkoutTimeSlot,
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
      const subscriptionItems = cart.filter(item => item.purchaseOption === 'subscription');
      if (subscriptionItems.length > 0) {
        for (const item of subscriptionItems) {
          const itemSubPrice = item.product.monthlyPrice || Math.round(item.product.price * 26 * 0.85);
          for (let q = 0; q < item.quantity; q++) {
            const subPayload = {
              planId: item.product.id,
              planName: `${item.product.name} 26-Day Subscription`,
              price: itemSubPrice,
              durationDays: 26,
              customerName: checkoutName,
              customerPhone: checkoutPhone,
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
      setShowCart(false);

      // Refresh data
      await fetchUserData();

      // Redirect view based on checkout item types
      if (subscriptionItems.length > 0) {
        setCurrentView('active_plans');
      } else {
        setCurrentView('orders');
      }

    } catch (err: any) {
      setCheckoutError(err.message || 'Server checkout error. Please try again.');
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
    if (!profile) {
      setAuthModalNotice('Please sign in or create an account to activate your gym meal subscription.');
      setAuthModalStep('welcome');
      setShowAuthModal(true);
      return;
    }

    try {
      const res = await apiFetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSub)
      });
      if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
        const savedSub = await res.json();
        setActiveSubscriptions(prev => [savedSub, ...prev]);
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

  const handleTogglePauseDirect = async () => {
    if (activeSubscriptions.length === 0) return;
    const subId = activeSubscriptions[0].id;
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
            />
          )}

          {currentView === 'profile' && (
            <ProfileView 
              profile={profile}
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
                currentView === 'product_details' ? 'bottom-22' : 'bottom-20'
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

                        {/* Gym Dropdown Selector (Mandatory for subscription prep delivery) */}
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

                        {/* Time Slot Picker */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[9px] font-black uppercase tracking-wider text-brand-navy/40">Preferred Delivery Slot</label>
                          <div className="grid grid-cols-4 gap-1.5 mt-1">
                            {['12 PM', '2 PM', '4 PM', '6 PM'].map((slot) => (
                              <button
                                key={slot}
                                type="button"
                                onClick={() => setCheckoutTimeSlot(slot)}
                                className={`py-2 px-1 rounded-xl text-[9px] font-black text-center transition-all cursor-pointer border ${
                                  checkoutTimeSlot === slot
                                    ? 'bg-brand-green border-brand-green text-white shadow-sm'
                                    : 'bg-[#FAF9F6] border-slate-200 text-brand-navy/60 hover:bg-slate-100'
                                }`}
                              >
                                {slot}
                              </button>
                            ))}
                          </div>
                        </div>
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
                      onClick={handleCheckout}
                      disabled={isCheckingOut}
                      className="w-full py-4 bg-[#6B9E35] hover:bg-[#59832B] disabled:opacity-50 text-white font-extrabold text-sm rounded-2xl shadow-md transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isCheckingOut ? (
                        <span>Placing Meal Orders...</span>
                      ) : (
                        <>
                          <ShieldCheck className="w-5 h-5" />
                          <span>Confirm Order & Checkout (₹{cartTotal})</span>
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

      </div>
    </div>
  );
}
