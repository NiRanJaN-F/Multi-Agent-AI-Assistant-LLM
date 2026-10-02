/* public/app.js – Full client‑side logic for a simple e‑commerce store.
 * Uses localStorage for cart persistence, fetches product data from
 * `/api/products` if available, otherwise falls back to static data.
 * Handles product listing, cart operations, checkout form, and confirmation.
 */

"use strict";

(() => {
  /* ---------- Configuration & Constants ---------- */
  const CART_STORAGE_KEY = "cart";
  const PRODUCTS_API_URL = "/api/products"; // optional
  const app = document.getElementById("app");

  /* ---------- Utility Functions ---------- */
  const saveCart = (cart) => localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  const loadCart = () => {
    const data = localStorage.getItem(CART_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  };
  const formatPrice = (num) => `$${num.toFixed(2)}`;

  /* ---------- State ---------- */
  let products = []; // array of product objects
  let cart = loadCart(); // array of {id, name, price, quantity, image}

  /* ---------- DOM Creation Helpers ---------- */
  const createElement = (tag, attrs = {}, ...children) => {
    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([key, value]) => {
      if (key.startsWith("on") && typeof value === "function") {
        el.addEventListener(key.substring(2).toLowerCase(), value);
      } else if (key === "className") {
        el.className = value;
      } else if (key === "dataset") {
        Object.entries(value).forEach(([dKey, dVal]) => el.dataset[dKey] = dVal);
      } else {
        el.setAttribute(key, value);
      }
    });
    children.forEach(child => {
      if (typeof child === "string") el.appendChild(document.createTextNode(child));
      else if (child instanceof Node) el.appendChild(child);
    });
    return el;
  };

  /* ---------- UI Rendering ---------- */
  const renderHeader = () => {
    const header = createElement("header", { className: