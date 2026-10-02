/* =========================================================================
   app.js — SaaS landing page interactions
   Vanilla JS. All DOM lookups are null-guarded. State persists to
   localStorage. No external dependencies.
   ========================================================================= */
(function () {
  'use strict';

  /* ------------------------------------------------------------------ *
   *  Utilities
   * ------------------------------------------------------------------ */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
  const easeOutExpo = (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

  const prefersReduced =
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const prefersDark =
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches;

  /* ------------------------------------------------------------------ *
   *  Theme (persisted)
   * ------------------------------------------------------------------ */
  const THEME_KEY = 'saas.theme';
  const root = document.documentElement;

  function applyTheme(theme) {
    if (!root) return;
    root.dataset.theme = theme;
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (e) { /* storage unavailable */ }
  }

  function initTheme() {
    let saved = null;
    try {
      saved = localStorage.getItem(THEME_KEY);
    } catch (e) { /* ignore */ }
    applyTheme(saved || (prefersDark ? 'dark' : 'light'));
  }

  function toggleTheme() {
    const current = root && root.dataset.theme === 'dark' ? 'dark' : 'light';
    applyTheme(current === 'dark' ? 'light' : 'dark');
  }

  /* ------------------------------------------------------------------ *
   *  Scroll progress bar
   * ------------------------------------------------------------------ */
  function initScrollProgress() {
    const bar = $('#scroll-progress');
    if (!bar) return;
    let ticking = false;
    const update = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
      bar.style.transform = 'scaleX(' + (pct / 100) + ')';
      ticking = false;
    };
    window.addEventListener(
      'scroll',
      () => {
        if (!ticking) {
          window.requestAnimationFrame(update);
          ticking = true;
        }
      },
      { passive: true }
    );
    update();
  }

  /* ------------------------------------------------------------------ *
   *  Sticky header state
   * ------------------------------------------------------------------ */
  function initHeader() {
    const header = $('#site-header');
    if (!header) return;
    const onScroll = () => {
      header.classList.toggle('is-scrolled', window.scrollY > 24);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ------------------------------------------------------------------ *
   *  Mobile navigation
   * ------------------------------------------------------------------ */
  function initNav() {
    const toggle = $('#nav-toggle');
    const menu = $('#primary-nav');
    if (!toggle || !menu) return;

    const setOpen = (open) => {
      toggle.setAttribute('aria-expanded', String(open));
      menu.classList.toggle('is-open', open);
      document.body.classList.toggle('nav-open', open);
    };

    toggle.addEventListener('click', () => {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });

    // Close when a link is chosen
    $$('#primary-nav a').forEach((a) =>
      a.addEventListener('click', () => setOpen(false))
    );

    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
        toggle.focus();
      }
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (
        toggle.getAttribute('aria-expanded') === 'true' &&
        !menu.contains(e.target) &&
        !toggle.contains(e.target)
      ) {
        setOpen(false);
      }
    });
  }

  /* ------------------------------------------------------------------ *
   *  Smooth scroll for anchor links
   * ------------------------------------------------------------------ */
  function initSmoothScroll() {
    const links = $$('a[href^="#"]');
    links.forEach((link) => {
      link.addEventListener('click', (e) => {
        const targetId = link.getAttribute('href');
        if (targetId === '#') return;
        const target = $(targetId);
        if (!target) return;
        e.preventDefault();
        const headerHeight = $('#site-header') ? $('#site-header').offsetHeight : 0;
        const targetPosition = target.getBoundingClientRect().top + window.scrollY - headerHeight;
        window.scrollTo({
          top: targetPosition,
          behavior: prefersReduced ? 'auto' : 'smooth'
        });
      });
    });
  }

  /* ------------------------------------------------------------------ *
   *  Reveal on scroll (Intersection Observer)
   * ------------------------------------------------------------------ */
  function initReveal() {
    const elements = $$('.reveal');
    if (!elements.length) return;

    if (prefersReduced || !('IntersectionObserver' in window)) {
      elements.forEach((el) => el.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    elements.forEach((el) => observer.observe(el));
  }

  /* ------------------------------------------------------------------ *
   *  Counter animation
   * ------------------------------------------------------------------ */
  function animateCounter(el, target, duration = 2000) {
    if (prefersReduced) {
      el.textContent = target.toLocaleString();
      return;
    }

    const start = performance.now();
    const step = (now) => {
      const progress = clamp((now - start) / duration, 0, 1);
      const eased = easeOutCubic(progress);
      const current = Math.floor(lerp(0, target, eased));
      el.textContent = current.toLocaleString();
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = target.toLocaleString();
      }
    };
    requestAnimationFrame(step);
  }

  function initCounters() {
    const counters = $$('.counter');
    if (!counters.length) return;

    if (prefersReduced || !('IntersectionObserver' in window)) {
      counters.forEach((el) => {
        const target = parseInt(el.dataset.target || el.textContent, 10);
        if (!isNaN(target)) {
          el.textContent = target.toLocaleString();
        }
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target;
            const target = parseInt(el.dataset.target || el.textContent, 10);
            if (!isNaN(target)) {
              animateCounter(el, target);
            }
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.5 }
    );

    counters.forEach((el) => observer.observe(el));
  }

  /* ------------------------------------------------------------------ *
   *  Testimonial carousel
   * ------------------------------------------------------------------ */
  function initCarousel() {
    const carousel = $('#testimonial-carousel');
    if (!carousel) return;

    const track = $('.carousel-track', carousel);
    const prevBtn = $('.carousel-prev', carousel);
    const nextBtn = $('.carousel-next', carousel);
    const dots = $$('.carousel-dot', carousel);
    if (!track) return;

    const slides = $$('.carousel-slide', track);
    if (slides.length <= 1) return;

    let currentIndex = 0;
    let autoPlayInterval = null;
    const AUTO_PLAY_DELAY = 5000;

    const goToSlide = (index) => {
      currentIndex = (index + slides.length) % slides.length;
      track.style.transform = `translateX(-${currentIndex * 100}%)`;