import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { getCanonicalRoomImages } from '../lib/roomImageUtils';

export const RoomDetailsModal = () => {
  const { selectedRoomForDetails, closeRoomDetails, startBooking, availability } = useApp();

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Reset image index and lightbox state when selected room changes
  useEffect(() => {
    setActiveImageIndex(0);
    setIsLightboxOpen(false);
  }, [selectedRoomForDetails?.id, selectedRoomForDetails?.title]);

  // Keyboard navigation for Escape key
  useEffect(() => {
    if (!selectedRoomForDetails) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isLightboxOpen) {
          setIsLightboxOpen(false);
        } else {
          closeRoomDetails();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedRoomForDetails, isLightboxOpen, closeRoomDetails]);

  if (!selectedRoomForDetails) return null;

  const room = selectedRoomForDetails;
  const roomAvail = (room.id && availability[room.id]) || { availableCount: 3 };
  const isAvailable = roomAvail.availableCount > 0;

  // Resolve room images safely using canonical local images map
  const roomImages = getCanonicalRoomImages(room);
  const firstValidImage = roomImages[0] || '/rooms/deluxe-ac/deluxe-ac-01-main-room.png';
  const currentImage = roomImages[activeImageIndex] || firstValidImage;

  const handlePrevImage = (e) => {
    e?.stopPropagation();
    setActiveImageIndex((prev) => (prev === 0 ? roomImages.length - 1 : prev - 1));
  };

  const handleNextImage = (e) => {
    e?.stopPropagation();
    setActiveImageIndex((prev) => (prev === roomImages.length - 1 ? 0 : prev + 1));
  };

  // Keyboard left/right arrow image navigation
  useEffect(() => {
    if (!selectedRoomForDetails) return;
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') handlePrevImage(e);
      if (e.key === 'ArrowRight') handleNextImage(e);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedRoomForDetails, roomImages.length]);

  const amenitiesList = Array.isArray(room.amenities) && room.amenities.length > 0
    ? room.amenities
    : [
        'High-Speed Wi-Fi',
        'Rainfall Walk-in Shower',
        'Wardrobe & Storage',
        '24/7 Room Service Access'
      ];

  const roomPriceNum = Number(room.price) || 0;
  const origPriceNum = Number(room.originalPrice) || 0;
  const title = room.title || room.name || 'Sanctuary Accommodations';
  const size = room.size || '190 Sq.Ft';
  const bedType = room.bedType || '1 Queen Bed';
  const occupancy = room.occupancy || '2 Guests';
  const view = room.view || 'City View';

  const handleImageError = (e) => {
    if (e.target.dataset.failed) return;
    e.target.dataset.failed = 'true';
    e.target.src = firstValidImage;
  };

  return (
    <>
      {/* 1. ROOM DETAILS MODAL OVERLAY */}
      <div 
        className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-on-surface/75 backdrop-blur-md overflow-y-auto"
        onClick={closeRoomDetails}
      >
        <div 
          className="bg-surface-container-lowest w-full max-w-4xl rounded-2xl shadow-2xl border border-surface-container overflow-hidden my-auto max-h-[90vh] sm:max-h-[92vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          
          {/* Header */}
          <div className="bg-surface-container-low px-4 sm:px-6 py-3.5 sm:py-4 border-b border-surface-container flex items-center justify-between shrink-0">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary block">
                Hotel Ambience Inn — Moshi
              </span>
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-on-surface leading-tight">
                {title}
              </h3>
            </div>
            <button
              onClick={closeRoomDetails}
              className="p-2 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors shrink-0"
              aria-label="Close details"
            >
              <span className="material-symbols-outlined text-2xl">close</span>
            </button>
          </div>

          {/* Scrollable Content Body */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
            
            {/* Main Interactive Gallery Viewer */}
            <div className="relative h-56 sm:h-80 md:h-96 rounded-xl overflow-hidden bg-surface-container shadow-md group">
              <img
                src={currentImage}
                alt={`${title} Photo ${activeImageIndex + 1}`}
                onClick={() => setIsLightboxOpen(true)}
                onError={handleImageError}
                className="w-full h-full object-cover cursor-zoom-in transition-all duration-300"
              />

              {/* Click to Enlarge Badge */}
              <button
                onClick={() => setIsLightboxOpen(true)}
                className="absolute top-3 left-3 px-3 py-1 bg-surface-container-lowest/90 backdrop-blur-md rounded-md text-xs font-bold uppercase text-on-surface shadow-md flex items-center gap-1.5 hover:bg-surface-container transition-colors"
              >
                <span className="material-symbols-outlined text-sm">fullscreen</span>
                <span>Enlarge</span>
              </button>

              {/* Availability Badge */}
              <div className="absolute top-3 right-3">
                {isAvailable ? (
                  <span className="px-3 py-1 bg-emerald-600 text-white text-[11px] font-bold uppercase rounded-md shadow-md inline-block">
                    ✓ Available
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-red-600 text-white text-[11px] font-bold uppercase rounded-md shadow-md inline-block">
                    Unavailable
                  </span>
                )}
              </div>

              {/* Previous / Next Overlay Controls */}
              {roomImages.length > 1 && (
                <>
                  <button
                    onClick={handlePrevImage}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-on-surface/60 hover:bg-on-surface/90 backdrop-blur-md text-surface flex items-center justify-center transition-all shadow-lg"
                    aria-label="Previous photo"
                  >
                    <span className="material-symbols-outlined text-xl">chevron_left</span>
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-on-surface/60 hover:bg-on-surface/90 backdrop-blur-md text-surface flex items-center justify-center transition-all shadow-lg"
                    aria-label="Next photo"
                  >
                    <span className="material-symbols-outlined text-xl">chevron_right</span>
                  </button>
                </>
              )}
            </div>

            {/* Gallery Thumbnail Strip & Photo Counter */}
            {roomImages.length > 1 && (
              <div>
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
                  {roomImages.map((imgUrl, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative w-16 sm:w-20 h-12 sm:h-14 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${
                        activeImageIndex === idx ? 'border-primary shadow-md scale-105 ring-2 ring-primary/40' : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img 
                        src={imgUrl} 
                        alt={`${title} ${idx + 1}`} 
                        onError={handleImageError}
                        className="w-full h-full object-cover" 
                      />
                      <span className="absolute bottom-0.5 right-0.5 px-1 bg-black/70 text-white text-[9px] font-bold rounded">
                        {idx + 1}
                      </span>
                    </button>
                  ))}
                </div>
                {/* Photo counter: 1 / 7 */}
                <div className="text-center text-xs font-bold text-on-surface-variant mt-1">
                  {activeImageIndex + 1} / {roomImages.length}
                </div>
              </div>
            )}

            {/* Key Specs Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 bg-surface-container-low rounded-xl border border-surface-container/60 text-center">
              <div>
                <span className="text-[10px] text-on-surface-variant uppercase font-bold block">Size</span>
                <span className="font-bold text-xs sm:text-sm text-on-surface">{size}</span>
              </div>
              <div>
                <span className="text-[10px] text-on-surface-variant uppercase font-bold block">Bedding</span>
                <span className="font-bold text-xs sm:text-sm text-on-surface">{bedType}</span>
              </div>
              <div>
                <span className="text-[10px] text-on-surface-variant uppercase font-bold block">Occupancy</span>
                <span className="font-bold text-xs sm:text-sm text-on-surface">{occupancy}</span>
              </div>
              <div>
                <span className="text-[10px] text-on-surface-variant uppercase font-bold block">View</span>
                <span className="font-bold text-xs sm:text-sm text-on-surface">{view}</span>
              </div>
            </div>

            {/* Overview & Description */}
            <div>
              <h4 className="font-serif text-base sm:text-lg font-bold text-on-surface mb-1.5">
                Room Description
              </h4>
              <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                {room.description || 'Refined modern sanctuary accommodation at Hotel Ambience Inn Moshi, Pimpri-Chinchwad.'}
              </p>
            </div>

            {/* Included Amenities */}
            <div>
              <h4 className="font-serif text-base sm:text-lg font-bold text-on-surface mb-2.5">
                In-Room Amenities & Features
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {amenitiesList.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-on-surface font-medium p-2 bg-surface-container-lowest border border-surface-container rounded-lg">
                    <span className="material-symbols-outlined text-[16px] text-primary">check_circle</span>
                    <span>{typeof item === 'string' ? item : item?.name || 'Amenity Feature'}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Footer Action Bar */}
          <div className="bg-surface-container-low px-4 sm:px-6 py-3.5 sm:py-4 border-t border-surface-container flex items-center justify-between gap-3 shrink-0">
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-serif text-xl sm:text-2xl font-bold text-primary">
                  ₹{roomPriceNum.toLocaleString()}
                </span>
                <span className="text-[11px] text-on-surface-variant font-medium">/ night</span>
              </div>
              {origPriceNum > 0 && (
                <span className="text-[10px] text-on-surface-variant line-through block">
                  ₹{origPriceNum.toLocaleString()} standard
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={closeRoomDetails}
                className="px-4 py-2 sm:py-2.5 border border-surface-container text-xs font-bold uppercase rounded-lg hover:bg-surface-container transition-colors text-on-surface"
              >
                Close
              </button>
              {isAvailable ? (
                <button
                  onClick={() => startBooking(room)}
                  className="px-5 sm:px-6 py-2 sm:py-2.5 bg-primary text-on-primary text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-primary-container transition-colors shadow-md flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">calendar_month</span>
                  <span>Book Now</span>
                </button>
              ) : (
                <button
                  disabled
                  className="px-5 sm:px-6 py-2 sm:py-2.5 bg-surface-container text-on-surface-variant text-xs font-bold uppercase rounded-lg cursor-not-allowed opacity-60"
                >
                  Unavailable
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. FULLSCREEN LIGHTBOX OVERLAY */}
      {isLightboxOpen && (
        <div 
          className="fixed inset-0 z-[110] bg-black/95 flex flex-col justify-between p-4 sm:p-6"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Lightbox Header Bar */}
          <div className="flex items-center justify-between text-white z-10" onClick={(e) => e.stopPropagation()}>
            <div>
              <h4 className="font-serif text-base sm:text-lg font-bold">{title}</h4>
              <span className="text-xs text-gray-400">Photo {activeImageIndex + 1} of {roomImages.length}</span>
            </div>
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              aria-label="Close fullscreen gallery"
            >
              <span className="material-symbols-outlined text-2xl">close</span>
            </button>
          </div>

          {/* Lightbox Center Image */}
          <div className="relative flex-1 flex items-center justify-center my-3 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <img
              src={currentImage}
              alt={`${title} Fullscreen ${activeImageIndex + 1}`}
              onError={handleImageError}
              className="max-w-full max-h-full object-contain shadow-2xl rounded-lg"
            />

            {roomImages.length > 1 && (
              <>
                <button
                  onClick={handlePrevImage}
                  className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center transition-all border border-white/20"
                  aria-label="Previous image"
                >
                  <span className="material-symbols-outlined text-2xl">chevron_left</span>
                </button>
                <button
                  onClick={handleNextImage}
                  className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center transition-all border border-white/20"
                  aria-label="Next image"
                >
                  <span className="material-symbols-outlined text-2xl">chevron_right</span>
                </button>
              </>
            )}
          </div>

          {/* Lightbox Footer Thumbnail Row */}
          {roomImages.length > 1 && (
            <div className="flex items-center justify-center gap-2 overflow-x-auto py-2 z-10 scrollbar-none" onClick={(e) => e.stopPropagation()}>
              {roomImages.map((imgUrl, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-14 h-10 rounded-md overflow-hidden border-2 shrink-0 transition-all ${
                    activeImageIndex === idx ? 'border-primary scale-110' : 'border-transparent opacity-50 hover:opacity-100'
                  }`}
                >
                  <img 
                    src={imgUrl} 
                    alt={`${title} thumbnail ${idx + 1}`} 
                    onError={handleImageError}
                    className="w-full h-full object-cover" 
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
};
