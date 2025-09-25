'use client';

import { forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const buttonVariants = {
  // Primary - Premium gradient with glow
  primary: 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-elegant hover:from-primary-600 hover:to-primary-700 hover:shadow-glow-sm focus:ring-2 focus:ring-primary-500/50 active:scale-95',
  
  // Secondary - Elegant emerald
  secondary: 'bg-gradient-to-r from-secondary-500 to-secondary-600 text-white shadow-elegant hover:from-secondary-600 hover:to-secondary-700 hover:shadow-glow-sm focus:ring-2 focus:ring-secondary-500/50 active:scale-95',
  
  // Outline - Sophisticated border
  outline: 'border-2 border-gray-200 bg-white text-gray-900 shadow-elegant hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 focus:ring-2 focus:ring-primary-500/50 active:scale-95',
  
  // Ghost - Minimal and clean
  ghost: 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 focus:ring-2 focus:ring-gray-500/50 active:scale-95',
  
  // Destructive - Warning states
  destructive: 'bg-gradient-to-r from-error-500 to-error-600 text-white shadow-elegant hover:from-error-600 hover:to-error-700 focus:ring-2 focus:ring-error-500/50 active:scale-95',
  
  // Success - Positive actions
  success: 'bg-gradient-to-r from-success-500 to-success-600 text-white shadow-elegant hover:from-success-600 hover:to-success-700 focus:ring-2 focus:ring-success-500/50 active:scale-95',
  
  // Warning - Attention states
  warning: 'bg-gradient-to-r from-warning-500 to-warning-600 text-white shadow-elegant hover:from-warning-600 hover:to-warning-700 focus:ring-2 focus:ring-warning-500/50 active:scale-95',
  
  // Glass - Glassmorphism effect
  glass: 'bg-white/10 backdrop-blur-md border border-white/20 text-gray-900 shadow-glass hover:bg-white/20 focus:ring-2 focus:ring-white/50 active:scale-95',
};

const sizeVariants = {
  xs: 'h-7 px-2 text-xs rounded-lg',
  sm: 'h-8 px-3 text-sm rounded-lg',
  md: 'h-10 px-4 text-sm rounded-xl',
  lg: 'h-11 px-6 text-base rounded-xl',
  xl: 'h-12 px-8 text-lg rounded-2xl',
  icon: 'h-10 w-10 rounded-xl',
};

const Button = forwardRef(({ 
  className, 
  variant = 'primary', 
  size = 'md', 
  loading = false,
  disabled = false,
  children, 
  onClick,
  type = 'button',
  ...props 
}, ref) => {
  const isDisabled = disabled || loading;

  return (
    <motion.button
      ref={ref}
      type={type}
      whileHover={!isDisabled ? { scale: 1.01 } : {}}
      whileTap={!isDisabled ? { scale: 0.99 } : {}}
      transition={{ duration: 0.2 }}
      className={cn(
        // Base styles
        'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        
        // Variants
        buttonVariants[variant],
        
        // Sizes
        sizeVariants[size],
        
        // Custom className
        className
      )}
      disabled={isDisabled}
      onClick={onClick}
      {...props}
    >
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center space-x-2"
          >
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading...</span>
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center space-x-2"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
});

Button.displayName = 'Button';

export { Button, buttonVariants, sizeVariants };