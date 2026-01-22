import api from './api';

const AUTH_KEY = 'sms_auth_user';

export const authService = {
    login: async (email, password) => {
        const { data } = await api.post('/auth/login', { email, password });
        if (data.token) {
            localStorage.setItem(AUTH_KEY, JSON.stringify(data));
        }
        return data;
    },

    logout: () => {
        localStorage.removeItem(AUTH_KEY);
    },

    getCurrentUser: () => {
        const user = localStorage.getItem(AUTH_KEY);
        try {
            return user ? JSON.parse(user) : null;
        } catch (error) {
            console.error('Error parsing user data:', error);
            localStorage.removeItem(AUTH_KEY);
            return null;
        }
    },

    isAuthenticated: () => {
        return !!localStorage.getItem(AUTH_KEY);
    }
};

