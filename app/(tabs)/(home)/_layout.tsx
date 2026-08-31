import { Stack } from "expo-router";

// Stack próprio da aba Home: quiz/studyContents/addContent continuam
// empilhando (slide + swipe-back) a partir da Home, exatamente como antes —
// só a TROCA DE ABA (Home <-> Perfil) deixou de passar por aqui, ver
// app/(tabs)/_layout.tsx.
export default function HomeStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="home/index" />
      <Stack.Screen name="quiz/index" />
      <Stack.Screen name="quiz/result" />
      <Stack.Screen name="studyContents/index" />
      <Stack.Screen name="studyContents/[id]/index" />
      <Stack.Screen name="studyContents/addContent" />
    </Stack>
  );
}
