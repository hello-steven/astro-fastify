# @hello-steven/astro-fastify

An Astro 7 adapter that runs server-rendered routes on Fastify. It serves the
prerendered client output with `@fastify/static` and compresses responses with
`@fastify/compress`.

This repository is prepared for review. The npm package has not been published.
The package has `private: true` until a first release is planned. You can
install it from a local checkout for testing.

The planned GitHub home is
[`hello-steven/astro-fastify`](https://github.com/hello-steven/astro-fastify).
The repository can be shared there before the npm package is published.

## Requirements

- Node.js 22.12 or later
- Astro 7

## Try it locally

In this repository, run `npm ci` and `npm test`. In an Astro project, install
the local package with `npm install /absolute/path/to/astro-fastify`. Then use:

```js
// astro.config.mjs
import { defineConfig } from "astro/config";
import fastify from "@hello-steven/astro-fastify";

export default defineConfig({
  output: "server",
  adapter: fastify(),
});
```

Run `astro build`, then `node dist/server/entry.mjs`. Set `HOST` and `PORT` to
override Astro's configured host and port. `astro preview` starts the same
Fastify server for a local preview.

The adapter applies immutable caching only to files under `/_astro/`. Other
static files require revalidation. It does not add application routes, request
filters, a health check, or a custom logger. For a shared Astro and Fastify Pino
logger, see the access logging example. The adapter leaves logging with the
application.

## Examples

- [Basic server](examples/basic/README.md)
- [Access logging](examples/access-logging/README.md)
- [Runtime configuration](examples/runtime-config/README.md)
- [Node workers and metrics](examples/cluster-workers/README.md)

The examples use this package from the same repository. Each can be built
from the repository root with its `build:*` script. The runtime configuration
example shows how one build can serve both server and browser values in
different environments. The access logging, runtime configuration, and Node
workers examples include `.env.example` files with safe local values.
Run them with Node's `--env-file` option. To change values, copy a template to
an ignored `.env.local` file, edit it, and pass that file to `--env-file`.
The Node workers example uses:

```sh
node --env-file=examples/cluster-workers/.env.example examples/cluster-workers/cluster.mjs
```

## Use a custom Fastify server

Pass a URL or module ID to `serverEntrypoint` to use application code in the
Astro server build:

```js
adapter: fastify({ serverEntrypoint: new URL("./server.mjs", import.meta.url) })
```

The module must export `createApp` from `astro/app/entrypoint`. If it also
exports `createServer(options)`, the adapter calls that function for
`astro preview`. See the access logging example for a complete entrypoint.

`createFastifyServer` is exported from
`@hello-steven/astro-fastify/fastify-server`. It accepts `astroApp`,
`createRequest`, `clientRoot`, and `listenPort`. Optional `loggerInstance`,
`disableRequestLogging`, and `configureServer` arguments let an application
control logging and register hooks or routes before the adapter registers its
routes. A custom Astro server entrypoint can call this function if the default
entrypoint does not meet its needs.

## Development

```sh
npm ci
npm test
npm run test:build
npm run build:basic
npm run build:access-logging
npm run build:runtime-config
npm run build:cluster-workers
npm run test:smoke
npm run pack:check
```

Please see [CONTRIBUTING.md](CONTRIBUTING.md) before sending a change.
GitHub Actions runs these checks on pull requests and pushes to `main`.

## License

MIT. See [LICENSE](LICENSE).
