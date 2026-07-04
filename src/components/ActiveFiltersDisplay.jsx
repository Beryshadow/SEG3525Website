import React from 'react';

export default function ActiveFiltersDisplay({
  t,
  selectedCategories, setSelectedCategories,
  priceRange, setPriceRange,
  selectedMediums, setSelectedMediums,
  selectedStyles, setSelectedStyles,
  yearRange, setYearRange,
  framedFilter, setFramedFilter,
  signedFilter, setSignedFilter,
  selectedCities, setSelectedCities,
  selectedArtists, setSelectedArtists,
  searchQuery, setSearchQuery,
  stockRange, setStockRange,
}) {
  const chips = [];

  const addChip = (label, onRemove) => {
    chips.push(
      <button 
        key={label} 
        onClick={onRemove}
        className="neu-pressed px-3 py-1.5 rounded-full text-xs flex items-center gap-2 hover:text-red-500 transition-colors bg-bgSecondary"
      >
        <span>{label}</span>
        <i className="fas fa-times text-[10px]"></i>
      </button>
    );
  };

  if (searchQuery) {
    addChip(`"${searchQuery}"`, () => setSearchQuery(''));
  }
  selectedCategories.forEach(cat => {
    addChip(t[cat] || cat, () => setSelectedCategories(prev => prev.filter(c => c !== cat)));
  });
  selectedArtists.forEach(artist => {
    addChip(artist, () => setSelectedArtists(prev => prev.filter(a => a !== artist)));
  });
  selectedCities.forEach(city => {
    const cityKey = city.toLowerCase().replace(/\s+/g, '');
    addChip(t[cityKey] || city, () => setSelectedCities(prev => prev.filter(c => c !== city)));
  });
  selectedMediums.forEach(medium => {
    let mediumKey = medium.toLowerCase().replace(/\s+/g, '');
    if (medium === 'Oil on Canvas') mediumKey = 'oil';
    if (medium === 'Acrylic on Canvas') mediumKey = 'acrylic';
    if (medium === 'Digital Print') mediumKey = 'digital';
    if (medium === 'Gelatin Silver Print') mediumKey = 'gelatin';
    if (medium === 'Ink on Paper') mediumKey = 'ink';
    if (medium === 'Mixed Media') mediumKey = 'mixed';
    addChip(t[mediumKey] || medium, () => setSelectedMediums(prev => prev.filter(m => m !== medium)));
  });
  selectedStyles.forEach(style => {
    const styleKey = style.toLowerCase();
    addChip(t[styleKey] || style, () => setSelectedStyles(prev => prev.filter(s => s !== style)));
  });
  if (priceRange[0] > 0 || priceRange[1] < 1000) {
    addChip(`$${priceRange[0]} - $${priceRange[1]}`, () => setPriceRange([0, 1000]));
  }
  if (yearRange[0] > 1990 || yearRange[1] < 2026) {
    addChip(`${yearRange[0]} - ${yearRange[1]}`, () => setYearRange([1990, 2026]));
  }
  if (stockRange[0] > 0 || stockRange[1] < 25) {
    addChip(`${t.stock}: ${stockRange[0]} - ${stockRange[1]}`, () => setStockRange([0, 25]));
  }
  if (framedFilter !== 'all') {
    addChip(`${t.framed}: ${t[framedFilter]}`, () => setFramedFilter('all'));
  }
  if (signedFilter !== 'all') {
    addChip(`${t.signed}: ${t[signedFilter]}`, () => setSignedFilter('all'));
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 justify-center mt-4">
      {chips}
    </div>
  );
}
