const Util = (() => {

  let loadImageUri = async (uri) => {
    return new Promise(res => {
      let loader = HtmlUtil.img();
      loader.addEventListener('load', () => {
        let canv = HtmlUtil.canvas();
        canv.width = loader.width;
        canv.height = loader.height;
        let drawCtx = canv.getContext('2d');
        drawCtx.drawImage(loader, 0, 0);
        res(canv);
      });
      loader.src = uri;
    });
  };

  let loadImageByteArray = async (arr) => {
    let b64 = bytesToBase64(arr);
    let uri = 'data:image/' + (b64.startsWith('iV') ? 'png' : 'jpeg') + ';base64,' + b64;
    return loadImageUri(uri);
  };

  let _loadDup = {};
  let loadScript = (path) => {
    // Put a 5-second throttle on this for identical paths.
    // Sometimes multiple virtual JS file IDs will be loaded at once that are
    // actually consolidated into the same physical file in the current deployment.
    // Terminal commands, for example.
    if (_loadDup[path]) return;
    _loadDup[path] = true;
    setTimeout(() => { _loadDup = {}; }, 5_000);

    let s = document.createElement('script');
    s.src = path;
    document.head.append(s);
  };

  let getTime = () => new Date().getTime() / 1000;

  let pause = async (seconds) => {
    return new Promise(res => {
      setTimeout(() => res(true), Math.floor(seconds * 1000 + .5));
    });
  };

  // TODO: this needs to go through the localization engine.
  let formatHrMin = (seconds, includeSec) => {
    let mins = Math.floor(seconds / 60);
    seconds -= mins * 60;
    let hrs = Math.floor(mins / 60);
    mins -= hrs * 60;
    let incHrs = !!hrs;
    let incMins = mins || (incHrs && seconds);
    let incSec = includeSec && (seconds || (!mins && !hrs));
    let pl = n => n === 1 ? '' : 's';
    return [
      incHrs ? (hrs + " hour" + pl(hrs)) : '',
      incMins ? (mins + " minute" + pl(mins)) : '',
      incSec ? (seconds + " second" + pl(seconds)) : '',
    ].filter(Util.identity).join(', ');
  };

  let sequentialAsyncForEach = async (arr, fn) => {
    for (let i = 0; i < arr.length; i++) {
      await Promise.resolve(fn(arr[i], i, arr));
    };
  };

  let letters = 'abcdefghijklmnopqrstuvwxyz';
  let idChars = letters + letters.toUpperCase() + '0123456789';
  let generateId = (size) => {
    let id = '';
    while (size--) {
      id += idChars.charAt(Math.floor(Math.random() * idChars.length));
    }
    return id;
  };

  let b64Alphabet = (letters.toUpperCase() + letters.toLowerCase() + '0123456789+/').split('');
  let b64Lookup = {};
  b64Alphabet.forEach((c, i) => { b64Lookup[c] = i; });

  let textToBase64 = txt => {
    let arr = new TextEncoder().encode(txt || '');
    return bytesToBase64(arr);
  };

  let textToBytes = txt => {
    return new TextEncoder().encode(txt || '');
  };

  let bytesToBase64 = arr => {
    let pairs = [];
    let len = arr.length;
    let b;
    for (let i = 0; i < len; i++) {
      b = arr[i];
      pairs.push((b >> 6) & 3, (b >> 4) & 3, (b >> 2) & 3, b & 3);
    }
    while (pairs.length % 3 != 0) pairs.push(0);
    let sb = [];
    let pairLen = pairs.length;
    for (let i = 0; i < pairLen; i += 3) {
      sb.push(b64Alphabet[(pairs[i] << 4) | (pairs[i + 1] << 2) | (pairs[i + 2])]);
    }
    while (sb.length % 4 != 0) sb.push('=');
    return sb.join('');
  };

  let base64ToBytes = b64 => {
    let pairs = [];
    let chars = b64.split('');
    while (chars.length && chars[chars.length - 1] === '=') chars.pop();
    let b;
    for (let c of chars) {
      b = b64Lookup[c] || 0;
      pairs.push((b >> 4) & 3, (b >> 2) & 3, b & 3);
    }
    while (pairs.length % 4) pairs.pop();
    let bytes = [];
    let len = pairs.length;

    for (let i = 0; i < len; i += 4) {
      bytes.push((pairs[i] << 6) | (pairs[i + 1] << 4) | (pairs[i + 2] << 2) | pairs[i + 3]);
    }
    return new Uint8Array(bytes);
  };

  let base64ToText = (b64) => {
    return new TextDecoder().decode(base64ToBytes(b64));
  };

  let tryParseJson = obj => {
    try {
      return JSON.parse(obj);
    } catch (e) {
      return null;
    }
  };

  let flattenArrayImpl = (a, builder) => {
    for (let item of a) {
      if (Array.isArray(item)) flattenArrayImpl(item, builder);
      else builder.push(item);
    }
  };
  let flattenArray = (...a) => {
    let builder = [];
    flattenArrayImpl(a, builder);
    return builder;
  };

  let getType = o => {
    if (o === null) return 'null';
    let t = typeof o;
    if (t === 'object') {
      if (Array.isArray(o)) return 'array';
      if (o instanceof HTMLElement) return 'element';
    } else if (t === 'number') {
      if (isNaN(o)) return 'NaN';
      if (!isFinite(o)) return 'infinity';
    }
    return t;
  };

  let isFunction = o => typeof o === 'function';
  let asFunction = o => typeof o === 'function' ? o : null;
  let fail = err => { throw new Error(err || 'FAILURE'); };

  let argInterceptor = (args, interceptThese) => {
    let htmlArgs = [];
    let intercepted = {};
    if (!Array.isArray(interceptThese)) throw new Error();
    let lookup = new Set(interceptThese);
    for (let arg of Util.flattenArray(args)) {
      let t = getType(arg);
      if (t === 'object') {
        let props = {};
        for (let k of Object.keys(arg)) {
          if (lookup.has(k)) {
            intercepted[k] = arg[k];
          } else {
            props[k] = arg[k];
          }
        }
        htmlArgs.push(props);
      } else {
        htmlArgs.push(arg);
      }
    }
    return { htmlArgs, props: intercepted };
  };

  let getCommonFileType = (path, bytes) => {
    if (bytes.length > 4) {
      let firstBytes = bytes[0] + ',' + bytes[1];
      let file = path.split('/').pop();
      let t = file.split('.');
      if (t.length > 1) {
        let ext = t.pop().toUpperCase();
        if (ext === 'PNG') {
          if (firstBytes === '137,80') return { type: 'image', format: 'PNG' };
        } else if (ext === 'JPEG' || ext === 'JPG') {
          if (firstBytes === '255,216') return { type: 'image', format: 'JPEG' };
        } else if (ext === 'BMP') {
          if (firstBytes === '66,77') return { type: 'image', format: 'BMP' };
        } else if (ext === 'GIF') {
          if (firstBytes === '71,73') return { type: 'image', format: 'GIF' };
        }
      }
    }
    return null;
  };

  let loadImageB64 = (b64) => {
    let uri = 'data:image/' + (b64.startsWith('iV') ? 'png' : 'jpeg') + ';base64,' + b64;
    return loadImageUri(uri);
  };

  let loadImageB64Lookup = async (lookup) => {
    let keys = Object.keys(lookup);
    let images = await Promise.all(keys.map(async k => {
      let b64 = lookup[k];
      return { name: k, b64, canvas: await loadImageB64(b64) };
    }));
    let o = {};
    for (let i = 0; i < keys.length; i++) {
      o[keys[i]] = images[i];
    }
    return Object.freeze(o);
  };

  let copyImage = (img, optPixelated) => {
    let canvas = HtmlUtil.canvas();
    canvas.width = img.width;
    canvas.height = img.height;
    let g = canvas.getContext('2d');
    if (optPixelated) {
      canvas.set({ imageRendering: 'pixelated' });
      g.imageSmoothingEnabled = false;
    }
    g.drawImage(img, 0, 0);
    return canvas;
  };

  let tasks = [];
  let runPromiseTask = (pr) => {
    tasks.push(pr);
  };

  let awaitPromiseTasks = async () => {
    while (tasks.length) {
      await Promise.resolve(tasks.pop());
    }
  };

  let range = n => {
    let a = [];
    while (n --> 0) a.push(a.length);
    return a;
  };

  let deepCopy = o => JSON.parse(JSON.stringify(o));

  let ensureNumber = n => {
    let t = typeof n;
    if (t !== 'number') {
      if (t === 'string') n = parseFloat(n);
      else return 0;
    }
    if (isNaN(n) || !isFinite(n)) return 0;
    return n;
  };

  let ensureInteger = n => {
    let t = typeof n;
    if (t === 'string') {
      n = n.trim();
      let num = parseInt(n);
      if (num + '' !== n) return 0; // do not allow spurious character trimming
      n = num;
    } else if (t !== 'number') return 0;
    if (isNaN(n) || !isFinite(n)) return 0;
    return Math.floor(n);
  };

  let ensurePositiveInteger = n => Math.max(0, ensureInteger(n));
  let ensureArray = arr => Array.isArray(arr) ? arr : [arr];
  let ensureString = s => {
    if (typeof s === 'string') return s;
    if (!s) return '';
    return s + '';
  };
  let ensureTrimmedString = s => ensureString(s).trim();

  let posMod = (n, d) => {
    let x = n % d;
    return x < 0 ? x + d : x;
  };

  let shuffle = (arr) => {
    for (let i = 0; i < arr.length; i++) {
      let j = Math.floor(Math.random() * arr.length);
      let t = arr[i];
      arr[i] = arr[j];
      arr[j] = t;
    }
    return arr;
  };

  let ensureRange = (v, a, b) => a > v ? a : b < v ? b : v;

  let ensureNumLen = (n, len) => {
    let t = `${n}`;
    while (t.length < len) t = '0' + t;
    return t;
  };

  let isNullish = v => v === null || v === undefined || isNaN(v);

  let createEventStopper = () => {
    let stop = false;
    return {
      isStopped: () => stop,
      buildEvent: () => Object.freeze({ preventDefault: () => { stop = true; } }),
    };
  };

  let ensureObject = o => {
    if (typeof o !== 'object') return {};
    if (!o) return {};
    if (Array.isArray(o)) return {};
    return o;
  };

  let replace = (s, a, b) => `${s}`.split(a).join(b);

  let identity = v => v;

  let blockTillFirstPromiseResolution = async (promises) => {
    return new Promise(res => {
      promises.forEach(p => {
        p.then(v => res(v));
      });
    });
  };

  let byteSizeToText = c => {
    for (let suffix of ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB']) {
      if (c < 1024 || suffix === 'EB') {
        if (suffix === 'Bytes' && c === 1) suffix = 'Byte';
        return Math.floor(100 * c) / 100 + ' ' + suffix;
      }
      c /= 1024;
    }
  };

  let parseArgs = (args) => {
    let ordered = [];
    let shortFlags = {};
    let longFlags = {};
    for (let i = 0; i < args.length; i++) {
      let arg = args[i];
      if (arg.startsWith('-')) {
        if (arg.startsWith('--')) {
          let parts = arg.substring(2).split('=');
          let name = parts[0];
          let value = parts.slice(1).join('=');
          longFlags[name] = value;
        } else {
          for (let j = 1; j < arg.length; j++) {
            shortFlags[arg[j]] = true;
          }
        }
      } else {
        ordered.push(arg);
      }
    }
    return { orderedArgs: ordered, flags: { ...shortFlags, ...longFlags } };
  };

  let isBeta = () => {
    let host = window.location.hostname;
    if (host === 'localhost') return true;
    let t = host.split('.');
    let tld = t.pop();
    let dom = t.pop();
    if (dom === 'plexi' && tld === 'io') {
      if (t.length && t.pop().startsWith('beta')) {
        return true;
      }
    }
    return false;
  };

  let getTermCmdSet = () => {
    return new Set('cat cd chmod cp echo grep head less ls mkdir more mv pwd rm rmdir set tail touch'.split(' '));
  };

  return Object.freeze({
    argInterceptor,
    asFunction,
    awaitPromiseTasks,
    base64ToBytes,
    base64ToText,
    blockTillFirstPromiseResolution,
    byteSizeToText,
    bytesToBase64,
    copyImage,
    createEventStopper,
    deepCopy,
    ensureArray,
    ensureInteger,
    ensureNumber,
    ensureNumLen,
    ensureObject,
    ensurePositiveInteger,
    ensureRange,
    ensureString,
    ensureTrimmedString,
    fail,
    flattenArray,
    formatHrMin,
    generateId,
    getCommonFileType,
    getTermCmdSet,
    getTime,
    getType,
    identity,
    isFunction,
    isNullish,
    loadImageByteArray,
    loadImageUri,
    loadImageB64,
    loadImageB64Lookup,
    loadScript,
    noop: () => {},
    parseArgs,
    pause,
    posMod,
    range,
    replace,
    runPromiseTask,
    sequentialAsyncForEach,
    shuffle,
    textToBase64,
    textToBytes,
    tryParseJson,
  });
})();
