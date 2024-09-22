const createPlexiOs = async (options, config) => {
  let os = null;
  let {
    headless,
    images,
    lang,
    loadAppById,
    shellHost,
    useDefaultFullScreenShell,
    osName,
  } = options;

  // currently this is only used for static app registry
  // TODO: apps should be dynamically loaded and tools should be in a big
  // atlas that is embedded and then this will just go away.
  await Util.awaitPromiseTasks();

  // TODO: this isn't at all used yet.
  // The base config never changes. However, the portal may allow the user to
  // pick options that can be imprinted on the config.
  let baseConfig = parseOsBaseConfiguration(config);

  if (loadAppById) staticAppRegistry.setAppLoader(loadAppById);
  let loadApp = async (id) => {
    return staticAppRegistry.loadApp(id);
  };

  let envVars = {};
  let appRegistry = createAppRegistry();

  let getIcon = (appIdOrCbxPath) => {
    if (appIdOrCbxPath.startsWith('~')) {
      return null;
    }
    return (staticAppRegistry.getAppMetadata(appIdOrCbxPath) || {}).icon || null;
  };

  let fs = await createFsRouter();
  await fs.isReady();

  let settings = await createSettingsManager(fs);

  let getEnvVarImpl = (n, cycleCheck) => {
    if (cycleCheck[n]) throw new Error("ENV VAR REF CYCLE");
    cycleCheck[n] = true;
    let value = envVars[n] || '';
    let parts = value.split('%');
    for (let i = 1; i < parts.length; i += 2) {
      parts[i] = getEnvVarImpl(parts[i], cycleCheck);
    }
    cycleCheck[n] = false;
    return parts.join('');
  };

  let fsRootAccessor = fs.FsRoot;

  let doLog = (level, args) => {
    let proc = os.ProcessManager.getProcessesByAppId('io.plexi.tools.vislog')[0] || null;
    if (proc) {
      os.ProcessManager.sendIpcMessage(proc.pid, {
        level,
        items: args,
      });
    } else {
      // Be annoying about this so log messages don't get left behind in prod
      // as this can make internal data more visible and also be a perf hog.
      console.log("visLog message unhandled!");
    }
  };

  os = {
    ApplicationRegistry: Object.freeze({
      loadApp,
      registerApp: appRegistry.registerApp,
      getInfo: async (appId, optMetadataOnly) => {
        let info = await appRegistry.getApp(appId, false, !!optMetadataOnly);
        return info ? { ...info } : null;
      },
      getIcon,
      getLauncherAppList: () => appRegistry.getLauncherApps(),
      getInstalled: () => appRegistry.listAll(),
      removeApp: (id, optIncludeUserData) => appRegistry.removeApp(os, id, !!optIncludeUserData),
    }),
    AppSettings: createAppSettingsStore(fsRootAccessor),
    createTerminalSession: async (optCwd) => {
      return PlexiOS.terminalSession(os, optCwd || '/', os.EnvVars.snapshot())
    },
    Clipboard: createClipboard(),
    EnvVars: Object.freeze({
      get: n => getEnvVarImpl(n, {}),
      getRaw: n => envVars[n] || '',
      set: (n, v) => {
        let oldValue = envVars[n] || '';
        envVars[n] = v + '';
        try {
          getEnvVarImpl(n, {});
        } catch (ex) {
          envVars[n] = oldValue;
          return false;
        }
        return true;
      },
      remove: (n) => {
        if (envVars[n] !== undefined) delete envVars[n];
      },
      list: () => Object.keys(envVars).filter(n => envVars[n]).sort(),
      snapshot: () => {
        return os.EnvVars.list().reduce((lookup, k) => { lookup[k] = os.EnvVars.get(k); return lookup }, {});
      },
    }),
    FileActions: (() => {
      let fa = createFileActionRegistry(() => os, fsRootAccessor);
      return Object.freeze({
        ...fa,
        launchFile: (path, optCwd) => fa.launchFile(os, path, optCwd),
      });
    })(),
    FileSystem: cwd => cwd === '/' ? fsRootAccessor : fs.createAccessor(cwd),
    FsRoot: fsRootAccessor,
    getName: () => osName || "PlexiOS",
    IconStore: createIconStore(),
    log: (...args) => doLog('INFO', args),
    logWarning: (...args) => doLog('WARNING', args),
    logError: (...args) => doLog('ERROR', args),
    PowerManager: createPowerManager(),
    Settings: settings,
    Localization: Object.freeze({
      getLanguage: () => activeLanguage,
      setLanguage: lang => {
        let loc = os.Localization.getLocaleList().filter(o => lang === o.id)[0];
        if (!loc) throw new Error();
        if (loc.id === activeLanguage) return;
        activeLanguage = loc.id;
        os.Settings.set('lang', loc.id);
        if (os.Shell) os.Shell.onLocaleChange();
      },
      getLocaleList: () => {
        return 'en:English|ja:日本語'.split('|').map(t => t.split(':')).map(t => ({ id: t[0], name: t[1] }));
      },
    }),
    ProcessManager: null,
    Shell: null,
    Themes: null,
  };

  os.LauncherRegistry = createLauncherRegistry(os);
  os.ProcessManager = createProcessManager(os);
  os.ExecutionEngine = createExecutionEngine(os);

  await os.IconStore.init();

  let imageList = images || ['default'];
  if (!new Set(imageList).has('default')) imageList = ['default', ...imageList];

  let imgUtil = createImageUtil(os);
  for (let imageName of imageList) {
    let imageBuilder = await staticVirtualJsLoader.loadJavaScript('image', imageName);
    await imageBuilder(imgUtil);
  }

  await os.Settings.init();

  let activeLanguage = settings.getString('lang', '') || lang || 'en';

  if (!headless) {
    os.Shell = createPlexiShell(os);
    os.Themes = createThemeManager(os);

    let root = shellHost || (useDefaultFullScreenShell ? document.body : null);
    if (!root) throw new Error("No valid shell host was configured.");

    Array.from(root.childNodes)
      .filter(e => e.tagName !== 'NOSCRIPT')
      .forEach(e => root.removeChild(e));

    await os.Shell.init(root, options.initialTheme);

    if (useDefaultFullScreenShell) {
      window.addEventListener('keydown', os.Shell.systemKeyDownListener);
      window.addEventListener('keyup', os.Shell.systemKeyUpListener);
      window.addEventListener('resize', os.Shell.systemWindowResizeListener);

      if (root === document.body && useDefaultFullScreenShell) {
        [document.body.parentElement, document.body].forEach(e => {
          let s = e.style;
          s.margin = 0;
          s.height = '100%';
          s.width = '100%';
          s.overflow = 'hidden';
        });
      }
    }
  }

  return Object.freeze(os);
};
