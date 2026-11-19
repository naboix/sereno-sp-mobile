import { criarClienteApi } from '@/services/serenoApi';
import { ErroApi, getJson, montarUrl } from '@/services/http';
import { validarLeitura, validarListaPontos, validarPrevisao } from '@/services/contratos';

/** Fixtures no formato EXATO que o ASP.NET Core serializa os DTOs (camelCase). */
const LEITURA = {
  id: '47e7bb34-1f14-4cd7-b84c-00be6aee02f5',
  totemCodigo: 'STN-01',
  temperatura: 37,
  umidade: 60,
  indiceCalor: 51.44,
  nivel: 'Perigo',
  coletadaEm: '2026-11-18T19:40:43.721Z',
};
const PREVISAO = {
  id: '00000000-0000-4000-8000-0000000000aa',
  dataReferencia: '2026-11-19',
  probabilidade: 0.82,
  probabilidadePercentual: 82,
  nivel: 'Perigo',
  mensagem: 'Amanhã: calor perigoso.',
  versaoModelo: 'rf-v1',
  criadoEm: '2026-11-18T18:00:00Z',
};

function resposta(status: number, corpo: unknown, headers: Record<string, string> = {}) {
  return new Response(corpo === undefined ? null : JSON.stringify(corpo), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

describe('validação de contrato', () => {
  it('aceita LeituraRespostaDto real', () => expect(validarLeitura(LEITURA)).toEqual(LEITURA));
  it('aceita PrevisaoRespostaDto real', () => expect(validarPrevisao(PREVISAO).nivel).toBe('Perigo'));
  it('rejeita campo ausente', () => {
    const { indiceCalor: _x, ...sem } = LEITURA;
    expect(() => validarLeitura(sem)).toThrow(ErroApi);
  });
  it('rejeita nível fora do enum', () => expect(() => validarLeitura({ ...LEITURA, nivel: 'Extremo' })).toThrow(ErroApi));
  it('rejeita PascalCase (não é o formato da API)', () =>
    expect(() => validarLeitura({ TotemCodigo: 'STN-01' })).toThrow(ErroApi));
  it('distanciaKm null é aceito em /api/pontos', () => {
    const p = validarListaPontos([
      { id: 'a', nome: 'X', endereco: 'Y', latitude: 1, longitude: 2, temAgua: true, temSombra: false, distanciaKm: null },
    ]);
    expect(p[0]!.distanciaKm).toBeNull();
  });
});

describe('cliente HTTP', () => {
  it('erro de rede vira sem_conexao', async () => {
    const f = jest.fn().mockRejectedValue(new TypeError('Network request failed'));
    await expect(getJson('http://x/health', { timeoutMs: 1000, fetchImpl: f })).rejects.toMatchObject({ tipo: 'sem_conexao' });
  });

  it('timeout vira tempo_esgotado', async () => {
    const f = (_u: string, init?: RequestInit) =>
      new Promise<Response>((_ok, falha) => init?.signal?.addEventListener('abort', () => falha(new Error('abort'))));
    await expect(getJson('http://x/health', { timeoutMs: 50, fetchImpl: f })).rejects.toMatchObject({ tipo: 'tempo_esgotado' });
  });

  it('404 com { erro } guarda a mensagem do servidor', async () => {
    const f = jest.fn().mockResolvedValue(resposta(404, { erro: 'Nenhuma leitura encontrada.' }));
    await expect(getJson('http://x', { timeoutMs: 1000, fetchImpl: f })).rejects.toMatchObject({
      tipo: 'nao_encontrado',
      status: 404,
      mensagemServidor: 'Nenhuma leitura encontrada.',
    });
  });

  it('503 vira erro_servidor', async () => {
    const f = jest.fn().mockResolvedValue(resposta(503, { status: 'Unhealthy' }));
    await expect(getJson('http://x', { timeoutMs: 1000, fetchImpl: f })).rejects.toMatchObject({ tipo: 'erro_servidor' });
  });

  it('JSON malformado vira resposta_invalida', async () => {
    const f = jest.fn().mockResolvedValue(new Response('<html>', { status: 200 }));
    await expect(getJson('http://x', { timeoutMs: 1000, fetchImpl: f })).rejects.toMatchObject({ tipo: 'resposta_invalida' });
  });

  it('identifica o servidor simulado pelo cabeçalho', async () => {
    const f = jest.fn().mockResolvedValue(resposta(200, {}, { 'X-Sereno-Ambiente': 'simulado' }));
    expect((await getJson('http://x', { timeoutMs: 1000, fetchImpl: f })).simulado).toBe(true);
    const g = jest.fn().mockResolvedValue(resposta(200, {}));
    expect((await getJson('http://x', { timeoutMs: 1000, fetchImpl: g })).simulado).toBe(false);
  });

  it('monta query string codificada e omite vazios', () => {
    expect(montarUrl('http://h', '/api/alertas', { ativos: true, totemCodigo: undefined })).toBe('http://h/api/alertas?ativos=true');
    expect(montarUrl('http://h', '/a', { totemCodigo: 'STN 01&x' })).toBe('http://h/a?totemCodigo=STN%2001%26x');
  });
});

describe('rotas consumidas (iguais aos controllers)', () => {
  function cliente() {
    const urls: string[] = [];
    const f = jest.fn(async (u: string) => {
      urls.push(u);
      if (u.includes('/api/leituras/ultima')) return resposta(200, LEITURA);
      if (u.includes('/api/previsoes/amanha')) return resposta(200, PREVISAO);
      return resposta(200, []);
    });
    return { api: criarClienteApi({ baseUrl: 'http://api:5128', timeoutMs: 1000, fetchImpl: f }), urls };
  }

  it('usa as rotas e parâmetros reais', async () => {
    const { api, urls } = cliente();
    await api.listarTotens();
    await api.ultimaLeitura('STN-01');
    await api.previsaoAmanha();
    await api.listarAlertas();
    await api.listarPontos({ temAgua: true });
    expect(urls).toEqual([
      'http://api:5128/api/totens',
      'http://api:5128/api/leituras/ultima?totemCodigo=STN-01',
      'http://api:5128/api/previsoes/amanha',
      'http://api:5128/api/alertas?ativos=true',
      'http://api:5128/api/pontos?temAgua=true',
    ]);
  });

  it('pontos próximos: coordenada ARREDONDADA na URL e limite 1..20', async () => {
    const { api, urls } = cliente();
    await api.pontosProximos({ latitude: -23.50234567, longitude: -46.62507891 }, 99);
    expect(urls[0]).toBe('http://api:5128/api/pontos/proximos?lat=-23.502&lon=-46.625&limite=20');
    expect(urls[0]).not.toMatch(/\d\.\d{4,}/);
  });
});
