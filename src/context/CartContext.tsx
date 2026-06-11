import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  type ReactNode,
} from 'react';
import type { CartItem, Address, MenuItem, OrderStep } from '../types';

// ── State ────────────────────────────────────────────────────────────────────

interface CartState {
  items: CartItem[];
  address: Address | null;
  step: OrderStep;
  pendingItem: MenuItem | null;
  editingCartItem: CartItem | null;   // item sendo editado (lápis)
  customerName: string;               // nome do cliente
  isCartOpen: boolean;
}

const STORAGE_ADDRESS_KEY = 'agoma_address';
const STORAGE_CART_KEY    = 'agoma_cart';
const STORAGE_NAME_KEY    = 'agoma_customer_name';

function loadAddress(): Address | null {
  try { return JSON.parse(localStorage.getItem(STORAGE_ADDRESS_KEY) ?? 'null'); }
  catch { return null; }
}
function loadCart(): CartItem[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_CART_KEY) ?? '[]'); }
  catch { return []; }
}

const initialState: CartState = {
  items:           loadCart(),
  address:         loadAddress(),
  step:            'idle',
  pendingItem:     null,
  editingCartItem: null,
  customerName:    localStorage.getItem(STORAGE_NAME_KEY) ?? '',
  isCartOpen:      false,
};

// ── Actions ──────────────────────────────────────────────────────────────────

type Action =
  | { type: 'START_ORDER';       item: MenuItem }
  | { type: 'START_EDIT';        cartItem: CartItem }
  | { type: 'SET_STEP';          step: OrderStep }
  | { type: 'SAVE_ADDRESS';      address: Address }
  | { type: 'CHANGE_ADDRESS' }
  | { type: 'SET_CUSTOMER_NAME'; name: string }
  | { type: 'ADD_TO_CART';       cartItem: CartItem; replaceId?: string }
  | { type: 'REMOVE_FROM_CART';  cartId: string }
  | { type: 'UPDATE_QTY';        cartId: string; qty: number }
  | { type: 'CLEAR_CART' }
  | { type: 'OPEN_CART' }
  | { type: 'CLOSE_CART' }
  | { type: 'CLOSE_MODALS' };

function reducer(state: CartState, action: Action): CartState {
  switch (action.type) {
    case 'START_ORDER':
      return {
        ...state,
        pendingItem:     action.item,
        editingCartItem: null,
        step: state.address ? 'customize' : 'cep',
      };

    case 'START_EDIT':
      return {
        ...state,
        pendingItem:     action.cartItem.item,
        editingCartItem: action.cartItem,
        step:            'customize',
        isCartOpen:      false,   // fecha o drawer para abrir o modal
      };

    case 'SET_STEP':
      return { ...state, step: action.step };

    case 'SET_CUSTOMER_NAME':
      localStorage.setItem(STORAGE_NAME_KEY, action.name);
      return { ...state, customerName: action.name };

    case 'SAVE_ADDRESS': {
      localStorage.setItem(STORAGE_ADDRESS_KEY, JSON.stringify(action.address));
      if (state.pendingItem) {
        return { ...state, address: action.address, step: 'customize' };
      }
      return { ...state, address: action.address, step: 'idle', isCartOpen: true };
    }

    case 'CHANGE_ADDRESS':
      return { ...state, step: 'cep', pendingItem: null, isCartOpen: false };

    case 'ADD_TO_CART': {
      let items: CartItem[];
      if (action.replaceId) {
        // Edição: substitui o item original mantendo a posição
        items = state.items.map(i =>
          i.cartId === action.replaceId ? action.cartItem : i
        );
      } else {
        items = [...state.items, action.cartItem];
      }
      localStorage.setItem(STORAGE_CART_KEY, JSON.stringify(items));
      return { ...state, items, step: 'idle', pendingItem: null, editingCartItem: null, isCartOpen: true };
    }

    case 'REMOVE_FROM_CART': {
      const items = state.items.filter((i) => i.cartId !== action.cartId);
      localStorage.setItem(STORAGE_CART_KEY, JSON.stringify(items));
      return { ...state, items };
    }

    case 'UPDATE_QTY': {
      const items = state.items
        .map((i) => i.cartId === action.cartId ? { ...i, quantity: action.qty } : i)
        .filter((i) => i.quantity > 0);
      localStorage.setItem(STORAGE_CART_KEY, JSON.stringify(items));
      return { ...state, items };
    }

    case 'CLEAR_CART': {
      localStorage.removeItem(STORAGE_CART_KEY);
      return { ...state, items: [] };
    }

    case 'OPEN_CART':  return { ...state, isCartOpen: true  };
    case 'CLOSE_CART': return { ...state, isCartOpen: false };

    case 'CLOSE_MODALS':
      return { ...state, step: 'idle', pendingItem: null, editingCartItem: null };

    default: return state;
  }
}

// ── Context ──────────────────────────────────────────────────────────────────

interface CartContextValue {
  state: CartState;
  startOrder:      (item: MenuItem) => void;
  startEdit:       (cartItem: CartItem) => void;
  setStep:         (step: OrderStep) => void;
  saveAddress:     (address: Address) => void;
  changeAddress:   () => void;
  setCustomerName: (name: string) => void;
  addToCart:       (cartItem: CartItem, replaceId?: string) => void;
  removeFromCart:  (cartId: string) => void;
  updateQty:       (cartId: string, qty: number) => void;
  clearCart:       () => void;
  openCart:        () => void;
  closeCart:       () => void;
  closeModals:     () => void;
  totalItems:      number;
  totalPrice:      number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const startOrder      = useCallback((item: MenuItem) => dispatch({ type: 'START_ORDER', item }), []);
  const startEdit       = useCallback((cartItem: CartItem) => dispatch({ type: 'START_EDIT', cartItem }), []);
  const setStep         = useCallback((step: OrderStep) => dispatch({ type: 'SET_STEP', step }), []);
  const saveAddress     = useCallback((address: Address) => dispatch({ type: 'SAVE_ADDRESS', address }), []);
  const changeAddress   = useCallback(() => dispatch({ type: 'CHANGE_ADDRESS' }), []);
  const setCustomerName = useCallback((name: string) => dispatch({ type: 'SET_CUSTOMER_NAME', name }), []);
  const addToCart       = useCallback((cartItem: CartItem, replaceId?: string) =>
    dispatch({ type: 'ADD_TO_CART', cartItem, replaceId }), []);
  const removeFromCart  = useCallback((cartId: string) => dispatch({ type: 'REMOVE_FROM_CART', cartId }), []);
  const updateQty       = useCallback((cartId: string, qty: number) => dispatch({ type: 'UPDATE_QTY', cartId, qty }), []);
  const clearCart       = useCallback(() => dispatch({ type: 'CLEAR_CART' }), []);
  const openCart        = useCallback(() => dispatch({ type: 'OPEN_CART'  }), []);
  const closeCart       = useCallback(() => dispatch({ type: 'CLOSE_CART' }), []);
  const closeModals     = useCallback(() => dispatch({ type: 'CLOSE_MODALS' }), []);

  const totalItems = state.items.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = state.items.reduce((s, i) => {
    const addPrice = i.additionals.reduce((a, x) => a + x.price, 0);
    const combo = i.isCombo ? 16 : 0;
    return s + (i.item.price + addPrice + combo) * i.quantity;
  }, 0);

  return (
    <CartContext.Provider value={{
      state, startOrder, startEdit, setStep, saveAddress, changeAddress,
      setCustomerName, addToCart, removeFromCart, updateQty,
      clearCart, openCart, closeCart, closeModals, totalItems, totalPrice,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
