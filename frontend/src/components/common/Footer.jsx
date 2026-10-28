import React from 'react';
import { FiFacebook, FiInstagram, FiTwitter, FiMail } from 'react-icons/fi';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="grid md:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
              CraftKart
            </h3>
            <p className="text-gray-400 text-sm">
              Empowering Pakistani women entrepreneurs through e-commerce.
            </p>
            <div className="flex space-x-4 mt-4">
              <a href="#" className="hover:text-pink-400 transition">
                <FiFacebook className="text-xl" />
              </a>
              <a href="#" className="hover:text-pink-400 transition">
                <FiInstagram className="text-xl" />
              </a>
              <a href="#" className="hover:text-pink-400 transition">
                <FiTwitter className="text-xl" />
              </a>
              <a href="#" className="hover:text-pink-400 transition">
                <FiMail className="text-xl" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Quick Links</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><a href="/shop" className="hover:text-pink-400 transition">Shop</a></li>
              {/* <li><a href="/categories" className="hover:text-pink-400 transition">Categories</a></li> */}
              <li><a href="/about" className="hover:text-pink-400 transition">About Us</a></li>
              {/* <li><a href="/contact" className="hover:text-pink-400 transition">Contact</a></li> */}
            </ul>
          </div>

          {/* For Sellers */}
          <div>
            <h4 className="font-semibold text-lg mb-4">For Sellers</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><a href="/seller/register" className="hover:text-pink-400 transition">Become a Seller</a></li>
              <li><a href="/seller/login" className="hover:text-pink-400 transition">Seller Login</a></li>
              {/* <li><a href="/seller-guide" className="hover:text-pink-400 transition">Seller Guide</a></li> */}
            </ul>
          </div>

          {/* Help */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Help & Support</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><a href="/faq" className="hover:text-pink-400 transition">FAQ</a></li>
              <li><a href="/shipping" className="hover:text-pink-400 transition">Shipping Info</a></li>
              <li><a href="/returns" className="hover:text-pink-400 transition">Returns</a></li>
              <li><a href="/privacy" className="hover:text-pink-400 transition">Privacy Policy</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
          <p>&copy; 2025 CraftKart. All rights reserved. Made for Pakistani Women Entrepreneurs. Kama lou yaar.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;