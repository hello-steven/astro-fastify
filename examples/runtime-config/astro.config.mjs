import { defineConfig, envField } from "astro/config";
import fastify from "@hello-steven/astro-fastify";

export default defineConfig({
  output: "server",
  adapter: fastify(),
  env: {
    schema: {
      GREETING: envField.string({
        context: "server",
        access: "secret",
        optional: true,
      }),
      // Read at runtime on the server; the page publishes this safe value.
      BROWSER_GREETING: envField.string({
        context: "server",
        access: "secret",
        optional: true,
      }),
    },
  },
});
