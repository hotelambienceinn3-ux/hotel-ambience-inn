import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { initialRoomsData, initialBookings, initialCustomers, initialOffers, initialReviews, hotelInfo, initialGalleryImages } from '../data/hotelData';
import { roomService } from '../services/roomService';
import { bookingService } from '../services/bookingService';
import { authService } from '../services/authService';
import { supabase } from '../lib/supabaseClient';
import { getDefaultStayDates, getTodayKolkata, getNextDayKolkata } from '../lib/dateUtils';
import { isValidUuid } from '../lib/validationUtils';

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

  // Availability map: { [roomTypeId]: { totalRooms, availableRooms, availableCount, bookedCount, isAvailable } }
  const [availability, setAvailability] = useState({});
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [availabilityError, setAvailabilityError] = useState(null);
  const availabilityRequestSeq = useRef(0);

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

  // Gallery images state (persisted to localStorage so Admin changes show on Home page & Gallery)
  const [galleryImages, setGalleryImages] = useState(() => {
    try {
      const saved = localStorage.getItem('hai_gallery_images');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn("Could not load gallery from localStorage:", e);
    }
    return initialGalleryImages;
  });

  useEffect(() => {
    try {
      localStorage.setItem('hai_gallery_images', JSON.stringify(galleryImages));
    } catch (e) {
      console.warn("Could not save gallery to localStorage:", e);
    }
  }, [galleryImages]);

  // Hotel Settings state
  const [settings, setSettings] = useState(hotelInfo);

  // Latest created booking for confirmation page
  const [latestBooking, setLatestBooking] = useState(null);

  // Dynamic default stay dates initialized using Asia/Kolkata timezone (today to tomorrow)
  const initialStay = getDefaultStayDates();
  const [searchCriteria, setSearchCriteria] = useState({
    checkIn: initialStay.checkIn,
    checkOut: initialStay.checkOut,
    guests: "2 Adults",
    roomCategory: "all"
  });

  // Ensure search criteria never retains a past check-in date
  useEffect(() => {
    const today = getTodayKolkata();
    if (searchCriteria.checkIn && searchCriteria.checkIn < today) {
      setSearchCriteria((prev) => ({
        ...prev,
        checkIn: today,
        checkOut: prev.checkOut && prev.checkOut > today ? prev.checkOut : getNextDayKolkata(today)
      }));
    }
  }, [searchCriteria.checkIn]);

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
   * Calculate Real Room Availability with race-condition protection.
   * If consecutive requests are dispatched, stale async responses are discarded.
   */
  const searchAvailability = async (checkInDate, checkOutDate) => {
    const checkIn = checkInDate || searchCriteria.checkIn;
    const checkOut = checkOutDate || searchCriteria.checkOut;

    if (!checkIn || !checkOut) return;

    const reqSeq = ++availabilityRequestSeq.current;
    setIsCheckingAvailability(true);
    setAvailabilityError(null);

    try {
      const map = await roomService.checkAvailability(checkIn, checkOut);
      // Guard against stale async responses overwriting newer availability results
      if (reqSeq === availabilityRequestSeq.current) {
        setAvailability(map);
        setAvailabilityError(null);
      }
    } catch (err) {
      if (reqSeq === availabilityRequestSeq.current) {
        console.error('Error calculating room availability:', err);
        setAvailabilityError(err.message || 'Unable to check live room availability.');
      }
    } finally {
      if (reqSeq === availabilityRequestSeq.current) {
        setIsCheckingAvailability(false);
      }
    }
  };

  useEffect(() => {
    searchAvailability(searchCriteria.checkIn, searchCriteria.checkOut);
  }, [searchCriteria.checkIn, searchCriteria.checkOut]);

  /**
   * Visible-Tab Polling Fallback for Room Availability:
   * Supabase RLS suppresses Realtime WAL events across non-admin users.
   * To prevent stale inventory when multiple guests are booking concurrently,
   * poll availability every 30 seconds ONLY when:
   * 1. The booking page is currently active (activePage === 'booking').
   * 2. The document/tab is currently visible (!document.hidden).
   * 3. No other availability request is currently in-flight.
   * When the user leaves the booking page or hides the tab, polling is paused/stopped.
   * When returning to the tab, an immediate fresh check is triggered.
   */
  useEffect(() => {
    if (activePage !== 'booking') return;

    const POLLING_INTERVAL_MS = 30000;
    let intervalId = null;

    const executePolling = () => {
      if (document.hidden) return;
      if (isCheckingAvailability) return;
      searchAvailability(searchCriteria.checkIn, searchCriteria.checkOut);
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        executePolling();
      }
    };

    intervalId = setInterval(executePolling, POLLING_INTERVAL_MS);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (intervalId) clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [activePage, searchCriteria.checkIn, searchCriteria.checkOut, isCheckingAvailability]);

  /**
   * Real-time Supabase Subscription
   * Listens for changes to bookings and rooms to keep inventory refreshed
   */
  useEffect(() => {
    const channel = supabase
      .channel('live-inventory-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        () => {
          searchAvailability();
          if (user?.id) loadUserBookings(user.id);
          if (user?.role === 'admin') loadAdminData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rooms' },
        () => {
          loadPhysicalRooms();
          searchAvailability();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [searchCriteria.checkIn, searchCriteria.checkOut, user?.id, user?.role]);

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
      let dbProfile = await authService.getUserProfile(authUser.id);
      
      // If dbProfile does not exist yet (e.g. first-time Google OAuth sign in), create/retrieve customer profile safely
      if (!dbProfile) {
        dbProfile = await authService.ensureUserProfile(authUser);
      }

      const resolvedName =
        dbProfile?.full_name ||
        authUser.user_metadata?.full_name ||
        authUser.user_metadata?.name ||
        authUser.email?.split('@')[0] ||
        'Valued Guest';

      const resolvedAvatar =
        dbProfile?.avatar_url ||
        authUser.user_metadata?.avatar_url ||
        authUser.user_metadata?.picture ||
        '';

      const combinedUserData = {
        id: authUser.id,
        email: authUser.email,
        name: resolvedName,
        full_name: dbProfile?.full_name || authUser.user_metadata?.full_name || authUser.user_metadata?.name || '',
        phone: dbProfile?.phone || '',
        avatar_url: resolvedAvatar,
        role: dbProfile?.role || 'customer',
      };

      setUser(combinedUserData);
      loadUserBookings(authUser.id);

      if (dbProfile?.role === 'admin') {
        loadAdminData();
      }
    } catch (err) {
      console.error("Error fetching user profile:", err);
      const fallbackName =
        authUser.user_metadata?.full_name ||
        authUser.user_metadata?.name ||
        authUser.email?.split('@')[0] ||
        'Valued Guest';

      const fallbackAvatar =
        authUser.user_metadata?.avatar_url ||
        authUser.user_metadata?.picture ||
        '';

      setUser({
        id: authUser.id,
        email: authUser.email,
        name: fallbackName,
        full_name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || '',
        phone: '',
        avatar_url: fallbackAvatar,
        role: 'customer'
      });
    } finally {
      setAuthLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    // Listen to Supabase auth state changes (handles OAuth redirect token parsing, initial session, signin, signout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      if (session) {
        await syncUserProfile(session);
        // Clean URL hash/query string after OAuth redirect without causing a page refresh
        if (window.location.hash.includes('access_token=') || window.location.search.includes('code=')) {
          window.history.replaceState(null, '', window.location.pathname);
        }
      } else {
        await syncUserProfile(null);
      }
    });

    // Check active session on mount
    authService.getCurrentSession()
      .then((session) => {
        if (isMounted && session) {
          syncUserProfile(session);
        }
      })
      .catch(() => {
        if (isMounted) setAuthLoading(false);
      });

    return () => {
      isMounted = false;
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
        guestName: bookingData.guestName || user.name || user.full_name || '',
        guestEmail: bookingData.guestEmail || user.email || '',
        guestPhone: bookingData.guestPhone || user.phone || '',
        guestInfo: [
          {
            full_name: bookingData.guestName || user.name || user.full_name || 'Guest',
            age: bookingData.guestAge ? Number(bookingData.guestAge) : null,
            gender: bookingData.guestGender || null
          }
        ],
        paymentMethod: bookingData.paymentMethod || 'Pay at Hotel'
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
        nights: bookingData.nights || 1,
        totalPrice: Number(newBookingRecord.total_amount || newBookingRecord.subtotal || 0),
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

  const cancelBooking = async (bookingIdentifier) => {
    try {
      if (!bookingIdentifier) return;

      // Extract string ID from string or object
      let targetUuid = typeof bookingIdentifier === 'string'
        ? bookingIdentifier.trim()
        : (bookingIdentifier?.fullId || bookingIdentifier?.id || '');

      // Resolve the actual database UUID (fullId) if a formatted reference (HAI-YYYY-XXXXX) was passed
      if (!isValidUuid(targetUuid)) {
        const pool = [...(userBookings || []), ...(adminBookings || [])];
        const match = pool.find(
          (b) => b.fullId === bookingIdentifier || b.id === bookingIdentifier
        );
        if (match?.fullId && isValidUuid(match.fullId)) {
          targetUuid = match.fullId;
        }
      }

      if (isValidUuid(targetUuid)) {
        await bookingService.cancelBooking(targetUuid);
      } else {
        throw new Error("Invalid reservation identifier for cancellation.");
      }

      showToast("Reservation cancelled successfully.", "info");
      if (user?.id) await loadUserBookings(user.id);
      if (user?.role === 'admin') await loadAdminData();
    } catch (err) {
      console.error("[Cancel Booking]", err);
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

  // GALLERY OPERATIONS
  const addGalleryImage = (newImage) => {
    if (!newImage?.image) {
      showToast("Please provide an image URL or upload a photo.", "error");
      return false;
    }
    const item = {
      id: Date.now(),
      title: newImage.title?.trim() || "Ambience Inn Sanctuary",
      category: newImage.category || "exterior",
      image: newImage.image,
      desc: newImage.desc?.trim() || "",
      featured: newImage.featured !== undefined ? newImage.featured : true
    };
    setGalleryImages((prev) => [item, ...prev]);
    showToast("Photo added to gallery successfully!", "success");
    return true;
  };

  const deleteGalleryImage = (imageId) => {
    setGalleryImages((prev) => prev.filter((img) => img.id !== imageId));
    showToast("Photo removed from gallery.", "info");
  };

  const toggleGalleryFeatured = (imageId) => {
    setGalleryImages((prev) =>
      prev.map((img) =>
        img.id === imageId ? { ...img, featured: !img.featured } : img
      )
    );
    showToast("Home page visibility updated.", "info");
  };

  const resetGalleryImages = () => {
    setGalleryImages(initialGalleryImages);
    showToast("Gallery reset to original photos.", "info");
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
        galleryImages,
        addGalleryImage,
        deleteGalleryImage,
        toggleGalleryFeatured,
        resetGalleryImages,
        settings,
        updateSettings,
        searchCriteria,
        setSearchCriteria,
        availability,
        isCheckingAvailability,
        availabilityError,
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
