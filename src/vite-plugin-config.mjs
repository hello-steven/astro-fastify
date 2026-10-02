const VIRTUAL_ID = "virtual:@hello-steven/astro-fastify:config";
const RESOLVED_ID = "\0" + VIRTUAL_ID;

export function createConfigPlugin(options) {
  const config = {
    // Resolved from dist/server/entry.mjs (Astro 7 bundles the adapter there).
    clientPath: "../client/",
    host:
      typeof options.config?.server?.host === "boolean"
        ? options.config.server.host
          ? "0.0.0.0"
          : "localhost"
        : (options.config?.server?.host ?? "0.0.0.0"),
    port: options.config?.server?.port ?? 3000,
  };
  return {
    name: VIRTUAL_ID,
    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_ID;
    },
    load(id) {
      if (id === RESOLVED_ID) {
        return Object.entries(config)
          .map(([k, v]) => `export const ${k} = ${JSON.stringify(v)};`)
          .join("\n");
      }
    },
  };
}
