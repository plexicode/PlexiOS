(async () => {
const { Util, HtmlUtil } = PlexiOS;
const APP_RAW_IMAGE_DATA = await Util.loadImageB64Lookup({

  'icon.png': 'iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAALFSURBVHhe7ZrPixJhGMcfNSsVRDA2VHTZiJAiSFovtSKedu/9AXYKOu8hCjpsHups0HUvnjwLol46RAcvScQiHVSQdf0BQqhsxMb0PK+vSx0q3lFnHef5wGee951ZmJkvOu+7zgsMwzAMwzArik3WpaFygkvoA/QeuoleQ6+jV9BFQ9d1B72KvkDfoktBJYA36LNpE8DhcIDf7weXyyX3LJatrS04OjqCfr9PXTr3c2pcJIeoVqlUtG63q00mE23ZJJNJjc4pfYVeKCIAI4nH41owGNQSicQshNd0IReF4QF4PB5tb29PfNpSqdQshHeoE10IdllXjpOTE8Abh2g0Cm63GwqFAuzu7tKhp2gVvU2deVnZANrttqjhcFhUCqFYLEImkwGbzUYj0Sf0kTg4BysbQD6fF3U4HEKr1RLW63XY2dmB/f19OnQZfUINozD0GVAul7VAIDD73v/Nn+hcqMwDKIDHeG3TngGMRiPI5XLQ6/VE3+l0QigUgo2NDchms1AqlWj30meLMwwfBf5FOp2efQrmQuUZ8I02cma2NqgEIB7LnU5HdNYFlQDOZF0rVnYY/B92+/ml03CoG9MGQKOBJCCrLkwbAP07vghMG8Ci4ABktSwcgKyWhQOQ1bJwALJaFg5AVsvCAchqWTgAWS0LByCrZVEJYESbwWAgOuuCSgAt2hwfH4vOuqASwNzv4VYR0z4DfvtZnBZv6ca0AUQiEdmCG7LqwrQBxGIx2YL7surCtAFsbtJSRYE1X4z4fD7wer3UvCl26MQ0AYzH4/OlMmS1WoVgMEiHbok/0InK6ook+v7g4AC2t7ehVqtBo9EQqzmbzSacnp6KVV1nZ4a/RP6C3p021VEJ4CH6Ydr8gyb6FaWVE8ucK3xHu9OmgGamDfQjqnvVhkoA9Br6JUoXQjf9GaUb/4EyDMMwDMMw5gLgF9d836rgMKUqAAAAAElFTkSuQmCC',
});

const APP_MAIN = async (os, procInfo, args) => {
  
  const PlexiScript = (await HtmlUtil.loadComponent('PlexiScript_compile_0_1_0'))();

  let projFile = args[0];
  if (!projFile || typeof projFile !== 'string') {
    throw new Error("TODO: Usage info should be in Pastel layer");
  }
  if (!projFile.toLowerCase().endsWith('.json')) {
    throw new Error("TODO: Error for when the project file is not a .json file.");
  }

  let projFileName = projFile.split('/').pop();
  let projId = projFileName.substring(0, projFileName.length - ".json".length);

  let fs = os.FileSystem(procInfo.cwd);
  let projectDir = fs.getParent(projFile);

  let { error, ok, data } = await fs.fileReadJson(projFile);
  if (!ok) {
    if (error === 'NON_JSON_FILE') throw new Error("TODO: error for when the proj config is not a JSON file");
    if (error === 'PATH_NOT_FOUND') throw new Error("TODO: error for when proj file does not exist");
    // TODO: go through rest of possible errors
    throw new Error();
  }

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('TODO: Error for when the root of the project config is not a real object.');
  }

  let srcByModule = {};
  let mainModule = data.mainModule;
  if (!mainModule || typeof mainModule !== 'string') {
    throw new Error('TODO: error for when the main module is not present or not a string');
  }
  
  let dstPath = data.destinationFile ?? ('bin/' + projId);
  if (!dstPath || typeof dstPath !== 'string') {
    throw new Error('TODO: error for when the dstPath is not a string');
  }
  dstPath = fs.getParent(fs.join(dstPath, 'dummy')); // canonicalize
  
  for (let moduleInfo of data.modules) {
    let { name, source } = moduleInfo;
    if (!name || typeof name !== 'string') throw new Error("TODO: error for when a module entry does not have a name present");
    // TODO: check validity of module name 
    if (!source || typeof source !== 'string') throw new Error("TODO: error for when the module info does not have a directory present.");
    let moduleDir = fs.getParent(fs.join(projectDir, source, 'dummypath')); // add extra path and go to parent to canonicalize path 
    let files = {};
    let fileList = await fs.listRecursive(moduleDir, { useStructs: true });
    for (let file of fileList.filter(f => f.relative.toLowerCase().endsWith('.px'))) {
      let { relative, absolute } = file;
      let { ok, text } = await fs.fileReadText(absolute);
      if (!ok) throw new Error('TODO: this should generally not happen (except in race conditions)');
      files[relative] = text;
    }
    srcByModule[name] = files;
  }

  if (!srcByModule[mainModule]) {
    throw new Error('TODO: error for when the main module does not exist');
  }

  let compilationResult = await PlexiScript.compile(mainModule, srcByModule);
  if (compilationResult.byteCodeB64) {
    let dstParent = fs.getParent(dstPath);
    await fs.mkdirs(dstParent);
    await fs.fileWriteText(dstPath, compilationResult.byteCodeB64);
    console.log("Compilation successful (TODO: remove this line)");
  } else {
    throw new Error("TODO: error for when there's no byte code");
  }
};
PlexiOS.registerJavaScript('app', 'io.plexi.tools.plexic', APP_MAIN);
})();
