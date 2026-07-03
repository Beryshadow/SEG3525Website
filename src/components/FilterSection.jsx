import React, { useState } from 'react';

export default function FilterSection({ title, defaultOpen = true, children, onReset }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="mb-6">
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-widest mb-2 text-accent bg-transparent border-0 p-0"
      >
        <span>{title}</span>
        <div className="flex items-center gap-2">
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="neu-btn w-6 h-6 flex items-center justify-center text-xs"
              title="Reset filters"
            >
              <i className="fas fa-undo"></i>
            </button>
          )}
          <i className={`fas fa-chevron-down transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}></i>
        </div>
      </button>
      {isOpen && <div className="max-h-60">{children}</div>}
    </div>
  );
}
