# Elix

App de revisão espaçada com IA: você envia um material de estudo, o Gemini organiza o
conteúdo em subtemas/conceitos/perguntas dentro da disciplina escolhida, e o app monta
uma dose diária de revisão priorizada pelo que você mais precisa revisar (erro, atraso,
foco e novidade — ver [`DOCUMENTACAO.md`](DOCUMENTACAO.md)).

O projeto tem duas partes com setups independentes:

- **App** (Expo/React Native) — este diretório.
- **Backend** (Express + Supabase + Gemini) — [`/server`](server), com seu próprio
  [README](server/README.md).

**Rode o backend primeiro.** Sem ele no ar, o app trava numa tela em branco no boot
(a inicialização faz uma chamada real à API que nunca resolve).

## Get started

1. Configure e suba o backend seguindo [`server/README.md`](server/README.md) — precisa
   de um projeto Supabase (schema em `server/sql/`, rode os arquivos na ordem que o
   README lista) e de uma API key do Gemini.

2. Instale as dependências do app:

   ```bash
   npm install
   ```

3. Aponte o app para o backend:

   ```bash
   cp .env.example .env
   # edite EXPO_PUBLIC_API_BASE_URL — não use "localhost": o emulador Android usa
   # 10.0.2.2, e um device físico precisa do IP da sua máquina na rede local.
   ```

4. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
