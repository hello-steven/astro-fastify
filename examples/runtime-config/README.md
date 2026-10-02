# Runtime configuration

Build once, then run the same build with different environment values. The
server reads `GREETING` when it renders the page. The page also reads
`BROWSER_GREETING` at request time and puts that safe public value in an inline
`window._env_` script. The client script reads `window._env_.BROWSER_GREETING`.
This follows the `lp-frontend-astro` layout pattern.

From the repository root:

```sh
npm ci
npm run build:runtime-config
node --env-file=examples/runtime-config/.env.example examples/runtime-config/dist/server/entry.mjs
```

Open `http://localhost:4321/`. Stop the server and start the same build with
other values to see both greetings change without rebuilding:

```sh
GREETING=Bonjour BROWSER_GREETING=Bienvenue node examples/runtime-config/dist/server/entry.mjs
```

The example uses Astro's environment schema and the adapter's `setGetEnv`
setup. Only `BROWSER_GREETING` is put into browser HTML. Astro's
`PUBLIC_` client variables are included in the build; use rendered HTML
for public client values that must change between deployments. Never add
credentials or other secrets to `window._env_`. If HTML is cached, scope or
invalidate that cache for each deployment so it cannot serve old values.
Copy `.env.example` to `.env.local` if you want to edit the values; `.env.local`
is ignored by Git. Pass the new file to `--env-file`, or set `GREETING` in the
shell.
