import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useApp } from '@/context/AppContext';
import { apresentarRisco } from '@/domain/risco';
import type { NivelRisco } from '@/domain/types';
import { ESPACO, RAIO } from '@/theme/tema';
import { Texto } from './Texto';

interface Props {
  nivel: NivelRisco;
  tamanho?: 'normal' | 'grande';
  /** Texto alternativo ao rótulo padrão (ex.: "Amanhã: calor perigoso"). */
  rotulo?: string;
}

/**
 * Indica o risco por COR + ÍCONE + TEXTO, para que pessoas com
 * daltonismo ou baixa visão não dependam só da cor.
 */
export function SeloRisco({ nivel, tamanho = 'normal', rotulo }: Props) {
  const { cores } = useApp();
  const a = apresentarRisco(nivel);
  const c = cores.risco[nivel];
  const grande = tamanho === 'grande';
  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={rotulo ? `${rotulo}. ${a.descricaoAcessivel}` : a.descricaoAcessivel}
      style={[
        estilos.base,
        { backgroundColor: c.fundo, borderColor: c.borda, paddingVertical: grande ? ESPACO.m : ESPACO.s },
      ]}
      testID={`selo-risco-${nivel}`}
    >
      <Ionicons name={a.icone} size={grande ? 40 : 26} color={c.texto} />
      <Texto variante={grande ? 'subtitulo' : 'corpo'} negrito cor={c.texto} style={estilos.texto}>
        {rotulo ?? a.rotulo}
      </Texto>
    </View>
  );
}

const estilos = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ESPACO.s + 2,
    borderWidth: 2,
    borderRadius: RAIO.m,
    paddingHorizontal: ESPACO.m,
    alignSelf: 'stretch',
  },
  texto: { flexShrink: 1 },
});
