import React, { useState } from 'react';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 5000);
    }
  };

  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-12 border-t border-slate-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 pb-16 border-b border-slate-800">
          
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">NexusScale</span>
            </div>
            
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              Empowering high-growth engineering and product teams to scale infrastructure, accelerate velocity, and deliver exceptional user experiences with next-generation SaaS intelligence.
            </p>

            {/* Newsletter Form */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-white tracking-wider uppercase">Subscribe to our newsletter</h4>
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your work email"
                  required
                  className="bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent flex-1 transition-all"
                />
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40 cursor-pointer active:scale-95"
                >
                  Subscribe
                </button>
              </form>
              {subscribed && (
                <p className="text-emerald-400 text-xs font-medium animate-fade-in flex items-center space-x-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Thank you for subscribing! Check your inbox soon.</span>
                </p>
              )}
            </div>
          </div>

          {/* Links Column 1: Product */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider">Product</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a href="#features" className="hover:text-indigo-400 transition-colors">Features</a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-indigo-400 transition-colors">Pricing Plans</a>
              </li>
              <li>
                <a href="#testimonials" className="hover:text-indigo-400 transition-colors">Customer Stories</a>
              </li>
              <li>
                <a href="#changelog" className="hover:text-indigo-400 transition-colors flex items-center space-x-1.5">
                  <span>Changelog</span>
                  <span className="bg-indigo-500/20 text-indigo-400 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-indigo-500/30">v2.4</span>
                </a>
              </li>
              <li>
                <a href="#integrations" className="hover:text-indigo-400 transition-colors">Integrations</a>
              </li>
            </ul>
          </div>

          {/* Links Column 2: Resources */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider">Resources</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a href="#docs" className="hover:text-indigo-400 transition-colors">Documentation</a>
              </li>
              <li>
                <a href="#api" className="hover:text-indigo-400 transition-colors">API Reference</a>
              </li>
              <li>
                <a href="#guides" className="hover:text-indigo-400 transition-colors">Guides & Tutorials</a>
              </li>
              <li>
                <a href="#blog" className="hover:text-indigo-400 transition-colors">Engineering Blog</a>
              </li>
              <li>
                <a href="#status" className="hover:text-indigo-400 transition-colors flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>System Status</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Links Column 3: Company */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider">Company</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a href="#about" className="hover:text-indigo-400 transition-colors">About Us</a>
              </li>
              <li>
                <a href="#careers" className="hover:text-indigo-400 transition-colors flex items-center space-x-1.5">
                  <span>Careers</span>
                  <span className="bg-pink-500/20 text-pink-400 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-pink-500/30">We're hiring!</span>
                </a>
              </li>
              <li>
                <a href="#press" className="hover:text-indigo-400 transition-colors">Press Kit</a>
              </li>
              <li>
                <a href="#privacy" className="hover:text-indigo-400 transition-colors">Privacy Policy</a>
              </li>
              <li>
                <a href="#terms" className="hover:text-indigo-400 transition-colors">Terms of Service</a>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 space-y-4 md:space-y-0">
          <p>© {new Date().getFullYear()} NexusScale Inc. All rights reserved.</p>
          
          <div className="flex items-center space-x-6">
            <a href="#privacy" className="hover:text-slate-400 transition-colors">Privacy</a>
            <a href="#terms" className="hover:text-slate-400 transition-colors">Terms</a>
            <a href="#cookies" className="hover:text-slate-400 transition-colors">Cookie Settings</a>
          </div>

          {/* Social Icons */}
          <div className="flex items-center space-x-4">
            {/* Twitter / X */}
            <a href="https://twitter.com" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/>
              </svg>
            </a>
            {/* GitHub */}
            <a href="https://github.com" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
              </svg>
            </a>
            {/* LinkedIn */}
            <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
              </svg>
            </a>
          </div>

        </div>
      </div>
    </footer>
  );
}