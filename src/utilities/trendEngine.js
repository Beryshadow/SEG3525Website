export const TREND_CITIES_PEAKS = {
  'Paris': 1992,
  'Barcelona': 1996,
  'New York': 2001,
  'Santa Fe': 2005,
  'London': 2010,
  'Amsterdam': 2014,
  'Tokyo': 2024,
  'Berlin': 2018,
  'Florence': 2008,
  'Marrakech': 2012
};

export const TREND_ARTISTS_PEAKS = {
  'Claude Monet': 1993,
  'Pablo Picasso': 2002,
  'Ansel Adams': 2007,
  "Georgia O'Keeffe": 2012,
  'Lucie Rie': 2017,
  'Yuki Tanaka': 2023,
  'Frans Lanting': 2005,
  'Elena Ivanova': 2020,
  'Marco Rossi': 2015,
  'Amara Diallo': 2010
};

export const TREND_CATEGORIES_PEAKS = {
  'painting': 1995,
  'photography': 2008,
  'sculpture': 2020
};

export const ARTIST_CITY_PROVENANCE = {
  'Claude Monet': ['Paris', 'London', 'Florence', 'Barcelona'],
  'Pablo Picasso': ['Barcelona', 'Paris', 'Florence', 'Marrakech'],
  'Ansel Adams': ['Santa Fe', 'New York', 'London'],
  "Georgia O'Keeffe": ['Santa Fe', 'New York', 'Marrakech'],
  'Lucie Rie': ['London', 'Tokyo', 'Amsterdam', 'Berlin'],
  'Frans Lanting': ['Marrakech', 'Santa Fe', 'Tokyo', 'Amsterdam'],
  'Yuki Tanaka': ['Tokyo', 'Berlin', 'New York', 'Amsterdam'],
  'Elena Ivanova': ['Berlin', 'Paris', 'Amsterdam', 'Florence'],
  'Marco Rossi': ['Florence', 'Barcelona', 'Berlin', 'New York'],
  'Amara Diallo': ['Marrakech', 'Paris', 'London', 'Barcelona']
};

// Helper for weighted selection
function selectWeighted(items, weights, rand) {
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  let r = rand() * totalWeight;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

export function getArtistWeight(year, artist) {
  const peak = TREND_ARTISTS_PEAKS[artist] || 2005;
  const dist = Math.abs(year - peak);
  return Math.max(0.05, 1 - dist / 8);
}

export function getCityWeight(year, city) {
  const peak = TREND_CITIES_PEAKS[city] || 2005;
  const dist = Math.abs(year - peak);
  return Math.max(0.05, 1 - dist / 8);
}

export function getCategoryForYear(year, rand, categories) {
  const weights = categories.map(cat => {
    const peak = TREND_CATEGORIES_PEAKS[cat] || 2005;
    const dist = Math.abs(year - peak);
    // Sigmoidal or triangle weight distribution
    return Math.max(0.1, 1 - dist / 15);
  });
  return selectWeighted(categories, weights, rand);
}

export function getCityForYearAndArtist(year, artist, rand, cities) {
  const weights = cities.map(city => {
    // 1. Base trend weight for the city in that year
    const peak = TREND_CITIES_PEAKS[city] || 2005;
    const dist = Math.abs(year - peak);
    const baseWeight = Math.max(0.05, 1 - dist / 8);
    
    // 2. Artist provenance multiplier
    const isPreferred = ARTIST_CITY_PROVENANCE[artist]?.includes(city);
    const multiplier = isPreferred ? 4.0 : 1.0;
    
    return baseWeight * multiplier;
  });
  return selectWeighted(cities, weights, rand);
}

export function getArtistForYear(year, rand, artists) {
  const weights = artists.map(artist => {
    const peak = TREND_ARTISTS_PEAKS[artist] || 2005;
    const dist = Math.abs(year - peak);
    return Math.max(0.05, 1 - dist / 8);
  });
  return selectWeighted(artists, weights, rand);
}

export function getPriceForYear(year, category, rand) {
  // Base price range based on category
  let minBase = 50;
  let maxBase = 500;
  if (category === 'sculpture') {
    minBase = 150;
    maxBase = 800;
  } else if (category === 'painting') {
    minBase = 100;
    maxBase = 700;
  }
  
  const basePrice = minBase + rand() * (maxBase - minBase);
  // Art market inflation trend (prices generally go up over the years)
  const inflationMultiplier = 1 + (year - 1990) * 0.04; // 4% inflation per year
  
  const price = Math.round((basePrice * inflationMultiplier) / 5) * 5;
  return Math.min(1000, Math.max(50, price)); // Clamp to fit range sliders [0, 1000]
}
