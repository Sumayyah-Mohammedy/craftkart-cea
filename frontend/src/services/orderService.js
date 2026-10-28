// PURPOSE: Order management APIs

import api from './api';

const orderService = {
  // Create new order
  createOrder: async (orderData) => {
    try {
      const response = await api.post('/orders', orderData);
      return response.data.order;
    } catch (error) {
      throw error;
    }
  },

  // Get user's orders
  getOrders: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await api.get(`/orders?${queryString}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get single order by ID
  getOrder: async (orderId) => {
    try {
      const response = await api.get(`/orders/${orderId}`);
      return response.data.order;
    } catch (error) {
      throw error;
    }
  },

  // Get orders by status
  getOrdersByStatus: async (status) => {
    try {
      return await orderService.getOrders({ status });
    } catch (error) {
      throw error;
    }
  },

  // Cancel order
  cancelOrder: async (orderId, reason) => {
    try {
      const response = await api.put(`/orders/${orderId}/cancel`, { reason });
      return response.data.order;
    } catch (error) {
      throw error;
    }
  },

  // ========== SELLER ROUTES ==========

  // Get seller's orders
  getSellerOrders: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await api.get(`/seller/orders?${queryString}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update order status (seller)
  updateOrderStatus: async (orderId, status, note = '') => {
    try {
      const response = await api.put(`/seller/orders/${orderId}/status`, {
        status,
        note
      });
      return response.data.order;
    } catch (error) {
      throw error;
    }
  },

  // Get order tracking info
  getTrackingInfo: async (orderId) => {
    try {
      const order = await orderService.getOrder(orderId);
      return {
        orderId: order.orderId,
        status: order.orderStatus,
        history: order.statusHistory,
        trackingNumber: order.trackingNumber,
        estimatedDelivery: order.estimatedDelivery
      };
    } catch (error) {
      throw error;
    }
  },

  // Format order status for display
  getStatusLabel: (status) => {
    const statusLabels = {
      pending: 'Pending',
      confirmed: 'Confirmed',
      packed: 'Packed',
      shipped: 'Shipped',
      delivered: 'Delivered',
      cancelled: 'Cancelled'
    };
    return statusLabels[status] || status;
  },

  // Get status color for UI
  getStatusColor: (status) => {
    const colors = {
      pending: 'yellow',
      confirmed: 'blue',
      packed: 'purple',
      shipped: 'indigo',
      delivered: 'green',
      cancelled: 'red'
    };
    return colors[status] || 'gray';
  }
};

export default orderService;