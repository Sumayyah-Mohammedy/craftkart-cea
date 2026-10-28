import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FiHeart,
  FiShoppingCart,
  FiStar,
  FiTruck,
  FiShield,
  FiCheck,
} from "react-icons/fi";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import Button from "../../components/common/Button";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import productService from "../../services/productService";
import cartService from "../../services/cartService";
import authService from "../../services/authService";

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(null);

  // Load product on mount
  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    try {
      const data = await productService.getProductById(id);
      setProduct(data);

      // Set default variant if available
      if (data.variants && data.variants.length > 0) {
        setSelectedVariant(data.variants[0]);
      }
    } catch (error) {
      console.error("Error loading product:", error);
      alert("Product not found");
      navigate("/shop");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    // Check if user is logged in
    if (!authService.isAuthenticated()) {
      if (
        window.confirm("Please login to add items to cart. Go to login page?")
      ) {
        navigate("/login");
      }
      return;
    }

    setAddingToCart(true);

    try {
      await cartService.addToCart(
        product._id,
        selectedVariant?.sku || null,
        quantity
      );

      alert("Added to cart successfully!");

      // Optionally redirect to cart
      // navigate('/cart');
    } catch (error) {
      console.error("Error adding to cart:", error);
      alert("Error adding to cart: " + error);
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    await handleAddToCart();
    navigate("/checkout", {
      state: { fromProductId: product._id },
    });
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

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto max-w-7xl px-4 py-20 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Product Not Found
          </h2>
          <Button onClick={() => navigate("/shop")}>Back to Shop</Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto max-w-7xl px-4 py-8">
        {/* Breadcrumb */}
        <div className="mb-6 text-sm text-gray-600">
          <a href="/" className="hover:text-pink-600">
            Home
          </a>
          <span className="mx-2">/</span>
          <a href="/shop" className="hover:text-pink-600">
            Shop
          </a>
          <span className="mx-2">/</span>
          <span className="text-gray-900">{product.title}</span>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Images Section */}
          <div>
            {/* Main Image */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-2xl overflow-hidden mb-4 aspect-square"
            >
              <img
                src={
                  product.images[selectedImage] ||
                  "https://via.placeholder.com/600"
                }
                alt={product.title}
                className="w-full h-full object-cover"
              />
            </motion.div>

            {/* Thumbnail Images */}
            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {product.images.map((img, idx) => (
                  <motion.button
                    key={idx}
                    whileHover={{ scale: 1.05 }}
                    onClick={() => setSelectedImage(idx)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 ${
                      selectedImage === idx
                        ? "border-pink-500"
                        : "border-gray-200"
                    }`}
                  >
                    <img
                      src={img}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </motion.button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            {/* Title & Rating */}
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {product.title}
            </h1>

            <div className="flex items-center gap-4 mb-6">
              {/* <div className="flex items-center gap-1">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <FiStar
                      key={i}
                      className={
                        i < Math.floor(product.rating || 0)
                          ? "fill-current"
                          : ""
                      }
                    />
                  ))}
                </div>
                <span className="text-gray-900 font-semibold ml-1">
                  {product.rating?.toFixed(1) || "0.0"}
                </span>
              </div> */}
              {/* <span className="text-gray-600">
                ({product.reviewsCount || 0} reviews)
              </span> */}
              {/* <span className="text-gray-600">•</span> */}
              <span className="text-gray-600">
                {product.soldCount || 0} sold
              </span>
            </div>

            {/* Price */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-4xl font-bold text-pink-600">
                  Rs. {product.price?.toLocaleString()}
                </span>
                {product.discount && (
                  <>
                    <span className="text-xl text-gray-400 line-through">
                      Rs.{" "}
                      {(
                        product.price *
                        (1 + product.discount / 100)
                      ).toLocaleString()}
                    </span>
                    <span className="bg-pink-100 text-pink-600 px-3 py-1 rounded-full font-semibold">
                      {product.discount}% OFF
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Category */}
            <div className="mb-4">
              <span className="text-sm text-gray-600">Category: </span>
              <span className="text-sm font-semibold text-pink-600">
                {product.category}
              </span>
            </div>

            {/* Description */}
            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-2">Description</h3>
              <p className="text-gray-700 leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Variants */}
            {product.variants && product.variants.length > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Select Variant:
                </label>
                <div className="flex gap-3 flex-wrap">
                  {product.variants.map((variant) => (
                    <motion.button
                      key={variant.sku}
                      whileHover={{ scale: variant.stock > 0 ? 1.05 : 1 }}
                      whileTap={{ scale: variant.stock > 0 ? 0.95 : 1 }}
                      onClick={() =>
                        variant.stock > 0 && setSelectedVariant(variant)
                      }
                      disabled={variant.stock === 0}
                      className={`px-6 py-3 rounded-lg border-2 font-semibold transition ${
                        selectedVariant?.sku === variant.sku
                          ? "border-pink-500 bg-pink-50 text-pink-600"
                          : variant.stock > 0
                          ? "border-gray-300 hover:border-pink-500"
                          : "border-gray-200 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      <div>{variant.size || variant.color}</div>
                      {variant.stock === 0 && (
                        <div className="text-xs">Out of Stock</div>
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Quantity:
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-lg border-2 border-gray-300 hover:border-pink-500 flex items-center justify-center font-semibold"
                >
                  -
                </button>
                <span className="w-16 text-center text-lg font-semibold">
                  {quantity}
                </span>
                <button
                  onClick={() =>
                    setQuantity(Math.min(product.stock, quantity + 1))
                  }
                  className="w-10 h-10 rounded-lg border-2 border-gray-300 hover:border-pink-500 flex items-center justify-center font-semibold"
                >
                  +
                </button>
                <span className="text-sm text-gray-600 ml-2">
                  ({product.stock} available)
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 mb-8">
              <Button
                variant="primary"
                size="lg"
                onClick={handleBuyNow}
                className="flex-1"
                disabled={addingToCart || product.stock === 0}
              >
                <FiShoppingCart />
                {product.stock === 0 ? "Out of Stock" : "Buy Now"}
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={handleAddToCart}
                className="flex-1"
                disabled={addingToCart || product.stock === 0}
              >
                {addingToCart ? "Adding..." : "Add to Cart"}
              </Button>
              {/* <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="w-14 h-14 rounded-lg border-2 border-pink-500 text-pink-500 flex items-center justify-center"
              >
                <FiHeart size={24} />
              </motion.button> */}
            </div>

            {/* Features */}
            <div className="bg-gray-100 rounded-xl p-6 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                    <FiTruck className="text-pink-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Free Delivery</div>
                    <div className="text-xs text-gray-600">
                      On orders above Rs. 2000
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <FiShield className="text-purple-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">7 Days Return</div>
                    <div className="text-xs text-gray-600">
                      Easy return policy
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Product Features */}
            {product.features && product.features.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-lg mb-3">
                  Product Features:
                </h3>
                <ul className="space-y-2">
                  {product.features.map((feature, idx) => (
                    <li
                      key={idx}
                      className="flex items-center gap-2 text-gray-700"
                    >
                      <FiCheck className="text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Seller Info */}
            <div className="border-t pt-6">
              <h3 className="font-semibold text-lg mb-4">Seller Information</h3>
              <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">
                      {product.sellerId?.name || "Seller"}
                    </span>
                    <span className="bg-green-100 text-green-600 text-xs px-2 py-1 rounded-full">
                      ✓ Verified
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    ⭐ 4.8 • 50+ products
                  </div>
                </div>
                {/* <Button variant="outline" size="sm">
                  View Shop
                </Button> */}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ProductDetailPage;
