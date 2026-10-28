// PURPOSE: Axios instance with base configuration

import axios from "axios";

// Base API URL (your backend)
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // 10 seconds
});

// Request interceptor - Add token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
api.interceptors.response.use(
  (response) => {
    return response.data; // Return only data from response
  },
  (error) => {
    // Handle specific error cases
    if (error.response) {
      // Server responded with error
      const { status, data } = error.response;

      if (status === 401) {
        // Unauthorized - clear token and redirect to login
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }

      // Return error message from backend
      return Promise.reject(data.message || "Something went wrong");
    } else if (error.request) {
      // Request made but no response
      return Promise.reject("Network error. Please check your connection.");
    } else {
      // Something else happened
      return Promise.reject(error.message);
    }
  }
);

export default api;
