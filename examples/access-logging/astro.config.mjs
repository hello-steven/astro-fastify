import { defineConfig } from "astro/config";
import fastify from "@hello-steven/astro-fastify";

export default defineConfig({
  output: "server",
  logger: { entrypoint: new URL("./logger.mjs", import.meta.url) },
  adapter: fastify({ serverEntrypoint: new URL("./server.mjs", import.meta.url) }),
});
