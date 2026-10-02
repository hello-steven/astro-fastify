# Node workers and metrics

This example runs an Astro build in Node cluster workers. The primary process
restarts a worker that exits unexpectedly and serves aggregate Prometheus
metrics at `/metrics`.

From the repository root:

```sh
npm ci
npm run build:cluster-workers
WORKERS=2 node examples/cluster-workers/cluster.mjs
```

Open `http://localhost:4321/` for the site and
`http://127.0.0.1:9464/metrics` for metrics. Set `PORT`, `HOST`,
`METRICS_PORT`, and `METRICS_HOST` as needed. Keep the metrics endpoint on a
private interface or protect it in your deployment.

`metrics.mjs` contains the provider. To use another metrics system, replace its
`startPrimaryMetrics` and `startWorkerMetrics` exports. The primary function
must return a server with a `close(callback)` method. You can also start an
OpenTelemetry SDK in each worker and use a collector outside this example.
The linked [Astro OpenTelemetry integration](https://github.com/dvelasquez/astro-prometheus-integration/tree/main/packages/astro-opentelemetry-integration)
currently declares `@astrojs/node` as a peer dependency; verify its behavior
with this Fastify adapter before using it here.
