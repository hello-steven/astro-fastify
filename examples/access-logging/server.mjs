import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { createApp } from "astro/app/entrypoint";
import { createRequest } from "astro/app/node";
import { setGetEnv } from "astro/env/setup";
import { createFastifyServer } from "@hello-steven/astro-fastify/fastify-server";
import { logger } from "./logger.mjs";
import { clientPath, host, port } from "virtual:@hello-steven/astro-fastify:config";

setGetEnv(key => process.env[key]);
export { createApp };

// This export is also used by the adapter's `astro preview` entrypoint.
export function createServer({ astroApp, createRequest, clientRoot, listenPort }) {
  return createFastifyServer({
    astroApp,
    createRequest,
    clientRoot,
    listenPort,
    loggerInstance: logger,
    disableRequestLogging: true,
    configureServer(server) {
      server.addHook("onResponse", async (request, reply) => {
        const fields = {
          source: "fastify",
          event: "access",
          method: request.method,
          route: request.routeOptions.url,
          status: reply.statusCode,
          duration_ms: reply.elapsedTime,
        };
        const level = reply.statusCode >= 500
          ? "error"
          : reply.statusCode >= 400 ? "warn" : "info";
        request.log[level](fields, "request completed");
      });
      server.addHook("onError", async (request, _reply, error) => {
        request.log.error({ err: error }, "request failed");
      });
    },
  });
}

if (process.env.ASTRO_NODE_AUTOSTART !== "disabled") {
  const listenPort = Number.parseInt(process.env.PORT ?? String(port), 10);
  const server = await createServer({
    astroApp: createApp(),
    createRequest,
    clientRoot: resolve(dirname(fileURLToPath(import.meta.url)), clientPath),
    listenPort,
  });
  await server.listen({ port: listenPort, host: process.env.HOST ?? host });
}
