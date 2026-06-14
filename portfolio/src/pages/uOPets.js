import { createPortal } from 'react-dom';
import { useState, useEffect } from 'react';
import '../App.css';
import '../Vet.css';
import { useSharedLogic } from '../shared';
import { useNavigate } from 'react-router-dom';
import SVG from 'react-inlinesvg';
import { TRANSLATIONS, SERVICES_DATA, TEAM_DATA, USER_DATA, CATEGORIES } from '../data/vetData';

export default function VetPortal() {
  const [cart, setCart] = useState([]);
  const [selectedTimes, setSelectedTimes] = useState({});
  const [selectedDates, setSelectedDates] = useState({});
  const [activeFilter, setActiveFilter] = useState('All');
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const [openDropdowns, setOpenDropdowns] = useState({
    pets: true,
    appointments: false,
    bills: false,
    history: false
  });

  const [formState, setFormState] = useState({
    selectedPet: 'none',
    isNewClient: false,
    newEmail: '',
    newPetName: '',
    urgency: 'Standard',
    reason: '',
    notes: ''
  });

  const navigate = useNavigate();
  const {
    theme, lang, activeSection,
    isMobileMenuOpen, menuRef, toggleRef, toggleMobileMenu, closeMobileMenu,
    toggleTheme, toggleLang, handleScrollToSection
  } = useSharedLogic(['about', 'team', 'services', 'booking', 'contact']);

  const currentLangKey = (lang || 'fr').toLowerCase() === 'fr' ? 'FR' : 'EN';
  const t = TRANSLATIONS[currentLangKey];

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isAccountOpen) {
          setIsAccountOpen(false);
        } else {
          navigate('/');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    if (isAccountOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isAccountOpen, navigate]);

  const handleDateChange = (serviceId, value) => {
    setSelectedDates(prev => ({ ...prev, [serviceId]: value }));
  };

  const handleTimeChange = (serviceId, time) => {
    setSelectedTimes(prev => ({
      ...prev,
      [serviceId]: time
    }));
  };

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage("");
    }, 4000);
  };

  const handleAddToCart = (service) => {
    const chosenDate = selectedDates[service.id];
    const chosenTime = selectedTimes[service.id];

    if (!chosenDate) {
      showToast(TRANSLATIONS[currentLangKey].alertDate);
      return;
    }

    const cartItemId = `${service.id}-${Date.now()}`;
    const item = {
      ...service,
      cartItemId,
      selectedDate: chosenDate,
      selectedTime: chosenTime
    };

    setCart(prev => [...prev, item]);
  };

  const handleRemoveFromCart = (cartItemId) => {
    setCart(prev => prev.filter(item => item.cartItemId !== cartItemId));
  };

  const transferCartToNotes = () => {
    if (cart.length === 0) return;
    const notesString = cart.map(item => `- ${item.name[currentLangKey]} (${item.selectedDate} ${item.selectedTime})`).join('\n');

    setFormState(prev => ({
      ...prev,
      notes: prev.notes ? `${prev.notes}\n\n${t.servicesRequired}\n${notesString}` : `${t.servicesRequired}\n${notesString}`
    }));
    document.getElementById('booking').scrollIntoView({ behavior: 'smooth' });
  };

  const toggleDropdown = (key) => setOpenDropdowns(prev => ({ ...prev, [key]: !prev[key] }));

  const cartTotal = cart.reduce((acc, curr) => acc + curr.price, 0);

  const filteredServices = activeFilter === 'All'
    ? SERVICES_DATA
    : SERVICES_DATA.filter(srv => srv.tags.includes(activeFilter));

  const navItems = [
    { id: 'about', icon: 'fa-clinic-medical', label: t.navClinic },
    { id: 'team', icon: 'fa-users-cog', label: t.navTeam },
    { id: 'services', icon: 'fa-hand-holding-heart', label: t.navServices },
    { id: 'booking', icon: 'fa-calendar-check', label: t.navBooking },
    { id: 'contact', icon: 'fa-phone', label: t.navContact }
  ];

  return (
    <div className={`${theme === 'light' ? 'light-mode' : ''} vet-route`}>
      <div className="min-h-screen font-sans text-[var(--text-main)] transition-colors duration-300 relative">
        {typeof document !== 'undefined' && createPortal(
          <a
            href="/maquettes.pdf"
            target="_blank"
            rel="noopener noreferrer"
            style={{ position: 'fixed', top: '40px', right: '40px', zIndex: 9999 }}
            className="hidden lg:flex w-10 h-10 items-center justify-center shrink-0 text-textMain hover:scale-105 transition-transform neu-btn text-decoration-none"
          >
            <i className="fas fa-file-pdf text-2xl"></i>
          </a>,
          document.body
        )}
        <nav className="navbar navbar-dark sticky-top z-50 w-full px-4 pt-4 mb-8 d-flex flex-column align-items-center">
          <div className="neu-panel w-full lg:w-auto px-4 py-3 d-flex justify-content-between align-items-center gap-4 lg:gap-8">
            <button
              className="neu-btn w-10 h-10 d-flex d-lg-none align-items-center justify-content-center hover:scale-105 transition-transform shrink-0"
              onClick={() => window.location.href = 'tel:911'}
              aria-label="Dial Emergency Number"
            >
              <SVG
                src="/emergencyPhoneIcon.svg"
                className="h-6 w-6 block mx-auto text-[#FF746C]"
                fill="currentColor"
              />
            </button>

            <span className="d-none d-lg-block font-bold uppercase tracking-widest text-accent text-sm truncate" style={{ color: '#FF746C' }}>
              <i className="fas fa-phone text-xl text-accent"></i> {t.emergencyLabel}
            </span>

            <span className="d-none d-lg-block font-bold uppercase tracking-widest text-accent text-sm truncate">|</span>

            <span className="d-none d-sm-flex d-lg-none align-items-center justify-content-center text-2xl lg:text-6xl font-black leading-none">
              {t.heroTitle}
            </span>

            <div className="d-flex align-items-center gap-3">
              <button
                onClick={() => setIsAccountOpen(true)}
                className="neu-btn w-10 h-10 d-flex d-lg-none align-items-center justify-content-center text-textMain hover:scale-105 transition-transform shrink-0"
              >
                <i className="fas fa-user-circle text-2xl"></i>
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

              <button
                ref={toggleRef} className="neu-btn w-10 h-10 d-flex d-lg-none align-items-center justify-content-center text-textMain hover:scale-105 transition-transform shrink-0 border-0"
                onClick={toggleMobileMenu}
              >
                <i className="fas fa-bars text-lg"></i>
              </button>

              <a
                href="#booking"
                onClick={() => setFormState(prev => ({ ...prev, urgency: 'Prioritaire' }))}
                className="d-none d-lg-block font-bold tracking-wider text-accent text-decoration-none ml-2 whitespace-nowrap"
              >
                {t.priorityBooking}
              </a>
            </div>
          </div>

          {isMobileMenuOpen && (
            <div ref={menuRef} className="mt-2 w-full d-lg-none">
              <div className="neu-pressed p-4 w-full">
                <ul className="navbar-nav gap-3">
                  {navItems.map((item) => (
                    <li key={item.id} className="nav-item">
                      <a
                        href={`#${item.id}`}
                        className="nav-link d-flex align-items-center gap-3 py-2 text-inherit text-decoration-none"
                        onClick={closeMobileMenu}
                      >
                        <i className={`fas ${item.icon} w-5 text-accent`}></i>
                        <span>{item.label}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </nav>

        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-[250] neu-panel px-6 py-4 border-l-4 border-accent max-w-sm flex items-center gap-3 animate-bounce">
            <i className="fas fa-info-circle text-accent text-xl"></i>
            <span className="text-sm font-bold text-textMain">{toastMessage}</span>
          </div>
        )}

        <div className="container-fluid max-w-[1500px] mx-auto px-4 lg:px-8 mt-6">
          <div className="row g-5">
            <div className="col-lg-2 d-none d-lg-block">
              <div className="sticky top-24 flex flex-col gap-6 py-6">
                <div className="neu-panel p-6 text-center">
                  <img
                    src="/dog.svg"
                    alt="uOPETS Logo"
                    className="h-12 w-auto object-contain block mx-auto mb-2"
                  />
                  <span className="text-xs text-textMuted uppercase tracking-widest">{t.heroUnderTitle}</span>
                </div>

                <nav className="flex flex-col gap-4">
                  {navItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleScrollToSection(item.id)}
                      className={`neu-btn p-4 flex items-center gap-4 text-base font-bold text-left w-full ${activeSection === item.id ? 'active' : ''}`}
                    >
                      <i className={`fas ${item.icon} w-5 text-accent`}></i>
                      <span>{item.label}</span>
                    </button>
                  ))}
                </nav>

              </div>
            </div>
            <div className="col-lg-9 pt-6">
              <section id="about" className="flex flex-col justify-center py-12 lg:py-20">
                <div className="neu-panel p-8 lg:p-12">
                  <div className="row align-items-center g-5">
                    <div className="col-lg-6 mb-4 mb-lg-0">
                      <span className="text-xs font-black uppercase tracking-widest text-accent bg-accent/10 px-4 py-2 rounded-full inline-block mb-4">
                        uOttawa — Ottawa
                      </span>
                      <h1 className="text-5xl lg:text-6xl font-black mb-6 uppercase tracking-tighter leading-none text-textMain">
                        {t.heroTitle}
                      </h1>
                      <p className="text-lg text-textMuted leading-relaxed mb-8 max-w-xl">
                        {t.heroSubtitle}
                      </p>
                      <div className="flex flex-wrap gap-4">
                        <a
                          href="#booking"
                          onClick={() => setFormState(prev => ({ ...prev, isNewClient: true }))}
                          className="neu-btn px-8 py-4 font-black text-accent uppercase text-sm no-underline tracking-wider transition-transform hover:scale-[1.02] active:scale-95"
                        >
                          {t.admissionBtn}
                        </a>
                        <a href="#services" className="neu-btn px-8 py-4 font-bold text-textMuted uppercase text-sm no-underline tracking-wider transition-transform hover:scale-[1.02] active:scale-95">
                          {t.navServices}
                        </a>
                      </div>
                    </div>

                    <div className="col-lg-6">
                      <div className="flex flex-col gap-5">
                        <div className="neu-panel p-2 rounded-3xl overflow-hidden shadow-md">
                          <div className="relative aspect-[21/9] rounded-3xl overflow-hidden group">
                            <img
                              src="clinique.jpg"
                              alt="Modern Veterinary Clinic Interior"
                              className="w-full h-full object-cover transition-transform duration-700"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent flex items-end p-4">
                              <span className="text-white text-xs font-bold tracking-wider uppercase drop-shadow-sm">
                                {t.clinicTitle}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="neu-panel p-2 rounded-3xl shadow-md">
                          <div className="neu-pressed rounded-2xl overflow-hidden aspect-[21/10] relative">
                            <iframe
                              title="uOPets Campus Veterinary Location"
                              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2800.934898145455!2d-75.68172909999999!3d45.423548199999995!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4cce050a6db98d79%3A0x4cce04ff4fe494ef!2sUniversity%20of%20Ottawa!5e0!3m2!1sen!2sca!4v1717349999999"
                              className="w-full h-full border-0 opacity-80 contrast-125 transition-all duration-300 hover:opacity-100"
                              style={{
                                filter: theme === 'dark'
                                  ? 'invert(0.9) hue-rotate(180deg) grayscale(0.7)'
                                  : 'grayscale(0.3)'
                              }}
                              allowFullScreen=""
                              loading="lazy"
                              referrerPolicy="no-referrer-when-downgrade"
                            ></iframe>
                          </div>
                          <div className="p-3 flex justify-between items-center text-xs text-textMuted px-4 font-medium">
                            <span>
                              <i className="fas fa-map-marker-alt text-accent me-2"></i> {t.mapAddress}
                            </span>
                            <a
                              href="https://www.google.com/maps/dir/?api=1&destination=University+of+Ottawa"
                              target="_blank"
                              rel="noreferrer"
                              className="text-accent no-underline font-bold hover:underline flex items-center gap-1"
                            >
                              <span>{t.mapDirections}</span>
                              <i className="fas fa-external-link-alt text-[10px]"></i>
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section id="team" className="flex flex-col justify-center py-16 lg:py-24">
                <div className="text-center mb-12">
                  <h2 className="text-4xl font-black uppercase tracking-widest text-accent mb-4">
                    {t.teamTitle}
                  </h2>
                  <div className="h-1 w-24 bg-accent mx-auto rounded-full"></div>
                </div>

                <div className="row justify-content-center g-5">
                  {TEAM_DATA.map((member, i) => (
                    <div key={i} className="col-md-6 col-lg-4">
                      <div className="neu-panel p-8 h-100 flex flex-col justify-between group">
                        <div className="text-center">
                          <div className="neu-pressed w-32 h-32 mx-auto rounded-full mb-6 flex items-center justify-center overflow-hidden">
                            <img
                              src={member.image}
                              alt={member.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                          </div>
                          <h4 className="font-bold text-xl mb-2 text-textMain">{member.name}</h4>
                          <p className="text-sm text-accent font-extrabold uppercase tracking-wide mb-4">
                            {member.role[lang.toUpperCase()]}
                          </p>
                          <p className="text-sm text-textMuted leading-relaxed mb-0">
                            {member.description[lang.toUpperCase()]}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
              <section id="services" className="flex flex-col justify-center py-16 lg:py-24">
                <div className="text-center mb-10">
                  <h2 className="text-4xl font-black uppercase tracking-widest text-accent mb-3">
                    {t.servicesTitle}
                  </h2>
                  <p className="text-sm text-textMuted uppercase tracking-widest">{t.searchFilter}</p>
                </div>

                <div className="flex gap-3 flex-wrap justify-center mb-10">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveFilter(cat.id)}
                      className={`neu-btn px-5 py-3 text-sm font-bold uppercase tracking-wider transition-all
                    ${activeFilter === cat.id ? 'text-accent shadow-inner scale-95' : 'text-textMuted hover:text-textMain'}`}
                    >
                      {cat.label[currentLangKey]}
                    </button>
                  ))}
                </div>

                <div className="row g-5">
                  <div className="col-lg-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {filteredServices.map(service => {
                        const currentTime = selectedTimes[service.id] || '';
                        const isInvalidTime = currentTime && (currentTime < "09:00" || currentTime > "16:00");

                        return (
                          <div key={service.id} className="neu-panel p-4 flex flex-col justify-between h-full gap-4">

                            <div className="flex justify-between items-start">
                              <div>
                                <h5 className="font-bold text-base mb-2 text-textMain">{service.name[currentLangKey]}</h5>
                                <span className="text-accent font-black text-sm">${service.price.toFixed(2)}</span>
                              </div>
                              <i className={`fas ${service.icon} text-textMuted opacity-30 text-2xl`}></i>
                            </div>

                            <div className="flex flex-col gap-3 mt-auto">
                              <input
                                type="date"
                                min={new Date().toISOString().split('T')[0]}
                                value={selectedDates[service.id] || ''}
                                onChange={(e) => handleDateChange(service.id, e.target.value)}
                                className="neu-pressed bg-transparent border-0 text-sm p-3 rounded-xl w-full outline-none text-inherit font-bold"
                              />
                              <input
                                type="time"
                                min="09:00"
                                max="16:00"
                                value={currentTime}
                                onChange={(e) => handleTimeChange(service.id, e.target.value)} // Let state update freely
                                className={`neu-pressed bg-transparent text-sm p-3 rounded-xl w-full outline-none font-bold transition-colors duration-300 ${isInvalidTime
                                  ? 'text-red-500 border-2 border-red-500 shadow-[inset_0_0_10px_rgba(239,68,68,0.1)]'
                                  : 'border-0 text-inherit'
                                  }`}
                              />
                              <button
                                onClick={() => {
                                  if (isInvalidTime) {
                                    showToast(t.alertTimeRange);
                                  } else {
                                    handleAddToCart(service);
                                  }
                                }}
                                className="neu-btn px-4 py-1 text-accent hover:scale-105 transition-all flex items-center justify-center w-full"
                              >
                                <i className="fas fa-cart-plus text-base"></i>
                              </button>
                            </div>

                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="col-lg-4">
                    <div className="sticky top-6 h-[calc(100vh-6rem)]">
                      <div className="neu-pressed p-8 h-full flex flex-col justify-between rounded-3xl">

                        <div>
                          <h4 className="font-bold mb-6 flex items-center gap-3 text-sm text-accent uppercase tracking-widest">
                            <i className="fas fa-shopping-basket text-lg"></i>
                            <span>{t.cartTitle}</span>
                          </h4>
                          <div className="flex-1 overflow-y-auto pr-2">
                            {cart.length === 0 ? (
                              <p className="text-xs text-textMuted italic leading-relaxed p-2">{t.cartEmpty}</p>
                            ) : (
                              cart.map((item) => (
                                <div key={item.cartItemId} className="py-3 flex justify-between items-center text-sm border-b border-textMuted/20 last:border-0">
                                  <div>
                                    <span className="font-bold block text-textMain">{item.name[currentLangKey]}</span>
                                    <span className="text-xs text-accent font-mono block mt-1">
                                      {item.selectedDate} at {item.selectedTime}
                                    </span>
                                  </div>
                                  <button
                                    onClick={() => handleRemoveFromCart(item.cartItemId)}
                                    className="text-textMuted hover:text-accent font-black ml-3 transition-colors"
                                  >
                                    <i className="fas fa-times text-sm"></i>
                                  </button>
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                        <div className="border-t border-accent/20 pt-6 mt-4">
                          <div className="flex justify-between font-black text-accent mb-6 text-sm uppercase tracking-wider">
                            <span>{t.cartTotal}</span>
                            <span>${cartTotal.toFixed(2)}</span>
                          </div>

                          <div className="flex flex-col gap-3">
                            <button
                              onClick={transferCartToNotes}
                              disabled={cart.length === 0}
                              className={`neu-btn w-full block text-center py-4 text-xs font-black uppercase tracking-wider text-accent ${cart.length === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:scale-[1.02] transition-transform'}`}
                            >
                              {t.cartTransfer}
                            </button>
                            <button
                              onClick={() => {
                                setCart([]);
                                showToast(t.toastSuccess);
                              }}
                              disabled={cart.length === 0}
                              className={`neu-btn w-full block text-center py-4 text-xs font-black uppercase tracking-wider text-accent ${cart.length === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:scale-[1.02] transition-transform'}`}
                            >
                              {t.bookInstantly}
                            </button>
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>
                </div>
              </section>


              <section id="booking" className="flex flex-col justify-center py-16 lg:py-24">
                <div className="neu-panel p-10 lg:p-12">
                  <h2 className="text-4xl font-black mb-4 text-center text-accent uppercase tracking-wide">
                    {t.bookingTitle}
                  </h2>
                  <p className="text-sm text-center text-textMuted mb-12 italic max-w-2xl mx-auto">
                    {t.bookingSubtitle}
                  </p>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();

                      if (!formState.reason.trim()) {
                        showToast(lang.toUpperCase() === 'FR' ? "Veuillez indiquer la raison principale de votre visite." : "Please fill out the main reason for your visit.");
                        return;
                      }

                      showToast(t.toastSuccess);

                      setFormState({
                        selectedPet: 'none',
                        isNewClient: false,
                        newEmail: '',
                        newPetName: '',
                        urgency: 'Standard',
                        reason: '',
                        notes: ''
                      });
                    }}
                    className="space-y-6"
                  >
                    <div className="form-row-track">
                      <div className={`slide-item ${formState.isNewClient ? '' : 'centered'}`}>
                        <label className="neu-pressed p-4 rounded-xl flex items-center justify-center gap-4 cursor-pointer hover:opacity-90 select-none transition-all duration-500 w-full h-[62px]">
                          <div className="relative flex items-center justify-center">
                            <input
                              type="checkbox"
                              checked={formState.isNewClient}
                              onChange={(e) => setFormState({ ...formState, isNewClient: e.target.checked })}
                              className="neu-checkbox"
                            />
                            <span className="neu-checkbox-frame"></span>
                          </div>
                          <span className="text-sm font-bold uppercase tracking-wider text-textMain whitespace-nowrap">
                            {t.newClientLabel}
                          </span>
                        </label>
                      </div>

                      <div className={`email-slide-container ${formState.isNewClient ? 'is-active' : ''}`}>
                        <div className="email-inner-wrapper">
                          <label className="block text-xs font-bold uppercase tracking-widest mb-2 px-2 text-accent whitespace-nowrap">
                            {t.emailLabel}
                          </label>
                          <input
                            type="email"
                            placeholder="email@example.com"
                            value={formState.newEmail}
                            onChange={(e) => setFormState({ ...formState, newEmail: e.target.value })}
                            className="neu-pressed bg-transparent w-full p-4 rounded-xl border-0 text-sm outline-none text-inherit font-bold animate-fade-in"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="row g-4 align-items-end mt-1">
                      <div className="col-md-6">
                        <label className="block text-xs font-bold uppercase tracking-widest mb-2 px-2 text-accent">
                          {formState.isNewClient ? t.newPetNameLabel : t.petLabel}
                        </label>
                        <div className="relative min-h-[65px] flex items-start">
                          {formState.isNewClient ? (
                            <input
                              key="name-input"
                              type="text"
                              placeholder="e.g. Bella"
                              value={formState.newPetName}
                              onChange={(e) => setFormState({ ...formState, newPetName: e.target.value })}
                              className="neu-pressed bg-transparent w-full p-4 rounded-xl border-0 text-sm outline-none text-inherit font-bold animate-fade-in"
                            />
                          ) : (
                            <select
                              key="pet-select"
                              value={formState.selectedPet}
                              onChange={(e) => setFormState({ ...formState, selectedPet: e.target.value })}
                              className="neu-pressed bg-transparent w-full p-4 rounded-xl border-0 text-sm outline-none text-inherit font-bold animate-fade-in"
                            >
                              <option value="none">{t.selectPlaceholder}</option>
                              <option value="luna">Luna (Chat/Siamois)</option>
                              <option value="rex">Rex (Chien/Berger)</option>
                              <option value="bubbles">Bubbles (Iguane Vert)</option>
                            </select>
                          )}
                        </div>
                      </div>

                      <div className="col-md-6">
                        <label className="block text-xs font-bold uppercase tracking-widest mb-2 px-2 text-textMain">{t.urgencyLabel}</label>
                        <select
                          value={formState.urgency}
                          onChange={(e) => setFormState({ ...formState, urgency: e.target.value })}
                          className="neu-pressed bg-transparent w-full p-4 rounded-xl border-0 text-sm outline-none text-inherit font-bold"
                        >
                          <option value="Standard">{t.urgencyStandard}</option>
                          <option value="Prioritaire">{t.urgencyPriority}</option>
                          <option value="Urgence">{t.urgencyCritical}</option>
                        </select>
                      </div>

                      <div className="col-md-12 mt-2">
                        <label className="block text-xs font-bold uppercase tracking-widest mb-2 px-2 text-textMain">{t.reasonLabel}</label>
                        <input
                          type="text"
                          placeholder={t.placeHolderReason}
                          value={formState.reason}
                          onChange={(e) => setFormState({ ...formState, reason: e.target.value })}
                          className="neu-pressed bg-transparent w-full p-4 rounded-xl border-0 text-sm outline-none text-inherit font-bold"
                        />
                      </div>

                      <div className="col-md-12 mt-2">
                        <label className="block text-xs font-bold uppercase tracking-widest mb-2 px-2 text-accent">{t.notesLabel}</label>
                        <textarea
                          rows="5"
                          placeholder={t.placeHolderNotes}
                          value={formState.notes}
                          onChange={(e) => setFormState({ ...formState, notes: e.target.value })}
                          className="neu-pressed bg-transparent w-full p-4 rounded-xl border-0 text-sm outline-none text-inherit font-bold leading-relaxed"
                        ></textarea>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="neu-btn w-full p-5 font-black text-accent uppercase tracking-widest text-base shadow-inner mt-6 hover:opacity-80 transition-opacity"
                    >
                      <span>{t.submitBookingBtn}</span>
                    </button>
                  </form>
                </div>

                <section id="contact" className="flex flex-col justify-center py-16 lg:py-24">
                  <div className="text-center mb-12">
                    <h2 className="text-4xl font-black uppercase tracking-widest text-accent mb-4">
                      {t.contactTitle}
                    </h2>
                    <div className="h-1 w-24 bg-accent mx-auto rounded-full"></div>
                  </div>

                  <div className="row g-5">
                    <div className="col-lg-6">
                      <div className="neu-panel p-8 h-100">
                        <h4 className="font-black text-2xl mb-6 text-accent uppercase tracking-wider">
                          {t.referralTitle}
                        </h4>
                        <div className="flex flex-col h-[calc(100%-3rem)] space-y-6 text-textMain">
                          <p className="leading-relaxed text-lg">{t.emergencyDescription}</p>
                          <p className="leading-relaxed text-lg">{t.criticalCareDescription}</p>

                          <div
                            className="pt-4 border-t mt-auto"
                            style={{ borderColor: 'var(--border-d)' }}
                          >
                            <p className="font-bold text-lg mb-1">
                              General: <a href="tel:+16133333333" className="text-accent !underline hover:opacity-80 transition-opacity">+1 613-333-3333</a>
                            </p>
                            <p className="font-bold text-lg mb-1">
                              General: <a href="mailto:Info@uopets.ca" className="text-accent !underline hover:opacity-80 transition-opacity">Info@uopets.ca</a>
                            </p>
                            <p className="font-bold text-lg mb-1" style={{ color: "rgb(255, 116, 108)" }}>
                              Urgence: <a href="tel:+16132222222" className="text-accent !underline hover:opacity-80 transition-opacity">+1 613-222-2222</a>
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="col-lg-6">
                      <div className="neu-panel p-8 h-100">
                        <h4 className="font-black text-2xl mb-6 text-accent uppercase tracking-wider">
                          {t.serviceEmailTitle}
                        </h4>
                        <p className="text-sm text-textMuted mb-6 italic">{t.serviceEmailSubtitle}</p>
                        <div className="grid grid-cols-1 md:grid-cols-1 gap-3">
                          {[
                            "Dental", "Diagnostic", "Exotic", "Medication",
                            "Sterelization", "Surgery",
                          ].map((service) => (
                            <a
                              key={service}
                              href={`mailto:${service}@uopets.ca`}
                              className="text-xs font-bold p-3 rounded-lg border-2 hover:border-accent hover:text-accent transition-all"
                              style={{ borderColor: 'var(--border-d)' }}
                            >
                              {service}@uopets.ca
                            </a>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </section>

              <footer className="pt-8 pb-4 mt-16 text-center lg:text-left">
                <div className="neu-pressed p-6 d-flex flex-column flex-lg-row justify-content-between align-items-center">
                  <div>
                    <p className="font-bold text-sm mt-4 mt-lg-0 mb-0">{t.siteCreatedBy}</p>
                    <h3 className="font-bold text-lg text-accent mb-1">Ryan Beland</h3>
                    <p className="text-sm text-textMuted mb-0">
                      <span>{t.footerCourse}</span>
                    </p>
                  </div>
                  <p className="text-sm text-textMuted mt-4 mt-lg-0 mb-0">&copy; 2026 Université d'Ottawa / University of Ottawa.</p>
                </div>
              </footer>
            </div>

            <div className="col-lg-1 d-none d-lg-block">
              <div className="sticky top-24 flex flex-col items-center gap-5 py-6">
                <button
                  onClick={() => setIsAccountOpen(true)}
                  className="neu-btn w-14 h-14 flex flex-col items-center justify-center text-accent mb-4 group hover:scale-105 transition-transform"
                >
                  <i className="fas fa-user-circle text-2xl"></i>
                </button>

                <button
                  onClick={toggleTheme}
                  className="neu-btn w-14 h-14 flex items-center justify-center text-textMain hover:scale-105 transition-transform"
                >
                  {theme === 'dark' ? <i className="fas fa-sun text-xl"></i> : <i className="fas fa-moon text-xl"></i>}
                </button>

                <button
                  onClick={toggleLang}
                  className="neu-btn w-14 h-14 flex items-center justify-center font-bold text-sm text-textMain hover:scale-105 transition-transform"
                >
                  <span>{lang.toUpperCase() === 'FR' ? 'EN' : 'FR'}</span>
                </button>

                <a href="#top" className="neu-btn w-12 h-12 flex items-center justify-center mt-8" title={t.topScrollTitle}>
                  <i className="fas fa-arrow-up"></i>
                </a>
              </div>
            </div>
          </div>
        </div>

        {
          isAccountOpen && (
            <div
              className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
              onClick={() => setIsAccountOpen(false)}
            >
              <div
                className="relative max-w-3xl w-full max-h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="sticky top-0 z-[210] h-0 w-full">
                  <button
                    onClick={() => setIsAccountOpen(false)}
                    className="neu-flat bg-[var(--bg-main)] rounded-full w-12 h-12 flex items-center justify-center text-textMuted hover:text-accent transition-all duration-300 absolute -top-2 -right-2 lg:-right-16 text-3xl pb-1 shadow-2xl border border-white/5"
                    title={t.closeTitle}
                  >
                    ×
                  </button>
                </div>

                <div className="neu-flat p-10 overflow-y-auto text-inherit w-full rounded-3xl">
                  <div className="text-center mb-10">
                    <div className="neu-pressed w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4">
                      <i className="fas fa-user-circle text-4xl text-accent"></i>
                    </div>
                    <h3 className="text-3xl font-black text-textMain">{t.accountTitle}</h3>
                    <p className="text-sm text-textMuted font-mono mt-2">{t.accountID}: {USER_DATA.id}</p>
                  </div>

                  <div className="space-y-6">
                    <div className="neu-pressed rounded-2xl overflow-hidden">
                      <button onClick={() => toggleDropdown('pets')} className="w-full p-5 flex justify-between items-center font-bold text-accent border-none bg-transparent">
                        <span><i className="fas fa-paw me-3"></i> {t.accountPets}</span>
                        <i className={`fas fa-chevron-down transition-transform ${openDropdowns.pets ? 'rotate-180' : ''}`}></i>
                      </button>
                      {openDropdowns.pets && (
                        <div className="p-5 bg-black/5 space-y-3 border-t border-black/5">
                          {USER_DATA.pets.map((pet, i) => (
                            <div key={i} className="p-4 bg-white/5 rounded-xl flex justify-between text-sm items-center shadow-sm">
                              <div className="text-textMain"><strong>{pet.name}</strong> ({pet.breed} - {pet.age})</div>
                              <span className={`text-${pet.color} font-black text-xs uppercase bg-${pet.color}/10 px-3 py-1 rounded-full`}>{t[pet.statusKey]}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="neu-pressed rounded-2xl overflow-hidden">
                      <button onClick={() => toggleDropdown('appointments')} className="w-full p-5 flex justify-between items-center font-bold text-accent border-none bg-transparent">
                        <span><i className="fas fa-calendar-alt me-3"></i> {t.accountAppts}</span>
                        <i className={`fas fa-chevron-down transition-transform ${openDropdowns.appointments ? 'rotate-180' : ''}`}></i>
                      </button>
                      {openDropdowns.appointments && (
                        <div className="p-5 bg-black/5 space-y-3 border-t border-black/5">
                          {USER_DATA.appointments.map((appt, i) => (
                            <div key={i} className="p-4 bg-white/5 rounded-xl shadow-sm text-sm">
                              <div className="flex justify-between font-bold mb-2 text-textMain">
                                <span>{appt.title} ({appt.pet})</span>
                                <span className="text-accent font-mono uppercase bg-accent/10 px-3 py-1 rounded-full text-xs">{t[appt.statusKey]}</span>
                              </div>
                              <span className="text-textMuted text-xs font-bold block">{appt.date} — {appt.doctor}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="neu-pressed rounded-2xl overflow-hidden">
                      <button onClick={() => toggleDropdown('bills')} className="w-full p-5 flex justify-between items-center font-bold text-accent border-none bg-transparent">
                        <span><i className="fas fa-file-invoice-dollar me-3"></i> {t.accountBills}</span>
                        <i className={`fas fa-chevron-down transition-transform ${openDropdowns.bills ? 'rotate-180' : ''}`}></i>
                      </button>
                      {openDropdowns.bills && (
                        <div className="p-5 bg-black/5 space-y-3 border-t border-black/5">
                          {USER_DATA.bills.map((bill, i) => (
                            <div key={i} className="p-4 bg-white/5 rounded-xl flex justify-between items-center shadow-sm text-sm">
                              <div>
                                <span className="font-bold block text-textMain mb-1">{t.factureLabel} {bill.id}</span>
                                <span className="text-textMuted text-xs font-bold">{bill.type} ({bill.pet}) - {bill.date}</span>
                              </div>
                              <div className="text-right">
                                <span className="font-black block text-base text-textMain mb-1">${bill.amount}</span>
                                <span className="text-accent text-[10px] font-black uppercase bg-accent/10 px-2 py-1 rounded-full">{t[bill.statusKey]}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="neu-pressed rounded-2xl overflow-hidden">
                      <button onClick={() => toggleDropdown('history')} className="w-full p-5 flex justify-between items-center font-bold text-accent border-none bg-transparent">
                        <span><i className="fas fa-notes-medical me-3"></i> {t.accountHistory}</span>
                        <i className={`fas fa-chevron-down transition-transform ${openDropdowns.history ? 'rotate-180' : ''}`}></i>
                      </button>
                      {openDropdowns.history && (
                        <div className="p-5 bg-black/5 space-y-3 border-t border-black/5 text-sm">
                          {USER_DATA.history.map((item, i) => (
                            <p key={i} className="p-3 bg-white/5 rounded-xl shadow-sm text-textMuted">
                              <strong className="text-textMain">{item.pet}:</strong> {item.note}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        }
      </div >
    </div >
  );
}
