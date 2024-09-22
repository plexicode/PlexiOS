const createImageUtil = (os) => {
  let fs = os.FsRoot;
  let imgUtil = {
    setSetting: async (k, v) => {
      os.Settings.preInitSet(k, v);
      return;
      let settingsPath = '/system/config/settings.json';
      let settings = JSON.parse((await fs.fileReadText(settingsPath)).text);
      settings[k] = v;
      await fs.fileWriteText(settingsPath, JSON.stringify(settings));
    },
    makeTextFile: async (path, text, overrideIfExists) => {
      if (!overrideIfExists && await fs.fileExists(path)) return;
      await fs.mkdirs(fs.getParent(path));
      await fs.fileWriteText(path, text);
    },
    makeUrlBasedAudioFile: async (path, url, optMetadata) => {
      await fs.mkdirs(fs.getParent(path));
      await fs.fileWriteAudioByUrl(path, url, optMetadata);
    },
    makeUrlBasedBinaryFile: async (path, url) => {
      await fs.mkdirs(fs.getParent(path));
      await fs.fileWriteBinaryByUrl(path, url);
    },
    makeVirtualJsFile: async (path, category, id) => {
      if (await fs.fileExists(path)) return;
      await fs.mkdirs(fs.getParent(path));
      await fs.fileWriteVirtualJS(path, category, id);
    },
    makeCanvasBasedImageFile: async (path, canvas) => {
      await fs.mkdirs(fs.getParent(path));
      await fs.fileWriteImageCanvas(path, canvas);
    },
    makeUrlBasedImageFile: async (path, url, optMetadata) => {
      if (await fs.fileExists(path)) return;
      await fs.mkdirs(fs.getParent(path));
      await fs.fileWriteImageByUrl(path, url, optMetadata);
    },
    ensureDirExists: async (path) => {
      await fs.mkdirs(path);
    },
    setEnvironmentVariable: (name, value) => {
      os.EnvVars.set(name, Util.ensureString(value));
    },
    installApp: async (path, id, optOptions) => {
      let { name, inLauncher, mruBump, iconB64 } = optOptions || {};
      await fs.mkdirs(fs.getParent(path));
      await fs.fileCreateExecJs(path, id, name, iconB64);
      if (inLauncher) {
        os.LauncherRegistry.registerApp(path, !!mruBump);
      }
      os.ApplicationRegistry.registerApp(id, path, !!mruBump, !inLauncher);
    },
    installTheme: async (id, optShortName) => {
      let dir = '/system/themes';
      let shortName = optShortName || id.split('.').pop();
      await fs.mkdirs(dir);
      await imgUtil.makeVirtualJsFile(dir + '/' + shortName + '.theme', 'theme', id);
    },
    listFiles: async (dir) => fs.list(dir),
    pinToTaskbar: async (path) => {
      let pins = [];
      let pinCfg = '/home/config/taskbar-pins.txt';
      if (await fs.fileExists(pinCfg)) {
        let { text } = await fs.fileReadText(pinCfg);
        pins = Util.ensureString(text || '').split('\n').filter(Util.identity);
      }
      pins = [...pins, path];
      await imgUtil.makeTextFile(pinCfg, pins.join('\n'), true);
    },
  };
  return Object.freeze(imgUtil);
};
