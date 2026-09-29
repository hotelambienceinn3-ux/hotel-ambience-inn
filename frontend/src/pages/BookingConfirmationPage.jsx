import React from 'react';
import { useApp } from '../context/AppContext';

export const BookingConfirmationPage = () => {
  const { latestBooking, navigate } = useApp();

  const booking = latestBooking || {
    id: "HAI-89421",
    roomTitle: "Deluxe King Room",
    guestName: "Sarthak Andhale",
    guestEmail: "sarthak@example.com",
    checkIn: "2026-10-15",
    checkOut: "2026-10-18",
    guests: "2 Adults",
    totalPrice: 10497,
    paymentMethod: "Pay at Hotel",
    status: "Confirmed"
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full flex flex-col min-h-screen pt-32 pb-16 bg-surface">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-12 w-full">
        
        {/* Card */}
        <div className="bg-surface-container-lowest rounded-3xl p-8 sm:p-12 border border-surface-container/60 shadow-xl text-center">
          
          {/* Success Checkmark */}
          <div className="w-20 h-20 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <span className="material-symbols-outlined text-4xl font-bold">check_circle</span>
          </div>

          <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 block mb-1">
            Reservation Confirmed!
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-on-surface mb-2">
            Thank You, {booking.guestName}!
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant max-w-md mx-auto mb-8">
            Your reservation at Hotel Ambience Inn has been successfully confirmed. A confirmation email has been dispatched to <span className="font-bold text-on-surface">{booking.guestEmail}</span>.
          </p>

          {/* Reference Badge */}
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-surface-container-low rounded-2xl border border-surface-container mb-8">
            <span className="text-xs text-on-surface-variant font-bold uppercase tracking-wider">Booking Reference ID:</span>
            <span className="font-mono text-xl font-bold text-primary">{booking.id}</span>
          </div>

          {/* Details Table */}
          <div className="bg-surface-container-low/60 rounded-2xl p-6 text-left border border-surface-container mb-8 space-y-4">
            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-surface-container text-xs">
              <div>
                <span className="text-on-surface-variant block uppercase font-bold text-[10px]">Reserved Room</span>
                <span className="font-bold text-sm text-on-surface">{booking.roomTitle}</span>
              </div>
              <div>
                <span className="text-on-surface-variant block uppercase font-bold text-[10px]">Payment Status</span>
                <span className="inline-block mt-0.5 px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded text-[11px]">
                  {booking.paymentMethod} ({booking.status})
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-medium text-on-surface">
              <div>
                <span className="text-on-surface-variant block uppercase font-bold text-[10px]">Check-In</span>
                <span>{booking.checkIn}</span>
              </div>
              <div>
                <span className="text-on-surface-variant block uppercase font-bold text-[10px]">Check-Out</span>
                <span>{booking.checkOut}</span>
              </div>
              <div>
                <span className="text-on-surface-variant block uppercase font-bold text-[10px]">Guests</span>
                <span>{booking.guests}</span>
              </div>
              <div>
                <span className="text-on-surface-variant block uppercase font-bold text-[10px]">Total Paid</span>
                <span className="font-serif text-base font-bold text-primary">₹{booking.totalPrice.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handlePrint}
              className="w-full sm:w-auto px-6 py-3 border border-surface-container text-xs font-bold uppercase rounded-xl hover:bg-surface-container transition-colors flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">print</span>
              <span>Print / Save Receipt</span>
            </button>
            <button
              onClick={() => navigate('my-bookings')}
              className="w-full sm:w-auto px-6 py-3 bg-primary text-on-primary text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-primary-container transition-colors shadow-md flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">book_online</span>
              <span>View My Bookings</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
