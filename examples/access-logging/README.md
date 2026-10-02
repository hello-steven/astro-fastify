# Access logging

This example selects a custom server entrypoint and a custom Astro logger.
Both Astro and Fastify import the same Pino logger from `logger.mjs`. Astro's
logger destination forwards framework messages and messages written with
`Astro.logger` during page rendering to Pino. A Fastify `onResponse` hook writes
request records with method, route pattern, status, and duration. Each message
is one Pino JSON record in production with an ISO timestamp, a text level,
and the same field names. `pino-pretty` formats the records in development;
`LOG_FORMAT=json` keeps JSON output in development when needed.

The shared Pino logger redacts authorization and cookie headers. It does not log
request bodies. Astro's logger accepts string messages, so use Pino directly
when a record needs structured application fields. Do not put secrets in
`Astro.logger` messages.
The page-level `Astro.logger` API requires Astro 7.0.8 or later.

From the repository root:

```sh
npm ci
npm run build:access-logging
node --env-file=examples/access-logging/.env.example examples/access-logging/dist/server/entry.mjs
```

Open `http://localhost:4321/` and inspect the JSON log output. A page request
emits records with `source: "astro"` and `source: "fastify"`. `astro preview`
also calls the exported `createServer` function. Replace the logger or hook
fields to fit your service; the adapter does not require this logging format.

To see the development transport with the same build, run:

```sh
NODE_ENV=development node examples/access-logging/dist/server/entry.mjs
```

If you copy this example into an application, install `pino` as a dependency
and `pino-pretty` as a development dependency. The pretty transport runs only
in development; production does not need `pino-pretty` installed.
