import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, MessageCircle } from 'lucide-react';

export default function Header() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  const navLinks = [
    { to: '/',         label: 'Início' },
    { to: '/cardapio', label: 'Cardápio' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#1A2E17] shadow-lg">
      <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-3 shrink-0">
          <img
            src="/assets/logo/logo-light.png"
            alt="AGOMA."
            className="h-9 w-auto brightness-0 invert opacity-90"
          />
          <div className="leading-tight">
            <p className="text-[#F5F0E6] font-bold text-xl tracking-wide" style={{ fontFamily: "'Playfair Display', serif" }}>
              AGOMA.
            </p>
            <p className="text-[#C4A044] text-[0.6rem] tracking-widest uppercase font-semibold">
              street food na ladeira
            </p>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`px-4 py-2 rounded-full text-sm font-semibold tracking-wide transition-all ${
                pathname === l.to
                  ? 'bg-[#C4A044] text-[#1A2E17]'
                  : 'text-[#F5F0E6]/70 hover:text-[#F5F0E6]'
              }`}
            >
              {l.label}
            </Link>
          ))}
          <a
            href="https://wa.me/5511988381411"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-3 flex items-center gap-2 bg-[#25D366] hover:bg-[#1ebe5a] text-white text-sm font-semibold px-4 py-2 rounded-full transition-all hover:-translate-y-0.5"
          >
            <MessageCircle size={16} />
            Fazer Pedido
          </a>
        </nav>

        {/* Mobile menu button */}
        <button
          className="md:hidden text-[#F5F0E6] p-1"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu"
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile nav */}
      {open && (
        <div className="md:hidden bg-[#1A2E17] border-t border-white/10 px-5 py-4 flex flex-col gap-2">
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className={`px-4 py-3 rounded-xl text-sm font-semibold text-center transition-all ${
                pathname === l.to
                  ? 'bg-[#C4A044] text-[#1A2E17]'
                  : 'text-[#F5F0E6]/70'
              }`}
            >
              {l.label}
            </Link>
          ))}
          <a
            href="https://wa.me/5511988381411"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 flex items-center justify-center gap-2 bg-[#25D366] text-white text-sm font-semibold px-4 py-3 rounded-xl"
          >
            <MessageCircle size={16} />
            Fazer Pedido pelo WhatsApp
          </a>
        </div>
      )}
    </header>
  );
}
