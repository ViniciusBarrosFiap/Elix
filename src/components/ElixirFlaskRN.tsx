/**
 * Frasco de elixir roxo com líquido animado + animação de ganho de pontos
 * (gotas voando + rótulo "+XP" flutuando). Usado como feedback gamificado
 * imediato ao responder uma pergunta do quiz.
 *
 * `totalUnits` é quanto enche o frasco 100% (ex: soma do elixir máximo
 * possível na sessão). `gain(amount, label?)` soma `amount` ao total
 * acumulado (capado em `totalUnits`) e dispara a animação de líquido +
 * gotas + rótulo flutuante.
 */
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import Svg, { ClipPath, Defs, LinearGradient, Path, Rect, Stop } from "react-native-svg";

const AnimatedRect = Animated.createAnimatedComponent(Rect);

// Silhueta de garrafa de poção (corpo arredondado + gargalo estreito)
const VIEWBOX_W = 60;
const VIEWBOX_H = 78;
const BODY_PATH =
  "M24 4 H36 V18 C46.5 20 52 30 52 44 C52 62 42.5 74 30 74 C17.5 74 8 62 8 44 C8 30 13.5 20 24 18 Z";
const LIQUID_EMPTY_Y = 74; // fundo do frasco (0%)
const LIQUID_FULL_Y = 22; // perto do gargalo (100%)
const DROPLET_COUNT = 6;

export interface ElixirFlaskHandle {
  gain: (amount: number, gainLabelText?: string) => void;
  reset: () => void;
  getFillPct: () => number;
}

interface ElixirFlaskProps {
  totalUnits?: number;
  size?: number;
}

interface DropletSpec {
  id: number;
  dx: number;
  dy: number;
  size: number;
  delay: number;
  duration: number;
}

// ---------------------------------------------------------------------
// Uma única gota, animada do centro do frasco para fora e some.
// ---------------------------------------------------------------------
function Droplet({ dx, dy, size, delay, duration }: DropletSpec) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration,
      delay,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, []);

  const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [0, dx] });
  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [0, dy] });
  const scale = progress.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0.4, 1, 0.2] });
  const opacity = progress.interpolate({ inputRange: [0, 0.1, 0.8, 1], outputRange: [0, 1, 1, 0] });

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: size,
        height: size * 1.3,
        marginLeft: -size / 2,
        marginTop: -(size * 1.3) / 2,
        borderRadius: size / 2,
        backgroundColor: "#C084FC",
        shadowColor: "#A855F7",
        shadowOpacity: 0.9,
        shadowRadius: 4,
        opacity,
        transform: [{ translateX }, { translateY }, { scale }],
      }}
    />
  );
}

// ---------------------------------------------------------------------
// Rótulo "+XP" que sobe e desaparece.
// ---------------------------------------------------------------------
function GainLabel({ text }: { text: string }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [4, -28] });
  const opacity = anim.interpolate({ inputRange: [0, 0.15, 0.8, 1], outputRange: [0, 1, 1, 0] });
  const scale = anim.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0.6, 1.15, 1] });

  return (
    <Animated.Text
      pointerEvents="none"
      style={{
        position: "absolute",
        alignSelf: "center",
        top: -6,
        fontWeight: "800",
        fontSize: 16,
        color: "#E9D5FF",
        textShadowColor: "rgba(168,85,247,0.85)",
        textShadowRadius: 8,
        textShadowOffset: { width: 0, height: 0 },
        opacity,
        transform: [{ translateY }, { scale }],
      }}
    >
      {text}
    </Animated.Text>
  );
}

// ---------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------
const ElixirFlaskRN = forwardRef<ElixirFlaskHandle, ElixirFlaskProps>(function ElixirFlaskRN(
  { totalUnits = 6, size = 54 },
  ref
) {
  const unitsRef = useRef(0);
  const scaleY = useRef(new Animated.Value(1)).current;
  const scaleX = useRef(new Animated.Value(1)).current;
  const liquidY = useRef(new Animated.Value(LIQUID_EMPTY_Y)).current;

  const [burst, setBurst] = useState<{ id: number; droplets: DropletSpec[] } | null>(null);
  const [label, setLabel] = useState<{ id: number; text: string } | null>(null);

  // totalUnits nunca deve ser <=0 aqui dentro — divisão por zero vira NaN e
  // trava a animação. Quem chama pode passar 0 momentaneamente (ex: lista de
  // perguntas ainda carregando).
  const totalUnitsSeguro = Math.max(1, totalUnits);

  function animateLiquidTo(fillPct: number) {
    const targetY =
      LIQUID_EMPTY_Y - Math.max(0, Math.min(1, fillPct)) * (LIQUID_EMPTY_Y - LIQUID_FULL_Y);
    Animated.timing(liquidY, {
      toValue: targetY,
      duration: 700,
      easing: Easing.elastic(0.9),
      useNativeDriver: false, // props de SVG não suportam native driver
    }).start();
  }

  function pulse() {
    scaleY.setValue(1);
    scaleX.setValue(1);
    Animated.sequence([
      Animated.timing(scaleY, { toValue: 1.16, duration: 130, useNativeDriver: true }),
      Animated.timing(scaleY, { toValue: 0.92, duration: 130, useNativeDriver: true }),
      Animated.timing(scaleY, { toValue: 1, duration: 160, useNativeDriver: true }),
    ]).start();
    Animated.sequence([
      Animated.timing(scaleX, { toValue: 0.9, duration: 130, useNativeDriver: true }),
      Animated.timing(scaleX, { toValue: 1.1, duration: 130, useNativeDriver: true }),
      Animated.timing(scaleX, { toValue: 1, duration: 160, useNativeDriver: true }),
    ]).start();
  }

  function spawnDroplets() {
    const id = Date.now() + Math.random();
    const drops: DropletSpec[] = Array.from({ length: DROPLET_COUNT }, (_, i) => {
      const angleDeg = -90 + (i - (DROPLET_COUNT - 1) / 2) * 26 + (Math.random() * 14 - 7);
      const rad = (angleDeg * Math.PI) / 180;
      const dist = 20 + Math.random() * 16;
      return {
        id: i,
        dx: Math.cos(rad) * dist,
        dy: Math.sin(rad) * dist,
        size: 6 + Math.random() * 3,
        delay: Math.round(Math.random() * 80),
        duration: Math.round(650 + Math.random() * 200),
      };
    });
    setBurst({ id, droplets: drops });
    setTimeout(() => {
      setBurst((b) => (b && b.id === id ? null : b));
    }, 1100);
  }

  /**
   * Registra um ganho no frasco.
   * @param amount Quanto encher — soma direto ao total acumulado (capado em
   *               totalUnits). Um acerto de nível alto enche mais que um erro.
   * @param gainLabelText Texto opcional tipo "+100 XP" pra flutuar. Se
   *                      omitido, só a animação de líquido/gotas roda.
   */
  function gain(amount: number, gainLabelText?: string) {
    const newUnits = Math.min(totalUnitsSeguro, Math.max(0, unitsRef.current + amount));
    unitsRef.current = newUnits;
    animateLiquidTo(newUnits / totalUnitsSeguro);
    pulse();
    spawnDroplets();

    if (gainLabelText) {
      const id = Date.now() + Math.random();
      setLabel({ id, text: gainLabelText });
      setTimeout(() => {
        setLabel((l) => (l && l.id === id ? null : l));
      }, 1000);
    }
  }

  /** Esvazia o frasco de novo (ex: reiniciar o quiz). */
  function reset() {
    unitsRef.current = 0;
    animateLiquidTo(0);
  }

  /** Pega o percentual atual sem disparar animação (0–100). */
  function getFillPct() {
    return (unitsRef.current / totalUnitsSeguro) * 100;
  }

  useImperativeHandle(ref, () => ({ gain, reset, getFillPct }));

  const scale = size / VIEWBOX_W;
  const width = VIEWBOX_W * scale;
  const height = VIEWBOX_H * scale;

  return (
    <View style={{ width, height: height + 24, alignItems: "center" }}>
      <Animated.View style={{ transform: [{ scaleY }, { scaleX }] }}>
        <Svg width={width} height={height} viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}>
          <Defs>
            <LinearGradient id="liquidGrad" x1="0" y1="1" x2="0" y2="0">
              <Stop offset="0%" stopColor="#7E22CE" />
              <Stop offset="55%" stopColor="#A855F7" />
              <Stop offset="100%" stopColor="#E9D5FF" />
            </LinearGradient>
            <ClipPath id="flaskClip">
              <Path d={BODY_PATH} />
            </ClipPath>
          </Defs>

          {/* contorno do frasco */}
          <Path
            d={BODY_PATH}
            fill="rgba(168,85,247,0.08)"
            stroke="#C084FC"
            strokeWidth={2}
            strokeLinejoin="round"
          />

          {/* líquido, recortado no formato do frasco */}
          <AnimatedRect
            x={0}
            y={liquidY as unknown as number}
            width={VIEWBOX_W}
            height={VIEWBOX_H}
            fill="url(#liquidGrad)"
            clipPath="url(#flaskClip)"
          />

          {/* rolha */}
          <Rect x={22} y={1} width={16} height={7} rx={2.5} fill="#C084FC" />
        </Svg>
      </Animated.View>

      {/* overlay de gotas + rótulo, centralizado sobre o frasco */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        {burst && burst.droplets.map((d) => <Droplet key={`${burst.id}-${d.id}`} {...d} />)}
        {label && <GainLabel key={label.id} text={label.text} />}
      </View>
    </View>
  );
});

export default ElixirFlaskRN;
