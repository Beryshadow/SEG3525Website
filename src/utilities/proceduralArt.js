export function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

export function mulberry32(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function svgWrap(inner) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">${inner}</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function initialsOf(product) {
  return product.artist.split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase();
}

function renderPainting(rand, product) {
  const hue1 = Math.floor(rand() * 360);
  const hue2 = (hue1 + 40 + Math.floor(rand() * 80)) % 360;
  const bg = `hsl(${hue1},55%,30%)`;
  const fg = `hsl(${hue2},65%,60%)`;

  let shapes = '';
  const count = 4 + Math.floor(rand() * 4);
  for (let i = 0; i < count; i++) {
    const cx = Math.floor(rand() * 400);
    const cy = Math.floor(rand() * 400);
    const r = 20 + Math.floor(rand() * 80);
    const o = (0.2 + rand() * 0.5).toFixed(2);
    shapes += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fg}" opacity="${o}"/>`;
  }

  return svgWrap(`
    <rect width="400" height="400" fill="${bg}"/>${shapes}
    <text x="200" y="210" font-family="Georgia,serif" font-size="64" fill="rgba(255,255,255,0.85)" text-anchor="middle" dominant-baseline="middle">${initialsOf(product)}</text>
  `);
}

function renderSculpture(rand, product) {
  const hue = Math.floor(rand() * 40) + 20;
  const bg = `hsl(${hue},10%,25%)`;
  const fg = `hsl(${hue},12%,${45 + Math.floor(rand() * 20)}%)`;
  const variant = Math.floor(rand() * 4);
  let shapes = '';

  if (variant === 0) {
    const count = 5 + Math.floor(rand() * 5);
    for (let i = 0; i < count; i++) {
      const x1 = Math.floor(rand() * 400), y1 = Math.floor(rand() * 400);
      const x2 = x1 + Math.floor(rand() * 120 - 60), y2 = y1 + Math.floor(rand() * 120 - 60);
      const x3 = x1 + Math.floor(rand() * 120 - 60), y3 = y1 + Math.floor(rand() * 120 - 60);
      const o = (0.25 + rand() * 0.5).toFixed(2);
      shapes += `<polygon points="${x1},${y1} ${x2},${y2} ${x3},${y3}" fill="${fg}" opacity="${o}"/>`;
    }
  } else if (variant === 1) {
    const rings = 3 + Math.floor(rand() * 4);
    for (let i = 0; i < rings; i++) {
      const r = 30 + i * (30 + Math.floor(rand() * 10));
      const o = (0.15 + rand() * 0.4).toFixed(2);
      shapes += `<circle cx="200" cy="200" r="${r}" fill="none" stroke="${fg}" stroke-width="${4 + Math.floor(rand() * 10)}" opacity="${o}"/>`;
    }
  } else if (variant === 2) {
    const cols = 6 + Math.floor(rand() * 6);
    const colWidth = 400 / cols;
    for (let i = 0; i < cols; i++) {
      const h = 150 + Math.floor(rand() * 200);
      const o = (0.2 + rand() * 0.5).toFixed(2);
      shapes += `<rect x="${i * colWidth}" y="${400 - h}" width="${colWidth * 0.8}" height="${h}" fill="${fg}" opacity="${o}"/>`;
    }
  } else {
    const count = 4 + Math.floor(rand() * 5);
    for (let i = 0; i < count; i++) {
      const x = Math.floor(rand() * 350), y = Math.floor(rand() * 350);
      const w = 30 + Math.floor(rand() * 70), h = 30 + Math.floor(rand() * 70);
      const o = (0.25 + rand() * 0.5).toFixed(2);
      shapes += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="${fg}" opacity="${o}"/>`;
    }
  }

  return svgWrap(`
    <rect width="400" height="400" fill="${bg}"/>${shapes}
    <text x="200" y="210" font-family="'Trebuchet MS',sans-serif" font-size="60" fill="rgba(255,255,255,0.8)" text-anchor="middle" dominant-baseline="middle">${initialsOf(product)}</text>
  `);
}

function renderPhotography(rand, product) {
  const bg = `hsl(0,0%,${12 + Math.floor(rand() * 8)}%)`;
  const variant = Math.floor(rand() * 4);
  const vignetteId = `v${Math.floor(rand() * 100000)}`;
  let extra = '';

  if (variant === 0) {
    for (let i = 1; i < 3; i++) {
      extra += `<line x1="${i * 133}" y1="0" x2="${i * 133}" y2="400" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>`;
      extra += `<line x1="0" y1="${i * 133}" x2="400" y2="${i * 133}" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>`;
    }
  } else if (variant === 1) {
    const trails = 3 + Math.floor(rand() * 4);
    for (let i = 0; i < trails; i++) {
      const y = Math.floor(rand() * 400);
      const curve = Math.floor(rand() * 200 - 100);
      const o = (0.2 + rand() * 0.4).toFixed(2);
      extra += `<path d="M0,${y} Q200,${y + curve} 400,${y}" stroke="rgba(255,255,255,${o})" stroke-width="2" fill="none"/>`;
    }
  } else if (variant === 2) {
    const angle = Math.floor(rand() * 60 - 30);
    extra += `<rect x="-50" y="180" width="500" height="60" fill="rgba(255,255,255,0.08)" transform="rotate(${angle} 200 200)"/>`;
  } else {
    const dots = 40 + Math.floor(rand() * 60);
    for (let i = 0; i < dots; i++) {
      const cx = Math.floor(rand() * 400), cy = Math.floor(rand() * 400);
      const r = 1 + Math.floor(rand() * 2);
      const o = (0.05 + rand() * 0.15).toFixed(2);
      extra += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="rgba(255,255,255,${o})"/>`;
    }
  }

  return svgWrap(`
    <defs>
      <radialGradient id="${vignetteId}" cx="50%" cy="50%" r="70%">
        <stop offset="60%" stop-color="rgba(0,0,0,0)"/>
        <stop offset="100%" stop-color="rgba(0,0,0,0.6)"/>
      </radialGradient>
    </defs>
    <rect width="400" height="400" fill="${bg}"/>${extra}
    <rect width="400" height="400" fill="url(#${vignetteId})"/>
    <rect x="12" y="12" width="376" height="376" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="2"/>
    <text x="200" y="210" font-family="'Courier New',monospace" font-size="56" fill="rgba(255,255,255,0.85)" text-anchor="middle" dominant-baseline="middle">${initialsOf(product)}</text>
  `);
}

export function generateArtImage(product) {
  const seed = hashString(`${product.name}-${product.artist}-${product.city}-${product.category}`);
  const rand = mulberry32(seed);
  if (product.category === 'sculpture') return renderSculpture(rand, product);
  if (product.category === 'photography') return renderPhotography(rand, product);
  return renderPainting(rand, product);
}

const DESC_TEMPLATES = {
  en: {
    painting: [
      p => `A vibrant original canvas from ${p.artist}. This piece leans heavily into the cultural atmosphere of ${p.city}, utilizing form and color to reinterpret local landscapes.`,
      p => `An evocative painting by ${p.artist}. Rooted in the visual language of ${p.city}, it bridges the gap between traditional techniques and a distinctly modern perspective.`,
      p => `Hand-painted by ${p.artist}. This work is a direct response to the energy and textures encountered throughout ${p.city}, making it a deeply personal addition to any collection.`,
      p => `From ${p.artist}'s studio in ${p.city}. An exploration of light and texture, this original painting highlights the subtle nuances of its subject with exceptional brushwork.`,
      p => `A standout physical piece by ${p.artist}. It pulls visual inspiration directly from the streets and history of ${p.city}, balanced by an intense focus on composition.`
    ],
    sculpture: [
      p => `A tactile, multi-dimensional work by ${p.artist}. The piece plays with mass and void, utilizing structural materials that mirror the raw architectural heritage of ${p.city}.`,
      p => `Sculpted by hand by ${p.artist}. This physical form balances weight and negative space, drawing its material texture and conceptual framework from ${p.city}.`,
      p => `An intricate three-dimensional study by ${p.artist}. This sculpture challenges conventional geometry, taking physical cues from both industrial and natural elements found in ${p.city}.`,
      p => `A signed, standalone piece by ${p.artist}. Crafted with an emphasis on texture and form, its structural narrative is deeply tied to the creative ecosystem of ${p.city}.`
    ],
    photography: [
      p => `A limited archival print by ${p.artist}. Shot on location in ${p.city}, this frame emphasizes contrast and geometry over staging, preserving a fleeting urban perspective.`,
      p => `Captured through the lens of ${p.artist}. This photograph documents an unvarnished side of ${p.city}, focusing on composition, natural light, and raw environmental detail.`,
      p => `An exhibition-grade photographic print from ${p.artist}. This work strips away the noise of ${p.city} to focus entirely on texture, shadow, and architectural lines.`,
      p => `A striking visual narrative by ${p.artist}, documenting a precise micro-moment within ${p.city}. Printed with exceptional depth and fidelity.`
    ]
  },
  fr: {
    painting: [
      p => `Une toile originale vibrante signée ${p.artist}. Cette œuvre s'imprègne de l'atmosphère culturelle de ${p.city}, jouant sur les formes pour réinterpréter les paysages locaux.`,
      p => `Une peinture évocatrice de ${p.artist}. Enracinée dans l'identité visuelle de ${p.city}, elle jette un pont entre techniques traditionnelles et regard résolument moderne.`,
      p => `Peint à la main par ${p.artist}. Ce travail répond directement à l'énergie et aux textures observées à ${p.city}, en faisant une pièce hautement personnelle pour toute collection.`,
      p => `Sorti tout droit de l'atelier de ${p.artist} à ${p.city}. Véritable exploration de la lumière, cette peinture originale met en valeur les nuances subtiles de son sujet.`
    ],
    sculpture: [
      p => `Une œuvre tridimensionnelle tactile par ${p.artist}. La pièce joue sur la masse et le vide, utilisant des matériaux bruts qui font écho à l'héritage de ${p.city}.`,
      p => `Façonné à la main par ${p.artist}. Cette sculpture trouve un équilibre parfait entre poids et espace négatif, puisant sa texture et son concept au cœur de ${p.city}.`,
      p => `Une étude en volume complexe signée ${p.artist}. Cette sculpture défie la géométrie classique, s'inspirant des éléments industriels et naturels de ${p.city}.`
    ],
    photography: [
      p => `Un tirage d'art en édition limitée par ${p.artist}. Capturé sur le vif à ${p.city}, ce cadre privilégie le contraste et la géométrie pour immortaliser une perspective urbaine éphémère.`,
      p => `Saisi par l'objectif de ${p.artist}. Cette photographie documente un aspect authentique de ${p.city}, mettant l'accent sur la composition et la lumière naturelle.`,
      p => `Une photographie de qualité exposition par ${p.artist}. Cette œuvre élimine le bruit de ${p.city} pour se concentrer uniquement sur les ombres et les lignes architecturales.`
    ]
  }
};

const ROOM_TEMPLATES = {
  en: [
    p => ` This piece would make an excellent focal point in a living room or study.`,
    p => ` Perfect for a bedroom or hallway, where its subtle tones can be appreciated up close.`,
    p => ` Ideal for a dining room or kitchen space, adding artistic flair to daily life.`,
    p => ` A striking addition to any office or workspace, inspiring creativity throughout the day.`,
    p => ` Suited for a library or reading nook, complementing quiet contemplative spaces.`
  ],
  fr: [
    p => ` Cette œuvre ferait un excellent point focal dans un salon ou une étude.`,
    p => ` Parfaite pour une chambre ou un couloir, où ses tons subtils peuvent être appréciés de près.`,
    p => ` Idéale pour une salle à manger ou espace cuisine, apportant une touche artistique à la vie quotidienne.`,
    p => ` Une addition saisissante à tout bureau ou espace de travail, inspirant créativité tout au long de la journée.`,
    p => ` Adaptée à une bibliothèque ou coin lecture, complétant les espaces contemplatifs.`
  ]
};

const CTA_TEMPLATES = {
  en: ["Learn more", "I want it", "View details", "Discover"],
  fr: ["En savoir plus", "Je la veux", "Voir les détails", "Découvrir"]
};
  
export function generateDescription(product, lang, includeRoomSuggestion = true) {
  const langKey = DESC_TEMPLATES[lang] ? lang : 'en';
  const categoryTemplates = DESC_TEMPLATES[langKey][product.category] || DESC_TEMPLATES[langKey].painting;

  const seed = hashString(`desc-${product.name}-${product.artist}-${product.city}-${product.category}`);
  const rand = mulberry32(seed);
  const index = Math.floor(rand() * categoryTemplates.length);

  let mainDesc = categoryTemplates[index](product);

  if (!includeRoomSuggestion) {
    const firstPeriodIndex = mainDesc.indexOf('.');
    if (firstPeriodIndex !== -1) {
      mainDesc = mainDesc.slice(0, firstPeriodIndex + 1);
    }

    const ctaTemplates = CTA_TEMPLATES[langKey] || CTA_TEMPLATES.en;
    const ctaIndex = Math.floor(rand() * ctaTemplates.length);
    const cta = ctaTemplates[ctaIndex];

    return `"${mainDesc}"\n\n${cta.toUpperCase()} →`;
  }

  const roomTemplates = ROOM_TEMPLATES[langKey] || ROOM_TEMPLATES.en;
  const roomSeed = hashString(`room-${product.name}-${product.artist}`);
  const roomRand = mulberry32(roomSeed);
  const roomIndex = Math.floor(roomRand() * roomTemplates.length);
  const roomSuggestion = roomTemplates[roomIndex](product);

  return mainDesc + roomSuggestion;
}
