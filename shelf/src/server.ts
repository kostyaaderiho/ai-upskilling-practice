import { app } from "./app";
import { getLogger } from "./log";

const log = getLogger("server");

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => {
  log.info("server listening", { port });
});
