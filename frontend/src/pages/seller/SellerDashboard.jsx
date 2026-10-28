import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FiDollarSign,
  FiShoppingBag,
  FiPackage,
  FiTrendingUp,
  FiAlertCircle,
} from "react-icons/fi";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import Button from "../../components/common/Button";
import sellerService from "../../services/sellerService";
import productService from "../../services/productService";
import orderService from "../../services/orderService";

const SellerDashboard = () => {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Mock sales data for chart (will be replaced with real data)
  const [salesData, setSalesData] = useState([
    { name: "Jan", sales: 1 },
    { name: "Feb", sales: 2 },
    { name: "Mar", sales: 3 },
    { name: "Apr", sales: 4 },
    { name: "May", sales: 5 },
    { name: "Jun", sales: 6 },
    { name: "Jul", sales: 4 },
    { name: "Aug", sales: 6 },
    { name: "Sep", sales: 7 },
    { name: "Nov", sales: 8 },
  ]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load dashboard analytics
      const analyticsData = await sellerService.getDashboard();
      setAnalytics(analyticsData);

      // Load recent orders
      const ordersData = await orderService.getSellerOrders({ limit: 5 });
      setRecentOrders(ordersData.orders || []);

      // Load products and filter low stock
      const productsData = await productService.getMyProducts();
      const lowStock = (productsData.products || []).filter(
        (p) => p.stock < 10 && p.stock > 0
      );
      setLowStockProducts(lowStock.slice(0, 5));
    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-600",
      confirmed: "bg-blue-100 text-blue-600",
      packed: "bg-purple-100 text-purple-600",
      shipped: "bg-indigo-100 text-indigo-600",
      delivered: "bg-green-100 text-green-600",
      cancelled: "bg-red-100 text-red-600",
    };
    return colors[status] || "bg-gray-100 text-gray-600";
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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Seller Dashboard
          </h1>
          <p className="text-gray-600">
            Welcome back! Here's your business overview.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Total Revenue */}
          {/* <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
            className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
                <FiDollarSign className="text-pink-600 text-xl" />
              </div>
              <span className="text-sm font-semibold text-green-600">
                {analytics?.revenue?.today > 0
                  ? "+" +
                    (
                      (analytics.revenue.today / analytics.revenue.total) *
                      100
                    ).toFixed(1) +
                    "%"
                  : "0%"}
              </span>
            </div>
            <h3 className="text-gray-600 text-sm mb-1">Total Revenue</h3>
            <p className="text-2xl font-bold text-gray-900">
              Rs. {analytics?.revenue?.total?.toLocaleString() || "0"}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Today: Rs. {analytics?.revenue?.today?.toLocaleString() || "0"}
            </p>
          </motion.div> */}

          {/* Total Orders */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <FiShoppingBag className="text-purple-600 text-xl" />
              </div>
              <span className="text-sm font-semibold text-blue-600">
                {analytics?.orders?.today || 0} today
              </span>
            </div>
            <h3 className="text-gray-600 text-sm mb-1">Total Orders</h3>
            <p className="text-2xl font-bold text-gray-900">
              {analytics?.orders?.total || 0}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Pending: {analytics?.orders?.pending || 0}
            </p>
          </motion.div>

          {/* Active Products */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FiPackage className="text-blue-600 text-xl" />
              </div>
              <span className="text-sm font-semibold text-purple-600">
                {analytics?.products?.total || 0} total
              </span>
            </div>
            <h3 className="text-gray-600 text-sm mb-1">Active Products</h3>
            <p className="text-2xl font-bold text-gray-900">
              {analytics?.products?.active || 0}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              <button
                onClick={() => navigate("/seller/products")}
                className="text-pink-600 hover:text-pink-700"
              >
                Manage Products →
              </button>
            </p>
          </motion.div>

          {/* Pending Orders */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <FiAlertCircle className="text-yellow-600 text-xl" />
              </div>
              <span className="text-sm font-semibold text-yellow-600">
                Action Needed
              </span>
            </div>
            <h3 className="text-gray-600 text-sm mb-1">Pending Orders</h3>
            <p className="text-2xl font-bold text-gray-900">
              {analytics?.orders?.pending || 0}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              <button
                onClick={() => navigate("/seller/orders")}
                className="text-pink-600 hover:text-pink-700"
              >
                View Orders →
              </button>
            </p>
          </motion.div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Sales Chart */}
          <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Sales Overview
              </h2>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FiTrendingUp className="text-green-600" />
                <span>Last 7 days</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke="#E91E63"
                  strokeWidth={3}
                  dot={{ fill: "#E91E63", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Low Stock Alert */}
          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Low Stock Alert
              </h2>
              <FiAlertCircle className="text-yellow-600 text-xl" />
            </div>

            {lowStockProducts.length === 0 ? (
              <div className="text-center py-8">
                <FiPackage className="text-4xl text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">All products in stock</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {lowStockProducts.map((product, idx) => (
                  <motion.div
                    key={product._id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          product.images?.[0] ||
                          "https://via.placeholder.com/40"
                        }
                        alt={product.title}
                        className="w-10 h-10 rounded object-cover"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900 line-clamp-1">
                          {product.title}
                        </p>
                        <p className="text-xs text-gray-600">
                          Stock:{" "}
                          <span className="font-semibold text-yellow-600">
                            {product.stock}
                          </span>
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {lowStockProducts.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                fullWidth
                className="mt-4"
                onClick={() => navigate("/seller/products")}
              >
                Update Stock
              </Button>
            )}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="mt-6 bg-white rounded-xl p-6 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Recent Orders</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/seller/orders")}
            >
              View All →
            </Button>
          </div>

          {recentOrders.length === 0 ? (
            <div className="text-center py-12">
              <FiShoppingBag className="text-6xl text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No orders yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-gray-600 font-semibold">
                      Order ID
                    </th>
                    <th className="text-left py-3 px-4 text-gray-600 font-semibold">
                      Customer
                    </th>
                    <th className="text-left py-3 px-4 text-gray-600 font-semibold">
                      Date
                    </th>
                    <th className="text-left py-3 px-4 text-gray-600 font-semibold">
                      Amount
                    </th>
                    <th className="text-left py-3 px-4 text-gray-600 font-semibold">
                      Status
                    </th>
                    <th className="text-right py-3 px-4 text-gray-600 font-semibold">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order, idx) => (
                    <motion.tr
                      key={order._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="border-b hover:bg-gray-50"
                    >
                      <td className="py-3 px-4 font-medium">{order.orderId}</td>
                      <td className="py-3 px-4">
                        {order.buyerId?.name || "N/A"}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 font-semibold text-pink-600">
                        Rs. {order.totalAmount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                            order.orderStatus
                          )}`}
                        >
                          {order.orderStatus.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/seller/orders`)}
                        >
                          View
                        </Button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-6 grid md:grid-cols-2 gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/seller/products")}
            className="bg-gradient-to-r from-pink-500 to-purple-600 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition"
          >
            <FiPackage className="text-3xl mb-2" />
            <h3 className="font-bold text-lg">Manage Products</h3>
            <p className="text-sm opacity-90">Add, edit or remove products</p>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/seller/orders")}
            className="bg-gradient-to-r from-purple-500 to-pink-600 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition"
          >
            <FiShoppingBag className="text-3xl mb-2" />
            <h3 className="font-bold text-lg">View Orders</h3>
            <p className="text-sm opacity-90">Process customer orders</p>
          </motion.button>

          {/* <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/seller/analytics")}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition"
          >
            <FiTrendingUp className="text-3xl mb-2" />
            <h3 className="font-bold text-lg">Analytics</h3>
            <p className="text-sm opacity-90">View detailed insights</p>
          </motion.button> */}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default SellerDashboard;
