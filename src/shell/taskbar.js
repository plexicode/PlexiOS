let createTaskbar = (os, invalidateTaskbar) => {

  let iconCache = {};
  const PIN_FILE = '/home/config/taskbar-pins.txt'

  // pinCache and the code that populates it should be in the launcherRegistry
  let pinCache = null;
  let pinCacheCounter = 0;
  let getPinnedAppPaths = async () => {
    if (!pinCache) {
      let fs = os.FsRoot;
      let pinRawData = await fs.fileReadText(PIN_FILE);
      pinCache = (pinRawData.ok ? pinRawData.text.split('\n') : [])
        .map(v => v.trim())
        .filter(Util.identity);
    }
    return [...pinCache];
  };
  let clearPinCache = () => { pinCache = null; pinCacheCounter++ };

  let isAppPinned = async path => {
    let paths = await getPinnedAppPaths();
    return !!paths.filter(p => p === path).length;
  };

  let toggleAppPin = async (path, isPin) => {
    let apps = await getPinnedAppPaths();
    let alreadyPinned = new Set(apps).has(path);
    if (alreadyPinned === isPin) return;
    if (isPin) apps.push(path);
    else apps = apps.filter(p => p !== path);

    let fs = os.FsRoot;
    await fs.fileWriteText(PIN_FILE, apps.join('\n'));
    clearPinCache();
    invalidateTaskbar();
  };

  let getTaskbarStateFingerprint = () => {
    let procs = os.ProcessManager.getProcesses(true);
    return [
      ...procs.map(p => p.pid),
      os.Shell.getFocusedWindowPid(),
      pinCacheCounter,
    ].join('|');
  };

  let processesToTaskEntities = async (procs) => {
    let appBucket = {};

    let fs = os.FsRoot;

    (await getPinnedAppPaths())
      .forEach((path, i) => {
        appBucket[path] = { appPath: path, isPinned: true, pids: [], isFocused: false, order: '0:' + Util.ensureNumLen(i, 4) };
      });

    procs.forEach(proc => {
      let { pid, isFocused, path } = proc;
      if (!appBucket[path]) {
        appBucket[path] = { appPath: path, isPinned: false, pids: [], isFocused: false, order: '1:' };
      }
      let app = appBucket[path];
      app.pids.push(pid);
      if (isFocused) app.isFocused = true;
      iconCache[path] = proc.icon || iconCache[path];
    });

    let appNameCache = {};

    let items = await Promise.all(Object.values(appBucket)
      .map(async app => {
        let path = app.appPath;
        app.order += Util.ensureNumLen(Math.min(...app.pids), 9);
        app.count = app.pids.length;
        app.multiIndicator = app.count > 1 ? app.count : null;
        app.icon = iconCache[path];
        if (!app.icon) {
          app.icon = await os.IconStore.getIconByPath(fs, path, true);
          iconCache[path] = app.icon;
        }

        // TODO: find a better way.
        let appNameCacheEntry = appNameCache[path] || {};
        if (Util.getTime() - appNameCacheEntry.age > 120) appNameCacheEntry = null;
        let appName = appNameCacheEntry.name;
        if (!appName) {
          let { isValid, appId } = await os.FsRoot.getExecInfo(path);
          if (isValid) {
            let { name } = await os.ApplicationRegistry.getInfo(appId, true) || {};
            appName = name || appId;
            if (!name) {
              if (app.pids.length) {
                let proc = os.ProcessManager.getProcess(app.pids[0]);
                if (proc && proc.uiHandles.length) {
                  let winData = proc.uiHandles[0];
                  appName = winData.getTitle();
                }
              }
            }
          }

          appNameCache[path] = { name: appName, age: Util.getTime() };
        }
        app.name = appNameCache[path].name;

        return app;
      }));
    items.sort((a, b) => a.order.localeCompare(b.order));
    return items;
  };

  let showTaskMenu = async (ev, appPath, pid) => {

    let {
      buildRootMenuElement,
      createMenu,
      createMenuItem,
      createCommand,
      createMenuSep,
    } = os.Shell.MenuBuilder;

    let buildMenu = async (idChain) => {
      switch (idChain.join(':')) {
        case '':
          clearPinCache();
          let isPinned = new Set(await getPinnedAppPaths()).has(appPath);

          return createMenu(
            createMenuItem('open', "Open"),
            isPinned ? createMenuItem('unpin', "Unpin Item") : createMenuItem('pin', "Pin App"),
            pid ? [
              createMenuSep(),
              createMenuItem('close', "Close"),
            ] : null,
          );
        case 'pin':
          return createCommand(() => toggleAppPin(appPath, true));
        case 'unpin':
          return createCommand(() => toggleAppPin(appPath, false));
        case 'open':
          return createCommand(() => {
            if (pid) os.Shell.giveProcessFocus(pid);
            else os.ExecutionEngine.launchFile(appPath);
          });
        case 'close':
          return createCommand(() => {
            let proc = os.ProcessManager.getProcess(pid);
            if (proc) {
              if (proc.uiHandles.length === 1) {
                let winData = proc.uiHandles[0];
                winData.closeHandler();
              } else {
                console.log("TODO: close all or check for modal");
              }
            } else {
              // This should not happen, since window-free processes shouldn't appear here.
              os.ProcessManager.killProcess(pid);
            }
          });
      }
    };

    let el = await buildRootMenuElement(buildMenu, true);
    os.Shell.openModalAtMouseEvent(ev, el);
  };

  let batteryColorPicker = HtmlUtil.createColorInterpolator([
    { ratio: 1, rgb: [0, 100, 255] },
    { ratio: 0.97, rgb: [0, 160, 255] },
    { ratio: 0.9, rgb: [0, 160, 0] },
    { ratio: 0.5, rgb: [255, 255, 0] },
    { ratio: 0.25, rgb: [255, 128, 0] },
    { ratio: 0.05, rgb: [255, 0, 0] },
    { ratio: 0, rgb: [150, 0, 60] },
  ]);

  let renderBatteryImage = (canvas, isDark, useColor, percent) => {
    canvas.width = 64;
    canvas.height = 64;
    let g = canvas.getContext('2d');
    g.clearRect(0, 0, 64, 64);

    let lineSz = 4;
    let left = 10;
    let right = 54;
    let bottom = 64;
    let top = lineSz;
    let tipSize = lineSz * 4;

    g.fillStyle = isDark ? '#000' : '#fff';
    g.fillRect(left, top, lineSz, bottom - top);
    g.fillRect(right - lineSz, top, lineSz, bottom - top);
    g.fillRect(left, top, right - left, lineSz);
    g.fillRect(left, bottom - lineSz, right - left, lineSz);
    let mid = (left + right) >> 1;
    g.fillRect(mid - (tipSize >> 1), top - lineSz, tipSize, lineSz);

    let intLeft = left + lineSz * 2;
    let intRight = right - lineSz * 2;
    let intTop = top + lineSz * 2;
    let intBottom = bottom - lineSz * 2;
    let intHeight = intBottom - intTop;
    intHeight = Math.floor(Math.max(lineSz, intHeight * percent / 100 + 0.5));
    intTop = intBottom - intHeight;

    if (useColor) {
      g.fillStyle = `rgb(${batteryColorPicker(percent / 100).join(',')})`;
    }

    g.fillRect(intLeft, intTop, intRight - intLeft, intHeight);
    return canvas;
  };

  return Object.freeze({
    getTaskbarStateFingerprint,
    isAppPinned,
    processesToTaskEntities,
    renderBatteryImage,
    showTaskMenu,
    toggleAppPin,
  });
};
