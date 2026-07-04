import React from 'react';
import { generateArtImage, generateDescription } from '../utilities/proceduralArt';

export default function ProductModal({ product, t, lang, onClose, onAddToCart }) {
  if (!product) return null;

  const getMediumKey = (medium) => {
    const mediumMap = {
      'Oil on Canvas': 'oil',
      'Acrylic on Canvas': 'acrylic',
      'Watercolor': 'watercolor',
      'Bronze': 'bronze',
      'Marble': 'marble',
      'Ceramic': 'ceramic',
      'Digital Print': 'digital',
      'Gelatin Silver Print': 'gelatin',
      'Ink on Paper': 'ink',
      'Mixed Media': 'mixed'
    };
    return mediumMap[medium] || medium.toLowerCase().replace(/\s+/g, '');
  };

  const getStyleKey = (style) => {
    const styleMap = {
      'Abstract': 'abstract',
      'Impressionist': 'impressionist',
      'Minimalist': 'minimalist',
      'Surreal': 'surreal',
      'Contemporary': 'contemporary',
      'Realist': 'realist',
      'Expressionist': 'expressionist',
      'Cubist': 'cubist'
    };
    return styleMap[style] || style.toLowerCase();
  };

  const getCityKey = (city) => {
    const cityMap = {
      'Paris': 'paris',
      'Barcelona': 'barcelona',
      'New York': 'newyork',
      'Santa Fe': 'santafe',
      'London': 'london',
      'Amsterdam': 'amsterdam',
      'Tokyo': 'tokyo',
      'Berlin': 'berlin',
      'Florence': 'florence',
      'Marrakech': 'marrakech'
    };
    return cityMap[city] || city.toLowerCase().replace(/\s+/g, '');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="neu-flat max-w-2xl w-full p-6 relative max-h-[90vh] overflow-y-auto rounded-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-start">
          <h2 className="text-2xl font-extrabold text-textMain flex-1 min-w-0">{product.name}</h2>
          <button onClick={onClose} className="neu-btn w-10 h-10 flex items-center justify-center flex-shrink-0">
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="neu-pressed aspect-square rounded-xl overflow-hidden">
            <img src={generateArtImage(product)} alt={product.name} className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col justify-between">
            <div>
              <p className="text-sm text-textMuted mb-4">{generateDescription(product, lang)}</p>
              <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                <div><span className="text-accent font-bold">{t.artist}: </span>{product.artist}</div>
                <div><span className="text-accent font-bold">{t.city}: </span>{t[getCityKey(product.city)] || product.city}</div>
                <div><span className="text-accent font-bold">{t.category}: </span>{t[product.category] || product.category}</div>
                <div><span className="text-accent font-bold">{t.medium}: </span>{t[getMediumKey(product.medium)] || product.medium}</div>
                <div><span className="text-accent font-bold">{t.style}: </span>{t[getStyleKey(product.style)] || product.style}</div>
                <div><span className="text-accent font-bold">{t.year}: </span>{product.year}</div>
                <div><span className="text-accent font-bold">{t.dimensions}: </span>
                  {product.category === 'sculpture' 
                    ? `${product.width}×${product.height}×${product.depth} cm` 
                    : `${product.width}×${product.height} cm`}
                </div>
                <div><span className="text-accent font-bold">{t.framed}: </span>{product.framed ? t.yes : t.no}</div>
                <div><span className="text-accent font-bold">{t.signed}: </span>{product.signed ? t.yes : t.no}</div>
                <div>
                  <span className="text-accent font-bold">{t.stock}: </span>
                  {product.stock} {t.unitsAvailable}
                  {product.soldUnits > 0 && ` (${t.originallyCreated} ${product.stock + product.soldUnits})`}
                </div>
              </div>
              <div className="text-accent text-2xl font-black mb-4">${product.price.toFixed(2)}</div>
            </div>
            <button
              onClick={() => { onAddToCart(product); onClose(); }}
              disabled={!product.inStock}
              className={`neu-btn w-full py-3 font-bold ${product.inStock ? '' : 'opacity-50 cursor-not-allowed'}`}
            >
              {product.inStock ? t.addToCart : t.outOfStock}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
