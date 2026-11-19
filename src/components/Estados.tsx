import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useApp } from '@/context/AppContext';
import { ESPACO, RAIO } from '@/theme/tema';
import { Botao } from './Botao';
import { Texto } from './Texto';

export function Carregando({ mensagem = 'Carregando informações...' }: { mensagem?: string }) {
  const { cores } = useApp();
  return (
    <View
      style={estilos.centro}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={mensagem}
      accessibilityState={{ busy: true }}
      testID="estado-carregando"
    >
      <ActivityIndicator size="large" color={cores.primaria} />
      <Texto cor={cores.textoSecundario} centro>
        {mensagem}
      </Texto>
      <View style={[estilos.esqueleto, { backgroundColor: cores.borda + '33' }]} />
      <View style={[estilos.esqueleto, { backgroundColor: cores.borda + '22', width: '70%' }]} />
    </View>
  );
}

interface ErroProps {
  titulo: string;
  detalhe?: string;
  aoTentarDeNovo?: () => void;
}

export function ErroTela({ titulo, detalhe, aoTentarDeNovo }: ErroProps) {
  const { cores } = useApp();
  return (
    <View
      style={[estilos.caixa, { backgroundColor: cores.erroFundo, borderColor: cores.erroTexto }]}
      accessibilityLiveRegion="assertive"
      testID="estado-erro"
    >
      <View style={estilos.linha}>
        <Ionicons name="alert-circle" size={28} color={cores.erroTexto} />
        <Texto negrito cor={cores.erroTexto} style={estilos.flex}>
          {titulo}
        </Texto>
      </View>
      {detalhe ? <Texto cor={cores.erroTexto}>{detalhe}</Texto> : null}
      {aoTentarDeNovo ? (
        <Botao rotulo="Tentar de novo" icone="refresh" variante="secundario" aoPressionar={aoTentarDeNovo} />
      ) : null}
    </View>
  );
}

interface VazioProps {
  titulo: string;
  detalhe?: string;
  icone?: React.ComponentProps<typeof Ionicons>['name'];
}

export function Vazio({ titulo, detalhe, icone = 'sunny-outline' }: VazioProps) {
  const { cores } = useApp();
  return (
    <View
      style={[estilos.caixa, { backgroundColor: cores.superficie, borderColor: cores.borda }]}
      accessible
      accessibilityLabel={`${titulo}. ${detalhe ?? ''}`}
      testID="estado-vazio"
    >
      <Ionicons name={icone} size={36} color={cores.primaria} style={{ alignSelf: 'center' }} />
      <Texto negrito centro>
        {titulo}
      </Texto>
      {detalhe ? (
        <Texto centro cor={cores.textoSecundario}>
          {detalhe}
        </Texto>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  centro: { padding: ESPACO.l, gap: ESPACO.m, alignItems: 'center' },
  esqueleto: { height: 20, width: '90%', borderRadius: RAIO.s },
  caixa: { borderWidth: 2, borderRadius: RAIO.m, padding: ESPACO.m, gap: ESPACO.s + 4 },
  linha: { flexDirection: 'row', alignItems: 'center', gap: ESPACO.s },
  flex: { flex: 1 },
});
