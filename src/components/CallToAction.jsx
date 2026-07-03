import React, { useRef, useEffect } from 'react';

export default function CallToAction({ t, onClose }) {
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
          <h3 className="text-xl font-bold text-textMain">{t.callToActionTitle || 'Invest in Happiness'}</h3>
          <button 
            onClick={onClose}
            className="neu-btn w-8 h-8 flex items-center justify-center"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="space-y-4">
          <div className="neu-panel rounded-xl p-4">
            <i className="fas fa-palette text-accent text-4xl mb-4 block text-center"></i>
            <p className="text-textMain text-center leading-relaxed">
              {t.callToActionMessage || 'By purchasing art, you are making an investment in your happiness and potentially creating generational wealth.'}
            </p>
          </div>

          <button
            onClick={onClose}
            className="neu-btn w-full py-3 font-bold"
          >
            {t.callToActionExplore || 'Explore Now'}
          </button>
        </div>
      </div>
    </div>
  );
}
