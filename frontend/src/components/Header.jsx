import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { hotelInfo } from '../data/hotelData';

export const Header = () => {
  const { activePage, navigate, user, openAuthModal, logout, startBooking } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'rooms', label: 'Rooms' },
    { id: 'amenities', label: 'Amenities' },
    { id: 'gallery', label: 'Gallery' },
    { id: 'about', label: 'About' },
    { id: 'contact', label: 'Contact' },
  ];

  const isUserAdmin = user?.role === 'admin';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-surface/95 backdrop-blur-xl shadow-sm border-b border-surface-container">
      {/* Top Banner Bar */}
      <div className="w-full bg-surface-container-low border-b border-surface-container/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 h-10 flex items-center justify-between text-on-surface-variant text-xs font-medium">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-primary">location_on</span>
            <span>Moshi, Maharashtra</span>
          </div>
          <div className="hidden md:flex items-center gap-2 text-center text-on-surface font-normal">
            <span className="w-2 h-2 rounded-full bg-secondary"></span>
            <span>Book directly for complimentary Wi-Fi, early check-in & best rate guarantee</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-primary">call</span>
            <a href={`tel:${hotelInfo.phone}`} className="hover:text-primary transition-colors">
              {hotelInfo.phone}
            </a>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="h-20 max-w-7xl mx-auto px-3 sm:px-6 lg:px-12 flex items-center justify-between gap-2">
        {/* Brand Logo */}
        <button
          onClick={() => navigate('home')}
          className="flex items-center gap-2 sm:gap-3 group text-left shrink-0"
        >
          <img
            src={hotelInfo.logo}
            alt={hotelInfo.name}
            className="h-8 sm:h-9 w-auto object-contain transition-transform group-hover:scale-105"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/emblem.svg';
            }}
          />
          <div className="flex flex-col">
            <span className="font-serif text-base sm:text-2xl font-bold tracking-tight text-on-surface leading-tight">
              Hotel Ambience Inn
            </span>
            <span className="text-[9px] sm:text-[10px] tracking-widest text-primary uppercase font-semibold hidden xs:inline-block">
              Boutique Hospitality
            </span>
          </div>
        </button>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6 font-medium text-sm">
          {navLinks.map((link) => {
            const isActive = activePage === link.id;
            return (
              <button
                key={link.id}
                onClick={() => navigate(link.id)}
                className={`transition-colors py-1 relative ${
                  isActive
                    ? 'text-primary font-bold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {link.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right CTA Actions */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* User Profile / Auth Toggle */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-1 sm:gap-2 p-1 rounded-full hover:bg-surface-container transition-colors text-left"
              >
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-primary-container text-on-primary font-bold text-xs sm:text-sm flex items-center justify-center shadow-sm">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="hidden sm:inline-block font-semibold text-xs text-on-surface">
                  {user.name ? user.name.split(' ')[0] : 'Account'}
                </span>
                <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
                  expand_more
                </span>
              </button>

              {/* User Dropdown */}
              {userDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 bg-surface-container-lowest rounded-xl shadow-xl border border-surface-container p-2 z-50 animate-in fade-in slide-in-from-top-2"
                  onMouseLeave={() => setUserDropdownOpen(false)}
                >
                  <div className="px-3 py-2 border-b border-surface-container mb-1">
                    <p className="font-semibold text-sm text-on-surface truncate">{user.name}</p>
                    <p className="text-xs text-on-surface-variant truncate">{user.email}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold uppercase rounded">
                      {isUserAdmin ? 'Admin Access' : 'Guest Member'}
                    </span>
                  </div>

                  {isUserAdmin ? (
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        navigate('admin');
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-on-surface hover:bg-surface-container rounded-lg flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[18px] text-primary">admin_panel_settings</span>
                      Admin Dashboard
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        navigate('my-bookings');
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-on-surface hover:bg-surface-container rounded-lg flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[18px] text-primary">book_online</span>
                      My Reservations
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      logout();
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-error hover:bg-error-container/20 rounded-lg flex items-center gap-2 mt-1 border-t border-surface-container"
                  >
                    <span className="material-symbols-outlined text-[18px]">logout</span>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={openAuthModal}
              className="font-semibold text-xs sm:text-sm text-on-surface-variant hover:text-primary transition-colors px-2 sm:px-3 py-2"
            >
              Login
            </button>
          )}

          {/* Book Now Button */}
          <button
            onClick={() => startBooking()}
            className="inline-flex items-center justify-center bg-primary text-on-primary font-semibold text-xs sm:text-sm uppercase tracking-wider px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg hover:bg-primary-container active:scale-[0.98] transition-all shadow-md gap-1.5"
            title="Book Now"
          >
            <span className="material-symbols-outlined text-[18px]">calendar_month</span>
            <span className="hidden sm:inline">Book Now</span>
          </button>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
            aria-label="Toggle Navigation Menu"
          >
            <span className="material-symbols-outlined text-2xl">
              {mobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-surface-container-lowest border-b border-surface-container px-6 py-4 space-y-3">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => {
                navigate(link.id);
                setMobileMenuOpen(false);
              }}
              className={`block w-full text-left font-medium py-2 px-3 rounded-lg ${
                activePage === link.id
                  ? 'bg-primary/10 text-primary font-bold'
                  : 'text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              {link.label}
            </button>
          ))}
          <div className="pt-2 border-t border-surface-container flex flex-col gap-2">
            {user ? (
              <>
                {isUserAdmin ? (
                  <button
                    onClick={() => {
                      navigate('admin');
                      setMobileMenuOpen(false);
                    }}
                    className="text-left font-medium py-2 px-3 rounded-lg text-on-surface hover:bg-surface-container flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px] text-primary">admin_panel_settings</span>
                    Admin Dashboard
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      navigate('my-bookings');
                      setMobileMenuOpen(false);
                    }}
                    className="text-left font-medium py-2 px-3 rounded-lg text-on-surface hover:bg-surface-container flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px] text-primary">book_online</span>
                    My Reservations
                  </button>
                )}
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="text-left font-medium py-2 px-3 rounded-lg text-error hover:bg-red-50 flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">logout</span>
                  Sign Out
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  openAuthModal();
                  setMobileMenuOpen(false);
                }}
                className="text-left font-medium py-2 px-3 rounded-lg text-primary hover:bg-surface-container flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">login</span>
                Sign In / Register
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
