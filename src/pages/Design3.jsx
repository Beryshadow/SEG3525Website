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
import ArtShopFilters from '../components/ArtShopFilters';
import ArtShopCart from '../components/ArtShopCart';
import ActiveFiltersDisplay from '../components/ActiveFiltersDisplay';
import SEO from '../utilities/SEO';
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
  const [stockRange, setStockRange] = useState([0, 25]);
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

  const hasActiveFilters = 
    selectedCategories.length > 0 ||
    priceRange[0] > 0 || priceRange[1] < 1000 ||
    selectedMediums.length > 0 ||
    selectedStyles.length > 0 ||
    yearRange[0] > 1990 || yearRange[1] < 2026 ||
    framedFilter !== 'all' ||
    signedFilter !== 'all' ||
    selectedCities.length > 0 ||
    selectedArtists.length > 0 ||
    searchQuery !== '' ||
    stockRange[0] > 0 || stockRange[1] < 5;

  const PAGE_SIZE = 12;
  const BATCH_SIZE = 1000;
  const MAX_PRODUCTS = 10000;

  const [rawProducts, setRawProducts] = useState(() => generateProducts(BATCH_SIZE));
  const [isLoadingMore, setIsLoadingMore] = useState(false);
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
    setStockRange([0, 25]);
    setShowNoResults(false);
  };

  useEffect(() => {
    if (paymentConfirmed && cart.length > 0) {
      setPaymentConfirmed(false);
    }
  }, [cart, paymentConfirmed]);

  useEffect(() => {
    if (callToActionShown) return;

    let inactivityTimer;

    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        setShowCallToAction(true);
        setCallToActionShown(true);
      }, 5000);
    };

    const handleUserActivity = () => {
      resetTimer();
    };

    resetTimer();

    window.addEventListener('mousemove', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);
    window.addEventListener('scroll', handleUserActivity);
    window.addEventListener('click', handleUserActivity);

    return () => {
      clearTimeout(inactivityTimer);
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('scroll', handleUserActivity);
      window.removeEventListener('click', handleUserActivity);
    };
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

  useEffect(() => {
    if (paymentConfirmed && !feedbackSubmitted) {
      const timer = setTimeout(() => {
        setShowFeedbackModal(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [paymentConfirmed, feedbackSubmitted]);

  const loadMoreProducts = useCallback(() => {
    if (isLoadingMore || rawProducts.length >= MAX_PRODUCTS) return;

    setIsLoadingMore(true);

    setTimeout(() => {
      setRawProducts(prev => {
        const amountToGenerate = Math.min(BATCH_SIZE, MAX_PRODUCTS - prev.length);
        const newBatch = generateProducts(amountToGenerate);

        const uniqueBatch = newBatch.map((p, i) => ({
          ...p,
          id: `async-${prev.length}-${p.id || i}`
        }));

        return [...prev, ...uniqueBatch];
      });
      setIsLoadingMore(false);
    }, 600);
  }, [isLoadingMore, rawProducts.length]);

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

  useEffect(() => {
    if (chunks.length > 0 && currentPage >= chunks.length - 3) {
      loadMoreProducts();
    }
  }, [currentPage, chunks.length, loadMoreProducts]);

  useEffect(() => {
    if (
      hasActiveFilters && 
      filteredProducts.length < PAGE_SIZE * 2 && 
      rawProducts.length < MAX_PRODUCTS && 
      !isLoadingMore
    ) {
      loadMoreProducts();
    }
  }, [hasActiveFilters, filteredProducts.length, rawProducts.length, isLoadingMore, loadMoreProducts]);

  const registerHeight = useCallback((index, height) => {
    setChunkHeights(prev => prev[index] === height ? prev : { ...prev, [index]: height });
  }, []);

  const handleSetCurrentPage = useCallback((page) => {
    setCurrentPage(prev => prev === page ? prev : page);
  }, []);

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
      <SEO 
        title={currentLang === 'fr' ? "Vividement minimal & Co" : "Vividly Minimal & Co"}
        description={currentLang === 'fr' ? "Découvrez une collection d'art et d'artisanat unique. Achetez des peintures originales, des sculptures contemporaines et des photographies de collection en édition limitée." : "Browse a collection of unique, handcrafted art creations. Purchase original paintings, contemporary sculptures, and limited edition fine art photography."}
        canonicalUrl="https://ryanbeland.ca/vividly-minimal"
      />
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

            <ArtShopCart 
              t={t}
              cart={cart}
              cartTotal={cartTotal}
              removeFromCart={removeFromCart}
              handlePayment={handlePayment}
              paymentConfirmed={paymentConfirmed}
              setPaymentConfirmed={setPaymentConfirmed}
              onClose={() => setShowCart(false)}
            />
          </div>
        </div>
      )}

      {showFilters && (
        <div className="fixed inset-0 z-50 bg-black/50 lg:hidden flex items-center justify-center p-4" onClick={() => setShowFilters(false)}>
          <div className="neu-flat w-full max-w-md max-h-[90vh] p-6 rounded-2xl overflow-y-auto" onClick={e => e.stopPropagation()}>
            <ArtShopFilters
              t={t}
              resetFilters={resetFilters}
              hasActiveFilters={hasActiveFilters}
              selectedCategories={selectedCategories} setSelectedCategories={setSelectedCategories}
              priceRange={priceRange} setPriceRange={setPriceRange}
              selectedMediums={selectedMediums} setSelectedMediums={setSelectedMediums}
              selectedStyles={selectedStyles} setSelectedStyles={setSelectedStyles}
              yearRange={yearRange} setYearRange={setYearRange}
              framedFilter={framedFilter} setFramedFilter={setFramedFilter}
              signedFilter={signedFilter} setSignedFilter={setSignedFilter}
              selectedCities={selectedCities} setSelectedCities={setSelectedCities}
              selectedArtists={selectedArtists} setSelectedArtists={setSelectedArtists}
              stockRange={stockRange} setStockRange={setStockRange}
              sortOption={sortOption} setSortOption={setSortOption}
              filteredProductsCount={filteredProducts.length}
              ARTIST_POOL={ARTIST_POOL}
              CITIES={CITIES}
              MEDIUMS={MEDIUMS}
              STYLES={STYLES}
              CATEGORIES={CATEGORIES}
            />
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

              <div className="neu-panel p-6">
                <ArtShopFilters
                  t={t}
                  resetFilters={resetFilters}
                  hasActiveFilters={hasActiveFilters}
                  selectedCategories={selectedCategories} setSelectedCategories={setSelectedCategories}
                  priceRange={priceRange} setPriceRange={setPriceRange}
                  selectedMediums={selectedMediums} setSelectedMediums={setSelectedMediums}
                  selectedStyles={selectedStyles} setSelectedStyles={setSelectedStyles}
                  yearRange={yearRange} setYearRange={setYearRange}
                  framedFilter={framedFilter} setFramedFilter={setFramedFilter}
                  signedFilter={signedFilter} setSignedFilter={setSignedFilter}
                  selectedCities={selectedCities} setSelectedCities={setSelectedCities}
                  selectedArtists={selectedArtists} setSelectedArtists={setSelectedArtists}
                  stockRange={stockRange} setStockRange={setStockRange}
                  sortOption={sortOption} setSortOption={setSortOption}
                  filteredProductsCount={filteredProducts.length}
                  ARTIST_POOL={ARTIST_POOL}
                  CITIES={CITIES}
                  MEDIUMS={MEDIUMS}
                  STYLES={STYLES}
                  CATEGORIES={CATEGORIES}
                />
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
                <p className="text-textMuted mb-2">{t.noResults}</p>
                
                <div className="mb-6">
                  <ActiveFiltersDisplay
                    t={t}
                    selectedCategories={selectedCategories} setSelectedCategories={setSelectedCategories}
                    priceRange={priceRange} setPriceRange={setPriceRange}
                    selectedMediums={selectedMediums} setSelectedMediums={setSelectedMediums}
                    selectedStyles={selectedStyles} setSelectedStyles={setSelectedStyles}
                    yearRange={yearRange} setYearRange={setYearRange}
                    framedFilter={framedFilter} setFramedFilter={setFramedFilter}
                    signedFilter={signedFilter} setSignedFilter={setSignedFilter}
                    selectedCities={selectedCities} setSelectedCities={setSelectedCities}
                    selectedArtists={selectedArtists} setSelectedArtists={setSelectedArtists}
                    searchQuery={searchQuery} setSearchQuery={setSearchQuery}
                    stockRange={stockRange} setStockRange={setStockRange}
                  />
                </div>

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

              {/* Loading Indicator */}
              {isLoadingMore && (
                <div className="w-full flex justify-center py-8 opacity-50">
                  <i className="fas fa-spinner fa-spin text-3xl text-accent"></i>
                </div>
              )}
            </div>
          </div>

          <div className="col-12 col-lg-3 d-none d-lg-block">
            <div className="sticky top-12 flex flex-col gap-8 max-h-[calc(100vh-6rem)] overflow-y-auto p-8 -mx-8 sticky-scroll">
              <div className="neu-panel p-6">
                <h4 className="font-bold mb-4 flex items-center gap-2 text-textMain">
                  <i className="fas fa-shopping-cart"></i>
                  {t.cartTitle}
                </h4>
                <ArtShopCart 
                  t={t}
                  cart={cart}
                  cartTotal={cartTotal}
                  removeFromCart={removeFromCart}
                  handlePayment={handlePayment}
                  paymentConfirmed={paymentConfirmed}
                  setPaymentConfirmed={setPaymentConfirmed}
                />
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
