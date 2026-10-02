import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { fetchTransactions, fetchUsers, fetchProducts } from '../api/analytics';

const DataTables = () => {
  const [activeTab, setActiveTab] = useState('transactions');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [filters, setFilters] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const [exportFormat, setExportFormat] = useState('csv');
  const [isExporting, setIsExporting] = useState(false);

  const tabs = [
    { id: 'transactions', label: 'Transactions', icon: '💳' },
    { id: 'users', label: 'Users', icon: '👥' },
    { id: 'products', label: 'Products', icon: '📦' }
  ];

  const columns = {
    transactions: [
      { key: 'id', label: 'ID', sortable: true },
      { key: 'customer', label: 'Customer', sortable: true },
      { key: 'date', label: 'Date', sortable: true },
      { key: 'amount', label: 'Amount', sortable: true, format: 'currency' },
      { key: 'status', label: 'Status', sortable: true, format: 'badge' },
      { key: 'method', label: 'Payment Method', sortable: true },
      { key: 'category', label: 'Category', sortable: true },
      { key: 'region', label: 'Region', sortable: true }
    ],
    users: [
      { key: 'id', label: 'ID', sortable: true },
      { key: 'name', label: 'Name', sortable: true },
      { key: 'email', label: 'Email', sortable: true },
      { key: 'role', label: 'Role', sortable: true, format: 'badge' },
      { key: 'status', label: 'Status', sortable: true, format: 'badge' },
      { key: 'joinDate', label: 'Join Date', sortable: true },
      { key: 'lastLogin', label: 'Last Login', sortable: true },
      { key: 'totalOrders', label: 'Total Orders', sortable: true }
    ],
    products: [
      { key: 'id', label: 'ID', sortable: true },
      { key: 'name', label: 'Product Name', sortable: true },
      { key: 'category', label: 'Category', sortable: true },
      { key: 'price', label: 'Price', sortable: true, format: 'currency' },
      { key: 'stock', label: 'Stock', sortable: true, format: 'stock' },
      { key: 'sales', label: 'Total Sales', sortable: true },
      { key: 'rating', label: 'Rating', sortable: true, format: 'rating' },
      { key: 'status', label: 'Status', sortable: true, format: 'badge' }
    ]
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let result;
      switch (activeTab) {
        case 'transactions':
          result = await fetchTransactions();
          break;
        case 'users':
          result = await fetchUsers();
          break;
        case 'products':
          result = await fetchProducts();
          break;
        default:
          result = [];
      }
      setData(result);
      setCurrentPage(1);
      setSelectedRows(new Set());
    } catch (err) {
      setError(err.message || 'Failed to fetch data');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const savedState = localStorage.getItem(`dataTables_${activeTab}`);
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        if (parsed.sortConfig) setSortConfig(parsed.sortConfig);
        if (parsed.rowsPerPage) setRowsPerPage(parsed.rowsPerPage);
        if (parsed.filters) setFilters(parsed.filters);
      } catch (e) {
        // Ignore parse errors
      }
    }
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem(`dataTables_${activeTab}`, JSON.stringify({
      sortConfig,
      rowsPerPage,
      filters
    }));
  }, [sortConfig, rowsPerPage, filters, activeTab]);

  const filteredAndSortedData = useMemo(() => {
    let processed = [...data];

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      processed = processed.filter(row =>
        Object.values(row).some(val =>
          String(val).toLowerCase().includes(lowerSearch)
        )
      );
    }

    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'all') {
        processed = processed.filter(row => String(row[key]) === value);
      }
    });

    if (sortConfig.key) {
      processed.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];

        if (sortConfig.key === 'amount' || sortConfig.key === 'price') {
          aVal = parseFloat(aVal) || 0;
          bVal = parseFloat(bVal) || 0;
        } else if (sortConfig.key === 'date' || sortConfig.key === 'joinDate' || sortConfig.key === 'lastLogin') {
          aVal = new Date(aVal).getTime();
          bVal = new Date(bVal).getTime();
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return processed;
  }, [data, searchTerm, sortConfig, filters]);

  const totalPages = Math.ceil(filteredAndSortedData.length / rowsPerPage);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredAndSortedData.slice(start, start + rowsPerPage);
  }, [filteredAndSortedData, currentPage, rowsPerPage]);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleSelectAll = () => {
    if (selectedRows.size === paginatedData.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(paginatedData.map(row => row.id)));
    }
  };

  const handleSelectRow = (id) => {
    setSelectedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);