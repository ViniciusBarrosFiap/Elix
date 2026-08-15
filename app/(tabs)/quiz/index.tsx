import { Feather } from '@expo/vector-icons';
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

export default function QuizScreen() {
  const { macroTemaId } = useLocalSearchParams<{ macroTemaId?: string }>();

  useEffect(() => {
    QuizQuestionsService.initialize(macroTemaId);
  }, [macroTemaId]);

   const bottomSheetModalRef = useRef<BottomSheetModal>(null);
    // 2. Define as alturas que o Bottom Sheet pode assumir (ex: 25% e 50% da tela)
    const snapPoints = useMemo(() => ["60%"], ["80%"]);

  const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop
        {...props}
        opacity={0.8}
        disappearsOnIndex={-1} // Fica invisível quando o modal fecha
        appearsOnIndex={0} // Aparece assim que o modal abre no primeiro snap point
        pressBehavior="close" // Garante que o toque fechará o modal
        />
      ),
      [],
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

  const { width } = useWindowDimensions();
  const router = useRouter();

  const [selected, setSelected] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [acertos, setAcertos] = useState(0);
  const [erros, setErros] = useState(0);

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
      if (acertou) {
        setAcertos((prev) => prev + 1);
      } else {
        setErros((prev) => prev + 1);
        // Se a resposta selecionada for diferente do gabarito (resposta errada),
        // abre o Bottom Sheet automaticamente.
        bottomSheetModalRef.current?.present();
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
      const categorias = [...new Set(quizQuestions.map((q) => q.categoria))];
      router.push({
        pathname: '/(tabs)/quiz/result',
        params: {
          acertos: String(acertos),
          erros: String(erros),
          categorias: JSON.stringify(categorias),
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
      {/* Glow decorativo */}
      

      {/* Emblema de sucesso */}
      <View className="w-20 h-20 rounded-full bg-[#1a1230] border border-[#a855f7]/30 justify-center items-center mb-6">
        <Text className="text-4xl">✅</Text>
      </View>

      <Text
        style={{ fontFamily: 'Manrope_700Bold' }}
        className="text-2xl text-white text-center mb-2"
      >
        Revisão diária concluída
      </Text>

      <Text
        style={{ color: C.onSurfaceVariant, fontFamily: 'Manrope_500Medium', maxWidth: 280 }}
        className="text-base text-center leading-6 mb-8"
      >
        Você respondeu todas as perguntas de hoje. Volte amanhã para continuar sua jornada de revisão!
      </Text>

      <Pressable onPress={()=> router.back()} className=" active:opacity-90">
               <LinearGradient
                 colors={['#8a2be2', '#5d3587']}
                 start={{ x: 0, y: 0 }}
                 end={{ x: 1, y: 0 }}
                 style={{ borderRadius: 999 }}
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
        <Text
          style={{
            fontFamily: 'Manrope_600SemiBold',
            fontSize: 12,
            color: C.onSurfaceVariant,
            flexShrink: 0,
          }}
        >
          {currentQuestionIndex + 1}/{quizQuestions.length}
        </Text>
       
      </View>

      <View style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.chip}>
            <Text style={styles.chipText}>{currentQuestion.categoria.toUpperCase()}</Text>
          </View>

          <Text style={styles.question}>{currentQuestion.titulo}</Text>
          <Text style={styles.hint}>{currentQuestion.dica}</Text>

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

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.nextButton,
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
     
      </View>

     <BottomSheetModal
  ref={bottomSheetModalRef}
  index={0} // abre no primeiro ponto
  snapPoints={snapPoints}
  backgroundComponent={renderBackground}
  backdropComponent={renderBackdrop}
  handleIndicatorStyle={{ backgroundColor: '#a855f7', width: 40 }}
>
  <BottomSheetView style={{ flex: 1, paddingHorizontal: 24, paddingTop: 8, paddingBottom: 24 }}>
    {/* Cabeçalho com ícone + título */}
    <View className="flex-row items-center mb-4">
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
});