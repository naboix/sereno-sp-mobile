/**
 * @jest-environment node
 */
import { migrarBanco } from '@/db/database';
import { lerCache, salvarCache } from '@/db/repositorios';
import { amanhaLocalYmd, buscarComCache, carregarPainelInicio } from '@/services/dados';
import { ErroApi } from '@/services/http';
import { criarClienteMock } from '@/services/mock/mockApi';
import type { ClienteApi } from '@/services/serenoApi';
import { criarBancoMemoria } from './apoio/bancoNode';

let db: ReturnType<typeof criarBancoMemoria>;
beforeEach(async () => {
  db = criarBancoMemoria();
  await migrarBanco(db);
});
afterEach(() => db.fechar());

const offline = () => Promise.reject(new ErroApi('sem_conexao', null));

it('sucesso: devolve origem "api" e salva no cache', async () => {
  const r = await buscarComCache(db, 'ultima_leitura', 'api', async () => ({ dado: { v: 1 }, simulado: false }));
  expect(r.resultado?.origem).toBe('api');
  expect((await lerCache(db, 'ultima_leitura'))?.dado).toEqual({ v: 1 });
});

it('servidor simulado é rotulado "simulado", nunca "api"', async () => {
  const r = await buscarComCache(db, 'pontos', 'api', async () => ({ dado: [], simulado: true }));
  expect(r.resultado?.origem).toBe('simulado');
});

it('sem conexão: usa o cache com origem "cache" e o horário em que foi salvo', async () => {
  await salvarCache(db, 'ultima_leitura', { v: 1 }, 'api');
  const salvo = (await lerCache(db, 'ultima_leitura'))!.salvoEm;
  const r = await buscarComCache(db, 'ultima_leitura', 'api', offline);
  expect(r.resultado).toEqual({ dado: { v: 1 }, origem: 'cache', obtidoEm: salvo });
  expect(r.erro?.tipo).toBe('sem_conexao');
});

it('404 do backend NÃO usa cache (o servidor disse que não há dado)', async () => {
  await salvarCache(db, 'previsao_amanha', { v: 1 }, 'api');
  const r = await buscarComCache(db, 'previsao_amanha', 'api', () => Promise.reject(new ErroApi('nao_encontrado', 404)));
  expect(r.resultado).toBeNull();
  expect(r.erro?.tipo).toBe('nao_encontrado');
});

it('cache de previsão de outro dia é descartado', async () => {
  await salvarCache(db, 'previsao_amanha', { dataReferencia: '2020-01-01' }, 'api');
  const r = await buscarComCache<{ dataReferencia: string }>(db, 'previsao_amanha', 'api', offline, (p) => p.dataReferencia === amanhaLocalYmd());
  expect(r.resultado).toBeNull();
});

it('painel do Início: escolhe o primeiro totem ativo e traz leitura + previsão (modo mock)', async () => {
  const p = await carregarPainelInicio(db, criarClienteMock('perigo'), 'mock', null);
  expect(p.totem.resultado?.dado.codigo).toBe('STN-01');
  expect(p.leitura.resultado?.dado.nivel).toBe('Perigo');
  expect(p.leitura.resultado?.origem).toBe('mock');
  expect(p.previsao.resultado?.dado.probabilidadePercentual).toBe(82);
});

it('painel do Início offline depois de uma consulta: tudo vem do cache', async () => {
  await carregarPainelInicio(db, criarClienteMock('perigo'), 'mock', null);
  const semRede = new Proxy({} as ClienteApi, { get: () => offline });
  const p = await carregarPainelInicio(db, semRede, 'api', null);
  expect(p.leitura.resultado?.origem).toBe('cache');
  expect(p.previsao.resultado?.origem).toBe('cache');
});

it('previsão simulada é sempre de AMANHÃ no calendário local (regressão de fuso às 21h+ em São Paulo)', async () => {
  const p = await criarClienteMock('perigo').previsaoAmanha();
  expect(p.dado.dataReferencia).toBe(amanhaLocalYmd());
});
