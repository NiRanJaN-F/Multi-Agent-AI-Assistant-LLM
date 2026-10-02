/* public/main.js - Full‑stack e‑commerce frontend (Tailwind + Lucide) */

(() => {
  // ---------- State ----------
  let products = []; // {id,name,price,image,category,rating}
  let cart = []; // {productId, quantity}
  let filteredProducts = [];
  let categories = [];

  // ---------- Utilities ----------
  const fmt = (n) => `$${n.toFixed(2)}`;
  const getProduct = (id) => products.find((p) => p.id === id);
  const totalCartQty = () => cart.reduce((a, c) => a + c.quantity, 0);
  const totalCartAmount = () =>
    cart.reduce((sum, c) => {
      const p = getProduct(c.productId);
      return sum + (p ? p.price * c.quantity : 0);
    }, 0);

  // Toast notifications
  const showToast = (msg, type = "info", duration = 3000) => {
    const toast = document.createElement("div");
    toast.className = `fixed bottom-4 right-4 max-w-xs w-full bg-${
      type === "error" ? "red" : "green"
    }-600 text-white px-4 py-2 rounded shadow-lg flex items-center space-x-2 animate-fade-in`;
    toast.innerHTML = `<span>${msg}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.classList.add("animate-fade-out");
      toast.addEventListener("animationend", () => toast.remove());
    }, duration);
  };

  // Modal helpers
  const openModal = (el) => {
    el.classList.remove("hidden");
    setTimeout(() => el.classList.add("opacity-100", "translate-y-0"), 10);
    lucide.createIcons();
  };
  const closeModal = (el) => {
    el.classList.remove("opacity-100", "translate-y-0");
    el.classList.add("opacity-0", "translate-y-4");
    el.addEventListener(
      "transitionend",
      () => el.classList.add("hidden"),
      { once: true }
    );
  };

  // ---------- API ----------
  const api = {
    getProducts: async () => {
      try {
        const r = await fetch("/api/products");
        const d = await r.json();
        if (d.success) return d.products;
      } catch {}
      // fallback mock data
      return [
        {
          id: 1,
          name: "Cozy Knit Sweater",
          price: 49.99,
          image:
            "https://images.unsplash.com/photo-1585386959984-a415522f6c2f?auto=format&fit=crop&w=400&q=80",
          category: "Apparel",
          rating: 4.5,
        },
        {
          id: 2,
          name: "Modern Desk Lamp",
          price: 79.99,
          image:
            "https://images.unsplash.com/photo-1582719478250-3b6d6c5c1e4e?auto=format&fit=crop&w=400&q=80",
          category: "Home",
          rating: 4.2,
        },
        {
          id: 3,
          name: "Wireless Headphones",
          price: 199.99,
          image:
            "https://images.unsplash.com/photo-1518443883066-3c5b8c4f8f2c?auto=format&fit=crop&w=400&q=80",
          category: "Electronics",
          rating: 4.8,
        },
        {
          id: 4,
          name: "Organic Green Tea",
          price: 15.5,
          image:
            "https://images.unsplash.com/photo-1516685304081-de7947d419d6?auto=format&fit=crop&w=400&q=80",
          category: "Food",
          rating: 4.3,
        },
        {
          id: 5,
          name: "Leather Backpack",
          price: 129.0,
          image:
            "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=400&q=80",
          category: "Accessories",
          rating: 4.6,
        },
        {
          id: 6,
          name: "Ceramic Coffee Mug",
          price: 12.99,
          image:
            "https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=400&q=80",
          category: "Kitchen",
          rating: 4.1,
        },
        {
          id: 7,
          name: "Fitness Tracker",
          price: 89.99,
          image:
            "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=400&q=80",
          category: "Electronics",
          rating: 4.4,
        },
        {
          id: 8,
          name: "Minimalist Wall Clock",
          price: 34.99,
          image:
            "https://images.unsplash.com/photo-1509228627159-645b2b5c5e3c?auto=format&fit=crop&w=400&q=80",
          category: "Home",
          rating: 4.0,
        },
      ];
    },
    getCart: async () => {
      try {
        const r = await fetch("/api/cart");
        const d = await r.json();
        if (d.success) return d.cart;
      } catch {}
      return [];
    },
    addToCart: async (productId) => {
      const r = await fetch("/api/cart/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      const d = await r.json();
      if (d.success) return d.cart;
      throw new Error("Add to cart failed");
    },
    removeFromCart: async (productId) => {
      const r = await fetch("/api/cart/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      const d = await r.json();
      if (d.success) return d.cart;
      throw new Error("Remove from cart failed");
    },
    checkout: async (payload) => {
      const r = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const d = await r.json();
      if (d.success) return d;
      throw new Error("Checkout failed");
    },
  };

  // ---------- Rendering ----------
  const app = document.getElementById("app") || document.body;

  // Header (sticky navbar)
  const renderHeader = () => {
    const header = document.createElement("header");
    header.className =
      "sticky top-0 bg-white shadow z-10 flex items-center justify-between px-6 py-3";

    header.innerHTML = `
      <div class="flex items-center space-x-2">
        <span class="text-xl font-bold">ShopMate</span>
        <i data-lucide="shopping-bag" class="w-5 h-5"></i>
      </div>
      <div class="flex-1 mx-4">
        <input id="searchInput" type="text" placeholder="Search products..."
          class="w-full border rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
      </div>
      <button id="cartBtn" class="relative flex items-center space-x-1">
        <i data-lucide="shopping-cart" class="w-5 h-5"></i>
        <span>Cart</span>
        <span id="cartBadge"
          class="hidden absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
          0
        </span>
      </button>
    `;
    app.appendChild(header);
    lucide.createIcons();
  };

  // Hero / Filter bar
  const renderHero = () => {
    const hero = document.createElement("section");
    hero.className = "bg-gray-100 py-8";
    hero.innerHTML = `
      <div class="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between">
        <h1 class="text-3xl font-semibold mb-4 sm:mb-0">Discover Amazing Products</h1>
        <select id="categorySelect" class="border rounded px-3 py-1">
          <option value="">All Categories</option>
        </select>
      </div>
    `;
    app.appendChild(hero);
  };

  // Product grid
  const renderProducts = () => {
    const containerId = "productContainer";
    let container = document.getElementById(containerId);
    if (!container) {
      container = document.createElement("section");
      container.id = containerId;
      container.className = "max-w-7xl mx-auto px-4 py-6";
      app.appendChild(container);
    }
    container.innerHTML = `
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        ${filteredProducts
          .map((p) => {
            const stars = Math.round(p.rating);
            const empty = 5 - stars;
            return `
            <div class="bg-white rounded-lg shadow hover:shadow-lg transition flex flex-col">
              <img src="${p.image}" alt="${p.name}" class="h-48 w-full object-cover rounded-t-lg"/>
              <div class="p-4 flex flex-col flex-1">
                <h2 class="font-medium text-lg mb-1">${p.name}</h2>
                <p class="text-gray-600 mb-2">${p.category}</