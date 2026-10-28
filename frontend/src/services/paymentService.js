// PURPOSE: Payment processing APIs

import api from "./api";

const paymentService = {
  // Process card payment
  processCardPayment: async (paymentData) => {
    try {
      const response = await api.post("/payments/card", paymentData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Create Stripe payment intent
  createPaymentIntent: async (amount) => {
    try {
      const response = await api.post("/payments/create-intent", {
        amount: Math.round(amount * 100), // Convert to cents
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Verify payment
  verifyPayment: async (paymentId) => {
    try {
      const response = await api.post("/payments/verify", { paymentId });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Cash on Delivery
  createCODOrder: async (orderData) => {
    try {
      // Mark payment method as COD
      const response = await api.post("/orders", {
        ...orderData,
        paymentMethod: "cod",
        paymentStatus: "pending",
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // JazzCash payment
  processJazzCash: async (paymentData) => {
    try {
      const response = await api.post("/payments/jazzcash", paymentData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // EasyPaisa payment
  processEasyPaisa: async (paymentData) => {
    try {
      const response = await api.post("/payments/easypaisa", paymentData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get payment methods
  getPaymentMethods: () => {
    return [
      {
        id: "card",
        name: "Credit/Debit Card",
        icon: "💳",
        description: "Pay securely with Visa, Mastercard",
      },
      {
        id: "jazzcash",
        name: "JazzCash",
        icon: "📱",
        description: "Pay with JazzCash mobile wallet",
      },
      {
        id: "easypaisa",
        name: "EasyPaisa",
        icon: "💰",
        description: "Pay with EasyPaisa account",
      },
      {
        id: "cod",
        name: "Cash on Delivery",
        icon: "💵",
        description: "Pay when you receive your order",
      },
    ];
  },

  // Validate card number (basic validation)
  validateCard: (cardNumber) => {
    // Remove spaces and dashes
    const cleaned = cardNumber.replace(/[\s-]/g, "");

    // Check if it's 16 digits
    if (!/^\d{16}$/.test(cleaned)) {
      return false;
    }

    // Luhn algorithm
    let sum = 0;
    let isEven = false;

    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned[i]);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  },

  // Format currency
  // formatCurrency: (amount) => {
  //   return `Rs. ${amount.toLocaleString("en-PK")}`;
  // },
};

export default paymentService;
