/**
 * Orquestra API + cache local, sempre informando a ORIGEM do dado.
 *
 * Regra de ouro: um dado salvo nunca é apresentado como atual.
 *  - Sucesso na rede  -> origem 'api' | 'simulado' | 'mock', salva no SQLite.
 *  - Falha de rede    -> devolve o cache com origem 'cache' e o horário salvo.
 *  - 404 do backend   -> "ainda não há dado": NÃO usa cache (o servidor
 *                        respondeu, e a resposta é que não existe dado).
 */
import type { BancoLocal } from '@/db/database';
import { lerCache, salvarCache, type ChaveCache } from '@/db/repositorios';
import type {
  LeituraDto,
  OrigemDado,
  PrevisaoDto,
  ResultadoComOrigem,
  TotemDto,
} from '@/domain/types';
import type { ModoDados } from '@/config/env';
import { ErroApi } from './http';
import type { ClienteApi, Resposta } from './serenoApi';

export interface FalhaComCache<T> {
  resultado: ResultadoComOrigem<T> | null;
  erro: ErroApi | null;
}

const ERROS_DE_REDE = new Set(['sem_conexao', 'tempo_esgotado', 'erro_servidor']);

export function origemDaResposta(modo: ModoDados, simulado: boolean): OrigemDado {
  if (modo === 'mock') return 'mock';
  return simulado ? 'simulado' : 'api';
}

function comoErroApi(e: unknown): ErroApi {
  return e instanceof ErroApi ? e : new ErroApi('desconhecido', null);
}

/**
 * Busca na API e, se a rede falhar, recorre ao cache.
 * `cacheValido` permite descartar caches que já não fazem sentido
 * (ex.: previsão salva para um dia que já passou).
 */
export async function buscarComCache<T>(
  db: BancoLocal,
  chave: ChaveCache,
  modo: ModoDados,
  buscar: () => Promise<Resposta<T>>,
  cacheValido: (dado: T) => boolean = () => true,
): Promise<FalhaComCache<T>> {
  try {
    const r = await buscar();
    const origem = origemDaResposta(modo, r.simulado);
    await salvarCache(db, chave, r.dado, origem);
    return { resultado: { dado: r.dado, origem, obtidoEm: new Date().toISOString() }, erro: null };
  } catch (e) {
    const erro = comoErroApi(e);
    if (ERROS_DE_REDE.has(erro.tipo) || erro.tipo === 'resposta_invalida') {
      const c = await lerCache<T>(db, chave);
      if (c && cacheValido(c.dado)) {
        return { resultado: { dado: c.dado, origem: 'cache', obtidoEm: c.salvoEm }, erro };
      }
    }
    return { resultado: null, erro };
  }
}

/** Data de amanhã no calendário local do aparelho, formato yyyy-MM-dd. */
export function amanhaLocalYmd(agora: Date = new Date()): string {
  const d = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() + 1);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/** Escolhe o totem exibido no Início: o configurado ou o primeiro ativo. */
export async function resolverTotem(
  db: BancoLocal,
  cliente: ClienteApi,
  modo: ModoDados,
  codigoConfigurado: string | null,
): Promise<FalhaComCache<TotemDto>> {
  const r = await buscarComCache<TotemDto[]>(db, 'totem_atual', modo, cliente.listarTotens);
  const lista = r.resultado?.dado ?? [];
  const escolhido = codigoConfigurado
    ? lista.find((t) => t.codigo === codigoConfigurado) ??
      // Totem configurado mas ainda não listado: usa o código mesmo assim.
      { id: '', codigo: codigoConfigurado, ativo: true, pontoRefrescoId: null }
    : lista.find((t) => t.ativo);
  if (!escolhido) {
    return { resultado: null, erro: r.erro ?? new ErroApi('nao_encontrado', 404, 'Nenhum totem ativo.') };
  }
  return {
    resultado: r.resultado ? { ...r.resultado, dado: escolhido } : null,
    erro: r.erro,
  };
}

export interface PainelInicio {
  totem: FalhaComCache<TotemDto>;
  leitura: FalhaComCache<LeituraDto>;
  previsao: FalhaComCache<PrevisaoDto>;
}

export async function carregarPainelInicio(
  db: BancoLocal,
  cliente: ClienteApi,
  modo: ModoDados,
  codigoConfigurado: string | null,
  agora: Date = new Date(),
): Promise<PainelInicio> {
  const totem = await resolverTotem(db, cliente, modo, codigoConfigurado);
  const codigo = totem.resultado?.dado.codigo ?? codigoConfigurado;

  const leituraP: Promise<FalhaComCache<LeituraDto>> = codigo
    ? buscarComCache(db, 'ultima_leitura', modo, () => cliente.ultimaLeitura(codigo), (l) => l.totemCodigo === codigo)
    : Promise.resolve({ resultado: null, erro: totem.erro });

  const amanha = amanhaLocalYmd(agora);
  const previsaoP = buscarComCache<PrevisaoDto>(
    db,
    'previsao_amanha',
    modo,
    cliente.previsaoAmanha,
    (p) => p.dataReferencia === amanha,
  );

  const [leitura, previsao] = await Promise.all([leituraP, previsaoP]);
  return { totem, leitura, previsao };
}
