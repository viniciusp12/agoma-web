import type { ViaCEPResponse } from '../types';

export async function fetchAddressByCEP(cep: string): Promise<ViaCEPResponse> {
  const clean = cep.replace(/\D/g, '');
  if (clean.length !== 8) throw new Error('CEP inválido');

  const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
  if (!res.ok) throw new Error('Erro ao consultar CEP');

  const data: ViaCEPResponse = await res.json();
  if (data.erro) throw new Error('CEP não encontrado');

  return data;
}

export function formatCEP(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length > 5) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  return digits;
}
