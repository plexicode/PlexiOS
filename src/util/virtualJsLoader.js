let staticVirtualJsLoader = (() => {

  let locked = false;

  let createDefaultLoader = (category) => {
    return id => PlexiOS.Util.loadScript(`/${category}/${id}.js`);
  };

  let bareLoaders = {};
  let loaders = {};
  let loading = {};
  let loaded = {};

  let loadJavaScript = async (category, id) => {
    let k = getLoadKey(category, id);
    if (loaded[k]) return loaded[k];
    if (locked) throw new Error("JS loader is locked");

    let loader = loaders[category];
    if (!loader) {
      let bareLoader = bareLoaders[category] || createDefaultLoader(category);
      loader = async (id_) => {
        let k_ = getLoadKey(category, id_);
        if (loaded[k_]) return loaded[k_];
        let resolver;
        let promise = new Promise(r => { resolver = r; });
        loading[k_] = { promise, resolver };
        bareLoader(id_);
        return promise;
      };
      loaders[category] = loader;
    }
    return loader(id);
  };

  let registerJavaScriptLoader = (category, fn) => {
    bareLoaders[category] = (id) => fn(id);
  };

  let getLoadKey = (category, id) => category + ' ' + id;

  let registerJavaScript = (category, id, payload) => {
    if (locked) return;
    let k = getLoadKey(category, id);
    loaded[k] = payload;
    if (loading[k]) loading[k].resolver(payload);
  };

  let awaitAllJavaScriptLoaders = async () => {
    await Promise.all(Object.values(loading).map(t => t.promise));
  };

  return Object.freeze({
    loadJavaScript,
    registerJavaScriptLoader,
    registerJavaScript,
    awaitAllJavaScriptLoaders,
    lockJavaScriptLoader: () => { locked = true; },
  });
})();

let {
  loadJavaScript,
  awaitAllJavaScriptLoaders,
  registerJavaScriptLoader,
  registerJavaScript,
  lockJavaScriptLoader,
} = staticVirtualJsLoader;
