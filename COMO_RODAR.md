# Como rodar o Elix no seu computador — passo a passo

Este guia é pra quem nunca rodou o projeto antes. Segue os passos na ordem, sem pular
nenhum. No final você vai ter o app abrindo no seu celular.

O projeto tem duas partes que precisam estar rodando ao mesmo tempo:
- **O servidor** (backend): fica no seu computador, fala com o banco de dados e com a IA.
- **O app**: o que você vê no celular.

Você vai rodar os dois no mesmo computador, e abrir o app no celular conectado no
**mesmo Wi-Fi**.

---

## Parte 1 — Instalar os programas necessários

Se você já tem algum desses instalados, pode pular esse item.

### 1.1. Node.js

1. Acesse https://nodejs.org
2. Baixe a versão **LTS** (a recomendada, não a "Current").
3. Instale normalmente (next, next, next).
4. Pra confirmar que instalou certo, abra o terminal (veja como abrir no item 1.3) e
   digite:
   ```bash
   node -v
   ```
   Deve aparecer um número de versão (ex: `v20.19.0`). Se aparecer "comando não
   encontrado", reinicie o computador e tente de novo.

### 1.2. Git

1. Acesse https://git-scm.com/downloads
2. Baixe e instale a versão do seu sistema (Windows/Mac/Linux).
3. Confirme no terminal:
   ```bash
   git -v
   ```

### 1.3. Abrir o terminal

- **Windows**: aperte a tecla Windows, digite `PowerShell`, aperte Enter.
- **Mac**: aperte `Cmd + Espaço`, digite `Terminal`, aperte Enter.

Você vai usar essa janela pra digitar todos os comandos abaixo.

### 1.4. App Expo Go no celular

No seu celular (Android ou iPhone), baixe o app **Expo Go** na loja de aplicativos
(Play Store ou App Store). É por ele que você vai abrir o projeto.

---

## Parte 2 — Baixar o projeto

No terminal, escolha uma pasta pra baixar o projeto (ex: sua área de trabalho) e rode:

```bash
cd Desktop
git clone https://github.com/ViniciusBarrosFiap/Elix.git
cd Elix
git checkout feature/backend-mvp
```

Isso cria uma pasta `Elix` com todo o projeto dentro, já na versão certa.

---

## Parte 3 — Configurar e ligar o servidor (backend)

### 3.1. Entrar na pasta do servidor e instalar as dependências

```bash
cd server
npm install
```

Isso pode demorar alguns minutos na primeira vez. Espere terminar.

### 3.2. Criar o arquivo de configuração do servidor

Ainda dentro da pasta `server`, copie o arquivo de exemplo:

**Mac/Linux:**
```bash
cp .env.example .env
```

**Windows (PowerShell):**
```powershell
copy .env.example .env
```

### 3.3. Preencher o arquivo `.env` com as chaves

Abra o arquivo `.env` que acabou de ser criado (dentro da pasta `server`) em qualquer
editor de texto (Bloco de Notas, VS Code, TextEdit — o que você tiver).

Apague o conteúdo e cole as chaves que foram te enviadas separadamente (num arquivo
`.txt` ou por mensagem). Vai ficar parecido com isto:

```
PORT=3333

SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=coloque-aqui-a-chave-que-recebeu
SUPABASE_STORAGE_BUCKET=materials

GEMINI_API_KEY=coloque-aqui-a-chave-que-recebeu
GEMINI_MODEL=gemini-2.5-flash

MAX_INPUT_CHARS=80000
MAX_UPLOAD_MB=15
```

Salve o arquivo.

> ⚠️ Se você não recebeu essas chaves, peça pra quem te passou o repositório — sem
> elas o servidor não liga.

### 3.4. Ligar o servidor

Ainda na pasta `server`:

```bash
npm run dev
```

Se der tudo certo, vai aparecer uma mensagem assim no terminal:

```
Elix server rodando em http://localhost:3333
```

**Deixe essa janela do terminal aberta rodando** — se você fechar, o servidor
desliga. Vamos precisar abrir uma **segunda** janela de terminal pra parte seguinte.

### 3.5. Testar se o servidor está respondendo

Abra o navegador e acesse:

```
http://localhost:3333/api/health
```

Deve aparecer na tela: `{"ok":true}`. Se aparecer isso, o servidor está funcionando.

---

## Parte 4 — Descobrir o IP do seu computador na rede

O celular precisa saber o "endereço" do seu computador na rede Wi-Fi pra conseguir
falar com o servidor. Anote esse número, você vai usar no próximo passo.

**Windows:**
1. Abra um **novo** terminal (PowerShell).
2. Digite:
   ```powershell
   ipconfig
   ```
3. Procure por "Endereço IPv4" (algo como `192.168.0.15` ou `192.168.1.23`).

**Mac:**
1. Abra um **novo** terminal.
2. Digite:
   ```bash
   ipconfig getifaddr en0
   ```
3. Vai aparecer um número tipo `192.168.0.15`. (Se não aparecer nada, tente
   `ipconfig getifaddr en1`.)

Guarde esse número — vamos chamar ele de `SEU-IP` daqui pra frente.

---

## Parte 5 — Configurar e rodar o app

Abra uma **nova janela de terminal** (deixe a do servidor rodando na outra) e navegue
até a pasta principal do projeto (não a `server`):

```bash
cd Desktop/Elix
```

### 5.1. Instalar as dependências do app

```bash
npm install
```

De novo, pode demorar alguns minutos.

### 5.2. Criar o arquivo de configuração do app

**Mac/Linux:**
```bash
cp .env.example .env
```

**Windows (PowerShell):**
```powershell
copy .env.example .env
```

### 5.3. Editar o `.env` da raiz

Abra o arquivo `.env` (esse é o da pasta principal do projeto, não o da pasta
`server`) e coloque, no lugar de `SEU-IP`, o número que você anotou na Parte 4:

```
EXPO_PUBLIC_API_BASE_URL=http://SEU-IP:3333
```

Exemplo real, se o seu IP fosse `192.168.0.15`:
```
EXPO_PUBLIC_API_BASE_URL=http://192.168.0.15:3333
```

Salve o arquivo.

### 5.4. Ligar o app

```bash
npx expo start
```

Vai aparecer um **QR code** no terminal.

### 5.5. Abrir no celular

1. Certifique-se que o celular está conectado no **mesmo Wi-Fi** que o computador.
2. Abra o app **Expo Go** no celular.
3. Escaneie o QR code que apareceu no terminal (no Android, tem uma opção dentro do
   próprio Expo Go; no iPhone, pode usar a câmera nativa do celular).
4. O app vai começar a carregar. Na primeira vez demora um pouco (compilando tudo).

Se aparecer a tela inicial do Elix, deu tudo certo! 🎉

---

## Problemas comuns

### A tela do app fica branca / travada pra sempre

Quase sempre é porque o app não está conseguindo falar com o servidor. Confira:
- A janela do terminal com `npm run dev` (Parte 3.4) ainda está aberta e rodando?
- O celular está no mesmo Wi-Fi que o computador?
- O IP que você colocou no `.env` da Parte 5.3 está certo? (Ele pode mudar se você
  reiniciar o roteador — nesse caso repita a Parte 4 e atualize o `.env`.)
- Alguns Wi-Fi de faculdade/trabalho bloqueiam dispositivos de se enxergarem entre si
  — nesse caso, tente num Wi-Fi de casa.

### `npm install` dá erro

Confirme que o Node.js foi instalado direito (`node -v` funciona no terminal). Se
mesmo assim der erro, copie a mensagem de erro completa e peça ajuda.

### O servidor não liga / erro sobre `.env`

Confira se o arquivo `.env` está exatamente dentro da pasta `server` (não na pasta
principal) e se todas as linhas foram coladas certinho, sem espaços extras.

### Erro relacionado ao Gemini (IA) ao enviar um material

Se a mensagem de erro falar em "cota" (quota) ou "429", é porque o limite de uso
gratuito da chave de IA foi atingido — é só esperar um pouco ou avisar quem
administra a chave.

---

## Resumo rápido (se já configurou tudo antes e só quer religar)

Toda vez que for usar o projeto de novo, você só precisa:

1. Abrir um terminal, ir até `Elix/server` e rodar `npm run dev`.
2. Abrir **outro** terminal, ir até `Elix` e rodar `npx expo start`.
3. Escanear o QR code no Expo Go.

(Só repita a Parte 4 e atualize o `.env` se o IP do seu computador mudar.)
