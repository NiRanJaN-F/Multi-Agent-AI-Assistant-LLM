import React, { useState, useEffect } from 'react';
import { getKPIs } from '../api/analytics';
import './KPICards.css';

const LOCAL_STORAGE_KEY = 'kpiData';
const LOCAL_STORAGE_TIMESTAMP = 'kpiTimestamp';
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

const KPICards = () => {
  const [kpis, setKpis] = useState([]);
  const [filterText, setFilterText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load cached data or fetch fresh data
  useEffect(() => {
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
    const timestamp = localStorage.getItem(LOCAL_STORAGE_TIMESTAMP);
    if (cached && timestamp && Date.now() - Number(timestamp) < CACHE_DURATION_MS) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          setKpis(parsed);
          return;
        }
      } catch (_) {}
    }
    fetchKPIs();
  }, []);

  const fetchKPIs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getKPIs();
      if (Array.isArray(data)) {
        setKpis(data);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
        localStorage.setItem(LOCAL_STORAGE_TIMESTAMP, Date.now().toString());
      } else {
        throw new Error('Invalid data format from API');
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch KPI data');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilterText(e.target.value);
  };

  const handleAddKPI = (e) => {
    e.preventDefault();
    const titleInput = document.getElementById('kpi-title-input');
    const valueInput = document.getElementById('kpi-value-input');
    const iconInput = document.getElementById('kpi-icon-input');

    if (!titleInput || !valueInput) return;

    const title = titleInput.value.trim();
    const value = parseFloat(valueInput.value);
    const icon = iconInput ? iconInput.value.trim() : '📈';

    if (!title || isNaN(value)) return;