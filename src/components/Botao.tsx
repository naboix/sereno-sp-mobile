import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useApp } from '@/context/AppContext';
import { ALVO_TOQUE_MIN, ESPACO, RAIO } from '@/theme/tema';
import { Texto } from './Texto';

type Variante = 'primario' | 'secundario' | 'perigo';

interface Props {
  rotulo: string;
  aoPressionar: () => void;
  icone?: React.ComponentProps<typeof Ionicons>['name'];
  variante?: Variante;
  desabilitado?: boolean;
  carregando?: boolean;
  dica?: string;
  testID?: string;
}

/** Botão amplo (altura mínima 56), sempre com texto; ícone é complementar. */
export function Botao({
  rotulo,
  aoPressionar,
  icone,
  variante = 'primario',
  desabilitado,
  carregando,
  dica,
  testID,
}: Props) {
  const { cores } = useApp();
  const inativo = desabilitado || carregando;

  const fundo =
    variante === 'primario'
      ? cores.primaria
      : variante === 'perigo'
        ? cores.risco.Perigo.fundo
        : cores.superficie;
  const texto =
    variante === 'primario'
      ? cores.textoSobrePrimaria
      : variante === 'perigo'
        ? cores.risco.Perigo.texto
        : cores.primaria;

  return (
    <Pressable
      testID={testID}
      onPress={aoPressionar}
      disabled={inativo}
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      accessibilityHint={dica}
      accessibilityState={{ disabled: !!inativo, busy: !!carregando }}
      hitSlop={8}
      style={({ pressed }) => [
        estilos.base,
        {
          backgroundColor: fundo,
          borderColor: variante === 'secundario' ? cores.primaria : fundo,
          opacity: inativo ? 0.55 : pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      <View style={estilos.conteudo}>
        {carregando ? (
          <ActivityIndicator color={texto} />
        ) : icone ? (
          <Ionicons name={icone} size={26} color={texto} accessibilityElementsHidden importantForAccessibility="no" />
        ) : null}
        <Texto negrito cor={texto} style={estilos.rotulo}>
          {rotulo}
        </Texto>
      </View>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  base: {
    minHeight: ALVO_TOQUE_MIN,
    borderRadius: RAIO.m,
    borderWidth: 2,
    paddingHorizontal: ESPACO.l,
    paddingVertical: ESPACO.s + 4,
    justifyContent: 'center',
  },
  conteudo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: ESPACO.s },
  rotulo: { flexShrink: 1, textAlign: 'center' },
});
