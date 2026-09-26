import { useState } from 'react'
import {
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
import { ActivityIndicator } from 'react-native'
import { Mail, Lock, LogIn } from 'lucide-react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import { AuthService } from '@/src/services/auth/auth.service'
import { UserService } from '@/src/services/user/user.service'
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

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [loading, setLoading] = useState(false)

  const podeEntrar = !!email.trim() && !!senha;

  async function handleLogin() {
    setLoading(true);
    try {
      await AuthService.signIn(email.trim(), senha);
      const data = await UserService.initialize();

      if (data.primeiroAcesso) {
        // Conta existe mas nunca terminou o onboarding (curso/semestre/disciplinas) — retoma de onde parou.
        router.replace('/(auth)/signUp');
        return;
      }

      router.replace({
        pathname: '/loadingScreen',
        params: { next: '/home', title: 'Aguarde um momento...' },
      });
    } catch (error) {
      const mensagem = error instanceof Error ? error.message : 'Não foi possível entrar agora.';
      Alert.alert('Erro ao entrar', mensagem);
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
              <LogIn size={26} color={PRIMARY_LIGHT} />
            </View>

            <Text className="text-white text-4xl font-extrabold text-center leading-tight tracking-tighter mb-4">
              Bem-vindo de volta
            </Text>
            <Text className="text-lg text-center leading-relaxed" style={{ color: MUTED, maxWidth: 280 }}>
              Entre com seu e-mail e senha para continuar de onde parou.
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
              placeholder="Senha"
              secureTextEntry
            />

            <View className="pt-6">
              <Pressable disabled={!podeEntrar || loading} onPress={handleLogin} className="active:opacity-90">
                <LinearGradient
                  colors={podeEntrar ? [PRIMARY, '#5b3285'] : [colors.surfaceContainer, colors.surfaceContainer]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    borderRadius: 999,
                    shadowColor: PRIMARY,
                    shadowOpacity: podeEntrar ? 0.4 : 0,
                    shadowRadius: 24,
                    shadowOffset: { width: 0, height: 10 },
                  }}
                >
                  <View className="flex-row items-center justify-center py-5 gap-x-3">
                    {loading ? (
                      <ActivityIndicator color={ON_PRIMARY_CONTAINER} />
                    ) : (
                      <Text className="font-bold text-lg" style={{ color: podeEntrar ? ON_PRIMARY_CONTAINER : MUTED }}>
                        Entrar
                      </Text>
                    )}
                  </View>
                </LinearGradient>
              </Pressable>
            </View>

            <Pressable className="items-center pt-4 active:opacity-70" onPress={() => router.replace('/(auth)/register')}>
              <Text style={{ color: MUTED }}>
                Não tem conta? <Text style={{ color: PRIMARY_LIGHT, fontWeight: '600' }}>Criar conta</Text>
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}
