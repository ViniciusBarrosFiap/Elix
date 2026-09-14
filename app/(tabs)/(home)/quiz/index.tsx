import { Feather } from '@expo/vector-icons';
import { CheckCircle2, XCircle, Zap } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import '@/global.css'
import {
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Animated,
    Button,
    Pressable,
    PanResponder,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { QuizQuestionsService } from '@/src/services/quiz/quiz.service';
import { useQuizQuestionsStore } from '@/src/store/quizQuestionsStore';
import { useQuizSessionStore } from '@/src/store/quizSessionStore';
import { LinearGradient } from 'expo-linear-gradient';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { BlurView } from 'expo-blur';
import ElixirFlaskRN, { ElixirFlaskHandle } from '@/src/components/ElixirFlaskRN';
import Markdown from 'react-native-markdown-display';
import { colors, semantic } from '@/src/theme/colors';

// ─── Design Tokens — paleta compartilhada em src/theme/colors.ts.
const C = colors;

// Espelha calcularElixir() do backend (server/src/services/quiz/submitAnswer.ts)
// pra dar feedback local imediato sem depender da resposta da rede — o
// registro que vale de verdade continua sendo o do servidor.
const ELIXIR_POR_NIVEL: Record<1 | 2 | 3 | 4, number> = { 1: 30, 2: 50, 3: 100, 4: 150 };
const ELIXIR_ERRO = 10;

function calcularElixir(nivel: 1 | 2 | 3 | 4, acertou: boolean): number {
  return acertou ? ELIXIR_POR_NIVEL[nivel] : ELIXIR_ERRO;
}

// Quantos segundos o aluno é obrigado a ficar na justificativa depois de
// errar, antes de poder fechar (swipe ou toque fora) — só se aplica quando
// o Bottom Sheet abre sozinho por causa do erro, não quando ele abre por
// vontade própria (botão "?").
const COOLDOWN_JUSTIFICATIVA_SEGUNDOS = 8;

// ─── Slider de confiança ───
// Substitui o botão "Confirmar": o aluno arrasta (ou toca direto num ponto)
// pro nível de confiança que tem na resposta escolhida. Soltar o dedo NÃO
// confirma na hora — trava 1s (pra evitar que o próprio gesto de soltar seja
// lido como um toque de confirmação sem querer) e só depois disso um toque
// no slider envia a resposta.
const CONFIDENCE_COOLDOWN_MS = 250;
// Quanto o dedo precisa se mover (px) durante o cooldown pra contar como "o
// usuário voltou a arrastar" em vez de "só tocou pra confirmar".
const CONFIDENCE_DRAG_THRESHOLD = 4;

function nivelConfiancaLabel(nivel: number): string {
  if (nivel < 0.34) return 'Pouca confiança';
  if (nivel < 0.67) return 'Confiança média';
  return 'Muita confiança';
}

// Tons pastel (mesma faixa de luminosidade da paleta roxa do app, em vez das
// cores puras semáforo) pra combinar com o fundo escuro violeta em vez de
// destoar como um vermelho/amarelo/verde genérico de UI.
function nivelConfiancaCor(nivel: number): string {
  if (nivel < 0.34) return '#f28fa3'; // rosa-vermelho pastel
  if (nivel < 0.67) return '#f0c479'; // dourado pastel
  return '#7fe8c9'; // verde-menta pastel
}

// Seta em vaivém indicando a direção do arrasto — substitui o ícone estático
// "move", que não deixava claro que era pra deslizar (parecia só decoração).
function SwipeHintArrow() {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 550, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 550, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);

  return (
    <View style={{ flexDirection: 'row', gap: -2 }}>
      {[0, 1].map((i) => (
        <Animated.View
          key={i}
          style={{
            transform: [
              {
                translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [0, 6] }),
              },
            ],
            opacity: anim.interpolate({
              inputRange: [0, 1],
              outputRange: i === 0 ? [0.35, 1] : [1, 0.35],
            }),
          }}
        >
          <Feather name="chevron-right" size={13} color={C.onSurfaceVariant} />
        </Animated.View>
      ))}
    </View>
  );
}

function ConfidenceSlider({
  disabled,
  onSubmit,
  onReadyChange,
}: {
  disabled: boolean;
  onSubmit: (nivel: number) => void;
  onReadyChange?: (pronto: boolean) => void;
}) {
  const [nivel, setNivel] = useState(0.5);
  const [podeEnviar, setPodeEnviarState] = useState(false);
  const pan = useRef(new Animated.Value(0.5)).current;
  const nivelRef = useRef(0.5);
  const podeEnviarRef = useRef(false);
  const trackWidthRef = useRef(0);
  const trackPageXRef = useRef(0);
  const trackRef = useRef<View>(null);
  const cooldownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Refs "espelhando" as props mais recentes — o PanResponder é criado uma
  // única vez (useRef), então sem isso os handlers ficariam presos nos
  // valores de disabled/onSubmit do primeiro render.
  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;
  const onSubmitRef = useRef(onSubmit);
  onSubmitRef.current = onSubmit;
  const onReadyChangeRef = useRef(onReadyChange);
  onReadyChangeRef.current = onReadyChange;

  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
    };
  }, []);

  // Avisa o pai (que mostra a dica acima do slider) sempre que o "pronto pra
  // confirmar" muda — é o que troca "Deslize..." por "Clique para confirmar".
  const setPodeEnviar = (v: boolean) => {
    podeEnviarRef.current = v;
    setPodeEnviarState(v);
    onReadyChangeRef.current?.(v);
  };

  const iniciarCooldown = () => {
    if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
    setPodeEnviar(false);
    cooldownTimerRef.current = setTimeout(() => setPodeEnviar(true), CONFIDENCE_COOLDOWN_MS);
  };

  const atualizarNivel = (pageX: number) => {
    if (trackWidthRef.current <= 0) return;
    const clamped = Math.max(0, Math.min(1, (pageX - trackPageXRef.current) / trackWidthRef.current));
    nivelRef.current = clamped;
    pan.setValue(clamped);
    setNivel(clamped);
  };

  const medirTrack = () => {
    trackRef.current?.measure((_x, _y, width, _height, pageX) => {
      trackPageXRef.current = pageX;
      trackWidthRef.current = width;
    });
  };

  // Só vira "arraste de verdade" (e cancela o toque de confirmação) se o
  // dedo se mover mais que CONFIDENCE_DRAG_THRESHOLD durante o gesto atual.
  const arrastandoRef = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabledRef.current,
      onMoveShouldSetPanResponder: () => !disabledRef.current,
      onPanResponderGrant: (evt) => {
        arrastandoRef.current = false;
        medirTrack();
        // Enquanto ainda não passou o cooldown, o toque já reposiciona o
        // nível normalmente. Depois do cooldown, só reposiciona se o gesto
        // virar um arraste de verdade (ver onPanResponderMove) — um toque
        // parado deve confirmar, não pular o valor pro ponto tocado.
        if (!podeEnviarRef.current) {
          atualizarNivel(evt.nativeEvent.pageX);
        }
      },
      onPanResponderMove: (evt, gestureState) => {
        const moveu =
          Math.abs(gestureState.dx) > CONFIDENCE_DRAG_THRESHOLD ||
          Math.abs(gestureState.dy) > CONFIDENCE_DRAG_THRESHOLD;

        if (podeEnviarRef.current) {
          // Já estava pronto pra confirmar, mas o usuário voltou a
          // deslizar — cancela o modo "toque confirma" e passa a mexer no
          // nível normalmente, como se fosse um arraste novo.
          if (!moveu) return;
          arrastandoRef.current = true;
          if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
          setPodeEnviar(false);
        } else if (moveu) {
          arrastandoRef.current = true;
        }

        atualizarNivel(evt.nativeEvent.pageX);
      },
      onPanResponderRelease: () => {
        if (disabledRef.current) return;

        // Só confirma num toque parado (sem arrastar) depois que o cooldown
        // já passou. Qualquer arraste — novo ou retomado — reinicia o
        // cooldown em vez de enviar.
        if (podeEnviarRef.current && !arrastandoRef.current) {
          onSubmitRef.current(nivelRef.current);
          return;
        }
        iniciarCooldown();
      },
    })
  ).current;

  const cor = disabled ? C.outlineVariant : nivelConfiancaCor(nivel);

  const label = disabled
    ? 'Selecione uma opção'
    : podeEnviar
      ? `Confirmar`
      : nivelConfiancaLabel(nivel);

  return (
    <View
      ref={trackRef}
      onLayout={medirTrack}
      {...(disabled ? {} : panResponder.panHandlers)}
      style={[styles.confidenceTrack, disabled && styles.confidenceTrackDisabled]}
    >
      {!disabled && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.confidenceFill,
            {
              backgroundColor: cor,
              width: pan.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
            },
          ]}
        />
      )}

      <Text style={styles.confidenceLabel} pointerEvents="none" numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

export default function QuizScreen() {
  const { macroTemaId } = useLocalSearchParams<{ macroTemaId?: string }>();

  useEffect(() => {
    QuizQuestionsService.initialize(macroTemaId);
  }, [macroTemaId]);

   const bottomSheetModalRef = useRef<BottomSheetModal>(null);
    // Dois pontos de altura: abre num tamanho compacto e o aluno pode
    // arrastar pra cima até 90% se a justificativa for longa e não couber.
    const snapPoints = useMemo(() => ["55%", "90%"], []);

  // Cooldown que trava o fechamento da justificativa quando ela abre sozinha
  // por causa de um erro — força o aluno a de fato ler antes de seguir.
  const [cooldownAtivo, setCooldownAtivo] = useState(false);
  const [cooldownRestante, setCooldownRestante] = useState(0);
  const cooldownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function iniciarCooldownJustificativa() {
    if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);

    setCooldownAtivo(true);
    setCooldownRestante(COOLDOWN_JUSTIFICATIVA_SEGUNDOS);

    cooldownIntervalRef.current = setInterval(() => {
      setCooldownRestante((prev) => {
        if (prev <= 1) {
          if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
          cooldownIntervalRef.current = null;
          setCooldownAtivo(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  useEffect(() => {
    return () => {
      if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
    };
  }, []);

  const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop
        {...props}
        opacity={0.8}
        disappearsOnIndex={-1} // Fica invisível quando o modal fecha
        appearsOnIndex={0} // Aparece assim que o modal abre no primeiro snap point
        pressBehavior={cooldownAtivo ? "none" : "close"} // Trava o toque fora durante o cooldown
        />
      ),
      [cooldownAtivo],
    );
  
      const renderBackground = useCallback(
    (props: any) => (
      <BlurView
        // O props.style é injetado pela biblioteca para posicionar o fundo
        style={[props.style, { borderRadius: 24, overflow: 'hidden', backgroundColor: 'rgba(22,17,27,0.55)' }]}
        tint="dark" // fixo (não "default") pra não depender do tema do sistema — a tela do quiz é sempre escura
        intensity={40}
      />
    ),
    []
  );

   
  
  const quizData = useQuizQuestionsStore((state) => state.data);

  const quizQuestions = quizData?.questoes ?? [];
  const amountOfQuestions = quizQuestions.length;

  // Progresso acumulado do DIA inteiro (não só da lista atual) — ver
  // quizSessionStore.ts. Sem isso, sair pra Home e voltar remonta a tela
  // com uma lista menor (o backend já não devolve o que foi respondido
  // hoje) e acertos/erros/elixir/barra de progresso voltavam pra zero.
  const totalSessao = useQuizSessionStore((s) => s.totalSessao);
  const elixirMaximo = useQuizSessionStore((s) => s.elixirMaximo);
  const acertos = useQuizSessionStore((s) => s.acertos);
  const erros = useQuizSessionStore((s) => s.erros);
  const elixirTotal = useQuizSessionStore((s) => s.elixirTotal);
  const garantirSessao = useQuizSessionStore((s) => s.garantirSessao);
  const registrarResposta = useQuizSessionStore((s) => s.registrarResposta);

  useEffect(() => {
    if (!quizData) return;
    const elixirMaximoAtual = quizQuestions.reduce((soma, q) => soma + ELIXIR_POR_NIVEL[q.nivel], 0);
    garantirSessao(amountOfQuestions, elixirMaximoAtual);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizData]);

  // Frasco de elixir do header: enche em direção ao máximo possível no DIA
  // (capturado em garantirSessao), não só na lista atual — só bate 100% se
  // o aluno acertar tudo na dose inteira.
  const flaskRef = useRef<ElixirFlaskHandle>(null);

  // Barra de progresso + frasco somem ao rolar a pergunta, pra dar mais
  // espaço vertical pra ela — só o X de fechar continua sempre visível
  // (não pode perder o jeito de sair do quiz). useNativeDriver:false porque
  // anima `height` (não suportado pelo native driver), e o próprio onScroll
  // que alimenta scrollY precisa usar o mesmo driver.
  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<any>(null);
  // Altura real do header (medida via onLayout) — usada como paddingTop do
  // scroll pra o conteúdo não nascer escondido atrás do header flutuante.
  const [headerHeight, setHeaderHeight] = useState(0);
  // Altura de repouso precisa caber o frasco inteiro (ElixirFlaskRN com
  // size=36 mede ~71px) MAIS o padding vertical do header (pt-4/pb-3 = 28px,
  // agora dentro da própria Animated.View que colapsa) — não é a distância
  // de rolagem do fade, que é bem mais curta (COLAPSO_SCROLL_PX).
  const HEADER_EXTRA_HEIGHT = 100;
  const COLAPSO_SCROLL_PX = 40;
  const headerExtraStyle = {
    height: scrollY.interpolate({ inputRange: [0, COLAPSO_SCROLL_PX], outputRange: [HEADER_EXTRA_HEIGHT, 0], extrapolate: 'clamp' as const }),
    opacity: scrollY.interpolate({ inputRange: [0, COLAPSO_SCROLL_PX * 0.6], outputRange: [1, 0], extrapolate: 'clamp' as const }),
  };

  // "Recupera" o frasco no nível certo quando a tela remonta já com
  // progresso acumulado (ex: voltou da Home no meio da dose) — sem isso o
  // frasco sempre nasce vazio, mesmo com elixirTotal > 0 no store.
  useEffect(() => {
    if (elixirTotal > 0) {
      flaskRef.current?.setFill(elixirTotal);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const router = useRouter();

  const [selected, setSelected] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  // Setado junto com `confirmed`, nos dois fluxos (múltipla escolha e
  // dissertativa) — o bottom sheet de justificativa lê daqui em vez de
  // recalcular (pra dissertativa não dá pra comparar `selected` com
  // `id_gabarito`, já que nenhum dos dois existe nesse nível).
  const [acertou, setAcertou] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  // Espelha o "pronto pra confirmar" do ConfidenceSlider — só existe pra
  // trocar o texto da dica acima do slider (ver onReadyChange).
  const [prontoParaConfirmar, setProntoParaConfirmar] = useState(false);

  // ─── Nível 4 (dissertativa) — sem alternativas: o aluno escreve a resposta,
  // revela a resposta_modelo gerada pela IA e se autoavalia contra ela.
  const [respostaTexto, setRespostaTexto] = useState('');
  const [respostaModeloRevelada, setRespostaModeloRevelada] = useState(false);

  // ─── Animação do Líquido ───
  const liquidAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (confirmed) {
      Animated.timing(liquidAnim, {
        toValue: 1,
        duration: 500, // Velocidade do preenchimento
        useNativeDriver: false, 
      }).start();
    } else {
      liquidAnim.setValue(0); 
    }
  }, [confirmed, liquidAnim]);

  const currentQuestion = quizQuestions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === quizQuestions.length - 1;
  const isFirstQuestion = currentQuestionIndex === 0;
  // Nível 4 (dissertativa) não vem com alternativas — é o jeito mais simples
  // de diferenciar sem depender só do número do nível.
  const isDissertativa = !!currentQuestion && currentQuestion.opcoes.length === 0;

  // Fração de perguntas concluídas HOJE (acertos+erros da sessão do dia
  // inteiro / totalSessao capturado em garantirSessao) — não mais
  // currentQuestionIndex/amountOfQuestions, que reiniciava em 0% toda vez
  // que a tela remontava com uma lista menor (perguntas já respondidas
  // somem da lista que o backend devolve).
  const progress = totalSessao > 0
    ? (acertos + erros) / totalSessao
    : 0;

  function handleSelect(id: string) {
    if (confirmed) return;
    setSelected(id);
  }

  function goToQuestion(index: number) {
    setCurrentQuestionIndex(index);
    setSelected(null);
    setConfirmed(false);
    setAcertou(false);
    setProntoParaConfirmar(false);
    setRespostaTexto('');
    setRespostaModeloRevelada(false);
    // Sem isso, trocar de pergunta mantinha a posição de scroll da pergunta
    // anterior — a nova já nascia rolada (e o header, escondido) se o aluno
    // tivesse descido antes de responder.
    scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    scrollY.setValue(0);
  }

  // Registro local do nível de confiança de cada resposta (0 a 1) — ainda não
  // enviado ao backend (a API de resposta só aceita pergunta_id/resposta),
  // mas já fica capturado aqui pra um uso futuro sem precisar mexer no fluxo
  // do slider de novo.
  const confiancasRef = useRef<number[]>([]);

  function confirmarResposta(nivelConfianca: number) {
    if (confirmed || !selected) return;

    confiancasRef.current.push(nivelConfianca);
    setConfirmed(true);

    const acertouAgora = selected === currentQuestion.id_gabarito;
    setAcertou(acertouAgora);
    const ganho = calcularElixir(currentQuestion.nivel, acertouAgora);
    registrarResposta(acertouAgora, ganho);
    flaskRef.current?.gain(ganho, `+${ganho} XP`);

    if (!acertouAgora) {
      // Se a resposta selecionada for diferente do gabarito (resposta errada),
      // abre o Bottom Sheet automaticamente e trava o fechamento por alguns
      // segundos — sem isso, dava pra bater o dedo e sair sem ler nada.
      bottomSheetModalRef.current?.present();
      iniciarCooldownJustificativa();
    }

    // Atualiza o progresso real do conceito no backend (nível, próxima
    // revisão, elixir). Não bloqueia a UI — o feedback já é local/imediato;
    // se a chamada falhar, só o progresso persistido fica desatualizado.
    QuizQuestionsService.submitAnswer(currentQuestion.id, selected).catch((err) => {
      console.error("Falha ao registrar resposta:", err);
    });
  }

  // Nível 4 (dissertativa): sem gabarito A-D pra comparar — o próprio aluno
  // reporta se acertou depois de comparar sua resposta com a resposta_modelo
  // revelada (ver bloco de UI mais abaixo).
  function confirmarAutoavaliacao(acertouAgora: boolean) {
    if (confirmed) return;

    setConfirmed(true);
    setAcertou(acertouAgora);
    const ganho = calcularElixir(currentQuestion.nivel, acertouAgora);
    registrarResposta(acertouAgora, ganho);
    flaskRef.current?.gain(ganho, `+${ganho} XP`);

    if (!acertouAgora) {
      bottomSheetModalRef.current?.present();
      iniciarCooldownJustificativa();
    }

    QuizQuestionsService.submitAnswer(
      currentQuestion.id,
      undefined,
      acertouAgora ? 'acertou' : 'errou'
    ).catch((err) => {
      console.error("Falha ao registrar resposta:", err);
    });
  }

  function handleNext() {
    if (isLastQuestion) {
      router.push({
        pathname: '/(tabs)/quiz/result',
        params: {
          acertos: String(acertos),
          erros: String(erros),
          elixir: String(elixirTotal),
        },
      });
      return;
    }

    goToQuestion(currentQuestionIndex + 1);
  }

  function handleBack() {
    if (!isFirstQuestion) {
      goToQuestion(currentQuestionIndex - 1);
      return;
    }
    router.back();
  }

  function getOptionStyle(id: string) {
    if (!confirmed) return styles.optionDefault;
    if (id === currentQuestion.id_gabarito) return styles.optionCorrect;
    if (id === selected && selected !== currentQuestion.id_gabarito) return styles.optionWrong;
    return styles.optionDefault;
  }

  function getOptionTextStyle(id: string) {
    if (!confirmed) return styles.optionText;
    if (id === currentQuestion.id_gabarito) return [styles.optionText, { color: C.onPrimaryContainer, fontFamily: 'Manrope_700Bold' }];
    if (id === selected && selected !== currentQuestion.id_gabarito) return [styles.optionText, { color: semantic.danger }];
    return styles.optionText;
  }

  if(!currentQuestion) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']} className="flex-1 justify-center items-center px-8">
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        {/* Emblema de sucesso, com glow suave atrás */}
        <View
          style={{ alignItems: 'center', justifyContent: 'center', marginBottom: 32 }}
        >
          <View
            style={{
              position: 'absolute',
              width: 176,
              height: 176,
              borderRadius: 88,
              backgroundColor: C.primaryContainer,
              opacity: 0.18,
            }}
          />
          <LinearGradient
            colors={[colors.primaryContainer, colors.secondaryContainer]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: 96,
              height: 96,
              borderRadius: 48,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: colors.primaryContainer,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.5,
              shadowRadius: 20,
              elevation: 10,
            }}
          >
            <CheckCircle2 size={44} color="#ffffff" strokeWidth={2.2} />
          </LinearGradient>
        </View>

        <Text
          style={{
            fontFamily: 'Manrope_800ExtraBold',
            fontSize: 30,
            lineHeight: 38,
            marginTop:23,
            letterSpacing: -0.5,
          }}
          className="text-white text-center mb-3"
        >
          Revisão diária concluída
        </Text>

        <Text
          style={{ color: C.onSurfaceVariant, fontFamily: 'Manrope_500Medium', maxWidth: 280 }}
          className="text-base text-center leading-6 mb-10"
        >
          Você respondeu todas as perguntas de hoje
        </Text>

        <Pressable onPress={() => router.back()} className="active:opacity-90 w-full" style={{ maxWidth: 280 }}>
          <LinearGradient
            colors={[colors.primaryContainer, colors.secondaryContainer]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              borderRadius: 999,
              shadowColor: colors.primaryContainer,
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.4,
              shadowRadius: 16,
              elevation: 8,
            }}
          >
            <View className="flex-row items-center justify-center py-4 rounded-full">
              <Text className="font-semibold text-[#ffffff] text-[15px]">
                Voltar
              </Text>
            </View>
          </LinearGradient>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />



      {/* Área da pergunta ocupa a tela inteira (inclusive por trás do
          header) — o header vira uma camada flutuante por cima (ver
          abaixo), sem fundo próprio, em vez de uma faixa fixa que reserva
          seu próprio espaço e nunca mostra o que rola por trás dela. */}
      <View style={{ flex: 1 }}>
        <Animated.ScrollView
          ref={scrollViewRef}
          contentContainerStyle={[styles.scroll, { paddingTop: headerHeight + 24 }]}
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
          scrollEventThrottle={16}
        >
          <View style={styles.chipsRow}>
            <View style={[styles.chip, { marginBottom: 0 }]}>
              <Text style={styles.chipText}>{currentQuestion.disciplina.toUpperCase()}</Text>
            </View>

            <View style={styles.levelChip}>
              <Zap size={11} color={C.primaryContainer} fill={C.primaryContainer} />
              <Text style={styles.levelChipText}>NÍVEL {currentQuestion.nivel}</Text>
              
            </View>

            {currentQuestion.ja_errou && (
              <View style={styles.reforcoChip}>
                <Feather name="alert-circle" size={10} color={semantic.warning} />
                <Text style={styles.reforcoChipText}>REFORÇO</Text>
              </View>
            )}
          </View>

          <Text style={styles.question}>{currentQuestion.titulo}</Text>

          {isDissertativa ? (
            <View style={{ gap: 16 }}>
              <TextInput
                value={respostaTexto}
                onChangeText={setRespostaTexto}
                editable={!confirmed}
                multiline
                textAlignVertical="top"
                placeholder="Escreva sua resposta com suas próprias palavras..."
                placeholderTextColor={C.onSurfaceVariant}
                style={styles.dissertativaInput}
              />

              {respostaModeloRevelada && (
                <View style={styles.respostaModeloCard}>
                  <View className="flex-row items-center mb-2" style={{ gap: 7 }}>
                    <CheckCircle2 size={15} color={C.correct} />
                    <Text
                      style={{
                        fontFamily: 'Manrope_700Bold',
                        fontSize: 12,
                        letterSpacing: 0.4,
                        color: C.onSurfaceVariant,
                        textTransform: 'uppercase',
                      }}
                    >
                      Resposta modelo
                    </Text>
                  </View>
                  <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 15, lineHeight: 22, color: C.onSurface }}>
                    {currentQuestion.resposta_modelo}
                  </Text>
                </View>
              )}
            </View>
          ) : (
          <View style={styles.optionsList}>
            {currentQuestion.opcoes.map((opt) => {
              const isCorrectOpt = opt.id === currentQuestion.id_gabarito;

              return (
              <TouchableOpacity
                key={opt.id}
                onPress={() => handleSelect(opt.id)}
                activeOpacity={0.75}
                style={[styles.optionContainer, getOptionStyle(opt.id)]} 
              >
                {/* ── Efeito de Líquido Roxo (Agora com 100% exatos) ── */}
                {confirmed && isCorrectOpt && (
                  <Animated.View
                    style={{
                      position: 'absolute',
                      left: 0, 
                      top: 0,
                      bottom: 0,
                      backgroundColor: C.primaryContainer,
                      width: liquidAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'] // Sem padding atrapalhando, vai até o final
                      })
                    }}
                  />
                )}

                {/* ── Conteúdo da Alternativa (Textos e Ícones) ── */}
                {/* Isolamos o padding aqui para não limitar a animação */}
                <View style={styles.optionContent}>
                  <Text style={getOptionTextStyle(opt.id)}>{opt.rotulo}</Text>

                  {!confirmed && (
                    <View style={styles.radioOuter}>
                      {selected === opt.id && <View style={styles.radioInner} />}
                    </View>
                  )}
                  {confirmed && isCorrectOpt && (
                    <View style={[styles.radioOuter, { borderColor: C.correct, backgroundColor: C.correct }]}>
                      <Feather name="check" size={12} color="#fff" />
                    </View>
                  )}
                  {confirmed && opt.id === selected && !isCorrectOpt && (
                    <View style={[styles.radioOuter, { borderColor: semantic.danger, backgroundColor: semantic.danger }]}>
                      <Feather name="x" size={12} color="#fff" />
                    </View>
                  )}
                  {confirmed && !isCorrectOpt && opt.id !== selected && (
                    <View style={styles.radioOuter} />
                  )}
                </View>
              </TouchableOpacity>
            )})}
          </View>
          )}
        </Animated.ScrollView>

        {/* Header flutua por cima do scroll, sem fundo próprio — o
            conteúdo que passa por baixo (inclusive antes do 1º scroll,
            atrás da barra de progresso/frasco) fica visível através dele
            em vez de ficar escondido atrás de uma faixa reservada só pro
            header. pointerEvents="box-none" deixa o espaço vazio repassar
            o toque pro scroll por baixo; o X e o frasco continuam tocáveis. */}
        <View
          onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
          pointerEvents="box-none"
          style={{ position: 'absolute', top: 0, left: 0, right: 0 }}
        >
          {/* Some inteiro ao rolar a pergunta — X, barra e frasco juntos,
              não só barra/frasco. Sem escape sempre visível, mas o header
              volta assim que rola de volta pro topo. */}
          <Animated.View
            style={[
              { flexDirection: 'row', alignItems: 'center', gap: 12, overflow: 'hidden', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 12 },
              headerExtraStyle,
            ]}
          >
            <TouchableOpacity
              onPress={() => router.replace('/(tabs)/home')}
              activeOpacity={0.7}
              className="items-center justify-center"
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: C.surfaceContainerHigh,
                flexShrink: 0,
              }}
            >
              <Feather name="x" size={16} color={C.onSurfaceVariant} />
            </TouchableOpacity>

            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View
                className="flex-1 rounded-full overflow-hidden"
                style={{ height: 10, backgroundColor: C.surfaceContainerHigh }}
              >
                <View
                  className="h-full rounded-full"
                  style={{
                    width: `${progress * 100}%`,
                    backgroundColor: C.primaryContainer,
                  }}
                />
              </View>

              {/* Frasco de elixir do dia inteiro — enche a cada resposta
                  (acerto sobe mais que erro), com gotas + "+XP" flutuando no
                  momento do ganho. totalUnits vem do máximo capturado em
                  garantirSessao, não só da lista atual, pra continuar certo
                  mesmo depois de remontar. */}
              <ElixirFlaskRN ref={flaskRef} totalUnits={elixirMaximo} size={36} />
            </View>
          </Animated.View>
        </View>
      </View>

      {/* Estático (não flutua/não fica fixo sobre o scroll) — só o fundo
          continua transparente. */}
      <View style={styles.footer}>
        {!confirmed && selected && (
          <View style={styles.confidenceHint}>
            {prontoParaConfirmar ? (
              <Feather name="check-circle" size={13} color={C.onSurfaceVariant} />
            ) : (
              <SwipeHintArrow />
            )}
            <Text style={styles.confidenceHintText}>
              {prontoParaConfirmar
                ? 'Clique para confirmar'
                : 'Deslize para o lado para indicar confiança'}
            </Text>
          </View>
        )}
        <View style={{ flexDirection: 'row', gap: 12 }}>
        {!confirmed ? (
          isDissertativa ? (
            !respostaModeloRevelada ? (
              <TouchableOpacity
                style={[styles.nextButton, { flex: 1 }]}
                activeOpacity={0.85}
                onPress={() => setRespostaModeloRevelada(true)}
              >
                <Text style={styles.nextButtonText}>Ver resposta modelo</Text>
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity
                  style={[styles.autoavaliacaoButton, { flex: 1, borderColor: semantic.danger }]}
                  activeOpacity={0.85}
                  onPress={() => confirmarAutoavaliacao(false)}
                >
                  <XCircle size={18} color={semantic.danger} />
                  <Text style={[styles.autoavaliacaoButtonText, { color: semantic.danger }]}>Não acertei</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.autoavaliacaoButton, { flex: 1, backgroundColor: C.correct, borderColor: C.correct }]}
                  activeOpacity={0.85}
                  onPress={() => confirmarAutoavaliacao(true)}
                >
                  <CheckCircle2 size={18} color={C.surface} />
                  <Text style={[styles.autoavaliacaoButtonText, { color: C.surface }]}>Acertei</Text>
                </TouchableOpacity>
              </>
            )
          ) : (
          // Escondido até selecionar uma alternativa — antes aparecia
          // desabilitado (cinza, "Selecione uma opção"), mas ocupando espaço
          // e chamando atenção pra uma ação que ainda não faz sentido.
          selected && (
            <ConfidenceSlider
              key={currentQuestion.id}
              disabled={false}
              onSubmit={confirmarResposta}
              onReadyChange={setProntoParaConfirmar}
            />
          )
          )
        ) : (
          <TouchableOpacity
            style={[styles.nextButton, { flex: 1 }]}
            activeOpacity={0.85}
            onPress={handleNext}
          >
            <Text style={styles.nextButtonText}>
              {isLastQuestion ? 'Finalizar' : 'Próxima '}
            </Text>
          </TouchableOpacity>
        )}
        {confirmed && (
          <TouchableOpacity
            onPress={() => bottomSheetModalRef.current?.present()}
            activeOpacity={0.8}
            style={styles.helpButton}
            accessibilityLabel="Ver justificativa"
          >
            <Text style={styles.helpButtonText}>?</Text>
          </TouchableOpacity>
        )}
        </View>
      </View>

     <BottomSheetModal
  ref={bottomSheetModalRef}
  index={0} // abre no primeiro ponto
  snapPoints={snapPoints}
  enablePanDownToClose={!cooldownAtivo} // trava o swipe-to-close durante o cooldown
  backgroundComponent={renderBackground}
  backdropComponent={renderBackdrop}
  handleIndicatorStyle={{ backgroundColor: C.outlineVariant, width: 36, opacity: cooldownAtivo ? 0.3 : 1 }}
>
  <BottomSheetScrollView
    style={{ flex: 1 }}
    contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 4, paddingBottom: 32 }}
    showsVerticalScrollIndicator={false}
  >
    {/* Resposta correta em destaque — quando o aluno acertou, o texto da
        opção seria só repetir a própria resposta dele, então mostra apenas
        o rótulo "Resposta correta" maior, sem duplicar o conteúdo. Usa o
        estado `acertou` (setado junto com `confirmed`) em vez de comparar
        `selected`/`id_gabarito` direto — no nível 4 (dissertativa) nenhum
        dos dois existe, então essa comparação sempre bateria errado. */}
    {acertou ? (
      <View className="flex-row items-center mb-5" style={{ gap: 10 }}>
        <CheckCircle2 size={22} color={C.correct} />
        <Text
          style={{ fontFamily: 'Manrope_700Bold', fontSize: 20, color: C.onSurface }}
        >
          Resposta correta
        </Text>
      </View>
    ) : (
      <>
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center" style={{ gap: 10 }}>
            <XCircle size={22} color={semantic.danger} />
            <Text
              style={{ fontFamily: 'Manrope_700Bold', fontSize: 20, color: C.onSurface }}
            >
              Resposta incorreta
            </Text>
          </View>

          {cooldownAtivo && (
            <View
              className="flex-row items-center rounded-full px-2.5 py-1"
              style={{ backgroundColor: 'rgba(240,160,48,0.14)', gap: 4 }}
            >
              <Feather name="clock" size={10} color={semantic.warning} />
              <Text style={{ fontFamily: 'Manrope_700Bold', fontSize: 11, color: semantic.warning }}>
                {cooldownRestante}s
              </Text>
            </View>
          )}
        </View>

        <View
          className="rounded-xl px-4 py-4 mb-5"
          style={{ backgroundColor: C.surfaceContainerHigh, borderWidth: 1, borderColor: C.outlineVariant }}
        >
          <View className="flex-row items-center mb-2" style={{ gap: 7 }}>
            <CheckCircle2 size={15} color={C.correct} />
            <Text
              style={{
                fontFamily: 'Manrope_700Bold',
                fontSize: 12,
                letterSpacing: 0.4,
                color: C.onSurfaceVariant,
                textTransform: 'uppercase',
              }}
            >
              {isDissertativa ? 'Resposta modelo' : 'Resposta correta'}
            </Text>
          </View>
          <Text
            style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 16, lineHeight: 23, color: C.onSurface }}
          >
            {isDissertativa
              ? currentQuestion.resposta_modelo
              : currentQuestion.opcoes.find(o => o.id === currentQuestion.id_gabarito)?.rotulo}
          </Text>
        </View>
      </>
    )}

    {/* Texto da justificativa — vem em markdown da IA (ver buildPrompt.ts),
        por isso passa pelo parser em vez de um <Text> puro (senão
        "**negrito**"/"- item" apareceriam com os símbolos literais). */}
    <Markdown style={justificativaMarkdownStyles}>
      {currentQuestion.justificativa}
    </Markdown>
  </BottomSheetScrollView>
</BottomSheetModal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.surface,
  },
  progressBarWrapper: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: C.primaryContainer,
  },
  progressTrack: {
    height: 6,
    backgroundColor: C.surfaceContainerHigh,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: C.primaryContainer,
    borderRadius: 999,
  },
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  chip: {
    alignSelf: 'flex-start',
    backgroundColor: C.secondaryContainer,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 20,
  },
  chipText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 10,
    letterSpacing: 0.8,
    color: C.onSecondaryContainer,
  },
  chipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  levelChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    backgroundColor: 'rgba(138,43,226,0.14)',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(138,43,226,0.35)',
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  levelChipText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 10,
    letterSpacing: 0.8,
    color: C.primary,
  },
  reforcoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    backgroundColor: 'rgba(240,160,48,0.14)',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(240,160,48,0.35)',
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  reforcoChipText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 10,
    letterSpacing: 0.8,
    color: semantic.warning,
  },
  question: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 26,
    lineHeight: 34,
    color: C.onSurface,
    marginBottom: 20,
    letterSpacing: -0.4,
  },
  optionsList: {
    gap: 10,
  },
  dissertativaInput: {
    minHeight: 160,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: C.outlineVariant,
    backgroundColor: C.surfaceContainerHigh,
    padding: 16,
    fontFamily: 'Manrope_500Medium',
    fontSize: 15,
    lineHeight: 22,
    color: C.onSurface,
  },
  respostaModeloCard: {
    borderRadius: 16,
    padding: 16,
    backgroundColor: C.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: C.outlineVariant,
  },

  // ── ESTILOS ALTERADOS AQUI ──

  // Contêiner principal da opção sem padding
  optionContainer: {
    borderRadius: 16,
    overflow: 'hidden', // Segura o líquido dentro da borda
    position: 'relative', 
  },
  // O conteúdo de dentro assume os paddings que antes eram do pai
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
    zIndex: 1, // Garante que o texto fique sempre por cima
  },

  optionDefault: {
    backgroundColor: C.surfaceContainerHigh,
    borderWidth: 1.5,
    borderColor: 'transparent', // Mantido transparente para evitar que o layout dê um "pulo" quando selecionado
  },
  optionCorrect: {
    backgroundColor: C.surfaceContainerHigh,
    borderWidth: 1.5,
    borderColor: C.primaryContainer, 
  },
  optionWrong: {
    backgroundColor: C.surfaceContainerHigh,
    borderWidth: 1.5,
    borderColor: semantic.danger,
  },
  optionText: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 15,
    color: C.onSurface,
    flex: 1,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: C.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    paddingTop: 12,
  },
  confidenceHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 10,
  },
  confidenceHintText: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
    color: C.onSurfaceVariant,
  },
  nextButton: {
    height: 58,
    backgroundColor: C.primaryContainer,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: C.primaryContainer,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  nextButtonText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 17,
    color: C.onPrimaryContainer,
  },
  autoavaliacaoButton: {
    height: 58,
    borderRadius: 999,
    borderWidth: 1.5,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  autoavaliacaoButtonText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 15,
  },
  confidenceTrack: {
    flex: 1,
    height: 58,
    borderRadius: 999,
    backgroundColor: C.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  confidenceTrackDisabled: {
    opacity: 0.45,
  },
  confidenceFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    opacity: 0.28,
  },
  confidenceLabel: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 15,
    color: C.onSurface,
  },
  helpButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.surfaceContainerHigh,
    borderWidth: 1.5,
    borderColor: C.outlineVariant,
    flexShrink: 0,
  },
  helpButtonText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 20,
    color: C.primary,
  },
});

// Estilos do markdown da justificativa (bottom sheet) — mesma tipografia e
// paleta do resto da tela, em vez do visual padrão da lib.
const justificativaMarkdownStyles = {
  body: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 16,
    lineHeight: 23,
    color: C.onSurfaceVariant,
  },
  paragraph: {
    marginTop: 0,
    marginBottom: 12,
  },
  strong: {
    fontFamily: 'Manrope_700Bold',
    color: C.onSurface,
  },
  em: {
    fontStyle: 'italic' as const,
    color: C.onSurface,
  },
  bullet_list: {
    marginBottom: 12,
  },
  ordered_list: {
    marginBottom: 12,
  },
  list_item: {
    marginBottom: 6,
    flexDirection: 'row' as const,
  },
  bullet_list_icon: {
    color: C.primary,
    marginRight: 8,
  },
  ordered_list_icon: {
    color: C.primary,
    marginRight: 8,
    fontFamily: 'Manrope_700Bold',
  },
  code_inline: {
    backgroundColor: C.surfaceContainerHigh,
    color: C.onSurface,
    fontFamily: 'Manrope_500Medium',
    paddingHorizontal: 4,
    borderRadius: 4,
  },
};