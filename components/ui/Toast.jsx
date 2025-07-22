'use client';

import { cn } from "@/lib/utils";
import { CheckCircle, XCircle, AlertCircle, Info, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useSelector, useDispatch } from 'react-redux';
import { removeToast } from '@/store/slices/uiSlice';

const toastVariants = {
  success: {
    className: "bg-green-50 border-green-200 text-green-800",
    icon: CheckCircle,
    iconClassName: "text-green-400"
  },
  error: {
    className: "bg-red-50 border-red-200 text-red-800",
    icon: XCircle,
    iconClassName: "text-red-400"
  },
  warning: {
    className: "bg-yellow-50 border-yellow-200 text-yellow-800",
    icon: AlertCircle,
    iconClassName: "text-yellow-400"
  },
  info: {
    className: "bg-blue-50 border-blue-200 text-blue-800",
    icon: Info,
    iconClassName: "text-blue-400"
  }
};

export function Toast({ 
  id,
  title, 
  description, 
  variant = "info", 
  duration = 5000,
  className 
}) {
  const dispatch = useDispatch();
  const [isVisible, setIsVisible] = useState(true);
  const variantConfig = toastVariants[variant];
  const Icon = variantConfig.icon;

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => dispatch(removeToast(id)), 300);
  };

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, id, dispatch]);

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "relative w-full rounded-lg border p-4 shadow-lg transition-all duration-300",
        variantConfig.className,
        isVisible ? "animate-in slide-in-from-top-2" : "animate-out slide-out-to-top-2",
        className
      )}
    >
      <div className="flex items-start space-x-3">
        <Icon className={cn("h-5 w-5 flex-shrink-0 mt-0.5", variantConfig.iconClassName)} />
        <div className="flex-1 min-w-0">
          {title && (
            <p className="text-sm font-medium">{title}</p>
          )}
          {description && (
            <p className={cn("text-sm", title ? "mt-1" : "")}>{description}</p>
          )}
        </div>
        <button
          onClick={handleClose}
          className="flex-shrink-0 rounded-md p-1.5 hover:bg-black hover:bg-opacity-10 focus:outline-none focus:ring-2 focus:ring-offset-2"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// Toast Container for managing multiple toasts
export function ToastContainer() {
  const toasts = useSelector((state) => state.ui.toasts);

  return (
    <div className="fixed top-4 right-4 z-50 w-full max-w-sm space-y-2">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} />
      ))}
    </div>
  );
} 