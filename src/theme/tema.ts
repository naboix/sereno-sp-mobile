/**
 * Tema visual do Sereno SP.
 *
 * Todas as combinações texto/fundo são verificadas no teste
 * __tests__/contraste.test.ts contra o mínimo WCAG 2.1 AA (4,5:1
 * para texto comum). As cores de risco sempre aparecem com ícone e
 * texto, nunca sozinhas.
 */
import type { NivelRisco } from '@/domain/types';
import type { TamanhoFonte } from '@/db/repositorios';

export interface CoresRisco {
  fundo: string;
  texto: string;
  borda: string;
}

export interface Cores {
  fundo: string;
  superficie: string;
  texto: string;
  textoSecundario: string;
  primaria: string;
  textoSobrePrimaria: string;
  borda: string;
  foco: string;
  erroFundo: string;
  erroTexto: string;
  avisoFundo: string;
  avisoTexto: string;
  infoFundo: string;
  infoTexto: string;
  risco: Record<NivelRisco, CoresRisco>;
}

export const CORES_PADRAO: Cores = {
  fundo: '#FFF8F0',
  superficie: '#FFFFFF',
  texto: '#1C1B1A',
  textoSecundario: '#4A4744',
  primaria: '#0B5563',
  textoSobrePrimaria: '#FFFFFF',
  borda: '#8A8580',
  foco: '#0B5563',
  erroFundo: '#FDE7E5',
  erroTexto: '#8C1D18',
  avisoFundo: '#FFF1CC',
  avisoTexto: '#5A3B00',
  infoFundo: '#E2F1F4',
  infoTexto: '#083F49',
  risco: {
    Normal: { fundo: '#E3F4EA', texto: '#0F3D21', borda: '#1B6B3A' },
    Atencao: { fundo: '#FFE9A8', texto: '#4A3000', borda: '#8A5A00' },
    Perigo: { fundo: '#A8201A', texto: '#FFFFFF', borda: '#6E140F' },
  },
};

export const CORES_CONTRASTE_REFORCADO: Cores = {
  ...CORES_PADRAO,
  fundo: '#FFFFFF',
  superficie: '#FFFFFF',
  texto: '#000000',
  textoSecundario: '#1F1F1F',
  primaria: '#00313A',
  borda: '#000000',
  foco: '#000000',
  erroTexto: '#5C0F0B',
  avisoTexto: '#3A2600',
  infoTexto: '#00262D',
  risco: {
    Normal: { fundo: '#E3F4EA', texto: '#000000', borda: '#000000' },
    Atencao: { fundo: '#FFE9A8', texto: '#000000', borda: '#000000' },
    Perigo: { fundo: '#7A0F0A', texto: '#FFFFFF', borda: '#000000' },
  },
};

/** Multiplicador aplicado sobre a escala de fonte do próprio sistema. */
export const ESCALA_FONTE: Record<TamanhoFonte, number> = {
  normal: 1,
  grande: 1.15,
  muito_grande: 1.35,
};

/** Tamanhos-base em pontos. O corpo do texto parte de 18 (proposta, seção E). */
export const TIPOGRAFIA = {
  titulo: 30,
  subtitulo: 22,
  corpo: 18,
  apoio: 16,
  destaque: 44,
} as const;

/** Alvo mínimo de toque (Android recomenda 48 dp; usamos 56 para o público 60+). */
export const ALVO_TOQUE_MIN = 56;

export const ESPACO = { xs: 4, s: 8, m: 16, l: 24, xl: 32 } as const;
export const RAIO = { s: 8, m: 14, l: 20 } as const;

/* ---- Utilidades de contraste (WCAG 2.1) ---- */

function canal(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

export function luminancia(hex: string): number {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
}

export function razaoContraste(a: string, b: string): number {
  const la = luminancia(a);
  const lb = luminancia(b);
  const [cl, es] = la > lb ? [la, lb] : [lb, la];
  return (cl + 0.05) / (es + 0.05);
}
