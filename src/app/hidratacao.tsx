import React, { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { Botao } from '@/components/Botao';
import { Cartao } from '@/components/Cartao';
import { Confirmacao } from '@/components/Confirmacao';
import { Carregando, Vazio } from '@/components/Estados';
import { Tela } from '@/components/Tela';
import { Texto } from '@/components/Texto';
import { useApp } from '@/context/AppContext';
import { listarCheckins, registrarBebiAgua, removerCheckin } from '@/db/repositorios';
import { formatarDataHora, formatarHora } from '@/domain/risco';
import { useCarregamento } from '@/hooks/useCarregamento';
import { useConfirmacao } from '@/hooks/useConfirmacao';
import { ESPACO } from '@/theme/tema';

/** Histórico de "Bebi água" — 100% local, funciona sem internet. */
export default function Hidratacao() {
  const { db, cores } = useApp();
  const { mensagem, confirmar } = useConfirmacao();
  const carregar = useCallback(() => listarCheckins(db, 100), [db]);
  const { dados, carregandoInicial, recarregar } = useCarregamento(carregar);

  async function registrar() {
    const c = await registrarBebiAgua(db);
    confirmar(`Registrado às ${formatarHora(c.registradoEm)}.`);
    await recarregar();
  }

  async function remover(id: number) {
    await removerCheckin(db, id);
    confirmar('Registro removido.');
    await recarregar();
  }

  return (
    <Tela semMargemTopo>
      <Texto cor={cores.textoSecundario}>
        Estes registros ficam só neste celular. O Sereno SP não envia esses dados para nenhum servidor.
      </Texto>
      <Botao rotulo="Bebi água agora" icone="water" aoPressionar={() => void registrar()} />
      <Confirmacao mensagem={mensagem} />
      {carregandoInicial && !dados ? (
        <Carregando />
      ) : (dados?.length ?? 0) === 0 ? (
        <Vazio titulo="Nenhum registro ainda" detalhe="Toque em “Bebi água agora” sempre que beber água." icone="water-outline" />
      ) : (
        <View style={estilos.lista}>
          {dados?.map((c) => (
            <Cartao key={c.id} style={estilos.item}>
              <Texto negrito style={{ flex: 1 }}>
                {formatarDataHora(c.registradoEm)}
              </Texto>
              <Botao rotulo="Apagar" icone="trash-outline" variante="secundario" aoPressionar={() => void remover(c.id)} />
            </Cartao>
          ))}
        </View>
      )}
    </Tela>
  );
}

const estilos = StyleSheet.create({
  lista: { gap: ESPACO.s },
  item: { flexDirection: 'row', alignItems: 'center', gap: ESPACO.m },
});
