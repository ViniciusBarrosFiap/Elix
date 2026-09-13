import { BarChart3, Check, Target, X } from "lucide-react-native";
import { useMemo } from "react";
import { Text, View } from "react-native";
import { useStudyContentStore } from "@/src/store/studyContentStore";
import { MUTED, PRIMARY, PRIMARY_LIGHT, SURFACE_SUBTEMA } from "@/src/features/studyContent/subtemaVisuals";
import { semantic } from "@/src/theme/colors";

const COR_ACERTO = semantic.success;
const COR_ERRO = semantic.danger;

// Faixa de cor da taxa de acerto — mesmos limiares de domínio usados no
// resto do app (>=80 verde, >=34 amarelo/laranja, senão vermelho), pra ler
// como "saúde do desempenho" de relance.
function corTaxaAcerto(pct: number): string {
  if (pct >= 80) return COR_ACERTO;
  if (pct >= 50) return semantic.warning;
  return COR_ERRO;
}

// Relatório de desempenho do aluno, cruzando todas as disciplinas — só
// acertos, erros e taxa de acerto (o que responde "como eu tô indo?"), sem
// domínio/breakdown por status, que já vivem na tela de cada disciplina.
export default function ProgressSection() {
  const studyContentData = useStudyContentStore((state) => state.data);

  const { totalConceitos, totalAcertos, totalErros, taxaAcerto } = useMemo(() => {
    const todos = studyContentData?.macrotemas.flatMap((m) => m.subtemas.flatMap((s) => s.conceitos)) ?? [];

    const totalAcertos = todos.reduce((acc, c) => acc + c.performance.acertos, 0);
    const totalErros = todos.reduce((acc, c) => acc + c.performance.erros, 0);
    const totalRespostas = totalAcertos + totalErros;

    return {
      totalConceitos: todos.length,
      totalAcertos,
      totalErros,
      taxaAcerto: totalRespostas > 0 ? Math.round((totalAcertos / totalRespostas) * 100) : null,
    };
  }, [studyContentData]);

  if (totalConceitos === 0) return null;

  return (
    <View style={{ marginTop: 16, paddingHorizontal: 24 }}>
      <View
        className="rounded-[24px] p-4"
        style={{ backgroundColor: SURFACE_SUBTEMA, borderWidth: 1, borderColor: `${PRIMARY}26` }}
      >
        <View className="flex-row items-center" style={{ marginBottom: 14 }}>
          <BarChart3 size={16} color={PRIMARY_LIGHT} />
          <Text className="text-white font-bold ml-2" style={{ fontSize: 14 }}>
            Relatório de desempenho
          </Text>
        </View>

        <View className="flex-row" style={{ gap: 10 }}>
          <View
            className="flex-1 items-center rounded-2xl py-3"
            style={{ backgroundColor: `${COR_ACERTO}14`, borderWidth: 1, borderColor: `${COR_ACERTO}33` }}
          >
            <View className="flex-row items-center" style={{ gap: 4 }}>
              <Check size={12} color={COR_ACERTO} />
              <Text className="font-extrabold" style={{ color: COR_ACERTO, fontSize: 18 }}>
                {totalAcertos}
              </Text>
            </View>
            <Text className="text-[10px] mt-0.5" style={{ color: MUTED }}>
              acertos
            </Text>
          </View>

          <View
            className="flex-1 items-center rounded-2xl py-3"
            style={{ backgroundColor: `${COR_ERRO}14`, borderWidth: 1, borderColor: `${COR_ERRO}33` }}
          >
            <View className="flex-row items-center" style={{ gap: 4 }}>
              <X size={12} color={COR_ERRO} />
              <Text className="font-extrabold" style={{ color: COR_ERRO, fontSize: 18 }}>
                {totalErros}
              </Text>
            </View>
            <Text className="text-[10px] mt-0.5" style={{ color: MUTED }}>
              erros
            </Text>
          </View>

          <View
            className="flex-1 items-center rounded-2xl py-3"
            style={{
              backgroundColor: `${taxaAcerto !== null ? corTaxaAcerto(taxaAcerto) : MUTED}14`,
              borderWidth: 1,
              borderColor: `${taxaAcerto !== null ? corTaxaAcerto(taxaAcerto) : MUTED}33`,
            }}
          >
            <View className="flex-row items-center" style={{ gap: 4 }}>
              <Target size={12} color={taxaAcerto !== null ? corTaxaAcerto(taxaAcerto) : MUTED} />
              <Text
                className="font-extrabold"
                style={{ color: taxaAcerto !== null ? corTaxaAcerto(taxaAcerto) : MUTED, fontSize: 18 }}
              >
                {taxaAcerto !== null ? `${taxaAcerto}%` : "—"}
              </Text>
            </View>
            <Text className="text-[10px] mt-0.5" style={{ color: MUTED }}>
              taxa de acerto
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
