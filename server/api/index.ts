// Express app funciona direto como handler (req, res) — o runtime Node.js
// da Vercel não é o formato de evento do AWS Lambda, então o adaptador
// serverless-http (feito pra Lambda) trava a resposta até o timeout aqui.
import { app } from "../src/app";

export default app;
