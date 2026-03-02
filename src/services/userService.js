import api from './api';

export const userService = {
    createUser: async (userData) => {
        const { data } = await api.post('/users', userData);
        return data;
    },

    getUsers: async () => {
        const { data } = await api.get('/users');
        return data;
    },

    updateUser: async (id, userData) => {
        const { data } = await api.patch(`/users/${id}`, userData);
        return data;
    }
};
