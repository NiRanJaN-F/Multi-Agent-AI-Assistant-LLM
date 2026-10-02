import React, { useState } from 'react';
import MenuItemCard from './MenuItemCard';

export default function MenuSection() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [cartCount, setCartCount] = useState(0);
  const [notification, setNotification] = useState(null);

  const categories = [
    { id: 'all', label: 'All Neural Brews' },
    { id: 'espresso', label: 'Cyber Espressos' },
    { id: 'coldbrew', label: 'Quantum Cold Brews' },
    { id: 'enhancement', label: 'Synaptic Additives' },
    { id: 'synthetic', label: 'Synthetic Pastries' }
  ];

  const menuItems = [
    {
      id: 1,
      name: 'Cybernetic Espresso v2.4',
      category: 'espresso',
      price: '$6.50',
      caffeine: '300mg',
      rating: 4.9,
      reviewsCount: 128,
      description: 'Extracted under 15 bar neural pressure with a luminous golden crema and micro-infused quantum foam.',
      image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=800&auto=format&fit=crop',
      badge: 'Bestseller',
      stats: { stability: '99.8%', temp: '88°C', sync: 'Neural-Link Ready' }
    },
    {
      id: 2,
      name: 'Quantum Cold Brew Zero',
      category: 'coldbrew',
      price: '$7.25',
      caffeine: '420mg',
      rating: 5.0,
      reviewsCount: 215,
      description: 'Steeped for 24 hours in sub-zero liquid nitrogen chambers. Utterly smooth with a sharp synaptic jolt.',
      image: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?q=80&w=800&auto=format&fit=crop',
      badge: 'High Voltage',
      stats: { stability: '100%', temp: '2°C', sync: 'Instant Wake' }
    },
    {
      id: 3,
      name: 'Matrix Matcha Infusion',
      category: 'enhancement',
      price: '$8.00',
      caffeine: '180mg',
      rating: 4.8,
      reviewsCount: 94,
      description: 'Ceremonial grade Uji matcha blended with adaptogenic lion\'s mane and nano-silver colloidal suspension.',
      image: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?q=80&w=800&auto=format&fit=crop',
      badge: 'Nootropic',
      stats: { stability: '95.4%', temp: '65°C', sync: 'Alpha Waves' }
    },
    {
      id: 4,
      name: 'Cyberpunk Caramel Macchiato',
      category: 'espresso',
      price: '$7.75',
      caffeine: '250mg',
      rating: 4.7,
      reviewsCount: 162,
      description: 'Layered neon caramel drizzle, synthetic oat milk microfoam, and double-shot quantum roast base.',
      image: 'https://images.unsplash.com/photo-1485808191679-5f86510681a2?q=80&w=800&auto=format&fit=crop',
      badge: 'Fan Favorite',
      stats: { stability: '97.2%', temp: '82°C', sync: 'Dopamine Boost' }
    },
    {
      id: 5,
      name: 'Neon Nitro Float',
      category: 'coldbrew',
      price: '$8.50',
      caffeine: '350mg',
      rating: 4.9,
      reviewsCount: 110,
      description: 'Cold brew nitro cascade topped with bioluminescent blue spirulina ice cream sphere.',
      image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?q=80&w=800&auto=format&fit=crop',
      badge: 'Limited Edition',
      stats: { stability: '98.1%', temp: '4°C', sync: 'Sensory Overload' }
    },
    {
      id: 6,
      name: 'Holo-Glazed Croissant',
      category: 'synthetic',
      price: '$5.50',
      caffeine: '0mg',
      rating: 4.6,
      reviewsCount: 88,
      description: 'Flaky 512-layer butter pastry baked in quantum ovens with shifting iridescent glaze coating.',
      image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?q=80&w=800&auto=format&fit=crop',
      badge: 'Fresh Baked',
      stats: { stability: '99.0%', temp: '24°C', sync: 'Pure Comfort' }
    }
  ];

  const filteredItems = activeCategory === 'all' 
    ? menuItems 
    : menuItems.filter(item => item.category === activeCategory);

  const handleOrder = (item) => {
    setCartCount(prev => prev + 1);
    setNotification(`Successfully queued "${item.name}" into order matrix!`);
    setTimeout(() => {
      setNotification(null);
    }, 3500);
  };

  return (
    <section id="menu" className="py-24 relative overflow-hidden bg-cyber-950/80">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-fuchsia-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Floating notification toast */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-3 bg-cyber-900 border border-cyan-500/50 text-cyan-300 px-5 py-3 rounded-xl shadow-2xl shadow-cyan-500/20 backdrop-blur-xl animate-bounce">
          <svg className="w-5 h-5 text-cyan-400 flex-shrink-0 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-sm font-medium tracking-wide">{notification}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono uppercase tracking-widest mb-4">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>Neural Menu Matrix</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight font-orbitron mb-6">
            ENGINEERED <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-fuchsia-500">BREWS</span>
          </h2>
          <p className="text-slate-400 text-base sm:text-lg">
            Choose your stimulant frequency. All beverages are calibrated for maximum cognitive throughput and sensory enhancement.
          </p>
        </div>

        {/* Category Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-12">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-5 py-2.5 rounded-xl font-mono text-xs uppercase tracking-wider transition-all duration-300 border ${
                activeCategory === cat.id
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500 shadow-lg shadow-cyan-500/25 scale-105'
                  : 'bg-cyber-900/60 text-slate-400 border-slate-800 hover:border-cyan-500/50 hover:text-cyan-400'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Menu Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredItems.map((item) => (
            <MenuItemCard 
              key={item.id} 
              item={item} 
              onOrder={handleOrder} 
            />
          ))}
        </div>

        {/* Bottom Cart Status Indicator */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center space-x-4 bg-cyber-900/80 border border-slate-800 px-6 py-3 rounded-2xl backdrop-blur-md shadow-xl">
            <div className="flex items-center space-x-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
              </span>
              <span className="text-sm font-mono text-slate-300">Active Order Queue:</span>
              <span className="text-cyan-400 font-bold font-mono">{cartCount} items</span>
            </div>
            {cartCount > 0 && (
              <button 
                onClick={() => setNotification('Transmitting orders to robotic barista stations...')}
                className="text-xs font-mono uppercase tracking-wider bg-gradient-to-r from-cyan-500 to-fuchsia-600 text-white px-4 py-1.5 rounded-lg hover:opacity-90 transition-opacity shadow-md shadow-cyan-500/20"
              >
                Dispatch Batch
              </button>
            )}
          </div>
        </div>

      </div>
    </section>
  );
}