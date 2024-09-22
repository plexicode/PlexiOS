const PlexiFS = (() => {

  let now = () => new Date().getTime() / 1000;
  let pause = async (sec) => new Promise(r => setTimeout(() => r(true), Math.floor(Math.max(0, sec * 1000 + .5))));

  let throttle = (fn, timeout) => {
    let queued = false;
    return () => {
      if (queued) return;
      queued = true;
      let delayMillis = Math.floor(1000 * timeout);
      setTimeout(
        () => { queued = false; fn(); },
        delayMillis);
    };
  };

  let letters = 'abcdefghijklmnopqrstuvwxyz';
  let b64 = (letters.toUpperCase() + letters + '0123456789+/').split('');
  let b64Lookup = {};
  b64.forEach((c, i) => { b64Lookup[c] = i; });

  let bytesToBase64 = bytes => {
    let pairs = [];
    let b;
    for (let i = 0; i < bytes.length; i++) {
      b = bytes[i];
      pairs.push((b >> 6) & 3, (b >> 4) & 3, (b >> 2) & 3, b & 3);
    }
    while (pairs.length % 3 !== 0) pairs.push(0);
    let sb = '';
    for (let i = 0; i < pairs.length; i += 3) {
      b = (pairs[i] << 4) | (pairs[i + 1] << 2) | pairs[i + 2];
      sb += b64[b];
    }
    while (sb.length % 4 !== 0) sb += '=';
    return sb;
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

  let base64ToLength = b64 => {
    let equals = 0;
    if (b64.length > 0 && b64[b64.length - 1] === '=') equals++;
    if (b64.length > 1 && b64[b64.length - 2] === '=') equals++;
    let bits = (b64.length - equals) * 6;
    let bytes = Math.floor(bits / 8);
    return bytes;
  };

  let gbc = [...b64];
  gbc.pop();
  gbc.pop();
  let generateGibberish = sz => {
    let s = '';
    while (sz --> 0) s += gbc[Math.floor(Math.random() * gbc.length)];
    return s;
  };

  let sendJsonPost = async (url, payload) => {
    let res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'appiclation/json',
      },
      body: JSON.stringify(payload),
    });
    return await res.json();
  };

  let sendApiPost = async (authToken, apiUrl, payload) => {
    return sendJsonPost(apiUrl, { auth: authToken, ...payload });
  };

  let apiSenderPerAuthAndApi = {};

  let getSenderBucket = (authToken, apiUrl) => {
    let key = JSON.stringify([authToken, apiUrl]);
    if (!apiSenderPerAuthAndApi[key]) {
      apiSenderPerAuthAndApi[key] = {
        volumes: {},
        blobsByString: {},
        blobsByBase64: {},
      };
    }
    return apiSenderPerAuthAndApi[key];
  };

  let getVolumeBucket = (authToken, apiUrl, volId) => {
    let bucket = getSenderBucket(authToken, apiUrl);
    let volumeBucket = bucket.volumes[volId];
    if (!volumeBucket) {
      volumeBucket = { id: volId, reads: [], mutates: [] };
      bucket.volumes[volId] = volumeBucket;
    }
    return bucket.volumes[volId];
  };

  let addMutateCommand = (authToken, apiUrl, volId, command) => {
    getVolumeBucket(authToken, apiUrl, volId).mutates.push({ payload: command });
    setTimeout(() => tryFlush(authToken, apiUrl), 8000);
  };

  let sendReadAction = async (authToken, apiUrl, volId, command, priority) => {
    let resolver;
    let promise = new Promise(r => { resolver = r; });
    getVolumeBucket(authToken, apiUrl, volId).reads.push({ payload: { ...command }, resolver });
    setTimeout(() => tryFlush(authToken, apiUrl), priority ? 50 : 8000);
    return promise;
  };

  let tryFlush = async (authToken, apiUrl) => {
    // TODO: check throttling
    doFlush(authToken, apiUrl);
  }

  let doFlush = async (authToken, apiUrl) => {
    let senderBucket = getSenderBucket(authToken, apiUrl);
    let { volumes, blobsByString, blobsByBase64 } = senderBucket;
    senderBucket.volumes = [];
    senderBucket.blobsByString = {};
    senderBucket.blobsByBase64 = {};
    let transitResolver;
    senderBucket.transitPromise = new Promise(r => { transitResolver = r; });

    let request = {
      blobs: [],
      volumes: [],
    };

    let index = 0;
    for (let blob of Object.values(blobsByString)) {
      request.blobs.push({ type: 'TEXT', value: blob.data });
      blob.index = index++;
    }
    for (let blob of Object.values(blobsByBase64)) {
      request.blobs.push({ type: 'BINARY', value: blob.data });
      blob.index = index++;
    }
    let resolverByTag = {};
    let resolversByVolumeId = {};
    let tagAlloc = 1;
    for (let volume of Object.values(volumes)) {
      let actions = [];
      request.volumes.push({
        id: volume.id,
        actions: actions,
      });
      for (let command of [...volume.mutates, ...volume.reads]) {
        let { payload, resolver } = command;
        if (resolver) {
          if (payload.action === 'LATEST') {
            resolversByVolumeId[volume.id] = { resolver, next: resolversByVolumeId[volume.id] };
          } else {
            let tag = tagAlloc++;
            payload = { ...payload, tag };
            resolverByTag[tag] = resolver;
          }
        };
        actions.push(payload);
      }
    }

    let response = await sendApiPost(authToken, apiUrl, swapTempRefForBlobIndex(request));

    if (!response.ok) throw new Error(JSON.stringify(response));
    for (let volumeRes of response.volumes) {
      let { id, ver, steps } = volumeRes;
      for (let resNode = resolversByVolumeId[id]; !!resNode; resNode = resNode.next) {
        resNode.resolver({ ver, initSteps: steps });
      }
    }

    senderBucket.transitPromise = null;
    transitResolver(true);
  };

  let swapTempRefForBlobIndex = data => {
    if (typeof data === 'object') {
      if (Array.isArray(data)) return data.map(swapTempRefForBlobIndex);
      let output = {};
      for (let k of Object.keys(data)) {
        if (k === 'TEMP_REF') {
          output.blobIndex = data[k].index;
        } else {
          output[k] = swapTempRefForBlobIndex(data[k]);
        }
      }
      return output;
    }
    return data;
  };

  let addBlobToLookupAndGetRef = (lookup, blob, size, isBinary) => {
    if (!lookup[blob]) {
      lookup[blob] = { data: blob, size, isBinary };
    }
    return lookup[blob];
  };
  let addStringBlob = (authToken, apiUrl, str) => {
    let lookup = getSenderBucket(authToken, apiUrl).blobsByString;
    str += '';
    let size = new TextEncoder().encode(str).length;
    return addBlobToLookupAndGetRef(lookup, str, size, false);
  };
  let addBinaryBlob = (authToken, apiUrl, byteBuf) => {
    return addBase64Blob(authToken, apiUrl, bytesToBase64(byteBuf), byteBuf.length);
  };
  let addBase64Blob = (authToken, apiUrl, b64Str, sz = null) => {
    let lookup = getSenderBucket(authToken, apiUrl).blobsByBase64;
    let size = sz || base64ToLength(b64Str);
    return addBlobToLookupAndGetRef(lookup, b64Str, size, true);
  };

  let createNode = (name, isDir, parent) => {
    let node = { name, isDir, parent };
    if (isDir) {
      node.children = {};
    } else {
      node.content = {};
      node.isLoaded = false;
      node.size = 0;
      node.cacheObj = {};
      node.locKeys = {}; // local storage only
    }
    return node;
  };

  let init = (type, volId, authToken, apiUrl) => {
    let onReady;
    let readyPromise = new Promise(res => { onReady = res; });

    let version = null;
    let lastSync = 0;

    let root = createNode('', true, null);

    let isMem = type === 'MEM';
    let isSync = type === 'SYNC';
    let isLocal = type === 'LOCAL';

    let syncPromise = null;

    if (isSync) {
      pause(0.001).then(async () => {
        await performRemoteSync(true);
        onReady(true);
      });
    } else if (isLocal) {
      apiUrl = '##LOCAL##';
      authToken = '';
    }

    let getSyncVerVerifyDelay = important => {
      if (isLocal) return important ? 2 : 5;
      if (isSync) return important ? 5 : 15;
      return 1;
    };

    let ensureReasonablyUpToDate = async (itsImportant) => {

      if (isMem) return;

      if (syncPromise) {
        await syncPromise;
        return;
      }

      let delay = getSyncVerVerifyDelay(itsImportant);
      if (now() - lastSync > delay) {
        if (isLocal) {
          performLocalStorageSync(true);
        } else if (isSync) {
          await performRemoteSync(true);
        }
      }
    };

    let handleSyncInitSteps = (steps) => {
      let unwrapString = raw => {
        if (raw[0] === '@') return atob(raw.substring(1));
        return raw;
      };
      let lines = steps.split('\n').map(line => line.trim()).map(line => {
        let parts = line.split(',');
        switch (parts[0]) {
          case '^':
            return { up: true };
          case 'D':
            return { dir: true, name: unwrapString(parts[1]) };
          case 'F':
            return { file: true, name: unwrapString(parts[1]), size: parseInt(parts[2]) || 0, hasIcon: parts[3] === 'ico' };
          default:
            return null;
        }
      }).filter(v => v);

      root.children = {};
      let cwd = root;
      for (let instr of lines) {
        if (instr.file) {
          let node = createNode(instr.name, false, cwd);
          cwd.children[instr.name] = node;
          node.size = instr.size;
        } else if (instr.dir) {
          let node = createNode(instr.name, true, cwd);
          cwd.children[instr.name] = node;
          cwd = node;
        } else if (instr.up) {
          cwd = cwd.parent;
        } else {
          throw new Error();
        }
      }
    };

    let localData = (() => {

      let tryParseJson = s => {
        if (s === null) return null;
        try {
          return JSON.parse(s);
        } catch (e) {
          return null;
        }
      };
      let LOC_RAW = {
        get: (k, defaultVal) => {
          let v = tryParseJson(localStorage.getItem(k));
          if (v === null) return defaultVal;
          return v;
        },
        set: (k, v) => {
          localStorage.setItem(k, JSON.stringify(v));
        },
        remove: (k) => {
          localStorage.removeItem(k);
        },
        list: () => {
          let sz = localStorage.length;
          let o = [];
          for (let i = 0; i < sz; i++) {
            o.push(localStorage.key(i));
          }
          return o;
        },
      };

      let key = null;
      let volInfo = null;
      let getKey = () => {
        if (key) return key;
        let vols = LOC_RAW.get('PLXFS_vols', []);
        while (vols.length & 1) vols.pop();
        for (let i = 0; i < vols.length; i += 2) {
          if (vols[i] === volId) return vols[i + 1];
        }
        key = generateGibberish(7);
        vols.push(volId, key);
        LOC_RAW.set('PLXFS_vol_' + key, { name: volId, key, size: 0, nextId: 1, versionId: generateGibberish(10) });
        LOC_RAW.set('PLXFS_vols', vols);
        return key;
      };
      let LOC = {
        updateVol: (size, optNextId) => {
          LOC_RAW.set(
            'PLXFS_vol_' + getKey(),
            {
              ...LOC.getVolInfo(),
              ...(optNextId ? { nextId: optNextId } : {}),
              ...{ size, versionId: generateGibberish(10) }
            });
        },
        getActualVolVersion: () => (LOC.getVolInfo(true) || {}).versionId || '',
        getVolInfo: (skipCache) => {
          if (!skipCache && volInfo) return volInfo;
          let k = 'PLXFS_vol_' + getKey();
          let v = LOC_RAW.get(k, null);
          if (v === null) { init(); v = LOC_RAW.get(k, null); }
          volInfo = v;
          return v;
        },
        getFileList: () => {
          let k = 'PLXFS_list_' + getKey();
          let v = LOC_RAW.get(k, null);
          if (v === null) { init(); v = LOC_RAW.get(k, []); }
          return v;
        },
        getFileContent: (id) => {
          let k = 'PLXFS_file_' + getKey() + '_' + id;
          let v = LOC_RAW.get(k, null);
          if (v === null) { LOC.getVolInfo(); v = LOC_RAW.get(k, null); }
          return v;
        },
      };

      let getKeyedFileContent = (keysToIds) => {
        let output = {};
        for (let k of Object.keys(keysToIds)) {
          let id = keysToIds[k]
          let v = LOC.getFileContent(id) || null;
          if (v && typeof v === 'object') {
            let isBinary = !!v.isBinary;
            let data = v.data;
            let size = base64ToLength(data);
            if (isBinary) size = Math.floor(size * 3 / 4);
            output[k] = { isBinary, data, size };
          }
        }
        return output;
      };

      let saveNodeContent = (node) => {

        let parts = [];
        let walker = node;
        while (walker) {
          parts.push(walker.name);
          walker = walker.parent;
        }

        let volInfo = LOC.getVolInfo(true);
        let path = parts.reverse().join('/');
        let fileList = LOC.getFileList();
        let oldIdHints = {};
        fileList = fileList.filter(item => {
          let [ itemPath, isDir, sz, oldKeys ] = item;
          if (itemPath !== path) {
            return true;
          }
          if (isDir) throw new Error(); // writing to directory is not allowed
          oldIdHints = oldKeys;
          return false;
        });

        let nextId = volInfo.nextId;
        let finalIds = {};

        for (let key of Object.keys(node.content)) {
          let blob = node.content[key];
          let newData = blob.data;
          let isBinary = blob.isBinary;
          let oldId = oldIdHints[key];
          let oldData = oldId ? LOC.getFileContent(oldId) : null;
          let id;
          if (!oldData || oldData.isBinary !== isBinary || oldData.data !== newData) {
            id = nextId++;
            LOC_RAW.set('PLXFS_file_' + getKey() + '_' + id, { isBinary, data: newData });
          } else {
            id = oldId;
          }
          finalIds[key] = id;
        }

        node.locKeys = finalIds;

        fileList.push([path, 0, node.size, finalIds]);
        saveFileList(fileList, nextId);
      };

      let saveFileList = (items, optNextId) => {
        let allPaths = {};
        allPaths['/'] = true;
        for (let item of items) {
          allPaths[item[0]] = item;
        }
        for (let i = 0; i < items.length; i++) {
          let t = items[i][0].split('/');
          t.pop();
          let parent = t.join('/') || '/';
          if (!allPaths[parent]) {
            let newItem = [parent, 1];
            allPaths[parent] = newItem;
            items.push(newItem);
          }
        }
        delete allPaths['/'];
        let newItemList = Object.values(allPaths);
        let volumeSize = newItemList.reduce((acc, item) => acc + (item[2] || 0), 0);
        LOC_RAW.set('PLXFS_list_' + getKey(), newItemList);
        LOC.updateVol(volumeSize, optNextId);
        version = localData.getLocVer();
      };

      let mkdir = node => {
        let pathParts = [];
        let walker = node;
        while (walker) {
          pathParts.push(walker.name);
          walker = walker.parent;
        }
        let fullPath = pathParts.reverse().join('/');
        let oldFileList = LOC.getFileList() || [];
        saveFileList([...oldFileList, [fullPath, 1]]);
      };

      let isSyncNecessary = () => !version || version !== LOC.getActualVolVersion();

      return {
        getFileList: () => LOC.getFileList(),
        getLocVer: () => LOC.getActualVolVersion(),
        getKeyedFileContent,
        saveNodeContent,
        mkdir,
        isSyncNecessary,
      };
    })();

    let performRemoteSync = async (important) => {
      let delay = important ? 5 : 15;
      if (now() - lastSync < delay) return;

      let { ver, initSteps } = await sendReadAction(authToken, apiUrl, volId, { action: 'LATEST' }, important);
      handleSyncInitSteps(initSteps);
      lastSync = now();
      version = ver;
      tickleRecursive('/');
    };

    let performLocalStorageSync = async (important) => {
      let delay = getSyncVerVerifyDelay(important);
      if (now() - lastSync < delay) return;

      if (!localData.isSyncNecessary()) return;

      let volItems = localData.getFileList();

      let files = [];
      let dirs = [];
      for (let volItem of volItems) {
        let [path, isDir, size, keys] = volItem;
        if (!isDir) {
          files.push({ path, size, keys });
        } else {
          dirs.push(path);
        }
      }
      let getParent = path => {
        if (path === '/') throw new Error();
        let t = path.split('/');
        t.pop();
        let walker = root;
        for (let i = 1; i < t.length; i++) {
          walker = walker.children[t[i]];
        }
        return walker;
      };
      dirs.sort((a, b) => a.length - b.length);
      let items = [...dirs.map(d => ({ path: d, isDir: true })), ...files];
      for (let item of items) {
        let name = item.path.split('/').pop();
        let parent = getParent(item.path);
        let node = createNode(name, item.isDir, parent);
        parent.children[name] = node;
        if (!item.isDir) {
          node.size = item.size;
          node.isLoaded = false;
          node.locKeys = item.keys;
        }
      }

      version = localData.getLocVer();
      lastSync = now();
      tickleRecursive('/');
    };

    let syncImpl = {
      MEM: () => {},
      LOCAL: performLocalStorageSync,
      SYNC: performRemoteSync,
    }[type];

    let trySync = async (important) => {
      if (syncPromise) return syncPromise;
      syncPromise = new Promise(async onComplete => {
        // imperceptible delay to help minimize race conditions in consumer code when toggling storage modes
        await pause(0.001);

        await Promise.resolve(syncImpl(important));
        syncPromise = null;
        onComplete(null);
      });
      return syncPromise;
    };

    let toCanonParts = (path, returnNullOnFailure) => {
      let parts = path.split('/');
      let builder = [];
      for (let part of parts) {
        if (part === '.' || part === '') { }
        else if (part === '..') {
          if (builder.length) builder.pop();
          else {
            if (returnNullOnFailure) return null;
            throw new Error("Invalid path: " + path);
          }
        } else {
          builder.push(part);
        }
      }
      return builder;
    };

    let toCanonPath = (path, returnNullOnFailure) => {
      let parts = toCanonParts(path, returnNullOnFailure);
      if (parts === null) return null;
      return parts.length ? '/' + parts.join('/') : '/';
    };

    let getNode = path => {
      let current = root;
      for (let part of toCanonParts(path)) {
        if (!current.isDir || !current.children[part]) return null;
        current = current.children[part];
      }
      if (isLocal && !current.isDir && !current.isLoaded) {
        current.content = localData.getKeyedFileContent(current.locKeys);
        current.isLoaded = true;
      }

      return current;
    };

    let list = async (path) => {
      await ensureReasonablyUpToDate();
      let node = getNode(path);
      if (!node || !node.isDir) return { ok: false };
      let items = Object.keys(node.children).sort().map(name => {
        let child = node.children[name];
        return { name, isDir: child.isDir, size: child.isDir ? 0 : child.size };
      });
      return { ok: true, items };
    };

    let writeBlob = (blobPayload, imageIsJpeg) => {
      if (blobPayload === false || blobPayload === null || blobPayload === undefined) {
        return { size: 0, data: '' };
      } else if (blobPayload instanceof HTMLCanvasElement) {
        let b64Str = blobPayload.toDataURL(imageIsJpeg ? 'image/png' : 'image/jpeg').split(',').pop();
        return addBase64Blob(authToken, apiUrl, b64Str);
      } else if (typeof blobPayload === 'object') {
        return addBinaryBlob(authToken, apiUrl, blobPayload);
      } else if (typeof blobPayload === 'string') {
        return addStringBlob(authToken, apiUrl, blobPayload);
      } else {
        throw new Error();
      }
    };

    let endsWithJpeg = name => {
      let parts = name.split('/').pop().split('.');
      if (parts.length < 2) return false;
      let ext = parts.pop().toLowerCase();
      return ext === 'jpg' || ext === 'jpeg';
    };

    let write = async (path, mainData, keyedData) => {
      let canonPath = toCanonPath(path);
      await ensureReasonablyUpToDate();
      let parent = getNode(canonPath + '/..');
      if (!parent || !parent.isDir) return false;
      let name = canonPath.split('/').pop();
      let isJpeg = endsWithJpeg(name);
      let mainBlob = writeBlob(mainData, isJpeg);
      let keyedBlobs = { '': mainBlob };
      let size = mainBlob.size;
      for (let key of Object.keys(keyedData || {})) {
        let blob = writeBlob(keyedData[key], false);
        if (blob) {
          keyedBlobs[key] = blob;
          size += blob.size;
        }
      }

      let node = createNode(name, false, parent);
      parent.children[name] = node;
      node.content = keyedBlobs;
      node.size = size;

      if (isLocal) {
        localData.saveNodeContent(node);
      }

      if (isSync) {
        addMutateCommand(
          authToken,
          apiUrl,
          volId,
          {
            action: 'WRITE',
            path,
            blobs: Object.keys(keyedBlobs).map(k => ({ key: k, TEMP_REF: keyedBlobs[k] })),
          });
      }

      tickleDirect(canonPath);

      return true;
    };

    let mkdir = async (path, recursive) => {
      await ensureReasonablyUpToDate();
      let node = mkdirImpl(path, recursive);
      if (isSync) {
        addMutateCommand(authToken, apiUrl, volId, {
          action: 'MKDIR',
          path,
        });
      }

      if (isLocal) localData.mkdir(node);
    };

    let mkdirImpl = (path, recursive) => {
      let canonPath = toCanonPath(path);
      if (canonPath === '/') return;
      let parent = getNode(canonPath + '/..');
      if (!parent || !parent.isDir) {
        if (!recursive) return null;
        parent = mkdirImpl(getParent(path), true);
      }
      let name = canonPath.split('/').pop();
      let existingChild = parent.children[name];
      if (existingChild && existingChild.isDir) return existingChild;
      let node = createNode(name, true, parent);
      parent.children[name] = node;
      tickleDirect(canonPath);
      return node;
    };

    let move = async (fromPath, toPath, isCopy) => {
      fromPath = toCanonPath(fromPath);
      toPath = toCanonPath(toPath);
      if (fromPath === '/' || toPath === '/') throw new Error("Moving root");
      let a = fromPath + '\n';
      let b = toPath + '\n';
      if (a.startsWith(b) || b.startsWith(a)) throw new Error("Nested move");
      let name = toPath.split('/').pop();

      await ensureReasonablyUpToDate();

      let fromNode = getNode(fromPath);
      if (!fromNode) throw new Error("From path does not exist");
      let node = { ...fromNode, name };
      if (node.content) node.content = { ...node.content };
      let toNode = getNode(toPath);
      if (toNode) throw new Error("Target already exists");
      let fromParent = fromNode.parent;
      let toParent = getNode(toPath + '/..');
      if (!isCopy) delete fromParent.children[fromNode.name];
      toParent.children[node.name] = node;

      tickleDirect(fromPath);
      tickleDirect(toPath);
      tickleRecursive(fromPath);
      tickleRecursive(toPath);

      if (isSync) {
        addMutateCommand(authToken, apiUrl, volId, {
          action: isCopy ? 'CP' : 'MV',
          fromPath,
          toPath,
        });
      }
    };

    let del = async (path, idempotent) => {
      path = toCanonPath(path);
      if (path === '/') throw new Error("Cannot delete root");
      await ensureReasonablyUpToDate();
      let node = getNode(path);
      if (!node) {
        if (idempotent) return;
        throw new Error("Path does not exist");
      }
      let parent = node.parent;
      if (!parent) throw new Error(); // should not happen
      delete parent.children[node.name];

      tickleDirect(parent, true);
      tickleRecursive(path);

      if (isSync) {
        addMutateCommand(authToken, apiUrl, volId, {
          action: 'DEL',
          path,
        });
      }
    };

    let calculateDirSize = node => {
      if (!node || !node.isDir) return 0;
      let q = [node];
      let size = 0;
      while (q.length) {
        let cur = q.pop();
        for (let child of Object.values(cur.children)) {
          if (child.isDir) q.push(child);
          else size += child.size;
        }
      }
      return size;
    };

    let read = async (path, metadataOnly, includeRecursiveSize) => {
      path = toCanonPath(path);
      await ensureReasonablyUpToDate();

      let node = getNode(path);
      if (!node) return null;

      if (node.isDir) {
        if (includeRecursiveSize) {
          return { isDir: true, size: calculateDirSize(node) };
        }
        return { isDir: true };
      }

      let { size, content } = node;
      let keyContent = {};
      for (let k of Object.keys(content)) {
        let { data, isBinary } = content[k];
        keyContent[k] = isBinary ? base64ToBytes(data) : data;
      }
      let mainContent = keyContent[''] || null;

      if (metadataOnly) {
        return { isDir: false, size };
      }

      return { isDir: false, size, content: mainContent, keyedContent: keyContent, cache: node.cacheObj };
    };

    let flushUpdates = async () => {
      await performRemoteSync(true);
    };

    let watcherIdAlloc = 1;
    let watcherById = {};
    let watchersByPath = {};

    let tickledWatcherIds = {};

    let tickleDirect = (path, skipParent) => {
      for (let w of (watchersByPath[path] || [])) {
        tickledWatcherIds[w.id] = w.id;
      }
      if (!skipParent) {
        let t = toCanonParts(path);
        if (t.length) {
          t.pop();
          let parent = '/' + t.join('/');
          tickleDirect(parent, true);
        }
      }
      queueTickleFlush();
    };

    let tickleRecursive = path => {
      let allPaths = Object.keys(watchersByPath);
      let affectedPaths;
      if (path === '/') {
        affectedPaths = allPaths;
      } else {
        let pathPlusDelim = path + '/';
        for (let aPath of allPaths) {
          if (aPath.startsWith(pathPlusDelim)) {
            affectedPaths.push(aPath);
          }
        }
      }
      queueTickleFlush();
    };

    let performTickles = () => {
      let ids = Object.values(tickledWatcherIds);
      if (!ids.length) return;
      tickledWatcherIds = {};
      let watchers = ids.map(id => watcherById[id]).filter(v => !!v);
      for (let watcher of watchers) {
        let stillNeeded = watcher.fn();
        if (!stillNeeded) {
          removeWatcher(watcher.id);
        }
      }
    };

    let queueTickleFlush = throttle(() => performTickles(), 0.005);

    let removeWatcher = id => {
      let watcher = watcherById[id];
      if (watcher) {
        delete watcherById[id];
        let path = watcher.path;
        let bucket = watchersByPath[path].filter(w => w.id !== id);
        watchersByPath[path] = bucket;
        if (!bucket.length) delete watchersByPath[path];
      }
    };

    let addWatcher = (path, fn) => {
      let id = watcherIdAlloc++;
      let watcher = {
        id,
        path: toCanonPath(path),
        fn,
      };
      watcherById[id] = watcher;
      let bucket = watchersByPath[watcher.path];
      if (!bucket) {
        bucket = [];
        watchersByPath[watcher.path] = bucket;
      }
      bucket.push(watcher);
      return id;
    };

    let probe = async (path) => {
      path = toCanonPath(path);
      await ensureReasonablyUpToDate();
      let node = getNode(path);
      if (!node) return { status: '' };
      if (node.isDir) return { status: 'DIR' };
      return { status: 'FILE', size: node.size };
    };

    let getAbsolutePath = (cwd, path) => {
      return toCanonPath(path.startsWith('/') ? path : (cwd || '/') + '/' + path);
    };
    let getParent = path => {
      let parts = toCanonParts(path);
      if (!parts.length) return null;
      parts.pop();
      return '/' + parts.join('/');
    };

    let listRecursive = async (path, options) => {
      let { useStructs, useAbsolutePaths } = options || {};
      await ensureReasonablyUpToDate();
      path = toCanonPath(path);
      let node = getNode(path);
      if (!node) return null;
      let output = [];
      let impl = (current, rel, abs) => {
        if (current.isDir) {
          for (let child of Object.values(current.children)) {
            let childRel = rel === '' ? child.name : (rel + '/' + child.name);
            let childAbs = abs === '/' ? ('/' + child.name) : (abs + '/' + child.name);
            impl(child, childRel, childAbs);
          }
        }
        if (useStructs) {
          output.push({ isDir: current.isDir, name: current.name, relative: rel, absolute: abs });
        } else {
          output.push(useAbsolutePaths ? abs : rel);
        }
      };
      impl(node, '', path);
      output.pop(); // don't include input path
      return useStructs
        ? output.sort((a, b) => a.absolute.localeCompare(b.absolute))
        : output.sort();
    };

    let getProperties = async (paths) => {
      await ensureReasonablyUpToDate();
      return paths.map(path => {
        let cPath = toCanonPath(path);
        let node = cPath ? getNode(path) : null;
        let name = cPath.split('/').pop();
        let t = name.split('.');
        let ext = t.length > 1 ? t.pop().toUpperCase() : null;
        if (!ext || !/^[A-Z0-9]+$/.test(ext)) ext = null;
        let data = { path: cPath, name, found: true };
        if (!node) return { ...data, found: false };
        if (node.isDir) return { ...data, isDir: true, memberCount: Object.keys(node.children).length };
        return { ...data, isDir: false, size: node.size, ext };
      });
    };

    return Object.freeze({
      isReady: async () => !isSync || readyPromise.then(() => true),
      flushUpdates,
      addWatcher,
      removeWatcher,

      copy: async (fromPath, toPath) => move(fromPath, toPath, true),
      del,
      dirExists: async (path) => (await probe(path)).status === 'DIR',
      fileExists: async (path) => (await probe(path)).status === 'FILE',
      getAbsolutePath,
      getBatchProperties: async paths => getProperties(paths),
      getFileProperties: async path => (await getProperties([path]))[0],
      getParent,
      list,
      listRecursive,
      mkdir: async (path) => mkdir(path, false),
      mkdirs: async (path) => mkdir(path, true),
      move: async (fromPath, toPath) => move(fromPath, toPath, false),
      pathExists: async (path) => (await probe(path)).status !== '',
      read: async (path, metadataOnly, calculateSizeRecursive) => read(path, metadataOnly, calculateSizeRecursive),
      write,
    });
  };

  let ensureExistsOnServer = async (auth, url, volId, optOptions) => {
    let options = optOptions || {};
    let payload = {
      ensureVolume: true,
      volumeId: volId,
      ttl: options.ttl || null,
    };
    let result = await sendApiPost(auth, url, payload);
    console.log(result);
    return { ok: true };
  };

  return Object.freeze({
    initializeInMemoryFs: () => init('MEM'),
    initializeSyncedFs: (id, auth, url) => init('SYNC', id, auth, url),
    initializeLocalStorageFs: (id) => init('LOCAL', id),

    ensureSyncVolumeExists: async (auth, url, id, options) => ensureExistsOnServer(auth, url, id, options),
  });

})();
