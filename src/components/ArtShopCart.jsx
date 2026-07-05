import React from 'react';

export default function ArtShopCart({
  t,
  cart,
  cartTotal,
  removeFromCart,
  handlePayment,
  paymentConfirmed,
  setPaymentConfirmed,
  onClose,
}) {
  if (paymentConfirmed) {
    return (
      <div className="text-center py-8">
        <i className="fas fa-check-circle text-accent text-5xl mb-4 block"></i>
        <h4 className="text-lg font-bold mb-2">{t.thankYou}</h4>
        <p className="text-sm text-textMuted mb-6">{t.paymentProcessed}</p>
        <button
          onClick={() => {
            setPaymentConfirmed(false);
            if (onClose) onClose();
          }}
          className="neu-btn w-full py-3 font-bold"
        >
          {t.close || 'Close'}
        </button>
      </div>
    );
  }

  return (
    <>
      {cart.length === 0 ? (
        <p className="text-sm text-textMuted italic">{t.cartEmpty}</p>
      ) : (
        <div className="space-y-3 max-h-[50vh] overflow-y-auto">
          {cart.map(item => (
            <div key={item.id} className="flex justify-between items-center p-3 neu-pressed rounded-lg">
              <div className="flex-1">
                <div className="font-bold text-sm">{item.name}</div>
                <div className="text-xs text-textMuted">${item.price.toFixed(2)} × {item.quantity}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">${(item.price * item.quantity).toFixed(2)}</span>
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="neu-btn w-8 h-8 flex items-center justify-center"
                >
                  <i className="fas fa-times text-xs"></i>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 border-t pt-4">
        <div className="flex justify-between font-bold mb-4">
          <span>{t.cartTotal}</span>
          <span>${cartTotal.toFixed(2)}</span>
        </div>
        <button
          onClick={handlePayment}
          disabled={cartTotal === 0}
          className="neu-btn w-full py-3 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {cartTotal === 0 ? t.addArtFirst || 'Add art first' : t.bookInstantly}
        </button>
      </div>
    </>
  );
}
