import React, { useState, useRef, useEffect } from 'react';

export default function PaymentModal({ t, onClose, onConfirm, cartItems, cartTotal }) {
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [cardName, setCardName] = useState('');
  const [email, setEmail] = useState('');
  const [focusField, setFocusField] = useState(null);
  const [errors, setErrors] = useState({});
  const modalRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const validateCardNumber = (value) => {
    const digitsOnly = value.replace(/\s/g, '');
    return /^\d{16}$/.test(digitsOnly);
  };

  const validateCardName = (value) => {
    return /^[A-Za-z\s\-']+$/.test(value.trim()) && value.trim().length > 0;
  };

  const validateExpiry = (value) => {
    if (!/^\d{2}\/\d{2}$/.test(value)) return false;
    const [month, year] = value.split('/').map(Number);
    if (month < 1 || month > 12) return false;
    return true;
  };

  const validateCvc = (value) => {
    return /^\d{3}$/.test(value);
  };

  const validateEmail = (value) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  const formatExpiry = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return `${v.substring(0, 2)}/${v.substring(2, 4)}`;
    }
    return v;
  };

  const validateAll = () => {
    const newErrors = {};
    
    if (!validateCardNumber(cardNumber)) {
      newErrors.cardNumber = t.cardNumberError || 'Please enter a valid 16-digit card number';
    }
    
    if (!validateCardName(cardName)) {
      newErrors.cardName = t.cardNameError || 'Please enter a valid name';
    }
    
    if (!validateExpiry(expiry)) {
      newErrors.expiry = t.expiryError || 'Please enter a valid expiry date (MM/YY)';
    }
    
    if (!validateCvc(cvc)) {
      newErrors.cvc = t.cvcError || 'Please enter a valid 3-digit CVC';
    }
    
    if (!validateEmail(email)) {
      newErrors.email = t.emailError || 'Please enter a valid email address';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateAll()) {
      onConfirm();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        ref={modalRef}
        className="neu-flat w-full max-w-md max-h-[90vh] p-6 rounded-2xl flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-textMain">{t.paymentTitle || 'Payment Details'}</h3>
          <button 
            onClick={onClose}
            className="neu-btn w-8 h-8 flex items-center justify-center"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="mb-6 neu-panel rounded-xl p-4">
          <h4 className="text-sm font-bold text-textMain mb-3">{t.cartTitle || 'Your Order'}</h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {cartItems && cartItems.map(item => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-textMuted">{item.name} × {item.quantity}</span>
                <span className="text-textMain font-medium">${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="border-t pt-2 mt-2">
            <div className="flex justify-between font-bold">
              <span className="text-textMain">{t.cartTotal || 'Total'}</span>
              <span className="text-accent">${cartTotal ? cartTotal.toFixed(2) : '0.00'}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto px-1 -mx-1">
            <div className="space-y-4 px-2">
              <div>
                <label className="text-xs text-textMuted mb-1 block">{t.cardNumber || 'Card Number'}</label>
                <div className={`neu-pressed rounded-lg p-3 ${errors.cardNumber ? 'ring-2 ring-red-500' : ''}`}>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={e => setCardNumber(formatCardNumber(e.target.value))}
                    onFocus={() => setFocusField('cardNumber')}
                    onBlur={() => setFocusField(null)}
                    placeholder="0000 0000 0000 0000"
                    maxLength="19"
                    className="w-full bg-transparent text-textMain placeholder-textMuted/50 outline-none"
                  />
                </div>
                {errors.cardNumber && (
                  <p className="text-xs text-red-500 mt-1">{errors.cardNumber}</p>
                )}
              </div>

              <div>
                <label className="text-xs text-textMuted mb-1 block">{t.cardName || 'Name on Card'}</label>
                <div className={`neu-pressed rounded-lg p-3 ${errors.cardName ? 'ring-2 ring-red-500' : ''}`}>
                  <input
                    type="text"
                    value={cardName}
                    onChange={e => setCardName(e.target.value)}
                    onFocus={() => setFocusField('cardName')}
                    onBlur={() => setFocusField(null)}
                    placeholder="John Smith"
                    className="w-full bg-transparent text-textMain placeholder-textMuted/50 outline-none"
                  />
                </div>
                {errors.cardName && (
                  <p className="text-xs text-red-500 mt-1">{errors.cardName}</p>
                )}
              </div>

              <div>
                <label className="text-xs text-textMuted mb-1 block">{t.email || 'Email'}</label>
                <div className={`neu-pressed rounded-lg p-3 ${errors.email ? 'ring-2 ring-red-500' : ''}`}>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onFocus={() => setFocusField('email')}
                    onBlur={() => setFocusField(null)}
                    placeholder={t.emailPlaceholder || 'your@email.com'}
                    className="w-full bg-transparent text-textMain placeholder-textMuted/50 outline-none"
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-red-500 mt-1">{errors.email}</p>
                )}
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-xs text-textMuted mb-1 block">{t.expiry || 'Expiry'}</label>
                  <div className={`neu-pressed rounded-lg p-3 ${errors.expiry ? 'ring-2 ring-red-500' : ''}`}>
                    <input
                      type="text"
                      value={expiry}
                      onChange={e => setExpiry(formatExpiry(e.target.value))}
                      onFocus={() => setFocusField('expiry')}
                      onBlur={() => setFocusField(null)}
                      placeholder="MM/YY"
                      maxLength="5"
                      className="w-full bg-transparent text-textMain placeholder-textMuted/50 outline-none"
                    />
                  </div>
                  {errors.expiry && (
                    <p className="text-xs text-red-500 mt-1">{errors.expiry}</p>
                  )}
                </div>
                <div className="flex-1">
                  <label className="text-xs text-textMuted mb-1 block">{t.cvc || 'CVC'}</label>
                  <div className={`neu-pressed rounded-lg p-3 ${errors.cvc ? 'ring-2 ring-red-500' : ''}`}>
                    <input
                      type="text"
                      value={cvc}
                      onChange={e => setCvc(e.target.value.replace(/[^0-9]/g, '').slice(0, 3))}
                      onFocus={() => setFocusField('cvc')}
                      onBlur={() => setFocusField(null)}
                      placeholder="123"
                      maxLength="3"
                      className="w-full bg-transparent text-textMain placeholder-textMuted/50 outline-none"
                    />
                  </div>
                  {errors.cvc && (
                    <p className="text-xs text-red-500 mt-1">{errors.cvc}</p>
                  )}
                </div>
              </div>

              <div className="neu-panel rounded-xl p-4 h-40 relative overflow-hidden">
                <div className="absolute top-4 right-4 text-accent">
                  <i className="fab fa-cc-visa text-3xl"></i>
                </div>
                <div className="mt-8">
                  <div className="text-textMain font-mono text-lg tracking-wider">
                    {cardNumber || '•••• •••• •••• ••••'}
                  </div>
                  <div className="flex justify-between mt-4">
                    <div>
                      <div className="text-xs text-textMuted">{t.cardName || 'CARDHOLDER'}</div>
                      <div className="text-sm text-textMain font-medium">{cardName || 'John Smith'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-textMuted">{t.expiry || 'EXPIRES'}</div>
                      <div className="text-sm text-textMain font-medium">{expiry || 'MM/YY'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="neu-btn w-full py-3 font-bold mt-4"
          >
            {t.confirmPayment || 'Confirm Payment'}
          </button>
        </form>
      </div>
    </div>
  );
}
