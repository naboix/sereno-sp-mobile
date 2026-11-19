/**
 * Cliente de DEMONSTRAÇÃO (EXPO_PUBLIC_DATA_MODE=mock).
 *
 * Implementa a mesma interface do cliente real com dados sintéticos
 * (dados-sinteticos.json). Todas as telas exibem a faixa
 * "Demonstração com dados simulados" quando este cliente está ativo.
 */
import type {
  AlertaDto,
  LeituraDto,
  PontoRefrescoDto,
  PrevisaoDto,
  TotemDto,
} from '@/domain/types';
import { arredondarParaPrivacidade, distanciaKm, type Coordenada } from '@/domain/geo';
import { amanhaLocalYmd } from '../dados';
import { ErroApi } from '../http';
import type { ClienteApi, Resposta } from '../serenoApi';
import dados from './dados-sinteticos.json';
import {
  calcularIndiceCalor,
  classificarProbabilidade,
  classificarRisco,
  mensagemPrevisao,
} from './regrasBackend';

type Cenario = keyof typeof dados.cenarios;

const ok = <T,>(dado: T): Promise<Resposta<T>> => Promise.resolve({ dado, simulado: true });


export function gerarLeituraSimulada(
  totemCodigo: string,
  cenario: Cenario,
  agora: Date = new Date(),
  minutosAtras = 4,
): LeituraDto {
  const c = dados.cenarios[cenario];
  const indice = calcularIndiceCalor(c.temperatura, c.umidade);
  return {
    id: '00000000-0000-4000-8000-00000000c0de',
    totemCodigo,
    temperatura: c.temperatura,
    umidade: c.umidade,
    indiceCalor: indice,
    nivel: classificarRisco(indice),
    coletadaEm: new Date(agora.getTime() - minutosAtras * 60000).toISOString(),
  };
}

export function criarClienteMock(cenario: Cenario = 'perigo'): ClienteApi {
  const pontos: PontoRefrescoDto[] = dados.pontos.map((p) => ({ ...p, distanciaKm: null }));

  return {
    health: () => ok({ status: 'Healthy', api: 'Simulada', banco: 'Simulado' }),
    listarTotens: () => ok<TotemDto[]>(dados.totens),
    ultimaLeitura: (codigo: string) => {
      if (!dados.totens.some((t) => t.codigo === codigo)) {
        return Promise.reject(new ErroApi('nao_encontrado', 404, 'Nenhuma leitura encontrada.'));
      }
      return ok(gerarLeituraSimulada(codigo, cenario));
    },
    previsaoAmanha: () => {
      const n = classificarProbabilidade(dados.previsao.probabilidade);
      const prev: PrevisaoDto = {
        id: '00000000-0000-4000-8000-0000000000aa',
        // Data civil de amanhã no calendário do aparelho (não em UTC): depois das 21h em
        // São Paulo, a data UTC já é o dia seguinte e geraria "depois de amanhã".
        dataReferencia: amanhaLocalYmd(new Date()),
        probabilidade: dados.previsao.probabilidade,
        probabilidadePercentual: Math.round(dados.previsao.probabilidade * 10000) / 100,
        nivel: n,
        mensagem: mensagemPrevisao(n),
        versaoModelo: dados.previsao.versaoModelo,
        criadoEm: new Date().toISOString(),
      };
      return ok(prev);
    },
    listarAlertas: (filtro = {}) => {
      const leitura = gerarLeituraSimulada('STN-01', cenario);
      const alertas: AlertaDto[] =
        leitura.nivel === 'Perigo' && (filtro.ativos ?? true)
          ? [
              {
                id: '00000000-0000-4000-8000-0000000000a1',
                leituraSensorId: leitura.id,
                totemCodigo: 'STN-01',
                origem: 'Totem',
                nivel: 'Perigo',
                mensagem: dados.mensagemAlertaPerigo,
                ativo: true,
                criadoEm: leitura.coletadaEm,
              },
            ]
          : [];
      return ok(
        filtro.totemCodigo ? alertas.filter((a) => a.totemCodigo === filtro.totemCodigo) : alertas,
      );
    },
    listarPontos: (filtro = {}) =>
      ok(
        pontos.filter(
          (p) =>
            (filtro.temAgua === undefined || p.temAgua === filtro.temAgua) &&
            (filtro.temSombra === undefined || p.temSombra === filtro.temSombra),
        ),
      ),
    pontosProximos: (origem: Coordenada, limite = 5) => {
      const o = arredondarParaPrivacidade(origem);
      return ok(
        pontos
          .filter((p) => p.temAgua || p.temSombra)
          .map((p) => ({ ...p, distanciaKm: distanciaKm(o, p) }))
          .sort((a, b) => (a.distanciaKm ?? 0) - (b.distanciaKm ?? 0) || a.nome.localeCompare(b.nome))
          .slice(0, limite),
      );
    },
    buscarPonto: (id: string) => {
      const p = pontos.find((x) => x.id === id);
      return p
        ? ok(p)
        : Promise.reject(new ErroApi('nao_encontrado', 404, 'Ponto de refresco não encontrado.'));
    },
  };
}
