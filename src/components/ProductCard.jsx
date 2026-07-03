import React from 'react';
import { generateArtImage, generateDescription } from '../utilities/proceduralArt';

export default function ProductCard({ product, t, lang, onAddToCart, onSelectProduct, productStock = {} }) {
  const currentStock = productStock[product.id] ?? product.stock;

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
    <div
      className="p-4 flex flex-col justify-between h-full relative neu-card cursor-pointer"
      onClick={() => onSelectProduct(product)}
    >
      {/* Stock indicator */}
      {currentStock === 0 && (
        <div className="absolute top-4 right-4 bg-red-500 text-white text-xs px-2 py-1 rounded-full z-10">
          {t.outOfStock}
        </div>
      )}

      {/* Image Container */}
      <div className="flex justify-center mb-4">
        <div className="w-full aspect-square flex items-center justify-center rounded-xl overflow-hidden">
          <img src={generateArtImage(product)} alt={product.name} className="w-full h-full object-cover" />
        </div>
      </div>

      {/* Product Details Block */}
      <div className="mb-4 flex-grow">
        <h5 className="font-bold text-base mb-2 text-textMain">{product.name}</h5>
        <p className="text-sm text-textMuted mb-2 whitespace-pre-line">{generateDescription(product, lang, false)}</p>

        <div className="flex justify-between text-xs text-textMuted mt-2">
          <span>{product.artist}</span>
          <span>{t[getCityKey(product.city)] || product.city}</span>
        </div>

        <div className="flex justify-between items-center mt-3">
          <span className="text-accent font-black">${product.price.toFixed(2)}</span>
          <span className="text-xs text-textMuted bg-bgSecondary px-2 py-1 rounded-full">
            {t[product.category] || product.category}
          </span>
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (currentStock > 0) onAddToCart(product);
        }}
        disabled={currentStock === 0}
        className={`neu-btn w-full py-2 text-center text-sm font-bold transition-transform ${
          currentStock === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
        }`}
      >
        {currentStock === 0 ? t.outOfStock : `${t.addToCart} (${currentStock})`}
      </button>
    </div>
  );
}
