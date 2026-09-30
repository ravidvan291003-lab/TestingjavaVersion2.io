export interface PresetImage {
  id: string;
  name: string;
  category: 'Beverages' | 'Snacks' | 'Dairy' | 'Electronics' | 'Personal Care' | 'General';
  url: string;
  isLocal: boolean;
  aspectRatio?: string;
}

export const LOCAL_PRODUCT_IMAGES: PresetImage[] = [
  {
    id: 'local-cold-brew',
    name: 'Cold Brew Arabica Can',
    category: 'Beverages',
    url: '/images/products/cold_brew.jpg',
    isLocal: true,
  },
  {
    id: 'local-sparkling-water',
    name: 'Sparkling Mineral Water',
    category: 'Beverages',
    url: '/images/products/sparkling_water.svg',
    isLocal: true,
  },
  {
    id: 'local-sourdough-chips',
    name: 'Artisan Sourdough Chips',
    category: 'Snacks',
    url: '/images/products/sourdough_chips.svg',
    isLocal: true,
  },
  {
    id: 'local-chocolate',
    name: 'Almond Dark Chocolate Clusters',
    category: 'Snacks',
    url: '/images/products/chocolate.jpg',
    isLocal: true,
  },
  {
    id: 'local-organic-milk',
    name: 'Organic Whole Milk 1 Gallon',
    category: 'Dairy',
    url: '/images/products/organic_milk.svg',
    isLocal: true,
  },
  {
    id: 'local-cheddar-cheese',
    name: 'Aged Cheddar Block 250g',
    category: 'Dairy',
    url: '/images/products/cheddar_cheese.svg',
    isLocal: true,
  },
  {
    id: 'local-usb-cable',
    name: 'Braided USB-C Fast Cable',
    category: 'Electronics',
    url: '/images/products/usb_cable.svg',
    isLocal: true,
  },
  {
    id: 'local-earbuds',
    name: 'Wireless Bluetooth Earbuds',
    category: 'Electronics',
    url: '/images/products/earbuds.jpg',
    isLocal: true,
  },
  {
    id: 'local-hand-soap',
    name: 'Lavender Botanical Hand Soap',
    category: 'Personal Care',
    url: '/images/products/hand_soap.svg',
    isLocal: true,
  },
  {
    id: 'local-lip-balm',
    name: 'Beeswax & Coconut Lip Balm',
    category: 'Personal Care',
    url: '/images/products/lip_balm.svg',
    isLocal: true,
  },
  {
    id: 'local-default-box',
    name: 'Standard Package Box',
    category: 'General',
    url: '/images/products/default_product.svg',
    isLocal: true,
  },
];

export const CURATED_ONLINE_IMAGES: PresetImage[] = [
  {
    id: 'online-coffee-cup',
    name: 'Espresso Roast Cup',
    category: 'Beverages',
    url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&auto=format&fit=crop&q=80',
    isLocal: false,
  },
  {
    id: 'online-green-tea',
    name: 'Matcha Green Tea',
    category: 'Beverages',
    url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400&auto=format&fit=crop&q=80',
    isLocal: false,
  },
  {
    id: 'online-smoothie',
    name: 'Berry Vitamin Smoothie',
    category: 'Beverages',
    url: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=400&auto=format&fit=crop&q=80',
    isLocal: false,
  },
  {
    id: 'online-croissant',
    name: 'Golden Butter Croissant',
    category: 'Snacks',
    url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&auto=format&fit=crop&q=80',
    isLocal: false,
  },
  {
    id: 'online-cookies',
    name: 'Choc-Chip Bakery Cookies',
    category: 'Snacks',
    url: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=400&auto=format&fit=crop&q=80',
    isLocal: false,
  },
  {
    id: 'online-yogurt',
    name: 'Greek Berry Yogurt Bowl',
    category: 'Dairy',
    url: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&auto=format&fit=crop&q=80',
    isLocal: false,
  },
  {
    id: 'online-smartwatch',
    name: 'Fitness Smartwatch',
    category: 'Electronics',
    url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&auto=format&fit=crop&q=80',
    isLocal: false,
  },
  {
    id: 'online-shampoo',
    name: 'Organic Herbal Shampoo',
    category: 'Personal Care',
    url: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=400&auto=format&fit=crop&q=80',
    isLocal: false,
  },
];

export const ALL_PRESET_IMAGES: PresetImage[] = [
  ...LOCAL_PRODUCT_IMAGES,
  ...CURATED_ONLINE_IMAGES,
];

// Fallback image helper
export const DEFAULT_FALLBACK_IMAGE = '/images/products/default_product.svg';

export const getProductImageUrl = (url?: string): string => {
  if (!url || !url.trim()) return DEFAULT_FALLBACK_IMAGE;
  return url.trim();
};
