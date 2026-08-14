import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Easing } from 'react-native';
import { FlaskConical } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams, RelativePathString } from 'expo-router';

const { height } = Dimensions.get('window');
const FLASK_SIZE = 108;
const GLOW_SIZE = FLASK_SIZE * 1.6; // caixa externa que contém o brilho, evita vazar sobre o texto abaixo

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

export default function LoadingScreen({ next, title, subtitle }: Props) {
  const fillAnimation = useRef(new Animated.Value(0)).current;
  const liquidHeight = useRef(new Animated.Value(0)).current; // espelha fillAnimation, sem native driver (anima "height")
  const glowPulse = useRef(new Animated.Value(0)).current;
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

    // Brilho ambiente pulsando atrás do frasco
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowPulse, {
          toValue: 0,
          duration: 1600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    glowLoop.start();

    if (!shouldNavigate) return () => glowLoop.stop();

    const listenerId = fillAnimation.addListener(({ value }) => {
      setPercentage(`${Math.round(value * 100)}%`);
      liquidHeight.setValue(value);
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
      glowLoop.stop();
      fillAnimation.removeListener(listenerId);
    };
  }, [shouldNavigate]);

  const bgTranslateY = fillAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [height / 2, 0],
  });

  const glowOpacity = glowPulse.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.55] });
  const glowScale = glowPulse.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.1] });

  const liquidFillHeight = liquidHeight.interpolate({
    inputRange: [0, 1],
    outputRange: [0, FLASK_SIZE],
  });

  const enterOpacity = enterAnim;
  const enterTranslateY = enterAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] });

  return (
    <View className="flex-1 bg-[#16111b]">
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#16111b' }]} />

      {/* Gradiente vibrante que sobe conforme o progresso */}
      <Animated.View style={[StyleSheet.absoluteFillObject, { transform: [{ translateY: bgTranslateY }] }]}>
        <LinearGradient
          colors={['#8A2BE2', 'black']}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
      </Animated.View>

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
          {/* brilho pulsante atrás, agora contido na própria caixa externa */}
          <Animated.View
            style={{
              position: 'absolute',
              width: GLOW_SIZE,
              height: GLOW_SIZE,
              borderRadius: 999,
              backgroundColor: '#a855f7',
              opacity: glowOpacity,
            
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

          {/* <Text
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
          </Text> */}
        </View>
      </Animated.View>
    </View>
  );
}