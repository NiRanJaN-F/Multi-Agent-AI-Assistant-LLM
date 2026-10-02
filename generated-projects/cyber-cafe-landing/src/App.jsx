import React, { useState } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import MenuSection from './components/MenuSection';
import ReviewsSection from './components/ReviewsSection';
import BookingModal from './components/BookingModal';
import Footer from './components/Footer';

export default function App() {
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  const handleOpenBooking = () => {
    setIsBookingOpen(true);
  };

  const handleCloseBooking = () => {
    setIsBookingOpen(false);
  };

  return (
    <div className="min-h-screen bg-cyber-950 text-slate-100 selection:bg-cyan-500 selection:text-black overflow-x-hidden">
      <Header onOpenBooking={handleOpenBooking} />
      <main>
        <Hero onOpenBooking={handleOpenBooking} />
        <MenuSection />
        <ReviewsSection />
      </main>
      <Footer />
      
      {isBookingOpen && <BookingModal onClose={handleCloseBooking} />}
    </div>
  );
}