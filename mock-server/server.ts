/**
 * SERVIDOR DE CONTRATO SIMULADO — Sereno SP
 * ------------------------------------------------------------------
 * NÃO é o backend do projeto. É um servidor de demonstração que
 * reproduz as MESMAS rotas, parâmetros, códigos HTTP e formatos JSON
 * dos controllers da Sereno.Api (.NET), com dados SINTÉTICOS.
 *
 * Serve para: (1) demonstrar o app quando a API .NET não estiver no ar;
 * (2) testes de integração do app; (3) gravar prints/vídeo.
 *
 * Toda resposta leva o cabeçalho "X-Sereno-Ambiente: simulado". O app
 * lê esse cabeçalho e mostra a faixa "Servidor de demonstração: dados
 * SIMULADOS", para nunca confundir este ambiente com o real.
 *
 * Executar:  npm run api:simulada          (porta 5128, a mesma da API .NET)
 *            PORTA=5200 CENARIO=antiga npm run api:simulada
 * Cenários:  perigo | atencao | normal | antiga | sem-leitura | sem-previsao | sem-alertas
 * Trocar cenário em tempo real: POST /__demo/cenario?nome=atencao
 *
 * Requer Node 22.18+ (executa TypeScript nativamente por type stripping).
 * Não registra URLs nem parâmetros em log (as coordenadas do cidadão
 * vêm na query string de /api/pontos/proximos).
 */
import { readFileSync } from 'node:fs';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  calcularIndiceCalor,
  classificarProbabilidade,
  classificarRisco,
  mensagemPrevisao,
} from '../src/services/mock/regrasBackend.ts';

const AQUI = dirname(fileURLToPath(import.meta.url));
const DADOS = JSON.parse(readFileSync(join(AQUI, '../src/services/mock/dados-sinteticos.json'), 'utf8'));

const CENARIOS = ['perigo', 'atencao', 'normal', 'antiga', 'sem-leitura', 'sem-previsao', 'sem-alertas'] as const;
type Cenario = (typeof CENARIOS)[number];

let cenario: Cenario = (CENARIOS as readonly string[]).includes(process.env.CENARIO ?? '')
  ? (process.env.CENARIO as Cenario)
  : 'perigo';

const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/* --------------------------- leituras em memória --------------------------- */

interface Leitura {
  id: string;
  totemCodigo: string;
  temperatura: number;
  umidade: number;
  indiceCalor: number;
  nivel: string;
  coletadaEm: string;
}

interface Alerta {
  id: string;
  leituraSensorId: string;
  totemCodigo: string;
  origem: string;
  nivel: string;
  mensagem: string;
  ativo: boolean;
  criadoEm: string;
}

const leiturasPostadas: Leitura[] = [];
const alertasPostados: Alerta[] = [];

function uuid(): string {
  return crypto.randomUUID();
}

function leituraDoCenario(codigo: string): Leitura | null {
  const postada = [...leiturasPostadas].reverse().find((l) => l.totemCodigo === codigo);
  if (postada) return postada;
  if (cenario === 'sem-leitura') return null;
  const base = cenario === 'atencao' || cenario === 'normal' ? DADOS.cenarios[cenario] : DADOS.cenarios.perigo;
  const indice = calcularIndiceCalor(base.temperatura, base.umidade);
  const minutosAtras = cenario === 'antiga' ? 180 : 4;
  return {
    id: '00000000-0000-4000-8000-00000000c0de',
    totemCodigo: codigo,
    temperatura: base.temperatura,
    umidade: base.umidade,
    indiceCalor: indice,
    nivel: classificarRisco(indice),
    coletadaEm: new Date(Date.now() - minutosAtras * 60000).toISOString(),
  };
}

function alertasDoCenario(): Alerta[] {
  const lista = [...alertasPostados];
  if (cenario !== 'sem-alertas') {
    const l = leituraDoCenario('STN-01');
    if (l && l.nivel === 'Perigo') {
      lista.push({
        id: '00000000-0000-4000-8000-0000000000a1',
        leituraSensorId: l.id,
        totemCodigo: 'STN-01',
        origem: 'Totem',
        nivel: 'Perigo',
        mensagem: DADOS.mensagemAlertaPerigo,
        ativo: true,
        criadoEm: l.coletadaEm,
      });
    }
  }
  return lista.sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
}

/* --------------------------- utilidades HTTP --------------------------- */

function enviar(res: ServerResponse, status: number, corpo?: unknown) {
  res.statusCode = status;
  res.setHeader('X-Sereno-Ambiente', 'simulado');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
  res.setHeader('Access-Control-Expose-Headers', 'X-Sereno-Ambiente');
  if (corpo === undefined) {
    res.end();
    return;
  }
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(corpo));
}

/** Formato do ValidationProblem automático do [ApiController] (400). */
function problemaValidacao(campo: string, msg: string) {
  return {
    type: 'https://tools.ietf.org/html/rfc9110#section-15.5.1',
    title: 'One or more validation errors occurred.',
    status: 400,
    errors: { [campo]: [msg] },
  };
}

function amanhaSaoPaulo(): string {
  const partes = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(
    new Date(Date.now() + 24 * 3600 * 1000),
  );
  return partes; // en-CA => yyyy-MM-dd
}

async function lerCorpo(req: IncomingMessage): Promise<unknown> {
  const pedacos: Buffer[] = [];
  for await (const p of req) pedacos.push(p as Buffer);
  try {
    return JSON.parse(Buffer.concat(pedacos).toString('utf8') || 'null');
  } catch {
    return null;
  }
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const r = (g: number) => (g * Math.PI) / 180;
  const dLat = r(lat2 - lat1);
  const dLon = r(lon2 - lon1);
  let a = Math.sin(dLat / 2) ** 2 + Math.cos(r(lat1)) * Math.cos(r(lat2)) * Math.sin(dLon / 2) ** 2;
  a = Math.min(1, Math.max(0, a));
  return Math.round(6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 1000) / 1000;
}

const pontos = () => DADOS.pontos.map((p: Record<string, unknown>) => ({ ...p, distanciaKm: null }));

/* --------------------------- rotas --------------------------- */

async function rotear(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url ?? '/', 'http://localhost');
  const q = url.searchParams;
  const p = url.pathname.replace(/\/+$/, '') || '/';

  if (req.method === 'OPTIONS') return enviar(res, 204);

  if (req.method === 'POST' && p === '/__demo/cenario') {
    const nome = q.get('nome') ?? '';
    if (!(CENARIOS as readonly string[]).includes(nome)) {
      return enviar(res, 400, { erro: `Cenário inválido. Use: ${CENARIOS.join(', ')}` });
    }
    cenario = nome as Cenario;
    leiturasPostadas.length = 0;
    alertasPostados.length = 0;
    console.log(`[simulado] cenário alterado para "${cenario}"`);
    return enviar(res, 200, { cenario });
  }

  if (req.method === 'GET' && p === '/health') {
    return enviar(res, 200, { status: 'Healthy', api: 'Online', banco: 'Online' });
  }

  if (req.method === 'GET' && p === '/api/totens') return enviar(res, 200, DADOS.totens);

  const mTotem = /^\/api\/totens\/([^/]+)$/.exec(p);
  if (req.method === 'GET' && mTotem) {
    if (!GUID.test(mTotem[1]!)) return enviar(res, 404);
    const t = DADOS.totens.find((x: { id: string }) => x.id === mTotem[1]);
    return t ? enviar(res, 200, t) : enviar(res, 404, { erro: 'Totem não encontrado.' });
  }

  if (req.method === 'GET' && p === '/api/leituras/ultima') {
    const codigo = q.get('totemCodigo');
    if (codigo === null) return enviar(res, 400, problemaValidacao('totemCodigo', 'The totemCodigo field is required.'));
    if (!codigo.trim()) return enviar(res, 400, { erro: 'O código do totem é obrigatório.' });
    const l = leituraDoCenario(codigo.trim());
    const existe = DADOS.totens.some((t: { codigo: string }) => t.codigo === codigo.trim());
    return l && existe ? enviar(res, 200, l) : enviar(res, 404, { erro: 'Nenhuma leitura encontrada.' });
  }

  if (req.method === 'POST' && p === '/api/leituras') {
    const b = (await lerCorpo(req)) as { totemCodigo?: string; temperatura?: number; umidade?: number } | null;
    if (!b || !b.totemCodigo?.trim()) return enviar(res, 400, { erro: 'O código do totem é obrigatório.' });
    if (typeof b.temperatura !== 'number' || b.temperatura < -50 || b.temperatura > 70) {
      return enviar(res, 400, { erro: 'Temperatura fora da faixa permitida.' });
    }
    if (typeof b.umidade !== 'number' || b.umidade < 0 || b.umidade > 100) {
      return enviar(res, 400, { erro: 'Umidade deve estar entre 0 e 100.' });
    }
    const codigo = b.totemCodigo.trim();
    if (!DADOS.totens.some((t: { codigo: string }) => t.codigo === codigo)) {
      return enviar(res, 404, { erro: 'Totem não encontrado.' });
    }
    const indice = calcularIndiceCalor(b.temperatura, b.umidade);
    const l: Leitura = {
      id: uuid(),
      totemCodigo: codigo,
      temperatura: b.temperatura,
      umidade: b.umidade,
      indiceCalor: indice,
      nivel: classificarRisco(indice),
      coletadaEm: new Date().toISOString(),
    };
    leiturasPostadas.push(l);
    if (l.nivel === 'Perigo') {
      alertasPostados.push({
        id: uuid(),
        leituraSensorId: l.id,
        totemCodigo: codigo,
        origem: 'Totem',
        nivel: 'Perigo',
        mensagem: DADOS.mensagemAlertaPerigo,
        ativo: true,
        criadoEm: l.coletadaEm,
      });
    }
    return enviar(res, 201, l);
  }

  if (req.method === 'GET' && p === '/api/alertas') {
    const ativosTxt = q.get('ativos');
    const ativos = ativosTxt === null ? true : ativosTxt === '' ? null : ativosTxt.toLowerCase() === 'true';
    const codigo = q.get('totemCodigo')?.trim();
    const lista = alertasDoCenario().filter(
      (a) => (ativos === null || a.ativo === ativos) && (!codigo || a.totemCodigo === codigo),
    );
    return enviar(res, 200, lista);
  }

  if (req.method === 'GET' && p === '/api/pontos') {
    const agua = q.get('temAgua');
    const sombra = q.get('temSombra');
    const lista = pontos()
      .filter((x: { temAgua: boolean }) => agua === null || x.temAgua === (agua === 'true'))
      .filter((x: { temSombra: boolean }) => sombra === null || x.temSombra === (sombra === 'true'))
      .sort((a: { nome: string }, b: { nome: string }) => a.nome.localeCompare(b.nome));
    return enviar(res, 200, lista);
  }

  if (req.method === 'GET' && p === '/api/pontos/proximos') {
    const lat = q.get('lat');
    const lon = q.get('lon');
    if (lat === null || lon === null) return enviar(res, 400, { erro: 'Informe latitude e longitude.' });
    const la = Number(lat);
    const lo = Number(lon);
    const limite = q.get('limite') === null ? 3 : Number(q.get('limite'));
    if (!Number.isFinite(la) || la < -90 || la > 90) return enviar(res, 400, { erro: 'Latitude inválida.' });
    if (!Number.isFinite(lo) || lo < -180 || lo > 180) return enviar(res, 400, { erro: 'Longitude inválida.' });
    if (!Number.isInteger(limite) || limite < 1 || limite > 20) {
      return enviar(res, 400, { erro: 'O limite deve estar entre 1 e 20.' });
    }
    const lista = pontos()
      .filter((x: { temAgua: boolean; temSombra: boolean }) => x.temAgua || x.temSombra)
      .map((x: { latitude: number; longitude: number }) => ({ ...x, distanciaKm: haversine(la, lo, x.latitude, x.longitude) }))
      .sort(
        (a: { distanciaKm: number; nome: string }, b: { distanciaKm: number; nome: string }) =>
          a.distanciaKm - b.distanciaKm || a.nome.localeCompare(b.nome),
      )
      .slice(0, limite);
    return enviar(res, 200, lista);
  }

  const mPonto = /^\/api\/pontos\/([^/]+)$/.exec(p);
  if (req.method === 'GET' && mPonto) {
    if (!GUID.test(mPonto[1]!)) return enviar(res, 404); // restrição de rota {id:guid}
    const x = pontos().find((y: { id: string }) => y.id === mPonto[1]);
    return x ? enviar(res, 200, x) : enviar(res, 404, { erro: 'Ponto de refresco não encontrado.' });
  }

  if (req.method === 'GET' && p === '/api/previsoes/amanha') {
    if (cenario === 'sem-previsao') return enviar(res, 404, { erro: 'Previsão para amanhã indisponível.' });
    const prob = DADOS.previsao.probabilidade;
    const nivel = classificarProbabilidade(prob);
    return enviar(res, 200, {
      id: '00000000-0000-4000-8000-0000000000aa',
      dataReferencia: amanhaSaoPaulo(),
      probabilidade: prob,
      probabilidadePercentual: Math.round(prob * 10000) / 100,
      nivel,
      mensagem: mensagemPrevisao(nivel),
      versaoModelo: DADOS.previsao.versaoModelo,
      criadoEm: new Date().toISOString(),
    });
  }

  return enviar(res, 404);
}

export function iniciarServidor(porta: number) {
  const srv = createServer((req, res) => {
    rotear(req, res).catch(() => enviar(res, 500, { erro: 'Erro interno do servidor simulado.' }));
  });
  return new Promise<typeof srv>((ok) => srv.listen(porta, '0.0.0.0', () => ok(srv)));
}

const ehExecucaoDireta =
  !!process.argv[1] && resolve(fileURLToPath(import.meta.url)).toLowerCase() === resolve(process.argv[1]).toLowerCase();
if (ehExecucaoDireta) {
  const porta = Number(process.env.PORTA ?? 5128);
  iniciarServidor(porta).then(() => {
    console.log('==============================================================');
    console.log(' Sereno SP - SERVIDOR DE CONTRATO SIMULADO (dados sintéticos)');
    console.log(` http://0.0.0.0:${porta}   cenário: ${cenario}`);
    console.log(' Isto NÃO é a Sereno.Api. Use-o só para demonstração/testes.');
    console.log('==============================================================');
  });
}
