import { app } from "./app";
import { env } from "./config/env";

app.listen(env.PORT, () => {
  console.log(`Elix server rodando em http://localhost:${env.PORT}`);
});
