import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  // FiShoppingCart,
  FiUser,
  FiMenu,
  FiX,
  // FiHeart,
  // FiSearch,
  FiLogOut,
} from "react-icons/fi";
import { useLocation, useNavigate } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const cartItemsCount = 0; // Will come from context later
  const location = useLocation();
  const isSeller = location.pathname.includes("/seller");
  const isAdmin = location.pathname.includes("/admin");

  const isAuthenticated = localStorage.getItem("token");
  const sellerOptions = [
    ...(!isAuthenticated
      ? [
          {
            link: "/seller/login",
            title: "Login",
          },
          {
            link: "/seller/register",
            title: "Register",
          },
        ]
      : []),
    {
      link: "/seller/dashboard",
      title: "Dashboard",
    },
    {
      link: "/seller/products",
      title: "Products",
    },
    {
      link: "/seller/orders",
      title: "Orders",
    },
  ];
  const userOptions = [
    {
      link: "/",
      title: "Home",
    },
    {
      link: "/shop",
      title: "Shop",
    },
    {
      link: "/cart",
      title: "Cart",
    },
    {
      link: "/profile",
      title: "Profile",
    },
    {
      link: "/about",
      title: "About Us",
    },
        {
      link: "/orders",
      title: "Track Orders",
    },
    
  ];
  const adminOptions = [
    {
      link: "/admin/dashboard",
      title: "Dashboard",
    },
    {
      link: "/admin/users",
      title: "User Management",
    },
    {
      link: "/admin/verifications",
      title: "Verifications",
    },
    {
      link: "/admin/reports",
      title: "Reports",
    },
  ];

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            onClick={() => navigate("/")}
            className="flex items-center cursor-pointer"
          >
            <div className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
              CraftKart
            </div>
          </motion.div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            {isAdmin
              ? adminOptions.map((option) => (
                  <a
                    href={option.link}
                    className="text-gray-700 hover:text-pink-600 font-medium transition"
                  >
                    {option.title}
                  </a>
                ))
              : isSeller
              ? sellerOptions.map((option) => (
                  <a
                    href={option.link}
                    className="text-gray-700 hover:text-pink-600 font-medium transition"
                  >
                    {option.title}
                  </a>
                ))
              : userOptions.map((option) => (
                  <a
                    href={option.link}
                    className="text-gray-700 hover:text-pink-600 font-medium transition"
                  >
                    {option.title}
                  </a>
                ))}
          </div>

          {/* Right Icons */}
          <div className="flex items-center space-x-4">
            {/* <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 hover:bg-pink-50 rounded-full transition"
            >
              <FiSearch className="text-xl text-gray-700" />
            </motion.button> */}

            {/* Wishlist */}
            {/* <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 hover:bg-pink-50 rounded-full transition"
            >
              <FiHeart className="text-xl text-gray-700" />
            </motion.button> */}

            {/* Cart */}
            {/* <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate("/cart")}
              className="relative p-2 hover:bg-pink-50 rounded-full transition"
            >
              <FiShoppingCart className="text-xl text-gray-700" />
              {cartItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cartItemsCount}
                </span>
              )}
            </motion.button> */}

            {/* User */}
            {/* <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate("/")}
              className="p-2 hover:bg-pink-50 rounded-full transition"
            >
              <FiUser className="text-xl text-gray-700" />
            </motion.button> */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                if (isAuthenticated) {
                  // logout
                  localStorage.removeItem("token"); // remove token
                  navigate("/login"); // redirect to login page
                } else {
                  navigate("/login"); // redirect to login if not logged in
                }
              }}
              className="p-2 hover:bg-pink-50 rounded-full transition"
            >
              {isAuthenticated ? (
                <FiLogOut className="text-xl text-gray-700" />
              ) : (
                <FiUser className="text-xl text-gray-700" />
              )}
            </motion.button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2"
            >
              {isOpen ? (
                <FiX className="text-2xl" />
              ) : (
                <FiMenu className="text-2xl" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden py-4 border-t"
          >
            <a
              href="/"
              className="block py-2 text-gray-700 hover:text-pink-600"
            >
              Home
            </a>
            <a
              href="/shop"
              className="block py-2 text-gray-700 hover:text-pink-600"
            >
              Shop
            </a>
            <a
              href="/categories"
              className="block py-2 text-gray-700 hover:text-pink-600"
            >
              Categories
            </a>
            <a
              href="/about"
              className="block py-2 text-gray-700 hover:text-pink-600"
            >
              About
            </a>
          </motion.div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
