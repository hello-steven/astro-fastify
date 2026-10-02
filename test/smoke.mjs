import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { once } from "node:events";
import { setTimeout as delay } from "node:timers/promises";

const allocatedPorts = new Set();
async function freePort() {
  const server = createServer();
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const { port } = server.address();
  await new Promise(resolve => server.close(resolve));
  if (allocatedPorts.has(port)) return freePort();
  allocatedPorts.add(port);
  return port;
}

async function withServer(args, env, check) {
  const child = spawn(process.execPath, args, {
    env: { ...process.env, HOST: "127.0.0.1", ...env },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  child.stdout.on("data", chunk => { output += chunk; });
  child.stderr.on("data", chunk => { output += chunk; });

  async function get(url) {
    for (let attempt = 0; attempt < 50; attempt++) {
      if (child.exitCode !== null) throw new Error(`Server exited: ${output}`);
      try {
        return await fetch(url);
      } catch {
        await delay(100);
      }
    }
    throw new Error(`Server did not respond: ${output}`);
  }

  try {
    await check(get, () => output);
  } finally {
    child.kill("SIGTERM");
    if (child.exitCode === null && child.signalCode === null) {
    await Promise.race([once(child, "exit"), delay(5000, undefined, { ref: false })]);
    }
    if (child.exitCode === null) child.kill("SIGKILL");
  }
}

const accessPort = await freePort();
await withServer(
  ["examples/access-logging/dist/server/entry.mjs"],
  { PORT: String(accessPort), NODE_ENV: "production", LOG_FORMAT: "pretty" },
  async (get, logs) => {
    const response = await get(`http://127.0.0.1:${accessPort}/`);
    assert.equal(response.status, 200);
    assert.match(await response.text(), /Fastify access logging/);
    await delay(50);
    const records = logs().trim().split("\n").map(line => JSON.parse(line));
    const astroRecord = records.find(record => record.source === "astro" && record.msg === "access logging example rendered");
    const accessRecord = records.find(record => record.source === "fastify" && record.event === "access" && record.status === 200);
    assert.ok(astroRecord);
    assert.ok(accessRecord);
    assert.equal(astroRecord.pid, accessRecord.pid);
    assert.equal(astroRecord.level, "info");
    assert.equal(accessRecord.level, "info");
    assert.match(astroRecord.time, /^\d{4}-\d{2}-\d{2}T/);
    assert.match(accessRecord.time, /^\d{4}-\d{2}-\d{2}T/);
  },
);

const prettyPort = await freePort();
await withServer(
  ["examples/access-logging/dist/server/entry.mjs"],
  { PORT: String(prettyPort), NODE_ENV: "development", LOG_FORMAT: "pretty" },
  async (get, logs) => {
    const response = await get(`http://127.0.0.1:${prettyPort}/`);
    assert.equal(response.status, 200);
    await delay(200);
    assert.match(logs(), /request completed/);
    assert.ok(!logs().trimStart().startsWith("{"));
  },
);

const developmentJsonPort = await freePort();
await withServer(
  ["examples/access-logging/dist/server/entry.mjs"],
  { PORT: String(developmentJsonPort), NODE_ENV: "development", LOG_FORMAT: "json" },
  async (get, logs) => {
    const response = await get(`http://127.0.0.1:${developmentJsonPort}/`);
    assert.equal(response.status, 200);
    await delay(50);
    const records = logs().trim().split("\n").map(line => JSON.parse(line));
    assert.ok(records.some(record => record.event === "access" && record.level === "info"));
  },
);

const previewPort = await freePort();
await withServer(
  ["node_modules/.bin/astro", "preview", "--root", "examples/access-logging", "--host", "127.0.0.1", "--port", String(previewPort), "--ignore-lock"],
  {},
  async get => {
    const response = await get(`http://127.0.0.1:${previewPort}/`);
    assert.equal(response.status, 200);
    assert.match(await response.text(), /Fastify access logging/);
  },
);

const runtimePort = await freePort();
await withServer(
  ["examples/runtime-config/dist/server/entry.mjs"],
  { PORT: String(runtimePort), GREETING: "Welcome", BROWSER_GREETING: "Hello from the first run" },
  async get => {
    const response = await get(`http://127.0.0.1:${runtimePort}/`);
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, /Welcome from Fastify/);
    assert.match(html, /window\._env_ = \{ BROWSER_GREETING \}/);
    assert.match(html, /Hello from the first run/);
  },
);

const secondRuntimePort = await freePort();
await withServer(
  ["examples/runtime-config/dist/server/entry.mjs"],
  { PORT: String(secondRuntimePort), GREETING: "Bonjour", BROWSER_GREETING: "Bienvenue" },
  async get => {
    const page = await get(`http://127.0.0.1:${secondRuntimePort}/`);
    assert.equal(page.status, 200);
    const html = await page.text();
    assert.match(html, /Bonjour from Fastify/);
    assert.match(html, /Bienvenue/);
    assert.doesNotMatch(html, /Hello from the first run/);
  },
);

const workerPort = await freePort();
const metricsPort = await freePort();
await withServer(
  ["examples/cluster-workers/cluster.mjs"],
  { PORT: String(workerPort), METRICS_PORT: String(metricsPort), WORKERS: "2" },
  async get => {
    const page = await get(`http://127.0.0.1:${workerPort}/`);
    assert.equal(page.status, 200);
    assert.match(await page.text(), /Astro worker/);
    const metrics = await get(`http://127.0.0.1:${metricsPort}/metrics`);
    assert.equal(metrics.status, 200);
    assert.match(await metrics.text(), /process_cpu_user_seconds_total/);
  },
);

console.log("Example smoke checks passed");
