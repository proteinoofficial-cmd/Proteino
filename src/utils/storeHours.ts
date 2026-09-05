import { useState, useEffect } from 'react';

export interface StoreStatus {
  isOpen: boolean;
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

/**
 * Operating Hours for Proteino:
 * Morning Session: 6:00 AM to 10:00 AM (06:00 - 10:00)
 * Evening Session: 6:00 PM to 10:00 PM (18:00 - 22:00)
 */
export function getStoreStatus(date: Date = new Date()): StoreStatus {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const currentMinutes = hours * 60 + minutes;

  const MORNING_START = 6 * 60;   // 06:00 AM -> 360
  const MORNING_END = 10 * 60;    // 10:00 AM -> 600
  const EVENING_START = 18 * 60;  // 06:00 PM -> 1080
  const EVENING_END = 22 * 60;    // 10:00 PM -> 1320

  const isMorningOpen = currentMinutes >= MORNING_START && currentMinutes < MORNING_END;
  const isEveningOpen = currentMinutes >= EVENING_START && currentMinutes < EVENING_END;
  const isOpen = isMorningOpen || isEveningOpen;

  const currentTimeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

  if (isMorningOpen) {
    return {
      isOpen: true,
      currentSession: 'morning',
      nextSession: 'evening',
      nextSessionTime: '6:00 PM',
      headline: 'Morning Session is Open!',
      shortNotice: 'Morning Session Live • Orders Open (6:00 AM – 10:00 AM)',
      statusMessage: 'Accepting fresh meal & gym subscription orders (6:00 AM – 10:00 AM).',
      scheduleText: 'Morning: 6:00 AM – 10:00 AM | Evening: 6:00 PM – 10:00 PM',
      openBadgeText: 'Morning Session Open (6–10 AM)',
      currentTimeString
    };
  }

  if (isEveningOpen) {
    return {
      isOpen: true,
      currentSession: 'evening',
      nextSession: 'morning',
      nextSessionTime: '6:00 AM',
      headline: 'Evening Session is Open!',
      shortNotice: 'Evening Session Live • Orders Open (6:00 PM – 10:00 PM)',
      statusMessage: 'Accepting fresh meal & gym subscription orders (6:00 PM – 10:00 PM).',
      scheduleText: 'Morning: 6:00 AM – 10:00 AM | Evening: 6:00 PM – 10:00 PM',
      openBadgeText: 'Evening Session Open (6–10 PM)',
      currentTimeString
    };
  }

  // Store is CLOSED: Determine which session opens next
  if (currentMinutes >= MORNING_END && currentMinutes < EVENING_START) {
    // Between 10:00 AM and 6:00 PM (e.g., 1:00 PM)
    return {
      isOpen: false,
      currentSession: null,
      nextSession: 'evening',
      nextSessionTime: '6:00 PM',
      headline: 'Evening Session will open at 6:00 PM',
      shortNotice: 'Evening Session opens at 6:00 PM • Please wait',
      statusMessage: 'Our Proteino Evening Session will open at 6:00 PM, please wait to place your order.',
      scheduleText: 'Ordering Hours: Morning 6:00 AM – 10:00 AM & Evening 6:00 PM – 10:00 PM',
      openBadgeText: 'Opens 6:00 PM',
      currentTimeString
    };
  } else {
    // Between 10:00 PM and 6:00 AM (e.g., 1:00 AM night)
    return {
      isOpen: false,
      currentSession: null,
      nextSession: 'morning',
      nextSessionTime: '6:00 AM',
      headline: 'Morning Session will open at 6:00 AM',
      shortNotice: 'Morning Session opens at 6:00 AM • Please wait',
      statusMessage: 'Our Proteino Morning Session will open at 6:00 AM, please wait to place your order.',
      scheduleText: 'Ordering Hours: Morning 6:00 AM – 10:00 AM & Evening 6:00 PM – 10:00 PM',
      openBadgeText: 'Opens 6:00 AM',
      currentTimeString
    };
  }
}

/**
 * Hook to reactively observe store operating hours in real-time
 */
export function useStoreHours(): StoreStatus {
  const [status, setStatus] = useState<StoreStatus>(() => getStoreStatus());

  useEffect(() => {
    const update = () => setStatus(getStoreStatus());
    update();
    const interval = setInterval(update, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, []);

  return status;
}
