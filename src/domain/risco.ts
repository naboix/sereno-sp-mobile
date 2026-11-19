import type { NivelRisco } from './types';

/**
 * Regras de apresentação do risco térmico.
 *
 * A CLASSIFICAÇÃO é feita pelo backend (LeituraService.ClassificarRisco:
 * índice de calor < 32 Normal, 32–40,99 Atenção, >= 41 Perigo; e
 * PrevisaoService.ClassificarProbabilidade: > 0,70 Perigo, >= 0,40 Atenção).
 * O app NÃO reclassifica valores: apenas traduz o nível recebido para
 * texto, ícone e cor, sem depender só da cor (acessibilidade).
 */

export interface ApresentacaoRisco {
  nivel: NivelRisco;
  /** Rótulo curto exibido no selo. */
  rotulo: string;
  /** Frase lida pelo leitor de tela. */
  descricaoAcessivel: string;
  /** Orientação prática ao cidadão, em linguagem simples. */
  orientacao: string;
  /** Nome do ícone (Ionicons) — sempre acompanhado de texto. */
  icone: 'checkmark-circle' | 'alert-circle' | 'warning';
}

const APRESENTACOES: Record<NivelRisco, ApresentacaoRisco> = {
  Normal: {
    nivel: 'Normal',
    rotulo: 'Calor normal',
    descricaoAcessivel: 'Nível de calor: normal.',
    orientacao: 'Tempo tranquilo. Continue bebendo água ao longo do dia.',
    icone: 'checkmark-circle',
  },
  Atencao: {
    nivel: 'Atencao',
    rotulo: 'Atenção ao calor',
    descricaoAcessivel: 'Nível de calor: atenção.',
    orientacao:
      'Está muito quente. Use chapéu, fique na sombra quando puder e beba água.',
    icone: 'alert-circle',
  },
  Perigo: {
    nivel: 'Perigo',
    rotulo: 'Calor perigoso',
    descricaoAcessivel: 'Nível de calor: perigo.',
    orientacao:
      'Calor perigoso agora. Procure sombra, beba água e evite esforço ao sol.',
    icone: 'warning',
  },
};

/** Normaliza o texto do enum vindo da API, sem aceitar valores desconhecidos. */
export function normalizarNivel(valor: unknown): NivelRisco | null {
  if (valor === 'Normal' || valor === 'Atencao' || valor === 'Perigo') {
    return valor;
  }
  return null;
}

export function apresentarRisco(nivel: NivelRisco): ApresentacaoRisco {
  return APRESENTACOES[nivel];
}

/** Limite para considerar a leitura do totem antiga (critério F01 da proposta). */
export const MINUTOS_LEITURA_ATUAL = 15;

export type Atualidade = 'atual' | 'antiga' | 'indefinida';

/**
 * Classifica se a leitura ainda representa o momento presente.
 * Datas inválidas ou no futuro (relógio do totem adiantado) viram
 * "indefinida" — o app nunca afirma que um dado é atual sem certeza.
 */
export function classificarAtualidade(
  coletadaEmIso: string,
  agora: Date = new Date(),
): Atualidade {
  const coletada = new Date(coletadaEmIso).getTime();
  if (Number.isNaN(coletada)) return 'indefinida';
  const diffMin = (agora.getTime() - coletada) / 60000;
  if (diffMin < -2) return 'indefinida';
  return diffMin <= MINUTOS_LEITURA_ATUAL ? 'atual' : 'antiga';
}

/** "há 5 minutos", "há 2 horas", "há 3 dias" — usado nos avisos de dado antigo. */
export function descreverTempoDecorrido(iso: string, agora: Date = new Date()): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return 'em horário desconhecido';
  const min = Math.max(0, Math.round((agora.getTime() - t) / 60000));
  if (min < 1) return 'agora há pouco';
  if (min < 60) return `há ${min} ${min === 1 ? 'minuto' : 'minutos'}`;
  const h = Math.round(min / 60);
  if (h < 24) return `há ${h} ${h === 1 ? 'hora' : 'horas'}`;
  const d = Math.round(h / 24);
  return `há ${d} ${d === 1 ? 'dia' : 'dias'}`;
}

/**
 * Cria o formatador no fuso de São Paulo. Se o motor JS do aparelho não
 * suportar a opção timeZone, usa o fuso do próprio celular em vez de travar.
 */
function criarFormatador(opcoes: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  try {
    return new Intl.DateTimeFormat('pt-BR', { ...opcoes, timeZone: 'America/Sao_Paulo' });
  } catch {
    return new Intl.DateTimeFormat('pt-BR', opcoes);
  }
}

const FMT_HORA = criarFormatador({ hour: '2-digit', minute: '2-digit' });

const FMT_DATA_HORA = criarFormatador({
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

export function formatarHora(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '--:--' : FMT_HORA.format(d);
}

export function formatarDataHora(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? 'data desconhecida' : FMT_DATA_HORA.format(d);
}

/** DateOnly "2026-11-19" -> "19/11" sem conversão de fuso (é uma data civil). */
export function formatarDataCivil(dataYmd: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dataYmd);
  return m ? `${m[3]}/${m[2]}` : dataYmd;
}

export function formatarTemperatura(valor: number): string {
  return `${valor.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} °C`;
}

export function formatarPercentual(valor: number): string {
  return `${Math.round(valor)}%`;
}
