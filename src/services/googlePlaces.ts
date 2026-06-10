import type { PlaceDetails, GoogleReview } from '../types';

const API_KEY = import.meta.env.VITE_GOOGLE_PLACES_API_KEY as string | undefined;
const PLACE_ID = import.meta.env.VITE_GOOGLE_PLACE_ID as string | undefined;

export async function fetchPlaceDetails(): Promise<PlaceDetails> {
  if (!API_KEY || !PLACE_ID) {
    return getMockReviews();
  }

  const url =
    `https://maps.googleapis.com/maps/api/place/details/json` +
    `?place_id=${PLACE_ID}` +
    `&fields=name,rating,user_ratings_total,reviews` +
    `&language=pt-BR` +
    `&key=${API_KEY}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error('Google Places API error');

  const data = await res.json();
  if (data.status !== 'OK') throw new Error(data.error_message ?? data.status);

  return data.result as PlaceDetails;
}

function getMockReviews(): PlaceDetails {
  const reviews: GoogleReview[] = [
    {
      author_name: 'Marina Costa',
      rating: 5,
      text: 'Melhor lanche da região! O Cheddar D\'AGOMA é simplesmente incrível, cheddar derretendo em tudo. Já pedi umas 4 vezes essa semana 😂',
      relative_time_description: 'há 2 dias',
      profile_photo_url: '',
      time: Date.now() / 1000 - 172800,
    },
    {
      author_name: 'Lucas Ferreira',
      rating: 5,
      text: 'As fritas Porkus são outro nível. Costelinha por cima de fritas crocantes com requeijão cremoso... Deus do céu. Atendimento nota 10 também.',
      relative_time_description: 'há 5 dias',
      profile_photo_url: '',
      time: Date.now() / 1000 - 432000,
    },
    {
      author_name: 'Ana Paula S.',
      rating: 5,
      text: 'Fiz meu pedido e chegou rapidíssimo e quentinho. O Gallus Fritus é crocante por fora e super suculento por dentro. Voltarei sempre!',
      relative_time_description: 'há 1 semana',
      profile_photo_url: '',
      time: Date.now() / 1000 - 604800,
    },
    {
      author_name: 'Rafael Oliveira',
      rating: 5,
      text: 'Finalmente um hambúrguer de verdade no bairro. O Smash Meleca parece simples mas é perfeito. Queijo derretido, picles, pão brioche. Top!',
      relative_time_description: 'há 2 semanas',
      profile_photo_url: '',
      time: Date.now() / 1000 - 1209600,
    },
    {
      author_name: 'Camila Rodrigues',
      rating: 4,
      text: 'Muito bom! Pedi o Croaburguer e me surpreendi muito. Dois smash + croissant é uma combinação que não esperava gostar tanto. Recomendo muito.',
      relative_time_description: 'há 3 semanas',
      profile_photo_url: '',
      time: Date.now() / 1000 - 1814400,
    },
  ];

  return {
    name: 'AGOMA.',
    rating: 4.9,
    user_ratings_total: 147,
    reviews,
  };
}
