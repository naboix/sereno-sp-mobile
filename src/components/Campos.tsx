import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { Pressable, StyleSheet, Switch, TextInput, View } from 'react-native';
import { useApp } from '@/context/AppContext';
import { ALVO_TOQUE_MIN, ESPACO, RAIO, TIPOGRAFIA } from '@/theme/tema';
import { Texto } from './Texto';

/* ---------------- Campo de texto ---------------- */

interface CampoTextoProps {
  rotulo: string;
  valor: string;
  aoMudar: (v: string) => void;
  erro?: string;
  dica?: string;
  placeholder?: string;
  maxLength?: number;
  testID?: string;
}

export function CampoTexto({ rotulo, valor, aoMudar, erro, dica, placeholder, maxLength, testID }: CampoTextoProps) {
  const { cores, escalaFonte } = useApp();
  return (
    <View style={estilos.grupo}>
      <Texto negrito nativeID={`rotulo-${testID}`}>
        {rotulo}
      </Texto>
      {dica ? <Texto variante="apoio" cor={cores.textoSecundario}>{dica}</Texto> : null}
      <TextInput
        testID={testID}
        value={valor}
        onChangeText={aoMudar}
        placeholder={placeholder}
        placeholderTextColor={cores.textoSecundario}
        maxLength={maxLength}
        accessibilityLabel={rotulo}
        accessibilityHint={dica}
        aria-labelledby={`rotulo-${testID}`}
        aria-invalid={!!erro}
        autoCorrect={false}
        allowFontScaling
        style={[
          estilos.input,
          {
            borderColor: erro ? cores.erroTexto : cores.borda,
            color: cores.texto,
            backgroundColor: cores.superficie,
            fontSize: Math.round(TIPOGRAFIA.corpo * escalaFonte),
          },
        ]}
      />
      {erro ? <MensagemErro texto={erro} /> : null}
    </View>
  );
}

export function MensagemErro({ texto }: { texto: string }) {
  const { cores } = useApp();
  return (
    <View style={estilos.linhaErro} accessibilityLiveRegion="assertive">
      <Ionicons name="alert-circle" size={20} color={cores.erroTexto} />
      <Texto variante="apoio" negrito cor={cores.erroTexto} style={{ flex: 1 }}>
        {texto}
      </Texto>
    </View>
  );
}

/* ---------------- Escolha única (grupo de rádio) ---------------- */

interface OpcoesProps<T extends string | number> {
  rotulo: string;
  opcoes: readonly { valor: T; texto: string }[];
  selecionado: T | null;
  aoSelecionar: (v: T) => void;
  erro?: string;
  testID?: string;
}

export function Opcoes<T extends string | number>({
  rotulo,
  opcoes,
  selecionado,
  aoSelecionar,
  erro,
  testID,
}: OpcoesProps<T>) {
  const { cores } = useApp();
  return (
    <View style={estilos.grupo} accessibilityRole="radiogroup" accessibilityLabel={rotulo} testID={testID}>
      <Texto negrito>{rotulo}</Texto>
      <View style={estilos.opcoes}>
        {opcoes.map((o) => {
          const ativo = o.valor === selecionado;
          return (
            <Pressable
              key={String(o.valor)}
              onPress={() => aoSelecionar(o.valor)}
              accessibilityRole="radio"
              accessibilityLabel={o.texto}
              accessibilityState={{ checked: ativo, selected: ativo }}
              style={[
                estilos.opcao,
                {
                  borderColor: ativo ? cores.primaria : cores.borda,
                  backgroundColor: ativo ? cores.infoFundo : cores.superficie,
                  borderWidth: ativo ? 3 : 1.5,
                },
              ]}
            >
              <Ionicons
                name={ativo ? 'radio-button-on' : 'radio-button-off'}
                size={24}
                color={ativo ? cores.primaria : cores.textoSecundario}
              />
              <Texto negrito={ativo} style={{ flexShrink: 1 }}>
                {o.texto}
              </Texto>
            </Pressable>
          );
        })}
      </View>
      {erro ? <MensagemErro texto={erro} /> : null}
    </View>
  );
}

/* ---------------- Interruptor (liga/desliga) ---------------- */

interface InterruptorProps {
  rotulo: string;
  descricao?: string;
  valor: boolean;
  aoMudar: (v: boolean) => void;
  testID?: string;
}

export function Interruptor({ rotulo, descricao, valor, aoMudar, testID }: InterruptorProps) {
  const { cores } = useApp();
  return (
    <Pressable
      testID={testID}
      onPress={() => aoMudar(!valor)}
      accessibilityRole="switch"
      accessibilityLabel={rotulo}
      accessibilityHint={descricao}
      accessibilityState={{ checked: valor }}
      style={[estilos.interruptor, { borderColor: cores.borda, backgroundColor: cores.superficie }]}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <Texto negrito>{rotulo}</Texto>
        {descricao ? (
          <Texto variante="apoio" cor={cores.textoSecundario}>
            {descricao}
          </Texto>
        ) : null}
        <Texto variante="apoio" negrito cor={valor ? cores.primaria : cores.textoSecundario}>
          {valor ? 'Ligado' : 'Desligado'}
        </Texto>
      </View>
      <Switch
        value={valor}
        onValueChange={aoMudar}
        trackColor={{ true: cores.primaria, false: cores.borda }}
        thumbColor={cores.superficie}
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
      />
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  grupo: { gap: ESPACO.s },
  input: {
    minHeight: ALVO_TOQUE_MIN,
    borderWidth: 2,
    borderRadius: RAIO.m,
    paddingHorizontal: ESPACO.m,
  },
  linhaErro: { flexDirection: 'row', alignItems: 'center', gap: ESPACO.xs + 2 },
  opcoes: { gap: ESPACO.s },
  opcao: {
    minHeight: ALVO_TOQUE_MIN,
    flexDirection: 'row',
    alignItems: 'center',
    gap: ESPACO.s + 2,
    paddingHorizontal: ESPACO.m,
    paddingVertical: ESPACO.s,
    borderRadius: RAIO.m,
  },
  interruptor: {
    minHeight: ALVO_TOQUE_MIN + 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: ESPACO.m,
    padding: ESPACO.m,
    borderWidth: 1.5,
    borderRadius: RAIO.m,
  },
});
