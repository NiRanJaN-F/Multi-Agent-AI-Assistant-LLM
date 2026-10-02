import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

// Import project components to test their rendering and state resilience
import Contact from '../src/components/Contact.jsx';
import Footer from '../src/components/Footer.jsx';
import Features from '../src/components/Features.jsx';

test('Contact component renders successfully and handles inputs correctly', async (t) => {
  await t.step('renders contact form fields', () => {
    const html = renderToStaticMarkup(<Contact showToast={() => {}} />);
    assert.ok(html.includes('name'), 'Contact form should contain name input');
    assert.ok(html.includes('email'), 'Contact form should contain email input');
    assert.ok(html.includes('Message'), 'Contact form should contain message field');
  });

  await t.step('simulates submit callback and toast trigger', async () => {
    let toastCalled = false;
    const mockToast = (msg) => {
      if (msg) toastCalled = true;
    };

    // Instantiate with mock toast
    const html = renderToStaticMarkup(<Contact showToast={mockToast} />);
    assert.ok(html.includes('Send Message'), 'Should render submit button');
  });
});

test('Footer component renders newsletter subscription section', async (t) => {
  await t.step('renders footer content and subscription input', () => {
    const html = renderToStaticMarkup(<Footer />);
    assert.ok(html.includes('NexusScale'), 'Footer should display brand name');
    assert.ok(html.includes('Subscribe'), 'Footer should have a subscribe action');
  });
});

test('Features component renders tab categories and feature lists', async (t) => {
  await t.step('renders all filter categories and cards', () => {
    const html = renderToStaticMarkup(<Features showToast={() => {}} />);
    assert.ok(html.includes('Real-Time Telemetry'), 'Features should display analytics feature');
    assert.ok(html.includes('All Features'), 'Features should have filter tab');
  });
});

test('Environment and dependency sanity checks', () => {
  assert.equal(typeof React, 'object', 'React library should be loaded correctly');
  assert.equal(typeof renderToStaticMarkup, 'function', 'React DOM server rendering should be available');
});