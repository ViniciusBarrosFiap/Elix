import ElixTabBar from "@/src/components/TabBar";
import { Tabs } from "expo-router";

// Tabs (não Stack) no nível raiz: Home e Perfil são abas de verdade agora —
// cada uma fica montada permanentemente depois da primeira visita (só
// escondida, nunca desmontada), então trocar de aba não recria o conteúdo
// nem reinicia animações (ex: o preenchimento do frasco/cards na Home não
// reiniciava do zero antes). O tabBar nativo do React Navigation é
// substituído pelo nosso ElixTabBar (pill flutuante com blur) — a troca de
// aba em si já é instantânea por padrão num Tabs navigator, sem precisar de
// nenhuma configuração de animação.
//
// Cada aba tem seu próprio Stack aninhado (ver (home)/_layout.tsx e
// (profile)/_layout.tsx) pra manter a transição em pilha nas telas que são
// empilhadas a partir dela (quiz, studyContents, addContent).
export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={() => <ElixTabBar />}>
      <Tabs.Screen name="(home)" />
      <Tabs.Screen name="(profile)" />
    </Tabs>
  );
}
