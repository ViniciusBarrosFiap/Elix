import { ArrowLeft, Pencil } from "lucide-react-native";
import { router } from "expo-router";
import React, { useEffect } from "react";
import { Pressable, ScrollView, StatusBar, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StudyContentService } from "@/src/services/studyContent/studyContent.service";
import { useStudyContentStore } from "@/src/store/studyContentStore";
import { STATUS_LABEL } from "@/src/types/studyContent";

export default function TodosOsConteudos() {
  const studyContentData = useStudyContentStore((state) => state.data);
  const macrotemas = studyContentData?.macrotemas ?? [];

  useEffect(() => {
    StudyContentService.initialize();
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-[#080510]" edges={["top", "bottom"]}>
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
        <Pressable
          onPress={() => router.push("/editDisciplinas")}
          className="w-10 h-10 items-center justify-center active:opacity-70"
          hitSlop={8}
        >
          <Pencil size={20} color="#dcb8ff" />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 24, paddingBottom: 140, gap: 12 }}
      >
        {macrotemas.length === 0 ? (
          <Text className="text-[#a09ba8] text-center mt-10">
            Nenhum conteúdo ainda. Envie um material para começar.
          </Text>
        ) : (
          macrotemas.map((macroTema) => (
            <Pressable
              key={macroTema.id}
              onPress={() => router.push(`/(tabs)/studyContents/${macroTema.id}`)}
              className="flex-row items-center rounded-2xl p-4 border border-white/10 bg-[#120e1c] active:opacity-80"
            >
              <View className="w-12 h-12 rounded-xl bg-[#1a1528] items-center justify-center border border-[#8a2be2]/20 mr-4">
                <Text className="text-2xl">{macroTema.emoji}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-white text-base font-semibold mb-1">
                  {macroTema.nome}
                </Text>
                <Text className="text-[#a09ba8] text-sm">
                  {STATUS_LABEL[macroTema.status]} · {macroTema.progresso}% · {macroTema.subtemas_ativos}{" "}
                  {macroTema.subtemas_ativos === 1 ? "subtema" : "subtemas"}
                </Text>
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
