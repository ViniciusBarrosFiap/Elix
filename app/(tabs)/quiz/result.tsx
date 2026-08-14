import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  StatusBar,
  Platform,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

// ---------------------------------------------------------------------------
// Design tokens (extraídos do tailwind.config)
// ---------------------------------------------------------------------------
const colors = {
  primary: '#8A2BE2',
  onPrimary: '#FFFFFF',
  primaryContainer: '#2A1B3D',
  onPrimaryContainer: '#E0B1FF',
  secondary: '#B388FF',
  background: '#0F0F12',
  onBackground: '#F2F2F7',
  surface: '#1C1C1E',
  onSurface: '#F2F2F7',
  surfaceVariant: '#2C2C2E',
  onSurfaceVariant: '#AEAEB2',
  outline: '#3A3A3C',
};

const radius = {
  default: 8,
  lg: 12,
  xl: 18,
  xxl: 50,
  full: 9999,
};

// ---------------------------------------------------------------------------
// Dados de conteúdo
// ---------------------------------------------------------------------------
type Topic = {
  key: string;
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
};

const REVIEWED_TOPICS: Topic[] = [
  { key: 'neuro', label: 'Neurociência', icon: 'brain' },
  { key: 'farma', label: 'Farmacologia', icon: 'pill' },
  { key: 'bioquimica', label: 'Bioquímica', icon: 'flask-outline' },
  { key: 'anatomia', label: 'Anatomia', icon: 'human' },
  { key: 'fisiologia', label: 'Fisiologia', icon: 'heart-pulse' },
  { key: 'genetica', label: 'Genética', icon: 'dna' },
];

type Props = {
  acertos?: number;
  erros?: number;
  elixirMl?: number;
  streakDias?: number;
 
};

export default function RevisaoConcluidaScreen({
  acertos = 4,
  erros = 1,
  elixirMl = 250,
  streakDias = 14,

}: Props) {
  // ─── Animação de Pulo (Spring) do Ícone ───
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const onFinalizar = () => {

    router.replace('/(tabs)/home');

  }

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5, // Controle do "quique"
        tension: 60,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scaleAnim, opacityAnim]);

  // ─── Lógica de Textos Dinâmicos ───
  const total = acertos + erros;
  const taxaAcerto = total > 0 ? acertos / total : 0;
  
  const subtitleText = taxaAcerto >= 0.8
    ? 'Excelente trabalho! Sua memória está afiada hoje.'
    : 'Revisão concluída. Continue praticando para dominar esses temas.';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Hero: Ícone central com halo (glow) animado */}
      <View style={styles.heroSection}>
        <View style={styles.glowWrap} pointerEvents="none">
          <LinearGradient
            colors={['rgba(138,43,226,0.35)', 'rgba(138,43,226,0)']}
            style={styles.glow}
          />
        </View>
        <Animated.View
          style={[
            styles.iconCircleOuter,
            {
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          <BlurView intensity={30} tint="dark" style={styles.iconCircleBlur}>
            <MaterialCommunityIcons name="check-circle" size={92} color={colors.primary} />
          </BlurView>
        </Animated.View>
      </View>

      {/* Painel inferior */}
      <View style={styles.bottomPanel}>
        {/* Badges de resultado (Plural dinâmico) */}
        <View style={styles.badgesRow}>
          <BlurView intensity={25} tint="dark" style={[styles.badge, styles.badgeSuccess]}>
            <MaterialCommunityIcons name="check-circle" size={16} color={colors.primary} />
            <Text style={styles.badgeSuccessText}>
              {acertos} {acertos === 1 ? 'Acerto' : 'Acertos'}
            </Text>
          </BlurView>
          <BlurView intensity={25} tint="dark" style={[styles.badge, styles.badgeError]}>
            <MaterialCommunityIcons name="close-circle" size={16} color={colors.secondary} />
            <Text style={styles.badgeErrorText}>
              {erros} {erros === 1 ? 'Erro' : 'Erros'}
            </Text>
          </BlurView>
        </View>

        <Text style={styles.title}>Revisão concluída</Text>
        <Text style={styles.subtitle}>{subtitleText}</Text>

        {/* Chips de conteúdos revisados */}
        <Text style={styles.sectionLabel}>CONTEÚDOS REVISADOS</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
          style={styles.chipsScroll}
        >
          {REVIEWED_TOPICS.map((topic) => (
            <View key={topic.key} style={styles.chip}>
              <View style={styles.chipIconWrap}>
                <MaterialCommunityIcons name={topic.icon} size={12} color={colors.primary} />
              </View>
              <Text style={styles.chipLabel}>{topic.label}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Cards de estatísticas
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={[styles.statGlow, { backgroundColor: 'rgba(138,43,226,0.10)' }]} />
            <View style={[styles.statIconWrap, { backgroundColor: 'rgba(138,43,226,0.20)', borderColor: 'rgba(138,43,226,0.20)' }]}>
              <MaterialCommunityIcons name="water" size={16} color={colors.primary} />
            </View>
            <Text style={styles.statLabel}>ELIXIR COLETADO</Text>
            <Text style={styles.statValue}>{elixirMl}ml</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statGlow, { backgroundColor: 'rgba(179,136,255,0.10)' }]} />
            <View style={[styles.statIconWrap, { backgroundColor: 'rgba(179,136,255,0.20)', borderColor: 'rgba(179,136,255,0.20)' }]}>
              <MaterialCommunityIcons name="fire" size={16} color={colors.secondary} />
            </View>
            <Text style={styles.statLabel}>STREAK</Text>
            <Text style={styles.statValue}>{streakDias} dias</Text>
          </View>
        </View> */}

        {/* Único CTA (Removido o X superior) */}
        <Pressable onPress={onFinalizar} style={({ pressed }) => [pressed && styles.ctaPressed]}>
          <LinearGradient
            colors={['#8A2BE2', '#6A1B9A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cta}
          >
            <Text style={styles.ctaText}>Finalizar</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Estilos
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Hero
  heroSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowWrap: {
    position: 'absolute',
    width: 320,
    height: 320,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    width: 320,
    height: 320,
    borderRadius: 160,
  },
  iconCircleOuter: {
    width: 192,
    height: 192,
    borderRadius: 96,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(138,43,226,0.20)',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 12,
  },
  iconCircleBlur: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(138,43,226,0.10)',
  },

  // Bottom panel
  bottomPanel: {
    paddingHorizontal: 24,
    paddingBottom: Platform.select({ ios: 16, android: 24 }),
  },

  badgesRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  badgeSuccess: {
    backgroundColor: 'rgba(138,43,226,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(138,43,226,0.20)',
  },
  badgeSuccessText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.onSurface,
  },
  badgeError: {
    backgroundColor: 'rgba(179,136,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(179,136,255,0.20)',
  },
  badgeErrorText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.onSurfaceVariant,
  },

  title: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 30,
    letterSpacing: -0.3,
    color: colors.onSurface,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: 'Inter_500Medium', // Caso não tenha Inter, substitua por Arial ou a fonte padrão do seu app
    fontSize: 15,
    lineHeight: 22,
    color: colors.onSurfaceVariant,
    opacity: 0.9,
    marginBottom: 20,
  },

  sectionLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.onSurfaceVariant,
    opacity: 0.6,
    marginBottom: 12,
  },
  chipsScroll: {
    marginHorizontal: -24,
    marginBottom: 20,
  },
  chipsRow: {
    paddingHorizontal: 24,
    gap: 12,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(28,28,30,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(58,58,60,0.5)',
  },
  chipIconWrap: {
    width: 20,
    height: 20,
    borderRadius: radius.full,
    backgroundColor: 'rgba(138,43,226,0.20)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: colors.secondary,
  },

  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: radius.xl,
    backgroundColor: 'rgba(44,44,46,0.20)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
  },
  statGlow: {
    position: 'absolute',
    top: -24,
    right: -24,
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  statIconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 8,
  },
  statLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: colors.onSurfaceVariant,
    opacity: 0.8,
    marginBottom: 2,
  },
  statValue: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 20,
    color: colors.onSurface,
  },

  cta: {
    paddingVertical: 18,
    borderRadius: radius.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 40,
    elevation: 8,
  },
  ctaPressed: {
    transform: [{ scale: 0.98 }],
  },
  ctaText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 17,
    color: colors.onPrimary,
  },
});