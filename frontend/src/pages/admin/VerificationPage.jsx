import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FiCheck, FiX, FiDownload, FiImage } from "react-icons/fi";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import Button from "../../components/common/Button";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import adminService from "../../services/adminService";

const VerificationPage = () => {
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVerifications();
  }, []);

  const loadVerifications = async () => {
    try {
      const data = await adminService.getPendingVerifications();
      setVerifications(data);
    } catch (error) {
      console.error("Error loading verifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (profileId) => {
    if (!window.confirm("Are you sure you want to approve this seller?")) {
      return;
    }

    try {
      await adminService.approveVerification(profileId);
      alert("Seller approved successfully!");
      loadVerifications(); // Reload list
    } catch (error) {
      alert("Error approving seller: " + error.message);
    }
  };

  const handleReject = async (profileId) => {
    const reason = window.prompt("Please enter rejection reason:");
    if (!reason) return;

    try {
      await adminService.rejectVerification(profileId, reason);
      alert("Seller verification rejected.");
      loadVerifications(); // Reload list
    } catch (error) {
      alert("Error rejecting seller: " + error.message);
    }
  };

  // Image error handler
  const handleImageError = (e) => {
    e.target.style.display = "none";
    e.target.nextSibling.style.display = "flex";
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
          Seller Verifications
        </h1>

        {verifications.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-md">
            <p className="text-gray-600 text-lg">No pending verifications</p>
          </div>
        ) : (
          <div className="space-y-6">
            {verifications.map((verification, idx) => (
              <motion.div
                key={verification._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white rounded-xl p-6 shadow-md"
              >
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {verification.userId?.name || "Unknown User"}
                    </h3>
                    <p className="text-gray-600">
                      Business: {verification.businessName || "N/A"}
                    </p>
                    <p className="text-gray-600">
                      Email: {verification.userId?.email || "N/A"}
                    </p>
                    <p className="text-gray-600">
                      CNIC: {verification.cnic || "N/A"}
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      Submitted:{" "}
                      {verification.createdAt
                        ? new Date(verification.createdAt).toLocaleDateString()
                        : "Unknown date"}
                    </p>
                  </div>
                  <span className="bg-yellow-100 text-yellow-600 px-3 py-1 rounded-full text-sm font-semibold">
                    PENDING
                  </span>
                </div>

                {/* Documents Section */}
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3">
                    Submitted Documents:
                  </h4>

                  {/* CNIC Images */}
                  <div className="mb-4">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">
                      CNIC Images:
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {verification.cnicImages?.map((doc, idx) => (
                        <div
                          key={idx}
                          className="border-2 border-gray-200 rounded-lg p-4 text-center"
                        >
                          <div className="w-full h-48 bg-gray-100 rounded-lg mb-2 flex items-center justify-center overflow-hidden relative">
                            <img
                              src={doc}
                              alt={`CNIC ${idx + 1}`}
                              className="max-h-full max-w-full object-contain"
                              onError={handleImageError}
                            />
                            <div className="hidden absolute inset-0 flex-col items-center justify-center text-gray-400">
                              <FiImage size={32} />
                              <span className="text-sm mt-2">
                                Image not available
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            CNIC Image {idx + 1}
                          </p>
                          <a
                            href={doc}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 text-sm flex items-center justify-center gap-1 hover:text-blue-800"
                          >
                            <FiDownload size={14} /> View Full Size
                          </a>
                        </div>
                      ))}

                      {/* Fallback if no CNIC images */}
                      {(!verification.cnicImages ||
                        verification.cnicImages.length === 0) && (
                        <div className="col-span-3 text-center py-4 text-gray-500">
                          No CNIC images submitted
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Selfie Image */}
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2">
                      Selfie with CNIC:
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {verification.selfieImage ? (
                        <div className="border-2 border-gray-200 rounded-lg p-4 text-center">
                          <div className="w-full h-48 bg-gray-100 rounded-lg mb-2 flex items-center justify-center overflow-hidden relative">
                            <img
                              src={verification.selfieImage}
                              alt="Selfie with CNIC"
                              className="max-h-full max-w-full object-contain"
                              onError={handleImageError}
                            />
                            <div className="hidden absolute inset-0 flex-col items-center justify-center text-gray-400">
                              <FiImage size={32} />
                              <span className="text-sm mt-2">
                                Image not available
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            Selfie with CNIC
                          </p>
                          <a
                            href={verification.selfieImage}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 text-sm flex items-center justify-center gap-1 hover:text-blue-800"
                          >
                            <FiDownload size={14} /> View Full Size
                          </a>
                        </div>
                      ) : (
                        <div className="text-center py-4 text-gray-500">
                          No selfie image submitted
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Shop Description */}
                {verification.shopDescription && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">
                      Shop Description:
                    </h4>
                    <p className="text-gray-700">
                      {verification.shopDescription}
                    </p>
                  </div>
                )}

                {/* Additional Information */}
                <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Verification ID:</strong> {verification._id}
                  </div>
                  <div>
                    <strong>User ID:</strong>{" "}
                    {verification.userId?._id || "N/A"}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-4">
                  <Button
                    variant="primary"
                    className="flex-1"
                    onClick={() => handleApprove(verification._id)}
                  >
                    <FiCheck /> Approve Seller
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 text-red-600 border-red-600 hover:bg-red-50"
                    onClick={() => handleReject(verification._id)}
                  >
                    <FiX /> Reject
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default VerificationPage;
