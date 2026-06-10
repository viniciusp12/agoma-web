import { Plus } from 'lucide-react';
import { useCart } from '../context/CartContext';
import type { MenuItem } from '../types';

interface Props {
  item: MenuItem;
  compact?: boolean;
}

const PLACEHOLDER: Record<string, string> = {
  ciabattas: '🥖', burguers: '🍔', wraps: '🌯', fritas: '🍟',
  croissants: '🥐', sobremesas: '🍫', bebidas: '🥤', adicionais: '➕',
};

export default function MenuItemCard({ item, compact = false }: Props) {
  const { startOrder } = useCart();

  const isListItem = !item.image &&
    (item.category === 'bebidas' || item.category === 'adicionais');

  if (isListItem) {
    const isAddOn = item.category === 'adicionais';
    return (
      <div className="bg-white rounded-xl border border-[#E2DAC8] px-4 py-3 flex items-center justify-between gap-3 hover:shadow-md transition-all hover:-translate-y-0.5">
        <span className="font-medium text-[#1A1A1A] text-sm">{item.name}</span>
        <div className="flex items-center gap-2 shrink-0">
          <span className="font-bold text-[#1A2E17] text-sm">R$ {item.price}</span>
          {!isAddOn && (
            <button
              onClick={() => startOrder(item)}
              className="w-7 h-7 bg-[#1A2E17] hover:bg-[#2B4A26] text-white rounded-lg flex items-center justify-center transition-all hover:scale-110"
              aria-label={`Adicionar ${item.name}`}
            >
              <Plus size={14} />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-2xl border border-[#E2DAC8] overflow-hidden shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 flex flex-col group ${compact ? '' : ''}`}>
      {/* Image */}
      <div className="w-full aspect-[4/3] overflow-hidden bg-[#EDE6D8] relative">
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#EDE6D8] to-[#E0D5C0]">
            <span className="text-5xl opacity-40">{PLACEHOLDER[item.category]}</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-start justify-between gap-1">
          <h3
            className="font-bold text-[#1A1A1A] text-base leading-snug"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {item.name}
            {item.badge && (
              <span className="ml-1.5 inline-block text-[0.6rem] bg-[#1A2E17] text-[#C4A044] px-1.5 py-0.5 rounded-full font-semibold tracking-wide align-middle">
                {item.badge}
              </span>
            )}
          </h3>
        </div>

        {item.description && (
          <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{item.description}</p>
        )}

        {/* Price + Add button */}
        <div className="flex items-center justify-between mt-auto pt-2">
          <span className="text-[#1A2E17] font-bold text-base">R$ {item.price}</span>
          <button
            onClick={() => startOrder(item)}
            className="flex items-center gap-1.5 bg-[#1A2E17] hover:bg-[#2B4A26] text-white text-sm font-bold px-3.5 py-2 rounded-xl transition-all hover:scale-105 active:scale-95"
            aria-label={`Adicionar ${item.name}`}
          >
            <Plus size={14} /> Adicionar
          </button>
        </div>
      </div>
    </div>
  );
}
