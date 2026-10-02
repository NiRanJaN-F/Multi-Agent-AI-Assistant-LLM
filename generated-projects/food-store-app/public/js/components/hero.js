/**
 * @file hero.js
 * @description Hero component for the DEVGEAR storefront featuring an immersive
 * developer hardware banner with glowing terminal aesthetics and quick CTAs.
 */

export function renderHero() {
    const container = document.getElementById('hero-container');
    if (!container) return;

    container.innerHTML = `
        <div class="relative overflow-hidden bg-gradient-to-b from-dark-800/80 via-dark-900 to-dark-900 border-b border-slate-800/80 pt-12 pb-20 lg:pt-20 lg:pb-28">
            <!-- Background Decorative Glows & Grid Pattern -->
            <div class="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none"></div>
            
            <div class="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-brand/10 blur-[120px] rounded-full pointer-events-none -z-10"></div>
            <div class="absolute top-10 right-10 w-72 h-72 bg-purple-500/10 blur-[100px] rounded-full pointer-events-none -z-10"></div>

            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                    
                    <!-- Left Column: Hero Text & CTAs -->
                    <div class="lg:col-span-7 text-center lg:text-left">
                        <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-dark-800/90 border border-brand/30 text-brand text-xs font-medium tracking-wide mb-6 shadow-inner shadow-brand/10 backdrop-blur-md animate-pulse">
                            <i data-lucide="terminal" class="w-3.5 h-3.5"></i>
                            <span>v2.4 Mech & Hardware Release</span>
                            <span class="w-1.5 h-1.5 rounded-full bg-brand"></span>
                        </div>

                        <h1 class="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1] mb-6">
                            High-Performance <br class="hidden sm:inline">
                            <span class="bg-gradient-to-r from-brand via-teal-400 to-brand-accent bg-clip-text text-transparent">Developer Hardware</span>
                        </h1>

                        <p class="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto lg:mx-0 mb-8 leading-relaxed font-normal">
                            Precision-engineered mechanical keyboards, ergonomic desk setups, and studio audio gear built for absolute focus, tactile feedback, and endless lines of clean code.
                        </p>

                        <div class="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                            <a href="#product-grid-container" class="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-gradient-to-r from-brand to-brand-accent text-white font-semibold shadow-lg shadow-brand/25 hover:shadow-brand/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200">
                                <i data-lucide="shopping-bag" class="w-5 h-5"></i>
                                <span>Explore Hardware</span>
                            </a>
                            <a href="#filters-container" class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-dark-800 hover:bg-dark-700/80 border border-slate-700/80 text-slate-300 font-medium transition-all duration-200 hover:text-white">
                                <i data-lucide="SlidersHorizontal" class="w-4 h-4 text-slate-400"></i>
                                <span>Filter Categories</span>
                            </a>
                        </div>

                        <!-- Key Highlights / Badges -->
                        <div class="mt-12 grid grid-cols-3 gap-6 pt-8 border-t border-slate-800/80 text-left">
                            <div>
                                <div class="text-2xl font-bold text-white font-mono">0ms</div>
                                <div class="text-xs text-slate-400 mt-0.5">Input Latency</div>
                            </div>
                            <div>
                                <div class="text-2xl font-bold text-white font-mono">100M+</div>
                                <div class="text-xs text-slate-400 mt-0.5">Keystroke Life</div>
                            </div>
                            <div>
                                <div class="text-2xl font-bold text-white font-mono">CNC</div>
                                <div class="text-xs text-slate-400 mt-0.5">Anodized Aluminum</div>
                            </div>
                        </div>
                    </div>

                    <!-- Right Column: Interactive Hardware Preview Card / Graphic -->
                    <div class="lg:col-span-5 relative">
                        <div class="relative mx-auto max-w-md lg:max-w-none">
                            <!-- Glow frame -->
                            <div class="absolute -inset-1.5 bg-gradient-to-r from-brand to-brand-accent rounded-2xl blur-xl opacity-30 animate-pulse"></div>
                            
                            <!-- Glass Card Container -->
                            <div class="relative rounded-2xl bg-dark-800/90 border border-slate-700/80 p-6 shadow-2xl backdrop-blur-xl">
                                
                                <!-- Window Header -->
                                <div class="flex items-center justify-between pb-4 border-b border-slate-700/60 mb-6">
                                    <div class="flex items-center space-x-2">
                                        <div class="w-3 h-3 rounded-full bg-red-500/80"></div>
                                        <div class="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                                        <div class="w-3 h-3 rounded-full bg-green-500/80"></div>
                                    </div>
                                    <div class="text-xs font-mono text-slate-400 bg-dark-900/60 px-3 py-1 rounded-md border border-slate-700/50">
                                        devgear-v2-flagship.hw
                                    </div>
                                    <div class="flex items-center text-slate-400">
                                        <i data-lucide="cpu" class="w-4 h-4 text-brand"></i>
                                    </div>
                                </div>

                                <!-- Featured Product Showcase Inside Hero -->
                                <div class="relative rounded-xl overflow-hidden bg-dark-900/80 border border-slate-800 p-4 mb-6 group">
                                    <div class="absolute top-3 right-3 z-10">
                                        <span class="px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-brand/20 text-brand border border-brand/30 backdrop-blur-md">
                                            Best Seller
                                        </span>
                                    </div>
                                    <div class="h-48 overflow-hidden rounded-lg flex items-center justify-center relative">
                                        <div class="absolute inset-0 bg-gradient-to-t from-dark-900 via-transparent to-transparent z-10 opacity-60"></div>
                                        <img src="https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&w=800&q=80" 
                                             alt="Apex Pro TKL Mechanical Keyboard" 
                                             class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                                    </div>
                                    <div class="mt-4 flex items-center justify-between">
                                        <div>
                                            <h3 class="text-sm font-semibold text-white">Apex Pro TKL Wireless</h3>
                                            <p class="text-xs text-slate-400 mt-0.5">Hall Effect Switches • CNC Aluminum</p>
                                        </div>
                                        <div class="text-right">
                                            <span class="text-base font-bold text-brand font-mono">$249.99</span>
                                        </div>
                                    </div>
                                </div>

                                <!-- Quick Specs Mini Grid -->
                                <div class="grid grid-cols-2 gap-3 text-xs">
                                    <div class="flex items-center gap-2.5 p-2.5 rounded-lg bg-dark-900/50 border border-slate-800 text-slate-300">
                                        <i data-lucide="wifi" class="w-4 h-4 text-brand flex-shrink-0"></i>
                                        <span>Tri-Mode Connection</span>
                                    </div>
                                    <div class="flex items-center gap-2.5 p-2.5 rounded-lg bg-dark-900/50 border border-slate-800 text-slate-300">
                                        <i data-lucide="battery-charging" class="w-4 h-4 text-brand flex-shrink-0"></i>
                                        <span>200h Battery Life</span>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    `;

    // Render Lucide icons inside the newly populated hero container
    if (window.lucide) {
        window.lucide.createIcons();
    }
}