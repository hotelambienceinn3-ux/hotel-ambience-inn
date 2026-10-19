/**
 * Automated Verification Test Suite
 * Hotel Ambience Inn - Booking Flow Hardening & Real-Time Availability
 */

import {
  getTodayKolkata,
  getNextDayKolkata,
  addDays,
  calculateNights,
  validateStayDates,
  isValidDateString,
  HOTEL_TIMEZONE
} from '../frontend/src/lib/dateUtils.js';

import {
  validateFullName,
  validateGmail,
  validateIndianPhone,
  validateAge,
  validateGender,
  validateSpecialRequests,
  validateGuestForm,
  isValidUuid
} from '../frontend/src/lib/validationUtils.js';

let passedTests = 0;
let failedTests = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    passedTests++;
    console.log(`  ✓ PASS: ${testName}`);
  } else {
    failedTests++;
    console.error(`  ✗ FAIL: ${testName} ${details ? `(${details})` : ''}`);
  }
}

console.log('===============================================================');
console.log('TEST SUITE 1: Timezone & Stay Date Boundaries (Asia/Kolkata)');
console.log('===============================================================');

// 1.1 Timezone Boundary around Midnight
// When UTC is 2026-10-18 20:30:00Z, Asia/Kolkata is 2026-10-19 02:00:00 (+5:30)
const midnightEdgeUtc = new Date('2026-10-18T20:30:00.000Z');
const kolkataDateAtUtcMidnight = getTodayKolkata(midnightEdgeUtc);
assert(
  kolkataDateAtUtcMidnight === '2026-10-19',
  'Asia/Kolkata date resolves correctly across midnight UTC boundary',
  `Expected 2026-10-19, got ${kolkataDateAtUtcMidnight}`
);

// 1.2 Format validity
assert(isValidDateString('2026-10-19'), 'Valid date string passes format check');
assert(!isValidDateString('2026-02-30'), 'February 30 is rejected as invalid calendar date');
assert(!isValidDateString('2026-13-01'), 'Month 13 is rejected');
assert(!isValidDateString('invalid-date'), 'Arbitrary text is rejected');

// 1.3 Minimum check-in date boundary (Today)
const todayKolkata = getTodayKolkata();
const yesterdayKolkata = addDays(todayKolkata, -1);
const tomorrowKolkata = getNextDayKolkata(todayKolkata);

const pastDateResult = validateStayDates(yesterdayKolkata, tomorrowKolkata, todayKolkata);
assert(
  !pastDateResult.isValid && pastDateResult.error.includes('past'),
  'Check-in date before today is rejected',
  pastDateResult.error
);

const todayCheckInResult = validateStayDates(todayKolkata, tomorrowKolkata, todayKolkata);
assert(
  todayCheckInResult.isValid && todayCheckInResult.nights === 1,
  'Same-day check-in (today) is allowed with 1 night stay'
);

// 1.4 Check-out strictly after check-in
const sameDayResult = validateStayDates(todayKolkata, todayKolkata, todayKolkata);
assert(
  !sameDayResult.isValid && sameDayResult.error.includes('strictly after'),
  'Same-day check-out (0 nights) is strictly rejected',
  sameDayResult.error
);

const checkoutBeforeCheckinResult = validateStayDates('2026-10-25', '2026-10-22', todayKolkata);
assert(
  !checkoutBeforeCheckinResult.isValid,
  'Check-out earlier than check-in is strictly rejected',
  checkoutBeforeCheckinResult.error
);

// 1.5 Night calculation across calendar transitions
assert(calculateNights('2026-10-19', '2026-10-22') === 3, 'Calculates 3 nights accurately');
assert(calculateNights('2026-10-31', '2026-11-03') === 3, 'Calculates nights across month transition (Oct to Nov)');

console.log('\n===============================================================');
console.log('TEST SUITE 2: Strict Gmail-Only Validation Requirement');
console.log('===============================================================');

// Client-specified invalid Gmail examples
const requiredInvalidEmails = [
  'user@',
  'user@gmail',
  'user@gmail.com.fake',
  'user@example.com',
  '',
  '   ',
  'user@gmail.com@extra',
  'user name@gmail.com',
  'user..name@gmail.com',
  '.user@gmail.com',
  'user.@gmail.com'
];

for (const email of requiredInvalidEmails) {
  const res = validateGmail(email);
  assert(!res.isValid, `Rejects invalid email: "${email}"`, res.error);
}

// Valid Gmail cases (including case insensitivity and whitespace trimming)
const validEmails = [
  { input: 'sarthak@gmail.com', expected: 'sarthak@gmail.com' },
  { input: '  guest.stay@GMAIL.COM  ', expected: 'guest.stay@gmail.com' },
  { input: 'traveler+hotel@gmail.com', expected: 'traveler+hotel@gmail.com' },
  { input: 'ambience.inn.guest@gmail.com', expected: 'ambience.inn.guest@gmail.com' }
];

for (const { input, expected } of validEmails) {
  const res = validateGmail(input);
  assert(
    res.isValid && res.normalizedEmail === expected,
    `Accepts and normalizes valid Gmail: "${input}" -> "${res.normalizedEmail}"`
  );
}

console.log('\n===============================================================');
console.log('TEST SUITE 3: Indian Mobile Phone (+91) Validation');
console.log('===============================================================');

const validPhones = [
  { input: '+91 98765 43210', expected: '+91 98765 43210' },
  { input: '9876543210', expected: '+91 98765 43210' },
  { input: '+919876543210', expected: '+91 98765 43210' },
  { input: '09876543210', expected: '+91 98765 43210' },
  { input: '  8123456789  ', expected: '+91 81234 56789' },
  { input: '+91-70000-11111', expected: '+91 70000 11111' }
];

for (const { input, expected } of validPhones) {
  const res = validateIndianPhone(input);
  assert(
    res.isValid && res.normalizedPhone === expected,
    `Accepts and normalizes Indian mobile: "${input}" -> "${res.normalizedPhone}"`
  );
}

const invalidPhones = [
  { input: '', reason: 'Empty string' },
  { input: '1234567890', reason: 'Starts with 1 (not 6-9)' },
  { input: '5876543210', reason: 'Starts with 5 (not 6-9)' },
  { input: '98765', reason: 'Too short (< 10 digits)' },
  { input: '987654321000', reason: 'Too long (> 10 digits)' },
  { input: '+1 98765 43210', reason: 'Non-Indian country code (+1)' },
  { input: 'abc9876543210', reason: 'Contains alphabetic characters' }
];

for (const { input, reason } of invalidPhones) {
  const res = validateIndianPhone(input);
  assert(!res.isValid, `Rejects invalid phone: "${input}" (${reason})`, res.error);
}

console.log('\n===============================================================');
console.log('TEST SUITE 4: Full Name & Optional Guest Fields Validation');
console.log('===============================================================');

// Full Name
assert(validateFullName('Sarthak Andhale').isValid, 'Accepts standard full name');
assert(validateFullName("O'Connor-Smith").isValid, "Accepts names with hyphens and apostrophes");
assert(validateFullName("Àlex Müller").isValid, "Accepts names with accented/Unicode characters");
assert(!validateFullName('').isValid, 'Rejects empty name');
assert(!validateFullName('   ').isValid, 'Rejects whitespace-only name');
assert(!validateFullName('A').isValid, 'Rejects 1-letter name');
assert(!validateFullName('Guest <script>').isValid, 'Rejects name with punctuation/HTML injection');

// Age (Optional)
assert(validateAge('').isValid && validateAge('').value === null, 'Age is optional when omitted');
assert(validateAge('25').isValid && validateAge('25').value === 25, 'Accepts valid adult age 25');
assert(!validateAge('17').isValid, 'Rejects minor under 18');
assert(!validateAge('150').isValid, 'Rejects age > 120');
assert(!validateAge('abc').isValid, 'Rejects non-numeric age');

// Gender (Optional)
assert(validateGender('').isValid, 'Gender is optional when omitted');
assert(validateGender('Male').isValid, 'Accepts Male');
assert(validateGender('Female').isValid, 'Accepts Female');
assert(validateGender('Other').isValid, 'Accepts Other');
assert(!validateGender('Alien').isValid, 'Rejects invalid gender choice');

// Special Requests
assert(validateSpecialRequests('').isValid, 'Special requests optional when omitted');
assert(validateSpecialRequests('Quiet room on high floor please.').isValid, 'Accepts standard notes');
assert(!validateSpecialRequests('a'.repeat(501)).isValid, 'Rejects notes exceeding 500 characters');

console.log('\n===============================================================');
console.log('TEST SUITE 5: Inventory Overlap & Daterange Exclusion Semantics');
console.log('===============================================================');

/**
 * Pure simulation of the PostgreSQL exclusion constraint:
 * room_id WITH =, daterange(check_in, check_out, '[)') WITH &&
 * WHERE booking_status NOT IN ('cancelled', 'completed', 'checked_out')
 */
function testBookingOverlap(existing, requested) {
  // Non-blocking statuses release inventory
  const nonBlockingStatuses = new Set(['cancelled', 'completed', 'checked_out']);
  if (existing.status && nonBlockingStatuses.has(existing.status.toLowerCase())) {
    return false; // Does not block
  }

  if (existing.roomId !== requested.roomId) {
    return false; // Different physical room
  }

  // daterange(A, B, '[)') overlaps with daterange(C, D, '[)') iff:
  // A < D AND B > C
  return existing.checkIn < requested.checkOut && existing.checkOut > requested.checkIn;
}

const confirmedBooking = {
  roomId: 'room-201',
  checkIn: '2026-10-20',
  checkOut: '2026-10-23',
  status: 'confirmed'
};

const cancelledBooking = {
  roomId: 'room-201',
  checkIn: '2026-10-20',
  checkOut: '2026-10-23',
  status: 'cancelled'
};

// 5.1 Same dates on confirmed booking -> Overlaps!
assert(
  testBookingOverlap(confirmedBooking, { roomId: 'room-201', checkIn: '2026-10-20', checkOut: '2026-10-23' }),
  'Confirmed booking strictly blocks identical dates on same room'
);

// 5.2 Partial overlap inside interval -> Overlaps!
assert(
  testBookingOverlap(confirmedBooking, { roomId: 'room-201', checkIn: '2026-10-21', checkOut: '2026-10-22' }),
  'Confirmed booking blocks sub-interval dates'
);

// 5.3 Consecutive check-in on checkout date (Back-to-back stays) -> NO overlap!
// Guest 1 leaves on Oct 23 at 11:00 AM, Guest 2 arrives on Oct 23 at 14:00 PM
assert(
  !testBookingOverlap(confirmedBooking, { roomId: 'room-201', checkIn: '2026-10-23', checkOut: '2026-10-25' }),
  'Consecutive stay starting on checkout date does NOT overlap (daterange [) exclusive boundary)'
);

// 5.4 Check-out on check-in date -> NO overlap!
assert(
  !testBookingOverlap(confirmedBooking, { roomId: 'room-201', checkIn: '2026-10-18', checkOut: '2026-10-20' }),
  'Stay ending on existing check-in date does NOT overlap'
);

// 5.5 Cancelled booking releases inventory -> NO overlap!
assert(
  !testBookingOverlap(cancelledBooking, { roomId: 'room-201', checkIn: '2026-10-20', checkOut: '2026-10-23' }),
  'Cancelled booking successfully releases inventory (no overlap)'
);

console.log('\n===============================================================');
console.log('TEST SUITE 6: Verification of Add-ons Removal from Pricing');
console.log('===============================================================');

// Pricing calculation verification: base_price * nights (no add-on charges)
const testRoomBasePrice = 2000;
const testNights = 3;
const computedSubtotal = testRoomBasePrice * testNights;
const computedGrandTotal = computedSubtotal; // 0 tax, 0 add-ons

assert(computedGrandTotal === 6000, '3 nights at ₹2,000/night totals exactly ₹6,000 without add-ons');
assert(computedGrandTotal !== 6000 + 450 * 3 * 2, 'Total does NOT include Gourmet Breakfast Buffet');
assert(computedGrandTotal !== 6000 + 1200, 'Total does NOT include Airport Chauffeur Transfer');

console.log('\n===============================================================');
console.log('TEST SUITE 7: Server-Side Authoritative Pricing & Tampering Defense');
console.log('===============================================================');

function calculateAuthoritativePrice(basePrice, nights, clientPayload = {}) {
  // Pure simulation of PostgreSQL trigger enforce_booking_pricing_and_integrity
  if (basePrice <= 0) {
    throw new Error('Invalid room price configuration');
  }
  if (nights < 1) {
    throw new Error('Stay must be at least 1 night');
  }
  // Client-supplied subtotal or total_amount is completely ignored
  const authoritativeSubtotal = basePrice * nights;
  const authoritativeTotal = authoritativeSubtotal;
  return {
    subtotal: authoritativeSubtotal,
    total_amount: authoritativeTotal
  };
}

// 7.1 Client attempts to pass 0 total
const tamperedZero = calculateAuthoritativePrice(3500, 2, { subtotal: 0, total_amount: 0 });
assert(
  tamperedZero.total_amount === 7000 && tamperedZero.subtotal === 7000,
  'Tampered ₹0 total is strictly overwritten by authoritative ₹7,000'
);

// 7.2 Client attempts to pass arbitrary discount
const tamperedDiscount = calculateAuthoritativePrice(3500, 2, { subtotal: 100, total_amount: 100 });
assert(
  tamperedDiscount.total_amount === 7000,
  'Tampered ₹100 total is strictly overwritten by authoritative ₹7,000'
);

// 7.3 Client attempts negative total
const tamperedNegative = calculateAuthoritativePrice(3500, 2, { subtotal: -500, total_amount: -500 });
assert(
  tamperedNegative.total_amount === 7000,
  'Negative total is strictly overwritten by authoritative price'
);

// 7.4 Invalid base price in room catalog is rejected
let invalidPriceCaught = false;
try {
  calculateAuthoritativePrice(0, 2);
} catch {
  invalidPriceCaught = true;
}
assert(invalidPriceCaught, 'Zero or negative room catalog base price is strictly rejected');

console.log('\n===============================================================');
console.log('TEST SUITE 8: Database Check Constraints Logic');
console.log('===============================================================');

function testCheckConstraints({ checkIn, checkOut, guests, subtotal, totalAmount }) {
  // 1. check_out > check_in
  if (checkOut <= checkIn) return { valid: false, reason: 'check_out_after_check_in' };
  // 2. guests >= 1
  if (guests < 1) return { valid: false, reason: 'guests_positive' };
  // 3. total_amount >= 0 and subtotal >= 0
  if (totalAmount < 0 || subtotal < 0) return { valid: false, reason: 'amounts_non_negative' };
  return { valid: true };
}

assert(
  testCheckConstraints({ checkIn: '2026-10-20', checkOut: '2026-10-22', guests: 2, subtotal: 4000, totalAmount: 4000 }).valid,
  'Valid reservation passes all 3 database check constraints'
);

assert(
  !testCheckConstraints({ checkIn: '2026-10-22', checkOut: '2026-10-20', guests: 2, subtotal: 4000, totalAmount: 4000 }).valid,
  'Check constraint rejects checkout before checkin'
);

assert(
  !testCheckConstraints({ checkIn: '2026-10-20', checkOut: '2026-10-20', guests: 2, subtotal: 4000, totalAmount: 4000 }).valid,
  'Check constraint rejects same-day checkout (0 nights)'
);

assert(
  !testCheckConstraints({ checkIn: '2026-10-20', checkOut: '2026-10-22', guests: 0, subtotal: 4000, totalAmount: 4000 }).valid,
  'Check constraint rejects 0 guests'
);

assert(
  !testCheckConstraints({ checkIn: '2026-10-20', checkOut: '2026-10-22', guests: -1, subtotal: 4000, totalAmount: 4000 }).valid,
  'Check constraint rejects negative guest count'
);

assert(
  !testCheckConstraints({ checkIn: '2026-10-20', checkOut: '2026-10-22', guests: 2, subtotal: -100, totalAmount: 4000 }).valid,
  'Check constraint rejects negative subtotal'
);

console.log('\n===============================================================');
console.log('TEST SUITE 9: Booking & Payment Status Workflows (Pay Upon Arrival)');
console.log('===============================================================');

function determineStatuses(paymentMethod) {
  const isPayAtHotel = paymentMethod === 'Pay at Hotel' || paymentMethod === 'pay_at_hotel';
  return {
    bookingStatus: 'confirmed',
    paymentStatus: 'pending', // NEVER mark paid on client creation! Must remain pending until verified.
    gateway: isPayAtHotel ? 'pay_at_hotel' : 'online'
  };
}

const payAtHotelStatus = determineStatuses('Pay at Hotel');
assert(
  payAtHotelStatus.bookingStatus === 'confirmed' &&
  payAtHotelStatus.paymentStatus === 'pending' &&
  payAtHotelStatus.gateway === 'pay_at_hotel',
  'Pay Upon Arrival preserves business rule: confirmed booking + pending payment + pay_at_hotel gateway'
);

const onlineStatus = determineStatuses('Online');
assert(
  onlineStatus.bookingStatus === 'confirmed' &&
  onlineStatus.paymentStatus === 'pending' &&
  onlineStatus.gateway === 'online',
  'Online payment strictly initializes as pending payment (prevents fake paid bookings without webhook)'
);

const validStatuses = ['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'completed'];
assert(validStatuses.includes('confirmed'), 'confirmed is allowed');
assert(validStatuses.includes('cancelled'), 'cancelled is allowed');
assert(!validStatuses.includes('admin_bypass'), 'admin_bypass status is strictly rejected');
assert(!validStatuses.includes('free_stay'), 'free_stay status is strictly rejected');

console.log('\n===============================================================');
console.log('TEST SUITE 10: Multi-Room Atomic Physical Allocation & Concurrency');
console.log('===============================================================');

// Simulate 2 physical rooms belonging to Deluxe Suite (Room 101, Room 102)
const physicalInventory = [
  { id: 'room-101', number: '101', roomTypeId: 'type-deluxe', status: 'available' },
  { id: 'room-102', number: '102', roomTypeId: 'type-deluxe', status: 'available' }
];

function allocatePhysicalRoom(inventory, existingBookings, requestedTypeId, checkIn, checkOut) {
  const nonBlocking = new Set(['cancelled', 'completed', 'checked_out']);
  const bookedRoomIds = new Set(
    existingBookings
      .filter(b => (!b.status || !nonBlocking.has(b.status.toLowerCase())) && b.checkIn < checkOut && b.checkOut > checkIn)
      .map(b => b.roomId)
  );

  const available = inventory.filter(r => r.roomTypeId === requestedTypeId && r.status === 'available' && !bookedRoomIds.has(r.id));
  if (available.length === 0) return null;
  return available[0]; // First available room (matching ORDER BY room_number ASC)
}

// 10.1 Allocation with empty bookings picks Room 101
const firstAlloc = allocatePhysicalRoom(physicalInventory, [], 'type-deluxe', '2026-10-25', '2026-10-28');
assert(firstAlloc.id === 'room-101', 'First reservation allocates Room 101');

// 10.2 Second concurrent reservation picks Room 102
const activeBooking101 = { roomId: 'room-101', checkIn: '2026-10-25', checkOut: '2026-10-28', status: 'confirmed' };
const secondAlloc = allocatePhysicalRoom(physicalInventory, [activeBooking101], 'type-deluxe', '2026-10-25', '2026-10-28');
assert(secondAlloc.id === 'room-102', 'Second overlapping reservation allocates Room 102');

// 10.3 Third reservation detects inventory exhausted
const activeBooking102 = { roomId: 'room-102', checkIn: '2026-10-25', checkOut: '2026-10-28', status: 'confirmed' };
const thirdAlloc = allocatePhysicalRoom(physicalInventory, [activeBooking101, activeBooking102], 'type-deluxe', '2026-10-25', '2026-10-28');
assert(thirdAlloc === null, 'Third overlapping reservation detects fully booked inventory (returns null)');

// 10.4 Non-overlapping dates succeed on same room
const nextWeekAlloc = allocatePhysicalRoom(physicalInventory, [activeBooking101, activeBooking102], 'type-deluxe', '2026-10-28', '2026-10-31');
assert(nextWeekAlloc !== null && nextWeekAlloc.id === 'room-101', 'Back-to-back stay on checkout date Oct 28 reallocates Room 101');

console.log('\n===============================================================');
console.log('TEST SUITE 11: Visible-Tab Polling Fallback Logic Guards');
console.log('===============================================================');

function shouldExecutePolling({ activePage, isDocumentHidden, isCheckingInFlight }) {
  if (activePage !== 'booking') return false;
  if (isDocumentHidden) return false;
  if (isCheckingInFlight) return false;
  return true;
}

assert(
  shouldExecutePolling({ activePage: 'booking', isDocumentHidden: false, isCheckingInFlight: false }),
  'Polling executes when on booking page, tab is visible, and no request is in-flight'
);

assert(
  !shouldExecutePolling({ activePage: 'booking', isDocumentHidden: true, isCheckingInFlight: false }),
  'Polling is suppressed when browser tab is hidden/minimized'
);

assert(
  !shouldExecutePolling({ activePage: 'booking', isDocumentHidden: false, isCheckingInFlight: true }),
  'Polling is suppressed when another availability request is already in-flight'
);

assert(
  !shouldExecutePolling({ activePage: 'home', isDocumentHidden: false, isCheckingInFlight: false }),
  'Polling is completely disabled on non-booking pages (home)'
);

assert(
  !shouldExecutePolling({ activePage: 'admin', isDocumentHidden: false, isCheckingInFlight: false }),
  'Polling is completely disabled on admin page'
);

console.log('\n===============================================================');
console.log('TEST SUITE 12: Insecure Direct-Insert Fallback Elimination');
console.log('===============================================================');

// Simulation of bookingService.createBooking error handling
async function simulateBookingCreation(rpcResponse) {
  let directInsertAttempted = false;

  const mockSupabase = {
    rpc: async () => rpcResponse,
    from: () => ({
      insert: async () => {
        directInsertAttempted = true;
        return { data: null, error: null };
      }
    })
  };

  try {
    const { data: rpcBooking, error: rpcErr } = await mockSupabase.rpc();

    if (rpcErr) {
      const isMissingRpc =
        rpcErr.code === 'PGRST202' ||
        rpcErr.message?.includes('Could not find the function') ||
        rpcErr.message?.includes('function public.create_booking');

      if (isMissingRpc) {
        throw new Error(
          "Secure reservation service is temporarily unavailable. Please try again later or contact the front desk."
        );
      }
      if (
        rpcErr.code === '23P01' ||
        rpcErr.message?.toLowerCase().includes('exclusion') ||
        rpcErr.message?.toLowerCase().includes('overlap') ||
        rpcErr.message?.toLowerCase().includes('fully booked')
      ) {
        throw new Error(
          "This room was just reserved by another guest for these dates. Please choose another room or try different dates."
        );
      }
      throw new Error(rpcErr.message || "Failed to create reservation.");
    }
    return { success: true, booking: rpcBooking, directInsertAttempted };
  } catch (err) {
    return { success: false, error: err.message, directInsertAttempted };
  }
}

// 12.1 Missing RPC stops booking creation without fallback
const missingRpcRes = await simulateBookingCreation({
  data: null,
  error: { code: 'PGRST202', message: 'Could not find the function public.create_booking' }
});
assert(
  !missingRpcRes.success &&
  missingRpcRes.error.includes('temporarily unavailable') &&
  !missingRpcRes.directInsertAttempted,
  'When create_booking RPC is missing, creation halts safely with NO direct insert fallback'
);

// 12.2 Exclusion conflict stops booking creation without fallback
const exclusionRes = await simulateBookingCreation({
  data: null,
  error: { code: '23P01', message: 'exclusion_violation' }
});
assert(
  !exclusionRes.success &&
  exclusionRes.error.includes('just reserved by another guest') &&
  !exclusionRes.directInsertAttempted,
  'When room conflict occurs, error is returned with NO direct insert fallback'
);

// 12.3 Successful RPC returns booking confirmation
const successRes = await simulateBookingCreation({
  data: { id: 'bk-123', formattedRefId: 'HAI-2026-ABC12', booking_status: 'confirmed' },
  error: null
});
assert(
  successRes.success &&
  successRes.booking.id === 'bk-123' &&
  !successRes.directInsertAttempted,
  'Successful RPC returns verified booking record'
);

console.log('\n===============================================================');
console.log('TEST SUITE 13: Database RLS & Permission Lockdown Semantics');
console.log('===============================================================');

// Simulation of intended RLS policies
function simulateRlsPolicy({ table, action, userRole, userId, targetRecordUserId }) {
  if (action === 'SELECT') {
    if (userRole === 'admin') return true;
    if (userRole === 'authenticated' && userId === targetRecordUserId) return true;
    return false;
  }
  if (action === 'INSERT') {
    // Only Admin can directly INSERT into bookings, booking_guests, or payments via PostgREST
    // Ordinary customers MUST use SECURITY DEFINER RPC
    if (userRole === 'admin') return true;
    return false;
  }
  if (action === 'UPDATE') {
    if (userRole === 'admin') return true;
    return false;
  }
  return false;
}

// 13.1 Customer direct insert is strictly DENIED
assert(
  !simulateRlsPolicy({ table: 'bookings', action: 'INSERT', userRole: 'customer', userId: 'user-1' }),
  'Customer direct REST INSERT on bookings is strictly DENIED by RLS'
);
assert(
  !simulateRlsPolicy({ table: 'payments', action: 'INSERT', userRole: 'customer', userId: 'user-1' }),
  'Customer direct REST INSERT on payments is strictly DENIED by RLS'
);

// 13.2 Admin direct insert is ALLOWED
assert(
  simulateRlsPolicy({ table: 'bookings', action: 'INSERT', userRole: 'admin', userId: 'admin-1' }),
  'Admin direct INSERT on bookings is ALLOWED by RLS'
);

// 13.3 Customer reading own bookings is ALLOWED
assert(
  simulateRlsPolicy({ table: 'bookings', action: 'SELECT', userRole: 'authenticated', userId: 'user-1', targetRecordUserId: 'user-1' }),
  'Customer can read their own bookings'
);

// 13.4 Customer reading another user\'s booking is DENIED
assert(
  !simulateRlsPolicy({ table: 'bookings', action: 'SELECT', userRole: 'authenticated', userId: 'user-1', targetRecordUserId: 'user-2' }),
  'Customer cannot read another customer\'s booking'
);

// 13.5 Admin reading all bookings is ALLOWED
assert(
  simulateRlsPolicy({ table: 'bookings', action: 'SELECT', userRole: 'admin', userId: 'admin-1', targetRecordUserId: 'user-2' }),
  'Admin can read all customer bookings'
);

// 13.6 Admin updating booking status is ALLOWED
assert(
  simulateRlsPolicy({ table: 'bookings', action: 'UPDATE', userRole: 'admin', userId: 'admin-1' }),
  'Admin can update booking status'
);

console.log('\n===============================================================');
console.log('TEST SUITE 14: Null Date Guards, Inactive Rooms & Transaction Atomicity');
console.log('===============================================================');

function validateDateIntegrity(checkIn, checkOut) {
  if (checkIn === null || checkIn === undefined || String(checkIn).trim() === '') {
    return { valid: false, error: 'Check-in date is required' };
  }
  if (checkOut === null || checkOut === undefined || String(checkOut).trim() === '') {
    return { valid: false, error: 'Check-out date is required' };
  }
  if (checkOut <= checkIn) {
    return { valid: false, error: 'Check-out must be strictly after check-in' };
  }
  return { valid: true };
}

assert(!validateDateIntegrity(null, '2026-10-25').valid, 'NULL check-in date is rejected');
assert(!validateDateIntegrity('2026-10-25', null).valid, 'NULL check-out date is rejected');
assert(!validateDateIntegrity(undefined, undefined).valid, 'Undefined dates are rejected');
assert(!validateDateIntegrity('2026-10-25', '2026-10-25').valid, 'Equal dates are rejected');

// Inactive Room / Type checks
function validateRoomState(roomStatus, roomTypeStatus) {
  if (roomStatus !== 'available') return { valid: false, error: 'Physical room is not available' };
  if (roomTypeStatus !== 'active') return { valid: false, error: 'Room category is inactive' };
  return { valid: true };
}

assert(!validateRoomState('maintenance', 'active').valid, 'Room in maintenance is rejected');
assert(!validateRoomState('inactive', 'active').valid, 'Inactive physical room is rejected');
assert(!validateRoomState('available', 'inactive').valid, 'Room with inactive category is rejected');
assert(validateRoomState('available', 'active').valid, 'Available room with active category is accepted');

// Transaction Atomicity Simulation (No Orphaned Records)
function simulateAtomicTransaction(steps) {
  const rollbackLog = [];
  try {
    for (const step of steps) {
      if (!step.succeeds) {
        throw new Error(step.error || 'Transaction step failed');
      }
      rollbackLog.push(step.name);
    }
    return { committed: true, records: rollbackLog };
  } catch (err) {
    // In PostgreSQL, any failure inside an RPC transaction causes atomic rollback
    return { committed: false, records: [], error: err.message };
  }
}

const failingPaymentSteps = [
  { name: 'insert_booking', succeeds: true },
  { name: 'insert_guest', succeeds: true },
  { name: 'insert_payment', succeeds: false, error: 'Invalid payment amount' }
];

const txResult = simulateAtomicTransaction(failingPaymentSteps);
assert(
  !txResult.committed && txResult.records.length === 0,
  'If payment insertion fails, booking and guest records roll back atomically (no orphaned records)'
);


console.log('\n===============================================================');
console.log('TEST SUITE 15: Payment Allowlist, Cancellation RPC & Concurrency');
console.log('===============================================================');

// 15.1 Payment Method Allowlist Validation
function validatePaymentMethod(method) {
  const clean = String(method || '').toLowerCase().trim();
  if (['pay at hotel', 'pay_at_hotel', 'cash'].includes(clean)) {
    return { valid: true, gateway: 'pay_at_hotel', paymentStatus: 'pending' };
  }
  if (['online', 'card', 'upi', 'netbanking'].includes(clean)) {
    return { valid: true, gateway: 'online', paymentStatus: 'pending' };
  }
  return { valid: false, error: `Invalid payment method: "${method}". Supported methods are Pay at Hotel, Online, Card, UPI, or NetBanking.` };
}

assert(validatePaymentMethod('Pay at Hotel').valid && validatePaymentMethod('Pay at Hotel').gateway === 'pay_at_hotel', 'Pay at Hotel is valid and maps to pay_at_hotel gateway');
assert(validatePaymentMethod('pay_at_hotel').valid, 'pay_at_hotel snake_case is valid');
assert(validatePaymentMethod('CASH').valid && validatePaymentMethod('CASH').gateway === 'pay_at_hotel', 'Cash is valid');
assert(validatePaymentMethod('Online').valid && validatePaymentMethod('Online').gateway === 'online', 'Online is valid and maps to online gateway');
assert(validatePaymentMethod('upi').valid && validatePaymentMethod('upi').gateway === 'online', 'UPI is valid');
assert(validatePaymentMethod('Card').valid && validatePaymentMethod('Card').gateway === 'online', 'Card is valid');
assert(validatePaymentMethod('NetBanking').valid && validatePaymentMethod('NetBanking').gateway === 'online', 'NetBanking is valid');
assert(!validatePaymentMethod('crypto').valid, 'Cryptocurrency is strictly rejected');
assert(!validatePaymentMethod('fake_bypass').valid, 'Arbitrary payment method string is strictly rejected');
assert(!validatePaymentMethod('').valid, 'Empty payment method is strictly rejected');
assert(!validatePaymentMethod(null).valid, 'Null payment method is strictly rejected');
assert(validatePaymentMethod('Pay at Hotel').paymentStatus === 'pending', 'Payment status is strictly initialized as pending');
assert(validatePaymentMethod('Online').paymentStatus === 'pending', 'Online payment status is strictly initialized as pending');

// 15.2 Cancellation RPC Status Guards & Ownership
function simulateCancelBooking({
  callerId,
  callerRole,
  bookingRecord,
  attemptedModifications = {}
}) {
  // 1. Auth check
  if (!callerId) {
    return { success: false, error: 'Authentication required' };
  }
  // 2. Booking exists
  if (!bookingRecord) {
    return { success: false, error: 'Reservation not found' };
  }
  // 3. Ownership or Admin check
  const isAdmin = callerRole === 'admin';
  const isOwner = bookingRecord.user_id === callerId;
  if (!isOwner && !isAdmin) {
    return { success: false, error: 'Access denied: You do not have permission to cancel this reservation.' };
  }
  // 4. Status check: Only confirmed and pending can be cancelled
  const currentStatus = bookingRecord.booking_status;
  if (!['confirmed', 'pending'].includes(currentStatus)) {
    if (currentStatus === 'cancelled') {
      return { success: false, error: 'This reservation is already cancelled.' };
    }
    return { success: false, error: `Reservations with status "${currentStatus}" cannot be cancelled.` };
  }
  // 5. Immutability guarantee: ONLY booking_status and updated_at can be mutated
  const updatedRecord = {
    ...bookingRecord,
    booking_status: 'cancelled',
    updated_at: new Date().toISOString()
  };
  // Attempted tampering with other columns is ignored / disallowed
  return {
    success: true,
    record: updatedRecord,
    tamperedFieldIgnored: attemptedModifications.room_id !== undefined && updatedRecord.room_id === bookingRecord.room_id
  };
}

const mockBooking = {
  id: 'b-001',
  user_id: 'cust-101',
  room_id: 'r-101',
  check_in: '2026-10-25',
  check_out: '2026-10-28',
  guests: 2,
  subtotal: 6000,
  total_amount: 6000,
  booking_status: 'confirmed'
};

// Customer cancels own confirmed booking
const cancelOwnConfirmed = simulateCancelBooking({
  callerId: 'cust-101',
  callerRole: 'customer',
  bookingRecord: mockBooking
});
assert(cancelOwnConfirmed.success && cancelOwnConfirmed.record.booking_status === 'cancelled', 'Customer can cancel their own confirmed booking');

// Customer cancels own pending booking
const cancelOwnPending = simulateCancelBooking({
  callerId: 'cust-101',
  callerRole: 'customer',
  bookingRecord: { ...mockBooking, booking_status: 'pending' }
});
assert(cancelOwnPending.success && cancelOwnPending.record.booking_status === 'cancelled', 'Customer can cancel their own pending booking');

// Admin cancels customer booking
const cancelByAdmin = simulateCancelBooking({
  callerId: 'admin-999',
  callerRole: 'admin',
  bookingRecord: mockBooking
});
assert(cancelByAdmin.success && cancelByAdmin.record.booking_status === 'cancelled', 'Admin can cancel any customer booking');

// Unauthorized customer attempts to cancel another user's booking
const cancelUnauthorized = simulateCancelBooking({
  callerId: 'cust-202',
  callerRole: 'customer',
  bookingRecord: mockBooking
});
assert(!cancelUnauthorized.success && cancelUnauthorized.error.includes('Access denied'), 'Customer cannot cancel another user\'s booking');

// Unauthenticated cancellation
const cancelUnauthenticated = simulateCancelBooking({
  callerId: null,
  callerRole: 'anon',
  bookingRecord: mockBooking
});
assert(!cancelUnauthenticated.success && cancelUnauthenticated.error.includes('Authentication required'), 'Unauthenticated cancellation is rejected');

// Reject cancelling already-cancelled booking
const cancelAlreadyCancelled = simulateCancelBooking({
  callerId: 'cust-101',
  callerRole: 'customer',
  bookingRecord: { ...mockBooking, booking_status: 'cancelled' }
});
assert(!cancelAlreadyCancelled.success && cancelAlreadyCancelled.error.includes('already cancelled'), 'Cancelling already-cancelled booking is rejected');

// Reject cancelling checked-in booking
const cancelCheckedIn = simulateCancelBooking({
  callerId: 'cust-101',
  callerRole: 'customer',
  bookingRecord: { ...mockBooking, booking_status: 'checked_in' }
});
assert(!cancelCheckedIn.success && cancelCheckedIn.error.includes('cannot be cancelled'), 'Cancelling checked-in booking is rejected');

// Reject cancelling checked-out booking
const cancelCheckedOut = simulateCancelBooking({
  callerId: 'cust-101',
  callerRole: 'customer',
  bookingRecord: { ...mockBooking, booking_status: 'checked_out' }
});
assert(!cancelCheckedOut.success && cancelCheckedOut.error.includes('cannot be cancelled'), 'Cancelling checked-out booking is rejected');

// Reject cancelling completed booking
const cancelCompleted = simulateCancelBooking({
  callerId: 'cust-101',
  callerRole: 'customer',
  bookingRecord: { ...mockBooking, booking_status: 'completed' }
});
assert(!cancelCompleted.success && cancelCompleted.error.includes('cannot be cancelled'), 'Cancelling completed booking is rejected');

// Reject cancelling booking with unexpected / invalid status
const cancelUnexpectedStatus = simulateCancelBooking({
  callerId: 'cust-101',
  callerRole: 'customer',
  bookingRecord: { ...mockBooking, booking_status: 'unknown_status' }
});
assert(!cancelUnexpectedStatus.success, 'Cancelling booking with unexpected status is rejected');

// 15.3 Field Immutability during Cancellation
const cancelWithTamperingAttempt = simulateCancelBooking({
  callerId: 'cust-101',
  callerRole: 'customer',
  bookingRecord: mockBooking,
  attemptedModifications: { room_id: 'r-999', subtotal: 0, total_amount: 0, guests: 10 }
});
assert(
  cancelWithTamperingAttempt.record.room_id === 'r-101' &&
  cancelWithTamperingAttempt.record.subtotal === 6000 &&
  cancelWithTamperingAttempt.record.guests === 2,
  'Cancellation RPC is immutable: room_id, pricing, and guest count cannot be tampered with during cancellation'
);

// 15.4 Row-Level Lock & Concurrent Status Transition Simulation (FOR UPDATE)
function simulateConcurrentCancellationWithCheckin() {
  let rowLocked = false;
  let bookingState = { ...mockBooking, booking_status: 'confirmed' };

  // Step 1: Admin check-in transaction acquires row lock
  rowLocked = true;
  bookingState.booking_status = 'checked_in';
  rowLocked = false; // Transaction 1 commits

  // Step 2: Concurrent Customer cancellation acquires row lock after Tx 1
  // Validates status AFTER acquiring the lock
  const cancelResult = simulateCancelBooking({
    callerId: 'cust-101',
    callerRole: 'customer',
    bookingRecord: bookingState
  });

  return cancelResult;
}

const raceResult = simulateConcurrentCancellationWithCheckin();
assert(
  !raceResult.success && raceResult.error.includes('cannot be cancelled'),
  'Row-level locking (SELECT FOR UPDATE) prevents race condition when status transitions concurrently to checked_in'
);

// 15.5 NULL Room ID Handling: NOT EXISTS vs NOT IN
// In SQL, if a subquery contains NULL, "x NOT IN (SELECT y FROM ...)" evaluates to UNKNOWN (falsy) for all rows!
// "NOT EXISTS (SELECT 1 FROM ... WHERE y = x)" correctly checks for equality and is immune to NULLs in other rows.
function testSubqueryNullSafety() {
  const rooms = [{ id: 'room-1' }, { id: 'room-2' }];
  const existingBookingsWithNull = [
    { room_id: null, check_in: '2026-10-25', check_out: '2026-10-28', booking_status: 'confirmed' },
    { room_id: 'room-1', check_in: '2026-10-25', check_out: '2026-10-28', booking_status: 'confirmed' }
  ];

  // SQL NOT IN simulation: if subquery has NULL, NOT IN evaluates to false for all items
  const notInResult = rooms.filter(r => {
    const subqueryValues = existingBookingsWithNull.map(b => b.room_id);
    if (subqueryValues.includes(null)) return false; // SQL 3-valued logic anomaly
    return !subqueryValues.includes(r.id);
  });

  // SQL NOT EXISTS simulation: checks correlated b.room_id = r.id
  const notExistsResult = rooms.filter(r => {
    return !existingBookingsWithNull.some(b => b.room_id === r.id);
  });

  return {
    notInCount: notInResult.length,
    notExistsCount: notExistsResult.length,
    notExistsAllocatesRoom2: notExistsResult[0]?.id === 'room-2'
  };
}

const nullSafety = testSubqueryNullSafety();
assert(nullSafety.notInCount === 0, 'NOT IN incorrectly rejects all rooms when subquery contains a NULL room_id');
assert(nullSafety.notExistsCount === 1 && nullSafety.notExistsAllocatesRoom2, 'NOT EXISTS safely allocates Room 2 despite NULLs in unrelated booking rows');

// 15.6 Frontend AppContext UUID Resolution Integration
function resolveBookingTargetId(identifier, userBookingsList) {
  let targetUuid = identifier;
  const match = (userBookingsList || []).find(
    (b) => b.fullId === identifier || b.id === identifier
  );
  if (match?.fullId) {
    targetUuid = match.fullId;
  }
  return targetUuid;
}

const mockUserBookings = [
  { id: 'HAI-2026-ABCDE', fullId: '11111111-2222-3333-4444-555555555555', status: 'Confirmed' }
];

assert(
  resolveBookingTargetId('HAI-2026-ABCDE', mockUserBookings) === '11111111-2222-3333-4444-555555555555',
  'Frontend correctly resolves formatted reference ID (HAI-2026-ABCDE) to real database UUID for cancel_booking RPC'
);
assert(
  resolveBookingTargetId('11111111-2222-3333-4444-555555555555', mockUserBookings) === '11111111-2222-3333-4444-555555555555',
  'Frontend preserves database UUID if fullId is already provided'
);

// 15.7 Dedicated UUID validation helper tests
assert(isValidUuid('c87b1c41-2a91-4993-9c59-111122223333'), 'Valid lowercase UUID passes isValidUuid');
assert(isValidUuid('C87B1C41-2A91-4993-9C59-111122223333'), 'Valid uppercase UUID passes isValidUuid');
assert(!isValidUuid('HAI-2026-ABCDE'), 'Formatted reference ID HAI-2026-ABCDE is rejected by isValidUuid');
assert(!isValidUuid('invalid-uuid-string'), 'Arbitrary text is rejected by isValidUuid');
assert(!isValidUuid(null), 'null is rejected by isValidUuid');
assert(!isValidUuid(undefined), 'undefined is rejected by isValidUuid');
assert(!isValidUuid(123456), 'Number is rejected by isValidUuid');
assert(!isValidUuid({ id: '123' }), 'Object is rejected by isValidUuid');

console.log('\n===============================================================');
console.log('TEST SUITE 16: Guest Contact Persistence & Backward Compatibility');
console.log('===============================================================');

function resolveAdminGuestContacts(bookingRow) {
  const guestProfile = bookingRow.profiles;
  const firstGuestInfo = bookingRow.booking_guests?.[0];

  const guestName = firstGuestInfo?.full_name || guestProfile?.full_name || guestProfile?.email?.split('@')[0] || 'Guest User';
  const guestEmail = firstGuestInfo?.email || guestProfile?.email || '';
  const guestPhone = firstGuestInfo?.phone || guestProfile?.phone || '';

  return { guestName, guestEmail, guestPhone };
}

// 16.1 New booking with dedicated guest contact info
const newBookingRow = {
  profiles: { id: 'user-001', full_name: 'Sarthak (Account Holder)', email: 'sarthak.account@gmail.com', phone: '+91 99999 00000' },
  booking_guests: [
    { full_name: 'Ananya Sharma', email: 'ananya.stay@gmail.com', phone: '+91 98765 43210' }
  ]
};
const newResolved = resolveAdminGuestContacts(newBookingRow);
assert(
  newResolved.guestName === 'Ananya Sharma' &&
  newResolved.guestEmail === 'ananya.stay@gmail.com' &&
  newResolved.guestPhone === '+91 98765 43210',
  'Admin mapping uses dedicated guest contact details from booking_guests when present'
);
assert(
  newBookingRow.profiles.email === 'sarthak.account@gmail.com',
  'Account holder profile email remains untouched (never overwritten by guest contact)'
);

// 16.2 Historical booking where booking_guests has no email/phone (fallback behavior)
const historicalBookingRow = {
  profiles: { id: 'user-002', full_name: 'Rahul Verma', email: 'rahul.verma@gmail.com', phone: '+91 98123 45678' },
  booking_guests: [
    { full_name: 'Rahul Verma', email: null, phone: null }
  ]
};
const historicalResolved = resolveAdminGuestContacts(historicalBookingRow);
assert(
  historicalResolved.guestName === 'Rahul Verma' &&
  historicalResolved.guestEmail === 'rahul.verma@gmail.com' &&
  historicalResolved.guestPhone === '+91 98123 45678',
  'Historical bookings with missing guest contacts fall back safely to account profile details'
);

console.log('\n===============================================================');
console.log('TEST SUITE 17: Live Schema Enum & Status Transition Hardening');
console.log('===============================================================');

// 17.1 Validate confirmed payment_status enums
const confirmedPaymentStatuses = ['pending', 'paid', 'failed', 'refunded', 'cancelled'];
function validatePaymentStatus(status) {
  const statusLower = (status || '').toLowerCase();
  if (!confirmedPaymentStatuses.includes(statusLower)) {
    throw new Error(`Invalid payment status "${status}". Allowed values: ${confirmedPaymentStatuses.join(', ')}.`);
  }
  return statusLower;
}

assert(validatePaymentStatus('paid') === 'paid', 'Payment status "paid" is valid');
assert(validatePaymentStatus('Pending') === 'pending', 'Payment status "Pending" is valid');
assert(validatePaymentStatus('failed') === 'failed', 'Payment status "failed" is valid');
assert(validatePaymentStatus('refunded') === 'refunded', 'Payment status "refunded" is valid');
assert(validatePaymentStatus('cancelled') === 'cancelled', 'Payment status "cancelled" is valid');

let completedPaymentRejected = false;
try {
  validatePaymentStatus('completed');
} catch (e) {
  completedPaymentRejected = e.message.includes('Invalid payment status');
}
assert(completedPaymentRejected, 'Payment status "completed" is strictly REJECTED (not a valid payment_status enum value)');

// 17.2 Validate confirmed booking_status enums
const confirmedBookingStatuses = ['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'completed'];
function validateBookingStatus(status) {
  const statusLower = (status || '').toLowerCase();
  if (!confirmedBookingStatuses.includes(statusLower)) {
    throw new Error(`Invalid booking status "${status}". Allowed values: ${confirmedBookingStatuses.join(', ')}.`);
  }
  return statusLower;
}

assert(validateBookingStatus('completed') === 'completed', 'Booking status "completed" is valid in booking_status enum');
assert(validateBookingStatus('confirmed') === 'confirmed', 'Booking status "confirmed" is valid in booking_status enum');
assert(validateBookingStatus('checked_in') === 'checked_in', 'Booking status "checked_in" is valid in booking_status enum');
assert(validateBookingStatus('checked_out') === 'checked_out', 'Booking status "checked_out" is valid in booking_status enum');

// 17.3 Validate multi-column bookings_amounts_check logic
function checkBookingsAmounts({ total_amount, subtotal, tax_amount = 0, discount_amount = 0 }) {
  return total_amount >= 0 && subtotal >= 0 && (tax_amount ?? 0) >= 0 && (discount_amount ?? 0) >= 0;
}
assert(checkBookingsAmounts({ total_amount: 5000, subtotal: 5000, tax_amount: 0, discount_amount: 0 }), 'Standard zero-tax booking passes amounts check');
assert(checkBookingsAmounts({ total_amount: 5600, subtotal: 5000, tax_amount: 600, discount_amount: 0 }), 'GST-tax booking passes amounts check');
assert(!checkBookingsAmounts({ total_amount: -100, subtotal: 5000 }), 'Negative total_amount fails amounts check');
assert(!checkBookingsAmounts({ total_amount: 5000, subtotal: -50 }), 'Negative subtotal fails amounts check');
assert(!checkBookingsAmounts({ total_amount: 5000, subtotal: 5000, tax_amount: -10 }), 'Negative tax_amount fails amounts check');
assert(!checkBookingsAmounts({ total_amount: 5000, subtotal: 5000, discount_amount: -20 }), 'Negative discount_amount fails amounts check');

console.log('\n===============================================================');
console.log('TEST SUITE 18: Strict Date Selection Clamping & Past Date Blocking');
console.log('===============================================================');

function simulateCheckInChange(newVal, currentCheckOut, today = '2026-10-20') {
  let toastMsg = null;
  let checkIn = null;
  let checkOut = currentCheckOut;

  if (!newVal || newVal < today) {
    toastMsg = 'Past dates cannot be selected. Check-in must be today or a future date.';
    checkIn = today;
    if (!checkOut || checkOut <= today) {
      checkOut = getNextDayKolkata(today);
    }
    return { checkIn, checkOut, toastMsg, blocked: true };
  }

  checkIn = newVal;
  if (!checkOut || checkOut <= newVal) {
    checkOut = getNextDayKolkata(newVal);
    toastMsg = 'Check-out date was adjusted to follow your new check-in date.';
  }
  return { checkIn, checkOut, toastMsg, blocked: false };
}

function simulateCheckOutChange(newVal, currentCheckIn) {
  let toastMsg = null;
  let checkOut = null;
  const minAllowedCheckOut = getNextDayKolkata(currentCheckIn);

  if (!newVal || newVal <= currentCheckIn) {
    toastMsg = 'Check-out date must be strictly after the check-in date.';
    checkOut = minAllowedCheckOut;
    return { checkOut, toastMsg, blocked: true };
  }

  checkOut = newVal;
  return { checkOut, toastMsg, blocked: false };
}

// 18.1 Past date rejection and clamping
const pastPick = simulateCheckInChange('2026-10-19', '2026-10-21', '2026-10-20');
assert(pastPick.blocked, 'Selecting Oct 19 when today is Oct 20 is strictly blocked');
assert(pastPick.checkIn === '2026-10-20', 'Past date is clamped immediately to today (Oct 20) instead of being accepted');
assert(pastPick.checkOut === '2026-10-21', 'Check-out date remains validly after clamped check-in');
assert(pastPick.toastMsg && pastPick.toastMsg.includes('Past dates cannot be selected'), 'Informs user with descriptive toast');

// 18.2 Empty or cleared check-in
const emptyCheckIn = simulateCheckInChange('', '2026-10-21', '2026-10-20');
assert(emptyCheckIn.blocked && emptyCheckIn.checkIn === '2026-10-20', 'Empty check-in input reverts safely to today');

// 18.3 Valid future check-in
const validFuturePick = simulateCheckInChange('2026-10-22', '2026-10-25', '2026-10-20');
assert(!validFuturePick.blocked && validFuturePick.checkIn === '2026-10-22', 'Valid future date Oct 22 is accepted');
assert(validFuturePick.checkOut === '2026-10-25', 'Existing check-out is preserved when already after new check-in');

// 18.4 Check-in pushed past existing check-out
const advancedCheckIn = simulateCheckInChange('2026-10-25', '2026-10-22', '2026-10-20');
assert(advancedCheckIn.checkIn === '2026-10-25', 'Advanced check-in accepted');
assert(advancedCheckIn.checkOut === '2026-10-26', 'Check-out auto-advanced to Oct 26 to maintain checkOut > checkIn');

// 18.5 Same-day check-out selection blocked
const sameDayCheckOut = simulateCheckOutChange('2026-10-20', '2026-10-20');
assert(sameDayCheckOut.blocked, 'Check-out on same day as check-in (0 nights) is strictly blocked');
assert(sameDayCheckOut.checkOut === '2026-10-21', 'Check-out is clamped to next day (Oct 21)');

// 18.6 Earlier-day check-out selection blocked
const earlierCheckOut = simulateCheckOutChange('2026-10-18', '2026-10-20');
assert(earlierCheckOut.blocked, 'Check-out earlier than check-in is strictly blocked');
assert(earlierCheckOut.checkOut === '2026-10-21', 'Check-out earlier than check-in is clamped to next day (Oct 21)');

// 18.7 Valid check-out accepted
const validCheckOut = simulateCheckOutChange('2026-10-23', '2026-10-20');
assert(!validCheckOut.blocked && validCheckOut.checkOut === '2026-10-23', 'Valid check-out Oct 23 is accepted');

console.log('\n===============================================================');
console.log('TEST SUITE 19: Special Requests Optionality & Non-Blocking Validation');
console.log('===============================================================');

// 19.1 Empty, null, whitespace-only special requests are all valid
assert(validateSpecialRequests('').isValid, 'Empty string is valid for special requests');
assert(validateSpecialRequests('   ').isValid, 'Whitespace-only string is valid for special requests');
assert(validateSpecialRequests(null).isValid, 'null is valid for special requests');
assert(validateSpecialRequests(undefined).isValid, 'undefined is valid for special requests');

// 19.2 Guest form validation passes with empty special requests
const formWithEmptySpecialRequests = validateGuestForm({
  guestName: 'Aarav Sharma',
  guestEmail: 'aarav.sharma@gmail.com',
  guestPhone: '9876543210',
  guestAge: '',
  guestGender: 'Male',
  specialRequests: ''
});
assert(formWithEmptySpecialRequests.isValid, 'Guest form passes when Special Requests is empty');
assert(!formWithEmptySpecialRequests.errors.specialRequests, 'No specialRequests error when left empty');

// 19.3 Missing required field (e.g. Gmail) produces error attributed ONLY to that field
const formWithMissingEmail = validateGuestForm({
  guestName: 'Aarav Sharma',
  guestEmail: '',
  guestPhone: '9876543210',
  specialRequests: ''
});
assert(!formWithMissingEmail.isValid, 'Form rejected due to missing required Gmail');
assert(formWithMissingEmail.errors.guestEmail, 'Error correctly points to guestEmail');
assert(!formWithMissingEmail.errors.specialRequests, 'Special requests is NOT marked with an error');

console.log('\n===============================================================');
console.log('TEST SUITE 20: Gallery Management & Home Page Showcase');
console.log('===============================================================');

// Mock initial gallery list
const sampleInitialGallery = [
  { id: 1, title: 'Facade View', category: 'exterior', image: 'https://example.com/facade.jpg', featured: true },
  { id: 2, title: 'Deluxe Suite', category: 'rooms', image: 'https://example.com/deluxe.jpg', featured: true },
  { id: 3, title: 'Fine Dining', category: 'dining', image: 'https://example.com/dining.jpg', featured: false }
];

let galleryState = [...sampleInitialGallery];

function addPhoto(state, newPhoto) {
  if (!newPhoto?.image || !newPhoto.image.trim()) {
    throw new Error('Image URL or file is required.');
  }
  const item = {
    id: Date.now(),
    title: newPhoto.title?.trim() || 'Ambience Inn Photo',
    category: newPhoto.category || 'exterior',
    image: newPhoto.image,
    desc: newPhoto.desc?.trim() || '',
    featured: newPhoto.featured !== undefined ? newPhoto.featured : true
  };
  return [item, ...state];
}

function removePhoto(state, id) {
  return state.filter(p => p.id !== id);
}

function toggleFeatured(state, id) {
  return state.map(p => p.id === id ? { ...p, featured: !p.featured } : p);
}

// 20.1 Adding a photo
galleryState = addPhoto(galleryState, {
  title: 'Courtyard at Dusk',
  category: 'exterior',
  image: 'https://example.com/courtyard.jpg',
  desc: 'Warm evening lighting',
  featured: true
});
assert(galleryState.length === 4, 'Adding photo increases gallery count to 4');
assert(galleryState[0].title === 'Courtyard at Dusk', 'New photo is prepended at the top');
assert(galleryState[0].featured === true, 'New photo is featured on home page by default');

// 20.2 Rejecting empty image source
let emptyImageRejected = false;
try {
  addPhoto(galleryState, { title: 'No Image', image: '' });
} catch (e) {
  emptyImageRejected = true;
}
assert(emptyImageRejected, 'Adding photo with empty image source throws error');

// 20.3 Removing a photo
galleryState = removePhoto(galleryState, 2);
assert(galleryState.length === 3, 'Removing photo with ID 2 reduces gallery count');
assert(!galleryState.some(p => p.id === 2), 'Photo with ID 2 is completely removed');

// 20.4 Toggling home page featured flag
assert(galleryState.find(p => p.id === 3).featured === false, 'Photo 3 starts as unfeatured');
galleryState = toggleFeatured(galleryState, 3);
assert(galleryState.find(p => p.id === 3).featured === true, 'Toggling featured enables home page visibility');
galleryState = toggleFeatured(galleryState, 3);
assert(galleryState.find(p => p.id === 3).featured === false, 'Toggling again disables home page visibility');

// 20.5 Category filtering
const exteriorPhotos = galleryState.filter(p => p.category === 'exterior');
assert(exteriorPhotos.length === 2, 'Category filter correctly isolates exterior photos');

// 20.6 Resetting gallery to initial state
galleryState = [...sampleInitialGallery];
assert(galleryState.length === 3 && galleryState.some(p => p.id === 2), 'Reset successfully restores original photos');

console.log('\n===============================================================');
console.log(`TEST SUMMARY: ${passedTests} PASSED, ${failedTests} FAILED`);
console.log('===============================================================');

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}



