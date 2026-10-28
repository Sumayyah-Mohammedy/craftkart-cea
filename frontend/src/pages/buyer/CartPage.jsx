import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiTrash2,
  FiPlus,
  FiMinus,
  FiShoppingBag,
  FiArrowRight,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import Button from "../../components/common/Button";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import cartService from "../../services/cartService";

const CartPage = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState({});
  const [updatingItem, setUpdatingItem] = useState(null);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      const data = await cartService.getCart();
      setCart(data);
      setTotals(cartService.calculateTotals(data));
    } catch (error) {
      console.error("Error loading cart:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId, change) => {
    setUpdatingItem(itemId);
    try {
      const item = cart.items.find((i) => i._id === itemId);
      const newQuantity = item.quantity + change;

      if (newQuantity < 1) return;

      // Check stock
      if (newQuantity > item.productId.stock) {
        alert("Not enough stock available");
        return;
      }

      const updatedCart = await cartService.updateCartItem(itemId, newQuantity);
      setCart(updatedCart);
      setTotals(cartService.calculateTotals(updatedCart));
    } catch (error) {
      alert("Error updating cart: " + error);
    } finally {
      setUpdatingItem(null);
    }
  };

  const removeItem = async (itemId) => {
    if (!window.confirm("Remove this item from cart?")) return;

    try {
      const updatedCart = await cartService.removeFromCart(itemId);
      setCart(updatedCart);
      setTotals(cartService.calculateTotals(updatedCart));
    } catch (error) {
      alert("Error removing item: " + error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto max-w-7xl px-4 py-20">
          <LoadingSpinner size="lg" />
        </div>
        <Footer />
      </div>
    );
  }

  const cartItems = cart?.items || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto max-w-7xl px-4 py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

        {cartItems.length === 0 ? (
          // Empty Cart
          <div className="bg-white rounded-2xl p-12 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <FiShoppingBag size={48} className="text-gray-400" />
            </motion.div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Your cart is empty
            </h2>
            <p className="text-gray-600 mb-6">
              Add some products to get started!
            </p>
            <Button onClick={() => navigate("/shop")}>
              Start Shopping <FiArrowRight />
            </Button>
          </div>
        ) : (
          // Cart with items
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <AnimatePresence>
                {cartItems.map((item, index) => (
                  <motion.div
                    key={item._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-xl p-6 mb-4 shadow-sm hover:shadow-md transition"
                  >
                    <div className="flex gap-6">
                      {/* Product Image */}
                      <img
                        src={
                          item.productId?.images?.[0] ||
                          "https://via.placeholder.com/150"
                        }
                        alt={item.productId?.title}
                        className="w-24 h-24 object-cover rounded-lg"
                      />

                      {/* Product Details */}
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-gray-900 mb-1">
                          {item.productId?.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          By {item.productId?.sellerId?.name || "Seller"}
                        </p>
                        {item.variantSku && (
                          <p className="text-sm text-gray-600 mb-3">
                            Variant: {item.variantSku}
                          </p>
                        )}

                        <div className="flex items-center justify-between">
                          {/* Quantity Controls */}
                          <div className="flex items-center gap-3">
                            <motion.button
                              whileTap={{ scale: 0.9 }}
                              onClick={() => updateQuantity(item._id, -1)}
                              disabled={updatingItem === item._id}
                              className="w-8 h-8 rounded-lg border-2 border-gray-300 hover:border-pink-500 flex items-center justify-center disabled:opacity-50"
                            >
                              <FiMinus size={16} />
                            </motion.button>
                            <span className="w-8 text-center font-semibold">
                              {item.quantity}
                            </span>
                            <motion.button
                              whileTap={{ scale: 0.9 }}
                              onClick={() => updateQuantity(item._id, 1)}
                              disabled={updatingItem === item._id}
                              className="w-8 h-8 rounded-lg border-2 border-gray-300 hover:border-pink-500 flex items-center justify-center disabled:opacity-50"
                            >
                              <FiPlus size={16} />
                            </motion.button>
                          </div>

                          {/* Price */}
                          <div className="text-right">
                            <p className="text-xl font-bold text-pink-600">
                              Rs.{" "}
                              {(
                                (item.productId?.price || 0) * item.quantity
                              ).toLocaleString()}
                            </p>
                            <p className="text-sm text-gray-500">
                              Rs.{" "}
                              {(item.productId?.price || 0).toLocaleString()}{" "}
                              each
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Remove Button */}
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => removeItem(item._id)}
                        className="text-red-500 hover:text-red-600 p-2"
                      >
                        <FiTrash2 size={20} />
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Order Summary */}
            <div>
              <div className="bg-white rounded-xl p-6 shadow-md sticky top-24">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  Order Summary
                </h2>

                {/* Price Breakdown */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-gray-700">
                    <span>Subtotal ({totals.itemCount} items)</span>
                    <span>Rs. {totals.subtotal?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Shipping</span>
                    <span>Rs. {totals.shipping?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Tax (17%)</span>
                    <span>Rs. {totals.tax?.toFixed(0).toLocaleString()}</span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-gray-900">
                        Total
                      </span>
                      <span className="text-2xl font-bold text-pink-600">
                        Rs. {totals.total?.toFixed(0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Checkout Button */}
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={() => navigate("/checkout")}
                >
                  Proceed to Checkout <FiArrowRight />
                </Button>

                {/* Continue Shopping */}
                <button
                  onClick={() => navigate("/shop")}
                  className="w-full mt-4 text-pink-600 hover:text-pink-700 font-medium"
                >
                  Continue Shopping
                </button>

                {/* Trust Badges */}
                <div className="mt-6 pt-6 border-t space-y-3">
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      ✓
                    </div>
                    <span>Secure Payment</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      🚚
                    </div>
                    <span>Fast Delivery</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      ↩
                    </div>
                    <span>Easy Returns</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default CartPage;
