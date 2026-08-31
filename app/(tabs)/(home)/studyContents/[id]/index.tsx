import {
  ArrowLeft,
  ChevronDown,
  CircleDot,
  CirclePlay,
  Crown,
  ExternalLink,
  FileText,
  Flame,
  NotebookText,
  Sparkles,
  Star,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react-native";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, StatusBar, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { StudyContentService } from "@/src/services/studyContent/studyContent.service";
import { MaterialsRepository } from "@/src/services/materials/materials.repository";
import { useStudyContentStore } from "@/src/store/studyContentStore";
import {
  STATUS_LABEL,
  STATUS_CONCEITO_LABEL,
  StatusConceito,
  MaterialTipo,
} from "@/src/types/studyContent";

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

// Status "de verdade" do subtema — derivado dos conceitos que ele tem
// (subtema.status vindo da API é estático, nunca muda, ver types/studyContent.ts).
// Três estados por precedência: 100% dominado > ninguém tocou ainda > todo o
// resto (misto/em progresso), o que cobre exatamente o que se quer enxergar
// de relance: "já terminei", "nem comecei" ou "tô no meio disso".
type SubtemaProgressStatus = "dominado" | "em_reforco" | "iniciando";

const SUBTEMA_STATUS_LABEL: Record<SubtemaProgressStatus, string> = {
  dominado: "Dominado",
  em_reforco: "Em reforço",
  iniciando: "Iniciando",
};

const SUBTEMA_STATUS_COLOR: Record<SubtemaProgressStatus, string> = {
  dominado: "#22c55e",
  em_reforco: "#f0a030",
  iniciando: "#60a5fa",
};

const SUBTEMA_STATUS_ICON: Record<SubtemaProgressStatus, typeof CircleDot> = {
  dominado: Crown,
  em_reforco: Flame,
  iniciando: Sparkles,
};

// Ícone/rótulo por tipo de material — cabeçalho de cada grupo na tela da
// disciplina (ver renderGrupoMaterial).
const MATERIAL_TIPO_ICON: Record<MaterialTipo, typeof FileText> = {
  documento: FileText,
  youtube: CirclePlay,
  notion: NotebookText,
};

const MATERIAL_TIPO_LABEL: Record<MaterialTipo, string> = {
  documento: "Documento",
  youtube: "YouTube",
  notion: "Notion",
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
  type MaterialInfo = SubtemaItem["material"];

  // Controla quais subtemas estão com os conceitos expandidos. Funciona
  // igual pros 4 principais e pros que aparecem em "mostrar mais".
  const [subtemasAbertos, setSubtemasAbertos] = useState<Set<string>>(new Set());
  // Controla quais grupos de material têm o "mostrar mais" revelado (por
  // material, já que cada um agora tem sua própria lista de subtemas).
  const [materiaisExpandidos, setMateriaisExpandidos] = useState<Set<string>>(new Set());
  // Material cujo link de visualização está sendo buscado no momento (some
  // ao terminar, com sucesso ou erro).
  const [materialAbrindo, setMaterialAbrindo] = useState<string | null>(null);

  const toggleMaterialExpandido = (materialId: string) => {
    setMateriaisExpandidos((prev) => {
      const proximo = new Set(prev);
      if (proximo.has(materialId)) {
        proximo.delete(materialId);
      } else {
        proximo.add(materialId);
      }
      return proximo;
    });
  };

  // Abre o material original: link direto pro YouTube, ou uma URL assinada
  // (buscada na hora) pro documento enviado. Notion não tem link direto —
  // o botão nem aparece nesse caso (ver podeAbrirMaterial).
  const abrirMaterial = async (material: MaterialInfo) => {
    if (material.tipo === "youtube") {
      Linking.openURL(material.nome);
      return;
    }

    setMaterialAbrindo(material.id);
    try {
      const { url } = await MaterialsRepository.getViewUrl(material.id);
      if (url) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Material indisponível", "Não foi possível encontrar o arquivo original desse material.");
      }
    } catch {
      Alert.alert("Erro", "Não foi possível abrir o material agora. Tente de novo em instantes.");
    } finally {
      setMaterialAbrindo(null);
    }
  };

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

  // Classifica o subtema com base nos conceitos: dominado (100% dominados),
  // iniciando (nenhum conceito foi revisado ainda) ou em reforço (o meio-termo
  // — já tem prática rolando mas ainda não terminou).
  const classificarSubtema = (subtema: SubtemaItem): SubtemaProgressStatus => {
    const conceitos = subtema.conceitos;
    const total = conceitos.length;

    if (total === 0) return "iniciando";

    const dominados = conceitos.filter((c) => c.status === "dominado").length;
    const nuncaRevisados = conceitos.filter((c) => c.performance.vezes_revisado === 0).length;

    return dominados === total ? "dominado" : nuncaRevisados === total ? "iniciando" : "em_reforco";
  };

  interface GrupoMaterial {
    material: MaterialInfo;
    subtemas: SubtemaItem[];
  }

  // Agrupa os subtemas pelo material que os gerou (documento, vídeo do
  // YouTube ou página do Notion) — cada material vira seu próprio painel na
  // tela, com os subtemas ordenados do que mais tem conceitos com erro pro
  // que menos tem dentro daquele grupo.
  const gruposPorMaterial = useMemo<GrupoMaterial[]>(() => {
    if (!macroTema) return [];

    const porMaterial = new Map<string, GrupoMaterial>();
    for (const subtema of macroTema.subtemas) {
      const grupo = porMaterial.get(subtema.material.id) ?? {
        material: subtema.material,
        subtemas: [] as SubtemaItem[],
      };
      grupo.subtemas.push(subtema);
      porMaterial.set(subtema.material.id, grupo);
    }

    return Array.from(porMaterial.values()).map((grupo) => ({
      ...grupo,
      subtemas: [...grupo.subtemas].sort(
        (a, b) => contarConceitosComErro(b) - contarConceitosComErro(a)
      ),
    }));
  }, [macroTema]);

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

  // Cabeçalho "cheio" — usado em todos os subtemas visíveis. Ícone de status
  // (derivado dos conceitos, não do campo estático da API) + pill colorida +
  // barra de progresso média, num vocabulário visual que já existe nos
  // conceitos e no hero da disciplina — o mesmo "idioma" em três escalas.
  // Linha de subtema — item de lista dentro do painel único agrupado sob o
  // título do material (não é mais um card flutuante independente; a
  // separação entre subtemas vira uma divisória fina + barra de destaque
  // colorida à esquerda quando dominado, em vez de borda/sombra própria).
  const renderSubtemaPrincipal = (subtema: SubtemaItem, isLast: boolean) => {
    const aberto = subtemasAbertos.has(subtema.id);
    const status = classificarSubtema(subtema);
    const cor = SUBTEMA_STATUS_COLOR[status];
    const StatusIcon = SUBTEMA_STATUS_ICON[status];
    const totalmenteDominado = status === "dominado";

    return (
      <View
        key={subtema.id}
        style={{
          borderBottomWidth: isLast && !aberto ? 0 : 1,
          borderBottomColor: "rgba(255,255,255,0.06)",
          paddingBottom: 14,
        }}
      >
        <Pressable
          onPress={() => toggleSubtema(subtema.id)}
          className="active:opacity-70 flex-row items-center"
          hitSlop={4}
        >
          <View
            style={{
              width: 3,
              height: 30,
              borderRadius: 2,
              backgroundColor: totalmenteDominado ? cor : "transparent",
              marginRight: totalmenteDominado ? 10 : 0,
            }}
          />

          <View
            className="w-9 h-9 rounded-full items-center justify-center mr-3"
            style={{ backgroundColor: `${cor}22`, borderWidth: 1, borderColor: `${cor}44` }}
          >
            <StatusIcon size={16} color={cor} />
          </View>

          <View className="flex-1 mr-2">
            <Text className="text-white text-base font-semibold mb-1" numberOfLines={1}>
              {subtema.nome}
            </Text>
            <View
              className="self-start rounded-full px-2.5 py-0.5"
              style={{ backgroundColor: `${cor}22` }}
            >
              <Text
                className="text-[10px] uppercase font-bold tracking-wider"
                style={{ color: cor }}
              >
                {SUBTEMA_STATUS_LABEL[status]}
              </Text>
            </View>
          </View>

          <View style={{ transform: [{ rotate: aberto ? "180deg" : "0deg" }] }}>
            <ChevronDown size={20} color={PRIMARY_LIGHT} />
          </View>
        </Pressable>

        {aberto && <View style={{ marginTop: 14, paddingLeft: 4 }}>{renderListaConceitos(subtema)}</View>}
      </View>
    );
  };

  // Painel de um material — o novo nível da hierarquia entre a disciplina e
  // os subtemas: cada documento/vídeo/página vira seu próprio grupo, com o
  // nome do material no cabeçalho e um botão pra abrir o original (exceto
  // Notion, que não tem link direto fora da própria integração OAuth).
  const renderGrupoMaterial = (grupo: GrupoMaterial) => {
    const { material, subtemas } = grupo;
    const expandido = materiaisExpandidos.has(material.id);
    const subtemasVisiveis = expandido ? subtemas : subtemas.slice(0, MAX_SUBTEMAS_VISIVEIS);
    const restantes = subtemas.length - subtemasVisiveis.length;
    const MaterialIcon = MATERIAL_TIPO_ICON[material.tipo];
    const podeAbrir = material.tipo !== "notion";
    const abrindo = materialAbrindo === material.id;

    return (
      <View
        key={material.id}
        className="rounded-[28px] p-4"
        style={{
          backgroundColor: SURFACE_SUBTEMA,
          borderWidth: 1,
          borderColor: `${PRIMARY}26`,
        }}
      >
        <View className="flex-row items-center mb-3" style={{ paddingHorizontal: 2 }}>
          <View
            className="w-8 h-8 rounded-full items-center justify-center mr-2.5"
            style={{ backgroundColor: `${PRIMARY}22`, borderWidth: 1, borderColor: `${PRIMARY}44` }}
          >
            <MaterialIcon size={14} color={PRIMARY_LIGHT} />
          </View>

          <View className="flex-1 mr-2">
            <Text
              className="text-[10px] font-bold uppercase tracking-wider mb-0.5"
              style={{ color: PRIMARY_LIGHT, opacity: 0.65 }}
            >
              {MATERIAL_TIPO_LABEL[material.tipo]}
            </Text>
            <Text className="text-white text-sm font-semibold" numberOfLines={1}>
              {material.nome}
            </Text>
          </View>

          {podeAbrir && (
            <Pressable
              onPress={() => abrirMaterial(material)}
              disabled={abrindo}
              className="items-center justify-center active:opacity-60"
              hitSlop={8}
              style={{ width: 32, height: 32 }}
            >
              {abrindo ? (
                <ActivityIndicator size="small" color={PRIMARY_LIGHT} />
              ) : (
                <ExternalLink size={16} color={PRIMARY_LIGHT} />
              )}
            </Pressable>
          )}
        </View>

        {subtemasVisiveis.map((subtema, index) =>
          renderSubtemaPrincipal(subtema, index === subtemasVisiveis.length - 1 && restantes === 0)
        )}

        {restantes > 0 && (
          <Pressable
            onPress={() => toggleMaterialExpandido(material.id)}
            className="flex-row items-center justify-center active:opacity-60"
            style={{ paddingTop: 12 }}
            hitSlop={6}
          >
            <Text className="text-sm font-medium" style={{ color: PRIMARY_LIGHT, marginRight: 4 }}>
              Mostrar mais {restantes}
            </Text>
            <ChevronDown size={14} color={PRIMARY_LIGHT} />
          </Pressable>
        )}

        {expandido && subtemas.length > MAX_SUBTEMAS_VISIVEIS && (
          <Pressable
            onPress={() => toggleMaterialExpandido(material.id)}
            className="flex-row items-center justify-center active:opacity-60"
            style={{ paddingTop: 12 }}
            hitSlop={6}
          >
            <Text className="text-sm font-medium" style={{ color: PRIMARY_LIGHT, marginRight: 4 }}>
              Mostrar menos
            </Text>
            <View style={{ transform: [{ rotate: "180deg" }] }}>
              <ChevronDown size={14} color={PRIMARY_LIGHT} />
            </View>
          </Pressable>
        )}
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

          {/* Um painel por material (documento/vídeo/página) — cada um com
              seus próprios subtemas/conceitos, em vez de uma lista só */}
          <View style={{ gap: 20 }}>
            {macroTema.subtemas_ativos === 0 ? (
              <Text style={{ color: MUTED }} className="text-center mt-10">
                Nenhum conteúdo ainda. Envie um material pra essa disciplina pra começar.
              </Text>
            ) : (
              <>
                <View>
                  <Text
                    className="text-[11px] font-bold uppercase tracking-wider mb-3"
                    style={{ color: PRIMARY_LIGHT, opacity: 0.75, paddingHorizontal: 2 }}
                  >
                    Materiais
                  </Text>
                  <View style={{ gap: 16 }}>{gruposPorMaterial.map(renderGrupoMaterial)}</View>
                </View>

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