// Ponte entre o DoseCard (card "Revisão de Hoje" da Home) e o
// UploadStatusPill (card flutuante global): o pill precisa saber ONDE o card
// da revisão está na tela agora (pra fazer a bolinha voar até lá) e avisar
// quando ela chegar (pra tocar o splash). O DoseCard só se registra enquanto
// a Home está em foco — fora disso `getDoseTarget()` devolve null e o pill
// cai no fade simples, sem animação de voo.

export interface WindowRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DoseTarget {
  measure: () => Promise<WindowRect | null>;
  splash: () => void;
}

let atual: DoseTarget | null = null;

export function registrarDoseTarget(target: DoseTarget): () => void {
  atual = target;
  return () => {
    if (atual === target) atual = null;
  };
}

export function getDoseTarget(): DoseTarget | null {
  return atual;
}
