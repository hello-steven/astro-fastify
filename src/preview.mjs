import { fileURLToPath } from "node:url";
import { createFastifyServer } from "./fastify-server.mjs";

export default async function createPreviewServer(preview) {
  process.env.ASTRO_NODE_AUTOSTART = "disabled";

  const ssrModule = await import(preview.serverEntrypoint.toString());
  const astroApp = ssrModule.createApp();
  const { createRequest } = await import("astro/app/node");

  const clientRoot = fileURLToPath(preview.client);
  const host = preview.host ?? "0.0.0.0";
  const port = preview.port ?? 3000;

  const server = await (ssrModule.createServer ?? createFastifyServer)({
    astroApp,
    createRequest,
    clientRoot,
    listenPort: port,
  });

  await server.listen({ port, host });

  preview.logger.info(`Preview server listening on http://${host}:${port}`);

  return {
    host,
    port,
    closed() {
      return new Promise((resolve) => {
        server.server.on("close", resolve);
      });
    },
    stop() {
      return server.close();
    },
  };
}
