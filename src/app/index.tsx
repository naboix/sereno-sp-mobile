import { Redirect } from 'expo-router';
import React from 'react';
import { Carregando } from '@/components/Estados';
import { useApp } from '@/context/AppContext';

/** Porta de entrada: sem perfil salvo vai para o onboarding; com perfil, para o Início. */
export default function Entrada() {
  const { carregado, perfil } = useApp();
  if (!carregado) return <Carregando mensagem="Abrindo o Sereno SP..." />;
  return <Redirect href={perfil ? '/inicio' : '/onboarding'} />;
}
