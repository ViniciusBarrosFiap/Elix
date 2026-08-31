import { Pressable, ScrollView, useWindowDimensions } from "react-native";
import { router } from "expo-router";
import LiquidFillCard from "./LiquidFillCard";
import { MacroTema, STATUS_LABEL } from "@/src/types/studyContent";

interface ContentCardsProps {
  macroTemas?: MacroTema[];
}

const CARD_GAP = 16;

const ContentCards = ({ macroTemas }: ContentCardsProps) => {
  const { width } = useWindowDimensions();

  // Largura/altura como % da tela (não valores fixos em px) — escala igual
  // em telas pequenas e grandes. 0.6x tinha ficado curto demais: a tag no
  // topo e o bloco ícone+título (centralizado no card inteiro) acabavam se
  // encostando. 0.95x ainda é mais raso que o quase-quadrado original, mas
  // sobra o respiro que falta pra tag e ícone não brigarem pelo mesmo espaço.
  const cardWidth = width * 0.42;
  const cardHeight = Math.max(140, cardWidth * 0.95);

  return macroTemas ? (
    <ScrollView
      horizontal // 1. Torna a rolagem horizontal
      showsHorizontalScrollIndicator={false} // Esconde a barra de rolagem
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingVertical: 20,
        gap: CARD_GAP,
      }}
      // (Opcional) Propriedades para um efeito de carrossel suave:
      decelerationRate="fast"
      snapToInterval={cardWidth + CARD_GAP}
      className="w-full h-full"
    >
        {macroTemas.map((macroTema) => (
          <Pressable
            key={macroTema.id}
            onPress={() => router.push(`/(tabs)/studyContents/${macroTema.id}`)}
          >
            <LiquidFillCard
              title={macroTema.nome}
              progress={macroTema.progresso}
              status={STATUS_LABEL[macroTema.status]}
              icon={macroTema.emoji}
              height={cardHeight}
              style={{ width: cardWidth }}
            />
          </Pressable>
        ))}
    </ScrollView>
  ) : null;
};

export default ContentCards;
