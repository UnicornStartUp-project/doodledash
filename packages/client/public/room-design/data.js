// Room Design — Catalog & Themes
// Single source of truth for shop items and theme objectives

export const CATEGORIES = {
  seating: { label: 'Seating', emoji: '🪑' },
  storage: { label: 'Storage', emoji: '🗄️' },
  lighting: { label: 'Lighting', emoji: '💡' },
  plant: { label: 'Plants', emoji: '🪴' },
  wallArt: { label: 'Wall Art', emoji: '🖼️' },
  tech: { label: 'Tech', emoji: '📺' },
  rug: { label: 'Rugs', emoji: '🟫' },
  toy: { label: 'Toys', emoji: '🧸' },
};

export const TIERS = {
  basic: { label: 'Basic', color: '#8FBF8F' },
  nice: { label: 'Nice', color: '#818CF8' },
  deluxe: { label: 'Deluxe', color: '#FBBF24' },
};

export const ITEMS = [
  // Seating
  { id: 'sofa', name: 'Sofa', emoji: '🛋️', category: 'seating', tier: 'nice', price: 28, tags: ['modern', 'cozy'] },
  { id: 'armchair', name: 'Armchair', emoji: '🪑', category: 'seating', tier: 'basic', price: 14, tags: ['cozy', 'cabin', 'garden'] },
  { id: 'beanbag', name: 'Bean Bag', emoji: '💺', category: 'seating', tier: 'basic', price: 12, tags: ['playroom', 'modern'] },
  { id: 'bed', name: 'Bed', emoji: '🛏️', category: 'seating', tier: 'deluxe', price: 40, tags: ['cozy', 'cabin'] },

  // Storage
  { id: 'bookshelf', name: 'Bookshelf', emoji: '📚', category: 'storage', tier: 'basic', price: 16, tags: ['modern', 'cabin'] },
  { id: 'cabinet', name: 'Cabinet', emoji: '🗄️', category: 'storage', tier: 'nice', price: 22, tags: ['modern'] },
  { id: 'basket', name: 'Toy Basket', emoji: '🧺', category: 'storage', tier: 'basic', price: 10, tags: ['playroom'] },

  // Lighting
  { id: 'lamp', name: 'Floor Lamp', emoji: '💡', category: 'lighting', tier: 'basic', price: 12, tags: ['modern', 'cozy'] },
  { id: 'candle', name: 'Candle', emoji: '🕯️', category: 'lighting', tier: 'basic', price: 6, tags: ['cozy', 'cabin', 'garden'] },
  { id: 'lantern', name: 'Lantern', emoji: '🪔', category: 'lighting', tier: 'nice', price: 18, tags: ['cabin', 'beach'] },

  // Plants
  { id: 'potted-plant', name: 'Potted Plant', emoji: '🪴', category: 'plant', tier: 'basic', price: 10, tags: ['garden', 'modern', 'beach'] },
  { id: 'cactus', name: 'Cactus', emoji: '🌵', category: 'plant', tier: 'basic', price: 8, tags: ['modern', 'beach'] },
  { id: 'palm', name: 'Palm Tree', emoji: '🌴', category: 'plant', tier: 'deluxe', price: 32, tags: ['beach', 'garden'] },
  { id: 'flowers', name: 'Flowers', emoji: '🌸', category: 'plant', tier: 'basic', price: 7, tags: ['garden', 'cozy'] },

  // Wall Art / Decor
  { id: 'art', name: 'Framed Art', emoji: '🖼️', category: 'wallArt', tier: 'nice', price: 20, tags: ['modern', 'cozy'] },
  { id: 'mirror', name: 'Mirror', emoji: '🪞', category: 'wallArt', tier: 'nice', price: 18, tags: ['modern'] },
  { id: 'banner', name: 'Beach Banner', emoji: '🎏', category: 'wallArt', tier: 'basic', price: 9, tags: ['beach', 'playroom'] },

  // Tech
  { id: 'tv', name: 'TV', emoji: '📺', category: 'tech', tier: 'deluxe', price: 35, tags: ['modern'] },

  // Rugs
  { id: 'shag-rug', name: 'Shag Rug', emoji: '🟫', category: 'rug', tier: 'basic', price: 10, tags: ['cozy', 'cabin'] },
  { id: 'beach-mat', name: 'Beach Mat', emoji: '🟨', category: 'rug', tier: 'basic', price: 8, tags: ['beach'] },
  { id: 'round-rug', name: 'Round Rug', emoji: '🟪', category: 'rug', tier: 'nice', price: 15, tags: ['modern'] },

  // Toys
  { id: 'teddy', name: 'Teddy Bear', emoji: '🧸', category: 'toy', tier: 'basic', price: 9, tags: ['playroom', 'cozy'] },
  { id: 'train', name: 'Toy Train', emoji: '🚂', category: 'toy', tier: 'nice', price: 17, tags: ['playroom'] },
  { id: 'puzzle', name: 'Puzzle', emoji: '🧩', category: 'toy', tier: 'basic', price: 6, tags: ['playroom'] },
  { id: 'kite', name: 'Kite', emoji: '🪁', category: 'toy', tier: 'basic', price: 9, tags: ['playroom', 'beach'] },

  // Extra
  { id: 'fireplace', name: 'Fireplace', emoji: '🔥', category: 'seating', tier: 'deluxe', price: 38, tags: ['cabin', 'cozy'] },
];

export const THEMES = [
  {
    id: 'beach',
    name: 'Beach Bungalow',
    emoji: '🏖️',
    description: 'Breezy, sunny, straight off the sand.',
    objectives: [
      { type: 'tag', value: 'beach', count: 3, label: 'Place 3 beach-themed items' },
      { type: 'category', value: 'plant', count: 1, label: 'Add 1 plant' },
      { type: 'category', value: 'seating', count: 1, label: 'Add 1 seating item' },
      { type: 'category', value: 'lighting', count: 1, label: 'Add 1 light source' },
    ],
  },
  {
    id: 'cabin',
    name: 'Cozy Cabin',
    emoji: '🏔️',
    description: 'Warm, woodsy, and snowed-in comfy.',
    objectives: [
      { type: 'tag', value: 'cabin', count: 3, label: 'Place 3 cabin-themed items' },
      { type: 'category', value: 'seating', count: 1, label: 'Add 1 seating item' },
      { type: 'category', value: 'lighting', count: 1, label: 'Add 1 light source' },
      { type: 'category', value: 'rug', count: 1, label: 'Add 1 rug' },
    ],
  },
  {
    id: 'modern',
    name: 'Modern Loft',
    emoji: '🏙️',
    description: 'Sleek, minimal, big-city energy.',
    objectives: [
      { type: 'tag', value: 'modern', count: 3, label: 'Place 3 modern-styled items' },
      { type: 'category', value: 'tech', count: 1, label: 'Add 1 tech item' },
      { type: 'category', value: 'wallArt', count: 1, label: 'Add 1 wall art piece' },
      { type: 'category', value: 'seating', count: 2, label: 'Add 2 seating items' },
    ],
  },
  {
    id: 'playroom',
    name: 'Kids Playroom',
    emoji: '🧸',
    description: 'Bright, fun, built for playtime.',
    objectives: [
      { type: 'tag', value: 'playroom', count: 3, label: 'Place 3 playroom-themed items' },
      { type: 'category', value: 'toy', count: 2, label: 'Add 2 toys' },
      { type: 'category', value: 'storage', count: 1, label: 'Add 1 storage item' },
      { type: 'category', value: 'seating', count: 1, label: 'Add 1 seating item' },
    ],
  },
  {
    id: 'garden',
    name: 'Garden Retreat',
    emoji: '🌿',
    description: 'Lush, green, a little slice of outside.',
    objectives: [
      { type: 'tag', value: 'garden', count: 3, label: 'Place 3 garden-themed items' },
      { type: 'category', value: 'plant', count: 2, label: 'Add 2 plants' },
      { type: 'category', value: 'seating', count: 1, label: 'Add 1 seating item' },
      { type: 'category', value: 'rug', count: 1, label: 'Add 1 rug' },
    ],
  },
];

export function getItem(id) {
  return ITEMS.find(i => i.id === id) || null;
}

export function getTheme(id) {
  return THEMES.find(t => t.id === id) || null;
}

// Bonus coins awarded next round, keyed by star rating (0-5)
export const STAR_BONUS = { 0: 0, 1: 8, 2: 15, 3: 25, 4: 40, 5: 60 };
