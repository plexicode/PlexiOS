let createThemeManager = (os) => {

  const { buildBevelButton, div, span } = HtmlUtil;

  let activeTheme = null;
  let activeUiElements = null;

  let lastDisplayedTime = null;
  let maybeUpdateClock = (host) => {
    if (!activeTheme) return;
    let now = new Date();
    let is24 = os.Settings.getBool('clock_24_hour');
    let mins = now.getMinutes() + "";
    if (mins.length < 2) mins = "0" + mins;
    let hours = now.getHours();
    let displayTime = (is24 ? hours : ((hours % 12) || 12)) + ":" + mins;
    if (os.Settings.getBool('clock_show_seconds')) {
      displayTime += ":" + Util.ensureNumLen(now.getSeconds(), 2);
    }
    if (!is24) displayTime += hours < 12 ? " AM" : " PM";
    if (displayTime !== lastDisplayedTime) {
      let clockUpdater = activeTheme.taskbar.clockUpdater || defaultClockUpdater;
      clockUpdater(host, displayTime);
      lastDisplayedTime = displayTime;
    }
  };

  let defaultClockUpdater = (host, timeStr) => { host.clear().innerText = timeStr; };

  let defaultTbParams = {
    thickness: 48,
    allowOverflow: false,
    verticalThicknessOverride: 64,
    disallowedDockPositions: [],
    preferredDockPosition: 'SOUTH',
  };
  let getTaskbarParams = () => {
    let getParams = activeTheme.taskbar.getParams;
    if (!getParams) getParams = () => ({});
    let out = { ...defaultTbParams, ...getParams() };

    out.thickness = Util.ensurePositiveInteger(out.thickness);

    out.dock = os.Settings.getString('taskbardock', 'SOUTH');
    out.dock = new Set(['SOUTH', 'NORTH', 'EAST', 'WEST']).has(out.dock) ? out.dock : defaultTbParams.preferredDockPosition;
    if (new Set(defaultTbParams.disallowedDockPositions).has(out.dock)) out.dock = defaultTbParams.preferredDockPosition;

    out.allowOverflow = !!out.allowOverflow;
    out.isHorizontal = out.dock === 'SOUTH' || out.dock === 'NORTH';
    out.isVertical = !out.isHorizontal;
    if (out.isVertical && !Util.isNullish(out.verticalThicknessOverride)) {
      out.thickness = Util.ensurePositiveInteger(out.verticalThicknessOverride);
    }
    out.verticalThicknessOverride = undefined;

    return out;
  };

  let applyTheme = async (id) => {
    let themeInitializer = await staticVirtualJsLoader.loadJavaScript('theme', id);

    let actions = {
      showLauncher: () => showLauncher(os),
    };
    activeTheme = {
      taskbar: {},
      window: {},
      menu: {},
      symbols: {},
      ...themeInitializer(os, actions),
    };

    let symbolColor = (activeTheme.symbols.symbolColor || (() => [0, 0, 0]))();
    let symbolCache = {};
    for (let gen of [defaultSymbolGenerator, activeTheme.symbols.generateSymbols]) {
      if (gen) {
        let newSymbols = gen(os.IconStore.monochromeSymbolFactory, symbolColor) || {};
        symbolCache = { ...symbolCache, ...newSymbols };
      }
    }
    activeTheme.symbols.symbolCache = symbolCache;

    os.Shell.updateUsableDesktopBounds();

    let tbUi = generateTaskbar();
    activeUiElements = {
      taskbar: tbUi,
    };
    cachedMenuStyles = null;

    os.Shell.getWindowHandles().forEach(winData => {
      applyThemedChromeToWindow(winData);
    });

    lastDisplayedTime = '';
    extUpdateClock = () => maybeUpdateClock(activeUiElements.taskbar.clockTextHost);
    extUpdateClock();

    return activeTheme;
  };

  let extUpdateClock = Util.noop;

  let defaultSymbolGenerator = (symbolFactory, color) => {
    let f = fn => symbolFactory(fn, [...color]);
    return {
      minimize: f(gfx => {
        gfx.rect(0.1, 0.65, .8, .2);
      }),
      maximize: f(gfx => {
        let top = 0.15;
        let bottom = 0.85;
        let left = 0.05;
        let right = 0.85;
        let width = right - left;
        let height = bottom - top;
        let thk = 0.2;
        gfx
          .rect(left, top, width, thk)
          .rect(left, top, thk, height)
          .rect(left, bottom - thk, width, thk)
          .rect(right - thk, top, thk, height);
      }),
      download: f(gfx => {
        gfx
          .line(0.5, 0.1, 0.5, 0.5, 0.2)
          .triangle(0.1, 0.5, 0.9, 0.5, 0.5, 0.9);
      }),
      close: f(gfx => {
        gfx
          .line(0.2, 0.2, 0.8, 0.8, 0.2)
          .line(0.2, 0.8, 0.8, 0.2, 0.2);
      }),
    };
  };

  let generateTaskbar = () => {
    let taskbarHost = os.Shell.getTaskbarHost();
    taskbarHost.clear();
    let tbParams = getTaskbarParams();
    let { dock, thickness, allowOverflow } = tbParams;
    let isHorizontal = dock === 'SOUTH' || dock === 'NORTH';
    let showBattery = !os.Settings.getBool('tray_hide_battery');
    tbParams = { ...tbParams, isHorizontal, isVertical: !isHorizontal };
    taskbarHost.set({
      position: 'absolute',
      size: '',
      top: '',
      bottom: '',
      left: '',
      right: '',
      overflow: allowOverflow ? 'visible' : 'hidden',
    });
    let t = {};
    t[dock.toLowerCase() + 'Dock'] = thickness;
    taskbarHost.set(t);

    let abs = { position: 'absolute' };
    let tbUi = {
      bg: div({ fullSize: true }),
      startHost: div(abs),
      itemHost: div(abs),
      clockHost: div(abs),
      clockTextHost: span(),
      batteryHost: span(),
    };
    taskbarHost.set(
      tbUi.bg,
      tbUi.itemHost,
      tbUi.startHost,
      tbUi.clockHost,
      tbUi.clockTextHost,
    );
    tbUi.clockHost.set(
      {
        onClick: () => {
          showSysPane(os);
        }
      },
      tbUi.clockTextHost,
      tbUi.batteryHost);

    let p = Object.freeze({ ...tbParams, showBattery });

    (activeTheme.taskbar.styleBackdrop || defaultStyleTaskbarBackdrop)(tbUi.bg, p);
    (activeTheme.taskbar.styleStartHost || defaultStyleTaskbarStartHost)(tbUi.startHost, p);
    (activeTheme.taskbar.styleClockHost || defaultStyleTaskbarClockHost)(tbUi.clockHost, tbUi.clockTextHost, tbUi.batteryHost, p);
    (activeTheme.taskbar.styleItemsHost || defaultStyleTaskbarItemsHost)(tbUi.itemHost, p);

    tbUi.startHost.addEventListener('click', () => showLauncher(os));

    return tbUi;
  };

  let defaultStyleTaskbarItemsHost = (itemHost, params) => {
    let front = params.thickness + 4;
    let back = 100 + 4;
    let margin = 6;
    itemHost.set(
      params.isHorizontal
        ? { left: front, right: back, top: margin, bottom: margin }
        : { top: front, bottom: back, left: margin, right: margin });
  };

  let defaultStyleTaskbarClockHost = (clockHost, clockTextHost, batteryHost, params) => {

    let isVertical = params.isVertical;
    let isHorizontal = !isVertical;

    let { showBattery } = params;
    let showSeconds = os.Settings.get('clock_show_seconds');
    let show24Hr = os.Settings.get('clock_24_hour');
    let isSuperWide = showSeconds && !show24Hr;

    let wrappedClockText = div(
      isHorizontal
        ? { top: 6 }
        : { top: isSuperWide ? 2 : 4 },
      {
        position: 'absolute',
        right: 4,
        textAlign: (showSeconds && isHorizontal) ? 'left' : 'center',
        left: 4,
        height: 14,
      },
      clockTextHost,
    );
    let wrappedBatteryHost = div(
      { absMargin: 0, textAlign: 'center' },
      isHorizontal
        ? { top: 7 }
        : null,
      batteryHost,
    );

    clockHost.set(
      div(
        {
          fullSize: true,
          border: '1px solid rgba(255, 255, 255, 0.25)',
          borderTopColor: 'rgba(0, 0, 0, .25)',
          borderLeftColor: 'rgba(0, 0, 0, .25)',
          borderRadius: 2,
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          color: '#fff',
          fontSize: isVertical ? 7 : 9,
        },
        div(
          { marginTop: 2 },
          showBattery
            ? isHorizontal
              ? [
                  div({ westDock: 20 }, wrappedBatteryHost),
                  div({ eastStretchDock: 20 }, wrappedClockText),
                ]
              : [
                  div({ northStretchDock: isSuperWide ? 15 : 20 }, wrappedClockText),
                  div({ southDock: isSuperWide ? 15 : 20, textAlign: 'center' }, wrappedBatteryHost),
                ]
            : [
                div({ fullSize: true }, wrappedClockText)
              ]
        )
      )
    );

    let margin = 8;

    if (isVertical) {
      let size = 60;
      clockHost.set({
        bottom: margin,
        left: margin,
        size: [params.thickness - margin * 2, size - margin * 2],
      });
    } else {
      let size = 125;
      clockHost.set({
        right: margin,
        bottom: margin,
        size: [size - margin * 2, params.thickness - margin * 2],
      });
    }

    if (showBattery) {

      batteryHost.set(
        { display: 'inline-block'}
      );

      let updateBattery = props => {
        batteryHost.title = [
          props.percent,
          '% (',
          props.isPluggedIn
            ? props.timeTill === 0
              ? "Charged"
              : (Util.formatHrMin(props.timeTill) + " till charged")
            : (Util.formatHrMin(props.timeTill) + " remaining"),
          ')',
        ].join('');

        let batteryIcon = batteryHost.firstChild;
        if (batteryIcon && `${batteryIcon.tagName}`.toLowerCase() !== 'canvas') batteryIcon = null;
        if (!batteryIcon) {
          batteryIcon = HtmlUtil.canvas({ size: 12 });
          batteryHost.clear().set(batteryIcon);
        }

        os.Shell.Taskbar.renderBatteryImage(batteryIcon, false, true, props.percent);
      };

      os.PowerManager.addWatcher(bat => updateBattery(bat), () => HtmlUtil.inUiTree(batteryHost));
      os.PowerManager.getProperties().then(updateBattery);

    }
  };

  let defaultStyleTaskbarStartHost = (host, params) => {
    let margin = Math.floor(params.thickness / 10);
    let sz = params.thickness - margin * 2
    host.set({
      left: margin,
      top: margin,
      size: sz,
    });

    os.FsRoot.fileReadImage('/system/res/launcher-btn.png').then(file => {
      let { ok, img } = file;
      if (ok) {
        host.set(img.set({ size: ['80%', '80%'], left: '10%', top: '10%', position: 'absolute'}));
      }
    });

  };

  let defaultStyleTaskbarBackdrop = (bg, params) => {
    let s = { backgroundColor: '#444' };
    switch (params.dock) {
      case 'SOUTH': s.borderTop = '1px solid #888'; break;
      case 'NORTH': s.borderBottom = '1px solid #888'; break;
      case 'EAST': s.borderLeft = '1px solid #888'; break;
      case 'WEST': s.borderRight = '1px solid #888'; break;
    }
    bg.set(s);
  };

  let defaultApplyTaskStyle = (host, params, index, name, isFocused, numProcs, icon, iconChanged) => {
    let iconSize = params.thickness - 6 * 2;
    host.title = `${name}`;
    host.set(
      {
        position: 'absolute', size: iconSize,
        borderRadius: 2,
        backgroundColor: isFocused ? 'rgba(255, 255, 255, 0.3)' : '',
      },
      params.isHorizontal
        ? { top: 0, left: index * (iconSize + 4) }
        : { left: 0, top: index * (iconSize + 4) },
    );

    if (iconChanged) {
      host.clear().set(icon.set({ position: 'absolute', size: iconSize - 8, left: 4, top: 4 }));
    }

    // TODO: use numProcs to add dots
  };

  let updateTaskbar = (tbUi, params, entities) => {
    let allAppPaths = new Set(entities.map(e => e.appPath));
    let slotById = {};

    let slots = Array.from(tbUi.itemHost.children);
    slots.forEach(slot => {
      let path = slot.PLX_APP_PATH;
      if (!allAppPaths.has(path)) {
        tbUi.itemHost.removeChild(slot);
      } else {
        slotById[path] = slot;
      }
    });

    for (let i = 0; i < entities.length; i++) {
      let { appPath, isFocused, icon, pids, name, multiIndicator } = entities[i];
      let slot = slotById[appPath];
      if (!slot) {
        slot = div({
          onRightClick: (ev) => {
            os.Shell.Taskbar.showTaskMenu(ev, slot.PLX_APP_PATH, slot.PLX_DEFAULT_PID);
          },
          onClick: () => {
            if (slot.PLX_DEFAULT_PID) {
              os.Shell.giveProcessFocus(slot.PLX_DEFAULT_PID);
            } else {
              os.ExecutionEngine.launchFile(appPath);
            }
          },
        });
        slot.PLX_APP_PATH = appPath;
        tbUi.itemHost.append(slot);
      }
      slot.PLX_DEFAULT_PID = pids.length ? pids[pids.length - 1] : 0;

      let canvasIfChanged = null;
      if (slot.PLX_LAST_CANVAS !== icon) {
        slot.PLX_LAST_CANVAS = icon;
        let canvas = HtmlUtil.canvas();
        canvas.width = 64;
        canvas.height = 64;
        let g = canvas.getContext('2d');
        g.drawImage(icon, 0, 0);
        slot.PLX_ICON_CACHE = canvas;
        canvasIfChanged = canvas;
      }
      let applyTaskStyle = activeTheme.taskbar.applyTaskStyle || defaultApplyTaskStyle;
      applyTaskStyle(slot, params, i, name, isFocused, pids.length, slot.PLX_ICON_CACHE, !!canvasIfChanged, multiIndicator);
    }
  };

  let applyThemedChromeToWindow = (winData) => {
    let { isMaximized } = winData;

    let btns = winData.chromeBtns;
    let handlers = {
      minimize: btns.minimize ? winData.minimizeHandler : null,
      maximize: btns.maximize ? winData.maximizeHandler : null,
      download: btns.download ? winData.downloadHandler : null,
      close: winData.closeHandler,
    };
    let abs = { position: 'absolute' };
    let frame = winData.outerFrame.set(abs);
    let titleIcon = HtmlUtil.canvas({ fullSize: true });
    titleIcon.width = 64;
    titleIcon.height = 64;
    titleIcon.getContext('2d').drawImage(winData.icon, 0, 0);

    let ui = {
      content: winData.contentHost.set(abs),
      menuBar: winData.menuBar ? winData.menuBar.set(abs) : null,
      titleBar: div(abs),
      titleIconHost: div(abs, titleIcon),
      titleTextHost: div(abs),
      titleButtonsHost: div(abs),
      backdrop: div({ fullSize: true }),
    };

    winData.themeDataCache.titleBar = ui.titleTextHost;

    let {
      margin,
      menubar,
      titlebar,
    } = getChromePadding();

    let frameMembers = Array.from(frame.children);
    let hasInputMask = !!frameMembers.filter(e => e.PX_INPUT_MASK).length;

    if (winData.mode === 'FULLSCREEN' || winData.mode === 'MANAGED') {
      HtmlUtil.clearExcept(frame, ui.content);
      if (!frame.firstChild) frame.set(ui.content);
      ui.content.set({ width: '100%', top: 0, bottom: 0 });

      if (hasInputMask) os.Shell.enableInputMask(winData);
      return;
    }

    if (winData.isMaximized) {
      margin = 0;
    }

    let nineGridCenter = frameMembers.filter(e => e.PX_NINE_GRID_C)[0] || null;
    HtmlUtil.clearExcept(frame, nineGridCenter);
    ui.backdrop.set({
      shadow: true, // This is a system setting
    });
    let nineGrid = os.Themes.injectResizeNineGrid(winData, margin, winData.isMaximized);

    HtmlUtil.clearExcept(nineGrid.C, ui.content);
    if (!nineGrid.C.firstChild) nineGrid.C.set(ui.content);
    if (ui.menuBar) nineGrid.C.append(ui.menuBar);
    nineGrid.C.prepend(ui.titleBar);

    frame.prepend(ui.backdrop);
    if (hasInputMask) os.Shell.enableInputMask(winData);

    ui.titleBar.set({ northDock:titlebar, userSelect: 'none' });
    if (ui.menuBar) ui.menuBar.set({ size: ['100%', menubar], top: titlebar });
    ui.content.set({ southStretchDock: titlebar + (ui.menuBar ? menubar : 0) });

    ui.titleBar.set(ui.titleIconHost, ui.titleTextHost, ui.titleButtonsHost);
    ui.titleButtonsHost.addEventListener('pointerdown', e => e.stopPropagation());

    ui.content.set({ backgroundColor: '#fff' });

    let f = activeTheme.window.styleWindowBackdrop || defaultStyleWindowBackdrop;
    f(ui.backdrop, !!ui.menuBar, isMaximized);

    defaultTitleBarLayout(ui.titleIconHost, ui.titleTextHost, ui.titleButtonsHost, isMaximized);
    f = activeTheme.window.applyTitleBarLayout;
    if (f) f(ui.titleIconHost, ui.titleTextHost, ui.titleButtonsHost, isMaximized);

    f = activeTheme.window.buildWindowButtons || defaultBuildWindowButtons;
    f(ui.titleButtonsHost, handlers.minimize, handlers.maximize, handlers.download, handlers.close, isMaximized, activeTheme.symbols.symbolCache);

    if (ui.menuBar) {
      let menuInner = div({ fullSize: true });
      let styles = getContextMenuStyles();
      ui.menuBar.clear().set(menuInner.set(styles.windowMenuBar));
    }

    f = activeTheme.window.styleWindowTitleText || defaultStyleWindowTitleText;
    f(ui.titleTextHost);

    f = activeTheme.window.applyAdditionalWindowStyle;
    if (f) f(ui);

    os.Shell.updateWindowMenu(winData);

    ui.titleBar.addEventListener('pointerdown', e => { e.stopPropagation(); });
    applyTitleBarGrabber(winData, ui.titleBar); // TODO: this should be title bar, but the other elements should not have click-through

    ui.titleTextHost.innerText = winData.getTitle();

    ui.titleIconHost.set()

    // Ensure that the window isn't violating any positioning rules.
    if (winData.isMaximized) {
      winData.setWindowBounds(window.innerWidth, window.innerHeight, 0, 0); // over-sized, but constraints will get applied
    } else {
      winData.setWindowBounds(); // using all defaults will forcce it to re-apply its existing bounds through constraint checking
    }
  };

  let defaultStyleWindowBackdrop = backdrop => {
    backdrop.set(HtmlUtil.createBevelDiv([64, 64, 64]));
  };

  let defaultStyleWindowTitleText = textHost => {
    textHost.set({ color: '#fff', fontSize: 11 });
  };

  let defaultBuildWindowButtons = (host, min, max, dl, cls, isMax, symbols) => {
    let btnStyle = {
      size: [24, '100%'],
      fontSize: 9,
      bold: true,
      marginLeft: 4,
      color: '#000',
      display: 'inline-block',
      textAlign: 'center',
    };
    let gray = [180, 190, 204];
    let iconStyle = { width: 14, height: 14, position: 'relative', top: 2 };
    let btns = [
      min ? buildBevelButton(gray).setAction(min).setInner(symbols.minimize(64, 64).set(iconStyle)) : null,
      max ? buildBevelButton(gray).setAction(max).setInner(symbols.maximize(64, 64).set(iconStyle)) : null,
      dl ? buildBevelButton(gray).setAction(dl).setInner(symbols.download(64, 64).set(iconStyle)) : null,
      close ? buildBevelButton([220, 30, 50]).setAction(cls).setInner(symbols.close(64, 64).set(iconStyle)) : null,
    ].filter(Util.identity);
    btns.forEach(b => b.set(btnStyle));
    host.set(btns);
  };

  let getDefaultChromePadding = () => ({ margin: 6, menubar: 26, titlebar: 24 })
  let getChromePadding = () => (activeTheme.window.getChromePadding || getDefaultChromePadding)();
  let defaultTitleBarLayout = (iconHost, textHost, buttonHost, isMaximized) => {
    let sizes = getChromePadding();
    let margin = isMaximized ? 0 : sizes.margin;
    let invMargin = sizes.margin - margin;
    let halfInvMargin = invMargin >> 1;
    let iconSize = sizes.titlebar - sizes.margin;
    iconHost.set({
      left: halfInvMargin,
      top: halfInvMargin,
      size: iconSize,
    });
    textHost.set({
      left: sizes.titlebar + 2,
      right: 114,
      top: halfInvMargin,
      height: sizes.titlebar - invMargin,
      textOverflow: 'ellipsis',
      overflow: 'hidden',
      whiteSpace: 'nowrap',
    });
    buttonHost.set({
      right: halfInvMargin,
      top: halfInvMargin,
      size: [112, sizes.titlebar - sizes.margin],
      textAlign: 'right',
    });
  };

  let defaultGetWrapperStyle = () => {
    return {
      backgroundColor: '#aaa',
      color: '#000',
      shadow: true,
      padding: 2,
      border: '1px solid #888',
      borderLeftColor: '#ccc',
      borderTopColor: '#fff',
    };
  };

  let defaultGetSeparatorStyle = () => ({ height: 0, borderBottom: '1px solid #888' });

  let defaultGetMenuItemStyle = (isHover, isVertical) => {
    let s = {
      fontSize: 9,
      backgroundColor: isHover ? '#444' : '',
      color: isHover ? '#fff' : '#000',
      padding: 4,
    };
    if (isVertical) {
      s.paddingRight = 20;
    } else {
      s.padding = 2;
    }
    return s;
  };

  let defaultGetWindowMenuBarStyle = (menuBar) => {
    return { padding: 3, backgroundColor: '#aaa', color: '#000', borderBottom: '1px solid #888' };
  };

  let cachedMenuStyles = null;
  let getContextMenuStyles = () => {
    if (!cachedMenuStyles) {
      let wrapper = (activeTheme.menu.getWrapperStyle || defaultGetWrapperStyle)() || defaultGetWrapperStyle();
      let sep = (activeTheme.menu.getSeparatorStyle || defaultGetSeparatorStyle)() || defaultGetSeparatorStyle();
      let windowMenuBar = (activeTheme.menu.getWindowMenuBarStyle || defaultGetWindowMenuBarStyle)() || defaultGetWindowMenuBarStyle();
      let itemGetter = activeTheme.menu.getItemStyle || defaultGetMenuItemStyle;
      let itemVertical = itemGetter(false, true) || defaultGetMenuItemStyle(false, true);
      let itemHorizontal = itemGetter(false, false) || defaultGetMenuItemStyle(false, false);
      let itemVerticalHover = itemGetter(true, true) || defaultGetMenuItemStyle(true, true);
      let itemHorizontalHover = itemGetter(true, false) || defaultGetMenuItemStyle(true, false);
      cachedMenuStyles = { wrapper, sep, windowMenuBar, itemVertical, itemVerticalHover, itemHorizontal, itemHorizontalHover };
    }
    return Util.deepCopy(cachedMenuStyles);
  };

  let applyTitleBarGrabber = (winData, element) => {
    let onDown = () => {
      winData.focus();
      return winData.getActualBounds();
    };
    let onDrag = (_ev, start, dx, dy) => {
      if (winData.isMaximized) return;
      let x = start.x + dx;
      let y = start.y + dy;
      winData.setWindowBounds(null, null, x, y);
      let b = winData.transform.regularBounds;
      b[0] = x;
      b[1] = y;
    };

    HtmlUtil.applyClickDragHandler(element, onDown, onDrag);
  };

  let defaultBuildPanelBackground = () => {
    return div({
      fullSize: true,
      color: '#fff',
      backgroundColor: '#444',
      border: '1px solid #000',
      borderTopColor: '#aaa',
      borderLeftColor: '#888',
      padding: 4,
    });
  };

  let themeMan = {
    buildPanelBackground: () => {
      return (activeTheme.buildPanelBackground || defaultBuildPanelBackground)();
    },

    setActiveTheme: async (id) => {
      activeTheme = await applyTheme(id);
      themeMan.redrawTaskbar();
    },

    getActiveTheme: () => activeTheme,

    getThemeMetadata: async (id) => {
      let themeFn = await staticVirtualJsLoader.loadJavaScript('theme', id);
      let theme = themeFn(os, {});
      let md = theme.getMetadata();
      return Object.freeze({ id: md.id, name: md.name || "Untitled Theme", author: md.author || "Unknown" });
    },

    getChromePadding,

    getAvailableThemes: async () => {
      let themeDir = '/system/themes';
      let fs = os.FsRoot;
      let themeFileNames = (await fs.list(themeDir)).filter(t => t.toLowerCase().endsWith('.theme'));
      let themes = [];
      for (let file of themeFileNames) {
        let theme = await fs.getVirtualJsInfo(themeDir + '/' + file);
        if (theme && theme.isValid) {
          let themeCtor = theme.data;
          themes.push(themeCtor().getMetadata());
        }
      }
      themes.sort((a, b) => a.name.localeCompare(b.name.localeCompare));
      return themes;
    },

    redrawTaskbar: async () => {
      let focusedPid = (os.Shell.getFocusedWindow() || {}).pid;
      let procs = os.ProcessManager.getProcesses(true).map(p => ({
        pid: p.pid,
        appId: p.appId,
        path: p.path,
        isFocused: p.pid === focusedPid,
        icon: os.ApplicationRegistry.getIcon(p.appId),
      }));

      let entities = await os.Shell.Taskbar.processesToTaskEntities(procs);
      updateTaskbar(activeUiElements.taskbar, getTaskbarParams(), entities);
    },

    applyThemedChromeToWindow,

    getContextMenuStyles,

    getTaskbarParams,

    injectResizeNineGrid: (winData, margin, isMaximized) => {

      let frame = winData.outerFrame;
      let C = frame.lastChild || null;
      if (C && !C.PX_NINE_GRID_C) C = null;

      if (isMaximized || !winData.resizeEnabled) {
        let m = isMaximized ? 0 : margin;
        let props = { position: 'absolute', left: m, top: m, right: m, bottom: m };
        if (!C) {
          C = div(props);
          frame.set(C);
        } else {
          C.set(props);
        }
        HtmlUtil.clearExcept(frame, C);
        return { C };
      }

      let output = HtmlUtil.injectNineGrid(frame, margin, margin, margin, margin, C);
      let cursors = {
        NW: 'nwse-resize',
        SE: 'nwse-resize',
        NE: 'nesw-resize',
        SW: 'nesw-resize',
        N: 'ns-resize',
        S: 'ns-resize',
        E: 'ew-resize',
        W: 'ew-resize',
      };
      let handleDown = (dir) => {
        winData.focus();
        let { x, y, width, height } = winData.getActualBounds();
        return {
          startWidth: width,
          startHeight: height,
          startLeft: x,
          startTop: y,
          isLeftAdjust: dir.includes('W'),
          isRightAdjust: dir.includes('E'),
          isTopAdjust: dir.includes('N'),
          isBottomAdjust: dir.includes('S'),
        };
      };
      let handleMove = (_ev, session, dx, dy) => {
        let newBounds = {};
        if (session.isRightAdjust) {
          newBounds.width = session.startWidth + dx;
        }
        if (session.isLeftAdjust) {
          newBounds.width = session.startWidth - dx;
          newBounds.x = session.startLeft + dx;
        }
        if (session.isBottomAdjust) {
          newBounds.height = session.startHeight + dy;
        }
        if (session.isTopAdjust) {
          newBounds.height = session.startHeight - dy;
          newBounds.y = session.startTop + dy;
        }
        winData.setWindowBounds(newBounds.width, newBounds.height, newBounds.x, newBounds.y);
      };
      Object.keys(cursors).forEach(k => {
        let e = output[k];
        HtmlUtil.applyClickDragHandler(e, () => handleDown(k), handleMove);
        output[k].set({ cursor: cursors[k] });
      });

      return output;
    },
    updateClock: () => extUpdateClock(),
  };

  return Object.freeze(themeMan);
};
