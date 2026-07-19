import { hashString, mulberry32 } from './proceduralArt';
import { MEDIUMS, CITIES, STYLES } from '../data/ecommerceData';
import { getCategoryForYear, getCityForYearAndArtist, getArtistForYear, getPriceForYear, getArtistWeight, getCityWeight } from './trendEngine';

export const CITY_POOL = CITIES.map(c => c.label);
export const ARTIST_POOL = ['Claude Monet', 'Pablo Picasso', 'Ansel Adams', "Georgia O'Keeffe", 'Lucie Rie', 'Frans Lanting', 'Yuki Tanaka', 'Elena Ivanova', 'Marco Rossi', 'Amara Diallo'];
export const MEDIUM_POOL = MEDIUMS.map(m => m.label);
export const STYLE_POOL = STYLES.map(s => s.label);

export const ARTIST_SPECIALTIES = {
  'Claude Monet': ['painting'],
  'Pablo Picasso': ['painting', 'sculpture'],
  'Ansel Adams': ['photography'],
  "Georgia O'Keeffe": ['painting'],
  'Lucie Rie': ['sculpture'],
  'Frans Lanting': ['photography'],
  'Yuki Tanaka': ['painting', 'photography'],
  'Elena Ivanova': ['painting'],
  'Marco Rossi': ['sculpture'],
  'Amara Diallo': ['painting']
};

const CATEGORY_IDS = ['painting', 'sculpture', 'photography'];

const ADJECTIVES = {
  painting: [
    'Silent', 'Golden', 'Whispering', 'Hidden', 'Radiant', 'Melancholic', 'Distant', 'Vivid',
    'Ethereal', 'Sublime', 'Serene', 'Infinite', 'Forgotten', 'Ephemeral', 'Luminous', 'Vibrant',
    'Misty', 'Twilight', 'Hallowed', 'Haunting'
  ],
  sculpture: [
    'Fractured', 'Monolithic', 'Woven', 'Suspended', 'Eternal', 'Carved', 'Balanced', 'Rough',
    'Tectonic', 'Fluid', 'Abstracted', 'Ancient', 'Dynamic', 'Organic', 'Geometric', 'Polished',
    'Primal', 'Kinetic', 'Welded', 'Molded'
  ],
  photography: [
    'Fleeting', 'Grainy', 'Nocturnal', 'Candid', 'Faded', 'Sharp', 'Distant', 'Quiet',
    'Stark', 'Atmospheric', 'Transient', 'Obscure', 'Monochrome', 'Contrast', 'Looming', 'Exposed',
    'Raw', 'Intimate', 'Haunting', 'Enigmatic'
  ]
};

const NOUNS = {
  painting: [
    'Landscape', 'Horizon', 'Dream', 'Reflection', 'Garden', 'Skyline', 'Portrait', 'Tide',
    'Nocturne', 'Impression', 'Passage', 'Abyss', 'Sanctuary', 'Echo', 'Symphony', 'Canvas',
    'Chamber', 'Vista', 'Meadow', 'Cascade'
  ],
  sculpture: [
    'Form', 'Monolith', 'Figure', 'Structure', 'Totem', 'Fragment', 'Vessel', 'Column',
    'Torso', 'Relic', 'Assemblage', 'Sphere', 'Obelisk', 'Curvature', 'Slab', 'Gravity',
    'Tension', 'Symmetry', 'Arch', 'Spire'
  ],
  photography: [
    'Street', 'Shadow', 'Moment', 'Frame', 'Silhouette', 'Crowd', 'Light', 'Passage',
    'Vignette', 'Perspective', 'Subject', 'Contrast', 'Intersection', 'Horizon', 'Texture',
    'Exposure', 'Glimpse', 'Isolation', 'Reverie', 'Mirage'
  ]
};

function buildProduct(index, salt) {
  const rand = mulberry32(hashString(`product-${index}-${salt}`));
  
  // Establish temporal context first so we can apply coherent historical trends
  const year = 1990 + Math.floor(rand() * 37);
  
  // Get trend-influenced values based on the year
  const category = getCategoryForYear(year, rand, CATEGORY_IDS);
  
  // Filter artists by their specialized category to ensure correct artistic domain mapping
  const allowedArtists = ARTIST_POOL.filter(artistName => 
    ARTIST_SPECIALTIES[artistName]?.includes(category)
  );
  const artist = getArtistForYear(year, rand, allowedArtists.length > 0 ? allowedArtists : ARTIST_POOL);
  
  // Get city influenced by both year and artist provenance!
  const city = getCityForYearAndArtist(year, artist, rand, CITY_POOL);
  
  const width = 20 + Math.floor(rand() * 100);
  const height = 20 + Math.floor(rand() * 100);
  const depth = category === 'sculpture' ? 20 + Math.floor(rand() * 80) : null;
  const framedRoll = rand() > 0.5;
  const framed = category === 'sculpture' ? false : framedRoll;
  const signed = rand() > 0.4;

  // Calculate size factor (0.0 to 1.0)
  const sizeFactor = category === 'sculpture'
    ? ((width - 20) + (height - 20) + (depth - 20)) / 280
    : ((width - 20) + (height - 20)) / 200;

  let price = getPriceForYear(year, category, rand);

  // Adjust price probabilistically by size (0.5x for tiny works to 1.2x for massive ones, with variance)
  const sizeVariance = 0.8 + rand() * 0.4; // 0.8 to 1.2 random variance
  const sizeMultiplier = (0.5 + sizeFactor * 0.7) * sizeVariance;
  price = price * sizeMultiplier;
  
  const adj = ADJECTIVES[category][Math.floor(rand() * ADJECTIVES[category].length)];
  const noun = NOUNS[category][Math.floor(rand() * NOUNS[category].length)];
  
  // Filter medium by category
  let validMediums = MEDIUM_POOL;
  if (category === 'painting') {
    validMediums = ['Oil on Canvas', 'Acrylic on Canvas', 'Watercolor', 'Ink on Paper', 'Mixed Media'];
  } else if (category === 'sculpture') {
    validMediums = ['Bronze', 'Marble', 'Ceramic', 'Mixed Media'];
  } else if (category === 'photography') {
    validMediums = ['Digital Print', 'Gelatin Silver Print'];
  }
  const medium = validMediums[Math.floor(rand() * validMediums.length)];
  
  // Filter style by category
  let validStyles = STYLE_POOL;
  if (category === 'painting') {
    validStyles = ['Abstract', 'Impressionist', 'Minimalist', 'Surreal', 'Contemporary', 'Realist', 'Expressionist', 'Cubist'];
  } else if (category === 'sculpture') {
    validStyles = ['Abstract', 'Minimalist', 'Contemporary', 'Realist', 'Expressionist'];
  } else if (category === 'photography') {
    validStyles = ['Contemporary', 'Realist', 'Surreal', 'Minimalist'];
  }
  const style = validStyles[Math.floor(rand() * validStyles.length)];
  
  // Generate highly diverse base names using templates incorporating context
  const rollName = rand();
  let name = `${adj} ${noun}`;
  if (rollName < 0.3) {
    name = `${adj} ${noun} in ${city}`;
  } else if (rollName < 0.5) {
    name = `${style} ${noun}`;
  } else if (rollName < 0.65) {
    name = `Study of ${noun}`;
  } else if (rollName < 0.8) {
    name = `${adj} Study of ${noun}`;
  } else if (rollName < 0.9) {
    name = `Impression of ${city}`;
  } else if (rollName < 0.95) {
    name = `Echo of ${city}`;
  } else {
    name = `Shadows of ${city}`;
  }

  // Adjust name, price, and totalUnits based on Category and Replica status
  let totalUnits = 1;
  if (category === 'photography') {
    totalUnits = 5 + Math.floor(rand() * 21); // 5 to 25 units
  } else {
    const isReplica = rand() < 0.15; // 15% chance of being a replica
    if (isReplica) {
      name = `Replica of ${name}`;
      price = price * 0.4; // 60% price reduction
      totalUnits = 5 + Math.floor(rand() * 11); // 5 to 15 units
    } else {
      totalUnits = 1 + Math.floor(rand() * 3); // 1 to 3 units
    }
  }

  // Apply final pricing rounding with a minimum bound of $25
  price = Math.max(25, Math.round(price / 5) * 5);

  // Probabilistic Sales Generation (stock + soldUnits <= totalUnits)
  const artistWeight = getArtistWeight(year, artist);
  const cityWeight = getCityWeight(year, city);
  const popularity = (artistWeight + cityWeight) / 2;
  const ageFactor = (2026 - year) / 36;
  
  // Older items and items by popular artists in peak cities are more likely to sell
  const sellProbability = Math.min(0.95, 0.15 + ageFactor * 0.45 + popularity * 0.35);

  let soldUnits = 0;
  for (let u = 0; u < totalUnits; u++) {
    if (rand() < sellProbability) {
      soldUnits++;
    }
  }
  
  const stock = totalUnits - soldUnits;
  const inStock = stock > 0;

  return { 
    id: index, 
    name, 
    category, 
    price, 
    artist, 
    city, 
    medium, 
    style, 
    year, 
    width, 
    height, 
    depth, 
    framed, 
    signed, 
    stock, 
    inStock,
    soldUnits 
  };
}

export function generateProducts(count) {
  const usedNames = new Set();
  const nameCounts = new Map();
  const products = [];
  
  // Use a strictly fixed seed to ensure exact data consistency on every visit
  const SEED = `artshop-products-fixed-seed`;

  for (let i = 0; i < count; i++) {
    let salt = 0;
    let product = buildProduct(i, `${SEED}-${salt}`);
    while (usedNames.has(product.name) && salt < 15) {
      salt++;
      product = buildProduct(i, `${SEED}-${salt}`);
    }

    if (usedNames.has(product.name)) {
      const baseName = product.name;
      const nextCount = (nameCounts.get(baseName) || 1) + 1;
      nameCounts.set(baseName, nextCount);
      product = { ...product, name: `${baseName} (Study ${nextCount})` };
    } else {
      nameCounts.set(product.name, 1);
    }

    usedNames.add(product.name);
    products.push(product);
  }

  return products;
}
