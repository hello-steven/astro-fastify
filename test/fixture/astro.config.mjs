import { defineConfig } from "astro/config";
import fastify from "@hello-steven/astro-fastify";

export default defineConfig({
  root: import.meta.dirname,
  output: "server",
  adapter: fastify(),
});
