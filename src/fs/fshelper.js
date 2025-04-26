let getFsHelper = (fs, wrapPath) => {

  // Text
  let isText = data => {
    if (!data || data.isDir) return false;
    if (typeof data.content !== 'string') return false;
    switch (data.keyedContent.type || '') {
      case 'IMG':
        return false;
    }
    return true;
  };
  let isEmptyFile = data => {
    if (!data || data.isDir) return false;
    let isEmptyFile = !data.content && data.size === 0 && !data.keyedContent.type;
    return !!isEmptyFile;
  };
  let fileReadText = async (path) => {
    let data = await fs.read(wrapPath(path), false);
    if (!data) return { ok: false, error: 'PATH_NOT_FOUND' };
    if (!isText(data)) {
      if (isEmptyFile(data)) return { ok: true, text: '' };
      return { ok: false, error: 'NON_TEXT_FILE' };
    }
    return { ok: true, text: data.content };
  };
  let NOT_JSON = { ok: false, error: 'NON_JSON_FILE' };
  let fileReadJson = async (path) => {
    let txt = await fileReadText(path);
    if (!txt.ok) {
      if (txt.error === 'NON_TEXT_FILE') return NOT_JSON;
      return { ok: false, error: 'PATH_NOT_FOUND' };
    }
    let data = Util.tryParseJson(txt.text);
    if (data) return { ok: true, data };
    return NOT_JSON;
  };
  let fileWriteText = async (path, text) => {
    let ok = await fs.write(wrapPath(path), text + '');
    if (!ok) return { ok: 'PARENT_NOT_DIRECTORY' };
    return { ok };
  };
  let fileCreateEmptyText = async (path) => fileWriteText(path, '');
  let text = {
    fileReadText,
    fileReadJson,
    fileWriteText,
    fileCreateEmptyText,
  };

  // Images
  let isCanvas = o => o && typeof o === 'object' && o instanceof HTMLCanvasElement;
  let isByteArray = o => o && typeof o === 'object' && o instanceof Uint8Array;
  let fileWriteImage = async (path, data, optMetadata) => {
    let keyedData = { ...data, type: 'IMG' };
    if (optMetadata) keyedData.metadata = JSON.stringify(optMetadata);
    await fs.write(wrapPath(path), null, keyedData);
  };
  let fileWriteImageByUrl = async (path, url, optMetadata) => {
    return fileWriteImage(path, { url }, optMetadata);
  };
  let fileWriteImageBase64 = async (path, base64, optMetadata) => {
    return fileWriteImage(path, { b64: base64 }, optMetadata);
  };
  let jpegExts = new Set('jpg jpeg jfif'.split(' '));
  let fileWriteImageCanvas = async (path, canvas, optMetadata) => {
    let isJpeg = jpegExts.has(path.split('.').pop().toLowerCase());
    let b64 = canvas.toDataURL(isJpeg ? 'image/jpeg' : 'image/png').split(',').pop();
    await fileWriteImageBase64(path, b64, optMetadata);
    let data = await fs.read(path);
    if (!data) return;
    data.cache[''] = canvas;
  };
  let fileGetDirectCanvasFromData = async (data, optKey) => {
    if (!data || data.isDir) return null;
    let key = optKey || '';
    if (isCanvas(data.cache[key])) return data.cache[key];
    let canvas = null;
    let arr = key ? data.keyedContent[key] : data.content;
    if (!isByteArray(arr) || arr.length < 4) {
      let url = key ? null : data.keyedContent.url;
      if (!url) return null;
      canvas = await Util.loadImageUri(url);
    } else {
      let isPng = arr[0] === 137 && arr[1] == 80 && arr[2] === 78 && arr[3] === 71;
      let isJpeg = arr[0] === 255 && arr[1] === 216 && arr[2] === 255 && arr[3] === 224;
      if (!isPng && !isJpeg) return null;
      canvas = await Util.loadImageByteArray(arr);
    }
    if (canvas) {
      data.cache[optKey] = canvas;
    }
    return canvas;
  };
  let fileReadImage = async (path, directRef) => {
    let data = await fs.read(wrapPath(path));
    if (!data) return { ok: false, error: 'PATH_NOT_FOUND' };
    let canvas = await fileGetDirectCanvasFromData(data, '');
    if (!canvas) return { ok: false, error: 'NON_IMAGE_FILE' };
    let img = directRef ? canvas : await Util.copyImage(canvas);
    let metadata = data.keyedContent.metadata;
    if (metadata) metadata = Util.tryParseJson(metadata);
    return { ok: true, img, metadata };
  };
  let images = {
    fileWriteImageByUrl,
    fileWriteImageBase64,
    fileWriteImageCanvas,
    fileReadImage,
  };

  let getVirtualJsInfo = async (path) => {
    let data = await fs.read(wrapPath(path));
    if (!data) return { ok: false, error: 'PATH_NOT_FOUND' };
    if (data.isDir || !data.keyedContent.vjs) return { isValid: false };
    let { id, category, arg } = Util.tryParseJson(data.keyedContent.vjs);
    if (!id || !category) return { isValid: false };
    if (!data.cache['']) {
      let vjsPayload = await staticVirtualJsLoader.loadJavaScript(category, id);
      data.cache[''] = vjsPayload;
    }
    return {
      isValid: true,
      category,
      id,
      arg,
      data: data.cache[''],
    };
  };
  let fileWriteVirtualJS = async (path, category, id, optArg) => {
    await fs.write(
      wrapPath(path),
      '',
      // TODO: include icon information
      { vjs: JSON.stringify({ category, id, arg: optArg }) });
  };
  let fileCreateExecJs = async (path, appId, name, iconB64, isStore) => {
    let category = isStore ? 'appSt' : 'app';
    let kd = { name, vjs: JSON.stringify({ category, id: appId }) };
    if (iconB64) kd.ico = Util.base64ToBytes(iconB64);
    await fs.write(wrapPath(path), '', kd);
  };

  // TODO: this is being called in three ways:
  // 1) Getting all the executable info
  // 2) Checking to just see if it's a valid executable
  // 3) Getting just the (possibly-cached) metadata
  // This should be reflected in the invocation so as to not do too much heavy
  // lifting per executable in, for example, a file browser window full of apps.
  let getExecInfo = async (path) => {
    let data = await fs.read(path);
    if (!data || data.isDir) return { isValid: false };
    let kc = data.keyedContent;

    let { vjs } = kc;
    if (vjs) {
      let icon = await fileGetDirectCanvasFromData(data, 'ico');
      vjs = vjs ? Util.tryParseJson(vjs) : null;
      if (vjs) {
        return {
          isJs: true,
          isStore: vjs.category === 'appSt',
          isValid: true,
          icon,
          appId: vjs.id,
          name: kc.name,
        };
      }
    }

    let plexiScriptInfo = getPlexiScriptExecInfo(kc);
    if (plexiScriptInfo) return plexiScriptInfo;

    return { isValid: false };
  };

  const PLEXI_HEADER = [...'PLXSCR'.split('').map(v => v.charCodeAt(0)), 0, 255];
  let getPlexiScriptExecInfo = kc => {

    let bytes = kc[''];
    if (!bytes || !(bytes instanceof Uint8Array) || bytes.length < 20) return null;
    for (let i = 0; i < PLEXI_HEADER.length; i++) {
      if (PLEXI_HEADER[i] !== bytes[i]) return null;
    }

    let id = kc.id || null;
    let name = kc.title || null;
    let icon = kc.icon || null;

    if (icon) {
      if (typeof icon === 'string') throw new Error('TODO: convert base64 to canvas');
      else if (typeof icon === 'object') {
        if (Array.isArray(icon)) throw new Error('TODO: convert byte array into canvas');
        else if (icon instanceof Uint8Array) throw new Error('TODO: convert bytes to canvas');
        else if (icon instanceof HTMLCanvasElement) {} // good to go
        else throw new Error('TODO: handle this type of icon format' );
      } else {
        throw new Error('TODO: handle this type of icon format');
      }
    }

    // TODO: parse out things from bytecode if not included in keyed content
    // and possibly cache them back into keyed content to allow faster loading next time.

    return {
      isPlx: true,
      isValid: true,
      icon,
      appId: id,
      byteCode: bytes,
      name: `${name || ''}` || "Untitled Application",
    };
  };

  let virtualJs = {
    // TODO: fix the capitalization consistency of JS vs Js when this refactoring is complete
    fileWriteVirtualJS,
    fileCreateExecJs,
    getVirtualJsInfo,
    getExecInfo,
  };

  // Plexi files
  let fileCreateExecPlexi = async (path, plexiPayload, isLib) => {
    let keyedData = {
      // TODO: icon
      plexidata: JSON.stringify(plexiPayload),
      lib: isLib ? '1' : '0',
    };
    await fs.write(wrapPath(path), '', keyedData);
  };
  let plexiExec = {
    fileCreateExecPlexi,
  };

  // Audio files
  let fileWriteAudioByUrl = async (path, url, optMetadata) => {
    let kd = { url };
    if (optMetadata) kd.metadata = JSON.stringify(optMetadata);
    await fs.write(wrapPath(path), '', kd);
  };
  let fileReadAudioOrUrl = async (path) => {
    let data = await fs.read(wrapPath(path));
    if (!data) return { ok: false, error: 'PATH_NOT_FOUND' };
    let kc = data.keyedContent;
    let metadata = kc.metadata ? Util.tryParseJson(kc.metadata) : null;
    if (kc.url) return { ok: true, type: 'url', url: kc.url, metadata };
    if (typeof data.content === 'object') return { ok: true, type: 'binary', bytes: data.content, metadata };
    return { ok: false, error: 'NON_AUDIO_FILE' };
  };
  let audio = {
    fileReadAudioOrUrl,
    fileWriteAudioByUrl,
  };

  // Raw Binary files
  let fileReadBinaryOrUrl = async (path) => {
    let data = await fs.read(wrapPath(path));
    if (!data) return { ok: false, error: 'PATH_NOT_FOUND' };
    let { url, metadata } = data.keyedContent;
    if (url) {
      return {
        ok: true,
        type: 'url',
        url,
        metadata: metadata ? Util.tryParseJson(metadata) : null
      };
    }
    if (isByteArray(data.content)) {
      return { ok: true, type: 'binary', bytes: data.content, metadata };
    }
    if (data.keyedContent && data.keyedContent.b64) {
      return { ok: true, type: 'binary', bytes: Util.base64ToBytes(data.keyedContent.b64), metadata };
    }
    if (typeof data.content === 'string') {
      return { ok: true, type: 'binary', bytes: Util.textToBytes(data.content), metadata };
    }
    if (isCanvas(data.cache[''])) {
      let b64 = data.cache[''].toDataURL().split(',').pop();
      return { ok: true, type: 'binary', bytes: Util.base64ToBytes(b64) };
    }
    return { ok: false, error: 'INVALID_FILE' };
  };
  let fileWriteBinaryByUrl = async (path, url, optMetadata) => {
    let kd = { url };
    if (optMetadata) kd.metadata = JSON.stringify(optMetadata);
    await fs.write(wrapPath(path), '', kd);
  };
  let fileReadBinaryForced = async (path, optUpdateInternalIfUrl) => {
    let data = await fileReadBinaryOrUrl(path);
    if (!data.ok) return data;

    if (data.ok && data.type === 'url') {
      let arrBuf = await fetch(data.url).then(res => res.arrayBuffer());
      // TODO: use optUpdateInternalIfUrl to cache the bytes into the file itself.
      return { ok: true, bytes: new Uint8Array(arrBuf), type: 'binary', metadata: data.metadata };
    }
    return data;
  };
  let fileWriteBinary = async (path, bytes, keyedData) => {
    if (!isByteArray(bytes)) throw new Error('INVALID_FILE_PAYLOAD');
    let ok = await fs.write(wrapPath(path), bytes, keyedData);
    if (!ok) return { ok: 'PARENT_NOT_DIRECTORY' };
    return { ok: true };
  };
  let binaryData = {
    fileReadBinaryForced,
    fileWriteBinary,
    fileReadBinaryOrUrl,
    fileWriteBinaryByUrl,
  };

  let throwForLegacy = x => () => { throw new Error("Legacy FS method: " + x); };
  let legacy = {
    // Need to assess if and how these are used.
    getNodeType: throwForLegacy('getNodeType'),
    getProps: throwForLegacy('getProps'),

    legacyList: async path => {
      let o = await fs.list(wrapPath(path));
      if (!o.ok) return [];
      return o.items.map(v => v.name);
    },
    join: (...args) => {
      let p = Util.flattenArray(args).join('/');
      if (p.startsWith('//')) return p.substring(1);
      return p;
    },
  };

  return {
    ...text,
    ...images,
    ...virtualJs,
    ...plexiExec,
    ...binaryData,
    ...audio,
    ...legacy,
  };
};
