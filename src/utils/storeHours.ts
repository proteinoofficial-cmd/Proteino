import { useState, useEffect } from 'react';

export interface StoreStatus {
  isOpen: boolean;
  isKitchenLive: boolean;
  currentSession: 'morning' | 'evening' | null;
  nextSession: 'morning' | 'evening';
  nextSessionTime: string;
  headline: string;
  shortNotice: string;
  statusMessage: string;
  scheduleText: string;
  openBadgeText: string;
  currentTimeString: string;
}

// Module-level cache for instantaneous cross-component responsiveness
let globalKitchenLive: boolean = true;
try {
  const cached = localStorage.getItem('proteino_kitchen_live');
  if (cached !== null) {
    globalKitchenLive = cached === 'true';
  }
} catch (e) {}

export function setLocalKitchenStatus(isLive: boolean) {
  globalKitchenLive = isLive;
  try {
    localStorage.setItem('proteino_kitchen_live', String(isLive));
  } catch (e) {}
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('proteino_kitchen_status_change', { detail: { isLive } }));
  }
}

/**
 * Operating Hours / Status for Proteino:
 * Controlled by Admin Panel Kitchen On/Off Switch.
 * When ON: Kitchen is Live Now.
 * When OFF: Our kitchen is currently off, please wait for a while.
 */
export function getStoreStatus(isKitchenLive: boolean = globalKitchenLive, date: Date = new Date()): StoreStatus {
  const hours = date.getHours();
  const nextSession: 'morning' | 'evening' = (hours >= 10 && hours < 18) ? 'evening' : 'morning';
  const nextSessionTime = nextSession === 'evening' ? '6:00 PM' : '6:00 AM';
  const currentTimeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

  if (isKitchenLive) {
    return {
      isOpen: true,
      isKitchenLive: true,
      currentSession: hours < 14 ? 'morning' : 'evening',
      nextSession,
      nextSessionTime,
      headline: 'Our Kitchen is Live Now',
      shortNotice: 'Our Kitchen is Live Now • Fresh orders open',
      statusMessage: 'Our kitchen is live and accepting fresh meal orders!',
      scheduleText: 'Morning: 6:00 AM – 10:00 AM | Evening: 6:00 PM – 10:00 PM',
      openBadgeText: 'Live Now',
      currentTimeString
    };
  }

  // Kitchen is OFF
  return {
    isOpen: false,
    isKitchenLive: false,
    currentSession: null,
    nextSession,
    nextSessionTime,
    headline: 'Our kitchen is currently off, please wait for a while',
    shortNotice: 'Our kitchen is currently off, please wait for a while',
    statusMessage: 'Our kitchen is currently off. Please wait for a while or wait for our evening session to place your order.',
    scheduleText: 'Ordering Hours: Morning 6:00 AM – 10:00 AM & Evening 6:00 PM – 10:00 PM',
    openBadgeText: 'Kitchen Off',
    currentTimeString
  };
}

/**
 * Hook to reactively observe store operating hours & live admin toggle in real-time
 * Rapidly polls every 2 seconds for near-instant customer site synchronization
 */
export function useStoreHours(overrideLive?: boolean): StoreStatus {
  const [isLive, setIsLive] = useState<boolean>(() => {
    if (typeof overrideLive === 'boolean') return overrideLive;
    return globalKitchenLive;
  });
  const [status, setStatus] = useState<StoreStatus>(() => getStoreStatus(typeof overrideLive === 'boolean' ? overrideLive : globalKitchenLive));

  useEffect(() => {
    if (typeof overrideLive === 'boolean') {
      setIsLive(overrideLive);
      setStatus(getStoreStatus(overrideLive));
      return;
    }

    let isMounted = true;

    // Rapid polling for instant customer site sync (2 seconds)
    const fetchKitchenState = async () => {
      try {
        const res = await fetch(`/api/kitchen/status?t=${Date.now()}`);
        if (res.ok) {
          const data = await res.json();
          if (data && typeof data.isLive === 'boolean') {
            globalKitchenLive = data.isLive;
            try {
              localStorage.setItem('proteino_kitchen_live', String(data.isLive));
            } catch (e) {}
            if (isMounted) {
              setIsLive(data.isLive);
              setStatus(getStoreStatus(data.isLive));
            }
          }
        }
      } catch (err) {
        // Silently preserve current status on network flutter
      }
    };

    fetchKitchenState();
    const interval = setInterval(fetchKitchenState, 2000); // 2-second fast sync

    // Instant sync across tabs & components in same window
    const handleCustomChange = (e: any) => {
      if (e?.detail && typeof e.detail.isLive === 'boolean') {
        setIsLive(e.detail.isLive);
        setStatus(getStoreStatus(e.detail.isLive));
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'proteino_kitchen_live' && e.newValue !== null) {
        const updated = e.newValue === 'true';
        setIsLive(updated);
        setStatus(getStoreStatus(updated));
      }
    };

    window.addEventListener('proteino_kitchen_status_change', handleCustomChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener('proteino_kitchen_status_change', handleCustomChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [overrideLive]);

  return status;
}
