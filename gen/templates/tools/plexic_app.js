(async () => {
const { Util, HtmlUtil } = PlexiOS;
const APP_RAW_IMAGE_DATA = await Util.loadImageB64Lookup({

  'icon.png': 'iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAALFSURBVHhe7ZrPixJhGMcfNSsVRDA2VHTZiJAiSFovtSKedu/9AXYKOu8hCjpsHups0HUvnjwLol46RAcvScQiHVSQdf0BQqhsxMb0PK+vSx0q3lFnHef5wGee951ZmJkvOu+7zgsMwzAMwzArik3WpaFygkvoA/QeuoleQ6+jV9BFQ9d1B72KvkDfoktBJYA36LNpE8DhcIDf7weXyyX3LJatrS04OjqCfr9PXTr3c2pcJIeoVqlUtG63q00mE23ZJJNJjc4pfYVeKCIAI4nH41owGNQSicQshNd0IReF4QF4PB5tb29PfNpSqdQshHeoE10IdllXjpOTE8Abh2g0Cm63GwqFAuzu7tKhp2gVvU2deVnZANrttqjhcFhUCqFYLEImkwGbzUYj0Sf0kTg4BysbQD6fF3U4HEKr1RLW63XY2dmB/f19OnQZfUINozD0GVAul7VAIDD73v/Nn+hcqMwDKIDHeG3TngGMRiPI5XLQ6/VE3+l0QigUgo2NDchms1AqlWj30meLMwwfBf5FOp2efQrmQuUZ8I02cma2NqgEIB7LnU5HdNYFlQDOZF0rVnYY/B92+/ml03CoG9MGQKOBJCCrLkwbAP07vghMG8Ci4ABktSwcgKyWhQOQ1bJwALJaFg5AVsvCAchqWTgAWS0LByCrZVEJYESbwWAgOuuCSgAt2hwfH4vOuqASwNzv4VYR0z4DfvtZnBZv6ca0AUQiEdmCG7LqwrQBxGIx2YL7surCtAFsbtJSRYE1X4z4fD7wer3UvCl26MQ0AYzH4/OlMmS1WoVgMEiHbok/0InK6ook+v7g4AC2t7ehVqtBo9EQqzmbzSacnp6KVV1nZ4a/RP6C3p021VEJ4CH6Ydr8gyb6FaWVE8ucK3xHu9OmgGamDfQjqnvVhkoA9Br6JUoXQjf9GaUb/4EyDMMwDMMw5gLgF9d836rgMKUqAAAAAElFTkSuQmCC',
});

const APP_MAIN = async (os, procInfo, args) => {

  const PlexiScript = (await HtmlUtil.loadComponent('PlexiScript_compile_0_1_0'))();

  let failWithError = async (msg, useStdErr) => {
    let output = useStdErr ? procInfo.stderr : procInfo.stdout;
    await output.writeln(msg);
  };

  let projFile = args[0];
  if (!projFile || typeof projFile !== 'string') {
    return failWithError(PlexiScript.getUsageNotes().trimEnd(), false);
  }
  if (!projFile.toLowerCase().endsWith('.json')) {
    return failWithError('Project file must be a .json file');
  }

  let projFileName = projFile.split('/').pop();
  let projId = projFileName.substring(0, projFileName.length - ".json".length);

  let fs = os.FileSystem(procInfo.cwd);
  let projectDir = fs.getParent(projFile);

  let { error, ok, data } = await fs.fileReadJson(projFile);
  if (!ok) {
    if (error === 'NON_JSON_FILE') return failWithError("Project file did not contain valid JSON.");
    if (error === 'PATH_NOT_FOUND') return failWithError("Project file could not be found.");
    return failWithError("Error occurred while reading project file."); // should not happen.
  }

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return failWithError("Project file contains invalid content.");
  }

  let srcByModule = {};
  let mainModule = data.mainModule;
  if (!mainModule || typeof mainModule !== 'string') {
    return failWithError("Project file does not designate a mainModule value.");
  }

  let dstPath = data.destinationFile ?? ('bin/' + projId);
  if (!dstPath || typeof dstPath !== 'string') {
    return failWithError("Project file contains an invalid value for dstPath");
  }
  dstPath = fs.getAbsolutePath(dstPath);

  let resPaths = [];
  let resPathPerMod = {};

  for (let moduleInfo of data.modules) {
    let { name, source } = moduleInfo;
    if (!name || typeof name !== 'string') {
      return failWithError("A module in the project file contains is missing a name or contains an invalid value.")
    }
    // TODO: check validity of module name
    if (!source || typeof source !== 'string') {
      return failWithError("The module '" + name + "' contains an invalid or missing value for its source directory.");
    }
    if (srcByModule[name]) {
      return failWithError("The project file contains multiple definitions for the module '" + name + "'.");
    }
    let moduleDir = fs.getAbsolutePath(fs.join(projectDir, source));

    resPathPerMod[name] = moduleDir;

    let files = {};
    let fileList = await fs.listRecursive(moduleDir, { useStructs: true });

    for (let file of fileList) {
      let isCode = file.relative.toLowerCase().endsWith('.px');
      if (isCode) {
        let { relative, absolute } = file;
        let { ok, text } = await fs.fileReadText(absolute);
        if (!ok) {
          return failWithError("There was an error while reading the source files. They were likely updated while compilation was occuring.");
        }
        files[relative] = text;
      } else {
        resPaths.push(name + '/' + file.relative);
      }
    }
    srcByModule[name] = files;
  }

  if (!srcByModule[mainModule]) {
    return failWithError("The main module '" + mainModule + "' does not exist in the list of modules provided in the project file.");
  }

  let resLoader = async (canonPath) => {
    let parts = canonPath.split('/');
    let modId = parts[0];
    let relPath = parts.slice(1).join('/');
    let modPath = resPathPerMod[modId];
    let resAbsPath = fs.getAbsolutePath(modPath + '/./' + relPath);
    if (!resAbsPath.startsWith(modPath)) throw new Error('Invalid Path');
    return await fs.fileReadBinaryForced(resAbsPath, true);
  };

  let compilationResult = await PlexiScript.compile(mainModule, srcByModule, resPaths, resLoader);
  if (compilationResult.ok) {

    let { bytes, icon, title, id } = compilationResult;
    let keyedData = {
      icon: icon || null,
      title: title || '',
      id: id || null,
    };

    let dstParent = fs.getParent(dstPath);
    await fs.mkdirs(dstParent);
    await fs.fileWriteBinary(dstPath, bytes, keyedData);
    return;
  }

  if (compilationResult.errorMessage) {
    return failWithError('' + compilationResult.errorMessage);
  }

  throw new Error(); // should not happen.
};
PlexiOS.registerJavaScript('app', 'io.plexi.tools.plexic', APP_MAIN);
})();
