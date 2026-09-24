import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, Dimensions, Easing, Pressable, StyleSheet, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { AlertCircle, Check, X } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getDoseTarget, WindowRect } from "@/src/features/home/doseCardTarget";
import { useUploadStatusStore, UploadStatus } from "@/src/store/uploadStatusStore";
import { colors, semantic } from "@/src/theme/colors";

// Quanto o card de sucesso fica parado (o aluno lê "Revisão pronta") antes de
// virar bolinha e voar até o card da revisão diária.
const HOLD_SUCESSO_MS = 1500;

// Offset vertical replica a matemática de ElixTabBar (src/components/TabBar.tsx):
// paddingBottom: insets.bottom*0.6 + altura do pill (~65) do tab bar + um
// respiro de 12px entre os dois containers flutuantes.
const TAB_BAR_ALTURA_ESTIMADA = 65;
const GAP_ACIMA_DA_TAB_BAR = 12;

const CARD_RADIUS = 22;
const BALL_SIZE = 46;

// Posição de cada estado na escala de cor animada (borda + fundo do ícone).
const ESTADO_INDEX: Record<Exclude<UploadStatus, "idle">, number> = {
  processing: 0,
  success: 1,
  error: 2,
};

interface Voo {
  // Retângulo de partida (o card) e deslocamento até o centro do alvo, tudo
  // em coordenadas do overlay.
  startX: number;
  startY: number;
  startW: number;
  startH: number;
  dx: number;
  dy: number;
}

function medir(node: View | null): Promise<WindowRect | null> {
  return new Promise((resolve) => {
    if (!node) return resolve(null);
    node.measureInWindow((x, y, width, height) => resolve(width > 0 && height > 0 ? { x, y, width, height } : null));
  });
}

/**
 * Container flutuante global (montado em app/_layout.tsx, acima de tudo) que
 * mostra o progresso da geração de revisão iniciada em addContent.tsx. Fica
 * fora do ciclo de vida daquela tela de propósito: o aluno é redirecionado
 * pra Home assim que a geração começa (ver handleGenerate), e esse container
 * é quem continua de pé pra avisar quando a IA termina — ver uploadStatusStore.
 *
 * No sucesso: o card vira uma bolinha e voa até o card "Revisão de Hoje" da
 * Home, onde estoura um splash (ver DoseCard/doseCardTarget). Se a Home não
 * estiver visível naquele momento, cai num fade simples.
 */
export function UploadStatusPill() {
  const status = useUploadStatusStore((s) => s.status);
  const mensagem = useUploadStatusStore((s) => s.mensagem);
  const subtitulo = useUploadStatusStore((s) => s.subtitulo);
  const retry = useUploadStatusStore((s) => s.retry);
  const reset = useUploadStatusStore((s) => s.reset);
  const insets = useSafeAreaInsets();

  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;
  const iconScale = useRef(new Animated.Value(1)).current;
  // Anima cor/tamanho/posição, que não rodam no native driver — por isso
  // ficam em Animated.Values separados dos de opacity/translate acima.
  const corProgress = useRef(new Animated.Value(0)).current;
  const morph = useRef(new Animated.Value(0)).current;
  const voar = useRef(new Animated.Value(0)).current;
  const chegada = useRef(new Animated.Value(0)).current;

  const hideTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const overlayRef = useRef<View>(null);
  const cardRef = useRef<View>(null);
  const [voo, setVoo] = useState<Voo | null>(null);

  const cancelarTimer = useCallback(() => {
    if (hideTimeout.current) {
      clearTimeout(hideTimeout.current);
      hideTimeout.current = null;
    }
  }, []);

  // Só limpa o estado se ele ainda for o "success" que originou a animação —
  // se o aluno já iniciou outra geração no meio do voo, não pisa nela.
  const finalizar = useCallback(() => {
    setVoo(null);
    if (useUploadStatusStore.getState().status === "success") reset();
  }, [reset]);

  const fadeSimples = useCallback(() => {
    Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => finalizar());
  }, [opacity, finalizar]);

  const iniciarVoo = useCallback(async () => {
    const alvo = getDoseTarget();
    if (!alvo) return fadeSimples();

    const [alvoRect, cardRect, overlayRect] = await Promise.all([alvo.measure(), medir(cardRef.current), medir(overlayRef.current)]);
    if (useUploadStatusStore.getState().status !== "success") return;
    if (!alvoRect || !cardRect || !overlayRect) return fadeSimples();

    // Card da revisão fora da área visível (ex: Home rolada) — sem pra onde voar.
    const altura = Dimensions.get("window").height;
    if (alvoRect.y + alvoRect.height < 0 || alvoRect.y > altura) return fadeSimples();

    const startX = cardRect.x - overlayRect.x;
    const startY = cardRect.y - overlayRect.y;
    const bolaX0 = startX + (cardRect.width - BALL_SIZE) / 2;
    const bolaY0 = startY + (cardRect.height - BALL_SIZE) / 2;
    const alvoCX = alvoRect.x - overlayRect.x + alvoRect.width / 2;
    const alvoCY = alvoRect.y - overlayRect.y + alvoRect.height / 2;

    morph.setValue(0);
    voar.setValue(0);
    chegada.setValue(0);
    setVoo({
      startX,
      startY,
      startW: cardRect.width,
      startH: cardRect.height,
      dx: alvoCX - BALL_SIZE / 2 - bolaX0,
      dy: alvoCY - BALL_SIZE / 2 - bolaY0,
    });

    Animated.sequence([
      Animated.timing(morph, { toValue: 1, duration: 368, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
      Animated.timing(voar, { toValue: 1, duration: 863, easing: Easing.inOut(Easing.cubic), useNativeDriver: false }),
    ]).start(({ finished }) => {
      if (!finished) return;
      // Chegou: splash no card da revisão + a bolinha "some" dentro dele.
      getDoseTarget()?.splash();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      Animated.timing(chegada, { toValue: 1, duration: 400, easing: Easing.out(Easing.quad), useNativeDriver: false }).start(() => finalizar());
    });
  }, [chegada, fadeSimples, finalizar, morph, voar]);

  useEffect(() => {
    if (status === "idle") return;

    if (status === "processing") {
      translateY.setValue(12);
    }

    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start();

    Animated.timing(corProgress, {
      toValue: ESTADO_INDEX[status],
      duration: 300,
      useNativeDriver: false,
    }).start();

    if (status === "success" || status === "error") {
      iconScale.setValue(0.6);
      Animated.spring(iconScale, { toValue: 1, friction: 4, tension: 140, useNativeDriver: true }).start();
      Haptics.notificationAsync(
        status === "success" ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error
      ).catch(() => {});
    }

    // Erro NÃO some sozinho: se sumisse, uma falha que o aluno não estivesse
    // olhando naquele instante passaria batido — pior que não avisar.
    if (status === "success") {
      cancelarTimer();
      hideTimeout.current = setTimeout(() => {
        hideTimeout.current = null;
        iniciarVoo();
      }, HOLD_SUCESSO_MS);
    }
    return cancelarTimer;
  }, [status]);

  if (status === "idle") return null;

  const isProcessando = status === "processing";
  const isSucesso = status === "success";
  const isErro = status === "error";

  const corBorda = corProgress.interpolate({
    inputRange: [0, 1, 2],
    outputRange: ["rgba(255,255,255,0.12)", `${semantic.success}66`, `${semantic.danger}66`],
  });
  const corFundoIcone = corProgress.interpolate({
    inputRange: [0, 1, 2],
    outputRange: ["rgba(139,92,246,0.18)", `${semantic.success}26`, `${semantic.danger}26`],
  });

  const handleTentarNovamente = () => {
    const tentar = retry;
    reset();
    tentar?.();
  };

  const bola = voo && (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: Animated.add(
          morph.interpolate({ inputRange: [0, 1], outputRange: [voo.startX, voo.startX + (voo.startW - BALL_SIZE) / 2] }),
          Animated.add(
            voar.interpolate({ inputRange: [0, 1], outputRange: [0, voo.dx] }),
            // Curva lateral: a bolinha abre pro lado no meio do caminho e
            // volta, em vez de subir em linha reta.
            voar.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 70, 0] })
          )
        ),
        top: Animated.add(
          morph.interpolate({ inputRange: [0, 1], outputRange: [voo.startY, voo.startY + (voo.startH - BALL_SIZE) / 2] }),
          voar.interpolate({ inputRange: [0, 1], outputRange: [0, voo.dy] })
        ),
        width: morph.interpolate({ inputRange: [0, 1], outputRange: [voo.startW, BALL_SIZE] }),
        height: morph.interpolate({ inputRange: [0, 1], outputRange: [voo.startH, BALL_SIZE] }),
        borderRadius: morph.interpolate({ inputRange: [0, 1], outputRange: [CARD_RADIUS, BALL_SIZE / 2] }),
        borderWidth: 1,
        borderColor: morph.interpolate({ inputRange: [0, 1], outputRange: [`${semantic.success}66`, "rgba(233,213,255,0.55)"] }),
        overflow: "hidden",
        // Ao chegar: só some (fade + leve encolhida) enquanto o splash estoura no card.
        opacity: chegada.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
        transform: [
          {
            scale: Animated.multiply(
              voar.interpolate({ inputRange: [0, 1], outputRange: [1, 0.92] }),
              chegada.interpolate({ inputRange: [0, 1], outputRange: [1, 0.7] })
            ),
          },
        ],
        boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 14, spreadDistance: 1, color: "rgba(168,85,247,0.45)" }],
      }}
    >
      {/* Liquid glass roxo: blur de fundo + tinta roxa em degradê diagonal,
          brilho de fundo (luz refletida) e um reflexo especular no topo. */}
      <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={["rgba(192,132,252,0.55)", "rgba(124,58,237,0.42)", "rgba(76,29,149,0.55)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={["rgba(216,180,254,0)", "rgba(216,180,254,0.4)"]}
        start={{ x: 0.5, y: 0.35 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View
        style={{
          position: "absolute",
          top: "10%",
          left: "16%",
          width: "46%",
          height: "30%",
          borderRadius: 999,
          backgroundColor: "rgba(255,255,255,0.5)",
          transform: [{ rotate: "-28deg" }],
          opacity: morph.interpolate({ inputRange: [0.5, 1], outputRange: [0, 1], extrapolate: "clamp" }),
        }}
      />
    </Animated.View>
  );

  return (
    <View ref={overlayRef} pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      <Animated.View
        pointerEvents="box-none"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: insets.bottom * 0.6 + TAB_BAR_ALTURA_ESTIMADA + GAP_ACIMA_DA_TAB_BAR,
          paddingHorizontal: 24,
          opacity,
          transform: [{ translateY }],
        }}
      >
        {/* Some no instante em que a bolinha assume (ela nasce exatamente em cima). */}
        <View style={{ opacity: voo ? 0 : 1 }}>
          <Animated.View
            ref={cardRef}
            collapsable={false}
            style={{ borderRadius: CARD_RADIUS, borderWidth: 1, borderColor: corBorda, overflow: "hidden" }}
          >
            <BlurView
              intensity={70}
              tint="dark"
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 12,
                paddingHorizontal: 12,
                // Véu escuro por baixo do blur — sem ele, o texto branco perde
                // contraste quando o card passa sobre conteúdo claro.
                backgroundColor: "rgba(11,9,20,0.55)",
              }}
            >
              {/* Escala (native driver) e cor de fundo (JS driver) ficam em
                  Animated.Views ANINHADAS de propósito: o mesmo nó não pode
                  misturar as duas — o RN lança "Attempting to run JS driven
                  animation on animated node that has been moved to native". */}
              <Animated.View style={{ transform: [{ scale: iconScale }] }}>
                <Animated.View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: corFundoIcone,
                  }}
                >
                  {isProcessando ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : isSucesso ? (
                    <Check size={20} color={semantic.success} strokeWidth={3} />
                  ) : (
                    <AlertCircle size={20} color={semantic.danger} />
                  )}
                </Animated.View>
              </Animated.View>

              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text numberOfLines={1} style={{ color: "#ffffff", fontSize: 14, fontWeight: "700" }}>
                  {mensagem}
                </Text>
                {subtitulo ? (
                  <Text numberOfLines={2} style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, marginTop: 2 }}>
                    {subtitulo}
                  </Text>
                ) : null}
              </View>

              {isErro && (
                <View style={{ flexDirection: "row", alignItems: "center", marginLeft: 10 }}>
                  {retry && (
                    <Pressable
                      onPress={handleTentarNovamente}
                      hitSlop={8}
                      style={{
                        paddingVertical: 8,
                        paddingHorizontal: 14,
                        borderRadius: 999,
                        backgroundColor: `${semantic.danger}33`,
                      }}
                    >
                      <Text style={{ color: semantic.danger, fontSize: 12, fontWeight: "700" }}>Tentar novamente</Text>
                    </Pressable>
                  )}
                  <Pressable onPress={reset} hitSlop={10} style={{ marginLeft: 8, padding: 4 }} accessibilityLabel="Descartar">
                    <X size={18} color="rgba(255,255,255,0.55)" />
                  </Pressable>
                </View>
              )}
            </BlurView>
          </Animated.View>
        </View>
      </Animated.View>

      {bola}
    </View>
  );
}
