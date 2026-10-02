// src/__tests__/AppHeader.test.jsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../App.jsx';
import Header from '../components/Header.jsx';
import ChartJS from 'chart.js';
import {
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Spy on ChartJS.register to verify it is called with the correct components
const registerSpy = jest.spyOn(ChartJS,