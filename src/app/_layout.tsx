import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider, useApp } from '@/context/AppContext';
import { migrarBanco, NOME_BANCO } from '@/db/database';
import { TIPOGRAFIA } from '@/theme/tema';

function Navegacao() {
  const { cores, escalaFonte } = useApp();
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: cores.superficie },
          headerTintColor: cores.primaria,
          headerTitleStyle: { fontSize: Math.round(TIPOGRAFIA.subtitulo * escalaFonte), color: cores.texto },
          headerBackTitle: 'Voltar',
          headerBackButtonDisplayMode: 'default',
          contentStyle: { backgroundColor: cores.fundo },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="ponto/[id]" options={{ title: 'Ponto de refresco' }} />
        <Stack.Screen name="hidratacao" options={{ title: 'Água que bebi' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <SQLiteProvider databaseName={NOME_BANCO} onInit={migrarBanco}>
        <AppProvider>
          <Navegacao />
        </AppProvider>
      </SQLiteProvider>
    </SafeAreaProvider>
  );
}
