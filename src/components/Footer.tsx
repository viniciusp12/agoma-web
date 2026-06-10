import { MapPin, Phone, AtSign } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#1A2E17] text-[#F5F0E6]/70 pt-12 pb-8 mt-8">
      <div className="max-w-6xl mx-auto px-5 flex flex-col md:flex-row items-start gap-10">

        {/* Logo + tagline */}
        <div className="shrink-0">
          <img
            src="/assets/logo/logo-light.png"
            alt="AGOMA."
            className="h-20 w-auto brightness-0 invert opacity-80"
          />
          <p className="mt-3 text-xs text-[#F5F0E6]/40 uppercase tracking-widest">
            Street Food na Ladeira · Desde 2025
          </p>
        </div>

        {/* Info */}
        <div className="flex flex-col gap-3 text-sm">
          <div className="flex items-start gap-2">
            <MapPin size={16} className="text-[#C4A044] mt-0.5 shrink-0" />
            <span>Rua Botupuca, 140 · São Paulo, SP</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone size={16} className="text-[#C4A044] shrink-0" />
            <a href="tel:+5511988381411" className="hover:text-[#F5F0E6] transition-colors">
              (11) 98838-1411
            </a>
          </div>
          <div className="flex items-center gap-2">
            <AtSign size={16} className="text-[#C4A044] shrink-0" />
            <a
              href="https://instagram.com/agoma.sp"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#F5F0E6] transition-colors"
            >
              @agoma.sp
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-5 mt-8 pt-6 border-t border-white/10 text-xs text-center text-[#F5F0E6]/30">
        © {new Date().getFullYear()} AGOMA. Todos os direitos reservados.
      </div>
    </footer>
  );
}
