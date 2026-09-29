import { supabase } from '../lib/supabaseClient';
import { getCanonicalRoomImages } from '../lib/roomImageUtils';

/**
 * Real Supabase Room Service
 * Interacts with public.room_types, public.rooms, public.room_images, public.amenities, public.room_amenities
 */
export const roomService = {
  /**
   * Fetch all room types with images and amenities from Supabase
   */
  getRoomTypes: async () => {
    const { data, error } = await supabase
      .from('room_types')
      .select(`
        *,
        room_images (
          id,
          image_url,
          alt_text,
          display_order
        ),
        room_amenities (
          amenities (
            id,
            name,
            icon,
            description
          )
        )
      `)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching room_types:', error);
      throw new Error(error.message || 'Failed to load rooms.');
    }

    // Format room_types for UI consumption
    return (data || []).map((rt) => {
      const nameLower = (rt.name || '').toLowerCase();
      const categoryKey = nameLower;

      const canonicalImages = getCanonicalRoomImages({ name: rt.name, title: rt.name });
      const images = canonicalImages;

      // Extract amenities list
      const amenitiesList = (rt.room_amenities || [])
        .map((ra) => ra.amenities?.name)
        .filter(Boolean);

      let category = 'deluxe';
      if (nameLower.includes('executive')) category = 'executive';

      return {
        id: rt.id,
        title: rt.name || 'Sanctuary Room',
        name: rt.name,
        category,
        price: Number(rt.base_price) || 0,
        base_price: Number(rt.base_price) || 0,
        originalPrice: Math.round((Number(rt.base_price) || 0) * 1.2),
        maxGuests: rt.max_guests || 2,
        occupancy: `${rt.max_guests || 2} Guests`,
        bedType: rt.bed_type || 'King Bed',
        size_sqft: rt.size_sqft,
        size: rt.size_sqft ? `${rt.size_sqft} Sq.Ft` : '190 Sq.Ft',
        bathroomCount: rt.bathroom_count || 1,
        view: rt.view_type || (categoryKey === 'deluxe ac' ? 'Courtyard View' : 'City View'),
        status: rt.status || 'active',
        shortDesc: rt.description ? `${rt.description.slice(0, 110)}...` : '',
        description: rt.description || 'Refined modern sanctuary accommodation in Moshi, Pimpri-Chinchwad.',
        images,
        image: images[0],
        amenities: amenitiesList.length > 0 ? amenitiesList : [
          'High-Speed Wi-Fi',
          'Rainfall Walk-in Shower',
          'Wardrobe & Luggage Area',
          '24/7 Room Service Access'
        ]
      };
    });
  },

  /**
   * Update base_price of a room_type in public.room_types
   */
  updateRoomTypePrice: async (roomTypeId, newPrice) => {
    const priceNum = Number(newPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      throw new Error("Please enter a valid price amount greater than 0.");
    }

    const { data, error } = await supabase
      .from('room_types')
      .update({
        base_price: priceNum,
        updated_at: new Date().toISOString()
      })
      .eq('id', roomTypeId)
      .select()
      .single();

    if (error) {
      console.error("Error updating room type price in Supabase:", error);
      throw new Error(error.message || "Failed to update room price in database.");
    }

    return data;
  },

  /**
   * Fetch all physical rooms joined with room_types
   */
  getPhysicalRooms: async () => {
    const { data, error } = await supabase
      .from('rooms')
      .select(`
        *,
        room_types (
          id,
          name,
          base_price
        )
      `)
      .order('room_number', { ascending: true });

    if (error) {
      console.error('Error fetching physical rooms:', error);
      return [];
    }
    return data || [];
  },

  /**
   * Update physical room status in public.rooms ('available', 'maintenance', 'inactive')
   */
  updatePhysicalRoomStatus: async (roomId, newStatus) => {
    const statusLower = (newStatus || 'available').toLowerCase();
    const validStatuses = ['available', 'maintenance', 'inactive'];
    if (!validStatuses.includes(statusLower)) {
      throw new Error(`Invalid status. Status must be one of: available, maintenance, inactive.`);
    }

    const { data, error } = await supabase
      .from('rooms')
      .update({
        status: statusLower,
        updated_at: new Date().toISOString()
      })
      .eq('id', roomId)
      .select()
      .single();

    if (error) {
      console.error("Error updating physical room status in Supabase:", error);
      throw new Error(error.message || "Failed to update physical room status.");
    }

    return data;
  },

  /**
   * Add a new physical room to public.rooms
   */
  addPhysicalRoom: async ({ roomNumber, roomTypeId, floorNumber = 1, status = 'available' }) => {
    if (!roomNumber) {
      throw new Error("Room number is required.");
    }
    if (!roomTypeId) {
      throw new Error("Room type is required.");
    }

    const statusLower = (status || 'available').toLowerCase();
    const floorNum = Number(floorNumber) || 1;

    const { data, error } = await supabase
      .from('rooms')
      .insert([
        {
          room_number: String(roomNumber).trim(),
          room_type_id: roomTypeId,
          floor_number: floorNum,
          status: statusLower
        }
      ])
      .select(`
        *,
        room_types (*)
      `)
      .single();

    if (error) {
      console.error("Error adding physical room to Supabase:", error);
      if (
        error.code === '23505' ||
        error.message?.toLowerCase().includes('unique') ||
        error.message?.toLowerCase().includes('duplicate')
      ) {
        throw new Error("Room number already exists.");
      }
      throw new Error(error.message || "Failed to add new room.");
    }

    return data;
  },

  /**
   * Real Room Availability Calculation
   * physical rooms NOT in maintenance/inactive
   * minus bookings overlapping: existing.check_in < requested_check_out AND existing.check_out > requested_check_in
   */
  checkAvailability: async (checkInDate, checkOutDate) => {
    if (!checkInDate || !checkOutDate) {
      return {};
    }

    // 1. Fetch physical rooms
    const { data: physicalRooms, error: roomsErr } = await supabase
      .from('rooms')
      .select('*');

    if (roomsErr) {
      console.error('Error fetching physical rooms for availability:', roomsErr);
      return {};
    }

    // Filter out maintenance/inactive physical rooms
    const activePhysicalRooms = (physicalRooms || []).filter(
      (r) => r.status !== 'maintenance' && r.status !== 'inactive'
    );

    // 2. Fetch blocking overlapping bookings
    // Overlap condition: existing.check_in < requested_check_out AND existing.check_out > requested_check_in
    const { data: overlappingBookings, error: bookingsErr } = await supabase
      .from('bookings')
      .select('room_id, booking_status, check_in, check_out')
      .lt('check_in', checkOutDate)
      .gt('check_out', checkInDate)
      .in('booking_status', ['pending', 'confirmed', 'checked_in']);

    if (bookingsErr) {
      console.error('Error fetching overlapping bookings:', bookingsErr);
    }

    const bookedRoomIds = new Set(
      (overlappingBookings || []).map((b) => b.room_id)
    );

    // 3. Group availability per room_type_id
    const availabilityMap = {};

    activePhysicalRooms.forEach((pRoom) => {
      const typeId = pRoom.room_type_id;
      if (!availabilityMap[typeId]) {
        availabilityMap[typeId] = {
          totalRooms: 0,
          availableRooms: [],
          availableCount: 0,
          bookedCount: 0
        };
      }

      availabilityMap[typeId].totalRooms += 1;

      if (!bookedRoomIds.has(pRoom.id)) {
        availabilityMap[typeId].availableRooms.push(pRoom);
        availabilityMap[typeId].availableCount += 1;
      } else {
        availabilityMap[typeId].bookedCount += 1;
      }
    });

    return availabilityMap;
  },

  /**
   * Legacy Helper methods maintained for backward compatibility
   */
  updateRoomPrice: (roomsState, roomId, newPrice) => {
    const updatedPrice = Number(newPrice);
    if (isNaN(updatedPrice) || updatedPrice <= 0) {
      throw new Error("Invalid price amount. Please enter a positive number.");
    }
    return roomsState.map((room) =>
      room.id === roomId ? { ...room, price: updatedPrice } : room
    );
  },

  updateRoomStatus: (roomsState, roomId, newStatus) => {
    return roomsState.map((room) =>
      room.id === roomId ? { ...room, status: newStatus } : room
    );
  },

  addRoom: (roomsState, newRoomData) => {
    const newId = newRoomData.title.toLowerCase().replace(/\s+/g, '-') + '-' + Math.floor(100 + Math.random() * 900);
    const newRoom = {
      id: newId,
      rating: 5.0,
      reviews: 0,
      badge: "New Addition",
      images: [newRoomData.image || "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80"],
      shortDesc: newRoomData.description?.slice(0, 100) || "Elegant modern accommodation.",
      amenities: [
        "High-Speed Wi-Fi (500 Mbps)",
        "Rainfall Walk-in Shower",
        "55\" 4K Smart TV",
        "Individual Climate Control",
        "24/7 Room Service Access"
      ],
      ...newRoomData,
      price: Number(newRoomData.price) || 3500
    };
    return [newRoom, ...roomsState];
  }
};
