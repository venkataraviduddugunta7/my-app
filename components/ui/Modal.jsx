'use client';

import { forwardRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

const Modal = forwardRef(({ 
  isOpen = false,
  onClose,
  title,
  description,
  children,
  size = 'md',
  className,
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  ...props 
}, ref) => {
  
  // Handle escape key
  useEffect(() => {
    if (!closeOnEscape) return;
    
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, closeOnEscape]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const sizeClasses = {
    xs: 'max-w-md',
    sm: 'max-w-lg',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-[95vw]'
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  };

  const modalVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.8, 
      y: 50 
    },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: {
        type: "spring",
        damping: 25,
        stiffness: 300
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.8, 
      y: 50,
      transition: {
        duration: 0.2
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center mt-[-24px] mb-[-24px]">
          {/* Overlay fills the entire viewport, unaffected by padding */}
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={closeOnOverlayClick ? onClose : undefined}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm mt-[-24px] mb-[-24px]"
          />

          {/* Modal */}
          <motion.div
            ref={ref}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
            className={cn(
              'relative w-full bg-white rounded-2xl shadow-luxury border border-gray-200 overflow-hidden',
              sizeClasses[size],
              className
            )}
            {...props}
          >
            {/* Header */}
            {(title || description || showCloseButton) && (
              <div className="relative px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white m-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {title && (
                      <motion.h2
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xl font-semibold text-gray-900"
                      >
                        {title}
                      </motion.h2>
                    )}
                    {description && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-sm text-gray-600 mt-1"
                      >
                        {description}
                      </motion.p>
                    )}
                  </div>
                  
                  {showCloseButton && (
                    <motion.button
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={onClose}
                      className="ml-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
                    >
                      <X className="h-4 w-4" />
                    </motion.button>
                  )}
                </div>
              </div>
            )}

            {/* Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="relative p-6 m-0"
            >
              {children}
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
});

Modal.displayName = 'Modal';

// Modal Footer Component
const ModalFooter = forwardRef(({ 
  className, 
  children,
  ...props 
}, ref) => (
  <motion.div
    ref={ref}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.3 }}
    className={cn(
      'flex items-center justify-end space-x-3 px-6 py-4 bg-gray-50 border-t border-gray-100',
      className
    )}
    {...props}
  >
    {children}
  </motion.div>
));

ModalFooter.displayName = 'ModalFooter';

// Premium Modal Variants
const PremiumModal = forwardRef((props, ref) => (
  <Modal 
    ref={ref} 
    className="shadow-luxury border-0 bg-gradient-to-br from-white to-gray-50" 
    {...props} 
  />
));

PremiumModal.displayName = 'PremiumModal';

const GlassModal = forwardRef((props, ref) => (
  <Modal 
    ref={ref} 
    className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-glass" 
    {...props} 
  />
));

GlassModal.displayName = 'GlassModal';

// Confirmation Modal
const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'warning' // 'warning', 'danger', 'info'
}) => {
  const variantStyles = {
    warning: {
      icon: '⚠️',
      confirmClass: 'btn-warning',
      bgClass: 'from-warning-50 to-warning-100'
    },
    danger: {
      icon: '🚨',
      confirmClass: 'btn-destructive',
      bgClass: 'from-error-50 to-error-100'
    },
    info: {
      icon: 'ℹ️',
      confirmClass: 'btn-primary',
      bgClass: 'from-blue-50 to-blue-100'
    }
  };

  const style = variantStyles[variant];

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br ${style.bgClass} text-2xl mb-4`}
        >
          {style.icon}
        </motion.div>
        
        <motion.h3
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-lg font-semibold text-gray-900 mb-2"
        >
          {title}
        </motion.h3>
        
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-sm text-gray-600 mb-6"
        >
          {message}
        </motion.p>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex space-x-3 justify-center"
        >
          <Button variant="outline" onClick={onClose}>
            {cancelText}
          </Button>
          <Button 
            variant={variant === 'danger' ? 'destructive' : variant === 'warning' ? 'warning' : 'primary'} 
            onClick={onConfirm}
          >
            {confirmText}
          </Button>
        </motion.div>
      </div>
    </Modal>
  );
};

export { 
  Modal, 
  ModalFooter, 
  PremiumModal, 
  GlassModal, 
  ConfirmationModal 
};