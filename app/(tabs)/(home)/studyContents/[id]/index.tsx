import {
  ArrowLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  Flame,
  Plus,
  Sparkles,
  Star,
  Trash2,
  TrendingUp,
} from "lucide-react-native";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StatusBar, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import Svg, { Circle } from "react-native-svg";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { StudyContentService } from "@/src/services/studyContent/studyContent.service";
import { useStudyContentStore } from "@/src/store/studyContentStore";
import { useUserDataStore } from "@/src/store/userDataStore";
import { UserService } from "@/src/services/user/user.service";
import { STATUS_LABEL, StatusConceito } from "@/src/types/studyContent";
import { useAbrirMaterial } from "@/src/features/studyContent/useAbrirMaterial";
import { SubtemaRow } from "@/src/features/studyContent/SubtemaRow";
import {
  MATERIAL_TIPO_ICON,
  MATERIAL_TIPO_LABEL,
  MUTED,
  ON_PRIMARY_CONTAINER,
  PRIMARY,
  PRIMARY_LIGHT,
  STATUS_CONCEITO_COLOR,
  STATUS_CONCEITO_ICON,
  SURFACE_DIM,
  SURFACE_SUBTEMA,
  COR_ATRASADO,
  COR_REVISA_HOJE,
  averageMastery,
  calcularPrioridade,
  conceitoVencido,
  legendaRevisao,
  revisaoUrgencia,
} from "@/src/features/studyContent/subtemaVisuals";

// Largura de cada card do carrossel de Insights da disciplina.
const INSIGHT_CARD_WIDTH = 150;

export default function DisciplinaDetalhe() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const studyContentData = useStudyContentStore((state) => state.data);
  const userData = useUserDataStore((state) => state.data);
  const macroTema = studyContentData?.macrotemas.find((m) => m.id === id);

  const { abrirMaterial, abrindoId } = useAbrirMaterial();

  // Bottom sheet com os subtemas/conceitos do material tocado — em vez de
  // navegar pra uma tela própria, guarda só o id do material selecionado e
  // deriva a lista de subtemas dele na hora de renderizar o conteúdo do sheet.
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const [materialSelecionadoId, setMaterialSelecionadoId] = useState<string | null>(null);

  // Contadores que só existem pra forçar todos os SubtemaRow do material
  // aberto a expandir/recolher de uma vez (ver "Expandir tudo" no sheet).
  const [expandAllSignal, setExpandAllSignal] = useState<number | undefined>(undefined);
  const [collapseAllSignal, setCollapseAllSignal] = useState<number | undefined>(undefined);

  const abrirSheetDoMaterial = useCallback((materialId: string) => {
    setMaterialSelecionadoId(materialId);
    bottomSheetRef.current?.present();
  }, []);

  // Remove a disciplina da lista ativa do usuário — soft delete (mesmo
  // caminho de "Editar disciplinas"): o progresso já gerado não é apagado,
  // só fica invisível até a disciplina ser adicionada de novo pelo nome.
  const removerDisciplina = useCallback(() => {
    if (!macroTema || !userData) return;

    Alert.alert(
      "Remover disciplina",
      `Tem certeza que quer remover "${macroTema.nome}"? Seu progresso continua guardado — você pode adicioná-la de novo depois.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover",
          style: "destructive",
          onPress: async () => {
            try {
              const restantes = userData.disciplinas.filter(
                (nome) => nome.trim().toLowerCase() !== macroTema.nome.trim().toLowerCase()
              );
              await UserService.updateUser({ disciplinas: restantes });
              await StudyContentService.initialize();
              router.back();
            } catch {
              Alert.alert("Erro", "Não foi possível remover a disciplina agora. Tente de novo.");
            }
          },
        },
      ]
    );
  }, [macroTema, userData]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} pressBehavior="close" />
    ),
    []
  );

  const renderBackground = useCallback(
    (props: any) => (
      <BlurView style={[props.style, { borderRadius: 28, overflow: "hidden" }]} tint="dark" intensity={60} />
    ),
    []
  );

  // Agrupa os subtemas pelo material que os gerou — cada material vira um
  // resumo tocável aqui, que abre o bottom sheet com os subtemas/conceitos
  // daquele material específico.
  interface ResumoMaterial {
    material: NonNullable<typeof macroTema>["subtemas"][number]["material"];
    totalSubtemas: number;
    totalConceitos: number;
    totalErros: number;
    totalVencidos: number;
    totalAtrasados: number;
    dominio: number;
  }

  const materiais = useMemo<ResumoMaterial[]>(() => {
    if (!macroTema) return [];

    const porMaterial = new Map<string, { material: ResumoMaterial["material"]; conceitos: typeof macroTema.subtemas[number]["conceitos"]; totalSubtemas: number }>();
    for (const subtema of macroTema.subtemas) {
      const grupo = porMaterial.get(subtema.material.id) ?? {
        material: subtema.material,
        conceitos: [],
        totalSubtemas: 0,
      };
      grupo.totalSubtemas += 1;
      grupo.conceitos.push(...subtema.conceitos);
      porMaterial.set(subtema.material.id, grupo);
    }

    const resumos: ResumoMaterial[] = Array.from(porMaterial.values()).map((grupo) => ({
      material: grupo.material,
      totalSubtemas: grupo.totalSubtemas,
      totalConceitos: grupo.conceitos.length,
      totalErros: grupo.conceitos.filter((c) => c.performance.erros > 0).length,
      totalVencidos: grupo.conceitos.filter(conceitoVencido).length,
      totalAtrasados: grupo.conceitos.filter((c) => revisaoUrgencia(c) === "atrasado").length,
      dominio: averageMastery(grupo.conceitos),
    }));

    // Materiais com mais conceitos vencidos (pedindo revisão agora) aparecem primeiro.
    return resumos.sort((a, b) => b.totalVencidos - a.totalVencidos);
  }, [macroTema]);

  // Subtemas do material aberto no bottom sheet no momento (recalculado a
  // cada render — a lista de materiais já é pequena, não precisa de memo aqui).
  const subtemasDoMaterialSelecionado =
    macroTema?.subtemas.filter((s) => s.material.id === materialSelecionadoId) ?? [];
  const materialSelecionado = subtemasDoMaterialSelecionado[0]?.material;

  // Resumo de gamificação da disciplina: quebra completa por status (soma
  // exatamente o total, diferente de antes que só mostrava dominado/reforço
  // e deixava "novo"/"consolidando" invisíveis) + quantos conceitos já estão
  // vencidos hoje — o número que de fato decide o tamanho da próxima dose.
  const { totalConceitos, porStatus, vencidosDisciplina, atrasadosDisciplina, revisamHojeDisciplina } = useMemo(() => {
    const todos = macroTema?.subtemas.flatMap((s) => s.conceitos) ?? [];
    const contagem: Record<StatusConceito, number> = { novo: 0, em_reforco: 0, consolidando: 0, dominado: 0 };
    for (const c of todos) contagem[c.status] += 1;

    const urgencias = todos.map(revisaoUrgencia);

    return {
      totalConceitos: todos.length,
      porStatus: contagem,
      vencidosDisciplina: urgencias.filter((u) => u !== null).length,
      atrasadosDisciplina: urgencias.filter((u) => u === "atrasado").length,
      revisamHojeDisciplina: urgencias.filter((u) => u === "hoje").length,
    };
  }, [macroTema]);

  // Insights — os conceitos desta disciplina que mais pedem atenção agora,
  // pela mesma fórmula de prioridade da dose diária. Mesma ideia do
  // carrossel da Home, só que restrito a esta disciplina em vez de todas.
  const MAX_INSIGHTS = 4;
  const insightsDaDisciplina = useMemo(() => {
    if (!macroTema) return [];

    const candidatos = macroTema.subtemas.flatMap((subtema) =>
      subtema.conceitos
        .filter((c) => c.status !== "dominado")
        .map((conceito) => ({
          conceito,
          subtemaNome: subtema.nome,
          materialId: subtema.material.id,
          prioridade: calcularPrioridade(conceito),
        }))
    );

    return candidatos
      .filter((c) => c.prioridade > 0)
      .sort((a, b) => b.prioridade - a.prioridade)
      .slice(0, MAX_INSIGHTS);
  }, [macroTema]);

  // Motivo dominante do insight — mesma ordem de prioridade da fórmula
  // (erro > atraso > foco > novidade) e mesmo vocabulário visual do
  // carrossel de Insights da Home.
  const motivoInsight = (conceito: (typeof insightsDaDisciplina)[number]["conceito"]) => {
    if (conceito.performance.erros > 0) {
      const n = conceito.performance.erros;
      return { texto: `${n} ${n === 1 ? "erro" : "erros"}`, cor: "#ff6b6b", Icone: Flame };
    }
    const urgencia = revisaoUrgencia(conceito);
    if (urgencia) {
      // Atrasado é vermelho (pendência acumulada); "vence hoje" é só um
      // lembrete, então usa o azul neutro em vez do mesmo alarme do atraso.
      const cor = urgencia === "atrasado" ? "#ff6b6b" : "#60a5fa";
      return { texto: legendaRevisao(conceito), cor, Icone: Clock };
    }
    if (conceito.tag_foco) {
      return { texto: "marcado como foco", cor: "#f0a030", Icone: Star };
    }
    return { texto: "novo", cor: "#60a5fa", Icone: Sparkles };
  };

  useEffect(() => {
    StudyContentService.initialize();
  }, []);

  // Faixa de cor por domínio — mesmos limiares do statusFromMastery no
  // backend (>=80 consolidando, >=34 em reforço, senão começando), pra ler
  // junto com o resto do app em vez de inventar uma escala nova.
  const corDominio = (pct: number) => (pct >= 80 ? "#22c55e" : pct >= 34 ? "#f0a030" : "#60a5fa");

  const renderMaterial = (resumo: ResumoMaterial) => {
    const { material, totalSubtemas, totalConceitos: conceitosDoMaterial, totalVencidos, totalAtrasados, dominio } = resumo;
    const MaterialIcon = MATERIAL_TIPO_ICON[material.tipo];
    const podeAbrir = material.tipo !== "notion";
    const abrindo = abrindoId === material.id;

    // Anel de progresso ao redor do ícone — deixa o quanto já foi consolidado
    // visível de relance, em vez de só um número no meio de uma frase.
    const anelSize = 44;
    const anelStroke = 3;
    const anelRadius = (anelSize - anelStroke) / 2;
    const anelCentro = anelSize / 2;
    const anelCircunferencia = 2 * Math.PI * anelRadius;
    const anelPct = Math.max(0, Math.min(100, dominio)) / 100;
    const cor = corDominio(dominio);

    return (
      <Pressable
        key={material.id}
        onPress={() => abrirSheetDoMaterial(material.id)}
        className="rounded-[24px] p-4 flex-row items-center active:opacity-80"
        style={{ backgroundColor: SURFACE_SUBTEMA, borderWidth: 1, borderColor: `${PRIMARY}26` }}
      >
        <View style={{ width: anelSize, height: anelSize, marginRight: 12 }}>
          <Svg width={anelSize} height={anelSize}>
            <Circle cx={anelCentro} cy={anelCentro} r={anelRadius} stroke="rgba(255,255,255,0.1)" strokeWidth={anelStroke} fill="none" />
            <Circle
              cx={anelCentro}
              cy={anelCentro}
              r={anelRadius}
              stroke={cor}
              strokeWidth={anelStroke}
              strokeDasharray={`${anelCircunferencia * anelPct} ${anelCircunferencia * (1 - anelPct)}`}
              strokeLinecap="round"
              fill="none"
              rotation={-90}
              origin={`${anelCentro}, ${anelCentro}`}
            />
          </Svg>
          <View
            pointerEvents="none"
            style={{ position: "absolute", top: 0, left: 0, width: anelSize, height: anelSize, alignItems: "center", justifyContent: "center" }}
          >
            <MaterialIcon size={16} color={PRIMARY_LIGHT} />
          </View>
        </View>

        <View className="flex-1 mr-2">
          <Text
            className="text-[10px] font-bold uppercase tracking-wider mb-0.5"
            style={{ color: PRIMARY_LIGHT, opacity: 0.65 }}
          >
            {MATERIAL_TIPO_LABEL[material.tipo]}
          </Text>
          <Text className="text-white text-base font-bold mb-1.5" numberOfLines={1}>
            {material.nome}
          </Text>

          <Text className="text-xs" style={{ color: MUTED }}>
            {totalSubtemas} {totalSubtemas === 1 ? "subtema" : "subtemas"} · {conceitosDoMaterial}{" "}
            {conceitosDoMaterial === 1 ? "conceito" : "conceitos"}
          </Text>
        </View>

        {totalVencidos > 0 && (
          <View
            className="rounded-full px-2 py-1 mr-1"
            style={{ backgroundColor: `${totalAtrasados > 0 ? COR_ATRASADO : COR_REVISA_HOJE}29` }}
          >
            <Text className="text-[10px] font-bold" style={{ color: totalAtrasados > 0 ? COR_ATRASADO : COR_REVISA_HOJE }}>
              {totalAtrasados > 0 ? `${totalVencidos} vencido${totalVencidos === 1 ? "" : "s"}` : `${totalVencidos} hoje`}
            </Text>
          </View>
        )}

        {podeAbrir && (
          <>
            {/* Divisória fina + fundo circular próprio — antes o botão de
                abrir o link externo ficava só um ícone solto colado no
                chevron, dentro da mesma linha que abre o bottom sheet. Sem
                nenhuma fronteira visual entre as duas áreas de toque, era
                fácil querer abrir o sheet e acabar abrindo o material (ou
                o contrário). */}
            <View style={{ width: 1, height: 22, backgroundColor: "rgba(255,255,255,0.08)", marginRight: 8 }} />
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                abrirMaterial(material);
              }}
              disabled={abrindo}
              className="items-center justify-center rounded-full active:opacity-60"
              hitSlop={6}
              style={{ width: 32, height: 32, backgroundColor: "rgba(255,255,255,0.05)" }}
            >
              {abrindo ? (
                <ActivityIndicator size="small" color={PRIMARY_LIGHT} />
              ) : (
                <ExternalLink size={16} color={PRIMARY_LIGHT} />
              )}
            </Pressable>
          </>
        )}

        <ChevronRight size={18} color="rgba(255,255,255,0.25)" />
      </Pressable>
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

      <View className="px-6 pt-4 pb-2 flex-row items-center justify-between">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 -ml-1 items-center justify-center active:opacity-70"
          hitSlop={8}
        >
          <ArrowLeft size={24} color={PRIMARY_LIGHT} />
        </Pressable>

        {macroTema && (
          <Pressable
            onPress={removerDisciplina}
            className="w-10 h-10 -mr-1 items-center justify-center active:opacity-70"
            hitSlop={8}
          >
            <Trash2 size={19} color={MUTED} />
          </Pressable>
        )}
      </View>

      {!macroTema ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text style={{ color: MUTED }} className="text-center mb-4">
            {studyContentData ? "Disciplina não encontrada." : "Carregando disciplina..."}
          </Text>
          {studyContentData && (
            <Pressable
              onPress={() => router.back()}
              className="rounded-full px-5 py-3 active:opacity-80"
              style={{ backgroundColor: `${PRIMARY}22`, borderWidth: 1, borderColor: `${PRIMARY}55` }}
            >
              <Text className="text-sm font-semibold" style={{ color: PRIMARY_LIGHT }}>
                Voltar
              </Text>
            </Pressable>
          )}
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 48 }}
        >
          {/* Hero — agora rola junto com o resto da tela, em vez de ficar
              fixo enquanto só a lista de materiais se move. */}
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
            {/* <View
              className="rounded-[24px] px-5 pt-5 pb-4 mb-3"
              style={{
                backgroundColor: SURFACE_SUBTEMA,
                borderWidth: 1,
                borderColor: `${PRIMARY}33`,
              }}
            >
              <Text className="text-sm font-semibold mb-3" style={{ color: "#fff" }}>
                Domínio da disciplina
              </Text>

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
            </View> */}

            {/* Vencidos hoje — o número que decide o tamanho da próxima dose.
                Cor e texto seguem a mesma distinção atrasado/vence-hoje das
                tags de conceito/subtema (COR_ATRASADO/COR_REVISA_HOJE), em
                vez do laranja genérico que não batia com o resto da tela. */}
            {vencidosDisciplina > 0 && (
              <View
                className="flex-row items-center rounded-2xl px-4 py-3 mb-3"
                style={{
                  backgroundColor: `${atrasadosDisciplina > 0 ? COR_ATRASADO : COR_REVISA_HOJE}1A`,
                  borderWidth: 1,
                  borderColor: `${atrasadosDisciplina > 0 ? COR_ATRASADO : COR_REVISA_HOJE}4D`,
                }}
              >
                <Clock size={18} color={atrasadosDisciplina > 0 ? COR_ATRASADO : COR_REVISA_HOJE} />
                <Text className="text-sm ml-2.5 flex-1" style={{ color: "#fff" }}>
                  {atrasadosDisciplina > 0 && (
                    <Text className="font-bold" style={{ color: COR_ATRASADO }}>
                      {atrasadosDisciplina} {atrasadosDisciplina === 1 ? "atrasado" : "atrasados"}
                    </Text>
                  )}
                  {atrasadosDisciplina > 0 && revisamHojeDisciplina > 0 ? "  ·  " : ""}
                  {revisamHojeDisciplina > 0 && (
                    <Text className="font-bold" style={{ color: COR_REVISA_HOJE }}>
                      {revisamHojeDisciplina} {revisamHojeDisciplina === 1 ? "vence hoje" : "vencem hoje"}
                    </Text>
                  )}
                </Text>
              </View>
            )}

            {/* Quebra por status — antes eram 4 cards com fundo colorido e
                borda (lendo como "tags"). Agora é só número + rótulo, cor no
                próprio número fazendo o papel da cor sem precisar de caixinha. */}
            {/* {totalConceitos > 0 && (
              <View className="flex-row justify-between px-1">
                {(
                  [
                    { status: "dominado" as const, label: "dominados" },
                    { status: "consolidando" as const, label: "consolidando" },
                    { status: "em_reforco" as const, label: "em reforço" },
                    { status: "novo" as const, label: "novos" },
                  ]
                ).map(({ status, label }) => {
                  const StatusIcon = STATUS_CONCEITO_ICON[status];
                  return (
                  <View key={status} className="items-center">
                    <StatusIcon size={14} color={STATUS_CONCEITO_COLOR[status]} style={{ marginBottom: 3 }} />
                    <Text className="font-extrabold" style={{ color: STATUS_CONCEITO_COLOR[status], fontSize: 20 }}>
                      {porStatus[status]}
                    </Text>
                    <Text className="text-[11px] mt-0.5" style={{ color: MUTED }}>
                      {label}
                    </Text>
                  </View>
                  );
                })}
              </View>
            )} */}
          </View>

          {/* Insights — os conceitos desta disciplina que mais pedem atenção
              agora, mesma fórmula de prioridade da dose diária. Tocar num
              insight abre o material daquele conceito. */}
          {insightsDaDisciplina.length > 0 && (
            <View
              className="rounded-[24px] p-4 mb-5"
              style={{ backgroundColor: SURFACE_SUBTEMA, borderWidth: 1, borderColor: `${PRIMARY}26` }}
            >
              <View className="flex-row items-center mb-3">
                <TrendingUp size={16} color={PRIMARY_LIGHT} />
                <Text className="text-white font-bold ml-2" style={{ fontSize: 14 }}>
                  Insights
                </Text>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 10 }}
                decelerationRate="fast"
                snapToInterval={INSIGHT_CARD_WIDTH + 10}
                snapToAlignment="start"
                style={{ marginHorizontal: -16 }}
              >
                <View style={{ width: 6 }} />
                {insightsDaDisciplina.map(({ conceito, subtemaNome, materialId }) => {
                  const { texto, cor, Icone } = motivoInsight(conceito);
                  return (
                    <Pressable
                      key={conceito.id}
                      onPress={() => abrirSheetDoMaterial(materialId)}
                      className="rounded-2xl active:opacity-70"
                      style={{
                        width: INSIGHT_CARD_WIDTH,
                        padding: 12,
                        backgroundColor: "rgba(255,255,255,0.03)",
                        borderWidth: 1,
                        borderColor: "rgba(255,255,255,0.06)",
                      }}
                    >
                      <View className="flex-row items-center justify-between" style={{ marginBottom: 10 }}>
                        <View
                          className="items-center justify-center rounded-full"
                          style={{ width: 30, height: 30, backgroundColor: `${cor}22` }}
                        >
                          <Icone size={14} color={cor} />
                        </View>
                        <ChevronRight size={14} color="rgba(255,255,255,0.25)" />
                      </View>

                      <Text className="text-white font-semibold" numberOfLines={2} style={{ fontSize: 13, lineHeight: 17 }}>
                        {conceito.nome}
                      </Text>
                      <Text numberOfLines={1} style={{ fontSize: 11, marginTop: 3, color: MUTED }}>
                        {subtemaNome}
                      </Text>

                      <View
                        className="rounded-full self-start"
                        style={{ marginTop: 10, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: `${cor}1A` }}
                      >
                        <Text style={{ fontSize: 10, fontWeight: "700", color: cor }}>{texto}</Text>
                      </View>
                    </Pressable>
                  );
                })}
                <View style={{ width: 6 }} />
              </ScrollView>
            </View>
          )}

          {/* Um resumo tocável por material — abre a tela própria dele com
              os subtemas/conceitos, em vez de expandir aqui */}
          <View style={{ gap: 20 }}>
            {macroTema.subtemas_ativos === 0 ? (
              <View className="items-center mt-6">
                <Text style={{ color: MUTED }} className="text-center mb-4">
                  Nenhum conteúdo ainda. Envie um material pra essa disciplina pra começar.
                </Text>
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: "/(tabs)/studyContents/addContent",
                      params: { macroTemaId: macroTema.id },
                    })
                  }
                  className="flex-row items-center rounded-full px-5 py-3 active:opacity-80"
                  style={{ backgroundColor: `${PRIMARY}22`, borderWidth: 1, borderColor: `${PRIMARY}55` }}
                >
                  <Plus size={16} color={PRIMARY_LIGHT} />
                  <Text className="text-sm font-semibold ml-2" style={{ color: PRIMARY_LIGHT }}>
                    Adicionar material
                  </Text>
                </Pressable>
              </View>
            ) : (
              <>
                <View>
                  <View className="flex-row items-center justify-between mb-3" style={{ paddingHorizontal: 2 }}>
                    <Text
                      className="text-[11px] font-bold uppercase tracking-wider"
                      style={{ color: PRIMARY_LIGHT, opacity: 0.75 }}
                    >
                      Materiais
                    </Text>
                    <Pressable
                      onPress={() =>
                        router.push({
                          pathname: "/(tabs)/studyContents/addContent",
                          params: { macroTemaId: macroTema.id },
                        })
                      }
                      className="flex-row items-center active:opacity-60"
                      hitSlop={6}
                    >
                      <Plus size={14} color={PRIMARY_LIGHT} />
                      <Text className="text-xs font-semibold ml-1" style={{ color: PRIMARY_LIGHT }}>
                        Adicionar
                      </Text>
                    </Pressable>
                  </View>
                  <View style={{ gap: 12 }}>{materiais.map(renderMaterial)}</View>
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
                    <View className="items-center justify-center py-4">
                      <View className="flex-row items-center gap-2">
                        <Sparkles size={18} color={ON_PRIMARY_CONTAINER} />
                        <Text className="font-semibold text-base" style={{ color: ON_PRIMARY_CONTAINER }}>
                          Revisar disciplina
                        </Text>
                      </View>
                      {/* Reaproveita o mesmo número do banner do topo — antes o
                          botão prometia "revisar" sem dizer se havia algo pra
                          revisar, só descobria isso depois de abrir o quiz. */}
                      {/* <Text className="text-xs mt-1" style={{ color: "rgba(238,217,255,0.7)" }}>
                        {vencidosDisciplina > 0
                          ? `${vencidosDisciplina} ${vencidosDisciplina === 1 ? "conceito pronto" : "conceitos prontos"} pra revisar`
                          : "Nada pendente — praticar mesmo assim"}
                      </Text> */}
                    </View>
                  </LinearGradient>
                </Pressable>
              </>
            )}
          </View>
        </ScrollView>
      )}

      {/* Bottom sheet com os subtemas/conceitos do material tocado, em vez de
          navegar pra uma tela própria — abre com abrirSheetDoMaterial. */}
      <BottomSheetModal
        ref={bottomSheetRef}
        index={0}
        snapPoints={["65%", "92%"]}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundComponent={renderBackground}
        handleIndicatorStyle={{ backgroundColor: PRIMARY_LIGHT, width: 40 }}
      >
        <BottomSheetScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
          {materialSelecionado && (
            <>
              <View className="flex-row items-center mb-5">
                <View
                  className="w-11 h-11 rounded-full items-center justify-center mr-3"
                  style={{ backgroundColor: `${PRIMARY}33`, borderWidth: 1, borderColor: `${PRIMARY}66` }}
                >
                  {(() => {
                    const MaterialIcon = MATERIAL_TIPO_ICON[materialSelecionado.tipo];
                    return <MaterialIcon size={19} color={PRIMARY_LIGHT} />;
                  })()}
                </View>

                <View className="flex-1 mr-2">
                  <Text
                    className="text-[10px] font-bold uppercase tracking-wider mb-0.5"
                    style={{ color: PRIMARY_LIGHT, opacity: 0.65 }}
                  >
                    {MATERIAL_TIPO_LABEL[materialSelecionado.tipo]}
                  </Text>
                  <Text className="text-white text-base font-bold" numberOfLines={2}>
                    {materialSelecionado.nome}
                  </Text>
                </View>

                {materialSelecionado.tipo !== "notion" && (
                  <Pressable
                    onPress={() => abrirMaterial(materialSelecionado)}
                    disabled={abrindoId === materialSelecionado.id}
                    className="items-center justify-center active:opacity-60"
                    hitSlop={8}
                    style={{ width: 34, height: 34 }}
                  >
                    {abrindoId === materialSelecionado.id ? (
                      <ActivityIndicator size="small" color={PRIMARY_LIGHT} />
                    ) : (
                      <ExternalLink size={18} color={PRIMARY_LIGHT} />
                    )}
                  </Pressable>
                )}
              </View>

              {subtemasDoMaterialSelecionado.length > 1 && (
                <View className="flex-row items-center justify-end mb-3" style={{ gap: 14 }}>
                  <Pressable onPress={() => setExpandAllSignal((v) => (v ?? 0) + 1)} hitSlop={6}>
                    <Text className="text-xs font-semibold" style={{ color: PRIMARY_LIGHT }}>
                      Expandir tudo
                    </Text>
                  </Pressable>
                  <Pressable onPress={() => setCollapseAllSignal((v) => (v ?? 0) + 1)} hitSlop={6}>
                    <Text className="text-xs font-semibold" style={{ color: MUTED }}>
                      Recolher tudo
                    </Text>
                  </Pressable>
                </View>
              )}

              <View
                className="rounded-[24px] p-4"
                style={{ backgroundColor: SURFACE_SUBTEMA, borderWidth: 1, borderColor: `${PRIMARY}26` }}
              >
                {subtemasDoMaterialSelecionado.map((subtema, index) => (
                  <SubtemaRow
                    key={subtema.id}
                    subtema={subtema}
                    isLast={index === subtemasDoMaterialSelecionado.length - 1}
                    expandAllSignal={expandAllSignal}
                    collapseAllSignal={collapseAllSignal}
                  />
                ))}
              </View>
            </>
          )}
        </BottomSheetScrollView>
      </BottomSheetModal>
    </SafeAreaView>
  );
}
