import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { authService } from '../services/authService';

export const CustomerDashboardPage = () => {
  const { bookings, userBookings, bookingsLoading, cancelBooking, startBooking, user, authLoading, logout, openAuthModal, showToast } = useApp();
  const [activeTab, setActiveTab] = useState('bookings'); // 'bookings' | 'profile'

  // Profile Edit State synchronized with authenticated user
  const [profileName, setProfileName] = useState(user?.name || user?.full_name || '');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');
  const [profilePhone, setProfilePhone] = useState(user?.phone || '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileName(user.name || user.full_name || '');
      setProfileEmail(user.email || '');
      setProfilePhone(user.phone || '');
    }
  }, [user]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!user?.id) {
      showToast("You must be signed in to save profile changes.", "error");
      return;
    }

    setIsSaving(true);
    try {
      await authService.updateUserProfile(user.id, {
        full_name: profileName,
        phone: profilePhone
      });
      showToast("Profile details updated successfully!", "success");
    } catch (err) {
      showToast(err.message || "Failed to update profile details.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen pt-32 pb-16 flex items-center justify-center bg-surface">
        <div className="flex flex-col items-center gap-3">
          <span className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></span>
          <p className="text-xs font-semibold text-on-surface-variant">Loading account portal...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen pt-32 pb-16 flex items-center justify-center bg-surface px-4">
        <div className="max-w-md w-full bg-surface-container-lowest p-8 rounded-2xl border border-surface-container shadow-xl text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-3xl">account_circle</span>
          </div>
          <h2 className="font-serif text-2xl font-bold text-on-surface mb-2">Guest Account Access</h2>
          <p className="text-xs text-on-surface-variant font-medium mb-6 leading-relaxed">
            Please sign in with your email address to access your direct booking reservations, receipts, and member profile settings.
          </p>
          <button
            onClick={openAuthModal}
            className="w-full py-3 bg-primary text-on-primary text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-primary-container transition-colors shadow-md"
          >
            Sign In / Register
          </button>
        </div>
      </div>
    );
  }

  const activeBookingsList = bookings.filter((b) =>
    ['Pending', 'Confirmed', 'Checked In'].includes(b.status)
  );

  const pastBookingsList = bookings.filter((b) =>
    ['Checked Out', 'Cancelled', 'Completed'].includes(b.status)
  );

  return (
    <div className="w-full flex flex-col min-h-screen pt-32 pb-16 bg-surface">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-12 w-full">
        
        {/* Header Banner */}
        <div className="bg-surface-container-lowest rounded-2xl p-6 border border-surface-container shadow-sm mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary-container text-on-primary font-bold text-2xl flex items-center justify-center shadow-inner shrink-0">
              {user.name ? user.name.charAt(0).toUpperCase() : 'G'}
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">account_circle</span>
                Guest Privilege Portal
              </span>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-on-surface mt-0.5">
                Welcome back, {user.name || 'Valued Guest'}
              </h1>
              <p className="text-xs text-on-surface-variant font-medium">
                {user.email} • Direct Member Account
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => startBooking()}
              className="px-5 py-2.5 bg-primary text-on-primary text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-primary-container transition-colors shadow-md flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>New Booking</span>
            </button>
            <button
              onClick={logout}
              className="px-4 py-2.5 border border-surface-container text-error text-xs font-bold uppercase rounded-xl hover:bg-red-50 transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-surface-container mb-8 font-semibold text-xs">
          <button
            onClick={() => setActiveTab('bookings')}
            className={`pb-3 px-4 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'bookings'
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-base">book_online</span>
            <span>My Bookings ({bookings.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-3 px-4 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'profile'
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-base">person</span>
            <span>My Profile</span>
          </button>
        </div>

        {/* TAB 1: BOOKINGS */}
        {activeTab === 'bookings' && (
          <div className="space-y-8">
            
            {/* Current / Active Bookings */}
            <div>
              <h3 className="font-serif text-xl font-bold text-on-surface mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Active Reservations</span>
              </h3>

              {bookingsLoading ? (
                <div className="py-12 text-center text-xs text-on-surface-variant font-medium">
                  Loading your reservations...
                </div>
              ) : activeBookingsList.length > 0 ? (
                <div className="space-y-4">
                  {activeBookingsList.map((b) => (
                    <div
                      key={b.id}
                      className="bg-surface-container-lowest rounded-2xl p-6 border border-surface-container/60 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-1">
                          <span className="material-symbols-outlined text-3xl">hotel</span>
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1">
                            <span className="font-mono text-xs font-bold text-primary break-all" title={b.id}>
                              {b.id?.length > 16 ? `${b.id.slice(0, 10)}...` : b.id}
                            </span>
                            {b.roomNumber && (
                              <span className="text-xs text-on-surface-variant font-semibold">Room {b.roomNumber}</span>
                            )}
                            <span
                              className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                                b.status === 'Confirmed'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : b.status === 'Pending'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {b.status}
                            </span>
                          </div>

                          <h4 className="font-serif text-xl font-bold text-on-surface">
                            {b.roomTitle}
                          </h4>

                          <div className="flex flex-wrap items-center gap-4 text-xs text-on-surface-variant mt-2 font-medium">
                            <span>📅 Check-in: <strong>{b.checkIn}</strong></span>
                            <span>📅 Check-out: <strong>{b.checkOut}</strong></span>
                            <span>👥 {b.guests}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col md:items-end gap-2 pt-4 md:pt-0 border-t md:border-t-0 border-surface-container">
                        <span className="text-xs text-on-surface-variant font-medium">Total Amount</span>
                        <span className="font-serif text-2xl font-bold text-primary">
                          ₹{b.totalPrice?.toLocaleString()}
                        </span>
                        
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => window.print()}
                            className="px-3 py-1.5 border border-surface-container text-[11px] font-bold uppercase rounded-lg hover:bg-surface-container transition-colors flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-sm">print</span>
                            <span>Receipt</span>
                          </button>
                          {b.status !== 'Cancelled' && (
                            <button
                              onClick={() => cancelBooking(b.id)}
                              className="px-3 py-1.5 border border-red-200 text-error text-[11px] font-bold uppercase rounded-lg hover:bg-red-50 transition-colors"
                            >
                              Cancel Booking
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-surface-container-lowest rounded-2xl border border-surface-container p-8 text-center text-xs text-on-surface-variant">
                  No active upcoming reservations found for this account.
                </div>
              )}
            </div>

            {/* Past / Cancelled Bookings */}
            {pastBookingsList.length > 0 && (
              <div>
                <h3 className="font-serif text-xl font-bold text-on-surface mb-4">
                  Past & Cancelled Reservations
                </h3>
                <div className="space-y-4">
                  {pastBookingsList.map((b) => (
                    <div
                      key={b.id}
                      className="bg-surface-container-lowest/60 rounded-2xl p-5 border border-surface-container opacity-85 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-mono text-xs font-bold text-on-surface-variant break-all" title={b.id}>
                            {b.id?.length > 16 ? `${b.id.slice(0, 10)}...` : b.id}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-gray-100 text-gray-700">
                            {b.status}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-on-surface">{b.roomTitle}</h4>
                        <span className="text-xs text-on-surface-variant">
                          {b.checkIn} to {b.checkOut} • {b.guests}
                        </span>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-4">
                        <span className="font-serif font-bold text-sm text-on-surface">₹{b.totalPrice?.toLocaleString()}</span>
                        <button
                          onClick={() => window.print()}
                          className="px-3 py-1 border border-surface-container text-[10px] font-bold uppercase rounded hover:bg-surface-container"
                        >
                          View Receipt
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

        {/* TAB 2: PROFILE */}
        {activeTab === 'profile' && (
          <div className="max-w-2xl bg-surface-container-lowest rounded-2xl p-6 sm:p-8 border border-surface-container shadow-sm">
            <h3 className="font-serif text-xl font-bold text-on-surface pb-4 border-b border-surface-container mb-6">
              Personal Information & Preferences
            </h3>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface-container-low border border-surface-container rounded-xl text-xs font-semibold text-on-surface outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  disabled
                  value={profileEmail}
                  className="w-full px-4 py-2.5 bg-surface-container border border-surface-container rounded-xl text-xs font-semibold text-on-surface-variant cursor-not-allowed opacity-75"
                />
                <p className="text-[10px] text-on-surface-variant mt-1">Email address is managed via your Supabase login account.</p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                  Mobile Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="+91 98765 12345"
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface-container-low border border-surface-container rounded-xl text-xs font-semibold text-on-surface outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-3 bg-primary text-on-primary font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-primary-container transition-all shadow-md mt-4 flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <span className="inline-block w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <span>Save Changes</span>
                )}
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};
