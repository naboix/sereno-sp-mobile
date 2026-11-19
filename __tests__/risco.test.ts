import {
  apresentarRisco,
  classificarAtualidade,
  descreverTempoDecorrido,
  formatarDataCivil,
  MINUTOS_LEITURA_ATUAL,
  normalizarNivel,
} from '@/domain/risco';
import { proximoLembrete } from '@/domain/hidratacao';

describe('apresentação do risco (texto + ícone, nunca só cor)', () => {
  it.each(['Normal', 'Atencao', 'Perigo'] as const)('%s tem rótulo, ícone, orientação e descrição acessível', (n) => {
    const a = apresentarRisco(n);
    expect(a.rotulo.length).toBeGreaterThan(3);
    expect(a.icone).toBeTruthy();
    expect(a.orientacao.length).toBeGreaterThan(10);
    expect(a.descricaoAcessivel).toMatch(/Nível de calor/);
  });

  it('aceita só os valores do enum NivelRisco do backend', () => {
    expect(normalizarNivel('Perigo')).toBe('Perigo');
    expect(normalizarNivel('perigo')).toBeNull();
    expect(normalizarNivel(2)).toBeNull();
    expect(normalizarNivel(undefined)).toBeNull();
  });
});

describe('atualidade da leitura (não apresentar leitura antiga como atual)', () => {
  const agora = new Date('2026-11-18T16:00:00Z');
  const menos = (min: number) => new Date(agora.getTime() - min * 60000).toISOString();

  it('até 15 min é atual', () => {
    expect(classificarAtualidade(menos(0), agora)).toBe('atual');
    expect(classificarAtualidade(menos(MINUTOS_LEITURA_ATUAL), agora)).toBe('atual');
  });
  it('acima de 15 min é antiga', () => {
    expect(classificarAtualidade(menos(16), agora)).toBe('antiga');
    expect(classificarAtualidade(menos(180), agora)).toBe('antiga');
  });
  it('data inválida ou no futuro é indefinida', () => {
    expect(classificarAtualidade('nao-e-data', agora)).toBe('indefinida');
    expect(classificarAtualidade(menos(-10), agora)).toBe('indefinida');
  });
  it('descreve o tempo decorrido em português', () => {
    expect(descreverTempoDecorrido(menos(1), agora)).toBe('há 1 minuto');
    expect(descreverTempoDecorrido(menos(180), agora)).toBe('há 3 horas');
    expect(descreverTempoDecorrido(menos(60 * 48), agora)).toBe('há 2 dias');
  });
});

it('formata DateOnly sem conversão de fuso', () => {
  expect(formatarDataCivil('2026-11-19')).toBe('19/11');
});

describe('lembrete de água (calculado no app, sem push)', () => {
  it('sem registro não há lembrete', () => expect(proximoLembrete(null, 60)).toBeNull());
  it('soma o intervalo ao último registro', () => {
    const r = proximoLembrete('2026-11-18T12:00:00.000Z', 90, new Date('2026-11-18T12:30:00Z'));
    expect(r?.horario.toISOString()).toBe('2026-11-18T13:30:00.000Z');
    expect(r?.atrasado).toBe(false);
  });
  it('marca atraso quando passou do horário', () => {
    expect(proximoLembrete('2026-11-18T12:00:00.000Z', 60, new Date('2026-11-18T14:00:00Z'))?.atrasado).toBe(true);
  });
});
