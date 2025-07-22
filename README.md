# Sri Raghavendra Hotel - Digital Menu

A beautiful, mobile-first Progressive Web App (PWA) for Sri Raghavendra Hotel's digital menu. Built with React, Vite, and Tailwind CSS.

## Features

🍽️ **Complete Digital Menu** - Browse all restaurant items with images, descriptions, and prices
📱 **Mobile-First Design** - Optimized for mobile devices with responsive design
🌐 **Progressive Web App** - Can be installed on mobile devices like a native app
🥬 **Vegetarian/Non-Vegetarian Filter** - Easy filtering between veg and non-veg items
🎨 **Traditional Indian Theme** - Beautiful color scheme with Indian aesthetic
⚡ **Fast & Modern** - Built with Vite for lightning-fast performance

## Menu Categories

- **Vegetarian Starters** - Samosa, Paneer Tikka, Gobi Manchurian
- **Non-Vegetarian Starters** - Chicken Tikka, Fish Fry, Mutton Kebab
- **Vegetarian Main Course** - Dal Tadka, Paneer Butter Masala, Aloo Gobi
- **Non-Vegetarian Main Course** - Chicken Curry, Mutton Biryani, Fish Curry
- **Rice & Breads** - Jeera Rice, Butter Naan, Roti
- **Beverages** - Sweet Lassi, Masala Chai, Fresh Lime Water

## Technology Stack

- **React 18** - Modern React with hooks
- **Vite** - Next-generation frontend tooling
- **Tailwind CSS** - Utility-first CSS framework
- **PWA** - Progressive Web App capabilities
- **Mobile-First** - Responsive design for all devices

## Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```

3. **Build for Production**
   ```bash
   npm run build
   ```

4. **Preview Production Build**
   ```bash
   npm run preview
   ```

## PWA Features

- **Installable** - Users can install the app on their mobile devices
- **Offline Ready** - Basic caching for improved performance
- **App-like Experience** - Full-screen mode on mobile devices

## Customization

### Adding New Menu Items

Edit `src/data/menuData.js` to add new categories or items:

```javascript
{
  id: 'new-item',
  name: 'New Dish Name',
  description: 'Description of the dish',
  price: 150,
  image: 'https://your-image-url.jpg',
  isVeg: true // or false for non-veg
}
```

### Updating Restaurant Information

- **Restaurant Name**: Edit `src/components/Header.jsx`
- **Contact Info**: Edit footer section in `src/App.jsx`
- **Colors**: Modify `tailwind.config.js` for custom color scheme

### Replacing Images

Replace the placeholder images in the menu data with your actual food photos.

## QR Code Setup

To set up QR codes for table ordering:

1. Deploy the app to a hosting service (Vercel, Netlify, etc.)
2. Generate QR codes pointing to your deployed URL
3. Print and place QR codes on restaurant tables
4. Customers scan → view menu → place orders

## Deployment

### Deploy to Vercel
```bash
npm install -g vercel
vercel
```

### Deploy to Netlify
```bash
npm run build
# Upload dist/ folder to Netlify
```

## Browser Support

- Chrome/Edge (recommended)
- Safari
- Firefox
- Mobile browsers (iOS Safari, Chrome Mobile)

## License

This project is created for Sri Raghavendra Hotel. Feel free to customize for your restaurant needs.

---

**Made with ❤️ for food lovers**
