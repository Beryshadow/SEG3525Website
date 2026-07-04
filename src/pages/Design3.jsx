import React, { useState, useMemo, useEffect, useRef, memo, useCallback } from 'react';
import '../stylesheets/ArtShop.css';
import { Link, useNavigate } from 'react-router-dom';
import { useSharedLogic } from '../utilities/shared';
import ProductCard from '../components/ProductCard';
import ProductModal from '../components/ProductModal';
import PaymentModal from '../components/PaymentModal';
import FeedbackForm from '../components/FeedbackForm';
import CallToAction from '../components/CallToAction';
import RangeSlider from '../components/RangeSlider';
import { TRANSLATIONS, CATEGORIES, MEDIUMS, CITIES, STYLES } from '../data/ecommerceData';
import { CITY_POOL, ARTIST_POOL, MEDIUM_POOL, STYLE_POOL, generateProducts } from '../utilities/productGenerator';
import FilterSection from '../components/FilterSection';
import '../App.css';

const PageChunk = memo(({
  chunk,
  pageIndex,
  currentPage,
  t,
  currentLang,
  addToCart,
  setSelectedProduct,
  registerHeight,
  knownHeight,
  setCurrentPage,
  productStock
}) => {
  const ref = useRef(null);

  const isVisible = Math.abs(pageIndex - currentPage) <= 6;

  useEffect(() => {
    if (isVisible && ref.current) {
      const height = ref.current.getBoundingClientRect().height;
      registerHeight(pageIndex, height);
    }
  }, [isVisible, chunk, registerHeight, pageIndex]);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setCurrentPage(pageIndex);
      }
    }, {
      rootMargin: "-40% 0px -40% 0px"
    });

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [pageIndex, setCurrentPage]);

  if (!isVisible) {
    return (
      <div
        ref={ref}
        style={{ height: knownHeight || 'auto', minHeight: 800 }}
        className="w-full flex flex-col justify-start overflow-hidden mb-6"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pointer-events-none opacity-40">
          {Array.from({ length: chunk.length }).map((_, i) => (
            <div
              key={`skeleton-${i}`}
              className="neu-flat rounded-2xl h-[380px] w-full animate-pulse flex flex-col p-4 gap-4"
            >
              <div className="w-full h-3/4 bg-textMuted/20 rounded-xl"></div>
              <div className="w-2/3 h-4 bg-textMuted/20 rounded"></div>
              <div className="w-1/3 h-4 bg-textMuted/20 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div ref={ref} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
      {chunk.map(product => (
        <ProductCard
          key={product.id}
          product={product}
          t={t}
          lang={currentLang}
          onAddToCart={addToCart}
          onSelectProduct={setSelectedProduct}
          productStock={productStock}
        />
      ))}
    </div>
  );
});

export default function Design3() {
  const navigate = useNavigate();
  const {
    theme,
    appTheme,
    lang,
    toggleTheme, toggleLang
  } = useSharedLogic([]);

  const currentLang = (lang || 'fr').toLowerCase() === 'fr' ? 'fr' : 'en';
  const t = TRANSLATIONS[currentLang];
  const themeClass = appTheme === 'light' ? 'light-mode' : (appTheme === 'dark' ? '' : `theme-${appTheme}`);

  const [selectedCategories, setSelectedCategories] = useState([]);
  const [sortOption, setSortOption] = useState('newest');
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [stockRange, setStockRange] = useState([0, 5]);
  const [selectedMediums, setSelectedMediums] = useState([]);
  const [selectedStyles, setSelectedStyles] = useState([]);
  const [yearRange, setYearRange] = useState([1990, 2026]);
  const [framedFilter, setFramedFilter] = useState('all');
  const [signedFilter, setSignedFilter] = useState('all');
  const [selectedCities, setSelectedCities] = useState([]);
  const [selectedArtists, setSelectedArtists] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNoResults, setShowNoResults] = useState(false);
  const [productStock, setProductStock] = useState({});
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCallToAction, setShowCallToAction] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [callToActionShown, setCallToActionShown] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [paymentData, setPaymentData] = useState(null);

  const PAGE_SIZE = 12;
  const [rawPoolSize, setRawPoolSize] = useState(600);
  const [currentPage, setCurrentPage] = useState(0);
  const [chunkHeights, setChunkHeights] = useState({});
  const [showFilters, setShowFilters] = useState(false);

  const resetFilters = () => {
    setSelectedCategories([]);
    setPriceRange([0, 1000]);
    setSelectedMediums([]);
    setSelectedStyles([]);
    setYearRange([1990, 2026]);
    setFramedFilter('all');
    setSignedFilter('all');
    setSelectedCities([]);
    setSelectedArtists([]);
    setSearchQuery('');
    setStockRange([0, 5]);
    setShowNoResults(false);
  };

  useEffect(() => {
    if (!callToActionShown) {
      const timer = setTimeout(() => {
        setShowCallToAction(true);
        setCallToActionShown(true);
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [callToActionShown]);

  useEffect(() => {
    document.body.className = `artshop-route ${themeClass}`;

    return () => {
      document.body.className = '';
    };
  }, [themeClass]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedProduct(prev => {
          if (prev) return null;

          if (window.innerWidth < 1024) {
            setShowCart(prev => {
              if (prev) return false;

              setShowFilters(prevFilters => {
                if (prevFilters) return false;
                navigate('/');
                return false;
              });
              return false;
            });
          } else {
            navigate('/');
          }
          return prev;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    if (showCart || showFilters || selectedProduct) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [navigate, showCart, showFilters, selectedProduct]);

  // Auto-open feedback form 2 seconds after payment confirmation
  useEffect(() => {
    if (paymentConfirmed && !feedbackSubmitted) {
      const timer = setTimeout(() => {
        setShowFeedbackModal(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [paymentConfirmed, feedbackSubmitted]);

  const rawProducts = useMemo(
    () => generateProducts(rawPoolSize),
    [rawPoolSize]
  );

  const filteredProducts = useMemo(() => rawProducts
    .filter(product =>
      (selectedCategories.length === 0 || selectedCategories.includes(product.category)) &&
      product.price >= priceRange[0] &&
      product.price <= priceRange[1] &&
      (selectedCities.length === 0 || selectedCities.includes(product.city)) &&
      (selectedArtists.length === 0 || selectedArtists.includes(product.artist)) &&
      (selectedMediums.length === 0 || selectedMediums.includes(product.medium)) &&
      (selectedStyles.length === 0 || selectedStyles.includes(product.style)) &&
      product.year >= yearRange[0] && product.year <= yearRange[1] &&
      (framedFilter === 'all' || (framedFilter === 'yes' && product.framed) || (framedFilter === 'no' && !product.framed)) &&
      (signedFilter === 'all' || (signedFilter === 'yes' && product.signed) || (signedFilter === 'no' && !product.signed)) &&
      product.stock >= stockRange[0] && product.stock <= stockRange[1] &&
      (searchQuery === '' ||
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.city.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .sort((a, b) => {
      if (sortOption === 'priceLow') return a.price - b.price;
      if (sortOption === 'priceHigh') return b.price - a.price;
      if (sortOption === 'newest') return b.year - a.year;
      return 0;
    }), [rawProducts, selectedCategories, priceRange, selectedCities, selectedArtists, selectedMediums, selectedStyles, yearRange, framedFilter, signedFilter, stockRange, searchQuery, sortOption]);

  useEffect(() => {
    setShowNoResults(filteredProducts.length === 0 && rawProducts.length > 0);
  }, [filteredProducts.length, rawProducts.length]);

  const chunks = useMemo(() => {
    const result = [];
    for (let i = 0; i < filteredProducts.length; i += PAGE_SIZE) {
      result.push(filteredProducts.slice(i, i + PAGE_SIZE));
    }
    return result;
  }, [filteredProducts]);

  const registerHeight = useCallback((index, height) => {
    setChunkHeights(prev => prev[index] === height ? prev : { ...prev, [index]: height });
  }, []);

  const handleSetCurrentPage = useCallback((page) => {
    setCurrentPage(prev => prev === page ? prev : page);
  }, []);

  useEffect(() => {
    const totalPages = chunks.length;
    if (currentPage >= totalPages - 3) {
      setRawPoolSize(prev => {
        const nextPoolSize = prev + 120;
        return nextPoolSize > 10000 ? 10000 : nextPoolSize;
      });
    }
  }, [currentPage, chunks.length]);

  useEffect(() => {
    if (chunks.length > 0 && currentPage >= chunks.length) {
      setCurrentPage(0);
    }
  }, [chunks.length, currentPage]);

  const addToCart = (product) => {
    setProductStock(prev => ({
      ...prev,
      [product.id]: Math.max(0, (prev[product.id] ?? product.stock) - 1)
    }));

    setCart(prev => {
      const existingItem = prev.find(item => item.id === product.id);
      if (existingItem) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId) => {
    setProductStock(prev => ({
      ...prev,
      [productId]: (prev[productId] ?? 0) + 1
    }));

    setCart(prev => {
      return prev
        .map(item =>
          item.id === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter(item => item.quantity > 0);
    });
  };

  const handlePayment = () => {
    setShowPaymentModal(true);
  };

  const handlePaymentConfirm = (paymentData) => {
    setPaymentData(paymentData);
    setShowPaymentModal(false);
    setCart([]);
    setPaymentConfirmed(true);
  };

  const handleFeedbackClose = () => {
    setShowFeedbackModal(false);
  };

  const handleFeedbackConfirm = () => {
    setShowFeedbackModal(false);
    setFeedbackSubmitted(true);
  };

  const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);

  return (
    <div className={`font-sans antialiased overflow-clip min-h-screen flex flex-col artshop-route ${themeClass}`}>
      <nav className="navbar navbar-dark d-lg-none sticky-top pt-4 px-4 z-50">
        <div className="neu-panel w-100 px-4 py-3 d-flex justify-content-between align-items-center">
          <Link className="font-bold tracking-wider text-accent" to="/"><i className="fas fa-arrow-left"></i></Link>
          <div className="d-flex gap-3 align-items-center">
            <button
              onClick={() => setShowCart(!showCart)}
              className="neu-btn w-10 h-10 d-flex d-lg-none align-items-center justify-content-center text-textMain hover:scale-105 transition-transform shrink-0"
            >
              <i className="fas fa-shopping-cart text-lg"></i>
              {cart.length > 0 && (
                <span className="absolute top-0 right-0 bg-accent text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {cart.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="neu-btn w-10 h-10 d-flex d-lg-none align-items-center justify-content-center text-textMain hover:scale-105 transition-transform shrink-0"
            >
              <i className="fas fa-sliders text-lg"></i>
            </button>

            <button
              onClick={toggleTheme}
              className="neu-btn w-10 h-10 d-flex d-lg-none align-items-center justify-content-center text-textMain hover:scale-105 transition-transform shrink-0"
            >
              {theme === 'dark' ? <i className="fas fa-sun text-lg"></i> : <i className="fas fa-moon text-lg"></i>}
            </button>

            <button
              onClick={toggleLang}
              className="neu-btn w-10 h-10 d-flex d-lg-none align-items-center justify-content-center font-bold text-xs text-textMain hover:scale-105 transition-transform shrink-0"
            >
              <span>{lang.toUpperCase() === 'FR' ? 'EN' : 'FR'}</span>
            </button>

          </div>
        </div>
      </nav>

      {showCart && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden flex items-center justify-center p-4" onClick={() => setShowCart(false)}>
          <div className="neu-flat w-full max-w-md max-h-[80vh] p-6 rounded-2xl overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">{t.cartTitle}</h3>
              <button onClick={() => setShowCart(false)} className="neu-btn w-8 h-8 flex items-center justify-center">
                <i className="fas fa-times"></i>
              </button>
            </div>

            {paymentConfirmed ? (
              <div className="text-center py-8">
                <i className="fas fa-check-circle text-accent text-5xl mb-4 block"></i>
                <h4 className="text-lg font-bold mb-2">{t.thankYou}</h4>
                <p className="text-sm text-textMuted mb-6">{t.paymentProcessed}</p>
                <button
                  onClick={() => {
                    setPaymentConfirmed(false);
                    setShowCart(false);
                  }}
                  className="neu-btn w-full py-3 font-bold"
                >
                  {t.close || 'Close'}
                </button>
              </div>
            ) : (
              <>
                {cart.length === 0 ? (
                  <p className="text-sm text-textMuted italic">{t.cartEmpty}</p>
                ) : (
                  <div className="space-y-3 max-h-[50vh] overflow-y-auto">
                    {cart.map(item => (
                      <div key={item.id} className="flex justify-between items-center p-3 neu-pressed rounded-lg">
                        <div className="flex-1">
                          <div className="font-bold text-sm">{item.name}</div>
                          <div className="text-xs text-textMuted">${item.price.toFixed(2)} × {item.quantity}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm">${(item.price * item.quantity).toFixed(2)}</span>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="neu-btn w-8 h-8 flex items-center justify-center"
                          >
                            <i className="fas fa-times text-xs"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-4 border-t pt-4">
                  <div className="flex justify-between font-bold">
                    <span>{t.cartTotal}</span>
                    <span>${cartTotal.toFixed(2)}</span>
                  </div>
                  <button
                    onClick={handlePayment}
                    disabled={cartTotal === 0}
                    className="neu-btn w-full mt-4 py-3 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {cartTotal === 0 ? t.addArtFirst || 'Add art first' : t.bookInstantly}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {showFilters && (
        <div className="fixed inset-0 z-50 bg-black/50 lg:hidden flex items-center justify-center p-4" onClick={() => setShowFilters(false)}>
          <div className="neu-flat w-full max-w-md max-h-[90vh] p-6 rounded-2xl overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">{t.filterTitle}</h3>
              <button onClick={() => setShowFilters(false)} className="neu-btn w-8 h-8 flex items-center justify-center">
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="space-y-4">
              <button
                onClick={resetFilters}
                className="neu-btn w-full mb-4 py-2 flex items-center justify-center gap-2 text-sm"
              >
                <i className="fas fa-undo"></i>
                <span>{t.resetFilters}</span>
              </button>

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
                <RangeSlider min={0} max={5} step={1} value={stockRange} onChange={setStockRange} />
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
          </div>
        </div>
      )}

      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          t={t}
          lang={currentLang}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={addToCart}
        />
      )}

      {showPaymentModal && (
        <PaymentModal
          t={t}
          onClose={() => setShowPaymentModal(false)}
          onConfirm={handlePaymentConfirm}
          cartItems={cart}
          cartTotal={cartTotal}
        />
      )}

      {showFeedbackModal && (
        <FeedbackForm
          t={t}
          onClose={handleFeedbackClose}
          onConfirm={handleFeedbackConfirm}
          prefillData={paymentData}
        />
      )}

      {showCallToAction && (
        <CallToAction
          t={t}
          onClose={() => setShowCallToAction(false)}
        />
      )}

      <div className="container-fluid max-w-[1500px] mx-auto py-8 lg:py-16 px-4 lg:px-8 flex-grow">
        <div className="row g-5">

          <div className="col-12 col-lg-2 d-none d-lg-block">
            <div className="sticky top-12 flex flex-col gap-8 max-h-[calc(100vh-6rem)] overflow-y-auto p-8 -mx-8 sticky-scroll">
              <div className="neu-panel p-6 text-center">
                <span className="font-extrabold text-xl tracking-wider text-accent block mb-2">RB</span>
                <span className="text-xs text-textMuted uppercase tracking-widest">Art Shop</span>
              </div>

              <nav className="flex flex-col gap-4">
                <Link to="/" className="neu-btn p-4 flex items-center gap-4 text-sm font-bold">
                  <i className="fas fa-arrow-left w-5 text-center"></i>
                  <span>{t.back}</span>
                </Link>
              </nav>

              <div className="art-filter-section neu-panel">
                <h4 className="font-bold mb-4 text-textMain">{t.filterTitle}</h4>
                <button
                  onClick={resetFilters}
                  className="neu-btn w-full mb-4 py-2 flex items-center justify-center gap-2 text-sm"
                >
                  <i className="fas fa-undo"></i>
                  <span>{t.resetFilters}</span>
                </button>


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
                        onChange={e => setPriceRange([parseInt(e.target.value), priceRange[1]])}
                        className="neu-pressed w-full p-2 rounded-lg text-sm" />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-textMuted mb-1 block">{t.maxPrice}</label>
                      <input type="number" min={priceRange[0]} max="1000" value={priceRange[1]}
                        onChange={e => setPriceRange([priceRange[0], parseInt(e.target.value)])}
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
                  <RangeSlider min={0} max={5} step={1} value={stockRange} onChange={setStockRange} />
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
            </div>
          </div>

          <div className="col-12 col-lg-7">
            <div className="mb-10 text-center">
              <h1 className="text-4xl font-extrabold mb-2">
                {t.title.split('&').map((part, i, arr) => (
                  <React.Fragment key={i}>
                    {part}
                    {i < arr.length - 1 && (
                      <span style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic", fontWeight: 400 }}>
                        &amp;
                      </span>
                    )}
                  </React.Fragment>
                ))}
              </h1>
              <p className="text-textMuted max-w-2xl mx-auto">{t.desc}</p>
            </div>

            <div className="mb-6 flex flex-wrap justify-between gap-4">
              <input
                type="text"
                placeholder={t.searchPlaceholder}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="neu-pressed flex-1 p-3 rounded-lg text-sm"
              />
              <select
                value={sortOption}
                onChange={e => setSortOption(e.target.value)}
                className="neu-pressed w-full md:w-64 p-3 rounded-lg text-sm"
              >
                <option value="newest">{t.newest}</option>
                <option value="priceLow">{t.priceLow}</option>
                <option value="priceHigh">{t.priceHigh}</option>
              </select>
            </div>

            {showNoResults && (
              <div className="text-center py-12 px-6 neu-panel rounded-2xl">
                <i className="fas fa-filter text-accent text-4xl mb-4 block"></i>
                <p className="text-textMuted mb-4">{t.noResults}</p>
                <button
                  onClick={resetFilters}
                  className="neu-btn px-6 py-3 font-bold flex items-center gap-2 mx-auto"
                >
                  <i className="fas fa-undo"></i>
                  <span>{t.resetFilters}</span>
                </button>
              </div>
            )}

            <div>
              {chunks.map((chunk, index) => (
                <PageChunk
                  key={`chunk-${index}`}
                  chunk={chunk}
                  pageIndex={index}
                  currentPage={currentPage}
                  t={t}
                  currentLang={currentLang}
                  addToCart={addToCart}
                  setSelectedProduct={setSelectedProduct}
                  registerHeight={registerHeight}
                  knownHeight={chunkHeights[index]}
                  setCurrentPage={handleSetCurrentPage}
                  productStock={productStock}
                />
              ))}
            </div>
          </div>

          <div className="col-12 col-lg-3 d-none d-lg-block">
            <div className="sticky top-12 flex flex-col gap-8 max-h-[calc(100vh-6rem)] overflow-y-auto p-8 -mx-8 sticky-scroll">
              <div className="neu-panel p-6">
                {paymentConfirmed ? (
                  <div className="text-center py-8">
                    <i className="fas fa-check-circle text-accent text-5xl mb-4 block"></i>
                    <h4 className="text-lg font-bold mb-2">{t.thankYou}</h4>
                    <p className="text-sm text-textMuted mb-6">{t.paymentProcessed}</p>
                    <button
                      onClick={() => setPaymentConfirmed(false)}
                      className="neu-btn w-full py-3 font-bold"
                    >
                      {t.close || 'Close'}
                    </button>
                  </div>
                ) : (
                  <>
                    <h4 className="font-bold mb-4 flex items-center gap-2 text-textMain">
                      <i className="fas fa-shopping-cart"></i>
                      {t.cartTitle}
                    </h4>

                    {cart.length === 0 ? (
                      <p className="text-sm text-textMuted italic">{t.cartEmpty}</p>
                    ) : (
                      <div className="space-y-3 max-h-[50vh] overflow-y-auto">
                        {cart.map(item => (
                          <div key={item.id} className="flex justify-between items-center p-3 neu-pressed rounded-lg">
                            <div className="flex-1">
                              <div className="font-bold text-sm">{item.name}</div>
                              <div className="text-xs text-textMuted">${item.price.toFixed(2)} × {item.quantity}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm">${(item.price * item.quantity).toFixed(2)}</span>
                              <button
                                onClick={() => removeFromCart(item.id)}
                                className="neu-btn w-8 h-8 flex items-center justify-center"
                              >
                                <i className="fas fa-times text-xs"></i>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="mt-4 border-t pt-4">
                      <div className="flex justify-between font-bold mb-4">
                        <span>{t.cartTotal}</span>
                        <span>${cartTotal.toFixed(2)}</span>
                      </div>
                      <button
                        onClick={handlePayment}
                        disabled={cartTotal === 0}
                        className="neu-btn w-full py-3 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {cartTotal === 0 ? t.addArtFirst || 'Add art first' : t.bookInstantly}
                      </button>
                    </div>
                  </>
                )}
              </div>

              <div className="flex flex-col gap-4">
                <button onClick={toggleTheme} className="neu-btn w-full py-3 flex items-center justify-center">
                  {theme === 'dark' ? <i className="fas fa-sun me-2"></i> : <i className="fas fa-moon me-2"></i>}
                  {theme === 'dark' ? t.lightMode : t.darkMode}
                </button>

                <button onClick={toggleLang} className="neu-btn w-full py-3 flex items-center justify-center font-bold">
                  <span>{lang.toUpperCase() === 'FR' ? t.englishLang : t.frenchLang}</span>
                </button>

                <button
                  onClick={() => setShowFeedbackModal(true)}
                  className="neu-btn w-full py-3 flex items-center justify-center"
                >
                  <i className="fas fa-comment me-2"></i>
                  <span>{t.feedback || 'Feedback'}</span>
                  {paymentConfirmed && !feedbackSubmitted && (
                    <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full"></span>
                  )}
                </button>

                <a href="#top" className="neu-btn w-full py-3 flex items-center justify-center" title={t.navScrollTop || 'Back to Top'}>
                  <i className="fas fa-arrow-up me-2"></i>
                  <span>{t.navScrollTop || 'Back to Top'}</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
