import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { hotelInfo, amenitiesList, testimonials } from '../data/hotelData';
import { getCanonicalRoomImages } from '../lib/roomImageUtils';

export const HomePage = () => {
  const { navigate, openRoomDetails, startBooking, setSearchCriteria, searchAvailability, rooms, showToast } = useApp();
  const [activeRoomViewer, setActiveRoomViewer] = useState(null);

  const [checkIn, setCheckIn] = useState('2026-10-15');
  const [checkOut, setCheckOut] = useState('2026-10-18');
  const [guests, setGuests] = useState('2 Adults');

  const openRoomViewer = (room) => {
    const images = getCanonicalRoomImages(room);
    if (images && images.length > 0) {
      setActiveRoomViewer({ room, images, index: 0 });
    }
  };

  const handlePrevRoomImage = (e) => {
    e?.stopPropagation();
    setActiveRoomViewer((prev) => {
      if (!prev || !prev.images || prev.images.length === 0) return null;
      const newIndex = prev.index === 0 ? prev.images.length - 1 : prev.index - 1;
      return { ...prev, index: newIndex };
    });
  };

  const handleNextRoomImage = (e) => {
    e?.stopPropagation();
    setActiveRoomViewer((prev) => {
      if (!prev || !prev.images || prev.images.length === 0) return null;
      const newIndex = prev.index === prev.images.length - 1 ? 0 : prev.index + 1;
      return { ...prev, index: newIndex };
    });
  };

  React.useEffect(() => {
    if (!activeRoomViewer) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setActiveRoomViewer(null);
      if (e.key === 'ArrowLeft') handlePrevRoomImage(e);
      if (e.key === 'ArrowRight') handleNextRoomImage(e);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeRoomViewer]);

  const handleSearch = (e) => {
    e.preventDefault();

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

    setSearchCriteria((prev) => ({
      ...prev,
      checkIn,
      checkOut,
      guests
    }));

    searchAvailability(checkIn, checkOut);
    navigate('rooms');
  };

  return (
    <div className="w-full flex flex-col min-h-screen">
      
      {/* 1. HERO SECTION */}
      <section className="relative w-full min-h-[85vh] lg:min-h-[90vh] flex flex-col justify-between overflow-hidden pt-32 pb-12">
        {/* Background Image with Ambient Gradient Overlays */}
        <div className="absolute inset-0 z-0">
          <img
            src={hotelInfo.heroImage}
            alt={hotelInfo.name}
            className="w-full h-full object-cover filter brightness-[0.8] scale-[1.02] transform transition-transform duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface via-inverse-surface/40 to-black/60"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-inverse-surface/80 via-transparent to-black/40"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 w-full py-12 flex flex-col items-start justify-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-container-lowest/15 backdrop-blur-md text-surface font-semibold text-xs uppercase tracking-widest mb-6 shadow-sm border border-surface/20">
            <span className="w-2 h-2 rounded-full bg-secondary-container animate-pulse"></span>
            Boutique Hospitality • Moshi, Pimpri-Chinchwad
          </div>

          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-surface tracking-tight max-w-3xl leading-tight mb-6">
            Welcome to <br />
            <span className="italic font-normal text-secondary-fixed">
              Hotel Ambience Inn
            </span>
          </h1>

          <p className="text-base sm:text-lg text-surface-dim max-w-2xl font-light mb-8 leading-relaxed">
            Comfortable stays, thoughtful hospitality, and a memorable experience. Designed for leisure travelers and discerning business guests seeking authentic warmth and effortless city access.
          </p>

          <div className="flex flex-wrap items-center gap-4 mb-10">
            <button
              onClick={() => startBooking()}
              className="inline-flex items-center justify-center bg-primary text-on-primary font-semibold text-sm uppercase tracking-wider px-8 py-3.5 rounded-lg shadow-xl hover:bg-primary-container transition-all"
            >
              Book Your Stay
            </button>
            <button
              onClick={() => navigate('rooms')}
              className="inline-flex items-center justify-center bg-surface/15 hover:bg-surface/25 backdrop-blur-md text-surface font-semibold text-sm px-7 py-3.5 rounded-lg transition-all border border-surface/20"
            >
              Explore Accommodations
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-surface-dim text-xs sm:text-sm font-medium">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-secondary-fixed">verified</span>
              <span>Best Rate Guarantee</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-surface-dim/40"></div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-secondary-fixed">wifi</span>
              <span>Complimentary Fiber Wi-Fi</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-surface-dim/40"></div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-secondary-fixed">schedule</span>
              <span>24/7 Concierge</span>
            </div>
          </div>
        </div>

        {/* Floating Availability Console */}
        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 w-full mt-6">
          <div className="bg-surface-container-lowest text-on-surface rounded-2xl shadow-2xl p-4 sm:p-6 border border-surface-container/60">
            <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
              
              {/* Check-In Date */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-primary">calendar_today</span>
                  Check-In Date
                </label>
                <input
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl bg-surface-container-low border border-surface-container text-sm font-semibold text-on-surface outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Check-Out Date */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-primary">event_available</span>
                  Check-Out Date
                </label>
                <input
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl bg-surface-container-low border border-surface-container text-sm font-semibold text-on-surface outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Guests Selector */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-primary">group</span>
                  Guests
                </label>
                <select
                  value={guests}
                  onChange={(e) => setGuests(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl bg-surface-container-low border border-surface-container text-sm font-semibold text-on-surface outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  <option value="1 Adult">1 Adult</option>
                  <option value="2 Adults">2 Adults</option>
                  <option value="2 Adults + 1 Child">2 Adults + 1 Child</option>
                  <option value="3 Adults">3 Adults</option>
                </select>
              </div>

              {/* Search Action */}
              <button
                type="submit"
                className="w-full h-12 bg-primary hover:bg-primary-container text-on-primary font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[20px]">search</span>
                <span>Check Availability</span>
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* 2. FEATURED ACCOMMODATIONS SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 w-full py-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-1 mb-2">
              <span className="material-symbols-outlined text-[16px]">bed</span>
              Sanctuary Accommodations
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-on-surface">
              Featured Rooms & Suites
            </h2>
            <p className="text-sm text-on-surface-variant mt-2 max-w-xl">
              Thoughtfully handcrafted rooms with vertical teak paneling, rainfall showers, and ambient lighting.
            </p>
          </div>
          <button
            onClick={() => navigate('rooms')}
            className="inline-flex items-center gap-2 text-primary font-bold text-sm hover:underline"
          >
            <span>View All Accommodations</span>
            <span className="material-symbols-outlined text-lg">arrow_forward</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {rooms.slice(0, 3).map((room) => {
            const canonicalImages = getCanonicalRoomImages(room);
            const primaryImg = canonicalImages[0];
            return (
              <div
                key={room.id}
                onClick={() => openRoomViewer(room)}
                className="bg-surface-container-lowest rounded-2xl overflow-hidden border border-surface-container/60 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col group cursor-pointer"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-container">
                  <img
                    src={room.image || primaryImg}
                    alt={room.title}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  />
                  <span className="absolute bottom-3 right-3 px-2.5 py-1 bg-on-surface/80 backdrop-blur-md text-surface rounded-lg text-xs font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm text-primary">photo_library</span>
                    <span>{canonicalImages.length} Photos</span>
                  </span>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-serif text-xl font-bold text-on-surface mb-2 group-hover:text-primary transition-colors">
                      {room.title}
                    </h3>
                    <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed mb-4">
                      {room.shortDesc || room.description}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-on-surface font-medium mb-6 pt-3 border-t border-surface-container">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px] text-primary">aspect_ratio</span>
                        {room.size}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px] text-primary">group</span>
                        {room.occupancy}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-surface-container">
                    <div>
                      <span className="text-xs text-on-surface-variant font-medium block">Starting from</span>
                      <span className="font-serif text-xl font-bold text-primary">
                        ₹{room.price.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-on-surface-variant font-medium"> / night</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); e.preventDefault(); openRoomViewer(room); }}
                        className="px-3 py-2 text-xs font-bold text-on-surface hover:text-primary transition-colors border border-surface-container rounded-lg"
                      >
                        View Room
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); e.preventDefault(); startBooking(room); }}
                        className="px-4 py-2 bg-primary text-on-primary text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-primary-container transition-colors shadow-sm"
                      >
                        Book Now
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. HOTEL HIGHLIGHTS & AMENITIES */}
      <section className="bg-surface-container-low py-20 border-y border-surface-container">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 w-full">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">
              Refined Amenities
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-on-surface mt-2">
              Designed for Comfort & Elegance
            </h2>
            <p className="text-sm text-on-surface-variant mt-3">
              Every detail at Hotel Ambience Inn is curated to make your stay effortless, peaceful, and delightfully memorable.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {amenitiesList.map((item) => (
              <div
                key={item.id}
                className="bg-surface-container-lowest p-8 rounded-2xl border border-surface-container/60 shadow-sm hover:shadow-md transition-shadow flex flex-col items-start gap-4"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl">{item.icon}</span>
                </div>
                <div>
                  <h3 className="font-bold text-lg text-on-surface mb-1">
                    {item.title}
                  </h3>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. GUEST TESTIMONIALS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 w-full py-20">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-primary">
            Guest Reflections
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-on-surface mt-2">
            Stories of Warm Hospitality
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t) => (
            <div
              key={t.id}
              className="bg-surface-container-lowest p-8 rounded-2xl border border-surface-container/60 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-1 text-amber-500 mb-4 text-sm">
                  {'★'.repeat(t.rating)}
                </div>
                <p className="text-xs sm:text-sm text-on-surface-variant italic leading-relaxed mb-6">
                  "{t.comment}"
                </p>
              </div>
              <div className="pt-4 border-t border-surface-container flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary font-bold text-sm flex items-center justify-center">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-xs text-on-surface">{t.name}</h4>
                  <span className="text-[10px] text-on-surface-variant">{t.role} • {t.location}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. FIND US SECTION */}
      <section className="bg-surface-container-low py-16 border-t border-surface-container">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-surface-container-lowest p-6 sm:p-10 rounded-3xl border border-surface-container/60 shadow-lg">
            
            {/* Left Info Column */}
            <div className="lg:col-span-5 space-y-5">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-1.5 mb-2">
                  <span className="material-symbols-outlined text-[18px]">location_on</span>
                  Find Us
                </span>
                <h2 className="font-serif text-3xl font-bold text-on-surface">
                  {hotelInfo.name}
                </h2>
                <p className="text-xs text-primary font-bold uppercase tracking-wider mt-1">
                  Moshi, Pimpri-Chinchwad
                </p>
              </div>

              <div className="space-y-3 text-xs sm:text-sm text-on-surface-variant font-medium">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-[20px] text-primary shrink-0 mt-0.5">place</span>
                  <span className="leading-relaxed">{hotelInfo.address}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[20px] text-primary shrink-0">call</span>
                  <a href={`tel:${hotelInfo.phone.replace(/[^+\d]/g, '')}`} className="font-bold text-on-surface hover:text-primary transition-colors">
                    {hotelInfo.phone}
                  </a>
                </div>
              </div>

              <div className="pt-2">
                <a
                  href={hotelInfo.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center bg-primary text-on-primary font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-xl hover:bg-primary-container transition-all shadow-md gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">near_me</span>
                  <span>Get Directions</span>
                </a>
              </div>
            </div>

            {/* Right Map Column */}
            <div className="lg:col-span-7 h-[320px] sm:h-[400px] rounded-2xl overflow-hidden border border-surface-container shadow-md">
              <iframe
                title="Hotel Ambience Inn Moshi Location Map"
                src={hotelInfo.embedMapUrl}
                className="w-full h-full border-0 filter contrast-[1.05]"
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>

          </div>
        </div>
      </section>

      {/* Multi-Photo Room Viewer Lightbox Modal */}
      {activeRoomViewer && activeRoomViewer.images && activeRoomViewer.images.length > 0 && (
        <div
          className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in"
          onClick={() => setActiveRoomViewer(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-surface-container-lowest rounded-2xl overflow-hidden shadow-2xl border border-surface-container max-h-[90vh] flex flex-col overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setActiveRoomViewer(null)}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 w-10 h-10 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-black/80 transition-colors shadow-lg"
              aria-label="Close photo viewer"
            >
              <span className="material-symbols-outlined text-2xl">close</span>
            </button>

            {/* Main Image Container with Prev/Next Controls */}
            <div className="relative max-h-[55vh] sm:max-h-[72vh] bg-black flex items-center justify-center shrink-0 overflow-hidden">
              <img
                src={activeRoomViewer.images[activeRoomViewer.index] || activeRoomViewer.images[0]}
                alt={`${activeRoomViewer.room?.title || activeRoomViewer.room?.name || 'Room'} Photo ${activeRoomViewer.index + 1}`}
                onError={(e) => {
                  if (e.target.dataset.failed) return;
                  e.target.dataset.failed = 'true';
                  e.target.src = activeRoomViewer.images[0];
                }}
                className="max-h-[55vh] sm:max-h-[72vh] w-auto max-w-full object-contain"
              />

              {/* Navigation Arrows */}
              {activeRoomViewer.images.length > 1 && (
                <>
                  <button
                    onClick={handlePrevRoomImage}
                    className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-all border border-white/20 shadow-lg shrink-0"
                    aria-label="Previous photo"
                  >
                    <span className="material-symbols-outlined text-2xl">chevron_left</span>
                  </button>
                  <button
                    onClick={handleNextRoomImage}
                    className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-all border border-white/20 shadow-lg shrink-0"
                    aria-label="Next photo"
                  >
                    <span className="material-symbols-outlined text-2xl">chevron_right</span>
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail Strip */}
            {activeRoomViewer.images.length > 1 && (
              <div 
                className="bg-surface-container-low px-4 py-2.5 border-t border-surface-container flex items-center justify-start sm:justify-center gap-2.5 overflow-x-auto scrollbar-thin shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                {activeRoomViewer.images.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveRoomViewer((prev) => (prev ? { ...prev, index: idx } : null));
                    }}
                    aria-label={`View photo ${idx + 1} of ${activeRoomViewer.images.length}`}
                    className={`relative w-16 sm:w-20 h-11 sm:h-14 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${
                      activeRoomViewer.index === idx
                        ? 'border-primary shadow-md scale-105 ring-2 ring-primary/40 opacity-100'
                        : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={imgUrl}
                      alt={`${activeRoomViewer.room?.title || activeRoomViewer.room?.name || 'Room'} thumbnail ${idx + 1}`}
                      onError={(e) => {
                        if (e.target.dataset.failed) return;
                        e.target.dataset.failed = 'true';
                        e.target.src = activeRoomViewer.images[0];
                      }}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-0.5 right-0.5 px-1 bg-black/70 text-white text-[9px] font-bold rounded">
                      {idx + 1}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Room Information & Book Now Action Section */}
            <div className="p-4 sm:p-6 bg-surface-container-lowest border-t border-surface-container space-y-4">
              
              {/* Title, Category & Price Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary block">
                    {activeRoomViewer.room?.category || 'Sanctuary'} Accommodation
                  </span>
                  <h3 className="font-serif text-xl sm:text-2xl font-bold text-on-surface">
                    {activeRoomViewer.room?.title || activeRoomViewer.room?.name || 'Room Details'}
                  </h3>
                </div>
                <div className="flex items-baseline gap-1.5 sm:text-right">
                  <span className="font-serif text-2xl font-bold text-primary">
                    ₹{(Number(activeRoomViewer.room?.price) || 0).toLocaleString()}
                  </span>
                  <span className="text-xs text-on-surface-variant font-medium">/ night</span>
                  {Number(activeRoomViewer.room?.originalPrice) > 0 && (
                    <span className="text-[11px] text-on-surface-variant line-through ml-2">
                      ₹{Number(activeRoomViewer.room.originalPrice).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>

              {/* Photo Counter & Key Specs Grid */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 flex-1 p-2.5 bg-surface-container-low rounded-xl border border-surface-container/60 text-center text-xs font-medium">
                  <div>
                    <span className="text-[10px] text-on-surface-variant uppercase font-bold block">Size</span>
                    <span className="text-on-surface font-bold">{activeRoomViewer.room?.size || '190 Sq.Ft'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-on-surface-variant uppercase font-bold block">Bedding</span>
                    <span className="text-on-surface font-bold">{activeRoomViewer.room?.bedType || '1 Queen Bed'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-on-surface-variant uppercase font-bold block">Occupancy</span>
                    <span className="text-on-surface font-bold">{activeRoomViewer.room?.occupancy || '2 Guests'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-on-surface-variant uppercase font-bold block">View</span>
                    <span className="text-on-surface font-bold">{activeRoomViewer.room?.view || 'City View'}</span>
                  </div>
                </div>
                
                {/* Photo Counter */}
                <div className="px-3.5 py-2 bg-surface-container-low rounded-xl text-xs font-bold text-on-surface border border-surface-container text-center shrink-0 self-center">
                  Photo {activeRoomViewer.index + 1} / {activeRoomViewer.images.length}
                </div>
              </div>

              {/* In-Room Amenities */}
              {Array.isArray(activeRoomViewer.room?.amenities) && activeRoomViewer.room.amenities.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block mb-1.5">
                    In-Room Amenities
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {activeRoomViewer.room.amenities.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 text-xs text-on-surface font-medium p-1.5 bg-surface-container-low rounded-lg border border-surface-container/40">
                        <span className="material-symbols-outlined text-[15px] text-primary">check_circle</span>
                        <span>{typeof item === 'string' ? item : item?.name || 'Amenity Feature'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Bar: Book Now & Close */}
              <div className="pt-3 border-t border-surface-container flex items-center justify-end gap-3">
                <button
                  onClick={() => setActiveRoomViewer(null)}
                  className="px-4 py-2.5 border border-surface-container text-xs font-bold text-on-surface uppercase rounded-xl hover:bg-surface-container transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    const targetRoom = activeRoomViewer.room;
                    setActiveRoomViewer(null);
                    startBooking(targetRoom);
                  }}
                  className="px-6 py-2.5 bg-primary text-on-primary text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-primary-container transition-colors shadow-md flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                  <span>Book Now</span>
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};
