import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, ShoppingBag, ArrowLeft } from 'lucide-react';
import { useCart } from '../context/CartContext';

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatMeat(point?: string) {
  if (!point) return '';
  return { mal_passado: 'Mal passado', ao_ponto: 'Ao ponto', bem_passado: 'Bem passado' }[point] ?? '';
}

export default function Pedidos() {
  const { state, clearCart, totalPrice } = useCart();
  const { items, address } = state;
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  function handleVoltar() {
    clearCart();
    navigate('/');
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] py-10 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Success Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <CheckCircle size={64} className="text-[#1A2E17] mb-4" strokeWidth={1.5} />
          <h1
            className="text-3xl font-black text-[#1A1A1A] mb-2"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Pedido Realizado!
          </h1>
          <p className="text-gray-500 text-sm">
            Seu pedido foi registrado com sucesso. Aguarde a confirmação.
          </p>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
            <ShoppingBag size={18} className="text-[#1A2E17]" />
            <h2 className="font-bold text-[#1A1A1A]">Resumo do Pedido</h2>
          </div>

          <div className="divide-y divide-gray-50">
            {items.map((ci) => {
              const addPrice = ci.additionals.reduce((s, a) => s + a.price, 0);
              const combo = ci.isCombo ? 16 : 0;
              const unit = ci.item.price + addPrice + combo;
              return (
                <div key={ci.cartId} className="flex gap-4 px-6 py-4">
                  {ci.item.image ? (
                    <img
                      src={ci.item.image}
                      alt={ci.item.name}
                      className="w-14 h-14 object-cover rounded-xl shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 bg-[#EDE6D8] rounded-xl shrink-0 flex items-center justify-center text-2xl">
                      🍔
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-bold text-[#1A1A1A] text-sm">
                      {ci.item.name}
                      <span className="text-gray-400 font-normal"> x{ci.quantity}</span>
                    </p>
                    <div className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                      {ci.meatPoint && <p>• {formatMeat(ci.meatPoint)}</p>}
                      {ci.isCombo && (
                        <p>• 🔥 Combo (Refri + Fritas){ci.comboDrink ? ` — ${ci.comboDrink}` : ''}</p>
                      )}
                      {ci.additionals.map((a) => (
                        <p key={a.id}>• + {a.name}</p>
                      ))}
                    </div>
                  </div>
                  <p className="font-bold text-[#1A2E17] text-sm shrink-0">
                    {formatCurrency(unit * ci.quantity)}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Total */}
          <div className="flex items-center justify-between px-6 py-4 bg-[#1A2E17]/5 border-t border-[#1A2E17]/10">
            <span className="font-bold text-[#1A1A1A]">Total</span>
            <span className="text-xl font-black text-[#1A2E17]">{formatCurrency(totalPrice)}</span>
          </div>
        </div>

        {/* Address */}
        {address && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-4 mb-6">
            <h3 className="font-bold text-[#1A1A1A] mb-2 text-sm">📍 Endereço de entrega</h3>
            <p className="text-sm text-gray-600">
              {address.street}, {address.number}
              {address.complement ? ` - ${address.complement}` : ''}
            </p>
            <p className="text-sm text-gray-600">
              {address.neighborhood}, {address.city} - {address.state}
            </p>
            <p className="text-sm text-gray-600">CEP: {address.cep}</p>
            {address.reference && (
              <p className="text-sm text-gray-400 mt-1">Ref: {address.reference}</p>
            )}
          </div>
        )}

        {/* Back Button */}
        <button
          onClick={handleVoltar}
          className="w-full flex items-center justify-center gap-2 bg-[#1A2E17] hover:bg-[#243d20] text-white font-bold py-3.5 rounded-xl transition-all hover:-translate-y-0.5"
        >
          <ArrowLeft size={18} />
          Voltar ao início
        </button>
      </div>
    </div>
  );
}
