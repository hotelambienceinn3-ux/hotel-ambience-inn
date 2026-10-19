/**
 * Hotel Ambience Inn - Validation Utilities
 * 
 * Provides strict, accessible, and comprehensive validation for:
 * - Guest Full Name
 * - Gmail-only Email Addresses (@gmail.com)
 * - Indian Mobile Phone Numbers (+91 format)
 * - Age, Gender, and Special Requests
 * - Stay Dates and Room Guest Capacities
 */

import { validateStayDates, getTodayKolkata } from './dateUtils.js';

/**
 * Validates a guest's full name.
 * - Trims whitespace.
 * - Rejects empty or whitespace-only names.
 * - Enforces minimum 2 and maximum 100 characters.
 * - Supports Unicode letters, spaces, apostrophes, and hyphens (multilingual name safe).
 * - Rejects names containing numbers or special punctuation.
 * 
 * @param {string} name
 * @returns {{ isValid: boolean, error?: string, value: string }}
 */
export const validateFullName = (name) => {
  if (name === null || name === undefined) {
    return { isValid: false, error: 'Full name is required.', value: '' };
  }

  const trimmed = String(name).trim();

  if (trimmed.length === 0) {
    return { isValid: false, error: 'Full name is required.', value: '' };
  }

  if (trimmed.length < 2) {
    return { isValid: false, error: 'Full name must be at least 2 characters.', value: trimmed };
  }

  if (trimmed.length > 100) {
    return { isValid: false, error: 'Full name cannot exceed 100 characters.', value: trimmed };
  }

  // Unicode letters, spaces, apostrophes, hyphens, and dots (e.g. Dr. or middle initials)
  // \p{L} matches any unicode letter, \p{M} matches combining marks/accents
  const namePattern = /^[\p{L}\p{M}][\p{L}\p{M}'’.\-\s]*[\p{L}\p{M}.]$/u;
  if (!namePattern.test(trimmed)) {
    return {
      isValid: false,
      error: 'Please enter a valid full name (letters, spaces, hyphens, and apostrophes only).',
      value: trimmed
    };
  }

  return { isValid: true, value: trimmed };
};

/**
 * Validates Gmail-only email addresses (@gmail.com).
 * 
 * Strict specifications:
 * 1. Trims surrounding whitespace.
 * 2. Normalizes the domain for case-insensitive comparison.
 * 3. Requires a valid, non-empty local part.
 * 4. Requires the exact domain "gmail.com" (strictly rejects user@gmail, user@example.com, user@gmail.com.fake, etc.).
 * 5. Strictly avoids loose checks like string.includes("@gmail.com").
 * 
 * Note: Domain validation confirms syntax and domain specification,
 * but does not verify physical mailbox ownership without email confirmation links.
 * 
 * @param {string} email
 * @returns {{ isValid: boolean, error?: string, normalizedEmail: string }}
 */
export const validateGmail = (email) => {
  if (email === null || email === undefined) {
    return { isValid: false, error: 'Email address is required.', normalizedEmail: '' };
  }

  const trimmed = String(email).trim();

  if (trimmed.length === 0) {
    return { isValid: false, error: 'Email address is required.', normalizedEmail: '' };
  }

  if (trimmed.length > 254) {
    return { isValid: false, error: 'Email address is too long (maximum 254 characters).', normalizedEmail: trimmed };
  }

  // Check for exactly one '@' character
  const parts = trimmed.split('@');
  if (parts.length !== 2) {
    return {
      isValid: false,
      error: 'Please enter a valid Gmail address (e.g., yourname@gmail.com).',
      normalizedEmail: trimmed
    };
  }

  const [localPart, domainPart] = parts;
  const normalizedDomain = domainPart.toLowerCase();

  // Strict domain check: must be exactly "gmail.com"
  if (normalizedDomain !== 'gmail.com') {
    return {
      isValid: false,
      error: 'A valid @gmail.com email address is required (e.g. name@gmail.com).',
      normalizedEmail: trimmed
    };
  }

  // Local part validation:
  // - Cannot be empty
  // - Max 64 chars
  // - Allowed chars: a-z, A-Z, 0-9, dots, hyphens, plus signs, underscores
  // - Cannot start or end with a dot
  // - Cannot have consecutive dots
  if (localPart.length === 0) {
    return {
      isValid: false,
      error: 'Email username cannot be empty.',
      normalizedEmail: trimmed
    };
  }

  if (localPart.length > 64) {
    return {
      isValid: false,
      error: 'Email username is too long (maximum 64 characters).',
      normalizedEmail: trimmed
    };
  }

  if (localPart.startsWith('.') || localPart.endsWith('.')) {
    return {
      isValid: false,
      error: 'Email username cannot start or end with a period.',
      normalizedEmail: trimmed
    };
  }

  if (localPart.includes('..')) {
    return {
      isValid: false,
      error: 'Email username cannot contain consecutive periods.',
      normalizedEmail: trimmed
    };
  }

  const localPartRegex = /^[a-zA-Z0-9._%+-]+$/;
  if (!localPartRegex.test(localPart)) {
    return {
      isValid: false,
      error: 'Email contains invalid characters.',
      normalizedEmail: trimmed
    };
  }

  const normalizedEmail = `${localPart}@${normalizedDomain}`;
  return { isValid: true, normalizedEmail };
};

/**
 * Validates and normalizes Indian mobile phone numbers (+91).
 * 
 * Rules:
 * - Indian mobile numbers are 10 digits starting with 6, 7, 8, or 9.
 * - Can optionally have a "+91", "91", or "0" prefix.
 * - Supports clean formatting with spaces/hyphens.
 * - Normalizes to canonical format "+91 XXXXX XXXXX".
 * - Rejects malformed, too-short (<10), too-long (>10 digits after prefix), or invalid starting digits.
 * - Preserves digits without alteration.
 * 
 * @param {string} phone
 * @returns {{ isValid: boolean, error?: string, normalizedPhone: string }}
 */
export const validateIndianPhone = (phone) => {
  if (phone === null || phone === undefined) {
    return { isValid: false, error: 'Mobile phone number is required.', normalizedPhone: '' };
  }

  const trimmed = String(phone).trim();

  if (trimmed.length === 0) {
    return { isValid: false, error: 'Mobile phone number is required.', normalizedPhone: '' };
  }

  // Strip all spaces, dashes, parentheses
  let digitsOnly = trimmed.replace(/[\s\-()]/g, '');

  // Handle + prefix
  if (digitsOnly.startsWith('+')) {
    if (!digitsOnly.startsWith('+91')) {
      return {
        isValid: false,
        error: 'Only Indian mobile numbers (+91) are currently accepted.',
        normalizedPhone: trimmed
      };
    }
    digitsOnly = digitsOnly.slice(3); // Remove +91
  } else if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
    digitsOnly = digitsOnly.slice(2); // Remove leading 91
  } else if (digitsOnly.length === 11 && digitsOnly.startsWith('0')) {
    digitsOnly = digitsOnly.slice(1); // Remove trunk 0
  }

  // Must now be strictly 10 digits
  if (!/^\d+$/.test(digitsOnly)) {
    return {
      isValid: false,
      error: 'Phone number must contain only numbers.',
      normalizedPhone: trimmed
    };
  }

  if (digitsOnly.length < 10) {
    return {
      isValid: false,
      error: `Phone number is too short (${digitsOnly.length}/10 digits).`,
      normalizedPhone: trimmed
    };
  }

  if (digitsOnly.length > 10) {
    return {
      isValid: false,
      error: `Phone number is too long (${digitsOnly.length}/10 digits).`,
      normalizedPhone: trimmed
    };
  }

  // Indian mobile numbers must start with 6, 7, 8, or 9
  if (!/^[6-9]/.test(digitsOnly)) {
    return {
      isValid: false,
      error: 'Valid Indian mobile numbers must begin with 6, 7, 8, or 9.',
      normalizedPhone: trimmed
    };
  }

  // Canonical display format: +91 XXXXX XXXXX
  const formatted = `+91 ${digitsOnly.slice(0, 5)} ${digitsOnly.slice(5)}`;
  return { isValid: true, normalizedPhone: formatted, digitsOnly };
};

/**
 * Validates age (optional field).
 * If provided: must be an integer between 18 and 120.
 * If empty/undefined/null: valid (as field is optional).
 * 
 * @param {string|number} age
 * @returns {{ isValid: boolean, error?: string, value?: number|null }}
 */
export const validateAge = (age) => {
  if (age === null || age === undefined || String(age).trim() === '') {
    return { isValid: true, value: null };
  }

  const trimmed = String(age).trim();
  const num = Number(trimmed);

  if (!/^\d+$/.test(trimmed) || isNaN(num)) {
    return { isValid: false, error: 'Age must be a valid whole number.', value: null };
  }

  if (num < 18) {
    return {
      isValid: false,
      error: 'Primary registered guest must be at least 18 years of age.',
      value: num
    };
  }

  if (num > 120) {
    return {
      isValid: false,
      error: 'Please enter a valid age between 18 and 120.',
      value: num
    };
  }

  return { isValid: true, value: num };
};

/**
 * Validates gender choice (optional field).
 * Allowed choices: 'Male', 'Female', 'Other' (or empty).
 * 
 * @param {string} gender
 * @returns {{ isValid: boolean, error?: string, value: string }}
 */
export const validateGender = (gender) => {
  if (!gender || String(gender).trim() === '') {
    return { isValid: true, value: '' };
  }

  const allowed = ['Male', 'Female', 'Other'];
  const trimmed = String(gender).trim();

  if (!allowed.includes(trimmed)) {
    return {
      isValid: false,
      error: 'Please select a valid gender option (Male, Female, or Other).',
      value: trimmed
    };
  }

  return { isValid: true, value: trimmed };
};

/**
 * Validates special requests text (optional).
 * Treated strictly as untrusted text, never rendered as HTML.
 * Limits length to 500 characters.
 * 
 * @param {string} notes
 * @returns {{ isValid: boolean, error?: string, value: string }}
 */
export const validateSpecialRequests = (notes) => {
  if (notes === null || notes === undefined || String(notes).trim() === '') {
    return { isValid: true, value: '' };
  }

  const trimmed = String(notes).trim();

  if (trimmed.length > 500) {
    return {
      isValid: false,
      error: `Special requests cannot exceed 500 characters (${trimmed.length}/500).`,
      value: trimmed
    };
  }

  return { isValid: true, value: trimmed };
};

/**
 * Comprehensive validation of the Primary Guest form data.
 * 
 * @param {Object} formData
 * @returns {{ isValid: boolean, errors: Record<string, string>, normalized: Object }}
 */
export const validateGuestForm = (formData) => {
  const errors = {};
  const normalized = {};

  // 1. Full Name
  const nameRes = validateFullName(formData.guestName);
  if (!nameRes.isValid) {
    errors.guestName = nameRes.error;
  } else {
    normalized.guestName = nameRes.value;
  }

  // 2. Email (Gmail only)
  const emailRes = validateGmail(formData.guestEmail);
  if (!emailRes.isValid) {
    errors.guestEmail = emailRes.error;
  } else {
    normalized.guestEmail = emailRes.normalizedEmail;
  }

  // 3. Mobile Phone
  const phoneRes = validateIndianPhone(formData.guestPhone);
  if (!phoneRes.isValid) {
    errors.guestPhone = phoneRes.error;
  } else {
    normalized.guestPhone = phoneRes.normalizedPhone;
  }

  // 4. Age (optional)
  const ageRes = validateAge(formData.guestAge);
  if (!ageRes.isValid) {
    errors.guestAge = ageRes.error;
  } else {
    normalized.guestAge = ageRes.value;
  }

  // 5. Gender (optional)
  const genderRes = validateGender(formData.guestGender);
  if (!genderRes.isValid) {
    errors.guestGender = genderRes.error;
  } else {
    normalized.guestGender = genderRes.value;
  }

  // 6. Special Requests (optional)
  const notesRes = validateSpecialRequests(formData.specialRequests);
  if (!notesRes.isValid) {
    errors.specialRequests = notesRes.error;
  } else {
    normalized.specialRequests = notesRes.value;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    normalized
  };
};

/**
 * Validates whether a value is a valid UUID string (standard 8-4-4-4-12 hex format).
 * 
 * @param {*} value
 * @returns {boolean}
 */
export const isValidUuid = (value) => {
  if (typeof value !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value.trim());
};

export { validateStayDates, getTodayKolkata };

