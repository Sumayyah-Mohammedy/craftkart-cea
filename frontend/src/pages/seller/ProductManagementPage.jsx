import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiEye,
  FiPackage,
  FiX,
  FiUpload,
  FiImage,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import productService from "../../services/productService";
import { supabase } from "../../db/supabase";

const ProductManagementPage = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // 'add' or 'edit'
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    price: "",
    stock: "",
    images: [],
    variants: [],
    features: [],
    tags: [],
    status: "draft",
  });

  // Variant form state
  const [variantForm, setVariantForm] = useState({
    sku: "",
    size: "",
    color: "",
    price: "",
    stock: "",
  });

  const categories = [
    "Fashion",
    "Kitchenware",
    "Accessories",
    "Home Decor",
    "Jewellery",
    "Personal Care",
    "Stationary",
    "Others"
  ];
  const statusOptions = ["draft", "active", "inactive"];

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await productService.getMyProducts();
      setProducts(data.products || []);
    } catch (error) {
      console.error("Error loading products:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      category: "",
      price: "",
      stock: "",
      images: [],
      variants: [],
      features: [],
      tags: [],
      status: "draft",
    });
    setVariantForm({
      sku: "",
      size: "",
      color: "",
      price: "",
      stock: "",
    });
    setSelectedProduct(null);
  };

  const handleOpenAddModal = () => {
    resetForm();
    setModalMode("add");
    setShowModal(true);
  };

  const handleOpenEditModal = (product) => {
    setSelectedProduct(product);
    setModalMode("edit");
    setFormData({
      title: product.title || "",
      description: product.description || "",
      category: product.category || "",
      price: product.price || "",
      stock: product.stock || "",
      images: product.images || [],
      variants: product.variants || [],
      features: product.features || [],
      tags: product.tags || [],
      status: product.status || "draft",
    });
    setShowModal(true);
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    const uploadedUrls = [];

    for (const file of files) {
      const ext = file.name.split(".").pop();
      const fileName = `${crypto.randomUUID()}.${ext}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(process.env.REACT_APP_BUCKET_NAME)
        .upload(fileName, file);

      if (uploadError) {
        console.error("Upload Error:", uploadError);
        alert("Error uploading image");
        continue;
      }

      const { data: urlData } = supabase.storage
        .from(process.env.REACT_APP_BUCKET_NAME)
        .getPublicUrl(uploadData.path);

      uploadedUrls.push(urlData.publicUrl);
    }

    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, ...uploadedUrls],
    }));
  };

  const handleRemoveImage = (index) => {
    setFormData({
      ...formData,
      images: formData.images.filter((_, i) => i !== index),
    });
  };

  const handleAddVariant = () => {
    if (!variantForm.sku || !variantForm.size) {
      alert("Please fill in SKU and Size");
      return;
    }

    const newVariant = {
      sku: variantForm.sku,
      size: variantForm.size,
      color: variantForm.color,
      price: parseFloat(variantForm.price) || parseFloat(formData.price),
      stock: parseInt(variantForm.stock) || 0,
    };

    setFormData({
      ...formData,
      variants: [...formData.variants, newVariant],
    });

    // Reset variant form
    setVariantForm({
      sku: "",
      size: "",
      color: "",
      price: "",
      stock: "",
    });
  };

  const handleRemoveVariant = (index) => {
    setFormData({
      ...formData,
      variants: formData.variants.filter((_, i) => i !== index),
    });
  };

  const handleAddFeature = () => {
    const feature = prompt("Enter a product feature:");
    if (feature) {
      setFormData({
        ...formData,
        features: [...formData.features, feature],
      });
    }
  };

  const handleRemoveFeature = (index) => {
    setFormData({
      ...formData,
      features: formData.features.filter((_, i) => i !== index),
    });
  };

  const handleAddTag = () => {
    const tag = prompt("Enter a tag:");
    if (tag) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tag],
      });
    }
  };

  const handleRemoveTag = (index) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((_, i) => i !== index),
    });
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      alert("Product title is required");
      return false;
    }
    if (!formData.description.trim()) {
      alert("Product description is required");
      return false;
    }
    if (!formData.category) {
      alert("Please select a category");
      return false;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      alert("Please enter a valid price");
      return false;
    }
    if (formData.images.length === 0) {
      alert("Please add at least one product image");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSaving(true);

    try {
      const productData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock) || 0,
        images: formData.images,
        variants: formData.variants,
        features: formData.features,
        tags: formData.tags,
        status: formData.status,
      };
      console.log(productData);

      if (modalMode === "add") {
        await productService.createProduct(productData);
        alert("Product added successfully!");
      } else {
        await productService.updateProduct(selectedProduct._id, productData);
        alert("Product updated successfully!");
      }

      setShowModal(false);
      resetForm();
      loadProducts(); // Reload products
    } catch (error) {
      console.error("Error saving product:", error);
      alert("Error saving product: " + error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (productId, productTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${productTitle}"?`)) {
      return;
    }

    try {
      await productService.deleteProduct(productId);
      alert("Product deleted successfully!");
      loadProducts(); // Reload products
    } catch (error) {
      alert("Error deleting product: " + error);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      active: "bg-green-100 text-green-600",
      draft: "bg-gray-100 text-gray-600",
      inactive: "bg-yellow-100 text-yellow-600",
      outofstock: "bg-red-100 text-red-600",
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              My Products
            </h1>
            <p className="text-gray-600">Manage your product inventory</p>
          </div>
          <Button variant="primary" onClick={handleOpenAddModal}>
            <FiPlus /> Add New Product
          </Button>
        </div>

        {products.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-md">
            <FiPackage className="text-6xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No products yet
            </h3>
            <p className="text-gray-600 mb-6">
              Start by adding your first product
            </p>
            <Button variant="primary" onClick={handleOpenAddModal}>
              <FiPlus /> Add Product
            </Button>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-4 px-6 text-gray-600 font-semibold">
                    Product
                  </th>
                  <th className="text-left py-4 px-6 text-gray-600 font-semibold">
                    Category
                  </th>
                  <th className="text-left py-4 px-6 text-gray-600 font-semibold">
                    Price
                  </th>
                  <th className="text-left py-4 px-6 text-gray-600 font-semibold">
                    Stock
                  </th>
                  <th className="text-left py-4 px-6 text-gray-600 font-semibold">
                    Status
                  </th>
                  <th className="text-right py-4 px-6 text-gray-600 font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {products.map((product, idx) => (
                  <motion.tr
                    key={product._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="border-t hover:bg-gray-50"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            product.images?.[0] ||
                            "https://via.placeholder.com/80"
                          }
                          alt={product.title}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                        <div className="max-w-xs">
                          <span className="font-medium block truncate">
                            {product.title}
                          </span>
                          <span className="text-xs text-gray-500">
                            ID: {product._id.slice(-8)}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-gray-600">
                      {product.category}
                    </td>
                    <td className="py-4 px-6 font-semibold text-pink-600">
                      Rs. {product.price?.toLocaleString()}
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={
                          product.stock === 0
                            ? "text-red-600 font-semibold"
                            : ""
                        }
                      >
                        {product.stock} units
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                          product.status
                        )}`}
                      >
                        {product.status?.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() =>
                            navigate(`/product/${product.slug || product._id}`)
                          }
                          className="p-2 hover:bg-gray-100 rounded-lg"
                          title="View"
                        >
                          <FiEye className="text-gray-600" />
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(product)}
                          className="p-2 hover:bg-gray-100 rounded-lg"
                          title="Edit"
                        >
                          <FiEdit className="text-blue-600" />
                        </button>
                        <button
                          onClick={() =>
                            handleDelete(product._id, product.title)
                          }
                          className="p-2 hover:bg-gray-100 rounded-lg"
                          title="Delete"
                        >
                          <FiTrash2 className="text-red-600" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Add/Edit Product Modal */}
        <AnimatePresence>
          {showModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              >
                {/* Modal Header */}
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {modalMode === "add" ? "Add New Product" : "Edit Product"}
                  </h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <FiX size={24} />
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                  {/* Basic Information */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Basic Information
                    </h3>

                    <Input
                      label="Product Title"
                      type="text"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      placeholder="Enter product title"
                      required
                    />

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description <span className="text-pink-500">*</span>
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            description: e.target.value,
                          })
                        }
                        rows="4"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                        placeholder="Describe your product..."
                        required
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Category <span className="text-pink-500">*</span>
                        </label>
                        <select
                          value={formData.category}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              category: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                          required
                        >
                          <option value="">Select Category</option>
                          {categories.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Status <span className="text-pink-500">*</span>
                        </label>
                        <select
                          value={formData.status}
                          onChange={(e) => {
                            console.log(e.target.value);
                            setFormData({
                              ...formData,
                              status: e.target.value,
                            });
                          }}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                        >
                          {statusOptions.map((status) => (
                            <option key={status} value={status}>
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                      <Input
                        label="Price (Rs)"
                        type="number"
                        value={formData.price}
                        onChange={(e) =>
                          setFormData({ ...formData, price: e.target.value })
                        }
                        placeholder="0"
                        min="0"
                        step="0.01"
                        required
                      />

                      <Input
                        label="Stock Quantity"
                        type="number"
                        value={formData.stock}
                        onChange={(e) =>
                          setFormData({ ...formData, stock: e.target.value })
                        }
                        placeholder="0"
                        min="0"
                      />
                    </div>
                  </div>

                  {/* Product Images */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Product Images
                    </h3>

                    <div className="mb-4">
                      <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-pink-500 transition">
                        <div className="text-center">
                          <FiUpload className="text-3xl text-gray-400 mx-auto mb-2" />
                          <span className="text-sm text-gray-600">
                            Click to upload images
                          </span>
                        </div>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {formData.images.length > 0 && (
                      <div className="grid grid-cols-4 gap-4">
                        {formData.images.map((image, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={image}
                              alt={`Product ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(index)}
                              className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                            >
                              <FiX size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Variants */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Product Variants (Optional)
                    </h3>

                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                      <div className="grid md:grid-cols-5 gap-3">
                        <Input
                          label="SKU"
                          type="text"
                          value={variantForm.sku}
                          onChange={(e) =>
                            setVariantForm({
                              ...variantForm,
                              sku: e.target.value,
                            })
                          }
                          placeholder="SKU-001"
                        />
                        <Input
                          label="Size"
                          type="text"
                          value={variantForm.size}
                          onChange={(e) =>
                            setVariantForm({
                              ...variantForm,
                              size: e.target.value,
                            })
                          }
                          placeholder="S/M/L"
                        />
                        <Input
                          label="Color"
                          type="text"
                          value={variantForm.color}
                          onChange={(e) =>
                            setVariantForm({
                              ...variantForm,
                              color: e.target.value,
                            })
                          }
                          placeholder="Red/Blue"
                        />
                        <Input
                          label="Price"
                          type="number"
                          value={variantForm.price}
                          onChange={(e) =>
                            setVariantForm({
                              ...variantForm,
                              price: e.target.value,
                            })
                          }
                          placeholder="Optional"
                        />
                        <Input
                          label="Stock"
                          type="number"
                          value={variantForm.stock}
                          onChange={(e) =>
                            setVariantForm({
                              ...variantForm,
                              stock: e.target.value,
                            })
                          }
                          placeholder="0"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddVariant}
                        className="mt-2"
                      >
                        <FiPlus /> Add Variant
                      </Button>
                    </div>

                    {formData.variants.length > 0 && (
                      <div className="space-y-2">
                        {formData.variants.map((variant, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="text-sm">
                              <span className="font-medium">{variant.sku}</span>{" "}
                              -<span className="ml-2">{variant.size}</span>
                              {variant.color && (
                                <span className="ml-2 text-gray-600">
                                  ({variant.color})
                                </span>
                              )}
                              <span className="ml-2 text-pink-600">
                                Rs. {variant.price}
                              </span>
                              <span className="ml-2 text-gray-600">
                                Stock: {variant.stock}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveVariant(index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <FiX />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Features */}
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Features (Optional)
                      </h3>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleAddFeature}
                      >
                        <FiPlus /> Add Feature
                      </Button>
                    </div>

                    {formData.features.length > 0 && (
                      <div className="space-y-2">
                        {formData.features.map((feature, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <span className="text-sm">{feature}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveFeature(index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <FiX />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Tags (Optional)
                      </h3>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleAddTag}
                      >
                        <FiPlus /> Add Tag
                      </Button>
                    </div>

                    {formData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {formData.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-2 px-3 py-1 bg-pink-100 text-pink-600 rounded-full text-sm"
                          >
                            {tag}
                            <button
                              type="button"
                              onClick={() => handleRemoveTag(index)}
                              className="hover:text-pink-700"
                            >
                              <FiX size={14} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Form Actions */}
                  <div className="flex gap-4 pt-6 border-t">
                    <Button
                      type="submit"
                      variant="primary"
                      fullWidth
                      disabled={saving}
                    >
                      {saving
                        ? "Saving..."
                        : modalMode === "add"
                        ? "Add Product"
                        : "Update Product"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      fullWidth
                      onClick={() => setShowModal(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Footer />
    </div>
  );
};

export default ProductManagementPage;
