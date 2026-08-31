import { ChevronDown, Star, Zap } from "lucide-react-native";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { STATUS_CONCEITO_LABEL, SubTema } from "@/src/types/studyContent";
import {
  PRIMARY_LIGHT,
  STATUS_CONCEITO_COLOR,
  STATUS_CONCEITO_ICON,
  SUBTEMA_STATUS_COLOR,
  SUBTEMA_STATUS_ICON,
  SUBTEMA_STATUS_LABEL,
  SURFACE_CONCEITO,
  classificarSubtema,
} from "./subtemaVisuals";

// Lista de conceitos de um subtema — cards com status, nível e placar de
// acertos/erros, reaproveitados tanto na tela de disciplina (antes) quanto
// agora na tela dedicada do material.
function ListaConceitos({ subtema }: { subtema: SubTema }) {
  return (
    <View style={{ gap: 10 }}>
      {subtema.conceitos.map((conceito) => {
        const cor = STATUS_CONCEITO_COLOR[conceito.status];
        const StatusIcon = STATUS_CONCEITO_ICON[conceito.status];
        const dominado = conceito.status === "dominado";

        return (
          <View
            key={conceito.id}
            className="rounded-[18px] p-4"
            style={{
              backgroundColor: SURFACE_CONCEITO,
              borderWidth: 1,
              borderColor: dominado ? "rgba(34,197,94,0.35)" : "rgba(255,255,255,0.04)",
              ...(dominado
                ? {
                    shadowColor: "#22c55e",
                    shadowOpacity: 0.25,
                    shadowRadius: 12,
                    shadowOffset: { width: 0, height: 0 },
                  }
                : null),
            }}
          >
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center flex-1 mr-2">
                <View
                  className="w-7 h-7 rounded-full items-center justify-center mr-2.5"
                  style={{
                    backgroundColor: conceito.tag_foco ? "rgba(240,160,48,0.16)" : `${cor}22`,
                    borderWidth: 1,
                    borderColor: conceito.tag_foco ? "rgba(240,160,48,0.4)" : `${cor}44`,
                  }}
                >
                  {conceito.tag_foco ? (
                    <Star size={12} color="#f0a030" fill="#f0a030" />
                  ) : (
                    <StatusIcon size={12} color={cor} />
                  )}
                </View>
                <Text className="text-white text-[13px] font-medium flex-1" numberOfLines={2}>
                  {conceito.nome}
                </Text>
              </View>
              <View className="px-2.5 py-1 rounded-full" style={{ backgroundColor: `${cor}22` }}>
                <Text className="text-[10px] uppercase font-bold tracking-wider" style={{ color: cor }}>
                  {STATUS_CONCEITO_LABEL[conceito.status]}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center justify-between">
              {/* Nível — mesmo vocabulário visual (raio + pips) do chip de nível do quiz */}
              <View className="flex-row items-center" style={{ gap: 5 }}>
                <Zap size={11} color={cor} fill={cor} />
                <Text className="text-[11px] font-bold" style={{ color: cor }}>
                  Nv.{conceito.nivel_atual}
                </Text>
                <View className="flex-row items-center" style={{ gap: 3, marginLeft: 2 }}>
                  {[1, 2, 3].map((nivel) => {
                    const preenchido = nivel <= conceito.nivel_atual;
                    return (
                      <View
                        key={nivel}
                        style={{
                          width: 14,
                          height: 5,
                          borderRadius: 2.5,
                          backgroundColor: preenchido ? cor : "rgba(255,255,255,0.12)",
                          ...(preenchido
                            ? {
                                shadowColor: cor,
                                shadowOpacity: 0.7,
                                shadowRadius: 3,
                                shadowOffset: { width: 0, height: 0 },
                              }
                            : null),
                        }}
                      />
                    );
                  })}
                </View>
              </View>

              {/* Placar de acertos/erros — cor em vez de cinza neutro, pra ler
                  como pontuação e não como estatística morta. */}
              <View className="flex-row items-center" style={{ gap: 8 }}>
                <View className="flex-row items-center" style={{ gap: 3 }}>
                  <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: "#22c55e" }} />
                  <Text className="text-[11px] font-semibold" style={{ color: "#22c55e" }}>
                    {conceito.performance.acertos}
                  </Text>
                </View>
                <View className="flex-row items-center" style={{ gap: 3 }}>
                  <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: "#ff6b6b" }} />
                  <Text className="text-[11px] font-semibold" style={{ color: "#ff6b6b" }}>
                    {conceito.performance.erros}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

interface SubtemaRowProps {
  subtema: SubTema;
  isLast: boolean;
}

// Linha de subtema — expande/recolhe seus próprios conceitos com estado
// interno (não depende de um Set controlado pelo pai). Separação entre
// subtemas via divisória fina + barra de destaque colorida à esquerda quando
// dominado, em vez de card próprio.
export function SubtemaRow({ subtema, isLast }: SubtemaRowProps) {
  const [aberto, setAberto] = useState(false);
  const status = classificarSubtema(subtema);
  const cor = SUBTEMA_STATUS_COLOR[status];
  const StatusIcon = SUBTEMA_STATUS_ICON[status];
  const totalmenteDominado = status === "dominado";

  return (
    <View
      style={{
        borderBottomWidth: isLast && !aberto ? 0 : 1,
        borderBottomColor: "rgba(255,255,255,0.06)",
        paddingBottom: 14,
      }}
    >
      <Pressable
        onPress={() => setAberto((v) => !v)}
        className="active:opacity-70 flex-row items-center"
        hitSlop={4}
      >
        <View
          style={{
            width: 3,
            height: 26,
            borderRadius: 2,
            backgroundColor: totalmenteDominado ? cor : "transparent",
            marginRight: totalmenteDominado ? 10 : 0,
          }}
        />

        <View
          className="w-8 h-8 rounded-full items-center justify-center mr-2.5"
          style={{ backgroundColor: `${cor}22`, borderWidth: 1, borderColor: `${cor}44` }}
        >
          <StatusIcon size={14} color={cor} />
        </View>

        <View className="flex-1 mr-2">
          <Text className="text-white text-sm font-semibold mb-1" numberOfLines={1}>
            {subtema.nome}
          </Text>
          <View className="self-start rounded-full px-2.5 py-0.5" style={{ backgroundColor: `${cor}22` }}>
            <Text className="text-[10px] uppercase font-bold tracking-wider" style={{ color: cor }}>
              {SUBTEMA_STATUS_LABEL[status]}
            </Text>
          </View>
        </View>

        <View style={{ transform: [{ rotate: aberto ? "180deg" : "0deg" }] }}>
          <ChevronDown size={18} color={PRIMARY_LIGHT} />
        </View>
      </Pressable>

      {/* Conceitos ficam recuados sob uma guia vertical fina — um degrau mais
          profundo que a indentação do subtema sob o material. */}
      {aberto && (
        <View
          style={{
            marginTop: 14,
            marginLeft: 15,
            paddingLeft: 13,
            borderLeftWidth: 1.5,
            borderLeftColor: "rgba(255,255,255,0.07)",
          }}
        >
          <ListaConceitos subtema={subtema} />
        </View>
      )}
    </View>
  );
}
