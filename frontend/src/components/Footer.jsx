import React from 'react';
import { useApp } from '../context/AppContext';
import { hotelInfo } from '../data/hotelData';

export const Footer = () => {
  const { navigate } = useApp();

  return (
    <footer className="w-full bg-surface-container-low text-on-surface mt-20 border-t border-surface-container shadow-inner">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          
          {/* Col 1 & 2: Hotel Identity & Info */}
          <div className="lg:col-span-2 flex flex-col gap-4 pr-0 lg:pr-6">
            <div className="flex items-center gap-3">
              <img
                src={hotelInfo.logo}
                alt={hotelInfo.name}
                className="h-8 w-auto object-contain"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/emblem.svg';
                }}
              />
              <span className="font-serif text-2xl font-bold text-on-surface">
                {hotelInfo.name}
              </span>
            </div>
            <p className="text-sm text-on-surface-variant leading-relaxed max-w-sm">
              Embracing the timeless grace of <i>Atithi Devo Bhava</i> with modern boutique hospitality. A quiet architectural sanctuary delivering genuine warmth and elevated comfort.
            </p>

            <div className="flex flex-col gap-2.5 text-xs text-on-surface-variant mt-2 font-medium">
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-[18px] text-primary shrink-0">location_on</span>
                <span>{hotelInfo.address}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-primary shrink-0">call</span>
                <a href={`tel:${hotelInfo.phone}`} className="hover:text-primary transition-colors">
                  {hotelInfo.phone}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-primary shrink-0">mail</span>
                <a href={`mailto:${hotelInfo.email}`} className="hover:text-primary transition-colors">
                  {hotelInfo.email}
                </a>
              </div>
            </div>
          </div>

          {/* Col 3: Quick Navigation */}
          <div className="flex flex-col gap-3">
            <h4 className="font-serif text-lg font-bold text-on-surface">
              Quick Links
            </h4>
            <nav className="flex flex-col gap-2 text-sm text-on-surface-variant font-medium">
              <button onClick={() => navigate('home')} className="text-left hover:text-primary transition-colors">
                Home
              </button>
              <button onClick={() => navigate('rooms')} className="text-left hover:text-primary transition-colors">
                Rooms & Suites
              </button>
              <button onClick={() => navigate('amenities')} className="text-left hover:text-primary transition-colors">
                Amenities & Services
              </button>
              <button onClick={() => navigate('gallery')} className="text-left hover:text-primary transition-colors">
                Visual Gallery
              </button>
              <button onClick={() => navigate('about')} className="text-left hover:text-primary transition-colors">
                About Our Hotel
              </button>
              <button onClick={() => navigate('contact')} className="text-left hover:text-primary transition-colors">
                Location & Contact
              </button>
            </nav>
          </div>

          {/* Col 4: Accommodations */}
          <div className="flex flex-col gap-3">
            <h4 className="font-serif text-lg font-bold text-on-surface">
              Accommodations
            </h4>
            <nav className="flex flex-col gap-2 text-sm text-on-surface-variant font-medium">
              <button onClick={() => navigate('rooms')} className="text-left hover:text-primary transition-colors">
                Deluxe King Room
              </button>
              <button onClick={() => navigate('rooms')} className="text-left hover:text-primary transition-colors">
                Executive Courtyard Suite
              </button>
              <button onClick={() => navigate('rooms')} className="text-left hover:text-primary transition-colors">
                Superior Twin Room
              </button>
              <button onClick={() => navigate('rooms')} className="text-left hover:text-primary transition-colors">
                Ambience Presidential Suite
              </button>
              <button onClick={() => navigate('booking')} className="text-left text-primary font-bold text-xs uppercase tracking-wider hover:underline mt-1">
                Direct Booking Benefits →
              </button>
            </nav>
          </div>

          {/* Col 5: Newsletter & Direct Perks */}
          <div className="flex flex-col gap-3">
            <h4 className="font-serif text-lg font-bold text-on-surface">
              Newsletter
            </h4>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Subscribe for exclusive seasonal offers, early access, and private invitations.
            </p>
            <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full px-3.5 py-2 bg-surface-container-lowest text-on-surface text-xs rounded-lg border border-surface-container focus:ring-1 focus:ring-primary outline-none"
              />
              <button
                type="submit"
                className="w-full bg-primary text-on-primary text-xs font-semibold uppercase tracking-wider py-2.5 rounded-lg hover:bg-primary-container transition-colors shadow-sm"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-surface-container flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-on-surface-variant font-medium text-center sm:text-left">
          <p>© {new Date().getFullYear()} Hotel Ambience Inn. All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4">
            <span>Moshi, Pimpri-Chinchwad, Maharashtra</span>
            <span>•</span>
            <span>Atithi Devo Bhava</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
