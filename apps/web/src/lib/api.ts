import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://beauty-parl-api.onrender.com';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,
});

// ✅ Normalize a single raw product object — coerce all numeric fields
function normalizeItem(item: any) {
  if (!item || typeof item !== 'object') return item;
  return {
    ...item,
    price: item.price !== undefined ? Number(item.price) || 0 : undefined,
    mrp: item.mrp !== undefined && item.mrp !== null ? Number(item.mrp) : undefined,
    discountPercent: item.discountPercent !== undefined ? Number(item.discountPercent) : undefined,
    stock: item.stock !== undefined ? Number(item.stock) || 0 : undefined,
    rating: item.rating !== undefined ? Number(item.rating) : undefined,
    ratingCount: item.ratingCount !== undefined ? Number(item.ratingCount) : undefined,
  };
}

api.interceptors.response.use(
  (response) => {
    const data = response.data;
    // ✅ Normalize product lists at the API layer — prevents toFixed crashes everywhere
    if (Array.isArray(data)) {
      response.data = data.map(normalizeItem);
    } else if (data && typeof data === 'object') {
      if (Array.isArray(data.products)) {
        response.data = { ...data, products: data.products.map(normalizeItem) };
      } else if (Array.isArray(data.data)) {
        response.data = { ...data, data: data.data.map(normalizeItem) };
      }
      // Single product object
      else if (data.price !== undefined) {
        response.data = normalizeItem(data);
      }
    }
    return response;
  },
  (error) => {
    console.error('❌ API Error:', error.response?.status, error.response?.data?.message || error.message);
    return Promise.reject(error);
  }
);
