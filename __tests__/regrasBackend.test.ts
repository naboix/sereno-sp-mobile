/**
 * Garante que o porte das regras (usado só nos dados simulados) é
 * idêntico ao backend: os casos abaixo são os MESMOS do arquivo
 * Sereno.Tests/Services/LeituraServiceTests.cs e das regras de
 * PrevisaoService.ClassificarProbabilidade.
 */
import {
  calcularIndiceCalor,
  classificarProbabilidade,
  classificarRisco,
  mensagemPrevisao,
} from '@/services/mock/regrasBackend';

describe('ClassificarRisco (espelho de LeituraServiceTests)', () => {
  it.each([
    [20.0, 'Normal'],
    [31.99, 'Normal'],
    [32.0, 'Atencao'],
    [36.0, 'Atencao'],
    [40.99, 'Atencao'],
    [41.0, 'Perigo'],
    [50.0, 'Perigo'],
  ])('índice %d => %s', (indice, nivel) => expect(classificarRisco(indice)).toBe(nivel));
});

describe('CalcularIndiceCalor', () => {
  it('37 °C e 60% gera índice entre 50 e 55 (Perigo)', () => {
    const i = calcularIndiceCalor(37, 60);
    expect(i).toBeGreaterThanOrEqual(50);
    expect(i).toBeLessThanOrEqual(55);
    expect(classificarRisco(i)).toBe('Perigo');
  });
  it('24 °C e 60% gera índice entre 20 e 30', () => {
    const i = calcularIndiceCalor(24, 60);
    expect(i).toBeGreaterThanOrEqual(20);
    expect(i).toBeLessThanOrEqual(30);
  });
  it.each([
    [-51, 60],
    [71, 60],
    [25, -1],
    [25, 101],
    [NaN, 60],
    [30, Infinity],
  ])('rejeita entrada inválida (%d, %d)', (t, u) => expect(() => calcularIndiceCalor(t, u)).toThrow(RangeError));
});

describe('ClassificarProbabilidade (PrevisaoService)', () => {
  it.each([
    [0.0, 'Normal'],
    [0.39, 'Normal'],
    [0.4, 'Atencao'],
    [0.7, 'Atencao'],
    [0.71, 'Perigo'],
    [1.0, 'Perigo'],
  ])('%d => %s', (p, n) => expect(classificarProbabilidade(p)).toBe(n));
  it('rejeita fora de 0..1', () => expect(() => classificarProbabilidade(1.2)).toThrow());
  it('mensagem igual à do backend', () =>
    expect(mensagemPrevisao('Perigo')).toBe(
      'Amanhã: calor perigoso. Procure se proteger e evite exposição prolongada ao sol.',
    ));
});
