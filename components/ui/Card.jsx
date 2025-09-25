'use client';

import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const Card = forwardRef(({ 
  className, 
  children, 
  hover = true,
  glow = false,
  glass = false,
  ...props 
}, ref) => (
  <motion.div
    ref={ref}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    whileHover={hover ? { y: -2, scale: 1.01 } : {}}
    className={cn(
      'rounded-2xl border border-gray-200 bg-white text-gray-950 transition-all duration-300',
      {
        'hover:shadow-float': hover,
        'shadow-glow': glow,
        'bg-white/10 backdrop-blur-md border-white/20 shadow-glass': glass,
      },
      className
    )}
    {...props}
  >
    {children}
  </motion.div>
));

Card.displayName = 'Card';

const CardHeader = forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 p-6 pb-4', className)}
    {...props}
  />
));

CardHeader.displayName = 'CardHeader';

const CardTitle = forwardRef(({ className, children, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('text-lg font-semibold leading-none tracking-tight text-gray-900', className)}
    {...props}
  >
    {children}
  </h3>
));

CardTitle.displayName = 'CardTitle';

const CardDescription = forwardRef(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-gray-600', className)}
    {...props}
  />
));

CardDescription.displayName = 'CardDescription';

const CardContent = forwardRef(({ className, ...props }, ref) => (
  <div 
    ref={ref} 
    className={cn('p-6 pt-0', className)} 
    {...props} 
  />
));

CardContent.displayName = 'CardContent';

const CardFooter = forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center p-6 pt-0', className)}
    {...props}
  />
));

CardFooter.displayName = 'CardFooter';

// Premium Card Variants
const PremiumCard = forwardRef(({ 
  className, 
  children, 
  variant = 'default',
  ...props 
}, ref) => {
  const variants = {
    default: 'bg-white border-gray-200',
    gradient: 'bg-gradient-to-br from-white to-gray-50 border-gray-200',
    glass: 'bg-white/10 backdrop-blur-md border-white/20 shadow-glass',
    luxury: 'bg-white border-gray-200 shadow-luxury',
    neon: 'bg-white border-primary-200 shadow-neon',
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'rounded-2xl border text-gray-950 transition-all duration-300 hover:shadow-float-lg',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
});

PremiumCard.displayName = 'PremiumCard';

export { 
  Card, 
  CardHeader, 
  CardFooter, 
  CardTitle, 
  CardDescription, 
  CardContent,
  PremiumCard
};