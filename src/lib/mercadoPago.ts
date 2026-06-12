// Tipagem do MercadoPago SDK carregado via CDN (window.MercadoPago)
declare global {
  interface Window {
    MercadoPago: new (publicKey: string, options?: { locale: string }) => MercadoPagoInstance;
  }
}

interface MercadoPagoInstance {
  cardForm: (options: {
    amount: string;
    autoMount: boolean;
    form: {
      id: string;
      cardNumber: { id: string; placeholder: string };
      cardholderName: { id: string; placeholder: string };
      cardExpirationMonth: { id: string; placeholder: string };
      cardExpirationYear: { id: string; placeholder: string };
      securityCode: { id: string; placeholder: string };
      installments: { id: string; placeholder: string };
      identificationType: { id: string; placeholder: string };
      identificationNumber: { id: string; placeholder: string };
      issuer: { id: string; placeholder: string };
    };
    callbacks: {
      onFormMounted: (error?: Error) => void;
      onSubmit: (event: Event, data: { getCardFormData: () => CardFormData }) => void;
      onFetching?: (resource: string) => (() => void) | void;
    };
  }) => CardFormInstance;
}

interface CardFormInstance {
  getCardFormData: () => CardFormData;
  unmount: () => void;
}

export interface CardFormData {
  token: string;
  installments: string;
  paymentMethodId: string;
  issuerId: string;
  identificationType: string;
  identificationNumber: string;
  cardholderName: string;
  cardholderEmail?: string;
}

// Carrega o SDK do MercadoPago via CDN se ainda nao estiver carregado
export function loadMercadoPagoSDK(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window.MercadoPago !== 'undefined') {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://sdk.mercadopago.com/js/v2';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Falha ao carregar SDK do MercadoPago'));
    document.head.appendChild(script);
  });
}

// Retorna instancia do MercadoPago com a public key
export function getMercadoPago(): MercadoPagoInstance {
  const publicKey = import.meta.env.VITE_MP_PUBLIC_KEY;
  if (!publicKey) throw new Error('VITE_MP_PUBLIC_KEY nao configurada');
  if (typeof window.MercadoPago === 'undefined') throw new Error('SDK do MercadoPago nao carregado');
  return new window.MercadoPago(publicKey, { locale: 'pt-BR' });
}

// Formata data de expiracao MM/AA
export function parseExpiry(value: string): { month: string; year: string } {
  const clean = value.replace(/\D/g, '');
  const month = clean.slice(0, 2);
  const year = clean.slice(2, 4);
  return { month, year };
}
