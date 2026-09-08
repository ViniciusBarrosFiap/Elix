import { ArrowLeft, Pencil, Smile } from "lucide-react-native";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StudyContentService } from "@/src/services/studyContent/studyContent.service";
import { useStudyContentStore } from "@/src/store/studyContentStore";
import { MacroTema, STATUS_LABEL } from "@/src/types/studyContent";
import { MacroTemasService } from "@/src/services/macroTemas/macroTemas.service";
import { MUTED, PRIMARY, PRIMARY_LIGHT, SURFACE_SUBTEMA } from "@/src/features/studyContent/subtemaVisuals";

export default function TodosOsConteudos() {
  const studyContentData = useStudyContentStore((state) => state.data);
  const macrotemas = studyContentData?.macrotemas ?? [];

  useEffect(() => {
    StudyContentService.initialize();
  }, []);

  // Segurar o card de uma disciplina abre esse modal nativo (Modal do
  // react-native, mesmo padrão já usado em addContent.tsx) pra renomear e/ou
  // trocar o emoji — antes só dava pra mexer no nome via "Editar
  // disciplinas" (e nem o emoji tinha jeito nenhum de editar).
  const [editando, setEditando] = useState<{ id: string; nome: string; emoji: string } | null>(null);
  const [salvando, setSalvando] = useState(false);

  function abrirEdicao(macroTema: MacroTema) {
    setEditando({ id: macroTema.id, nome: macroTema.nome, emoji: macroTema.emoji });
  }

  function fecharEdicao() {
    if (salvando) return;
    setEditando(null);
  }

  async function salvarEdicao() {
    if (!editando) return;

    const nome = editando.nome.trim();
    const emoji = editando.emoji.trim();

    if (!nome) {
      Alert.alert("Nome obrigatório", "Dê um nome pra disciplina antes de salvar.");
      return;
    }
    if (!emoji) {
      Alert.alert("Emoji obrigatório", "Escolha um emoji antes de salvar.");
      return;
    }

    setSalvando(true);
    try {
      await MacroTemasService.update(editando.id, { nome, emoji });
      setEditando(null);
    } catch (err: any) {
      Alert.alert("Erro", err?.message ?? "Não foi possível salvar agora. Tente de novo.");
    } finally {
      setSalvando(false);
    }
  }

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
              onLongPress={() => abrirEdicao(macroTema)}
              delayLongPress={350}
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

      {/* Modal nativo (react-native), não bottom sheet de biblioteca — mesmo
          padrão já usado em addContent.tsx pra diálogos deste tipo. */}
      <Modal visible={!!editando} transparent animationType="fade" onRequestClose={fecharEdicao}>
        <Pressable className="flex-1 bg-black/60 justify-end" onPress={fecharEdicao}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
            <Pressable
              className="rounded-t-3xl overflow-hidden"
              style={{ backgroundColor: "#1a1528" }}
              onPress={(e) => e.stopPropagation()}
            >
              <View className="px-6 pt-5 pb-4 border-b border-white/10">
                <Text className="text-white text-base font-semibold">Editar disciplina</Text>
              </View>

              <View className="px-6 py-5">
                <View className="flex-row items-center" style={{ gap: 12, marginBottom: 20 }}>
                  {/* Emoji — o teclado do próprio celular já tem seletor de
                      emoji, então um TextInput comum dá acesso a qualquer
                      emoji, sem precisar de uma paleta fixa dentro do app. */}
                  <View
                    className="items-center justify-center rounded-2xl"
                    style={{ width: 64, height: 64, backgroundColor: SURFACE_SUBTEMA, borderWidth: 1, borderColor: `${PRIMARY}44` }}
                  >
                    <TextInput
                      value={editando?.emoji ?? ""}
                      onChangeText={(v) => setEditando((prev) => (prev ? { ...prev, emoji: v } : prev))}
                      maxLength={4}
                      textAlign="center"
                      style={{ fontSize: 28, width: "100%", color: "#fff" }}
                    />
                  </View>

                  <View className="flex-1">
                    <Text className="text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: PRIMARY_LIGHT, opacity: 0.75 }}>
                      Nome
                    </Text>
                    <TextInput
                      value={editando?.nome ?? ""}
                      onChangeText={(v) => setEditando((prev) => (prev ? { ...prev, nome: v } : prev))}
                      placeholder="Nome da disciplina"
                      placeholderTextColor={MUTED}
                      className="text-white text-base"
                      style={{
                        backgroundColor: SURFACE_SUBTEMA,
                        borderWidth: 1,
                        borderColor: `${PRIMARY}44`,
                        borderRadius: 14,
                        paddingHorizontal: 14,
                        paddingVertical: 12,
                      }}
                    />
                  </View>
                </View>

                <View className="flex-row items-center mb-5" style={{ gap: 6 }}>
                  <Smile size={13} color={MUTED} />
                  <Text className="text-[11px] flex-1" style={{ color: MUTED }}>
                    Toque no quadrado do emoji e abra o teclado de emojis do seu celular.
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={salvarEdicao}
                  disabled={salvando}
                  activeOpacity={0.85}
                  className="w-full items-center justify-center rounded-full py-4"
                  style={{ backgroundColor: PRIMARY, opacity: salvando ? 0.7 : 1 }}
                >
                  <Text className="text-white font-bold text-base">
                    {salvando ? "Salvando..." : "Salvar"}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={{ height: 20 }} />
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
