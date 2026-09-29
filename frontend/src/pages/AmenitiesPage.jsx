import React from 'react';
import { amenitiesList } from '../data/hotelData';
import { useApp } from '../context/AppContext';

export const AmenitiesPage = () => {
  const { startBooking } = useApp();

  return (
    <div className="w-full flex flex-col min-h-screen pt-32 pb-16 bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 w-full">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-primary flex items-center justify-center gap-1 mb-2">
            <span className="material-symbols-outlined text-[16px]">stars</span>
            Boutique Services & Hospitality
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-on-surface">
            Hotel Amenities & Guest Services
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-2 leading-relaxed">
            Designed to bring equal delight to business travelers working remotely and families enjoying a tranquil escape in Moshi, Pimpri-Chinchwad.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {amenitiesList.map((item, idx) => (
            <div
              key={idx}
              className="bg-surface-container-lowest p-6 rounded-2xl border border-surface-container/60 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-5">
                  <span className="material-symbols-outlined text-3xl">{item.icon}</span>
                </div>
                <h3 className="font-serif text-xl font-bold text-on-surface mb-1">
                  {item.title}
                </h3>
                <span className="text-[11px] font-bold uppercase tracking-wider text-secondary block mb-3">
                  {item.subtitle}
                </span>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  {item.desc}
                </p>
              </div>

              <div className="mt-6 pt-3 border-t border-surface-container text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                <span>Included with Direct Stay</span>
              </div>
            </div>
          ))}
        </div>

        {/* Highlight Banner */}
        <div className="bg-surface-container-low rounded-3xl p-8 sm:p-12 border border-surface-container flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-xl">
            <span className="text-xs font-bold uppercase tracking-widest text-secondary block mb-2">
              Exclusive Member Privilege
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-on-surface mb-3">
              Direct Reservation Perks
            </h2>
            <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
              Guests booking directly through our website receive early check-in preference, complimentary high-speed fiber Wi-Fi, and priority dining reservations.
            </p>
          </div>

          <button
            onClick={() => startBooking()}
            className="px-8 py-4 bg-primary text-on-primary font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-primary-container transition-colors shadow-lg shrink-0"
          >
            Reserve Your Room Now
          </button>
        </div>

      </div>
    </div>
  );
};
