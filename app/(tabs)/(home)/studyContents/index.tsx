import { ArrowLeft } from "lucide-react-native";
import { router } from "expo-router";
import React, { useEffect } from "react";
import { ScrollView, StatusBar, Text, View } from "react-native";
import { Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StudyContentService } from "@/src/services/studyContent/studyContent.service";
import { useStudyContentStore } from "@/src/store/studyContentStore";
import { MacroTemasService } from "@/src/services/macroTemas/macroTemas.service";
import { ReorderableMacroTemas } from "@/src/features/studyContent/ReorderableMacroTemas";

export default function TodosOsConteudos() {
  const studyContentData = useStudyContentStore((state) => state.data);
  const macrotemas = studyContentData?.macrotemas ?? [];

  useEffect(() => {
    StudyContentService.initialize();
  }, []);

  // Segurar um card arrasta pra trocar de posição (ver
  // ReorderableMacroTemas.tsx) — a edição de nome/emoji foi retirada daqui
  // por enquanto (o long press agora é só pra reordenar); continua acessível
  // por "Editar disciplinas" no Perfil.
  async function handleOrderChange(orderedIds: string[]) {
    try {
      await MacroTemasService.reorder(orderedIds);
    } catch (err) {
      // Falha em salvar a ordem não é crítica o bastante pra travar a tela
      // com um Alert — a lista já reflete visualmente a ordem escolhida; só
      // registra pra investigar se acontecer com frequência.
      console.warn("Falha ao salvar a nova ordem das disciplinas:", err);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-surfaceDim" edges={["top", "bottom"]}>
      <StatusBar barStyle="light-content" />

      <View className="px-6 pt-4 pb-2 flex-row items-center">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 -ml-1 items-center justify-center active:opacity-70"
          hitSlop={8}
        >
          <ArrowLeft size={24} color="#f8f8f8" />
        </Pressable>
        <Text className="text-white text-xl font-bold ml-2 flex-1">
          Todos os conteúdos
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 24, paddingBottom: 140 }}
      >
        {macrotemas.length === 0 ? (
          <Text className="text-muted text-center mt-10">
            Nenhum conteúdo ainda. Envie um material para começar.
          </Text>
        ) : (
          <ReorderableMacroTemas
            macrotemas={macrotemas}
            onPressItem={(id) => router.push(`/(tabs)/studyContents/${id}`)}
            onOrderChange={handleOrderChange}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
