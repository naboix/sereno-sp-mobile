import { render, screen } from '@testing-library/react-native';
import React from 'react';
import { Botao } from '@/components/Botao';
import { SeloRisco } from '@/components/SeloRisco';
import { textoOrigem } from '@/components/FaixaOrigem';
import { CORES_PADRAO } from '@/theme/tema';

jest.mock('@expo/vector-icons/Ionicons', () => 'Ionicons');

jest.mock('@/context/AppContext', () => ({
  useApp: () => ({ cores: require('@/theme/tema').CORES_PADRAO, escalaFonte: 1.15, preferencias: {} }),
}));

describe('acessibilidade dos componentes', () => {
  it('selo de risco expõe texto e rótulo para leitor de tela (não só cor)', async () => {
    await render(<SeloRisco nivel="Perigo" />);
    expect(screen.getByText('Calor perigoso')).toBeTruthy();
    expect(screen.getByLabelText('Nível de calor: perigo.')).toBeTruthy();
  });

  it('botão tem role "button", rótulo e altura mínima de 56', async () => {
    await render(<Botao rotulo="Bebi água" aoPressionar={() => undefined} testID="b" />);
    const b = screen.getByRole('button', { name: 'Bebi água' });
    const estilo = [b.props.style].flat(Infinity).reduce((a: object, s: object) => ({ ...a, ...s }), {});
    expect((estilo as { minHeight: number }).minHeight).toBeGreaterThanOrEqual(56);
  });

  it('faixa de origem nunca apresenta cache como atual', () => {
    expect(textoOrigem('cache', '2026-11-18T12:00:00Z', new Date('2026-11-18T15:00:00Z'))).toMatch(/^Sem conexão\. Mostrando dados salvos/);
    expect(textoOrigem('simulado', '2026-11-18T12:00:00Z')).toMatch(/SIMULADOS/);
    expect(textoOrigem('mock', '2026-11-18T12:00:00Z')).toMatch(/SIMULADOS/);
    expect(CORES_PADRAO).toBeTruthy();
  });
});
