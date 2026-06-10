export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  badge?: string;
  category: MenuCategory;
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
