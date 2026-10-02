// src/api.js

import axios from 'axios';

// Define API endpoints
const API_URL = 'https://example.com/api';
const GET_DATA_ENDPOINT = '/data';
const UPDATE_DATA_ENDPOINT = '/update';

// Axios instance for making requests
const apiInstance = axios.create({
  baseURL: API_URL,
});

// Function to fetch data from API
export async function fetchData() {
  try {
    const response = await apiInstance.get(GET_DATA_ENDPOINT);
    return response.data;
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}

// Function to update data on API
export async function updateData(data) {
  try {
    const response = await apiInstance.post(UPDATE_DATA_ENDPOINT, data);
    return response.data;
  } catch (error) {
    console.error('Error updating data:', error);
  }
}