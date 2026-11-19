import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';
import { useApp } from '@/context/AppContext';

/**
 * Feedback de ação: mensagem visível + anúncio ao leitor de tela +
 * vibração leve (se ativada em Perfil). A mensagem some após alguns segundos.
 */
export function useConfirmacao(duracaoMs = 4000) {
  const { preferencias } = useApp();
  const [mensagem, setMensagem] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const confirmar = useCallback(
    (texto: string) => {
      setMensagem(texto);
      AccessibilityInfo.announceForAccessibility(texto);
      if (preferencias.vibrarAoConfirmar && Platform.OS !== 'web') {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      }
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setMensagem(null), duracaoMs);
    },
    [preferencias.vibrarAoConfirmar, duracaoMs],
  );

  return { mensagem, confirmar };
}
