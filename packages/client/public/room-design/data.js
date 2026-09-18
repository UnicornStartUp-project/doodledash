// Room Design — Catalog & Themes
// Single source of truth for shop items and theme objectives.
// All sizes are real-world centimetres: size = [width, depth, height].

export const CATEGORIES = {
  seating: { label: 'Seating', emoji: '🪑', color: '#f6a5b8' },
  storage: { label: 'Storage', emoji: '🗄️', color: '#c9a27e' },
  lighting: { label: 'Lighting', emoji: '💡', color: '#fde68a' },
  plant: { label: 'Plants', emoji: '🪴', color: '#86d3a2' },
  wallArt: { label: 'Wall Art', emoji: '🖼️', color: '#b4a4f0' },
  tech: { label: 'Tech', emoji: '📺', color: '#8fa3c8' },
  rug: { label: 'Rugs', emoji: '🟫', color: '#d9b8e0' },
  toy: { label: 'Toys', emoji: '🧸', color: '#9ad0f5' },
};

export const TIERS = {
  basic: { label: 'Basic', color: '#8FBF8F' },
  nice: { label: 'Nice', color: '#818CF8' },
  deluxe: { label: 'Deluxe', color: '#FBBF24' },
};

// wall: true → must hang on a back wall, at `elev` cm above the floor
export const ITEMS = [
  // Seating
  { id: 'sofa', name: 'Sofa', emoji: '🛋️', category: 'seating', tier: 'nice', price: 280, size: [200, 90, 85], tags: ['modern', 'cozy'] },
  { id: 'armchair', name: 'Armchair', emoji: '🪑', category: 'seating', tier: 'basic', price: 140, size: [85, 85, 90], tags: ['cozy', 'cabin', 'garden'] },
  { id: 'beanbag', name: 'Bean Bag', emoji: '💺', category: 'seating', tier: 'basic', price: 120, size: [80, 80, 60], tags: ['playroom', 'modern'] },
  { id: 'bed', name: 'Bed', emoji: '🛏️', category: 'seating', tier: 'deluxe', price: 400, size: [160, 200, 55], tags: ['cozy', 'cabin'] },
  { id: 'fireplace', name: 'Fireplace', emoji: '🔥', category: 'seating', tier: 'deluxe', price: 380, size: [120, 50, 110], tags: ['cabin', 'cozy'] },

  // Storage
  { id: 'bookshelf', name: 'Bookshelf', emoji: '📚', category: 'storage', tier: 'basic', price: 160, size: [80, 30, 200], tags: ['modern', 'cabin'] },
  { id: 'cabinet', name: 'Cabinet', emoji: '🗄️', category: 'storage', tier: 'nice', price: 220, size: [100, 45, 90], tags: ['modern'] },
  { id: 'basket', name: 'Toy Basket', emoji: '🧺', category: 'storage', tier: 'basic', price: 100, size: [50, 50, 45], tags: ['playroom'] },

  // Lighting
  { id: 'lamp', name: 'Floor Lamp', emoji: '💡', category: 'lighting', tier: 'basic', price: 120, size: [30, 30, 160], tags: ['modern', 'cozy'] },
  { id: 'candle', name: 'Candle', emoji: '🕯️', category: 'lighting', tier: 'basic', price: 60, size: [25, 25, 30], tags: ['cozy', 'cabin', 'garden'] },
  { id: 'lantern', name: 'Lantern', emoji: '🪔', category: 'lighting', tier: 'nice', price: 180, size: [30, 30, 45], tags: ['cabin', 'beach'] },

  // Plants
  { id: 'potted-plant', name: 'Potted Plant', emoji: '🪴', category: 'plant', tier: 'basic', price: 100, size: [40, 40, 90], tags: ['garden', 'modern', 'beach'] },
  { id: 'cactus', name: 'Cactus', emoji: '🌵', category: 'plant', tier: 'basic', price: 80, size: [30, 30, 60], tags: ['modern', 'beach'] },
  { id: 'palm', name: 'Palm Tree', emoji: '🌴', category: 'plant', tier: 'deluxe', price: 320, size: [80, 80, 220], tags: ['beach', 'garden'] },
  { id: 'flowers', name: 'Flowers', emoji: '🌸', category: 'plant', tier: 'basic', price: 70, size: [30, 30, 45], tags: ['garden', 'cozy'] },

  // Wall Art (hangs on a wall)
  { id: 'art', name: 'Framed Art', emoji: '🖼️', category: 'wallArt', tier: 'nice', price: 200, size: [70, 5, 50], wall: true, elev: 140, tags: ['modern', 'cozy'] },
  { id: 'mirror', name: 'Mirror', emoji: '🪞', category: 'wallArt', tier: 'nice', price: 180, size: [50, 5, 120], wall: true, elev: 60, tags: ['modern'] },
  { id: 'banner', name: 'Beach Banner', emoji: '🎏', category: 'wallArt', tier: 'basic', price: 90, size: [120, 5, 30], wall: true, elev: 190, tags: ['beach', 'playroom'] },

  // Tech
  { id: 'tv', name: 'TV', emoji: '📺', category: 'tech', tier: 'deluxe', price: 350, size: [120, 30, 75], tags: ['modern'] },

  // Rugs (flat)
  { id: 'shag-rug', name: 'Shag Rug', emoji: '🟫', category: 'rug', tier: 'basic', price: 100, size: [160, 120, 3], tags: ['cozy', 'cabin'] },
  { id: 'beach-mat', name: 'Beach Mat', emoji: '🟨', category: 'rug', tier: 'basic', price: 80, size: [180, 90, 2], tags: ['beach'] },
  { id: 'round-rug', name: 'Round Rug', emoji: '🟪', category: 'rug', tier: 'nice', price: 150, size: [140, 140, 3], tags: ['modern'] },

  // Toys
  { id: 'teddy', name: 'Teddy Bear', emoji: '🧸', category: 'toy', tier: 'basic', price: 90, size: [35, 30, 50], tags: ['playroom', 'cozy'] },
  { id: 'train', name: 'Toy Train', emoji: '🚂', category: 'toy', tier: 'nice', price: 170, size: [90, 60, 20], tags: ['playroom'] },
  { id: 'puzzle', name: 'Puzzle', emoji: '🧩', category: 'toy', tier: 'basic', price: 60, size: [50, 40, 3], tags: ['playroom'] },
  { id: 'kite', name: 'Kite', emoji: '🪁', category: 'toy', tier: 'basic', price: 90, size: [60, 10, 80], tags: ['playroom', 'beach'] },
];

// room = real size in cm: [width, depth, wall height]
export const THEMES = [
  {
    id: 'beach',
    name: 'Beach Bungalow',
    emoji: '🏖️',
    description: 'Breezy, sunny, straight off the sand.',
    room: [450, 400, 260],
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
    room: [400, 350, 240],
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
    room: [550, 450, 300],
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
    room: [350, 300, 250],
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
    room: [500, 400, 260],
    objectives: [
      { type: 'tag', value: 'garden', count: 3, label: 'Place 3 garden-themed items' },
      { type: 'category', value: 'plant', count: 2, label: 'Add 2 plants' },
      { type: 'category', value: 'seating', count: 1, label: 'Add 1 seating item' },
      { type: 'category', value: 'rug', count: 1, label: 'Add 1 rug' },
    ],
  },
];

// Wall & floor colours are free and cosmetic — swap them any time
export const WALLS = [
  { id: 'cream', name: 'Cream', color: '#f4ece0' },
  { id: 'blush', name: 'Blush', color: '#ffe4ec' },
  { id: 'sky', name: 'Sky Blue', color: '#dbeafe' },
  { id: 'sage', name: 'Sage', color: '#dcefdc' },
  { id: 'lavender', name: 'Lavender', color: '#ebe4ff' },
  { id: 'peach', name: 'Peach', color: '#ffe0c7' },
  { id: 'brick', name: 'Brick', color: '#c9826a' },
  { id: 'wood', name: 'Wood Panel', color: '#d9b48a' },
  { id: 'teal', name: 'Teal', color: '#9fd8d5' },
  { id: 'night', name: 'Night', color: '#3b3d73' },
];

export const FLOORS = [
  { id: 'oak', name: 'Oak', color: '#e8d5b7' },
  { id: 'dark-wood', name: 'Dark Wood', color: '#a8764e' },
  { id: 'tile', name: 'Tile', color: '#e5e7eb' },
  { id: 'carpet', name: 'Carpet', color: '#c7b5e8' },
  { id: 'sand', name: 'Sand', color: '#f7e7c2' },
  { id: 'grass', name: 'Grass', color: '#9fd39f' },
  { id: 'checker', name: 'Sunny', color: '#fde68a' },
  { id: 'stone', name: 'Stone', color: '#b8bcc4' },
];

export function getItem(id) {
  return ITEMS.find(i => i.id === id) || null;
}

export function getTheme(id) {
  return THEMES.find(t => t.id === id) || null;
}

export const STARTING_COINS = 1000;
export const DAILY_ALLOWANCE = 1000;
export const TOPUP_AMOUNT = 1000;

// Bonus coins awarded next round, keyed by star rating (0-5)
export const STAR_BONUS = { 0: 0, 1: 80, 2: 150, 3: 250, 4: 400, 5: 600 };
