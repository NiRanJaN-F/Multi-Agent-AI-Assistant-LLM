import React, { useState } from 'react';

export default function Hero({ onOpenBooking }) {
  const [orderPulse, setOrderPulse] = useState(false);

  const handleAnimatedOrder = (e) => {
    // Create ripple effect
    const btn = e.currentTarget;
    const circle = document.createElement('span');
    const diameter = Math.max(btn.clientWidth, btn.clientHeight);
    const radius = diameter / 2;

    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${e.clientX - btn.getBoundingClientRect().left - radius}px`;
    circle.style.top = `${e.clientY - btn.getBoundingClientRect().top - radius}px`;
    circle.classList.add('absolute', 'rounded-full', 'bg-cyan-400/40', 'animate-ping', 'pointer-events-none');

    const ripple = btn.getElementsByClassName('ripple')[0];
    if (ripple) {
      ripple.remove();
    }
    btn.appendChild(circle);

    setOrderPulse(true);
    setTimeout(() => {
      setOrderPulse(false);
      onOpenBooking();
    }, 600);
  };

  return (
    <section className="relative min-h-[92vh] flex items-center justify-center pt-24 pb-16 overflow-hidden">
      {/* Cyberpunk background decorative gradients & light leaks */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-600/15 rounded-full blur-[140px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-10 right-10 w-[450px] h-[450px] bg-pink-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Text Column */}
          <div className="lg:col-span-7 text-center lg:text-left space-y-8">
            
            {/* Status Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyber-900/80 border border-cyan-500/30 text-cyan-400 text-xs sm:text-sm font-mono tracking-wider shadow-[0_0_20px_rgba(0,240,255,0.15)]">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
              <span>NEURAL FREQUENCY STABLE // SECTOR 07 BREWERY</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl xl:text-7xl font-extrabold tracking-tight font-heading leading-none">
              TASTE THE <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-pink-500 drop-shadow-[0_0_35px_rgba(0,240,255,0.4)]">
                FUTURE OF COFFEE
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto lg:mx-0 font-sans leading-relaxed">
              Step into Neo-Cafe where cyberpunk aesthetics meet hyper-precise neural roasting. Handcrafted quantum espressos, synaptic energy elixirs, and data-infused pastries engineered to awaken your consciousness.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              
              {/* Animated Order Button */}
              <button
                onClick={handleAnimatedOrder}
                className={`relative overflow-hidden group w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-cyber-950 font-heading font-bold text-sm tracking-widest uppercase transition-all duration-300 shadow-[0_0_25px_rgba(0,240,255,0.4)] hover:shadow-[0_0_40px_rgba(0,240,255,0.8)] hover:scale-105 active:scale-95 ${orderPulse ? 'scale-95 ring-4 ring-cyan-300' : ''}`}
              >
                <div className="absolute inset-0 w-1/2 h-full bg-white/30 skew-x-[45deg] -translate-x-full group-hover:translate-x-[300%] transition-transform duration-1000"></div>
                <span className="relative z-10 flex items-center justify-center gap-3">
                  <svg className="w-5 h-5 text-cyber-950 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  INITIATE ORDER
                </span>
              </button>

              {/* Menu Jump Button */}
              <a
                href="#menu"
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-cyber-900/60 hover:bg-cyber-800 text-slate-200 font-heading font-medium text-sm tracking-widest uppercase border border-slate-700/60 hover:border-cyan-500/50 transition-all duration-300 text-center shadow-lg backdrop-blur-md"
              >
                Explore Menu
              </a>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-800/80 max-w-lg mx-auto lg:mx-0">
              <div className="text-left">
                <div className="text-2xl sm:text-3xl font-heading font-black text-cyan-400">99.9%</div>
                <div className="text-xs text-slate-400 font-mono tracking-wide mt-0.5">PURITY INDEX</div>
              </div>
              <div className="text-left border-x border-slate-800/80 px-4">
                <div className="text-2xl sm:text-3xl font-heading font-black text-pink-500">0.2s</div>
                <div className="text-xs text-slate-400 font-mono tracking-wide mt-0.5">SYNAPSE SPEED</div>
              </div>
              <div className="text-left pl-2">
                <div className="text-2xl sm:text-3xl font-heading font-black text-teal-400">24/7</div>
                <div className="text-xs text-slate-400 font-mono tracking-wide mt-0.5">CYBER BREW</div>
              </div>
            </div>

          </div>

          {/* Right Holographic Visual Column */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            
            {/* Glowing Ring Backdrops */}
            <div className="absolute w-[320px] sm:w-[400px] h-[320px] sm:h-[400px] rounded-full border border-cyan-500/20 animate-[spin_30s_linear_infinite] pointer-events-none"></div>
            <div className="absolute w-[260px] sm:w-[320px] h-[260px] sm:h-[320px] rounded-full border border-pink-500/20 border-dashed animate-[spin_20s_linear_infinite_reverse] pointer-events-none"></div>

            {/* Hero Hologram Card */}
            <div className="relative w-full max-w-md bg-cyber-900/70 border border-cyan-500/40 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-[0_0_50px_rgba(0,240,255,0.2)] group hover:border-cyan-400 transition-all duration-500">
              
              {/* Top Card Badge */}
              <div className="flex items-center justify-between mb-6">
                <span className="px-3 py-1 rounded-md bg-cyan-950/80 text-cyan-400 font-mono text-xs border border-cyan-500/30">
                  SPEC_01 // FEATURED
                </span>
                <div className="flex items-center gap-1 text-pink-500">
                  <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse"></span>
                  <span className="text-xs font-mono">LIVE BREW</span>
                </div>
              </div>

              {/* Holographic Image Container */}
              <div className="relative w-full h-64 sm:h-72 rounded-2xl overflow-hidden bg-cyber-950 border border-slate-800 shadow-inner group-hover:shadow-[0_0_30px_rgba(0,240,255,0.3)] transition-all duration-500">
                <img 
                  src="https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=800&auto=format&fit=crop" 
                  alt="Cyberpunk Quantum Coffee" 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-90 mix-blend-luminosity hover:mix-blend-normal"
                />
                
                {/* Hologram Scanline Effect */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/10 to-transparent bg-[length:100%_4px] pointer-events-none opacity-60"></div>
                
                {/* Floating Price Tag */}
                <div className="absolute bottom-4 left-4 bg-cyber-900/90 backdrop-blur-md px-4 py-2 rounded-xl border border-cyan-500/50 flex items-center gap-3">
                  <div>
                    <div className="text-[10px] text-slate-400 font-mono">NEURAL LATTE</div>
                    <div className="text-sm font-heading font-bold text-cyan-300">₿ 0.0014 ETH</div>
                  </div>
                </div>
              </div>

              {/* Card Footer Details */}
              <div className="mt-6 flex items-center justify-between">
                <div>
                  <h3 className="font-heading font-bold text-slate-100 text-lg">Cybernetic Espresso</h3>
                  <p className="text-xs text-slate-400 font-sans mt-0.5">Infused with nano-caffeine & velvet foam.</p>
                </div>
                <button
                  onClick={onOpenBooking}
                  className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/40 text-cyan-400 flex items-center justify-center hover:bg-cyan-500 hover:text-cyber-950 transition-all duration-300 shadow-lg"
                  title="Reserve Table"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>

            </div>

          </div>

        </div>
      </div>
    </section>
  );
}