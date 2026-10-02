import React from 'react';
   import { render, screen, fireEvent, waitFor } from '@testing-library/react';
   import '@testing-library/jest-dom';
   import App from '../App';
   import Header from '../components/Header';

   // Mock fetch globally
   global.fetch = jest.fn();

   describe('App Component', () => {
     beforeEach(() => {
       jest.clearAllMocks();
     });

     test('renders without crashing', () => {
       fetch.mockResolvedValueOnce({
         json: async () => []
       });
       render(<App />);
       expect(screen.getByText(/Analytics Dashboard/i)).toBeInTheDocument();
     });

     test('fetches analytics data on mount', async () => {
       const mockData = [{ id: 1, value: 100 }];
       fetch.mockResolvedValueOnce({
         json: async () => mockData
       });
       render(<App />);
       await waitFor(() => {
         expect(fetch).toHaveBeenCalledWith('/api/analytics');
       });
     });

     test('handles fetch error gracefully', async () => {
       const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
       fetch.mockRejectedValueOnce(new Error('Network Error'));
       render(<App />);
       await waitFor(() => {
         expect(consoleErrorSpy).toHaveBeenCalledWith(new Error('Network Error'));
       });
       consoleErrorSpy.mockRestore();
     });
   });

   describe('Header Component', () => {
     test('renders menu items and search input', () => {
       render(<Header />);
       expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
       expect(screen.getByText(/Reports/i)).toBeInTheDocument();
       expect(screen.getByText(/Settings/i)).toBeInTheDocument();
       expect(screen.getByPlaceholderText(/Search.../i)).toBeInTheDocument();
     });

     test('toggles menu open/close on button click', () => {
       render(<Header />);
       const menuButton = screen.getByRole('button', { name: /Menu/i });
       const nav = screen.getByRole('navigation');

       expect(nav).not.toHaveClass('open');
       fireEvent.click(menuButton);
       expect(nav).toHaveClass('open');
       fireEvent.click(menuButton);
       expect(nav).not.toHaveClass('open');
     });

     test('search input and button are present', () => {
       render(<Header />);
       const searchInput = screen.getByPlaceholderText(/Search.../i);
       const searchButton = screen.getByRole('button', { name: /Search/i });
       expect(searchInput).toBeInTheDocument();
       expect(searchButton).toBeInTheDocument();
     });
   });