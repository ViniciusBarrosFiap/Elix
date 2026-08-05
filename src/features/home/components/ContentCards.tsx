import { ScrollView } from "react-native";
import LiquidFillCard from "./LiquidFillCard";
import { MacroTema } from "@/src/types/studyContent";

interface ContentCardsProps {
  macroTemas?: MacroTema[];
}

const ContentCards = ({ macroTemas }: ContentCardsProps) => {
  return macroTemas ? (
    <ScrollView
      horizontal // 1. Torna a rolagem horizontal
      showsHorizontalScrollIndicator={false} // Esconde a barra de rolagem
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingVertical: 20,
        gap: 16, // Espaçamento entre os cards
      }}
      // (Opcional) Propriedades para um efeito de carrossel suave:
      decelerationRate="fast"
      snapToInterval={190+ 16} // Largura do card + gap
      className="w-full h-full"
    >
        {macroTemas.map((macroTema) => (
          <LiquidFillCard
            key={macroTema.id}
            title={macroTema.nome}
            progress={5}
            icon={macroTema.emoji}
            style={{ width: 190 }}
          />
        ))}
    </ScrollView>
  ) : null;
};

export default ContentCards;