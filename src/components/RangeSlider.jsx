import React, { useRef, useState } from 'react';

export default function RangeSlider({ min, max, step = 1, value, onChange }) {
  const [lower, upper] = value;
  const containerRef = useRef(null);
  const [activeThumb, setActiveThumb] = useState(null);

  const lowerPercent = ((lower - min) / (max - min)) * 100;
  const upperPercent = ((upper - min) / (max - min)) * 100;

  const handleMouseMove = (e) => {
    if (!containerRef.current || lower !== upper) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const percent = clientX / rect.width;
    const hoverVal = min + percent * (max - min);
    
    if (hoverVal < lower) {
      setActiveThumb('lower');
    } else {
      setActiveThumb('upper');
    }
  };

  const handleLowerChange = (e) => {
    const val = Number(e.target.value);
    onChange([Math.min(val, upper), upper]);
    if (val < upper) setActiveThumb(null);
  };

  const handleUpperChange = (e) => {
    const val = Number(e.target.value);
    onChange([lower, Math.max(val, lower)]);
    if (val > lower) setActiveThumb(null);
  };

  let lowerZ = 2;
  let upperZ = 2;
  
  if (lower === upper) {
    if (activeThumb === 'lower') {
      lowerZ = 3;
    } else if (activeThumb === 'upper') {
      upperZ = 3;
    } else {
      if (lower === min) {
        upperZ = 3;
      } else {
        lowerZ = 3;
      }
    }
  }

  return (
    <div 
      ref={containerRef} 
      className="dual-range-slider"
      onMouseMove={handleMouseMove}
    >
      <div className="dual-range-track" />
      <div className="dual-range-fill" style={{ left: `${lowerPercent}%`, right: `${100 - upperPercent}%` }} />
      <input
        type="range" min={min} max={max} step={step} value={lower}
        onChange={handleLowerChange}
        className="price-slider dual-range-input"
        style={{ zIndex: lowerZ }}
      />
      <input
        type="range" min={min} max={max} step={step} value={upper}
        onChange={handleUpperChange}
        className="price-slider dual-range-input"
        style={{ zIndex: upperZ }}
      />
    </div>
  );
}
