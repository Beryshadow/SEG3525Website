import { hashString, mulberry32 } from './proceduralArt';
import { MEDIUMS, CITIES, STYLES } from '../data/ecommerceData';

export const CITY_POOL = CITIES.map(c => c.label);
export const ARTIST_POOL = ['Claude Monet', 'Pablo Picasso', 'Ansel Adams', "Georgia O'Keeffe", 'Lucie Rie', 'Frans Lanting', 'Yuki Tanaka', 'Elena Ivanova', 'Marco Rossi', 'Amara Diallo'];
export const MEDIUM_POOL = MEDIUMS.map(m => m.label);
export const STYLE_POOL = STYLES.map(s => s.label);

const CATEGORY_IDS = ['painting', 'sculpture', 'photography'];

const ADJECTIVES = {
  painting: ['Silent', 'Golden', 'Whispering', 'Hidden', 'Radiant', 'Melancholic', 'Distant', 'Vivid'],
  sculpture: ['Fractured', 'Monolithic', 'Woven', 'Suspended', 'Eternal', 'Carved', 'Balanced', 'Rough'],
  photography: ['Fleeting', 'Grainy', 'Nocturnal', 'Candid', 'Faded', 'Sharp', 'Distant', 'Quiet']
};

const NOUNS = {
  painting: ['Landscape', 'Horizon', 'Dream', 'Reflection', 'Garden', 'Skyline', 'Portrait', 'Tide'],
  sculpture: ['Form', 'Monolith', 'Figure', 'Structure', 'Totem', 'Fragment', 'Vessel', 'Column'],
  photography: ['Street', 'Shadow', 'Moment', 'Frame', 'Silhouette', 'Crowd', 'Light', 'Passage']
};

function buildProduct(index, salt) {
  const rand = mulberry32(hashString(`product-${index}-${salt}`));
  const category = CATEGORY_IDS[Math.floor(rand() * CATEGORY_IDS.length)];
  const city = CITY_POOL[Math.floor(rand() * CITY_POOL.length)];
  const artist = ARTIST_POOL[Math.floor(rand() * ARTIST_POOL.length)];
  const adj = ADJECTIVES[category][Math.floor(rand() * ADJECTIVES[category].length)];
  const noun = NOUNS[category][Math.floor(rand() * NOUNS[category].length)];
  const price = Math.round((50 + rand() * 950) / 5) * 5;
  
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
  
  const year = 1990 + Math.floor(rand() * 37);
  const width = 20 + Math.floor(rand() * 100);
  const height = 20 + Math.floor(rand() * 100);
  const depth = category === 'sculpture' ? 20 + Math.floor(rand() * 80) : null;
  const framedRoll = rand() > 0.5;
  const framed = category === 'sculpture' ? false : framedRoll;
  const signed = rand() > 0.4;

  const stockWeights = [0.05, 0.55, 0.2, 0.12, 0.05, 0.03];
  let stock = 0;
  let cumulative = 0;
  const roll = rand();
  for (let s = 0; s < stockWeights.length; s++) {
    cumulative += stockWeights[s];
    stock = s;
    if (roll <= cumulative) break;
  }
  const inStock = stock > 0;

  return { id: index, name: `${adj} ${noun}`, category, price, artist, city, medium, style, year, width, height, depth, framed, signed, stock, inStock };
}

export function generateProducts(count) {
  const usedNames = new Set();
  const nameCounts = new Map();
  const products = [];
  
  // Seed based on the day (YYYY-MM-DD)
  const today = new Date();
  const dateString = today.toISOString().split('T')[0]; // Gets YYYY-MM-DD
  const SEED = `artshop-products-${dateString}`;

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
