import { useEffect, useRef, useState } from "react";
import { Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  LinearTransition,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { MacroTema, STATUS_LABEL } from "@/src/types/studyContent";

// Altura fixa do card + espaço entre eles — a matemática do arrastar (quantas
// "casas" o dedo já andou) depende de tudo ter exatamente essa altura, por
// isso numberOfLines={1} no nome/subtítulo do card (texto maior não pode
// crescer a altura e desalinhar a conta).
const CARD_HEIGHT = 80;
const GAP = 12;
const ROW_HEIGHT = CARD_HEIGHT + GAP;

function clamp(valor: number, min: number, max: number): number {
  "worklet";
  return Math.min(Math.max(valor, min), max);
}

interface DisciplinaRowProps {
  macroTema: MacroTema;
  index: number;
  isLast: boolean;
  isDragging: boolean;
  onPress: () => void;
  onDragStart: (id: string, index: number) => void;
  onDragMove: (targetIndex: number) => void;
  onDragEnd: () => void;
  totalItens: number;
}

// Um card da lista — a própria alça é o card inteiro: segurar (long press)
// inicia o arrasto, toque rápido navega pra disciplina. Só o card ATIVO
// recebe o translateY manual (segue o dedo 1:1); os demais são reposicionados
// automaticamente pelo `layout={LinearTransition}` quando a ordem muda.
function DisciplinaRow({
  macroTema,
  index,
  isLast,
  isDragging,
  onPress,
  onDragStart,
  onDragMove,
  onDragEnd,
  totalItens,
}: DisciplinaRowProps) {
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
      const bruto = dragStartIndex.value + Math.round(e.translationY / ROW_HEIGHT);
      const alvo = clamp(bruto, 0, totalItens - 1);
      dragY.value = e.translationY - (alvo - dragStartIndex.value) * ROW_HEIGHT;
      if (alvo !== lastTargetIndex.value) {
        lastTargetIndex.value = alvo;
        runOnJS(handleDragMove)(alvo);
      }
    })
    .onEnd(() => {
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
    transform: isDragging ? [{ translateY: dragY.value }, { scale: 1.03 }] : [{ translateY: 0 }, { scale: 1 }],
  }));

  return (
    <GestureDetector gesture={composed}>
      <Animated.View
        layout={isDragging ? undefined : LinearTransition.duration(220)}
        style={[
          estiloAnimado,
          {
            marginBottom: isLast ? 0 : GAP,
            zIndex: isDragging ? 10 : 0,
            elevation: isDragging ? 8 : 0,
          },
        ]}
        className="flex-row items-center rounded-2xl p-4 border border-white/10 bg-[#120e1c]"
      >
        <View
          className="w-12 h-12 rounded-xl bg-[#1a1528] items-center justify-center border border-[#8a2be2]/20 mr-4"
          style={{ height: CARD_HEIGHT - 32 }}
        >
          <Text className="text-2xl">{macroTema.emoji}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-white text-base font-semibold mb-1" numberOfLines={1}>
            {macroTema.nome}
          </Text>
          <Text className="text-[#a09ba8] text-sm" numberOfLines={1}>
            {STATUS_LABEL[macroTema.status]} · {macroTema.progresso}% · {macroTema.subtemas_ativos}{" "}
            {macroTema.subtemas_ativos === 1 ? "subtema" : "subtemas"}
          </Text>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

interface ReorderableMacroTemasProps {
  macrotemas: MacroTema[];
  onPressItem: (id: string) => void;
  onOrderChange: (orderedIds: string[]) => void;
}

// Lista de disciplinas com reordenação por arrastar: segure um card e
// arraste pra cima/baixo pra trocar sua posição — os outros cards deslizam
// pra abrir espaço sozinhos (Reanimated `layout`). A ordem final só é
// persistida no servidor quando o dedo solta o card (onOrderChange).
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
    <View>
      {order.map((id, index) => {
        const macroTema = porId.get(id);
        if (!macroTema) return null;
        return (
          <DisciplinaRow
            key={id}
            macroTema={macroTema}
            index={index}
            isLast={index === order.length - 1}
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
