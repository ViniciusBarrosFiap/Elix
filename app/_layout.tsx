import "@/global.css";
import { QuizQuestionsService } from "@/src/services/quiz/quiz.service";
import { StudyContentService } from "@/src/services/studyContent/studyContent.service";
import { UserService } from "@/src/services/user/user.service";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { Stack } from "expo-router";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function RootLayout() {
  useEffect(() => {
    UserService.initialize();
    StudyContentService.initialize();
    QuizQuestionsService.initialize();
  }, []);

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