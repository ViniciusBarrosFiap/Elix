import {
  ArrowLeft,
  Bell,
  BookOpen,
  ChevronRight,
  FlaskConical,
  FolderPlus,
  Home,
  Link2,
  ListChecks,
  LogIn,
  Sparkles,
  Trophy,
  UserPlus,
} from "lucide-react-native";
import { router } from "expo-router";
import { useState } from "react";
import { ScrollView, StatusBar, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { UserService } from "@/src/services/user/user.service";
import { StudyContentService } from "@/src/services/studyContent/studyContent.service";
import { QuizQuestionsService } from "@/src/services/quiz/quiz.service";
import { useUserDataStore } from "@/src/store/userDataStore";
import { useStudyContentStore } from "@/src/store/studyContentStore";
import { useQuizQuestionsStore } from "@/src/store/quizQuestionsStore";
import { useQuizSessionStore } from "@/src/store/quizSessionStore";
import { colors, semantic, surfaceDim } from "@/src/theme/colors";
import { ativarDevTestMode, desativarDevTestMode } from "@/src/dev/devTestMode";
import { mockQuizQuestions, mockStudyContent, mockUserData } from "@/src/dev/mockData";

const PRIMARY = colors.primaryContainer;
const PRIMARY_LIGHT = colors.primary;
const SURFACE_DIM = surfaceDim.base;
const SURFACE_CARD = surfaceDim.subtema;
const MUTED = semantic.muted;

function ativarComMock(fezUpload: boolean) {
  ativarDevTestMode();
  useUserDataStore.getState().setData(mockUserData({ fezUpload }));
  if (fezUpload) {
    useStudyContentStore.getState().setData(mockStudyContent());
  } else {
    useStudyContentStore.getState().reset();
  }
}

function ativarQuizMock() {
  ativarDevTestMode();
  useUserDataStore.getState().setData(mockUserData());
  useQuizQuestionsStore.getState().setData(mockQuizQuestions());
  // Zera o "trava por hoje" da sessão — sem isso, testar o quiz mais de uma
  // vez no mesmo dia manteria o progresso (acertos/elixir) do teste anterior.
  useQuizSessionStore.setState({ data: "", totalSessao: 0, elixirMaximo: 0, acertos: 0, erros: 0, elixirTotal: 0 });
}

function ativarStudyContentMock() {
  ativarDevTestMode();
  useUserDataStore.getState().setData(mockUserData());
  useStudyContentStore.getState().setData(mockStudyContent());
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 28 }}>
      <Text
        className="text-[11px] font-bold uppercase tracking-wider mb-3"
        style={{ color: PRIMARY_LIGHT, opacity: 0.75 }}
      >
        {title}
      </Text>
      <View
        className="rounded-[24px] overflow-hidden"
        style={{ backgroundColor: SURFACE_CARD, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" }}
      >
        {children}
      </View>
    </View>
  );
}

function Row({
  icon,
  label,
  description,
  onPress,
  isLast,
}: {
  icon: React.ReactNode;
  label: string;
  description?: string;
  onPress: () => void;
  isLast?: boolean;
}) {
  return (
    <>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        style={{ flexDirection: "row", alignItems: "center", paddingVertical: 14, paddingHorizontal: 16 }}
      >
        <View className="mr-3">{icon}</View>
        <View style={{ flex: 1 }}>
          <Text className="font-medium" style={{ color: "#fff", fontSize: 15 }}>
            {label}
          </Text>
          {!!description && (
            <Text className="text-xs mt-0.5" style={{ color: MUTED }}>
              {description}
            </Text>
          )}
        </View>
        <ChevronRight size={18} color={MUTED} />
      </TouchableOpacity>
      {!isLast && <View style={{ height: 1, backgroundColor: "rgba(255,255,255,0.06)" }} />}
    </>
  );
}

export default function TestesScreen() {
  const [modoTesteAtivo, setModoTesteAtivo] = useState(false);

  function marcarAtivo() {
    setModoTesteAtivo(true);
  }

  function irPara(path: string) {
    router.push(path as any);
  }

  async function sairDoModoTeste() {
    desativarDevTestMode();
    setModoTesteAtivo(false);
    await Promise.all([UserService.initialize(), StudyContentService.initialize(), QuizQuestionsService.initialize()]);
    router.push("/(tabs)/home" as any);
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: SURFACE_DIM }} edges={["top", "bottom"]}>
      <StatusBar barStyle="light-content" />

      <View className="flex-row items-center px-6 pt-2 pb-4">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 -ml-1 items-center justify-center active:opacity-70"
          hitSlop={8}
        >
          <ArrowLeft size={24} color={PRIMARY_LIGHT} />
        </TouchableOpacity>
        <View className="flex-1 items-center mr-10">
          <Text className="text-white text-lg font-bold">Testes</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 60 }}>
        <View className="items-center mb-6">
          <View
            className="w-14 h-14 rounded-full items-center justify-center mb-3"
            style={{ backgroundColor: `${PRIMARY}22`, borderWidth: 1, borderColor: `${PRIMARY}55` }}
          >
            <FlaskConical size={26} color={PRIMARY_LIGHT} />
          </View>
          <Text className="text-white text-sm text-center" style={{ maxWidth: 300, color: MUTED }}>
            Atalhos só pra desenvolvimento: abre qualquer tela já com dados de exemplo, sem precisar subir material
            nem esperar a IA gerar nada.
          </Text>
        </View>

        {modoTesteAtivo && (
          <TouchableOpacity
            onPress={sairDoModoTeste}
            activeOpacity={0.85}
            className="flex-row items-center justify-center rounded-2xl px-4 py-3 mb-6"
            style={{ backgroundColor: `${semantic.warning}1f`, borderWidth: 1, borderColor: `${semantic.warning}55` }}
          >
            <Text className="text-xs font-bold" style={{ color: semantic.warning }}>
              Modo Teste ativo (dados de exemplo) — toque para sair e recarregar seus dados reais
            </Text>
          </TouchableOpacity>
        )}

        <Section title="Onboarding e cadastro">
          <Row
            icon={<Sparkles size={18} color={PRIMARY_LIGHT} />}
            label="Boas-vindas"
            onPress={() => irPara("/welcome")}
          />
          <Row
            icon={<UserPlus size={18} color={PRIMARY_LIGHT} />}
            label="Cadastro (curso e semestre)"
            onPress={() => irPara("/signUp")}
          />
          <Row
            icon={<ListChecks size={18} color={PRIMARY_LIGHT} />}
            label="Escolher disciplinas"
            onPress={() => irPara("/addSubjects")}
          />
          <Row
            icon={<Bell size={18} color={PRIMARY_LIGHT} />}
            label="Lembrete de notificação"
            onPress={() => irPara("/reminder")}
          />
          <Row
            icon={<LogIn size={18} color={PRIMARY_LIGHT} />}
            label="Tela de carregamento"
            description="Frasco animado usado entre as etapas"
            onPress={() =>
              router.push({
                pathname: "/loadingScreen",
                params: { next: "/home", title: "Aguarde um momento...", subtitle: "Testando a tela de loading" },
              } as any)
            }
            isLast
          />
        </Section>

        <Section title="Home">
          <Row
            icon={<Home size={18} color={PRIMARY_LIGHT} />}
            label="Home com conteúdo"
            description="Dose do dia + disciplinas de exemplo"
            onPress={() => {
              ativarComMock(true);
              marcarAtivo();
              irPara("/(tabs)/home");
            }}
          />
          <Row
            icon={<Home size={18} color={PRIMARY_LIGHT} />}
            label="Home vazia (sem upload)"
            description="Estado de 'vamos começar'"
            onPress={() => {
              ativarComMock(false);
              marcarAtivo();
              irPara("/(tabs)/home");
            }}
            isLast
          />
        </Section>

        <Section title="Quiz">
          <Row
            icon={<Sparkles size={18} color={PRIMARY_LIGHT} />}
            label="Responder quiz (níveis 1 a 4)"
            description="Inclui a pergunta dissertativa (nível 4)"
            onPress={() => {
              ativarQuizMock();
              marcarAtivo();
              irPara("/(tabs)/quiz");
            }}
          />
          <Row
            icon={<Trophy size={18} color={PRIMARY_LIGHT} />}
            label="Tela de resultado"
            onPress={() => irPara("/(tabs)/quiz/result")}
            isLast
          />
        </Section>

        <Section title="Conteúdo de estudo">
          <Row
            icon={<BookOpen size={18} color={PRIMARY_LIGHT} />}
            label="Lista de disciplinas"
            onPress={() => {
              ativarStudyContentMock();
              marcarAtivo();
              irPara("/(tabs)/studyContents");
            }}
          />
          <Row
            icon={<BookOpen size={18} color={PRIMARY_LIGHT} />}
            label="Detalhe de uma disciplina"
            description="Subtemas, conceitos em todos os status e materiais"
            onPress={() => {
              ativarStudyContentMock();
              marcarAtivo();
              irPara(`/(tabs)/studyContents/${mockStudyContent().macrotemas[0].id}`);
            }}
          />
          <Row
            icon={<FolderPlus size={18} color={PRIMARY_LIGHT} />}
            label="Adicionar conteúdo"
            onPress={() => irPara("/(tabs)/studyContents/addContent")}
          />
          <Row
            icon={<ListChecks size={18} color={PRIMARY_LIGHT} />}
            label="Editar disciplinas"
            onPress={() => {
              ativarStudyContentMock();
              marcarAtivo();
              irPara("/editDisciplinas");
            }}
            isLast
          />
        </Section>

        <Section title="Integrações">
          <Row icon={<Link2 size={18} color={PRIMARY_LIGHT} />} label="Conectar Notion" onPress={() => irPara("/connectNotion")} isLast />
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}
