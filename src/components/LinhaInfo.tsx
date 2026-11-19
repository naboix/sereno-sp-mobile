import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useApp } from '@/context/AppContext';
import { ESPACO } from '@/theme/tema';
import { Texto } from './Texto';

interface Props {
  icone: React.ComponentProps<typeof Ionicons>['name'];
  rotulo: string;
  valor: string;
  /** Valor ausente/indisponível: exibido em itálico e cor secundária. */
  indisponivel?: boolean;
}

/** Linha "ícone + rótulo + valor", lida pelo leitor de tela como uma frase só. */
export function LinhaInfo({ icone, rotulo, valor, indisponivel }: Props) {
  const { cores } = useApp();
  return (
    <View style={estilos.linha} accessible accessibilityLabel={`${rotulo}: ${valor}`}>
      <Ionicons name={icone} size={26} color={cores.primaria} />
      <View style={{ flex: 1 }}>
        <Texto variante="apoio" cor={cores.textoSecundario}>
          {rotulo}
        </Texto>
        <Texto
          negrito={!indisponivel}
          cor={indisponivel ? cores.textoSecundario : cores.texto}
          style={indisponivel ? { fontStyle: 'italic' } : undefined}
        >
          {valor}
        </Texto>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'center', gap: ESPACO.m, paddingVertical: ESPACO.xs },
});
