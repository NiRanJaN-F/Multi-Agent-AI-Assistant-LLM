/* public/app.js - Full SPA for NIE College website */
(() => {
  // ---------- Config ----------
  const API = {
    departments: "/api/departments",
    courses: "/api/courses",
    academics: "/api/academics",
    placements: "/api/placements",
  };

  // ---------- State ----------
  const state = {
    departments: [],
    courses: [], // merged fetched + mock
    academics: null,
    placements: null,
    cart: [], // array of course ids
    view: "home", // home | departments | courses | academics | placements
    search: "",
    filterCategory: "All",
  };

  // ---------- Mock Data ----------
  const mockCourses = [
    {
      id: 201,
      code: "CS201",
      name: "Machine Learning",
      department: "Computer Science",
      credits: 4,
      price: 1200,
      rating: 4.8,
      category: "AI",
      image:
        "https://images.unsplash.com/photo-1581091012184-7c2c5c6c5c5b?auto=format&fit=crop&w=800&q=60",
    },
    {
      id: 202,
      code: "EE202",
      name: "Digital Signal Processing",
      department: "Electrical Engineering",
      credits: 3,
      price: 950,
      rating: 4.5,
      category: "Signal",
      image:
        "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&q=60",
    },
    {
      id: 203,
      code: "ME203",
      name: "Thermodynamics",
      department: "Mechanical Engineering",
      credits: 3,
      price: 900,
      rating: 4.2,
      category: "Heat",
      image:
        "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=60",
    },
    {
      id: 204,
      code: "CE204",
      name: "Structural Analysis",
      department: "Civil Engineering",
      credits: 4,
      price: 1100,
      rating: 4.6,
      category: "Structures",
      image:
        "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=60",
    },
    {
      id: 205,
      code: "CS205",
      name: "Advanced Algorithms",
      department: "Computer Science",
      credits: 4,
      price: 1300,
      rating: 4.9,
      category: "Algorithms",
      image:
        "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=800&q=60",
    },
    {
      id: 206,
      code: "EE206",
      name: "Power Electronics",
      department: "Electrical Engineering",
      credits: 3,
      price: 1000,
      rating: 4.4,
      category: "Power",
      image:
        "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=60",
    },
    {
      id: 207,
      code: "ME207",
      name: "Fluid Mechanics",
      department: "Mechanical Engineering",
      credits: 3,
      price: 950,
      rating: 4.3,
      category: "Fluids",
      image:
        "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=60",
    },
    {
      id: 208,
      code: "CE208",
      name: "Geotechnical Engineering",
      department: "Civil Engineering",
      credits: 4,
      price: 1150,
      rating: 4.5,
      category: "Geotech",
      image:
        "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=800&q=60",
    },
  ];

  // ---------- Utility ----------
  const qs = (s) => document.querySelector(s);
  const qsa = (s) => document.querySelectorAll(s);
  const fetchJSON = (url) => fetch(url).then((res) => res.ok ? res.json() : Promise.reject(res));

  // ---------- Toast ----------
  const toastContainer = document.createElement("div");
  toastContainer.className = "fixed bottom-4 right-4 flex flex-col space-y-2 z-50";
  document.body.appendChild(toastContainer);

  function showToast(message, type = "info", duration = 3000) {
    const toast = document.createElement("div");
    toast.className = `px-4 py-2 rounded shadow-lg text-white flex items-center space-x-2
      ${type === "success" ? "bg-green-600" : type === "error" ? "bg-red-600" : "bg-gray-800"}`;
    toast.innerHTML = `<span data-lucide="${type === "success" ? "check-circle" : type === "error" ? "x-circle" : "info"}"></span>
      <span>${message}</span>`;
    toastContainer.appendChild(toast);
    lucide.createIcons();
    setTimeout(() => toast.remove(), duration);
  }

  // ---------- Modal ----------
  const modalOverlay = document.createElement("div");
  modalOverlay.className = "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 hidden";
  const modalContent = document.createElement("div");
  modalContent.className = "bg-white rounded-lg max-w-lg w-full p-6 relative";
  modalOverlay.appendChild(modalContent);
  document.body.appendChild(modalOverlay);

  function openModal(html) {
    modalContent.innerHTML = html + `<button class="absolute top-2 right-2 text-gray-500 hover:text-gray-800" data-action="close-modal"><span data-lucide="x"></span></button>`;
    modalOverlay.classList.remove("hidden");
    lucide.createIcons();
    modalOverlay.querySelector("[data-action='close-modal']").addEventListener("click", closeModal);
  }

  function closeModal() {
    modalOverlay.classList.add("hidden");
    modalContent.innerHTML = "";
  }

  // ---------- Rendering ----------
  const appRoot = qs("#app");

  function renderNavbar() {
    const html = `
      <nav class="bg-white shadow sticky top-0 z-30">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div class="flex items-center space-x-4">
            <a href="#" class="text-xl font-bold text-indigo-600">NIE College</a>
            <div class="hidden md:flex space-x-2">
              <a href="#departments" class="nav-link text-gray-600 hover:text-indigo-600" data-view="departments">Departments</a>
              <a href="#courses" class="nav-link text-gray-600 hover:text-indigo-600" data-view="courses">Courses</a>
              <a href="#academics" class="nav-link text-gray-600 hover:text-indigo-600" data-view="academics">Academics</a>
              <a href="#placements" class="nav-link text-gray-600 hover:text-indigo-600" data-view="placements">Placements</a>
            </div>
          </div>
          <div class="flex items-center space-x-4">
            <input type="text" placeholder="Search courses..." id="search-input"
              class="border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
            <button id="cart-btn" class="relative flex items-center">
              <span data-lucide="shopping-cart"></span>
              <span id="cart-count" class="absolute -top-2 -right-2 bg-red-600 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center">0</span>
            </button>
          </div>
        </div>
      </nav>
    `;
    appRoot.insertAdjacentHTML("beforeend", html);
    lucide.createIcons();

    // Event listeners
    qsa(".nav-link").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.preventDefault();
        const view = el.dataset.view;
        state.view = view;
        renderApp();
      });
    });
    qs("#search-input").addEventListener("input", (e) => {
      state.search = e.target.value.trim().toLowerCase();
      if (state.view === "courses") renderCourseView();
    });
    qs("#cart-btn").addEventListener("click", () => {
      const items = state.cart.map((id) => {
        const c = state.courses.find((c) => c.id === id);
        return `<li class="flex justify-between"><span>${c.name}</span><span>${c.price ? "₹" + c.price : ""}</span></li>`;
      });
      openModal(`
        <h2 class="text-xl font-semibold mb-4">Your Cart</h2>
        <ul class="list-disc pl-5 space-y-1">${items.join("") || "<li>No items added.</li>"}</ul>
        <div class="mt-4 flex justify-end">
          <button class="bg-indigo-600 text-white px-4 py-2 rounded" data-action="close-modal">Close</button>
        </div>
      `);
    });
  }

  function renderHero() {
    const html = `
      <section class="bg-indigo-600 text-white py-20">
        <div class="max-w-4xl mx-auto text-center">
          <h1 class="text-4xl md:text-5xl font-bold mb-4">Welcome to NIE College</h1>
          <p class="text-lg md:text-xl mb-6">Empowering future innovators through world‑class education and industry collaborations.</p