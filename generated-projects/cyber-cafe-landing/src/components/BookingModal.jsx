import React, { useState } from 'react';
import { X, Calendar, Clock, Users, User, Phone, Mail, MessageSquare, CheckCircle, Utensils } from 'lucide-react';

export default function BookingModal({ isOpen, onClose }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    date: '',
    time: '19:00',
    guests: '2',
    seating: 'indoor',
    name: '',
    phone: '',
    email: '',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingRef, setBookingRef] = useState('');

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNextStep = (e) => {
    e.preventDefault();
    setStep(2);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      const randomRef = 'LUM-' + Math.floor(100000 + Math.random() * 900000);
      setBookingRef(randomRef);
      setIsSubmitting(false);
      setStep(3);
    }, 1200);
  };

  const resetAndClose = () => {
    setStep(1);
    setFormData({
      date: '',
      time: '19:00',
      guests: '2',
      seating: 'indoor',
      name: '',
      phone: '',
      email: '',
      notes: '',
    });
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div 
        className="relative w-full max-w-lg bg-zinc-900 border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-zinc-950 border-b border-zinc-800">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Utensils className="w-4 h-4" />
            </div>
            <h3 className="text-lg font-serif tracking-wide text-amber-400">
              {step === 3 ? 'Reservation Confirmed' : 'Reserve a Table'}
            </h3>
          </div>
          <button 
            onClick={resetAndClose}
            className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar (steps 1 & 2) */}
        {step < 3 && (
          <div className="w-full bg-zinc-800 h-1">
            <div 
              className="bg-amber-500 h-1 transition-all duration-300"
              style={{ width: step === 1 ? '50%' : '100%' }}
            />
          </div>
        )}

        {/* Content Body */}
        <div className="p-6">
          {step === 1 && (
            <form onSubmit={handleNextStep} className="space-y-4">
              <p className="text-sm text-zinc-400 mb-4">
                Select your preferred date, time, and party size for an unforgettable dining experience at L'Ombra.
              </p>

              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1 font-medium">
                  Date
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-amber-500">
                    <Calendar className="w-4 h-4" />
                  </span>
                  <input
                    type="date"
                    required
                    name="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={formData.date}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-800/60 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1 font-medium">
                    Time
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-amber-500">
                      <Clock className="w-4 h-4" />
                    </span>
                    <select
                      name="time"
                      value={formData.time}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 bg-zinc-800/60 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-amber-500 transition-colors"
                    >
                      <option value="17:30">5:30 PM</option>
                      <option value="18:00">6:00 PM</option>
                      <option value="18:30">6:30 PM</option>
                      <option value="19:00">7:00 PM</option>
                      <option value="19:30">7:30 PM</option>
                      <option value="20:00">8:00 PM</option>
                      <option value="20:30">8:30 PM</option>
                      <option value="21:00">9:00 PM</option>
                      <option value="21:30">9:30 PM</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1 font-medium">
                    Guests
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-amber-500">
                      <Users className="w-4 h-4" />
                    </span>
                    <select
                      name="guests"
                      value={formData.guests}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 bg-zinc-800/60 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-amber-500 transition-colors"
                    >
                      <option value="1">1 Person</option>
                      <option value="2">2 People</option>
                      <option value="3">3 People</option>
                      <option value="4">4 People</option>
                      <option value="5">5 People</option>
                      <option value="6">6 People</option>
                      <option value="7">7+ (Large Party)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1 font-medium">
                  Seating Preference
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'indoor', label: 'Dining Room' },
                    { id: 'patio', label: 'Garden Patio' },
                    { id: 'bar', label: 'Chef Counter' },
                  ].map((seat) => (
                    <button
                      key={seat.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, seating: seat.id })}
                      className={`py-2 px-3 text-xs font-medium rounded-lg border transition-all ${
                        formData.seating === seat.id
                          ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                          : 'bg-zinc-800/40 border-zinc-700 text-zinc-400 hover:border-zinc-600'
                      }`}
                    >
                      {seat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold rounded-lg shadow-lg shadow-amber-500/20 transition-all uppercase tracking-wider text-sm"
                >
                  Continue to Details
                </button>
              </div>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center justify-between bg-zinc-950 p-3 rounded-lg border border-zinc-800 mb-2 text-xs text-zinc-300">
                <div>
                  <span className="text-amber-500 font-semibold">{formData.date}</span> at <span className="text-amber-500 font-semibold">{formData.time}</span>
                </div>
                <div>
                  <span className="text-amber-500 font-semibold">{formData.guests} Guests</span> ({formData.seating})
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-amber-400 underline hover:text-amber-300"
                >
                  Edit
                </button>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1 font-medium">
                  Full Name
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-amber-500">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    name="name"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-800/60 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1 font-medium">
                    Phone Number
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-amber-500">
                      <Phone className="w-4 h-4" />
                    </span>
                    <input
                      type="tel"
                      required
                      name="phone"
                      placeholder="(555) 000-0000"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 bg-zinc-800/60 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1 font-medium">
                    Email Address
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-amber-500">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input
                      type="email"
                      required
                      name="email"
                      placeholder="john@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 bg-zinc-800/60 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1 font-medium">
                  Special Requests / Dietary Notes (Optional)
                </label>
                <div className="relative">
                  <span className="absolute top-3 left-3 pointer-events-none text-amber-500">
                    <MessageSquare className="w-4 h-4" />
                  </span>
                  <textarea
                    name="notes"
                    rows="2"
                    placeholder="Allergies, anniversary, high chair needed..."
                    value={formData.notes}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-800/60 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors resize-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-1/3 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-lg transition-all text-sm uppercase tracking-wider"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-2/3 py-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold rounded-lg shadow-lg shadow-amber-500/20 transition-all uppercase tracking-wider text-sm flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <span>Confirm Booking</span>
                  )}
                </button>
              </div>
            </form>
          )}

          {step === 3 && (
            <div className="text-center py-6 space-y-4 animate-fadeIn">
              <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 rounded-full flex items-center justify-center mx-auto text-amber-400">
                <CheckCircle className="w-8 h-8" />
              </div>
              
              <div>
                <h4 className="text-xl font-serif text-white">We're excited to host you!</h4>
                <p className="text-sm text-zinc-400 mt-1">
                  A confirmation email and SMS have been sent to <span className="text-zinc-200">{formData.email}</span>.
                </p>
              </div>

              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 text-left space-y-2 my-4">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">Reference Code:</span>
                  <span className="text-amber-400 font-mono font-bold">{bookingRef}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">Guest Name:</span>
                  <span className="text-zinc-200 font-medium">{formData.name}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">Date & Time:</span>
                  <span className="text-zinc-200 font-medium">{formData.date} at {formData.time}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">Party Size:</span>
                  <span className="text-zinc-200 font-medium">{formData.guests} Guests ({formData.seating})</span>
                </div>
              </div>

              <button
                onClick={resetAndClose}
                className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-lg transition-all text-sm uppercase tracking-wider"
              >
                Close Window
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}