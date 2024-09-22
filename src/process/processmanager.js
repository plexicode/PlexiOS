let createProcessManager = (os) => {

  let processLookup = {};
  let nextPid = 1;
  let procman = {
    getProcess: (pid) => {
      return processLookup[pid] || null;
    },
    getProcessesByAppId: appId => {
      return Object.values(processLookup).filter(p => p.appId === appId);
    },
    awaitProcess: async (pid) => {
      let p = procman.getProcess(pid);
      if (p) await p.promise;
    },
    allocProc: async (path, optAppId) => {
      let execInfo = await os.FsRoot.getExecInfo(path);
      let icon = execInfo.isValid
        ? execInfo.icon
        : os.IconStore.getIconByPurpose('EXEC', true);
      let res;
      let proc = {
        pid: nextPid++,
        uiHandles: [],
        path,
        appId: optAppId || ('~' + path),
        icon,
        promise: new Promise(r => { res = r; }),
        ipcListeners: [],
      };
      proc.res = res;
      processLookup[proc.pid] = proc;
      return proc.pid;
    },
    addIpcListener: (pid, cb) => {
      let p = procman.getProcess(pid);
      if (p) p.ipcListeners.push(cb);
    },
    sendIpcMessage: (pid, msg) => {
      let p = procman.getProcess(pid);
      if (p) p.ipcListeners.forEach(f => f(msg));
    },
    registerUiHandle: (pid, obj) => {
      let p = processLookup[pid];
      if (!p) return;
      p.uiHandles.push(obj);
    },
    killProcess: (pid) => {
      let p = processLookup[pid];
      if (!p) return;
      let uiHandles = p.uiHandles.map(h => h.id);
      if (uiHandles.length) os.Shell.killWindows(uiHandles);
      os.FsRoot.removeWatchersByProcess(pid);
      delete processLookup[pid];
      p.res(true);
    },
    unregisterUiHandle: (pid, obj) => {
      let p = processLookup[pid];
      if (!p) return;
      p.uiHandles = p.uiHandles.filter(o => o !== obj);
    },
    getProcesses: (onlyUi) => {
      let output = Object.values(processLookup);
      if (onlyUi) output = output.filter(p => p.uiHandles.length);
      return output;
    },
    setTimeout: (pid, fn, millis, recur) => {
      let tick = () => {
        if (!procman.getProcess(pid)) return;
        fn();
        if (recur) setTimeout(tick, millis);
      };
      setTimeout(tick, millis);
    },
    setInterval: (pid, fn, millis) => {
      procman.setTimeout(pid, fn, millis, true);
    },
    pause: (pid, millis) => {
      return new Promise(res => {
        setTimeout(() => {
          res(!!procman.getProcess(pid));
        }, millis);
      });
    },
  };

  return Object.freeze(procman);
};
