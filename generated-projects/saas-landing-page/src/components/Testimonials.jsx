import React, { useState } from 'react';

export default function Testimonials() {
  const [activeTab, setActiveTab] = useState('all');

  const testimonials = [
    {
      id: 1,
      name: 'Sarah Jenkins',
      role: 'VP of Product at FinTech Global',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      category: 'enterprise',
      content: 'NexusScale completely transformed how our engineering and product teams collaborate. We cut our deployment cycle time by over 60% within the first month of adoption.',
      rating: 5,
      metrics: '60% faster deployment'
    },
    {
      id: 2,
      name: 'Michael Chen',
      role: 'Co-Founder & CTO at CloudPulse',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      category: 'startup',
      content: 'As a fast-growing startup, we needed a robust platform that scales without breaking the bank. NexusScale gave us enterprise-grade observability and uptime right out of the box.',
      rating: 5,
      metrics: '99.99% uptime achieved'
    },
    {
      id: 3,
      name: 'Elena Rostova',
      role: 'Head of Growth at Apex Media',
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      category: 'growth',
      content: 'The analytics engine provides clarity we never had before. We can pinpoint conversion bottlenecks instantly and test new hypotheses in real time.',
      rating: 5,
      metrics: '+45% conversion rate'
    },
    {
      id: 4,
      name: 'David Miller',
      role: 'Director of Security at SecureNet',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      category: 'enterprise',
      content: 'Compliance and data governance were our biggest concerns before migrating. NexusScale exceeded all our security audits effortlessly.',
      rating: 5,
      metrics: '100% audit compliance'
    },
    {
      id: 5,
      name: 'Aisha Patel',
      role: 'Lead UX Designer at Nova Studios',
      image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      category: 'startup',
      content: 'The UI is an absolute dream to work with. Clean typography, buttery smooth micro-interactions, and a dark mode that actually looks gorgeous.',
      rating: 5,
      metrics: '3x team productivity'
    },
    {
      id: 6,
      name: 'Marcus Thorne',
      role: 'Operations Lead at Apex Logistics',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
      category: 'growth',
      content: 'Customer support is world-class. Whenever we had custom integration questions, their engineering team was there within minutes to assist.',
      rating: 5,
      metrics: '< 2min support response'
    }
  ];

  const filteredTestimonials = activeTab === 'all' 
    ? testimonials 
    : testimonials.filter(t => t.category === activeTab);

  return (
    <section id="testimonials" className="py-24 bg-slate-100/50 dark:bg-slate-900/50 relative overflow-hidden transition-colors duration-300">
      {/* Decorative background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <span>Customer Success</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Loved by fast-moving teams <span className="gradient-text">worldwide</span>
          </h2>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
            See how engineering leaders, product managers, and founders scale their operations effortlessly with NexusScale.
          </p>

          {/* Category Filter Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-8">
            {[
              { id: 'all', label: 'All Stories' },
              { id: 'startup', label: 'Startups' },
              { id: 'growth', label: 'Growth' },
              { id: 'enterprise', label: 'Enterprise' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25 scale-105'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredTestimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="bg-white dark:bg-slate-800/80 rounded-2xl p-8 border border-slate-200/80 dark:border-slate-700/60 shadow-xl shadow-slate-200/50 dark:shadow-none hover:shadow-2xl hover:border-indigo-500/30 transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                {/* Metric Badge & Stars */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-1">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <svg
                        key={i}
                        className="w-4 h-4 text-amber-400 fill-amber-400"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50">
                    {testimonial.metrics}
                  </span>
                </div>

                {/* Content */}
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-base mb-8">
                  "{testimonial.content}"
                </p>
              </div>

              {/* Author Info */}
              <div className="flex items-center space-x-4 pt-4 border-t border-slate-100 dark:border-slate-700/60">
                <img
                  src={testimonial.image}
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-indigo-500/20 group-hover:ring-indigo-500 transition-all duration-300"
                />
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                    {testimonial.name}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {testimonial.role}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Trust Stat Bar */}
        <div className="mt-20 pt-12 border-t border-slate-200/80 dark:border-slate-800 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">99.99%</div>
            <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">Uptime SLA Guaranteed</div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">4.9/5</div>
            <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">Overall Rating on G2</div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">10k+</div>
            <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">Active Teams Scaling</div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">24/7</div>
            <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">Dedicated Support</div>
          </div>
        </div>
      </div>
    </section>
  );
}