import React, { useState } from 'react';
import { hotelInfo } from '../data/hotelData';

export const ContactPage = () => {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'General Inquiry',
    message: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="w-full flex flex-col min-h-screen pt-32 pb-16 bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 w-full">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-primary flex items-center justify-center gap-1 mb-2">
            <span className="material-symbols-outlined text-[16px]">support_agent</span>
            Concierge & Location
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-on-surface">
            Get in Touch With Us
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-2 leading-relaxed">
            Our 24/7 reception desk and concierge team are at your service for room inquiries, corporate bookings, and airport transfers.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start mb-16">
          
          {/* Contact Details Cards */}
          <div className="lg:col-span-5 space-y-6">
            
            <div className="bg-surface-container-lowest p-6 rounded-2xl border border-surface-container/60 shadow-sm flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-2xl">location_on</span>
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-on-surface mb-1">Hotel Location</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  {hotelInfo.address}
                </p>
                <span className="text-[11px] font-bold text-primary block mt-2">
                  Moshi • Pimpri-Chinchwad, Maharashtra
                </span>
              </div>
            </div>

            <div className="bg-surface-container-lowest p-6 rounded-2xl border border-surface-container/60 shadow-sm flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-2xl">call</span>
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-on-surface mb-1">Reservations Desk</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Available 24/7 for phone bookings and inquiries.
                </p>
                <a href={`tel:${hotelInfo.phone}`} className="text-xs font-bold text-primary hover:underline block mt-2">
                  {hotelInfo.phone}
                </a>
              </div>
            </div>

            <div className="bg-surface-container-lowest p-6 rounded-2xl border border-surface-container/60 shadow-sm flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-2xl">mail</span>
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-on-surface mb-1">Email Concierge</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  For corporate contracts, banquets, and general questions.
                </p>
                <a href={`mailto:${hotelInfo.email}`} className="text-xs font-bold text-primary hover:underline block mt-2">
                  {hotelInfo.email}
                </a>
              </div>
            </div>

          </div>

          {/* Contact Inquiry Form */}
          <div className="lg:col-span-7 bg-surface-container-lowest p-8 rounded-2xl border border-surface-container/60 shadow-md">
            {submitted ? (
              <div className="text-center py-12">
                <span className="material-symbols-outlined text-5xl text-emerald-600 mb-3">mark_email_read</span>
                <h3 className="font-serif text-2xl font-bold text-on-surface mb-2">Message Received!</h3>
                <p className="text-xs text-on-surface-variant max-w-md mx-auto">
                  Thank you for reaching out to Hotel Ambience Inn. Our concierge team will review your message and reply shortly.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="mt-6 px-6 py-2.5 bg-primary text-on-primary text-xs font-bold uppercase tracking-wider rounded-xl"
                >
                  Send Another Inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="font-serif text-xl font-bold text-on-surface pb-3 border-b border-surface-container">
                  Send an Inquiry
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Your name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2.5 bg-surface-container-low border border-surface-container rounded-xl text-xs text-on-surface outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2.5 bg-surface-container-low border border-surface-container rounded-xl text-xs text-on-surface outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-2.5 bg-surface-container-low border border-surface-container rounded-xl text-xs text-on-surface outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                      Subject
                    </label>
                    <select
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full px-4 py-2.5 bg-surface-container-low border border-surface-container rounded-xl text-xs text-on-surface outline-none focus:ring-1 focus:ring-primary font-medium"
                    >
                      <option value="General Inquiry">General Inquiry</option>
                      <option value="Room Booking">Room Booking Question</option>
                      <option value="Corporate / Event">Corporate & Event Booking</option>
                      <option value="Airport Transfer">Airport Transfer Request</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                    Your Message *
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="How can our concierge assist you today?"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-2.5 bg-surface-container-low border border-surface-container rounded-xl text-xs text-on-surface outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-primary text-on-primary font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-primary-container transition-colors shadow-md"
                >
                  Send Message to Concierge
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Detailed Map & Location Container */}
        <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 border border-surface-container/60 shadow-lg space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-surface-container pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-1.5 mb-1">
                <span className="material-symbols-outlined text-[18px]">map</span>
                Navigation & Directions
              </span>
              <h3 className="font-serif text-2xl font-bold text-on-surface">Interactive Location Map</h3>
            </div>
            <span className="text-xs text-on-surface-variant font-semibold">Moshi, Pimpri-Chinchwad • Maharashtra 412105</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Detailed Location Card */}
            <div className="lg:col-span-4 space-y-4 bg-surface-container-low p-6 rounded-2xl border border-surface-container">
              <span className="text-xs font-bold uppercase tracking-wider text-primary block">Canonical Hotel Address</span>
              <h4 className="font-serif text-xl font-bold text-on-surface">{hotelInfo.name}</h4>
              <p className="text-xs text-on-surface-variant leading-relaxed font-medium">
                {hotelInfo.address}
              </p>
              <div className="pt-2 border-t border-surface-container/60 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-on-surface font-semibold">
                  <span className="material-symbols-outlined text-[18px] text-primary">call</span>
                  <a href={`tel:${hotelInfo.phone.replace(/[^+\d]/g, '')}`} className="hover:text-primary transition-colors">
                    {hotelInfo.phone}
                  </a>
                </div>
                <div className="flex items-center gap-2 text-on-surface-variant">
                  <span className="material-symbols-outlined text-[18px] text-primary">schedule</span>
                  <span>Check-In: 14:00 • Check-Out: 11:00</span>
                </div>
              </div>
              <div className="pt-3">
                <a
                  href={hotelInfo.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center bg-primary text-on-primary font-bold text-xs uppercase tracking-wider py-3 rounded-xl hover:bg-primary-container transition-all shadow-md gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">near_me</span>
                  <span>Get Directions</span>
                </a>
              </div>
            </div>

            {/* Embedded Interactive Map */}
            <div className="lg:col-span-8 h-96 sm:h-[450px] rounded-2xl overflow-hidden border border-surface-container shadow-md">
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

      </div>
    </div>
  );
};
