import React, { useEffect } from 'react';
import '../../../stylesheets/ConfirmModal.css';

const ConfirmModal = ({ dialogState, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!dialogState) return;
      if (e.key === 'Escape') {
        onClose(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dialogState, onClose]);

  if (!dialogState) return null;

  const { title, message, buttons } = dialogState;

  return (
    <div className="confirm-modal-overlay" onClick={() => onClose(null)}>
      <div className="confirm-modal-container neu-panel" onClick={e => e.stopPropagation()}>
        {title && <h2 className="confirm-modal-title">{title}</h2>}
        {message && <p className="confirm-modal-message">{message}</p>}
        
        <div className="confirm-modal-actions">
          {(buttons || []).map((btn, index) => (
            <button
              key={index}
              className={`confirm-modal-btn neu-btn ${btn.danger ? 'danger' : btn.primary ? 'primary' : 'secondary'}`}
              onClick={() => onClose(btn.value)}
            >
              <span>{btn.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
