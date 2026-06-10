import { useState, useEffect } from 'react';
import { X, Plus, Minus, ChevronLeft } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { COMBO_PRICE, COMBO_DRINKS } from '../../data/menu';
import { useMenuItems } from '../../hooks/useMenuItems';
import type { MeatPoint, CartItemAdditional } from '../../types';

const MEAT_POINTS: { value: MeatPoint; label: string; emoji: string }[] = [
  { value: 'mal_passado',  label: 'Mal Passado',  emoji: '🩸' },
  { value: 'ao_ponto',     label: 'Ao Ponto',     emoji: '👌' },
  { value: 'bem_passado',  label: 'Bem Passado',  emoji: '🔥' },
];

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function CustomizeModal() {
  const { state, addToCart, setStep, closeModals } = useCart();
  const { items: menuItems } = useMenuItems();
  const item = state.pendingItem;

  const AVAILABLE_ADDITIONALS: CartItemAdditional[] = menuItems
    .filter(i => i.category === 'adicionais')
    .map(i => ({ id: i.id, name: i.name, price: i.price }));

  const [qty, setQty]             = useState(1);
  const [meatPoint, setMeat]      = useState<MeatPoint>('ao_ponto');
  const [additionals, setAdd]     = useState<CartItemAdditional[]>([]);
  const [isCombo, setCombo]       = useState(false);
  const [comboDrink, setComboDrink] = useState('');

  useEffect(() => {
    if (state.step === 'customize') {
      setQty(1); setAdd([]); setCombo(false); setMeat('ao_ponto'); setComboDrink('');
      document.body.style.overflow = 'hidden';
    }
    return () => { document.body.style.overflow = ''; };
  }, [state.step]);

  if (state.step !== 'customize' || !item) return null;

  // item is guaranteed non-null here
  const safeItem = item;

  const addPrice   = additionals.reduce((s, a) => s + a.price, 0);
  const comboPrice = isCombo ? COMBO_PRICE : 0;
  const unitPrice  = safeItem.price + addPrice + comboPrice;
  const total      = unitPrice * qty;

  function toggleAdditional(add: CartItemAdditional) {
    setAdd((prev) =>
      prev.find((a) => a.id === add.id)
        ? prev.filter((a) => a.id !== add.id)
        : [...prev, add]
    );
  }

  function handleAdd() {
    const cartId = `${safeItem.id}-${Date.now()}`;
    addToCart({
      cartId,
      item: safeItem,
      quantity: qty,
      meatPoint: safeItem.hasMeatPoint ? meatPoint : undefined,
      additionals,
      isCombo,
      comboDrink: isCombo ? comboDrink : undefined,
    });
  }

  const showAdditionals = safeItem.category !== 'bebidas'
    && safeItem.category !== 'adicionais'
    && safeItem.category !== 'sobremesas';

  const maxAdd     = safeItem.maxAdditionals ?? Infinity;
  const addLimitHit = additionals.length >= maxAdd;
  const showCombo       = !!safeItem.canBeCombo;
  const showMeat        = !!safeItem.hasMeatPoint;

  const CATEGORY_PLACEHOLDER: Record<string, string> = {
    ciabattas: '🥖', burguers: '🍔', wraps: '🌯', fritas: '🍟',
    croissants: '🥐', sobremesas: '🍫', bebidas: '🥤', adicionais: '➕',
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModals} />

      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md max-h-[94vh] flex flex-col animate-fade-up">

        {/* ── Item photo + header ── */}
        <div className="relative shrink-0">
          {safeItem.image ? (
            <img src={safeItem.image} alt={safeItem.name}
              className="w-full h-44 object-cover rounded-t-2xl" />
          ) : (
            <div className="w-full h-32 bg-gradient-to-br from-[#EDE6D8] to-[#E0D5C0] rounded-t-2xl flex items-center justify-center">
              <span className="text-6xl opacity-40">{CATEGORY_PLACEHOLDER[safeItem.category]}</span>
            </div>
          )}
          <button
            onClick={closeModals}
            className="absolute top-3 right-3 bg-white/90 backdrop-blur rounded-full p-1.5 shadow text-gray-600 hover:text-gray-800"
          >
            <X size={18} />
          </button>
          {state.address && (
            <button
              onClick={() => setStep('address')}
              className="absolute top-3 left-3 bg-white/90 backdrop-blur rounded-full p-1.5 shadow text-gray-600 hover:text-gray-800"
            >
              <ChevronLeft size={18} />
            </button>
          )}
        </div>

        {/* ── Scrollable content ── */}
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-5">

          {/* Name + base price */}
          <div>
            <h2 className="text-xl font-bold text-[#1A1A1A]" style={{ fontFamily: "'Playfair Display', serif" }}>
              {safeItem.name}
            </h2>
            {item.description && (
              <p className="text-sm text-gray-500 mt-1 leading-relaxed">{safeItem.description}</p>
            )}
            <p className="text-[#1A2E17] font-bold mt-2">{formatCurrency(safeItem.price)}</p>
          </div>

          {/* ── Ponto da carne ── */}
          {showMeat && (
            <div>
              <SectionTitle title="Ponto da Carne" required />
              <div className="flex flex-col gap-2">
                {MEAT_POINTS.map(({ value, label, emoji }) => (
                  <label key={value}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      meatPoint === value
                        ? 'border-[#1A2E17] bg-[#1A2E17]/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input type="radio" name="meat" className="sr-only"
                      checked={meatPoint === value} onChange={() => setMeat(value)} />
                    <span className="text-xl">{emoji}</span>
                    <span className={`font-semibold text-sm ${meatPoint === value ? 'text-[#1A2E17]' : 'text-gray-600'}`}>
                      {label}
                    </span>
                    {meatPoint === value && (
                      <span className="ml-auto w-5 h-5 bg-[#1A2E17] rounded-full flex items-center justify-center">
                        <svg viewBox="0 0 10 8" className="w-3 h-3 fill-white">
                          <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* ── Combo ── */}
          {showCombo && (
            <div>
              <SectionTitle title="Virar Combo?" />
              <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                isCombo ? 'border-[#C4A044] bg-[#C4A044]/10' : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input type="checkbox" className="sr-only"
                  checked={isCombo} onChange={(e) => { setCombo(e.target.checked); setComboDrink(''); }} />
                <span className="text-2xl">🔥</span>
                <div className="flex-1">
                  <p className={`font-bold text-sm ${isCombo ? 'text-[#1A2E17]' : 'text-gray-700'}`}>
                    Refri + Fritas da Casa
                  </p>
                  <p className="text-xs text-gray-500">Adicione um combo completo ao seu lanche</p>
                </div>
                <span className={`font-bold text-sm ${isCombo ? 'text-[#C4A044]' : 'text-gray-500'}`}>
                  +{formatCurrency(COMBO_PRICE)}
                </span>
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                  isCombo ? 'bg-[#C4A044] border-[#C4A044]' : 'border-gray-300'
                }`}>
                  {isCombo && (
                    <svg viewBox="0 0 10 8" className="w-3 h-3 fill-white">
                      <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
              </label>

              {/* Escolha da bebida do combo */}
              {isCombo && (
                <div className="mt-3">
                  <SectionTitle title="Qual bebida?" required />
                  <div className="flex flex-col gap-2">
                    {COMBO_DRINKS.map((drink) => (
                      <label key={drink}
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                          comboDrink === drink
                            ? 'border-[#1A2E17] bg-[#1A2E17]/5'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input type="radio" name="comboDrink" className="sr-only"
                          checked={comboDrink === drink} onChange={() => setComboDrink(drink)} />
                        <span className="text-xl">🥤</span>
                        <span className={`font-semibold text-sm flex-1 ${comboDrink === drink ? 'text-[#1A2E17]' : 'text-gray-600'}`}>
                          {drink}
                        </span>
                        {comboDrink === drink && (
                          <span className="w-5 h-5 bg-[#1A2E17] rounded-full flex items-center justify-center">
                            <svg viewBox="0 0 10 8" className="w-3 h-3 fill-white">
                              <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </span>
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Adicionais ── */}
          {showAdditionals && (
            <div>
              <div className="flex items-baseline justify-between mb-3">
                <div className="flex items-baseline gap-2">
                  <h3 className="font-bold text-[#1A1A1A] text-sm">Adicionais</h3>
                  <span className="text-xs text-gray-400">Opcional</span>
                </div>
                {maxAdd !== Infinity && (
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    addLimitHit
                      ? 'bg-red-100 text-red-600'
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {additionals.length}/{maxAdd}
                  </span>
                )}
              </div>

              {addLimitHit && (
                <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg mb-2">
                  Limite de {maxAdd} adicionais atingido
                </p>
              )}

              <div className="flex flex-col gap-2">
                {AVAILABLE_ADDITIONALS.map((add) => {
                  const checked  = !!additionals.find((a) => a.id === add.id);
                  const disabled = !checked && addLimitHit;
                  return (
                    <label key={add.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                        disabled
                          ? 'border-gray-100 opacity-40 cursor-not-allowed'
                          : checked
                            ? 'border-[#1A2E17] bg-[#1A2E17]/5 cursor-pointer'
                            : 'border-gray-100 hover:border-gray-200 cursor-pointer'
                      }`}
                    >
                      <input type="checkbox" className="sr-only"
                        checked={checked}
                        disabled={disabled}
                        onChange={() => !disabled && toggleAdditional(add)} />
                      <span className={`flex-1 font-medium text-sm ${checked ? 'text-[#1A2E17]' : 'text-gray-700'}`}>
                        {add.name}
                      </span>
                      <span className={`text-sm font-semibold ${checked ? 'text-[#1A2E17]' : 'text-gray-400'}`}>
                        +{formatCurrency(add.price)}
                      </span>
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                        checked ? 'bg-[#1A2E17] border-[#1A2E17]' : 'border-gray-300'
                      }`}>
                        {checked && (
                          <svg viewBox="0 0 10 8" className="w-3 h-3">
                            <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── Footer: qty + add btn ── */}
        <div className="shrink-0 border-t border-gray-100 px-5 py-4 flex items-center gap-4 bg-white rounded-b-2xl">
          {/* Qty */}
          <div className="flex items-center gap-3 bg-gray-100 rounded-xl px-2 py-1">
            <button
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-600 hover:bg-gray-200 transition-colors"
            >
              <Minus size={16} />
            </button>
            <span className="w-6 text-center font-bold text-[#1A1A1A]">{qty}</span>
            <button
              onClick={() => setQty((q) => q + 1)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-600 hover:bg-gray-200 transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>

          {/* Add button */}
          <button
            onClick={handleAdd}
            disabled={isCombo && !comboDrink}
            className="flex-1 bg-[#1A2E17] hover:bg-[#2B4A26] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all flex items-center justify-between px-4"
          >
            <span>Adicionar</span>
            <span>{formatCurrency(total)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ title, subtitle, required }: { title: string; subtitle?: string; required?: boolean }) {
  return (
    <div className="flex items-baseline gap-2 mb-3">
      <h3 className="font-bold text-[#1A1A1A] text-sm">{title}</h3>
      {required && (
        <span className="text-[0.6rem] bg-[#1A2E17] text-white px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide">
          Obrigatório
        </span>
      )}
      {subtitle && <span className="text-xs text-gray-400">{subtitle}</span>}
    </div>
  );
}
