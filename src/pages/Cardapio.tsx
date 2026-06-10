import { useEffect, useRef, useState, useCallback } from 'react';
import { MENU_ITEMS, CATEGORIES } from '../data/menu';
import MenuItemCard from '../components/MenuItemCard';
import type { MenuCategory } from '../types';

export default function Cardapio() {
  const [activeCategory, setActiveCategory] = useState<MenuCategory>('ciabattas');
  const navRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  /* ── Highlight active category on scroll ── */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveCategory(entry.target.id as MenuCategory);
          }
        });
      },
      { rootMargin: '-25% 0px -65% 0px', threshold: 0 }
    );

    CATEGORIES.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  /* ── Scroll nav to keep active button visible ── */
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const active = nav.querySelector<HTMLButtonElement>(`[data-cat="${activeCategory}"]`);
    if (!active) return;
    nav.scrollTo({
      left: active.offsetLeft - nav.offsetWidth / 2 + active.offsetWidth / 2,
      behavior: 'smooth',
    });
  }, [activeCategory]);

  const scrollToSection = useCallback((id: MenuCategory) => {
    const header = document.querySelector<HTMLElement>('.site-header-sticky');
    const nav    = document.querySelector<HTMLElement>('.category-nav-sticky');
    const el     = document.getElementById(id);
    if (!el) return;

    const offset = (header?.offsetHeight ?? 64) + (nav?.offsetHeight ?? 52) + 8;
    const top = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  }, []);

  const itemsByCategory = (cat: MenuCategory) =>
    MENU_ITEMS.filter((item) => item.category === cat);

  return (
    <div>
      {/* ── HERO CARDÁPIO ────────────────────────────────────────── */}
      <div className="bg-[#1A2E17] py-10 px-5 text-center">
        <p className="text-[#C4A044] text-xs font-bold uppercase tracking-widest mb-2">AGOMA.</p>
        <h1
          className="text-4xl md:text-5xl font-black text-[#F5F0E6] mb-2"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Cardápio
        </h1>
        <p className="text-[#F5F0E6]/50 text-sm">
          Todos os preços em R$ · Fale conosco pelo WhatsApp para pedir
        </p>
      </div>

      {/* ── PROMO ────────────────────────────────────────────────── */}
      <div className="bg-[#C4A044] text-[#1A2E17] py-2.5 px-5 text-center text-sm font-medium">
        🔥 <strong>TURBINE SEU LANCHE</strong> — Adicione Refri + Fritas por apenas <strong>+R$ 16</strong>
      </div>

      {/* ── CATEGORY NAV ─────────────────────────────────────────── */}
      <nav
        ref={navRef}
        className="category-nav-sticky sticky top-16 z-40 bg-[#1A2E17] border-b border-white/10 overflow-x-auto hide-scrollbar"
      >
        <div className="flex px-4 min-w-max">
          {CATEGORIES.map(({ id, label, emoji }) => (
            <button
              key={id}
              data-cat={id}
              onClick={() => scrollToSection(id)}
              className={`px-4 py-3.5 text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-all relative ${
                activeCategory === id
                  ? 'text-[#C4A044]'
                  : 'text-[#F5F0E6]/50 hover:text-[#F5F0E6]'
              }`}
            >
              <span className="mr-1">{emoji}</span> {label}
              {activeCategory === id && (
                <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-[#C4A044] rounded-full" />
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* ── MENU SECTIONS ────────────────────────────────────────── */}
      <main className="max-w-6xl mx-auto px-4 py-6 pb-16">
        {CATEGORIES.map(({ id, label, emoji }) => {
          const items = itemsByCategory(id);
          const isList = id === 'bebidas' || id === 'adicionais';

          return (
            <section
              key={id}
              id={id}
              ref={(el) => { sectionRefs.current[id] = el; }}
              className="pt-12 first:pt-6"
            >
              {/* Section heading */}
              <div className="flex items-center gap-3 mb-6 pb-3 border-b-2 border-[#E2DAC8] relative">
                <span className="text-2xl">{emoji}</span>
                <h2
                  className="text-2xl md:text-3xl font-bold text-[#1A2E17]"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {label}
                </h2>
                <span className="absolute bottom-[-2px] left-0 w-12 h-0.5 bg-[#C4A044]" />
              </div>

              {/* Cards */}
              <div
                className={
                  isList
                    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'
                    : 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'
                }
              >
                {items.map((item) => (
                  <MenuItemCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          );
        })}
      </main>
    </div>
  );
}
