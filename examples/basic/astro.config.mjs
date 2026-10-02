import { defineConfig } from "astro/config";
import fastify from "@hello-steven/astro-fastify";

export default defineConfig({
  output: "server",
  adapter: fastify(),
});
