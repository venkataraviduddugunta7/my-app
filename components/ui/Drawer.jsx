'use client';

import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { useEffect } from "react";
import { createPortal } from "react-dom";

export function Drawer({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  className,
  headerClassName,
  contentClassName,
  size = "default",
  showCloseButton = true 
}) {
  const sizeClasses = {
    sm: "w-80",
    default: "w-96", 
    lg: "w-[500px]",
    xl: "w-[600px]",
    full: "w-full"
  };

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

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const drawerContent = (
    <>
      {/* Backdrop */}
      <div 
        className={cn(
          "fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-[1px] transition-opacity",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div 
        className={cn(
          "fixed inset-y-0 right-0 max-h-screen overflow-hidden bg-white shadow-xl transition-transform duration-300 ease-in-out z-50 flex flex-col",
          sizeClasses[size],
          className,
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className={cn("flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0 bg-white", headerClassName)}>
            {title && (
              <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-md transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            )}
          </div>
        )}
        
        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className={cn("p-6", contentClassName)}>
            {children}
          </div>
        </div>
      </div>
    </>
  );

  if (typeof document === "undefined") {
    return drawerContent;
  }

  return createPortal(drawerContent, document.body);
}

export function DrawerHeader({ children, className }) {
  return (
    <div className={cn("mb-4", className)}>
      {children}
    </div>
  );
}

export function DrawerFooter({ children, className }) {
  return (
    <div className={cn("flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200", className)}>
      {children}
    </div>
  );
} 
