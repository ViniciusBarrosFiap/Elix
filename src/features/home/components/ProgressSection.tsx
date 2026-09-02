import { TrendingUp } from "lucide-react-native";
import { useMemo } from "react";
import { Text, View } from "react-native";
import { useStudyContentStore } from "@/src/store/studyContentStore";
import { STATUS_CONCEITO_LABEL, StatusConceito } from "@/src/types/studyContent";
import {
  MUTED,
  PRIMARY,
  PRIMARY_LIGHT,
  STATUS_CONCEITO_COLOR,
  STATUS_CONCEITO_ICON,
  SURFACE_SUBTEMA,
  averageMastery,
} from "@/src/features/studyContent/subtemaVisuals";

// Ordem de leitura: do que ainda não foi tocado até o que já foi dominado —
// mesma progressão usada nos outros lugares do app que quebram por status.
const ORDEM_STATUS: StatusConceito[] = ["novo", "em_reforco", "consolidando", "dominado"];

// Visão geral do progresso do aluno, cruzando todas as disciplinas — antes
// só existia por disciplina (dentro de cada tela própria); aqui dá pra ver
// de relance como está o total sem precisar entrar em nenhuma delas.
export default function ProgressSection() {
  const studyContentData = useStudyContentStore((state) => state.data);

  const { totalConceitos, porStatus, dominio } = useMemo(() => {
    const todos = studyContentData?.macrotemas.flatMap((m) => m.subtemas.flatMap((s) => s.conceitos)) ?? [];
    const contagem: Record<StatusConceito, number> = { novo: 0, em_reforco: 0, consolidando: 0, dominado: 0 };
    for (const c of todos) contagem[c.status] += 1;

    return {
      totalConceitos: todos.length,
      porStatus: contagem,
      dominio: averageMastery(todos),
    };
  }, [studyContentData]);

  if (totalConceitos === 0) return null;

  return (
    <View style={{ marginTop: 16, paddingHorizontal: 24 }}>
      <View
        className="rounded-[24px] p-4"
        style={{ backgroundColor: SURFACE_SUBTEMA, borderWidth: 1, borderColor: `${PRIMARY}26` }}
      >
        <View className="flex-row items-center justify-between" style={{ marginBottom: 14 }}>
          <View className="flex-row items-center">
            <TrendingUp size={16} color={PRIMARY_LIGHT} />
            <Text className="text-white font-bold ml-2" style={{ fontSize: 14 }}>
              Seu progresso
            </Text>
          </View>
          <Text className="font-extrabold" style={{ color: PRIMARY_LIGHT, fontSize: 15 }}>
            {dominio}%
          </Text>
        </View>

        <View
          className="w-full rounded-full overflow-hidden"
          style={{ height: 8, backgroundColor: "rgba(255,255,255,0.08)", marginBottom: 16 }}
        >
          <View
            className="h-full rounded-full"
            style={{
              width: `${dominio}%`,
              backgroundColor: PRIMARY,
              shadowColor: PRIMARY,
              shadowOpacity: 0.7,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: 0 },
            }}
          />
        </View>

        <View className="flex-row justify-between">
          {ORDEM_STATUS.map((status) => {
            const StatusIcon = STATUS_CONCEITO_ICON[status];
            const cor = STATUS_CONCEITO_COLOR[status];
            return (
              <View key={status} className="items-center">
                <StatusIcon size={14} color={cor} style={{ marginBottom: 4 }} />
                <Text className="font-extrabold" style={{ color: cor, fontSize: 18 }}>
                  {porStatus[status]}
                </Text>
                <Text className="text-[10px] mt-0.5" style={{ color: MUTED }}>
                  {STATUS_CONCEITO_LABEL[status]}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}
