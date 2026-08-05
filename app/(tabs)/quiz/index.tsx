import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import '@/global.css'
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { QuizQuestionsService } from '@/src/services/quiz/quiz.service';
import { useQuizQuestionsStore } from '@/src/store/quizQuestionsStore';

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
  // ─── Mock data (este código está comentado porque agora os dados vêm do store e ele causa loop infinito de renderização)
  useEffect(() => {
    console.log("INITIALIZE");
    QuizQuestionsService.initialize();
  }, []);
  
  const quizData =
  useQuizQuestionsStore(
    (state) => state.data
  );

  const quizQuestions =
    quizData?.questoes ?? [];
  
  const amountOfQuestions = quizQuestions.length;

  const { width } = useWindowDimensions();
  const router = useRouter()

  const [selected, setSelected] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

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
      return;
    }

    if (isLastQuestion) {
      router.replace('/(tabs)/home');
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
    if (!confirmed) return styles.optionDefault; // ← era !selected
    if (id === currentQuestion.id_gabarito) return styles.optionCorrect;
    if (id === selected && selected !== currentQuestion.id_gabarito) return styles.optionWrong;
    return styles.optionDefault;
  }

  function getOptionTextStyle(id: string) {
    if (!confirmed) return styles.optionText; // ← era !selected
    if (id === currentQuestion.id_gabarito) return [styles.optionText, { color: C.correct, fontFamily: 'Manrope_700Bold' }];
    if (id === selected && selected !== currentQuestion.id_gabarito) return [styles.optionText, { color: '#ff6b6b' }];
    return styles.optionText;
  }

  if(!currentQuestion) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']} className='justify-center items-center'>
        <Text style={{ color: C.onSurfaceVariant, fontFamily: 'Manrope_500Medium' }}>
          Carregando perguntas...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>

      <View className="flex-row items-center px-6 pt-4 pb-3 gap-3">
        {/* ── Progress Bar ── */}
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
        {/* Contador */}
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
        {/* ── Exit Button ── */}
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
      </View>

      {/* O segredo está aqui: o ScrollView ganha uma View servindo de container ao redor */}
      <View style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Category chip ── */}
          <View style={styles.chip}>
            <Text style={styles.chipText}>{currentQuestion.categoria.toUpperCase()}</Text>
          </View>

          {/* ── Question ── */}
          <Text style={styles.question}>{currentQuestion.titulo}</Text>

          {/* ── Hint ── */}
          <Text style={styles.hint}>{currentQuestion.dica}</Text>

          {/* ── Options ── */}
          <View style={styles.optionsList}>
            {currentQuestion.opcoes.map((opt) => (
              <TouchableOpacity
                key={opt.id}
                onPress={() => handleSelect(opt.id)}
                activeOpacity={0.75}
                style={[styles.option, getOptionStyle(opt.id)]}
              >
                <Text style={getOptionTextStyle(opt.id)}>{opt.rotulo}</Text>

                {/* Ícone de estado */}
            {!confirmed && (
    <View style={styles.radioOuter}>
      {selected === opt.id && (
        <View style={styles.radioInner} />
      )}
    </View>
  )}
  {confirmed && opt.id === currentQuestion.id_gabarito && (
    <View style={[styles.radioOuter, { borderColor: C.correct, backgroundColor: C.correct }]}>
      <Feather name="check" size={12} color="#fff" />
    </View>
  )}
  {confirmed && opt.id === selected && selected !== currentQuestion.id_gabarito && (
    <View style={[styles.radioOuter, { borderColor: '#ff6b6b', backgroundColor: '#ff6b6b' }]}>
      <Feather name="x" size={12} color="#fff" />
    </View>
  )}
  {confirmed && opt.id !== currentQuestion.id_gabarito && opt.id !== selected && (
    <View style={styles.radioOuter} />
  )}
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  </View>

  {/* ── Footer button (Fica fora da área de scroll, fixo embaixo) ── */}
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
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={handleBack}
      className='m-auto my-2 p-2'
    >
      <Text className='text-white text-base text-center'>
        Voltar
      </Text>
    </TouchableOpacity>
  </View>

  </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.surface,
  },

  // ── Progress ──
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

  // ── Scroll ──
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },

  // ── Chip ──
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

  // ── Question ──
  question: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 26,
    lineHeight: 34,
    color: C.onSurface,
    marginBottom: 20,
    letterSpacing: -0.4,
  },

  // ── Hint ──
  hint: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 14,
    lineHeight: 22,
    color: C.onSurfaceVariant,
    marginBottom: 32,
  },

  // ── Options ──
  optionsList: {
    gap: 10,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderRadius: 16,
  },
  optionDefault: {
    backgroundColor: C.surfaceContainerHigh,
  },
  optionCorrect: {
    backgroundColor: C.surfaceContainerHigh,
    borderWidth: 1.5,
    borderColor: C.correct,
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

  // ── Footer ──
 footer: {
  paddingHorizontal: 24,
  paddingBottom: 16,
  paddingTop: 12,
  backgroundColor: C.surface, // ← adiciona
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