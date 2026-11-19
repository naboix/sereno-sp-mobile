/**
 * Porte FIEL das regras do backend, usado SOMENTE para gerar dados
 * simulados coerentes (modo mock e servidor de contrato).
 *
 * Fontes no backend:
 *  - LeituraService.CalcularIndiceCalor  (NOAA / Rothfusz)
 *  - LeituraService.ClassificarRisco     (<32 Normal, <41 Atenção, >=41 Perigo)
 *  - PrevisaoService.ClassificarProbabilidade (>0,70 Perigo, >=0,40 Atenção)
 *  - PrevisaoService.GerarMensagem
 *
 * Com a API real, o app NÃO usa estas funções: exibe o nível que o
 * backend calculou.
 */
import type { NivelRisco } from '@/domain/types';

const arred2 = (v: number) => Math.round(v * 100) / 100;

export function calcularIndiceCalor(temperaturaC: number, umidade: number): number {
  if (!Number.isFinite(temperaturaC) || temperaturaC < -50 || temperaturaC > 70) {
    throw new RangeError('temperatura');
  }
  if (!Number.isFinite(umidade) || umidade < 0 || umidade > 100) {
    throw new RangeError('umidade');
  }
  const t = (temperaturaC * 9) / 5 + 32;
  const r = umidade;
  let hi = 0.5 * (t + 61.0 + (t - 68.0) * 1.2 + r * 0.094);
  if ((hi + t) / 2 < 80) return arred2(((hi - 32) * 5) / 9);

  hi =
    -42.379 +
    2.04901523 * t +
    10.14333127 * r -
    0.22475541 * t * r -
    0.00683783 * t * t -
    0.05481717 * r * r +
    0.00122874 * t * t * r +
    0.00085282 * t * r * r -
    0.00000199 * t * t * r * r;

  if (r < 13 && t >= 80 && t <= 112) {
    hi -= ((13 - r) / 4) * Math.sqrt((17 - Math.abs(t - 95)) / 17);
  }
  if (r > 85 && t >= 80 && t <= 87) {
    hi += ((r - 85) / 10) * ((87 - t) / 5);
  }
  return arred2(((hi - 32) * 5) / 9);
}

export function classificarRisco(indice: number): NivelRisco {
  if (indice >= 41) return 'Perigo';
  if (indice >= 32) return 'Atencao';
  return 'Normal';
}

export function classificarProbabilidade(p: number): NivelRisco {
  if (!Number.isFinite(p) || p < 0 || p > 1) throw new RangeError('probabilidade');
  if (p > 0.7) return 'Perigo';
  if (p >= 0.4) return 'Atencao';
  return 'Normal';
}

export function mensagemPrevisao(n: NivelRisco): string {
  switch (n) {
    case 'Perigo':
      return 'Amanhã: calor perigoso. Procure se proteger e evite exposição prolongada ao sol.';
    case 'Atencao':
      return 'Amanhã pode ser muito quente. Prepare-se e mantenha água por perto.';
    default:
      return 'Sem alerta antecipado de calor extremo para amanhã.';
  }
}
