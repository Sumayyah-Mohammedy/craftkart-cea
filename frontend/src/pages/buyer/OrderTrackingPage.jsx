import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FiPackage,
  FiCheck,
  FiTruck,
  FiHome,
  FiX,
  FiMapPin,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import Button from "../../components/common/Button";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import orderService from "../../services/orderService";

const OrderTrackingPage = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const data = await orderService.getOrders({ page: 1, limit: 10 });
      setOrders(data.orders || []);
      setPagination(data.pagination || {});

      // Auto-select first order
      if (data.orders && data.orders.length > 0) {
        setSelectedOrder(data.orders[0]);
      }
    } catch (error) {
      console.error("Error loading orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: FiPackage,
      confirmed: FiCheck,
      packed: FiPackage,
      shipped: FiTruck,
      delivered: FiHome,
      cancelled: FiX,
    };
    return icons[status] || FiPackage;
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto max-w-7xl px-4 py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">My Orders</h1>

        {orders.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-md">
            <FiPackage className="text-6xl text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              No Orders Yet
            </h2>
            <p className="text-gray-600 mb-6">
              Start shopping to see your orders here!
            </p>
            <Button onClick={() => navigate("/shop")}>Start Shopping</Button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Orders List */}
            <div className="lg:col-span-1 space-y-4">
              {orders.map((order, idx) => (
                <motion.div
                  key={order._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  onClick={() => setSelectedOrder(order)}
                  className={`bg-white rounded-xl p-4 cursor-pointer transition ${
                    selectedOrder?._id === order._id
                      ? "ring-2 ring-pink-500 shadow-lg"
                      : "hover:shadow-md"
                  }`}
                >
                  <div className="flex gap-4">
                    <img
                      src={order.items[0].image}
                      alt="Order"
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">
                        {order.orderId}
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        {order.items.length} items
                      </p>
                      <div className="mt-2">
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-medium ${
                            orderService.getStatusColor(order.orderStatus) ===
                            "yellow"
                              ? "bg-yellow-100 text-yellow-600"
                              : orderService.getStatusColor(
                                  order.orderStatus
                                ) === "blue"
                              ? "bg-blue-100 text-blue-600"
                              : orderService.getStatusColor(
                                  order.orderStatus
                                ) === "green"
                              ? "bg-green-100 text-green-600"
                              : orderService.getStatusColor(
                                  order.orderStatus
                                ) === "red"
                              ? "bg-red-100 text-red-600"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {orderService.getStatusLabel(order.orderStatus)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-pink-600">
                        Rs. {order.totalAmount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Order Details */}
            <div className="lg:col-span-2">
              {selectedOrder ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl p-8 shadow-lg"
                >
                  {/* Order Header */}
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {selectedOrder.orderId}
                      </h2>
                      <p className="text-gray-600">
                        Placed on{" "}
                        {new Date(selectedOrder.createdAt).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )}
                      </p>
                    </div>
                    <span
                      className={`px-4 py-2 rounded-full font-semibold ${
                        orderService.getStatusColor(
                          selectedOrder.orderStatus
                        ) === "yellow"
                          ? "bg-yellow-100 text-yellow-600"
                          : orderService.getStatusColor(
                              selectedOrder.orderStatus
                            ) === "blue"
                          ? "bg-blue-100 text-blue-600"
                          : orderService.getStatusColor(
                              selectedOrder.orderStatus
                            ) === "green"
                          ? "bg-green-100 text-green-600"
                          : orderService.getStatusColor(
                              selectedOrder.orderStatus
                            ) === "red"
                          ? "bg-red-100 text-red-600"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {orderService.getStatusLabel(selectedOrder.orderStatus)}
                    </span>
                  </div>

                  {/* Tracking Timeline */}
                  {selectedOrder.statusHistory && (
                    <div className="mb-8">
                      <h3 className="font-bold text-lg text-gray-900 mb-6">
                        Order Status
                      </h3>
                      <div className="relative">
                        {selectedOrder.statusHistory.map((step, idx) => {
                          const StatusIcon = getStatusIcon(step.status);
                          const isCompleted =
                            idx < selectedOrder.statusHistory.length;

                          return (
                            <div
                              key={idx}
                              className="flex gap-4 mb-8 last:mb-0"
                            >
                              {/* Icon */}
                              <div className="relative">
                                <div
                                  className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                    isCompleted
                                      ? "bg-green-500 text-white"
                                      : "bg-gray-200 text-gray-400"
                                  }`}
                                >
                                  <StatusIcon />
                                </div>
                                {idx <
                                  selectedOrder.statusHistory.length - 1 && (
                                  <div
                                    className={`absolute left-1/2 top-12 w-0.5 h-12 -ml-px ${
                                      isCompleted
                                        ? "bg-green-500"
                                        : "bg-gray-200"
                                    }`}
                                  />
                                )}
                              </div>
                              {/* Content */}
                              <div className="flex-1 pt-2">
                                <p className="font-semibold text-gray-900">
                                  {orderService.getStatusLabel(step.status)}
                                </p>
                                {step.timestamp && (
                                  <p className="text-sm text-gray-600">
                                    {new Date(step.timestamp).toLocaleString()}
                                  </p>
                                )}
                                {step.note && (
                                  <p className="text-sm text-gray-600 mt-1">
                                    {step.note}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Order Items */}
                  <div className="mb-6">
                    <h3 className="font-bold text-lg text-gray-900 mb-4">
                      Order Items
                    </h3>
                    <div className="space-y-4">
                      {selectedOrder.items.map((item, index) => (
                        <div
                          key={index}
                          className="flex gap-4 p-4 bg-gray-50 rounded-lg"
                        >
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
                            <p className="text-pink-600 font-semibold mt-1">
                              Rs.{" "}
                              {(item.price * item.quantity).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Shipping Address */}
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                      <FiMapPin /> Shipping Address
                    </h3>
                    <p className="text-gray-700">
                      {selectedOrder.shippingAddress.street}
                    </p>
                    <p className="text-gray-700">
                      {selectedOrder.shippingAddress.city},{" "}
                      {selectedOrder.shippingAddress.state}
                    </p>
                    <p className="text-gray-700">
                      {selectedOrder.shippingAddress.postalCode},{" "}
                      {selectedOrder.shippingAddress.country}
                    </p>
                  </div>

                  {/* Order Summary */}
                  <div className="border-t pt-4">
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-gray-700">
                        <span>Subtotal</span>
                        <span>
                          Rs. {selectedOrder.subtotal.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-gray-700">
                        <span>Shipping</span>
                        <span>
                          Rs. {selectedOrder.shippingCost.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-gray-700">
                        <span>Tax</span>
                        <span>
                          Rs. {selectedOrder.tax.toFixed(0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t">
                      <span className="text-lg font-bold text-gray-900">
                        Total
                      </span>
                      <span className="text-2xl font-bold text-pink-600">
                        Rs. {selectedOrder.totalAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-6 flex gap-4">
                    {selectedOrder.orderStatus === "delivered" && (
                      <Button variant="primary" className="flex-1">
                        Leave Review
                      </Button>
                    )}
                    {(selectedOrder.orderStatus === "pending" ||
                      selectedOrder.orderStatus === "confirmed") && (
                      <Button
                        variant="outline"
                        className="flex-1 text-red-600 border-red-600"
                      >
                        Cancel Order
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      onClick={() => navigate(`/orders/${selectedOrder._id}`)}
                    >
                      View Details
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <div className="bg-white rounded-xl p-12 text-center shadow-md">
                  <FiPackage className="text-6xl text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">
                    Select an order to view tracking details
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default OrderTrackingPage;
