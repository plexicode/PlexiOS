let createExecutionEngine = os => {

  let defaultPipes = {
    stdin: createPipe(),
    stdout: createPipe().setListener(t => console.log(t)),
    stderr: createPipe().setListener(t => console.error(t)),
  };

  let termLookup = Util.getTermCmdSet();

  let launchVirtualJavaScript = async (id, procInfo, args) => {
    if (termLookup.has(id.split('.').pop())) {
      await HtmlUtil.loadComponent('TerminalCommands');
    }
    let runnerFn = await staticVirtualJsLoader.loadJavaScript('app', id);
    await Promise.resolve(runnerFn(os, procInfo, args));
  };

  let launchPlexiScript = async (byteCode, procInfo, args) => {
    let [_, newPlexiRt] = await Promise.all([
      HtmlUtil.loadComponent('CommonScript_0_1_0'),
      HtmlUtil.loadComponent('PlexiScript_0_1_0'),
    ]);
    let plexiRt = newPlexiRt(os);
    if (typeof(byteCode) === 'string') {
      byteCode = Util.base64ToBytes(byteCode);
    }
    return getPlexiScriptBlockingPromise(plexiRt, byteCode, args, procInfo);
  };

  let getPlexiScriptBlockingPromise = async (plexiRt, byteCode, args, procInfo) => {
    let resolver;
    let p = new Promise(res => { resolver = res; });
    Util.pause(0).then(async () => {
      let pid = await procInfo.pid;
      let rtCtx = plexiRt.createRuntimeContext(byteCode, [...args], { procInfo: { ...procInfo, pid }, resolver });
      let mainTask = rtCtx.getMainTask();
      runPlexiTask(mainTask, resolver);
    });
    return p;
  };

  let runPlexiTask = async (task, resolver) => {
    let result = task.resume();
    while (true) {
      if (result.isSuccess()) return resolver(true);
      if (result.isError()) {
        console.error(result.getError()[0]);
        return resolver(false);
      }
      if (result.isSuspend()) return null;
      if (result.isTimedSleep()) {
        await Util.pause(result.getSleepAmountMillis() / 1000);
        result = task.resume();
      }
    }
  };

  let launchFileNonBlocking = (path, optArgs, optCwd, optPipes) => {
    let pipes = { ...defaultPipes, ...(optPipes || {}) };
    let env = os.EnvVars.snapshot();
    let cwd = optCwd || '/';
    let pid;
    let args = (optArgs || []).map(v => `${v}`);

    let procStartedResolver;
    let procStartedPromise = new Promise(r => { procStartedResolver = r; });

    let impl = async () => {

      let execInfo = await os.FsRoot.getExecInfo(path);
      if (!execInfo) throw new Error("not found");
      let { isValid, isPlx, isJs } = execInfo;
      if (!isValid) throw new Error("not an executable file");

      // TOO: allocProcess also reads the icon using execInfo. You should
      // pass it in with the icon information already fetched here.

      pid = os.ProcessManager.allocProc(path, '~' + path);
      let procInfo = { pid, cwd, env, ...pipes };

      let appPromise;
      if (isJs) {
        appPromise = launchVirtualJavaScript(execInfo.appId, procInfo, args);
      } else if (isPlx) {
        appPromise = launchPlexiScript(execInfo.byteCode, procInfo, args);
      } else {
        throw new Error("Not implemented");
      }

      // Wait for the app runner to finish OR if the process was artificially killed.
      await Util.blockTillFirstPromiseResolution([
        appPromise,
        os.ProcessManager.awaitProcess(pid),
      ]);

      // If the process finished naturally, we'll need to clean up the process manually.
      os.ProcessManager.killProcess(pid);
    };

    let procEndedPromise = impl().then(async () => {
      // For early-return errors, we need to make sure no one is blocked on
      // the start signal. No-op if already fired in normal circumstances.
      await procStartedResolver(true);
    });

    return {
      getPid: async () => {
        await procStartedPromise;
        return pid;
      },
      procEndedPromise,
      procStartedPromise,

      // TODO: these are the old names. Migrate them to the above more descriptive field names.
      startPromise: procStartedPromise,
      promise: procEndedPromise,
    };

  };

  let launchFile = async (path, optArgs, optCwd, optPipes) => {
    await launchFileNonBlocking(path, optArgs, optCwd, optPipes).procEndedPromise;
  };

  return Object.freeze({
    launchFile,
    launchFileNonBlocking,
  });
};
