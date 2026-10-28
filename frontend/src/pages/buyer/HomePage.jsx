import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FiShoppingBag, FiUsers, FiTrendingUp, FiHeart, FiStar, FiArrowRight } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import ProductCard from '../../components/buyer/ProductCard';

const HomePage = () => {
  const navigate = useNavigate();
  const [featuredProducts, setFeaturedProducts] = useState([]);

  // Animation variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 60 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const scaleIn = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: { 
      scale: 1, 
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32 px-4">
        {/* Animated Background Shapes */}
        {/* <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-pink-200 to-purple-200 rounded-full opacity-20 blur-3xl"
        /> */}
        {/* <motion.div
          animate={{
            scale: [1, 1.3, 1],
            rotate: [360, 180, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-purple-200 to-pink-200 rounded-full opacity-20 blur-3xl"
        /> */}

        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="grid lg:grid-cols-1 place-items-center text-center">

            
            {/* Left Content */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="text-center "
            >
              {/* <motion.div variants={fadeInUp} className="inline-block">
                <span className="bg-pink-100 text-pink-600 px-4 py-2 rounded-full text-sm font-semibold">
                  Empowering Women Entrepreneurs
                </span>
              </motion.div> */}

              <motion.h1 
                variants={fadeInUp}
                className="text-5xl md:text-6xl font-bold text-gray-900 mt-6 mb-6 font-['Poppins']"
              >
                {/* Shop from Talented  */}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-700 to-purple-500">Shop from Talented Pakistani Women  </span>
                {/* Pakistani Women */}
              </motion.h1>

              <motion.p 
                variants={fadeInUp}
                className="text-xl text-gray-600 mb-8 leading-relaxed"
              >
                Discover unique, handmade products crafted with love by home-based women entrepreneurs. 
                Every purchase supports a dream. 
              </motion.p>

              <motion.div 
                variants={fadeInUp}
                className="flex flex-col sm:flex-row gap-4 justify-center "
              >
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: "0 10px 40px rgba(236, 72, 153, 0.3)" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/shop')}
                  className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-8 py-4 rounded-full font-semibold text-lg shadow-lg flex items-center justify-center gap-2"
                >
                  {/* <FiShoppingBag className="text-xl" /> */}
                  Start Shopping
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/seller/register')}
                  // className="bg-white text-pink-600 border-2 border-pink-500 px-8 py-4 rounded-full font-semibold text-lg flex items-center justify-center gap-2"
                  className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-8 py-4 rounded-full font-semibold text-lg shadow-lg flex items-center justify-center gap-2"
                >
                  Become a Seller
                  {/* <FiArrowRight className="text-xl" /> */}
                </motion.button>
              </motion.div>

              {/* Stats */}
              <motion.div 
                variants={fadeInUp}
                // className="grid grid-cols-3 gap-6 mt-12 justify-center text-center"
                className="grid grid-cols-3 gap-10 mt-10 w-fit mx-auto text-center"

              >
                <div className="text-center">
                  <div className="text-3xl font-bold text-pink-600">500+</div>
                  <div className="text-sm text-gray-600">Products</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">200+</div>
                  <div className="text-sm text-gray-600">Sellers</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-pink-600">1000+</div>
                  <div className="text-sm text-gray-600"> Buyers</div>
                </div> 
              </motion.div>
            </motion.div>

            {/* Right - Hero Image/Animation */}
            
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto max-w-7xl px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4 font-['Poppins']">
              Why Choose Us?
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              We're more than just a marketplace. We're a community supporting women entrepreneurs across Pakistan.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid md:grid-cols-3 gap-8"
          >
            {/* Feature 1 */}
            <motion.div
              variants={scaleIn}
              whileHover={{ y: -10 }}
              className="bg-gradient-to-br from-pink-50 to-purple-50 p-8 rounded-2xl text-center shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <FiShoppingBag className="text-white text-3xl" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Unique Products</h3>
              
            </motion.div>

            {/* Feature 2 */}
            <motion.div
              variants={scaleIn}
              whileHover={{ y: -10 }}
              className="bg-gradient-to-br from-purple-50 to-pink-50 p-8 rounded-2xl text-center shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <FiUsers className="text-white text-3xl" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Verified Sellers</h3>

            </motion.div>

            {/* Feature 3 */}
            <motion.div
              variants={scaleIn}
              whileHover={{ y: -10 }}
              className="bg-gradient-to-br from-pink-50 to-purple-50 p-8 rounded-2xl text-center shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <FiTrendingUp className="text-white text-3xl" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Empower Dreams</h3>
             
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-pink-500 to-purple-600 text-white">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="container mx-auto max-w-4xl px-4 text-center"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6 font-['Poppins']">
            Ready to Start Your Business?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join hundreds of successful women entrepreneurs on our platform
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/seller/register')}
            className="bg-white text-pink-600 px-10 py-4 rounded-full font-bold text-lg shadow-xl"
          >
            Become a Seller Today
          </motion.button>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
}

export default HomePage;