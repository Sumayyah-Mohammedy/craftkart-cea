// ============ App.jsx (src/App.jsx) ============
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// Buyer Pages
import HomePage from "./pages/buyer/HomePage";
import LoginPage from "./pages/buyer/LoginPage";
import RegisterPage from "./pages/buyer/RegisterPage";
import ProductListPage from "./pages/buyer/ProductListPage";
import ProductDetailPage from "./pages/buyer/ProductDetailPage";
import CartPage from "./pages/buyer/CartPage";
import CheckoutPage from "./pages/buyer/CheckoutPage";
import OrderConfirmationPage from "./pages/buyer/OrderConfirmationPage";
import OrderTrackingPage from "./pages/buyer/OrderTrackingPage";
import ProfilePage from "./pages/buyer/ProfilePage";
import AboutPage from "./pages/buyer/AboutPage";
import PaymentSuccess from "./pages/buyer/PaymentSuccess";

// Seller Pages
import SellerLoginPage from "./pages/seller/SellerLoginPage";
import SellerRegisterPage from "./pages/seller/SellerRegisterPage";
import SellerDashboard from "./pages/seller/SellerDashboard";
import ProductManagementPage from "./pages/seller/ProductManagementPage";
import OrderManagementPage from "./pages/seller/OrderManagementPage";

// Admin Pages
import AdminLoginPage from "./pages/admin/AdminLoginPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import UserManagementPage from "./pages/admin/UserManagementPage";
import VerificationPage from "./pages/admin/VerificationPage";
import ReportsPage from "./pages/admin/ReportsPage";
import ProtectedRoute from "./components/common/ProtectedRoute";

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* ========== BUYER ROUTES ========== */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/shop" element={<ProductListPage />} />
          <Route path="/product/:id" element={<ProductDetailPage />} />
          <Route
            path="/cart"
            element={
              <ProtectedRoute>
                <CartPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <CheckoutPage />
              </ProtectedRoute>
            }
          />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/payment-failed" element={<PaymentSuccess />} />
          <Route
            path="/order-confirmation"
            element={<OrderConfirmationPage />}
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <OrderTrackingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          {/* ========== SELLER ROUTES ========== */}
          <Route path="/seller/login" element={<SellerLoginPage />} />
          <Route path="/seller/register" element={<SellerRegisterPage />} />
          <Route
            path="/seller/dashboard"
            element={
              <ProtectedRoute>
                <SellerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/seller/products"
            element={
              <ProtectedRoute>
                <ProductManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/seller/orders"
            element={
              <ProtectedRoute>
                <OrderManagementPage />
              </ProtectedRoute>
            }
          />

          {/* ========== ADMIN ROUTES ========== */}
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute>
                <UserManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/verifications"
            element={
              <ProtectedRoute>
                <VerificationPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <ProtectedRoute>
                <ReportsPage />
              </ProtectedRoute>
            }
          />

          {/* 404 - Not Found */}
          <Route
            path="*"
            element={
              <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <h1 className="text-6xl font-bold text-pink-600 mb-4">404</h1>
                  <p className="text-2xl text-gray-900 mb-4">Page Not Found</p>
                  <a
                    href="/"
                    className="text-pink-600 hover:text-pink-700 font-semibold"
                  >
                    Go back to home
                  </a>
                </div>
              </div>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
