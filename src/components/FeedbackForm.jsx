import React, { useState, useRef, useEffect } from 'react';

export default function FeedbackForm({ t, onClose, onConfirm, prefillData }) {
  const [name, setName] = useState(prefillData?.name || '');
  const [email, setEmail] = useState(prefillData?.email || '');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [message, setMessage] = useState('');
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

  const validateName = (value) => {
    return /^[A-Za-z\s\-']+$/.test(value.trim()) && value.trim().length > 0;
  };

  const validateEmail = (value) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  };

  const validateAll = () => {
    const newErrors = {};
    
    if (!validateName(name)) {
      newErrors.name = t.nameError || 'Please enter a valid name';
    }
    
    if (!validateEmail(email)) {
      newErrors.email = t.emailError || 'Please enter a valid email address';
    }
    
    if (rating === 0) {
      newErrors.rating = t.ratingError || 'Please select a rating';
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
        className="neu-flat w-full max-w-md p-6 rounded-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-textMain">{t.feedbackTitle || 'Send Feedback'}</h3>
          <button 
            onClick={onClose}
            className="neu-btn w-8 h-8 flex items-center justify-center"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="text-xs text-textMuted mb-1 block">{t.name || 'Name'}</label>
            <div className={`neu-pressed rounded-lg p-3 ${errors.name ? 'outline outline-2 outline-red-500' : ''}`}>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={t.namePlaceholder || 'Your name'}
                className="w-full bg-transparent text-textMain placeholder-textMuted/50 outline-none"
              />
            </div>
            {errors.name && (
              <p className="text-xs text-red-500 mt-1">{errors.name}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="text-xs text-textMuted mb-1 block">{t.email || 'Email'}</label>
            <div className={`neu-pressed rounded-lg p-3 ${errors.email ? 'outline outline-2 outline-red-500' : ''}`}>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={t.emailPlaceholder || 'your@email.com'}
                className="w-full bg-transparent text-textMain placeholder-textMuted/50 outline-none"
              />
            </div>
            {errors.email && (
              <p className="text-xs text-red-500 mt-1">{errors.email}</p>
            )}
          </div>

          {/* Rating */}
          <div>
            <label className="text-xs text-textMuted mb-2 block">{t.rating || 'Rating'}</label>
            <div className={`flex gap-2 ${errors.rating ? 'outline outline-2 outline-red-500 rounded-lg p-2' : ''}`}>
              {Array.from({ length: 5 }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onMouseEnter={() => setHoverRating(i + 1)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(i + 1)}
                  className="neu-btn w-10 h-10 flex items-center justify-center"
                >
                  <i className={`fas fa-star text-lg ${
                    (hoverRating || rating) > i ? 'text-accent' : 'text-textMuted'
                  }`}></i>
                </button>
              ))}
            </div>
            {errors.rating && (
              <p className="text-xs text-red-500 mt-1">{errors.rating}</p>
            )}
          </div>

          {/* Message */}
          <div>
            <label className="text-xs text-textMuted mb-1 block">{t.message || 'Message'}</label>
            <div className="neu-pressed rounded-lg p-3">
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder={t.messagePlaceholder || 'Your feedback...'}
                rows="4"
                className="w-full bg-transparent text-textMain placeholder-textMuted/50 outline-none resize-none"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="neu-btn w-full py-3 font-bold mt-4"
          >
            {t.submitFeedback || 'Submit Feedback'}
          </button>
        </form>
      </div>
    </div>
  );
}
