import React from 'react';
import { Text, type TextProps } from 'react-native';
import { useApp } from '@/context/AppContext';
import { TIPOGRAFIA } from '@/theme/tema';

type Variante = keyof typeof TIPOGRAFIA;

interface Props extends TextProps {
  variante?: Variante;
  cor?: string;
  negrito?: boolean;
  centro?: boolean;
}

/**
 * Texto com escala dupla: preferência do app (Perfil > Tamanho da letra)
 * multiplicada pela escala de fonte do sistema (allowFontScaling).
 */
export function Texto({ variante = 'corpo', cor, negrito, centro, style, ...rest }: Props) {
  const { cores, escalaFonte } = useApp();
  const tamanho = Math.round(TIPOGRAFIA[variante] * escalaFonte);
  const ehTitulo = variante === 'titulo' || variante === 'subtitulo';
  return (
    <Text
      allowFontScaling
      maxFontSizeMultiplier={2}
      accessibilityRole={ehTitulo ? 'header' : undefined}
      style={[
        {
          color: cor ?? cores.texto,
          fontSize: tamanho,
          lineHeight: Math.round(tamanho * 1.35),
          fontWeight: negrito || ehTitulo || variante === 'destaque' ? '700' : '400',
          textAlign: centro ? 'center' : undefined,
        },
        style,
      ]}
      {...rest}
    />
  );
}
