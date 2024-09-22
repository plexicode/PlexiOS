const createPlexiShell = (os) => {

  const DELAY_FOR_GIVING_WINDOW_FOCUS_ON_FILE_DRAG_HESITATE = 0.7; // seconds

  const { div, span } = HtmlUtil;

  let createBackground = () => div({ fullSize: true, backgroundColor: '#088' });
  let createDesktopHost = () => div({ position: 'absolute' });
  let createWinHost = () => div({ position: 'absolute', size: 0 });
  let createModalHost = () => div({ position: 'absolute', size: 0 });
  let createDragDropLayer = () => div(
    { fullSize: true, visibleBlock: false, userSelect: 'none' },
    div({ fullSize: true }),
    div({ fullSize: true }));

  let createAuthorizedHost = () => div({ fullSize: true, visibleBlock: true, overflow: 'hidden' });

  let windowList = [];
  let nextWinId = 1;

  let focusedWindow = null;
  let eventCounter = 0;

  let getWinOpacity = () => Util.ensureRange(os.Settings.getInt('windowOpacity', 100) / 100.0, 0, 1);
  let getWinShadowEnabled = () => !os.Settings.getBool('disableWindowOutlineShadows', false);

  let queuedTicks = [];
  let tickIdAlloc = 1;
  let shellSetTimeout = async (callback, timeoutMillis, isSysMaintenance) => {
    let resolver;
    let promise = new Promise(r => { resolver = r; });
    let id = tickIdAlloc++;
    let item = { time: Util.getTime() + timeoutMillis / 1000, id, callback, resolver, isSysMaintenance };
    queuedTicks.push(item);
    setTimeout(() => performRenderTick(id), Math.floor(timeoutMillis));
    return promise;
  };

  let performRenderTick = (forcedId) => {
    if (queuedTicks.length) {

      let now = Util.getTime();
      let q = [...queuedTicks];
      queuedTicks = [];
      for (let item of q) {
        if (item.id === forcedId || item.time < now) {
          Promise.resolve(item.callback()).then(v => item.resolver(v));
        } else {
          queuedTicks.push(item);
        }
      }
      ensureSysMaintenanceRunning();
    }
  };

  let ensureSysMaintenanceRunning = () => {
    if (!queuedTicks.some(item => item.isSysMaintenance)) {
      shellSetTimeout(doSysMaintenance, 1, true);
    }
  };

  let doSysMaintenance = () => {

    pollForScreenSaverInvocation();
    os.Themes.updateClock();
    sysResizeCheck();

    // Aspire to run the updater at 20 milliseconds after the second changes.
    // This ensures that the clock will appear to run in real time and avoids any problems
    // if the maintenance cycle happened to start at nearly exactly on the second change
    // where the time would appear to skip or stop.
    let now = Util.getTime();
    let fraction = now % 1;
    let delay = 0.02 - fraction;
    if (delay < 0) delay = 1.02 - fraction;

    shellSetTimeout(doSysMaintenance, Math.floor(1000 * delay), true);
  };

  let refreshWindowVisualSettings = () => {
    let winOpacity = getWinOpacity();
    let shadow = getWinShadowEnabled();
    windowList.forEach(w => {
      w.outerFrame.set({ opacity: `${winOpacity}` });
      w.outerFrame.set({ shadow });
    });
  };

  let giveProcessFocus = (pid) => {
    let proc = os.ProcessManager.getProcess(pid);
    if (!proc || !proc.uiHandles.length) return;
    let winData = proc.uiHandles[proc.uiHandles.length - 1];
    giveWindowFocus(winData);
  };

  let isWindowInList = wd => {
    for (let e of windowList) {
      if (e === wd) return true;
    }
    return false;
  };

  let getTopZPriority = () => {
    let m = 0;
    for (let wd of windowList) {
      m = Math.max(wd.zPriority, m);
    }
    return m + 1;
  };

  let winDepthCheck = (depth, win) => {
    if (depth[win.id]) return depth[win.id];
    if (!win.parent) throw new Error();
    let v = winDepthCheck(depth, win.parent) + 1;
    depth[win.id] = v;
    return v;;
  };

  let sortWindows = () => {
    let windowById = {};

    for (let win of windowList) {
      let id = win.id;
      windowById[id] = win;
    }

    let ultimateParentByWinId = {};
    for (let win of windowList) {
      let id = win.id;
      let walker = win;
      while (walker.parent) {
        walker = walker.parent;
      }
      ultimateParentByWinId[id] = walker;
    }

    let bucketLookup = {};
    for (let win of windowList) {
      let bucketId = ultimateParentByWinId[win.id].id;
      if (!bucketLookup[bucketId]) {
        bucketLookup[bucketId] = {
          wins: [],
          id: bucketId,
          z: windowById[bucketId].zPriority,
        };
      }
      bucketLookup[bucketId].wins.push(win);
    }

    let buckets = Object.values(bucketLookup);
    buckets.sort((a, b) => a.z - b.z);

    for (let bucket of buckets) {
      let depthByWinId = {};
      depthByWinId[bucket.id] = 1;
      for (let w of bucket.wins) {
        winDepthCheck(depthByWinId, w);
      }
      let sortedWins = [...bucket.wins];
      sortedWins.sort((a, b) => (depthByWinId[a.id] - depthByWinId[b.id]));
      bucket.sortedWindows = sortedWins;
    }

    let allWins = [];
    for (let bucket of buckets) {
      allWins.push(...bucket.sortedWindows);
    }

    for (let i = 0; i < allWins.length; i++) {
      allWins[i].outerFrame.set({ z: i })
    }
  };

  let giveWindowFocus = (winData) => {
    if (!winData || focusedWindow === winData || !isWindowInList(winData)) return;

    focusedWindow = winData;
    winData.zPriority = getTopZPriority();

    sortWindows();

    invalidateTaskbar();
    if (focusedWindow.transform.target === 'MINIMIZE') {
      focusedWindow.setTransform(focusedWindow.isMaximized ? 'MAXIMIZE' : 'NORMAL');
    }
    winData.onFocused();
  };

  let removeWindow = (winData) => {
    ui.winHost.removeChild(winData.outerFrame);
    windowList = windowList.filter(w => w.id !== winData.id);
    os.ProcessManager.unregisterUiHandle(winData.pid, winData);
    if (focusedWindow === winData) {
      focusedWindow = null;
      invalidateTaskbar();
    }
  };

  let defaultX = 20;
  let defaultY = 20;

  let showWindow = async (pid, options) => {

    let onCloseResolver;
    let lifetime = new Promise(res => { onCloseResolver = res; });

    let winOpacity = getWinOpacity();
    let outerFrame = div(winOpacity === 1 ? null : { opacity: `${winOpacity}` });
    let contentHost = div();
    let menuBuilder = options.menuBuilder;
    let menuBar = null;
    if (menuBuilder) {
      menuBar = div();
      outerFrame.append(menuBar);
    }

    outerFrame.append(contentHost);
    let parent = options.parentWindow || null;
    if (parent) {
      if (pid && parent.pid !== pid) throw new Error();
      pid = parent.pid;
    }
    let process = os.ProcessManager.getProcess(pid);
    if (!process && !pid) throw new Error();
    let title = '';
    let lastResizeFire = '';
    let winData = {
      getTitle: () => title,
      setTitle: (t) => { if (title !== t) { title = `${t}`; winData.themeDataCache.titleBar.innerText = title; } },
      pid,
      parent,
      icon: Util.copyImage(options.icon || (process ? process.icon : null) || os.IconStore.getIconByPurpose('EXEC')),
      outerFrame,
      contentHost,
      id: nextWinId++,
      zPriority: getTopZPriority(),
      menuBuilder,
      menuBar,
      mode: options.isFullScreen // NORMAL | MAXIMIZED | MINIMIZED | FULLSCREEN | MANAGED
        ? 'FULLSCREEN'
        : options.managedFrame
          ? 'MANAGED'
          : 'NORMAL',
      onClosing: options.onClosing || (() => {}),
      onClosed: options.onClosed || (() => {}),
      closeHandler: async () => {
        if (await Promise.resolve(winData.onClosing())) return false; // allow program to intercept close event
        removeWindow(winData);
        if (winData.parent) {
          inputMask.enableWindow(winData.parent);
          giveWindowFocus(winData.parent);
        }
        onCloseResolver(true);
        winData.onClosed();
        let proc = os.ProcessManager.getProcess(pid);
        if (proc && options.destroyProcessUponClose) {
          os.ProcessManager.killProcess(pid);
        }
        invalidateTaskbar();
        return true;
      },
      minimizeHandler: () => setTransform('MINIMIZE'),
      maximizeHandler: () => setTransform(winData.isMaximized ? 'NORMAL' : 'MAXIMIZE'),
      downloadHandler: () => { console.log("Download pushed"); },
      onResize: () => {
        if (!options.onResize) return;
        let r = winData.contentHost.getBoundingClientRect();
        let w = Math.floor(r.width);
        let h = Math.floor(r.height);
        let k = `${w}:${h}`;
        if (k === lastResizeFire) return;
        lastResizeFire = k;
        options.onResize(w, h);
      },
      setInteriorSize: (w, h) => {
        if (winData.isMaximized || winData.mode === 'FULLSCREEN' || winData.mode === 'MANAGED') return;
        let { margin, menubar, titlebar } = os.Themes.getChromePadding();
        let outerWidth = w + margin * 2;
        let outerHeight = h + (winData.menuBar ? menubar : 0) + titlebar + margin * 2;
        winData.setWindowBounds(outerWidth, outerHeight);
      },
      isClosed: false,
      openOrder: eventCounter++,
      sendKeyEvent: (jsEvent, isDown) => {
        if (isDown && winData.shortcutKeyRouter.handle(jsEvent)) return;

        if (options.onKeyDown && isDown) {
          options.onKeyDown(jsEvent);
        } else if (options.onKeyUp && !isDown) {
          options.onKeyUp(jsEvent);
        } else if (options.onKey) {
          options.onKey(jsEvent, isDown);
        } else if (winData.focusedElement && winData.focusedElement.onShellKey) {
          winData.focusedElement.onShellKey(jsEvent, isDown);
        }
      },
      focus: () => giveWindowFocus(winData),
      onFocused: () => { if (options.onFocused) options.onFocused() },
      themeDataCache: {},
      isMaximized: false,
      transform: {
        target: 'NORMAL',
        progress: 1,
        oldTarget: 'NORMAL',
        regularBounds: [0, 0, 100, 100],
        maximizedBoundsApplied: false,
      },
      setTransform: null,
      chromeBtns: {
        maximize: !options.hideMaximize,
        minimize: true,
        download: false,
      },
      resizeEnabled: !options.disableResize,
      shortcutKeyRouter: createShortcutKeyHandler(),
    };

    windowList.push(winData);
    ui.winHost.append(outerFrame);
    outerFrame.PX_WINDATA = winData;

    let isTransforming = false;
    let setTransform = async (type) => {
      let tfm = winData.transform;
      if (tfm.target === type) return;

      if (type === 'MAXIMIZE') winData.isMaximized = true;
      if (type === 'NORMAL') winData.isMaximized = false;
      if (type === 'MINIMIZE' && focusedWindow === winData) focusedWindow = null;

      tfm.oldTarget = tfm.target;
      tfm.target = type;
      tfm.progress = 0;

      if (!isTransforming) {
        isTransforming = true;
        await performTransform(winData);
        isTransforming = false;
      }

      os.Themes.applyThemedChromeToWindow(winData);
    };
    winData.setTransform = setTransform;
    winData.getActualBounds = () => {
      let winRect = outerFrame.getBoundingClientRect();
      let hostRect = getDesktopBounds(winData.mode === 'FULLSCREEN');
      let r = {
        x: winRect.left - hostRect.left,
        y: winRect.top - hostRect.top,
        width: winRect.width,
        height: winRect.height,
      };
      r.right = r.x + r.width;
      r.bottom = r.y + r.height;
      return r;
    };
    winData.getInteriorSize = () => {
      let r = contentHost.getBoundingClientRect();
      return { width: r.width, height: r.height };
    };

    winData.setWindowBounds = (optWidth, optHeight, optX, optY, optSkipOnResize) => {
      if (winData.transform.target === 'MINIMIZE') return;
      let outerFrame = winData.outerFrame;
      let oldBounds = outerFrame.getBoundingClientRect();
      let desktopBounds = getDesktopBounds(winData.mode === 'FULLSCREEN');
      let winHostBounds = ui.winHost.getBoundingClientRect();
      let oldWidth = oldBounds.width;
      let oldHeight = oldBounds.height;
      let oldLeft = oldBounds.left;
      let oldTop = oldBounds.top;
      let newLeft = Util.isNullish(optX) ? oldLeft : (desktopBounds.left + optX);
      let newTop = Util.isNullish(optY) ? oldTop : (desktopBounds.top + optY);
      let newWidth = Util.isNullish(optWidth) ? oldWidth : optWidth;
      let newHeight = Util.isNullish(optHeight) ? oldHeight : optHeight;

      // Aspire to be larger than this.
      if (newWidth < 140) newWidth = 140;
      if (newHeight < 80) newHeight = 80;

      // Don't allow the window to be bigger than the allocated area.
      if (newWidth > desktopBounds.width) newWidth = desktopBounds.width;
      if (newHeight > desktopBounds.height) newHeight = desktopBounds.height;

      // Don't let the title bar hide
      const toleranceMargin = 20;
      if (newTop < desktopBounds.top) newTop = desktopBounds.top;
      if (newTop > desktopBounds.bottom - toleranceMargin) newTop = desktopBounds.bottom - toleranceMargin;
      if (newLeft > desktopBounds.right - toleranceMargin) newLeft = desktopBounds.right - toleranceMargin;
      if (newLeft + newWidth < desktopBounds.left + toleranceMargin) newLeft = desktopBounds.left - newWidth + toleranceMargin;

      let sizeChanged = newWidth !== oldWidth || newHeight !== oldHeight;

      let x = newLeft - desktopBounds.left;
      let y = newTop - desktopBounds.top;
      let width = newWidth;
      let height = newHeight;

      let adjustedLeft = x + (desktopBounds.left - winHostBounds.left);
      let adjustedTop = y + (desktopBounds.top - winHostBounds.top);
      outerFrame.set({ width, height, left: adjustedLeft, top: adjustedTop });
      if (!winData.transform.maximizedBoundsApplied) {
        winData.transform.regularBounds = [x, y, width, height];
      }

      if (sizeChanged && !optSkipOnResize) {
        winData.onResize();
      }
    };

    let chromePadding = os.Themes.getChromePadding();
    let width = options.width || (options.innerWidth ? (options.innerWidth + chromePadding.margin * 2) : 400);
    let height = options.height || (options.innerHeight ? (options.innerHeight + chromePadding.margin * 2 + (menuBuilder ? chromePadding.menubar : 0) + chromePadding.titlebar) : 300);
    let x = options.x || defaultX;
    let y = options.y || defaultY;
    defaultX += 20;
    defaultY += 20;
    if (defaultX > 200) defaultX = 20;
    if (defaultY > 200) defaultY = 20;
    let scrSz = getSize();

    if (x + width > scrSz.width) x = scrSz.width - width;
    if (y + height > scrSz.height) y = scrSz.height - height;
    if (x < 0) x = 0;
    if (y < 0) y = 0;

    if (winData.mode === 'FULLSCREEN' || winData.mode === 'MANAGED') {
      winData.setWindowBounds(scrSz.width, scrSz.height, 0, 0, true);
      if (winData.mode === 'MANAGED') {
        winData.outerFrame.set({ pointerEvents: 'none' });
      }
    } else {
      winData.setWindowBounds(width, height, x, y, true);
    }
    os.Themes.applyThemedChromeToWindow(winData);
    winData.setTitle(options.title);
    (options.onInit || (() => {}))(contentHost, winData);

    if (process) process.uiHandles.push(winData);
    ['mousedown', 'touchstart', 'pointerdown'].forEach(ev => {
      outerFrame.addEventListener(ev, e => {
        if (winData.transform.target !== 'MINIMIZE') {
          e.stopPropagation();
          giveWindowFocus(winData);
        }
      });
    });
    if (winData.parent) {
      inputMask.disableWindow(winData.parent);
    }
    setTimeout(() => {
      giveWindowFocus(winData);
      let f = options.onShown;
      if (f) f();
    }, 0);
    invalidateTaskbar();
    return lifetime;
  };

  let getDesktopBounds = (fullScreen) => {
    let boundEl = fullScreen ? ui.authorizedHost : ui.desktop.firstChild;
    return boundEl.getBoundingClientRect();
  };

  let getBoundsForTransformState = (winData, state) => {
    let rect = null;
    switch (state) {
      case 'MAXIMIZE':
        rect = getDesktopBounds(false);
        let winHostRect = ui.winHost.getBoundingClientRect();
        return [rect.left + winHostRect.left - rect.left, rect.top + winHostRect.top - rect.top, rect.width, rect.height];

      case 'NORMAL':
      return winData.transform.regularBounds;

      case 'MINIMIZE':
        rect = getSize();
        // TODO: find its tile in the taskbar. For now, just shrink to an inspecific point in the bottom of the screen.
        return [rect.width / 3 - 4, rect.height - 8, 8, 8];
      default: return [0, 0, 100, 100];
    }
  };

  let performTransform = async (winData) => {
    const FPS = 60;
    const DURATION = 0.2;
    const EPSILON = 0.000001;
    let frames = Math.max(1, Math.floor(DURATION * FPS));
    let progPerFrame = 1.0 / frames + EPSILON;
    let tfm = winData.transform;
    while (tfm.progress < 1) {
      await Util.pause(1 / FPS);
      tfm.progress = Math.min(1, tfm.progress + progPerFrame);
      let prog = tfm.progress;
      let invProg = 1 - prog;
      let oldBounds = getBoundsForTransformState(winData, tfm.oldTarget);
      let newBounds = getBoundsForTransformState(winData, tfm.target);
      let desiredBounds = Util.range(4).map(i => Math.floor(oldBounds[i] * invProg + newBounds[i] * prog));
      let actualBounds = tfm.maximizedBoundsApplied
        ? getBoundsForTransformState(winData, 'MAXIMIZE')
        : winData.transform.regularBounds;

      let scaleX = 1;
      let scaleY = 1;
      let transX = 0;
      let transY = 0;
      if (actualBounds[2] !== 0) scaleX = desiredBounds[2] / actualBounds[2];
      if (actualBounds[3] !== 0) scaleY = desiredBounds[3] / actualBounds[3];
      transX = Math.floor(desiredBounds[0] - actualBounds[0]);
      transY = Math.floor(desiredBounds[1] - actualBounds[1]);

      winData.outerFrame.set({
        visibleBlock: true,
        transform: `translateX(${transX}px) translateY(${transY}px) scaleX(${scaleX}) scaleY(${scaleY})`,
        transformOrigin: 'top left',
      });
    }

    let clearTransform = { transform: '', transformOrigin: '' };
    switch (tfm.target) {
      case 'MAXIMIZE':
      case 'NORMAL':
        let useMaxBounds = tfm.target === 'MAXIMIZE';
        if (tfm.maximizedBoundsApplied !== useMaxBounds) {
          let b = useMaxBounds ? getBoundsForTransformState(winData, 'MAXIMIZE') : tfm.regularBounds;
          tfm.maximizedBoundsApplied = useMaxBounds;
          winData.setWindowBounds(b[2], b[3], b[0], b[1]);
        }
        winData.outerFrame.set(clearTransform);
        winData.onResize();
        break;

      case 'MINIMIZE':
        winData.outerFrame.set(clearTransform, { display: 'none' });
        break;

      default: break;
    }
  };

  let getInputMask = winData => Array.from(winData.outerFrame.children).filter(e => e.PX_INPUT_MASK)[0] || null;
  let inputMask = {
    disableWindow: winData => {
      if (!getInputMask(winData)) {
        let im = div({ fullSize: true, userSelect: 'none' });
        im.PX_INPUT_MASK = true;
        winData.outerFrame.set(im);
        let ae = document.activeElement;
        if (ae && HtmlUtil.childIsDescendentOf(ae, winData.outerFrame)) {
          ae.blur();
        }
      }
    },
    enableWindow: winData => {
      let im = getInputMask(winData);
      if (im) winData.outerFrame.removeChild(im);
    },
  };

  let killWindows = ids => {
    let idLookup = new Set(ids);
    let frames = [];
    let newWinList = [];
    for (let w of windowList) {
      if (focusedWindow === w) focusedWindow = null;
      if (idLookup.has(w.id)) {
        frames.push(w.outerFrame);
        let proc = os.ProcessManager.getProcess(w.pid);
        if (proc) {
          proc.uiHandles = proc.uiHandles.filter(h => h.id !== w.id);
        }
      } else {
        newWinList.push(w);

      }
    }
    windowList = newWinList;
    frames.forEach(f => ui.winHost.removeChild(f));

    invalidateTaskbar();
  };

  let getWindowHandles = () => [...windowList];

  let initialized = false;
  let ui = null;

  let hostId = 'PX_' + Util.generateId(30);

  let init = async (uiHost, optionalTheme) => {
    if (initialized) return;
    initialized = true;

    ui = {
      host: uiHost,
      taskbar: div(),
      bg: createBackground(),
      desktop: createDesktopHost(),
      winHost: createWinHost(),
      modalHost: createModalHost(),
      dragDropLayer: createDragDropLayer(),
      authorizedHost: createAuthorizedHost(),
    };

    let tickleScreensaver = () => { timeOfLastInput = Util.getTime(); };
    ui.authorizedHost.addEventListener('contextmenu', e => e.preventDefault());
    // ui.host.addEventListener('drop', e => { e.preventDefault(); });
    ui.host.addEventListener('drop', e => {
      e.preventDefault();
      performExternalFileDragEvent(e, 'drop');
    }, true);
    ui.host.addEventListener('dragenter', e => {
      e.preventDefault();
      performExternalFileDragEvent(e, 'start');
    }, true);
    ui.host.addEventListener('dragleave', e => {
      if (e.fromElement && HtmlUtil.childIsDescendentOf(e.fromElement, ui.host)) return;
      if (activeDrag) performExternalFileDragEvent(e, 'end', true);
    }, true);
    ui.host.addEventListener('dragover', e => {
      e.preventDefault();
      tickleScreensaver();
      performExternalFileDragEvent(e, 'move');
    }, true);

    ui.authorizedHost.addEventListener('pointerdown', tickleScreensaver);
    ui.authorizedHost.addEventListener('pointermove', tickleScreensaver);

    uiHost.classList.add(hostId);
    let s = uiHost.style;
    s.overflow = 'hidden';
    s.fontFamily = '"Arial", sans-serif',
    HtmlUtil.clear(uiHost).append(
      ui.authorizedHost.set(
        ui.bg.set({ z: 1 }),
        ui.desktop.set({ z: 2 }),
        ui.winHost.set({ z: 3 }),
        ui.taskbar.set({ z: 4 }),
        ui.modalHost.set({ z: 5 }),
        ui.dragDropLayer.set({ z: 6 })
      ).set({ z: 1 }));

    // Load the theme
    let themeId = 'io.plexi.theme.default';
    if (optionalTheme) {
      let themeInfo = await os.FsRoot.getVirtualJsInfo(optionalTheme || '/system/themes/Plexi Default.theme');
      if (!themeInfo.isValid || themeInfo.category !== 'theme') {
        throw new Error("Invalid initial theme.");
      }
      themeId = themeInfo.id;
    }
    await os.Themes.setActiveTheme(themeId);

    let bg = os.Settings.get('shellBg');
    if (bg) await setBackground(bg);

    doSysMaintenance();
  };

  let getTaskbarHost = () => ui.taskbar;

  let taskbarFingerprint = '';
  let invalidateTaskbar = async () => {
    let hideTaskbar = !!(focusedWindow && focusedWindow.mode === 'FULLSCREEN');
    let isHidden = ui.taskbar.style.display === 'none';
    if (hideTaskbar !== isHidden) {
      taskbarFingerprint = 'INVALID';
      ui.taskbar.set({ visibleBlock: !hideTaskbar });
      if (hideTaskbar) return;
    }
    let fp = os.Shell.Taskbar.getTaskbarStateFingerprint();
    if (fp !== taskbarFingerprint) {
      taskbarFingerprint = fp;
      await os.Themes.redrawTaskbar()
    }
  };

  let getFocusedWindowPid = () => focusedWindow ? focusedWindow.pid : 0;
  let getFocusedWindow = () => {
    if (focusedWindow) return { winId: focusedWindow.id, pid: focusedWindow.pid };
    return null;
  };

  let screenSaverPid = null;
  let timeOfLastInput = Util.getTime();
  let registerProcIdAsScreenSaver = pid => {

    // Kill all previous screensavers.
    os.ProcessManager.getProcessesByAppId('io.plexi.tools.screensaver').forEach(p => {
      if (p.pid !== pid) os.ProcessManager.killProcess(p.pid);
    });

    screenSaverPid = pid;
  };
  let terminateScreenSaver = () => {
    if (screenSaverPid) {
      os.ProcessManager.killProcess(screenSaverPid);
      screenSaverPid = null;
    }
    timeOfLastInput = Util.getTime();
  };
  let pollForScreenSaverInvocation = () => {
    if (screenSaverPid && !os.ProcessManager.getProcess(screenSaverPid)) {
      screenSaverPid = null;
    }
    let screenSaverTimeout = os.Settings.getInt('screenSaverTimeout', 120);
    let screenSaverPath = os.Settings.getString('screenSaverPath', '');
    if (!screenSaverPid && screenSaverTimeout && screenSaverPath && Util.getTime() - timeOfLastInput > screenSaverTimeout) {

      // Race condition: if there are multiple polls before the screensaver pid
      // is registered, then multiple screensavers can launch. Set the time of last
      // input to now to prevent this condition from being true in the next poll.
      timeOfLastInput = Util.getTime();

      os.ExecutionEngine.launchFile('/system/tools/screensaver', [screenSaverPath]);
    }
  };

  let keyListener = (ev, isDown) => {
    if (isDown) terminateScreenSaver();

    if (focusedWindow) {
      focusedWindow.sendKeyEvent(ev, isDown);
    } else if (ui.desktopIcons) {
      ui.desktopIcons.onShellKey(ev, isDown);
    }
  };

  let getWindowIndex = winData => {
    let windows = Array.from(ui.winHost.children);
    for (let i = 0; i < windows.length; i++) {
      if (winData.outerFrame === windows[i]) return i;
    }
    return -1;
  };

  let dropPriority = {
    DESKTOP: 1,
    TASKBAR: 2,
    WINDOW: 3,
    MODAL: 4,
  };
  let getDropZone = (ev) => {
    let mx = ev.pageX;
    let my = ev.pageY;
    let dropReceivers = document.querySelectorAll(`.${hostId} .PX_FILE_DROP_RECV`);
    let atCursor = Array.from(dropReceivers).filter(dr => {
      let bcr = dr.getBoundingClientRect();
      return mx >= bcr.left && mx <= bcr.right && my >= bcr.top && my <= bcr.bottom;
    });
    let candidates = atCursor.map(e => {
      let z = getZoneInfo(e);
      if (!z) return { element: e, zone: '?' };
      let output = z;
      if (output.zone === 'WINDOW') return { ...z, winOrder: getWindowIndex(z.winData) };
      return output;
    });

    if (!candidates.length) return null;

    candidates.sort((a, b) => {
      let pri1 = dropPriority[a.zone] || 999;
      let pri2 = dropPriority[b.zone] || 999;
      if (pri1 !== pri2) return pri1 - pri2;
      if (a.zone === 'WINDOW') return a.winOrder - b.winOrder;
      return 0;
    });

    let candidate = candidates.pop();
    // TODO: check if candidate is obscured by a window, taskbar, or modal.

    return candidate;
  };

  let getZoneInfo = e => {
    let walker = e;
    let prev = null;
    while (walker && walker !== ui.host) {
      if (walker === ui.winHost && prev) {
        let winData = prev.PX_WINDATA;
        return { element: e, zone: 'WINDOW', winData };
      } else if (walker === ui.modalHost && prev) {
        return { element: e, zone: 'MODAL', modal: prev };
      } else if (walker === ui.desktop) {
        return { element: e, zone: 'DESKTOP' };
      } else if (walker === ui.taskbar) {
        return { element: e, zone: 'TASKBAR' };
      }
      prev = walker;
      walker = walker.parentElement;
    }
    return null;
  };

  let activeDrag = null;

  let FileDrag = Object.freeze({
    start: (ev, files) => {
      if (!files.length) return;
      activeDrag = { files, isInternal: true };
      commonFileDragStart(ev, activeDrag);
    },
    move: (ev) => {
      if (activeDrag) {
        commonFileDragMove(ev, activeDrag);
      }
    },
    release: (ev) => {
      if (activeDrag) {
        commonFileDragEnd(ev, true, activeDrag); // all internal drag releases are commits
        activeDrag = null;
      }
    },
  });

  let commonFileDragStart = (ev, drag) => {
    let dropZone = getDropZone(ev);
    drag.element = dropZone ? dropZone.element : null;
    drag.hoverSince = Util.getTime();
    let originalIcon = drag.files[0].icon || os.IconStore.getIconByPurpose('FILE');
    let ghostIcon = Util.copyImage(originalIcon).set({ size: 32 });
    let label = drag.files.length > 1 ? (drag.files.length + " Items") : drag.files[0].name;
    drag.ghostWidget = div(
      { position: 'absolute', size: 80, bold: true, opacity: 0.5, textAlign: 'center', pointerEvents: 'none' },
      ghostIcon,
      div(div(label, { padding: 4, fontSize: 9, display: 'inline-block', color: '#fff', backgroundColor: '#008' })));
    ui.dragDropLayer.set({ display: 'block', pointerEvents: 'none', userSelect: 'none' }).firstChild.clear().set(
      drag.ghostWidget
    );
    commonFileUpdateGhostWidget(ev, drag);
  };

  let commonFileUpdateGhostWidget = (ev, drag) => {
    if (drag.ghostWidget) {
      let bcr = ui.dragDropLayer.getBoundingClientRect();
      let x = ev.pageX - bcr.left;
      let y = ev.pageY - bcr.top;
      drag.ghostWidget.set({ left: x - 40, top: y - 40 });
    }
  };

  let commonFileDragMove = (ev, drag) => {
    commonFileUpdateGhostWidget(ev, drag);
    let dropZone = getDropZone(ev);
    let element = dropZone ? dropZone.element : null;
    if (drag.element !== element) {
      drag.element = element;
      drag.hoverSince = Util.getTime();
      drag.firedHoverHesitate = false;
    }

    if (element &&
        !drag.firedHoverHesitate &&
        Util.getTime() - activeDrag.hoverSince > DELAY_FOR_GIVING_WINDOW_FOCUS_ON_FILE_DRAG_HESITATE) {
      activeDrag.firedHoverHesitate = true;
      if (dropZone.zone === 'WINDOW') {
        giveWindowFocus(dropZone.winData);
      }
    }
  };

  let commonFileDragEnd = (ev, isCommit, drag) => {
    let dropZone = getDropZone(ev);
    if (isCommit && dropZone && dropZone.element) {
      dropZone.element._PX_ON_DRAG_DROP(drag.files, 'drop', ev);
    }
    ui.dragDropLayer.set({ display: 'none' }).firstChild.clear();
  };

  let getExternalFiles = (ev, isPreview) => {
    let files;
    if (ev.dataTransfer.items) {
      files = Array.from(ev.dataTransfer.items).map(item => {
        if (item.kind === 'file') {
          if (isPreview) return { };
          return item.getAsFile();
        }
      });
    } else {
      files = Array.from(ev.dataTransfer.files)
    }

    return files.filter(Util.identity).map(file => {
      if (isPreview) return { name: "Upload File" };

      let output = { name: file.name, size: file.size, isExternal: true };
      output.isText = file.type.split('/')[0] === 'text'
      if (output.isText) {
        output.text = file.text();
      } else {
        output.bytes = file.arrayBuffer();
      }
      return output;
    });
  };

  let performExternalFileDragEvent = async (ev, type, allowDefault) => {
    if (!allowDefault) ev.preventDefault();

    switch (type) {
      case 'end':
        if (activeDrag) {
          commonFileDragEnd(ev, false, activeDrag);
          activeDrag = null;
        }
        break;

      case 'start':
        let files = getExternalFiles(ev, true);
        if (files.length) {
          activeDrag = { files, externalData: ev };
          commonFileDragStart(ev, activeDrag);
        }
        break;

      case 'move':
        if (activeDrag) {
          activeDrag.externalData = ev;
          commonFileDragMove(ev, activeDrag);
        }
        break;

      case 'drop':
        if (activeDrag) {
          activeDrag.files = getExternalFiles(ev);
          activeDrag.externalData = ev;
          commonFileDragEnd(ev, true, activeDrag);
          activeDrag = null;
        }
        break;
    }
  };

  let dirInv = (() => {
    let lu = { n: 'south', s: 'north', w: 'east', e: 'west' };
    return d => lu[d[0].toLowerCase()];
  })();

  let updateUsableDesktopBounds = () => {
    let tbParams = os.Themes.getTaskbarParams();

    let area = {};
    area[dirInv(tbParams.dock) + 'StretchDock'] = tbParams.thickness;

    let desktopIcons = HtmlUtil.Components.IconBrowser({
      os,
      getDir: () => '/home/desktop',
      bgTransparent: true,
      highContrastText: true,
      defaultLayoutMode: 'ARRANGE',
      fullSize: true,
      fileContextMenuExtBuilder: (idChain, _, isDirInterior) => {
        let mb = os.Shell.MenuBuilder;
        switch (idChain.join(':')) {
          case '': return isDirInterior ? [mb.createMenuSep(), mb.createMenuItem('bgchange', "Change Background")] : null;
          case 'bgchange': return mb.createCommand(() => { os.ExecutionEngine.launchFile('/system/tools/settings', ['BACKGROUND']); });
        }
      },
    });
    os.FsRoot.addWatcher('/home/desktop', -1, () => desktopIcons.refresh());
    ui.desktopIcons = desktopIcons;
    ui.desktop.clear().set(
      { width: '', height: '', top: '', left: '', bottom: '', right: '' }, // explicit reset of bounds
      area,
      desktopIcons,
    );
  };

  let setBackground = async (path) => {
    let { ok, img } = await os.FsRoot.fileReadImage(path, true);
    if (!ok) return;
    os.Settings.set('shellBg', path);
    ui.bg.set({
      backgroundImage: 'url("' + img.toDataURL() + '")',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    });
  };

  let onCurrentModalDismiss = null;

  let setModal = async (e) => {
    let wrapper = div(e, { fullSize: true });
    wrapper.addEventListener('pointerdown', () => clearModal());
    ui.modalHost.clear().set({ fullSize: true }).append(wrapper);

    // clicking the modal should not clear it.
    e.addEventListener('pointerdown', e => {
      e.stopPropagation();
    });

    return new Promise(r => { onCurrentModalDismiss = r; });
  };

  let clearModal = () => {
    ui.modalHost.clear().set({ size: 0 });
    if (onCurrentModalDismiss) {
      onCurrentModalDismiss(true);
      onCurrentModalDismiss = null;
    }
  };

  let pushModal = (e) => {
    throw new Error();
  };

  let createLocalizedSpan = (...args) => {
    let getContent = () => {};
    args = args.filter(a => {
      if (typeof a !== 'function') return true;
      getContent = a;
    });
    let e = HtmlUtil.span(args);
    e.classList.add('PLEXI_LOC_CHANGE_SUBSCRIBER');
    e.PLEXI_onLocUpdate = async lang => {
      let c = getContent(lang);
      if (typeof c === 'string') e.clear().set(c);
      else e.clear().set(await Promise.resolve(c));
    };
    e.PLEXI_onLocUpdate(os.Localization.getLanguage());
    return e;
  };

  let onLocaleChange = () => {
    let lang = os.Localization.getLanguage();
    let tickles = Array.from(document.querySelectorAll('.' + hostId + ' .PLEXI_LOC_CHANGE_SUBSCRIBER'));
    for (let i = 0; i < tickles.length; i++) {
      tickles[i].PLEXI_onLocUpdate(lang);
    }
  };

  let openModalAtMouseEvent = (ev, el) => {
    let r = getBounds();
    let x = Math.floor(ev.pageX - r.left);
    let y = Math.floor(ev.pageY - r.top);

    os.Shell.setModal(el.set({ position: 'absolute', left: x, top: y }));

    let pos = el.getBoundingClientRect();
    if (pos.top < r.top) el.set({ top: 0 });
    else if (pos.bottom > r.bottom) el.set({ top: r.height - pos.height});
    if (pos.left < r.left) el.set({ left: 0 });
    else if (pos.right > r.right) el.set({ left: r.width - pos.width });
  };

  let getBounds = () => {
    return ui.authorizedHost.getBoundingClientRect();
  };

  let buildRootMenuElement;

  let updateWindowMenu = (winData) => {
    if (!winData.menuBar) return;
    buildRootMenuElement(winData.menuBuilder, false).then(menu => {
      winData.menuBar.firstChild.clear().set(menu);
    });
  };

  let MenuBuilder = (() => {

    buildRootMenuElement = async (idChainToMenuFactory, isVertical) => {
      let idChain = [];
      let topLevelMenu = await generateMenuForIdChain(idChainToMenuFactory, idChain);
      return buildMenuDivs(
        topLevelMenu,
        idChainToMenuFactory, idChain, true, isVertical);
    };

    let generateMenuForIdChain = async (idChainToMenuFactory, idChain) => {
      let menu = await Promise.resolve(idChainToMenuFactory(idChain));
      if (!menu) return null;
      if (menu.isCommand) return menu;
      if (!menu._PX_IS_MENU) return null;
      for (let item of menu.items || []) {
        if (item.isSep) continue;
        idChain.push(item.id);
        let itemChildren = await generateMenuForIdChain(idChainToMenuFactory, idChain);
        idChain.pop();
        if (itemChildren && !itemChildren.isCommand) {
          item.hasChildren = true;
        }
      }
      return menu;
    };

    let isMac = navigator.platform.indexOf("Mac") === 0;

    let renderShortcut = sc => {
      let sb = [];
      sc = sc.map(t => t === 'CTRL_CMD' ? isMac ? 'CMD' : 'CTRL' : t);
      for (let i = 0; i < sc.length; i++) {
        if (i > 0) sb.push(span({ opacity: 0.5 }, ' + '));
        switch (sc[i]) {
          case 'CMD': sb.push(span({ html: '&#8984;' })); break;
          case 'CTRL': sb.push("Ctrl"); break;
          case 'SHIFT': sb.push("Shift"); break;
          case 'ALT': sb.push("Alt"); break;
          default: sb.push(sc[i]); break;
        }
      }
      return span({ whiteSpace: 'nowrap' }, sb);
    };

    let buildMenuDivs = (menu, idChainToMenuFactory, idChain, isRoot, isVertical) => {
      let isHorizontal = !isVertical;
      let ctxMenuStyles = os.Themes.getContextMenuStyles();

      if (menu._PX_TYPE !== 'MENU') return [div("INVALID")];

      let anyIcons = menu.items.filter(item => item.icon).length;

      let divList = menu.items.map(item => {
        if (item.isSep && isHorizontal) return null;
        if (item.isSep) return div(ctxMenuStyles.sep);
        if (item._PX_TYPE !== 'ITEM') return div("INVALID");
        let label = item.label;

        let el = div(
          item.icon
            ? item.icon.set({ size: 16, marginRight: 8 })
            : anyIcons
              ? div({ display: 'inline-block', width: 24 })
              : null,
          label,
          { cursor: 'pointer', whiteSpace: 'nowrap' },
          isHorizontal
            ? { display: 'inline-block', marginRight: 12 }
            : { margin: 4 },
          isVertical ? ctxMenuStyles.itemVertical : ctxMenuStyles.itemHorizontal,
          item.shortcut ? renderShortcut(item.shortcut).set({ marginLeft: 10, opacity: 0.7 }) : null,
        );
        el.addEventListener(isVertical ? 'pointerup' : 'pointerdown', async (e) => {
          e.preventDefault();
          e.stopPropagation();
          let nextIdChain = [...idChain, item.id];
          if (item.hasChildren) {
            let subMenu = await generateMenuForIdChain(idChainToMenuFactory, nextIdChain);
            let subDivs = buildMenuDivs(subMenu, idChainToMenuFactory, nextIdChain, false, true);
            let bcr = el.getBoundingClientRect();
            let origin;
            if (isRoot) {
              origin = [bcr.left, bcr.bottom];
              os.Shell.clearModal();
            } else {
              origin = [bcr.right, bcr.top];
              throw new Error(); // Not implemented
            }
            os.Shell.setModal(subDivs.set({ left: origin[0], top: origin[1] }));
          } else {
            let cmd = await generateMenuForIdChain(idChainToMenuFactory, nextIdChain);
            if (!cmd || !cmd.isCommand) throw new Error("Invalid menu ID", nextIdChain.join(' '));
            cmd.handler();
            os.Shell.clearModal();
          }
        });
        el.addEventListener('mouseenter', () => {
          el.set(isVertical ? ctxMenuStyles.itemVerticalHover : ctxMenuStyles.itemHorizontalHover);
        });
        el.addEventListener('mouseleave', () => {
          el.set(isVertical ? ctxMenuStyles.itemVertical : ctxMenuStyles.itemHorizontal);
        });
        return el;
      }).filter(Util.identity);

      return div(
        { userSelect: 'none' },
        isVertical ? [
          { position: 'absolute', left: 0, top: 0 },
          ctxMenuStyles.wrapper,
        ] : null,
        divList,
      );
    };

    let createMenu = (...items) => {
      let flatItems = Util.flattenArray([items]).filter(Util.identity);

      // remove unnecessary separators
      for (let i = flatItems.length - 1; i >= 0; i--) {
        let item = flatItems[i];
        if (item.isSep && (i === 0 || i === flatItems.length - 1 || flatItems[i + 1].isSep)) {
          flatItems.splice(i, 1);
          i++;
        }
      }

      return {
        _PX_TYPE: 'MENU',
        _PX_IS_MENU: true,
        items: flatItems.filter(Util.identity).map(item => {
          if (item.isSep || item._PX_TYPE === 'ITEM') {
            return item;
          }
          return { _PX_TYPE: 'INVALID' };
        }),
      };
    };

    let createMenuItem = (id, label) => {
      let t = Util.ensureString(label).split('_');
      let accel = null;
      let accelIndex = -1;
      if (t.length > 1) {
        accel = t[1][0] || null;
        t[1] = t[0] + t[1];
        accelIndex = t[0].length;
        label = t.slice(1).join('_');
      }

      id = Util.ensureString(id);
      if (!id || !label) return { _PX_TYPE: 'INVALID' };
      let o = {
        _PX_TYPE: 'ITEM', id, label, accel, accelIndex, shortcut: null, icon: null,
        withShortcut: (...args) => {
          o.shortcut = args.join('+').split('+');
          return o;
        },
        withIcon: (canvas) => {
          o.icon = Util.copyImage(canvas).set({ size: 16 });
          return o;
        },
        isDisabled: false,
        disabled: () => {
          o.isDisabled = true;
          return o;
        },
      };
      return o;
    };

    let createMenuSep = () => ({ _PX_TYPE: 'SEP', isSep: true });

    let createCommand = (fn) => {
      return {
        _PX_TYPE: 'COMMAND',
        isCommand: true,
        handler: fn,
      };
    };

    return Object.freeze({
      buildRootMenuElement,

      createCommand,
      createMenu,
      createMenuSep,
      createMenuItem,

      MENU_CTRL_CMD: 'CTRL_CMD',
      MENU_CTRL: 'CTRL',
      MENU_SHIFT: 'SHIFT',
      MENU_ALT: 'ALT',
      MENU_OPTION: 'OPTION',
      MENU_CMD: 'CMD',
    });
  })();

  let lastSize = {};
  let sysResizeCheck = () => {
    let { width, height } = getBounds();
    if (lastSize.width !== width || lastSize.height !== height) {
      lastSize = { width, height };
      for (let wd of windowList) {
        if (wd.mode === 'FULLSCREEN' || wd.mode === 'MANAGED' || wd.transform.maximizedBoundsApplied) {
          wd.setWindowBounds(width, height);
        } else {
          let b = wd.transform.regularBounds || wd.getActualBounds();
          wd.setWindowBounds(b[2], b[3], b[0], b[1]);
        }
      }
    }
    return lastSize;
  };

  let getSize = () => ({ ...sysResizeCheck() });

  let giveKeyboardFocusToElement = (e) => {
    let w = getWindowFromElement(e);
    if (w) w.focusedElement = e;
  };

  let getWindowFromElement = e => {
    let walker = e;
    while (walker && walker !== document.body) {
      if (walker.PX_WINDATA) {
        return walker.PX_WINDATA;
      }
      walker = walker.parentElement;
    }
    return null;
  };

  let getPidFromElement = e => {
    let w = getWindowFromElement(e);
    return w ? w.pid : 0;
  };

  let systemWindowResizeListener = () => sysResizeCheck();

  return Object.freeze({
    DialogFactory: createDialogFactory(os),
    MenuBuilder,
    Taskbar: createTaskbar(os, invalidateTaskbar),
    FileDrag,

    clearModal,
    createLocalizedSpan,
    enableInputMask: inputMask.disableWindow,
    getDesktopBounds,
    getFocusedWindow,
    getFocusedWindowPid,
    getPidFromElement,
    getRootElement: () => ui.host,
    getSize,
    getTaskbarHost,
    getWindowHandles,
    giveProcessFocus,
    getUi: () => ui,
    init,
    isInitialized: () => initialized,
    killWindows,
    onLocaleChange,
    openModalAtMouseEvent,
    pushModal,
    refreshWindowVisualSettings,
    registerProcIdAsScreenSaver,
    setBackground,
    setModal,
    showWindow,
    systemKeyDownListener: (ev) => keyListener(ev, true),
    systemKeyUpListener: (ev) => keyListener(ev, false),
    systemWindowResizeListener,
    giveKeyboardFocusToElement,
    updateUsableDesktopBounds,
    updateWindowMenu,
  });
};
