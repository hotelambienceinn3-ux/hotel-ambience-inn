import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export const AdminDashboardPage = () => {
  const {
    user,
    authLoading,
    navigate,
    openAuthModal,
    rooms,
    physicalRooms,
    updateRoomPriceAdmin,
    updateRoomStatusAdmin,
    addRoomAdmin,
    adminBookings,
    adminBookingsLoading,
    updateBookingStatusAdmin,
    adminCustomers,
    offers,
    addOffer,
    toggleOfferStatus,
    deleteOffer,
    reviews,
    approveReview,
    rejectReview,
    settings,
    updateSettings,
    showToast
  } = useApp();

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'bookings' | 'rooms' | 'pricing' | 'customers' | 'availability' | 'offers' | 'gallery' | 'reviews' | 'settings'

  // Search & Filter State
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // EDIT ROOM PRICE MODAL STATE
  const [editingRoom, setEditingRoom] = useState(null); // room type object
  const [newPriceInput, setNewPriceInput] = useState('');
  const [priceError, setPriceError] = useState('');
  const [isSavingPrice, setIsSavingPrice] = useState(false);

  // ADD ROOM MODAL STATE
  const [isAddRoomOpen, setIsAddRoomOpen] = useState(false);
  const [isSavingRoom, setIsSavingRoom] = useState(false);
  const [addRoomError, setAddRoomError] = useState('');
  const [newRoomForm, setNewRoomForm] = useState({
    roomNumber: '',
    roomTypeId: '',
    floorNumber: '1',
    status: 'available'
  });

  // ADD OFFER MODAL STATE
  const [isAddOfferOpen, setIsAddOfferOpen] = useState(false);
  const [newOfferForm, setNewOfferForm] = useState({
    title: '',
    code: '',
    discount: '',
    startDate: '',
    endDate: '',
    desc: ''
  });

  // SETTINGS FORM STATE
  const [settingsForm, setSettingsForm] = useState({
    name: settings.name,
    address: settings.address,
    phone: settings.phone,
    email: settings.email,
    checkInTime: settings.checkInTime,
    checkOutTime: settings.checkOutTime,
    policies: settings.policies
  });

  // Metric Calculations from Real Supabase Data
  const bookingsList = adminBookings || [];
  const totalBookingsCount = bookingsList.length;
  const totalRevenue = bookingsList.reduce((sum, b) => (b.rawStatus !== 'cancelled' && b.status !== 'Cancelled') ? sum + (b.totalPrice || 0) : sum, 0);
  const confirmedCount = bookingsList.filter(b => b.status === 'Confirmed' || b.rawStatus === 'confirmed').length;
  const checkedInCount = bookingsList.filter(b => b.status === 'Checked-In' || b.rawStatus === 'checked_in').length;
  
  // Physical Rooms & Today's Occupancy Calculation
  const todayStr = new Date().toISOString().split('T')[0];
  const occupiedRoomIds = new Set(
    bookingsList
      .filter((b) => ['pending', 'confirmed', 'checked_in'].includes(b.rawStatus) && b.checkIn <= todayStr && b.checkOut > todayStr)
      .map((b) => b.roomId)
  );

  const physicalRoomsList = physicalRooms.length > 0 ? physicalRooms : rooms;
  const availableRoomsCount = physicalRoomsList.filter(r => (r.status === 'available' || r.status === 'Available') && !occupiedRoomIds.has(r.id)).length;

  // Filter Bookings
  const filteredBookings = bookingsList.filter((b) => {
    if (statusFilter !== 'all' && b.status !== statusFilter && b.rawStatus !== statusFilter.toLowerCase()) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        b.id.toLowerCase().includes(term) ||
        b.guestName.toLowerCase().includes(term) ||
        b.roomTitle.toLowerCase().includes(term) ||
        b.roomNumber?.toString().includes(term)
      );
    }
    return true;
  });

  // PRICE EDIT HANDLER (SUPABASE DB UPDATE)
  const handleOpenEditPrice = (roomType) => {
    setEditingRoom(roomType);
    setNewPriceInput((roomType.price || roomType.base_price || 0).toString());
    setPriceError('');
  };

  const handleSavePrice = async (e) => {
    e.preventDefault();
    setPriceError('');

    const val = Number(newPriceInput);
    if (!newPriceInput || isNaN(val)) {
      setPriceError('Please enter a valid numeric price amount.');
      return;
    }
    if (val <= 0) {
      setPriceError('Room price must be a positive number greater than 0.');
      return;
    }

    setIsSavingPrice(true);
    try {
      const success = await updateRoomPriceAdmin(editingRoom.id, val);
      if (success) {
        setEditingRoom(null);
      }
    } catch (err) {
      setPriceError(err.message || 'Failed to update price in Supabase.');
    } finally {
      setIsSavingPrice(false);
    }
  };

  // ADD ROOM HANDLER (SUPABASE DB INSERT)
  const handleSaveNewRoom = async (e) => {
    e.preventDefault();
    setAddRoomError('');

    const targetRoomTypeId = newRoomForm.roomTypeId || rooms[0]?.id;
    if (!newRoomForm.roomNumber || !targetRoomTypeId) {
      setAddRoomError('Please provide both room number and room type.');
      return;
    }

    setIsSavingRoom(true);
    try {
      await addRoomAdmin({
        roomNumber: newRoomForm.roomNumber,
        roomTypeId: targetRoomTypeId,
        floorNumber: newRoomForm.floorNumber,
        status: newRoomForm.status
      });
      setIsAddRoomOpen(false);
      setNewRoomForm({
        roomNumber: '',
        roomTypeId: '',
        floorNumber: '1',
        status: 'available'
      });
    } catch (err) {
      setAddRoomError(err.message || 'Failed to add room.');
    } finally {
      setIsSavingRoom(false);
    }
  };

  // ADD OFFER HANDLER
  const handleSaveNewOffer = (e) => {
    e.preventDefault();
    if (!newOfferForm.title || !newOfferForm.code || !newOfferForm.discount) {
      showToast('Please fill in offer details.', 'error');
      return;
    }
    addOffer(newOfferForm);
    setIsAddOfferOpen(false);
    setNewOfferForm({ title: '', code: '', discount: '', startDate: '', endDate: '', desc: '' });
  };

  // SAVE SETTINGS HANDLER
  const handleSaveSettings = (e) => {
    e.preventDefault();
    updateSettings(settingsForm);
  };

  // ROLE & SECURITY AUTHORIZATION GUARD
  if (authLoading) {
    return (
      <div className="min-h-screen pt-32 pb-16 flex items-center justify-center bg-surface">
        <div className="flex flex-col items-center gap-3">
          <span className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></span>
          <p className="text-xs font-semibold text-on-surface-variant">Verifying security permissions...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen pt-32 pb-16 flex items-center justify-center bg-surface px-4">
        <div className="max-w-md w-full bg-surface-container-lowest p-8 rounded-2xl border border-surface-container shadow-xl text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-100 text-error flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-3xl">admin_panel_settings</span>
          </div>
          <h2 className="font-serif text-2xl font-bold text-on-surface mb-2">Access Restricted</h2>
          <p className="text-xs text-on-surface-variant font-medium mb-6 leading-relaxed">
            You do not have permission to view the Admin Operations Portal. Administrative privileges are required (<code className="bg-surface-container px-1.5 py-0.5 rounded text-primary">profiles.role = 'admin'</code>).
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate('home')}
              className="px-5 py-2.5 bg-surface-container-low border border-surface-container text-on-surface text-xs font-bold uppercase rounded-xl hover:bg-surface-container transition-colors"
            >
              Return Home
            </button>
            <button
              onClick={openAuthModal}
              className="px-5 py-2.5 bg-primary text-on-primary text-xs font-bold uppercase rounded-xl hover:bg-primary-container transition-colors shadow-md"
            >
              Sign In as Admin
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col min-h-screen pt-32 pb-16 bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 w-full">
        
        {/* Admin Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">admin_panel_settings</span>
              Hotel Operations & Management Command
            </span>
            <h1 className="font-serif text-3xl font-bold text-on-surface mt-0.5">
              Ambience Inn Admin Portal
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3 py-1.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
              Real Supabase Sync Active
            </span>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="bg-surface-container-lowest rounded-2xl p-2 border border-surface-container shadow-sm mb-8 overflow-x-auto flex items-center gap-1 scrollbar-none">
          {[
            { id: 'overview', label: 'Dashboard', icon: 'dashboard' },
            { id: 'bookings', label: 'Bookings', icon: 'book_online', badge: bookingsList.length },
            { id: 'rooms', label: 'Rooms', icon: 'king_bed' },
            { id: 'pricing', label: 'Room Pricing ⚡', icon: 'payments', highlight: true },
            { id: 'customers', label: 'Customers', icon: 'groups' },
            { id: 'availability', label: 'Availability', icon: 'event_available' },
            { id: 'offers', label: 'Offers', icon: 'local_offer' },
            { id: 'gallery', label: 'Gallery', icon: 'photo_library' },
            { id: 'reviews', label: 'Reviews', icon: 'rate_review' },
            { id: 'settings', label: 'Settings', icon: 'settings' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-primary text-on-primary shadow-sm'
                  : tab.highlight
                  ? 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                  : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-lg">{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-surface-container-high text-on-surface'}`}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* TAB 1: OVERVIEW DASHBOARD */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Metrics Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-surface-container-lowest p-5 rounded-2xl border border-surface-container shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs text-on-surface-variant font-bold uppercase">Total Revenue</span>
                  <span className="font-serif text-2xl font-bold text-primary block mt-1">₹{totalRevenue.toLocaleString()}</span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined">payments</span>
                </div>
              </div>

              <div className="bg-surface-container-lowest p-5 rounded-2xl border border-surface-container shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs text-on-surface-variant font-bold uppercase">Total Bookings</span>
                  <span className="font-serif text-2xl font-bold text-on-surface block mt-1">{totalBookingsCount}</span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined">book_online</span>
                </div>
              </div>

              <div className="bg-surface-container-lowest p-5 rounded-2xl border border-surface-container shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs text-on-surface-variant font-bold uppercase">Available Rooms</span>
                  <span className="font-serif text-2xl font-bold text-emerald-700 block mt-1">{availableRoomsCount} / {physicalRoomsList.length}</span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined">meeting_room</span>
                </div>
              </div>

              <div className="bg-surface-container-lowest p-5 rounded-2xl border border-surface-container shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs text-on-surface-variant font-bold uppercase">Checked-In Guests</span>
                  <span className="font-serif text-2xl font-bold text-amber-700 block mt-1">{checkedInCount}</span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined">key</span>
                </div>
              </div>
            </div>

            {/* Recent Reservations Preview */}
            <div className="bg-surface-container-lowest rounded-2xl border border-surface-container p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif text-lg font-bold text-on-surface">Recent Reservations</h3>
                <button onClick={() => setActiveTab('bookings')} className="text-xs font-bold text-primary hover:underline">
                  View All ({bookingsList.length}) →
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-container-low border-b border-surface-container text-on-surface-variant uppercase font-bold text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Ref ID</th>
                      <th className="py-3 px-4">Guest</th>
                      <th className="py-3 px-4">Room</th>
                      <th className="py-3 px-4">Check-In / Out</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container font-medium">
                    {adminBookingsLoading ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-on-surface-variant">
                          Loading Supabase reservations...
                        </td>
                      </tr>
                    ) : bookingsList.length > 0 ? (
                      bookingsList.slice(0, 5).map((b) => (
                        <tr key={b.fullId || b.id} className="hover:bg-surface-container-low/50">
                          <td className="py-3.5 px-4 font-mono font-bold text-primary">{b.id}</td>
                          <td className="py-3.5 px-4 font-bold">{b.guestName}</td>
                          <td className="py-3.5 px-4">{b.roomTitle} {b.roomNumber ? `(#${b.roomNumber})` : ''}</td>
                          <td className="py-3.5 px-4 text-[11px]">{b.checkIn} to {b.checkOut}</td>
                          <td className="py-3.5 px-4 font-serif font-bold">₹{b.totalPrice?.toLocaleString()}</td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              b.status === 'Confirmed' ? 'bg-blue-100 text-blue-800' :
                              b.status === 'Checked-In' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {b.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            {b.status === 'Confirmed' && (
                              <button onClick={() => updateBookingStatusAdmin(b.fullId || b.id, 'Checked-In')} className="px-2 py-1 bg-emerald-700 text-white rounded text-[10px] font-bold uppercase hover:bg-emerald-800">
                                Check-In
                              </button>
                            )}
                            {b.status === 'Checked-In' && (
                              <button onClick={() => updateBookingStatusAdmin(b.fullId || b.id, 'Checked-Out')} className="px-2 py-1 bg-gray-700 text-white rounded text-[10px] font-bold uppercase hover:bg-gray-800">
                                Check-Out
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-on-surface-variant">
                          No reservations found in database.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: BOOKINGS MANAGEMENT */}
        {activeTab === 'bookings' && (
          <div className="space-y-6">
            <div className="bg-surface-container-lowest rounded-2xl p-5 border border-surface-container shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                {['all', 'Confirmed', 'Checked-In', 'Checked-Out', 'Cancelled'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setStatusFilter(f)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                      statusFilter === f
                        ? 'bg-primary text-on-primary shadow-sm'
                        : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                    }`}
                  >
                    {f === 'all' ? 'All Statuses' : f}
                  </button>
                ))}
              </div>

              <div className="relative w-full md:w-72">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-lg">search</span>
                <input
                  type="text"
                  placeholder="Search by ID, guest, room..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-surface-container-low border border-surface-container text-xs rounded-xl outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="bg-surface-container-lowest rounded-2xl border border-surface-container shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-container-low border-b border-surface-container text-on-surface-variant uppercase font-bold text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3.5 px-6">Booking Ref</th>
                      <th className="py-3.5 px-6">Guest Info</th>
                      <th className="py-3.5 px-6">Room Type</th>
                      <th className="py-3.5 px-6">Stay Dates</th>
                      <th className="py-3.5 px-6">Amount</th>
                      <th className="py-3.5 px-6">Status</th>
                      <th className="py-3.5 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container font-medium text-on-surface">
                    {filteredBookings.length > 0 ? (
                      filteredBookings.map((b) => (
                        <tr key={b.fullId || b.id} className="hover:bg-surface-container-low/50 transition-colors">
                          <td className="py-4 px-6 font-mono font-bold text-primary">{b.id}</td>
                          <td className="py-4 px-6">
                            <div className="font-bold">{b.guestName}</div>
                            <div className="text-[10px] text-on-surface-variant">{b.guestPhone || b.guestEmail}</div>
                          </td>
                          <td className="py-4 px-6 font-semibold">{b.roomTitle} {b.roomNumber ? `(#${b.roomNumber})` : ''}</td>
                          <td className="py-4 px-6 text-[11px]">{b.checkIn} to {b.checkOut}</td>
                          <td className="py-4 px-6 font-serif font-bold text-sm">₹{b.totalPrice?.toLocaleString()}</td>
                          <td className="py-4 px-6">
                            <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase ${
                              b.status === 'Confirmed' ? 'bg-blue-100 text-blue-800' :
                              b.status === 'Checked-In' ? 'bg-emerald-100 text-emerald-800' :
                              b.status === 'Checked-Out' ? 'bg-gray-100 text-gray-700' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {b.status}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {b.status === 'Pending' && (
                                <button onClick={() => updateBookingStatusAdmin(b.fullId || b.id, 'Confirmed')} className="px-2.5 py-1 bg-blue-700 text-white rounded text-[10px] font-bold uppercase hover:bg-blue-800">
                                  Confirm
                                </button>
                              )}
                              {b.status === 'Confirmed' && (
                                <button onClick={() => updateBookingStatusAdmin(b.fullId || b.id, 'Checked-In')} className="px-2.5 py-1 bg-emerald-700 text-white rounded text-[10px] font-bold uppercase hover:bg-emerald-800">
                                  Check-In
                                </button>
                              )}
                              {b.status === 'Checked-In' && (
                                <button onClick={() => updateBookingStatusAdmin(b.fullId || b.id, 'Checked-Out')} className="px-2.5 py-1 bg-gray-700 text-white rounded text-[10px] font-bold uppercase hover:bg-gray-800">
                                  Check-Out
                                </button>
                              )}
                              {b.status !== 'Cancelled' && b.status !== 'Checked-Out' && (
                                <button onClick={() => updateBookingStatusAdmin(b.fullId || b.id, 'Cancelled')} className="px-2.5 py-1 border border-red-200 text-error rounded text-[10px] font-bold uppercase hover:bg-red-50">
                                  Cancel
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-on-surface-variant text-xs">
                          No reservation records match your filter criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PHYSICAL ROOM MANAGEMENT */}
        {activeTab === 'rooms' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif text-xl font-bold text-on-surface">Physical Room Inventory</h3>
                <p className="text-xs text-on-surface-variant">Manage physical room details and availability status in public.rooms</p>
              </div>
              <button
                onClick={() => { setAddRoomError(''); setIsAddRoomOpen(true); }}
                className="px-4 py-2.5 bg-primary text-on-primary text-xs font-bold uppercase rounded-xl hover:bg-primary-container shadow-md flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base">add</span>
                <span>Add Physical Room</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {physicalRooms.map((pRoom) => {
                const roomTypeObj = pRoom.room_types || rooms.find(rt => rt.id === pRoom.room_type_id) || {};
                const isOccupiedToday = occupiedRoomIds.has(pRoom.id);
                const currentDbStatus = (pRoom.status || 'available').toLowerCase();

                return (
                  <div key={pRoom.id} className="bg-surface-container-lowest rounded-2xl border border-surface-container overflow-hidden shadow-sm flex flex-col justify-between">
                    <div className="p-5">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-primary">Room #{pRoom.room_number || '101'}</span>
                          {isOccupiedToday && (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-900 text-[10px] font-bold uppercase rounded">
                              Occupied Today
                            </span>
                          )}
                        </div>

                        <select
                          value={currentDbStatus}
                          onChange={(e) => updateRoomStatusAdmin(pRoom.id, e.target.value)}
                          className="text-[10px] font-bold uppercase px-2 py-1 rounded bg-surface-container-low border border-surface-container outline-none cursor-pointer"
                        >
                          <option value="available">Available</option>
                          <option value="maintenance">Maintenance</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </div>

                      <h4 className="font-serif text-lg font-bold text-on-surface">{roomTypeObj.name || roomTypeObj.title || 'Sanctuary Room'}</h4>
                      <p className="text-xs text-on-surface-variant mt-1">Floor {pRoom.floor_number || 1} • {roomTypeObj.max_guests || 2} Guests</p>

                      <div className="mt-4 pt-3 border-t border-surface-container flex items-baseline justify-between">
                        <span className="text-xs text-on-surface-variant">Nightly Rate:</span>
                        <span className="font-serif font-bold text-lg text-primary">₹{(roomTypeObj.base_price || roomTypeObj.price || 0).toLocaleString()}/nt</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: ROOM PRICING */}
        {activeTab === 'pricing' && (
          <div className="space-y-6">
            <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl flex items-start gap-3">
              <span className="material-symbols-outlined text-amber-800 text-2xl shrink-0 mt-0.5">point_of_sale</span>
              <div>
                <h3 className="font-serif text-lg font-bold text-amber-900">Hotel Staff Room Price Management</h3>
                <p className="text-xs text-amber-800 leading-relaxed mt-0.5">
                  Update nightly base prices directly in <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">public.room_types</code>. Updated prices instantly reflect across the entire public website, room catalog, and booking summaries.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {rooms.map((roomType) => (
                <div
                  key={roomType.id}
                  className="bg-surface-container-lowest rounded-2xl p-6 border border-surface-container shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-6"
                >
                  <div className="flex items-center gap-4">
                    <img src={roomType.image} alt={roomType.title} className="w-20 h-20 rounded-xl object-cover" />
                    <div>
                      <span className="text-[10px] font-bold uppercase text-primary tracking-widest">{roomType.category} Class</span>
                      <h4 className="font-serif text-xl font-bold text-on-surface">{roomType.title}</h4>
                      <p className="text-xs text-on-surface-variant mt-0.5">{roomType.size} • {roomType.occupancy}</p>
                      
                      <div className="mt-3 flex items-baseline gap-2">
                        <span className="font-serif text-2xl font-bold text-primary">
                          ₹{(roomType.price || roomType.base_price || 0).toLocaleString()}
                        </span>
                        <span className="text-xs text-on-surface-variant font-medium">/ night</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenEditPrice(roomType)}
                    className="px-5 py-3 bg-primary text-on-primary font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-primary-container shadow-md transition-all shrink-0 flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-base">edit</span>
                    <span>Edit Price</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: CUSTOMER DIRECTORY */}
        {activeTab === 'customers' && (
          <div className="bg-surface-container-lowest rounded-2xl border border-surface-container shadow-sm overflow-hidden">
            <div className="p-5 border-b border-surface-container flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold text-on-surface">Registered Guest Directory</h3>
              <span className="text-xs text-on-surface-variant font-medium">Total Registered: {adminCustomers.length}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-container-low border-b border-surface-container text-on-surface-variant uppercase font-bold text-[10px]">
                  <tr>
                    <th className="py-3.5 px-6">Customer Name</th>
                    <th className="py-3.5 px-6">Contact Info</th>
                    <th className="py-3.5 px-6">Total Stays</th>
                    <th className="py-3.5 px-6">Last Booking</th>
                    <th className="py-3.5 px-6">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container font-medium text-on-surface">
                  {adminCustomers.length > 0 ? (
                    adminCustomers.map((c) => (
                      <tr key={c.fullId || c.id} className="hover:bg-surface-container-low/50">
                        <td className="py-4 px-6 font-bold">{c.name}</td>
                        <td className="py-4 px-6">
                          <div>{c.email}</div>
                          <div className="text-[10px] text-on-surface-variant">{c.phone}</div>
                        </td>
                        <td className="py-4 px-6 font-bold">{c.totalBookings} stay(s)</td>
                        <td className="py-4 px-6">{c.lastBookingDate}</td>
                        <td className="py-4 px-6">
                          <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase rounded">
                            {c.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-on-surface-variant">
                        No customer profiles found in database.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 6: AVAILABILITY MATRIX */}
        {activeTab === 'availability' && (
          <div className="bg-surface-container-lowest rounded-2xl p-6 border border-surface-container shadow-sm space-y-6">
            <h3 className="font-serif text-lg font-bold text-on-surface">Room Availability Matrix</h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {physicalRoomsList.map((pRoom) => {
                const roomTypeObj = pRoom.room_types || rooms.find(rt => rt.id === pRoom.room_type_id) || {};
                const isOccupiedToday = occupiedRoomIds.has(pRoom.id);
                const currentStatus = pRoom.status || 'available';

                return (
                  <div key={pRoom.id} className="p-4 rounded-xl border bg-surface-container-low flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-mono font-bold text-primary">Room #{pRoom.room_number || '101'}</span>
                      <h4 className="font-bold text-sm text-on-surface mt-1">{roomTypeObj.name || roomTypeObj.title || 'Room'}</h4>
                    </div>
                    <div className="mt-4 flex flex-col gap-1">
                      {isOccupiedToday ? (
                        <span className="px-2.5 py-1 bg-amber-100 text-amber-800 text-[10px] font-bold uppercase rounded inline-block text-center">
                          Occupied Today
                        </span>
                      ) : (
                        <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase text-center ${
                          currentStatus === 'available' || currentStatus === 'Available' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {currentStatus}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 7: OFFERS MANAGEMENT */}
        {activeTab === 'offers' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-xl font-bold text-on-surface">Promotions & Offers</h3>
              <button
                onClick={() => setIsAddOfferOpen(true)}
                className="px-4 py-2 bg-primary text-on-primary text-xs font-bold uppercase rounded-xl hover:bg-primary-container shadow-md flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base">add</span>
                <span>Add Offer</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {offers.map((offer) => (
                <div key={offer.id} className="bg-surface-container-lowest rounded-2xl p-6 border border-surface-container shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2.5 py-1 bg-amber-100 text-amber-800 font-mono font-bold text-xs rounded">{offer.code}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${offer.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-700'}`}>
                        {offer.status}
                      </span>
                    </div>
                    <h4 className="font-serif text-lg font-bold text-on-surface">{offer.title}</h4>
                    <p className="text-xs text-on-surface-variant mt-2 leading-relaxed">{offer.desc}</p>
                    <span className="text-xs text-primary font-bold block mt-3">Discount: {offer.discount}</span>
                  </div>

                  <div className="mt-4 pt-4 border-t border-surface-container flex items-center justify-between">
                    <span className="text-[10px] text-on-surface-variant">Valid: {offer.startDate} to {offer.endDate}</span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => toggleOfferStatus(offer.id)} className="px-2.5 py-1 border text-[10px] font-bold rounded">
                        {offer.status === 'Active' ? 'Deactivate' : 'Activate'}
                      </button>
                      <button onClick={() => deleteOffer(offer.id)} className="px-2.5 py-1 border border-red-200 text-error text-[10px] font-bold rounded">
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 8: GALLERY MANAGEMENT */}
        {activeTab === 'gallery' && (
          <div className="space-y-6">
            <h3 className="font-serif text-xl font-bold text-on-surface">Gallery Management</h3>
            <p className="text-xs text-on-surface-variant">Manage showcase imagery displayed on public website</p>
          </div>
        )}

        {/* TAB 9: REVIEWS MANAGEMENT */}
        {activeTab === 'reviews' && (
          <div className="bg-surface-container-lowest rounded-2xl border border-surface-container shadow-sm p-6 space-y-4">
            <h3 className="font-serif text-lg font-bold text-on-surface mb-4">Guest Feedback Moderation</h3>
            {reviews.map((rev) => (
              <div key={rev.id} className="p-4 rounded-xl border bg-surface-container-low flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-on-surface">{rev.customerName}</span>
                    <span className="text-[10px] text-amber-500 font-bold">★ {rev.rating}.0</span>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-1">"{rev.comment}"</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {rev.status === 'Pending' ? (
                    <>
                      <button onClick={() => approveReview(rev.id)} className="px-3 py-1 bg-emerald-700 text-white text-[10px] font-bold uppercase rounded">Approve</button>
                      <button onClick={() => rejectReview(rev.id)} className="px-3 py-1 bg-red-700 text-white text-[10px] font-bold uppercase rounded">Reject</button>
                    </>
                  ) : (
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-gray-200 text-gray-800 rounded">{rev.status}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 10: HOTEL SETTINGS */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl bg-surface-container-lowest rounded-2xl p-6 sm:p-8 border border-surface-container shadow-sm">
            <h3 className="font-serif text-xl font-bold text-on-surface pb-4 border-b border-surface-container mb-6">
              Hotel Information & Policies Settings
            </h3>
            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-on-surface-variant mb-1">Hotel Property Name</label>
                <input type="text" value={settingsForm.name} onChange={(e) => setSettingsForm({ ...settingsForm, name: e.target.value })} className="w-full px-4 py-2 bg-surface-container-low border text-xs rounded-xl" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-on-surface-variant mb-1">Address</label>
                <input type="text" value={settingsForm.address} onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })} className="w-full px-4 py-2 bg-surface-container-low border text-xs rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-on-surface-variant mb-1">Phone</label>
                  <input type="text" value={settingsForm.phone} onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })} className="w-full px-4 py-2 bg-surface-container-low border text-xs rounded-xl" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-on-surface-variant mb-1">Email</label>
                  <input type="email" value={settingsForm.email} onChange={(e) => setSettingsForm({ ...settingsForm, email: e.target.value })} className="w-full px-4 py-2 bg-surface-container-low border text-xs rounded-xl" />
                </div>
              </div>
              <button type="submit" className="px-6 py-3 bg-primary text-on-primary font-bold text-xs uppercase rounded-xl shadow-md mt-4">
                Save Hotel Settings
              </button>
            </form>
          </div>
        )}

        {/* EDIT ROOM PRICE MODAL (REAL SUPABASE DB UPDATE) */}
        {editingRoom && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-surface-container-lowest w-full max-w-md rounded-2xl shadow-2xl border border-surface-container overflow-hidden max-h-[90vh] flex flex-col">
              
              <div className="bg-surface-container-low px-6 py-4 border-b border-surface-container flex items-center justify-between shrink-0">
                <div>
                  <h3 className="font-serif text-lg font-bold text-on-surface">Edit Room Price</h3>
                  <p className="text-xs text-on-surface-variant">{editingRoom.title || editingRoom.name}</p>
                </div>
                <button onClick={() => setEditingRoom(null)} className="p-1 text-on-surface-variant hover:text-on-surface">
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>

              <form onSubmit={handleSavePrice} className="p-6 space-y-4 overflow-y-auto">
                {priceError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-error font-medium flex items-center gap-2">
                    <span className="material-symbols-outlined text-base shrink-0">error</span>
                    <span>{priceError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold uppercase text-on-surface-variant mb-1">
                    Room Name
                  </label>
                  <input
                    type="text"
                    disabled
                    value={editingRoom.title || editingRoom.name}
                    className="w-full px-4 py-2.5 bg-surface-container-low border border-surface-container rounded-xl text-xs font-bold text-on-surface cursor-not-allowed opacity-75"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-on-surface-variant mb-1">
                    Price per night (INR ₹) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-2.5 text-xs font-bold text-primary">₹</span>
                    <input
                      type="number"
                      required
                      min="1"
                      step="any"
                      placeholder="e.g. 3200"
                      value={newPriceInput}
                      onChange={(e) => setNewPriceInput(e.target.value)}
                      className="w-full pl-8 pr-4 py-2.5 bg-surface-container-low border border-surface-container rounded-xl text-sm font-bold text-on-surface outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <span className="text-[11px] text-on-surface-variant mt-1 block">Current Database Price: ₹{(editingRoom.price || editingRoom.base_price)?.toLocaleString()}</span>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-surface-container">
                  <button
                    type="button"
                    onClick={() => setEditingRoom(null)}
                    className="px-4 py-2.5 border border-surface-container text-xs font-bold uppercase rounded-xl hover:bg-surface-container"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingPrice}
                    className="px-6 py-2.5 bg-primary text-on-primary text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-primary-container shadow-md flex items-center justify-center gap-2"
                  >
                    {isSavingPrice ? (
                      <span className="inline-block w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <span>Save Changes</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ADD PHYSICAL ROOM MODAL (REAL SUPABASE DB INSERT) */}
        {isAddRoomOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-surface-container-lowest w-full max-w-lg rounded-2xl shadow-2xl border border-surface-container p-6 space-y-4 max-h-[90vh] overflow-y-auto">
              <h3 className="font-serif text-lg font-bold text-on-surface border-b pb-3">Add New Physical Room</h3>
              
              {addRoomError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-error font-medium flex items-center gap-2">
                  <span className="material-symbols-outlined text-base shrink-0">error</span>
                  <span>{addRoomError}</span>
                </div>
              )}

              <form onSubmit={handleSaveNewRoom} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-on-surface-variant mb-1">Room Number *</label>
                  <input
                    type="text"
                    placeholder="e.g. 104"
                    required
                    value={newRoomForm.roomNumber}
                    onChange={(e) => setNewRoomForm({ ...newRoomForm, roomNumber: e.target.value })}
                    className="w-full px-4 py-2.5 bg-surface-container-low border border-surface-container text-xs font-semibold rounded-xl outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-on-surface-variant mb-1">Room Type *</label>
                  <select
                    value={newRoomForm.roomTypeId || (rooms[0]?.id || '')}
                    onChange={(e) => setNewRoomForm({ ...newRoomForm, roomTypeId: e.target.value })}
                    className="w-full px-4 py-2.5 bg-surface-container-low border border-surface-container text-xs font-semibold rounded-xl outline-none focus:ring-1 focus:ring-primary"
                  >
                    {rooms.map((rt) => (
                      <option key={rt.id} value={rt.id}>
                        {rt.title || rt.name} — ₹{(rt.price || rt.base_price)?.toLocaleString()}/nt
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-on-surface-variant mb-1">Floor Number</label>
                    <input
                      type="number"
                      min="1"
                      value={newRoomForm.floorNumber}
                      onChange={(e) => setNewRoomForm({ ...newRoomForm, floorNumber: e.target.value })}
                      className="w-full px-4 py-2.5 bg-surface-container-low border border-surface-container text-xs font-semibold rounded-xl outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-on-surface-variant mb-1">Status</label>
                    <select
                      value={newRoomForm.status}
                      onChange={(e) => setNewRoomForm({ ...newRoomForm, status: e.target.value })}
                      className="w-full px-4 py-2.5 bg-surface-container-low border border-surface-container text-xs font-semibold rounded-xl outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="available">Available</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-surface-container">
                  <button
                    type="button"
                    onClick={() => setIsAddRoomOpen(false)}
                    className="px-4 py-2.5 border border-surface-container text-xs font-bold uppercase rounded-xl hover:bg-surface-container"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingRoom}
                    className="px-5 py-2.5 bg-primary text-on-primary text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-primary-container shadow-md flex items-center justify-center gap-2"
                  >
                    {isSavingRoom ? (
                      <span className="inline-block w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <span>Save Room</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ADD OFFER MODAL */}
        {isAddOfferOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-surface-container-lowest w-full max-w-md rounded-2xl shadow-2xl border border-surface-container p-6 space-y-4 max-h-[90vh] overflow-y-auto">
              <h3 className="font-serif text-lg font-bold text-on-surface border-b pb-3">Create Promotion Offer</h3>
              <form onSubmit={handleSaveNewOffer} className="space-y-3">
                <input type="text" placeholder="Offer Title" required value={newOfferForm.title} onChange={(e) => setNewOfferForm({ ...newOfferForm, title: e.target.value })} className="w-full px-4 py-2 bg-surface-container-low border text-xs rounded-xl" />
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" placeholder="Promo Code (e.g. WINTER20)" required value={newOfferForm.code} onChange={(e) => setNewOfferForm({ ...newOfferForm, code: e.target.value })} className="w-full px-4 py-2 bg-surface-container-low border text-xs rounded-xl" />
                  <input type="text" placeholder="Discount (e.g. 20% OFF)" required value={newOfferForm.discount} onChange={(e) => setNewOfferForm({ ...newOfferForm, discount: e.target.value })} className="w-full px-4 py-2 bg-surface-container-low border text-xs rounded-xl" />
                </div>
                <textarea placeholder="Description" value={newOfferForm.desc} onChange={(e) => setNewOfferForm({ ...newOfferForm, desc: e.target.value })} className="w-full px-4 py-2 bg-surface-container-low border text-xs rounded-xl" rows={2} />
                <div className="flex justify-end gap-2 pt-3">
                  <button type="button" onClick={() => setIsAddOfferOpen(false)} className="px-4 py-2 border text-xs font-bold uppercase rounded-xl">Cancel</button>
                  <button type="submit" className="px-5 py-2 bg-primary text-on-primary text-xs font-bold uppercase rounded-xl">Save Offer</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
