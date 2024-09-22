let createPowerManager = () => {
  let properties = null;
  let watchers = [];

  let fireWatchers = async () => {
    let newWatchers = [];
    updateBattery(await navigator.getBattery());
    let status = Object.freeze({ ...properties });
    for (let watcher of watchers) {
      let { callback, isStillValid } = watcher;
      if (isStillValid()) {
        callback(status);
        newWatchers.push(watcher);
      }
    }
    watchers = newWatchers;
  };

  let updateBattery = b => {
    let percent = Math.floor(b.level * 100 + 0.5);
    let isPluggedIn = b.charging;
    let timeTill = isPluggedIn ? b.chargingTime : b.dischargingTime;

    properties = {
      percent,
      isPluggedIn,
      timeTill: !isFinite(timeTill) ? 0 : timeTill,
    };
  };

  let initRes = null;
  let initPr = null;

  let ensureInitialized = async () => {
    if (initPr) return initPr;
    initPr = new Promise(r => { initRes = r; });

    let bat = await navigator.getBattery();
    updateBattery(bat);
    [
      'charging',
      'chargingtime',
      'dischargingtime',
      'level'
    ].forEach(ev => bat.addEventListener(ev + 'change', fireWatchers));

    initRes(1);
    return initPr;
  };

  let getProperties = async () => ensureInitialized().then(() => Object.freeze({ ...properties }));

  let addWatcher = (callback, isStillValid) => {
    if (!isStillValid) throw new Error();
    watchers.push({ callback, isStillValid });
  };

  return Object.freeze({
    getProperties,
    addWatcher,
  });
};
