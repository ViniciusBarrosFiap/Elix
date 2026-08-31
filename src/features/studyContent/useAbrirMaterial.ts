import { useState } from "react";
import { Alert, Linking } from "react-native";
import { MaterialsRepository } from "@/src/services/materials/materials.repository";
import { SubTemaMaterial } from "@/src/types/studyContent";

/**
 * Abre o material original: link direto pro YouTube, ou uma URL assinada
 * (buscada na hora) pro documento enviado. Notion não tem link direto —
 * quem chama decide se mostra o botão (ver material.tipo !== "notion").
 */
export function useAbrirMaterial() {
  const [abrindoId, setAbrindoId] = useState<string | null>(null);

  const abrirMaterial = async (material: SubTemaMaterial) => {
    if (material.tipo === "youtube") {
      Linking.openURL(material.nome);
      return;
    }

    setAbrindoId(material.id);
    try {
      const { url } = await MaterialsRepository.getViewUrl(material.id);
      if (url) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Material indisponível", "Não foi possível encontrar o arquivo original desse material.");
      }
    } catch {
      Alert.alert("Erro", "Não foi possível abrir o material agora. Tente de novo em instantes.");
    } finally {
      setAbrindoId(null);
    }
  };

  return { abrirMaterial, abrindoId };
}
