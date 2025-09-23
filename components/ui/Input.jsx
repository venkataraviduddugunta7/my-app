'use client';

import { forwardRef, useState, useCallback, useRef, useEffect } from 'react';
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
  helpText,
  icon: Icon,
  rightIcon: RightIcon,
  disabled = false,
  required = false,
  floating = false,
  premium = false,
  value,
  onChange,
  onFocus,
  onBlur,
  ...props 
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);
  const combinedRef = ref || inputRef;
  const effectiveHint = hint ?? helpText;

  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;
  
  // Check if input has value - works for both controlled and uncontrolled
  const hasValue = value !== undefined ? String(value).length > 0 : false;

  const handleFocus = useCallback((e) => {
    setIsFocused(true);
    onFocus?.(e);
  }, [onFocus]);

  const handleBlur = useCallback((e) => {
    setIsFocused(false);
    onBlur?.(e);
  }, [onBlur]);

  const handleChange = useCallback((e) => {
    onChange?.(e);
  }, [onChange]);

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

  // Floating label variant
  if (floating && label) {
    return (
      <div className="space-y-1">
        <div className="relative">
          <input
            ref={combinedRef}
            type={inputType}
            disabled={disabled}
            value={value}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className={cn(
              baseInputClasses,
              'pt-5 pb-2',
              className
            )}
            placeholder=" "
            {...props}
          />
          
          <label
            className={cn(
              "absolute left-3 transition-all duration-200 pointer-events-none origin-left",
              (isFocused || hasValue) 
                ? "top-1.5 text-xs text-primary-500" 
                : "top-3.5 text-sm text-gray-500"
            )}
          >
            {label}
            {required && <span className="text-error-500 ml-1">*</span>}
          </label>

          {/* Password toggle */}
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          )}

          {/* Icons */}
          {Icon && (
            <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          )}
          {RightIcon && !isPassword && (
            <RightIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          )}
        </div>

        {/* Error/Success/Hint messages */}
        {error && (
          <div className="flex items-center gap-1 text-xs text-error-500">
            <AlertCircle className="h-3 w-3" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-1 text-xs text-success-500">
            <CheckCircle className="h-3 w-3" />
            <span>{success}</span>
          </div>
        )}
        {effectiveHint && !error && !success && (
          <p className="text-xs text-gray-500">{effectiveHint}</p>
        )}
      </div>
    );
  }

  // Premium variant
  if (premium) {
    return (
      <div className="space-y-1">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {required && <span className="text-error-500 ml-1">*</span>}
          </label>
        )}
        
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 to-secondary-500/10 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          <div className="relative">
            <input
              ref={combinedRef}
              type={inputType}
              disabled={disabled}
              value={value}
              onChange={handleChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              className={baseInputClasses}
              placeholder={placeholder}
              {...props}
            />

            {/* Password toggle */}
            {isPassword && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            )}

            {/* Icons */}
            {Icon && (
              <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            )}
            {RightIcon && !isPassword && (
              <RightIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            )}
          </div>
        </div>

        {/* Error/Success/Hint messages */}
        {error && (
          <div className="flex items-center gap-1 text-xs text-error-500">
            <AlertCircle className="h-3 w-3" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-1 text-xs text-success-500">
            <CheckCircle className="h-3 w-3" />
            <span>{success}</span>
          </div>
        )}
        {effectiveHint && !error && !success && (
          <p className="text-xs text-gray-500">{effectiveHint}</p>
        )}
      </div>
    );
  }

  // Standard variant
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-error-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <input
          ref={combinedRef}
          type={inputType}
          disabled={disabled}
          value={inputType === 'number' ? (isNaN(value) ? '' : value) : value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={baseInputClasses}
          placeholder={placeholder}
          {...props}
        />

        {/* Password toggle */}
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        )}

        {/* Icons */}
        {Icon && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        )}
        {RightIcon && !isPassword && (
          <RightIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        )}
      </div>

      {/* Error/Success/Hint messages */}
      {error && (
        <div className="flex items-center gap-1 text-xs text-error-500">
          <AlertCircle className="h-3 w-3" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-1 text-xs text-success-500">
          <CheckCircle className="h-3 w-3" />
          <span>{success}</span>
        </div>
      )}
      {effectiveHint && !error && !success && (
        <p className="text-xs text-gray-500">{effectiveHint}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export { Input };
export default Input;