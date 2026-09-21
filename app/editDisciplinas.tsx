import React, { useEffect, useState } from 'react';
import { Alert, View, Text, Pressable, StatusBar, TextInput, TouchableOpacity, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { ArrowLeft, Check, Info, Plus, X } from 'lucide-react-native';
import { router } from 'expo-router';
import { UserService } from '@/src/services/user/user.service';
import { StudyContentService } from '@/src/services/studyContent/studyContent.service';
import { StudyContentRepository } from '@/src/services/studyContent/studyContent.repository';
import { MacroTemasRepository } from '@/src/services/macroTemas/macroTemas.repository';
import { useUserDataStore } from '@/src/store/userDataStore';
import { useStudyContentStore } from '@/src/store/studyContentStore';
import { colors } from '@/src/theme/colors';

type Discipline = {
  id: string;
  name: string;
  emoji: string;
};

const CARD_SIZE = 92;
const EMOJI_PADRAO = '📘';

export default function EditDisciplinasScreen() {
  const userData = useUserDataStore((state) => state.data);
  const studyContentData = useStudyContentStore((state) => state.data);
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalNome, setModalNome] = useState('');
  const [modalEmoji, setModalEmoji] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Pré-popula com as disciplinas atuais do usuário — o emoji de cada uma
  // vem do macrotema já criado (mesmo nome), casado aqui porque
  // users.disciplinas guarda só o nome, sem emoji.
  useEffect(() => {
    if (!userData?.disciplinas) return;
    const macrotemas = studyContentData?.macrotemas ?? [];
    setDisciplines(
      userData.disciplinas.map((nome, index) => {
        const encontrado = macrotemas.find((m) => m.nome.trim().toLowerCase() === nome.trim().toLowerCase());
        return { id: `${index}-${nome}`, name: nome, emoji: encontrado?.emoji ?? EMOJI_PADRAO };
      })
    );
  }, [userData?.disciplinas, studyContentData?.macrotemas]);

  const handleRemove = (id: string) => {
    setDisciplines((prev) => prev.filter((d) => d.id !== id));
  };

  function fecharModal() {
    setIsModalOpen(false);
  }

  function confirmarNovaDisciplina() {
    const nome = modalNome.trim();
    // Emoji é opcional — sem ele, cai no padrão (📘) em vez de travar o
    // aluno numa etapa que não devia ser obrigatória.
    const emoji = modalEmoji.trim() || EMOJI_PADRAO;

    if (!nome) {
      Alert.alert('Nome obrigatório', 'Dê um nome pra disciplina antes de adicionar.');
      return;
    }
    if (disciplines.some((d) => d.name.toLowerCase() === nome.toLowerCase())) {
      Alert.alert('Já existe', 'Você já tem uma disciplina com esse nome.');
      return;
    }

    setDisciplines((prev) => [...prev, { id: Date.now().toString(), name: nome, emoji }]);
    setModalNome('');
    setModalEmoji('');
    setIsModalOpen(false);
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      await UserService.updateUser({ disciplinas: disciplines.map((d) => d.name) });

      // updateUser só manda os NOMES — uma disciplina nova nasce com o emoji
      // padrão do banco. Busca a lista atualizada e aplica o emoji escolhido
      // em cada uma, casando pelo nome; pra quem já existia com o mesmo
      // emoji, o update() nem é chamado. Best-effort: se uma falhar, os
      // nomes já foram salvos mesmo assim.
      const macroTemas = await StudyContentRepository.listMacroTemas();
      await Promise.all(
        disciplines.map((d) => {
          const atual = macroTemas.find(
            (m) => m.nome.trim().toLowerCase() === d.name.trim().toLowerCase()
          );
          if (!atual || atual.emoji === d.emoji) return Promise.resolve();
          return MacroTemasRepository.update(atual.id, { emoji: d.emoji }).catch(() => {});
        })
      );

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
    <SafeAreaView className="flex-1 bg-surface" edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" />

      <View pointerEvents="none" className="absolute inset-0 opacity-40">
        <LinearGradient
          colors={['transparent', colors.primaryContainer, 'transparent']}
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
          className="rounded-3xl overflow-hidden bg-surfaceContainerLow/40 border border-white/10 p-5"
        >
          <Text className="font-medium text-[#ffffff] text-[17px] mb-4">Disciplinas ativas</Text>

          {/* Grade de cards quadrados: um por disciplina (emoji + nome) e um
              último card tracejado com "+" pra adicionar mais — mesmo padrão
              da tela de onboarding. */}
          <View className="flex-row flex-wrap mb-5" style={{ gap: 12 }}>
            {disciplines.map((discipline) => (
              <View
                key={discipline.id}
                style={{ width: CARD_SIZE, height: CARD_SIZE }}
                className="rounded-2xl bg-white/5 border border-primaryContainer/40 items-center justify-center p-2"
              >
                <Pressable
                  onPress={() => handleRemove(discipline.id)}
                  hitSlop={6}
                  className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/50 items-center justify-center z-10"
                >
                  <X size={11} color={colors.primary} />
                </Pressable>
                <Text className="text-3xl mb-1">{discipline.emoji}</Text>
                <Text className="text-white text-[11px] font-semibold text-center" numberOfLines={2}>
                  {discipline.name}
                </Text>
              </View>
            ))}

            <Pressable
              onPress={() => setIsModalOpen(true)}
              style={{ width: CARD_SIZE, height: CARD_SIZE }}
              className="rounded-2xl border border-dashed border-primaryContainer/50 items-center justify-center active:bg-primaryContainer/5"
            >
              <Plus size={26} color={colors.primary} />
            </Pressable>
          </View>

          <View className="flex-row items-center">
            <Info size={16} color={colors.primary} />
            <Text className="text-onSurfaceVariant text-[12px] ml-2 flex-1">
              Remover uma disciplina não apaga o conteúdo já gerado — ela só some da sua
              lista ativa. Adicione ela de novo pra recuperá-la, com tudo que já tinha.
            </Text>
          </View>
        </BlurView>
      </View>

      <View className="px-6 pb-6 pt-4">
        <TouchableOpacity onPress={handleSave} disabled={isSaving} style={{ opacity: isSaving ? 0.7 : 1 }}>
          <LinearGradient
            colors={[colors.primaryContainer, colors.secondaryContainer]}
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

      {/* Modal nativo (react-native) pra nome + emoji da nova disciplina —
          mesmo padrão usado no onboarding e em "Todos os conteúdos". */}
      <Modal visible={isModalOpen} transparent animationType="fade" onRequestClose={fecharModal}>
        <Pressable className="flex-1 bg-black/60 justify-end" onPress={fecharModal}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
            <Pressable
              className="rounded-t-3xl overflow-hidden"
              style={{ backgroundColor: colors.surfaceContainerLow }}
              onPress={(e) => e.stopPropagation()}
            >
              <View className="px-6 pt-5 pb-4 border-b border-white/10">
                <Text className="text-white text-base font-semibold">Nova disciplina</Text>
              </View>

              <View className="px-6 py-5">
                <View className="flex-row items-center" style={{ gap: 12, marginBottom: 20 }}>
                  <View
                    className="items-center justify-center rounded-2xl"
                    style={{ width: 64, height: 64, backgroundColor: "#141019", borderWidth: 1, borderColor: "#8a2be244" }}
                  >
                    <TextInput
                      value={modalEmoji}
                      onChangeText={setModalEmoji}
                      placeholder={EMOJI_PADRAO}
                      maxLength={4}
                      textAlign="center"
                      style={{ fontSize: 28, width: "100%", color: "#fff" }}
                    />
                  </View>

                  <View className="flex-1">
                    <Text className="text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: colors.primary, opacity: 0.75 }}>
                      Nome
                    </Text>
                    <TextInput
                      value={modalNome}
                      onChangeText={setModalNome}
                      placeholder="Nome da disciplina"
                      placeholderTextColor="#A0A0B0"
                      autoFocus
                      className="text-white text-base"
                      style={{
                        backgroundColor: "#141019",
                        borderWidth: 1,
                        borderColor: "#8a2be244",
                        borderRadius: 14,
                        paddingHorizontal: 14,
                        paddingVertical: 12,
                      }}
                    />
                  </View>
                </View>

                <View className="flex-row items-center mb-5" style={{ gap: 6 }}>
                  <Info size={13} color={colors.primary} />
                  <Text className="text-[11px] flex-1" style={{ color: colors.onSurfaceVariant }}>
                    Toque no quadrado do emoji e abra o teclado de emojis do seu celular. Opcional — sem escolher um, usamos {EMOJI_PADRAO} como padrão.
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={confirmarNovaDisciplina}
                  activeOpacity={0.85}
                  className="w-full items-center justify-center rounded-full py-4"
                  style={{ backgroundColor: colors.primaryContainer }}
                >
                  <Text className="text-white font-bold text-base">Adicionar</Text>
                </TouchableOpacity>
              </View>
              <View style={{ height: 20 }} />
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
