import { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  View,
} from 'react-native'
import { Mail, Lock, UserPlus } from 'lucide-react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import { AuthService } from '@/src/services/auth/auth.service'
import { colors, semantic, surfaceDim } from '@/src/theme/colors'

const PRIMARY = colors.primaryContainer
const PRIMARY_LIGHT = colors.primary
const ON_PRIMARY_CONTAINER = colors.onPrimaryContainer
const SURFACE_DIM = surfaceDim.base
const SURFACE_CARD = surfaceDim.subtema
const MUTED = semantic.muted

type FieldProps = {
  icon: React.ReactNode
  value: string
  onChangeText: (value: string) => void
  placeholder: string
  secureTextEntry?: boolean
  keyboardType?: 'default' | 'email-address'
}

function Field({ icon, value, onChangeText, placeholder, secureTextEntry, keyboardType }: FieldProps) {
  return (
    <View
      className="w-full flex-row items-center px-5 py-4 rounded-2xl"
      style={{ backgroundColor: SURFACE_CARD, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}
    >
      <View className="mr-3">{icon}</View>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={MUTED}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType ?? 'default'}
        autoCapitalize="none"
        autoCorrect={false}
        className="flex-1 text-base"
        style={{ color: '#fff' }}
      />
    </View>
  )
}

function emailValido(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function RegisterScreen() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [loading, setLoading] = useState(false)

  const podeCriar = !!email.trim() && senha.length >= 6 && senha === confirmarSenha;

  async function handleRegister() {
    if (!emailValido(email.trim())) {
      Alert.alert('E-mail inválido', 'Digite um e-mail válido para continuar.');
      return;
    }
    if (senha.length < 6) {
      Alert.alert('Senha muito curta', 'A senha precisa ter pelo menos 6 caracteres.');
      return;
    }
    if (senha !== confirmarSenha) {
      Alert.alert('Senhas diferentes', 'A confirmação precisa ser igual à senha.');
      return;
    }

    setLoading(true);
    try {
      await AuthService.signUp(email.trim(), senha);
      // Continua o onboarding já existente (curso/semestre -> disciplinas -> lembrete).
      router.replace('/(auth)/signUp');
    } catch (error) {
      const mensagem = error instanceof Error ? error.message : 'Não foi possível criar sua conta agora.';
      Alert.alert('Erro ao criar conta', mensagem);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View className="flex-1" style={{ backgroundColor: SURFACE_DIM }}>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={[`${PRIMARY}40`, 'rgba(8,5,16,0)']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 320 }}
        pointerEvents="none"
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
          className="px-8"
          showsVerticalScrollIndicator={false}
        >
          <View className="items-center mb-12 mt-16">
            <View
              className="w-16 h-16 rounded-full items-center justify-center mb-6"
              style={{
                backgroundColor: 'rgba(18,14,28,0.5)',
                borderWidth: 1,
                borderColor: `${PRIMARY}4D`,
                shadowColor: PRIMARY,
                shadowOpacity: 0.3,
                shadowRadius: 18,
                shadowOffset: { width: 0, height: 0 },
              }}
            >
              <UserPlus size={26} color={PRIMARY_LIGHT} />
            </View>

            <Text className="text-white text-4xl font-extrabold text-center leading-tight tracking-tighter mb-4">
              Crie sua conta
            </Text>
            <Text className="text-lg text-center leading-relaxed" style={{ color: MUTED, maxWidth: 280 }}>
              Seu progresso fica salvo e disponível em qualquer aparelho.
            </Text>
          </View>

          <View className="w-full gap-y-4">
            <Field
              icon={<Mail size={18} color={MUTED} />}
              value={email}
              onChangeText={setEmail}
              placeholder="E-mail"
              keyboardType="email-address"
            />
            <Field
              icon={<Lock size={18} color={MUTED} />}
              value={senha}
              onChangeText={setSenha}
              placeholder="Senha (mín. 6 caracteres)"
              secureTextEntry
            />
            <Field
              icon={<Lock size={18} color={MUTED} />}
              value={confirmarSenha}
              onChangeText={setConfirmarSenha}
              placeholder="Confirmar senha"
              secureTextEntry
            />

            <View className="pt-6">
              <Pressable disabled={!podeCriar || loading} onPress={handleRegister} className="active:opacity-90">
                <LinearGradient
                  colors={podeCriar ? [PRIMARY, '#5b3285'] : [colors.surfaceContainer, colors.surfaceContainer]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    borderRadius: 999,
                    shadowColor: PRIMARY,
                    shadowOpacity: podeCriar ? 0.4 : 0,
                    shadowRadius: 24,
                    shadowOffset: { width: 0, height: 10 },
                  }}
                >
                  <View className="flex-row items-center justify-center py-5 gap-x-3">
                    {loading ? (
                      <ActivityIndicator color={ON_PRIMARY_CONTAINER} />
                    ) : (
                      <Text className="font-bold text-lg" style={{ color: podeCriar ? ON_PRIMARY_CONTAINER : MUTED }}>
                        Criar conta
                      </Text>
                    )}
                  </View>
                </LinearGradient>
              </Pressable>
            </View>

            <Pressable className="items-center pt-4 active:opacity-70" onPress={() => router.replace('/(auth)/login')}>
              <Text style={{ color: MUTED }}>
                Já tem conta? <Text style={{ color: PRIMARY_LIGHT, fontWeight: '600' }}>Entrar</Text>
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}
