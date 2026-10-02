import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { createApp } from "astro/app/entrypoint";
import { createRequest } from "astro/app/node";
import { setGetEnv } from "astro/env/setup";
import { createFastifyServer } from "./fastify-server.mjs";
import { clientPath, host, port } from "virtual:@hello-steven/astro-fastify:config";

setGetEnv((key) => process.env[key]);

export { createApp };

if (process.env.ASTRO_NODE_AUTOSTART !== "disabled") {
  const listenPort = Number.parseInt(process.env.PORT ?? String(port), 10);
  const server = await createFastifyServer({
    astroApp: createApp(),
    createRequest,
    clientRoot: resolve(dirname(fileURLToPath(import.meta.url)), clientPath),
    listenPort,
  });
  await server.listen({ port: listenPort, host: process.env.HOST ?? host });
}
