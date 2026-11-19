import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useCallback } from 'react';
import { Linking, Platform, StyleSheet, View } from 'react-native';
import { Botao } from '@/components/Botao';
import { Cartao } from '@/components/Cartao';
import { Recurso } from '@/components/CartaoPonto';
import { Confirmacao } from '@/components/Confirmacao';
import { Carregando, ErroTela } from '@/components/Estados';
import { FaixaOrigem } from '@/components/FaixaOrigem';
import { LinhaInfo } from '@/components/LinhaInfo';
import { Tela } from '@/components/Tela';
import { Texto } from '@/components/Texto';
import { useApp } from '@/context/AppContext';
import { adicionarFavorito, obterFavorito, removerFavorito } from '@/db/repositorios';
import { formatarDistancia } from '@/domain/geo';
import type { PontoRefrescoDto, ResultadoComOrigem } from '@/domain/types';
import { useCarregamento } from '@/hooks/useCarregamento';
import { useConfirmacao } from '@/hooks/useConfirmacao';
import { ErroApi } from '@/services/http';
import { origemDaResposta } from '@/services/dados';
import { ESPACO } from '@/theme/tema';

const NAO_INFORMADO = 'Não informado pela API do Sereno SP';

export default function DetalhePonto() {
  const { id = '', distancia = '' } = useLocalSearchParams<{ id: string; distancia?: string }>();
  const { db, api, config, cores } = useApp();
  const { mensagem, confirmar } = useConfirmacao();

  const carregar = useCallback(async () => {
    const fav = await obterFavorito(db, id);
    let resultado: ResultadoComOrigem<PontoRefrescoDto> | null = null;
    let erro: ErroApi | null = null;
    try {
      const r = await api.buscarPonto(id);
      resultado = { dado: r.dado, origem: origemDaResposta(config.modo, r.simulado), obtidoEm: new Date().toISOString() };
    } catch (e) {
      erro = e instanceof ErroApi ? e : new ErroApi('desconhecido', null);
      // Sem rede: o favorito salvo serve de cópia offline do ponto.
      if (fav && erro.tipo !== 'nao_encontrado') {
        resultado = { dado: fav, origem: 'cache', obtidoEm: fav.salvoEm };
      }
    }
    return { resultado, erro, favorito: fav !== null };
  }, [db, api, config.modo, id]);

  const { dados, carregandoInicial, recarregar } = useCarregamento(carregar);

  async function alternarFavorito() {
    const p = dados?.resultado?.dado;
    if (!p) return;
    if (dados.favorito) {
      await removerFavorito(db, p.id);
      confirmar('Removido dos favoritos.');
    } else {
      await adicionarFavorito(db, p);
      confirmar('Salvo nos favoritos. Disponível mesmo sem internet.');
    }
    await recarregar();
  }

  function abrirMapa(p: PontoRefrescoDto) {
    const rotulo = encodeURIComponent(p.nome);
    const url =
      Platform.OS === 'ios'
        ? `maps:0,0?q=${rotulo}@${p.latitude},${p.longitude}`
        : Platform.OS === 'android'
          ? `geo:${p.latitude},${p.longitude}?q=${p.latitude},${p.longitude}(${rotulo})`
          : `https://www.openstreetmap.org/?mlat=${p.latitude}&mlon=${p.longitude}#map=18/${p.latitude}/${p.longitude}`;
    void Linking.openURL(url).catch(() => confirmar('Não foi possível abrir o mapa neste aparelho.'));
  }

  if (carregandoInicial && !dados) {
    return (
      <Tela semMargemTopo>
        <Carregando mensagem="Abrindo o ponto de refresco..." />
      </Tela>
    );
  }

  const r = dados?.resultado;
  if (!r) {
    return (
      <Tela semMargemTopo>
        <ErroTela
          titulo={dados?.erro?.tipo === 'nao_encontrado' ? 'Este ponto não existe mais.' : dados?.erro?.message ?? 'Erro ao abrir o ponto.'}
          detalhe={dados?.erro?.tipo === 'nao_encontrado' ? 'Ele pode ter sido removido do cadastro.' : 'Verifique a internet e tente de novo.'}
          aoTentarDeNovo={dados?.erro?.tipo === 'nao_encontrado' ? undefined : recarregar}
        />
      </Tela>
    );
  }

  const p = r.dado;
  const km = distancia !== '' ? Number(distancia) : p.distanciaKm;

  return (
    <Tela semMargemTopo>
      <Stack.Screen options={{ title: 'Ponto de refresco' }} />
      <FaixaOrigem origem={r.origem} obtidoEm={r.obtidoEm} />
      <Texto variante="titulo">{p.nome}</Texto>

      <View style={estilos.recursos}>
        <Recurso tem={p.temAgua} rotulo="Água" icone="water" />
        <Recurso tem={p.temSombra} rotulo="Sombra" icone="umbrella" />
      </View>

      <Cartao>
        <LinhaInfo icone="location" rotulo="Endereço" valor={p.endereco} />
        <LinhaInfo icone="walk" rotulo="Distância" valor={formatarDistancia(km)} />
        <LinhaInfo icone="time-outline" rotulo="Horário de funcionamento" valor={NAO_INFORMADO} indisponivel />
        <LinhaInfo icone="accessibility-outline" rotulo="Informações de acesso" valor={NAO_INFORMADO} indisponivel />
        <Texto variante="apoio" cor={cores.textoSecundario}>
          Confirme o horário no local antes de se deslocar em dias de calor forte.
        </Texto>
      </Cartao>

      <Botao rotulo="Abrir no mapa" icone="map" aoPressionar={() => abrirMapa(p)} dica="Abre o aplicativo de mapas do celular" />
      <Botao
        rotulo={dados.favorito ? 'Remover dos favoritos' : 'Salvar nos favoritos'}
        icone={dados.favorito ? 'star' : 'star-outline'}
        variante="secundario"
        aoPressionar={() => void alternarFavorito()}
        testID="detalhe-favoritar"
      />
      <Confirmacao mensagem={mensagem} />
    </Tela>
  );
}

const estilos = StyleSheet.create({
  recursos: { flexDirection: 'row', flexWrap: 'wrap', gap: ESPACO.s },
});
