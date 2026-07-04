import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSharedLogic } from '../utilities/shared';
import { generateProducts, CITY_POOL, ARTIST_POOL } from '../utilities/productGenerator';
import { TRANSLATIONS as ECOMMERCE_TRANSLATIONS } from '../data/ecommerceData';
import { DASHBOARD_TRANSLATIONS, CURRENCY_CONFIG } from '../data/dashboardData';
import LineChart from '../components/LineChart';
import BarChart from '../components/BarChart';
import RangeSlider from '../components/RangeSlider';
import SEO from '../utilities/SEO';
import '../App.css';
import '../stylesheets/Dashboard.css';

export default function Design4() {
  const navigate = useNavigate();
  const {
    theme, lang,
    isMobileMenuOpen, menuRef, toggleRef, toggleMobileMenu, closeMobileMenu,
    toggleTheme, toggleLang, activeSection, handleScrollToSection
  } = useSharedLogic(['trends', 'comparison']);

  const currentLang = (lang || 'fr').toLowerCase() === 'fr' ? 'fr' : 'en';
  
  // Merge eCommerce translations with Dashboard translations to reuse city/artist/style keys
  const t = useMemo(() => ({
    ...ECOMMERCE_TRANSLATIONS[currentLang],
    ...DASHBOARD_TRANSLATIONS[currentLang]
  }), [currentLang]);

  const themeClass = theme === 'light' ? 'light-mode' : '';

  useEffect(() => {
    document.body.className = `dashboard-route ${themeClass}`;
    return () => {
      document.body.className = '';
    };
  }, [themeClass]);

  // Keybind listener to handle Escape key actions
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isMobileMenuOpen) {
          closeMobileMenu();
        } else {
          navigate('/');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [navigate, isMobileMenuOpen, closeMobileMenu]);

  // Generate a rich seed-based product catalog (10000 artworks to drive trends)
  const products = useMemo(() => generateProducts(10000), []);

  // --- Line Chart States ---
  const [metricLine, setMetricLine] = useState('artworksCount');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [artistFilter, setArtistFilter] = useState('all');
  const [currency, setCurrency] = useState('CAD');

  // --- Bar Chart States ---
  const [barCompareEntity, setBarCompareEntity] = useState('cities');
  const [metricBar, setMetricBar] = useState('salesRevenue');
  const [barCategoryFilter, setBarCategoryFilter] = useState('all');
  const [barYearRange, setBarYearRange] = useState([1990, 2026]);
  const [barLimit, setBarLimit] = useState(8);

  // --- Process Line Chart Data ---
  const lineChartData = useMemo(() => {
    // 1. Filter products for the trendline
    const filtered = products.filter(product => {
      const matchCategory = categoryFilter === 'all' || product.category === categoryFilter;
      const matchCity = cityFilter === 'all' || product.city === cityFilter;
      const matchArtist = artistFilter === 'all' || product.artist === artistFilter;
      return matchCategory && matchCity && matchArtist;
    });

    // 2. Group by year
    const yearGroups = new Map();
    for (let yr = 1990; yr <= 2026; yr++) {
      yearGroups.set(yr, []);
    }

    filtered.forEach(p => {
      if (yearGroups.has(p.year)) {
        yearGroups.get(p.year).push(p);
      }
    });

    // 3. Compute metric for each year
    const result = [];
    yearGroups.forEach((items, year) => {
      let value = 0;
      if (metricLine === 'artworksCount') {
        value = items.length;
      } else if (metricLine === 'totalUnits') {
        value = items.reduce((acc, p) => acc + (p.stock + p.soldUnits), 0);
      } else if (metricLine === 'salesVolume') {
        value = items.reduce((acc, p) => acc + p.soldUnits, 0);
      } else if (metricLine === 'stockVolume') {
        value = items.reduce((acc, p) => acc + p.stock, 0);
      } else if (metricLine === 'avgPrice') {
        if (items.length > 0) {
          const sum = items.reduce((acc, item) => acc + item.price, 0);
          value = sum / items.length;
        }
      } else if (metricLine === 'totalValue') {
        value = items.reduce((acc, p) => acc + (p.stock + p.soldUnits) * p.price, 0);
      } else if (metricLine === 'salesRevenue') {
        value = items.reduce((acc, p) => acc + (p.soldUnits * p.price), 0);
      } else if (metricLine === 'stockValue') {
        value = items.reduce((acc, p) => acc + (p.stock * p.price), 0);
      }
      result.push({ year, value });
    });

    return result;
  }, [products, categoryFilter, cityFilter, artistFilter, metricLine]);

  // --- Process Bar Chart Data ---
  const barChartData = useMemo(() => {
    // 1. Filter products for the comparison bar chart
    const filtered = products.filter(product => {
      const matchCategory = barCategoryFilter === 'all' || product.category === barCategoryFilter;
      const matchYear = product.year >= barYearRange[0] && product.year <= barYearRange[1];
      return matchCategory && matchYear;
    });

    // 2. Group by city or artist
    const groups = new Map();
    const pool = barCompareEntity === 'cities' ? CITY_POOL : ARTIST_POOL;
    
    // Ensure all entities are initialized for a consistent comparison scale
    pool.forEach(key => {
      groups.set(key, []);
    });

    filtered.forEach(p => {
      const key = barCompareEntity === 'cities' ? p.city : p.artist;
      if (groups.has(key)) {
        groups.get(key).push(p);
      }
    });

    // 3. Compute Y values
    const result = [];
    groups.forEach((items, label) => {
      let value = 0;
      if (metricBar === 'artworksCount') {
        value = items.length;
      } else if (metricBar === 'totalUnits') {
        value = items.reduce((acc, p) => acc + (p.stock + p.soldUnits), 0);
      } else if (metricBar === 'salesVolume') {
        value = items.reduce((acc, p) => acc + p.soldUnits, 0);
      } else if (metricBar === 'stockVolume') {
        value = items.reduce((acc, p) => acc + p.stock, 0);
      } else if (metricBar === 'avgPrice') {
        if (items.length > 0) {
          const sum = items.reduce((acc, item) => acc + item.price, 0);
          value = sum / items.length;
        }
      } else if (metricBar === 'totalValue') {
        value = items.reduce((acc, p) => acc + (p.stock + p.soldUnits) * p.price, 0);
      } else if (metricBar === 'salesRevenue') {
        value = items.reduce((acc, p) => acc + (p.soldUnits * p.price), 0);
      } else if (metricBar === 'stockValue') {
        value = items.reduce((acc, p) => acc + (p.stock * p.price), 0);
      }
      result.push({ label, value });
    });

    // Sort descending and slice to top limit
    return result
      .sort((a, b) => b.value - a.value)
      .slice(0, barLimit);
  }, [products, barCompareEntity, barCategoryFilter, barYearRange, metricBar, barLimit]);

  // Sum helper for the Bar Chart based directly on the active chart data
  const barChartSum = useMemo(() => {
    if (barChartData.length === 0) {
      return { value: 0, type: 'count' };
    }
    const total = barChartData.reduce((acc, item) => acc + item.value, 0);
    if (metricBar === 'avgPrice') {
      const avg = total / barChartData.length;
      return { value: avg, type: 'price' };
    }
    const isPrice = ['totalValue', 'salesRevenue', 'stockValue'].includes(metricBar);
    return { value: total, type: isPrice ? 'price' : 'count' };
  }, [barChartData, metricBar]);

  const formatSumValue = (sumObj) => {
    const val = sumObj.value;
    if (sumObj.type === 'count') {
      return val.toLocaleString(currentLang === 'fr' ? 'fr-FR' : 'en-US', { maximumFractionDigits: 0 });
    }
    const config = CURRENCY_CONFIG[currency] || { rate: 1.0, symbol: '$' };
    const converted = val * config.rate;
    const symbol = config.symbol;

    if (currentLang === 'fr') {
      return `${converted.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ${symbol}`;
    } else {
      return `${symbol}${converted.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    }
  };

  const sumLabel = metricBar === 'avgPrice'
    ? (currentLang === 'fr' ? 'Moyenne' : 'Average')
    : (currentLang === 'fr' ? 'Total' : 'Total');

  // Reset filters helper
  const handleResetLineFilters = () => {
    setCategoryFilter('all');
    setCityFilter('all');
    setArtistFilter('all');
    setMetricLine('artworksCount');
    setCurrency('CAD');
  };

  const handleResetBarFilters = () => {
    setBarCompareEntity('cities');
    setMetricBar('salesRevenue');
    setBarCategoryFilter('all');
    setBarYearRange([1990, 2026]);
    setBarLimit(8);
  };

  // Cross-Chart Interaction Handlers
  const handleNodeClick = (year) => {
    // Focus comparison bar chart on the clicked year specifically
    setBarYearRange([year, year]);
    // Match categories for cohesive data drilldown
    setBarCategoryFilter(categoryFilter);
    
    // Automatically switch comparison dimensions if line filters are scoped
    if (cityFilter !== 'all') {
      setBarCompareEntity('artists'); // If a city is active, show the artists in that city
    } else if (artistFilter !== 'all') {
      setBarCompareEntity('cities'); // If an artist is active, show the cities for that artist
    }
    
    // Smoothly scroll down to see the comparison output
    handleScrollToSection('comparison');
  };

  const handleBarClick = (label) => {
    // Filter the timeline based on what compare entity was clicked
    if (barCompareEntity === 'cities') {
      setCityFilter(label);
      setArtistFilter('all'); // Show trendline for the entire selected city
    } else {
      setArtistFilter(label);
      setCityFilter('all'); // Show trendline for the entire selected artist
    }
    // Match categories for cohesive data drilldown
    setCategoryFilter(barCategoryFilter);
    
    // Smoothly scroll back up to the line chart trends view
    handleScrollToSection('trends');
  };

  const priceMetrics = ['avgPrice', 'totalValue', 'salesRevenue', 'stockValue'];
  const isCurrencyVisible = priceMetrics.includes(metricLine) || priceMetrics.includes(metricBar);

  return (
    <div className={`font-sans antialiased overflow-x-hidden min-h-screen flex flex-col ${themeClass}`}>
      <SEO 
        title={currentLang === 'fr' ? "Analytique Aura" : "Aura Analytics"}
        description={currentLang === 'fr' ? "Tableau de bord d'analyse interactive pour la boutique d'art Vividement minimal & Co. Explorez les volumes d'acquisition, les ventes, les stocks et les revenus par ville et par artiste." : "Interactive data analysis dashboard for Vividly Minimal & Co art gallery. Explore acquisition volume, sales, stock, and revenue trends across cities and artists."}
        canonicalUrl="https://ryanbeland.ca/aura-analytics"
      />
      
      {/* Mobile Navbar */}
      <nav className="navbar navbar-dark d-lg-none sticky-top pt-4 px-4 z-50">
        <div className="neu-panel w-100 px-4 py-3 d-flex justify-content-between align-items-center">
          <Link className="font-bold tracking-wider text-accent" to="/" aria-label={t.back}><i className="fas fa-arrow-left"></i></Link>
          <div className="d-flex gap-3 align-items-center">
            <button
              onClick={toggleTheme}
              className="neu-btn w-10 h-10 d-flex align-items-center justify-content-center text-textMain hover:scale-105 transition-transform shrink-0"
              aria-label={theme === 'dark' ? "Switch to light theme" : "Switch to dark theme"}
            >
              {theme === 'dark' ? <i className="fas fa-sun text-lg"></i> : <i className="fas fa-moon text-lg"></i>}
            </button>

            <button
              onClick={toggleLang}
              className="neu-btn w-10 h-10 d-flex align-items-center justify-content-center font-bold text-xs text-textMain hover:scale-105 transition-transform shrink-0"
              aria-label={lang.toUpperCase() === 'FR' ? "Switch to English" : "Changer en français"}
            >
              <span>{lang.toUpperCase() === 'FR' ? 'EN' : 'FR'}</span>
            </button>

            <button
              ref={toggleRef} className="neu-btn w-10 h-10 d-flex align-items-center justify-content-center text-textMain hover:scale-105 transition-transform shrink-0 border-0"
              onClick={toggleMobileMenu}
              aria-expanded={isMobileMenuOpen}
              aria-label="Toggle navigation menu"
            >
              <i className="fas fa-bars text-lg"></i>
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div ref={menuRef} className="mt-4 w-full">
            <div className="neu-pressed p-4">
              <ul className="navbar-nav gap-2">
                <li className="nav-item">
                  <button
                    className={`nav-link w-100 text-start text-textMain border-0 bg-transparent py-2.5 ${activeSection === 'trends' ? 'font-bold text-accent' : ''}`}
                    onClick={() => { handleScrollToSection('trends'); closeMobileMenu(); }}
                  >
                    {t.trendLineTitle}
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link w-100 text-start text-textMain border-0 bg-transparent py-2.5 ${activeSection === 'comparison' ? 'font-bold text-accent' : ''}`}
                    onClick={() => { handleScrollToSection('comparison'); closeMobileMenu(); }}
                  >
                    {t.trendBarTitle}
                  </button>
                </li>
                <li className="nav-item border-top pt-2">
                  <Link className="nav-link text-textMain py-2" to="/" onClick={closeMobileMenu}>
                    {t.back}
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        )}
      </nav>

      {/* Main Grid Layout */}
      <div className="container-fluid max-w-[1500px] mx-auto py-8 lg:py-16 px-4 lg:px-8 flex-grow">
        <div className="row g-5">

          {/* Sidebar Nav (Desktop) */}
          <div className="col-lg-2 d-none d-lg-block">
            <div className="sticky top-12 flex flex-col gap-6">
              <div className="neu-panel p-6 text-center">
                <span className="font-extrabold text-xl tracking-wider text-accent block mb-2">RB</span>
                <span className="text-xs text-textMuted uppercase tracking-widest text-[10px]">Dashboard</span>
              </div>
              <nav className="flex flex-col gap-3">
                <Link to="/" className="neu-btn p-3 flex items-center gap-3 text-sm font-bold w-100 text-start" aria-label={t.back}>
                  <i className="fas fa-arrow-left w-5 text-center"></i>
                  <span>{t.back}</span>
                </Link>
                <button
                  onClick={() => handleScrollToSection('trends')}
                  className={`neu-btn p-3 flex items-center gap-3 text-sm font-bold w-100 text-start ${activeSection === 'trends' ? 'active animate-fade-in' : ''}`}
                >
                  <i className="fas fa-chart-line w-5 text-center"></i>
                  <span>{t.trendLineTitle}</span>
                </button>
                <button
                  onClick={() => handleScrollToSection('comparison')}
                  className={`neu-btn p-3 flex items-center gap-3 text-sm font-bold w-100 text-start ${activeSection === 'comparison' ? 'active animate-fade-in' : ''}`}
                >
                  <i className="fas fa-chart-bar w-5 text-center"></i>
                  <span>{t.trendBarTitle}</span>
                </button>
              </nav>
            </div>
          </div>

          {/* Dashboard Area */}
          <div className="col-lg-9 col-12">
            <div className="dashboard-container">
              
              {/* Header Title Section */}
              <div className="neu-panel p-8 mb-4">
                <h1 className="text-3xl lg:text-4xl font-extrabold text-textMain mb-3">
                  {t.dashboardTitle}
                </h1>
                <p className="text-textMuted text-base lg:text-lg mb-0">
                  {currentLang === 'fr' ? (
                    <>
                      Analyse des acquisitions et des ventes de la galerie d'art (1990 - 2026). Ces données proviennent du générateur procédural de la page <Link to="/vividly-minimal" className="text-accent font-bold hover:underline">Vividement minimal & Co</Link>.
                    </>
                  ) : (
                    <>
                      Analysis of gallery art acquisitions and sales (1990 - 2026). This data is driven by the <Link to="/vividly-minimal" className="text-accent font-bold hover:underline">Vividly Minimal & Co</Link> page procedural generator.
                    </>
                  )}
                </p>
              </div>

              {/* SECTION 1: Line Chart (Trends over time) */}
              <div className="row g-4 scroll-mt-24" id="trends">
                
                {/* Visualizer SVG */}
                <div className="col-12 col-xl-8" style={{ position: 'relative', zIndex: 2 }}>
                  <div className="neu-panel p-6 h-100 flex flex-col gap-2">
                    <div className="mb-2">
                      <h3 className="text-lg font-bold text-textMain mb-1">{t.trendLineTitle}</h3>
                      <p className="text-xs text-textMuted mb-0">{t.trendLineDesc}</p>
                    </div>
                    <div className="flex-grow flex items-center justify-center">
                      <LineChart
                        data={lineChartData}
                        metric={metricLine}
                        currency={currency}
                        lang={currentLang}
                        t={t}
                        onNodeClick={handleNodeClick}
                      />
                    </div>
                  </div>
                </div>

                {/* Filters sidebar card */}
                <div className="col-12 col-xl-4" style={{ position: 'relative', zIndex: 1 }}>
                  <div className="neu-panel p-6 h-100 flex flex-col gap-4">
                    <div className="d-flex flex-col gap-4">
                      <h2 className="text-base font-bold text-accent border-bottom pb-2 mb-2">
                        {t.filterTitle}
                      </h2>

                      {/* Metric Select */}
                      <div className="dashboard-filter-group">
                        <label htmlFor="metric-line-select" className="text-xs text-textMuted font-bold uppercase tracking-wider">
                          {t.metricLabel}
                        </label>
                        <select
                          id="metric-line-select"
                          value={metricLine}
                          onChange={e => setMetricLine(e.target.value)}
                          className="neu-pressed w-100 p-3 rounded-lg text-sm border-0 text-textMain bg-transparent"
                        >
                          <option value="artworksCount">{t.artworksCount}</option>
                          <option value="totalUnits">{t.totalUnits}</option>
                          <option value="salesVolume">{t.salesVolume}</option>
                          <option value="stockVolume">{t.stockVolume}</option>
                          <option value="avgPrice">{t.avgPrice}</option>
                          <option value="totalValue">{t.totalValue}</option>
                          <option value="salesRevenue">{t.salesRevenue}</option>
                          <option value="stockValue">{t.stockValue}</option>
                        </select>
                      </div>

                      {/* Currency Select (Only visible if Y metric involves price) */}
                      {isCurrencyVisible && (
                        <div className="dashboard-filter-group animate-fade-in">
                          <label htmlFor="currency-select" className="text-xs text-textMuted font-bold uppercase tracking-wider">
                            {t.currencyLabel}
                          </label>
                          <select
                            id="currency-select"
                            value={currency}
                            onChange={e => setCurrency(e.target.value)}
                            className="neu-pressed w-100 p-3 rounded-lg text-sm border-0 text-textMain bg-transparent"
                          >
                            <option value="CAD">{t.currencyCAD}</option>
                            <option value="USD">{t.currencyUSD}</option>
                            <option value="EUR">{t.currencyEUR}</option>
                          </select>
                        </div>
                      )}

                      {/* Category Filter */}
                      <div className="dashboard-filter-group">
                        <label htmlFor="category-line-select" className="text-xs text-textMuted font-bold uppercase tracking-wider">
                          {t.selectCategory}
                        </label>
                        <select
                          id="category-line-select"
                          value={categoryFilter}
                          onChange={e => setCategoryFilter(e.target.value)}
                          className="neu-pressed w-100 p-3 rounded-lg text-sm border-0 text-textMain bg-transparent"
                        >
                          <option value="all">{t.allProducts}</option>
                          <option value="painting">{t.painting}</option>
                          <option value="sculpture">{t.sculpture}</option>
                          <option value="photography">{t.photography}</option>
                        </select>
                      </div>

                      {/* City Filter */}
                      <div className="dashboard-filter-group">
                        <label htmlFor="city-line-select" className="text-xs text-textMuted font-bold uppercase tracking-wider">
                          {t.selectCity}
                        </label>
                        <select
                          id="city-line-select"
                          value={cityFilter}
                          onChange={e => setCityFilter(e.target.value)}
                          className="neu-pressed w-100 p-3 rounded-lg text-sm border-0 text-textMain bg-transparent"
                        >
                          <option value="all">{t.allCities}</option>
                          {CITY_POOL.map(city => (
                            <option key={city} value={city}>
                              {t[city.toLowerCase().replace(/\s+/g, '')] || city}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Artist Filter */}
                      <div className="dashboard-filter-group">
                        <label htmlFor="artist-line-select" className="text-xs text-textMuted font-bold uppercase tracking-wider">
                          {t.selectArtist}
                        </label>
                        <select
                          id="artist-line-select"
                          value={artistFilter}
                          onChange={e => setArtistFilter(e.target.value)}
                          className="neu-pressed w-100 p-3 rounded-lg text-sm border-0 text-textMain bg-transparent"
                        >
                          <option value="all">{t.allArtists}</option>
                          {ARTIST_POOL.map(artist => (
                            <option key={artist} value={artist}>
                              {artist}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Reset Button scoped to Line Chart */}
                    <button
                      onClick={handleResetLineFilters}
                      className="neu-btn py-3 px-4 text-sm font-bold w-100 flex items-center justify-center gap-2 mt-2"
                      aria-label="Reset line chart filters"
                    >
                      <i className="fas fa-undo text-xs" aria-hidden="true"></i>
                      <span>{t.resetFilters}</span>
                    </button>
                  </div>
                </div>

              </div>

              {/* SECTION 2: Bar Chart (Comparisons) */}
              <div className="row g-4 mt-2 scroll-mt-24" id="comparison">
                
                {/* Visualizer SVG */}
                <div className="col-12 col-xl-8" style={{ position: 'relative', zIndex: 2 }}>
                  <div className="neu-panel p-6 h-100 flex flex-col gap-2">
                    <div className="mb-2">
                      <h3 className="text-lg font-bold text-textMain mb-1">{t.trendBarTitle}</h3>
                      <p className="text-xs text-textMuted mb-0">{t.trendBarDesc}</p>
                    </div>
                    <div className="flex-grow flex flex-col items-center justify-center">
                      
                      {/* Active metric sum indicator */}
                      <div className="neu-pressed px-3 py-1.5 rounded-lg text-center mb-3">
                        <span className="text-[10px] text-textMuted uppercase tracking-wider block font-bold">
                          {sumLabel} ({barYearRange[0]} - {barYearRange[1]})
                        </span>
                        <span className="text-sm font-extrabold text-accent">
                          {formatSumValue(barChartSum)}
                        </span>
                      </div>

                      <BarChart
                        data={barChartData}
                        metric={metricBar}
                        currency={currency}
                        lang={currentLang}
                        t={t}
                        onBarClick={handleBarClick}
                      />
                    </div>
                  </div>
                </div>

                {/* Filters sidebar card */}
                <div className="col-12 col-xl-4" style={{ position: 'relative', zIndex: 1 }}>
                  <div className="neu-panel p-6 h-100 flex flex-col gap-4">
                    <div className="d-flex flex-col gap-4">
                      <h2 className="text-base font-bold text-accent border-bottom pb-2 mb-2">
                        {t.filterTitle}
                      </h2>

                      {/* Compare Entity (Cities vs Artists) */}
                      <div className="dashboard-filter-group">
                        <span className="text-xs text-textMuted font-bold uppercase tracking-wider block mb-2">
                          {t.entityLabel}
                        </span>
                        <div className="d-flex gap-2">
                          <button
                            onClick={() => setBarCompareEntity('cities')}
                            className={`flex-fill py-2.5 rounded-lg text-xs font-bold ${barCompareEntity === 'cities' ? 'neu-pressed text-accent' : 'neu-btn'}`}
                            aria-pressed={barCompareEntity === 'cities'}
                          >
                            {t.compareCities}
                          </button>
                          <button
                            onClick={() => setBarCompareEntity('artists')}
                            className={`flex-fill py-2.5 rounded-lg text-xs font-bold ${barCompareEntity === 'artists' ? 'neu-pressed text-accent' : 'neu-btn'}`}
                            aria-pressed={barCompareEntity === 'artists'}
                          >
                            {t.compareArtists}
                          </button>
                        </div>
                      </div>

                      {/* Metric Select */}
                      <div className="dashboard-filter-group">
                        <label htmlFor="metric-bar-select" className="text-xs text-textMuted font-bold uppercase tracking-wider">
                          {t.metricLabel}
                        </label>
                        <select
                          id="metric-bar-select"
                          value={metricBar}
                          onChange={e => setMetricBar(e.target.value)}
                          className="neu-pressed w-100 p-3 rounded-lg text-sm border-0 text-textMain bg-transparent"
                        >
                          <option value="salesRevenue">{t.salesRevenue}</option>
                          <option value="salesVolume">{t.salesVolume}</option>
                          <option value="stockValue">{t.stockValue}</option>
                          <option value="stockVolume">{t.stockVolume}</option>
                          <option value="totalValue">{t.totalValue}</option>
                          <option value="totalUnits">{t.totalUnits}</option>
                          <option value="artworksCount">{t.artworksCount}</option>
                          <option value="avgPrice">{t.avgPrice}</option>
                        </select>
                      </div>

                      {/* Category Filter */}
                      <div className="dashboard-filter-group">
                        <label htmlFor="category-bar-select" className="text-xs text-textMuted font-bold uppercase tracking-wider">
                          {t.selectCategory}
                        </label>
                        <select
                          id="category-bar-select"
                          value={barCategoryFilter}
                          onChange={e => setBarCategoryFilter(e.target.value)}
                          className="neu-pressed w-100 p-3 rounded-lg text-sm border-0 text-textMain bg-transparent"
                        >
                          <option value="all">{t.allProducts}</option>
                          <option value="painting">{t.painting}</option>
                          <option value="sculpture">{t.sculpture}</option>
                          <option value="photography">{t.photography}</option>
                        </select>
                      </div>

                      {/* Limit Selector */}
                      <div className="dashboard-filter-group">
                        <label htmlFor="limit-bar-select" className="text-xs text-textMuted font-bold uppercase tracking-wider">
                          {t.topLimitLabel || 'Limit'}
                        </label>
                        <select
                          id="limit-bar-select"
                          value={barLimit}
                          onChange={e => setBarLimit(Number(e.target.value))}
                          className="neu-pressed w-100 p-3 rounded-lg text-sm border-0 text-textMain bg-transparent"
                        >
                          <option value={5}>Top 5</option>
                          <option value={8}>Top 8</option>
                          <option value={10}>Top 10</option>
                        </select>
                      </div>

                      {/* Year Range Slider */}
                      <div className="dashboard-filter-group">
                        <span className="text-xs text-textMuted font-bold uppercase tracking-wider mb-2 block">
                          {t.yearRangeLabel} ({barYearRange[0]} - {barYearRange[1]})
                        </span>
                        <div className="px-1 py-2">
                          <RangeSlider
                            min={1990}
                            max={2026}
                            step={1}
                            value={barYearRange}
                            onChange={setBarYearRange}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Reset Button scoped to Bar Chart */}
                    <button
                      onClick={handleResetBarFilters}
                      className="neu-btn py-3 px-4 text-sm font-bold w-100 flex items-center justify-center gap-2 mt-2"
                      aria-label="Reset bar chart filters"
                    >
                      <i className="fas fa-undo text-xs" aria-hidden="true"></i>
                      <span>{t.resetFilters}</span>
                    </button>
                  </div>
                </div>

              </div>

            </div>
          </div>

          {/* Theme & Language Utilities (Desktop Right Sidebar) */}
          <div className="col-lg-1 d-none d-lg-block">
            <div className="sticky top-12 flex flex-col items-center gap-4">
              <button
                onClick={toggleTheme}
                className="neu-btn w-12 h-12 flex items-center justify-center"
                title={theme === 'dark' ? t.lightMode : t.darkMode}
                aria-label={theme === 'dark' ? "Switch to light theme" : "Switch to dark theme"}
              >
                {theme === 'dark' ? <i className="fas fa-sun theme-icon-sun text-lg"></i> : <i className="fas fa-moon theme-icon-moon text-lg"></i>}
              </button>
              <button
                onClick={toggleLang}
                className="neu-btn w-12 h-12 flex items-center justify-center font-bold"
                title={lang.toUpperCase() === 'FR' ? t.englishLang : t.frenchLang}
                aria-label={lang.toUpperCase() === 'FR' ? "Switch to English" : "Changer en français"}
              >
                <span>{lang.toUpperCase() === 'FR' ? 'EN' : 'FR'}</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
