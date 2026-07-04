import React, { useState, useRef, useMemo } from 'react';
import { CURRENCY_CONFIG } from '../data/dashboardData';
import '../stylesheets/Dashboard.css';

export default function BarChart({ data, metric, currency, lang, t, onBarClick }) {
  const [hoveredBar, setHoveredBar] = useState(null);
  const containerRef = useRef(null);

  const svgWidth = 600;
  const svgHeight = 260;
  const margin = { top: 20, right: 20, bottom: 75, left: 75 };

  const yBounds = useMemo(() => {
    const values = data.map(d => d.value);
    const maxVal = Math.max(...values, 0);
    const yMax = maxVal === 0 ? 10 : Math.ceil(maxVal * 1.15 / 5) * 5;
    return { min: 0, max: yMax };
  }, [data]);

  const getY = (value) => {
    return svgHeight - margin.bottom - ((value - yBounds.min) * (svgHeight - margin.top - margin.bottom)) / (yBounds.max - yBounds.min);
  };

  const chartWidth = svgWidth - margin.left - margin.right;
  const bandWidth = data.length > 0 ? chartWidth / data.length : chartWidth;
  const barWidth = Math.max(8, bandWidth * 0.65);

  const getBarX = (index) => {
    return margin.left + index * bandWidth + (bandWidth - barWidth) / 2;
  };

  const formatVal = (val) => {
    if (metric === 'artworksCount' || metric === 'salesVolume' || metric === 'totalUnits' || metric === 'stockVolume') {
      return val.toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-US', { maximumFractionDigits: 0 });
    }
    const config = CURRENCY_CONFIG[currency] || { rate: 1.0, symbol: '$' };
    const converted = val * config.rate;
    const symbol = config.symbol;

    if (lang === 'fr') {
      return `${converted.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ${symbol}`;
    } else {
      return `${symbol}${converted.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    }
  };

  const yTicks = useMemo(() => {
    const step = (yBounds.max - yBounds.min) / 4;
    return Array.from({ length: 5 }, (_, i) => yBounds.min + step * i);
  }, [yBounds]);

  const handleMouseMove = (e, item, index) => {
    if (!containerRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const svgRect = containerRef.current.querySelector('svg').getBoundingClientRect();
    const barX = getBarX(index);
    const barY = getY(item.value);
    const scaleX = svgRect.width / svgWidth;
    
    setHoveredBar({
      ...item,
      index,
      clientX: (barX + barWidth / 2) * scaleX,
      clientY: barY * (svgRect.height / svgHeight)
    });
  };

  const handleMouseLeave = () => {
    setHoveredBar(null);
  };

  const isAllZero = data.length === 0 || data.every(d => d.value === 0);

  return (
    <div ref={containerRef} className="position-relative w-100">
      {isAllZero ? (
        <div className="chart-empty-state neu-pressed rounded-2xl m-2">
          <i className="fas fa-chart-bar fa-2x mb-3 opacity-40 text-textMuted"></i>
          <p className="text-sm italic">{t.noDataForFilters}</p>
        </div>
      ) : (
        <>
          <svg className="chart-svg" viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
            <defs>
              <linearGradient id="chartBarGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-accent)" />
                <stop offset="100%" stopColor="color-mix(in srgb, var(--color-accent) 60%, black)" />
              </linearGradient>
            </defs>

            {yTicks.map((tick, i) => (
              <line
                key={`grid-y-${i}`}
                x1={margin.left}
                y1={getY(tick)}
                x2={svgWidth - margin.right}
                y2={getY(tick)}
                className="chart-grid-line"
              />
            ))}

            <line
              x1={margin.left}
              y1={svgHeight - margin.bottom}
              x2={svgWidth - margin.right}
              y2={svgHeight - margin.bottom}
              className="chart-axis-line"
            />
            <line
              x1={margin.left}
              y1={margin.top}
              x2={margin.left}
              y2={svgHeight - margin.bottom}
              className="chart-axis-line"
            />

            {yTicks.map((tick, i) => (
              <text
                key={`y-label-${i}`}
                x={margin.left - 10}
                y={getY(tick) + 4}
                textAnchor="end"
                className="chart-axis-text"
              >
                {formatVal(tick)}
              </text>
            ))}

            {data.map((item, i) => {
              const xPos = getBarX(i) + barWidth / 2;
              const yPos = svgHeight - margin.bottom + 15;
              const displayLabel = t[item.label.toLowerCase().replace(/\s+/g, '')] || item.label;

              return (
                <text
                  key={`x-label-${i}`}
                  x={xPos}
                  y={yPos}
                  textAnchor="end"
                  className="chart-axis-text"
                  transform={`rotate(-35, ${xPos}, ${yPos})`}
                  dx="-5"
                  dy="5"
                >
                  {displayLabel}
                </text>
              );
            })}

            {data.map((item, i) => {
              const barX = getBarX(i);
              const barY = getY(item.value);
              const barHeight = Math.max(2, svgHeight - margin.bottom - barY);

              return (
                <rect
                  key={`bar-${i}`}
                  x={barX}
                  y={barY}
                  width={barWidth}
                  height={barHeight}
                  className="chart-bar-rect"
                  onMouseMove={(e) => handleMouseMove(e, item, i)}
                  onMouseLeave={handleMouseLeave}
                  onClick={() => onBarClick && onBarClick(item.label)}
                  style={{
                    opacity: hoveredBar && hoveredBar.index !== i ? 0.6 : 1
                  }}
                />
              );
            })}
          </svg>

          {hoveredBar && (
            <div
              className="chart-tooltip-portal"
              style={{
                left: `${hoveredBar.clientX}px`,
                top: `${hoveredBar.clientY - 45}px`,
                opacity: 1,
                transform: 'translate(-50%, 0) scale(1)'
              }}
            >
              <div className="chart-tooltip-title">
                {t[hoveredBar.label.toLowerCase().replace(/\s+/g, '')] || hoveredBar.label}
              </div>
              <div className="chart-tooltip-value">
                {(t[metric] || t.tooltipValue)}: {formatVal(hoveredBar.value)}
              </div>
              <div className="text-[10px] text-textMuted border-top mt-1 pt-1 italic font-semibold text-center">
                <i className="fas fa-hand-pointer mr-1 text-accent animate-pulse"></i>
                {t.clickToSeeTrend}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
