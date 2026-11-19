/**
 * Popula a Sereno.Api REAL com dados SINTÉTICOS para demonstrar o app.
 *
 * Usa somente endpoints que existem no backend:
 *   POST /api/pontos      (CriarPontoRefrescoDto)
 *   POST /api/totens      (CriarTotemDto)
 *   POST /api/leituras    (CriarLeituraDto)  -> gera Alerta quando nível = Perigo
 *   POST /api/previsoes   (CriarPrevisaoDto)
 *
 * Os pontos têm nomes e endereços explicitamente FICTÍCIOS.
 *
 * Uso:  SERENO_API_URL=http://localhost:5128 npm run api:seed
 *       (rode a API com:  dotnet run --project Sereno.Api --launch-profile http)
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
const DADOS = JSON.parse(readFileSync(join(AQUI, '../src/services/mock/dados-sinteticos.json'), 'utf8'));
const BASE = (process.env.SERENO_API_URL ?? 'http://localhost:5128').replace(/\/+$/, '');

async function post(caminho: string, corpo: unknown): Promise<{ status: number; json: unknown }> {
  const r = await fetch(`${BASE}${caminho}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(corpo),
  });
  let json: unknown = null;
  try {
    json = await r.json();
  } catch {
    /* corpo vazio */
  }
  return { status: r.status, json };
}

async function get(caminho: string): Promise<unknown> {
  const r = await fetch(`${BASE}${caminho}`, { headers: { Accept: 'application/json' } });
  return r.ok ? r.json() : null;
}

function amanhaSaoPaulo(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date(Date.now() + 86400000));
}

async function main() {
  console.log(`Sereno SP - seed de dados SINTÉTICOS em ${BASE}`);
  const saude = await get('/health');
  if (!saude) throw new Error('API indisponível em /health. Ela está rodando com --launch-profile http?');
  console.log('health:', JSON.stringify(saude));

  const existentes = ((await get('/api/pontos')) as { id: string; nome: string }[] | null) ?? [];
  const idsPorNome = new Map(existentes.map((p) => [p.nome, p.id]));

  for (const p of DADOS.pontos) {
    if (idsPorNome.has(p.nome)) {
      console.log(`ponto já existe: ${p.nome}`);
      continue;
    }
    const r = await post('/api/pontos', {
      nome: p.nome,
      endereco: p.endereco,
      latitude: p.latitude,
      longitude: p.longitude,
      temAgua: p.temAgua,
      temSombra: p.temSombra,
    });
    console.log(`POST /api/pontos -> ${r.status} ${p.nome}`);
    if (r.status === 201) idsPorNome.set(p.nome, (r.json as { id: string }).id);
  }

  const pontoTotem = idsPorNome.get(DADOS.pontos[0].nome) ?? null;
  for (const t of DADOS.totens) {
    const r = await post('/api/totens', { codigo: t.codigo, pontoRefrescoId: t.codigo === 'STN-01' ? pontoTotem : null });
    console.log(`POST /api/totens -> ${r.status} ${t.codigo}${r.status === 409 ? ' (já existia)' : ''}`);
  }

  const cen = DADOS.cenarios.perigo;
  const l = await post('/api/leituras', { totemCodigo: 'STN-01', temperatura: cen.temperatura, umidade: cen.umidade });
  console.log(`POST /api/leituras -> ${l.status}`, JSON.stringify(l.json));

  const n = await post('/api/leituras', { totemCodigo: 'STN-02', temperatura: 24, umidade: 60 });
  console.log(`POST /api/leituras -> ${n.status}`, JSON.stringify(n.json));

  const pv = await post('/api/previsoes', {
    dataReferencia: amanhaSaoPaulo(),
    probabilidade: DADOS.previsao.probabilidade,
    versaoModelo: DADOS.previsao.versaoModelo,
  });
  console.log(`POST /api/previsoes -> ${pv.status}${pv.status === 409 ? ' (já existia para amanhã)' : ''}`);

  console.log('Pronto. Abra o app com EXPO_PUBLIC_DATA_MODE=api.');
}

main().catch((e) => {
  console.error('Falha no seed:', e instanceof Error ? e.message : e);
  process.exit(1);
});
