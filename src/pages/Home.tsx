import { Link } from 'react-router-dom';
import { Star, MapPin, Clock, ChevronRight, ExternalLink } from 'lucide-react';
import { useReviews } from '../hooks/useReviews';
import ReviewCard from '../components/ReviewCard';
import MenuItemCard from '../components/MenuItemCard';
import { FEATURED_ITEMS } from '../data/menu';

function StarsDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={20}
          className={i < Math.round(rating) ? 'fill-[#C4A044] text-[#C4A044]' : 'fill-white/20 text-white/20'}
        />
      ))}
    </div>
  );
}

export default function Home() {
  const { data: reviews, loading } = useReviews();

  return (
    <div>
      {/* ── HERO ────────────────────────────────────────────────── */}
      <section
        className="relative min-h-[92vh] flex flex-col items-center justify-center text-center px-5 overflow-hidden"
        style={{
          backgroundImage: `
            linear-gradient(to bottom, rgba(10,20,9,0.72) 0%, rgba(10,20,9,0.55) 60%, rgba(10,20,9,0.85) 100%),
            url('/assets/images/IMG_6704.jpg')
          `,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Logo */}
        <div className="animate-fade-up" style={{ animationDelay: '0.1s', opacity: 0 }}>
          <img
            src="/assets/logo/logo-light.png"
            alt="AGOMA. Street Food"
            className="h-64 md:h-72 w-auto mx-auto mb-6 brightness-0 invert opacity-95 drop-shadow-2xl"
          />
        </div>

        {/* Tagline */}
        <div className="animate-fade-up max-w-xl" style={{ animationDelay: '0.3s', opacity: 0 }}>
          <p className="text-[#F5F0E6]/80 text-base md:text-lg leading-relaxed mb-8">
            Lanchonete artesanal com sanduíches feitos com paixão e ingredientes premium.
            Cada mordida é uma experiência única.
          </p>
        </div>

        {/* CTA buttons */}
        <div className="animate-fade-up flex flex-col sm:flex-row gap-3" style={{ animationDelay: '0.5s', opacity: 0 }}>
          <Link
            to="/cardapio"
            className="flex items-center justify-center gap-2 bg-[#C4A044] hover:bg-[#D4B558] text-[#1A2E17] font-bold px-8 py-3.5 rounded-full text-sm tracking-wide transition-all hover:-translate-y-0.5 shadow-lg"
          >
            Ver Cardápio <ChevronRight size={18} />
          </Link>
          <a
            href="https://wa.me/5511988381411"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-white/15 hover:bg-white/25 backdrop-blur border border-white/30 text-white font-semibold px-8 py-3.5 rounded-full text-sm tracking-wide transition-all hover:-translate-y-0.5"
          >
            Pedir pelo WhatsApp
          </a>
        </div>

      </section>

      {/* ── INFO BAR ─────────────────────────────────────────────── */}
      <div className="bg-[#1A2E17] text-[#F5F0E6]/80 py-4">
        <div className="max-w-4xl mx-auto px-5 flex flex-wrap items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <MapPin size={15} className="text-[#C4A044]" />
            <span>Rua Botupuca, 140 · São Paulo, SP</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={15} className="text-[#C4A044]" />
            <span>Seg–Dom · 11h às 23h</span>
          </div>
          {reviews && (
            <div className="flex items-center gap-1.5">
              <Star size={15} className="fill-[#C4A044] text-[#C4A044]" />
              <span className="font-semibold text-[#C4A044]">{reviews.rating}</span>
              <span className="text-[#F5F0E6]/50">({reviews.user_ratings_total} avaliações)</span>
            </div>
          )}
        </div>
      </div>

      {/* ── PROMO BANNER ─────────────────────────────────────────── */}
      <div className="bg-[#C4A044] text-[#1A2E17] py-3 px-5 text-center text-sm font-medium">
        🔥 <strong>TURBINE SEU LANCHE</strong> — Adicione Refri + Fritas por apenas <strong>+R$ 16</strong>
      </div>

      {/* ── FEATURED ─────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-5 py-16">
        <div className="text-center mb-10">
          <p className="text-[#C4A044] text-xs font-bold uppercase tracking-widest mb-2">Destaques</p>
          <h2
            className="text-3xl md:text-4xl font-bold text-[#1A2E17]"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Os Queridinhos da Casa
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
          {FEATURED_ITEMS.map((item) => (
            <MenuItemCard key={item.id} item={item} compact />
          ))}
        </div>

        <div className="text-center mt-10">
          <Link
            to="/cardapio"
            className="inline-flex items-center gap-2 bg-[#1A2E17] hover:bg-[#2B4A26] text-[#F5F0E6] font-semibold px-8 py-3.5 rounded-full text-sm transition-all hover:-translate-y-0.5"
          >
            Ver cardápio completo <ChevronRight size={16} />
          </Link>
        </div>
      </section>

      {/* ── GOOGLE REVIEWS ───────────────────────────────────────── */}
      <section className="bg-[#1A2E17] py-16 px-5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-[#C4A044] text-xs font-bold uppercase tracking-widest mb-2">
              Avaliações do Google
            </p>
            <h2
              className="text-3xl md:text-4xl font-bold text-[#F5F0E6] mb-3"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              O que dizem sobre nós
            </h2>

            {reviews && !loading && (
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-baseline gap-3">
                  <span className="text-5xl font-bold text-[#C4A044]">{reviews.rating}</span>
                  <StarsDisplay rating={reviews.rating} />
                </div>
                <p className="text-[#F5F0E6]/50 text-sm">
                  Baseado em {reviews.user_ratings_total} avaliações no Google
                </p>
              </div>
            )}

            {loading && (
              <div className="flex justify-center gap-2 mt-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="w-2 h-2 bg-[#C4A044]/50 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            )}
          </div>

          {reviews && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {reviews.reviews.slice(0, 6).map((r, i) => (
                <ReviewCard key={i} review={r} />
              ))}
            </div>
          )}

          <div className="text-center mt-8">
            <a
              href="https://www.google.com/search?q=AGOMA.+-+R.+Botupuca,+140+-+Cambuci,+S%C3%A3o+Paulo+-+SP,+01536-010"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[#C4A044] text-sm font-semibold hover:underline"
            >
              Ver todas as avaliações no Google <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </section>

      {/* ── ABOUT / HOW IT WORKS ─────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-5 py-16 text-center">
        <p className="text-[#C4A044] text-xs font-bold uppercase tracking-widest mb-2">Nossa História</p>
        <h2
          className="text-3xl md:text-4xl font-bold text-[#1A2E17] mb-6"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Street Food de Verdade
        </h2>
        <p className="text-gray-600 text-base leading-relaxed max-w-2xl mx-auto mb-12">
          Nascemos em 2025 com uma missão simples: trazer sabores incríveis para a ladeira.
          Cada receita é desenvolvida com ingredientes selecionados e muito carinho. Do pão brioche
          ao blend de carnes D'Agoma, tudo é feito para você ter a melhor experiência possível.
        </p>

        <div className="grid sm:grid-cols-3 gap-6">
          {[
            { icon: '🍔', title: 'Ingredientes Premium', desc: 'Blend próprio de carnes, pão brioche artesanal e queijos selecionados.' },
            { icon: '🏍️', title: 'Entrega Própria', desc: 'Motoboys próprios para garantir que seu lanche chegue quentinho e no prazo.' },
            { icon: '❤️', title: 'Feito com Carinho', desc: 'Cada lanche preparado na hora com dedicação e amor pela gastronomia.' },
          ].map((item) => (
            <div key={item.title} className="bg-white rounded-2xl border border-[#E2DAC8] p-6 flex flex-col items-center gap-3 shadow-sm">
              <span className="text-4xl">{item.icon}</span>
              <h3 className="font-bold text-[#1A2E17]" style={{ fontFamily: "'Playfair Display', serif" }}>
                {item.title}
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
