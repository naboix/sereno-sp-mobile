import React from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';
import { useApp } from '@/context/AppContext';
import { ESPACO, RAIO } from '@/theme/tema';

export function Cartao({ style, ...rest }: ViewProps) {
  const { cores } = useApp();
  return (
    <View
      style={[estilos.base, { backgroundColor: cores.superficie, borderColor: cores.borda }, style]}
      {...rest}
    />
  );
}

const estilos = StyleSheet.create({
  base: {
    borderRadius: RAIO.l,
    borderWidth: 1,
    padding: ESPACO.m + 4,
    gap: ESPACO.s,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
});
