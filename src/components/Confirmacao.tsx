import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useApp } from '@/context/AppContext';
import { ESPACO, RAIO } from '@/theme/tema';
import { Texto } from './Texto';

/** Caixa de confirmação de ação ("Registrado!"), anunciada ao leitor de tela. */
export function Confirmacao({ mensagem }: { mensagem: string | null }) {
  const { cores } = useApp();
  if (!mensagem) return null;
  const c = cores.risco.Normal;
  return (
    <View
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      testID="confirmacao"
      style={[estilos.base, { backgroundColor: c.fundo, borderColor: c.borda }]}
    >
      <Ionicons name="checkmark-circle" size={26} color={c.texto} />
      <Texto negrito cor={c.texto} style={{ flex: 1 }}>
        {mensagem}
      </Texto>
    </View>
  );
}

const estilos = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ESPACO.s,
    padding: ESPACO.m,
    borderWidth: 2,
    borderRadius: RAIO.m,
  },
});
