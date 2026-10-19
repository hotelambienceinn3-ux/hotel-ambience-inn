import { supabase } from '../lib/supabaseClient';
import { roomService } from './roomService';
import { validateStayDates, calculateNights } from '../lib/dateUtils';
import {
  validateFullName,
  validateGmail,
  validateIndianPhone,
  validateAge,
  validateGender,
  validateSpecialRequests
} from '../lib/validationUtils';

/**
 * Real Supabase Booking Service
 * Handles booking creation, availability re-checks, physical room auto-allocation, customer queries, and Admin management queries.
 */
export const bookingService = {
  /**
   * Create a new booking in Supabase
   */
  createBooking: async ({
    userId,
    roomTypeId,
    checkIn,
    checkOut,
    guestsCount = 2,
    specialRequest = '',
    guestInfo = [],
    paymentMethod = 'Pay at Hotel',
    guestName = '',
    guestEmail = '',
    guestPhone = ''
  }) => {
    // 1. Authentication check
    if (!userId) {
      throw new Error("You must be signed in to complete a reservation.");
    }
    if (!roomTypeId) {
      throw new Error("Please select a valid room category.");
    }

    // 2. Validate stay dates (Asia/Kolkata timezone, checkIn >= today, checkOut > checkIn)
    const dateVal = validateStayDates(checkIn, checkOut);
    if (!dateVal.isValid) {
      throw new Error(dateVal.error || "Please select valid check-in and check-out dates.");
    }
    const nights = dateVal.nights;

    // 3. Primary Guest validation
    const primaryName = guestName || guestInfo?.[0]?.full_name || '';
    const primaryEmail = guestEmail || guestInfo?.[0]?.email || '';
    const primaryPhone = guestPhone || guestInfo?.[0]?.phone || '';

    const nameVal = validateFullName(primaryName);
    if (!nameVal.isValid) {
      throw new Error(nameVal.error || "A valid guest name is required.");
    }

    const emailVal = validateGmail(primaryEmail);
    if (!emailVal.isValid) {
      throw new Error(emailVal.error || "A valid @gmail.com email address is required.");
    }

    const phoneVal = validateIndianPhone(primaryPhone);
    if (!phoneVal.isValid) {
      throw new Error(phoneVal.error || "A valid Indian mobile number (+91) is required.");
    }

    // Sanitize special requests text
    const specialReqVal = validateSpecialRequests(specialRequest);
    const sanitizedSpecialReq = specialReqVal.value || null;
    const numGuests = Number(guestsCount) || 2;

    // 4. EXECUTE TRUSTED DATABASE RPC CREATION
    // All reservations must execute atomically through the trusted database transaction `create_booking`.
    // Direct client-side inserts into `bookings`, `booking_guests`, or `payments` are strictly prohibited.
    const { data: rpcBooking, error: rpcErr } = await supabase.rpc('create_booking', {
      p_room_type_id: roomTypeId,
      p_check_in: checkIn,
      p_check_out: checkOut,
      p_guests_count: numGuests,
      p_guest_name: nameVal.value,
      p_guest_email: emailVal.normalizedEmail,
      p_guest_phone: phoneVal.normalizedPhone,
      p_special_request: sanitizedSpecialReq,
      p_payment_method: paymentMethod,
      p_guest_age: guestInfo?.[0]?.age ? Number(guestInfo[0].age) : null,
      p_guest_gender: guestInfo?.[0]?.gender || null
    });

    if (rpcErr) {
      console.error("[Booking Security] create_booking RPC error:", rpcErr);

      // Check if RPC is missing / unavailable on the database
      const isMissingRpc =
        rpcErr.code === 'PGRST202' ||
        rpcErr.message?.includes('Could not find the function') ||
        rpcErr.message?.includes('function public.create_booking');

      if (isMissingRpc) {
        throw new Error(
          "Secure reservation service is temporarily unavailable. Please try again later or contact the front desk."
        );
      }

      // Check for concurrent double-booking exclusion constraint violation or room sold out
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

      // Genuine business logic validation or network error
      throw new Error(rpcErr.message || "Failed to create reservation.");
    }

    if (!rpcBooking) {
      throw new Error("Reservation service did not return a confirmation record. Please contact the front desk.");
    }

    return rpcBooking;
  },

  /**
   * Fetch authenticated user's real bookings from Supabase
   */
  getUserBookings: async (userId) => {
    if (!userId) return [];

    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        rooms (
          id,
          room_number,
          floor_number,
          room_types (
            id,
            name,
            description,
            base_price,
            room_images (image_url)
          )
        ),
        booking_guests (*),
        payments (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user bookings:', error);
      return [];
    }

    return (data || []).map((b) => {
      const roomType = b.rooms?.room_types;
      const images = roomType?.room_images || [];
      const primaryImage = images[0]?.image_url || 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80';

      const rawStatus = b.booking_status || 'confirmed';
      let formattedStatus = 'Confirmed';
      if (rawStatus === 'confirmed') formattedStatus = 'Confirmed';
      else if (rawStatus === 'checked_in') formattedStatus = 'Checked-In';
      else if (rawStatus === 'checked_out') formattedStatus = 'Checked-Out';
      else if (rawStatus === 'cancelled') formattedStatus = 'Cancelled';
      else if (rawStatus === 'completed') formattedStatus = 'Completed';
      else if (rawStatus === 'pending') formattedStatus = 'Pending';

      const paymentRec = b.payments?.[0];
      const isPayAtHotel = !paymentRec || paymentRec.gateway === 'pay_at_hotel';
      const paymentMethodText = isPayAtHotel ? 'Pay Upon Arrival at Hotel' : 'Paid Online';
      const paymentStatusText = paymentRec?.payment_status === 'paid' ? 'Paid' : 'Pending / Pay at Hotel';

      const year = new Date(b.created_at || Date.now()).getFullYear();
      const refId = `HAI-${year}-${b.id.slice(0, 5).toUpperCase()}`;

      return {
        id: refId,
        fullId: b.id,
        roomTitle: roomType?.name || 'Sanctuary Room',
        roomNumber: b.rooms?.room_number || '',
        floorNumber: b.rooms?.floor_number || 1,
        roomImage: primaryImage,
        checkIn: b.check_in,
        checkOut: b.check_out,
        guests: `${b.guests} Guests`,
        totalPrice: Number(b.total_amount || b.subtotal) || 0,
        subtotal: Number(b.subtotal) || 0,
        paymentMethod: paymentMethodText,
        paymentStatus: paymentStatusText,
        rawPaymentStatus: paymentRec?.payment_status || 'pending',
        status: formattedStatus,
        rawStatus,
        createdAt: b.created_at ? b.created_at.split('T')[0] : ''
      };
    });
  },

  /**
   * ADMIN FUNCTION: Fetch ALL bookings across all customer accounts from Supabase
   */
  getAllBookingsForAdmin: async () => {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        rooms (
          id,
          room_number,
          floor_number,
          room_types (
            id,
            name,
            description,
            base_price,
            room_images (image_url)
          )
        ),
        profiles (
          id,
          full_name,
          email,
          phone
        ),
        booking_guests (*),
        payments (*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching all bookings for admin:', error);
      throw new Error(error.message || "Failed to fetch bookings for admin.");
    }

    return (data || []).map((b) => {
      const roomType = b.rooms?.room_types;
      const guestProfile = b.profiles;
      const firstGuestInfo = b.booking_guests?.[0];
      const paymentRec = b.payments?.[0];

      const rawStatus = b.booking_status || 'confirmed';
      let formattedStatus = 'Confirmed';
      if (rawStatus === 'confirmed') formattedStatus = 'Confirmed';
      else if (rawStatus === 'checked_in') formattedStatus = 'Checked-In';
      else if (rawStatus === 'checked_out') formattedStatus = 'Checked-Out';
      else if (rawStatus === 'cancelled') formattedStatus = 'Cancelled';
      else if (rawStatus === 'completed') formattedStatus = 'Completed';
      else if (rawStatus === 'pending') formattedStatus = 'Pending';

      const guestName = firstGuestInfo?.full_name || guestProfile?.full_name || guestProfile?.email?.split('@')[0] || 'Guest User';
      const guestEmail = firstGuestInfo?.email || guestProfile?.email || '';
      const guestPhone = firstGuestInfo?.phone || guestProfile?.phone || '';

      const totalAmt = Number(b.total_amount || b.subtotal) || 0;
      const isPaid = paymentRec?.payment_status === 'paid';
      const amountPaid = isPaid ? totalAmt : 0;
      const amountPending = isPaid ? 0 : totalAmt;

      const year = new Date(b.created_at || Date.now()).getFullYear();
      const refId = `HAI-${year}-${b.id.slice(0, 5).toUpperCase()}`;

      const isPayAtHotel = !paymentRec || paymentRec.gateway === 'pay_at_hotel';

      return {
        id: refId,
        fullId: b.id,
        userId: b.user_id,
        guestName,
        guestEmail,
        guestPhone,
        roomTitle: roomType?.name || 'Sanctuary Room',
        roomTypeId: roomType?.id,
        roomId: b.room_id,
        roomNumber: b.rooms?.room_number || '',
        floorNumber: b.rooms?.floor_number || 1,
        checkIn: b.check_in,
        checkOut: b.check_out,
        guests: `${b.guests} Guests`,
        guestsCount: b.guests,
        totalPrice: totalAmt,
        subtotal: Number(b.subtotal) || 0,
        amountPaid,
        amountPending,
        paymentMethod: isPayAtHotel ? 'Pay Upon Arrival' : 'Online Payment',
        paymentStatus: isPaid ? 'Paid' : 'Pending',
        rawPaymentStatus: paymentRec?.payment_status || 'pending',
        paymentId: paymentRec?.id,
        status: formattedStatus,
        rawStatus,
        createdAt: b.created_at ? b.created_at.split('T')[0] : ''
      };
    });
  },

  /**
   * ADMIN FUNCTION: Update booking status in public.bookings
   * Allowed statuses: 'pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'completed'
   */
  updateBookingStatusAdmin: async (bookingId, newStatus) => {
    const statusMap = {
      'Confirmed': 'confirmed',
      'Checked-In': 'checked_in',
      'Checked-Out': 'checked_out',
      'Cancelled': 'cancelled',
      'Completed': 'completed',
      'Pending': 'pending'
    };

    const dbStatus = statusMap[newStatus] || newStatus.toLowerCase();

    const validStatuses = ['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'completed'];
    if (!validStatuses.includes(dbStatus)) {
      throw new Error(`Invalid status transition to "${newStatus}".`);
    }

    const { data, error } = await supabase
      .from('bookings')
      .update({
        booking_status: dbStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId)
      .select()
      .single();

    if (error) {
      console.error('Error updating booking status in Supabase:', error);
      throw new Error(error.message || "Failed to update booking status in database.");
    }

    return data;
  },

  /**
   * ADMIN FUNCTION: Update payment status in public.payments (e.g., Pending -> Paid when customer pays at front desk)
   */
  updatePaymentStatusAdmin: async (bookingId, newPaymentStatus) => {
    const statusLower = (newPaymentStatus || 'pending').toLowerCase();
    
    // Confirmed live enum values: 'pending', 'paid', 'failed', 'refunded', 'cancelled'
    const validPaymentStatuses = ['pending', 'paid', 'failed', 'refunded', 'cancelled'];
    if (!validPaymentStatuses.includes(statusLower)) {
      throw new Error(`Invalid payment status "${newPaymentStatus}". Allowed values: ${validPaymentStatuses.join(', ')}.`);
    }
    
    // Check if payment record already exists
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('*')
      .eq('booking_id', bookingId)
      .maybeSingle();

    if (existingPayment) {
      const { data, error } = await supabase
        .from('payments')
        .update({
          payment_status: statusLower
        })
        .eq('id', existingPayment.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating payment status:', error);
        throw new Error(error.message || "Failed to update payment status.");
      }
      return data;
    } else {
      // Create new payment record if none exists
      const { data: booking } = await supabase
        .from('bookings')
        .select('user_id, total_amount, subtotal')
        .eq('id', bookingId)
        .single();

      const amount = Number(booking?.total_amount || booking?.subtotal || 0);

      const { data, error } = await supabase
        .from('payments')
        .insert([
          {
            booking_id: bookingId,
            user_id: booking?.user_id,
            amount,
            currency: 'INR',
            payment_status: statusLower,
            gateway: 'pay_at_hotel'
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating payment record:', error);
        throw new Error(error.message || "Failed to create payment record.");
      }
      return data;
    }
  },

  /**
   * ADMIN FUNCTION: Query all profiles from public.profiles and aggregate customer stay statistics
   */
  getAllCustomersForAdmin: async () => {
    const { data: profiles, error: profErr } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profErr) {
      console.error('Error fetching customer profiles for admin:', profErr);
      return [];
    }

    const { data: allBookings, error: bErr } = await supabase
      .from('bookings')
      .select('user_id, created_at, check_in')
      .order('created_at', { ascending: false });

    if (bErr) {
      console.warn('Error fetching bookings for customer stats:', bErr.message);
    }

    const bookingsByUserId = {};
    (allBookings || []).forEach((b) => {
      if (!bookingsByUserId[b.user_id]) {
        bookingsByUserId[b.user_id] = {
          count: 0,
          lastDate: b.check_in || b.created_at?.split('T')[0]
        };
      }
      bookingsByUserId[b.user_id].count += 1;
    });

    return (profiles || []).map((p, idx) => {
      const userStats = bookingsByUserId[p.id] || { count: 0, lastDate: 'No bookings yet' };
      return {
        id: `CUST-${100 + idx + 1}`,
        fullId: p.id,
        name: p.full_name || p.email?.split('@')[0] || 'Valued Guest',
        email: p.email,
        phone: p.phone || 'N/A',
        totalBookings: userStats.count,
        lastBookingDate: userStats.lastDate,
        status: 'Active'
      };
    });
  },

  /**
   * CUSTOMER FUNCTION: Cancel a reservation via trusted database RPC
   * Security: Direct UPDATE is blocked by RLS. The RPC verifies auth.uid() ownership,
   * checks that the booking is in a cancellable status ('confirmed' or 'pending'),
   * locks the row, and updates only the booking_status to 'cancelled'.
   */
  cancelBooking: async (bookingId) => {
    if (!bookingId) {
      throw new Error("Booking ID is required for cancellation.");
    }

    const { data, error } = await supabase.rpc('cancel_booking', {
      p_booking_id: bookingId
    });

    if (error) {
      console.error("[Booking Security] cancel_booking RPC error:", error);
      throw new Error(error.message || "Failed to cancel reservation.");
    }

    return data;
  },

  /**
   * Helper methods maintained for backward compatibility
   */
  updateBookingStatus: (bookingsState, bookingId, newStatus) => {
    return bookingsState.map((b) =>
      b.id === bookingId ? { ...b, status: newStatus } : b
    );
  },

  cancelBookingState: (bookingsState, bookingId) => {
    return bookingsState.map((b) =>
      b.id === bookingId ? { ...b, status: "Cancelled" } : b
    );
  }
};

