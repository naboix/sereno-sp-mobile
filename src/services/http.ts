/**
 * Cliente HTTP mínimo sobre fetch, com timeout, tratamento de status e
 * mensagens de erro em português simples. Não registra URLs, corpos ou
 * coordenadas em console (evita vazar dados do cidadão em logs).
 */

export type TipoErroApi =
  | 'sem_conexao' // rede indisponível ou servidor fora do ar
  | 'tempo_esgotado' // passou do timeout configurado
  | 'nao_encontrado' // 404 — o backend usa 404 para "ainda não há dado"
  | 'requisicao_invalida' // 400
  | 'erro_servidor' // 5xx
  | 'resposta_invalida' // JSON malformado ou fora do contrato
  | 'desconhecido';

export class ErroApi extends Error {
  readonly tipo: TipoErroApi;
  readonly status: number | null;
  /** Mensagem do backend ({ erro: "..." }), quando existir. */
  readonly mensagemServidor: string | null;

  constructor(tipo: TipoErroApi, status: number | null, mensagemServidor: string | null = null) {
    super(mensagemParaCidadao(tipo));
    this.name = 'ErroApi';
    this.tipo = tipo;
    this.status = status;
    this.mensagemServidor = mensagemServidor;
  }
}

export function mensagemParaCidadao(tipo: TipoErroApi): string {
  switch (tipo) {
    case 'sem_conexao':
      return 'Sem conexão com o Sereno SP agora.';
    case 'tempo_esgotado':
      return 'O servidor demorou para responder.';
    case 'nao_encontrado':
      return 'Ainda não há informação disponível.';
    case 'requisicao_invalida':
      return 'Não foi possível fazer essa consulta.';
    case 'erro_servidor':
      return 'O servidor do Sereno SP está com problema.';
    case 'resposta_invalida':
      return 'Recebemos uma resposta inesperada do servidor.';
    default:
      return 'Algo deu errado. Tente de novo.';
  }
}

export function tipoPorStatus(status: number): TipoErroApi {
  if (status === 404) return 'nao_encontrado';
  if (status === 400 || status === 409 || status === 422) return 'requisicao_invalida';
  if (status >= 500) return 'erro_servidor';
  return 'desconhecido';
}

export interface RespostaJson<T> {
  corpo: T;
  /** true quando o servidor se identifica como ambiente de demonstração. */
  simulado: boolean;
}

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export interface OpcoesGet {
  timeoutMs: number;
  fetchImpl?: FetchLike;
}

/** Cabeçalho enviado APENAS pelo servidor de contrato simulado (mock-server/). */
export const CABECALHO_AMBIENTE = 'x-sereno-ambiente';

export async function getJson<T>(url: string, opcoes: OpcoesGet): Promise<RespostaJson<T>> {
  const fetchImpl: FetchLike = opcoes.fetchImpl ?? ((i, init) => fetch(i, init));
  const controller = new AbortController();
  let estourou = false;
  const timer = setTimeout(() => {
    estourou = true;
    controller.abort();
  }, opcoes.timeoutMs);

  let resposta: Response;
  try {
    resposta = await fetchImpl(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
  } catch {
    clearTimeout(timer);
    throw new ErroApi(estourou ? 'tempo_esgotado' : 'sem_conexao', null);
  }
  clearTimeout(timer);

  const simulado = resposta.headers.get(CABECALHO_AMBIENTE)?.toLowerCase() === 'simulado';

  if (!resposta.ok) {
    let mensagemServidor: string | null = null;
    try {
      const corpo = (await resposta.json()) as { erro?: unknown };
      if (typeof corpo?.erro === 'string') mensagemServidor = corpo.erro;
    } catch {
      // corpo de erro sem JSON: ignorado de propósito
    }
    throw new ErroApi(tipoPorStatus(resposta.status), resposta.status, mensagemServidor);
  }

  try {
    const corpo = (await resposta.json()) as T;
    return { corpo, simulado };
  } catch {
    throw new ErroApi('resposta_invalida', resposta.status);
  }
}

export function montarUrl(
  base: string,
  caminho: string,
  query?: Record<string, string | number | boolean | undefined | null>,
): string {
  const params = Object.entries(query ?? {})
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
  return `${base}${caminho}${params ? `?${params}` : ''}`;
}
