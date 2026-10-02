import cluster from "node:cluster";
import { availableParallelism } from "node:os";
import { startPrimaryMetrics, startWorkerMetrics } from "./metrics.mjs";

const requestedWorkers = Number.parseInt(process.env.WORKERS ?? "2", 10);
if (!Number.isSafeInteger(requestedWorkers) || requestedWorkers < 1) {
  throw new Error("WORKERS must be a positive integer");
}
const workerCount = Math.min(requestedWorkers, availableParallelism());

if (cluster.isPrimary) {
  const metricsPort = Number.parseInt(process.env.METRICS_PORT ?? "9464", 10);
  const metricsServer = await startPrimaryMetrics({
    host: process.env.METRICS_HOST ?? "127.0.0.1",
    port: metricsPort,
  });
  let shuttingDown = false;
  for (let index = 0; index < workerCount; index++) cluster.fork();

  cluster.on("exit", (worker, code, signal) => {
    if (shuttingDown) return;
    console.error(`Worker ${worker.process.pid} exited (${code ?? signal}); restarting`);
    cluster.fork();
  });

  async function shutdown() {
    if (shuttingDown) return;
    shuttingDown = true;
    for (const worker of Object.values(cluster.workers)) worker?.kill("SIGTERM");
    const forceExit = setTimeout(() => {
      for (const worker of Object.values(cluster.workers)) worker?.kill("SIGKILL");
    }, 25000);
    forceExit.unref();
    await new Promise(resolve => cluster.disconnect(resolve));
    clearTimeout(forceExit);
    await new Promise(resolve => metricsServer.close(resolve));
  }
  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
} else {
  startWorkerMetrics();
  await import("./dist/server/entry.mjs");
}
