import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

/**
 * Executa uma carga assíncrona ao abrir a tela e a cada retorno a ela.
 * Expõe estados de "primeira carga" e "atualizando" (puxar para atualizar).
 */
export function useCarregamento<T>(carregar: () => Promise<T>) {
  const [dados, setDados] = useState<T | null>(null);
  const [carregandoInicial, setCarregandoInicial] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [falhou, setFalhou] = useState(false);
  const emAndamento = useRef(false);

  const executar = useCallback(
    async (manual: boolean) => {
      if (emAndamento.current) return;
      emAndamento.current = true;
      if (manual) setAtualizando(true);
      try {
        const r = await carregar();
        setDados(r);
        setFalhou(false);
      } catch {
        setFalhou(true);
      } finally {
        emAndamento.current = false;
        setCarregandoInicial(false);
        setAtualizando(false);
      }
    },
    [carregar],
  );

  useFocusEffect(
    useCallback(() => {
      void executar(false);
    }, [executar]),
  );

  return {
    dados,
    carregandoInicial,
    atualizando,
    falhou,
    recarregar: () => executar(true),
  };
}
