import React, { useState } from "react";
import { motion } from "framer-motion";
import { FiHeart, FiShoppingCart, FiStar } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import cartService from "../../services/cartService";

const ProductCard = ({ product }) => {
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState("");

  const handleAddToCart = async (e) => {
    e.stopPropagation();
    setAdding(true);
    setMessage("");
    try {
      await cartService.addToCart(product._id);
      setMessage("Added to cart!");
      setTimeout(() => setMessage(""), 1500);
    } catch (err) {
      setMessage("Could not add to cart");
      setTimeout(() => setMessage(""), 1500);
    } finally {
      setAdding(false);
    }
  };

  return (
    <motion.div
      whileHover={{ y: -8 }}
      className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow overflow-hidden cursor-pointer"
      onClick={() => navigate(`/product/${product._id}`)}
    >
      {/* Image */}
      <div className="relative h-64 overflow-hidden bg-gray-100">
        <img
          // src={product.image}
          src={product.images?.[0]}
          alt={product.title}
          className="w-full h-full object-cover"
        />

        {/* Sale Badge (if applicable) */}
        {product.discount && (
          <div className="absolute top-3 left-3 bg-pink-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
            {product.discount}% OFF
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Seller Name */}
        <p className="text-xs text-gray-500 mb-1">{product.seller}</p>

        {/* Title */}
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
          {product.title}
        </h3>

        {/* Price and Add to Cart */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-2xl font-bold text-pink-600">
              Rs. {product.price.toLocaleString()}
            </span>
          </div>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleAddToCart}
            className="bg-gradient-to-r from-pink-500 to-purple-600 text-white p-2 rounded-lg"
            disabled={adding}
          >
            <FiShoppingCart />
          </motion.button>
        </div>
        {message && (
          <div className="text-xs text-green-600 mt-2">{message}</div>
        )}
      </div>
    </motion.div>
  );
};

export default ProductCard;
