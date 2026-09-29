import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

export const BookingFlowPage = () => {
  const {
    selectedRoomForBooking,
    setSelectedRoomForBooking,
    createBooking,
    user,
    rooms,
    searchCriteria,
    setSearchCriteria,
    availability,
    isCheckingAvailability,
    searchAvailability,
    showToast
  } = useApp();

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false);

  // Selected room (defaults to first room if none selected)
  const currentRoom = selectedRoomForBooking || rooms[0] || {};

  // Stay details initialized from search criteria
  const [checkIn, setCheckIn] = useState(searchCriteria.checkIn || '2026-10-15');
  const [checkOut, setCheckOut] = useState(searchCriteria.checkOut || '2026-10-18');
  const [guests, setGuests] = useState(searchCriteria.guests || '2 Adults');

  // Sync date selection with availability calculation
  useEffect(() => {
    if (checkIn && checkOut) {
      searchAvailability(checkIn, checkOut);
    }
  }, [checkIn, checkOut]);

  // Addons
  const [addons, setAddons] = useState({
    breakfast: true,
    airportTransfer: false
  });

  // Guest Info
  const [guestName, setGuestName] = useState(user?.name || user?.full_name || '');
  const [guestEmail, setGuestEmail] = useState(user?.email || '');
  const [guestPhone, setGuestPhone] = useState(user?.phone || '+91 98765 43210');
  const [guestAge, setGuestAge] = useState('28');
  const [guestGender, setGuestGender] = useState('Male');
  const [specialRequests, setSpecialRequests] = useState('');

  // Payment method
  const [paymentMethod, setPaymentMethod] = useState('Pay at Hotel');

  // Synchronize user info when logged in
  useEffect(() => {
    if (user) {
      if (!guestName) setGuestName(user.name || user.full_name || '');
      if (!guestEmail) setGuestEmail(user.email || '');
      if (!guestPhone && user.phone) setGuestPhone(user.phone);
    }
  }, [user]);

  // Night calculation
  const calculateNights = () => {
    const d1 = new Date(checkIn);
    const d2 = new Date(checkOut);
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return 1;
    const diff = Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 3600 * 24));
    return diff > 0 ? diff : 1;
  };

  const nights = calculateNights();
  const pricePerNight = Number(currentRoom.price) || Number(currentRoom.base_price) || 2500;
  const roomTotal = pricePerNight * nights;
  const breakfastTotal = addons.breakfast ? 450 * nights * 2 : 0;
  const transferTotal = addons.airportTransfer ? 1200 : 0;
  const tax = 0; // Tax is 0 for now as per configuration
  const grandTotal = roomTotal + breakfastTotal + transferTotal + tax;

  // Real room availability for current room
  const roomAvail = availability[currentRoom.id] || { availableCount: 3 };
  const isAvailable = roomAvail.availableCount > 0;

  // Step 1 validation & proceed
  const handleProceedToStep2 = () => {
    if (!checkIn || !checkOut) {
      showToast('Please select both Check-In and Check-Out dates.', 'error');
      return;
    }
    const todayStr = new Date().toISOString().split('T')[0];
    if (checkIn < todayStr) {
      showToast('Check-In date cannot be in the past.', 'error');
      return;
    }
    if (checkOut <= checkIn) {
      showToast('Check-Out date must be after Check-In date.', 'error');
      return;
    }
    if (!isAvailable) {
      showToast('Selected room is not available for these dates. Please choose different dates or another room.', 'error');
      return;
    }
    setStep(2);
  };

  // Submit Booking handler
  const handleSubmitBooking = async (e) => {
    e.preventDefault();
    if (!guestName || !guestEmail) {
      showToast('Please provide primary guest name and email address.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await createBooking({
        room: currentRoom,
        checkIn,
        checkOut,
        guests,
        nights,
        guestName,
        guestEmail,
        guestPhone,
        specialRequests,
        totalPrice: grandTotal,
        paymentMethod,
        guestInfo: [
          {
            full_name: guestName,
            age: guestAge,
            gender: guestGender
          }
        ]
      });
    } catch (err) {
      // Error handling is surfaced via toast in AppContext
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full flex flex-col min-h-screen pt-32 pb-16 bg-surface">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-12 w-full">
        
        {/* Wizard Header */}
        <div className="text-center mb-8">
          <span className="text-xs font-bold uppercase tracking-widest text-primary">
            Direct Reservation Portal
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-on-surface mt-1">
            Complete Your Reservation
          </h1>
        </div>

        {/* Progress Bar */}
        <div className="mb-10 bg-surface-container-lowest p-4 rounded-2xl border border-surface-container shadow-sm flex items-center justify-between max-w-2xl mx-auto">
          {[
            { num: 1, label: 'Room & Dates' },
            { num: 2, label: 'Guest Details' },
            { num: 3, label: 'Payment & Confirm' }
          ].map((s) => (
            <div key={s.num} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center transition-all ${
                  step >= s.num
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'bg-surface-container-low text-on-surface-variant'
                }`}
              >
                {step > s.num ? '✓' : s.num}
              </div>
              <span className={`text-xs font-semibold hidden sm:inline-block ${step >= s.num ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* Mobile Compact Reservation Summary Banner */}
        <div className="lg:hidden mb-6 bg-surface-container-lowest rounded-2xl border border-surface-container/60 shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => setMobileSummaryOpen(!mobileSummaryOpen)}
            className="w-full p-4 flex items-center justify-between text-left bg-surface-container-low"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-xl">receipt_long</span>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary block">Reservation Summary</span>
                <span className="font-serif font-bold text-sm text-on-surface">{currentRoom.title || 'Room Selected'}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-base text-primary">₹{grandTotal.toLocaleString()}</span>
              <span className="material-symbols-outlined text-on-surface-variant">
                {mobileSummaryOpen ? 'expand_less' : 'expand_more'}
              </span>
            </div>
          </button>
          {mobileSummaryOpen && (
            <div className="p-4 border-t border-surface-container space-y-3.5 animate-in fade-in">
              <div className="space-y-2 text-xs text-on-surface-variant">
                <div className="flex justify-between"><span>Stay Dates:</span><span className="font-bold text-on-surface">{checkIn} to {checkOut} ({nights} {nights === 1 ? 'night' : 'nights'})</span></div>
                <div className="flex justify-between"><span>Occupancy:</span><span className="font-bold text-on-surface">{guests}</span></div>
                <div className="flex justify-between"><span>Room Rate:</span><span>₹{pricePerNight.toLocaleString()} / night</span></div>
                <div className="flex justify-between"><span>Subtotal:</span><span>₹{roomTotal.toLocaleString()}</span></div>
                {addons.breakfast && <div className="flex justify-between text-secondary font-semibold"><span>Breakfast Buffet:</span><span>+₹{breakfastTotal.toLocaleString()}</span></div>}
                {addons.airportTransfer && <div className="flex justify-between text-secondary font-semibold"><span>Airport Transfer:</span><span>+₹{transferTotal.toLocaleString()}</span></div>}
              </div>
            </div>
          )}
        </div>

        {/* Form Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main Wizard Form Column */}
          <div className="lg:col-span-8 bg-surface-container-lowest rounded-2xl p-6 sm:p-8 border border-surface-container/60 shadow-md">
            
            {/* STEP 1: Room & Stay Customization */}
            {step === 1 && (
              <div className="space-y-6">
                <h3 className="font-serif text-xl font-bold text-on-surface pb-3 border-b border-surface-container">
                  1. Select Room & Stay Details
                </h3>

                {/* Room Selector */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">
                    Room Type Selection
                  </label>
                  <select
                    value={currentRoom.id || ''}
                    onChange={(e) => {
                      const selected = rooms.find(r => r.id === e.target.value);
                      if (selected) setSelectedRoomForBooking(selected);
                    }}
                    className="w-full px-4 py-3 bg-surface-container-low border border-surface-container rounded-xl text-sm font-semibold text-on-surface outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                  >
                    {rooms.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.title} — ₹{r.price.toLocaleString()}/night ({r.size})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Dates & Guests */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                      Check-In Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={checkIn}
                      onChange={(e) => setCheckIn(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-surface-container-low border border-surface-container rounded-xl text-xs font-semibold text-on-surface outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                      Check-Out Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={checkOut}
                      onChange={(e) => setCheckOut(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-surface-container-low border border-surface-container rounded-xl text-xs font-semibold text-on-surface outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                      Guests *
                    </label>
                    <select
                      value={guests}
                      onChange={(e) => setGuests(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-surface-container-low border border-surface-container rounded-xl text-xs font-semibold text-on-surface outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="1 Adult">1 Adult</option>
                      <option value="2 Adults">2 Adults</option>
                      <option value="2 Adults + 1 Child">2 Adults + 1 Child</option>
                      <option value="3 Adults">3 Adults</option>
                    </select>
                  </div>
                </div>

                {/* Real Availability Indicator */}
                <div className="p-3.5 bg-surface-container-low rounded-xl border border-surface-container flex items-center justify-between text-xs">
                  <span className="font-medium text-on-surface-variant">Live Room Availability:</span>
                  {isCheckingAvailability ? (
                    <span className="text-on-surface-variant font-medium animate-pulse">Calculating dates...</span>
                  ) : isAvailable ? (
                    <span className="font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded">
                      ✓ {roomAvail.availableCount} {roomAvail.availableCount === 1 ? 'room' : 'rooms'} available for these dates
                    </span>
                  ) : (
                    <span className="font-bold text-error bg-red-100 px-2.5 py-1 rounded">
                      ✕ Not available for selected dates
                    </span>
                  )}
                </div>

                {/* Add-ons Checklist */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-3">
                    Enhance Your Stay (Optional Add-ons)
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-center justify-between p-3.5 bg-surface-container-low rounded-xl border border-surface-container cursor-pointer hover:bg-surface-container transition-colors">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={addons.breakfast}
                          onChange={(e) => setAddons({ ...addons, breakfast: e.target.checked })}
                          className="w-4 h-4 accent-primary"
                        />
                        <div>
                          <span className="font-bold text-xs text-on-surface block">Daily Gourmet Breakfast Buffet</span>
                          <span className="text-[11px] text-on-surface-variant">Hot spread at Saffron & Spice Restaurant</span>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-primary">+₹450 / day</span>
                    </label>

                    <label className="flex items-center justify-between p-3.5 bg-surface-container-low rounded-xl border border-surface-container cursor-pointer hover:bg-surface-container transition-colors">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={addons.airportTransfer}
                          onChange={(e) => setAddons({ ...addons, airportTransfer: e.target.checked })}
                          className="w-4 h-4 accent-primary"
                        />
                        <div>
                          <span className="font-bold text-xs text-on-surface block">Airport Chauffeur Transfer</span>
                          <span className="text-[11px] text-on-surface-variant">Private luxury pickup from Pune Airport (PNQ)</span>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-primary">+₹1,200</span>
                    </label>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleProceedToStep2}
                  className="w-full py-3.5 bg-primary text-on-primary font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-primary-container transition-all shadow-md mt-4"
                >
                  Continue to Guest Info →
                </button>
              </div>
            )}

            {/* STEP 2: Guest Information */}
            {step === 2 && (
              <div className="space-y-6">
                <h3 className="font-serif text-xl font-bold text-on-surface pb-3 border-b border-surface-container">
                  2. Primary Guest Information
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="e.g. Sarthak Andhale"
                      className="w-full px-4 py-2.5 bg-surface-container-low border border-surface-container rounded-xl text-xs font-semibold text-on-surface outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full px-4 py-2.5 bg-surface-container-low border border-surface-container rounded-xl text-xs font-semibold text-on-surface outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                      Mobile Phone *
                    </label>
                    <input
                      type="tel"
                      required
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-4 py-2.5 bg-surface-container-low border border-surface-container rounded-xl text-xs font-semibold text-on-surface outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                      Age
                    </label>
                    <input
                      type="number"
                      min="18"
                      max="100"
                      value={guestAge}
                      onChange={(e) => setGuestAge(e.target.value)}
                      className="w-full px-4 py-2.5 bg-surface-container-low border border-surface-container rounded-xl text-xs font-semibold text-on-surface outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                      Gender
                    </label>
                    <select
                      value={guestGender}
                      onChange={(e) => setGuestGender(e.target.value)}
                      className="w-full px-4 py-2.5 bg-surface-container-low border border-surface-container rounded-xl text-xs font-semibold text-on-surface outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                    Special Requests / Arrival Notes
                  </label>
                  <textarea
                    rows={3}
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    placeholder="e.g. Quiet room preferred, early check-in around 12:00 PM if available."
                    className="w-full px-4 py-2.5 bg-surface-container-low border border-surface-container rounded-xl text-xs text-on-surface outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-1/3 py-3.5 border border-surface-container text-xs font-bold uppercase rounded-xl hover:bg-surface-container transition-colors"
                  >
                    ← Back
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!guestName || !guestEmail) {
                        showToast('Please fill in required guest details.', 'error');
                        return;
                      }
                      setStep(3);
                    }}
                    className="w-2/3 py-3.5 bg-primary text-on-primary font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-primary-container transition-all shadow-md"
                  >
                    Proceed to Payment →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Payment & Final Submission */}
            {step === 3 && (
              <form onSubmit={handleSubmitBooking} className="space-y-6">
                <h3 className="font-serif text-xl font-bold text-on-surface pb-3 border-b border-surface-container">
                  3. Select Payment Method & Confirm
                </h3>

                {!user && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3">
                    <span className="material-symbols-outlined text-amber-700 text-2xl shrink-0">lock</span>
                    <div className="text-xs text-amber-900">
                      <span className="font-bold block text-sm">Authentication Required</span>
                      <span>You will be prompted to sign in or create an account when confirming. Your booking details will be preserved.</span>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {[
                    { id: 'Pay at Hotel', title: 'Pay Upon Arrival at Hotel', desc: 'No advance charge required. Pay by cash/card at front desk check-in.' },
                    { id: 'Credit Card', title: 'Credit / Debit Card (Online Guarantee)', desc: 'Secure card authorization with 256-bit encryption.' },
                    { id: 'UPI / NetBanking', title: 'UPI / Google Pay / NetBanking', desc: 'Instant UPI QR payment or direct net banking.' }
                  ].map((p) => (
                    <label
                      key={p.id}
                      onClick={() => setPaymentMethod(p.id)}
                      className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                        paymentMethod === p.id
                          ? 'bg-primary/5 border-primary shadow-sm'
                          : 'bg-surface-container-low border-surface-container'
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === p.id}
                        onChange={() => setPaymentMethod(p.id)}
                        className="mt-1 accent-primary"
                      />
                      <div>
                        <span className="font-bold text-xs text-on-surface block">{p.title}</span>
                        <span className="text-[11px] text-on-surface-variant">{p.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>

                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
                  <span className="material-symbols-outlined text-emerald-700 text-xl shrink-0">verified_user</span>
                  <p className="text-xs text-emerald-900 font-medium">
                    Your reservation is backed by Hotel Ambience Inn's 24-hour risk-free cancellation guarantee.
                  </p>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="w-1/3 py-3.5 border border-surface-container text-xs font-bold uppercase rounded-xl hover:bg-surface-container transition-colors"
                  >
                    ← Back
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-2/3 py-3.5 bg-primary text-on-primary font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-primary-container transition-all shadow-xl flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <span className="inline-block w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[18px]">check_circle</span>
                        <span>Confirm & Complete Booking</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Booking Summary Column */}
          <div className="lg:col-span-4 bg-surface-container-lowest rounded-2xl p-6 border border-surface-container/60 shadow-md">
            <h4 className="font-serif text-lg font-bold text-on-surface mb-4 pb-3 border-b border-surface-container">
              Reservation Summary
            </h4>

            <div className="flex items-center gap-3 mb-4">
              <img
                src={currentRoom.image}
                alt={currentRoom.title}
                className="w-16 h-16 rounded-xl object-cover"
              />
              <div>
                <h5 className="font-bold text-sm text-on-surface">{currentRoom.title}</h5>
                <span className="text-xs text-on-surface-variant">{currentRoom.size}</span>
              </div>
            </div>

            <div className="space-y-2.5 text-xs text-on-surface-variant border-y border-surface-container py-4 mb-4">
              <div className="flex justify-between">
                <span>Check-In:</span>
                <span className="font-bold text-on-surface">{checkIn}</span>
              </div>
              <div className="flex justify-between">
                <span>Check-Out:</span>
                <span className="font-bold text-on-surface">{checkOut}</span>
              </div>
              <div className="flex justify-between">
                <span>Occupancy:</span>
                <span className="font-bold text-on-surface">{guests}</span>
              </div>
              <div className="flex justify-between">
                <span>Duration:</span>
                <span className="font-bold text-on-surface">{nights} {nights === 1 ? 'Night' : 'Nights'}</span>
              </div>
            </div>

            <div className="space-y-2 text-xs font-medium text-on-surface-variant mb-4">
              <div className="flex justify-between">
                <span>Room Base Rate:</span>
                <span>₹{pricePerNight.toLocaleString()} / night</span>
              </div>
              <div className="flex justify-between">
                <span>Subtotal ({nights} nights):</span>
                <span>₹{roomTotal.toLocaleString()}</span>
              </div>
              {addons.breakfast && (
                <div className="flex justify-between text-secondary font-semibold">
                  <span>Daily Breakfast:</span>
                  <span>+₹{breakfastTotal.toLocaleString()}</span>
                </div>
              )}
              {addons.airportTransfer && (
                <div className="flex justify-between text-secondary font-semibold">
                  <span>Airport Transfer:</span>
                  <span>+₹{transferTotal.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-on-surface-variant">
                <span>Taxes & Fees:</span>
                <span>₹0 (Included)</span>
              </div>
            </div>

            <div className="pt-4 border-t border-surface-container flex items-baseline justify-between">
              <span className="font-bold text-sm text-on-surface">Total Amount:</span>
              <span className="font-serif text-2xl font-bold text-primary">
                ₹{grandTotal.toLocaleString()}
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
