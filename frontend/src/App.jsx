import React from 'react';
import { useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { AuthModal } from './components/AuthModal';
import { Toast } from './components/Toast';

import { HomePage } from './pages/HomePage';
import { RoomsPage } from './pages/RoomsPage';
import { RoomDetailsModal } from './pages/RoomDetailsModal';
import { BookingFlowPage } from './pages/BookingFlowPage';
import { BookingConfirmationPage } from './pages/BookingConfirmationPage';
import { CustomerDashboardPage } from './pages/CustomerDashboardPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { GalleryPage } from './pages/GalleryPage';
import { AmenitiesPage } from './pages/AmenitiesPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';

export function AppContent() {
  const { activePage, toast, closeToast } = useApp();

  const renderPage = () => {
    switch (activePage) {
      case 'home':
        return <HomePage />;
      case 'rooms':
        return <RoomsPage />;
      case 'booking':
        return <BookingFlowPage />;
      case 'confirmation':
        return <BookingConfirmationPage />;
      case 'my-bookings':
        return <CustomerDashboardPage />;
      case 'admin':
        return <AdminDashboardPage />;
      case 'gallery':
        return <GalleryPage />;
      case 'amenities':
        return <AmenitiesPage />;
      case 'about':
        return <AboutPage />;
      case 'contact':
        return <ContactPage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface font-sans text-on-surface">
      <Header />
      <main className="flex-grow">
        {renderPage()}
      </main>
      <Footer />
      <RoomDetailsModal />
      <AuthModal />
      <Toast toast={toast} onClose={closeToast} />
    </div>
  );
}
