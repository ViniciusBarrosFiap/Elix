import React, { useState } from 'react';
import { View, Text, Pressable, StatusBar, TextInput, TouchableOpacity, Button } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Plus, X, Info, Sparkles } from 'lucide-react-native';
import { router } from 'expo-router';
import { UserService } from '@/src/services/user/user.service';

type Discipline = {
  id: string;
  name: string;
};

// const INITIAL_DISCIPLINES: Discipline[] = [
//     { id: '1', name: 'Disciplina' },
//     { id: '2', name: 'Disciplina' },
//     { id: '3', name: 'Disciplina' },
// ];

export default function DisciplineSelectionScreen() {
    const [disciplines, setDisciplines] = useState<Discipline[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [newDiscipline, setNewDiscipline] = useState('');

    const handleRemove = (id: string) => {
        setDisciplines((prev) => prev.filter((d) => d.id !== id));
    };

    const handleAddConfirm = () => {
        const trimmed = newDiscipline.trim();
        if (trimmed.length > 0) {
            setDisciplines((prev) => [
                ...prev,
                { id: Date.now().toString(), name: trimmed },
            ]);
        }
        setNewDiscipline('');
        setIsAdding(false);
    };

    function handleFinishSetup() {
        UserService.updateUser({
            disciplinas: disciplines.map(d => d.name),
            primeiroAcesso: false,
        });
        router.replace({
            pathname: "/loadingScreen",
            params: {
                next: "/home",
                title: "Processando informações...",
            }
        })
    }

    return (
        <SafeAreaView className="flex-1 bg-[#000000]" edges={['top', 'bottom']}>
        <StatusBar barStyle="light-content" />

        {/* Ambient violet glow */}
        <View pointerEvents="none" className="absolute inset-0 opacity-40">
            <LinearGradient
            colors={['transparent', '#8a2be2', 'transparent']}
            start={{ x: 0.5, y: 1.4 }}
            end={{ x: 0.5, y: 0.4 }}
            style={{ flex: 1 }}
            />
        </View>

        <View className="flex-1 px-6">
            {/* Header */}
            <View className="items-center mt-12 mb-10 px-2">
            <Text
                className="font-bold text-[#ffffff] text-4xl text-center"
                style={{ lineHeight: 34, letterSpacing: -0.3 }}
            >
                Quais disciplinas você está cursando?
            </Text>
        
            </View>

            {/* Glass card */}
            <BlurView
            intensity={40}
            tint="dark"
            className="rounded-3xl overflow-hidden bg-[#1f1924]/40 border border-white/10 p-5"
            >
            <Text className="font-medium text-[#ffffff] text-[17px] mb-4">
                Suas disciplinas
            </Text>

            {/* Chips */}
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
            </View>

            {/* Add discipline */}
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
                <Text className="text-[#cfc2d7] text-[14px] ml-3">
                    Adicionar disciplina
                </Text>
                </Pressable>
            )}

            {/* Info text */}
            <View className="flex-row items-center">
                <Info size={16} color="#dcb8ff" />
                <Text className="text-[#cfc2d7] text-[12px] ml-2 flex-1">
                Você pode adicionar mais de uma disciplina.
                </Text>
            </View>
            </BlurView>
        </View>

        {/* Footer CTA */}
        <View className="px-6 pb-6 pt-4">
            <TouchableOpacity
            onPress={handleFinishSetup}
            disabled={disciplines.length === 0}
            style={{ opacity: disciplines.length === 0 ? 0.5 : 1 }}
            >
            <LinearGradient
                colors={['#8a2be2', '#5d3587']}
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

        {/* <Button onPress={()=> router.back()} title='Voltar'></Button> */}
        </SafeAreaView>
    );
}