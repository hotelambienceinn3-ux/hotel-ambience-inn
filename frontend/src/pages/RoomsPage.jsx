import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { getCanonicalRoomImages } from '../lib/roomImageUtils';

export const RoomsPage = () => {
  const { openRoomDetails, startBooking, searchCriteria, rooms, roomsLoading, roomsError, availability, isCheckingAvailability } = useApp();

  const [activeFilter, setActiveFilter] = useState('all');
  const [maxPrice, setMaxPrice] = useState(10000);
  const [sortBy, setSortBy] = useState('recommended');
  const [activeRoomViewer, setActiveRoomViewer] = useState(null);

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

  // Filter rooms using dynamic context state
  const filteredRooms = rooms
    .filter((room) => {
      if (activeFilter !== 'all' && room.category !== activeFilter) return false;
      if (room.price > maxPrice) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      return (b.rating || 5) - (a.rating || 5);
    });

  return (
    <div className="w-full flex flex-col min-h-screen pt-32 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 w-full">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-1.5 text-primary text-xs font-bold uppercase tracking-widest mb-1">
              <span className="material-symbols-outlined text-[16px]">apartment</span>
              <span>Sanctuary Accommodations</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-on-surface">
              Available Rooms & Suites
            </h1>
            <p className="text-sm text-on-surface-variant mt-1">
              Refined modern craftsmanship rooted in timeless Indian hospitality. Search dates: <strong>{searchCriteria.checkIn}</strong> to <strong>{searchCriteria.checkOut}</strong>.
            </p>
          </div>

          <div className="hidden lg:flex items-center gap-6 bg-surface-container-low px-5 py-3 rounded-xl border border-surface-container">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">verified</span>
              <div>
                <span className="text-xs font-bold text-on-surface block">Best Rate Direct</span>
                <span className="text-[10px] text-on-surface-variant uppercase font-semibold">Guaranteed</span>
              </div>
            </div>
            <div className="w-px h-6 bg-surface-container-highest"></div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">free_cancellation</span>
              <div>
                <span className="text-xs font-bold text-on-surface block">24h Cancellation</span>
                <span className="text-[10px] text-on-surface-variant uppercase font-semibold">Risk Free</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filters & Control Bar */}
        <div className="bg-surface-container-lowest rounded-2xl p-5 border border-surface-container shadow-sm mb-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            
            {/* Filter Pills */}
            <div className="md:col-span-2 flex flex-col gap-2">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                Category Filter
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'all', label: `All Accommodations (${rooms.length})` },
                  { id: 'deluxe', label: 'Deluxe' },
                  { id: 'executive', label: 'Executive' },
                  { id: 'suite', label: 'Suites' },
                  { id: 'twin', label: 'Twin Bed' }
                ].map((pill) => (
                  <button
                    key={pill.id}
                    onClick={() => setActiveFilter(pill.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                      activeFilter === pill.id
                        ? 'bg-primary text-on-primary shadow-sm'
                        : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                    }`}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range Slider */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-on-surface-variant uppercase tracking-wider">Max Budget</span>
                <span className="text-primary font-bold">Up to ₹{maxPrice.toLocaleString()}/nt</span>
              </div>
              <input
                type="range"
                min="1500"
                max="10000"
                step="500"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-primary h-2 bg-surface-container-low rounded-lg cursor-pointer"
              />
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-surface-container flex items-center justify-between text-xs text-on-surface-variant font-medium">
            <span>Showing {filteredRooms.length} room options</span>
            <div className="flex items-center gap-2">
              <span>Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent font-bold text-on-surface outline-none cursor-pointer"
              >
                <option value="recommended">Recommended</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Room Catalog List */}
        {roomsLoading ? (
          <div className="py-20 text-center flex flex-col items-center gap-3">
            <span className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></span>
            <p className="text-xs font-semibold text-on-surface-variant">Loading real rooms from Supabase...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {filteredRooms.length > 0 ? (
              filteredRooms.map((room) => {
                const roomAvail = availability[room.id] || { availableCount: 3, totalRooms: 3 };
                const isAvailable = roomAvail.availableCount > 0;
                const canonicalImages = getCanonicalRoomImages(room);
                const primaryImg = canonicalImages[0];

                return (
                  <div
                    key={room.id}
                    onClick={() => openRoomViewer(room)}
                    className="bg-surface-container-lowest rounded-2xl overflow-hidden border border-surface-container/60 shadow-md hover:shadow-xl transition-all duration-300 grid grid-cols-1 lg:grid-cols-12 group cursor-pointer"
                  >
                    {/* Room Image */}
                    <div className="lg:col-span-5 relative aspect-[4/3] sm:aspect-auto min-h-[220px] sm:min-h-[260px] bg-surface-container overflow-hidden">
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

                    {/* Room Details */}
                    <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between">
                      <div>
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                            {room.category} Class
                          </span>
                          <div className="flex items-center gap-2">
                            {isCheckingAvailability ? (
                              <span className="text-[10px] text-on-surface-variant animate-pulse">Checking availability...</span>
                            ) : isAvailable ? (
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase rounded">
                                ✓ {roomAvail.availableCount} {roomAvail.availableCount === 1 ? 'room' : 'rooms'} available
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-red-100 text-error text-[10px] font-bold uppercase rounded">
                                Currently unavailable for selected dates
                              </span>
                            )}
                          </div>
                        </div>

                        <h3 className="font-serif text-2xl font-bold text-on-surface mb-2">
                          {room.title}
                        </h3>

                        <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed mb-6">
                          {room.description}
                        </p>

                        {/* Room Specs & Key Amenities */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 p-3 bg-surface-container-low rounded-xl text-xs font-medium text-on-surface border border-surface-container/60">
                          <div>
                            <span className="text-[10px] text-on-surface-variant block uppercase font-bold">Size</span>
                            <span>{room.size}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-on-surface-variant block uppercase font-bold">Occupancy</span>
                            <span>{room.occupancy}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-on-surface-variant block uppercase font-bold">Bedding</span>
                            <span>{room.bedType}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-on-surface-variant block uppercase font-bold">View</span>
                            <span className="truncate block">{room.view}</span>
                          </div>
                        </div>
                      </div>

                      {/* Pricing & CTA */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-surface-container">
                        <div>
                          <div className="flex items-baseline gap-2">
                            <span className="font-serif text-3xl font-bold text-primary">
                              ₹{room.price.toLocaleString()}
                            </span>
                            <span className="text-xs text-on-surface-variant font-medium">/ night + taxes</span>
                          </div>
                          <span className="text-[11px] text-emerald-700 font-bold block mt-0.5">
                            ✓ Free Cancellation • Complimentary Wi-Fi Included
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            onClick={(e) => { e.stopPropagation(); e.preventDefault(); openRoomViewer(room); }}
                            className="px-4 py-2.5 bg-surface-container-low hover:bg-surface-container border border-surface-container text-xs font-bold text-on-surface uppercase rounded-xl transition-colors"
                          >
                            View Room
                          </button>
                          
                          {isAvailable ? (
                            <button
                              onClick={(e) => { e.stopPropagation(); startBooking(room); }}
                              className="px-6 py-2.5 bg-primary text-on-primary text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-primary-container transition-colors shadow-md flex items-center gap-1.5"
                            >
                              <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                              <span>Book Room</span>
                            </button>
                          ) : (
                            <button
                              disabled
                              onClick={(e) => e.stopPropagation()}
                              className="px-5 py-2.5 bg-surface-container text-on-surface-variant text-xs font-bold uppercase rounded-xl cursor-not-allowed opacity-60"
                            >
                              Unavailable
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-16 bg-surface-container-lowest rounded-2xl border border-surface-container p-8">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-2">error</span>
                <h3 className="font-serif text-xl font-bold text-on-surface">No Rooms Match Your Budget Filter</h3>
                <p className="text-xs text-on-surface-variant mt-1">Try increasing your max budget threshold or selecting a different room category.</p>
                <button
                  onClick={() => { setActiveFilter('all'); setMaxPrice(10000); }}
                  className="mt-4 px-4 py-2 bg-primary text-on-primary text-xs font-bold uppercase rounded-lg"
                >
                  Reset Filters
                </button>
              </div>
            )}
          </div>
        )}

      </div>

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
