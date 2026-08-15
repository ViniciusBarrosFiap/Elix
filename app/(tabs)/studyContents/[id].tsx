import { ArrowLeft, Star } from "lucide-react-native";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect } from "react";
import { Pressable, ScrollView, StatusBar, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { StudyContentService } from "@/src/services/studyContent/studyContent.service";
import { useStudyContentStore } from "@/src/store/studyContentStore";
import { STATUS_LABEL, STATUS_CONCEITO_LABEL, StatusConceito } from "@/src/types/studyContent";

const STATUS_CONCEITO_COLOR: Record<StatusConceito, string> = {
  novo: "#a09ba8",
  em_reforco: "#f0a030",
  consolidando: "#60a5fa",
  dominado: "#22c55e",
};

export default function DisciplinaDetalhe() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const studyContentData = useStudyContentStore((state) => state.data);
  const macroTema = studyContentData?.macrotemas.find((m) => m.id === id);

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
        <Text className="text-white text-xl font-bold ml-2" numberOfLines={1}>
          {macroTema?.nome ?? "Disciplina"}
        </Text>
      </View>

      {!macroTema ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-[#a09ba8] text-center">Carregando disciplina...</Text>
        </View>
      ) : (
        <>
          <View className="px-6 pb-4">
            <View className="flex-row items-center rounded-2xl p-4 border border-white/10 bg-[#120e1c]">
              <View className="w-14 h-14 rounded-xl bg-[#1a1528] items-center justify-center border border-[#8a2be2]/20 mr-4">
                <Text className="text-3xl">{macroTema.emoji}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-[#a09ba8] text-sm">
                  {STATUS_LABEL[macroTema.status]} · {macroTema.progresso}% de domínio
                </Text>
                <View className="h-2 rounded-full bg-white/10 mt-2 overflow-hidden">
                  <View
                    className="h-full rounded-full bg-[#8a2be2]"
                    style={{ width: `${macroTema.progresso}%` }}
                  />
                </View>
              </View>
            </View>

            {macroTema.subtemas_ativos > 0 && (
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/(tabs)/quiz",
                    params: { macroTemaId: macroTema.id },
                  })
                }
                className="active:opacity-90 mt-4"
              >
                <LinearGradient
                  colors={["#7b2cbf", "#5a189a"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ borderRadius: 18 }}
                >
                  <View className="items-center py-4">
                    <Text className="text-white font-semibold text-base">
                      Revisar esta disciplina agora
                    </Text>
                  </View>
                </LinearGradient>
              </Pressable>
            )}
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 140, gap: 20 }}
          >
            {macroTema.subtemas_ativos === 0 ? (
              <Text className="text-[#a09ba8] text-center mt-10">
                Nenhum conteúdo ainda. Envie um material pra essa disciplina pra começar.
              </Text>
            ) : (
              macroTema.subtemas.map((subtema) => (
                <View key={subtema.id}>
                  <Text className="text-white text-base font-semibold mb-1">{subtema.nome}</Text>
                  <Text className="text-[#a09ba8] text-xs mb-3">{STATUS_LABEL[subtema.status]}</Text>

                  <View style={{ gap: 10 }}>
                    {subtema.conceitos.map((conceito) => (
                      <View
                        key={conceito.id}
                        className="rounded-2xl p-4 border border-white/10 bg-[#120e1c]"
                      >
                        <View className="flex-row items-center justify-between mb-2">
                          <View className="flex-row items-center flex-1 mr-2">
                            <Text className="text-white text-sm font-medium flex-1" numberOfLines={2}>
                              {conceito.nome}
                            </Text>
                            {conceito.tag_foco && (
                              <Star size={14} color="#f0a030" fill="#f0a030" style={{ marginLeft: 6 }} />
                            )}
                          </View>
                          <View
                            className="px-2.5 py-1 rounded-full"
                            style={{ backgroundColor: `${STATUS_CONCEITO_COLOR[conceito.status]}22` }}
                          >
                            <Text
                              className="text-[10px] uppercase font-bold tracking-wider"
                              style={{ color: STATUS_CONCEITO_COLOR[conceito.status] }}
                            >
                              {STATUS_CONCEITO_LABEL[conceito.status]}
                            </Text>
                          </View>
                        </View>

                        <View className="flex-row items-center justify-between">
                          <Text className="text-[#a09ba8] text-xs">
                            Nível {conceito.nivel_atual}/3
                          </Text>
                          <Text className="text-[#a09ba8] text-xs">
                            {conceito.performance.acertos} acertos · {conceito.performance.erros} erros
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </>
      )}
    </SafeAreaView>
  );
}
