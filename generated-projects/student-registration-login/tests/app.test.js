'use strict';
   const { test, describe } = require('node:test');
   const assert = require('node:assert/strict');

   // Mock browser environment
   const mockLocalStorage = {
     store: {},
     getItem(key) { return this.store[key] || null; },
     setItem(key, value) { this.store[key] = String(value); },
     removeItem(key) { delete this.store[key]; },
     clear() { this.store = {}; }
   };

   const mockDocument = {
     elements: {},
     getElementById(id) { return this.elements[id] || null; },
     createElement(tag) { return { tag, attributes: {}, children: [], addEventListener: () => {}, setAttribute: () => {}, textContent: '' }; }
   };

   // Setup mock DOM elements matching app.js expectations
   function setupMockDOM() {
     mockDocument.elements = {
       studentForm: { addEventListener: () => {}, submit: () => {} },
       regMessage: { textContent: '', className: '' },
       loginForm: { addEventListener: () => {}, submit: () => {} },
       loginMessage: { textContent: '', className: '' }
     };
     global.document = mockDocument;
     global.localStorage = mockLocalStorage;
     global.window = { localStorage: mockLocalStorage };
   }

   // Since app.js is an IIFE, we'll simulate its logic for testing
   // I'll extract the core logic into testable functions based on the provided structure
   // Actually, to make it truly executable and test the exact logic, I'll write a test suite that
   // directly tests the validation, storage, and form handling logic by recreating it in a testable module
   // OR I'll use a different approach: test the app by loading it in a jsdom environment, but the prompt says Node test-runner.
   // I'll stick to pure Node with mocks and simulate the IIFE execution.

   // Let's write a comprehensive test suite that covers:
   // 1. Storage helpers (getStudents, saveStudents)
   // 2. Validation logic
   // 3. Registration flow
   // 4. Login flow
   // 5. Error handling
   // 6. DOM updates