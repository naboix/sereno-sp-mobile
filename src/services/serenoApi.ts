/**
 * Camada central de acesso à Sereno.Api.
 *
 * Cada função corresponde a um endpoint REAL confirmado nos controllers
 * do backend (ver docs/INTEGRACAO_API.md). As telas nunca chamam fetch
 * diretamente: tudo passa por aqui.
 */
import type {
  AlertaDto,
  HealthDto,
  LeituraDto,
  PontoRefrescoDto,
  PrevisaoDto,
  TotemDto,
} from '@/domain/types';
import { arredondarParaPrivacidade, type Coordenada } from '@/domain/geo';
import {
  validarLeitura,
  validarListaAlertas,
  validarListaPontos,
  validarListaTotens,
  validarPonto,
  validarPrevisao,
} from './contratos';
import { getJson, montarUrl, type FetchLike, type RespostaJson } from './http';

export interface ClienteApiOpcoes {
  baseUrl: string;
  timeoutMs: number;
  fetchImpl?: FetchLike;
}

export interface Resposta<T> {
  dado: T;
  simulado: boolean;
}

export function criarClienteApi(op: ClienteApiOpcoes) {
  async function get<T>(
    caminho: string,
    validar: (v: unknown) => T,
    query?: Record<string, string | number | boolean | undefined | null>,
  ): Promise<Resposta<T>> {
    const r: RespostaJson<unknown> = await getJson<unknown>(montarUrl(op.baseUrl, caminho, query), {
      timeoutMs: op.timeoutMs,
      fetchImpl: op.fetchImpl,
    });
    return { dado: validar(r.corpo), simulado: r.simulado };
  }

  return {
    /** GET /health — HealthController.Verificar */
    health: () =>
      get<HealthDto>('/health', (v) => {
        const o = v as Record<string, unknown>;
        return {
          status: String(o?.status ?? ''),
          api: String(o?.api ?? ''),
          banco: String(o?.banco ?? ''),
        };
      }),

    /** GET /api/totens — TotensController.Listar */
    listarTotens: () => get<TotemDto[]>('/api/totens', validarListaTotens),

    /** GET /api/leituras/ultima?totemCodigo= — LeiturasController.BuscarUltima (404 se não houver) */
    ultimaLeitura: (totemCodigo: string) =>
      get<LeituraDto>('/api/leituras/ultima', validarLeitura, { totemCodigo }),

    /** GET /api/previsoes/amanha — PrevisoesController.BuscarAmanha (404 se não houver) */
    previsaoAmanha: () => get<PrevisaoDto>('/api/previsoes/amanha', validarPrevisao),

    /** GET /api/alertas?ativos=&totemCodigo= — AlertasController.Listar */
    listarAlertas: (filtro: { ativos?: boolean; totemCodigo?: string | null } = {}) =>
      get<AlertaDto[]>('/api/alertas', validarListaAlertas, {
        ativos: filtro.ativos ?? true,
        totemCodigo: filtro.totemCodigo ?? undefined,
      }),

    /** GET /api/pontos?temAgua=&temSombra= — PontosController.Listar */
    listarPontos: (filtro: { temAgua?: boolean; temSombra?: boolean } = {}) =>
      get<PontoRefrescoDto[]>('/api/pontos', validarListaPontos, {
        temAgua: filtro.temAgua,
        temSombra: filtro.temSombra,
      }),

    /**
     * GET /api/pontos/proximos?lat=&lon=&limite= — PontosController.BuscarProximos.
     * A coordenada é arredondada ANTES de entrar na URL (privacidade:
     * query strings costumam ir parar em logs de proxy e servidor).
     */
    pontosProximos: (origem: Coordenada, limite = 5) => {
      const c = arredondarParaPrivacidade(origem);
      const lim = Math.min(20, Math.max(1, Math.round(limite)));
      return get<PontoRefrescoDto[]>('/api/pontos/proximos', validarListaPontos, {
        lat: c.latitude,
        lon: c.longitude,
        limite: lim,
      });
    },

    /** GET /api/pontos/{id} — PontosController.BuscarPorId (404 se não existir) */
    buscarPonto: (id: string) => get<PontoRefrescoDto>(`/api/pontos/${encodeURIComponent(id)}`, validarPonto),
  };
}

export type ClienteApi = ReturnType<typeof criarClienteApi>;
