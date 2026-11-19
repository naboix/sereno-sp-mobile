import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { Botao } from '@/components/Botao';
import { Cartao } from '@/components/Cartao';
import { Confirmacao } from '@/components/Confirmacao';
import { Carregando, ErroTela, Vazio } from '@/components/Estados';
import { FaixaOrigem } from '@/components/FaixaOrigem';
import { LinhaInfo } from '@/components/LinhaInfo';
import { SeloRisco } from '@/components/SeloRisco';
import { Tela } from '@/components/Tela';
import { Texto } from '@/components/Texto';
import { useApp } from '@/context/AppContext';
import { contarCheckinsHoje, listarCheckins, registrarBebiAgua } from '@/db/repositorios';
import { proximoLembrete } from '@/domain/hidratacao';
import {
  apresentarRisco,
  classificarAtualidade,
  descreverTempoDecorrido,
  formatarDataCivil,
  formatarDataHora,
  formatarHora,
  formatarPercentual,
  formatarTemperatura,
} from '@/domain/risco';
import { useCarregamento } from '@/hooks/useCarregamento';
import { useConfirmacao } from '@/hooks/useConfirmacao';
import { carregarPainelInicio } from '@/services/dados';
import { ESPACO } from '@/theme/tema';

export default function Inicio() {
  const router = useRouter();
  const { db, api, config, perfil, cores, preferencias } = useApp();
  const { mensagem, confirmar } = useConfirmacao();
  const [registrando, setRegistrando] = useState(false);

  const carregar = useCallback(async () => {
    const [painel, hoje, ultimos] = await Promise.all([
      carregarPainelInicio(db, api, config.modo, config.totemCodigo),
      contarCheckinsHoje(db),
      listarCheckins(db, 1),
    ]);
    return { painel, hoje, ultimo: ultimos[0]?.registradoEm ?? null };
  }, [db, api, config.modo, config.totemCodigo]);

  const { dados, carregandoInicial, atualizando, recarregar } = useCarregamento(carregar);

  async function bebiAgua() {
    setRegistrando(true);
    try {
      const c = await registrarBebiAgua(db);
      confirmar(`Registrado! Você bebeu água às ${formatarHora(c.registradoEm)}.`);
      await recarregar();
    } finally {
      setRegistrando(false);
    }
  }

  if (carregandoInicial && !dados) {
    return (
      <Tela titulo="Sereno SP">
        <Carregando mensagem="Buscando o nível de calor..." />
      </Tela>
    );
  }

  const painel = dados?.painel;
  const leitura = painel?.leitura.resultado;
  const previsao = painel?.previsao.resultado;
  const totemCodigo = painel?.totem.resultado?.dado.codigo ?? config.totemCodigo;
  const lembrete = preferencias.lembreteAguaAtivo
    ? proximoLembrete(dados?.ultimo ?? null, preferencias.lembreteIntervaloMin)
    : null;

  return (
    <Tela
      titulo={`Olá, ${perfil?.apelido ?? 'cidadão'}`}
      subtitulo={`Sereno SP · Região monitorada: Santana${totemCodigo ? ` · Totem ${totemCodigo}` : ''}`}
      atualizando={atualizando}
      aoAtualizar={recarregar}
    >
      {/* ---------------- CALOR AGORA ---------------- */}
      <Cartao testID="cartao-agora">
        <Texto variante="subtitulo">Calor agora</Texto>
        {leitura ? (
          <>
            <FaixaOrigem origem={leitura.origem} obtidoEm={leitura.obtidoEm} />
            <SeloRisco nivel={leitura.dado.nivel} tamanho="grande" />
            {classificarAtualidade(leitura.dado.coletadaEm) !== 'atual' ? (
              <View
                style={[estilos.aviso, { backgroundColor: cores.avisoFundo, borderColor: cores.avisoTexto }]}
                accessibilityLiveRegion="polite"
                testID="aviso-leitura-antiga"
              >
                <Ionicons name="time" size={24} color={cores.avisoTexto} />
                <Texto variante="apoio" negrito cor={cores.avisoTexto} style={{ flex: 1 }}>
                  Medição antiga: feita {descreverTempoDecorrido(leitura.dado.coletadaEm)}. Pode não mostrar o calor
                  de agora.
                </Texto>
              </View>
            ) : null}
            <Texto>{apresentarRisco(leitura.dado.nivel).orientacao}</Texto>
            <View style={estilos.grade}>
              <LinhaInfo icone="thermometer" rotulo="Temperatura" valor={formatarTemperatura(leitura.dado.temperatura)} />
              <LinhaInfo icone="water-outline" rotulo="Umidade do ar" valor={formatarPercentual(leitura.dado.umidade)} />
              <LinhaInfo
                icone="body"
                rotulo="Sensação de calor no corpo (índice de calor)"
                valor={formatarTemperatura(leitura.dado.indiceCalor)}
              />
              <LinhaInfo icone="time-outline" rotulo="Horário da medição" valor={formatarDataHora(leitura.dado.coletadaEm)} />
            </View>
            {leitura.dado.nivel === 'Perigo' ? (
              <Botao
                rotulo="Passou mal? Ligue 192 (SAMU)"
                icone="call"
                variante="perigo"
                aoPressionar={() => void Linking.openURL('tel:192')}
                dica="Abre o discador do celular com o número 192"
              />
            ) : null}
          </>
        ) : painel?.leitura.erro?.tipo === 'nao_encontrado' ? (
          <Vazio
            titulo="O totem ainda não enviou medições"
            detalhe="Assim que houver uma medição, ela aparece aqui."
            icone="hourglass-outline"
          />
        ) : (
          <ErroTela
            titulo={painel?.leitura.erro?.message ?? 'Não foi possível buscar a medição.'}
            detalhe="Ainda não há medição salva neste celular. Verifique a internet e tente de novo."
            aoTentarDeNovo={recarregar}
          />
        )}
      </Cartao>

      <Botao
        rotulo="Onde me refrescar"
        icone="navigate"
        aoPressionar={() => router.push('/pontos')}
        dica="Abre a lista de pontos com sombra e água"
        testID="botao-onde-refrescar"
      />

      {/* ---------------- PREVISÃO DE AMANHÃ ---------------- */}
      <Cartao testID="cartao-amanha">
        <Texto variante="subtitulo">Amanhã</Texto>
        {previsao ? (
          <>
            <FaixaOrigem origem={previsao.origem} obtidoEm={previsao.obtidoEm} />
            <SeloRisco
              nivel={previsao.dado.nivel}
              rotulo={
                previsao.dado.nivel === 'Perigo'
                  ? 'Amanhã: calor perigoso'
                  : previsao.dado.nivel === 'Atencao'
                    ? 'Amanhã: pode ser muito quente'
                    : 'Amanhã: sem alerta de calor'
              }
            />
            <Texto>{previsao.dado.mensagem}</Texto>
            <LinhaInfo
              icone="stats-chart"
              rotulo={`Chance de calor extremo em ${formatarDataCivil(previsao.dado.dataReferencia)}`}
              valor={formatarPercentual(previsao.dado.probabilidadePercentual)}
            />
            <Texto variante="apoio" cor={cores.textoSecundario}>
              Estimativa do modelo de previsão ({previsao.dado.versaoModelo}). É uma previsão, não uma certeza.
            </Texto>
          </>
        ) : painel?.previsao.erro?.tipo === 'nao_encontrado' ? (
          <Vazio
            titulo="Previsão indisponível"
            detalhe="Ainda não há previsão de calor para amanhã."
            icone="calendar-outline"
          />
        ) : (
          <ErroTela
            titulo="Previsão indisponível no momento"
            detalhe={painel?.previsao.erro?.message}
            aoTentarDeNovo={recarregar}
          />
        )}
      </Cartao>

      {/* ---------------- HIDRATAÇÃO ---------------- */}
      <Cartao testID="cartao-agua">
        <Texto variante="subtitulo">Beber água</Texto>
        <Texto accessibilityLiveRegion="polite">
          Hoje você registrou água <Texto negrito>{dados?.hoje ?? 0}</Texto>{' '}
          {(dados?.hoje ?? 0) === 1 ? 'vez' : 'vezes'}.
        </Texto>
        {dados?.ultimo ? (
          <Texto variante="apoio" cor={cores.textoSecundario}>
            Último registro: {formatarDataHora(dados.ultimo)}.
          </Texto>
        ) : null}
        {lembrete ? (
          <View style={estilos.linha} testID="lembrete-agua">
            <Ionicons name="alarm-outline" size={24} color={lembrete.atrasado ? cores.erroTexto : cores.primaria} />
            <Texto negrito cor={lembrete.atrasado ? cores.erroTexto : cores.texto} style={{ flex: 1 }}>
              {lembrete.atrasado
                ? 'Já está na hora de beber água de novo.'
                : `Próximo copo de água sugerido às ${formatarHora(lembrete.horario.toISOString())}.`}
            </Texto>
          </View>
        ) : null}
        <Botao
          rotulo="Bebi água"
          icone="water"
          aoPressionar={bebiAgua}
          carregando={registrando}
          dica="Registra no celular que você bebeu água agora. Funciona sem internet."
          testID="botao-bebi-agua"
        />
        <Confirmacao mensagem={mensagem} />
        <Botao
          rotulo="Ver meus registros"
          icone="list"
          variante="secundario"
          aoPressionar={() => router.push('/hidratacao')}
        />
      </Cartao>
    </Tela>
  );
}

const estilos = StyleSheet.create({
  grade: { gap: ESPACO.xs },
  aviso: { flexDirection: 'row', alignItems: 'center', gap: ESPACO.s, borderWidth: 2, borderRadius: 12, padding: ESPACO.s + 4 },
  linha: { flexDirection: 'row', alignItems: 'center', gap: ESPACO.s },
});
