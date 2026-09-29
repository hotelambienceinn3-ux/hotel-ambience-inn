import React from 'react';
import { hotelInfo } from '../data/hotelData';
import { useApp } from '../context/AppContext';

export const AboutPage = () => {
  const { navigate } = useApp();

  return (
    <div className="w-full flex flex-col min-h-screen pt-32 pb-16 bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 w-full">
        
        {/* Hero Banner */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-primary flex items-center justify-center gap-1 mb-2">
            <span className="material-symbols-outlined text-[16px]">apartment</span>
            Our Heritage & Vision
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold text-on-surface leading-tight">
            Rooted in Atithi Devo Bhava, Elevated for Modern Living
          </h1>
          <p className="text-xs sm:text-base text-on-surface-variant mt-4 leading-relaxed">
            Hotel Ambience Inn was established with a clear mission: to provide a refined architectural sanctuary where traditional Indian warmth seamlessly meets contemporary boutique luxury.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
          <div className="relative rounded-3xl overflow-hidden shadow-2xl h-96">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBiexUiXqXL3kwfwzNBEILc3zV0_2CxKobomOeuePd7RaO8CXiCTjmIsinqALuJdTRKsJktHUdrpC1n32O6Jpu4KJ_HI2SLo7au5xT-Pu752TN4Zz9enHioEsE2HhHwpsBc-xaa4dr5VYASt3XPtdoL3cYrObep_3JKEx25jacEGAo0JznVtvKWFbPx8ge4dri_SswJi9yhXWA6B1T963rW-g3RVFwJ8pnnJd3ARLbLYvi2GbmJppsi"
              alt="Presidential Suite Interior"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
            <div className="absolute bottom-6 left-6 right-6 text-white">
              <span className="text-xs font-bold uppercase tracking-widest text-secondary-fixed block">Bespoke Design</span>
              <span className="font-serif text-xl font-bold">Handcrafted Rosewood & Brass Accents</span>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="font-serif text-3xl font-bold text-on-surface">
              An Oasis in Moshi, Pimpri-Chinchwad
            </h2>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Located minutes away from major IT parks, industrial hubs, and Alandi–Moshi Road, our property offers peace amidst the vibrancy of Moshi, Pimpri-Chinchwad.
            </p>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Each room is designed with acoustic soundproofing, fluted teak paneling, rainfall walk-in showers, and high-speed Wi-Fi, making it equally welcoming for global executives and leisure travelers.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-surface-container">
              <div>
                <span className="font-serif text-2xl font-bold text-primary block">340+</span>
                <span className="text-xs text-on-surface-variant font-medium">5-Star Guest Reviews</span>
              </div>
              <div>
                <span className="font-serif text-2xl font-bold text-primary block">24/7</span>
                <span className="text-xs text-on-surface-variant font-medium">Concierge Hospitality</span>
              </div>
            </div>
          </div>
        </div>

        {/* Core Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-surface-container-lowest p-8 rounded-2xl border border-surface-container shadow-sm">
            <span className="material-symbols-outlined text-3xl text-primary mb-3">auto_awesome</span>
            <h3 className="font-serif text-xl font-bold text-on-surface mb-2">Authentic Warmth</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Personalized service where every guest request is addressed with prompt attention and genuine hospitality.
            </p>
          </div>

          <div className="bg-surface-container-lowest p-8 rounded-2xl border border-surface-container shadow-sm">
            <span className="material-symbols-outlined text-3xl text-primary mb-3">palette</span>
            <h3 className="font-serif text-xl font-bold text-on-surface mb-2">Bespoke Interior Aesthetics</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Rich teak fluted paneling, warm amber cove lighting, and brass filigree detailing create a tranquil sanctuary.
            </p>
          </div>

          <div className="bg-surface-container-lowest p-8 rounded-2xl border border-surface-container shadow-sm">
            <span className="material-symbols-outlined text-3xl text-primary mb-3">verified</span>
            <h3 className="font-serif text-xl font-bold text-on-surface mb-2">Direct Trust Guarantee</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Transparent pricing with no hidden fees, complimentary high-speed Wi-Fi, and guaranteed best rates.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center pt-8 border-t border-surface-container">
          <button
            onClick={() => navigate('rooms')}
            className="px-8 py-3.5 bg-primary text-on-primary font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-primary-container transition-colors shadow-md"
          >
            Explore Available Accommodations →
          </button>
        </div>

      </div>
    </div>
  );
};
