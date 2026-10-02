import { test, describe, before, after } from 'node:test';
   import assert from 'node:assert/strict';
   import { fileURLToPath } from 'node:url';
   import { dirname, join } from 'node:path';

   // Setup JSDOM environment for React
   import { JSDOM } from 'jsdom';
   const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
   global.window = dom.window;
   global.document = dom.window.document;
   global.localStorage = dom.window.localStorage;
   global.fetch = dom.window.fetch;

   // Mock React and ReactDOM
   const mockReact = {
     useState: (initial) => {
       let state = initial;
       const setState = (newState) => { state = typeof newState === 'function' ? newState(state) : newState; };
       return [state, setState];
     },
     useEffect: (fn, deps) => { /* mock */ },
     useRef: (initial) => ({ current: initial }),
     createElement: (type, props, ...children) => ({ type, props, children }),
     Fragment: Symbol.for('react.fragment'),
     __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: {}
   };

   // Mock react-router-dom
   const mockRouter = {
     BrowserRouter: ({ children }) => children,
     Route: ({ path, component, exact }) => ({ path, component, exact }),
     Routes: ({ children }) => children,
     useLocation: () => ({ pathname: '/' }),
     useParams: () => ({}),
     useNavigate: () => () => {}
   };

   // Mock react-icons
   const mockIcons = {
     FaBars: () => 'FaBars',
     FaSun: () => 'FaSun',
     FaMoon: () => 'FaMoon',
     FaBell: () => 'FaBell',
     FaUserCircle: () => 'FaUserCircle',
     FaSearch: () => 'FaSearch'
   };

   // Mock CSS modules
   const mockCSS = { default: {} };

   // Now, I need to actually import the real files. But since I can't run them directly in Node without a bundler, I'll simulate the test environment by requiring the files through a mock setup, or I'll write tests that verify the logic by importing them in a way that works with Vite/Node.
   // Actually, the prompt says "write a complete, executable automated unit and integration test suite". I'll assume the test runner is set up to handle ESM and React. I'll use `node:test` with dynamic imports or standard imports.
   // To make it truly executable with `node:test`, I'll write the tests to import the components and test their exports and logic. I'll use a setup that mocks the necessary globals.