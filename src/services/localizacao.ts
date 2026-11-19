/**
 * Localização do aparelho com consentimento explícito.
 * A posição é usada apenas em memória e arredondada antes de ir à API
 * (ver serenoApi.pontosProximos). Nunca é gravada no banco local.
 */
import * as Location from 'expo-location';
import type { Coordenada } from '@/domain/geo';

export type ResultadoLocalizacao =
  | { tipo: 'ok'; coordenada: Coordenada }
  | { tipo: 'negada' }
  | { tipo: 'indisponivel' };

async function obterPosicao(): Promise<ResultadoLocalizacao> {
  try {
    const pos = await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      new Promise<null>((r) => setTimeout(() => r(null), 10000)),
    ]);
    if (!pos) return { tipo: 'indisponivel' };
    return { tipo: 'ok', coordenada: { latitude: pos.coords.latitude, longitude: pos.coords.longitude } };
  } catch {
    return { tipo: 'indisponivel' };
  }
}

/** Só lê a posição se a permissão JÁ foi concedida (não abre pop-up). */
export async function localizacaoSePermitida(): Promise<ResultadoLocalizacao> {
  try {
    const p = await Location.getForegroundPermissionsAsync();
    if (p.status !== 'granted') return { tipo: 'negada' };
    return obterPosicao();
  } catch {
    return { tipo: 'indisponivel' };
  }
}

/** Pede a permissão (ação do usuário) e, se concedida, lê a posição. */
export async function pedirLocalizacao(): Promise<ResultadoLocalizacao> {
  try {
    const p = await Location.requestForegroundPermissionsAsync();
    if (p.status !== 'granted') return { tipo: 'negada' };
    return obterPosicao();
  } catch {
    return { tipo: 'indisponivel' };
  }
}
