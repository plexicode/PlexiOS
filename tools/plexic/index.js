const APP_MAIN = async (os, procInfo, args) => {
  
  const PlexiScript = (await HtmlUtil.loadComponent('PlexiScript_compile_0_1_0'))();

  let projFile = args[0];
  if (!projFile || typeof projFile !== 'string') {
    await procInfo.stdout.writeln(PlexiScript.getUsageNotes().trimEnd());
    return;
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
