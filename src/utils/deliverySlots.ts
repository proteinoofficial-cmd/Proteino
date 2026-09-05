export interface DeliverySection {
  id: 'morning' | 'evening';
  title: string;
  emoji: string;
  hours: string;
  slots: string[];
}

export const MORNING_DELIVERY_SLOTS = [
  '6:00 AM – 8:00 AM',
  '8:00 AM – 10:00 AM'
];

export const EVENING_DELIVERY_SLOTS = [
  '5:00 PM – 7:00 PM',
  '7:00 PM – 9:00 PM',
  '9:00 PM – 10:00 PM'
];

export const ALL_DELIVERY_SECTIONS: DeliverySection[] = [
  {
    id: 'morning',
    title: 'Morning Section',
    emoji: '🌅',
    hours: '6:00 AM – 10:00 AM',
    slots: MORNING_DELIVERY_SLOTS
  },
  {
    id: 'evening',
    title: 'Evening Section',
    emoji: '🌆',
    hours: '5:00 PM – 10:00 PM',
    slots: EVENING_DELIVERY_SLOTS
  }
];

export const GRAND_OPENING_DATE_STR = "7th of September";
export const GRAND_OPENING_SHORT_DATE = "7th Sep";
export const GRAND_OPENING_FULL_DATE = "07 Sep 2026";
export const GRAND_OPENING_ANNOUNCEMENT = "🎉 Proteino is opening on 7th of September! Pre-orders are now live for Grand Opening day delivery directly to your gym desk.";

export function getTomorrowFormatted(): { label: string; dateStr: string; isOpening: boolean; message: string } {
  // Opening date is 7th of September
  return {
    label: "7th Sep (Grand Opening)",
    dateStr: "07 Sep 2026",
    isOpening: true,
    message: "Proteino is opening on 7th of September! Pre-order your meals now for Grand Opening delivery."
  };
}

/**
 * Validates a custom user-typed time string against our delivery operating sessions:
 * Morning: 6:00 AM – 10:00 AM (06:00 to 10:00)
 * Evening: 5:00 PM – 10:00 PM (17:00 to 22:00)
 */
export function validateCustomDeliveryTime(rawInput: string): {
  isValid: boolean;
  message: string;
  normalized?: string;
  section?: 'morning' | 'evening';
} {
  const clean = rawInput.replace(/custom:?\s*/i, '').trim();
  if (!clean) {
    return {
      isValid: false,
      message: 'Please enter a delivery time (e.g. 9:30 AM or 8:00 PM).'
    };
  }

  // Parse time format: "9:30 AM", "9.30 AM", "6 AM", "18:30", "5:00 PM"
  const match = clean.match(/^(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm)?$/i);
  if (!match) {
    return {
      isValid: false,
      message: "We can't deliver at this time. Please enter a valid time (e.g., 9:30 AM or 7:30 PM)."
    };
  }

  let hours = parseInt(match[1], 10);
  const minutes = match[2] ? parseInt(match[2], 10) : 0;
  const meridiem = match[3] ? match[3].toLowerCase() : null;

  if (minutes < 0 || minutes > 59) {
    return {
      isValid: false,
      message: 'Invalid minutes. Please enter valid minutes between 00 and 59.'
    };
  }

  if (hours < 0 || hours > 24) {
    return {
      isValid: false,
      message: 'Invalid hour. Please enter a valid time.'
    };
  }

  // Convert to 24-hour total minutes from midnight
  let totalMinutes = 0;
  if (meridiem) {
    if (hours > 12) {
      return { isValid: false, message: 'Invalid 12-hour format with AM/PM.' };
    }
    let h24 = hours % 12;
    if (meridiem === 'pm') {
      h24 += 12;
    }
    totalMinutes = h24 * 60 + minutes;
  } else {
    // No meridiem provided: if hour between 1 and 4, likely PM or invalid
    if (hours >= 1 && hours <= 4) {
      // 1-4 AM is closed, 1-4 PM is closed
      totalMinutes = (hours + 12) * 60 + minutes;
    } else if (hours >= 5 && hours <= 10) {
      // Ambiguous morning or evening, treat as matching valid slot if possible
      totalMinutes = hours * 60 + minutes;
    } else {
      totalMinutes = hours * 60 + minutes;
    }
  }

  // Morning Window: 6:00 AM (360 min) to 10:00 AM (600 min)
  const morningStart = 6 * 60; // 360
  const morningEnd = 10 * 60; // 600

  // Evening Window: 5:00 PM (17:00 = 1020 min) to 10:00 PM (22:00 = 1320 min)
  const eveningStart = 17 * 60; // 1020
  const eveningEnd = 22 * 60; // 1320

  const isMorning = totalMinutes >= morningStart && totalMinutes <= morningEnd;
  const isEvening = totalMinutes >= eveningStart && totalMinutes <= eveningEnd;

  if (isMorning) {
    const formattedH = Math.floor(totalMinutes / 60);
    const formattedM = totalMinutes % 60;
    const norm = `${formattedH}:${formattedM.toString().padStart(2, '0')} AM`;
    return {
      isValid: true,
      message: 'Valid morning delivery session time.',
      normalized: norm,
      section: 'morning'
    };
  }

  if (isEvening) {
    const h24 = Math.floor(totalMinutes / 60);
    const formattedH = h24 === 12 ? 12 : h24 - 12;
    const formattedM = totalMinutes % 60;
    const norm = `${formattedH}:${formattedM.toString().padStart(2, '0')} PM`;
    return {
      isValid: true,
      message: 'Valid evening delivery session time.',
      normalized: norm,
      section: 'evening'
    };
  }

  return {
    isValid: false,
    message: "We can't deliver at this time! We only operate during Morning (6:00 AM – 10:00 AM) and Evening (5:00 PM – 10:00 PM). Please choose a time within these windows."
  };
}

/**
 * Calculates remaining meals for a subscription based on total plan meals (e.g. 26 for 1 mo, 52 for 2 mo, 78 for 3 mo)
 * and elapsed delivery days excluding Sundays, accurately handling completed plans (100% / full count).
 */
export function calculateMealsRemaining(
  startDateStr: string,
  totalPlanDaysOrMeals: number,
  isPaused: boolean = false,
  pausedAt?: string,
  status?: 'active' | 'completed',
  explicitMealsDelivered?: number
): {
  totalMeals: number;
  mealsDelivered: number;
  mealsRemaining: number;
  percentage: number;
  daysElapsed: number;
} {
  const totalMeals = totalPlanDaysOrMeals === 78 ? 78 : totalPlanDaysOrMeals === 52 ? 52 : 26;

  // If the plan is completed, always return 100% of meals delivered (26 of 26, 52 of 52, or 78 of 78)
  if (status === 'completed') {
    return {
      totalMeals,
      mealsDelivered: totalMeals,
      mealsRemaining: 0,
      percentage: 100,
      daysElapsed: totalMeals
    };
  }

  // If explicit mealsDelivered is recorded, use that
  if (typeof explicitMealsDelivered === 'number' && explicitMealsDelivered >= 0) {
    const delivered = Math.min(totalMeals, explicitMealsDelivered);
    const remaining = Math.max(0, totalMeals - delivered);
    return {
      totalMeals,
      mealsDelivered: delivered,
      mealsRemaining: remaining,
      percentage: Math.min(100, Math.round((delivered / totalMeals) * 100)),
      daysElapsed: delivered + 1
    };
  }

  const start = new Date(startDateStr);
  const now = isPaused && pausedAt ? new Date(pausedAt) : new Date();

  // Calculate calendar days difference
  const diffTime = Math.max(0, now.getTime() - start.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  // Count non-Sunday days elapsed
  let nonSundayDays = 0;
  for (let i = 0; i < diffDays; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    if (d.getDay() !== 0) { // 0 is Sunday
      nonSundayDays++;
    }
  }

  const mealsDelivered = Math.min(totalMeals, Math.max(0, nonSundayDays));
  const mealsRemaining = Math.max(0, totalMeals - mealsDelivered);
  const percentage = Math.min(100, Math.round((mealsDelivered / totalMeals) * 100));

  return {
    totalMeals,
    mealsDelivered,
    mealsRemaining,
    percentage,
    daysElapsed: mealsDelivered + 1
  };
}

