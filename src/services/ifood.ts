/**
 * iFood Merchant API integration
 *
 * Para ativar:
 * 1. Acesse https://portal.ifood.com.br → API → Criar aplicação
 * 2. Obtenha clientId e clientSecret
 * 3. Adicione ao .env:
 *    VITE_IFOOD_CLIENT_ID=seu_client_id
 *    VITE_IFOOD_CLIENT_SECRET=seu_client_secret
 *    VITE_IFOOD_MERCHANT_ID=seu_merchant_id
 *
 * ATENÇÃO: Em produção, as chamadas OAuth2 devem ser feitas via backend
 * para não expor o client_secret no browser.
 */

const CLIENT_ID     = import.meta.env.VITE_IFOOD_CLIENT_ID as string | undefined;
const CLIENT_SECRET = import.meta.env.VITE_IFOOD_CLIENT_SECRET as string | undefined;
const MERCHANT_ID   = import.meta.env.VITE_IFOOD_MERCHANT_ID as string | undefined;
const BASE_URL      = 'https://merchant-api.ifood.com.br';

interface IFoodTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const res = await fetch(`${BASE_URL}/authentication/v1.0/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grantType: 'client_credentials',
      clientId: CLIENT_ID!,
      clientSecret: CLIENT_SECRET!,
    }),
  });

  if (!res.ok) throw new Error('iFood auth failed');

  const data: IFoodTokenResponse = await res.json();
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000 - 60_000,
  };

  return cachedToken.token;
}

export async function getMerchantStatus(): Promise<{ isOpen: boolean; estimatedTime: number }> {
  if (!CLIENT_ID || !MERCHANT_ID) {
    return { isOpen: true, estimatedTime: 40 };
  }

  const token = await getAccessToken();
  const res = await fetch(`${BASE_URL}/merchant/v1.0/merchants/${MERCHANT_ID}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error('iFood merchant fetch failed');

  const data = await res.json();
  return {
    isOpen: data.status === 'OPEN',
    estimatedTime: data.estimatedDeliveryTime ?? 40,
  };
}

export async function getMerchantOrders() {
  if (!CLIENT_ID || !MERCHANT_ID) return [];

  const token = await getAccessToken();
  const res = await fetch(`${BASE_URL}/order/v1.0/orders?merchantId=${MERCHANT_ID}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error('iFood orders fetch failed');
  return res.json();
}
