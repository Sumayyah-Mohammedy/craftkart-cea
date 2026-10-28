import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FiMapPin, FiCreditCard, FiCheck } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import orderService from "../../services/orderService";
import cartService from "../../services/cartService";
import stripeService from "../../services/stripeService";

const CheckoutPage = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState(null);
  const [totals, setTotals] = useState({});

  // Form state
  const [shippingAddress, setShippingAddress] = useState({
    street: "",
    city: "",
    state: "Sindh",
    postalCode: "",
    country: "Pakistan",
  });

  const [paymentMethod, setPaymentMethod] = useState("card");
  const [cardDetails, setCardDetails] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardName: "",
  });

  const steps = [
    { number: 1, title: "Shipping", icon: FiMapPin },
    { number: 2, title: "Payment", icon: FiCreditCard },
    { number: 3, title: "Review", icon: FiCheck },
  ];

  // Load cart on mount
  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      const cartData = await cartService.getCart();

      if (!cartData || !cartData.items || cartData.items.length === 0) {
        alert("Your cart is empty!");
        navigate("/cart");
        return;
      }

      setCart(cartData);
      setTotals(cartService.calculateTotals(cartData));
    } catch (error) {
      console.error("Error loading cart:", error);
      alert("Error loading cart. Please try again.");
      navigate("/cart");
    } finally {
      setLoading(false);
    }
  };

  const handleAddressSubmit = (e) => {
    e.preventDefault();

    // Validate address
    if (
      !shippingAddress.street ||
      !shippingAddress.city ||
      !shippingAddress.postalCode
    ) {
      alert("Please fill in all required fields");
      return;
    }

    setCurrentStep(2);
  };

  // const handlePlaceOrder = async () => {
  //   setIsProcessing(true);

  //   try {
  //     // Validate cart
  //     if (!cart || cart.items.length === 0) {
  //       alert("Your cart is empty!");
  //       navigate("/cart");
  //       return;
  //     }

  //     // Create order data
  //     const orderData = {
  //       items: cart.items.map((item) => ({
  //         productId: item.productId._id,
  //         quantity: item.quantity,
  //         variantSku: item.variantSku,
  //       })),
  //       shippingAddress: shippingAddress,
  //       paymentMethod: paymentMethod,
  //     };

  //     // Create order
  //     const order = await orderService.createOrder(orderData);

  //     // Success! Navigate to confirmation
  //     navigate("/order-confirmation", {
  //       state: {
  //         orderId: order._id,
  //         orderNumber: order.orderId,
  //       },
  //     });
  //   } catch (error) {
  //     console.error("Order error:", error);
  //     alert("Error placing order: " + error);
  //   } finally {
  //     setIsProcessing(false);
  //   }
  // };
  const handlePlaceOrder = async () => {
    if (!cart || cart.items.length === 0) {
      alert("Your cart is empty!");
      navigate("/cart");
      return;
    }

    if (paymentMethod === "card") {
      try {
        setIsProcessing(true);

        // Call the API
        const response = await stripeService.createStripeSession();

        // Debug: Log the response
        console.log("Stripe session created:", response);

        // Check if we got a URL
        if (!response || !response.url) {
          throw new Error("No checkout URL received from server");
        }

        // Redirect to Stripe checkout
        window.location.href = response.url;
      } catch (err) {
        console.error("Stripe checkout failed:", err);
        alert("Payment failed: " + (err.message || "Please try again"));
        setIsProcessing(false);
      }
    } else {
      // COD or JazzCash
      try {
        setIsProcessing(true);
        const orderData = {
          items: cart.items.map((item) => ({
            productId: item.productId._id,
            quantity: item.quantity,
            variantSku: item.variantSku,
          })),
          shippingAddress,
          paymentMethod,
        };

        const order = await orderService.createOrder(orderData);
        navigate("/order-confirmation", {
          state: {
            orderId: order._id,
            orderNumber: order.orderId,
          },
        });
      } catch (err) {
        console.error("Order error:", err);
        alert("Error placing order: " + err);
      } finally {
        setIsProcessing(false);
      }
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
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Checkout</h1>

        {/* Progress Steps */}
        <div className="mb-12">
          <div className="flex items-center justify-center">
            {steps.map((step, idx) => (
              <React.Fragment key={step.number}>
                <div className="flex flex-col items-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                      currentStep >= step.number
                        ? "bg-pink-500 text-white"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    <step.icon size={20} />
                  </motion.div>
                  <span
                    className={`text-sm font-medium ${
                      currentStep >= step.number
                        ? "text-pink-600"
                        : "text-gray-500"
                    }`}
                  >
                    {step.title}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div
                    className={`h-1 w-24 mx-4 ${
                      currentStep > step.number ? "bg-pink-500" : "bg-gray-200"
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Step 1: Shipping Address */}
            {currentStep === 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl p-8 shadow-md"
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Shipping Address
                </h2>
                <form onSubmit={handleAddressSubmit}>
                  <div className="space-y-4">
                    <Input
                      label="Street Address"
                      type="text"
                      value={shippingAddress.street}
                      onChange={(e) =>
                        setShippingAddress({
                          ...shippingAddress,
                          street: e.target.value,
                        })
                      }
                      placeholder="House #, Street, Area"
                      required
                    />
                    <div className="grid md:grid-cols-2 gap-4">
                      <Input
                        label="City"
                        type="text"
                        value={shippingAddress.city}
                        onChange={(e) =>
                          setShippingAddress({
                            ...shippingAddress,
                            city: e.target.value,
                          })
                        }
                        required
                      />
                      <Input
                        label="State"
                        type="text"
                        value={shippingAddress.state}
                        onChange={(e) =>
                          setShippingAddress({
                            ...shippingAddress,
                            state: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <Input
                        label="Postal Code"
                        type="text"
                        value={shippingAddress.postalCode}
                        onChange={(e) =>
                          setShippingAddress({
                            ...shippingAddress,
                            postalCode: e.target.value,
                          })
                        }
                        required
                      />
                      <Input
                        label="Country"
                        type="text"
                        value={shippingAddress.country}
                        disabled
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    variant="primary"
                    className="mt-6"
                    fullWidth
                  >
                    Continue to Payment
                  </Button>
                </form>
              </motion.div>
            )}

            {/* Step 2: Payment Method */}
            {currentStep === 2 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl p-8 shadow-md"
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Payment Method
                </h2>

                <div className="space-y-4 mb-6">
                  {/* Card Payment */}
                  <label
                    className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition ${
                      paymentMethod === "card"
                        ? "border-pink-500 bg-pink-50"
                        : "border-gray-200"
                    }`}
                  >
                    <input
                      type="radio"
                      value="card"
                      checked={paymentMethod === "card"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-5 h-5 text-pink-600"
                    />
                    <div className="ml-4 flex-1">
                      <div className="font-semibold text-gray-900">
                        Credit/Debit Card
                      </div>
                      <div className="text-sm text-gray-600">
                        Pay with Visa, Mastercard
                      </div>
                    </div>
                  </label>

                  {/* JazzCash */}
                  {/* <label className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition ${
                    paymentMethod === 'jazzcash' ? 'border-pink-500 bg-pink-50' : 'border-gray-200'
                  }`}>
                    <input
                      type="radio"
                      value="jazzcash"
                      checked={paymentMethod === 'jazzcash'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-5 h-5 text-pink-600"
                    />
                    <div className="ml-4">
                      <div className="font-semibold text-gray-900">JazzCash</div>
                      <div className="text-sm text-gray-600">Pay with JazzCash mobile wallet</div>
                    </div>
                  </label> */}

                  {/* Cash on Delivery */}
                  <label
                    className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition ${
                      paymentMethod === "cod"
                        ? "border-pink-500 bg-pink-50"
                        : "border-gray-200"
                    }`}
                  >
                    <input
                      type="radio"
                      value="cod"
                      checked={paymentMethod === "cod"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-5 h-5 text-pink-600"
                    />
                    <div className="ml-4">
                      <div className="font-semibold text-gray-900">
                        Cash on Delivery
                      </div>
                      <div className="text-sm text-gray-600">
                        Pay when you receive your order
                      </div>
                    </div>
                  </label>
                </div>

                {paymentMethod === "card" && (
                  <div className="space-y-4 mb-6">
                    <div className="grid grid-cols-2 gap-4"></div>
                  </div>
                )}

                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(1)}
                    fullWidth
                  >
                    Back
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => setCurrentStep(3)}
                    fullWidth
                  >
                    Review Order
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Review Order */}
            {currentStep === 3 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl p-8 shadow-md"
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Review Your Order
                </h2>

                {/* Shipping Details */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Shipping To:
                  </h3>
                  <p className="text-gray-700">{shippingAddress.street}</p>
                  <p className="text-gray-700">
                    {shippingAddress.city}, {shippingAddress.state}
                  </p>
                  <p className="text-gray-700">
                    {shippingAddress.postalCode}, {shippingAddress.country}
                  </p>
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="text-pink-600 text-sm mt-2"
                  >
                    Edit Address
                  </button>
                </div>

                {/* Payment Method */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Payment Method:
                  </h3>
                  <p className="text-gray-700">
                    {paymentMethod === "card" && "Credit/Debit Card"}
                    {paymentMethod === "jazzcash" && "JazzCash"}
                    {paymentMethod === "cod" && "Cash on Delivery"}
                  </p>
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="text-pink-600 text-sm mt-2"
                  >
                    Change Payment
                  </button>
                </div>

                {/* Order Items */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Order Items:
                  </h3>
                  <div className="space-y-3">
                    {cart &&
                      cart.items.map((item) => (
                        <div
                          key={item._id}
                          className="flex gap-3 p-3 bg-gray-50 rounded-lg"
                        >
                          <img
                            src={item.productId.images[0]}
                            alt={item.productId.title}
                            className="w-16 h-16 rounded object-cover"
                          />
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">
                              {item.productId.title}
                            </h4>
                            <p className="text-xs text-gray-600">
                              Qty: {item.quantity}
                            </p>
                          </div>
                          <p className="font-semibold text-pink-600">
                            Rs.{" "}
                            {(
                              item.productId.price * item.quantity
                            ).toLocaleString()}
                          </p>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Terms */}
                <div className="mb-6">
                  <label className="flex items-start">
                    <input
                      type="checkbox"
                      className="mt-1 w-4 h-4 text-pink-600"
                      required
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      I agree to the terms and conditions and return policy
                    </span>
                  </label>
                </div>

                <Button
                  variant="primary"
                  fullWidth
                  size="lg"
                  onClick={handlePlaceOrder}
                  disabled={isProcessing}
                >
                  {isProcessing
                    ? "Processing..."
                    : `Place Order - Rs. ${totals.total
                        ?.toFixed(0)
                        .toLocaleString()}`}
                </Button>
              </motion.div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div>
            <div className="bg-white rounded-xl p-6 shadow-md sticky top-24">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Order Summary
              </h3>

              {/* Cart Items */}
              {cart && (
                <>
                  <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
                    {cart.items.map((item) => (
                      <div key={item._id} className="flex gap-3">
                        <img
                          src={item.productId.images[0]}
                          alt={item.productId.title}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900 line-clamp-2">
                            {item.productId.title}
                          </h4>
                          <p className="text-sm text-gray-600">
                            Qty: {item.quantity}
                          </p>
                          <p className="text-sm font-semibold text-pink-600">
                            Rs.{" "}
                            {(
                              item.productId.price * item.quantity
                            ).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Price Breakdown */}
                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between text-gray-700">
                      {/* <span>Subtotal</span> */}
                      <span className="text-lg font-bold text-gray-900">
                        Total
                      </span>
                      <span className="text-2xl font-bold text-pink-600">
                        Rs. {totals.subtotal?.toLocaleString()}
                      </span>
                      {/* <span>Rs. {totals.subtotal?.toLocaleString()}</span> */}
                    </div>
                    <div className="flex justify-between text-gray-700">
                      {/* <span>Shipping</span>
                      <span>Rs. {totals.shipping?.toLocaleString()}</span> */}
                    </div>
                    <div className="flex justify-between text-gray-700">
                      {/* <span>Tax</span>
                      <span>Rs. {totals.tax?.toFixed(0).toLocaleString()}</span> */}
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between items-center"></div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default CheckoutPage;
