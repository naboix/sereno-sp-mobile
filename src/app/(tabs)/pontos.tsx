import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Botao } from '@/components/Botao';
import { Opcoes } from '@/components/Campos';
import { Cartao } from '@/components/Cartao';
import { CartaoPonto } from '@/components/CartaoPonto';
import { Confirmacao } from '@/components/Confirmacao';
import { Carregando, ErroTela, Vazio } from '@/components/Estados';
import { FaixaOrigem } from '@/components/FaixaOrigem';
import { Tela } from '@/components/Tela';
import { Texto } from '@/components/Texto';
import { useApp } from '@/context/AppContext';
import { adicionarFavorito, listarFavoritos, removerFavorito } from '@/db/repositorios';
import { BAIRROS_REFERENCIA, bairroPorId, distanciaKm, type Coordenada } from '@/domain/geo';
import type { PontoRefrescoDto } from '@/domain/types';
import { useCarregamento } from '@/hooks/useCarregamento';
import { useConfirmacao } from '@/hooks/useConfirmacao';
import { buscarComCache } from '@/services/dados';
import { localizacaoSePermitida, pedirLocalizacao } from '@/services/localizacao';
import { ESPACO } from '@/theme/tema';

type Filtro = 'todos' | 'agua' | 'sombra';

const FILTROS: { valor: Filtro; texto: string }[] = [
  { valor: 'todos', texto: 'Todos' },
  { valor: 'agua', texto: 'Com água' },
  { valor: 'sombra', texto: 'Com sombra' },
];

type Referencia =
  | { tipo: 'gps'; coordenada: Coordenada }
  | { tipo: 'bairro'; bairroId: string; motivo: 'negada' | 'indisponivel' | 'escolha' };

export default function Pontos() {
  const router = useRouter();
  const { db, api, config, cores } = useApp();
  const { mensagem, confirmar } = useConfirmacao();
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [referencia, setReferencia] = useState<Referencia | null>(null);
  const [pedindoGps, setPedindoGps] = useState(false);

  const carregar = useCallback(async () => {
    let ref = referencia;
    if (!ref) {
      const loc = await localizacaoSePermitida();
      ref =
        loc.tipo === 'ok'
          ? { tipo: 'gps', coordenada: loc.coordenada }
          : { tipo: 'bairro', bairroId: 'santana', motivo: loc.tipo };
      setReferencia(ref);
    }
    const origem = ref.tipo === 'gps' ? ref.coordenada : bairroPorId(ref.bairroId).referencia;
    const [pontos, favoritos] = await Promise.all([
      buscarComCache<PontoRefrescoDto[]>(db, 'pontos', config.modo, () => api.pontosProximos(origem, 5)),
      listarFavoritos(db),
    ]);
    // Cache não tem distância recalculada pelo servidor: recalcula localmente
    // a partir da MESMA referência, para não mostrar distância de outra origem.
    if (pontos.resultado?.origem === 'cache') {
      pontos.resultado = {
        ...pontos.resultado,
        dado: pontos.resultado.dado.map((p) => ({ ...p, distanciaKm: distanciaKm(origem, p) })),
      };
    }
    return {
      pontos,
      favoritos: favoritos.map((f) => ({ ...f, distanciaKm: distanciaKm(origem, f) })),
      ref,
    };
  }, [db, api, config.modo, referencia]);

  const { dados, carregandoInicial, atualizando, recarregar } = useCarregamento(carregar);

  async function usarGps() {
    setPedindoGps(true);
    try {
      const loc = await pedirLocalizacao();
      setReferencia(
        loc.tipo === 'ok'
          ? { tipo: 'gps', coordenada: loc.coordenada }
          : { tipo: 'bairro', bairroId: 'santana', motivo: loc.tipo },
      );
      if (loc.tipo !== 'ok') confirmar('Sem acesso à localização. Usando a região de Santana.');
    } finally {
      setPedindoGps(false);
    }
  }

  async function alternarFavorito(p: PontoRefrescoDto, ehFav: boolean) {
    if (ehFav) {
      await removerFavorito(db, p.id);
      confirmar(`${p.nome} removido dos favoritos.`);
    } else {
      await adicionarFavorito(db, p);
      confirmar(`${p.nome} salvo nos favoritos. Ele aparece mesmo sem internet.`);
    }
    await recarregar();
  }

  const abrir = (p: PontoRefrescoDto) =>
    router.push({
      pathname: '/ponto/[id]',
      params: { id: p.id, distancia: p.distanciaKm === null ? '' : String(p.distanciaKm) },
    });

  const filtrar = (lista: PontoRefrescoDto[]) =>
    lista.filter((p) => (filtro === 'agua' ? p.temAgua : filtro === 'sombra' ? p.temSombra : true));

  const idsFav = new Set((dados?.favoritos ?? []).map((f) => f.id));
  const ref = dados?.ref ?? referencia;
  const resultado = dados?.pontos.resultado;
  const lista = filtrar(resultado?.dado ?? []);
  const favoritos = filtrar(dados?.favoritos ?? []);

  return (
    <Tela
      titulo="Onde me refrescar"
      subtitulo="Pontos com sombra e água perto de você."
      atualizando={atualizando}
      aoAtualizar={recarregar}
    >
      <Cartao>
        <Texto negrito>Perto de onde?</Texto>
        {ref?.tipo === 'gps' ? (
          <Texto cor={cores.textoSecundario} testID="ref-gps">
            Usando sua localização aproximada (cerca de 100 metros). Ela não fica salva.
          </Texto>
        ) : (
          <>
            <Texto cor={cores.textoSecundario} testID="ref-bairro">
              {ref?.tipo === 'bairro' && ref.motivo === 'negada'
                ? 'Sem permissão de localização. Mostrando pontos a partir da região escolhida:'
                : ref?.tipo === 'bairro' && ref.motivo === 'indisponivel'
                  ? 'Não foi possível obter sua localização. Mostrando pontos a partir da região escolhida:'
                  : 'Mostrando pontos a partir da região escolhida:'}
            </Texto>
            <Opcoes<string>
              rotulo="Região"
              opcoes={BAIRROS_REFERENCIA.map((b) => ({ valor: b.id, texto: b.nome }))}
              selecionado={ref?.tipo === 'bairro' ? ref.bairroId : 'santana'}
              aoSelecionar={(id) => setReferencia({ tipo: 'bairro', bairroId: id, motivo: 'escolha' })}
              testID="seletor-bairro"
            />
            <Botao
              rotulo="Usar minha localização"
              icone="locate"
              variante="secundario"
              carregando={pedindoGps}
              aoPressionar={usarGps}
              dica="Pede permissão para usar a localização aproximada do celular"
            />
          </>
        )}
      </Cartao>

      <Opcoes<Filtro> rotulo="Mostrar" opcoes={FILTROS} selecionado={filtro} aoSelecionar={setFiltro} testID="filtro-pontos" />

      <Confirmacao mensagem={mensagem} />

      <Texto variante="subtitulo">Mais próximos</Texto>
      {carregandoInicial && !dados ? (
        <Carregando mensagem="Procurando pontos de refresco..." />
      ) : resultado ? (
        <>
          <FaixaOrigem origem={resultado.origem} obtidoEm={resultado.obtidoEm} />
          {lista.length === 0 ? (
            <Vazio
              titulo="Nenhum ponto encontrado"
              detalhe={filtro === 'todos' ? 'Ainda não há pontos cadastrados nesta região.' : 'Tente mostrar todos os pontos.'}
              icone="search-outline"
            />
          ) : (
            <View style={estilos.lista}>
              {lista.map((p) => (
                <CartaoPonto
                  key={p.id}
                  ponto={p}
                  favorito={idsFav.has(p.id)}
                  aoAlternarFavorito={() => void alternarFavorito(p, idsFav.has(p.id))}
                  aoAbrir={() => abrir(p)}
                />
              ))}
            </View>
          )}
        </>
      ) : (
        <ErroTela
          titulo={dados?.pontos.erro?.message ?? 'Não foi possível buscar os pontos.'}
          detalhe="Seus pontos favoritos continuam disponíveis logo abaixo."
          aoTentarDeNovo={recarregar}
        />
      )}

      <Texto variante="subtitulo">Meus favoritos</Texto>
      <Texto variante="apoio" cor={cores.textoSecundario}>
        Ficam salvos no celular e funcionam sem internet.
      </Texto>
      {favoritos.length === 0 ? (
        <Vazio titulo="Nenhum favorito ainda" detalhe="Toque em “Salvar” em um ponto para guardá-lo aqui." icone="star-outline" />
      ) : (
        <View style={estilos.lista} testID="lista-favoritos">
          {favoritos.map((p) => (
            <CartaoPonto
              key={`fav-${p.id}`}
              ponto={p}
              favorito
              aoAlternarFavorito={() => void alternarFavorito(p, true)}
              aoAbrir={() => abrir(p)}
            />
          ))}
        </View>
      )}
    </Tela>
  );
}

const estilos = StyleSheet.create({
  lista: { gap: ESPACO.m },
});
