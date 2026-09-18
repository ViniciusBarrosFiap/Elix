import { useState } from "react";
import { MaterialsRepository } from "@/src/services/materials/materials.repository";

/**
 * Lê (de novo, na hora) o conteúdo de um material que veio do Notion —
 * contraparte de useAbrirMaterial.ts pros materiais que não têm link direto
 * pra abrir (ver getMaterialNotionContent no backend).
 */
export function useLerConteudoNotion() {
  const [materialAberto, setMaterialAberto] = useState<{ id: string; nome: string } | null>(null);
  const [markdown, setMarkdown] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const lerConteudo = async (material: { id: string; nome: string }) => {
    setMaterialAberto(material);
    setMarkdown(null);
    setErro(null);
    setCarregando(true);
    try {
      const texto = await MaterialsRepository.getNotionContent(material.id);
      setMarkdown(texto);
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível ler esse material agora.");
    } finally {
      setCarregando(false);
    }
  };

  const fechar = () => setMaterialAberto(null);

  return { materialAberto, markdown, carregando, erro, lerConteudo, fechar };
}
