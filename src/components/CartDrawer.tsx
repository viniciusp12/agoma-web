import { X, Trash2, Plus, Minus, ShoppingBag, Pencil } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatMeat(point?: string) {
  if (!point) return '';
  return { mal_passado: 'Mal passado', ao_ponto: 'Ao ponto', bem_passado: 'Bem passado' }[point] ?? '';
}

export default function CartDrawer() {
  const { state, closeCart, removeFromCart, updateQty, clearCart, totalPrice } = useCart();
  const { isCartOpen, items, address, customerName } = state;
  const navigate = useNavigate();

  function handleFinalizarPedido() {
    // Salva snapshot para a tela de pagamento usar
    localStorage.setItem(
      'agoma_checkout_snapshot',
      JSON.stringify({ items, address, total: totalPrice, customerName }),
    );
    closeCart();
    navigate('/pagamento');
  }

  if (!isCartOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={closeCart}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-sm bg-[#FAF7F2] z-50 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <ShoppingBag size={20} className="text-[#1A2E17]" />
            <span
              className="text-lg font-black text-[#1A1A1A]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Carrinho
            </span>
          </div>
          <button
            onClick={closeCart}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-all"
          >
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Nome do cliente */}
        {customerName && (
          <div className="px-5 pt-3 pb-1 flex items-center gap-2">
            <span className="text-sm text-gray-500">Pedido para:</span>
            <span className="text-sm font-bold text-[#1A2E17]">{customerName}</span>
          </div>
        )}

        {/* Endereço */}
        {address && (
          <div className="px-5 pb-2 flex items-center gap-2">
            <span className="text-xs text-gray-400 truncate">
              📍 {address.street}, {address.number} — {address.neighborhood}
            </span>
            <Pencil size={12} className="text-gray-400 shrink-0" />
          </div>
        )}

        {/* Itens */}
        <div className="flex-1 overflow-y-auto px-5 py-3 flex flex-col gap-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
              <ShoppingBag size={40} strokeWidth={1.5} />
              <p className="text-sm">Seu carrinho está vazio</p>
            </div>
          ) : (
            items.map((ci) => (
              <div
                key={ci.cartId}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 flex gap-3"
              >
                {ci.item.image && (
                  <img
                    src={ci.item.image}
                    alt={ci.item.name}
                    className="w-14 h-14 rounded-xl object-cover shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#1A1A1A] truncate">{ci.item.name}</p>
                  {ci.meatPoint && (
                    <p className="text-xs text-gray-400">{formatMeat(ci.meatPoint)}</p>
                  )}
                  {ci.additionals && ci.additionals.length > 0 && (
                    <p className="text-xs text-gray-400">
                      + {ci.additionals.map(e => e.name).join(', ')}
                    </p>
                  )}
                  <p className="text-xs font-semibold text-[#C4A044] mt-0.5">
                    {formatCurrency(ci.item.price * ci.quantity)}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => updateQty(ci.cartId, ci.quantity - 1)}
                      className="w-6 h-6 flex items-center justify-center rounded-full border border-gray-200 hover:border-[#1A2E17] transition-all"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="text-sm font-bold w-4 text-center">{ci.quantity}</span>
                    <button
                      onClick={() => updateQty(ci.cartId, ci.quantity + 1)}
                      className="w-6 h-6 flex items-center justify-center rounded-full border border-gray-200 hover:border-[#1A2E17] transition-all"
                    >
                      <Plus size={12} />
                    </button>
                    <button
                      onClick={() => removeFromCart(ci.cartId)}
                      className="ml-auto w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-50 transition-all"
                    >
                      <Trash2 size={12} className="text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="px-5 py-4 border-t border-gray-200 bg-white">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-bold text-[#1A1A1A]">Total</span>
              <span className="text-xl font-black text-[#1A2E17]">{formatCurrency(totalPrice)}</span>
            </div>
            <button
              onClick={handleFinalizarPedido}
              className="w-full bg-[#1A2E17] hover:bg-[#243d20] text-white font-bold py-3.5 rounded-xl transition-all hover:-translate-y-0.5 text-sm"
            >
              Ir para pagamento
            </button>
            <button
              onClick={() => { clearCart(); closeCart(); }}
              className="mt-2 w-full text-xs text-gray-400 hover:text-red-500 transition-all py-1"
            >
              Limpar carrinho
            </button>
          </div>
        )}
      </div>
    </>
  );
}
