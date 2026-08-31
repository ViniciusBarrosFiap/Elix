import { useState } from 'react'
import {
  Alert,
  View,
  Text,
  TouchableOpacity,
  Pressable,
  ScrollView,
  Modal,
  FlatList,
  StatusBar,
} from 'react-native'
import { Check, ChevronDown, ArrowRight, Sparkles, CalendarDays } from 'lucide-react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { UserService } from "@/src/services/user/user.service";

// Tokens do design system "The Cognitive Sanctuary" — mesmos já usados no
// resto do app (ver studyContents/[id]/index.tsx, ProfileScreen.tsx), pra
// essa tela deixar de ser a única com a paleta antiga do DESIGN.md.
const PRIMARY = "#8a2be2";
const PRIMARY_LIGHT = "#dcb8ff";
const ON_PRIMARY_CONTAINER = "#eed9ff";
const SURFACE_DIM = "#080510";
const SURFACE_CARD = "#120e1c";
const MUTED = "#a09ba8";

// ── Types
type Option = { label: string; value: string }

interface SelectPickerProps {
  placeholder: string
  options: Option[]
  value: string
  onChange: (value: string) => void
  icon: React.ReactNode
}

// ── Data
const COURSES: Option[] = [
  { label: 'Medicina', value: 'medicina' },
  { label: 'Direito', value: 'direito' },
  { label: 'Engenharia de Software', value: 'engenharia' },
  { label: 'Psicologia', value: 'psicologia' },
  { label: 'Design Estratégico', value: 'design' },
]

const SEMESTERS: Option[] = Array.from({ length: 12 }, (_, i) => ({
  label: `${i + 1}º Semestre`,
  value: String(i + 1),
}))


// ── SelectPicker
//
// Bottom sheet customizado (sem módulo nativo) — o Expo Go tem um conjunto
// fixo de módulos nativos compilados de fábrica, e @react-native-picker/picker
// não faz parte dele: travava a abertura do app inteiro no Android assim que
// esse componente era usado. Sem migrar todo mundo pra um dev build próprio,
// esse é o caminho que funciona igual em qualquer aparelho.
function SelectPicker({ placeholder, options, value, onChange, icon }: SelectPickerProps) {
  const [open, setOpen] = useState(false)
  const selected = options.find(o => o.value === value)

  return (
    <>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        activeOpacity={0.8}
        className="w-full flex-row items-center justify-between px-5 py-4 rounded-2xl"
        style={{ backgroundColor: SURFACE_CARD, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" }}
      >
        <View className="flex-row items-center flex-1 mr-2">
          <View className="mr-3">{icon}</View>
          <Text
            className="text-base flex-1"
            style={{ color: selected ? "#fff" : MUTED }}
            numberOfLines={1}
          >
            {selected ? selected.label : placeholder}
          </Text>
        </View>
        <ChevronDown size={20} color={MUTED} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity
          className="flex-1 bg-black/60 justify-end"
          activeOpacity={1}
          onPress={() => setOpen(false)}
        >
          <View className="rounded-t-[28px] overflow-hidden" style={{ backgroundColor: SURFACE_CARD }}>
            <View
              className="px-6 pt-5 pb-4"
              style={{ borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.08)" }}
            >
              <Text className="text-white text-base font-semibold">{placeholder}</Text>
            </View>

            <FlatList
              data={options}
              keyExtractor={item => item.value}
              style={{ maxHeight: 320 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => { onChange(item.value); setOpen(false) }}
                  activeOpacity={0.7}
                  className="flex-row items-center justify-between px-6 py-4"
                  style={{ borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.04)" }}
                >
                  <Text className="text-white text-base">{item.label}</Text>
                  {item.value === value && <Check size={18} color={PRIMARY_LIGHT} />}
                </TouchableOpacity>
              )}
            />

            <View style={{ height: 34 }} />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  )
}

// ── Screen
export default function OnboardingScreen() {
    const [course, setCourse] = useState('')
    const [semester, setSemester] = useState('')
    const router = useRouter();
    const podeAvancar = !!course && !!semester;

    async function handleNext() {
      try {
        await UserService.updateUser({
          curso: course,
          semestre: Number(semester)
        });
        router.replace("/addSubjects")
      } catch {
        Alert.alert("Erro", "Não foi possível salvar seus dados. Tente novamente.");
      }
    }

    return (
        <View className="flex-1" style={{ backgroundColor: SURFACE_DIM }}>
        <StatusBar barStyle="light-content" />

        {/* Glow ambiente roxo atrás do header — mesma ideia do resto do app
            (ver studyContents/[id]/index.tsx), em vez dos dois círculos
            flutuantes soltos que essa tela tinha antes. */}
        <LinearGradient
            colors={[`${PRIMARY}40`, "rgba(8,5,16,0)"]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={{ position: "absolute", top: 0, left: 0, right: 0, height: 320 }}
            pointerEvents="none"
        />

        <ScrollView
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
            className="px-8"
            showsVerticalScrollIndicator={false}
        >
            {/* ── Header ── */}
            <View className="items-center mb-12 mt-16">
            <View
                className="w-16 h-16 rounded-full items-center justify-center mb-6"
                style={{
                  backgroundColor: "rgba(18,14,28,0.5)",
                  borderWidth: 1,
                  borderColor: `${PRIMARY}4D`,
                  shadowColor: PRIMARY,
                  shadowOpacity: 0.3,
                  shadowRadius: 18,
                  shadowOffset: { width: 0, height: 0 },
                }}
            >
                <Sparkles size={26} color={PRIMARY_LIGHT} />
            </View>

            <Text className="text-white text-4xl font-extrabold text-center leading-tight tracking-tighter mb-4">
                Vamos te conhecer
            </Text>
            <Text
                className="text-lg text-center leading-relaxed"
                style={{ color: MUTED, maxWidth: 280 }}
            >
                Personalize sua jornada no Elix selecionando sua base de estudos.
            </Text>
            </View>

            {/* ── Form ── */}
            <View className="w-full gap-y-8">
            {/* Course */}
            <View className="gap-y-3">
                <Text
                  className="text-xs font-bold uppercase tracking-widest ml-1"
                  style={{ color: PRIMARY_LIGHT, opacity: 0.75 }}
                >
                Curso
                </Text>
                <SelectPicker
                placeholder="Selecione seu curso"
                options={COURSES}
                value={course}
                onChange={setCourse}
                icon={<Sparkles size={18} color={MUTED} />}
                />
            </View>

            {/* Semester */}
            <View className="gap-y-3">
                <Text
                  className="text-xs font-bold uppercase tracking-widest ml-1"
                  style={{ color: PRIMARY_LIGHT, opacity: 0.75 }}
                >
                Semestre Atual
                </Text>
                <SelectPicker
                placeholder="Em qual semestre você está?"
                options={SEMESTERS}
                value={semester}
                onChange={setSemester}
                icon={<CalendarDays size={18} color={MUTED} />}
                />
            </View>

            {/* CTA — mesmo botão-pílula com gradiente usado no resto do app
                (ver "Revisar disciplina" em studyContents/[id]/index.tsx) */}
            <View className="pt-6">
                <Pressable
                  disabled={!podeAvancar}
                  onPress={handleNext}
                  className="active:opacity-90"
                >
                  <LinearGradient
                    colors={podeAvancar ? [PRIMARY, "#5b3285"] : ["#231d28", "#231d28"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      borderRadius: 999,
                      shadowColor: PRIMARY,
                      shadowOpacity: podeAvancar ? 0.4 : 0,
                      shadowRadius: 24,
                      shadowOffset: { width: 0, height: 10 },
                    }}
                  >
                    <View className="flex-row items-center justify-center py-5 gap-x-3">
                      <Text
                          className="font-bold text-lg"
                          style={{ color: podeAvancar ? ON_PRIMARY_CONTAINER : MUTED }}
                      >
                          Próximo
                      </Text>
                 
                    </View>
                  </LinearGradient>
                </Pressable>
            </View>
            </View>
        </ScrollView>
        </View>
    )
}
