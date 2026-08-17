import ElixTabBar from "@/src/components/TabBar";
import { Stack } from "expo-router";
import { View } from "react-native";

// Stack (não Tabs) para que a navegação entre as telas do app inteiro
// aconteça "em pilha" (slide + swipe-back), já que a Tabs navigator troca de
// tela instantaneamente. A barra flutuante (ElixTabBar) vira um overlay
// independente, sobreposto à Stack — ver src/components/TabBar.tsx.
export default function TabsLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="home/index" />
        <Stack.Screen name="quiz/index" />
        <Stack.Screen name="quiz/result" />
        <Stack.Screen name="studyContents/index" />
        <Stack.Screen name="studyContents/[id]" />
        <Stack.Screen name="studyContents/addContent" />
      </Stack>
      <ElixTabBar />
    </View>
  );
}