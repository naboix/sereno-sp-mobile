/**
 * @jest-environment node
 */
import { apagarTodosOsDados, migrarBanco } from '@/db/database';
import {
  adicionarFavorito,
  contarCheckinsHoje,
  ehFavorito,
  lerCache,
  listarCheckins,
  listarFavoritos,
  listarHistoricoAlertas,
  obterPerfil,
  obterPreferencias,
  PREFERENCIAS_PADRAO,
  registrarAlertasVistos,
  registrarBebiAgua,
  removerFavorito,
  salvarCache,
  salvarPerfil,
  salvarPreferencias,
  sincronizarVigentes,
  validarPerfil,
} from '@/db/repositorios';
import { criarBancoMemoria } from './apoio/bancoNode';

let db: ReturnType<typeof criarBancoMemoria>;
beforeEach(async () => {
  db = criarBancoMemoria();
  await migrarBanco(db);
});
afterEach(() => db.fechar());

const PONTO = { id: 'p1', nome: 'Ponto Demo A', endereco: 'Rua fictícia, 1', latitude: -23.5, longitude: -46.62, temAgua: true, temSombra: false, distanciaKm: 0.3 };
const PERFIL = { apelido: 'Dona Lúcia', faixaEtaria: '70 a 79 anos' as const, bairro: 'Santana', consentimentoLocal: true };

it('migração cria as tabelas e é idempotente', async () => {
  await migrarBanco(db);
  const t = await db.getAllAsync<{ name: string }>("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name");
  expect(t.map((x) => x.name)).toEqual(['alertas_historico', 'cache_api', 'checkins', 'favoritos', 'perfil', 'preferencias']);
  expect((await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version'))?.user_version).toBe(1);
});

describe('perfil', () => {
  it('valida campos mínimos e consentimento (F06)', () => {
    expect(validarPerfil({ ...PERFIL, bairro: '' }).bairro).toBe('Informe seu bairro.');
    expect(validarPerfil({ ...PERFIL, consentimentoLocal: false }).consentimentoLocal).toBeDefined();
    expect(validarPerfil({ ...PERFIL, apelido: '123.456.789-09' }).apelido).toMatch(/documento/);
    expect(validarPerfil(PERFIL)).toEqual({});
  });
  it('salva, lê e atualiza (upsert)', async () => {
    expect(await obterPerfil(db)).toBeNull();
    await salvarPerfil(db, PERFIL);
    await salvarPerfil(db, { ...PERFIL, apelido: 'Lúcia' });
    expect(await obterPerfil(db)).toEqual({ ...PERFIL, apelido: 'Lúcia' });
  });
  it('não salva perfil inválido', async () => {
    await expect(salvarPerfil(db, { ...PERFIL, consentimentoLocal: false })).rejects.toThrow();
  });
});

it('preferências: padrão e persistência', async () => {
  expect(await obterPreferencias(db)).toEqual(PREFERENCIAS_PADRAO);
  const nova = { ...PREFERENCIAS_PADRAO, tamanhoFonte: 'muito_grande' as const, contrasteReforcado: true, lembreteIntervaloMin: 120 as const };
  await salvarPreferencias(db, nova);
  expect(await obterPreferencias(db)).toEqual(nova);
});

it('favoritos: CRUD com cópia offline do ponto', async () => {
  await adicionarFavorito(db, PONTO);
  await adicionarFavorito(db, PONTO); // sem duplicar
  const l = await listarFavoritos(db);
  expect(l).toHaveLength(1);
  expect(l[0]).toMatchObject({ id: 'p1', nome: 'Ponto Demo A', temAgua: true, temSombra: false });
  expect(await ehFavorito(db, 'p1')).toBe(true);
  await removerFavorito(db, 'p1');
  expect(await listarFavoritos(db)).toHaveLength(0);
});

it('check-ins "Bebi água": registra e conta só os de hoje', async () => {
  const agora = new Date();
  const ontem = new Date(agora.getTime() - 36 * 3600 * 1000);
  await registrarBebiAgua(db, ontem);
  await registrarBebiAgua(db, agora);
  await registrarBebiAgua(db, agora);
  expect(await contarCheckinsHoje(db, agora)).toBe(2);
  expect(await listarCheckins(db)).toHaveLength(3);
});

it('cache guarda origem e horário', async () => {
  await salvarCache(db, 'ultima_leitura', { temperatura: 37 }, 'api');
  const c = await lerCache<{ temperatura: number }>(db, 'ultima_leitura');
  expect(c?.dado.temperatura).toBe(37);
  expect(c?.origem).toBe('api');
  expect(Number.isNaN(Date.parse(c!.salvoEm))).toBe(false);
});

it('histórico de alertas marca como encerrado o que saiu dos vigentes', async () => {
  const a = { id: 'a1', leituraSensorId: 'l', totemCodigo: 'STN-01', origem: 'Totem', nivel: 'Perigo' as const, mensagem: 'Calor', ativo: true, criadoEm: '2026-11-18T10:00:00Z' };
  await registrarAlertasVistos(db, [a, { ...a, id: 'a2' }]);
  await sincronizarVigentes(db, ['a2']);
  const h = await listarHistoricoAlertas(db);
  expect(h.find((x) => x.id === 'a1')?.ativo).toBe(false);
  expect(h.find((x) => x.id === 'a2')?.ativo).toBe(true);
});

it('apagar meus dados limpa todas as tabelas', async () => {
  await salvarPerfil(db, PERFIL);
  await adicionarFavorito(db, PONTO);
  await registrarBebiAgua(db);
  await apagarTodosOsDados(db);
  expect(await obterPerfil(db)).toBeNull();
  expect(await listarFavoritos(db)).toHaveLength(0);
  expect(await listarCheckins(db)).toHaveLength(0);
});

it('não existe coluna para CPF, telefone, e-mail, saúde ou GPS do usuário', async () => {
  const cols = await db.getAllAsync<{ name: string }>(
    "SELECT p.name FROM sqlite_master m JOIN pragma_table_info(m.name) p WHERE m.type='table' AND m.name IN ('perfil','preferencias','checkins')",
  );
  const nomes = cols.map((c) => c.name).join(' ');
  expect(nomes).not.toMatch(/cpf|telefone|email|saude|latitude|longitude/i);
});
