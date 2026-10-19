/**
 * Hotel Ambience Inn - Date Utilities
 * Timezone: Asia/Kolkata (IST: UTC+5:30)
 * 
 * Provides robust timezone-aware date parsing, formatting, boundary checks,
 * and night calculations for hotel reservation workflows.
 */

export const HOTEL_TIMEZONE = 'Asia/Kolkata';

/**
 * Returns today's calendar date in YYYY-MM-DD format according to Asia/Kolkata timezone.
 * Using Intl.DateTimeFormat with 'en-CA' outputs standard ISO date format (YYYY-MM-DD).
 * 
 * @param {Date} [now=new Date()] Optional reference date for testing boundaries
 * @returns {string} Date string in YYYY-MM-DD format
 */
export const getTodayKolkata = (now = new Date()) => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: HOTEL_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(now);
};

/**
 * Validates whether a string is a strictly valid YYYY-MM-DD calendar date.
 * 
 * @param {string} dateStr
 * @returns {boolean}
 */
export const isValidDateString = (dateStr) => {
  if (typeof dateStr !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return false;
  }
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }

  // Check actual calendar days in month (handling leap years)
  const d = new Date(Date.UTC(year, month - 1, day));
  return (
    d.getUTCFullYear() === year &&
    d.getUTCMonth() === month - 1 &&
    d.getUTCDate() === day
  );
};

/**
 * Adds a specified number of days to a YYYY-MM-DD date string.
 * Uses UTC date calculations to avoid daylight saving or local browser timezone shifts.
 * 
 * @param {string} dateStr YYYY-MM-DD string
 * @param {number} days Number of days to add (default: 1)
 * @returns {string} New YYYY-MM-DD string
 */
export const addDays = (dateStr, days = 1) => {
  if (!isValidDateString(dateStr)) {
    return '';
  }
  const [year, month, day] = dateStr.split('-').map(Number);
  const utcDate = new Date(Date.UTC(year, month - 1, day + days));
  const y = utcDate.getUTCFullYear();
  const m = String(utcDate.getUTCMonth() + 1).padStart(2, '0');
  const d = String(utcDate.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/**
 * Returns the next calendar day string (YYYY-MM-DD).
 * 
 * @param {string} dateStr
 * @returns {string}
 */
export const getNextDayKolkata = (dateStr) => {
  return addDays(dateStr, 1);
};

/**
 * Calculates the exact integer number of nights between check-in and check-out.
 * Returns 0 or negative if checkOut <= checkIn, or NaN if invalid.
 * 
 * @param {string} checkIn YYYY-MM-DD
 * @param {string} checkOut YYYY-MM-DD
 * @returns {number}
 */
export const calculateNights = (checkIn, checkOut) => {
  if (!isValidDateString(checkIn) || !isValidDateString(checkOut)) {
    return 1;
  }
  const [y1, m1, d1] = checkIn.split('-').map(Number);
  const [y2, m2, d2] = checkOut.split('-').map(Number);

  const t1 = Date.UTC(y1, m1 - 1, d1);
  const t2 = Date.UTC(y2, m2 - 1, d2);

  const diffDays = Math.round((t2 - t1) / (1000 * 3600 * 24));
  return diffDays > 0 ? diffDays : 0;
};

/**
 * Comprehensive stay dates validator according to hotel policies:
 * 1. Both dates must be present and valid YYYY-MM-DD formats.
 * 2. Check-in date cannot be prior to today in Asia/Kolkata timezone.
 * 3. Check-out date must be strictly after check-in date.
 * 4. Duration must be between 1 and 90 nights.
 * 
 * @param {string} checkIn
 * @param {string} checkOut
 * @param {string} [referenceDateStr] Optional today override for testing boundaries
 * @returns {{ isValid: boolean, error?: string, nights: number }}
 */
export const validateStayDates = (checkIn, checkOut, referenceDateStr) => {
  if (!checkIn) {
    return { isValid: false, error: 'Please select a check-in date.', nights: 0 };
  }
  if (!isValidDateString(checkIn)) {
    return { isValid: false, error: 'Invalid check-in date format (expected YYYY-MM-DD).', nights: 0 };
  }

  const today = referenceDateStr && isValidDateString(referenceDateStr)
    ? referenceDateStr
    : getTodayKolkata();

  if (checkIn < today) {
    return {
      isValid: false,
      error: 'Check-in date cannot be in the past (minimum check-in is today).',
      nights: 0
    };
  }

  if (!checkOut) {
    return { isValid: false, error: 'Please select a check-out date.', nights: 0 };
  }
  if (!isValidDateString(checkOut)) {
    return { isValid: false, error: 'Invalid check-out date format (expected YYYY-MM-DD).', nights: 0 };
  }

  if (checkOut <= checkIn) {
    return {
      isValid: false,
      error: 'Check-out date must be strictly after check-in date.',
      nights: 0
    };
  }

  const nights = calculateNights(checkIn, checkOut);
  if (nights < 1) {
    return {
      isValid: false,
      error: 'A minimum stay of 1 night is required.',
      nights: 0
    };
  }

  if (nights > 90) {
    return {
      isValid: false,
      error: 'Stays longer than 90 nights require direct concierge arrangement.',
      nights
    };
  }

  return { isValid: true, nights };
};

/**
 * Returns default check-in and check-out dates starting from today in Asia/Kolkata.
 * Default check-in: today
 * Default check-out: tomorrow (+1 night)
 * 
 * @returns {{ checkIn: string, checkOut: string }}
 */
export const getDefaultStayDates = () => {
  const checkIn = getTodayKolkata();
  const checkOut = getNextDayKolkata(checkIn);
  return { checkIn, checkOut };
};
