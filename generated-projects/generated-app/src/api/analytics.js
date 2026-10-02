// src/api/analytics.js
//
// A lightweight analytics data layer that fetches KPI, chart, and table data
// from the backend API.  It falls back to localStorage caching when the
// network is unavailable, ensuring the dashboard remains usable offline.
//
// All functions return Promises that resolve to the expected data shape.

const API_BASE = '/api';

/**
 * Utility: read JSON from localStorage
 * @param {string} key
 * @returns {any|null}
 */
function readCache(key) {
  try {
    const json = localStorage.getItem(key);
    return json ? JSON.parse(json) : null;
  } catch (e) {
    console.warn(`Failed to read cache for key "${key}":`, e);
    return null;
  }
}

/**
 * Utility: write JSON to localStorage
 * @param {string} key
 * @param {any} data
 */
function writeCache(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn(`Failed to write cache for key "${key}":`, e);
  }
}

/**
 * Generic fetch with caching.
 * @param {string} endpoint
 * @param {string} cacheKey
 * @returns {Promise<any>}
 */
async function fetchWithCache(endpoint, cacheKey) {
  const cached = readCache(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(endpoint, {
      credentials: 'include',
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    writeCache(cacheKey, data);
    return data;
  } catch (err) {
    console.error(`Fetch error for ${endpoint}:`, err);
    // If we have cached data, return it even if stale
    if (cached) {
      return cached;
    }
    throw err;
  }
}

/**
 * Fetch KPI cards data.
 * @returns {Promise<Array<{ id: string, title: string, value: number, change: number, icon: string }>>}
 */
export async function fetchKPIs() {
  const endpoint = `${API_BASE}/kpis`;
  const cacheKey = 'kpis';
  return fetchWithCache(endpoint, cacheKey);
}

/**
 * Fetch chart data for a given chart ID.
 * @param {string} chartId
 * @returns {Promise<{ labels: Array<string>, datasets: Array<object> }>}
 */
export async function fetchChartData(chartId) {
  const endpoint = `${API_BASE}/charts/${encodeURIComponent(chartId)}`;
  const cacheKey = `chart-${chartId}`;
  return fetchWithCache(endpoint, cacheKey);
}

/**
 * Fetch table data for a given table ID.
 * @param {string} tableId
 * @returns {Promise<Array<object>>}
 */
export async function fetchTableData(tableId) {
  const endpoint = `${API_BASE}/tables/${encodeURIComponent(tableId)}`;
  const cacheKey = `table-${tableId}`;
  return fetchWithCache(endpoint, cacheKey);
}

/**
 * Invalidate cached data for a specific key or all analytics data.
 * @param {string|null} key - If null, clears all analytics cache.
 */
export function invalidateCache(key = null) {
  if (key) {
    localStorage.removeItem(key);
  } else {
    Object.keys(localStorage)
      .filter((k) => k.startsWith('kpis') || k.startsWith('chart-') || k.startsWith('table-'))
      .forEach((k) => localStorage.removeItem(k));
  }
}

/**
 * Exported default object for convenience.
 */
export default {
  fetchKPIs,
  fetchChartData,
  fetchTableData,
  invalidateCache,
};