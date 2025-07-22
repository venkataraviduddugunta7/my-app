import React, { useState } from 'react';
import Header from './components/Header';
import MenuCategory from './components/MenuCategory';
import { menuData } from './data/menuData';

function App() {
  const [filter, setFilter] = useState('all');

  const filteredCategories = menuData.categories.filter(category => {
    if (filter === 'all') return true;
    return category.type === filter;
  });

  return (
    <div className="min-h-screen bg-primary-50">
      <Header />
      
      {/* Filter Buttons */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex flex-wrap justify-center gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-6 py-2 rounded-full font-medium transition-all duration-200 ${
                filter === 'all'
                  ? 'bg-primary-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Items
            </button>
            <button
              onClick={() => setFilter('veg')}
              className={`px-6 py-2 rounded-full font-medium transition-all duration-200 flex items-center gap-2 ${
                filter === 'veg'
                  ? 'bg-secondary-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <div className="w-3 h-3 border border-secondary-600 bg-secondary-500 rounded-sm"></div>
              Vegetarian
            </button>
            <button
              onClick={() => setFilter('non-veg')}
              className={`px-6 py-2 rounded-full font-medium transition-all duration-200 flex items-center gap-2 ${
                filter === 'non-veg'
                  ? 'bg-red-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <div className="w-3 h-3 border border-red-600 bg-red-500 rounded-sm"></div>
              Non-Vegetarian
            </button>
          </div>
        </div>
      </div>

      {/* Menu Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {filteredCategories.length > 0 ? (
          filteredCategories.map((category) => (
            <MenuCategory key={category.id} category={category} />
          ))
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🍽️</div>
            <p className="text-xl text-gray-600">No items found for this filter</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-xl font-semibold mb-2">Sri Raghavendra Hotel</h3>
          <p className="text-gray-300 mb-4">Serving authentic Indian cuisine with love since generations</p>
          <div className="text-sm text-gray-400">
            <p>📍 Address: [Your Restaurant Address]</p>
            <p>📞 Phone: [Your Phone Number]</p>
            <p>🕒 Timing: [Your Operating Hours]</p>
          </div>
          <div className="mt-6 pt-4 border-t border-gray-700">
            <p className="text-sm text-gray-500">
              Made with ❤️ for food lovers
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App; 