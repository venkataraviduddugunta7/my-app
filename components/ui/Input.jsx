'use client';

import { forwardRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, AlertCircle, CheckCircle, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

const Input = forwardRef(({ 
  className,
  type = 'text',
  label,
  placeholder,
  error,
  success,
  hint,
  icon: Icon,
  rightIcon: RightIcon,
  disabled = false,
  required = false,
  floating = false,
  premium = false,
  ...props 
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(false);

  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;

  const handleChange = (e) => {
    setHasValue(e.target.value.length > 0);
    props.onChange?.(e);
  };

  const baseInputClasses = cn(
    'w-full border transition-all duration-200 focus:outline-none',
    {
      // Premium variant with enhanced styling
      'rounded-xl border-gray-200 bg-white px-4 py-3 text-sm shadow-elegant focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 hover:border-gray-300': premium,
      
      // Standard variant
      'rounded-lg border-gray-200 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500': !premium,
      
      // States
      'border-error-500 focus:border-error-500 focus:ring-error-500/20': error,
      'border-success-500 focus:border-success-500 focus:ring-success-500/20': success,
      'opacity-50 cursor-not-allowed': disabled,
      'pl-10': Icon,
      'pr-10': RightIcon || isPassword,
    },
    className
  );

  const FloatingInput = () => (
    <div className="relative">
      <motion.input
        ref={ref}
        type={inputType}
        disabled={disabled}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onChange={handleChange}
        className={cn(
          baseInputClasses,
          'placeholder-transparent peer pt-6 pb-2'
        )}
        placeholder={placeholder}
        {...props}
      />
      
      <motion.label
        animate={{
          scale: isFocused || hasValue ? 0.85 : 1,
          y: isFocused || hasValue ? -8 : 0,
          color: isFocused ? '#3b82f6' : '#6b7280'
        }}
        transition={{ duration: 0.2 }}
        className="absolute left-3 top-3 text-sm text-gray-500 transition-all duration-200 pointer-events-none origin-left"
      >
        {label}
        {required && <span className="text-error-500 ml-1">*</span>}
      </motion.label>
    </div>
  );

  const StandardInput = () => (
    <div className="space-y-2">
      {label && (
        <motion.label
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
          {required && <span className="text-error-500 ml-1">*</span>}
        </motion.label>
      )}
      
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            <Icon className="h-4 w-4 text-gray-400" />
          </div>
        )}
        
        <motion.input
          ref={ref}
          type={inputType}
          disabled={disabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onChange={handleChange}
          whileFocus={{ scale: 1.01 }}
          className={baseInputClasses}
          placeholder={placeholder}
          {...props}
        />
        
        {/* Right side icons */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-2">
          {/* Success/Error indicators */}
          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <CheckCircle className="h-4 w-4 text-success-500" />
              </motion.div>
            )}
            
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <AlertCircle className="h-4 w-4 text-error-500" />
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Password toggle */}
          {isPassword && (
            <motion.button
              type="button"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowPassword(!showPassword)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </motion.button>
          )}
          
          {/* Right icon */}
          {RightIcon && (
            <RightIcon className="h-4 w-4 text-gray-400" />
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full">
      {floating ? <FloatingInput /> : <StandardInput />}
      
      {/* Error/Success/Hint messages */}
      <AnimatePresence>
        {(error || success || hint) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-2"
          >
            {error && (
              <p className="text-sm text-error-600 flex items-center space-x-1">
                <AlertCircle className="h-3 w-3" />
                <span>{error}</span>
              </p>
            )}
            
            {success && (
              <p className="text-sm text-success-600 flex items-center space-x-1">
                <CheckCircle className="h-3 w-3" />
                <span>{success}</span>
              </p>
            )}
            
            {hint && !error && !success && (
              <p className="text-sm text-gray-500">{hint}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

Input.displayName = 'Input';

// Premium Input Variants
const PremiumInput = forwardRef((props, ref) => (
  <Input ref={ref} premium floating {...props} />
));

PremiumInput.displayName = 'PremiumInput';

const SearchInput = forwardRef(({ 
  onSearch,
  suggestions = [],
  showSuggestions = false,
  ...props 
}, ref) => {
  const [query, setQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setShowDropdown(value.length > 0 && suggestions.length > 0);
    props.onChange?.(e);
  };

  return (
    <div className="relative">
      <Input
        ref={ref}
        type="search"
        icon={Search}
        value={query}
        onChange={handleChange}
        onFocus={() => setShowDropdown(query.length > 0 && suggestions.length > 0)}
        onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
        premium
        {...props}
      />
      
      {/* Search Suggestions */}
      <AnimatePresence>
        {showDropdown && showSuggestions && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-float-lg z-50 max-h-60 overflow-y-auto"
          >
            {suggestions.map((suggestion, index) => (
              <motion.button
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ x: 4 }}
                onClick={() => {
                  setQuery(suggestion.text);
                  setShowDropdown(false);
                  onSearch?.(suggestion);
                }}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors first:rounded-t-xl last:rounded-b-xl"
              >
                <div className="flex items-center space-x-3">
                  {suggestion.icon && <suggestion.icon className="h-4 w-4 text-gray-400" />}
                  <div>
                    <p className="text-sm font-medium text-gray-900">{suggestion.text}</p>
                    {suggestion.subtitle && (
                      <p className="text-xs text-gray-500">{suggestion.subtitle}</p>
                    )}
                  </div>
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

SearchInput.displayName = 'SearchInput';

export { Input, PremiumInput, SearchInput };