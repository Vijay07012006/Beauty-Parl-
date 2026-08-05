import axios from 'axios';

// ✅ Use environment variable or fallback to Render URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://beauty-parl-api.onrender.com';

console.log('🔗 [API] Base URL:', API_URL);

export const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor — logs requests
api.interceptors.request.use(
  (config) => {
    console.log(`📤 [API] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ [API] Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor — logs responses and errors
api.interceptors.response.use(
  (response) => {
    console.log(`📥 [API] ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ [API] Response error:', error.response?.status, error.response?.data || error.message);
    return Promise.reject(error);
  }
);
