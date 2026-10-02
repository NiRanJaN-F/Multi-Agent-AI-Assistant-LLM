import React, { useState } from 'react';

export default function Features({ showToast }) {
  const [activeTab, setActiveTab] = useState('all');
  const [hoveredCard, setHoveredCard] = useState(null);

  const featuresList = [
    {
      id: 'analytics',
      category: 'intelligence',
      title: 'Real-Time Telemetry & Insights',
      description: 'Monitor throughput, error rates, and resource utilization across distributed clusters instantly with sub-millisecond granularity.',
      icon: (
        <svg className="w-6 h-6 text-indigo-500 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      badge: 'Popular',
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'security',
      category: 'security',
      title: 'Enterprise-Grade Compliance',
      description: 'SOC2 Type II certified, GDPR-ready, and end-to-end encrypted at rest and in transit with custom KMS support.',
      icon: (
        <svg className="w-6 h-6 text-purple-500 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      badge: 'Zero Trust',
      image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'automation',
      category: 'workflow',
      title: 'Autonomous CI/CD Pipelines',
      description: 'Trigger intelligent rollbacks, blue-green deployments, and canary testing based on live telemetry anomalies.',
      icon: (
        <svg className="w-6 h-6 text-pink-500 dark:text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      badge: 'Fast',
      image: 'https://images.unsplash.com/photo-1618401471353-b98aedd04e11?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'scaling',
      category: 'infrastructure',
      title: 'Elastic Global Scaling',
      description: 'Automatically scale compute nodes across multi-cloud regions with zero downtime and intelligent traffic routing.',
      icon: (
        <svg className="w-6 h-6 text-indigo-500 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      badge: 'Global',
      image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'collaboration',
      category: 'workflow',
      title: 'Real-Time Team Sync',
      description: 'Collaborate with your entire engineering organization with shared dashboards, incident war rooms, and role-based permissions.',
      icon: (
        <svg className="w-6 h-6 text-purple-500 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      badge: 'Teamwork',
      image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'api',
      category: 'infrastructure',
      title: 'Extensible Developer APIs',
      description: 'Build custom workflows and integrations using our robust GraphQL & REST APIs, webhooks, and official SDKs.',
      icon: (
        <svg className="w-6 h-6 text-pink-500 dark:text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      ),
      badge: 'Developer First',
      image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=600&q=80',
    },
  ];

  const filteredFeatures = activeTab === 'all'
    ? featuresList
    : featuresList.filter(f => f.category === activeTab);

  const handleCardClick = (title) => {
    if (showToast) {
      showToast(`Exploring "${title}" feature details`);
    }
  };

  return (
    <section id="features" className="py-24 bg-slate-100/50 dark:bg-slate-900/50 relative overflow-hidden transition-colors duration-300">
      {/* Background glow accents */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 mb-4 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
            Powerful Capabilities
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight sm:leading-tight">
            Designed for Engineering Teams <br className="hidden sm:inline" />
            <span className="gradient-text">Who Never Compromise</span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-400">
            Everything you need to build, scale, secure, and monitor your cloud architecture under a single unified dashboard.
          </p>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-12">
          {[
            { id: 'all', label: 'All Features' },
            { id: 'intelligence', label: 'Intelligence' },
            { id: 'security', label: 'Security' },
            { id: 'workflow', label: 'Workflow' },
            { id: 'infrastructure', label: 'Infrastructure' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 cursor-pointer shadow-sm ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-indigo-500/30 shadow-lg scale-105'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredFeatures.map((feature, idx) => {
            const isHovered = hoveredCard === feature.id;
            return (
              <div
                key={feature.id}
                onMouseEnter={() => setHoveredCard(feature.id)}
                onMouseLeave={() => setHoveredCard(null)}
                onClick={() => handleCardClick(feature.title)}
                className={`group relative bg-white dark:bg-slate-800/80 rounded-2xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-700/60 shadow-xl shadow-slate-900/5 hover:shadow-2xl hover:border-indigo-500/50 dark:hover:border-indigo-500/50 transition-all duration-500 flex flex-col justify-between overflow-hidden cursor-pointer transform hover:-translate-y-1.5`}
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                {/* Top Glowing Border on Hover */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                <div>
                  {/* Image / Banner Thumbnail */}
                  <div className="relative h-44 -mx-6 -mt-6 sm:-mx-8 sm:-mt-8 mb-6 overflow-hidden bg-slate-100 dark:bg-slate-900">
                    <img 
                      src={feature.image} 
                      alt={feature.title}
                      className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 opacity-90 group-hover:opacity-100"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-slate-900/10 to-transparent"></div>
                    
                    {/* Badge inside image banner */}
                    <div className="absolute top-4 right-4 bg-slate-900/80 backdrop-blur-md text-white text-xs font-semibold px-3 py-1 rounded-full border border-white/10 shadow-lg">
                      {feature.badge}
                    </div>

                    {/* Icon floating */}
                    <div className="absolute bottom-4 left-4 p-2.5 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-lg border border-white/20 dark:border-slate-700">
                      {feature.icon}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                {/* Card Action footer */}
                <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 group-hover:underline flex items-center gap-1.5">
                    Explore specs
                    <svg className={`w-4 h-4 transform transition-transform duration-300 ${isHovered ? 'translate-x-1' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </span>
                  
                  <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                    #0{idx + 1}
                  </span>
                </div>

              </div>
            );
          })}
        </div>

        {/* Bottom Callout banner inside features */}
        <div className="mt-16 bg-gradient-to-r from-indigo-900 via-slate-900 to-purple-950 rounded-2xl p-8 sm:p-10 text-white shadow-2xl relative overflow-hidden border border-indigo-500/20">
          <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
            <div>
              <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Need a custom feature set for your enterprise?</h3>
              <p className="mt-2 text-slate-300 text-sm sm:text-base max-w-2xl">
                We build custom integrations, dedicated VPC clusters, and bespoke SLA guarantees for high-volume corporate infrastructure.
              </p>
            </div>
            <a
              href="#contact"
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-white text-slate-900 font-semibold hover:bg-slate-100 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 whitespace-nowrap cursor-pointer"
            >
              Contact Engineering Sales
            </a>
          </div>
        </div>

      </div>
    </section>
  );
}