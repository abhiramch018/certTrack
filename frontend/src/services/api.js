import axios from 'axios';

const BASE = import.meta.env.VITE_API_BASE || '';

const API = axios.create({
    baseURL: `${BASE}/api`,
});

// Attach auth token to every request
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Token ${token}`;
    }
    return config;
});

export default API;
