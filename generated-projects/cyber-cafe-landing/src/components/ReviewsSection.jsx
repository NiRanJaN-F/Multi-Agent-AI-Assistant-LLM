import React, { useState } from 'react';

const REVIEWS = [
  {
    id: 1,
    name: 'Kaelen Voss',
    handle: '@voss_matrix',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    rating: 5,
    tag: 'CYBER-RUNNER',
    comment: 'The Quantum Espresso rewired my pre-frontal cortex in 4 seconds flat. Absolute life saver before a 12-hour net-running dive. The ambient synth-wave and neon drizzle outside complete the aesthetic.',
    verified: true,
    likes: 142,
    date: '2.14.2088'
  },
  {
    id: 2,
    name: 'Nyx Vance',
    handle: '@nyx_synth',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    rating: 5,
    tag: 'NEURAL ARCHITECT',
    comment: 'Best Neon Matcha Latte in District 4. The micro-foam has actual bioluminescent phytoplankton reactive to biometric stress. The seating pods are thoroughly sound-isolated for private data trades.',
    verified: true,
    likes: 89,
    date: '2.18.2088'
  },
  {
    id: 3,
    name: 'Tess "Glitch" Sterling',
    handle: '@glitch_tess',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    rating: 5,
    tag: 'DECKER',
    comment: 'Ordered the Tachyon Cold Brew and experienced time dilation for about ten minutes. 10/10 would overclock my nervous system here again. Service droid unit #7 is surprisingly polite.',
    verified: true,
    likes: 230,
    date: '2.21.2088'
  },
  {
    id: 4,
    name: 'Dr. Aris Thorne',
    handle: '@aris_bio_synth',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    rating: 4,
    tag: 'BIOTECH RESEARCHER',
    comment: 'Exceptional coffee chemistry. The extraction process uses magnetic oscillation instead of high pressure, preserving delicate aromatic compounds. Only giving 4 stars because the synth-bakery ran out of synthetic croissants early.',
    verified: true,
    likes: 64,
    date: '2.22.2088'
  }
];

export default function ReviewsSection() {
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [likedReviews, setLikedReviews] = useState({});

  const handleLike = (id) => {
    setLikedReviews((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const filteredReviews = activeFilter === 'ALL' 
    ? REVIEWS 
    : REVIEWS.filter(r => r.tag.includes(activeFilter));

  return (
    <section id="reviews" className="py-24 relative overflow-hidden bg-cyber-950/80 border-t border-b border-cyan-500/10">
      {/* Background Cyber Graphic Elements */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-1/4 left-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-fuchsia-500/10 rounded-full blur-3xl"></div>
        <div className="absolute inset-0 cyber-grid opacity-30"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 text-xs tracking-widest uppercase mb-4 shadow-[0_0_15px_rgba(0,240,255,0.2)]">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
            <span>NEURAL FEEDBACK LOGS</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight uppercase font-['Orbitron']">
            CUSTOMER <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-500">TRANSMISSIONS</span>
          </h2>
          <p className="mt-4 text-slate-400 text-sm sm:text-base">
            Verified sensory reviews intercepted from across the grid. Discover what cyber-runners, deckers, and neural architects are saying about our brews.
          </p>

          {/* Filter Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-8">
            {['ALL', 'CYBER-RUNNER', 'DECKER', 'BIOTECH'].map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-1.5 text-xs font-semibold tracking-wider uppercase transition-all duration-300 rounded ${
                  activeFilter === filter
                    ? 'bg-cyan-500/20 border border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                    : 'bg-cyber-900/60 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {filteredReviews.map((review) => {
            const isLiked = likedReviews[review.id];
            const likeCount = review.likes + (isLiked ? 1 : 0);

            return (
              <div 
                key={review.id}
                className="group relative bg-cyber-900/40 backdrop-blur-xl border border-slate-800/80 hover:border-cyan-500/50 rounded-2xl p-6 sm:p-8 transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,240,255,0.15)] flex flex-col justify-between"
              >
                {/* Corner futuristic tech accent */}
                <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden pointer-events-none">
                  <div className="absolute transform rotate-45 bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent top-3 -right-6 w-20 h-1"></div>
                </div>

                <div>
                  {/* Top Bar: Avatar & User Info */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <img 
                          src={review.avatar} 
                          alt={review.name} 
                          className="w-12 h-12 rounded-full object-cover border-2 border-cyan-500/40 group-hover:border-cyan-400 transition-colors"
                        />
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-cyber-950 rounded-full flex items-center justify-center border border-cyan-500">
                          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-bold text-white tracking-wide text-sm sm:text-base font-['Orbitron']">{review.name}</h4>
                          {review.verified && (
                            <span className="text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-1.5 py-0.5 rounded font-mono">
                              VERIFIED
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 font-mono">{review.handle}</p>
                      </div>
                    </div>

                    {/* Tag badge */}
                    <span className="text-[10px] tracking-widest font-mono text-fuchsia-400 bg-fuchsia-950/40 border border-fuchsia-500/30 px-2 py-1 rounded">
                      {review.tag}
                    </span>
                  </div>

                  {/* Rating Stars */}
                  <div className="flex items-center space-x-1 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <svg 
                        key={i} 
                        className={`w-4 h-4 ${i < review.rating ? 'text-cyan-400 fill-cyan-400 drop-shadow-[0_0_5px_rgba(0,240,255,0.6)]' : 'text-slate-700'}`}
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    ))}
                    <span className="text-xs font-mono text-slate-500 ml-2">{review.date}</span>
                  </div>

                  {/* Comment Text */}
                  <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-sans mb-6">
                    "{review.comment}"
                  </p>
                </div>

                {/* Footer of card: Likes & Interaction */}
                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-mono">
                  <div className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                    <span>SIGNAL INTEGRITY: 99.8%</span>
                  </div>

                  <button 
                    onClick={() => handleLike(review.id)}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border transition-all duration-300 ${
                      isLiked 
                        ? 'bg-fuchsia-500/20 border-fuchsia-500 text-fuchsia-400 shadow-[0_0_15px_rgba(255,0,127,0.4)]' 
                        : 'bg-cyber-950/60 border-slate-800 hover:border-cyan-500/50 hover:text-white text-slate-400'
                    }`}
                  >
                    <svg 
                      className={`w-4 h-4 transition-transform duration-300 ${isLiked ? 'scale-125 fill-fuchsia-400 text-fuchsia-400' : 'fill-none'}`} 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <span>{likeCount}</span>
                  </button>
                </div>

              </div>
            );
          })}
        </div>

        {/* Bottom Callout */}
        <div className="mt-16 text-center">
          <div className="inline-block p-[1px] rounded-xl bg-gradient-to-r from-cyan-500 via-fuchsia-500 to-cyan-500 shadow-[0_0_25px_rgba(0,240,255,0.2)]">
            <div className="bg-cyber-900 px-8 py-6 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="text-left">
                <h4 className="text-white font-bold font-['Orbitron'] text-base sm:text-lg">HAVE A NEURAL BREW STORY?</h4>
                <p className="text-slate-400 text-xs sm:text-sm">Transmit your experience directly to our local terminal database.</p>
              </div>
              <button 
                onClick={() => alert('Terminal ready for new review upload. Please connect your neural link.')}
                className="whitespace-nowrap px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-bold uppercase tracking-wider text-xs rounded-lg hover:shadow-[0_0_20px_rgba(0,240,255,0.7)] transition-all transform hover:-translate-y-0.5"
              >
                UPLOAD TRANSMISSION
              </button>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}