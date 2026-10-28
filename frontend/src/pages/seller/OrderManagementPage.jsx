

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiCheck, FiX, FiTruck, FiPackage } from 'react-icons/fi';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import orderService from '../../services/orderService';

const OrderManagementPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadOrders();
  }, [filter]);

  const loadOrders = async () => {
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const data = await orderService.getSellerOrders(params);
      setOrders(data.orders || []);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await orderService.updateOrderStatus(orderId, newStatus);
      alert('Order status updated successfully!');
      loadOrders(); // Reload orders
    } catch (error) {
      alert('Error updating order: ' + error);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-600',
      confirmed: 'bg-blue-100 text-blue-600',
      packed: 'bg-purple-100 text-purple-600',
      shipped: 'bg-indigo-100 text-indigo-600',
      delivered: 'bg-green-100 text-green-600',
      cancelled: 'bg-red-100 text-red-600'
    };
    return colors[status] || 'bg-gray-100 text-gray-600';
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
          <h1 className="text-4xl font-bold text-gray-900">Order Management</h1>
          
          {/* Filter */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Orders</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="packed">Packed</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
          </select>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-md">
            <p className="text-gray-600 text-lg">No orders found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order, idx) => (
              <motion.div
                key={order._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white rounded-xl p-6 shadow-md"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-lg">{order.orderId}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.orderStatus)}`}>
                        {order.orderStatus?.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-1">
                      Customer: <span className="font-medium">{order.buyerId?.name}</span>
                    </p>
                    <p className="text-gray-600 mb-1">
                      Items: {order.items?.length} product(s)
                    </p>
                    <p className="text-sm text-gray-500">
                      Date: {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                    
                    {/* Order Items */}
                    <div className="mt-4 space-y-2">
                      {order.items?.map((item, itemIdx) => (
                        <div key={itemIdx} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                          <img 
                            src={item.image || 'https://via.placeholder.com/50'} 
                            alt={item.title}
                            className="w-12 h-12 object-cover rounded"
                          />
                          <div className="flex-1">
                            <p className="font-medium text-sm">{item.title}</p>
                            <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                          </div>
                          <p className="font-semibold text-pink-600">
                            Rs. {(item.price * item.quantity).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="text-right ml-6">
                    <p className="text-2xl font-bold text-pink-600 mb-4">
                      Rs. {order.totalAmount?.toLocaleString()}
                    </p>
                    
                    {/* Action Buttons */}
                    {order.orderStatus === 'pending' && (
                      <div className="flex gap-2">
                        <Button 
                          variant="primary" 
                          size="sm"
                          onClick={() => handleUpdateStatus(order._id, 'confirmed')}
                        >
                          <FiCheck /> Accept
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-red-600 border-red-600"
                          onClick={() => handleUpdateStatus(order._id, 'cancelled')}
                        >
                          <FiX /> Reject
                        </Button>
                      </div>
                    )}

                    {order.orderStatus === 'confirmed' && (
                      <Button 
                        variant="primary" 
                        size="sm"
                        onClick={() => handleUpdateStatus(order._id, 'packed')}
                      >
                        <FiPackage /> Mark as Packed
                      </Button>
                    )}

                    {order.orderStatus === 'packed' && (
                      <Button 
                        variant="primary" 
                        size="sm"
                        onClick={() => handleUpdateStatus(order._id, 'shipped')}
                      >
                        <FiTruck /> Mark as Shipped
                      </Button>
                    )}

                    {order.orderStatus === 'shipped' && (
                      <Button 
                        variant="primary" 
                        size="sm"
                        onClick={() => handleUpdateStatus(order._id, 'delivered')}
                      >
                        <FiCheck /> Mark as Delivered
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      
      <Footer />
    </div>
  );
};

export default OrderManagementPage;