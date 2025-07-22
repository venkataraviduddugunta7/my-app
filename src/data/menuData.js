export const menuData = {
  categories: [
    {
      id: 'veg-starters',
      name: 'Vegetarian Starters',
      type: 'veg',
      items: [
        {
          id: 'samosa',
          name: 'Samosa (2 pcs)',
          description: 'Crispy triangular pastries filled with spiced potatoes and peas',
          price: 60,
          image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=300&h=200&fit=crop',
          isVeg: true
        },
        {
          id: 'paneer-tikka',
          name: 'Paneer Tikka',
          description: 'Marinated cottage cheese grilled to perfection with bell peppers',
          price: 180,
          image: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=300&h=200&fit=crop',
          isVeg: true
        },
        {
          id: 'gobi-manchurian',
          name: 'Gobi Manchurian',
          description: 'Crispy cauliflower florets in tangy Indo-Chinese sauce',
          price: 150,
          image: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=300&h=200&fit=crop',
          isVeg: true
        }
      ]
    },
    {
      id: 'non-veg-starters',
      name: 'Non-Vegetarian Starters',
      type: 'non-veg',
      items: [
        {
          id: 'chicken-tikka',
          name: 'Chicken Tikka',
          description: 'Tender chicken pieces marinated in yogurt and spices, grilled in tandoor',
          price: 220,
          image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=300&h=200&fit=crop',
          isVeg: false
        },
        {
          id: 'fish-fry',
          name: 'Fish Fry',
          description: 'Fresh fish marinated with South Indian spices and shallow fried',
          price: 250,
          image: 'https://images.unsplash.com/photo-1544943910-4c1dc44aab44?w=300&h=200&fit=crop',
          isVeg: false
        },
        {
          id: 'mutton-kebab',
          name: 'Mutton Seekh Kebab',
          description: 'Spiced minced mutton grilled on skewers with aromatic herbs',
          price: 280,
          image: 'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=300&h=200&fit=crop',
          isVeg: false
        }
      ]
    },
    {
      id: 'veg-mains',
      name: 'Vegetarian Main Course',
      type: 'veg',
      items: [
        {
          id: 'dal-tadka',
          name: 'Dal Tadka',
          description: 'Yellow lentils tempered with cumin, garlic and green chilies',
          price: 120,
          image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&h=200&fit=crop',
          isVeg: true
        },
        {
          id: 'paneer-butter-masala',
          name: 'Paneer Butter Masala',
          description: 'Cottage cheese in rich tomato and cream based gravy',
          price: 200,
          image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=300&h=200&fit=crop',
          isVeg: true
        },
        {
          id: 'aloo-gobi',
          name: 'Aloo Gobi',
          description: 'Potatoes and cauliflower cooked with turmeric and spices',
          price: 140,
          image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=300&h=200&fit=crop',
          isVeg: true
        }
      ]
    },
    {
      id: 'non-veg-mains',
      name: 'Non-Vegetarian Main Course',
      type: 'non-veg',
      items: [
        {
          id: 'chicken-curry',
          name: 'Chicken Curry',
          description: 'Traditional chicken curry cooked in onion-tomato gravy with aromatic spices',
          price: 250,
          image: 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=300&h=200&fit=crop',
          isVeg: false
        },
        {
          id: 'mutton-biryani',
          name: 'Mutton Biryani',
          description: 'Fragrant basmati rice layered with spiced mutton and saffron',
          price: 320,
          image: 'https://images.unsplash.com/photo-1563379091339-03246963d51a?w=300&h=200&fit=crop',
          isVeg: false
        },
        {
          id: 'fish-curry',
          name: 'Fish Curry',
          description: 'Fresh fish cooked in coconut-based South Indian style curry',
          price: 280,
          image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=300&h=200&fit=crop',
          isVeg: false
        }
      ]
    },
    {
      id: 'rice-breads',
      name: 'Rice & Breads',
      type: 'veg',
      items: [
        {
          id: 'jeera-rice',
          name: 'Jeera Rice',
          description: 'Fragrant basmati rice tempered with cumin seeds',
          price: 80,
          image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=300&h=200&fit=crop',
          isVeg: true
        },
        {
          id: 'naan',
          name: 'Butter Naan',
          description: 'Soft leavened bread brushed with butter, baked in tandoor',
          price: 45,
          image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=300&h=200&fit=crop',
          isVeg: true
        },
        {
          id: 'roti',
          name: 'Roti (2 pcs)',
          description: 'Whole wheat flatbread cooked on tawa',
          price: 30,
          image: 'https://images.unsplash.com/photo-1574653853027-5e4e3ae2e8d5?w=300&h=200&fit=crop',
          isVeg: true
        }
      ]
    },
    {
      id: 'beverages',
      name: 'Beverages',
      type: 'veg',
      items: [
        {
          id: 'lassi',
          name: 'Sweet Lassi',
          description: 'Traditional yogurt-based drink sweetened with sugar',
          price: 50,
          image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=300&h=200&fit=crop',
          isVeg: true
        },
        {
          id: 'masala-chai',
          name: 'Masala Chai',
          description: 'Spiced Indian tea brewed with milk and aromatic spices',
          price: 25,
          image: 'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=300&h=200&fit=crop',
          isVeg: true
        },
        {
          id: 'fresh-lime',
          name: 'Fresh Lime Water',
          description: 'Refreshing lime water with mint and black salt',
          price: 40,
          image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=300&h=200&fit=crop',
          isVeg: true
        }
      ]
    }
  ]
}; 