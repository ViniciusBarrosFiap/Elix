import { Stack } from "expo-router";

// Stack próprio da aba Home: quiz/studyContents/addContent continuam
// empilhando (slide + swipe-back) a partir da Home, exatamente como antes —
// só a TROCA DE ABA (Home <-> Perfil) deixou de passar por aqui, ver
// app/(tabs)/_layout.tsx.
export default function HomeStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="home/index" />
      {/* gestureEnabled:false só aqui — o slider de confiança do quiz é um
          arrasto horizontal quase full-width, que colidia com o swipe-back
          nativo da tela (arrastar o slider às vezes acabava saindo da tela
          e voltando pra Home, em vez de só mexer no slider). O X no header
          continua sendo o jeito de sair. */}
      <Stack.Screen name="quiz/index" options={{ gestureEnabled: false }} />
      <Stack.Screen name="quiz/result" />
      <Stack.Screen name="studyContents/index" />
      <Stack.Screen name="studyContents/[id]/index" />
      <Stack.Screen name="studyContents/addContent" />
    </Stack>
  );
}
