# Elix — Análise do Projeto

> Análise técnica e funcional do app em 18/07/2026. Estado atual: **protótipo navegável (UI completa, dados mockados)**.

---

## 1. O que é o app

O **Elix** é um app de estudos que transforma material do aluno (PDFs, DOCX, anotações, páginas do Notion) em **revisões espaçadas automáticas** — quizzes gerados a partir do que a pessoa estudou.

A metáfora visual é consistente e bem executada: "poção/elixir", frasco de laboratório, cards que **enchem como líquido** conforme o domínio do tema evolui, "sua dose de hoje", gota como moeda de pontuação. Público-alvo aparente: universitários (o mock é de Medicina — Endocrinologia, Neurociência, Anatomia).

**Stack:** Expo SDK 54 + Expo Router 6 (file-based routing) · React 19 · React Native 0.81 (New Architecture) · NativeWind 4 (Tailwind) · Zustand 5 · Reanimated 4 · Skia · TypeScript strict.

---

## 2. Fluxo do usuário

```
app/index.tsx  ──> lê primeiroAcesso
   │
   ├─ true ──> (onboarding)/welcome
   │              ├─ "Começar Jornada" ──> (auth)/signUp  [curso + semestre]
   │              │                            └─> (auth)/addSubjects  [disciplinas]
   │              │                                    └─> loadingScreen ──> home
   │              └─ "Já tenho conta"  ──> loadingScreen ──> home
   │
   └─ false ─> (tabs)/home
                  ├─ Header ──> connectNotion  (tela de integração)
                  ├─ DoseCard ──> (tabs)/quiz  [quiz de múltipla escolha]
                  ├─ ContentCards  [cards líquidos por macrotema]
                  └─ FAB "+" ──> BottomSheet ──> studyContents/addContent
                                                    └─ upload/tags ──> loadingScreen ──> home
```

### Home com dois estados
A `HomeScreen` bifurca por `userData.fezUpload`:
- **Sem upload:** só header + mensagem de call-to-action + FAB.
- **Com upload:** dose diária, "Seus conteúdos" e carrossel de macrotemas.

É uma boa decisão de produto — resolve o problema do *empty state* de forma natural.

---

## 3. Telas implementadas

| Tela | Arquivo | Estado |
|---|---|---|
| Welcome / onboarding | [welcome.tsx](app/(onboarding)/welcome.tsx) | Completa |
| Cadastro (curso + semestre) | [signUp.tsx](app/(auth)/signUp.tsx) | Completa, com picker modal custom |
| Disciplinas (chips) | [addSubjects.tsx](app/(auth)/addSubjects.tsx) | Completa |
| Loading animado | [LoadingScreen.tsx](src/features/loadingScreen/LoadingScreen.tsx) | Completa, parametrizável via rota |
| Home | [HomeScreen.tsx](src/features/home/HomeScreen.tsx) | Completa (2 estados) |
| Quiz | [quiz/index.tsx](app/(tabs)/quiz/index.tsx) | Funcional (navegação, correção, progresso) |
| Adicionar conteúdo | [addContent.tsx](app/(tabs)/studyContents/addContent.tsx) | UI completa; upload real via DocumentPicker, mas sem envio |
| Conectar Notion | [connectNotion.tsx](app/connectNotion.tsx) | Só visual — botão "Conectar" sem handler |

---

## 4. Arquitetura

A separação em camadas é o ponto mais maduro do código:

```
UI (features/) ──> Service ──> Repository ──> mock JSON
                      │
                      └──> Zustand Store ──> UI lê via seletor
```

Três domínios espelhados: `user`, `studyContent`, `quiz`. Cada um com repository, service, store e tipos.

**Isso é bem feito.** Trocar mock por API real significa mexer **só nos 3 arquivos de repository** — nenhum componente muda. É exatamente a fronteira certa.

Os tipos em [studyContent.ts](src/types/studyContent.ts) revelam um modelo de domínio pensado para repetição espaçada de verdade:

```
MacroTema → SubTema → Conceito → Pergunta
```

com `peso_atual`, `review_stage`, `proxima_revisao`, `dificuldade`, `tipo_cognitivo` (lembrança direta, causa-consequência, aplicação contextual, relação entre conceitos, comparação) e `performance { vezes_revisada, acertos, erros }`.

O **schema do algoritmo de revisão já existe** — só falta o motor que o consome.

---

## 5. Destaques de implementação

**`LiquidFillCard`** — o melhor componente do projeto. Onda SVG animada via `requestAnimationFrame` com três otimizações corretas e comentadas:
- pausa a física quando o app vai para background (`AppState`)
- velocidade por **delta de tempo real**, não por frame (idêntico em 60/90/120 Hz)
- `setNativeProps` no path em vez de `setState` — zero re-render do React
- percentual com throttle de 100 ms

**`LoadingScreen`** — recebe `next`, `title` e `subtitle` por parâmetro de rota, então uma tela só serve os três momentos de espera do app ("Aguarde um momento", "Processando informações", "Gerando revisão"). Reuso inteligente.

**Design system coeso** — paleta violeta escura (`#16111b` / `#8a2be2` / `#dcb8ff`) aplicada de forma consistente, com tokens nomeados em estilo Material 3 nas telas maiores.

**Quiz** — fluxo de dois toques bem resolvido: selecionar → *Confirmar* → feedback visual (verde/vermelho com ícones) → *Próxima*. Estados do botão bem tratados.

---

## 6. Problemas encontrados

### Críticos

**1. Fonte Manrope nunca é carregada.**
Há **24 referências** a `fontFamily: 'Manrope_800ExtraBold'` e similares, mas não existe nenhuma chamada a `useFonts` no projeto — e a dependência instalada é `@expo-google-fonts/inter`, não Manrope. Toda a tipografia está caindo em fallback do sistema. No Android, `fontFamily` desconhecido pode inclusive causar erro de render.
→ Instalar `@expo-google-fonts/manrope` e carregar no `_layout.tsx` com splash screen segurada até `fontsLoaded`.

**2. Nenhuma persistência.**
Não há AsyncStorage nem middleware `persist` do Zustand. Todo estado vive em memória. Consequência prática: **o onboarding se repete a cada abertura do app**, porque `userData.json` tem `primeiroAcesso: true` fixo e nada grava a mudança.
→ Adicionar `persist` do Zustand com AsyncStorage é uma mudança de ~10 linhas por store.

**3. Mock inconsistente com o tipo.**
`UserData` exige `disciplinas: string[]`, mas [userData.json](src/mocks/userData.json) não tem o campo. O `as UserData` no repository mascara isso — o TS não reclama, mas o dado chega `undefined`.

### Médios

**4. Progresso hardcoded no carrossel.** Em [ContentCards.tsx](src/features/home/components/ContentCards.tsx#L28), `progress={5}` é fixo para todos os cards. O `LiquidFillCard` está pronto para receber valor real, mas o `MacroTema` não tem campo de percentual — precisa derivar de `performance` dos conceitos (ou adicionar `liquido_percentual`, que já existe no `mockedHome.json` e não é usado).

**5. Barra de progresso do quiz com matemática errada.** Em [quiz/index.tsx](app/(tabs)/quiz/index.tsx#L635), `progressWidth = (width + 40 + 48 + 12) * progress` usa a largura da **tela** para preencher uma barra que é `flex-1` dentro de um container com padding e dois irmãos. A barra transborda o track.
→ Trocar por `width: \`${progress * 100}%\``.

**6. Hook chamado dentro do JSX.** Em [DoseCard.tsx](src/features/home/components/DoseCard.tsx#L92), `useQuizQuestionsStore(...)` é invocado no meio do render de um `<Text>`, embora `quizData` já esteja disponível no topo do componente. Funciona hoje, mas é frágil e viola as regras de hooks por convenção.

**7. `HomeScreen` duplica ~50 linhas.** Os dois ramos do ternário repetem `UploadButton` + `BottomSheetModal` inteiro, com diferenças acidentais entre eles (um usa `backgroundStyle`, o outro `backgroundComponent`; um navega para `/(tabs)/studyContents/addContent`, o outro para `/studyContents/addContent`). Deveria ser um layout único com só o miolo condicional.

**8. Código morto acumulado.** [addContent.tsx](app/(tabs)/studyContents/addContent.tsx) carrega ~150 linhas de "Versão Antiga" comentada, duas funções de picker concorrentes (`selecionarDocumento` e `handlePickFile`, que se sobrescrevem — a segunda faz `setFiles(files)` em vez de append), e imports não usados. `TabBar.tsx` tem 3 tabs comentadas. `mockedHome.json` e `NavItem.tsx` estão órfãos.

### Menores

- `useAppInit.ts` existe e tem delay artificial de 3,5 s, mas **não é usado** — a inicialização real acontece no `_layout.tsx`.
- `QuizQuestionsService.initialize()` é chamado duas vezes (no layout raiz e de novo no `useEffect` da tela de quiz).
- README ainda é o boilerplate do `create-expo-app`.
- Sem tratamento de erro em nenhum service — repositories nunca falham porque são JSON local, mas API real vai falhar.
- Mistura de idiomas no código (`selecionarDocumento` / `handlePickFile`, `tipoExtensão` com acento em identificador).
- Sem testes, sem CI.

---

## 7. O que falta para virar produto

| Camada | Situação |
|---|---|
| Autenticação real | Ausente — "signUp" só coleta curso/semestre, sem e-mail/senha/OAuth |
| Backend / API | Ausente — repositories retornam JSON estático |
| Upload de arquivos | Seleciona o arquivo localmente, mas nunca envia (`// await uploadFiles(files)` comentado) |
| Geração de perguntas por IA | Ausente — é o núcleo da proposta de valor e ainda não existe |
| OAuth do Notion | Só a tela; botão "Conectar" sem `onPress` |
| Algoritmo de repetição espaçada | Schema pronto, motor ausente — nada lê `proxima_revisao` nem escreve `performance` |
| Persistência local | Ausente |
| Resultado do quiz | Ao finalizar, volta para home sem tela de resumo e sem gravar acertos |
| Pontuação / streak | Exibidos no header, mas sempre 0 — nada os incrementa |
| Telas de Conteúdos, Progresso e Perfil | Comentadas no TabBar; "Ver todos" não navega |

---

## 8. Avaliação geral

**Como protótipo de UI, é forte.** O design tem identidade própria e é executado com cuidado real — animações que respeitam ciclo de vida do app, atenção a performance de render, empty states pensados, microinterações (háptico no FAB, glow pulsante, fade-in da home). Não parece template.

**A arquitetura está acima do esperado para um projeto neste estágio.** A separação repository/service/store não é enfeite: ela realmente isola o mock, e a migração para backend será localizada. O modelo de domínio em `studyContent.ts` mostra que o problema (repetição espaçada com tipos cognitivos variados) foi pensado antes de ser codado.

**A dívida técnica é do tipo previsível de protótipo:** código comentado acumulado, duplicação em telas iteradas várias vezes, valores hardcoded. Nada estrutural.

### Prioridades sugeridas

1. **Carregar a fonte Manrope** — o app inteiro está tipograficamente errado agora, e é a correção de maior impacto visual pelo menor esforço.
2. **Persistir os stores** (Zustand `persist` + AsyncStorage) — sem isso não dá nem para testar o fluxo de retorno do usuário.
3. **Ligar `progress` real nos `LiquidFillCard`** — o componente mais bonito do app está mostrando dado falso.
4. **Corrigir a barra de progresso do quiz** e persistir o resultado (acertos/erros/pontuação/streak).
5. **Limpar o código morto** antes de crescer — `addContent.tsx` e `HomeScreen.tsx` primeiro.
6. Só então: backend, IA e Notion.
