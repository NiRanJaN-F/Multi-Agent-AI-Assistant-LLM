import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';

// Import components to test
import App from '../src/App.jsx';
import Header from '../src/components/Header.jsx';
import BookingModal from '../src/components/BookingModal.jsx';
import Footer from '../src/components/Footer.jsx';

// Setup basic DOM environment for React testing without heavy heavy mocking libraries
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: 'http://localhost',
});

global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;

// Polyfill requestAnimationFrame
global.requestAnimationFrame = (callback) => {
  return setTimeout(callback, 0);
};
global.cancelAnimationFrame = (id) => {
  clearTimeout(id);
};

test('App renders without crashing', async () => {
  const container = document.createElement('div');
  document.body.appendChild(container);

  await act(async () => {
    const root = createRoot(container);
    root.render(<App />);
  });

  assert.ok(container.innerHTML.length > 0, 'App component rendered content into DOM');
  document.body.removeChild(container);
});

test('Header component renders navigation elements', async () => {
  const container = document.createElement('div');
  document.body.appendChild(container);

  let bookingClicked = false;
  const handleOpenBooking = () => {
    bookingClicked = true;
  };

  await act(async () => {
    const root = createRoot(container);
    root.render(<Header onOpenBooking={handleOpenBooking} />);
  });

  const brandTitle = container.textContent;
  assert.match(brandTitle, /NEO-CAFE/i, 'Header contains the brand name NEO-CAFE');

  document.body.removeChild(container);
});

test('BookingModal does not render when isOpen is false', async () => {
  const container = document.createElement('div');
  document.body.appendChild(container);

  await act(async () => {
    const root = createRoot(container);
    root.render(<BookingModal isOpen={false} onClose={() => {}} />);
  });

  assert.equal(container.textContent, '', 'BookingModal renders nothing when isOpen is false');
  document.body.removeChild(container);
});

test('BookingModal renders steps and inputs when isOpen is true', async () => {
  const container = document.createElement('div');
  document.body.appendChild(container);

  await act(async () => {
    const root = createRoot(container);
    root.render(<BookingModal isOpen={true} onClose={() => {}} />);
  });

  const textContent = container.textContent;
  assert.match(textContent, /Neural Terminal Booking/i, 'Modal title is present');
  assert.match(textContent, /Select Date/i, 'Date step label is present');

  document.body.removeChild(container);
});

test('Footer newsletter handles subscription interaction', async () => {
  const container = document.createElement('div');
  document.body.appendChild(container);

  await act(async () => {
    const root = createRoot(container);
    root.render(<Footer />);
  });

  const emailInput = container.querySelector('input[type="email"]');
  const subscribeButton = container.querySelector('button[type="submit"]');

  assert.ok(emailInput, 'Email input exists in footer');
  assert.ok(subscribeButton, 'Subscribe button exists in footer');

  await act(async () => {
    emailInput.value = 'cyberpunk@neo-cafe.test';
    emailInput.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    subscribeButton.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  });

  const successMessage = container.textContent;
  assert.match(successMessage, /Transmitting/i, 'Subscription triggers feedback message');

  document.body.removeChild(container);
});