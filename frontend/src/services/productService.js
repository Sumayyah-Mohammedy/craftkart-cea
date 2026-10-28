  // PURPOSE: Product-related APIs

  import api from "./api";

  const productService = {
    // Get all products with filters
    getProducts: async (params = {}) => {
      try {
        const queryString = new URLSearchParams(params).toString();
        const response = await api.get(`/products?${queryString}`);
        return response.data;
      } catch (error) {
        throw error;
      }
    },

    // Get single product by slug
    getProduct: async (slug) => {
      try {
        const response = await api.get(`/products/${slug}`);
        return response.data.product;
      } catch (error) {
        throw error;
      }
    },

    // Get single product by ID
    getProductById: async (id) => {
      try {
        const response = await api.get(`/products/${id}`);
        return response.data.product;
      } catch (error) {
        throw error;
      }
    },

    // Search products
    searchProducts: async (searchTerm, filters = {}) => {
      try {
        const params = {
          search: searchTerm,
          ...filters,
        };
        return await productService.getProducts(params);
      } catch (error) {
        throw error;
      }
    },

    // Filter products by category
    getProductsByCategory: async (category, params = {}) => {
      try {
        return await productService.getProducts({
          category,
          ...params,
        });
      } catch (error) {
        throw error;
      }
    },

    // Get featured products
    getFeaturedProducts: async () => {
      try {
        return await productService.getProducts({
          limit: 8,
          sort: "-rating",
        });
      } catch (error) {
        throw error;
      }
    },

    // ========== SELLER ROUTES ==========

    // Create product (seller only)
    createProduct: async (productData) => {
      try {
        const response = await api.post("/products", productData);
        return response.data.product;
      } catch (error) {
        throw error;
      }
    },

    // Update product (seller only)
    updateProduct: async (productId, productData) => {
      try {
        const response = await api.put(`/products/${productId}`, productData);
        return response.data.product;
      } catch (error) {
        throw error;
      }
    },

    // Delete product (seller only)
    deleteProduct: async (productId) => {
      try {
        const response = await api.delete(`/products/${productId}`);
        return response;
      } catch (error) {
        throw error;
      }
    },

    // Get seller's products
    getMyProducts: async (params = {}) => {
      try {
        const queryString = new URLSearchParams(params).toString();
        const response = await api.get(
          `/products/seller/my-products?${queryString}`
        );
        return response.data;
      } catch (error) {
        throw error;
      }
    },

    // Upload product images
    uploadProductImages: async (productId, images) => {
      try {
        const formData = new FormData();
        images.forEach((image) => {
          formData.append("images", image);
        });

        const response = await api.post(
          `/products/${productId}/images`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        return response.data;
      } catch (error) {
        throw error;
      }
    },
  };

  export default productService;
