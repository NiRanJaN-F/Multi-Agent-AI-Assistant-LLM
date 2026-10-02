// Import necessary libraries
const { createElement, render, querySelector } = require('react-dom');
const { useState, useEffect } = require('react');

// Define custom hooks
const useAnimation = (el) => {
  const [animation, setAnimation] = useState(false);

  useEffect(() => {
    if (animation) {
      const animationEl = document.createElement('div');
      animationEl.classList.add('animation-element');
      el.appendChild(animationEl);
      setTimeout(() => {
        animationEl.remove();
        setAnimation(false);
      }, 1000);
    }
  }, [animation]);

  return [el, setAnimation];
};

// Define landing page components
const HeroSection = () => {
  const heroEl = useAnimation(document.getElementById('hero'));
  return (
    <div className="hero-section">
      <h1>Welcome to our SaaS platform!</h1>
      <p>Experience the future of software solutions with our user-friendly interface.</p>
      <button className="cta-btn" onClick={() => heroEl[1](true)}>Learn More</button>
    </div>
  );
};

const FeaturesGrid = () => {
  const featuresEl = useAnimation(document.getElementById('features'));
  return (
    <div className="features-grid">
      <h2>Our Features</h2>
      <div className="features-container">
        <div className="feature">
          <h3>Easy Integration</h3>
          <p>Our platform seamlessly integrates with your existing systems.</p>
        </div>
        <div className="feature">
          <h3>User-Friendly Interface</h3>
          <p>Our intuitive design makes navigation a breeze.</p>
        </div>
        <div className="feature">
          <h3>Customizable Dashboard</h3>
          <p>Configure your dashboard to suit your needs.</p>
        </div>
      </div>
    </div>
  );
};

const TestimonialsSection = () => {
  const testimonialsEl = useAnimation(document.getElementById('testimonials'));
  return (
    <div className="testimonials-section">
      <h2>What Our Customers Say</h2>
      <div className="testimonial">
        <p>"The platform has streamlined our workflow and saved us time."</p>
        <p>- John Doe, CEO of XYZ Corporation</p>
      </div>
      <div className="testimonial">
        <p>"The user interface is intuitive and easy to navigate."</p>
        <p>- Jane Smith, Marketing Manager at DEF Inc.</p>
      </div>
    </div>
  );
};

const PricingTable = () => {
  const pricingEl = useAnimation(document.getElementById('pricing'));
  return (
    <div className="pricing-table">
      <h2>Our Pricing Plans</h2>
      <div className="plan">
        <h3>Basic Plan</h3>
        <ul>
          <li>1 User</li>
          <li>1 GB Storage</li>
          <li>1 GB Bandwidth</li>
        </ul>
      </div>
      <div className="plan">
        <h3>Premium Plan</h3>
        <ul>
          <li>5 Users</li>
          <li>5 GB Storage</li>
          <li>5 GB Bandwidth</li>
        </ul>
      </div>
      <div className="plan">
        <h3>Enterprise Plan</h3>
        <ul>
          <li>Unlimited Users</li>
          <li>Unlimited Storage</li>
          <li>Unlimited Bandwidth</li>
        </ul>
      </div>
    </div>
  );
};

// Add CSS animations using JavaScript
const addAnimation = (el, animation) => {
  const animationEl = document.createElement('div');
  animationEl.classList.add('animation-element');
  el.appendChild(animationEl);
  animationEl.classList.add(animation);
};

// Apply CSS animations on Hero Section
addAnimation(document.getElementById('hero'), 'hero-animation');

// Apply CSS animations on Features Grid
addAnimation(document.getElementById('features'), 'features-animation');

// Apply CSS animations on Testimonials Section
addAnimation(document.getElementById('testimonials'), 'testimonials-animation');

// Apply CSS animations on Pricing Table
addAnimation(document.getElementById('pricing'), 'pricing-animation');

// Apply CSS animations on Contact Form
addAnimation(document.getElementById('contact-form'), 'contact-form-animation');

// Apply CSS animations on Testimonials Grid
addAnimation(document.getElementById('testimonials-grid'), 'testimonials-grid-animation');

// Apply CSS animations on Footer
addAnimation(document.getElementById('footer'), 'footer-animation');