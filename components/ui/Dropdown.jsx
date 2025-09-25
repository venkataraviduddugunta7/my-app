'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Dropdown({
  options = [],
  value,
  onChange,
  placeholder = 'Select option...',
  label,
  error,
  disabled = false,
  searchable = false,
  multiple = false,
  premium = false,
  className = '',
  icon: Icon,
  hint,
  helpText,
  ...props
}) {
  const effectiveHint = hint ?? helpText;
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter options based on search
  const filteredOptions = searchable && searchTerm
    ? options.filter(option => 
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options;

  const selectedOption = options.find(option => option.value === value);
  const selectedOptions = multiple && Array.isArray(value) 
    ? options.filter(option => value.includes(option.value))
    : [];

  const handleSelect = (optionValue) => {
    if (multiple) {
      const currentValues = Array.isArray(value) ? value : [];
      const newValues = currentValues.includes(optionValue)
        ? currentValues.filter(v => v !== optionValue)
        : [...currentValues, optionValue];
      onChange(newValues);
    } else {
      onChange(optionValue);
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  const removeSelectedOption = (optionValue, e) => {
    e.stopPropagation();
    if (multiple) {
      const currentValues = Array.isArray(value) ? value : [];
      onChange(currentValues.filter(v => v !== optionValue));
    }
  };

  return (
    <div className={cn('relative w-full', className)}>
      {label && (
        <motion.label
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
        </motion.label>
      )}

      <div ref={dropdownRef} className="relative">
        <motion.button
          // whileHover={{ scale: 1.01 }}
          // whileTap={{ scale: 0.99 }}
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={cn(
            'relative w-full cursor-pointer rounded-lg border bg-white px-3 py-2 text-left  transition-all duration-200',
            {
              'border-gray-200 focus:border-primary-500 focus:ring-primary-500': !error,
              'border-error-500 focus:border-error-500 focus:ring-error-500': error,
              'opacity-50 cursor-not-allowed': disabled,
              'border-primary-500 ring-1 ring-primary-500/20': isOpen,
              'shadow-float': premium && isOpen,
            }
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 flex-1 min-w-0">
              {Icon && <Icon className="h-4 w-4 text-gray-400 flex-shrink-0" />}
              
              <div className="flex-1 min-w-0">
                {multiple && selectedOptions.length > 0 ? (
                  <div className="flex items-center space-x-1 flex-wrap">
                    {selectedOptions.slice(0, 2).map((option) => (
                      <motion.span
                        key={option.value}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center space-x-1 bg-primary-100 text-primary-800 px-2 py-0.5 rounded-md text-xs font-medium"
                      >
                        <span>{option.label}</span>
                        <button
                          onClick={(e) => removeSelectedOption(option.value, e)}
                          className="hover:bg-primary-200 rounded-sm p-0.5"
                        >
                          <X className="h-2 w-2" />
                        </button>
                      </motion.span>
                    ))}
                    {selectedOptions.length > 2 && (
                      <span className="text-xs text-gray-500">
                        +{selectedOptions.length - 2} more
                      </span>
                    )}
                  </div>
                ) : selectedOption ? (
                  <span className="block truncate text-sm font-medium text-gray-900">
                    {selectedOption.label}
                  </span>
                ) : (
                  <span className="block truncate text-sm text-gray-500">
                    {placeholder}
                  </span>
                )}
              </div>
            </div>

            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </motion.div>
          </div>
        </motion.button>

        {/* Hint */}
        {effectiveHint && !error && (
          <p className="mt-1 text-xs text-gray-500">{effectiveHint}</p>
        )}

        {/* Enhanced Dropdown Panel */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="absolute z-50 mt-2 w-full rounded-xl bg-white border border-gray-200 shadow-float-lg overflow-hidden"
            >
              {/* Search Input */}
              {searchable && (
                <div className="p-3 border-b border-gray-100">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search options..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                      autoFocus
                    />
                  </div>
                </div>
              )}

              {/* Options List */}
              <div className="max-h-60 overflow-auto py-1">
                {filteredOptions.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-gray-500 text-center">
                    {searchTerm ? 'No options found' : 'No options available'}
                  </div>
                ) : (
                  filteredOptions.map((option, index) => {
                    const isSelected = multiple 
                      ? Array.isArray(value) && value.includes(option.value)
                      : value === option.value;

                    return (
                      <motion.button
                        key={option.value}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.02 }}
                        whileHover={{ x: 4, backgroundColor: '#f9fafb' }}
                        type="button"
                        onClick={() => handleSelect(option.value)}
                        className={cn(
                          'relative w-full cursor-pointer select-none py-3 px-4 text-left transition-all duration-150',
                          {
                            'bg-primary-50 text-primary-700': isSelected,
                            'text-gray-900 hover:bg-gray-50': !isSelected,
                          }
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {option.icon && (
                              <option.icon className={cn(
                                'h-4 w-4',
                                isSelected ? 'text-primary-600' : 'text-gray-400'
                              )} />
                            )}
                            <div>
                              <span className={cn(
                                'block text-sm font-medium',
                                isSelected ? 'text-primary-900' : 'text-gray-900'
                              )}>
                                {option.label}
                              </span>
                              {option.description && (
                                <span className="block text-xs text-gray-500 mt-0.5">
                                  {option.description}
                                </span>
                              )}
                            </div>
                          </div>

                          {isSelected && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                            >
                              <Check className="h-4 w-4 text-primary-600" />
                            </motion.div>
                          )}
                        </div>
                      </motion.button>
                    );
                  })
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-2 text-sm text-error-600"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}