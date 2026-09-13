import "@/global.css";
import { QuizQuestionsService } from "@/src/services/quiz/quiz.service";
import { StudyContentService } from "@/src/services/studyContent/studyContent.service";
import { UserService } from "@/src/services/user/user.service";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
  useFonts,
} from "@expo-google-fonts/manrope";
import * as SplashScreen from "expo-splash-screen";
import { Stack } from "expo-router";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

// Mantém a splash nativa visível até a Manrope carregar — sem isso, o app
// desenha um ou mais frames com todo texto no fallback do sistema antes da
// fonte chegar, e a troca dá um "pisca" visível assim que ela é aplicada.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  useEffect(() => {
    UserService.initialize();
    StudyContentService.initialize();
    QuizQuestionsService.initialize();
  }, []);

  useEffect(() => {
    // fontError não trava o app pra sempre na splash — deixa seguir com o
    // fallback do sistema em vez de uma tela em branco infinita.
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)" />
        </Stack>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
