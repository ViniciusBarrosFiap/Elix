import { Feather } from '@expo/vector-icons';
import { CheckCircle2, Zap } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import '@/global.css'
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useWindowDimensions,
    Animated, 
    Button,
    Pressable
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { QuizQuestionsService } from '@/src/services/quiz/quiz.service';
import { useQuizQuestionsStore } from '@/src/store/quizQuestionsStore';
import { LinearGradient } from 'expo-linear-gradient';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { BlurView } from 'expo-blur';
import ElixirFlaskRN, { ElixirFlaskHandle } from '@/src/components/ElixirFlaskRN';

// ─── Design Tokens 
const C = {
  surface:                '#16111b',
  surfaceContainerLow:    '#1f1924',
  surfaceContainer:       '#231d28',
  surfaceContainerHigh:   '#2e2832',
  primaryContainer:       '#8a2be2',
  onPrimaryContainer:     '#eed9ff',
  primary:                '#dcb8ff',
  onSurface:              '#eadfee',
  onSurfaceVariant:       '#cfc2d7',
  outlineVariant:         '#4c4354',
  secondaryContainer:     '#5d3587',
  onSecondaryContainer:   '#d2a6ff',
  correct:                '#00c896',
};

// Espelha calcularElixir() do backend (server/src/services/quiz/submitAnswer.ts)
// pra dar feedback local imediato sem depender da resposta da rede — o
// registro que vale de verdade continua sendo o do servidor.
const ELIXIR_POR_NIVEL: Record<1 | 2 | 3, number> = { 1: 30, 2: 50, 3: 100 };
const ELIXIR_ERRO = 10;

function calcularElixir(nivel: 1 | 2 | 3, acertou: boolean): number {
  return acertou ? ELIXIR_POR_NIVEL[nivel] : ELIXIR_ERRO;
}

// Quantos segundos o aluno é obrigado a ficar na justificativa depois de
// errar, antes de poder fechar (swipe ou toque fora) — só se aplica quando
// o Bottom Sheet abre sozinho por causa do erro, não quando ele abre por
// vontade própria (botão "?").
const COOLDOWN_JUSTIFICATIVA_SEGUNDOS = 8;

export default function QuizScreen() {
  const { macroTemaId } = useLocalSearchParams<{ macroTemaId?: string }>();

  useEffect(() => {
    QuizQuestionsService.initialize(macroTemaId);
  }, [macroTemaId]);

   const bottomSheetModalRef = useRef<BottomSheetModal>(null);
    // 2. Define as alturas que o Bottom Sheet pode assumir (ex: 25% e 50% da tela)
    const snapPoints = useMemo(() => ["60%"], ["80%"]);

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
        style={[props.style, { borderRadius: 24, overflow: 'hidden' }]}
        tint="default"
        intensity={95} // Ajuste a força do vidro
      />
    ),
    []
  );

   
  
  const quizData = useQuizQuestionsStore((state) => state.data);

  const quizQuestions = quizData?.questoes ?? [];
  const amountOfQuestions = quizQuestions.length;

  // Frasco de elixir do header: enche em direção ao máximo possível na
  // sessão (soma do elixir de acerto de cada pergunta, por nível) — só bate
  // 100% se o aluno acertar tudo.
  const flaskRef = useRef<ElixirFlaskHandle>(null);
  const elixirMaximoSessao = useMemo(
    () => quizQuestions.reduce((soma, q) => soma + ELIXIR_POR_NIVEL[q.nivel], 0),
    [quizQuestions]
  );

  const { width } = useWindowDimensions();
  const router = useRouter();

  const [selected, setSelected] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [acertos, setAcertos] = useState(0);
  const [erros, setErros] = useState(0);
  const [elixirTotal, setElixirTotal] = useState(0);

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

  const progress = amountOfQuestions > 0
    ? currentQuestionIndex / amountOfQuestions
    : 0;
  const progressWidth = (width + 40 + 48 + 12) * progress;

  function handleSelect(id: string) {
    if (confirmed) return;
    setSelected(id);
  }

  function goToQuestion(index: number) {
    setCurrentQuestionIndex(index);
    setSelected(null);
    setConfirmed(false);
  }

  function handleNext() {
    if (!confirmed) {
      setConfirmed(true);

      const acertou = selected === currentQuestion.id_gabarito;
      const ganho = calcularElixir(currentQuestion.nivel, acertou);
      setElixirTotal((prev) => prev + ganho);
      flaskRef.current?.gain(ganho, `+${ganho} XP`);

      if (acertou) {
        setAcertos((prev) => prev + 1);
      } else {
        setErros((prev) => prev + 1);
        // Se a resposta selecionada for diferente do gabarito (resposta errada),
        // abre o Bottom Sheet automaticamente e trava o fechamento por alguns
        // segundos — sem isso, dava pra bater o dedo e sair sem ler nada.
        bottomSheetModalRef.current?.present();
        iniciarCooldownJustificativa();
      }

      // Atualiza o progresso real do conceito no backend (nível, próxima
      // revisão, elixir). Não bloqueia a UI — o feedback já é local/imediato;
      // se a chamada falhar, só o progresso persistido fica desatualizado.
      if (selected) {
        QuizQuestionsService.submitAnswer(currentQuestion.id, selected).catch((err) => {
          console.error("Falha ao registrar resposta:", err);
        });
      }
      return;
    }

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
    if (id === selected && selected !== currentQuestion.id_gabarito) return [styles.optionText, { color: '#ff6b6b' }];
    return styles.optionText;
  }

  if(!currentQuestion) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']} className="flex-1 justify-center items-center px-8">
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
            colors={['#8a2be2', '#5d3587']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: 96,
              height: 96,
              borderRadius: 48,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#8a2be2',
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
            colors={['#8a2be2', '#5d3587']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              borderRadius: 999,
              shadowColor: '#8a2be2',
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

      

      <View className="flex-row items-center px-6 pt-4 pb-3 gap-3">

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
        <View
          className="flex-1 rounded-full overflow-hidden"
          style={{ height: 10, backgroundColor: C.surfaceContainerHigh }}
        >
          <View
            className="h-full rounded-full"
            style={{
              width: progressWidth,
              backgroundColor: C.primaryContainer,
            }}
          />
        </View>
        {/* <Text
          style={{
            fontFamily: 'Manrope_600SemiBold',
            fontSize: 12,
            color: C.onSurfaceVariant,
            flexShrink: 0,
          }}
        >
          {currentQuestionIndex + 1}/{quizQuestions.length}
        </Text> */}

        {/* Frasco de elixir da sessão — enche a cada resposta (acerto sobe
            mais que erro), com gotas + "+XP" flutuando no momento do ganho. */}
        <ElixirFlaskRN ref={flaskRef} totalUnits={elixirMaximoSessao} size={36} />
      </View>

      <View style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
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
                <Feather name="alert-circle" size={10} color="#f0a030" />
                <Text style={styles.reforcoChipText}>REFORÇO</Text>
              </View>
            )}
          </View>

          <Text style={styles.question}>{currentQuestion.titulo}</Text>
          {currentQuestion.ja_errou && (
            <Text style={styles.hint}>{currentQuestion.dica}</Text>
          )}

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
                    <View style={[styles.radioOuter, { borderColor: '#ff6b6b', backgroundColor: '#ff6b6b' }]}>
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
        </ScrollView>
      </View>

      <View style={[styles.footer, { flexDirection: 'row', gap: 12 }]}>
        <TouchableOpacity
          style={[
            styles.nextButton,
            { flex: 1 },
            !selected && !confirmed && styles.nextButtonDisabled
          ]}
          activeOpacity={0.85}
          disabled={!selected && !confirmed}
          onPress={handleNext}
        >
          <Text style={styles.nextButtonText}>
            {!selected && !confirmed
              ? 'Selecione uma opção'
              : !confirmed
                ? 'Confirmar'
                : isLastQuestion
                  ? 'Finalizar'
                  : 'Próxima →'}
          </Text>
        </TouchableOpacity>
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

     <BottomSheetModal
  ref={bottomSheetModalRef}
  index={0} // abre no primeiro ponto
  snapPoints={snapPoints}
  enablePanDownToClose={!cooldownAtivo} // trava o swipe-to-close durante o cooldown
  backgroundComponent={renderBackground}
  backdropComponent={renderBackdrop}
  handleIndicatorStyle={{ backgroundColor: '#a855f7', width: 40, opacity: cooldownAtivo ? 0.3 : 1 }}
>
  <BottomSheetView style={{ flex: 1, paddingHorizontal: 24, paddingTop: 8, paddingBottom: 24 }}>
    {/* Cabeçalho com ícone + título */}
    <View className="flex-row items-center justify-between mb-4">
      <View className="flex-row items-center">
        <View className="w-8 h-8 rounded-full bg-[#a855f7]/20 justify-center items-center mr-3">
          <Text className="text-base">💡</Text>
        </View>
        <Text
          style={{ fontFamily: 'Manrope_700Bold' }}
          className="text-lg text-[#a855f7]"
        >
          Justificativa
        </Text>
      </View>

      {cooldownAtivo && (
        <View
          className="flex-row items-center rounded-full px-3 py-1.5"
          style={{ backgroundColor: 'rgba(240,160,48,0.14)', borderWidth: 1, borderColor: 'rgba(240,160,48,0.35)', gap: 5 }}
        >
          <Feather name="clock" size={11} color="#f0a030" />
          <Text style={{ fontFamily: 'Manrope_700Bold', fontSize: 11, color: '#f0a030' }}>
            {cooldownRestante}s
          </Text>
        </View>
      )}
    </View>

    {/* Resposta correta em destaque */}
    <View className="flex-row items-center bg-[#a855f7]/10 border border-[#a855f7]/30 rounded-xl px-4 py-3 mb-4">
      <Text className="text-base mr-2">✅</Text>
      <Text
        style={{ fontFamily: 'Manrope_500Medium', lineHeight: 20 }}
        className="text-white/90 text-sm flex-1"
      >
        <Text style={{ fontFamily: 'Manrope_700Bold' }} className="text-[#a855f7]">
          Resposta correta:{' '}
        </Text>
        {currentQuestion.opcoes.find(o => o.id === currentQuestion.id_gabarito)?.rotulo}
      </Text>
    </View>

    {/* Divisor sutil */}
    <View className="h-[1px] bg-white/10 mb-4" />

    {/* Texto da justificativa */}
    <Text
      style={{ fontFamily: 'Manrope_500Medium', lineHeight: 22 }}
      className="text-white/90 text-base text-left"
    >
      {currentQuestion.justificativa}
    </Text>
  </BottomSheetView>
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
    color: '#f0a030',
  },
  question: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 26,
    lineHeight: 34,
    color: C.onSurface,
    marginBottom: 20,
    letterSpacing: -0.4,
  },
  hint: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 14,
    lineHeight: 22,
    color: C.onSurfaceVariant,
    marginBottom: 32,
  },
  optionsList: {
    gap: 10,
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
    borderColor: '#ff6b6b',
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
    backgroundColor: C.surface, 
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
  nextButtonDisabled: {
    opacity: 0.45,
  },
  nextButtonText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 17,
    color: C.onPrimaryContainer,
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