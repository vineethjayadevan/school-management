import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true, // Send cookies with requests
});

// Response interceptor to handle 401s (optional but good practice)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Check if we are not already on the login page to avoid loops
            if (!window.location.pathname.startsWith('/login')) {
                // Optionally redirect or semantic logout
                // window.location.href = '/login'; 
            }
        }
        return Promise.reject(error);
    }
);

export default api;
