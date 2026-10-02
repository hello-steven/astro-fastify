import { constants as zlibConstants } from "node:zlib";
import Fastify, { LogController } from "fastify";
import fastifyCompress from "@fastify/compress";
import fastifyStatic from "@fastify/static";

/** Create a Fastify server for an Astro build. No application routes are added. */
export async function createFastifyServer({
  astroApp,
  createRequest,
  clientRoot,
  listenPort,
  loggerInstance,
  disableRequestLogging = false,
  configureServer,
}) {
  const server = Fastify({
    ...(loggerInstance ? { loggerInstance } : { logger: true }),
    ...(disableRequestLogging
      ? { logController: new LogController({ disableRequestLogging: true }) }
      : {}),
  });

  // Keep this above Fastify's default 72-second keep-alive timeout.
  server.server.headersTimeout = 75000;

  if (configureServer) await configureServer(server);

  await server.register(fastifyCompress, {
    zlibOptions: { flush: zlibConstants.Z_SYNC_FLUSH },
    brotliOptions: {
      params: { [zlibConstants.BROTLI_PARAM_QUALITY]: 4 },
      flush: zlibConstants.BROTLI_OPERATION_FLUSH,
    },
    threshold: 0,
  });

  await server.register(fastifyStatic, {
    root: clientRoot,
    wildcard: false,
    redirect: true,
    preCompressed: true,
    cacheControl: false,
    setHeaders: (reply, filePath) => {
      if (reply.sent) return;
      reply.header(
        "Cache-Control",
        filePath.includes("/_astro/")
          ? "public, max-age=31536000, immutable"
          : "public, max-age=0, must-revalidate",
      );
    },
  });

  // Astro endpoints must receive the original request body as a web Request.
  server.removeAllContentTypeParsers();
  server.addContentTypeParser("*", (_request, _payload, done) => done(null));

  server.all("/*", async (request, reply) => {
    const webRequest = createRequest(request.raw, {
      allowedDomains: astroApp.getAllowedDomains?.() ?? [],
      port: listenPort,
    });
    const routeData = astroApp.match(webRequest, true);
    const response = await astroApp.render(webRequest, {
      addCookieHeader: true,
      routeData,
    });

    reply.code(response.status);
    for (const [key, value] of response.headers.entries()) {
      if (key !== "set-cookie") reply.header(key, value);
    }
    for (const cookie of response.headers.getSetCookie()) {
      reply.header("set-cookie", cookie);
    }
    return reply.send(response.body ?? undefined);
  });

  return server;
}
