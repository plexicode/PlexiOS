let createFileActionRegistry = (osGetter, fs) => {

  let getAppForExt = async (ext) => {
    let apps = await getAppsForExt(ext);
    return apps[0] || null;
  };

  const CONFIG_FILE = '/home/config/file-ext-apps.json';

  let getRawJson = async () => {
    let { ok, data } = await fs.fileReadJson(CONFIG_FILE);
    if (!ok) {
      let os = osGetter();
      let appFileExtInfo = [
        // TODO: rebuild this list. This used to come from an HTTP request to the old PlexiStore.
      ];

      let systemToolEditable = [
        // TODO: implement textedit
        /*'TXT:T:Text File',
        'JSON:T:JSON File',
        'XML:T:XML File',
        'CRY:T:Crayon Source Code',
        'BUILD:T:Build File',*/

        // TODO: implement imageshow
        /*'PNG:I:PNG Image',
        'JPG:I:JPEG Image',
        'BMP:I:Bitmap Image',
        'GIF:I:GIF Image',*/

        // TODO: implement soundplay
        /*'MP3:A:MP3 Audio',
        'OGG:A:Ogg Vorbis Audio',
        'WAV:A:PCM Wave Sound',
        'MID:A:MIDI Song',*/

        // TODO: implement videoplay
        /*'AVI:V:AVI Video',
        'MPG:V:MPEG Video',*/
      ];

      let assoc = [
        { ext: 'SCR', app: '/system/tools/screensaver', name: "Screensaver" },
        { ext: 'THEME', app: '/system/tools/themeloader', name: "Theme" },
        ...systemToolEditable.map(t => {
          let [ext, fmt, name] = t.split(':');
          let app = '/system/tools/' + ({ T: 'textedit', I: 'imageshow', A: 'soundplay', V: 'videoplay' })[fmt];
          return { ext, app, name };
        })
      ];
      let prefix = [];
      let suffix = [];
      appFileExtInfo.filter(a => a.fileExt).forEach(app => {
        let { primary, secondary } = app.fileExt;

        (primary || []).forEach(ext => {
          prefix.push({ ext, name: ext + ' File', app: '/apps/' + app.id });
        });
        (secondary || []).forEach(ext => {
          suffix.push({ ext, name: ext + ' File', app: '/apps/' + app.id });
        });
      });
      let entries = [...prefix, ...assoc, ...suffix ];
      data = { entries };
      await fs.fileWriteText(CONFIG_FILE, JSON.stringify(data));
    }
    return { entries: Util.ensureArray(Util.ensureObject(data).entries).map(Util.ensureObject) };
  };

  // Given a file extension and an application, promote the entry in the action list
  // that applies to this up to the top of the list so that it occurs by default in the future.
  let promoteActionToDefault = async (ext, path) => {
    let { isValid, isPlx, isLib } = await fs.getExecInfo(path);
    if (!isValid || (isPlx && isLib)) return false;

    let { entries } = await getRawJson();
    let targetEntry = null;
    ext = canonicalizeExt(ext);
    let otherEntries = entries.filter(entry => {
      if (targetEntry) return true; // we already found it, ignore all others.
      if (entry.app !== path) return true;

      let extensions = new Set(Util.ensureArray(entry.ext).map(canonicalizeExt));
      if (extensions.has(ext)) {
        // we found it!
        targetEntry = entry;
        return false;
      }
      return true;
    });
    if (!targetEntry) return false;
    let newJson = { entries: [targetEntry, ...otherEntries] };
    await fs.fileWriteText(CONFIG_FILE, JSON.stringify(newJson));
    return true;
  };

  let removeApp = async (path) => {
    let { entries } = await getRawJson();
    entries = entries.filter(entry => entry.app !== path);
    await fs.fileWriteText(CONFIG_FILE, JSON.stringify({ entries }));
  };

  let getReasonableNameForExt = async (ext) => {
    ext = canonicalizeExt(ext);
    if (ext) {
      let info = await getFileInfo(ext);
      if (info && info.name) {
        return info.name;
      }
      return ext.toUpperCase() + " File";
    }
    return "File";
  };

  let getAllFileTypes = async () => {
    let { apps, names } = await getFileExtData();
    let extensions = Object.keys(names);
    let types = extensions.map(ext => {
      return {
        extension: ext,
        name: names[ext],
        apps: apps[ext],
      }
    });
    types.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
    return types;
  };

  let getFileExtData = async () => {
    let apps = {};
    let names = {};

    let { entries } = await getRawJson();

    for (let entry of entries) {
      let ext = canonicalizeExt(entry.ext);
      let name = Util.ensureString(entry.name);
      let app = Util.ensureString(entry.app);
      if (!app.startsWith('/')) continue;
      if (!apps[ext]) apps[ext] = [];
      apps[ext].push(app);
      if (!names[ext]) names[ext] = name;
    }

    let extensions = Object.keys(names);
    let defaultApps = {};
    extensions.forEach(ext => {
      if (!names[ext]) names[ext] = ext.toUpperCase() + " File";
      if (!defaultApps[ext]) defaultApps[ext] = apps[ext][0];
    });

    return { apps, names, defaultApps };
  };

  let canonicalizeExt = ext => Util.ensureString(ext).split('.').pop().trim().toLowerCase();

  let addFileAssociation = async (extension, name, app, isDefault) => {
    let { entries } = await getRawJson();
    let newEntry = {
      ext: canonicalizeExt(extension),
      app: Util.ensureString(app),
    };
    if (name) newEntry.name = name;

    entries = isDefault
      ? [ newEntry, ...entries ]
      : [ ...entries, newEntry ];

    await fs.fileWriteText(CONFIG_FILE, JSON.stringify({ entries }));
  };

  let getAppsForExt = async (ext, optCachedLookupData) => {
    let info = await getFileInfo(ext, optCachedLookupData);
    return info ? info.paths : [];
  };

  let getFileInfo = async (ext, optCachedLookupData) => {
    ext = canonicalizeExt(ext);
    let data = optCachedLookupData || await getFileExtData();
    let name = data.names[ext];
    if (!name) return null;
    let paths = data.apps[ext];
    return { name, paths, defaultApp: paths[0] };
  };

  let getCommand = async (path) => {
    if (await fs.dirExists(path)) {
      return { app: '/system/tools/files', args: [path] };
    }
    if (await fs.fileExists(path)) {
      let exec = await fs.getExecInfo(path);
      if (exec && exec.isValid) {
        return { app: path };
      }
      let t = path.split('.');
      if (t.length > 1) {
        let ext = t.pop();
        let appPath = await getAppForExt(ext);
        if (appPath) {
          return { app: appPath, args: [path] };
        }
      }
      return { app: '/system/tools/openwith', args: [path] };
    }
    return { warn: 'FILE_DOES_NOT_EXIST', arg: path };
  };

  let launchFile = async (os, path, optCwd) => {
    let command = await getCommand(path);
    if (command.warn) {
      console.log("TODO: system warning message boxes", command.warn);
      return;
    }
    let { app, args } = command;
    await os.ExecutionEngine.launchFile(app, args, optCwd || '/');
  };

  return Object.freeze({
    addFileAssociation,
    removeApp,
    getAllFileTypes,
    getAppsForExt,
    getFileInfo,
    getReasonableNameForExt,
    launchFile,
    promoteActionToDefault,
  });
};
