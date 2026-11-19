import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Botao } from '@/components/Botao';
import { Interruptor, Opcoes } from '@/components/Campos';
import { Cartao } from '@/components/Cartao';
import { Confirmacao } from '@/components/Confirmacao';
import { ErroTela } from '@/components/Estados';
import { LinhaInfo } from '@/components/LinhaInfo';
import { Tela } from '@/components/Tela';
import { Texto } from '@/components/Texto';
import { useApp } from '@/context/AppContext';
import type { Preferencias, TamanhoFonte } from '@/db/repositorios';
import { useConfirmacao } from '@/hooks/useConfirmacao';
import { ErroApi } from '@/services/http';
import { ESPACO } from '@/theme/tema';

export default function Perfil() {
  const router = useRouter();
  const { perfil, preferencias, atualizarPreferencias, apagarDadosLocais, cores, config, api } = useApp();
  const { mensagem, confirmar } = useConfirmacao();
  const [confirmandoApagar, setConfirmandoApagar] = useState(false);
  const [testando, setTestando] = useState(false);
  const [statusConexao, setStatusConexao] = useState<string | null>(null);
  const [erroConexao, setErroConexao] = useState<string | null>(null);

  async function mudar(p: Partial<Preferencias>, aviso: string) {
    await atualizarPreferencias(p);
    confirmar(aviso);
  }

  async function testarConexao() {
    setTestando(true);
    setStatusConexao(null);
    setErroConexao(null);
    try {
      const r = await api.health();
      setStatusConexao(
        `${r.simulado ? 'Servidor SIMULADO' : 'Sereno.Api'} respondeu: status ${r.dado.status}, banco ${r.dado.banco}.`,
      );
    } catch (e) {
      setErroConexao(e instanceof ErroApi ? e.message : 'Falha ao testar a conexão.');
    } finally {
      setTestando(false);
    }
  }

  async function apagar() {
    await apagarDadosLocais();
    setConfirmandoApagar(false);
    router.replace('/onboarding');
  }

  return (
    <Tela titulo="Perfil e preferências">
      <Cartao>
        <Texto variante="subtitulo">Meu perfil</Texto>
        <LinhaInfo icone="person" rotulo="Apelido" valor={perfil?.apelido ?? '-'} />
        <LinhaInfo icone="people" rotulo="Faixa de idade" valor={perfil?.faixaEtaria ?? '-'} />
        <LinhaInfo icone="location" rotulo="Bairro" valor={perfil?.bairro ?? '-'} />
        <Botao rotulo="Editar perfil" icone="create" variante="secundario" aoPressionar={() => router.push('/onboarding')} />
      </Cartao>

      <Confirmacao mensagem={mensagem} />

      <Cartao>
        <Texto variante="subtitulo">Leitura e tela</Texto>
        <Opcoes<TamanhoFonte>
          rotulo="Tamanho da letra"
          opcoes={[
            { valor: 'normal', texto: 'Normal' },
            { valor: 'grande', texto: 'Grande' },
            { valor: 'muito_grande', texto: 'Muito grande' },
          ]}
          selecionado={preferencias.tamanhoFonte}
          aoSelecionar={(v) => void mudar({ tamanhoFonte: v }, 'Tamanho da letra atualizado.')}
          testID="pref-fonte"
        />
        <Interruptor
          rotulo="Contraste reforçado"
          descricao="Deixa textos e bordas em preto puro sobre fundo branco."
          valor={preferencias.contrasteReforcado}
          aoMudar={(v) => void mudar({ contrasteReforcado: v }, v ? 'Contraste reforçado ligado.' : 'Contraste reforçado desligado.')}
          testID="pref-contraste"
        />
        <Interruptor
          rotulo="Vibrar ao confirmar"
          descricao="O celular vibra de leve quando uma ação dá certo."
          valor={preferencias.vibrarAoConfirmar}
          aoMudar={(v) => void mudar({ vibrarAoConfirmar: v }, 'Preferência de vibração salva.')}
        />
      </Cartao>

      <Cartao>
        <Texto variante="subtitulo">Lembrete de água</Texto>
        <Interruptor
          rotulo="Mostrar lembrete na tela Início"
          descricao="Depois de tocar em “Bebi água”, o app mostra o horário sugerido para o próximo copo. Não envia notificações."
          valor={preferencias.lembreteAguaAtivo}
          aoMudar={(v) => void mudar({ lembreteAguaAtivo: v }, v ? 'Lembrete ligado.' : 'Lembrete desligado.')}
          testID="pref-lembrete"
        />
        {preferencias.lembreteAguaAtivo ? (
          <Opcoes<60 | 90 | 120>
            rotulo="Lembrar a cada"
            opcoes={[
              { valor: 60, texto: '1 hora' },
              { valor: 90, texto: '1 hora e meia' },
              { valor: 120, texto: '2 horas' },
            ]}
            selecionado={preferencias.lembreteIntervaloMin}
            aoSelecionar={(v) => void mudar({ lembreteIntervaloMin: v }, 'Intervalo do lembrete salvo.')}
          />
        ) : null}
      </Cartao>

      <Cartao>
        <Texto variante="subtitulo">Privacidade</Texto>
        <Texto>Fica guardado só neste celular:</Texto>
        <View style={estilos.lista}>
          <Texto>• apelido, faixa de idade e bairro;</Texto>
          <Texto>• preferências de leitura e lembrete;</Texto>
          <Texto>• pontos favoritos e registros de “Bebi água”;</Texto>
          <Texto>• últimas informações recebidas do Sereno SP.</Texto>
        </View>
        <Texto cor={cores.textoSecundario}>
          Não guardamos sua localização. Quando você permite, ela é arredondada (cerca de 100 metros) antes de buscar
          os pontos próximos.
        </Texto>
        {!confirmandoApagar ? (
          <Botao
            rotulo="Apagar meus dados do celular"
            icone="trash"
            variante="perigo"
            aoPressionar={() => setConfirmandoApagar(true)}
            testID="botao-apagar"
          />
        ) : (
          <View style={estilos.confirmar} accessibilityLiveRegion="assertive">
            <Texto negrito cor={cores.erroTexto}>
              Tem certeza? Isso apaga perfil, favoritos, registros de água e dados salvos. Não dá para desfazer.
            </Texto>
            <Botao rotulo="Sim, apagar tudo" icone="trash" variante="perigo" aoPressionar={() => void apagar()} testID="botao-confirmar-apagar" />
            <Botao rotulo="Cancelar" icone="close" variante="secundario" aoPressionar={() => setConfirmandoApagar(false)} />
          </View>
        )}
      </Cartao>

      <Cartao>
        <Texto variante="subtitulo">Conexão</Texto>
        <LinhaInfo
          icone="server-outline"
          rotulo="Fonte dos dados"
          valor={config.modo === 'mock' ? 'Demonstração com dados simulados (sem servidor)' : `API em ${config.apiUrl}`}
        />
        <Botao rotulo="Testar conexão" icone="pulse" variante="secundario" carregando={testando} aoPressionar={() => void testarConexao()} />
        {statusConexao ? <Confirmacao mensagem={statusConexao} /> : null}
        {erroConexao ? <ErroTela titulo={erroConexao} /> : null}
      </Cartao>
    </Tela>
  );
}

const estilos = StyleSheet.create({
  lista: { gap: ESPACO.xs, paddingLeft: ESPACO.s },
  confirmar: { gap: ESPACO.s },
});
