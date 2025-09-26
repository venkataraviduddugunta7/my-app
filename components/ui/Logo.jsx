'use client';
import { motion } from 'framer-motion';

export function Logo({ size = 'default', showText = true, className = '' }) {
  const sizeClasses = {
    small: 'h-10 w-10',
    default: 'h-12 w-12',
    large: 'h-16 w-16',
    xl: 'h-20 w-20'
  };

  const LogoSVG = ({ className: svgClassName }) => (
    <svg
      viewBox="0 0 80 80"
      className={svgClassName}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Modern gradient background */}
        <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#667eea" />
          <stop offset="50%" stopColor="#764ba2" />
          <stop offset="100%" stopColor="#f093fb" />
        </linearGradient>
        
        {/* Building gradient */}
        <linearGradient id="buildingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.8" />
        </linearGradient>
        
        {/* Accent gradient for windows */}
        <linearGradient id="windowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4f46e5" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
      
      {/* Background with rounded corners */}
      <rect width="80" height="80" rx="16" fill="url(#bgGradient)" />
      
      {/* Subtle overlay pattern */}
      <circle cx="20" cy="20" r="30" fill="url(#buildingGradient)" opacity="0.1" />
      <circle cx="60" cy="60" r="25" fill="url(#buildingGradient)" opacity="0.1" />
      
      {/* Main building structure - Modern apartment/PG building */}
      <rect x="25" y="25" width="30" height="40" rx="3" fill="url(#buildingGradient)" />
      
      {/* Building windows - Grid pattern representing rooms/management */}
      <rect x="29" y="29" width="4" height="4" rx="1" fill="url(#windowGradient)" />
      <rect x="35" y="29" width="4" height="4" rx="1" fill="url(#windowGradient)" />
      <rect x="41" y="29" width="4" height="4" rx="1" fill="url(#windowGradient)" />
      <rect x="47" y="29" width="4" height="4" rx="1" fill="url(#windowGradient)" />
      
      <rect x="29" y="37" width="4" height="4" rx="1" fill="url(#windowGradient)" />
      <rect x="35" y="37" width="4" height="4" rx="1" fill="url(#windowGradient)" />
      <rect x="41" y="37" width="4" height="4" rx="1" fill="url(#windowGradient)" />
      <rect x="47" y="37" width="4" height="4" rx="1" fill="url(#windowGradient)" />
      
      <rect x="29" y="45" width="4" height="4" rx="1" fill="url(#windowGradient)" />
      <rect x="35" y="45" width="4" height="4" rx="1" fill="url(#windowGradient)" />
      <rect x="41" y="45" width="4" height="4" rx="1" fill="url(#windowGradient)" />
      <rect x="47" y="45" width="4" height="4" rx="1" fill="url(#windowGradient)" />
      
      <rect x="29" y="53" width="4" height="4" rx="1" fill="url(#windowGradient)" />
      <rect x="35" y="53" width="4" height="4" rx="1" fill="url(#windowGradient)" />
      <rect x="41" y="53" width="4" height="4" rx="1" fill="url(#windowGradient)" />
      <rect x="47" y="53" width="4" height="4" rx="1" fill="url(#windowGradient)" />
      
      {/* Main entrance */}
      <rect x="37" y="58" width="6" height="7" rx="1" fill="url(#windowGradient)" />
      
      {/* Modern tech elements - representing digital management */}
      <circle cx="15" cy="40" r="2" fill="#ffffff" opacity="0.8" />
      <circle cx="65" cy="40" r="2" fill="#ffffff" opacity="0.8" />
      
      {/* Connection lines - representing network/management system */}
      <line x1="17" y1="40" x2="25" y2="40" stroke="#ffffff" strokeWidth="1" opacity="0.6" />
      <line x1="55" y1="40" x2="63" y2="40" stroke="#ffffff" strokeWidth="1" opacity="0.6" />
      
      {/* Small dots representing connectivity */}
      <circle cx="20" cy="35" r="1" fill="#ffffff" opacity="0.7" />
      <circle cx="60" cy="45" r="1" fill="#ffffff" opacity="0.7" />
      <circle cx="20" cy="45" r="1" fill="#ffffff" opacity="0.7" />
      <circle cx="60" cy="35" r="1" fill="#ffffff" opacity="0.7" />
    </svg>
  );

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* SVG Logo with hover animation */}
      <motion.div 
        className={`${sizeClasses[size]} relative flex items-center justify-center`}
        whileHover={{ scale: 1.05 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <LogoSVG className="w-full h-full drop-shadow-lg" />
      </motion.div>
      
      {/* Logo Text */}
      {showText && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col"
        >
          <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            PG Manager
          </h1>
          <p className="text-xs text-gray-500 -mt-1 font-medium tracking-wide">
            Smart Management Tool
          </p>
        </motion.div>
      )}
    </div>
  );
}

export default Logo;