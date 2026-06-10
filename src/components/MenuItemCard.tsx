import type { MenuItem } from '../types';

interface Props {
  item: MenuItem;
  compact?: boolean;
}

const CATEGORY_PLACEHOLDER: Record<string, string> = {
  ciabattas:  '🥖',
  burguers:   '🍔',
  wraps:      '🌯',
  fritas:     '🍟',
  croissants: '🥐',
  sobremesas: '🍫',
  bebidas:    '🥤',
  adicionais: '➕',
};

export default function MenuItemCard({ item, compact = false }: Props) {
  const isListItem = !item.image && (item.category === 'bebidas' || item.category === 'adicionais');

  if (isListItem) {
    return (
      <div className="bg-white rounded-xl border border-[#E2DAC8] px-4 py-3 flex items-center justify-between gap-3 hover:shadow-md transition-all hover:-translate-y-0.5">
        <span className="font-medium text-[#1A1A1A] text-sm">{item.name}</span>
        <span className="font-bold text-[#1A2E17] text-sm whitespace-nowrap">R$ {item.price}</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-[#E2DAC8] overflow-hidden shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 flex flex-col group">
      {/* Image */}
      <div className={`w-full overflow-hidden bg-[#EDE6D8] ${compact ? 'aspect-[4/3]' : 'aspect-[4/3]'}`}>
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#EDE6D8] to-[#E0D5C0]">
            <span className="text-5xl opacity-40">{CATEGORY_PLACEHOLDER[item.category]}</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col gap-1.5 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-[#1A1A1A] text-sm leading-snug" style={{ fontFamily: "'Playfair Display', serif" }}>
            {item.name}
            {item.badge && (
              <span className="ml-2 inline-block text-[0.6rem] bg-[#1A2E17] text-[#C4A044] px-2 py-0.5 rounded-full font-semibold tracking-wide align-middle">
                {item.badge}
              </span>
            )}
          </h3>
          <span className="text-[#1A2E17] font-bold text-sm whitespace-nowrap shrink-0">
            R$ {item.price}
          </span>
        </div>
        {item.description && (
          <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">{item.description}</p>
        )}
      </div>
    </div>
  );
}
