// PURPOSE: Shopping cart APIs

import api from "./api";

const cartService = {
  // Get user's cart
  getCart: async () => {
    try {
      const response = await api.get("/cart");
      return response.data.cart;
    } catch (error) {
      throw error;
    }
  },

  // Add item to cart
  addToCart: async (productId, variantSku = null, quantity = 1) => {
    try {
      const response = await api.post("/cart", {
        productId,
        variantSku,
        quantity,
      });
      return response.data.cart;
    } catch (error) {
      throw error;
    }
  },

  // Update cart item quantity
  updateCartItem: async (itemId, quantity) => {
    try {
      const response = await api.put(`/cart/${itemId}`, { quantity });
      return response.data.cart;
    } catch (error) {
      throw error;
    }
  },

  // Remove item from cart
  removeFromCart: async (itemId) => {
    try {
      const response = await api.delete(`/cart/${itemId}`);
      return response.data.cart;
    } catch (error) {
      throw error;
    }
  },

  // Clear entire cart
  clearCart: async () => {
    try {
      const response = await api.delete("/cart");
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Calculate cart totals
  calculateTotals: (cart) => {
    if (!cart || !cart.items || cart.items.length === 0) {
      return {
        subtotal: 0,
        shipping: 0,
        tax: 0,
        total: 0,
        itemCount: 0,
      };
    }

    const subtotal = cart.items.reduce((total, item) => {
      return total + item.productId.price * item.quantity;
    }, 0);

    const shipping = 200; // Fixed shipping
    const tax = subtotal * 0.17; // 17% tax
    const total = subtotal + shipping + tax;
    const itemCount = cart.items.reduce(
      (count, item) => count + item.quantity,
      0
    );

    return {
      subtotal,
      shipping,
      tax,
      total,
      itemCount,
    };
  },
};

export default cartService;
