import React, { useState } from 'react';
import { Alert, View, Text, Pressable, StatusBar, TextInput, TouchableOpacity, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Plus, X, Info, Sparkles } from 'lucide-react-native';
import { router } from 'expo-router';
import { UserService } from '@/src/services/user/user.service';
import { StudyContentRepository } from '@/src/services/studyContent/studyContent.repository';
import { MacroTemasRepository } from '@/src/services/macroTemas/macroTemas.repository';
import { colors } from '@/src/theme/colors';

type Discipline = {
    id: string;
    name: string;
    emoji: string;
};

const CARD_SIZE = 92;

export default function DisciplineSelectionScreen() {
    const [disciplines, setDisciplines] = useState<Discipline[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalNome, setModalNome] = useState('');
    const [modalEmoji, setModalEmoji] = useState('');

    const handleRemove = (id: string) => {
        setDisciplines((prev) => prev.filter((d) => d.id !== id));
    };

    function fecharModal() {
        setIsModalOpen(false);
    }

    function confirmarNovaDisciplina() {
        const nome = modalNome.trim();
        const emoji = modalEmoji.trim();

        if (!nome) {
            Alert.alert('Nome obrigatório', 'Dê um nome pra disciplina antes de adicionar.');
            return;
        }
        if (!emoji) {
            Alert.alert('Emoji obrigatório', 'Escolha um emoji antes de adicionar.');
            return;
        }

        setDisciplines((prev) => [...prev, { id: Date.now().toString(), name: nome, emoji }]);
        setModalNome('');
        setModalEmoji('');
        setIsModalOpen(false);
    }

    async function handleFinishSetup() {
        try {
            await UserService.updateUser({
                disciplinas: disciplines.map(d => d.name),
                primeiroAcesso: false,
            });

            // updateUser só manda os NOMES — o macrotema nasce com o emoji
            // padrão do banco. Busca a lista recém-criada e aplica o emoji
            // escolhido em cada uma, casando pelo nome (o mesmo texto que
            // acabou de ser enviado, então o match é direto). Best-effort:
            // se uma falhar, as disciplinas já foram salvas mesmo assim.
            const macroTemas = await StudyContentRepository.listMacroTemas();
            await Promise.all(
                disciplines.map((d) => {
                    const criado = macroTemas.find(
                        (m) => m.nome.trim().toLowerCase() === d.name.trim().toLowerCase()
                    );
                    if (!criado || criado.emoji === d.emoji) return Promise.resolve();
                    return MacroTemasRepository.update(criado.id, { emoji: d.emoji }).catch(() => {});
                })
            );

            // Último passo do onboarding: escolher o horário do lembrete diário
            // (tela /reminder cuida da permissão de notificação e do agendamento).
            router.replace("/reminder");
        } catch {
            Alert.alert("Erro", "Não foi possível salvar suas disciplinas. Tente novamente.");
        }
    }

    return (
        <SafeAreaView className="flex-1 bg-surface" edges={['top', 'bottom']}>
        <StatusBar barStyle="light-content" />

        {/* Ambient violet glow */}
        <View pointerEvents="none" className="absolute inset-0 opacity-40">
            <LinearGradient
            colors={['transparent', colors.primaryContainer, 'transparent']}
            start={{ x: 0.5, y: 1.4 }}
            end={{ x: 0.5, y: 0.4 }}
            style={{ flex: 1 }}
            />
        </View>

        <View className="flex-1 px-6 justify-center">
            {/* Header */}
            <View className="items-center mb-10 px-2">
            <Text
                className="font-bold text-[#ffffff] text-4xl text-center"
                style={{ lineHeight: 34, letterSpacing: -0.3 }}
            >
                Quais disciplinas você está cursando?
            </Text>

            </View>

            {/* Glass card — transparente de propósito, sem preenchimento de
                cor: só a borda + o glow violeta ambiente por trás definem o
                contorno do card. */}
          
            <Text className="font-medium text-[#ffffff] text-[17px] mb-4">
                Suas disciplinas
            </Text>

            {/* Grade de cards quadrados: um por disciplina (emoji + nome) e um
                último card tracejado com "+" pra adicionar mais. */}
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

            {/* Info text */}
            <View className="flex-row items-center">
                <Info size={16} color={colors.primary} />
                <Text className="text-onSurfaceVariant text-[12px] ml-2 flex-1">
                Você pode adicionar mais de uma disciplina.
                </Text>
            </View>
            
        </View>

        {/* Footer CTA */}
        <View className="px-6 pb-6 pt-4">
            <TouchableOpacity
            onPress={handleFinishSetup}
            disabled={disciplines.length === 0}
            style={{ opacity: disciplines.length === 0 ? 0.5 : 1 }}
            >
            <LinearGradient
                colors={[colors.primaryContainer, colors.secondaryContainer]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ borderRadius: 999 }}
            >
                <View className="flex-row items-center justify-center py-4 rounded-full">
                <Sparkles size={20} color="#ffffff" />
                <Text className="font-semibold text-[#ffffff] text-[17px] ml-2">
                    Finalizar Setup
                </Text>
                </View>
            </LinearGradient>
            </TouchableOpacity>
        </View>

        {/* Modal nativo (react-native) pra nome + emoji da nova disciplina —
            mesmo padrão usado em "Todos os conteúdos" pra editar disciplina. */}
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
                                {/* Emoji — o teclado do próprio celular já tem seletor de
                                    emoji, então um TextInput comum dá acesso a qualquer
                                    emoji, sem precisar de uma paleta fixa dentro do app. */}
                                <View
                                    className="items-center justify-center rounded-2xl"
                                    style={{ width: 64, height: 64, backgroundColor: "#141019", borderWidth: 1, borderColor: "#8a2be244" }}
                                >
                                    <TextInput
                                        value={modalEmoji}
                                        onChangeText={setModalEmoji}
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
                                    Toque no quadrado do emoji e abra o teclado de emojis do seu celular.
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
