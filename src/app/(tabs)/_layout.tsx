import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import React from 'react';
import { Carregando } from '@/components/Estados';
import { useApp } from '@/context/AppContext';

type NomeIcone = React.ComponentProps<typeof Ionicons>['name'];

const ABAS: { nome: string; titulo: string; icone: NomeIcone; iconeAtivo: NomeIcone; dica: string }[] = [
  { nome: 'inicio', titulo: 'Início', icone: 'home-outline', iconeAtivo: 'home', dica: 'Nível de calor agora e previsão de amanhã' },
  { nome: 'pontos', titulo: 'Refresco', icone: 'water-outline', iconeAtivo: 'water', dica: 'Pontos de sombra e água' },
  { nome: 'alertas', titulo: 'Alertas', icone: 'notifications-outline', iconeAtivo: 'notifications', dica: 'Avisos de calor' },
  { nome: 'perfil', titulo: 'Perfil', icone: 'person-outline', iconeAtivo: 'person', dica: 'Preferências e privacidade' },
];

export default function LayoutAbas() {
  const { carregado, perfil, cores, escalaFonte } = useApp();
  if (!carregado) return <Carregando />;
  if (!perfil) return <Redirect href="/onboarding" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: cores.primaria,
        tabBarInactiveTintColor: cores.textoSecundario,
        tabBarStyle: {
          backgroundColor: cores.superficie,
          borderTopColor: cores.borda,
          borderTopWidth: 1,
          minHeight: 76,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: Math.round(15 * escalaFonte), fontWeight: '700' },
        tabBarAllowFontScaling: true,
      }}
    >
      {ABAS.map((a) => (
        <Tabs.Screen
          key={a.nome}
          name={a.nome}
          options={{
            title: a.titulo,
            tabBarAccessibilityLabel: `${a.titulo}. ${a.dica}`,
            tabBarButtonTestID: `aba-${a.nome}`,
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? a.iconeAtivo : a.icone} size={28} color={String(color)} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
