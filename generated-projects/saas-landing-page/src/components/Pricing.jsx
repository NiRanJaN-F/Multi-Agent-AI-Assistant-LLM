import React, { useState } from 'react';

export default function Pricing({ showToast }) {
  const [isAnnual, setIsAnnual] = useState(true);

  const plans = [
    {
      name: 'Starter',
      description: 'Perfect for small teams and early-stage startups testing the waters.',
      monthlyPrice: 29,
      annualPrice: 24,
      badge: null,
      features: [
        'Up to 5 team members',
        '10GB secure cloud storage',
        'Basic analytics & reporting',
        'Standard email support',
        'Community forum access',
      ],
      notIncluded: [
        'Advanced security & audit logs',
        'Custom domain mapping',
        '24/7 dedicated support',
      ],
      cta: 'Start Free Trial',
      popular: false,
    },
    {
      name: 'Professional',
      description: 'Ideal for growing businesses that need robust automation and scale.',
      monthlyPrice: 79,
      annualPrice: 64,
      badge: 'Most Popular',
      features: [
        'Up to 25 team members',
        '250GB high-speed storage',
        'Advanced predictive analytics',
        'Priority 24/7 support',
        'Custom workflow automations',
        'API & webhook access',
      ],
      notIncluded: [
        'Dedicated account manager',
      ],
      cta: 'Start 14-Day Trial',
      popular: true,
    },
    {
      name: 'Enterprise',
      description: 'Maximum security, custom integrations, and dedicated support for large orgs.',
      monthlyPrice: 199,
      annualPrice: 159,
      badge: 'Best Value',
      features: [
        'Unlimited team members',
        'Unlimited secure storage',
        'Enterprise-grade audit logs & SSO',
        'Dedicated success manager',
        'Custom SLA guarantees',
        'On-premise deployment option',
      ],
      notIncluded: [],
      cta: 'Contact Sales',
      popular: false,
    },
  ];

  const handleSubscribe = (planName) => {
    showToast(`Successfully selected ${planName} plan! Redirecting...`);
  };

  return (
    <section id="pricing" className="py-24 bg-slate-50 dark:bg-slate-950 relative overflow-hidden transition-colors duration-300">
      {/* Background glow effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 dark:bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-4 shadow-sm">
            <span>Flexible Pricing</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Simple, transparent plans for <span className="gradient-text">every stage</span>
          </h2>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
            No hidden fees, no complicated tiers. Choose the plan that fits your workflow and scale effortlessly.
          </p>

          {/* Billing Toggle Switch */}
          <div className="mt-10 inline-flex items-center p-1.5 rounded-full bg-slate-200/80 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 shadow-inner">
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-5 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
                !isAnnual
                  ? 'bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`px-5 py-2 text-sm font-medium rounded-full transition-all duration-200 flex items-center space-x-1.5 ${
                isAnnual
                  ? 'bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>Annual Billing</span>
              <span className="ml-1.5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 rounded-full">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-8 items-stretch">
          {plans.map((plan, index) => {
            const price = isAnnual ? plan.annualPrice : plan.monthlyPrice;
            return (
              <div
                key={index}
                className={`relative flex flex-col rounded-3xl transition-all duration-300 ${
                  plan.popular
                    ? 'bg-white dark:bg-slate-900 border-2 border-indigo-600 dark:border-indigo-500 shadow-2xl shadow-indigo-500/10 dark:shadow-indigo-500/5 md:-translate-y-2'
                    : 'bg-white/80 dark:bg-slate-900/85 backdrop-blur-xl border border-slate-200 dark:border-slate-800/80 shadow-lg hover:border-slate-300 dark:hover:border-slate-700'
                } p-8`}
              >
                {/* Badge */}
                {plan.badge && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold uppercase tracking-wider shadow-md">
                    {plan.badge}
                  </div>
                )}

                {/* Plan Header */}
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">{plan.name}</h3>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 min-h-[40px]">
                    {plan.description}
                  </p>
                </div>

                {/* Price Display */}
                <div className="mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-baseline">
                    <span className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white">
                      ${price}
                    </span>
                    <span className="ml-2 text-slate-500 dark:text-slate-400 font-medium text-sm">
                      / month {isAnnual && <span className="text-xs text-indigo-600 dark:text-indigo-400 block sm:inline">billed annually</span>}
                    </span>
                  </div>
                </div>

                {/* Features List */}
                <div className="flex-1 mb-8">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-4">
                    What's included
                  </p>
                  <ul className="space-y-3.5">
                    {plan.features.map((feature, fIdx) => (
                      <li key={fIdx} className="flex items-start space-x-3 text-sm text-slate-700 dark:text-slate-300">
                        <svg className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                        </svg>
                        <span>{feature}</span>
                      </li>
                    ))}
                    {plan.notIncluded.map((feature, nIdx) => (
                      <li key={nIdx} className="flex items-start space-x-3 text-sm text-slate-400 dark:text-slate-600 line-through">
                        <svg className="w-5 h-5 text-slate-300 dark:text-slate-700 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => handleSubscribe(plan.name)}
                  className={`w-full py-3.5 px-6 rounded-xl font-semibold transition-all duration-200 shadow-sm flex items-center justify-center space-x-2 ${
                    plan.popular
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5'
                      : 'bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white dark:text-slate-100 hover:-translate-y-0.5'
                  }`}
                >
                  <span>{plan.cta}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>

        {/* Enterprise Callout / FAQ teaser */}
        <div className="mt-16 text-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-md rounded-2xl p-8 border border-slate-200 dark:border-slate-800 max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="text-left">
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">Looking for custom enterprise solutions?</h4>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Need custom data residency, dedicated nodes, or tailored enterprise contracts? We've got you covered.
            </p>
          </div>
          <a
            href="#contact"
            className="shrink-0 px-6 py-3 rounded-xl border border-slate-300 dark:border-slate-700 font-semibold text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Talk to Enterprise Sales
          </a>
        </div>
      </div>
    </section>
  );
}