import { supabase } from '../lib/supabaseClient';
import { roomService } from './roomService';

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
    guestInfo = []
  }) => {
    if (!userId) {
      throw new Error("You must be signed in to complete a reservation.");
    }
    if (!roomTypeId || !checkIn || !checkOut) {
      throw new Error("Please select valid room and check-in/check-out dates.");
    }

    // Calculate nights
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const timeDiff = checkOutDate.getTime() - checkInDate.getTime();
    const nights = Math.max(1, Math.ceil(timeDiff / (1000 * 3600 * 24)));

    // 1. Re-check real physical room availability right before insertion
    const availabilityMap = await roomService.checkAvailability(checkIn, checkOut);
    const typeAvailability = availabilityMap[roomTypeId];

    if (!typeAvailability || typeAvailability.availableCount === 0 || typeAvailability.availableRooms.length === 0) {
      throw new Error("Sorry, this room type is currently unavailable for your selected dates. Please select another room or change dates.");
    }

    // 2. Automatically allocate an available physical room
    const allocatedPhysicalRoom = typeAvailability.availableRooms[0];

    // 3. Fetch server-side base_price from public.room_types
    const { data: roomType, error: rtErr } = await supabase
      .from('room_types')
      .select('name, base_price, max_guests')
      .eq('id', roomTypeId)
      .single();

    if (rtErr || !roomType) {
      throw new Error("Failed to load room details for pricing calculation.");
    }

    const pricePerNight = Number(roomType.base_price) || 0;
    const subtotal = pricePerNight * nights;
    const tax = 0; // Tax is 0 for now as per configuration
    const discount = 0;
    const total = subtotal + tax - discount;

    // 4. Insert into public.bookings
    const { data: newBooking, error: insertErr } = await supabase
      .from('bookings')
      .insert([
        {
          user_id: userId,
          room_id: allocatedPhysicalRoom.id,
          check_in: checkIn,
          check_out: checkOut,
          guests: Number(guestsCount) || 2,
          subtotal,
          tax,
          discount,
          total,
          special_request: specialRequest || null,
          booking_status: 'pending'
        }
      ])
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
        )
      `)
      .single();

    if (insertErr) {
      console.error('Booking insertion error:', insertErr);
      if (
        insertErr.code === '23P01' ||
        insertErr.message?.toLowerCase().includes('exclusion') ||
        insertErr.message?.toLowerCase().includes('overlap')
      ) {
        throw new Error("Sorry, this room was just booked. Please select another room or search again.");
      }
      throw new Error(insertErr.message || "Failed to create booking.");
    }

    // 5. Insert guest information into public.booking_guests if provided
    if (guestInfo && guestInfo.length > 0) {
      const guestRecords = guestInfo.map((g) => ({
        booking_id: newBooking.id,
        full_name: g.full_name || g.fullName || 'Guest',
        age: g.age ? Number(g.age) : null,
        gender: g.gender || null
      }));

      const { error: guestErr } = await supabase
        .from('booking_guests')
        .insert(guestRecords);

      if (guestErr) {
        console.warn('Error saving booking guests:', guestErr.message);
      }
    }

    return newBooking;
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
        booking_guests (*)
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

      const rawStatus = b.booking_status || 'pending';
      let formattedStatus = 'Pending';
      if (rawStatus === 'confirmed') formattedStatus = 'Confirmed';
      else if (rawStatus === 'checked_in') formattedStatus = 'Checked-In';
      else if (rawStatus === 'checked_out') formattedStatus = 'Checked-Out';
      else if (rawStatus === 'cancelled') formattedStatus = 'Cancelled';
      else if (rawStatus === 'completed') formattedStatus = 'Completed';

      return {
        id: b.id.slice(0, 8).toUpperCase(),
        fullId: b.id,
        roomTitle: roomType?.name || 'Sanctuary Room',
        roomNumber: b.rooms?.room_number || '',
        floorNumber: b.rooms?.floor_number || 1,
        roomImage: primaryImage,
        checkIn: b.check_in,
        checkOut: b.check_out,
        guests: `${b.guests} Guests`,
        totalPrice: Number(b.total) || 0,
        subtotal: Number(b.subtotal) || 0,
        tax: Number(b.tax) || 0,
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
        booking_guests (*)
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

      const rawStatus = b.booking_status || 'pending';
      let formattedStatus = 'Pending';
      if (rawStatus === 'confirmed') formattedStatus = 'Confirmed';
      else if (rawStatus === 'checked_in') formattedStatus = 'Checked-In';
      else if (rawStatus === 'checked_out') formattedStatus = 'Checked-Out';
      else if (rawStatus === 'cancelled') formattedStatus = 'Cancelled';
      else if (rawStatus === 'completed') formattedStatus = 'Completed';

      const guestName = guestProfile?.full_name || firstGuestInfo?.full_name || guestProfile?.email?.split('@')[0] || 'Guest User';
      const guestEmail = guestProfile?.email || '';
      const guestPhone = guestProfile?.phone || '';

      return {
        id: b.id.slice(0, 8).toUpperCase(),
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
        totalPrice: Number(b.total) || 0,
        subtotal: Number(b.subtotal) || 0,
        tax: Number(b.tax) || 0,
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
   * Legacy Helper methods maintained for backward compatibility
   */
  updateBookingStatus: (bookingsState, bookingId, newStatus) => {
    return bookingsState.map((b) =>
      b.id === bookingId ? { ...b, status: newStatus } : b
    );
  },

  cancelBooking: (bookingsState, bookingId) => {
    return bookingsState.map((b) =>
      b.id === bookingId ? { ...b, status: "Cancelled" } : b
    );
  }
};
