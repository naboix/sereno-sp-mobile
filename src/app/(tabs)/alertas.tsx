import React, { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Opcoes } from '@/components/Campos';
import { Cartao } from '@/components/Cartao';
import { Carregando, ErroTela, Vazio } from '@/components/Estados';
import { FaixaOrigem } from '@/components/FaixaOrigem';
import { LinhaInfo } from '@/components/LinhaInfo';
import { SeloRisco } from '@/components/SeloRisco';
import { Tela } from '@/components/Tela';
import { Texto } from '@/components/Texto';
import { useApp } from '@/context/AppContext';
import {
  listarHistoricoAlertas,
  registrarAlertasVistos,
  sincronizarVigentes,
  type AlertaHistorico,
} from '@/db/repositorios';
import { apresentarRisco, formatarDataHora } from '@/domain/risco';
import type { AlertaDto, ResultadoComOrigem } from '@/domain/types';
import { useCarregamento } from '@/hooks/useCarregamento';
import { ErroApi } from '@/services/http';
import { origemDaResposta } from '@/services/dados';
import { ESPACO } from '@/theme/tema';

type Aba = 'vigentes' | 'historico';

export default function Alertas() {
  const { db, api, config, cores } = useApp();
  const [aba, setAba] = useState<Aba>('vigentes');

  const carregar = useCallback(async () => {
    let vigentes: ResultadoComOrigem<AlertaDto[]> | null = null;
    let erro: ErroApi | null = null;
    try {
      const r = await api.listarAlertas({ ativos: true });
      await registrarAlertasVistos(db, r.dado);
      await sincronizarVigentes(db, r.dado.map((a) => a.id));
      vigentes = { dado: r.dado, origem: origemDaResposta(config.modo, r.simulado), obtidoEm: new Date().toISOString() };
    } catch (e) {
      erro = e instanceof ErroApi ? e : new ErroApi('desconhecido', null);
    }
    const historico = await listarHistoricoAlertas(db);
    if (!vigentes && erro && erro.tipo !== 'requisicao_invalida') {
      // Sem conexão: mostra os últimos alertas que o celular viu como vigentes.
      const ultimos = historico.filter((h) => h.ativo);
      const maisRecente = historico.reduce<string | null>((m, h) => (!m || h.vistoEm > m ? h.vistoEm : m), null);
      if (maisRecente) vigentes = { dado: ultimos, origem: 'cache', obtidoEm: maisRecente };
    }
    return { vigentes, erro, historico };
  }, [db, api, config.modo]);

  const { dados, carregandoInicial, atualizando, recarregar } = useCarregamento(carregar);

  return (
    <Tela titulo="Alertas de calor" subtitulo="Avisos gerados pelos totens do Sereno SP." atualizando={atualizando} aoAtualizar={recarregar}>
      <Opcoes<Aba>
        rotulo="Ver"
        opcoes={[
          { valor: 'vigentes', texto: 'Alertas de agora' },
          { valor: 'historico', texto: 'Histórico neste celular' },
        ]}
        selecionado={aba}
        aoSelecionar={setAba}
        testID="abas-alertas"
      />

      {carregandoInicial && !dados ? (
        <Carregando mensagem="Buscando alertas..." />
      ) : aba === 'vigentes' ? (
        dados?.vigentes ? (
          <>
            <FaixaOrigem origem={dados.vigentes.origem} obtidoEm={dados.vigentes.obtidoEm} />
            {dados.vigentes.dado.length === 0 ? (
              <Vazio
                titulo="Nenhum alerta de calor agora"
                detalhe="Quando um totem medir calor perigoso, o aviso aparece aqui."
                icone="checkmark-circle-outline"
              />
            ) : (
              <View style={estilos.lista}>
                {dados.vigentes.dado.map((a) => (
                  <CartaoAlerta key={a.id} alerta={a} />
                ))}
              </View>
            )}
          </>
        ) : (
          <ErroTela
            titulo={dados?.erro?.message ?? 'Não foi possível buscar os alertas.'}
            detalhe="Ainda não há alertas salvos neste celular."
            aoTentarDeNovo={recarregar}
          />
        )
      ) : (dados?.historico.length ?? 0) === 0 ? (
        <Vazio
          titulo="Histórico vazio"
          detalhe="Os alertas que este celular receber ficam guardados aqui, inclusive para ver sem internet."
          icone="time-outline"
        />
      ) : (
        <View style={estilos.lista} testID="historico-alertas">
          <Texto variante="apoio" cor={cores.textoSecundario}>
            Registros guardados no celular. Podem não refletir a situação de agora.
          </Texto>
          {dados?.historico.map((a) => (
            <CartaoAlerta key={a.id} alerta={a} historico />
          ))}
        </View>
      )}
    </Tela>
  );
}

function CartaoAlerta({ alerta, historico }: { alerta: AlertaDto | AlertaHistorico; historico?: boolean }) {
  const { cores } = useApp();
  return (
    <Cartao testID={`alerta-${alerta.id}`}>
      <SeloRisco nivel={alerta.nivel} />
      <Texto negrito>{alerta.mensagem}</Texto>
      <Texto>{apresentarRisco(alerta.nivel).orientacao}</Texto>
      <LinhaInfo icone="time-outline" rotulo="Data e horário" valor={formatarDataHora(alerta.criadoEm)} />
      <LinhaInfo icone="hardware-chip-outline" rotulo="Totem" valor={`${alerta.totemCodigo} (origem: ${alerta.origem})`} />
      {historico ? (
        <Texto variante="apoio" negrito cor={alerta.ativo ? cores.erroTexto : cores.textoSecundario}>
          {alerta.ativo ? 'Situação: ainda vigente na última consulta' : 'Situação: encerrado'}
        </Texto>
      ) : null}
    </Cartao>
  );
}

const estilos = StyleSheet.create({
  lista: { gap: ESPACO.m },
});
