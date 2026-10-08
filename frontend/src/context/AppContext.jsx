import React, { createContext, useContext, useState, useEffect } from 'react';
import { initialRoomsData, initialBookings, initialCustomers, initialOffers, initialReviews, hotelInfo } from '../data/hotelData';
import { roomService } from '../services/roomService';
import { bookingService } from '../services/bookingService';
import { authService } from '../services/authService';
import { supabase } from '../lib/supabaseClient';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [activePage, setActivePage] = useState('home');
  const [selectedRoomForDetails, setSelectedRoomForDetails] = useState(null);
  const [selectedRoomForBooking, setSelectedRoomForBooking] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authFormKey, setAuthFormKey] = useState(0);
  const [pendingBookingData, setPendingBookingData] = useState(null);
  const [toast, setToast] = useState(null);

  // User authentication state (Supabase authenticated user profile state)
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Real Supabase Rooms (room_types) state for public website catalog
  const [rooms, setRooms] = useState(initialRoomsData);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [roomsError, setRoomsError] = useState(null);

  // Real Supabase Physical Rooms for Admin inventory
  const [physicalRooms, setPhysicalRooms] = useState([]);
  const [physicalRoomsLoading, setPhysicalRoomsLoading] = useState(false);

  // Availability map: { [roomTypeId]: { totalRooms, availableRooms, availableCount, bookedCount } }
  const [availability, setAvailability] = useState({});
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);

  // Real Supabase User Bookings state (for logged-in customer)
  const [userBookings, setUserBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);

  // Real Supabase All Bookings state (for Admin Dashboard)
  const [adminBookings, setAdminBookings] = useState([]);
  const [adminBookingsLoading, setAdminBookingsLoading] = useState(false);

  // Real Supabase Customers state (for Admin Directory)
  const [adminCustomers, setAdminCustomers] = useState([]);
  const [adminCustomersLoading, setAdminCustomersLoading] = useState(false);

  // Offers promotions state
  const [offers, setOffers] = useState(initialOffers);

  // Guest reviews state
  const [reviews, setReviews] = useState(initialReviews);

  // Hotel Settings state
  const [settings, setSettings] = useState(hotelInfo);

  // Latest created booking for confirmation page
  const [latestBooking, setLatestBooking] = useState(null);

  // Search parameters for room availability
  const [searchCriteria, setSearchCriteria] = useState({
    checkIn: "2026-10-15",
    checkOut: "2026-10-18",
    guests: "2 Adults",
    roomCategory: "all"
  });

  /**
   * Load real Room Types from Supabase on mount
   */
  const loadRoomTypes = async () => {
    setRoomsLoading(true);
    try {
      const data = await roomService.getRoomTypes();
      if (data && data.length > 0) {
        setRooms(data);
        setRoomsError(null);
      }
    } catch (err) {
      console.warn('Failed to fetch rooms from Supabase, using initial room data fallback:', err.message);
      setRoomsError(err.message);
    } finally {
      setRoomsLoading(false);
    }
  };

  /**
   * Load Physical Rooms for Admin inventory
   */
  const loadPhysicalRooms = async () => {
    setPhysicalRoomsLoading(true);
    try {
      const data = await roomService.getPhysicalRooms();
      setPhysicalRooms(data || []);
    } catch (err) {
      console.error('Failed to fetch physical rooms:', err);
    } finally {
      setPhysicalRoomsLoading(false);
    }
  };

  useEffect(() => {
    loadRoomTypes();
    loadPhysicalRooms();
  }, []);

  /**
   * Calculate Real Room Availability whenever checkIn or checkOut dates change
   */
  const searchAvailability = async (checkInDate, checkOutDate) => {
    const checkIn = checkInDate || searchCriteria.checkIn;
    const checkOut = checkOutDate || searchCriteria.checkOut;

    if (!checkIn || !checkOut) return;

    setIsCheckingAvailability(true);
    try {
      const map = await roomService.checkAvailability(checkIn, checkOut);
      setAvailability(map);
    } catch (err) {
      console.error('Error calculating room availability:', err);
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  useEffect(() => {
    searchAvailability(searchCriteria.checkIn, searchCriteria.checkOut);
  }, [searchCriteria.checkIn, searchCriteria.checkOut]);

  /**
   * Fetch authenticated user's real bookings from Supabase
   */
  const loadUserBookings = async (userId) => {
    if (!userId) {
      setUserBookings([]);
      return;
    }

    setBookingsLoading(true);
    try {
      const data = await bookingService.getUserBookings(userId);
      setUserBookings(data);
    } catch (err) {
      console.error('Error fetching user bookings:', err);
    } finally {
      setBookingsLoading(false);
    }
  };

  /**
   * ADMIN DATA LOADER: Loads all bookings & customer directory from Supabase
   */
  const loadAdminData = async () => {
    setAdminBookingsLoading(true);
    setAdminCustomersLoading(true);
    try {
      const [allB, allC] = await Promise.all([
        bookingService.getAllBookingsForAdmin(),
        bookingService.getAllCustomersForAdmin()
      ]);
      setAdminBookings(allB || []);
      setAdminCustomers(allC || []);
    } catch (err) {
      console.error("Error loading admin Supabase data:", err);
    } finally {
      setAdminBookingsLoading(false);
      setAdminCustomersLoading(false);
    }
  };

  /**
   * Supabase Session Listener & Profile Sync
   */
  const syncUserProfile = async (session) => {
    if (!session?.user) {
      setUser(null);
      setUserBookings([]);
      setAdminBookings([]);
      setAdminCustomers([]);
      setAuthLoading(false);
      return;
    }

    const authUser = session.user;
    try {
      const dbProfile = await authService.getUserProfile(authUser.id);
      
      const combinedUserData = {
        id: authUser.id,
        email: authUser.email,
        name: dbProfile?.full_name || authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Valued Guest',
        full_name: dbProfile?.full_name || authUser.user_metadata?.full_name || '',
        phone: dbProfile?.phone || '',
        avatar_url: dbProfile?.avatar_url || '',
        role: dbProfile?.role || 'customer',
      };

      setUser(combinedUserData);
      loadUserBookings(authUser.id);

      if (dbProfile?.role === 'admin') {
        loadAdminData();
      }
    } catch (err) {
      console.error("Error fetching user profile:", err);
      setUser({
        id: authUser.id,
        email: authUser.email,
        name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Valued Guest',
        full_name: authUser.user_metadata?.full_name || '',
        phone: '',
        role: 'customer'
      });
    } finally {
      setAuthLoading(false);
    }
  };

  useEffect(() => {
    authService.getCurrentSession()
      .then((session) => {
        syncUserProfile(session);
      })
      .catch(() => {
        setAuthLoading(false);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      syncUserProfile(session);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Toast Helper
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const navigate = (page) => {
    setActivePage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openRoomDetails = (room) => {
    setSelectedRoomForDetails(room);
  };

  const closeRoomDetails = () => {
    setSelectedRoomForDetails(null);
  };

  const startBooking = (room = null) => {
    if (room) {
      setSelectedRoomForBooking(room);
    }
    closeRoomDetails();
    navigate('booking');
  };

  // ============================================================================
  // REAL SUPABASE ADMIN MUTATION OPERATIONS
  // ============================================================================

  /**
   * ADMIN: Update Room Type Base Price in Supabase
   */
  const updateRoomPriceAdmin = async (roomTypeId, newPrice) => {
    if (user?.role !== 'admin') {
      showToast("Unauthorized: Administrative role required.", "error");
      return false;
    }

    try {
      await roomService.updateRoomTypePrice(roomTypeId, newPrice);
      showToast("Room price updated successfully in Supabase!", "success");
      // Refresh room types & availability
      await loadRoomTypes();
      await searchAvailability(searchCriteria.checkIn, searchCriteria.checkOut);
      return true;
    } catch (err) {
      showToast(err.message || "Unable to update price.", "error");
      return false;
    }
  };

  /**
   * ADMIN: Update Physical Room Status in Supabase ('available', 'maintenance', 'inactive')
   */
  const updateRoomStatusAdmin = async (roomId, newStatus) => {
    if (user?.role !== 'admin') {
      showToast("Unauthorized: Administrative role required.", "error");
      return false;
    }

    try {
      await roomService.updatePhysicalRoomStatus(roomId, newStatus);
      showToast(`Room status updated to ${newStatus}.`, "info");
      await loadPhysicalRooms();
      await searchAvailability(searchCriteria.checkIn, searchCriteria.checkOut);
      return true;
    } catch (err) {
      showToast(err.message || "Unable to update room status.", "error");
      return false;
    }
  };

  /**
   * ADMIN: Add Physical Room to Supabase
   */
  const addRoomAdmin = async ({ roomNumber, roomTypeId, floorNumber, status }) => {
    if (user?.role !== 'admin') {
      showToast("Unauthorized: Administrative role required.", "error");
      return false;
    }

    try {
      await roomService.addPhysicalRoom({
        roomNumber,
        roomTypeId,
        floorNumber,
        status
      });
      showToast("New room added successfully to Supabase!", "success");
      await loadPhysicalRooms();
      await searchAvailability(searchCriteria.checkIn, searchCriteria.checkOut);
      return true;
    } catch (err) {
      showToast(err.message || "Unable to add room.", "error");
      throw err;
    }
  };

  /**
   * ADMIN: Update Booking Status in Supabase ('confirmed', 'checked_in', 'checked_out', 'cancelled')
   */
  const updateBookingStatusAdmin = async (bookingFullId, newStatus) => {
    if (user?.role !== 'admin') {
      showToast("Unauthorized: Administrative role required.", "error");
      return false;
    }

    try {
      await bookingService.updateBookingStatusAdmin(bookingFullId, newStatus);
      showToast(`Booking status updated to ${newStatus}.`, "success");
      await loadAdminData();
      if (user?.id) {
        await loadUserBookings(user.id);
      }
      return true;
    } catch (err) {
      showToast(err.message || "Unable to update booking status.", "error");
      return false;
    }
  };

  /**
   * ADMIN: Update Payment Status in Supabase ('pending', 'paid')
   */
  const updatePaymentStatusAdmin = async (bookingFullId, newPaymentStatus) => {
    if (user?.role !== 'admin') {
      showToast("Unauthorized: Administrative role required.", "error");
      return false;
    }

    try {
      await bookingService.updatePaymentStatusAdmin(bookingFullId, newPaymentStatus);
      showToast(`Payment status updated to ${newPaymentStatus}.`, "success");
      await loadAdminData();
      if (user?.id) {
        await loadUserBookings(user.id);
      }
      return true;
    } catch (err) {
      showToast(err.message || "Unable to update payment status.", "error");
      return false;
    }
  };

  // REAL SUPABASE BOOKING CREATION FOR CUSTOMERS
  const createBooking = async (bookingData) => {
    if (!user) {
      setPendingBookingData(bookingData);
      setIsAuthModalOpen(true);
      showToast("Please sign in or create an account to complete your booking.", "info");
      return false;
    }

    try {
      const targetRoom = bookingData.room || selectedRoomForBooking || rooms[0];
      const roomTypeId = targetRoom?.id;

      const guestsCountStr = bookingData.guests || searchCriteria.guests || '2';
      const guestsCount = parseInt(guestsCountStr, 10) || 2;

      const newBookingRecord = await bookingService.createBooking({
        userId: user.id,
        roomTypeId,
        checkIn: bookingData.checkIn || searchCriteria.checkIn,
        checkOut: bookingData.checkOut || searchCriteria.checkOut,
        guestsCount,
        specialRequest: bookingData.specialRequests || '',
        guestInfo: bookingData.guestName ? [{ full_name: bookingData.guestName }] : [],
        paymentMethod: bookingData.paymentMethod || 'Pay at Hotel',
        totalPrice: bookingData.totalPrice,
        subtotalPrice: bookingData.subtotal
      });

      const roomTypeInfo = newBookingRecord.rooms?.room_types;
      const formattedBooking = {
        id: newBookingRecord.formattedRefId || `HAI-${new Date().getFullYear()}-${newBookingRecord.id.slice(0, 5).toUpperCase()}`,
        fullId: newBookingRecord.id,
        roomTitle: roomTypeInfo?.name || targetRoom.title,
        roomCategory: targetRoom.category,
        roomImage: targetRoom.image,
        guestName: bookingData.guestName || user.name,
        guestEmail: bookingData.guestEmail || user.email,
        guestPhone: bookingData.guestPhone || user.phone,
        checkIn: newBookingRecord.check_in,
        checkOut: newBookingRecord.check_out,
        guests: `${newBookingRecord.guests} Guests`,
        nights: bookingData.nights || 3,
        totalPrice: Number(newBookingRecord.total_amount || newBookingRecord.subtotal || bookingData.totalPrice || 0),
        subtotal: Number(newBookingRecord.subtotal || 0),
        paymentMethod: 'Pay Upon Arrival at Hotel',
        paymentStatus: 'Pending / Pay at Hotel',
        status: 'Confirmed'
      };

      setLatestBooking(formattedBooking);
      setPendingBookingData(null);

      // Re-calculate room availability
      searchAvailability(bookingData.checkIn, bookingData.checkOut);

      // Fetch user bookings immediately
      if (user?.id) {
        await loadUserBookings(user.id);
      }
      // Always load admin data if user is admin
      if (user?.role === 'admin') {
        await loadAdminData();
      }

      showToast("Reservation created & confirmed successfully!", "success");
      navigate('confirmation');
      return true;
    } catch (err) {
      showToast(err.message || "Failed to complete reservation.", "error");
      throw err;
    }
  };

  const cancelBooking = async (bookingId) => {
    try {
      if (bookingId.length > 10) {
        await bookingService.updateBookingStatusAdmin(bookingId, 'cancelled');
      }
      showToast("Booking cancelled successfully.", "info");
      if (user?.id) loadUserBookings(user.id);
      if (user?.role === 'admin') loadAdminData();
    } catch (err) {
      showToast(err.message || "Failed to cancel booking.", "error");
    }
  };

  // AUTHENTICATION OPERATIONS
  const loginWithGoogle = async () => {
    try {
      await authService.signInWithGoogle();
    } catch (err) {
      showToast(err.message || "Failed to sign in with Google.", "error");
      throw err;
    }
  };

  const loginUser = async (email, password) => {
    try {
      const res = await authService.signIn(email, password);
      setIsAuthModalOpen(false);

      if (res?.user) {
        const dbProfile = await authService.getUserProfile(res.user.id);
        const role = dbProfile?.role || 'customer';
        const name = dbProfile?.full_name || res.user.email;
        showToast(`Welcome back, ${name}!`, "success");
        
        if (pendingBookingData) {
          showToast("Resuming your reservation creation...", "info");
          createBooking(pendingBookingData);
        } else if (role === 'admin') {
          navigate('admin');
        }
      }
      return true;
    } catch (err) {
      showToast(err.message, "error");
      throw err;
    }
  };

  const signUpUser = async (name, email, password) => {
    try {
      const res = await authService.signUp(email, password, name);
      setIsAuthModalOpen(false);

      if (res?.session) {
        showToast("Account created successfully!", "success");
        if (pendingBookingData) {
          createBooking(pendingBookingData);
        }
      } else {
        showToast("Account created! Please check your email inbox to verify your account.", "info");
      }
      return true;
    } catch (err) {
      showToast(err.message, "error");
      throw err;
    }
  };

  const resetPassword = async (email) => {
    try {
      await authService.resetPassword(email);
      showToast(`Password reset link sent to ${email}`, "info");
      return true;
    } catch (err) {
      showToast(err.message, "error");
      throw err;
    }
  };

  const logout = async () => {
    try {
      await authService.signOut();
      setUser(null);
      setUserBookings([]);
      setAdminBookings([]);
      setAdminCustomers([]);
      setIsAuthModalOpen(false);
      setAuthFormKey((prev) => prev + 1);
      showToast("Signed out successfully.", "info");
      navigate('home');
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  // OFFERS OPERATIONS
  const addOffer = (newOffer) => {
    const offer = {
      id: `OFF-0${offers.length + 1}`,
      status: "Active",
      ...newOffer
    };
    setOffers([offer, ...offers]);
    showToast("Offer created successfully.", "success");
  };

  const toggleOfferStatus = (offerId) => {
    setOffers((prev) =>
      prev.map((o) =>
        o.id === offerId
          ? { ...o, status: o.status === 'Active' ? 'Inactive' : 'Active' }
          : o
      )
    );
    showToast("Offer status updated.", "info");
  };

  const deleteOffer = (offerId) => {
    setOffers((prev) => prev.filter((o) => o.id !== offerId));
    showToast("Offer deleted.", "info");
  };

  // REVIEWS OPERATIONS
  const approveReview = (reviewId) => {
    setReviews((prev) =>
      prev.map((r) => (r.id === reviewId ? { ...r, status: "Approved" } : r))
    );
    showToast("Review approved.", "success");
  };

  const rejectReview = (reviewId) => {
    setReviews((prev) =>
      prev.map((r) => (r.id === reviewId ? { ...r, status: "Rejected" } : r))
    );
    showToast("Review rejected.", "info");
  };

  // SETTINGS OPERATIONS
  const updateSettings = (newSettings) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
    showToast("Hotel settings saved successfully.", "success");
  };

  return (
    <AppContext.Provider
      value={{
        activePage,
        navigate,
        rooms,
        roomsLoading,
        roomsError,
        physicalRooms,
        physicalRoomsLoading,
        updateRoomPriceAdmin,
        updateRoomStatusAdmin,
        addRoomAdmin,
        selectedRoomForDetails,
        openRoomDetails,
        closeRoomDetails,
        selectedRoomForBooking,
        setSelectedRoomForBooking,
        startBooking,
        bookings: userBookings,
        userBookings,
        bookingsLoading,
        adminBookings,
        adminBookingsLoading,
        adminCustomers,
        adminCustomersLoading,
        updateBookingStatusAdmin,
        updatePaymentStatusAdmin,
        latestBooking,
        createBooking,
        cancelBooking,
        customers: adminCustomers.length > 0 ? adminCustomers : initialCustomers,
        offers,
        addOffer,
        toggleOfferStatus,
        deleteOffer,
        reviews,
        approveReview,
        rejectReview,
        settings,
        updateSettings,
        searchCriteria,
        setSearchCriteria,
        availability,
        isCheckingAvailability,
        searchAvailability,
        user,
        authLoading,
        loginUser,
        signUpUser,
        loginWithGoogle,
        resetPassword,
        logout,
        authFormKey,
        isAuthModalOpen,
        openAuthModal: () => {
          setAuthFormKey((prev) => prev + 1);
          setIsAuthModalOpen(true);
        },
        closeAuthModal: () => {
          setIsAuthModalOpen(false);
          setAuthFormKey((prev) => prev + 1);
        },
        toast,
        showToast,
        closeToast: () => setToast(null)
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
