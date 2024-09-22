const createSettingsManager = async (fs) => {

  const SETTING_PATH = '/system/config/settings.json';
  let fsRoot = fs.FsRoot;
  let settings = null;

  let save = async () => {
    await fsRoot.fileWriteText(SETTING_PATH, JSON.stringify(settings || {}));
  };

  let init = async () => {
    let d = await fsRoot.fileReadText(SETTING_PATH);
    if (!d.ok) {
      // TODO: ensure dir exists in FsHelper
      if (!await fsRoot.dirExists('/system/config')) {
        if (!await fsRoot.dirExists('/system')) {
          await fsRoot.mkdir('/system');
        }
        await fsRoot.mkdir('/system/config');
      }
      await fsRoot.fileWriteText(SETTING_PATH, '{}');
      d = { text: '{}' };
    }
    settings = Util.tryParseJson(d.text) || {};
    let keys = Object.keys(preInitSettings);
    if (keys.length) {
      for (let key of keys) {
        settings[key] = preInitSettings[key];
      }
      await save();
    }
  };

  let get = (setting, defaultValue) => {
    let output = settings[setting];
    if (output === undefined || output === null) {
      if (defaultValue === undefined) return null;
      return Util.deepCopy(defaultValue);
    }
    return Util.deepCopy(output);
  };
  let preInitSettings = {};
  let o = {
    init,
    preInitSet: (setting, value) => {
      preInitSettings[setting] = value;
    },
    setMultiple: async (newSettings) => {
        settings = { ...settings, ...Util.deepCopy(newSettings) };
        await save();
    },
    set: async (setting, value) => {
      settings[setting] = Util.deepCopy(value);
      await save();
    },
    get,
    getInt: (...a) => {
      let v = o.get(...a);
      if (typeof v !== 'number') v = parseInt(`${v}`);
      if (isNaN(v) || !isFinite(v)) v = 0;
      return v;
    },
    getBool: s => !!o.get(s, false),
    getString: (s, def) => `${o.get(s, def || '')}`,
  };

  return Object.freeze(o);
};
