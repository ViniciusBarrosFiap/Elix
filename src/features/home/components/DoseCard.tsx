import { Entypo, Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef } from "react";
import { Image, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";
import { CheckCircle2, Sparkles } from 'lucide-react-native';
import { useQuizQuestionsStore } from "@/src/store/quizQuestionsStore";

const DoseCard = ({ onPress }: { onPress: () => void }) => {
  const quizData = useQuizQuestionsStore((state) => state.data);
  const totalPerguntas = quizData?.questoes.length ?? 0;
  // "Concluída" só depois que a dose já foi buscada pelo menos uma vez (data
  // não é null) — sem essa checagem, o primeiro render do dia (antes do
  // fetch) também bateria em 0 perguntas e mostraria "tudo em dia" por engano
  // enquanto a dose de verdade ainda nem chegou.
  const concluida = quizData !== null && totalPerguntas === 0;

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
                {concluida ? (
                  <CheckCircle2 color="#a855f7" size={25} />
                ) : (
                  <Sparkles color="#a855f7" size={25} />
                )}
              </View>
            </View>

            {/* Title */}
            <Text
              className="font-bold text-white"
              style={{ fontSize: titleSize, lineHeight: titleSize * 1.25, marginBottom: 6 }}
            >
              {concluida ? "Revisão em dia" : "Revisão de Hoje"}
            </Text>

            {/* Subtitle */}
            <Text className="text-white/50" style={{ fontSize: subtitleSize }}>
              {concluida ? (
                <>Você já revisou tudo <Text style={{ color: "#7c3aed" }}>por hoje</Text></>
              ) : (
                <>Baseada no que <Text style={{ color: "#7c3aed" }}>você estudou</Text></>
              )}
            </Text>
          </View>
        </View>

        {/* Divider info — some inteiro quando concluída, já que "0 perguntas"
            só confundia (parecia que a dose ainda estava carregando/pendente). */}
        {!concluida && (
          <View className="flex-row items-center" style={{ marginBottom: cardPadding }}>
            <Feather name="clock" size={subtitleSize * 1.1} color="rgba(255,255,255,0.4)" />
            <Text className="text-white/40" style={{ fontSize: subtitleSize, marginLeft: 6 }}>
              {totalPerguntas} perguntas
              <Text className="text-white/25">{"  |  "}Revisão rápida</Text>
            </Text>
          </View>
        )}
        {concluida && <View style={{ marginBottom: cardPadding * 0.4 }} />}

        {/* CTA Button — continua levando pro quiz mesmo concluída: lá o
            aluno encontra a opção de revisar perguntas anteriores. Só o
            rótulo muda pra não prometer uma dose que não existe mais. */}
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
              {concluida ? "Praticar mesmo assim" : "Começar revisão"}
            </Text>
        </TouchableOpacity>
          {/* </LinearGradient> */}
      </LinearGradient>
    </View>
  );
};

export default DoseCard;