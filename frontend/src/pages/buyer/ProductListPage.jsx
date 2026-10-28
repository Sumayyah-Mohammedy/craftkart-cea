
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FiFilter, FiGrid, FiSearch, FiX } from "react-icons/fi";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import ProductCard from "../../components/buyer/ProductCard";
import Button from "../../components/common/Button";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import productService from "../../services/productService";

const ProductListPage = () => {
  const [viewMode, setViewMode] = useState("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [currentPage, setCurrentPage] = useState(1);

  /** Search */
  const [searchInput, setSearchInput] = useState("");

  /** Final filters used in API calls */
  const [filters, setFilters] = useState({
    search: "",
    category: "",
    minPrice: "",
    maxPrice: "",
    sort: "newest",
  });

  /** Pending filters (user selects these before clicking Apply) */
  const [pendingFilters, setPendingFilters] = useState({
    category: "",
    minPrice: "",
    maxPrice: "",
    sort: "newest",
  });

  const categories = [
    "Fashion",
    "Home Decor",
    "Jewellery",
    "Kitchenware",
    "Accessories",
    "Personsal Care",
    "Stationary",
    "Others",
  ];

  /** Reset page to 1 whenever real filters change */
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  /** Load products whenever filters or page changes */
  useEffect(() => {
    loadProducts();
  }, [filters, currentPage]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const params = {
        search: filters.search,
        category: filters.category,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        sort: getSortValue(filters.sort),
        page: currentPage,
        limit: 20,
      };

      Object.keys(params).forEach((key) => {
        if (!params[key]) delete params[key];
      });

      const data = await productService.getProducts(params);
      setProducts(data.products || []);
      setPagination(data.pagination || {});
    } catch (error) {
      console.error("Error loading products:", error);
    } finally {
      setLoading(false);
    }
  };

  const getSortValue = (sort) => {
    const map = {
      newest: "-createdAt",
      "price-low": "price",
      "price-high": "-price",
      popular: "-soldCount",
    };
    return map[sort] || "-createdAt";
  };

  /** Apply search */
  const applySearch = () => {
    setFilters((prev) => ({
      ...prev,
      search: searchInput,
    }));
  };

  /** Apply filters button */
  const applyFilters = () => {
    setFilters((prev) => ({
      ...prev,
      category: pendingFilters.category,
      minPrice: pendingFilters.minPrice,
      maxPrice: pendingFilters.maxPrice,
      sort: pendingFilters.sort,
    }));
  };

  /** Clear everything */
  const clearFilters = () => {
    setSearchInput("");

    setPendingFilters({
      category: "",
      minPrice: "",
      maxPrice: "",
      sort: "newest",
    });

    setFilters({
      search: "",
      category: "",
      minPrice: "",
      maxPrice: "",
      sort: "newest",
    });
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNextPage = () => {
    if (currentPage < pagination.pages) {
      setCurrentPage(currentPage + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Shop All Products</h1>
          <p className="text-gray-600">
            Discover unique handmade products from talented sellers
          </p>
        </div>

        {/* Search & Filters */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
              />
            </div>

            {/* Search Button */}
            <Button
              onClick={applySearch}
              className="px-4 py-3 bg-pink-500 text-white rounded-lg"
            >
              Search
            </Button>

            {/* Sort Dropdown */}
            <select
              value={pendingFilters.sort}
              onChange={(e) =>
                setPendingFilters((prev) => ({
                  ...prev,
                  sort: e.target.value,
                }))
              }
              className="px-4 py-3 border border-gray-300 rounded-lg"
            >
              <option value="newest">Newest First</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="popular">Most Popular</option>
            </select>

            {/* Grid View */}
            <button
              onClick={() => setViewMode("grid")}
              className={`p-3 rounded-lg border ${
                viewMode === "grid"
                  ? "bg-pink-500 text-white border-pink-500"
                  : "bg-white text-gray-600 border-gray-300"
              }`}
            >
              <FiGrid size={20} />
            </button>

            {/* Filters Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-3 border rounded-lg"
            >
              <FiFilter /> Filters
            </button>
          </div>

          {/* Expandable Filters */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 pt-4 border-t"
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Category */}
                <div>
                  <label className="text-sm mb-2">Category</label>
                  <select
                    value={pendingFilters.category}
                    onChange={(e) =>
                      setPendingFilters((prev) => ({
                        ...prev,
                        category: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Price Range */}
                <div>
                  <label className="text-sm mb-2">Min Price</label>
                  <input
                    type="number"
                    value={pendingFilters.minPrice}
                    onChange={(e) =>
                      setPendingFilters((prev) => ({
                        ...prev,
                        minPrice: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="text-sm mb-2">Max Price</label>
                  <input
                    type="number"
                    value={pendingFilters.maxPrice}
                    onChange={(e) =>
                      setPendingFilters((prev) => ({
                        ...prev,
                        maxPrice: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="5000"
                  />
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <Button
                  onClick={applyFilters}
                  className="bg-pink-500 text-white px-4 py-2 rounded-lg"
                >
                  Apply Filters
                </Button>

                <Button variant="ghost" onClick={clearFilters}>
                  <FiX /> Clear Filters
                </Button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Results Count */}
        <div className="mb-6 text-gray-600">
          Showing{" "}
          <span className="font-semibold">{products.length}</span> products on
          page {currentPage} of {pagination.pages || 1}
        </div>

        {/* Products Grid */}
        {products.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-xl shadow-md">
            <p className="text-lg text-gray-600">No products found</p>
            <p className="text-sm text-gray-500">Try adjusting your filters</p>
          </div>
        ) : (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                : "space-y-4"
            }
          >
            {products.map((product, index) => (
              <motion.div
                key={product._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="mt-12 flex justify-center gap-2">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="px-4 py-2 border rounded-lg disabled:opacity-50"
            >
              Previous
            </button>

            {[...Array(pagination.pages)].map((_, i) => {
              const page = i + 1;
              return (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-4 py-2 rounded-lg ${
                    currentPage === page
                      ? "bg-pink-500 text-white"
                      : "border hover:bg-gray-50"
                  }`}
                >
                  {page}
                </button>
              );
            })}

            <button
              onClick={handleNextPage}
              disabled={currentPage === pagination.pages}
              className="px-4 py-2 border rounded-lg disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default ProductListPage;
