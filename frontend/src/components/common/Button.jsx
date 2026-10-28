import React from 'react';
import { motion } from 'framer-motion';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md',
  fullWidth = false,
  onClick,
  disabled = false,
  className = ''
}) => {
  const baseStyles = 'font-semibold rounded-lg transition-all flex items-center justify-center gap-2';
  
  const variants = {
    primary: 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:shadow-lg',
    secondary: 'bg-white text-pink-600 border-2 border-pink-500 hover:bg-pink-50',
    outline: 'bg-transparent border-2 border-gray-300 text-gray-700 hover:border-pink-500 hover:text-pink-600',
    ghost: 'bg-transparent text-pink-600 hover:bg-pink-50'
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  };

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthClass} ${className} ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      {children}
    </motion.button>
  );
};

export default Button;
