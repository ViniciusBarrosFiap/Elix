import {
  Bell,
  Brain,
  ChevronRight,
  Cloud,
  Droplet,
  Flame,
  LogOut,
  Pencil,
  Trash2,
  User,
} from "lucide-react-native";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StatusBar, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { AuthService } from "@/src/services/auth/auth.service";
import { UserRepository } from "@/src/services/user/user.repository";
import { useUserDataStore } from "@/src/store/userDataStore";
import { useStudyContentStore } from "@/src/store/studyContentStore";
import { useQuizQuestionsStore } from "@/src/store/quizQuestionsStore";
import { colors, semantic, surfaceDim } from "@/src/theme/colors";

// Mesma paleta "The Cognitive Sanctuary" já usada em studyContents/[id]/index.tsx —
// reaproveitada aqui pra essa tela ler como parte do mesmo app.
const PRIMARY = colors.primaryContainer;
const PRIMARY_LIGHT = colors.primary;
const ON_PRIMARY_CONTAINER = colors.onPrimaryContainer;
const SURFACE_DIM = surfaceDim.base;
const SURFACE_CARD = surfaceDim.subtema;
const MUTED = semantic.muted;
const ERROR = semantic.danger;

function StatCard({ icon, value, label, color }: { icon: React.ReactNode; value: string; label: string; color: string }) {
  return (
    <View
      className="flex-1 items-center justify-center rounded-2xl py-4"
      style={{ backgroundColor: SURFACE_CARD, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" }}
    >
      <View
        className="w-9 h-9 rounded-full items-center justify-center mb-2"
        style={{ backgroundColor: `${color}22` }}
      >
        {icon}
      </View>
      <Text className="text-white font-bold" style={{ fontSize: 18 }}>
        {value}
      </Text>
      <Text
        className="text-[10px] uppercase font-semibold tracking-wider text-center mt-1"
        style={{ color: MUTED }}
      >
        {label}
      </Text>
    </View>
  );
}

function SettingsRow({
  icon,
  label,
  onPress,
  trailing,
  destructive,
  loading,
}: {
  icon: React.ReactNode;
  label: string;
  onPress?: () => void;
  trailing?: React.ReactNode;
  destructive?: boolean;
  loading?: boolean;
}) {
  const interativo = !!onPress && !loading;

  return (
    <Pressable
      onPress={interativo ? onPress : undefined}
      className={interativo ? "active:opacity-60" : ""}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 14,
        paddingHorizontal: 16,
      }}
    >
      <View className="mr-3">{icon}</View>
      <Text
        className="flex-1 font-medium"
        style={{ color: destructive ? ERROR : "#fff", fontSize: 15 }}
      >
        {label}
      </Text>
      {loading ? (
        <ActivityIndicator size="small" color={PRIMARY_LIGHT} />
      ) : (
        trailing ?? (interativo && <ChevronRight size={18} color={MUTED} />)
      )}
    </Pressable>
  );
}

export default function ProfileScreen() {
  const userData = useUserDataStore((state) => state.data);
  const studyContentData = useStudyContentStore((state) => state.data);
  const [apagando, setApagando] = useState(false);
  const [saindo, setSaindo] = useState(false);

  const sair = () => {
    Alert.alert("Sair", "Você vai precisar entrar de novo com seu e-mail e senha.", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: async () => {
          setSaindo(true);
          try {
            await AuthService.signOut();
            useUserDataStore.getState().reset();
            useStudyContentStore.getState().reset();
            useQuizQuestionsStore.getState().reset();
            router.replace("/");
          } catch {
            Alert.alert("Erro", "Não foi possível sair agora. Tente de novo.");
          } finally {
            setSaindo(false);
          }
        },
      },
    ]);
  };

  // Domínio médio real, calculado a partir do progresso já persistido de
  // cada disciplina (mesmo campo mostrado em studyContents/[id]/index.tsx) — não é
  // um número inventado, some pra 0 se ainda não há nenhuma disciplina.
  const dominioMedio = useMemo(() => {
    const macrotemas = studyContentData?.macrotemas ?? [];
    if (macrotemas.length === 0) return 0;
    const soma = macrotemas.reduce((acc, m) => acc + m.progresso, 0);
    return Math.round(soma / macrotemas.length);
  }, [studyContentData]);

  const apagarDados = () => {
    Alert.alert(
      "Apagar meus dados",
      "Isso apaga permanentemente seu progresso no servidor (disciplinas, materiais, conceitos, perguntas) e a sua conta — não tem como desfazer. Deseja continuar?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Apagar",
          style: "destructive",
          onPress: async () => {
            setApagando(true);
            try {
              // Precisa rodar ANTES de sair — é a sessão atual que autentica
              // qual usuário apagar no servidor (ver authMiddleware.ts).
              await UserRepository.deleteAccount();

              // Sem conta não tem como "reidentificar" — volta pra
              // welcome/login, igual a um logout comum.
              await AuthService.signOut();
              useUserDataStore.getState().reset();
              useStudyContentStore.getState().reset();
              useQuizQuestionsStore.getState().reset();

              router.replace("/");
            } catch {
              Alert.alert("Erro", "Não foi possível apagar os dados agora. Tente de novo.");
            } finally {
              setApagando(false);
            }
          },
        },
      ]
    );
  };

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

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 140 }}>
        {/* Avatar + identidade */}
        <View className="items-center pt-6 pb-6">
          <View
            className="w-24 h-24 rounded-full items-center justify-center mb-4"
            style={{
              backgroundColor: "rgba(18,14,28,0.5)",
              borderWidth: 2,
              borderColor: `${PRIMARY_LIGHT}55`,
              shadowColor: PRIMARY,
              shadowOpacity: 0.35,
              shadowRadius: 20,
              shadowOffset: { width: 0, height: 0 },
            }}
          >
            <User size={40} color={PRIMARY_LIGHT} />
          </View>

          <Text className="text-white text-2xl font-bold text-center">{userData?.nome ?? "Você"}</Text>
          {!!userData?.curso && (
            <Text
              className="text-xs font-semibold uppercase tracking-wider mt-1"
              style={{ color: MUTED }}
            >
              {userData.curso}
              {userData.semestre ? ` · ${userData.semestre}º semestre` : ""}
            </Text>
          )}
        </View>

        {/* Stats */}
        <View className="flex-row" style={{ gap: 12, marginBottom: 28 }}>
          <StatCard
            icon={<Flame size={18} color={semantic.warning} />}
            value={String(userData?.streak ?? 0)}
            label="Ofensiva"
            color={semantic.warning}
          />
          <StatCard
            icon={<Droplet size={18} color={PRIMARY_LIGHT} />}
            value={String(userData?.pontuacao ?? 0)}
            label="Elixir"
            color={PRIMARY_LIGHT}
          />
          <StatCard
            icon={<Brain size={18} color={semantic.info} />}
            value={`${dominioMedio}%`}
            label="Domínio médio"
            color={semantic.info}
          />
        </View>

        {/* Configurações */}
        <Text className="text-[11px] font-bold uppercase tracking-wider mb-3" style={{ color: PRIMARY_LIGHT, opacity: 0.75 }}>
          Configurações
        </Text>

        <View className="rounded-[24px] overflow-hidden" style={{ backgroundColor: SURFACE_CARD, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" }}>
          <SettingsRow
            icon={<Pencil size={18} color={PRIMARY_LIGHT} />}
            label="Editar disciplinas"
            onPress={() => router.push("/editDisciplinas")}
          />
          <View style={{ height: 1, backgroundColor: "rgba(255,255,255,0.06)" }} />

          <SettingsRow icon={<Bell size={18} color={PRIMARY_LIGHT} />} label="Notificações" />
          <View style={{ height: 1, backgroundColor: "rgba(255,255,255,0.06)" }} />

          <SettingsRow
            icon={<Cloud size={18} color={PRIMARY_LIGHT} />}
            label="Status de sincronização"
            trailing={
              <View className="rounded-full px-2.5 py-1" style={{ backgroundColor: `${PRIMARY}22` }}>
                <Text className="text-[10px] font-bold" style={{ color: PRIMARY_LIGHT }}>
                  {userData ? "Sincronizado" : "..."}
                </Text>
              </View>
            }
          />
          <View style={{ height: 1, backgroundColor: "rgba(255,255,255,0.06)" }} />

          <SettingsRow
            icon={<LogOut size={18} color={PRIMARY_LIGHT} />}
            label="Sair"
            loading={saindo}
            onPress={sair}
          />
          <View style={{ height: 1, backgroundColor: "rgba(255,255,255,0.06)" }} />

          <SettingsRow
            icon={<Trash2 size={18} color={ERROR} />}
            label="Apagar meus dados"
            destructive
            loading={apagando}
            onPress={apagarDados}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
