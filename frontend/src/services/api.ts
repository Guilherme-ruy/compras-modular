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
            // Clear token and redirect to login
            localStorage.removeItem('@ComprasModular:token');
            localStorage.removeItem('@ComprasModular:permissions');
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        } else if (error.response?.status === 402) {
            // Subscription required
            if (!(window.location.search.includes('upgrade=true'))) {
                window.location.search = '?upgrade=true';
            }
            // Return a never-resolving promise so the calling component's .catch() doesn't fire
            // This prevents default alert/toast popups from showing "Internal server error"
            return new Promise(() => {});
        }
        return Promise.reject(error);
    }
);

export default api;
