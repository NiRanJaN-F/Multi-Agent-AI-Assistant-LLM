import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

// Mocking window and browser objects for SSR-like testing of React components without full DOM
global.window = {
  lucide: {
    createIcons: () => {}
  }
};
global.document = {
  createElement: () => ({ style: {} }),
  body: { appendChild: () => {} }
};

// Import mock data to verify data integrity
import { 
  kpiData, 
  revenueData, 
  trafficData, 
  categoryData, 
  recentTransactions, 
  activityLog 
} from '../src/mockData.js';

// Import components
import KpiCard from '../src/components/KpiCard.jsx';
import DataTable from '../src/components/DataTable.jsx';

test('Mock Data Integrity Tests', async (t) => {
  await t.test('kpiData should contain valid financial and traffic metrics', () => {
    assert.ok(Array.isArray(kpiData), 'kpiData must be an array');
    assert.ok(kpiData.length > 0, 'kpiData should not be empty');
    
    kpiData.forEach(item => {
      assert.ok(item.title, 'KPI item should have a title');
      assert.ok(item.value, 'KPI item should have a value');
      assert.ok(typeof item.change === 'number', 'KPI change should be a numeric percentage');
    });
  });

  await t.test('revenueData should contain temporal financial records', () => {
    assert.ok(Array.isArray(revenueData), 'revenueData must be an array');
    assert.ok(revenueData.length > 0, 'revenueData should not be empty');
    
    revenueData.forEach(item => {
      assert.ok(item.month || item.day || item.date, 'Revenue item should have a time identifier');
      assert.ok(typeof item.revenue === 'number', 'Revenue should be a number');
      assert.ok(typeof item.expenses === 'number', 'Expenses should be a number');
    });
  });

  await t.test('recentTransactions should contain valid transaction structures', () => {
    assert.ok(Array.isArray(recentTransactions), 'recentTransactions must be an array');
    
    recentTransactions.forEach(tx => {
      assert.ok(tx.id, 'Transaction should have an ID');
      assert.ok(tx.user || tx.customer, 'Transaction should have a user/customer name');
      assert.ok(tx.amount, 'Transaction should have an amount');
      assert.ok(tx.status, 'Transaction should have a status');
    });
  });
});

test('KpiCard Component Unit Test', async (t) => {
  await t.test('KpiCard renders correctly with provided props', () => {
    const sampleKpi = {
      title: 'Total Revenue',
      value: '$54,239',
      change: 12.5,
      isPositive: true,
      period: 'vs last month',
      icon: 'dollar-sign',
      color: 'indigo'
    };

    const html = renderToStaticMarkup(
      <KpiCard 
        title={sampleKpi.title} 
        value={sampleKpi.value} 
        change={sampleKpi.change} 
        isPositive={sampleKpi.isPositive} 
        period={sampleKpi.period} 
      />
    );

    assert.ok(html.includes('Total Revenue'), 'Rendered HTML should include KPI title');
    assert.ok(html.includes('$54,239'), 'Rendered HTML should include KPI value');
    assert.ok(html.includes('12.5'), 'Rendered HTML should include change percentage');
  });

  await t.test('KpiCard handles negative change rates correctly', () => {
    const html = renderToStaticMarkup(
      <KpiCard 
        title="Bounce Rate" 
        value="42.3%" 
        change={-3.2} 
        isPositive={false} 
        period="vs last week" 
      />
    );

    assert.ok(html.includes('Bounce Rate'));
    assert.ok(html.includes('42.3%'));
    assert.ok(html.includes('3.2'));
  });
});

test('DataTable Component Integration Test', async (t) => {
  await t.test('DataTable renders table headers and rows based on props', () => {
    const mockData = [
      { id: '1', customer: 'Acme Corp', amount: '$1,200', status: 'Completed', date: '2023-10-01' },
      { id: '2', customer: 'Globex Inc', amount: '$3,400', status: 'Pending', date: '2023-10-02' }
    ];

    const html = renderToStaticMarkup(
      <DataTable data={mockData} title="Test Transactions" />
    );

    assert.ok(html.includes('Test Transactions'), 'Table should render custom title');
    assert.ok(html.includes('Acme Corp'), 'Table should render first row customer');
    assert.ok(html.includes('Globex Inc'), 'Table should render second row customer');
    assert.ok(html.includes('Completed'), 'Table should render status');
  });

  await t.test('DataTable renders empty state gracefully when data is empty', () => {
    const html = renderToStaticMarkup(
      <DataTable data={[]} title="Empty Transactions" />
    );

    assert.ok(html.includes('Empty Transactions'));
  });
});