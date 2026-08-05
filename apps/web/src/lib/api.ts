import axios from 'axios';

// ✅ Use environment variable
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://beauty-parl-api.onrender.com';

console.log('🔗 API Base URL:', API_URL);

export const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,
});

// ✅ Log all requests
api.interceptors.request.use(
  (config) => {
    console.log(`📤 ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Request error:', error);
    return Promise.reject(error);
  }
);

// ✅ Log all responses
api.interceptors.response.use(
  (response) => {
    console.log(`📥 ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ Response error:', error.response?.status, error.response?.data || error.message);
    return Promise.reject(error);
  }
);
