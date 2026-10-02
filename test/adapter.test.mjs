import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import fastify from "../src/integration.mjs";
import { createFastifyServer } from "../src/fastify-server.mjs";

test("registers an Astro adapter with package entrypoints", () => {
  const integration = fastify();
  assert.equal(integration.name, "@hello-steven/astro-fastify");
  let adapter;
  integration.hooks["astro:config:done"]({ setAdapter: value => { adapter = value; } });
  assert.equal(adapter.name, integration.name);
  assert.equal(adapter.entrypointResolution, "auto");
  assert.equal(adapter.serverEntrypoint.pathname.endsWith("/src/server.mjs"), true);
  assert.equal(adapter.supportedAstroFeatures.serverOutput, "stable");
});

test("accepts an application server entrypoint", () => {
  const serverEntrypoint = new URL("./fixture/server.mjs", import.meta.url);
  let adapter;
  fastify({ serverEntrypoint }).hooks["astro:config:done"]({
    setAdapter: value => { adapter = value; },
  });
  assert.equal(adapter.serverEntrypoint, serverEntrypoint);
});

let root;
let server;
before(async () => {
  root = await mkdtemp(join(tmpdir(), "astro-fastify-"));
  await mkdir(join(root, "_astro"));
  await writeFile(join(root, "_astro/site.hash.css"), "body{}", "utf8");
  await writeFile(join(root, "_astro/site.hash.css.gz"), gzipSync("body{}"));
  server = await createFastifyServer({
    clientRoot: root,
    listenPort: 4321,
    astroApp: {
      getAllowedDomains: () => [],
      match: () => undefined,
      render: async request => new Response(request.url, {
        headers: { "set-cookie": "session=abc; HttpOnly" },
      }),
    },
    createRequest: raw => new Request(`http://localhost${raw.url}`),
    configureServer: instance => instance.get("/custom-health", async () => ({ status: "ok" })),
  });
});
after(async () => {
  await server?.close();
  if (root) await rm(root, { recursive: true, force: true });
});

test("serves precompressed Astro assets with immutable caching", async () => {
  const response = await server.inject({
    url: "/_astro/site.hash.css",
    headers: { "accept-encoding": "gzip" },
  });
  assert.equal(response.statusCode, 200);
  assert.equal(response.headers["content-encoding"], "gzip");
  assert.equal(response.headers["cache-control"], "public, max-age=31536000, immutable");
});

test("renders an SSR route and copies response cookies", async () => {
  const response = await server.inject("/place?x=1");
  assert.equal(response.statusCode, 200);
  assert.equal(response.body, "http://localhost/place?x=1");
  assert.match(response.headers["set-cookie"], /session=abc/);
});

test("allows application routes through configureServer", async () => {
  const response = await server.inject("/custom-health");
  assert.deepEqual(response.json(), { status: "ok" });
});
