import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useApp } from '@/context/AppContext';
import { formatarDistancia } from '@/domain/geo';
import type { PontoRefrescoDto } from '@/domain/types';
import { ALVO_TOQUE_MIN, ESPACO, RAIO } from '@/theme/tema';
import { Botao } from './Botao';
import { Cartao } from './Cartao';
import { Texto } from './Texto';

interface Props {
  ponto: PontoRefrescoDto;
  favorito: boolean;
  aoAlternarFavorito: () => void;
  aoAbrir: () => void;
}

export function Recurso({ tem, rotulo, icone }: { tem: boolean; rotulo: string; icone: React.ComponentProps<typeof Ionicons>['name'] }) {
  const { cores } = useApp();
  const texto = `${rotulo}: ${tem ? 'sim' : 'não'}`;
  return (
    <View
      accessible
      accessibilityLabel={texto}
      style={[
        estilos.recurso,
        { borderColor: tem ? cores.risco.Normal.borda : cores.borda, backgroundColor: tem ? cores.risco.Normal.fundo : cores.superficie },
      ]}
    >
      <Ionicons name={tem ? icone : 'close-circle-outline'} size={22} color={tem ? cores.risco.Normal.texto : cores.textoSecundario} />
      <Texto variante="apoio" negrito cor={tem ? cores.risco.Normal.texto : cores.textoSecundario}>
        {texto}
      </Texto>
    </View>
  );
}

export function CartaoPonto({ ponto, favorito, aoAlternarFavorito, aoAbrir }: Props) {
  const { cores } = useApp();
  return (
    <Cartao testID={`ponto-${ponto.id}`}>
      <View style={estilos.topo}>
        <View style={{ flex: 1, gap: 2 }}>
          <Texto negrito variante="subtitulo">
            {ponto.nome}
          </Texto>
          <Texto cor={cores.textoSecundario}>{ponto.endereco}</Texto>
        </View>
        <Pressable
          onPress={aoAlternarFavorito}
          accessibilityRole="button"
          accessibilityLabel={favorito ? `Remover ${ponto.nome} dos favoritos` : `Salvar ${ponto.nome} nos favoritos`}
          accessibilityState={{ selected: favorito }}
          hitSlop={8}
          style={estilos.favorito}
          testID={`favoritar-${ponto.id}`}
        >
          <Ionicons name={favorito ? 'star' : 'star-outline'} size={32} color={favorito ? cores.risco.Atencao.borda : cores.textoSecundario} />
          <Texto variante="apoio" negrito cor={favorito ? cores.avisoTexto : cores.textoSecundario}>
            {favorito ? 'Salvo' : 'Salvar'}
          </Texto>
        </Pressable>
      </View>

      <View style={estilos.linha} accessible accessibilityLabel={`Distância: ${formatarDistancia(ponto.distanciaKm)}`}>
        <Ionicons name="walk" size={24} color={cores.primaria} />
        <Texto negrito>{formatarDistancia(ponto.distanciaKm)}</Texto>
      </View>

      <View style={estilos.recursos}>
        <Recurso tem={ponto.temAgua} rotulo="Água" icone="water" />
        <Recurso tem={ponto.temSombra} rotulo="Sombra" icone="umbrella" />
      </View>

      <Botao rotulo="Ver detalhes" icone="information-circle" variante="secundario" aoPressionar={aoAbrir} />
    </Cartao>
  );
}

const estilos = StyleSheet.create({
  topo: { flexDirection: 'row', gap: ESPACO.s, alignItems: 'flex-start' },
  favorito: { minWidth: ALVO_TOQUE_MIN, minHeight: ALVO_TOQUE_MIN, alignItems: 'center', justifyContent: 'center' },
  linha: { flexDirection: 'row', alignItems: 'center', gap: ESPACO.s },
  recursos: { flexDirection: 'row', flexWrap: 'wrap', gap: ESPACO.s },
  recurso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ESPACO.xs + 2,
    borderWidth: 1.5,
    borderRadius: RAIO.s,
    paddingHorizontal: ESPACO.s + 2,
    paddingVertical: ESPACO.xs + 2,
  },
});
