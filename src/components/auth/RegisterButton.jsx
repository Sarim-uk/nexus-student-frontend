import React from 'react';
import { motion } from 'framer-motion';
import { UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * A visually appealing register button component for the student portal
 * 
 * @param {Object} props Component props
 * @param {string} props.to The link destination (default: "/register")
 * @param {string} props.label The button label text (default: "Register")
 * @param {string} props.size The button size (default, small, large)
 * @param {boolean} props.fullWidth Whether the button should take full width
 * @param {Function} props.onClick Optional click handler
 * @returns {JSX.Element} The register button component
 */
const RegisterButton = ({
  to = "/register",
  label = "Register",
  size = "default",
  fullWidth = false,
  onClick,
  className = "",
  ...props
}) => {
  // Size variants
  const sizeClasses = {
    small: "py-2 px-4 text-sm",
    default: "py-3 px-6 text-base",
    large: "py-4 px-8 text-xl"
  };

  // Animation variants
  const buttonVariants = {
    rest: { scale: 1 },
    hover: { 
      scale: 1.05,
      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)"
    },
    tap: { scale: 0.95 }
  };

  return (
    <motion.div
      className={`${fullWidth ? 'w-full' : 'inline-block'} ${className}`}
      initial="rest"
      whileHover="hover"
      whileTap="tap"
      variants={buttonVariants}
      data-testid={props['data-testid']}
    >
      <Link
        to={to}
        onClick={onClick}
        className={`
          flex items-center justify-center
          rounded-2xl font-bold
          text-white shadow-md
          bg-gradient-to-r from-blue-500 to-purple-600
          hover:from-blue-600 hover:to-purple-700
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
          transition-all duration-300
          ${sizeClasses[size]}
          ${fullWidth ? 'w-full' : ''}
        `}
      >
        <UserPlus className={`mr-2 ${size === 'small' ? 'h-4 w-4' : size === 'large' ? 'h-6 w-6' : 'h-5 w-5'}`} />
        {label}
      </Link>
    </motion.div>
  );
};

export default RegisterButton; 