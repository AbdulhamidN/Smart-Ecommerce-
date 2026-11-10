import axios from 'axios';

export const apiClient = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    'https://smart-ecommerce-api-ek3p.onrender.com/api/v1',
  withCredentials: true,
  timeout: 60000, // 60 seconds to allow Render free tier to wake up
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;
