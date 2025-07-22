import React from 'react';

const MenuItem = ({ item }) => {
  const VegIndicator = () => (
    <div className="veg-indicator">
      <div className="w-2 h-2 bg-white rounded-full"></div>
    </div>
  );

  const NonVegIndicator = () => (
    <div className="non-veg-indicator">
      <div className="w-2 h-2 bg-white rounded-full"></div>
    </div>
  );

  return (
    <div className="menu-item">
      <div className="flex gap-4">
        {/* Item Image */}
        <div className="flex-shrink-0">
          <img
            src={item.image}
            alt={item.name}
            className="w-20 h-20 md:w-24 md:h-24 object-cover rounded-lg shadow-sm"
            loading="lazy"
          />
        </div>

        {/* Item Details */}
        <div className="flex-grow">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              {item.isVeg ? <VegIndicator /> : <NonVegIndicator />}
              <h3 className="font-semibold text-gray-800 text-lg">
                {item.name}
              </h3>
            </div>
            <div className="price-tag">
              ₹{item.price}
            </div>
          </div>
          
          <p className="text-gray-600 text-sm md:text-base leading-relaxed">
            {item.description}
          </p>
        </div>
      </div>
    </div>
  );
};

export default MenuItem; 