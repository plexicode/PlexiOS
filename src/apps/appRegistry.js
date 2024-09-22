const staticAppRegistry = (() => {
  let apps = {};
  let appLoaders = {};
  let appNames = {};
  let appIcons = {};
  let loadAppById = id => Util.loadScript('apps/' + id + '.js');
  return Object.freeze({
    setAppLoader: f => { loadAppById = f; },
    loadApp: async (id) => {
      if (apps[id]) return true;
      if (appLoaders[id]) return appLoaders[id].promise;

      let res = null;
      let p = new Promise(r => { res = r; });
      appLoaders[id] = { promise: p, resolver: res };
      loadAppById(id);
      return p;
    },
    registerApp: async (id, runner, iconUri) => {
      apps[id] = runner;
      if (iconUri) {
        appIcons[id] = await Util.loadImageUri(iconUri);
      }
      if (appLoaders[id]) appLoaders[id].resolver(true);
    },
    registerAppMetadata: async (id, name, iconUriOrCanvas) => {
      if (name) appNames[id] = name;
      if (iconUriOrCanvas) appIcons[id] = typeof iconUriOrCanvas === 'string' ? await Util.loadImageUri(iconUri) : iconUriOrCanvas;
    },
    getApp: id => {
      return apps[id] ? { runner: apps[id], icon: appIcons[id] || null } : null;
    },
    getAppMetadata: id => {
      return appNames[id] ? { id, name: appNames[id], icon: appIcons[id], isLoaded: !!apps[id] } : null;
    },
  });
})();

const createAppRegistry = () => {
  let appById = {};
  let mru = {};

  let registerApp = (id, path, useArtificialMru, omitFromLauncher) => {
    let staticData = staticAppRegistry.getAppMetadata(id);
    if (!staticData) staticData = { id, name: id.split('.').pop() };

    appById[id] = { ...staticData, path, mru: 0, isLoaded: false, inLauncher: !omitFromLauncher };
    if (useArtificialMru) mru[id] = 1; // this will cause it to show up in the launcher first
  };

  let getApp = async (id, tickleMru, metadataOnly) => {
    let app = appById[id];
    if (!app) return null;
    if (tickleMru) mru[id] = Util.getTime();
    if (!metadataOnly && !app.isLoaded) {
      await staticAppRegistry.loadApp(id);
      app.isLoaded = true;
    }

    let stApp = { ...(staticAppRegistry.getApp(id) || {}), ...(staticAppRegistry.getAppMetadata(id) || {}) };
    app.icon = app.icon || stApp.icon;
    app.runner = app.runner || stApp.runner;
    app.name = stApp.name || app.name; // not a typo

    return app;
  };

  let getLauncherApps = () => {
    let apps = Object.values(appById).filter(app => app.inLauncher)
      .map(app => {
        return {
          mru: mru[app.id] || 0,
          app,
          name: app.name,
          id: app.id,
          icon: app.icon,
          path: app.path,
        };
      });
    apps.sort((a, b) => {
      let c = -(a.mru - b.mru);
      if (c) return c;
      return a.name.localeCompare(b.name);
    });
    return apps.map(app => {
      return { id: app.id, name: app.name, icon: app.icon };
    });
  };

  let listAll = () => {
    return Object.values(appById).map(app => {
      let md = staticAppRegistry.getAppMetadata(app.id) || {};
      let a = {
        id: app.id,
        icon: app.icon || md.icon,
        name: app.name || md.name,
      };
      a.sortKey = app.name.toLowerCase() + '\n' + app.id;
      return a;
    });
  };

  let removeApp = async (os, id, includeUserData) => {
    if (appById[id]) {
      let path = appById[id].path;
      os.LauncherRegistry.removeApp(id);
      await os.Shell.Taskbar.toggleAppPin(path, false);
      await os.FileActions.removeApp(path);
      delete appById[id];
      if (await os.FsRoot.fileExists(path)) {
        await os.FsRoot.del(path);
      }
      let userDir = '/appdata/' + id;
      if (includeUserData && await os.FsRoot.dirExists(userDir)) {
        await os.FsRoot.del(userDir);
      }
    }
  };

  return Object.freeze({
    getApp,
    getLauncherApps,
    listAll,
    registerApp,
    removeApp,
  });
};
