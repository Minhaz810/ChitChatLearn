import api from './api';

class AdminService {
    async login(credentials) {
        return api.request('/admin/login', {
            method: 'POST',
            body: JSON.stringify(credentials),
        });
    }

    async getStats() {
        return api.request('/admin/stats');
    }

    async getUsers() {
        return api.request('/admin/users');
    }
}

export const adminApi = new AdminService();
export default adminApi;
