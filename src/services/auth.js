import api from './api';

// AUTH_KEY removed as we use cookies now

export const authService = {
    login: async (email, password) => {
        // Cookie is set by the server automatically
        const { data } = await api.post('/auth/login', { email, password });
        return data;
    },

    logout: async () => {
        try {
            await api.post('/auth/logout');
        } catch (error) {
            console.error('Logout failed', error);
        }
    },

    getCurrentUser: async () => {
        try {
            const { data } = await api.get('/auth/me');
            return data;
        } catch (error) {
            // Not authenticated or session expired
            return null;
        }
    },

    changePassword: async (currentPassword, newPassword) => {
        const { data } = await api.put('/auth/change-password', { currentPassword, newPassword });
        return data;
    }
};

