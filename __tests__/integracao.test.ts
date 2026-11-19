/**
 * @jest-environment node
 *
 * Integração HTTP real: sobe o SERVIDOR DE CONTRATO SIMULADO
 * (mock-server/server.ts, mesmas rotas da Sereno.Api) e consome com o
 * cliente de produção do app. Não substitui o teste contra a API .NET,
 * que fica documentado em docs/TESTES.md como verificação manual.
 */
import { spawn, type ChildProcess } from 'node:child_process';
import { join } from 'node:path';
import { request } from 'node:http';
import { criarClienteApi } from '@/services/serenoApi';
import type { FetchLike } from '@/services/http';

/**
 * O preset do React Native substitui o fetch global nos testes. Para uma
 * chamada HTTP de verdade, usamos este fetch mínimo sobre node:http.
 */
const fetchNode: FetchLike = (url, init) =>
  new Promise((ok, falha) => {
    const req = request(url, { method: init?.method ?? 'GET', headers: init?.headers as Record<string, string> }, (res) => {
      const partes: Buffer[] = [];
      res.on('data', (c) => partes.push(c));
      res.on('end', () => {
        const texto = Buffer.concat(partes).toString('utf8');
        const status = res.statusCode ?? 0;
        ok({
          ok: status >= 200 && status < 300,
          status,
          headers: { get: (n: string) => (res.headers[n.toLowerCase()] as string | undefined) ?? null },
          json: async () => JSON.parse(texto),
        } as unknown as Response);
      });
    });
    req.on('error', falha);
    init?.signal?.addEventListener('abort', () => req.destroy(new Error('abort')));
    req.end();
  });

const PORTA = 5399;
let proc: ChildProcess;
const api = criarClienteApi({ baseUrl: `http://127.0.0.1:${PORTA}`, timeoutMs: 3000, fetchImpl: fetchNode });

beforeAll(async () => {
  proc = spawn(process.execPath, ['--disable-warning=MODULE_TYPELESS_PACKAGE_JSON', join(__dirname, '..', 'mock-server', 'server.ts')], {
    env: { ...process.env, PORTA: String(PORTA), CENARIO: 'perigo' },
    stdio: 'ignore',
  });
  for (let i = 0; i < 50; i++) {
    try {
      await api.health();
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 100));
    }
  }
  throw new Error('servidor simulado não subiu');
}, 15000);

afterAll(() => {
  proc.kill();
});

it('health identifica ambiente simulado', async () => {
  const r = await api.health();
  expect(r.simulado).toBe(true);
  expect(r.dado.status).toBe('Healthy');
});

it('jornada da Dona Lúcia: totem -> leitura Perigo -> alerta -> previsão -> 3 pontos próximos', async () => {
  const totens = await api.listarTotens();
  const totem = totens.dado.find((t) => t.ativo)!;
  const leitura = await api.ultimaLeitura(totem.codigo);
  expect(leitura.dado.nivel).toBe('Perigo');
  const alertas = await api.listarAlertas({ ativos: true });
  expect(alertas.dado.some((a) => a.nivel === 'Perigo' && a.ativo)).toBe(true);
  const prev = await api.previsaoAmanha();
  expect(prev.dado.nivel).toBe('Perigo');
  const pontos = await api.pontosProximos({ latitude: -23.5021, longitude: -46.6249 }, 3);
  expect(pontos.dado).toHaveLength(3);
  const dist = pontos.dado.map((p) => p.distanciaKm ?? Infinity);
  expect([...dist].sort((a, b) => a - b)).toEqual(dist);
  const detalhe = await api.buscarPonto(pontos.dado[0]!.id);
  expect(detalhe.dado.id).toBe(pontos.dado[0]!.id);
});

it('totem inexistente devolve 404 tratado', async () => {
  await expect(api.ultimaLeitura('NAO-EXISTE')).rejects.toMatchObject({ tipo: 'nao_encontrado', status: 404 });
});

it('ponto com id inválido devolve 404 tratado', async () => {
  await expect(api.buscarPonto('abc')).rejects.toMatchObject({ tipo: 'nao_encontrado' });
});

it('servidor desligado vira "sem_conexao"', async () => {
  const morto = criarClienteApi({ baseUrl: 'http://127.0.0.1:5398', timeoutMs: 1500, fetchImpl: fetchNode });
  await expect(morto.health()).rejects.toMatchObject({ tipo: 'sem_conexao' });
});
