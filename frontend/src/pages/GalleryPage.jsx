import React, { useState } from 'react';
import { galleryImages } from '../data/hotelData';

export const GalleryPage = () => {
  const [filter, setFilter] = useState('all');
  const [activeImage, setActiveImage] = useState(null);

  const filtered = filter === 'all'
    ? galleryImages
    : galleryImages.filter(img => img.category === filter);

  return (
    <div className="w-full flex flex-col min-h-screen pt-32 pb-16 bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 w-full">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-bold uppercase tracking-widest text-primary flex items-center justify-center gap-1 mb-2">
            <span className="material-symbols-outlined text-[16px]">photo_library</span>
            Visual Showcase
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-on-surface">
            Architectural & Sanctuary Gallery
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-2">
            Explore the rich teak craftsmanship, serene courtyard, fine dining rooms, and welcoming reception.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          {[
            { id: 'all', label: 'All Images' },
            { id: 'exterior', label: 'Exterior & Architecture' },
            { id: 'rooms', label: 'Rooms & Suites' },
            { id: 'dining', label: 'Dining & Lounge' },
            { id: 'reception', label: 'Reception & Lobby' }
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setFilter(pill.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
                filter === pill.id
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container border border-surface-container'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* Image Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => setActiveImage(item)}
              className="bg-surface-container-lowest rounded-2xl overflow-hidden border border-surface-container/60 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer group flex flex-col"
            >
              <div className="relative h-64 overflow-hidden bg-surface-container">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-3xl opacity-0 group-hover:opacity-100 transition-opacity">zoom_in</span>
                </div>
                <span className="absolute top-3 left-3 px-3 py-1 bg-surface-container-lowest/90 backdrop-blur-md rounded-lg text-[10px] font-bold uppercase tracking-wider text-on-surface">
                  {item.category}
                </span>
              </div>
              <div className="p-4 bg-surface-container-lowest">
                <h3 className="font-serif text-base font-bold text-on-surface">{item.title}</h3>
                <p className="text-xs text-on-surface-variant mt-1 line-clamp-2">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Lightbox Modal */}
        {activeImage && (
          <div
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
            onClick={() => setActiveImage(null)}
          >
            <div
              className="relative max-w-4xl w-full bg-surface-container-lowest rounded-2xl overflow-hidden shadow-2xl border border-surface-container max-h-[90vh] flex flex-col overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setActiveImage(null)}
                className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-black/80 transition-colors"
              >
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
              <div className="relative max-h-[50vh] sm:max-h-[75vh] bg-black flex items-center justify-center shrink-0">
                <img
                  src={activeImage.image}
                  alt={activeImage.title}
                  className="max-h-[50vh] sm:max-h-[75vh] w-auto object-contain"
                />
              </div>
              <div className="p-6 bg-surface-container-lowest">
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                  {activeImage.category}
                </span>
                <h3 className="font-serif text-2xl font-bold text-on-surface mt-0.5">
                  {activeImage.title}
                </h3>
                <p className="text-xs text-on-surface-variant mt-2 leading-relaxed">
                  {activeImage.desc}
                </p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
