import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  getTodayKolkata,
  getNextDayKolkata,
  calculateNights,
  validateStayDates
} from '../lib/dateUtils';
import {
  validateFullName,
  validateGmail,
  validateIndianPhone,
  validateAge,
  validateGender,
  validateSpecialRequests,
  validateGuestForm
} from '../lib/validationUtils';

export const BookingFlowPage = () => {
  const {
    selectedRoomForBooking,
    setSelectedRoomForBooking,
    createBooking,
    user,
    rooms,
    searchCriteria,
    availability,
    isCheckingAvailability,
    availabilityError,
    searchAvailability,
    showToast
  } = useApp();

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false);

  // Selected room (defaults to first room if none selected)
  const currentRoom = selectedRoomForBooking || rooms[0] || {};

  // Timezone-aware today in Asia/Kolkata
  const todayKolkata = getTodayKolkata();
  const minCheckIn = todayKolkata;

  // Stay details initialized from search criteria (guaranteed >= today in Asia/Kolkata)
  const [checkIn, setCheckIn] = useState(
    searchCriteria.checkIn && searchCriteria.checkIn >= todayKolkata
      ? searchCriteria.checkIn
      : todayKolkata
  );
  const [checkOut, setCheckOut] = useState(
    searchCriteria.checkOut && searchCriteria.checkOut > (searchCriteria.checkIn || todayKolkata)
      ? searchCriteria.checkOut
      : getNextDayKolkata(checkIn || todayKolkata)
  );
  const [guests, setGuests] = useState(searchCriteria.guests || '2 Adults');

  // Minimum selectable check-out date is strictly later than check-in
  const minCheckOut = getNextDayKolkata(checkIn);

  // Sync date selection with real availability calculation
  useEffect(() => {
    if (checkIn && checkOut) {
      searchAvailability(checkIn, checkOut);
    }
  }, [checkIn, checkOut]);

  // Guest Information state (no dummy/fake phone or age defaults)
  const [guestName, setGuestName] = useState(user?.name || user?.full_name || '');
  const [guestEmail, setGuestEmail] = useState(user?.email || '');
  const [guestPhone, setGuestPhone] = useState(user?.phone || '');
  const [guestAge, setGuestAge] = useState('');
  const [guestGender, setGuestGender] = useState('Male');
  const [specialRequests, setSpecialRequests] = useState('');

  // Form Validation & Touched state
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

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

  // Date validation check
  const dateValidation = validateStayDates(checkIn, checkOut);
  const nights = dateValidation.isValid ? dateValidation.nights : calculateNights(checkIn, checkOut);

  // Pricing calculations (add-ons completely removed; tax included/zero)
  const pricePerNight = Number(currentRoom.price) || Number(currentRoom.base_price) || 2000;
  const roomTotal = pricePerNight * nights;
  const tax = 0;
  const grandTotal = roomTotal + tax;

  // Real room availability from Supabase (no mock fallbacks)
  const roomAvail = currentRoom?.id ? availability[currentRoom.id] : null;
  const isAvailable = Boolean(roomAvail && roomAvail.availableCount > 0);
  const availableCount = roomAvail?.availableCount ?? 0;
  const totalCount = roomAvail?.totalRooms ?? 0;

  // Find available alternative room categories when the selected room is unavailable
  const availableAlternatives = rooms.filter(
    (r) => r.id !== currentRoom.id && Boolean(availability[r.id]?.availableCount > 0)
  );

  // Handle Check-In date change with automatic Check-Out invalidation/adjustment
  const handleCheckInChange = (newCheckIn) => {
    const currentToday = getTodayKolkata();
    if (!newCheckIn || newCheckIn < currentToday) {
      showToast('Past dates cannot be selected. Check-in must be today or a future date.', 'error');
      setCheckIn(currentToday);
      if (!checkOut || checkOut <= currentToday) {
        setCheckOut(getNextDayKolkata(currentToday));
      }
      return;
    }

    setCheckIn(newCheckIn);

    // If checkout is prior to or equal to new checkIn, automatically adjust checkout
    if (!checkOut || checkOut <= newCheckIn) {
      const adjustedCheckOut = getNextDayKolkata(newCheckIn);
      setCheckOut(adjustedCheckOut);
      showToast('Check-out date was adjusted to follow your new check-in date.', 'info');
    }
  };

  // Handle Check-Out date change
  const handleCheckOutChange = (newCheckOut) => {
    const minAllowedCheckOut = getNextDayKolkata(checkIn);
    if (!newCheckOut || newCheckOut <= checkIn) {
      showToast('Check-out date must be strictly after the check-in date.', 'error');
      setCheckOut(minAllowedCheckOut);
      return;
    }
    setCheckOut(newCheckOut);
  };

  const handleCheckInBlur = () => {
    const currentToday = getTodayKolkata();
    if (!checkIn || checkIn < currentToday) {
      setCheckIn(currentToday);
      if (!checkOut || checkOut <= currentToday) {
        setCheckOut(getNextDayKolkata(currentToday));
      }
    }
  };

  const handleCheckOutBlur = () => {
    const minAllowedCheckOut = getNextDayKolkata(checkIn);
    if (!checkOut || checkOut <= checkIn) {
      setCheckOut(minAllowedCheckOut);
    }
  };

  // Live Field-specific validator on blur/change
  const validateSingleField = (field, value) => {
    let fieldErr = null;
    if (field === 'guestName') {
      const res = validateFullName(value);
      if (!res.isValid) fieldErr = res.error;
    } else if (field === 'guestEmail') {
      const res = validateGmail(value);
      if (!res.isValid) fieldErr = res.error;
    } else if (field === 'guestPhone') {
      const res = validateIndianPhone(value);
      if (!res.isValid) fieldErr = res.error;
    } else if (field === 'guestAge') {
      const res = validateAge(value);
      if (!res.isValid) fieldErr = res.error;
    } else if (field === 'guestGender') {
      const res = validateGender(value);
      if (!res.isValid) fieldErr = res.error;
    } else if (field === 'specialRequests') {
      const res = validateSpecialRequests(value);
      if (!res.isValid) fieldErr = res.error;
    }

    setErrors((prev) => {
      const updated = { ...prev };
      if (fieldErr) {
        updated[field] = fieldErr;
      } else {
        delete updated[field];
      }
      return updated;
    });

    return !fieldErr;
  };

  const handleFieldBlur = (field, value) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateSingleField(field, value);
  };

  const handleFieldChange = (field, value, setter) => {
    setter(value);
    if (touched[field]) {
      validateSingleField(field, value);
    }
  };

  // Step 1: Validate stay dates and live availability before proceeding
  const handleProceedToStep2 = () => {
    const datesRes = validateStayDates(checkIn, checkOut);
    if (!datesRes.isValid) {
      showToast(datesRes.error || 'Please select valid check-in and check-out dates.', 'error');
      return;
    }

    if (!isAvailable) {
      showToast(
        'The selected room is not available for these dates. Please choose an available alternative or change dates.',
        'error'
      );
      return;
    }

    setStep(2);
  };

  // Step 2: Validate Primary Guest form fields before proceeding to payment
  const handleProceedToStep3 = () => {
    setTouched({
      guestName: true,
      guestEmail: true,
      guestPhone: true,
      guestAge: true,
      guestGender: true,
      specialRequests: true
    });

    const formValidation = validateGuestForm({
      guestName,
      guestEmail,
      guestPhone,
      guestAge,
      guestGender,
      specialRequests
    });

    if (!formValidation.isValid) {
      setErrors(formValidation.errors);
      const missingFields = [];
      if (formValidation.errors.guestName) missingFields.push('Full Name');
      if (formValidation.errors.guestEmail) missingFields.push('Gmail Address');
      if (formValidation.errors.guestPhone) missingFields.push('Mobile Phone');
      if (formValidation.errors.guestAge) missingFields.push('Age');
      if (formValidation.errors.specialRequests) missingFields.push('Special Requests');

      showToast(`Please correct: ${missingFields.join(', ')}. (Special Requests is optional).`, 'error');
      return;
    }

    // Apply normalized values (trimmed & standardized)
    if (formValidation.normalized.guestName) setGuestName(formValidation.normalized.guestName);
    if (formValidation.normalized.guestEmail) setGuestEmail(formValidation.normalized.guestEmail);
    if (formValidation.normalized.guestPhone) setGuestPhone(formValidation.normalized.guestPhone);

    setErrors({});
    setStep(3);
  };

  // Final Step 3: Complete Booking Submission
  const handleSubmitBooking = async (e) => {
    e.preventDefault();
    if (submitting) return;

    // 1. Guard stay dates
    const datesRes = validateStayDates(checkIn, checkOut);
    if (!datesRes.isValid) {
      showToast(datesRes.error, 'error');
      setStep(1);
      return;
    }

    // 2. Guard guest info
    const formValidation = validateGuestForm({
      guestName,
      guestEmail,
      guestPhone,
      guestAge,
      guestGender,
      specialRequests
    });

    if (!formValidation.isValid) {
      setErrors(formValidation.errors);
      setTouched({
        guestName: true,
        guestEmail: true,
        guestPhone: true,
        guestAge: true,
        guestGender: true,
        specialRequests: true
      });
      const missingFields = [];
      if (formValidation.errors.guestName) missingFields.push('Full Name');
      if (formValidation.errors.guestEmail) missingFields.push('Gmail Address');
      if (formValidation.errors.guestPhone) missingFields.push('Mobile Phone');
      if (formValidation.errors.guestAge) missingFields.push('Age');
      if (formValidation.errors.specialRequests) missingFields.push('Special Requests');

      showToast(`Please check required details: ${missingFields.join(', ')}.`, 'error');
      setStep(2);
      return;
    }

    // 3. Guard real-time availability
    if (!isAvailable) {
      showToast(
        'Sorry, availability changed or the selected room is no longer available for these dates. Please review the options.',
        'error'
      );
      setStep(1);
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
        guestName: formValidation.normalized.guestName,
        guestEmail: formValidation.normalized.guestEmail,
        guestPhone: formValidation.normalized.guestPhone,
        guestAge: formValidation.normalized.guestAge,
        guestGender: formValidation.normalized.guestGender,
        specialRequests: formValidation.normalized.specialRequests,
        paymentMethod
      });
    } catch (err) {
      // Handled via toast in AppContext
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
              <span
                className={`text-xs font-semibold hidden sm:inline-block ${
                  step >= s.num ? 'text-on-surface' : 'text-on-surface-variant'
                }`}
              >
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
            aria-expanded={mobileSummaryOpen}
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-xl">receipt_long</span>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary block">
                  Reservation Summary
                </span>
                <span className="font-serif font-bold text-sm text-on-surface">
                  {currentRoom.title || 'Room Selected'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-base text-primary">
                ₹{grandTotal.toLocaleString()}
              </span>
              <span className="material-symbols-outlined text-on-surface-variant">
                {mobileSummaryOpen ? 'expand_less' : 'expand_more'}
              </span>
            </div>
          </button>
          {mobileSummaryOpen && (
            <div className="p-4 border-t border-surface-container space-y-3.5 animate-in fade-in">
              <div className="space-y-2 text-xs text-on-surface-variant">
                <div className="flex justify-between">
                  <span>Stay Dates:</span>
                  <span className="font-bold text-on-surface">
                    {checkIn} to {checkOut} ({nights} {nights === 1 ? 'night' : 'nights'})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Occupancy:</span>
                  <span className="font-bold text-on-surface">{guests}</span>
                </div>
                <div className="flex justify-between">
                  <span>Room Rate:</span>
                  <span>₹{pricePerNight.toLocaleString()} / night</span>
                </div>
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-bold text-on-surface">₹{roomTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxes & Fees:</span>
                  <span>₹0 (Included)</span>
                </div>
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
                  <label htmlFor="room-type-select" className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">
                    Room Type Selection
                  </label>
                  <select
                    id="room-type-select"
                    value={currentRoom.id || ''}
                    onChange={(e) => {
                      const selected = rooms.find((r) => r.id === e.target.value);
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
                    <label htmlFor="booking-checkin" className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                      Check-In Date *
                    </label>
                    <input
                      id="booking-checkin"
                      type="date"
                      required
                      min={minCheckIn}
                      value={checkIn}
                      onChange={(e) => handleCheckInChange(e.target.value)}
                      onBlur={handleCheckInBlur}
                      className="w-full px-3.5 py-2.5 bg-surface-container-low border border-surface-container rounded-xl text-xs font-semibold text-on-surface outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                    />
                    <span className="text-[10px] text-on-surface-variant mt-1 block">
                      Earliest: Today ({todayKolkata})
                    </span>
                  </div>

                  <div>
                    <label htmlFor="booking-checkout" className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                      Check-Out Date *
                    </label>
                    <input
                      id="booking-checkout"
                      type="date"
                      required
                      min={minCheckOut}
                      value={checkOut}
                      onChange={(e) => handleCheckOutChange(e.target.value)}
                      onBlur={handleCheckOutBlur}
                      className="w-full px-3.5 py-2.5 bg-surface-container-low border border-surface-container rounded-xl text-xs font-semibold text-on-surface outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                    />
                    <span className="text-[10px] text-on-surface-variant mt-1 block">
                      Duration: {nights} {nights === 1 ? 'Night' : 'Nights'}
                    </span>
                  </div>

                  <div>
                    <label htmlFor="booking-guests" className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                      Guests *
                    </label>
                    <select
                      id="booking-guests"
                      value={guests}
                      onChange={(e) => setGuests(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-surface-container-low border border-surface-container rounded-xl text-xs font-semibold text-on-surface outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                    >
                      <option value="1 Adult">1 Adult</option>
                      <option value="2 Adults">2 Adults</option>
                      <option value="2 Adults + 1 Child">2 Adults + 1 Child</option>
                      <option value="3 Adults">3 Adults</option>
                    </select>
                  </div>
                </div>

                {/* Real Availability Indicator */}
                <div className="p-3.5 bg-surface-container-low rounded-xl border border-surface-container flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <span className="font-medium text-on-surface-variant">Live Room Availability:</span>
                  {isCheckingAvailability ? (
                    <span className="text-on-surface-variant font-medium animate-pulse flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
                      Checking live inventory...
                    </span>
                  ) : availabilityError ? (
                    <div className="flex items-center gap-2">
                      <span className="text-error font-semibold">Could not verify availability</span>
                      <button
                        type="button"
                        onClick={() => searchAvailability(checkIn, checkOut)}
                        className="text-primary font-bold underline hover:no-underline text-xs"
                      >
                        Retry
                      </button>
                    </div>
                  ) : isAvailable ? (
                    <span className="font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded inline-flex items-center gap-1">
                      <span>✓</span>
                      <span>
                        {availableCount} of {totalCount} {totalCount === 1 ? 'room' : 'rooms'} available for these dates
                      </span>
                    </span>
                  ) : (
                    <span className="font-bold text-error bg-red-100 px-2.5 py-1 rounded inline-flex items-center gap-1">
                      <span>✕</span>
                      <span>Not available for selected dates</span>
                    </span>
                  )}
                </div>

                {/* Unavailable Room Notice & Alternative Room Recommendations */}
                {!isCheckingAvailability && !isAvailable && (
                  <div className="p-4 bg-amber-50/80 border border-amber-200/80 rounded-xl space-y-3">
                    <div className="flex items-start gap-2.5">
                      <span className="material-symbols-outlined text-amber-700 text-xl shrink-0 mt-0.5">
                        event_busy
                      </span>
                      <div>
                        <h4 className="font-bold text-xs text-amber-900 uppercase tracking-wide">
                          {currentRoom.title} is Unavailable for Your Dates
                        </h4>
                        <p className="text-xs text-amber-800 mt-0.5">
                          All rooms in this category are reserved for {checkIn} to {checkOut}.
                          Please pick another category below or choose different stay dates.
                        </p>
                      </div>
                    </div>

                    {availableAlternatives.length > 0 ? (
                      <div className="space-y-2 pt-2 border-t border-amber-200/60">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900 block">
                          Available Alternative Rooms:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {availableAlternatives.map((alt) => (
                            <button
                              key={alt.id}
                              type="button"
                              onClick={() => setSelectedRoomForBooking(alt)}
                              className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-amber-200 hover:border-primary hover:shadow-sm transition-all text-left group"
                            >
                              <div>
                                <span className="font-bold text-xs text-on-surface block group-hover:text-primary transition-colors">
                                  {alt.title}
                                </span>
                                <span className="text-[11px] text-emerald-700 font-semibold">
                                  {availability[alt.id]?.availableCount} available • ₹{alt.price.toLocaleString()}/nt
                                </span>
                              </div>
                              <span className="text-xs font-bold text-primary px-2.5 py-1 bg-primary/10 rounded-md shrink-0">
                                Select →
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-amber-900 font-medium">
                        No rooms are available for these specific dates. Please try searching different dates.
                      </p>
                    )}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleProceedToStep2}
                  disabled={!isAvailable || isCheckingAvailability}
                  className={`w-full py-3.5 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md mt-4 ${
                    isAvailable && !isCheckingAvailability
                      ? 'bg-primary text-on-primary hover:bg-primary-container'
                      : 'bg-surface-container text-on-surface-variant cursor-not-allowed opacity-60'
                  }`}
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
                  {/* Full Name */}
                  <div>
                    <label htmlFor="guest-fullname" className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                      Full Name *
                    </label>
                    <input
                      id="guest-fullname"
                      type="text"
                      required
                      value={guestName}
                      onChange={(e) => handleFieldChange('guestName', e.target.value, setGuestName)}
                      onBlur={(e) => handleFieldBlur('guestName', e.target.value)}
                      placeholder="e.g. Aarav Sharma"
                      aria-invalid={Boolean(errors.guestName)}
                      aria-describedby={errors.guestName ? 'guestName-error' : undefined}
                      className={`w-full px-4 py-2.5 bg-surface-container-low border rounded-xl text-xs font-semibold text-on-surface outline-none transition-colors focus:ring-1 focus:ring-primary ${
                        errors.guestName ? 'border-error ring-1 ring-error/20 bg-error/5' : 'border-surface-container'
                      }`}
                    />
                    {errors.guestName && (
                      <p id="guestName-error" role="alert" className="text-error text-[11px] mt-1 flex items-center gap-1 font-medium">
                        <span className="material-symbols-outlined text-[13px]">error</span>
                        {errors.guestName}
                      </p>
                    )}
                  </div>

                  {/* Gmail Address */}
                  <div>
                    <label htmlFor="guest-email" className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                      Email Address (Gmail Only) *
                    </label>
                    <input
                      id="guest-email"
                      type="email"
                      required
                      value={guestEmail}
                      onChange={(e) => handleFieldChange('guestEmail', e.target.value, setGuestEmail)}
                      onBlur={(e) => handleFieldBlur('guestEmail', e.target.value)}
                      placeholder="name@gmail.com"
                      aria-invalid={Boolean(errors.guestEmail)}
                      aria-describedby={errors.guestEmail ? 'guestEmail-error' : undefined}
                      className={`w-full px-4 py-2.5 bg-surface-container-low border rounded-xl text-xs font-semibold text-on-surface outline-none transition-colors focus:ring-1 focus:ring-primary ${
                        errors.guestEmail ? 'border-error ring-1 ring-error/20 bg-error/5' : 'border-surface-container'
                      }`}
                    />
                    {errors.guestEmail && (
                      <p id="guestEmail-error" role="alert" className="text-error text-[11px] mt-1 flex items-center gap-1 font-medium">
                        <span className="material-symbols-outlined text-[13px]">error</span>
                        {errors.guestEmail}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Mobile Phone */}
                  <div>
                    <label htmlFor="guest-phone" className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                      Mobile Phone (+91) *
                    </label>
                    <input
                      id="guest-phone"
                      type="tel"
                      required
                      value={guestPhone}
                      onChange={(e) => handleFieldChange('guestPhone', e.target.value, setGuestPhone)}
                      onBlur={(e) => handleFieldBlur('guestPhone', e.target.value)}
                      placeholder="+91 9876543210"
                      aria-invalid={Boolean(errors.guestPhone)}
                      aria-describedby={errors.guestPhone ? 'guestPhone-error' : undefined}
                      className={`w-full px-4 py-2.5 bg-surface-container-low border rounded-xl text-xs font-semibold text-on-surface outline-none transition-colors focus:ring-1 focus:ring-primary ${
                        errors.guestPhone ? 'border-error ring-1 ring-error/20 bg-error/5' : 'border-surface-container'
                      }`}
                    />
                    {errors.guestPhone && (
                      <p id="guestPhone-error" role="alert" className="text-error text-[11px] mt-1 flex items-center gap-1 font-medium">
                        <span className="material-symbols-outlined text-[13px]">error</span>
                        {errors.guestPhone}
                      </p>
                    )}
                  </div>

                  {/* Age (Optional) */}
                  <div>
                    <label htmlFor="guest-age" className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                      Age <span className="text-[10px] font-normal lowercase">(optional)</span>
                    </label>
                    <input
                      id="guest-age"
                      type="number"
                      min="18"
                      max="120"
                      value={guestAge}
                      onChange={(e) => handleFieldChange('guestAge', e.target.value, setGuestAge)}
                      onBlur={(e) => handleFieldBlur('guestAge', e.target.value)}
                      placeholder="e.g. 28"
                      aria-invalid={Boolean(errors.guestAge)}
                      aria-describedby={errors.guestAge ? 'guestAge-error' : undefined}
                      className={`w-full px-4 py-2.5 bg-surface-container-low border rounded-xl text-xs font-semibold text-on-surface outline-none transition-colors focus:ring-1 focus:ring-primary ${
                        errors.guestAge ? 'border-error ring-1 ring-error/20 bg-error/5' : 'border-surface-container'
                      }`}
                    />
                    {errors.guestAge && (
                      <p id="guestAge-error" role="alert" className="text-error text-[11px] mt-1 flex items-center gap-1 font-medium">
                        <span className="material-symbols-outlined text-[13px]">error</span>
                        {errors.guestAge}
                      </p>
                    )}
                  </div>

                  {/* Gender (Optional) */}
                  <div>
                    <label htmlFor="guest-gender" className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                      Gender <span className="text-[10px] font-normal lowercase">(optional)</span>
                    </label>
                    <select
                      id="guest-gender"
                      value={guestGender}
                      onChange={(e) => handleFieldChange('guestGender', e.target.value, setGuestGender)}
                      onBlur={(e) => handleFieldBlur('guestGender', e.target.value)}
                      className="w-full px-4 py-2.5 bg-surface-container-low border border-surface-container rounded-xl text-xs font-semibold text-on-surface outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Special Requests */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label htmlFor="guest-special-requests" className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                      Special Requests / Arrival Notes <span className="text-[10px] font-normal lowercase">(optional)</span>
                    </label>
                    <span className="text-[10px] text-on-surface-variant">
                      {specialRequests.length}/500 chars
                    </span>
                  </div>
                  <textarea
                    id="guest-special-requests"
                    rows={3}
                    maxLength={500}
                    value={specialRequests}
                    onChange={(e) => handleFieldChange('specialRequests', e.target.value, setSpecialRequests)}
                    onBlur={(e) => handleFieldBlur('specialRequests', e.target.value)}
                    placeholder="e.g. Quiet room preferred, early check-in around 12:00 PM if available."
                    aria-invalid={Boolean(errors.specialRequests)}
                    aria-describedby={errors.specialRequests ? 'specialRequests-error' : undefined}
                    className={`w-full px-4 py-2.5 bg-surface-container-low border rounded-xl text-xs text-on-surface outline-none transition-colors focus:ring-1 focus:ring-primary ${
                      errors.specialRequests ? 'border-error ring-1 ring-error/20 bg-error/5' : 'border-surface-container'
                    }`}
                  />
                  {errors.specialRequests && (
                    <p id="specialRequests-error" role="alert" className="text-error text-[11px] mt-1 flex items-center gap-1 font-medium">
                      <span className="material-symbols-outlined text-[13px]">error</span>
                      {errors.specialRequests}
                    </p>
                  )}
                  <span className="text-[11px] text-on-surface-variant/70 mt-1 block">
                    Optional — you may leave this blank and proceed with your booking.
                  </span>
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
                    onClick={handleProceedToStep3}
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
                      <span>
                        You will be prompted to sign in or create an account when confirming. Your booking details will be preserved.
                      </span>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {[
                    {
                      id: 'Pay at Hotel',
                      title: 'Pay Upon Arrival at Hotel',
                      desc: 'No advance charge required. Pay by cash or card at the front desk upon check-in.'
                    },
                    {
                      id: 'Credit Card',
                      title: 'Credit / Debit Card (Online Guarantee)',
                      desc: 'Secure card authorization with 256-bit encryption.'
                    },
                    {
                      id: 'UPI / NetBanking',
                      title: 'UPI / Google Pay / NetBanking',
                      desc: 'Instant UPI QR payment or direct net banking.'
                    }
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
                  <span className="material-symbols-outlined text-emerald-700 text-xl shrink-0">
                    verified_user
                  </span>
                  <p className="text-xs text-emerald-900 font-medium">
                    Your reservation is backed by Hotel Ambience Inn's direct-booking best rate and flexible 24-hour cancellation guarantee.
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
                    disabled={submitting || !isAvailable}
                    className="w-2/3 py-3.5 bg-primary text-on-primary font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-primary-container transition-all shadow-xl flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
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
                <span className="font-bold text-on-surface">
                  {nights} {nights === 1 ? 'Night' : 'Nights'}
                </span>
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
