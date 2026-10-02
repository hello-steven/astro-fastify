import { fileURLToPath } from "node:url";
import { createConfigPlugin } from "./vite-plugin-config.mjs";

export default function fastify({ serverEntrypoint } = {}) {
  return {
    name: "@hello-steven/astro-fastify",
    hooks: {
      "astro:config:setup": ({ config, updateConfig, command }) => {
        updateConfig({
          image: {
            endpoint: {
              route: config.image.endpoint?.route ?? "_image",
              entrypoint:
                config.image.endpoint?.entrypoint ??
                (command === "dev"
                  ? "astro/assets/endpoint/dev"
                  : "astro/assets/endpoint/node"),
            },
          },
          vite: {
            ssr: {
              target: "node",
            },
            plugins: [createConfigPlugin({ config })],
          },
        });
      },
      "astro:config:done": ({ setAdapter }) => {
        setAdapter({
          name: "@hello-steven/astro-fastify",
          entrypointResolution: "auto",
          serverEntrypoint: serverEntrypoint ?? new URL("./server.mjs", import.meta.url),
          previewEntrypoint: fileURLToPath(
            new URL("./preview.mjs", import.meta.url),
          ),
          adapterFeatures: {
            buildOutput: "server",
          },
          supportedAstroFeatures: {
            serverOutput: "stable",
            hybridOutput: "stable",
            staticOutput: "stable",
            sharpImageService: "stable",
            envGetSecret: "stable",
          },
        });
      },
    },
  };
}
