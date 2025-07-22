import React from 'react';

const Header = () => {
  return (
    <header className="restaurant-header py-8 px-4 text-center relative overflow-hidden">
      {/* Decorative background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-4 left-4 w-16 h-16 border-2 border-white rounded-full"></div>
        <div className="absolute top-8 right-8 w-12 h-12 border-2 border-white rounded-full"></div>
        <div className="absolute bottom-4 left-1/4 w-8 h-8 border-2 border-white rounded-full"></div>
        <div className="absolute bottom-8 right-1/4 w-20 h-20 border-2 border-white rounded-full"></div>
      </div>
      
      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Restaurant Logo/Icon */}
        <div className="mb-4">
          <div className="w-20 h-20 mx-auto bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
            <span className="text-3xl">🍛</span>
          </div>
        </div>
        
        {/* Restaurant Name */}
        <h1 className="text-4xl md:text-5xl font-bold mb-2 text-white drop-shadow-lg">
          श्री राघवेंद्र होटल
        </h1>
        <h2 className="text-2xl md:text-3xl font-semibold mb-4 text-white/90">
          Sri Raghavendra Hotel
        </h2>
        
        {/* Tagline */}
        <p className="text-lg md:text-xl text-white/80 mb-2 font-medium">
          Traditional Indian Cuisine
        </p>
        <p className="text-base md:text-lg text-white/70">
          Authentic Vegetarian & Non-Vegetarian Delicacies
        </p>
        
        {/* Decorative divider */}
        <div className="mt-6 flex items-center justify-center">
          <div className="w-16 h-0.5 bg-white/30"></div>
          <div className="mx-4 w-3 h-3 bg-white/40 rounded-full"></div>
          <div className="w-16 h-0.5 bg-white/30"></div>
        </div>
      </div>
    </header>
  );
};

export default Header; 