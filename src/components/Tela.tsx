import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '@/context/AppContext';
import { ESPACO } from '@/theme/tema';
import { Texto } from './Texto';

interface Props {
  titulo?: string;
  subtitulo?: string;
  children: React.ReactNode;
  atualizando?: boolean;
  aoAtualizar?: () => void;
  /** Tela dentro de Stack com cabeçalho nativo: não reaplica a margem superior. */
  semMargemTopo?: boolean;
}

/** Estrutura padrão: área segura, rolagem, "puxar para atualizar" e título. */
export function Tela({ titulo, subtitulo, children, atualizando, aoAtualizar, semMargemTopo }: Props) {
  const { cores } = useApp();
  return (
    <SafeAreaView
      edges={semMargemTopo ? ['left', 'right'] : ['top', 'left', 'right']}
      style={[estilos.area, { backgroundColor: cores.fundo }]}
    >
      <ScrollView
        contentContainerStyle={estilos.conteudo}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          aoAtualizar ? (
            <RefreshControl
              refreshing={!!atualizando}
              onRefresh={aoAtualizar}
              colors={[cores.primaria]}
              tintColor={cores.primaria}
              accessibilityLabel="Puxe para atualizar"
            />
          ) : undefined
        }
      >
        {titulo ? (
          <View style={estilos.cabecalho}>
            <Texto variante="titulo">{titulo}</Texto>
            {subtitulo ? <Texto cor={cores.textoSecundario}>{subtitulo}</Texto> : null}
          </View>
        ) : null}
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  area: { flex: 1 },
  conteudo: { padding: ESPACO.m + 4, gap: ESPACO.m, paddingBottom: ESPACO.xl * 2 },
  cabecalho: { gap: ESPACO.xs },
});
