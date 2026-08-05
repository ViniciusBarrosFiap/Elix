import { Entypo, Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef } from "react";
import { Image, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";
import { Sparkles } from 'lucide-react-native';
import { useQuizQuestionsStore } from "@/src/store/quizQuestionsStore";

const DoseCard = ({ onPress }: { onPress: () => void }) => {
  const quizData = useQuizQuestionsStore((state) => state.data);

  const { width } = useWindowDimensions();

  const titleSize = width * 0.065;
  const subtitleSize = width * 0.035;
  const iconBoxSize = width * 0.13;
  const cardPadding = width * 0.055;

  return (
    <View
      className="rounded-3xl overflow-hidden"
      style={{
        marginHorizontal: width * 0.03,
        borderWidth: 1,
        borderColor: "rgba(139,92,246,0.35)",
      }}
    >
      <LinearGradient
        colors={["#000000", "#160522", "#120325"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ padding: cardPadding }}
      >
        <Image
          source={require('@/assets/images/complete.png')} 
          style={{
            position: "absolute", // Tira do fluxo e flutua sobre o fundo
            right: -width * 0.1,  // Move um pouco para fora da borda direita
            bottom: 0, 
            top: 0,           // Alinha na base do card
            width: width * 0.6,   // Define um tamanho grande para o fundo
            height: '100%',
            opacity: 0.4,         // Deixa semi-transparente para não atrapalhar o texto
          }}
          resizeMode="contain" 
        />

        {/* Top row */}
        <View className="flex-row items-start justify-between" style={{ marginBottom: 16 }}>

          <View className="flex-1" style={{ paddingRight: 12 }}>
            {/* Icon badge */}
            <View
              className="items-center justify-center"
              style={{
                width: iconBoxSize,
                height: iconBoxSize,
                borderRadius: iconBoxSize * 0.28,
                marginBottom: 12,
                backgroundColor: "#0B031B",
                borderWidth: 1,
                borderColor: "#48356b",
              }}
            >
              {/* <Text style={{ fontSize: iconBoxSize * 0.45 }}>✨</Text> */}
              <View>
                <Sparkles 
                  color="#a855f7"
                  size={25} 
                />
              </View>
            </View>

            {/* Title */}
            <Text
              className="font-bold text-white"
              style={{ fontSize: titleSize, lineHeight: titleSize * 1.25, marginBottom: 6 }}
            >
              Sua dose de hoje{"\n"}está pronta!
            </Text>

            {/* Subtitle */}
            <Text className="text-white/50" style={{ fontSize: subtitleSize }}>
              Baseada no que{" "}
              <Text style={{ color: "#7c3aed" }}>você estudou</Text>
            </Text>
          </View>
        </View>

        {/* Divider info */}
        <View className="flex-row items-center" style={{ marginBottom: cardPadding }}>
          <Feather name="clock" size={subtitleSize * 1.1} color="rgba(255,255,255,0.4)" />
          <Text className="text-white/40" style={{ fontSize: subtitleSize, marginLeft: 6 }}>
            {useQuizQuestionsStore((state) => state.data?.questoes.length || 0)} perguntas
            <Text className="text-white/25">{"  |  "}Revisão rápida</Text>
          </Text>
        </View>

        {/* CTA Button */}
        <TouchableOpacity
          onPress={onPress}
          activeOpacity={0.85}
          className="w-full flex-row items-center justify-center gap-x-3 py-4 rounded-full bg-[#672cc7] shadow-[#8a2be2] shadow-offset-[0px_10px] shadow-radius-30 elevation-10"
        >
          {/* <LinearGradient
            colors={["#6d28d9", "#5b21b6"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingVertical: cardPadding * 0.85,
              paddingHorizontal: cardPadding,
            }}
          > */}
            <Text className="text-[#eed9ff] font-bold text-lg">
              Começar revisão
            </Text>
        </TouchableOpacity>
          {/* </LinearGradient> */}
      </LinearGradient>
    </View>
  );
};

export default DoseCard;