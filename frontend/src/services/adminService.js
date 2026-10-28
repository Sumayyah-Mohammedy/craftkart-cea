
// PURPOSE: Admin-specific APIs

import api from './api';

const adminService = {
  // Get all users
  getUsers: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await api.get(`/admin/users?${queryString}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Suspend/unsuspend user
  suspendUser: async (userId, suspend = true) => {
    try {
      const response = await api.put(`/admin/users/${userId}/suspend`, { suspend });
      return response.data.user;
    } catch (error) {
      throw error;
    }
  },

  // Get pending verifications
  getPendingVerifications: async () => {
    try {
      const response = await api.get('/admin/verifications');
      return response.data.profiles;
    } catch (error) {
      throw error;
    }
  },

  // Approve seller verification
  approveVerification: async (profileId) => {
    try {
      const response = await api.put(`/admin/verifications/${profileId}/approve`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Reject seller verification
  rejectVerification: async (profileId, reason) => {
    try {
      const response = await api.put(`/admin/verifications/${profileId}/reject`, { reason });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get platform analytics
  getAnalytics: async () => {
    try {
      const response = await api.get('/admin/analytics');
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default adminService;