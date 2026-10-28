import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  FiCheckCircle,
  FiPackage,
  FiArrowRight,
  FiDownload,
} from "react-icons/fi";
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import Button from "../../components/common/Button";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import orderService from "../../services/orderService";

const OrderConfirmationPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrder();
  }, []);

  const loadOrder = async () => {
    try {
      // Get order ID from navigation state
      const orderId = location.state?.orderId;

      if (!orderId) {
        navigate("/orders");
        return;
      }

      // Fetch order details
      const orderData = await orderService.getOrder(orderId);
      setOrder(orderData);
    } catch (error) {
      console.error("Error loading order:", error);
      alert("Error loading order details");
      navigate("/orders");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto max-w-4xl px-4 py-20">
          <LoadingSpinner size="lg" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto max-w-4xl px-4 py-12">
        {/* Success Animation */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", duration: 0.6 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full mb-6">
            <FiCheckCircle className="text-green-600 text-5xl" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Order Confirmed!
          </h1>
          <p className="text-lg text-gray-600">
            Thank you for your purchase. Your order has been received.
          </p>
        </motion.div>

        {/* Order Details Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-lg p-8 mb-6"
        >
          {/* Order Info */}
          <div className="flex justify-between items-start mb-8 pb-6 border-b">
            <div>
              <p className="text-sm text-gray-600 mb-1">Order Number</p>
              <p className="text-xl font-bold text-gray-900">{order.orderId}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 mb-1">Order Date</p>
              <p className="font-semibold text-gray-900">
                {new Date(order.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>

          {/* Estimated Delivery */}
          <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-pink-500 rounded-full flex items-center justify-center">
                <FiPackage className="text-white text-xl" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Estimated Delivery</p>
                <p className="text-lg font-bold text-gray-900">
                  {new Date(order.estimatedDelivery).toLocaleDateString(
                    "en-US",
                    {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    }
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="mb-6">
            <h3 className="font-bold text-lg text-gray-900 mb-4">
              Order Items
            </h3>
            <div className="space-y-4">
              {order.items.map((item, index) => (
                <div key={index} className="flex gap-4">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-20 h-20 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">
                      {item.title}
                    </h4>
                    <p className="text-sm text-gray-600">
                      Quantity: {item.quantity}
                    </p>
                    <p className="text-pink-600 font-semibold">
                      Rs. {(item.price * item.quantity).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="border-t pt-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-900">
                Total Amount
              </span>
              <span className="text-2xl font-bold text-pink-600">
                Rs. {order.totalAmount.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="mt-6 pt-6 border-t">
            <h3 className="font-bold text-gray-900 mb-3">Shipping Address</h3>
            <p className="text-gray-700">{order.shippingAddress.street}</p>
            <p className="text-gray-700">
              {order.shippingAddress.city}, {order.shippingAddress.state}
            </p>
            <p className="text-gray-700">
              {order.shippingAddress.postalCode},{" "}
              {order.shippingAddress.country}
            </p>
          </div>

          {/* Payment Method */}
          <div className="mt-4">
            <h3 className="font-bold text-gray-900 mb-2">Payment Method</h3>
            <p className="text-gray-700 capitalize">{order.paymentMethod}</p>
            <p className="text-sm text-gray-600">
              Status:{" "}
              <span className="text-green-600 font-semibold">
                {order.paymentStatus}
              </span>
            </p>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate("/orders")}
            className="flex-1"
          >
            <FiPackage /> View All Orders
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => navigate("/")}
            className="flex-1"
          >
            Continue Shopping <FiArrowRight />
          </Button>
          <Button variant="outline" size="lg" onClick={() => window.print()}>
            <FiDownload /> Print Receipt
          </Button>
        </motion.div>

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-8 text-center text-gray-600"
        >
          <p className="mb-2">
            A confirmation email has been sent to your registered email address.
          </p>
          <p>
            Need help?{" "}
            <a
              href="/contact"
              className="text-pink-600 hover:text-pink-700 font-medium"
            >
              Contact Support
            </a>
          </p>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
};

export default OrderConfirmationPage;
