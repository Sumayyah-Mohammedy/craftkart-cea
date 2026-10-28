import React from "react";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import { motion } from "framer-motion";
import { FiHeart, FiUsers, FiTrendingUp } from "react-icons/fi";

const AboutPage = () => {
  const fadeInUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  const stagger = {
    hidden: {},
    visible: {
      transition: { staggerChildren: 0.2 },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-24 pb-28 px-4 text-center">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="container mx-auto max-w-4xl"
        >
          <h1 className="text-5xl font-bold text-gray-900 font-['Poppins']">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-700 to-purple-500">
              About Us
            </span>
          </h1>

          <p className="text-lg text-gray-600 mt-6 leading-relaxed">
            Empowering women entrepreneurs through a dedicated digital marketplace.
            We are dedicated to building a digital marketplace that empowers
            women across Pakistan by providing them a platform to showcase their
            skills, creativity, and talent. Every product tells a story and
            every purchase supports a dream.
          </p>
        </motion.div>
      </section>

      {/* Mission / Vision Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto max-w-6xl px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid md:grid-cols-3 gap-10"
          >
            {/* Card 1 */}
            <motion.div
              variants={fadeInUp}
              className="bg-gradient-to-br from-pink-50 to-purple-50 p-8 rounded-2xl shadow-lg text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <FiHeart className="text-white text-3xl" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3 font-['Poppins']">
                Our Mission
              </h3>
              <p className="text-gray-600">
                To empower home-based women entrepreneurs by offering them a
                platform to sell their handcrafted products nationwide.
              </p>
            </motion.div>

            {/* Card 2 */}
            <motion.div
              variants={fadeInUp}
              className="bg-gradient-to-br from-purple-50 to-pink-50 p-8 rounded-2xl shadow-lg text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <FiUsers className="text-white text-3xl" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3 font-['Poppins']">
                Our Community
              </h3>
              <p className="text-gray-600">
                A strong community of talented women, and dedicated buyers
                all working together to support local businesses.
              </p>
            </motion.div>

            {/* Card 3 */}
            <motion.div
              variants={fadeInUp}
              className="bg-gradient-to-br from-pink-50 to-purple-50 p-8 rounded-2xl shadow-lg text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <FiTrendingUp className="text-white text-3xl" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3 font-['Poppins']">
                Our Vision
              </h3>
              <p className="text-gray-600">
                To build Pakistan’s first-ever online marketplace dedicated to
                uplifting women entrepreneurs and expanding their businesses.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-center">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="container mx-auto max-w-3xl px-4"
        >
          <h2 className="text-4xl font-bold mb-4 font-['Poppins']">
            Join Our Mission
          </h2>
          <p className="text-lg opacity-90 mb-8">
            Support talented Pakistani women and help them grow their businesses
            through our platform.
          </p>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
};

export default AboutPage;