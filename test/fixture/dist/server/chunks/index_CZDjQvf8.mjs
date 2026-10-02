import { $ as __exportAll } from "./errors_61sHISks.mjs";
import { l as renderTemplate, u as maybeRenderHead } from "./server_C12m16Jd.mjs";
import { t as createComponent } from "./compiler_D32jRMY9.mjs";
//#region test/fixture/src/pages/index.astro
var pages_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Index,
	file: () => $$file,
	url: () => ""
});
var $$Index = createComponent(($$result, $$props, $$slots) => {
	return renderTemplate`<html>${maybeRenderHead($$result)}<body><h1>${"Fastify adapter fixture"}</h1></body></html>`;
}, "/Users/sprice/sites/lp/astro-fastify/test/fixture/src/pages/index.astro", void 0);
var $$file = "/Users/sprice/sites/lp/astro-fastify/test/fixture/src/pages/index.astro";
//#endregion
//#region \0virtual:astro:page:src/pages/index@_@astro
var page = () => pages_exports;
//#endregion
export { page };
