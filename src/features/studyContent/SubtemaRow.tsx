import { BlurView } from "expo-blur";
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { Check, ChevronDown, Clock, Crown, Star, Zap } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { Conceito, SubTema } from "@/src/types/studyContent";
import {
  COR_ATRASADO,
  COR_REVISA_HOJE,
  MUTED,
  PRIMARY_LIGHT,
  STATUS_CONCEITO_COLOR,
  STATUS_CONCEITO_ICON,
  SUBTEMA_STATUS_COLOR,
  SUBTEMA_STATUS_ICON,
  SUBTEMA_STATUS_LABEL,
  SURFACE_CONCEITO,
  classificarSubtema,
  conceitoMastery,
  legendaRevisao,
  revisaoUrgencia,
} from "./subtemaVisuals";

// Nó da trilha: anel de progresso (SVG) preenchido conforme o domínio do
// conceito (0/33/67/100%, ver conceitoMastery) — o mesmo círculo que, cheio,
// vira a moldura da "conquista" quando o conceito é dominado.
const NO_SIZE = 44;
const NO_STROKE = 3;
const NO_RADIUS = (NO_SIZE - NO_STROKE) / 2;
const NO_CIRCUNFERENCIA = 2 * Math.PI * NO_RADIUS;

function NoConceito({
  cor,
  Icon,
  mastery,
  destacado,
}: {
  cor: string;
  Icon: typeof Crown;
  mastery: number;
  destacado: boolean;
}) {
  const offset = NO_CIRCUNFERENCIA * (1 - mastery / 100);

  return (
    <View style={{ width: NO_SIZE, height: NO_SIZE }}>
      <Svg width={NO_SIZE} height={NO_SIZE} style={{ position: "absolute" }}>
        <Circle
          cx={NO_SIZE / 2}
          cy={NO_SIZE / 2}
          r={NO_RADIUS}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={NO_STROKE}
          fill="none"
        />
        {mastery > 0 && (
          <Circle
            cx={NO_SIZE / 2}
            cy={NO_SIZE / 2}
            r={NO_RADIUS}
            stroke={cor}
            strokeWidth={NO_STROKE}
            fill="none"
            strokeDasharray={`${NO_CIRCUNFERENCIA} ${NO_CIRCUNFERENCIA}`}
            strokeDashoffset={offset}
            strokeLinecap="round"
            rotation={-90}
            origin={`${NO_SIZE / 2}, ${NO_SIZE / 2}`}
          />
        )}
      </Svg>
      <View style={{ width: NO_SIZE, height: NO_SIZE, alignItems: "center", justifyContent: "center" }}>
        <View
          style={{
            width: NO_SIZE - 14,
            height: NO_SIZE - 14,
            borderRadius: (NO_SIZE - 14) / 2,
            backgroundColor: SURFACE_CONCEITO,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: `${cor}33`,
          }}
        >
          {destacado ? <Star size={13} color="#f0a030" fill="#f0a030" /> : <Icon size={15} color={cor} />}
        </View>
      </View>
    </View>
  );
}

// Trilha de conceitos de um subtema — cada conceito é um nó (anel de domínio)
// numa linha vertical, em vez de um card solto: reforça a leitura de
// "progresso numa jornada" (like um mapa de fases) em vez de uma lista plana.
// A ordem é a mesma que já vem da API — nenhum nó fica bloqueado, é só o
// desenho da trilha que muda; qualquer conceito continua tocável a qualquer
// momento (não faria sentido "trancar" revisão por causa de spaced repetition).
function TrilhaConceitos({ subtema, onSelect }: { subtema: SubTema; onSelect: (conceito: Conceito) => void }) {
  const conceitos = subtema.conceitos;

  return (
    <View>
      {conceitos.map((conceito, i) => {
        const cor = STATUS_CONCEITO_COLOR[conceito.status];
        const StatusIcon = STATUS_CONCEITO_ICON[conceito.status];
        const dominado = conceito.status === "dominado";
        const urgencia = revisaoUrgencia(conceito);
        const corUrgencia = urgencia === "atrasado" ? COR_ATRASADO : COR_REVISA_HOJE;
        const mastery = conceitoMastery(conceito);
        const isLast = i === conceitos.length - 1;

        return (
          <Pressable
            key={conceito.id}
            onPress={() => onSelect(conceito)}
            className="flex-row active:opacity-70"
            style={{ paddingBottom: isLast ? 0 : 14 }}
          >
            <View style={{ width: NO_SIZE, alignItems: "center" }}>
              <NoConceito cor={cor} Icon={StatusIcon} mastery={mastery} destacado={conceito.tag_foco} />
              {!isLast && (
                <View
                  style={{
                    width: 2,
                    flex: 1,
                    minHeight: 16,
                    marginTop: 2,
                    backgroundColor: dominado ? cor : "rgba(255,255,255,0.1)",
                    opacity: dominado ? 0.5 : 1,
                  }}
                />
              )}
            </View>

            <View style={{ flex: 1, marginLeft: 12, paddingTop: 4 }}>
              <View className="flex-row items-start justify-between mb-1">
                <Text className="text-white text-[13px] font-medium flex-1 mr-2" numberOfLines={2}>
                  {conceito.nome}
                </Text>
                {urgencia && (
                  <View
                    className="flex-row items-center px-2 py-0.5 rounded-full"
                    style={{ gap: 3, backgroundColor: `${corUrgencia}29`, borderWidth: 1, borderColor: `${corUrgencia}66` }}
                  >
                    <Clock size={9} color={corUrgencia} />
                    <Text className="text-[9px] uppercase font-bold tracking-wider" style={{ color: corUrgencia }}>
                      {urgencia === "atrasado" ? "Vencido" : "Hoje"}
                    </Text>
                  </View>
                )}
              </View>

              {dominado ? (
                <View className="flex-row items-center" style={{ gap: 4 }}>
                  <Crown size={11} color={cor} />
                  <Text className="text-[11px] font-bold" style={{ color: cor }}>
                    Dominado
                  </Text>
                </View>
              ) : !urgencia ? (
                <Text className="text-[11px]" style={{ color: MUTED }}>
                  {legendaRevisao(conceito)}
                </Text>
              ) : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

// Detalhe de um conceito — dica, as 3 perguntas (nível 1/2/3) com alternativas
// e explicação. Esse conteúdo já existia no banco (vem junto no
// GET /api/study-content) mas não tinha nenhum jeito de consultar fora do
// quiz ao vivo.
function ConceitoDetalheSheet({
  conceito,
  bottomSheetRef,
}: {
  conceito: Conceito | null;
  bottomSheetRef: React.RefObject<BottomSheetModal | null>;
}) {
  const renderBackdrop = useCallback(
    (props: any) => <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} pressBehavior="close" />,
    []
  );

  const renderBackground = useCallback(
    (props: any) => <BlurView style={[props.style, { borderRadius: 28, overflow: "hidden" }]} tint="dark" intensity={70} />,
    []
  );

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      index={0}
      snapPoints={["75%", "95%"]}
      enablePanDownToClose
      // Padrão da lib é "switch", que MINIMIZA (visualmente fecha) o sheet
      // do material por baixo assim que este abre — lendo como "o bottom
      // sheet fecha" ao tocar num conceito. "push" empilha por cima sem
      // mexer no de baixo.
      stackBehavior="push"
      backdropComponent={renderBackdrop}
      backgroundComponent={renderBackground}
      handleIndicatorStyle={{ backgroundColor: PRIMARY_LIGHT, width: 40 }}
    >
      <BottomSheetScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {conceito && (
          <>
            <Text className="text-white text-lg font-bold mb-1">{conceito.nome}</Text>
            <View className="flex-row items-center mb-4" style={{ gap: 10 }}>
              <Text className="text-xs" style={{ color: MUTED }}>
                Revisado {conceito.performance.vezes_revisado}{" "}
                {conceito.performance.vezes_revisado === 1 ? "vez" : "vezes"}
              </Text>
              <Text className="text-xs" style={{ color: MUTED }}>·</Text>
              <Text className="text-xs" style={{ color: MUTED }}>{legendaRevisao(conceito)}</Text>
            </View>

            {conceito.tag_foco && (
              <View
                className="flex-row items-center rounded-2xl px-3 py-2.5 mb-4"
                style={{ backgroundColor: "rgba(240,160,48,0.1)", borderWidth: 1, borderColor: "rgba(240,160,48,0.25)" }}
              >
                <Star size={14} color="#f0a030" fill="#f0a030" />
                <Text className="text-xs ml-2 flex-1" style={{ color: "#f0a030" }}>
                  Marcado como foco — a IA identificou que este conceito precisa de mais atenção.
                </Text>
              </View>
            )}

            <Text
              className="text-[11px] font-bold uppercase tracking-wider mb-3"
              style={{ color: PRIMARY_LIGHT, opacity: 0.75 }}
            >
              Perguntas deste conceito
            </Text>

            <View style={{ gap: 14 }}>
              {[...conceito.perguntas]
                .sort((a, b) => a.nivel - b.nivel)
                .map((pergunta) => (
                  <View
                    key={pergunta.id}
                    className="rounded-2xl p-4"
                    style={{ backgroundColor: SURFACE_CONCEITO, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" }}
                  >
                    <View className="flex-row items-center mb-2" style={{ gap: 6 }}>
                      <Zap size={12} color={PRIMARY_LIGHT} fill={PRIMARY_LIGHT} />
                      <Text className="text-[10px] font-bold uppercase tracking-wider" style={{ color: PRIMARY_LIGHT }}>
                        Nível {pergunta.nivel}
                      </Text>
                    </View>

                    <Text className="text-white text-sm font-medium mb-3">{pergunta.pergunta}</Text>

                    <View style={{ gap: 6 }}>
                      {(["A", "B", "C", "D"] as const).map((letra) => {
                        const correta = letra === pergunta.resposta;
                        return (
                          <View
                            key={letra}
                            className="flex-row items-center rounded-xl px-3 py-2"
                            style={{
                              backgroundColor: correta ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.03)",
                              borderWidth: 1,
                              borderColor: correta ? "rgba(34,197,94,0.35)" : "rgba(255,255,255,0.05)",
                            }}
                          >
                            {correta ? (
                              <Check size={13} color="#22c55e" />
                            ) : (
                              <View style={{ width: 13, height: 13 }} />
                            )}
                            <Text
                              className="text-xs ml-2 flex-1"
                              style={{ color: correta ? "#22c55e" : "rgba(255,255,255,0.7)" }}
                            >
                              {pergunta.alternativas[letra]}
                            </Text>
                          </View>
                        );
                      })}
                    </View>

                    <Text className="text-xs mt-3" style={{ color: MUTED, lineHeight: 17 }}>
                      {pergunta.explicacao}
                    </Text>
                  </View>
                ))}
            </View>
          </>
        )}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

interface SubtemaRowProps {
  subtema: SubTema;
  isLast: boolean;
  // Contadores incrementados pelo pai pra forçar expandir/recolher todos os
  // subtemas de uma vez (ver "Expandir tudo" no bottom sheet do material).
  // Cada linha ainda controla seu próprio estado internamente fora disso.
  expandAllSignal?: number;
  collapseAllSignal?: number;
}

// Linha de subtema — expande/recolhe seus próprios conceitos com estado
// interno (não depende de um Set controlado pelo pai). Separação entre
// subtemas via divisória fina + barra de destaque colorida à esquerda quando
// dominado, em vez de card próprio.
export function SubtemaRow({ subtema, isLast, expandAllSignal, collapseAllSignal }: SubtemaRowProps) {
  const [aberto, setAberto] = useState(false);
  const [conceitoSelecionado, setConceitoSelecionado] = useState<Conceito | null>(null);
  const detalheSheetRef = useRef<BottomSheetModal>(null);

  useEffect(() => {
    if (expandAllSignal !== undefined) setAberto(true);
  }, [expandAllSignal]);

  useEffect(() => {
    if (collapseAllSignal !== undefined) setAberto(false);
  }, [collapseAllSignal]);

  const status = classificarSubtema(subtema);
  const cor = SUBTEMA_STATUS_COLOR[status];
  const StatusIcon = SUBTEMA_STATUS_ICON[status];
  const totalmenteDominado = status === "dominado";

  const totalConceitos = subtema.conceitos.length;
  const dominados = subtema.conceitos.filter((c) => c.status === "dominado").length;
  const urgencias = subtema.conceitos.map(revisaoUrgencia);
  const atrasados = urgencias.filter((u) => u === "atrasado").length;
  const revisamHoje = urgencias.filter((u) => u === "hoje").length;

  const abrirDetalheConceito = (conceito: Conceito) => {
    setConceitoSelecionado(conceito);
    detalheSheetRef.current?.present();
  };

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
          <View className="flex-row items-center" style={{ gap: 6 }}>
            <View className="self-start rounded-full px-2.5 py-0.5" style={{ backgroundColor: `${cor}22` }}>
              <Text className="text-[10px] uppercase font-bold tracking-wider" style={{ color: cor }}>
                {SUBTEMA_STATUS_LABEL[status]}
              </Text>
            </View>
            {/* Mesmas tags de urgência (cor + ícone) usadas nos cards de
                conceito — antes vinha tudo junto num "N vencidos" só, sem
                separar quem já atrasou de quem só vence hoje. */}
            {atrasados > 0 && (
              <View
                className="flex-row items-center self-start rounded-full px-2.5 py-0.5"
                style={{ gap: 4, backgroundColor: `${COR_ATRASADO}29`, borderWidth: 1, borderColor: `${COR_ATRASADO}66` }}
              >
                <Clock size={10} color={COR_ATRASADO} />
                <Text className="text-[10px] uppercase font-bold tracking-wider" style={{ color: COR_ATRASADO }}>
                  {atrasados} vencido{atrasados === 1 ? "" : "s"}
                </Text>
              </View>
            )}
            {revisamHoje > 0 && (
              <View
                className="flex-row items-center self-start rounded-full px-2.5 py-0.5"
                style={{ gap: 4, backgroundColor: `${COR_REVISA_HOJE}29`, borderWidth: 1, borderColor: `${COR_REVISA_HOJE}66` }}
              >
                <Clock size={10} color={COR_REVISA_HOJE} />
                <Text className="text-[10px] uppercase font-bold tracking-wider" style={{ color: COR_REVISA_HOJE }}>
                  {revisamHoje} hoje
                </Text>
              </View>
            )}
            {/* Fração de dominados em vez de só "N conceitos" — a mesma
                linguagem de progresso da trilha (nós preenchidos) resumida
                no cabeçalho, pra bater o olho sem precisar abrir. */}
            <View className="flex-row items-center" style={{ gap: 3 }}>
              <Crown size={10} color={dominados > 0 ? SUBTEMA_STATUS_COLOR.dominado : MUTED} />
              <Text className="text-[11px]" style={{ color: MUTED }}>
                {dominados}/{totalConceitos} dominados
              </Text>
            </View>
          </View>
        </View>

        <View style={{ transform: [{ rotate: aberto ? "180deg" : "0deg" }] }}>
          <ChevronDown size={18} color={PRIMARY_LIGHT} />
        </View>
      </Pressable>

      {/* A trilha (TrilhaConceitos) já desenha sua própria linha vertical
          ligando os nós — só um recuo aqui, sem guia própria (senão duas
          linhas quase coladas). */}
      {aberto && (
        <View style={{ marginTop: 14, marginLeft: 15 }}>
          <TrilhaConceitos subtema={subtema} onSelect={abrirDetalheConceito} />
        </View>
      )}

      <ConceitoDetalheSheet conceito={conceitoSelecionado} bottomSheetRef={detalheSheetRef} />
    </View>
  );
}
