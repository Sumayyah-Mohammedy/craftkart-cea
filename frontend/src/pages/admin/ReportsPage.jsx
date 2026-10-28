import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FiDownload, FiTrendingUp } from "react-icons/fi";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import Button from "../../components/common/Button";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import adminService from "../../services/adminService";

const ReportsPage = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const data = await adminService.getAnalytics();
      setAnalytics(data);
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  // Mock revenue data for chart
  const revenueData = [
    { month: "Jan", revenue: 45000, orders: 45 },
    { month: "Feb", revenue: 52000, orders: 52 },
    { month: "Mar", revenue: 48000, orders: 48 },
    { month: "Apr", revenue: 61000, orders: 61 },
    { month: "May", revenue: 55000, orders: 55 },
    { month: "Jun", revenue: 67000, orders: 67 },
    { month: "Jul", revenue: 87000, orders: 69 },
    { month: "Aug", revenue: 45000, orders: 44 },
    { month: "Sep", revenue: 81000, orders: 65 },
    { month: "Oct", revenue: 89000, orders: 71 },
    { month: "Nov", revenue: 95000, orders: 89 },
  ];

  const handleExportReport = () => {
    // Create CSV content
    const csvContent = `
Platform Analytics Report
Generated: ${new Date().toLocaleDateString()}

Total Users: ${analytics?.users || 0}
Total Orders: ${analytics?.orders || 0}
Total Revenue: Rs. ${(analytics?.revenue || 0).toLocaleString()}
Active Sellers: ${analytics?.sellers || 0}
Total Products: ${analytics?.products || 0}
    `.trim();

    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `craftKart-report-${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
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
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">
            Reports & Analytics
          </h1>
          <Button variant="primary" onClick={handleExportReport}>
            <FiDownload /> Export Report
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-6 shadow-md"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600">Total Revenue</span>
              <FiTrendingUp className="text-green-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              Rs. {(analytics?.revenue || 0).toLocaleString()}
            </p>
            <p className="text-sm text-green-600 mt-2">+12% from last month</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl p-6 shadow-md"
          >
            <span className="text-gray-600 block mb-2">Total Orders</span>
            <p className="text-3xl font-bold text-gray-900">
              {analytics?.orders || 0}
            </p>
            <p className="text-sm text-green-600 mt-2">+8% from last month</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl p-6 shadow-md"
          >
            <span className="text-gray-600 block mb-2">Active Sellers</span>
            <p className="text-3xl font-bold text-gray-900">
              {analytics?.sellers || 0}
            </p>
            <p className="text-sm text-green-600 mt-2">+15 new this month</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl p-6 shadow-md"
          >
            <span className="text-gray-600 block mb-2">Avg Order Value</span>
            <p className="text-3xl font-bold text-gray-900">
              Rs.{" "}
              {analytics?.orders > 0
                ? Math.round(
                    analytics.revenue / analytics.orders
                  ).toLocaleString()
                : 0}
            </p>
            <p className="text-sm text-green-600 mt-2">+5% from last month</p>
          </motion.div>
        </div>

        {/* Revenue Chart */}
        <div className="bg-white rounded-xl p-6 shadow-md mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Revenue Trend
          </h2>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#E91E63"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="orders"
                stroke="#9C27B0"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top Performers */}
        {/* <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Top Sellers
            </h2>
            <div className="space-y-3">
              {["Fatima Boutique", "Ayesha Crafts", "Sara's Shop"].map(
                (seller, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                  >
                    <span className="font-medium">{seller}</span>
                    <span className="text-pink-600 font-bold">
                      Rs. {(50000 - idx * 5000).toLocaleString()}
                    </span>
                  </div>
                )
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Top Categories
            </h2>
            <div className="space-y-3">
              {["Fashion", "Beauty", "Handmade"].map((category, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                >
                  <span className="font-medium">{category}</span>
                  <span className="text-purple-600 font-bold">
                    {400 - idx * 100} products
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div> */}
      </div>

      <Footer />
    </div>
  );
};

export default ReportsPage;
