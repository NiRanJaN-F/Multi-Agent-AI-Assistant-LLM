import React, { useState } from 'react';

export default function MenuItemCard({ item, onOrder }) {
  const [isOrdered, setIsOrdered] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleOrderClick = () => {
    setIsOrdered(true);
    if (onOrder) {
      onOrder(item);
    }
    setTimeout(() => {
      setIsOrdered(false);
    }, 2000);
  };

  return (
    <div 
      className="group relative bg-cyber-900/60 backdrop-blur-md border border-slate-800 rounded-2xl overflow-hidden transition-all duration-300 hover:border-cyan-500/50 hover:shadow-[0_0_30px_rgba(0,240,255,0.15)] flex flex-col justify-between"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Absolute glow effects on hover */}
      <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

      {/* Card Header / Image container */}
      <div className="relative h-56 w-full overflow-hidden bg-cyber-950">
        <div className="absolute inset-0 bg-gradient-to-t from-cyber-900 via-transparent to-transparent z-10 opacity-80" />
        <img 
          src={item.image} 
          alt={item.name} 
          className="w-full h-full object-cover object-center transform group-hover:scale-110 transition-transform duration-700 filter brightness-90 group-hover:brightness-100"
        />
        
        {/* Floating Category Badge */}
        <div className="absolute top-3 left-3 z-20 bg-cyber-950/80 backdrop-blur-md border border-cyan-500/30 text-cyan-400 text-xs font-mono px-3 py-1 rounded-full uppercase tracking-wider shadow-lg">
          {item.category || 'Neural Brew'}
        </div>

        {/* Price Tag */}
        <div className="absolute top-3 right-3 z-20 bg-pink-600/90 backdrop-blur-md text-white font-mono font-bold text-sm px-3 py-1 rounded-full shadow-[0_0_15px_rgba(255,0,127,0.5)]">
          {item.price}
        </div>
      </div>

      {/* Card Body */}
      <div className="p-5 flex-1 flex flex-col justify-between relative z-20">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold font-['Orbitron'] text-white group-hover:text-cyan-400 transition-colors tracking-wide">
              {item.name}
            </h3>
            {item.caffeine && (
              <span className="text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded">
                ⚡ {item.caffeine}
              </span>
            )}
          </div>
          <p className="text-slate-400 text-xs leading-relaxed mb-4 font-sans line-clamp-2">
            {item.description}
          </p>
        </div>

        {/* Card Footer with Animated Order Button */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between mt-auto">
          <div className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
              {isHovered ? 'Ready to sync' : 'In Stock'}
            </span>
          </div>

          <button
            onClick={handleOrderClick}
            disabled={isOrdered}
            className={`relative overflow-hidden px-4 py-2 rounded-xl font-mono text-xs font-semibold tracking-wider transition-all duration-300 flex items-center space-x-2 ${
              isOrdered 
                ? 'bg-emerald-500 text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.7)]' 
                : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 hover:shadow-[0_0_20px_rgba(0,240,255,0.7)] active:scale-95'
            }`}
          >
            {isOrdered ? (
              <>
                <svg className="w-4 h-4 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>BREWING...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>ORDER NEURAL</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Cyberpunk corner accent lines */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-cyan-400 opacity-60" />
      <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-cyan-400 opacity-60" />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-cyan-400 opacity-60" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-cyan-400 opacity-60" />
    </div>
  );
}