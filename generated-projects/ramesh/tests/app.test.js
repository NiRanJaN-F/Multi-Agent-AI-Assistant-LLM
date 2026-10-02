// test/app.test.js
import { test, expect } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { JSDOM } from 'jsdom';

const scriptPath = path.resolve('public', 'app.js');
const scriptCode = fs.readFileSync(scriptPath, 'utf8');

function createDom() {
  const dom = new JSDOM(`<!DOCTYPE html>
    <html><body>
      <div id="app"></div>
      <span id="cart-count">0</span>
    </body></html>`, { runScripts: 'outside-only', url: 'http://localhost' });
  return dom;
}

function runScript(dom) {
  const context = vm.createContext({
    window: dom.window,
    document: dom.window.document,
    localStorage: dom.window.localStorage,
    console: console,
    // expose global objects that the script might use
    fetch: dom.window.fetch,
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    requestAnimationFrame: dom.window.requestAnimationFrame,
    cancelAnimationFrame: dom.window.cancelAnimationFrame,
  });
  vm.runInContext(scriptCode, context);
}