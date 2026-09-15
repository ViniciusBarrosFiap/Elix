import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronUp,
  CirclePlay,
  FileText,
  NotebookText,
  RefreshCw,
} from "lucide-react-native";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, StatusBar, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Markdown from "react-native-markdown-display";
import { StudyContentService } from "@/src/services/studyContent/studyContent.service";
import { useStudyContentStore } from "@/src/store/studyContentStore";
import { Conceito, MacroTema, MaterialTipo, SubTema, SubTemaMaterial } from "@/src/types/studyContent";
import { colors, semantic, surfaceDim } from "@/src/theme/colors";
import { desativarDevTestMode } from "@/src/dev/devTestMode";

const PRIMARY = colors.primaryContainer;
const PRIMARY_LIGHT = colors.primary;
const SURFACE_DIM = surfaceDim.base;
const SURFACE_CARD = surfaceDim.subtema;
const SURFACE_CONCEITO = surfaceDim.conceito;
const MUTED = semantic.muted;

const MATERIAL_ICON: Record<MaterialTipo, typeof FileText> = {
  documento: FileText,
  youtube: CirclePlay,
  notion: NotebookText,
};

interface UploadResumo {
  material: SubTemaMaterial;
  disciplinaNome: string;
  subtemas: SubTema[];
}

function formatarDataRelativa(iso: string): string {
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return "";
  const diffMin = Math.floor((Date.now() - data.getTime()) / 60000);
  if (diffMin < 1) return "agora";
  if (diffMin < 60) return `há ${diffMin} min`;
  const horas = Math.floor(diffMin / 60);
  if (horas < 24) return `há ${horas}h`;
  return `há ${Math.floor(horas / 24)}d`;
}

// Um "upload" = um material — agrupa os subtemas (que já vêm um por material)
// de volta pelo material.id, e ordena do mais recente pro mais antigo.
function agruparPorUpload(macrotemas: MacroTema[]): UploadResumo[] {
  const porMaterial = new Map<string, UploadResumo>();
  for (const macro of macrotemas) {
    for (const sub of macro.subtemas) {
      const existente = porMaterial.get(sub.material.id);
      if (existente) {
        existente.subtemas.push(sub);
      } else {
        porMaterial.set(sub.material.id, { material: sub.material, disciplinaNome: macro.nome, subtemas: [sub] });
      }
    }
  }
  return Array.from(porMaterial.values()).sort(
    (a, b) => new Date(b.material.criado_em).getTime() - new Date(a.material.criado_em).getTime()
  );
}

export default function TestesUploadsScreen() {
  const studyContentData = useStudyContentStore((s) => s.data);
  const [carregando, setCarregando] = useState(true);
  const [abertos, setAbertos] = useState<Set<string>>(new Set());

  // Sempre dados de verdade aqui — desliga o Modo Teste (que trava o
  // initialize() real, ver src/dev/devTestMode.ts) mesmo que tenha ficado
  // ligado de uma navegação anterior, senão essa tela mostraria o mock.
  const carregar = useCallback(async () => {
    setCarregando(true);
    desativarDevTestMode();
    try {
      await StudyContentService.initialize();
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const uploads = useMemo(() => agruparPorUpload(studyContentData?.macrotemas ?? []), [studyContentData]);

  function alternar(id: string) {
    setAbertos((prev) => {
      const novo = new Set(prev);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });
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
        <View className="flex-1 items-center mr-4">
          <Text className="text-white text-lg font-bold">Últimos uploads</Text>
        </View>
        <TouchableOpacity
          onPress={carregar}
          disabled={carregando}
          className="w-10 h-10 items-center justify-center active:opacity-70"
          hitSlop={8}
        >
          <RefreshCw size={20} color={PRIMARY_LIGHT} />
        </TouchableOpacity>
      </View>

      {carregando && uploads.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={PRIMARY_LIGHT} />
        </View>
      ) : uploads.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center" style={{ color: MUTED }}>
            Nenhum material gerado ainda. Suba um material de verdade (Adicionar conteúdo) pra ver a estrutura aqui.
          </Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 60 }}>
          {uploads.map((upload) => {
            const aberto = abertos.has(upload.material.id);
            const Icon = MATERIAL_ICON[upload.material.tipo];
            const totalConceitos = upload.subtemas.reduce((acc, s) => acc + s.conceitos.length, 0);

            return (
              <View
                key={upload.material.id}
                className="rounded-[20px] overflow-hidden mb-4"
                style={{ backgroundColor: SURFACE_CARD, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" }}
              >
                <TouchableOpacity
                  onPress={() => alternar(upload.material.id)}
                  activeOpacity={0.75}
                  className="flex-row items-center px-4 py-4"
                >
                  <View
                    className="w-10 h-10 rounded-full items-center justify-center mr-3"
                    style={{ backgroundColor: `${PRIMARY}22` }}
                  >
                    <Icon size={18} color={PRIMARY_LIGHT} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text className="text-white font-bold text-sm" numberOfLines={1}>
                      {upload.material.nome}
                    </Text>
                    <Text className="text-xs mt-0.5" style={{ color: MUTED }}>
                      {upload.disciplinaNome} · {upload.subtemas.length}{" "}
                      {upload.subtemas.length === 1 ? "subtema" : "subtemas"} · {totalConceitos}{" "}
                      {totalConceitos === 1 ? "conceito" : "conceitos"} · {formatarDataRelativa(upload.material.criado_em)}
                    </Text>
                  </View>
                  {aberto ? <ChevronUp size={18} color={MUTED} /> : <ChevronDown size={18} color={MUTED} />}
                </TouchableOpacity>

                {aberto && (
                  <View style={{ paddingHorizontal: 16, paddingBottom: 16, gap: 14 }}>
                    {upload.subtemas.map((sub) => (
                      <View key={sub.id}>
                        <Text
                          className="text-[11px] font-bold uppercase tracking-wider mb-2"
                          style={{ color: PRIMARY_LIGHT, opacity: 0.8 }}
                        >
                          {sub.nome}
                        </Text>
                        <View style={{ gap: 10 }}>
                          {sub.conceitos.map((conceito) => (
                            <ConceitoQA key={conceito.id} conceito={conceito} />
                          ))}
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// Mostra a pergunta inteira (dica, alternativas com a correta marcada — ou
// resposta_modelo no nível 4 — e a explicação já renderizada em markdown)
// pra dar pra avaliar a saída da IA de relance, sem precisar responder o quiz.
function ConceitoQA({ conceito }: { conceito: Conceito }) {
  return (
    <View
      className="rounded-2xl p-3"
      style={{ backgroundColor: SURFACE_CONCEITO, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" }}
    >
      <Text className="text-white text-sm font-bold mb-2">{conceito.nome}</Text>
      <View style={{ gap: 10 }}>
        {[...conceito.perguntas]
          .sort((a, b) => a.nivel - b.nivel)
          .map((pergunta) => {
            const alternativas = pergunta.alternativas;

            return (
              <View key={pergunta.id} className="rounded-xl p-3" style={{ backgroundColor: "rgba(255,255,255,0.03)" }}>
                <Text
                  className="text-[10px] font-bold uppercase tracking-wider mb-1.5"
                  style={{ color: semantic.info }}
                >
                  Nível {pergunta.nivel} · {pergunta.tipo}
                </Text>
                <Text className="text-white text-xs font-medium mb-2">{pergunta.pergunta}</Text>

                <Text className="text-[10px] mb-2" style={{ color: MUTED }}>
                  Dica: {pergunta.dica}
                </Text>

                {alternativas ? (
                  <View style={{ gap: 4 }}>
                    {(["A", "B", "C", "D"] as const).map((letra) => {
                      const correta = letra === pergunta.resposta;
                      return (
                        <View
                          key={letra}
                          className="flex-row items-center rounded-lg px-2 py-1.5"
                          style={{ backgroundColor: correta ? "rgba(34,197,94,0.12)" : "transparent" }}
                        >
                          {correta && <Check size={11} color={semantic.success} style={{ marginRight: 4 }} />}
                          <Text
                            className="text-[11px] flex-1"
                            style={{ color: correta ? semantic.success : "rgba(255,255,255,0.65)" }}
                          >
                            {letra}) {alternativas[letra]}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                ) : (
                  <View className="rounded-lg px-2.5 py-2" style={{ backgroundColor: "rgba(34,197,94,0.1)" }}>
                    <Text className="text-[10px] font-bold mb-1" style={{ color: semantic.success }}>
                      RESPOSTA MODELO
                    </Text>
                    <Text className="text-[11px]" style={{ color: "rgba(255,255,255,0.8)" }}>
                      {pergunta.resposta_modelo}
                    </Text>
                  </View>
                )}

                <View style={{ marginTop: 8 }}>
                  <Text className="text-[10px] font-bold mb-1" style={{ color: MUTED }}>
                    EXPLICAÇÃO
                  </Text>
                  <Markdown style={qaMarkdownStyles}>{pergunta.explicacao}</Markdown>
                </View>
              </View>
            );
          })}
      </View>
    </View>
  );
}

const qaMarkdownStyles = {
  body: { fontSize: 11, lineHeight: 16, color: "rgba(255,255,255,0.75)" },
  paragraph: { marginTop: 0, marginBottom: 6 },
  strong: { color: "#fff" },
};
