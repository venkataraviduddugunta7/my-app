import { cn } from "@/lib/utils";
import { forwardRef } from "react";

const Input = forwardRef(({ 
  className, 
  type = "text",
  error,
  label,
  helperText,
  helpText, // Add helpText as alias for helperText
  ...props 
}, ref) => {
  const displayHelperText = helpText || helperText;
  
  return (
    <div className="space-y-1">
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          error && "border-red-500 focus-visible:ring-red-500",
          className
        )}
        ref={ref}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      {displayHelperText && !error && (
        <p className="text-sm text-gray-500">{displayHelperText}</p>
      )}
    </div>
  );
});

Input.displayName = "Input";

export { Input }; 