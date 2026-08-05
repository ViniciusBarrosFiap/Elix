import { BlurView } from 'expo-blur'
import { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  FlatList,
  StatusBar,
  Platform,
} from 'react-native'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { useRouter } from 'expo-router'
import { UserService } from "@/src/services/user/user.service";

// ── Types
type Option = { label: string; value: string }

interface SelectPickerProps {
  placeholder: string
  options: Option[]
  value: string
  onChange: (value: string) => void
  icon: string
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
function SelectPicker({ placeholder, options, value, onChange, icon }: SelectPickerProps) {
  const [open, setOpen] = useState(false)
  const selected = options.find(o => o.value === value)

  return (
    <>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        activeOpacity={0.8}
        className="w-full flex-row items-center justify-between bg-[#110c16] px-5 py-4 rounded-xl"
      >
        <Text className={selected ? 'text-[#eadfee] text-base' : 'text-[#988ca0] text-base'}>
          {selected ? selected.label : placeholder}
        </Text>
        <MaterialIcons name={icon as any} size={22} color="#988ca0" />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity
          className="flex-1 bg-black/60 justify-end"
          activeOpacity={1}
          onPress={() => setOpen(false)}
        >
          <View className="bg-[#231d28] rounded-t-3xl overflow-hidden">
            {/* Glass header */}
            <View className="px-6 pt-5 pb-4 border-b border-[#4c4354]/40">
              <Text className="text-[#eadfee] text-base font-semibold">{placeholder}</Text>
            </View>

            <FlatList
              data={options}
              keyExtractor={item => item.value}
              style={{ maxHeight: 320 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => { onChange(item.value); setOpen(false) }}
                  activeOpacity={0.7}
                  className="flex-row items-center justify-between px-6 py-4 border-b border-[#4c4354]/20"
                >
                  <Text className="text-[#eadfee] text-base">{item.label}</Text>
                  {item.value === value && (
                    <MaterialIcons name="check" size={18} color="#dcb8ff" />
                  )}
                </TouchableOpacity>
              )}
            />

            {/* Safe area spacer */}
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

    function handleNext() {
      UserService.updateUser({
        curso: course,
        semestre: Number(semester)
      });
      router.replace("/addSubjects")
    }

    return (
        <View className="flex-1 bg-[#16111b]">
        <StatusBar barStyle="light-content" />

        {/* Atmospheric background glows */}
        <View
            style={{
            position: 'absolute',
            top: '-10%',
            left: '-10%',
            width: '60%',
            aspectRatio: 1,
            borderRadius: 9999,
            backgroundColor: '#8a2be2',
            opacity: 0.07,
            }}
        />
        <View
            style={{
            position: 'absolute',
            bottom: '-10%',
            right: '-10%',
            width: '50%',
            aspectRatio: 1,
            borderRadius: 9999,
            backgroundColor: '#5d3587',
            opacity: 0.07,
            }}
        />

        <ScrollView
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
            className="px-8"
            showsVerticalScrollIndicator={false}
        >
            {/* ── Header ── */}
            <View className="items-center mb-12 mt-16">
            {/* Icon badge */}
            <View
                className="w-16 h-16 rounded-full bg-[#2e2832] items-center justify-center mb-6"
                style={{
                shadowColor: '#8a2be2',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.4,
                shadowRadius: 20,
                elevation: 8,
                }}
            >
                <MaterialIcons name="auto-awesome" size={28} color="#dcb8ff" />
            </View>

            <Text
                className="text-[#eadfee] text-4xl font-extrabold text-center leading-tight tracking-tighter mb-4"
                style={{ fontFamily: 'Manrope_800ExtraBold' }}
            >
                Vamos te conhecer
            </Text>
            <Text
                className="text-[#cfc2d7] text-lg text-center leading-relaxed max-w-[280px]"
                style={{ fontFamily: 'Manrope_400Regular' }}
            >
                Personalize sua jornada no Elix selecionando sua base de estudos.
            </Text>
            </View>

            {/* ── Form ── */}
            <View className="w-full gap-y-8">
            {/* Course */}
            <View className="gap-y-3">
                <Text className="text-xs font-semibold uppercase tracking-widest text-[#cfc2d7] ml-1">
                Curso
                </Text>
                <SelectPicker
                placeholder="Selecione seu curso"
                options={COURSES}
                value={course}
                onChange={setCourse}
                icon="expand-more"
                />
            </View>

            {/* Semester */}
            <View className="gap-y-3">
                <Text className="text-xs font-semibold uppercase tracking-widest text-[#cfc2d7] ml-1">
                Semestre Atual
                </Text>
                <SelectPicker
                placeholder="Em qual semestre você está?"
                options={SEMESTERS}
                value={semester}
                onChange={setSemester}
                icon="calendar-month"
                />
            </View>

            {/* CTA */}
            <View className="pt-6">
                <TouchableOpacity
                activeOpacity={0.85}
                disabled={!course || !semester}
                onPress={handleNext}
                className="w-full flex-row items-center justify-center gap-x-3 py-5 rounded-lg"
                style={{
                    backgroundColor: course && semester ? '#8a2be2' : '#39323d',
                    shadowColor: '#8a2be2',
                    shadowOffset: { width: 0, height: 10 },
                    shadowOpacity: course && semester ? 0.4 : 0,
                    shadowRadius: 30,
                    elevation: course && semester ? 10 : 0,
                }}
                >
                <Text
                    className="font-bold text-lg"
                    style={{ color: course && semester ? '#eed9ff' : '#988ca0' }}
                >
                    Próximo
                </Text>
                <MaterialIcons
                    name="arrow-forward"
                    size={20}
                    color={course && semester ? '#eed9ff' : '#988ca0'}
                />
                </TouchableOpacity>
            </View>
            </View>

            {/* ── Footer ── */}
            <View className="items-center mt-16 mb-8">
            <Text className="text-[#4c4354] text-[10px] font-medium tracking-[0.3em] uppercase">
                ELIX INTELLIGENCE SYSTEM © 2026
            </Text>
            </View>
        </ScrollView>
        </View>
    )
}