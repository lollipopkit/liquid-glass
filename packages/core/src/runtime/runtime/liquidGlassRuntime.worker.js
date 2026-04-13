// Source-side shim for bundlers that statically resolve the default worker URL
// before the package is built. Published packages still load the emitted
// dist/runtime/liquidGlassRuntime.worker.js file.
import "../liquidGlassRuntime.worker.ts";
