import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useApp } from '@/context/AppContext';
import { descreverTempoDecorrido, formatarDataHora, formatarHora } from '@/domain/risco';
import type { OrigemDado } from '@/domain/types';
import { ESPACO, RAIO } from '@/theme/tema';
import { Texto } from './Texto';

interface Props {
  origem: OrigemDado;
  obtidoEm: string;
}

export function textoOrigem(origem: OrigemDado, obtidoEm: string, agora: Date = new Date()): string {
  switch (origem) {
    case 'api':
      return `Dados recebidos do Sereno SP às ${formatarHora(obtidoEm)}.`;
    case 'simulado':
      return `Servidor de demonstração: dados SIMULADOS (recebidos às ${formatarHora(obtidoEm)}).`;
    case 'mock':
      return 'Demonstração com dados SIMULADOS, sem conexão com o servidor.';
    case 'cache':
      return `Sem conexão. Mostrando dados salvos em ${formatarDataHora(obtidoEm)} (${descreverTempoDecorrido(obtidoEm, agora)}).`;
  }
}

/** Faixa que diz de onde vem o dado exibido. Obrigatória em toda tela com dados. */
export function FaixaOrigem({ origem, obtidoEm }: Props) {
  const { cores } = useApp();
  const estilo =
    origem === 'cache'
      ? { fundo: cores.avisoFundo, texto: cores.avisoTexto, icone: 'cloud-offline' as const }
      : origem === 'api'
        ? { fundo: cores.infoFundo, texto: cores.infoTexto, icone: 'cloud-done' as const }
        : { fundo: cores.avisoFundo, texto: cores.avisoTexto, icone: 'flask' as const };
  const msg = textoOrigem(origem, obtidoEm);
  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={msg}
      accessibilityLiveRegion="polite"
      testID={`faixa-origem-${origem}`}
      style={[estilos.base, { backgroundColor: estilo.fundo, borderColor: estilo.texto }]}
    >
      <Ionicons name={estilo.icone} size={22} color={estilo.texto} />
      <Texto variante="apoio" cor={estilo.texto} style={estilos.texto}>
        {msg}
      </Texto>
    </View>
  );
}

const estilos = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ESPACO.s,
    padding: ESPACO.s + 4,
    borderRadius: RAIO.s,
    borderWidth: 1,
  },
  texto: { flexShrink: 1 },
});
