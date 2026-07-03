import React from 'react';

export default function RangeSlider({ min, max, step = 1, value, onChange }) {
  const [lower, upper] = value;
  const lowerPercent = ((lower - min) / (max - min)) * 100;
  const upperPercent = ((upper - min) / (max - min)) * 100;

  return (
    <div className="dual-range-slider">
      <div className="dual-range-track" />
      <div className="dual-range-fill" style={{ left: `${lowerPercent}%`, right: `${100 - upperPercent}%` }} />
      <input
        type="range" min={min} max={max} step={step} value={lower}
        onChange={e => onChange([Math.min(Number(e.target.value), upper - step), upper])}
        className="price-slider dual-range-input"
      />
      <input
        type="range" min={min} max={max} step={step} value={upper}
        onChange={e => onChange([lower, Math.max(Number(e.target.value), lower + step)])}
        className="price-slider dual-range-input"
      />
    </div>
  );
}
