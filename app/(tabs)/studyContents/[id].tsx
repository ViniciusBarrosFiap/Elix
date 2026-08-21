import {
  ArrowLeft,
  ChevronDown,
  CircleDot,
  Crown,
  Flame,
  Sparkles,
  Star,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react-native";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StatusBar, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { StudyContentService } from "@/src/services/studyContent/studyContent.service";
import { useStudyContentStore } from "@/src/store/studyContentStore";
import { STATUS_LABEL, STATUS_CONCEITO_LABEL, StatusConceito } from "@/src/types/studyContent";

// Cores de status por conceito. Carregam significado próprio (nível de
// domínio), então ficam fora da paleta roxa do tema — igual ao original.
const STATUS_CONCEITO_COLOR: Record<StatusConceito, string> = {
  novo: "#a09ba8",
  em_reforco: "#f0a030",
  consolidando: "#60a5fa",
  dominado: "#22c55e",
};

// Ícone por status — reforça a leitura de "conquista" (crown pro dominado,
// chama pro que precisa de reforço) em vez de só uma bolinha de cor.
const STATUS_CONCEITO_ICON: Record<StatusConceito, typeof CircleDot> = {
  novo: CircleDot,
  em_reforco: Flame,
  consolidando: TrendingUp,
  dominado: Crown,
};

// Tokens do design system "The Cognitive Sanctuary" (mesmos já usados no
// app — só nomeei para reaproveitar em vários pontos da tela).
const PRIMARY = "#8a2be2";
const PRIMARY_LIGHT = "#dcb8ff";
const ON_PRIMARY_CONTAINER = "#eed9ff";
const SURFACE_DIM = "#080510";
const SURFACE_SUBTEMA = "#120e1c"; // fundo do container de cada subtema
const SURFACE_CONCEITO = "#1a1528"; // fundo do card de conceito, um tom acima (fica "por cima" do subtema)
const MUTED = "#a09ba8";

// Quantos subtemas ficam sempre visíveis (sem precisar tocar em nada).
const MAX_SUBTEMAS_VISIVEIS = 4;

export default function DisciplinaDetalhe() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const studyContentData = useStudyContentStore((state) => state.data);
  const macroTema = studyContentData?.macrotemas.find((m) => m.id === id);

  type SubtemaItem = NonNullable<typeof macroTema>["subtemas"][number];

  // Controla quais subtemas estão com os conceitos expandidos. Funciona
  // igual pros 4 principais e pros que aparecem em "mostrar mais".
  const [subtemasAbertos, setSubtemasAbertos] = useState<Set<string>>(new Set());
  // Controla se o grupo extra de subtemas está revelado (inline, sem modal).
  const [mostrarTodos, setMostrarTodos] = useState(false);

  const toggleSubtema = (subtemaId: string) => {
    setSubtemasAbertos((prev) => {
      const proximo = new Set(prev);
      if (proximo.has(subtemaId)) {
        proximo.delete(subtemaId);
      } else {
        proximo.add(subtemaId);
      }
      return proximo;
    });
  };

  // Quantos conceitos de um subtema têm pelo menos 1 erro registrado.
  const contarConceitosComErro = (subtema: SubtemaItem) =>
    subtema.conceitos.filter((c) => c.performance.erros > 0).length;

  // Subtemas ordenados do que mais tem conceitos com erro para o que
  // menos tem. Os 4 primeiros aparecem sempre visíveis; o resto fica
  // atrás do "Mostrar mais", na própria tela (sem modal).
  const subtemasOrdenados = useMemo(() => {
    if (!macroTema) return [];
    return [...macroTema.subtemas].sort(
      (a, b) => contarConceitosComErro(b) - contarConceitosComErro(a)
    );
  }, [macroTema]);

  const subtemasPrincipais = subtemasOrdenados.slice(0, MAX_SUBTEMAS_VISIVEIS);
  const subtemasRestantes = subtemasOrdenados.slice(MAX_SUBTEMAS_VISIVEIS);

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

  // Lista de conceitos de um subtema (reaproveitada pelos dois formatos
  // de cabeçalho abaixo — o "cheio" dos 4 principais e o compacto do
  // grupo "mostrar mais").
  const renderListaConceitos = (subtema: SubtemaItem) => (
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
                  className="w-8 h-8 rounded-full items-center justify-center mr-3"
                  style={{
                    backgroundColor: conceito.tag_foco ? "rgba(240,160,48,0.16)" : `${cor}22`,
                    borderWidth: 1,
                    borderColor: conceito.tag_foco ? "rgba(240,160,48,0.4)" : `${cor}44`,
                  }}
                >
                  {conceito.tag_foco ? (
                    <Star size={14} color="#f0a030" fill="#f0a030" />
                  ) : (
                    <StatusIcon size={14} color={cor} />
                  )}
                </View>
                <Text className="text-white text-sm font-medium flex-1" numberOfLines={2}>
                  {conceito.nome}
                </Text>
              </View>
              <View
                className="px-2.5 py-1 rounded-full"
                style={{ backgroundColor: `${cor}22` }}
              >
                <Text
                  className="text-[10px] uppercase font-bold tracking-wider"
                  style={{ color: cor }}
                >
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

  // Cabeçalho "cheio" — usado em todos os subtemas visíveis. Título em
  // destaque + linha de status/contagem embaixo, com bolinhas mostrando a
  // média do nível dos conceitos daquele subtema. Tudo dentro de um
  // container com fundo próprio (um tom acima do fundo da tela).
  const renderSubtemaPrincipal = (subtema: SubtemaItem) => {
    const aberto = subtemasAbertos.has(subtema.id);

    const mediaNivel = subtema.conceitos.length
      ? subtema.conceitos.reduce((soma, c) => soma + c.nivel_atual, 0) / subtema.conceitos.length
      : 0;
    const nivelMedioArredondado = Math.round(mediaNivel);

    return (
      <View
        key={subtema.id}
        className="rounded-[24px] p-4"
        style={{
          backgroundColor: SURFACE_SUBTEMA,
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.04)",
        }}
      >
        <Pressable onPress={() => toggleSubtema(subtema.id)} className="active:opacity-80" hitSlop={4}>
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-white text-lg font-semibold flex-1 mr-2" numberOfLines={1}>
              {subtema.nome}
            </Text>
            <View style={{ transform: [{ rotate: aberto ? "180deg" : "0deg" }] }}>
              <ChevronDown size={20} color={PRIMARY_LIGHT} />
            </View>
          </View>

          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Text className="text-xs font-medium" style={{ color: PRIMARY_LIGHT }}>
                {STATUS_LABEL[subtema.status]}
              </Text>
              <View className="w-1 h-1 rounded-full mx-2" style={{ backgroundColor: MUTED }} />
              <Text className="text-xs" style={{ color: MUTED }}>
                {subtema.conceitos.length} conceitos
              </Text>
            </View>

            <View className="flex-row items-center" style={{ gap: 4 }}>
              {[1, 2, 3].map((nivel) => {
                const preenchido = nivel <= nivelMedioArredondado;
                return (
                  <View
                    key={nivel}
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: preenchido ? PRIMARY_LIGHT : "rgba(255,255,255,0.15)",
                      ...(preenchido
                        ? {
                            shadowColor: PRIMARY_LIGHT,
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
        </Pressable>

        {aberto && <View style={{ marginTop: 12 }}>{renderListaConceitos(subtema)}</View>}
      </View>
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
              fixo enquanto só a lista de subtemas se move. */}
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

          {/* Lista de subtemas + conceitos — mesma área de rolagem do hero */}
          <View style={{ gap: 20 }}>
            {macroTema.subtemas_ativos === 0 ? (
              <Text style={{ color: MUTED }} className="text-center mt-10">
                Nenhum conteúdo ainda. Envie um material pra essa disciplina pra começar.
              </Text>
            ) : (
              <>
                <View className="flex-row items-center justify-between mb-1">
                  <Text className="text-white text-lg font-semibold">Subtemas</Text>
                  {subtemasRestantes.length > 0 && (
                    <Pressable
                      onPress={() => setMostrarTodos((v) => !v)}
                      className="flex-row items-center active:opacity-60"
                      hitSlop={6}
                    >
                      <Text className="text-sm font-medium" style={{ color: PRIMARY_LIGHT, marginRight: 4 }}>
                        {mostrarTodos ? "Mostrar menos" : "Mostrar mais"}
                      </Text>
                      <View style={{ transform: [{ rotate: mostrarTodos ? "180deg" : "0deg" }] }}>
                        <ChevronDown size={14} color={PRIMARY_LIGHT} />
                      </View>
                    </Pressable>
                  )}
                </View>

                {subtemasPrincipais.map(renderSubtemaPrincipal)}

                {mostrarTodos && subtemasRestantes.length > 0 && (
                  <View style={{ gap: 20 }}>
                    {subtemasRestantes.map(renderSubtemaPrincipal)}
                  </View>
                )}

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