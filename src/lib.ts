import { OutputBundle, OutputChunk } from "rollup";

export const generateLoadingScript = (
  bundle: OutputBundle,
  externalSource?: string,
  crossorigin?: boolean,
  crossoriginVal?: string
): string => {
  let scriptCode = `
(function () {
  var scriptTag = document.currentScript;
  var src = scriptTag.src;
  var basePath = src.substring(0, src.lastIndexOf('/') + 1);
  var parent = scriptTag.parentNode;
`;
  let counter = 0;
  for (const key in bundle) {
    // TODO: External source might not make sense any more considering
    // detection of currentScript src and basePath. Maybe remove.
    const filename = externalSource
      ? externalSource + bundle[key].fileName
      : bundle[key].fileName;
    const varName = `file${counter}`;
    if (bundle[key].type === "chunk") {
      const chunk = bundle[key] as OutputChunk;
      if (chunk.isEntry) {
        scriptCode += `const ${varName} = document.createElement('script');`;
        scriptCode += `${varName}.setAttribute('src', basePath + '${filename}');`;
        scriptCode += `${varName}.setAttribute('type', 'module');`;
        if (crossorigin) {
          scriptCode += `${varName}.setAttribute('crossorigin', '${crossoriginVal}');`;
        }
      } else {
        scriptCode += `const ${varName} = document.createElement('link');`;
        scriptCode += `${varName}.setAttribute('href', basePath + '${filename}');`;
        scriptCode += `${varName}.setAttribute('rel', 'modulepreload');`;
      }
    } else if (
      bundle[key].type === "asset" &&
      bundle[key].fileName.endsWith(".css")
    ) {
      scriptCode += `const ${varName} = document.createElement('link');`;
      scriptCode += `${varName}.setAttribute('href', basePath + '${filename}');`;
      scriptCode += `${varName}.setAttribute('rel', 'stylesheet');`;
    } else {
      continue;
    }
    scriptCode += `parent.appendChild(${varName});`;
    counter++;
  }
  scriptCode += "})()";
  return scriptCode;
};
