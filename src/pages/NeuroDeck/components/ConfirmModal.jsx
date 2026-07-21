import React from 'react';
import '../../../stylesheets/ConfirmModal.css';

const ConfirmModal = ({ dialogState, onClose }) => {
  if (!dialogState) return null;

  const { title, message, buttons } = dialogState;

  return (
    <div className="confirm-modal-overlay">
      <div className="confirm-modal-container">
        {title && <h2 className="confirm-modal-title">{title}</h2>}
        {message && <p className="confirm-modal-message">{message}</p>}
        
        <div className="confirm-modal-actions">
          {buttons.map((btn, index) => (
            <button
              key={index}
              className={`confirm-modal-btn ${btn.primary ? 'primary' : btn.danger ? 'danger' : 'secondary'}`}
              onClick={() => onClose(btn.value)}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
