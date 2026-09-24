import { useEffect, useRef, useState } from "react";
import { Dimensions, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  LinearTransition,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import LiquidFillCard from "@/src/features/home/components/LiquidFillCard";
import { MacroTema, STATUS_LABEL } from "@/src/types/studyContent";

// Grade de 2 colunas com o mesmo card líquido da Home. Tamanho fixo por card:
// a matemática do arrastar (em qual "casa" da grade o dedo já está) depende de
// todas as células terem exatamente CARD_W x CARD_H.
const COLS = 2;
// Mesmo padding horizontal do ScrollView que envolve esta grade (ver
// app/(tabs)/(home)/studyContents/index.tsx).
const H_PADDING = 24;
const GAP = 16;
const SCREEN_W = Dimensions.get("window").width;
const CARD_W = Math.floor((SCREEN_W - H_PADDING * 2 - GAP) / COLS);
// Proporção igual à do carrossel da Home (ContentCards.tsx).
const CARD_H = Math.max(140, Math.round(CARD_W * 0.95));
const COL_W = CARD_W + GAP;
const ROW_H = CARD_H + GAP;

function clamp(valor: number, min: number, max: number): number {
  "worklet";
  return Math.min(Math.max(valor, min), max);
}

interface DisciplinaCardProps {
  macroTema: MacroTema;
  index: number;
  isDragging: boolean;
  onPress: () => void;
  onDragStart: (id: string, index: number) => void;
  onDragMove: (targetIndex: number) => void;
  onDragEnd: () => void;
  totalItens: number;
}

// Um card da grade — o próprio card é a alça: segurar (long press) inicia o
// arrasto, toque rápido navega pra disciplina. Só o card ATIVO recebe a
// translação manual (segue o dedo 1:1, nos dois eixos); os demais são
// reposicionados automaticamente pelo `layout={LinearTransition}` quando a
// ordem muda.
function DisciplinaCard({
  macroTema,
  index,
  isDragging,
  onPress,
  onDragStart,
  onDragMove,
  onDragEnd,
  totalItens,
}: DisciplinaCardProps) {
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);
  const dragStartIndex = useSharedValue(0);
  const lastTargetIndex = useSharedValue(0);

  const handleDragStart = () => {
    onDragStart(macroTema.id, index);
  };

  const handleDragMove = (targetIndex: number) => {
    onDragMove(targetIndex);
  };

  const pan = Gesture.Pan()
    .activateAfterLongPress(280)
    .onStart(() => {
      dragStartIndex.value = index;
      lastTargetIndex.value = index;
      runOnJS(handleDragStart)();
    })
    .onUpdate((e) => {
      const startCol = dragStartIndex.value % COLS;
      const startRow = Math.floor(dragStartIndex.value / COLS);
      const maxRow = Math.floor((totalItens - 1) / COLS);

      const col = clamp(startCol + Math.round(e.translationX / COL_W), 0, COLS - 1);
      const row = clamp(startRow + Math.round(e.translationY / ROW_H), 0, maxRow);
      const alvo = clamp(row * COLS + col, 0, totalItens - 1);

      // O card arrastado muda de "casa" quando a ordem muda (o layout
      // reposiciona ele), então desconta esse salto do deslocamento do dedo —
      // senão ele pularia pra longe do dedo a cada troca.
      dragX.value = e.translationX - ((alvo % COLS) - startCol) * COL_W;
      dragY.value = e.translationY - (Math.floor(alvo / COLS) - startRow) * ROW_H;

      if (alvo !== lastTargetIndex.value) {
        lastTargetIndex.value = alvo;
        runOnJS(handleDragMove)(alvo);
      }
    })
    .onEnd(() => {
      dragX.value = withTiming(0, { duration: 150 });
      dragY.value = withTiming(0, { duration: 150 });
      runOnJS(onDragEnd)();
    });

  const tap = Gesture.Tap()
    .maxDuration(250)
    .onEnd(() => {
      runOnJS(onPress)();
    });

  const composed = Gesture.Exclusive(pan, tap);

  const estiloAnimado = useAnimatedStyle(() => ({
    transform: isDragging
      ? [{ translateX: dragX.value }, { translateY: dragY.value }, { scale: 1.05 }]
      : [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }],
  }));

  return (
    <GestureDetector gesture={composed}>
      <Animated.View
        layout={isDragging ? undefined : LinearTransition.duration(220)}
        style={[
          estiloAnimado,
          {
            width: CARD_W,
            height: CARD_H,
            zIndex: isDragging ? 10 : 0,
            elevation: isDragging ? 8 : 0,
          },
        ]}
      >
        <LiquidFillCard
          title={macroTema.nome}
          progress={macroTema.progresso}
          status={STATUS_LABEL[macroTema.status]}
          icon={macroTema.emoji}
          height={CARD_H}
          style={{ width: CARD_W }}
        />
      </Animated.View>
    </GestureDetector>
  );
}

interface ReorderableMacroTemasProps {
  macrotemas: MacroTema[];
  onPressItem: (id: string) => void;
  onOrderChange: (orderedIds: string[]) => void;
}

// Grade de disciplinas com reordenação por arrastar: segure um card e arraste
// pra qualquer lado pra trocar sua posição — os outros cards deslizam pra abrir
// espaço sozinhos (Reanimated `layout`). A ordem final só é persistida no
// servidor quando o dedo solta o card (onOrderChange).
export function ReorderableMacroTemas({ macrotemas, onPressItem, onOrderChange }: ReorderableMacroTemasProps) {
  const [order, setOrder] = useState<string[]>(() => macrotemas.map((m) => m.id));
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const draggingIdRef = useRef<string | null>(null);

  // Ressincroniza quando a lista de disciplinas muda de verdade (nova
  // disciplina criada/removida em outra tela) — preserva a ordem já
  // conhecida pros ids que continuam existindo.
  useEffect(() => {
    setOrder((anterior) => {
      const idsAtuais = macrotemas.map((m) => m.id);
      const mantidos = anterior.filter((id) => idsAtuais.includes(id));
      const novos = idsAtuais.filter((id) => !mantidos.includes(id));
      return [...mantidos, ...novos];
    });
  }, [macrotemas]);

  const porId = new Map(macrotemas.map((m) => [m.id, m]));

  function handleDragStart(id: string, _index: number) {
    draggingIdRef.current = id;
    setDraggingId(id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  }

  function handleDragMove(targetIndex: number) {
    setOrder((atual) => {
      const id = draggingIdRef.current;
      if (!id) return atual;
      const de = atual.indexOf(id);
      if (de === -1 || de === targetIndex) return atual;
      const proximo = [...atual];
      const [movido] = proximo.splice(de, 1);
      proximo.splice(targetIndex, 0, movido);
      return proximo;
    });
  }

  function handleDragEnd() {
    draggingIdRef.current = null;
    setDraggingId(null);
    onOrderChange(order);
  }

  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: GAP }}>
      {order.map((id, index) => {
        const macroTema = porId.get(id);
        if (!macroTema) return null;
        return (
          <DisciplinaCard
            key={id}
            macroTema={macroTema}
            index={index}
            isDragging={draggingId === id}
            onPress={() => onPressItem(id)}
            onDragStart={handleDragStart}
            onDragMove={handleDragMove}
            onDragEnd={handleDragEnd}
            totalItens={order.length}
          />
        );
      })}
    </View>
  );
}
