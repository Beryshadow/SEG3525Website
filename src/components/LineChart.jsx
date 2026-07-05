import React, { useState, useRef, useMemo } from 'react';
import { CURRENCY_CONFIG } from '../data/dashboardData';
import '../stylesheets/Dashboard.css';

export default function LineChart({ data, metric, currency, lang, t, onNodeClick }) {
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const containerRef = useRef(null);

  const svgWidth = 600;
  const svgHeight = 260;
  const margin = { top: 20, right: 25, bottom: 45, left: 75 };

  const minYear = 1990;
  const maxYear = 2026;

  const chartData = useMemo(() => {
    const dataMap = new Map(data.map(d => [d.year, d.value]));
    const result = [];
    for (let yr = minYear; yr <= maxYear; yr++) {
      result.push({
        year: yr,
        value: dataMap.get(yr) || 0
      });
    }
    return result;
  }, [data]);

  const yBounds = useMemo(() => {
    const values = chartData.map(d => d.value);
    const maxVal = Math.max(...values, 0);
    const yMax = maxVal === 0 ? 10 : Math.ceil(maxVal * 1.15 / 5) * 5;
    return { min: 0, max: yMax };
  }, [chartData]);

  const getX = (year) => {
    return margin.left + ((year - minYear) * (svgWidth - margin.left - margin.right)) / (maxYear - minYear);
  };

  const getY = (value) => {
    return svgHeight - margin.bottom - ((value - yBounds.min) * (svgHeight - margin.top - margin.bottom)) / (yBounds.max - yBounds.min);
  };

  const { linePath, areaPath, points } = useMemo(() => {
    if (chartData.length === 0) return { linePath: '', areaPath: '', points: [] };

    const pts = chartData.map(d => ({
      year: d.year,
      value: d.value,
      x: getX(d.year),
      y: getY(d.value)
    }));

    let dLine = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      dLine += ` L ${pts[i].x} ${pts[i].y}`;
    }

    const yZero = getY(0);
    const dArea = `${dLine} L ${pts[pts.length - 1].x} ${yZero} L ${pts[0].x} ${yZero} Z`;

    return { linePath: dLine, areaPath: dArea, points: pts };
  }, [chartData, yBounds]);

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

  const xTicks = useMemo(() => {
    const ticks = [];
    for (let yr = minYear; yr <= maxYear; yr += 6) {
      ticks.push(yr);
    }
    return ticks;
  }, []);

  const handleMouseMove = (e) => {
    if (!containerRef.current || points.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * svgWidth;

    let closest = points[0];
    let minDist = Math.abs(points[0].x - mouseX);

    for (let i = 1; i < points.length; i++) {
      const dist = Math.abs(points[i].x - mouseX);
      if (dist < minDist) {
        minDist = dist;
        closest = points[i];
      }
    }

    setHoveredPoint({
      ...closest,
      clientX: e.clientX - rect.left,
      clientY: closest.y * (rect.height / svgHeight)
    });
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
  };

  const isAllZero = chartData.every(d => d.value === 0);

  return (
    <div ref={containerRef} className="position-relative w-100">
      {isAllZero ? (
        <div className="chart-empty-state neu-pressed rounded-2xl m-2">
          <i className="fas fa-chart-line fa-2x mb-3 opacity-40 text-textMuted"></i>
          <p className="text-sm italic">{t.noDataForFilters}</p>
        </div>
      ) : (
        <>
          <svg
            className="chart-svg"
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <defs>
              <linearGradient id="chartAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.25" />
                <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0.0" />
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

            {xTicks.map((tick, i) => (
              <g key={`x-tick-${i}`}>
                <line
                  x1={getX(tick)}
                  y1={svgHeight - margin.bottom}
                  x2={getX(tick)}
                  y2={svgHeight - margin.bottom + 5}
                  className="chart-axis-line"
                />
                <text
                  x={getX(tick)}
                  y={svgHeight - margin.bottom + 20}
                  textAnchor="middle"
                  className="chart-axis-text"
                >
                  {tick}
                </text>
              </g>
            ))}

            <path d={areaPath} className="chart-area-path" />
            <path d={linePath} className="chart-line-path" />

            {hoveredPoint && (
              <line
                x1={hoveredPoint.x}
                y1={margin.top}
                x2={hoveredPoint.x}
                y2={svgHeight - margin.bottom}
                className="chart-guide-line"
              />
            )}

            {points.map((pt, i) => (
              <circle
                key={`point-${i}`}
                cx={pt.x}
                cy={pt.y}
                r={hoveredPoint && hoveredPoint.year === pt.year ? 5.5 : 3.5}
                className={`chart-point-marker ${hoveredPoint && hoveredPoint.year === pt.year ? 'active' : ''}`}
                onClick={() => onNodeClick && onNodeClick(pt.year)}
              />
            ))}
          </svg>

          {hoveredPoint && (
            <div
              className="chart-tooltip-portal"
              style={{
                left: `${hoveredPoint.clientX + 15}px`,
                top: `${hoveredPoint.clientY - 45}px`,
                opacity: 1,
                transform: 'scale(1)'
              }}
            >
              <div className="chart-tooltip-title">
                {t.tooltipYear}: {hoveredPoint.year}
              </div>
              <div className="chart-tooltip-value">
                {(t[metric] || t.tooltipValue)}: {formatVal(hoveredPoint.value)}
              </div>
              <div className="text-[10px] text-textMuted border-top mt-1 pt-1 italic font-semibold">
                <i className="fas fa-hand-pointer mr-1 text-accent animate-pulse"></i>
                {t.clickToCompare}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
