import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  Platform,
  Pressable,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Clock, SlidersHorizontal } from 'lucide-react-native';
import DateTimePicker, {
  DateTimePickerAndroid,
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { NotificationsService } from '@/src/services/notifications/notifications.service';

const PRIMARY = '#8a2be2';
const PRIMARY_LIGHT = '#dcb8ff';
const ON_PRIMARY_CONTAINER = '#eed9ff';
const MUTED = '#cfc2d7';

function horarioPadrao(): Date {
  const d = new Date();
  d.setHours(14, 30, 0, 0);
  return d;
}

function formatarHorario(data: Date): string {
  const horas = String(data.getHours()).padStart(2, '0');
  const minutos = String(data.getMinutes()).padStart(2, '0');
  return `${horas}:${minutos}`;
}

// Anel orbital girando continuamente atrás do ícone — mesma ideia decorativa
// do mockup (spin/spin-reverse em CSS), só que via Animated no RN.
function AnelOrbital({ size, duration, reverse, opacity }: { size: number; duration: number; reverse?: boolean; opacity: number }) {
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(rotate, {
        toValue: 1,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [rotate, duration]);

  const spin = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: reverse ? ['360deg', '0deg'] : ['0deg', '360deg'],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 1,
        borderColor: `rgba(220,184,255,${opacity})`,
        transform: [{ rotate: spin }],
      }}
    />
  );
}

export default function ReminderScreen() {
  const [horario, setHorario] = useState<Date>(horarioPadrao());
  const [mostrarPickerIOS, setMostrarPickerIOS] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const enterAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(enterAnim, {
      toValue: 1,
      duration: 500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [enterAnim]);

  function handleChange(_event: DateTimePickerEvent, selecionado?: Date) {
    if (Platform.OS === 'android') {
      setMostrarPickerIOS(false);
    }
    if (selecionado) {
      setHorario(selecionado);
    }
  }

  function abrirSeletor() {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: horario,
        mode: 'time',
        is24Hour: true,
        onChange: handleChange,
      });
    } else {
      setMostrarPickerIOS((v) => !v);
    }
  }

  function irParaHome() {
    router.replace({
      pathname: '/loadingScreen',
      params: { next: '/home', title: 'Processando informações...' },
    });
  }

  async function handleDefinirLembrete() {
    setIsSaving(true);
    try {
      if (!NotificationsService.isAvailable) {
        Alert.alert(
          'Lembretes indisponíveis neste modo',
          'Notificações não funcionam rodando pelo Expo Go — isso é uma limitação do próprio Expo, não um erro seu. Você pode seguir sem o lembrete por enquanto.'
        );
        return;
      }

      const permitido = await NotificationsService.requestPermission();
      if (!permitido) {
        Alert.alert(
          'Permissão não concedida',
          'Você pode ativar as notificações depois nas configurações do sistema pra receber o lembrete diário.'
        );
      } else {
        await NotificationsService.scheduleDailyReminder(horario.getHours(), horario.getMinutes());
      }
    } catch {
      Alert.alert('Erro', 'Não foi possível agendar seu lembrete agora. Você pode configurar depois.');
    } finally {
      setIsSaving(false);
      irParaHome();
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-[#16111b]" edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" />

      {/* Glow ambiente */}
      <View pointerEvents="none" className="absolute inset-0 opacity-40">
        <LinearGradient
          colors={['transparent', PRIMARY, 'transparent']}
          start={{ x: 0.5, y: 1.4 }}
          end={{ x: 0.5, y: 0.4 }}
          style={{ flex: 1 }}
        />
      </View>

      <Animated.View
        style={{ flex: 1, opacity: enterAnim, transform: [{ translateY: enterAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }}
        className="px-6 items-center justify-center"
      >
        {/* Âncora visual: relógio flutuando com anéis orbitais */}
        <View style={{ width: 160, height: 160 }} className="items-center justify-center mb-8">
          <AnelOrbital size={160} duration={15000} reverse opacity={0.08} />
          <AnelOrbital size={128} duration={10000} opacity={0.12} />

          <View
            className="w-24 h-24 rounded-full items-center justify-center overflow-hidden"
            style={{
              backgroundColor: 'rgba(45,40,51,0.4)',
              borderWidth: 1,
              borderColor: 'rgba(220,184,255,0.1)',
            }}
          >
            <LinearGradient
              colors={[`${PRIMARY}33`, 'transparent']}
              style={{ position: 'absolute', width: '100%', height: '100%' }}
            />
            <Clock size={40} color={PRIMARY_LIGHT} strokeWidth={1.5} />
          </View>
        </View>

        {/* Copy */}
        <View className="items-center mb-10" style={{ maxWidth: 320 }}>
          <Text
            className="font-extrabold text-white text-center mb-4"
            style={{ fontFamily: 'Manrope_800ExtraBold', fontSize: 30, letterSpacing: -0.4 }}
          >
            Cultive o hábito
          </Text>
          <Text
            className="text-center"
            style={{ color: MUTED, fontFamily: 'Manrope_400Regular', fontSize: 16, lineHeight: 24 }}
          >
            Escolha o melhor horário para receber seu lembrete de revisão diária e manter sua evolução constante.
          </Text>
        </View>

        {/* Time well */}
        <Pressable
          onPress={abrirSeletor}
          className="w-full flex-row items-center justify-between rounded-2xl active:opacity-80"
          style={{
            backgroundColor: '#110c16',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.08)',
            padding: 20,
            marginBottom: mostrarPickerIOS ? 0 : 40,
          }}
        >
          <View className="flex-row items-center" style={{ gap: 12 }}>
            <SlidersHorizontal size={18} color={MUTED} />
            <Text style={{ color: MUTED, fontSize: 13, fontWeight: '500' }}>
              Horário Personalizado
            </Text>
          </View>

          <View className="flex-row items-center" style={{ gap: 8 }}>
            <Text
              className="font-bold"
              style={{ color: PRIMARY_LIGHT, fontSize: 26, fontFamily: 'Manrope_700Bold' }}
            >
              {formatarHorario(horario)}
            </Text>
            <Clock size={18} color={MUTED} />
          </View>
        </Pressable>

        {Platform.OS === 'ios' && mostrarPickerIOS && (
          <View style={{ marginBottom: 40 }}>
            <DateTimePicker
              value={horario}
              mode="time"
              is24Hour
              display="spinner"
              themeVariant="dark"
              onChange={handleChange}
              textColor="#ffffff"
            />
          </View>
        )}

        {/* Ações */}
        <View className="w-full items-center" style={{ maxWidth: 360, gap: 16 }}>
          <TouchableOpacity
            onPress={handleDefinirLembrete}
            disabled={isSaving}
            activeOpacity={0.85}
            className="w-full items-center rounded-full"
            style={{
              backgroundColor: PRIMARY,
              paddingVertical: 16,
              opacity: isSaving ? 0.7 : 1,
              shadowColor: PRIMARY,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.3,
              shadowRadius: 20,
              elevation: 8,
            }}
          >
            <Text
              className="font-bold"
              style={{ color: ON_PRIMARY_CONTAINER, fontSize: 15 }}
            >
              {isSaving ? 'Configurando...' : 'Definir Lembrete'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={irParaHome} disabled={isSaving} className="py-2 px-4">
            <Text style={{ color: MUTED, fontSize: 14, fontWeight: '500' }}>
              Pular por enquanto
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}
