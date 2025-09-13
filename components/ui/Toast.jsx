'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector, useDispatch } from 'react-redux';
import { 
  CheckCircle, 
  AlertCircle, 
  Info, 
  X, 
  Zap,
  Shield,
  Star,
  Sparkles
} from 'lucide-react';
import { removeToast } from '@/store/slices/uiSlice';

const toastVariants = {
  success: {
    icon: CheckCircle,
    bgClass: 'bg-gradient-to-r from-success-500 to-success-600',
    borderClass: 'border-success-200',
    textClass: 'text-success-800',
    iconClass: 'text-success-600'
  },
  error: {
    icon: AlertCircle,
    bgClass: 'bg-gradient-to-r from-error-500 to-error-600',
    borderClass: 'border-error-200',
    textClass: 'text-error-800',
    iconClass: 'text-error-600'
  },
  warning: {
    icon: AlertCircle,
    bgClass: 'bg-gradient-to-r from-warning-500 to-warning-600',
    borderClass: 'border-warning-200',
    textClass: 'text-warning-800',
    iconClass: 'text-warning-600'
  },
  info: {
    icon: Info,
    bgClass: 'bg-gradient-to-r from-blue-500 to-blue-600',
    borderClass: 'border-blue-200',
    textClass: 'text-blue-800',
    iconClass: 'text-blue-600'
  },
  premium: {
    icon: Star,
    bgClass: 'bg-gradient-to-r from-purple-500 to-pink-500',
    borderClass: 'border-purple-200',
    textClass: 'text-purple-800',
    iconClass: 'text-purple-600'
  }
};

function Toast({ 
  id,
  title, 
  description, 
  variant = 'info', 
  duration = 5000,
  onRemove 
}) {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(100);
  
  const config = toastVariants[variant];
  const Icon = config.icon;

  useEffect(() => {
    if (duration <= 0) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev - (100 / (duration / 100));
        if (newProgress <= 0) {
          setIsVisible(false);
          setTimeout(() => onRemove?.(id), 300);
          return 0;
        }
        return newProgress;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [duration, id, onRemove]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onRemove?.(id), 300);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: 300, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 300, scale: 0.8 }}
          whileHover={{ scale: 1.02, y: -2 }}
          className="relative overflow-hidden bg-white rounded-xl border border-gray-200 shadow-float-lg max-w-sm w-full"
        >
          {/* Progress Bar */}
          {duration > 0 && (
            <motion.div
              initial={{ width: '100%' }}
              animate={{ width: `${progress}%` }}
              className={`absolute top-0 left-0 h-1 ${config.bgClass} transition-all duration-100`}
            />
          )}

          <div className="p-4">
            <div className="flex items-start space-x-3">
              {/* Icon */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                  variant === 'success' ? 'bg-success-100' :
                  variant === 'error' ? 'bg-error-100' :
                  variant === 'warning' ? 'bg-warning-100' :
                  variant === 'premium' ? 'bg-purple-100' :
                  'bg-blue-100'
                }`}
              >
                <Icon className={`h-4 w-4 ${config.iconClass}`} />
              </motion.div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <motion.h4
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-sm font-semibold text-gray-900"
                >
                  {title}
                </motion.h4>
                {description && (
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-sm text-gray-600 mt-1"
                  >
                    {description}
                  </motion.p>
                )}
              </div>

              {/* Close Button */}
              <motion.button
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleClose}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors rounded"
              >
                <X className="h-4 w-4" />
              </motion.button>
            </div>
          </div>

          {/* Shimmer Effect for Premium Toasts */}
          {variant === 'premium' && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              animate={{
                x: ['-100%', '100%']
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 3
              }}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Toast Container Component
export function ToastContainer() {
  const dispatch = useDispatch();
  const toasts = useSelector((state) => state.ui?.toasts || []);

  const handleRemoveToast = (id) => {
    dispatch(removeToast(id));
  };

  return (
    <div className="fixed top-4 right-4 z-50 w-full max-w-sm space-y-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast, index) => (
          <motion.div
            key={toast.id}
            layout
            initial={{ opacity: 0, y: -50, scale: 0.8 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1,
              transition: { delay: index * 0.1 }
            }}
            exit={{ opacity: 0, y: -50, scale: 0.8 }}
            className="pointer-events-auto"
          >
            <Toast
              id={toast.id}
              title={toast.title}
              description={toast.description}
              variant={toast.variant}
              duration={toast.duration}
              onRemove={handleRemoveToast}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// Generate unique ID for toasts
let toastIdCounter = 0;
const generateToastId = () => `toast-${Date.now()}-${++toastIdCounter}`;

// Premium Toast Variants
export const showSuccessToast = (title, description) => ({
  id: generateToastId(),
  title,
  description,
  variant: 'success',
  duration: 4000
});

export const showErrorToast = (title, description) => ({
  id: generateToastId(),
  title,
  description,
  variant: 'error',
  duration: 6000
});

export const showPremiumToast = (title, description) => ({
  id: generateToastId(),
  title,
  description,
  variant: 'premium',
  duration: 5000
});

export { Toast };