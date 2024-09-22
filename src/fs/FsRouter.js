PLEXI_TEXT_INCLUDE('plexifs/plexifs.js')

let createFsRouter = async () => {
  let [
    home,
    system,
    tmp,
    root,
    apps,
    appdata,
    volumesFsTemp,
    deleted,
  ] = await Promise.all([
    // PlexiFS.initializeSyncedFs('#home', 'auth', 'https://files.plexi.io/api'),
    // PlexiFS.initializeSyncedFs('#system', 'auth', 'https://files.plexi.io/api'),
    PlexiFS.initializeLocalStorageFs('home'),
    PlexiFS.initializeInMemoryFs(),
    PlexiFS.initializeInMemoryFs(),
    PlexiFS.initializeInMemoryFs(),
    PlexiFS.initializeInMemoryFs(),
    PlexiFS.initializeInMemoryFs(),
    PlexiFS.initializeInMemoryFs(),
    PlexiFS.initializeInMemoryFs(),
  ].map(async v => {
    await v.isReady()
    return v;
  }));
  let volLookup = {};
  let volIdAlloc = 1;
  let volumes = [
    { prefix: '/home', fs: home, id: volIdAlloc++ },
    { prefix: '/system', fs: system, id: volIdAlloc++ },
    { prefix: '/tmp', fs: tmp, id: volIdAlloc++ },
    { prefix: '/deleted', fs: deleted, id: volIdAlloc++ },
    { prefix: '/apps', fs: apps, id: volIdAlloc++ },
    { prefix: '/appdata', fs: appdata, id: volIdAlloc++ },
    { prefix: '/volumes', fs: volumesFsTemp, id: volIdAlloc++ },
    { prefix: '/', fs: root, isRoot: true, id: volIdAlloc++ },
  ].map(v => {
    v.initialized = false;
    let size = v.prefix.split('/').length - 1;
    v.trimPath = path => ('/' + path.split('/').slice(size + 1).join('/'));
    volLookup[v.prefix] = v;
    return v;
  });
  let rootVol = volLookup['/'];

  let getVolumeByPath = path => {
    if (path === '/') return rootVol;
    let parts = path.split('/')
    let p1 = volLookup['/' + parts[1]] || '';
    let p2 = parts.length > 1 ? volLookup['/' + parts[1] + '/' + parts[2]] : '';
    return p2 || p1 || rootVol;
  };

  // wraps the file system function such that it will find the volume for
  // the given path arguments and call the function with those paths scoped
  // and trimmed.
  let wrapVolFunc = (fnName, pathArgs, mixedVolCallback, returnVols) => {
    return (...args) => {
      let vols = pathArgs.map(argIndex => getVolumeByPath(args[argIndex]));
      if (vols.length >= 2) {
        let allSame = vols[0] === vols[1];
        for (let i = 2; i < vols.length; i++) {
          allSame = allSame && vols[i - 1] === vols[i];
        }
        if (!allSame) return mixedVolCallback(args, vols);
      }
      let safeArgs = [...args];
      let vol = vols[0];
      let fn = vol.fs[fnName];
      for (let pathIndex of pathArgs) {
        safeArgs[pathIndex] = vol.trimPath(args[pathIndex]);
        if (vol.isRoot) {
          switch (fnName) {
            case 'write':
              throw new Error("Cannot write file here.");
            case 'del':
              throw new Error("Cannot delete this file/directory.");
            case 'mkdir':
            case 'mkdirs':
              if (args[pathIndex] === '/') break;
              throw new Error("Cannot create directory here.");
          }
        }
      }
      return returnVols
        ? { value: fn(...safeArgs), vols }
        : fn(...safeArgs);
    };
  };

  let addWatcherDirect = wrapVolFunc('addWatcher', [0], null, true);
  let delDirect = wrapVolFunc('del', [0]);
  let dirExistsDirect = wrapVolFunc('dirExists', [0]);
  let fileExistsDirect = wrapVolFunc('fileExists', [0]);
  let pathExistsDirect = wrapVolFunc('pathExists', [0]);
  let getFilePropertiesDirect = wrapVolFunc('getFileProperties', [0]);
  let listDirect = wrapVolFunc('list', [0]);
  let readDirect = wrapVolFunc('read', [0]);
  let mkdirDirect = wrapVolFunc('mkdir', [0]);
  let mkdirsDirect = wrapVolFunc('mkdirs', [0]);
  let writeDirect = wrapVolFunc('write', [0]);
  let listRecursiveDirect = wrapVolFunc('listRecursive', [0], null, true);

  let copyDirect = wrapVolFunc('copy', [0, 1], async (args, vols) => {
    let [fromPathFull, toPathFull] = args;
    let [fromVol, toVol] = vols;
    let fromPath = fromVol.trimPath(fromPathFull);
    let toPath = toVol.trimPath(toPathFull);
    let data = await fromVol.fs.read(fromPath, false);
    if (!data) return { ok: false };

    let copies;
    if (data.isDir) {
      let paths = await fromVol.fs.listRecursive(fromPath, { useStructs: true });

      copies = await Promise.all(paths.map(async pathInfo => {
        let { isDir, absolute, relative } = pathInfo;
        return { isDir, toPath: toPath + '/' + relative, fromPath: absolute };
      }));
      copies.push({ isDir: true, toPath });
      copies.sort((a, b) => a.toPath.length - b.toPath.length)

      await Promise.all(copies.filter(v => !v.isDir).map(async v => {
        v.data = await fromVol.fs.read(v.fromPath, false);
      }));
    } else {
      copies = [
        { isDir: false, data, fromPath, toPath },
      ];
    }

    await Promise.all(copies.map(async v => {
      if (v.isDir) {
        await toVol.fs.mkdirs(v.toPath);
      } else {
        let kc = { ...v.data.keyedContent, "": 0 };
        delete kc[''];
        await toVol.fs.write(v.toPath, v.data.content, kc);
      }
    }));

    return { ok: true };
  });
  let moveDirect = wrapVolFunc('move', [0, 1], async (args) => {
    let [fromPath, toPath] = args;
    // TODO: somehow check if deletion is possible before attempting to copy.
    await unifiedFs.copy(fromPath, toPath);
    await unifiedFs.del(fromPath, true);
  });

  let mkdirImpl = (path, recursive) => {
    if (volLookup[path]) return;
    let parts = path.split('/');
    if (parts[1] === 'volumes') throw new Error("Not implemented");
    return recursive ? mkdirsDirect(path) : mkdirDirect(path);
  };

  // special watchers act just like regular watchers, but watch
  // virtual directories of mounted volumes. Such as / or /appdata.
  // They should get fired when new volumes are mounted or removed.
  // Because there's probably so few, it's easiest to just store them
  // in one big ol' list.
  let specialWatcherIdAlloc = 1;
  let specialWatchers = [];

  let unifiedFs = {
    isReady: async () => {
      await Promise.all(volumes.map(v => {
        return v.fs.isReady();
      }));
    },

    addWatcher: (path, fn) => {
      if (path === '/' || path === '/appdata' || path === '/volumes') {
        let w = { isSpecial: true, id: specialWatcherIdAlloc++, path, fn };
        specialWatchers.push(w);
        return w;
      }
      let { value, vols } = addWatcherDirect(path, fn);
      return { isSpecial: false, id: value, fs: vols[0].fs };
    },
    removeWatcher: (watcher) => {
      if (watcher.isSpecial) {
        specialWatchers = specialWatchers.filter(w => w.id !== watcher.id);
      } else {
        watcher.fs.removeWatcher(watcher.id);
      }
    },

    getAbsolutePath: path => root.getAbsolutePath(path),
    getParent: path => root.getParent(path),

    copy: async (fromPath, toPath) => copyDirect(fromPath, toPath),
    del: async (path, idempotent) => delDirect(path, idempotent),
    dirExists: async (path) => dirExistsDirect(path),
    fileExists: async (path) => fileExistsDirect(path),
    getFileProperties: async (path) => getFilePropertiesDirect(path),
    mkdir: async (path) => mkdirImpl(path, false),
    mkdirs: async (path) => mkdirImpl(path, true),
    move: async (fromPath, toPath) => moveDirect(fromPath, toPath),
    pathExists: async (path) => pathExistsDirect(path),
    read: async (path, metadataOnly) => readDirect(path, metadataOnly),
    write: async (path, mainData, keyedData) => writeDirect(path, mainData, keyedData),

    getBatchProperties: async (paths) => {
      let pathsByVolumeId = {};
      let argInfo = paths.map((path, index) => ({ path, index, volume: getVolumeByPath(path) }));
      for (let arg of argInfo) {
        let volId = argInfo.volume.id;
        if (!pathsByVolumeId[volId]) pathsByVolumeId[volId] = [];
        pathsByVolumeId[volId].push(arg);
      }
      let allResults = [];
      for (let volGroup of Object.values(pathsByVolumeId)) {
        let vol = volGroup[0].volume;
        let resultsPr = vol.getBatchProperties(volGroup.map(v => v.path)).then(infos => {
          for (let i = 0; i < volGroup.length; i++) {
            volGroup[i].result = infos[i];
          }
        });
        allResults.push(resultsPr);
      }
      await Promise.all(allResults); // assigns to argInfo items directly
      return argInfo.map(a => a.result);
    },

    list: async path => {
      if (path === '/') {
        let names = Object.values(volLookup).map(v => v.prefix.split('/')[1]);
        names = [...new Set(names.filter(v => !!v))].sort();
        return { ok: true, items: names.map(name => ({ name, isDir: true, size: 0 })) };
      }
      if (path === '/volumes') {
        throw new Error('not implemented');
      }
      return listDirect(path);
    },

    listRecursive: async (path, options) => {
      let { useStructs, useAbsolutePaths } = options || {};
      if (path === '/') {
        let fullResults = [];
        await Promise.all(Object.values(volumes).map(async v => {
          let { prefix } = v;
          if (prefix === '/') return;
          let relPrefix = prefix.substring(1);

          if (useStructs) {
            fullResults.push({ isDir: true, name: prefix.split('/').pop(), relative: relPrefix, absolute: prefix });
          } else if (useAbsolutePaths) {
            fullResults.push(prefix);
          } else {
            fullResults.push(relPrefix);
          }

          let items = await v.fs.listRecursive(path, options);

          for (let item of items) {
            if (useStructs) {
              fullResults.push({ ...item, relative: relPrefix + '/' + item.relative, absolute: prefix + item.absolute });
            } else if (useAbsolutePaths) {
              fullResults.push(prefix + item);
            } else {
              fullResults.push(relPrefix + '/' + item);
            }
          }
        }));
        if (useStructs) return fullResults.sort((a, b) => a.absolute.localeCompare(b.absolute));
        return fullResults.sort();
      }
      if (path === '/volumes') {
        throw new Error("Not implemented");
      }
      let { value, vols } = await listRecursiveDirect(path, options);
      let vol = vols[0];
      value = await Promise.resolve(value);
      if (useStructs) {
        return value.map(v => {
          v.absolute = vol.prefix + v.absolute;
          return v;
        });
      }
      if (useAbsolutePaths) {
        return value.map(v => vol.prefix + v);
      }
      return value;
    },
  };

  let watchersByPid = {};

  let addWatcher = (path, pid, cb) => {
    let watcherRef = unifiedFs.addWatcher(path, cb);
    if (!watchersByPid[pid]) watchersByPid[pid] = [];
    watchersByPid[pid].push(watcherRef);
    return { ref: watcherRef };
  };

  let removeWatchersByProcess = (pid) => {
    let arr = watchersByPid[pid];
    if (arr) {
      delete watchersByPid[pid];
      arr.forEach(w => unifiedFs.removeWatcher(w));
    }
  };

  let removeWatchersByRef = w => {
    unifiedFs.removeWatcher(w.ref);
  };

  let createAccessor = cwd => {
    let wrapPath = path => {
      return root.getAbsolutePath(cwd, path);
    };

    let fs = {
      addWatcher: (path, pid, fn) => addWatcher(wrapPath(path), pid, fn),
      copy: async (fromPath, toPath) => unifiedFs.copy(wrapPath(fromPath), wrapPath(toPath)),
      del: async (path, idempotent) => unifiedFs.del(wrapPath(path), idempotent),
      dirExists: async (path) => unifiedFs.dirExists(wrapPath(path)),
      fileExists: async (path) => unifiedFs.fileExists(wrapPath(path)),
      getAbsolutePath: (path) => wrapPath(path),
      getBatchProperties: async (paths) => unifiedFs.getBatchProperties(paths.map(wrapPath)),
      getFileProperties: async (path) => unifiedFs.getFileProperties(wrapPath(path)),
      getParent: path => unifiedFs.getParent(wrapPath(path)),
      list: async (path) => unifiedFs.list(wrapPath(path)),
      listRecursive: async (path, options) => unifiedFs.listRecursive(path, options),
      mkdir: async (path) => unifiedFs.mkdir(wrapPath(path)),
      mkdirs: async (path) => unifiedFs.mkdirs(wrapPath(path)),
      move: async (fromPath, toPath) => unifiedFs.move(wrapPath(fromPath), wrapPath(toPath)),
      pathExists: async (path) => unifiedFs.pathExists(wrapPath(path)),
      removeWatcher: (w) => removeWatchersByRef(w),
      removeWatchersByProcess: (pid) => removeWatchersByProcess(pid),

      // .read() and .write() are hidden from the rest of the OS and are used by FsHelper
      // with context-specific wrappers.
    };
    return Object.freeze({
      ...fs,
      ...getFsHelper(unifiedFs, wrapPath),
      join: (...args) => args.join('/'),
    });
  };

  return Object.freeze({
    isReady: async () => { await unifiedFs.isReady(); return true; },
    FsRoot: createAccessor('/'),
    createAccessor,
  });
};
