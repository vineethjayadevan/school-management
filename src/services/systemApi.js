import api from './api';

export const systemService = {
    login: async (username, password, pin) => {
        const { data } = await api.post('/system/login', { username, password, pin });
        return data; // returns the superadmin user object + sets cookie
    },
    getUsers: async () => {
        const { data } = await api.get('/system/users');
        return data;
    },
    createUser: async (userData) => {
        const { data } = await api.post('/system/users', userData);
        return data;
    },
    resetPassword: async (userId, newPassword) => {
        const { data } = await api.put(`/system/users/${userId}/reset-password`, { newPassword });
        return data;
    },
    updateUser: async (userId, userData) => {
        const { data } = await api.patch(`/system/users/${userId}`, userData);
        return data;
    }
};
