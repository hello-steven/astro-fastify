# Basic server

From the repository root, run `npm ci`, then:

```sh
npm run build:basic
node examples/basic/dist/server/entry.mjs
```

Open `http://localhost:4321/`. Set `HOST` and `PORT` to change the bind address
and port. The default adapter serves SSR routes and static assets.
