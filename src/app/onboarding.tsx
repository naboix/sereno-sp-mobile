import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Botao } from '@/components/Botao';
import { CampoTexto, Interruptor, MensagemErro, Opcoes } from '@/components/Campos';
import { Cartao } from '@/components/Cartao';
import { Tela } from '@/components/Tela';
import { Texto } from '@/components/Texto';
import { useApp } from '@/context/AppContext';
import {
  FAIXAS_ETARIAS,
  validarPerfil,
  type ErrosPerfil,
  type FaixaEtaria,
  type TamanhoFonte,
} from '@/db/repositorios';
import { ESPACO } from '@/theme/tema';

const OPCOES_FONTE: { valor: TamanhoFonte; texto: string }[] = [
  { valor: 'normal', texto: 'Normal' },
  { valor: 'grande', texto: 'Grande' },
  { valor: 'muito_grande', texto: 'Muito grande' },
];

export default function Onboarding() {
  const router = useRouter();
  const { cores, atualizarPerfil, atualizarPreferencias, preferencias, perfil } = useApp();
  const [etapa, setEtapa] = useState<1 | 2>(perfil ? 2 : 1);
  const [apelido, setApelido] = useState(perfil?.apelido ?? '');
  const [faixa, setFaixa] = useState<FaixaEtaria | null>(perfil?.faixaEtaria ?? null);
  const [bairro, setBairro] = useState(perfil?.bairro ?? '');
  const [consentimento, setConsentimento] = useState(perfil?.consentimentoLocal ?? false);
  const [erros, setErros] = useState<ErrosPerfil>({});
  const [salvando, setSalvando] = useState(false);
  const [erroGeral, setErroGeral] = useState<string | null>(null);

  /** Ao corrigir um campo, a mensagem de erro dele some na hora. */
  function limparErro(campo: keyof ErrosPerfil) {
    setErros((e) => {
      if (!e[campo]) return e;
      const { [campo]: _removido, ...resto } = e;
      if (Object.keys(resto).length === 0) setErroGeral(null);
      return resto;
    });
  }

  async function concluir() {
    const dados = { apelido, faixaEtaria: faixa ?? undefined, bairro, consentimentoLocal: consentimento };
    const e = validarPerfil(dados);
    setErros(e);
    if (Object.keys(e).length > 0) {
      setErroGeral('Confira os campos destacados.');
      return;
    }
    setSalvando(true);
    setErroGeral(null);
    try {
      await atualizarPerfil({
        apelido: apelido.trim(),
        faixaEtaria: faixa as FaixaEtaria,
        bairro: bairro.trim(),
        consentimentoLocal: true,
      });
      router.replace('/inicio');
    } catch {
      setErroGeral('Não foi possível salvar no celular. Tente de novo.');
    } finally {
      setSalvando(false);
    }
  }

  if (etapa === 1) {
    return (
      <Tela>
        <View style={estilos.hero} accessible accessibilityLabel="Sereno SP. Proteção contra o calor em Santana.">
          <Ionicons name="sunny" size={72} color={cores.primaria} />
          <Texto variante="titulo" centro>
            Sereno SP
          </Texto>
          <Texto variante="subtitulo" centro cor={cores.textoSecundario}>
            Proteção contra o calor em Santana
          </Texto>
        </View>

        <Cartao>
          <ItemExplicacao icone="thermometer" texto="Mostra o nível de calor medido pelo totem da praça." />
          <ItemExplicacao icone="calendar" texto="Avisa na véspera se amanhã vai fazer calor perigoso." />
          <ItemExplicacao icone="water" texto="Mostra onde encontrar sombra e água perto de você." />
          <ItemExplicacao icone="cloud-offline" texto="Guarda as últimas informações para usar sem internet." />
        </Cartao>

        <Cartao>
          <Texto negrito>Seus dados ficam com você</Texto>
          <Texto cor={cores.textoSecundario}>
            Pedimos só um apelido, sua faixa de idade e seu bairro. Nada disso sai do seu celular. Não pedimos
            nome completo, documento, telefone nem informações de saúde.
          </Texto>
        </Cartao>

        <Botao rotulo="Começar" icone="arrow-forward" aoPressionar={() => setEtapa(2)} testID="botao-comecar" />
      </Tela>
    );
  }

  return (
    <Tela titulo="Seu perfil" subtitulo="Leva menos de um minuto.">
      <CampoTexto
        rotulo="Como quer ser chamado?"
        dica="Um apelido. Ex.: Dona Lúcia, Seu João."
        valor={apelido}
        aoMudar={(v) => {
          setApelido(v);
          limparErro('apelido');
        }}
        erro={erros.apelido}
        maxLength={30}
        testID="campo-apelido"
      />

      <Opcoes<FaixaEtaria>
        rotulo="Sua faixa de idade"
        opcoes={FAIXAS_ETARIAS.map((f) => ({ valor: f, texto: f }))}
        selecionado={faixa}
        aoSelecionar={(v) => {
          setFaixa(v);
          limparErro('faixaEtaria');
        }}
        erro={erros.faixaEtaria}
        testID="opcoes-faixa"
      />

      <CampoTexto
        rotulo="Seu bairro"
        dica="A região monitorada pelo Sereno SP é Santana."
        valor={bairro}
        aoMudar={(v) => {
          setBairro(v);
          limparErro('bairro');
        }}
        erro={erros.bairro}
        maxLength={60}
        testID="campo-bairro"
      />
      {bairro.trim() === '' ? (
        <Botao rotulo="Moro em Santana" icone="location" variante="secundario" aoPressionar={() => {
            setBairro('Santana');
            limparErro('bairro');
          }} />
      ) : null}

      <Opcoes<TamanhoFonte>
        rotulo="Tamanho da letra"
        opcoes={OPCOES_FONTE}
        selecionado={preferencias.tamanhoFonte}
        aoSelecionar={(v) => void atualizarPreferencias({ tamanhoFonte: v })}
        testID="opcoes-fonte"
      />

      <Interruptor
        rotulo="Autorizo guardar estas informações no meu celular"
        descricao="Usadas só para personalizar o app e funcionar sem internet. Você pode apagar tudo em Perfil."
        valor={consentimento}
        aoMudar={(v) => {
          setConsentimento(v);
          if (v) limparErro('consentimentoLocal');
        }}
        testID="interruptor-consentimento"
      />
      {erros.consentimentoLocal ? <MensagemErro texto={erros.consentimentoLocal} /> : null}

      {erroGeral ? <MensagemErro texto={erroGeral} /> : null}

      <Botao
        rotulo={perfil ? 'Salvar alterações' : 'Entrar no Sereno SP'}
        icone="checkmark"
        aoPressionar={concluir}
        carregando={salvando}
        testID="botao-concluir"
      />
      {!perfil ? (
        <Botao rotulo="Voltar" icone="arrow-back" variante="secundario" aoPressionar={() => setEtapa(1)} />
      ) : null}
    </Tela>
  );
}

function ItemExplicacao({ icone, texto }: { icone: React.ComponentProps<typeof Ionicons>['name']; texto: string }) {
  const { cores } = useApp();
  return (
    <View style={estilos.item} accessible accessibilityLabel={texto}>
      <Ionicons name={icone} size={28} color={cores.primaria} />
      <Texto style={{ flex: 1 }}>{texto}</Texto>
    </View>
  );
}

const estilos = StyleSheet.create({
  hero: { alignItems: 'center', gap: ESPACO.s, paddingVertical: ESPACO.l },
  item: { flexDirection: 'row', alignItems: 'center', gap: ESPACO.m, paddingVertical: ESPACO.xs },
});
