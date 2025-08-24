import React from 'react';

const IconWrapper = ({ 
  children, 
  color = "#1D2540", 
  width = 24, 
  height = 24, 
  className = "", 
  style = {},
  onClick,
  ...props 
}) => {
  const defaultStyle = {
    cursor: onClick ? "pointer" : "default",
    ...style
  };

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={defaultStyle}
      onClick={onClick}
      {...props}
    >
      {children}
    </svg>
  );
};

export default IconWrapper;
