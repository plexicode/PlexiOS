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
    let files = {};
    let fileList = await fs.listRecursive(moduleDir, { useStructs: true });
    for (let file of fileList.filter(f => f.relative.toLowerCase().endsWith('.px'))) {
      let { relative, absolute } = file;
      let { ok, text } = await fs.fileReadText(absolute);
      if (!ok) {
        return failWithError("There was an error while reading the source files. They were likely updated while compilation was occuring.");
      }
      files[relative] = text;
    }
    srcByModule[name] = files;
  }

  if (!srcByModule[mainModule]) {
    return failWithError("The main module '" + mainModule + "' does not exist in the list of modules provided in the project file.");
  }

  let compilationResult = await PlexiScript.compile(mainModule, srcByModule);
  if (compilationResult.byteCodeB64) {
    let dstParent = fs.getParent(dstPath);
    await fs.mkdirs(dstParent);
    await fs.fileWriteText(dstPath, compilationResult.byteCodeB64);
  } else if (compilationResult.errorMessage) {
    return failWithError('' + compilationResult.errorMessage);
  } else {
    throw new Error(); // should not happen.
  }
};
