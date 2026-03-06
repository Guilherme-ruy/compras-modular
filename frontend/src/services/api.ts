import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1',
});

// Interceptor to inject JWT token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('@ComprasModular:token');

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
}, (error) => {
    return Promise.reject(error);
});

// Interceptor to handle 401s (optional logout logic here)
api.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 401) {
            // For instance, clear token and emit event
            localStorage.removeItem('@ComprasModular:token');
            localStorage.removeItem('@ComprasModular:permissions');
        }
        return Promise.reject(error);
    }
);

export default api;
