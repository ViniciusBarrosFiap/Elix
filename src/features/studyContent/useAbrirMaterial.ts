import { useState } from "react";
import { Alert, Linking } from "react-native";
import { MaterialsRepository } from "@/src/services/materials/materials.repository";
import { SubTemaMaterial } from "@/src/types/studyContent";

/**
 * Abre o material original: link do YouTube, ou uma URL assinada (buscada na
 * hora) pro documento enviado — sempre resolvido pelo backend, já que
 * `material.nome` agora é o título de exibição, não a URL (ver
 * getMaterialViewUrl em materials.service.ts). Notion não tem link direto —
 * quem chama decide se mostra o botão (ver material.tipo !== "notion").
 */
export function useAbrirMaterial() {
  const [abrindoId, setAbrindoId] = useState<string | null>(null);

  const abrirMaterial = async (material: SubTemaMaterial) => {
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
