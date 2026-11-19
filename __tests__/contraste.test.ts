import { CORES_CONTRASTE_REFORCADO, CORES_PADRAO, razaoContraste, type Cores } from '@/theme/tema';

/** WCAG 2.1 AA: texto comum precisa de contraste >= 4,5:1. */
const MINIMO = 4.5;

function pares(c: Cores): [string, string, string][] {
  return [
    ['texto/fundo', c.texto, c.fundo],
    ['texto/superficie', c.texto, c.superficie],
    ['textoSecundario/fundo', c.textoSecundario, c.fundo],
    ['textoSecundario/superficie', c.textoSecundario, c.superficie],
    ['primaria(texto)/superficie', c.primaria, c.superficie],
    ['textoSobrePrimaria/primaria', c.textoSobrePrimaria, c.primaria],
    ['erro', c.erroTexto, c.erroFundo],
    ['aviso', c.avisoTexto, c.avisoFundo],
    ['info', c.infoTexto, c.infoFundo],
    ['infoFundo/primaria (opção selecionada)', c.texto, c.infoFundo],
    ['risco Normal', c.risco.Normal.texto, c.risco.Normal.fundo],
    ['risco Atencao', c.risco.Atencao.texto, c.risco.Atencao.fundo],
    ['risco Perigo', c.risco.Perigo.texto, c.risco.Perigo.fundo],
    ['favorito (estrela)/superficie', c.risco.Atencao.borda, c.superficie],
  ];
}

describe.each([
  ['tema padrão', CORES_PADRAO],
  ['contraste reforçado', CORES_CONTRASTE_REFORCADO],
])('Contraste WCAG AA — %s', (_n, cores) => {
  it.each(pares(cores))('%s >= 4,5:1', (_par, frente, fundo) => {
    expect(razaoContraste(frente, fundo)).toBeGreaterThanOrEqual(MINIMO);
  });
});

it('calcula contraste conhecido (preto/branco = 21:1)', () => {
  expect(razaoContraste('#000000', '#FFFFFF')).toBeCloseTo(21, 1);
});
