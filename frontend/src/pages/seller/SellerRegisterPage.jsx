import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  FiUser,
  FiMail,
  FiLock,
  FiUpload,
  FiShoppingBag,
  FiPhone,
} from "react-icons/fi";
import { useNavigate, Link } from "react-router-dom";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import authService from "../../services/authService";
import sellerService from "../../services/sellerService";
import { supabase } from "../../db/supabase";

const SellerRegisterPage = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    // Step 1: Account Info
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    // Step 2: Business Info
    businessName: "",
    cnic: "",
    shopDescription: "",
    // Step 3: Documents
    cnicImages: [],
    selfie: null,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };
  const handleFileUpload = async (field, files) => {
    const uploadedUrls = [];

    // Convert FileList → array
    const fileArray = Array.from(files);

    for (const file of fileArray) {
      const ext = file.name.split(".").pop();
      const fileName = `${crypto.randomUUID()}.${ext}`;

      // Upload file
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(process.env.REACT_APP_DOCS_BUCKET)
        .upload(fileName, file);

      if (uploadError) {
        console.error("Upload Error:", uploadError);
        alert("Error uploading file");
        continue;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(process.env.REACT_APP_DOCS_BUCKET)
        .getPublicUrl(uploadData.path);

      uploadedUrls.push(urlData.publicUrl);
    }

    // Save to form depending on field
    if (field === "cnicImages") {
      setFormData((prev) => ({
        ...prev,
        cnicImages: uploadedUrls,
      }));
    }

    if (field === "selfie") {
      setFormData((prev) => ({
        ...prev,
        selfie: uploadedUrls[0], // only one file
      }));
    }
  };

  const validateStep1 = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = "Name is required";
    if (!formData.email) newErrors.email = "Email is required";
    if (!formData.phone) newErrors.phone = "Phone is required";
    if (!formData.password || formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    return newErrors;
  };

  const validateStep2 = () => {
    const newErrors = {};
    if (!formData.businessName)
      newErrors.businessName = "Business name is required";
    if (!formData.cnic) newErrors.cnic = "CNIC is required";
    if (!formData.shopDescription)
      newErrors.shopDescription = "Shop description is required";
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (currentStep === 1) {
      const newErrors = validateStep1();
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      const newErrors = validateStep2();
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      // Final submission
      setIsLoading(true);
      setErrors({});

      try {
        // Step 1: Register user
        await authService.register({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          role: "seller",
        });

        // Step 2: Submit verification
        await sellerService.submitVerification({
          businessName: formData.businessName,
          cnic: formData.cnic,
          shopDescription: formData.shopDescription,
          cnicImages: formData.cnicImages,
          selfie: formData.selfie,
        });

        alert(
          "Registration successful! Your verification is pending approval."
        );
        navigate("/seller/dashboard");
      } catch (error) {
        setErrors({
          general: error || "Registration failed. Please try again.",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50 py-12 px-4">
      <div className="container mx-auto max-w-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl text-white font-bold">K</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Become a Seller
          </h1>
          <p className="text-gray-600">
            Start your business journey with CraftKart
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center">
            {[1, 2, 3].map((step, idx) => (
              <React.Fragment key={step}>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                      currentStep >= step
                        ? "bg-purple-500 text-white"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {step}
                  </div>
                  <span
                    className={`text-xs ${
                      currentStep >= step
                        ? "text-purple-600 font-medium"
                        : "text-gray-500"
                    }`}
                  >
                    {step === 1
                      ? "Account"
                      : step === 2
                      ? "Business"
                      : "Documents"}
                  </span>
                </div>
                {idx < 2 && (
                  <div
                    className={`h-1 w-16 mx-2 ${
                      currentStep > step ? "bg-purple-500" : "bg-gray-200"
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {errors.general && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Step 1: Account Info */}
            {currentStep === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Account Information
                </h2>
                <Input
                  label="Full Name"
                  icon={FiUser}
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  error={errors.name}
                  required
                />
                <Input
                  label="Email"
                  type="email"
                  icon={FiMail}
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  error={errors.email}
                  required
                />
                <Input
                  label="Phone"
                  icon={FiPhone}
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="03XXXXXXXXX"
                  error={errors.phone}
                  required
                />
                <Input
                  label="Password"
                  type="password"
                  icon={FiLock}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  error={errors.password}
                  required
                />
                <Input
                  label="Confirm Password"
                  type="password"
                  icon={FiLock}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  error={errors.confirmPassword}
                  required
                />
              </motion.div>
            )}

            {/* Step 2: Business Info */}
            {currentStep === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Business Information
                </h2>
                <Input
                  label="Business Name"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleChange}
                  error={errors.businessName}
                  required
                />
                <Input
                  label="CNIC Number"
                  placeholder="12345-1234567-1"
                  name="cnic"
                  value={formData.cnic}
                  onChange={handleChange}
                  error={errors.cnic}
                  required
                />
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Shop Description <span className="text-pink-500">*</span>
                  </label>
                  <textarea
                    name="shopDescription"
                    value={formData.shopDescription}
                    onChange={handleChange}
                    rows="4"
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      errors.shopDescription
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    placeholder="Tell buyers about your business..."
                    required
                  />
                  {errors.shopDescription && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.shopDescription}
                    </p>
                  )}
                </div>
              </motion.div>
            )}

            {/* Step 3: Documents */}
            {/* {currentStep === 3 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Upload Documents
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CNIC Front & Back <span className="text-red-500">*</span>
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-500 transition cursor-pointer">
                      <FiUpload className="text-3xl text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600 mb-2">
                        Click to upload or drag and drop
                      </p>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) =>
                          handleFileUpload("cnicImages", e.target.files)
                        }
                        className="hidden"
                        id="cnic-upload"
                      />
                      <label
                        htmlFor="cnic-upload"
                        className="text-purple-600 font-medium cursor-pointer"
                      >
                        Choose Files
                      </label>
                      {formData.cnicImages.length > 0 && (
                        <p className="text-sm text-green-600 mt-2">
                          {formData.cnicImages.length} file(s) selected
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Selfie with CNIC <span className="text-red-500">*</span>
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-500 transition cursor-pointer">
                      <FiUpload className="text-3xl text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600 mb-2">
                        Upload your selfie holding CNIC
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          handleFileUpload("selfie", e.target.files)
                        }
                        className="hidden"
                        id="selfie-upload"
                      />
                      <label
                        htmlFor="selfie-upload"
                        className="text-purple-600 font-medium cursor-pointer"
                      >
                        Choose File
                      </label>
                      {formData.selfie && (
                        <p className="text-sm text-green-600 mt-2">
                          File selected: {formData.selfie.name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> Your documents will be reviewed
                    within 24-48 hours. You'll receive an email notification
                    once approved.
                  </p>
                </div>
              </motion.div>
            )} */}
            {/* Step 3: Documents */}
            {currentStep === 3 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Upload Documents
                </h2>

                <div className="space-y-4">
                  {/* CNIC Images */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CNIC Front & Back <span className="text-red-500">*</span>
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-500 transition cursor-pointer relative">
                      <FiUpload className="text-3xl text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600 mb-2">
                        Click to upload or drag and drop
                      </p>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) =>
                          handleFileUpload("cnicImages", e.target.files)
                        }
                        className="hidden"
                        id="cnic-upload"
                      />
                      <label
                        htmlFor="cnic-upload"
                        className="text-purple-600 font-medium cursor-pointer"
                      >
                        Choose Files
                      </label>

                      {/* Thumbnails */}
                      {formData.cnicImages.length > 0 && (
                        <div className="absolute bottom-2 left-2 flex gap-2">
                          {formData.cnicImages.map((url, idx) => (
                            <img
                              key={idx}
                              src={url}
                              alt={`CNIC ${idx + 1}`}
                              className="w-16 h-16 object-cover rounded border border-gray-300"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Selfie */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Selfie with CNIC <span className="text-red-500">*</span>
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-500 transition cursor-pointer relative">
                      <FiUpload className="text-3xl text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600 mb-2">
                        Upload your selfie holding CNIC
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          handleFileUpload("selfie", e.target.files)
                        }
                        className="hidden"
                        id="selfie-upload"
                      />
                      <label
                        htmlFor="selfie-upload"
                        className="text-purple-600 font-medium cursor-pointer"
                      >
                        Choose File
                      </label>

                      {/* Thumbnail */}
                      {formData.selfie && (
                        <div className="absolute bottom-2 left-2">
                          <img
                            src={formData.selfie}
                            alt="Selfie"
                            className="w-16 h-16 object-cover rounded border border-gray-300"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> Your documents will be reviewed
                    within 24-48 hours. You'll receive an email notification
                    once approved.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-4 mt-8">
              {/* {currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep((prev) => prev - 1)}
                  fullWidth
                >
                  Back
                </Button>
              )} */}
              <Button
                type="submit"
                variant="primary"
                fullWidth
                disabled={isLoading}
              >
                {isLoading
                  ? "Submitting..."
                  : currentStep === 3
                  ? "Submit for Verification"
                  : "Continue"}
              </Button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{" "}
              <Link
                to="/seller/login"
                className="text-purple-600 font-semibold hover:text-purple-700"
              >
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerRegisterPage;
