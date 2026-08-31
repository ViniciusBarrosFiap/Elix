import {
  ArrowLeft,
  ChevronRight,
  ExternalLink,
  Flame,
  Sparkles,
  TrendingUp,
  Trophy,
} from "lucide-react-native";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo } from "react";
import { ActivityIndicator, Pressable, ScrollView, StatusBar, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { StudyContentService } from "@/src/services/studyContent/studyContent.service";
import { useStudyContentStore } from "@/src/store/studyContentStore";
import { STATUS_LABEL } from "@/src/types/studyContent";
import { useAbrirMaterial } from "@/src/features/studyContent/useAbrirMaterial";
import {
  MATERIAL_TIPO_ICON,
  MATERIAL_TIPO_LABEL,
  MUTED,
  ON_PRIMARY_CONTAINER,
  PRIMARY,
  PRIMARY_LIGHT,
  SURFACE_DIM,
  SURFACE_SUBTEMA,
} from "@/src/features/studyContent/subtemaVisuals";

export default function DisciplinaDetalhe() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const studyContentData = useStudyContentStore((state) => state.data);
  const macroTema = studyContentData?.macrotemas.find((m) => m.id === id);

  const { abrirMaterial, abrindoId } = useAbrirMaterial();

  // Agrupa os subtemas pelo material que os gerou — cada material vira um
  // resumo tocável aqui, que leva pra própria tela dele (subtemas/conceitos
  // ficam lá, não mais expandidos nesta tela).
  interface ResumoMaterial {
    material: NonNullable<typeof macroTema>["subtemas"][number]["material"];
    totalSubtemas: number;
    totalConceitos: number;
    totalErros: number;
  }

  const materiais = useMemo<ResumoMaterial[]>(() => {
    if (!macroTema) return [];

    const porMaterial = new Map<string, ResumoMaterial>();
    for (const subtema of macroTema.subtemas) {
      const resumo = porMaterial.get(subtema.material.id) ?? {
        material: subtema.material,
        totalSubtemas: 0,
        totalConceitos: 0,
        totalErros: 0,
      };
      resumo.totalSubtemas += 1;
      resumo.totalConceitos += subtema.conceitos.length;
      resumo.totalErros += subtema.conceitos.filter((c) => c.performance.erros > 0).length;
      porMaterial.set(subtema.material.id, resumo);
    }

    // Materiais com mais conceitos pedindo atenção aparecem primeiro.
    return Array.from(porMaterial.values()).sort((a, b) => b.totalErros - a.totalErros);
  }, [macroTema]);

  // Resumo de gamificação da disciplina: quantos conceitos já foram
  // dominados vs. quantos ainda estão em reforço — dá peso visual ao
  // progresso, além do % de domínio isolado.
  const { totalConceitos, dominados, emReforco } = useMemo(() => {
    const todos = macroTema?.subtemas.flatMap((s) => s.conceitos) ?? [];
    return {
      totalConceitos: todos.length,
      dominados: todos.filter((c) => c.status === "dominado").length,
      emReforco: todos.filter((c) => c.status === "em_reforco").length,
    };
  }, [macroTema]);

  useEffect(() => {
    StudyContentService.initialize();
  }, []);

  const renderMaterial = (resumo: ResumoMaterial) => {
    const { material, totalSubtemas, totalConceitos: conceitosDoMaterial, totalErros } = resumo;
    const MaterialIcon = MATERIAL_TIPO_ICON[material.tipo];
    const podeAbrir = material.tipo !== "notion";
    const abrindo = abrindoId === material.id;

    return (
      <Pressable
        key={material.id}
        onPress={() => router.push(`/studyContents/${macroTema!.id}/${material.id}`)}
        className="rounded-[24px] p-4 flex-row items-center active:opacity-80"
        style={{ backgroundColor: SURFACE_SUBTEMA, borderWidth: 1, borderColor: `${PRIMARY}26` }}
      >
        <View
          className="w-10 h-10 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: `${PRIMARY}33`, borderWidth: 1, borderColor: `${PRIMARY}66` }}
        >
          <MaterialIcon size={17} color={PRIMARY_LIGHT} />
        </View>

        <View className="flex-1 mr-2">
          <Text
            className="text-[10px] font-bold uppercase tracking-wider mb-0.5"
            style={{ color: PRIMARY_LIGHT, opacity: 0.65 }}
          >
            {MATERIAL_TIPO_LABEL[material.tipo]}
          </Text>
          <Text className="text-white text-base font-bold mb-1" numberOfLines={1}>
            {material.nome}
          </Text>
          <Text className="text-xs" style={{ color: MUTED }}>
            {totalSubtemas} {totalSubtemas === 1 ? "subtema" : "subtemas"} · {conceitosDoMaterial}{" "}
            {conceitosDoMaterial === 1 ? "conceito" : "conceitos"}
            {totalErros > 0 ? ` · ${totalErros} com erro` : ""}
          </Text>
        </View>

        {podeAbrir && (
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              abrirMaterial(material);
            }}
            disabled={abrindo}
            className="items-center justify-center active:opacity-60"
            hitSlop={8}
            style={{ width: 32, height: 32 }}
          >
            {abrindo ? (
              <ActivityIndicator size="small" color={PRIMARY_LIGHT} />
            ) : (
              <ExternalLink size={16} color={PRIMARY_LIGHT} />
            )}
          </Pressable>
        )}

        <ChevronRight size={18} color="rgba(255,255,255,0.25)" />
      </Pressable>
    );
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: SURFACE_DIM }} edges={["top", "bottom"]}>
      <StatusBar barStyle="light-content" />

      {/* Glow ambiente roxo atrás do header/hero — mesma ideia do
          .ambient-glow do design system, feito com o LinearGradient que já
          existe no projeto (sem dependência nova). */}
      <LinearGradient
        colors={[`${PRIMARY}40`, "rgba(8,5,16,0)"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{ position: "absolute", top: 0, left: 0, right: 0, height: 280 }}
        pointerEvents="none"
      />

      <View className="px-6 pt-4 pb-2 flex-row items-center">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 -ml-1 items-center justify-center active:opacity-70"
          hitSlop={8}
        >
          <ArrowLeft size={24} color={PRIMARY_LIGHT} />
        </Pressable>
      </View>

      {!macroTema ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text style={{ color: MUTED }} className="text-center">
            Carregando disciplina...
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 48 }}
        >
          {/* Hero — agora rola junto com o resto da tela, em vez de ficar
              fixo enquanto só a lista de materiais se move. */}
          <View className="pb-4">
            <View className="items-center mb-2">
              <View
                className="w-16 h-16 rounded-full items-center justify-center mb-4"
                style={{
                  backgroundColor: "rgba(18,14,28,0.5)",
                  borderWidth: 1,
                  borderColor: `${PRIMARY}4D`,
                  shadowColor: PRIMARY,
                  shadowOpacity: 0.25,
                  shadowRadius: 16,
                  shadowOffset: { width: 0, height: 0 },
                }}
              >
                <Text style={{ fontSize: 30 }}>{macroTema.emoji}</Text>
              </View>

              <Text className="text-white text-2xl font-bold text-center mb-2" numberOfLines={2}>
                {macroTema.nome}
              </Text>

              <View className="flex-row items-center mb-4">
                <TrendingUp size={16} color={PRIMARY_LIGHT} />
                <Text className="text-sm ml-1.5" style={{ color: MUTED }}>
                  {STATUS_LABEL[macroTema.status]}
                </Text>
              </View>
            </View>

            {/* Cartão de domínio — número grande em destaque + barra mais
                espessa com glow, pra puxar o olho antes de qualquer outra
                coisa na tela. */}
            <View
              className="rounded-[24px] px-5 pt-5 pb-4 mb-3"
              style={{
                backgroundColor: SURFACE_SUBTEMA,
                borderWidth: 1,
                borderColor: `${PRIMARY}33`,
              }}
            >
              <View className="flex-row items-end justify-between mb-3">
                <View>
                  <Text
                    className="font-extrabold"
                    style={{ color: PRIMARY_LIGHT, fontSize: 40, lineHeight: 42 }}
                  >
                    {macroTema.progresso}%
                  </Text>
                  <Text className="text-xs font-medium" style={{ color: MUTED }}>
                    de domínio da disciplina
                  </Text>
                </View>
              </View>

              <View
                className="w-full h-3 rounded-full overflow-hidden"
                style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
              >
                <View
                  className="h-full rounded-full"
                  style={{
                    width: `${macroTema.progresso}%`,
                    backgroundColor: PRIMARY,
                    shadowColor: PRIMARY,
                    shadowOpacity: 0.8,
                    shadowRadius: 6,
                    shadowOffset: { width: 0, height: 0 },
                  }}
                />
              </View>
            </View>

            {/* Mini-stats de gamificação: quanto já foi dominado vs. quanto
                ainda precisa de reforço — dois números que antes não
                apareciam nessa tela. */}
            {totalConceitos > 0 && (
              <View className="flex-row" style={{ gap: 12 }}>
                <View
                  className="flex-1 flex-row items-center rounded-2xl px-4 py-3"
                  style={{ backgroundColor: "rgba(34,197,94,0.1)", borderWidth: 1, borderColor: "rgba(34,197,94,0.25)" }}
                >
                  <View
                    className="w-9 h-9 rounded-full items-center justify-center mr-3"
                    style={{ backgroundColor: "rgba(34,197,94,0.18)" }}
                  >
                    <Trophy size={17} color="#22c55e" />
                  </View>
                  <View>
                    <Text className="text-white font-bold" style={{ fontSize: 17 }}>
                      {dominados}/{totalConceitos}
                    </Text>
                    <Text className="text-[11px]" style={{ color: MUTED }}>
                      dominados
                    </Text>
                  </View>
                </View>

                <View
                  className="flex-1 flex-row items-center rounded-2xl px-4 py-3"
                  style={{ backgroundColor: "rgba(240,160,48,0.1)", borderWidth: 1, borderColor: "rgba(240,160,48,0.25)" }}
                >
                  <View
                    className="w-9 h-9 rounded-full items-center justify-center mr-3"
                    style={{ backgroundColor: "rgba(240,160,48,0.18)" }}
                  >
                    <Flame size={17} color="#f0a030" />
                  </View>
                  <View>
                    <Text className="text-white font-bold" style={{ fontSize: 17 }}>
                      {emReforco}
                    </Text>
                    <Text className="text-[11px]" style={{ color: MUTED }}>
                      em reforço
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* Um resumo tocável por material — abre a tela própria dele com
              os subtemas/conceitos, em vez de expandir aqui */}
          <View style={{ gap: 20 }}>
            {macroTema.subtemas_ativos === 0 ? (
              <Text style={{ color: MUTED }} className="text-center mt-10">
                Nenhum conteúdo ainda. Envie um material pra essa disciplina pra começar.
              </Text>
            ) : (
              <>
                <View>
                  <Text
                    className="text-[11px] font-bold uppercase tracking-wider mb-3"
                    style={{ color: PRIMARY_LIGHT, opacity: 0.75, paddingHorizontal: 2 }}
                  >
                    Materiais
                  </Text>
                  <View style={{ gap: 12 }}>{materiais.map(renderMaterial)}</View>
                </View>

                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: "/(tabs)/quiz",
                      params: { macroTemaId: macroTema.id },
                    })
                  }
                  className="active:opacity-90"
                >
                  <LinearGradient
                    colors={[PRIMARY, "#5b3285"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      borderRadius: 20,
                      shadowColor: PRIMARY,
                      shadowOpacity: 0.35,
                      shadowRadius: 20,
                      shadowOffset: { width: 0, height: 0 },
                    }}
                  >
                    <View className="flex-row items-center justify-center py-4 gap-2">
                      <Sparkles size={18} color={ON_PRIMARY_CONTAINER} />
                      <Text className="font-semibold text-base" style={{ color: ON_PRIMARY_CONTAINER }}>
                        Revisar disciplina
                      </Text>
                    </View>
                  </LinearGradient>
                </Pressable>
              </>
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
