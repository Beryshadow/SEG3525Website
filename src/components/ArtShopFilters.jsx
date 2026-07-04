import React from 'react';
import FilterSection from './FilterSection';
import RangeSlider from './RangeSlider';

export default function ArtShopFilters({
  t,
  resetFilters,
  hasActiveFilters,
  selectedCategories, setSelectedCategories,
  priceRange, setPriceRange,
  selectedMediums, setSelectedMediums,
  selectedStyles, setSelectedStyles,
  yearRange, setYearRange,
  framedFilter, setFramedFilter,
  signedFilter, setSignedFilter,
  selectedCities, setSelectedCities,
  selectedArtists, setSelectedArtists,
  stockRange, setStockRange,
  sortOption, setSortOption,
  filteredProductsCount,
  ARTIST_POOL,
  CITIES,
  MEDIUMS,
  STYLES,
  CATEGORIES,
}) {
  return (
    <div className="art-filter-section">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-bold text-textMain m-0 flex items-center">
          {t.filterTitle}
          <span className="text-sm font-normal text-textMuted ml-2">({filteredProductsCount})</span>
        </h4>
        <div className={`transition-opacity duration-300 ${hasActiveFilters ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <button
            onClick={resetFilters}
            className="neu-btn px-3 py-1.5 flex items-center justify-center gap-2 text-xs font-bold"
            title={t.resetFilters}
          >
            <i className="fas fa-undo"></i>
            <span className="sr-only lg:not-sr-only">{t.resetFilters}</span>
          </button>
        </div>
      </div>

      <FilterSection title={t.artist}>
        <div className="flex flex-wrap gap-2">
          {ARTIST_POOL.map(artist => (
            <button
              key={artist}
              onClick={() => setSelectedArtists(prev =>
                prev.includes(artist) ? prev.filter(a => a !== artist) : [...prev, artist]
              )}
              className={`filter-chip ${selectedArtists.includes(artist) ? 'neu-pressed text-accent' : 'neu-btn'}`}
            >
              {artist}
            </button>
          ))}
        </div>
      </FilterSection>

      <FilterSection title={t.priceRange}>
        <div className="flex gap-3 mb-2">
          <div className="flex-1">
            <label className="text-xs text-textMuted mb-1 block">{t.minPrice}</label>
            <input type="number" min="0" max={priceRange[1]} value={priceRange[0]}
              onChange={e => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
              className="neu-pressed w-full p-2 rounded-lg text-sm" />
          </div>
          <div className="flex-1">
            <label className="text-xs text-textMuted mb-1 block">{t.maxPrice}</label>
            <input type="number" min={priceRange[0]} max="1000" value={priceRange[1]}
              onChange={e => setPriceRange([priceRange[0], parseInt(e.target.value) || 0])}
              className="neu-pressed w-full p-2 rounded-lg text-sm" />
          </div>
        </div>
        <RangeSlider min={0} max={1000} step={10} value={priceRange} onChange={setPriceRange} />
      </FilterSection>

      <FilterSection title={t.city}>
        <div className="flex flex-wrap gap-2">
          {CITIES.map(item => (
            <button key={item.id}
              onClick={() => setSelectedCities(prev => prev.includes(item.label) ? prev.filter(c => c !== item.label) : [...prev, item.label])}
              className={`filter-chip ${selectedCities.includes(item.label) ? 'neu-pressed text-accent' : 'neu-btn'}`}
            >{t[item.id] || item.label}</button>
          ))}
        </div>
      </FilterSection>

      <FilterSection title={t.medium}>
        <div className="flex flex-wrap gap-2">
          {MEDIUMS.map(item => (
            <button key={item.id}
              onClick={() => setSelectedMediums(prev => prev.includes(item.label) ? prev.filter(m => m !== item.label) : [...prev, item.label])}
              className={`filter-chip ${selectedMediums.includes(item.label) ? 'neu-pressed text-accent' : 'neu-btn'}`}
            >{t[item.id] || item.label}</button>
          ))}
        </div>
      </FilterSection>

      <FilterSection title={t.style} defaultOpen={false}>
        <div className="flex flex-wrap gap-2">
          {STYLES.map(item => (
            <button key={item.id}
              onClick={() => setSelectedStyles(prev => prev.includes(item.label) ? prev.filter(s => s !== item.label) : [...prev, item.label])}
              className={`filter-chip ${selectedStyles.includes(item.label) ? 'neu-pressed text-accent' : 'neu-btn'}`}
            >{t[item.id] || item.label}</button>
          ))}
        </div>
      </FilterSection>

      <FilterSection title={t.year} defaultOpen={false}>
        <div className="flex justify-between text-xs text-textMuted mb-2">
          <span>{yearRange[0]}</span><span>{yearRange[1]}</span>
        </div>
        <RangeSlider min={1990} max={2026} step={1} value={yearRange} onChange={setYearRange} />
      </FilterSection>

      <FilterSection title={t.framed} defaultOpen={false}>
        <div className="flex flex-wrap gap-2">
          {['all', 'yes', 'no'].map(option => (
            <button key={option} onClick={() => setFramedFilter(option)}
              className={`filter-chip ${framedFilter === option ? 'neu-pressed text-accent' : 'neu-btn'}`}
            >{t[option]}</button>
          ))}
        </div>
      </FilterSection>

      <FilterSection title={t.signed} defaultOpen={false}>
        <div className="flex flex-wrap gap-2">
          {['all', 'yes', 'no'].map(option => (
            <button key={option} onClick={() => setSignedFilter(option)}
              className={`filter-chip ${signedFilter === option ? 'neu-pressed text-accent' : 'neu-btn'}`}
            >{t[option]}</button>
          ))}
        </div>
      </FilterSection>

      <FilterSection title={t.stock} defaultOpen={false}>
        <div className="flex justify-between text-xs text-textMuted mb-2">
          <span>{stockRange[0]}</span><span>{stockRange[1]}</span>
        </div>
        <RangeSlider min={0} max={25} step={1} value={stockRange} onChange={setStockRange} />
      </FilterSection>

      <FilterSection title={t.category} defaultOpen={false}>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.filter(cat => cat.id !== 'all').map(cat => (
            <button key={cat.id}
              onClick={() => setSelectedCategories(prev => prev.includes(cat.id) ? prev.filter(id => id !== cat.id) : [...prev, cat.id])}
              className={`filter-chip ${selectedCategories.includes(cat.id) ? 'neu-pressed text-accent' : 'neu-btn'}`}
            >{t[cat.id]}</button>
          ))}
        </div>
      </FilterSection>

      <FilterSection title={t.sort} defaultOpen={false}>
        <select value={sortOption} onChange={e => setSortOption(e.target.value)}
          className="neu-pressed w-full p-3 rounded-lg text-sm">
          <option value="newest">{t.newest}</option>
          <option value="priceLow">{t.priceLow}</option>
          <option value="priceHigh">{t.priceHigh}</option>
        </select>
      </FilterSection>
    </div>
  );
}
