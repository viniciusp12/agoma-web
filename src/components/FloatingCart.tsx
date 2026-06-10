import { ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function FloatingCart() {
  const { totalItems, totalPrice, openCart, state } = useCart();

  if (totalItems === 0 || state.isCartOpen) return null;

  return (
    <button
      onClick={openCart}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-[#1A2E17] hover:bg-[#2B4A26] text-white shadow-2xl rounded-full px-6 py-3.5 flex items-center gap-3 transition-all hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.35)] animate-fade-up"
    >
      <div className="relative">
        <ShoppingBag size={20} />
        <span className="absolute -top-2 -right-2 bg-[#C4A044] text-[#1A2E17] text-[0.6rem] font-black w-4.5 h-4.5 min-w-[18px] min-h-[18px] rounded-full flex items-center justify-center leading-none px-1">
          {totalItems}
        </span>
      </div>
      <span className="font-bold text-sm">Ver Pedido</span>
      <span className="font-black text-[#C4A044] text-sm">{formatCurrency(totalPrice)}</span>
    </button>
  );
}
