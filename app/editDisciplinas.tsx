import React, { useEffect, useState } from 'react';
import { Alert, View, Text, Pressable, StatusBar, TextInput, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { ArrowLeft, Check, Info, Plus, X } from 'lucide-react-native';
import { router } from 'expo-router';
import { UserService } from '@/src/services/user/user.service';
import { StudyContentService } from '@/src/services/studyContent/studyContent.service';
import { useUserDataStore } from '@/src/store/userDataStore';

type Discipline = {
  id: string;
  name: string;
};

export default function EditDisciplinasScreen() {
  const userData = useUserDataStore((state) => state.data);
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newDiscipline, setNewDiscipline] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Pré-popula com as disciplinas atuais do usuário assim que a store carregar.
  useEffect(() => {
    if (userData?.disciplinas) {
      setDisciplines(userData.disciplinas.map((nome, index) => ({ id: `${index}-${nome}`, name: nome })));
    }
  }, [userData?.disciplinas]);

  const handleRemove = (id: string) => {
    setDisciplines((prev) => prev.filter((d) => d.id !== id));
  };

  const handleAddConfirm = () => {
    const trimmed = newDiscipline.trim();
    if (trimmed.length > 0 && !disciplines.some((d) => d.name.toLowerCase() === trimmed.toLowerCase())) {
      setDisciplines((prev) => [...prev, { id: Date.now().toString(), name: trimmed }]);
    }
    setNewDiscipline('');
    setIsAdding(false);
  };

  async function handleSave() {
    setIsSaving(true);
    try {
      await UserService.updateUser({ disciplinas: disciplines.map((d) => d.name) });
      // updateUser só atualiza a store de usuário — a lista de macrotemas (outra
      // store) precisa ser buscada de novo pra refletir o que acabou de mudar.
      await StudyContentService.initialize();
      router.back();
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar suas disciplinas. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-[#000000]" edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" />

      <View pointerEvents="none" className="absolute inset-0 opacity-40">
        <LinearGradient
          colors={['transparent', '#8a2be2', 'transparent']}
          start={{ x: 0.5, y: 1.4 }}
          end={{ x: 0.5, y: 0.4 }}
          style={{ flex: 1 }}
        />
      </View>

      <View className="px-6 pt-4 pb-2 flex-row items-center">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 -ml-1 items-center justify-center active:opacity-70"
          hitSlop={8}
        >
          <ArrowLeft size={24} color="#f8f8f8" />
        </Pressable>
        <Text className="text-white text-xl font-bold ml-2">Suas disciplinas</Text>
      </View>

      <View className="flex-1 px-6 mt-4">
        <BlurView
          intensity={40}
          tint="dark"
          className="rounded-3xl overflow-hidden bg-[#1f1924]/40 border border-white/10 p-5"
        >
          <Text className="font-medium text-[#ffffff] text-[17px] mb-4">Disciplinas ativas</Text>

          <View className="flex-row flex-wrap mb-5">
            {disciplines.map((discipline) => (
              <View key={discipline.id} className="mr-3 mb-3">
                <Pressable
                  onPress={() => handleRemove(discipline.id)}
                  className="px-4 py-3 rounded-xl bg-[#ffffff]/5 border-[0.3px] border-[#dcb8ff] active:bg-[#8a2be2]/10"
                >
                  <View className="flex-row items-center gap-x-2">
                    <X size={16} color="#dcb8ff" />
                    <Text className="font-semibold text-[#ffffff] text-[14px] mr-2.5">
                      {discipline.name}
                    </Text>
                  </View>
                </Pressable>
              </View>
            ))}
            {disciplines.length === 0 && (
              <Text className="text-[#a09ba8] text-sm">Nenhuma disciplina ativa.</Text>
            )}
          </View>

          {isAdding ? (
            <View className="flex-row items-center justify-center gap-x-2 mb-5">
              <View className="flex-1 flex-row items-center px-4 rounded-xl border border-dashed border-[#8a2be2]/50">
                <TextInput
                  value={newDiscipline}
                  onChangeText={setNewDiscipline}
                  placeholder="Nome da disciplina"
                  placeholderTextColor="#A0A0B0"
                  autoFocus
                  onBlur={handleAddConfirm}
                  className="flex-1 text-[#ffffff] text-[14px] py-3"
                />
              </View>
              <TouchableOpacity
                onPress={handleAddConfirm}
                className="w-12 h-12 items-center justify-center rounded-xl bg-[#8a2be2]/80"
              >
                <Text className="text-white text-2xl font-bold">+</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Pressable
              onPress={() => setIsAdding(true)}
              className="flex-row items-center px-5 py-3 rounded-xl border border-dashed border-[#8a2be2]/50 mb-5 active:bg-[#8a2be2]/5"
            >
              <Plus size={18} color="#dcb8ff" />
              <Text className="text-[#cfc2d7] text-[14px] ml-3">Adicionar disciplina</Text>
            </Pressable>
          )}

          <View className="flex-row items-center">
            <Info size={16} color="#dcb8ff" />
            <Text className="text-[#cfc2d7] text-[12px] ml-2 flex-1">
              Remover uma disciplina não apaga o conteúdo já gerado — ela só some da sua
              lista ativa. Digite o nome de novo pra recuperá-la, com tudo que já tinha.
            </Text>
          </View>
        </BlurView>
      </View>

      <View className="px-6 pb-6 pt-4">
        <TouchableOpacity onPress={handleSave} disabled={isSaving} style={{ opacity: isSaving ? 0.7 : 1 }}>
          <LinearGradient
            colors={['#8a2be2', '#5d3587']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ borderRadius: 999 }}
          >
            <View className="flex-row items-center justify-center py-4 rounded-full">
              <Check size={20} color="#ffffff" />
              <Text className="font-semibold text-[#ffffff] text-[17px] ml-2">
                {isSaving ? 'Salvando...' : 'Salvar alterações'}
              </Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
