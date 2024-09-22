let createLauncherRegistry = os => {
  let launcherAppPaths = {};
  let cachedAppMetadata = {};
  let mruByPath = {};

  let fs = os.FsRoot;
  let launcherReg = {
    registerApp: (path, useMruBump) => {
      launcherAppPaths[path] = true;
      if (useMruBump) mruByPath[path] = 1;
    },

    removeApp: (path) => {
      if (cachedAppMetadata[path]) delete cachedAppMetadata[path];
      if (launcherAppPaths[path]) delete launcherAppPaths[path];
      if (mruByPath[path]) delete mruByPath[path];
    },

    getLauncherAppPaths: async () => {
      let paths = Object.keys(launcherAppPaths);
      let metadatas = await Promise.all(paths.map(async path => {
        let md = await launcherReg.getAppMetadata(path, true);
        if (!md) return null;
        let sortKey = [
          Util.ensureNumLen(Math.floor((0xFFFFFFFFFFFF - (mruByPath[path] || 0))), 15),
          md.name.toLowerCase(),
          path
        ].join(':');
        return {
          ...md,
          path,
          sortKey,
        };
      }));
      return metadatas
        .filter(Util.identity)
        .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
        .map(md => md.path);
    },

    getAppMetadata: async (path, directIcons) => {
      if (cachedAppMetadata[path]) {
        let metadata = cachedAppMetadata[path];
        if (!directIcons) metadata = { ...metadata, icon: Util.copyImage(metadata.icon) };
        return metadata;
      }

      let info = await fs.getExecInfo(path);
      if (!info.isValid && launcherAppPaths[path]) {
        delete launcherAppPaths[path];
        return null;
      }

      let icon = info.icon;
      if (!icon) {
        icon = os.IconStore.getIconByPurpose('EXEC', directIcons);
      }

      let name = info.name;
      if (!name) {
        if (info.isJs) name = info.appId.split('.').pop();
        else name = path.split('/').pop();
      }
      cachedAppMetadata[path] = {
        name,
        icon,
        path,
      };
      return launcherReg.getAppMetadata(path, directIcons);
    },
  };
  return Object.freeze(launcherReg);
};
