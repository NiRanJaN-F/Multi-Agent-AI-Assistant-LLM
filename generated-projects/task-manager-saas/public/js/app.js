/* public/js/app.js - Vanilla JS SPA for SaaS Task Management
   Dependencies: Tailwind CSS (via CDN), Lucide icons (via CDN)
*/

(() => {
  // ---------- Global State ----------
  const state = {
    token: localStorage.getItem('token') || null,
    workspaces: [],
    currentWorkspace: null,
    boards: [],
    currentBoard: null,
    cards: [],
    pollingInterval: null,
  };

  // ---------- API Helper ----------
  const api = async (method, path, body = null) => {
    const headers = {
      'Content-Type': 'application/json',
    };
    if (state.token) headers['Authorization'] = `Bearer ${state.token}`;

    const opts = {
      method,
      headers,
    };
    if (body) opts.body = JSON.stringify(body);

    const res = await fetch(path, opts);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `API error ${res.status}`);
    }
    return res.json();
  };

  // ---------- Auth ----------
  const auth = {
    async login(email, password) {
      const data = await api('POST', '/api/auth/login', { email, password });
      state.token = data.token;
      localStorage.setItem('token', data.token);
      await initApp();
    },
    async register(name, email, password) {
      const data = await api('POST', '/api/auth/register', { name, email, password });
      state.token = data.token;
      localStorage.setItem('token', data.token);
      await initApp();
    },
    logout() {
      state.token = null;
      localStorage.removeItem('token');
      clearInterval(state.pollingInterval);
      renderLoginForm();
    },
  };

  // ---------- UI Helpers ----------
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  const setHTML = (el, html) => {
    if (el) {
      el.innerHTML = html;
      lucide.createIcons();
    }
  };

  const showToast = (msg, type = 'info') => {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 max-w-xs p-3 rounded shadow-lg bg-${type === 'error' ? 'red' : 'green'}-600 text-white`;
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  // ---------- Rendering ----------
  const renderHeader = () => {
    const header = $('#header');
    if (!header) return;
    const html = `
      <div class="flex items-center justify-between p-4 bg-gray-800 text-white">
        <h1 class="text-xl font-semibold cursor-pointer" id="app-title">Taskify</h1>
        <div class="flex items-center space-x-4">
          ${state.token ? `
            <button id="btn-logout" class="flex items-center space-x-1 hover:text-gray-300">
              <i data-lucide="log-out"></i><span>Logout</span>
            </button>
          ` : ''}
        </div>
      </div>
    `;
    setHTML(header, html);
    $('#app-title')?.addEventListener('click', () => renderWorkspaceList());
    $('#btn-logout')?.addEventListener('click', () => auth.logout());
  };

  const renderLoginForm = () => {
    const main = $('#main');
    if (!main) return;
    const html = `
      <div class="max-w-md mx-auto mt-20 p-6 bg-white rounded shadow">
        <h2 class="text-2xl font-bold mb-4 text-center">Login</h2>
        <form id="login-form" class="space-y-4">
          <input type="email" id="login-email" placeholder="Email" required class="w-full p-2 border rounded"/>
          <input type="password" id="login-password" placeholder="Password" required class="w-full p-2 border rounded"/>
          <button type="submit" class="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Login</button>
        </form>
        <p class="mt-4 text-center text-sm">Don't have an account? <a href="#" id="show-register" class="text-blue-600 hover:underline">Register</a></p>
      </div>
    `;
    setHTML(main, html);
    $('#login-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = $('#login-email').value.trim();
      const password = $('#login-password').value;
      try {
        await auth.login(email, password);
        showToast('Logged in successfully');
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
    $('#show-register')?.addEventListener('click', (e) => {
      e.preventDefault();
      renderRegisterForm();
    });
  };

  const renderRegisterForm = () => {
    const main = $('#main');
    if (!main) return;
    const html = `
      <div class="max-w-md mx-auto mt-20 p-6 bg-white rounded shadow">
        <h2 class="text-2xl font-bold mb-4 text-center">Register</h2>
        <form id="register-form" class="space-y-4">
          <input type="text" id="reg-name" placeholder="Full Name" required class="w-full p-2 border rounded"/>
          <input type="email" id="reg-email" placeholder="Email" required class="w-full p-2 border rounded"/>
          <input type="password" id="reg-password" placeholder="Password" required class="w-full p-2 border rounded"/>
          <button type="submit" class="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700">Register</button>
        </form>
        <p class="mt-4 text-center text-sm">Already have an account? <a href="#" id="show-login" class="text-blue-600 hover:underline">Login</a></p>
      </div>
    `;
    setHTML(main, html);
    $('#register-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = $('#reg-name').value.trim();
      const email = $('#reg-email').value.trim();
      const password = $('#reg-password').value;
      try {
        await auth.register(name, email, password);
        showToast('Registered and logged in');
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
    $('#show-login')?.addEventListener('click', (e) => {
      e.preventDefault();
      renderLoginForm();
    });
  };

  const renderWorkspaceList = async () => {
    try {
      state.workspaces = await api('GET', '/api/workspaces');
    } catch (err) {
      showToast(err.message, 'error');
      return;
    }
    const main = $('#main');
    if (!main) return;
    const wsItems = state.workspaces
      .map(
        (ws) => `
        <li class="p-2 hover:bg-gray-100 rounded cursor-pointer flex justify-between items-center" data-id="${ws.id}">
          <span>${ws.name}</span>
          <i data-lucide="chevron-right"></i>
        </li>`
      )
      .join('');
    const html = `
      <div class="p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-2xl font-semibold">Your Workspaces</h2>
          <button id="btn-new-ws" class="flex items-center space-x-1 bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">
            <i data-lucide="plus"></i><span>New Workspace</span>
          </button>
        </div>
        <ul id="workspace-list" class="space-y-2">
          ${wsItems || '<li class="text-gray-500">No workspaces yet.</li>'}
        </ul>
      </div>
    `;
    setHTML(main, html);
    $('#btn-new-ws')?.addEventListener('click', () => renderWorkspaceForm());
    $$('#workspace-list li').forEach((li) => {
      li.addEventListener('click', () => {
        const id = li.dataset.id;
        selectWorkspace(id);
      });
    });
  };

  const renderWorkspaceForm = (ws = null) => {
    const main = $('#main');
    if (!main) return;
    const isEdit = !!ws;
    const html = `
      <div class="max-w-md mx-auto mt-8 p-6 bg-white rounded shadow">
        <h2 class="text-xl font-bold mb-4">${isEdit ? 'Edit' : 'New'} Workspace</h2>
        <form id="ws-form" class="space-y-4">
          <input type="text" id="ws-name" placeholder="Workspace Name" required class="w-full p-2 border rounded" value="${ws?.name || ''}"/>
          <div class="flex space-x-2">
            <button type="submit" class="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700">${isEdit ? 'Update' : 'Create'}</button>
            <button type="button" id="ws-cancel" class="flex-1 bg-gray-300 py-2 rounded hover:bg-gray-400">Cancel</button>
          </div>
        </form>
      </div>
    `;
    setHTML(main, html);
    $('#ws-cancel')?.addEventListener('click', () => renderWorkspaceList());
    $('#ws-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = $('#ws-name').value.trim();
      try {
        if (isEdit) {
          await api('PUT', `/api/workspaces/${ws.id}`, { name });
          showToast('Workspace updated');
        } else {
          await api('POST', `/api/workspaces`, { name });
          showToast('Workspace created');
        }
        renderWorkspaceList();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  };

  const selectWorkspace = async (wsId) => {
    try {
      state.currentWorkspace = await api('GET', `/api/workspaces/${wsId}`);
      await loadBoards(wsId);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const loadBoards = async (workspaceId) => {
    try {
      const data = await api('GET', `/api/workspaces/${workspaceId}/boards`);
      state.boards = data.boards;
      renderBoardList();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const renderBoardList = () => {
    const main = $('#main');
    if (!main) return;
    const boardItems = state.boards
      .map(
        (b) => `
        <li class="p-2 hover:bg-gray-100 rounded cursor-pointer flex justify-between items-center" data-id="${b.id}">
          <span>${b.title}</span>
          <i data-lucide="chevron-right"></i>
        </li>`
      )
      .join('');
    const html = `
      <div class="p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-2xl font-semibold">Boards in "${state.currentWorkspace.name}"</h2>
          <button id="btn-new-board" class="flex items-center space-x-1 bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700