import { useSQLiteContext } from 'expo-sqlite';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { CONFIG, type ConfiguracaoApp } from '@/config/env';
import { apagarTodosOsDados, type BancoLocal } from '@/db/database';
import {
  obterPerfil,
  obterPreferencias,
  PREFERENCIAS_PADRAO,
  salvarPerfil,
  salvarPreferencias,
  type Perfil,
  type Preferencias,
} from '@/db/repositorios';
import { criarClienteApi, type ClienteApi } from '@/services/serenoApi';
import { criarClienteMock } from '@/services/mock/mockApi';
import { CORES_CONTRASTE_REFORCADO, CORES_PADRAO, ESCALA_FONTE, type Cores } from '@/theme/tema';

interface ValorApp {
  db: BancoLocal;
  config: ConfiguracaoApp;
  api: ClienteApi;
  carregado: boolean;
  perfil: Perfil | null;
  preferencias: Preferencias;
  cores: Cores;
  escalaFonte: number;
  atualizarPerfil: (p: Perfil) => Promise<void>;
  atualizarPreferencias: (p: Partial<Preferencias>) => Promise<void>;
  apagarDadosLocais: () => Promise<void>;
}

const Contexto = createContext<ValorApp | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const db = useSQLiteContext();
  const [carregado, setCarregado] = useState(false);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [preferencias, setPreferencias] = useState<Preferencias>(PREFERENCIAS_PADRAO);

  const api = useMemo<ClienteApi>(
    () =>
      CONFIG.modo === 'mock'
        ? criarClienteMock('perigo')
        : criarClienteApi({ baseUrl: CONFIG.apiUrl, timeoutMs: CONFIG.timeoutMs }),
    [],
  );

  useEffect(() => {
    let ativo = true;
    (async () => {
      const [p, pr] = await Promise.all([obterPerfil(db), obterPreferencias(db)]);
      if (!ativo) return;
      setPerfil(p);
      setPreferencias(pr);
      setCarregado(true);
    })();
    return () => {
      ativo = false;
    };
  }, [db]);

  const atualizarPerfil = useCallback(
    async (p: Perfil) => {
      await salvarPerfil(db, p);
      setPerfil(p);
    },
    [db],
  );

  const atualizarPreferencias = useCallback(
    async (parcial: Partial<Preferencias>) => {
      const nova = { ...preferencias, ...parcial };
      await salvarPreferencias(db, nova);
      setPreferencias(nova);
    },
    [db, preferencias],
  );

  const apagarDadosLocais = useCallback(async () => {
    await apagarTodosOsDados(db);
    setPerfil(null);
    setPreferencias(PREFERENCIAS_PADRAO);
  }, [db]);

  const valor = useMemo<ValorApp>(
    () => ({
      db,
      config: CONFIG,
      api,
      carregado,
      perfil,
      preferencias,
      cores: preferencias.contrasteReforcado ? CORES_CONTRASTE_REFORCADO : CORES_PADRAO,
      escalaFonte: ESCALA_FONTE[preferencias.tamanhoFonte],
      atualizarPerfil,
      atualizarPreferencias,
      apagarDadosLocais,
    }),
    [db, api, carregado, perfil, preferencias, atualizarPerfil, atualizarPreferencias, apagarDadosLocais],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useApp(): ValorApp {
  const v = useContext(Contexto);
  if (!v) throw new Error('useApp precisa estar dentro de <AppProvider>.');
  return v;
}
