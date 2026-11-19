import { arredondarParaPrivacidade, coordenadaValida, distanciaKm, formatarDistancia } from '@/domain/geo';

describe('privacidade da localização', () => {
  it('arredonda para 3 casas (~110 m) antes de enviar', () => {
    expect(arredondarParaPrivacidade({ latitude: -23.5023456, longitude: -46.6250789 })).toEqual({
      latitude: -23.502,
      longitude: -46.625,
    });
  });
  it('nenhuma coordenada enviada mantém 5+ casas decimais', () => {
    const c = arredondarParaPrivacidade({ latitude: -23.123456789, longitude: -46.987654321 });
    expect(String(c.latitude).split('.')[1]!.length).toBeLessThanOrEqual(3);
    expect(String(c.longitude).split('.')[1]!.length).toBeLessThanOrEqual(3);
  });
});

describe('distância Haversine (mesma fórmula do backend)', () => {
  it('distância zero para o mesmo ponto', () => {
    expect(distanciaKm({ latitude: -23.5, longitude: -46.6 }, { latitude: -23.5, longitude: -46.6 })).toBe(0);
  });
  it('1 grau de latitude ~ 111,195 km', () => {
    expect(distanciaKm({ latitude: 0, longitude: 0 }, { latitude: 1, longitude: 0 })).toBeCloseTo(111.195, 2);
  });
  it('formata metros e km', () => {
    expect(formatarDistancia(0.35)).toBe('350 metros');
    expect(formatarDistancia(null)).toBe('Distância não calculada');
  });
  it('valida faixas', () => {
    expect(coordenadaValida({ latitude: 91, longitude: 0 })).toBe(false);
    expect(coordenadaValida({ latitude: -23.5, longitude: -46.6 })).toBe(true);
  });
});
