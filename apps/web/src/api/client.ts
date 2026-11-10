import axios from 'axios';

const baseURL = 'https://smart-ecommerce-api-ek3p.onrender.com/api/v1';

export const apiClient = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 60000, // 60 seconds to allow Render free tier to wake up
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;
