let createAppSettingsStore = (fs) => {
  let getScope = (id) => {
    let dir = '/appdata/' + id + '/';
    let jsonPath = dir + 'settings.json';

    let loadSettings = async () => {
      if (!await fs.fileExists(jsonPath)) return {};
      let d = await fs.fileReadText(jsonPath);
      if (d.ok) return Util.tryParseJson(d.text);
      return {};
    };

    let resolver;
    let settingsPromise = new Promise(r => {
      resolver = r;
    });

    let settings = null;

    let wait = async () => { await settingsPromise; };
    loadSettings().then(s => {
      settings = s;
      resolver(true);
    });

    let setFlush = async (k, v) => {
      if (!settings) { await wait(); }
      settings[k] = v;
      await fs.mkdirs(dir);
      await fs.fileWriteText(dir + 'settings.json', JSON.stringify(settings));
    };
    let getStringSync = k => settings[k] || '';
    let getBooleanSync = k => !!settings[k];
    return Object.freeze({
      wait,
      invalidate: async () => { settings = await loadSettings(); },
      getString: async k => { await wait(); return getStringSync(k); },
      getStringSync,
      setString: async (k, v) => setFlush(k, v),
      getBoolean: async k => { await wait(); return getBooleanSync(k); },
      getBooleanSync,
      setBoolean: async (k, v) => setFlush(k, !!v),
    });
  };

  return Object.freeze({
    getScope,
  });
};
