import http from "node:http";
import { performance } from "node:perf_hooks";
import {
  ClusterRegistry,
  Gauge,
  collectDefaultMetrics,
} from "@prometheus-io/client";

// Keep the metrics provider in one module. A different provider can implement
// these two exports without changing the cluster lifecycle.
export async function startPrimaryMetrics({ host, port }) {
  const registry = new ClusterRegistry();
  const server = http.createServer(async (request, response) => {
    if (request.url !== "/metrics") {
      response.writeHead(404).end();
      return;
    }
    try {
      const body = await registry.clusterMetrics();
      response.writeHead(200, { "Content-Type": registry.contentType });
      response.end(body);
    } catch {
      response.writeHead(500).end();
    }
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, host, resolve);
  });
  return server;
}

export function startWorkerMetrics() {
  collectDefaultMetrics();
  new ClusterRegistry();
  const eventLoop = new Gauge({
    name: "nodejs_eventloop_utilization",
    help: "Node.js event loop utilization from 0 to 1",
  });
  let previous = performance.eventLoopUtilization();
  const timer = setInterval(() => {
    const current = performance.eventLoopUtilization();
    eventLoop.set(performance.eventLoopUtilization(current, previous).utilization);
    previous = current;
  }, 5000);
  timer.unref();
}
