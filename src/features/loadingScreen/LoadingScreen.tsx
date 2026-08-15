import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Easing, AppState, AppStateStatus } from 'react-native';
import { FlaskConical } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Path, Stop } from 'react-native-svg';
import { useRouter, useLocalSearchParams, RelativePathString } from 'expo-router';

/**
 * Dependência extra usada no fundo líquido:
 *   npx expo install react-native-svg
 **/

const { width, height } = Dimensions.get('window');
const FLASK_SIZE = 108;
const GLOW_SIZE = FLASK_SIZE * 1.6; // caixa externa que contém o brilho, evita vazar sobre o texto abaixo

// ── mesma física de tempo real usada no LiquidFillCard ──
const WAVE_SPEED = 0.0015625; // radianos por ms
const FILL_SPEED = 0.003125;  // fração (0–100) por ms

type LoadingParams = {
  next: string;
  title?: string;
  subtitle?: string;
};

type Props = {
  next?: string;
  title?: string;
  subtitle?: string;
};

// Bolhas que sobem dentro do frasco enquanto ele enche.
// Cada uma tem seu próprio delay/duração pra não parecerem sincronizadas.
const BUBBLES = [
  { size: 7, left: 30, delay: 0, duration: 2200 },
  { size: 5, left: 55, delay: 550, duration: 1800 },
  { size: 6, left: 42, delay: 1100, duration: 2000 },
];

function Bubble({ size, left, delay, duration }: (typeof BUBBLES)[number]) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, {
          toValue: 1,
          duration,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -(FLASK_SIZE - 24)] });
  const opacity = anim.interpolate({ inputRange: [0, 0.15, 0.8, 1], outputRange: [0, 0.8, 0.5, 0] });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        bottom: 10,
        left,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: '#f2e5ff',
        opacity,
        transform: [{ translateY }],
      }}
    />
  );
}

// ─────────────────────────────────────────────────────────────
// FUNDO LÍQUIDO: onda em SVG cobrindo a tela toda (mesmo motor do LiquidFillCard,
// implementado aqui dentro mesmo, sem arquivo separado). Cores do gradiente
// mantidas iguais às originais (#8A2BE2 → preto).
// ─────────────────────────────────────────────────────────────
function buildWavePath(W: number, H: number, fillPct: number, t: number, amp: number): string {
  const SEG = 28;
  const surfaceY = H - (fillPct / 100) * H;

  let d = `M0,${(surfaceY + amp * Math.sin(t)).toFixed(1)}`;
  for (let i = 0; i <= SEG; i++) {
    const x = (i / SEG) * W;
    const y = surfaceY + amp * Math.sin((i / SEG) * Math.PI * 2 + t);
    d += `L${x.toFixed(1)},${y.toFixed(1)}`;
  }
  d += `L${W},${H}L0,${H}Z`;
  return d;
}

function LiquidWaveBackground({ progressRef }: { progressRef: React.MutableRefObject<number> }) {
  const pathRef = useRef<any>(null);
  const fillRef = useRef(0);
  const tRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const lastMsRef = useRef<number | null>(null);
  const activeRef = useRef(true);

  useEffect(() => {
    const onAppStateChange = (state: AppStateStatus) => {
      if (state === 'active') {
        activeRef.current = true;
        lastMsRef.current = null; // reseta o delta pra evitar salto ao voltar do background
      } else {
        activeRef.current = false;
      }
    };
    const sub = AppState.addEventListener('change', onAppStateChange);

    function loop(timestamp: number) {
      const delta = lastMsRef.current !== null ? Math.min(timestamp - lastMsRef.current, 64) : 16;
      lastMsRef.current = timestamp;

      if (activeRef.current) {
        tRef.current += WAVE_SPEED * delta;
        fillRef.current += (progressRef.current - fillRef.current) * FILL_SPEED * delta;

        if (pathRef.current) {
          pathRef.current.setNativeProps({
            d: buildWavePath(width, height, fillRef.current, tRef.current, 12),
          });
        }
      }
      rafRef.current = requestAnimationFrame(loop);
    }

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      sub.remove();
    };
  }, []);

  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
      <Defs>
        {/* mesmas cores do fundo original, só que agora com onda em vez de retângulo deslizando */}
        <SvgLinearGradient id="loadingLiquidBg" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#8A2BE2" stopOpacity="1" />
          <Stop offset="1" stopColor="#000000" stopOpacity="1" />
        </SvgLinearGradient>
      </Defs>
      <Path ref={pathRef} fill="url(#loadingLiquidBg)" />
    </Svg>
  );
}

export default function LoadingScreen({ next, title, subtitle }: Props) {
  const fillAnimation = useRef(new Animated.Value(0)).current;
  const liquidHeight = useRef(new Animated.Value(0)).current; // espelha fillAnimation, sem native driver (anima "height")
  const bgProgressRef = useRef(0); // 0–100, lido pelo loop de onda do fundo (fora do React)
  const enterAnim = useRef(new Animated.Value(0)).current;

  const router = useRouter();
  const params = useLocalSearchParams<LoadingParams>();
  const [percentage, setPercentage] = useState('0%');

  const finalNext = next ?? (params.next as string) ?? '/home';
  const finalTitle = title ?? (params.title as string) ?? '';
  const finalSubtitle = subtitle ?? (params.subtitle as string) ?? '';

  const shouldNavigate = !!finalNext;

  useEffect(() => {
    // Entrada suave do texto/frasco
    Animated.timing(enterAnim, {
      toValue: 1,
      duration: 700,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    if (!shouldNavigate) return;

    const listenerId = fillAnimation.addListener(({ value }) => {
      setPercentage(`${Math.round(value * 100)}%`);
      liquidHeight.setValue(value);
      bgProgressRef.current = value * 100;
    });

    Animated.timing(fillAnimation, {
      toValue: 0.9,
      duration: 10000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => {
      Animated.timing(fillAnimation, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      }).start();

      // Estabelece delay para navegação após a animação de preenchimento finalizar
      setTimeout(() => {
        router.replace(finalNext as RelativePathString);
      }, 2500);
    }, 3500);

    return () => {
      clearTimeout(timer);
      fillAnimation.removeListener(listenerId);
    };
  }, [shouldNavigate]);

  const liquidFillHeight = liquidHeight.interpolate({
    inputRange: [0, 1],
    outputRange: [0, FLASK_SIZE],
  });

  const enterOpacity = enterAnim;
  const enterTranslateY = enterAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] });

  return (
    <View className="flex-1 bg-[#16111b]">
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#16111b' }]} />

      {/* Fundo líquido: onda em SVG subindo com o progresso, mesmas cores de antes */}
      <LiquidWaveBackground progressRef={bgProgressRef} />

      <Animated.View
        className="absolute inset-0 z-10 items-center justify-center"
        style={{ opacity: enterOpacity, transform: [{ translateY: enterTranslateY }] }}
      >
        {/* --- FRASCO ANIMADO (elemento de assinatura) --- */}
        {/* Caixa externa reserva o espaço real do brilho, então nada vaza sobre o texto abaixo */}
        <View
          style={{
            width: GLOW_SIZE,
            height: GLOW_SIZE,
            marginBottom: 18,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* blur atrás do frasco, deixando a onda do fundo levemente desfocada nessa área */}
          <BlurView
            intensity={35}
            tint="dark"
            style={{
              position: 'absolute',
              width: GLOW_SIZE,
              height: GLOW_SIZE,
              borderRadius: 999,
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: 'rgba(196,148,255,0.25)',
            }}
          />

          <View style={{ width: FLASK_SIZE, height: FLASK_SIZE }}>
            {/* contorno do frasco (vazio) */}
            <FlaskConical
              size={FLASK_SIZE}
              color="#4a3a5c"
              strokeWidth={1.4}
              style={StyleSheet.absoluteFillObject}
            />

            {/* máscara com o líquido: sobe conforme o progresso, com bolhas dentro */}
            <View
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                width: FLASK_SIZE,
                overflow: 'hidden',
              }}
            >
              <Animated.View style={{ height: liquidFillHeight, width: FLASK_SIZE, justifyContent: 'flex-end' }}>
                {BUBBLES.map((b, i) => (
                  <Bubble key={i} {...b} />
                ))}
                <FlaskConical
                  size={FLASK_SIZE}
                  color="#c084fc"
                  strokeWidth={1.4}
                  style={{ position: 'absolute', bottom: 0 }}
                />
              </Animated.View>
            </View>
          </View>
        </View>

        {/* --- PORCENTAGEM --- */}
        {/* width fixa (não "shrink-to-content") garante que título/subtítulo quebrem linha
            e centralizem em relação à tela, e não em relação ao próprio texto */}
        <View style={{ marginTop: 40, width: '100%', paddingHorizontal: 32, alignItems: 'center' }}>
          {/* <Text
            className="font-bold mb-3 text-[#eed9ff]/90"
            style={{ fontFamily: 'Manrope', fontSize: 64, letterSpacing: 1, textAlign: 'center', alignSelf: 'stretch' }}
          >
            {percentage}
          </Text> */}

          <Text
            className="font-bold text-[#eed9ff]"
            style={{
              fontFamily: 'Manrope',
              fontSize: 22,
              letterSpacing: -0.4,
              textAlign: 'center',
              alignSelf: 'stretch',
            }}
          >
            {finalTitle}
          </Text>

          <Text
            className="mt-4 text-base text-[#cfc2d7]"
            style={{ fontFamily: 'Manrope', textAlign: 'center', alignSelf: 'stretch' }}
          >
            {finalSubtitle}
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}