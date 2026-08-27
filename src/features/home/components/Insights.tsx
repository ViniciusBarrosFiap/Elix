import { useMemo } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { ChevronRight, Clock, Flame, Sparkles, Star, TrendingUp } from "lucide-react-native";
import { useStudyContentStore } from "@/src/store/studyContentStore";
import { Conceito, MacroTema } from "@/src/types/studyContent";

// Quantos insights aparecem no carrossel — top N por prioridade, não a lista inteira.
const MAX_INSIGHTS = 6;
const CARD_WIDTH = 210;
const CARD_GAP = 12;

interface InsightItem {
  conceito: Conceito;
  subtemaNome: string;
  macroTema: MacroTema;
  diasAtraso: number;
}

// Mesma comparação por data de calendário (UTC) usada em
// server/src/services/quiz/selectTodayQuestions.ts — "atrasado" não pode
// depender de que horas são agora, só do dia.
function diasDeAtraso(proximaRevisaoISO: string): number {
  const [ano, mes, dia] = proximaRevisaoISO.split("-").map(Number);
  const proximaRevisaoUTC = Date.UTC(ano, mes - 1, dia);
  const hoje = new Date();
  const hojeUTC = Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth(), hoje.getUTCDate());
  return Math.max(0, Math.round((hojeUTC - proximaRevisaoUTC) / (1000 * 60 * 60 * 24)));
}

// Mesma fórmula de prioridade da dose diária (ver selectTodayQuestions.ts no
// backend) — reaproveitada aqui pra manter os dois lugares consistentes:
// erro > atraso > foco do aluno > novidade, nessa ordem de peso.
function calcularPrioridade(conceito: Conceito, diasAtraso: number): number {
  const bonusErro = conceito.performance.erros * 5;
  const bonusAtraso = diasAtraso * 2;
  const bonusFoco = conceito.tag_foco ? 3 : 0;
  const bonusNovo = conceito.performance.vezes_revisado === 0 ? 1 : 0;
  return bonusErro + bonusAtraso + bonusFoco + bonusNovo;
}

// Explica o motivo dominante do insight — a mesma ordem de prioridade da
// fórmula acima (erro primeiro, depois atraso, depois foco, depois novidade).
function motivoInsight({ conceito, diasAtraso }: InsightItem): { texto: string; cor: string; Icon: typeof Flame } {
  if (conceito.performance.erros > 0) {
    const n = conceito.performance.erros;
    return { texto: `${n} ${n === 1 ? "erro" : "erros"}`, cor: "#ff6b6b", Icon: Flame };
  }
  if (diasAtraso > 0) {
    return { texto: `${diasAtraso}${diasAtraso === 1 ? " dia" : " dias"} de atraso`, cor: "#f0a030", Icon: Clock };
  }
  if (conceito.tag_foco) {
    return { texto: "foco marcado", cor: "#f0a030", Icon: Star };
  }
  return { texto: "novo", cor: "#60a5fa", Icon: Sparkles };
}

export default function Insights() {
  const studyContentData = useStudyContentStore((state) => state.data);
  const router = useRouter();

  const insights = useMemo(() => {
    const macrotemas = studyContentData?.macrotemas ?? [];
    const candidatos: (InsightItem & { prioridade: number })[] = [];

    for (const macroTema of macrotemas) {
      for (const subtema of macroTema.subtemas) {
        for (const conceito of subtema.conceitos) {
          if (conceito.status === "dominado") continue;

          const diasAtraso = diasDeAtraso(conceito.proxima_revisao);
          const prioridade = calcularPrioridade(conceito, diasAtraso);
          if (prioridade <= 0) continue;

          candidatos.push({ conceito, subtemaNome: subtema.nome, macroTema, diasAtraso, prioridade });
        }
      }
    }

    return candidatos.sort((a, b) => b.prioridade - a.prioridade).slice(0, MAX_INSIGHTS);
  }, [studyContentData]);

  if (insights.length === 0) return null;

  return (
    <View style={{ marginTop: 16 }}>
      <View className="px-6 pb-3 flex-row items-center justify-between">
        <View>
          <Text className="text-white text-lg font-bold">Fique de olho</Text>
          <Text className="text-white/40" style={{ fontSize: 12.5, marginTop: 1 }}>
            {insights.length === 1
              ? "1 conceito pede atenção"
              : `${insights.length} conceitos pedem atenção`}
          </Text>
        </View>
        <TrendingUp size={18} color="#a855f7" />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, gap: CARD_GAP }}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH + CARD_GAP}
        snapToAlignment="start"
      >
        {insights.map(({ conceito, subtemaNome, macroTema, diasAtraso }) => {
          const { texto, cor, Icon } = motivoInsight({ conceito, subtemaNome, macroTema, diasAtraso });

          return (
            <Pressable
              key={conceito.id}
              onPress={() => router.push(`/(tabs)/studyContents/${macroTema.id}`)}
              className="rounded-3xl overflow-hidden active:opacity-80"
              style={{
                width: CARD_WIDTH,
                borderWidth: 1,
                borderColor: "rgba(139,92,246,0.35)",
              }}
            >
              <LinearGradient
                colors={["#000000", "#160522", "#120325"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ padding: 14, height: 148 }}
              >
                <View className="flex-row items-center justify-between" style={{ marginBottom: 12 }}>
                  <View
                    className="items-center justify-center rounded-full"
                    style={{ width: 34, height: 34, backgroundColor: `${cor}22` }}
                  >
                    <Icon size={16} color={cor} />
                  </View>
                  <ChevronRight size={16} color="rgba(255,255,255,0.25)" />
                </View>

                <Text className="text-white font-semibold" numberOfLines={2} style={{ fontSize: 14, lineHeight: 18 }}>
                  {conceito.nome}
                </Text>
                <Text className="text-white/40" numberOfLines={1} style={{ fontSize: 11, marginTop: 4 }}>
                  {macroTema.nome} › {subtemaNome}
                </Text>

                <View
                  className="rounded-full self-start"
                  style={{
                    marginTop: "auto",
                    paddingHorizontal: 9,
                    paddingVertical: 4,
                    backgroundColor: `${cor}1A`,
                  }}
                >
                  <Text style={{ fontSize: 10.5, fontWeight: "700", color: cor }}>{texto}</Text>
                </View>
              </LinearGradient>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
