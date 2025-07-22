import React from 'react';
import MenuItem from './MenuItem';

const MenuCategory = ({ category }) => {
  const getCategoryIcon = (type) => {
    switch (type) {
      case 'veg':
        return '🥬';
      case 'non-veg':
        return '🍖';
      default:
        return '🍽️';
    }
  };

  return (
    <div className="menu-card mb-8">
      {/* Category Header */}
      <div className="category-header">
        <div className="flex items-center justify-center gap-3">
          <span className="text-2xl">{getCategoryIcon(category.type)}</span>
          <h2 className="text-xl md:text-2xl font-bold">
            {category.name}
          </h2>
        </div>
      </div>

      {/* Category Items */}
      <div className="divide-y divide-gray-100">
        {category.items.map((item) => (
          <MenuItem key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
};

export default MenuCategory; 