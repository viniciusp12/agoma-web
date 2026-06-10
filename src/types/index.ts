export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  badge?: string;
  category: MenuCategory;
  hasMeatPoint?: boolean;    // pede ponto da carne
  canBeCombo?: boolean;      // pode virar combo +R$16
  maxAdditionals?: number;   // limite de adicionais (undefined = sem limite)
}

export type MenuCategory =
  | 'ciabattas'
  | 'burguers'
  | 'wraps'
  | 'fritas'
  | 'croissants'
  | 'sobremesas'
  | 'bebidas'
  | 'adicionais';

export type MeatPoint = 'mal_passado' | 'ao_ponto' | 'bem_passado';

export interface CartItemAdditional {
  id: string;
  name: string;
  price: number;
}

export interface CartItem {
  cartId: string;           // uuid para identificar no carrinho
  item: MenuItem;
  quantity: number;
  meatPoint?: MeatPoint;
  additionals: CartItemAdditional[];
  isCombo: boolean;
  comboDrink?: string;      // bebida escolhida no combo
}

export interface Address {
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  reference: string;
  label: 'Casa' | 'Trabalho' | 'Favorito';
}

export interface ViaCEPResponse {
  cep: string;
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

export type OrderStep = 'idle' | 'cep' | 'address' | 'customize' | 'cart';

export interface CategoryInfo {
  id: MenuCategory;
  label: string;
  emoji: string;
}

export interface GoogleReview {
  author_name: string;
  rating: number;
  text: string;
  relative_time_description: string;
  profile_photo_url: string;
  time: number;
}

export interface PlaceDetails {
  name: string;
  rating: number;
  user_ratings_total: number;
  reviews: GoogleReview[];
}

export interface IFoodMerchant {
  id: string;
  name: string;
  status: 'OPEN' | 'CLOSED';
  minimumOrderValue: number;
  deliveryFee: number;
  estimatedDeliveryTime: number;
}
