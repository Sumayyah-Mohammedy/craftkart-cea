

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FiSearch, FiX } from "react-icons/fi";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import Button from "../../components/common/Button";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import adminService from "../../services/adminService";

const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  /** Final applied filters */
  const [filters, setFilters] = useState({
    role: "all",
    search: "",
  });

  /** Pending (user selected but not applied) */
  const [pendingFilters, setPendingFilters] = useState({
    role: "all",
  });

  /** Search input separate */
  const [searchInput, setSearchInput] = useState("");

  const [pagination, setPagination] = useState({});

  useEffect(() => {
    loadUsers();
  }, [filters]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const params = {};

      if (filters.role !== "all") params.role = filters.role;
      if (filters.search) params.search = filters.search;

      const data = await adminService.getUsers(params);

      setUsers(data.users || []);
      setPagination(data.pagination || {});
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setLoading(false);
    }
  };

  /** Apply Search */
  const applySearch = () => {
    setFilters((prev) => ({
      ...prev,
      search: searchInput,
    }));
  };

  /** Apply Filters */
  const applyFilters = () => {
    setFilters((prev) => ({
      ...prev,
      role: pendingFilters.role,
    }));
  };

  /** Clear Everything */
  const clearAll = () => {
    setSearchInput("");

    setPendingFilters({
      role: "all",
    });

    setFilters({
      role: "all",
      search: "",
    });
  };

  const handleSuspend = async (userId, currentStatus) => {
    if (
      !window.confirm(
        `Are you sure you want to ${
          currentStatus ? "unsuspend" : "suspend"
        } this user?`
      )
    ) {
      return;
    }

    try {
      await adminService.suspendUser(userId, !currentStatus);
      loadUsers();
    } catch (error) {
      alert("Error updating user status: " + error);
    }
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      buyer: "bg-blue-100 text-blue-600",
      seller: "bg-purple-100 text-purple-600",
      admin: "bg-gray-100 text-gray-600",
    };
    return colors[role] || "bg-gray-100 text-gray-600";
  };

  const getStatusBadgeColor = (isSuspended) => {
    return isSuspended
      ? "bg-red-100 text-red-600"
      : "bg-green-100 text-green-600";
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
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          User Management
        </h1>

        {/* Filters */}
        <div className="bg-white rounded-xl p-6 shadow-md mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Field */}
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Search Button */}
            <Button
              onClick={applySearch}
              className="px-4 py-3 bg-purple-500 text-white rounded-lg"
            >
              Search
            </Button>

            {/* Role Dropdown */}
            <select
              value={pendingFilters.role}
              onChange={(e) =>
                setPendingFilters((prev) => ({
                  ...prev,
                  role: e.target.value,
                }))
              }
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Users</option>
              <option value="buyer">Buyers</option>
              <option value="seller">Sellers</option>
              <option value="admin">Admins</option>
            </select>

            {/* Apply Filters */}
            <Button
              onClick={applyFilters}
              className="px-4 py-3 bg-purple-500 text-white rounded-lg"
            >
              Apply Filters
            </Button>

            {/* Clear All */}
            <Button variant="ghost" onClick={clearAll}>
              <FiX /> Clear
            </Button>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-4 px-6 text-gray-600 font-semibold">
                  Name
                </th>
                <th className="text-left py-4 px-6 text-gray-600 font-semibold">
                  Email
                </th>
                <th className="text-left py-4 px-6 text-gray-600 font-semibold">
                  Role
                </th>
                <th className="text-left py-4 px-6 text-gray-600 font-semibold">
                  Status
                </th>
                <th className="text-left py-4 px-6 text-gray-600 font-semibold">
                  Joined
                </th>
                <th className="text-right py-4 px-6 text-gray-600 font-semibold">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, idx) => (
                <motion.tr
                  key={user._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="border-t hover:bg-gray-50"
                >
                  <td className="py-4 px-6 font-medium">{user.name}</td>
                  <td className="py-4 px-6 text-gray-600">{user.email}</td>
                  <td className="py-4 px-6">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${getRoleBadgeColor(
                        user.role
                      )}`}
                    >
                      {user.role.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(
                        user.isSuspended
                      )}`}
                    >
                      {user.isSuspended ? "SUSPENDED" : "ACTIVE"}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-gray-600">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-6 text-right">
                    {user.role !== "admin" && (
                      <button
                        onClick={() =>
                          handleSuspend(user._id, user.isSuspended)
                        }
                        className={`px-3 py-1 rounded text-sm font-medium ${
                          user.isSuspended
                            ? "bg-green-100 text-green-600 hover:bg-green-200"
                            : "bg-red-100 text-red-600 hover:bg-red-200"
                        }`}
                      >
                        {user.isSuspended ? "Unsuspend" : "Suspend"}
                      </button>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>

          {users.length === 0 && (
            <div className="text-center py-12 text-gray-500">No users found</div>
          )}
        </div>

        {/* Pagination Summary */}
        {pagination.total > 0 && (
          <div className="mt-4 text-center text-gray-600">
            Showing {users.length} of {pagination.total} users
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default UserManagementPage;
