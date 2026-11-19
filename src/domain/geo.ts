/**
 * Utilidades de geolocalização com privacidade por padrão.
 *
 * A localização exata do cidadão é dado pessoal (LGPD, art. 5º, I).
 * Antes de sair do aparelho, as coordenadas são arredondadas para
 * 3 casas decimais (cerca de 110 m de precisão), o suficiente para
 * ordenar pontos de refresco por distância, mas insuficiente para
 * identificar a casa de alguém. A coordenada nunca é gravada no SQLite.
 */

export interface Coordenada {
  latitude: number;
  longitude: number;
}

export const CASAS_DECIMAIS_PRIVACIDADE = 3;

export function arredondarParaPrivacidade(
  c: Coordenada,
  casas: number = CASAS_DECIMAIS_PRIVACIDADE,
): Coordenada {
  const f = 10 ** casas;
  return {
    latitude: Math.round(c.latitude * f) / f,
    longitude: Math.round(c.longitude * f) / f,
  };
}

export function coordenadaValida(c: Coordenada): boolean {
  return (
    Number.isFinite(c.latitude) &&
    Number.isFinite(c.longitude) &&
    c.latitude >= -90 &&
    c.latitude <= 90 &&
    c.longitude >= -180 &&
    c.longitude <= 180
  );
}

/**
 * Bairros de referência para quem não autoriza a localização.
 * A coordenada é um ponto de referência aproximado da região, usado
 * apenas para ordenar os pontos por distância — não é um endereço.
 */
export interface BairroReferencia {
  id: string;
  nome: string;
  referencia: Coordenada;
}

export const BAIRROS_REFERENCIA: BairroReferencia[] = [
  { id: 'santana', nome: 'Santana', referencia: { latitude: -23.502, longitude: -46.625 } },
];

export function bairroPorId(id: string | null | undefined): BairroReferencia {
  return BAIRROS_REFERENCIA.find((b) => b.id === id) ?? BAIRROS_REFERENCIA[0]!;
}

/**
 * Distância Haversine em km. Mesma fórmula de
 * PontoRefrescoService.CalcularDistanciaKm (backend), arredondada a 3 casas.
 * Usada apenas no modo mock/cache, quando a API não calcula a distância.
 */
export function distanciaKm(a: Coordenada, b: Coordenada): number {
  const R = 6371.0;
  const rad = (g: number) => (g * Math.PI) / 180;
  const dLat = rad(b.latitude - a.latitude);
  const dLon = rad(b.longitude - a.longitude);
  let h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  h = Math.min(1, Math.max(0, h));
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return Math.round(R * c * 1000) / 1000;
}

export function formatarDistancia(km: number | null | undefined): string {
  if (km === null || km === undefined || !Number.isFinite(km)) return 'Distância não calculada';
  if (km < 1) return `${Math.round(km * 1000)} metros`;
  return `${km.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} km`;
}
