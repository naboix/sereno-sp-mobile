/**
 * Configuração lida de variáveis EXPO_PUBLIC_* (ver .env.example).
 *
 * Importante: o Expo só substitui variáveis acessadas de forma estática
 * (process.env.EXPO_PUBLIC_X). Por isso cada uma é lida explicitamente.
 * Nenhum segredo é configurado aqui: a Sereno.Api não exige chave
 * para os endpoints GET consumidos pelo app.
 */

export type ModoDados = 'api' | 'mock';

export interface ConfiguracaoApp {
  modo: ModoDados;
  apiUrl: string;
  totemCodigo: string | null;
  timeoutMs: number;
}

export function normalizarUrlBase(url: string | undefined): string {
  const limpa = (url ?? '').trim().replace(/\/+$/, '');
  return limpa.length > 0 ? limpa : 'http://localhost:5128';
}

export function lerConfiguracao(env: Record<string, string | undefined>): ConfiguracaoApp {
  const modo: ModoDados = env.EXPO_PUBLIC_DATA_MODE === 'mock' ? 'mock' : 'api';
  const timeout = Number(env.EXPO_PUBLIC_API_TIMEOUT_MS);
  const totem = (env.EXPO_PUBLIC_TOTEM_CODIGO ?? '').trim();
  return {
    modo,
    apiUrl: normalizarUrlBase(env.EXPO_PUBLIC_API_URL),
    totemCodigo: totem.length > 0 ? totem : null,
    timeoutMs: Number.isFinite(timeout) && timeout >= 1000 && timeout <= 60000 ? timeout : 8000,
  };
}

export const CONFIG: ConfiguracaoApp = lerConfiguracao({
  EXPO_PUBLIC_DATA_MODE: process.env.EXPO_PUBLIC_DATA_MODE,
  EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
  EXPO_PUBLIC_TOTEM_CODIGO: process.env.EXPO_PUBLIC_TOTEM_CODIGO,
  EXPO_PUBLIC_API_TIMEOUT_MS: process.env.EXPO_PUBLIC_API_TIMEOUT_MS,
});
