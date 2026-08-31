import { ActivityIndicator } from "react-native";
import { ArrowLeft, ExternalLink } from "lucide-react-native";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo } from "react";
import { Pressable, ScrollView, StatusBar, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { StudyContentService } from "@/src/services/studyContent/studyContent.service";
import { useStudyContentStore } from "@/src/store/studyContentStore";
import { useAbrirMaterial } from "@/src/features/studyContent/useAbrirMaterial";
import { SubtemaRow } from "@/src/features/studyContent/SubtemaRow";
import {
  MATERIAL_TIPO_ICON,
  MATERIAL_TIPO_LABEL,
  MUTED,
  PRIMARY,
  PRIMARY_LIGHT,
  SURFACE_DIM,
  SURFACE_SUBTEMA,
} from "@/src/features/studyContent/subtemaVisuals";

/**
 * Tela dedicada de um material (documento/vídeo/página) dentro de uma
 * disciplina — mostra os subtemas e conceitos que ele gerou, um nível
 * abaixo da tela de disciplina (que agora só lista os materiais).
 */
export default function MaterialDetalhe() {
  const { id, materialId } = useLocalSearchParams<{ id: string; materialId: string }>();
  const studyContentData = useStudyContentStore((state) => state.data);
  const macroTema = studyContentData?.macrotemas.find((m) => m.id === id);

  const { abrirMaterial, abrindoId } = useAbrirMaterial();

  const subtemasDoMaterial = useMemo(
    () => macroTema?.subtemas.filter((s) => s.material.id === materialId) ?? [],
    [macroTema, materialId]
  );

  const material = subtemasDoMaterial[0]?.material;

  useEffect(() => {
    StudyContentService.initialize();
  }, []);

  const totalConceitos = subtemasDoMaterial.reduce((acc, s) => acc + s.conceitos.length, 0);
  const MaterialIcon = material ? MATERIAL_TIPO_ICON[material.tipo] : null;
  const podeAbrir = material && material.tipo !== "notion";
  const abrindo = material ? abrindoId === material.id : false;

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: SURFACE_DIM }} edges={["top", "bottom"]}>
      <StatusBar barStyle="light-content" />

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

      {!material ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text style={{ color: MUTED }} className="text-center">
            Carregando material...
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 48 }}
        >
          {/* Hero do material — mesmo vocabulário da hero de disciplina, uma
              escala abaixo (sem % de domínio, já que isso é da disciplina). */}
          <View className="items-center mb-6">
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
              {MaterialIcon && <MaterialIcon size={28} color={PRIMARY_LIGHT} />}
            </View>

            <Text
              className="text-[11px] font-bold uppercase tracking-wider mb-1"
              style={{ color: PRIMARY_LIGHT, opacity: 0.7 }}
            >
              {MATERIAL_TIPO_LABEL[material.tipo]}
            </Text>

            <Text className="text-white text-xl font-bold text-center mb-3" numberOfLines={2}>
              {material.nome}
            </Text>

            <Text className="text-sm mb-4" style={{ color: MUTED }}>
              {subtemasDoMaterial.length} {subtemasDoMaterial.length === 1 ? "subtema" : "subtemas"} · {totalConceitos}{" "}
              {totalConceitos === 1 ? "conceito" : "conceitos"}
            </Text>

            {podeAbrir && (
              <Pressable
                onPress={() => abrirMaterial(material)}
                disabled={abrindo}
                className="flex-row items-center rounded-full px-4 py-2.5 active:opacity-80"
                style={{ backgroundColor: `${PRIMARY}22`, borderWidth: 1, borderColor: `${PRIMARY}55` }}
              >
                {abrindo ? (
                  <ActivityIndicator size="small" color={PRIMARY_LIGHT} />
                ) : (
                  <ExternalLink size={15} color={PRIMARY_LIGHT} />
                )}
                <Text className="text-sm font-semibold ml-2" style={{ color: PRIMARY_LIGHT }}>
                  Abrir material original
                </Text>
              </Pressable>
            )}
          </View>

          {/* Subtemas/conceitos deste material */}
          <View
            className="rounded-[28px] p-4"
            style={{ backgroundColor: SURFACE_SUBTEMA, borderWidth: 1, borderColor: `${PRIMARY}26` }}
          >
            {subtemasDoMaterial.map((subtema, index) => (
              <SubtemaRow key={subtema.id} subtema={subtema} isLast={index === subtemasDoMaterial.length - 1} />
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
