// tests/project.test.js
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import React from 'react';
import TestRenderer from 'react-test-renderer';

const resolve = (...segments) => path.resolve(...segments);

describe('Project Structure & Core Frontend Logic', () => {
  test('frontend/package.json exists and defines essential scripts', () => {
    const pkgPath = resolve('frontend', 'package.json');
    assert.ok(existsSync(pkgPath), 'frontend/package.json must exist');

    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));

    // required scripts
    assert.ok(pkg.scripts?.dev, 'package.json should contain a "dev" script');
    assert.ok(pkg.scripts?.build, 'package.json should contain a "build" script');
    assert.ok(pkg.scripts?.preview, 'package.json should contain a "preview" script');
  });

  test('App.jsx exports a React component that renders without error', async () => {
    const appPath = resolve('frontend', 'src', 'App.jsx');
    assert.ok(existsSync(appPath), 'frontend/src/App.jsx must exist');

    const { default: App } = await import(pathToFileURL(appPath).href);
    assert.equal(typeof App, 'function', 'App should be a function component');

    // Render the component using react-test-renderer to ensure it does not throw
    const renderer = TestRenderer.create(React.createElement(App));
    assert.ok(renderer.root, 'App component rendered successfully');
  });

  test('Cart.jsx defines core helper functions and exports a component', async () => {
    const cartPath = resolve('frontend', 'src', 'components', 'Cart.jsx');
    assert.ok(existsSync(cartPath), 'frontend/src/components/Cart.jsx must exist');

    const source = readFileSync(cartPath, 'utf8');

    // Verify presence of the two internal helpers
    assert.match(source, /const\s+addToast\s*=\s*\(/, 'addToast helper should be defined');
    assert.match(source, /const\s+fetchCart\s*=\s*async\s*\(/, 'fetchCart async helper should be defined');

    // Import the default export (the Cart component)
    const { default: Cart } = await import(pathToFileURL(cartPath).href);
    assert.equal(typeof Cart, 'function', 'Cart should be a function component');

    // Basic render check – it must not throw
    const renderer = TestRenderer.create(React.createElement(Cart));
    assert.ok(renderer.root, 'Cart component rendered without crashing');
  });

  test('Header.jsx contains an inline Toast component', async () => {
    const headerPath = resolve('frontend', 'src', 'components', 'Header.jsx');
    assert.ok(existsSync(headerPath), 'frontend/src/components/Header.jsx must exist');

    const source = readFileSync(headerPath, 'utf8');

    // The file should declare a function named Toast
    assert.match(source, /function\s+Toast\s*\(/, 'Header.jsx should define a Toast component');
  });
});