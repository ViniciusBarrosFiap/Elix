import { useEffect } from 'react';
import {
  Canvas,
  RadialGradient,
  Circle,
  Group,
  vec,
  mix,
  Blur,
} from '@shopify/react-native-skia';
import {
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { opacity } from 'react-native-reanimated/lib/typescript/Colors';

type Props = {
  children?: React.ReactNode;
  style?: ViewStyle;
  width: number;
  height: number;
};

// Cada orb tem dois eixos de movimento independentes
// criando trajetória curva (não linear) — efeito de fluido
const ORBS = [
  {
    cx: 0.2,  cy: 0.25, r: 0.6,
   colors: ['#2d0f5a', '#120530', '#040112', '#000000'],
    positions: [0, 0.35, 0.7, 1],
    x: { duration: 6800, tx:  0.2, easing: Easing.inOut(Easing.quad) },
    y: { duration: 9200, ty:  0.13, easing: Easing.inOut(Easing.sin)  },
    blur: 18,
    opacity:0.1
  },
  {
    cx: 0.78, cy: 0.3,  r: 0.55,
     colors: ['#1a0840', '#0a0320', '#03010e', '#000000'],
    positions: [0, 0.4, 0.72, 1],
    x: { duration: 11400, tx: -0.17, easing: Easing.inOut(Easing.sin)  },
    y: { duration:  7600, ty:  0.20, easing: Easing.inOut(Easing.quad) },
    blur: 22,
      opacity:0.1
  },
  {
    cx: 0.45, cy: 0.75, r: 0.65,
      colors: ['#240a50', '#0f0428', '#040116', '#000000'],
    positions: [0, 0.38, 0.68, 1],
    x: { duration:  8900, tx:  0.13, easing: Easing.inOut(Easing.sin)  },
    y: { duration: 13100, ty: -0.15, easing: Easing.inOut(Easing.quad) },
    blur: 20,
      opacity:0.1
  },
  {
    cx: 0.65, cy: 0.12, r: 0.5,
    colors: ['#160735', '#08031a', '#02010c', '#000000'],
    positions: [0, 0.42, 0.74, 1],
    x: { duration: 10200, tx: -0.11,  easing: Easing.inOut(Easing.quad) },
    y: { duration:  7100, ty:  0.22,  easing: Easing.inOut(Easing.sin)  },
    blur: 16,
      opacity:0.1
  },
  {
    cx: 0.25, cy: 0.6,  r: 0.48,
     colors: ['#10042a', '#060214', '#010108', '#000000'],
    positions: [0, 0.45, 0.76, 1],
    x: { duration: 14800, tx:  0.22,  easing: Easing.inOut(Easing.sin)  },
    y: { duration:  9400, ty: -0.11,  easing: Easing.inOut(Easing.quad) },
    blur: 24,
      opacity:0.1
  },
  {
    cx: 0.8,  cy: 0.75, r: 0.52,
    colors: ['#1a0840', '#08031c', '#02010e', '#000000'],
    positions: [0, 0.4, 0.7, 1],
    x: { duration:  7300, tx: -0.20, easing: Easing.inOut(Easing.quad) },
    y: { duration: 11600, ty: -0.17, easing: Easing.inOut(Easing.sin)  },
    blur: 19,
      opacity:0.1
  },
];

export function AnimatedGradientBg({ children, style, width, height }: Props) {
  // X e Y animados separadamente por orb
  const px = ORBS.map(() => useSharedValue(0));
  const py = ORBS.map(() => useSharedValue(0));

  useEffect(() => {
    ORBS.forEach((orb, i) => {
      px[i].value = withRepeat(
        withSequence(
          withTiming(1, { duration: orb.x.duration, easing: orb.x.easing }),
          withTiming(0, { duration: orb.x.duration * 1.2, easing: orb.x.easing })
        ),
        -1,
        false
      );

      py[i].value = withRepeat(
        withSequence(
          withTiming(1, { duration: orb.y.duration, easing: orb.y.easing }),
          withTiming(0, { duration: orb.y.duration * 1.15, easing: orb.y.easing })
        ),
        -1,
        false
      );
    });
  }, []);

  return (
    <View style={[styles.container, style]}>
      <Canvas style={StyleSheet.absoluteFillObject}>
        <Group opacity={0.85} blendMode="screen">
          {ORBS.map((orb, i) => {
            const cx = useDerivedValue(() =>
              (orb.cx + mix(px[i].value, 0, orb.x.tx)) * width
            );
            const cy = useDerivedValue(() =>
              (orb.cy + mix(py[i].value, 0, orb.y.ty)) * height
            );
            const center = useDerivedValue(() =>
              vec(cx.value, cy.value)
            );
            const r = orb.r * Math.max(width, height);

            return (
              <Circle key={i} cx={cx} cy={cy} r={r}>
                <RadialGradient
                  c={center}
                  r={r}
                  colors={orb.colors}
                  positions={orb.positions}
                />
                <Blur blur={orb.blur} />
              </Circle>
            );
          })}
        </Group>
      </Canvas>

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000',
    overflow: 'hidden',
  },
});