// PURPOSE: Seller-specific APIs

import api from "./api";

const sellerService = {
  // Submit seller verification
  submitVerification: async (verificationData) => {
    try {
      const response = await api.post("/seller/verify", verificationData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get seller dashboard data
  getDashboard: async () => {
    try {
      const response = await api.get("/seller/dashboard");
      return response.data.analytics;
    } catch (error) {
      throw error;
    }
  },

  // Get seller profile
  getProfile: async () => {
    try {
      const response = await api.get("/seller/profile");
      return response.data.profile;
    } catch (error) {
      throw error;
    }
  },

  // Update seller profile
  updateProfile: async (profileData) => {
    try {
      const response = await api.put("/seller/profile", profileData);
      return response.data.profile;
    } catch (error) {
      throw error;
    }
  },
};

export default sellerService;
