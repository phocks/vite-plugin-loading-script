import sum from "hash-sum";
import { PluginOption, ViteDevServer } from "vite";
import { OutputBundle } from "rollup";
import { generateLoadingScript } from "./lib";

interface LoadingScriptOptions {
  externalSrc?: string;
  fileName?: string;
  shouldHash?: boolean;
  crossorigin?: boolean;
  crossoriginVal?: string;
  devEntry?: string;
}

export function loadingScript({
  externalSrc,
  fileName = "index",
  shouldHash = false,
  crossorigin = false,
  crossoriginVal = "",
  devEntry = "src/main.ts",
}: LoadingScriptOptions = {}): PluginOption {
  return {
    name: "vite-plugin-script-loader",
    generateBundle(_, bundle: OutputBundle) {
      const newScript = generateLoadingScript(
        bundle,
        externalSrc,
        crossorigin,
        crossoriginVal
      );
      this.emitFile({
        type: "asset",
        fileName: shouldHash
          ? `${fileName}.${sum(newScript)}.js`
          : `${fileName}.js`,
        source: newScript,
      });
    },
    configureServer(server: ViteDevServer) {
      server.middlewares.use((req, res, next) => {
        if (req.originalUrl === "/index.js") {
          const devLoader = `
(function () {
  var scriptTag = document.currentScript;
  var src = scriptTag.src;
  var basePath = src.substring(0, src.lastIndexOf("/") + 1);
  var parent = scriptTag.parentNode;

  const entry = document.createElement("script");
  entry.setAttribute("src", basePath + "${devEntry}");
  entry.setAttribute("type", "module");
  parent.appendChild(entry);
})();
            `.trim();
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/javascript");
          res.end(devLoader);
          return;
        }
        next();
      });
    },
  };
}
