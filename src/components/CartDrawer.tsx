import { X, Trash2, Plus, Minus, ShoppingBag, MessageCircle } from 'lucide-react';
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
  const { isCartOpen, items, address } = state;

  if (!isCartOpen) return null;

  function buildWhatsAppMessage(): string {
    const lines: string[] = ['🛒 *Novo Pedido AGOMA.*\n'];

    items.forEach((ci, i) => {
      const addPrice = ci.additionals.reduce((s, a) => s + a.price, 0);
      const combo = ci.isCombo ? 16 : 0;
      const unit = ci.item.price + addPrice + combo;

      lines.push(`*${i + 1}. ${ci.item.name}* x${ci.quantity} — ${formatCurrency(unit * ci.quantity)}`);
      if (ci.meatPoint)         lines.push(`   • Ponto: ${formatMeat(ci.meatPoint)}`);
      if (ci.isCombo)           lines.push(`   • 🔥 Combo (Refri + Fritas)`);
      ci.additionals.forEach((a) => lines.push(`   • + ${a.name}`));
    });

    lines.push(`\n💰 *Total: ${formatCurrency(totalPrice)}*`);

    if (address) {
      lines.push(`\n📍 *Endereço de entrega:*`);
      lines.push(`${address.street}, ${address.number}${address.complement ? ` - ${address.complement}` : ''}`);
      lines.push(`${address.neighborhood}, ${address.city} - ${address.state}`);
      lines.push(`CEP: ${address.cep}`);
      if (address.reference) lines.push(`Ref: ${address.reference}`);
    }

    return encodeURIComponent(lines.join('\n'));
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[150] bg-black/50 backdrop-blur-sm"
        onClick={closeCart}
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 bottom-0 z-[160] w-full max-w-sm bg-white shadow-2xl flex flex-col animate-fade-in">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ShoppingBag size={20} className="text-[#1A2E17]" />
            <h2 className="font-bold text-[#1A1A1A]" style={{ fontFamily: "'Playfair Display', serif" }}>
              Meu Pedido
            </h2>
            {items.length > 0 && (
              <span className="bg-[#1A2E17] text-[#C4A044] text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {items.reduce((s, i) => s + i.quantity, 0)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button onClick={clearCart}
                className="text-xs text-red-400 hover:text-red-600 font-medium flex items-center gap-1">
                <Trash2 size={13} /> Limpar
              </button>
            )}
            <button onClick={closeCart} className="text-gray-400 hover:text-gray-600 ml-2">
              <X size={22} />
            </button>
          </div>
        </div>

        {/* Address badge */}
        {address && (
          <div className="mx-5 mt-3 px-3 py-2 bg-[#1A2E17]/5 border border-[#1A2E17]/20 rounded-xl text-xs text-[#1A2E17] font-medium truncate">
            📍 {address.street}, {address.number} — {address.neighborhood}
          </div>
        )}

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-3 flex flex-col gap-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-400">
              <ShoppingBag size={48} className="opacity-20" />
              <p className="text-sm">Seu carrinho está vazio</p>
            </div>
          ) : (
            items.map((ci) => {
              const addPrice = ci.additionals.reduce((s, a) => s + a.price, 0);
              const combo    = ci.isCombo ? 16 : 0;
              const unit     = ci.item.price + addPrice + combo;

              return (
                <div key={ci.cartId}
                  className="bg-gray-50 rounded-xl p-3 flex gap-3">
                  {/* Thumb */}
                  {ci.item.image ? (
                    <img src={ci.item.image} alt={ci.item.name}
                      className="w-16 h-16 object-cover rounded-lg shrink-0" />
                  ) : (
                    <div className="w-16 h-16 bg-[#EDE6D8] rounded-lg shrink-0 flex items-center justify-center text-2xl">
                      🍔
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-[#1A1A1A] truncate">{ci.item.name}</p>

                    {/* Details */}
                    <div className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                      {ci.meatPoint && <p>• {formatMeat(ci.meatPoint)}</p>}
                      {ci.isCombo   && <p>• 🔥 Combo (Refri + Fritas)</p>}
                      {ci.additionals.map((a) => <p key={a.id}>• + {a.name}</p>)}
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      {/* Qty */}
                      <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 px-1.5 py-0.5">
                        <button onClick={() => updateQty(ci.cartId, ci.quantity - 1)}
                          className="w-5 h-5 flex items-center justify-center text-gray-500 hover:text-gray-700">
                          <Minus size={12} />
                        </button>
                        <span className="text-xs font-bold w-4 text-center">{ci.quantity}</span>
                        <button onClick={() => updateQty(ci.cartId, ci.quantity + 1)}
                          className="w-5 h-5 flex items-center justify-center text-gray-500 hover:text-gray-700">
                          <Plus size={12} />
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[#1A2E17]">
                          {formatCurrency(unit * ci.quantity)}
                        </span>
                        <button onClick={() => removeFromCart(ci.cartId)}
                          className="text-red-400 hover:text-red-600">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="shrink-0 border-t border-gray-100 px-5 py-4 bg-white flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 font-medium">Total do pedido</span>
              <span className="text-xl font-black text-[#1A2E17]">{formatCurrency(totalPrice)}</span>
            </div>
            <a
              href={`https://wa.me/5511988381411?text=${buildWhatsAppMessage()}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-[#25D366] hover:bg-[#1ebe5a] text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5"
            >
              <MessageCircle size={18} />
              Finalizar pelo WhatsApp
            </a>
          </div>
        )}
      </div>
    </>
  );
}
