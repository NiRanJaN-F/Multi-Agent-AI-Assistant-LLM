/* app.js – SaaS Landing Page Interactivity */

/* ---------- Utility Functions ---------- */
const qs = (sel, ctx = document) => ctx.querySelector(sel);
const qsa = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

/* ---------- Smooth Scrolling for Anchor Links ---------- */
function initSmoothScroll() {
  qsa('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const targetId = link.getAttribute('href').slice(1);
      const targetEl = qs(`#${targetId}`);
      if (targetEl) {
        e.preventDefault();
        targetEl.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
}

/* ---------- Mobile Navigation Toggle ---------- */
function initMobileMenu() {
  const toggleBtn = qs('.nav-toggle');
  const navMenu = qs('.nav-menu');
  if (toggleBtn && navMenu) {
    toggleBtn.addEventListener('click', () => {
      navMenu.classList.toggle('open');
      toggleBtn.classList.toggle('open');
    });
  }
}

/* ---------- Feature Grid Scroll Animations ---------- */
function initFeatureAnimations() {
  const featureItems = qsa('.feature-item');
  if (!featureItems.length) return;

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  featureItems.forEach(item => observer.observe(item));
}

/* ---------- Testimonial Carousel ---------- */
function initTestimonialCarousel() {
  const carousel = qs('#testimonials');
  if (!carousel) return;

  const items = qsa('.testimonial-item', carousel);
  if (!items.length) return;

  let current = 0;
  const showItem = idx => {
    items.forEach((el, i) => el.classList.toggle('active', i === idx));
  };
  showItem(current);

  const nextBtn = qs('.testimonial-next', carousel);
  const prevBtn = qs('.testimonial-prev', carousel);

  const next = () => {
    current = (current + 1) % items.length;
    showItem(current);
  };
  const prev = () => {
    current = (current - 1 + items.length) % items.length;
    showItem(current);
  };

  if (nextBtn) nextBtn.addEventListener('click', next);
  if (prevBtn) prevBtn.addEventListener('click', prev);

  // Auto‑rotate every 7 seconds
  const autoRotate = setInterval(next, 7000);
  // Pause on hover
  carousel.addEventListener('mouseenter', () => clearInterval(autoRotate));
  carousel.addEventListener('mouseleave', () => {
    clearInterval(autoRotate);
    setInterval(next, 7000);
  });
}

/* ---------- Pricing Toggle (Monthly / Yearly) ---------- */
function initPricingToggle() {
  const toggle = qs('#pricing-toggle');
  const pricingRows = qsa('.pricing-row');
  if (!toggle || !pricingRows.length) return;

  const updatePricing = () => {
    const yearly = toggle.checked;
    pricingRows.forEach(row => {
      const monthlyPrice = qs('.price-monthly', row);
      const yearlyPrice = qs('.price-yearly', row);
      if (monthlyPrice && yearlyPrice) {
        monthlyPrice.style.display = yearly ? 'none' : 'block';
        yearlyPrice.style.display = yearly ? 'block' : 'none';
      }
    });
  };

  toggle.addEventListener('change', updatePricing);
  // Initialise state
  updatePricing();
}

/* ---------- Contact Form Handling ---------- */
function initContactForm() {
  const form = qs('#contact-form');
  if (!form) return;

  const nameInput = qs('#contact-name', form);
  const emailInput = qs('#contact-email', form);
  const messageInput = qs('#contact-message', form);
  const successBox = qs('#contact-success', form);
  const errorBox = qs('#contact-error', form);

  const validateEmail = email => {
    // Simple email regex
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const showMessage = (el, msg) => {
    if (el) {
      el.textContent = msg;
      el.style.display = 'block';
    }
  };

  const hideMessage = el => {
    if (el) el.style.display = 'none';
  };

  const storeSubmission = data => {
    const key = 'contactSubmissions';
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    existing.push({ ...data, timestamp: new Date().toISOString() });
    localStorage.setItem(key, JSON.stringify(existing));
  };

  form.addEventListener('submit', e => {
    e.preventDefault();
    hideMessage(errorBox);
    hideMessage(successBox);

    const name = nameInput ? nameInput.value.trim() : '';
    const email = emailInput ? emailInput.value.trim() : '';
    const message = messageInput ? messageInput.value.trim() : '';

    const errors = [];
    if (!name) errors.push('Name is required.');
    if (!email) errors.push('Email is required.');
    else if (!validateEmail(email)) errors.push('Enter a valid email address.');
    if (!message) errors.push('Message cannot be empty.');

    if (errors.length) {
      showMessage(errorBox, errors.join(' '));
      return;
    }

    // Persist data
    storeSubmission({ name, email, message });

    // Reset form
    if (nameInput) nameInput.value = '';
    if (emailInput) emailInput.value = '';
    if (messageInput) messageInput.value = '';

    showMessage(successBox, 'Thank you! Your message has been sent.');
  });
}

/* ---------- DOM Ready ---------- */
document.addEventListener('DOMContentLoaded', () => {
  initSmoothScroll();
  initMobileMenu();
  initFeatureAnimations();
  initTestimonialCarousel();
  initPricingToggle();
  initContactForm();
});