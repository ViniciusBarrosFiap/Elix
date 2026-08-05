import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
  ArrowLeft,
  Columns2,
  FileText,
  FlaskConical,
  Lock,
  RefreshCw,
  RotateCw,
} from 'lucide-react-native';
import React from 'react';
import {
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  View,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type FeatureItemProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  isLast?: boolean;
};

function FeatureItem({ icon, title, description, isLast }: FeatureItemProps) {
  return (
    <View
      className={`flex-row items-start px-5 py-4 ${!isLast ? 'mb-2' : ''}`}
    >
      {/* Icon well */}
      <View className="w-11 h-11 rounded-xl bg-[#2e2832] items-center justify-center mr-4">
        {icon}
      </View>
      <View className="flex-1">
        <Text className="font-semibold text-[#ffffff] text-[15px] mb-1">
          {title}
        </Text>
        <Text
          className="text-[#cfc2d7] text-[13px]"
          style={{ lineHeight: 19 }}
        >
          {description}
        </Text>
      </View>
    </View>
  );
}

export default function ConnectNotionScreen() {
  return (
    <SafeAreaView className="flex-1 bg-[#16111b]" edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" />

      {/* Ambient purple glow */}
      <View
        pointerEvents="none"
        className="absolute -top-24 left-0 right-0 h-72 opacity-30"
      >
        <LinearGradient
          colors={['#8a2be2', 'transparent']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={{ flex: 1 }}
        />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="px-5 pt-4">
          <Pressable onPress={()=>router.back()}
            className="w-10 h-10 rounded-full items-center justify-center active:bg-[#1f1924]"
            hitSlop={8}
          >
            <ArrowLeft size={22} color="#ffffff" />
          </Pressable>
        </View>

        {/* Hero: connection illustration */}
        <View className="flex-row items-center justify-center mt-6 mb-8">
          {/* Source app icon */}
          <View className="w-20 h-20 rounded-2xl bg-[#8a2be2] items-center justify-center">
            <FlaskConical size={32} color="#eed9ff" strokeWidth={1.75} />
          </View>

          {/* Connector dots + sync glyph */}
          <View className="flex-row items-center mx-3">
            <View className="w-1.5 h-1.5 rounded-full bg-[#4c4354] mr-1.5" />
            <View className="w-1.5 h-1.5 rounded-full bg-[#4c4354] mr-1.5" />
            <View className="w-9 h-9 rounded-full bg-[#2e2832] items-center justify-center">
              <RotateCw size={16} color="#dcb8ff" />
            </View>
            <View className="w-1.5 h-1.5 rounded-full bg-[#4c4354] ml-1.5 mr-1.5" />
            <View className="w-1.5 h-1.5 rounded-full bg-[#4c4354]" />
          </View>

          {/* Target app icon (Notion) */}
          <View className="w-30 h-30 rounded-2xl bg-[#ffffff] items-center justify-center">
               <Image 
                    source={require('@/assets/images/icon-notion.png')} 
                    resizeMode="contain"
                    className="w-20 h-20"
                />
          </View>
        </View>

        {/* Headline */}
        <View className="px-7 mb-3">
          <Text
            className="font-extrabold text-[#ffffff] text-[28px] text-center"
            style={{ lineHeight: 36, letterSpacing: -0.3 }}
          >
            Conecte seu{' '}
            <Text className="text-[#dcb8ff]">Notion</Text>
            {' '}e transforme seus estudos
          </Text>
        </View>

        {/* Supporting copy */}
        <View className="px-9 mb-7">
          <Text
            className="text-[#cfc2d7] text-[14px] text-center"
            style={{ lineHeight: 21 }}
          >
            Conecte seus materiais para o Elix transformar em revisões automaticamente.
          </Text>
        </View>

        {/* Feature card */}
        <View className="px-5">
          <View className="rounded-2xl bg-[#1f1924] py-2">
            <FeatureItem
              icon={<FileText size={20} color="#dcb8ff" />}
              title="Escolha o que acompanhar"
              description="Selecione quais páginas ou bancos do Notion o Elix deve acompanhar."
            />
            <FeatureItem
              icon={<Columns2 size={20} color="#dcb8ff" />}
              title="Pronto para revisar"
              description="Os novos tópicos entram na sua revisão diária ou ficam disponíveis na fila de revisão extra."
            />
            <FeatureItem
              icon={<RefreshCw size={20} color="#dcb8ff" />}
              title="Sincronização contínua"
              description="Novas páginas e atualizações são detectadas automaticamente."
              isLast
            />
          </View>
        </View>
      </ScrollView>

      {/* Footer: privacy note + primary CTA */}
      <View className="px-7 pb-3 pt-2">
        <View className="flex-row items-center justify-center mb-4">
          <Lock size={12} color="#dcb8ff" />
          <Text className="text-[#dcb8ff] text-[12px] text-center ml-1.5">
            Sua conexão é segura e privada.{'\n'}Não armazenamos suas senhas.
          </Text>
        </View>

        <Pressable className="active:opacity-90">
          <LinearGradient
            colors={['#8a2be2', '#5d3587']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ borderRadius: 999 }}
          >
            <View className="flex-row items-center justify-center py-4 rounded-full">
              
              <Text className="font-semibold text-[#ffffff] text-[15px]">
                Conectar 
              </Text>
            </View>
          </LinearGradient>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}