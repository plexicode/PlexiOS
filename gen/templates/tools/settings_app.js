(async () => {
const { Util, HtmlUtil } = PlexiOS;
const APP_RAW_IMAGE_DATA = await Util.loadImageB64Lookup({

  'icon.png': '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',
});

let buildLanguage = async os => {

  let langs = os.Localization.getLocaleList();

  let langPicker = ItemList({
    margin: 8,
    border: '1px solid #888',
    height: 140,
    getItems: () => {
      return langs;
    },
    getId: item => item.id,
    renderItem: item => {
      return div(span({ bold: true }, item.id.toUpperCase()), ": ", span({ color: '#555' }, item.name));
    },
    selectedId: os.Localization.getLanguage(),
    onSelectionChanged: langId => {
      os.Localization.setLanguage(langId);
    },
  });

  return createDetailsPanel(
    "Language",
    [
      createSettingBox(
        "System Language",
        //langPicker,
        div("Localization is not ready yet. Please check back later."),
        true, true)
    ]
  );
};

let buildClockSettings = async os => {

  return createDetailsPanel(
    "Date & Time",
    [
      createSettingBox("Not implemented.", [
        div("This feature is not implemented yet. However, if you are trying to change the appearance of the clock, this is located in Taskbar settings."),
      ], true, true),
    ]
  );
};
let buildEnvVar = async (os, pid) => {

  let envList = ItemList({
    height: 180,
    border: '1px solid #888',
    getId: item => item.id,
    renderItem: item => {
      return div(
        { width: '100%', textOverflow: 'ellipsis' },
        span({ bold: true }, item.id), ': ',
        span({ opacity: 0.5 }, item.value),
      )
    },
    getItems: async () => {
      return os.EnvVars.list().map(id => {
        return { id, value: os.EnvVars.getRaw(id) };
      })
    },
    onSelectionChanged: () => {
      updateButtons();
    },
  });

  let updateButtons = () => {
    let hasSelection = !!envList.getSelectedId();
    editButton.set({ enabled: hasSelection });
    deleteButton.set({ enabled: hasSelection });
  };

  let showCycleWarning = () => os.Shell.DialogFactory.showOkCancelToBool(
    pid,
    "Error",
    "This value cannot be set as it creates a variable cycle. Please ensure that environment variables do not refer to each other cyclically.");

  let editEnvVar = async () => {
    let id = envList.getSelectedId();
    if (!id) return;
    let value = os.EnvVars.getRaw(id);
    let result = await os.Shell.DialogFactory.showOkCancelToBool(pid, "Edit Environment Variable", div(
      div("Variable Name: ", span({ bold: true }, id)),
      div(
        "Value: ",
        inputText(
          { value },
          newValue => { value = newValue; },
        )
      ),
    ));

    if (result) {
      if (!os.EnvVars.set(id, value)) {
        await showCycleWarning();
      }
      envList.refreshItems(true);
      updateButtons();
    }
  };

  let deleteEnvVar = async () => {
    let id = envList.getSelectedId();
    let result = await os.Shell.DialogFactory.showYesNoToBool(
      pid,
      "Delete Environment Variable",
      div(
        div("Are you sure you want to delete the following environment variable? This may cause system instability."),
        div({ textAlign: 'center', bold: true }, id),
      )
    );

    if (result) {
      os.EnvVars.remove(id);
      envList.refreshItems(true);
      updateButtons();
    }
  };

  let newEnvVar = async (defaultName, defaultValue) => {
    let name = defaultName || '';
    let value = defaultValue || '';
    let tryAgain = false;
    let result = await os.Shell.DialogFactory.showOkCancelToBool(pid, "New Environment Variable", div(
      div("Create new environment variable:"),
      div("Name: ", inputText({ value: name }, v => { name = v; })),
      div("Value: ", inputText({ value: value }, v => { value = v; })),
    ));
    if (result) {
      if (os.EnvVars.getRaw(name)) {
        let collisionResult = await os.Shell.DialogFactory.showOkCancelToBool(pid, "Variable collision", "An environment variable already exists with that name.");
        if (!collisionResult) return;
        tryAgain = true;
      } else {
        if (!os.EnvVars.set(name, value)) {
          await showCycleWarning();
          tryAgain = true;
        }
      }
    }

    if (tryAgain) {
      return newEnvVar(name, value);
    }

    envList.refreshItems(true);
    updateButtons();
  };

  let editButton = button("Edit...", { enabled: false }, editEnvVar);
  let deleteButton = button("Delete...", { enabled: false }, deleteEnvVar);

  return createDetailsPanel(
    "Environment Variables",
    [
      createSettingBox(
        "Edit Existing Variables",
        [
          envList,
          div(
            { marginTop: 8 },
            editButton, ' ',
            deleteButton,
          )
        ],
        true, false),
      createSettingBox(
        "Create New Variable",
        [
          button("New...", () => newEnvVar()),
        ],
        false, true),
    ]);
};

let buildExportDisk = async os => {

  return createDetailsPanel(
    "Export Disk",
    [
      createSettingBox("Not implemented.", [
        div("This feature is not implemented yet. Please check back later."),
      ], true, true),
    ]
  );
};

let buildPermissions = async os => {

  return createDetailsPanel(
    "Permissions",
    [
      createSettingBox("Not implemented.", [
        div("This feature is not implemented yet. Please check back later."),
      ], true, true),
    ]
  );
};
const APP_MAIN = async (os, procInfo, args) => {
  const { pid } = procInfo;

  let onClose = null;
  let promise = new Promise(res => { onClose = res; });

  os.Shell.showWindow(pid, {
    title: os.getName() + " Settings",
    width: 600,
    height: 400,
    destroyProcessUponClose: true,
    onClosed: () => onClose(true),
    onInit: (contentHost) => {
      let content = div({
        fullSize: true,
        backgroundColor: '#fff',
        color: '#000',
      });

      let panels = [
        { title: span("Account") },
        { id: 'ACCT_NAME', option: span("Account Name & Image"), builder: buildAccountAppearance },
        { id: 'ACCT_PASS', option: span("Password & Security"), builder: buildAccountSecurity },
        { title: span("Programs") },
        { id: 'PROG_INSTALLED', option: span("Installed"), builder: buildProgramsInstalled },
        { id: 'FILE_TYPES', option: span("File Types"), builder: buildFileTypes },
        { id: 'PROG_DEV', option: span("Developer Settings"), builder: buildProgramsDevSettings },
        { title: span("Appearance") },
        { id: 'BACKGROUND', option: span("Background"), builder: buildAppearanceBackground },
        { id: 'SCREENSAVER', option: span("Screensaver"), builder: buildAppearanceScreensaver },
        { id: 'THEME', option: span("Theme"), builder: buildAppearanceTheme },
        { id: 'TASKBAR', option: span("Taskbar"), builder: buildAppearanceTaskbar },
        { id: 'EFFECTS', option: span("Visual Effects"), builder: buildAppearanceEffects },
        { title: span("Language & Region") },
        { id: 'LANG', option: span("Language"), builder: buildLanguage },
        { id: 'DATETIME', option: span("Date & Time"), builder: buildClockSettings },
        { title: span("System Settings") },
        { id: 'ENV_VARS', option: span("Environment Variables"), builder: buildEnvVar },
        { id: 'DISK_EXPORT', option: span("Export Disk"), builder: buildExportDisk },
        // { id: 'PERMISSIONS', option: span("Permissions"), builder: buildPermissions },
      ];

      let loadPanel = async id => {
        let builder = (panels.filter(p => p.id === id)[0] || {}).builder || (() => div('not implemented'));
        let panel = await Promise.resolve(builder(os, pid));
        page.clear().set(panel);
      };

      let nav = div(
        {
          westDock: 200,
          overflowX: 'hidden',
          overflowY: 'auto',
          backgroundColor: BG_COLOR,
        }, panels.map(item => {
          let cell = div(
            { marginBottom: '1px', padding: '8px' }
          );
          if (item.title) {
            cell.set({ bold: true, backgroundColor: '#fff' }, item.title);
          } else {
            cell.set({ cursor: 'pointer' }, item.option);
            cell.addEventListener('mouseover', () => cell.set({ backgroundColor: 'rgba(255, 255, 255, 0.7)' }));
            cell.addEventListener('mouseout', () => cell.set({ backgroundColor: '' }));
            cell.addEventListener('click', () => loadPanel(item.id));
          }
          return cell;
        }));
      let page = div({ eastStretchDock: 200 });
      content.set(nav, page);
      contentHost.append(content);

      if (args[0]) loadPanel(args[0]);
    },
  });
  return promise;
};
let buildAppearanceBackground = async os => {

  let settings = {
    bgPath: (k => ({
      get: () => os.Settings.getString(k),
      set: v => {
        os.Settings.set(k, '' + v);
        if (v) os.Shell.setBackground(v);
      },
    }))('shellBg'),
    bgCycle: (k => ({
      get: () => os.Settings.getBool(k),
      set: v => os.Settings.set(k, !!v),
    }))('shellBgCycle'),
    bgCycleTimeout: (k => ({
      get: () => os.Settings.getInt(k),
      set: v => os.Settings.set(k, Util.ensurePositiveInteger(v)),
    }))('shellBgCycleTimeout'),
  };

  let previewSurf = HtmlUtil.canvas({ width: 200, height: 150 });
  let previewGfx = previewSurf.getContext('2d');
  previewSurf.width = 640;
  previewSurf.height = 480;

  let credits = {
    root: div(),
    author: span(),
    license: span(),
    licenseLink: HtmlUtil.a({ target: '_blank' }),
    originLink: HtmlUtil.a({ target: '_blank' })
  };
  credits.root.set(
    { fontSize: '0.5rem' },
    div(span({ bold: true }, "Author: "), credits.author),
    div(span({ bold: true }, "License: "), credits.license, credits.licenseLink),
    div(span({ bold: true }, "Source: "), credits.originLink));

  let refreshBgPreview = async () => {
    let path = settings.bgPath.get();
    let imgInfo = await os.FsRoot.fileReadImage(path, true);
    let w = previewSurf.width;
    let h = previewSurf.height;
    if (!imgInfo.ok) {
      previewGfx.fillStyle = '#000';
      previewGfx.fillRect(0, 0, w, h);
    } else {
      previewGfx.drawImage(imgInfo.img, 0, 0, w, h);
      let { attribution, license, licenseUrl, source } = imgInfo.metadata || {};

      if (attribution || license || licenseUrl || source) {
        credits.root.set({ visibleBlock: true });
        credits.author.clear().set({ visibleInline: !!attribution }, attribution);
        credits.originLink.clear().set({ visibleInline: !!source });
        if (source) {
          credits.originLink.clear().set({ href: source}, source.split('/')[2] || 'Original');
        }
        if (licenseUrl) {
          credits.licenseLink.clear().set({ visibleInline: true, href: licenseUrl }, license || 'Details');
          credits.license.set({ visibleInline: false });
        } else {
          credits.licenseLink.set({ visibleInline: false });
          credits.license.clear().set({ visibleInline: true }, license);
        }
      } else {
        credits.root.set({ visibleBlock: false });
      }
    }
  };

  refreshBgPreview();

  return createDetailsPanel(
    "Background Image",
    [
      createSettingBox(
        "Image",
        [
          div(
            { width: '100%', height: 160, position: 'relative', },
            previewSurf.set({ position: 'absolute', left: 10, top: 10, width: 200, height: 150 }),
            credits.root.set({
              border: '1px solid #888', borderRadius: 4,
              position: 'absolute', right: 10, bottom: 10, width: 150, height: 45, padding: 8,
              backgroundColor: 'rgba(255, 255, 255, 0.7)', color: '#000',
              display: 'none',
            }),
          ),
          ItemList({
            marginTop: 10,
            height: 80,
            border: '1px solid #888',
            getId: v => v.path,
            renderItem: v => v.dir ? span(v.dir + ": ", span({ bold: true }, v.name)) : span({ bold: true }, v.name),
            selectedId: settings.bgPath.get(),
            onSelectionChanged: path => {
              settings.bgPath.set(path);
              refreshBgPreview();
            },
            getItems: async () => {
              let fs = os.FsRoot;
              let getBasicInfo = async path => {
                let parts = path.split('/').slice(1);
                if (parts.length < 4 && await fs.dirExists(path)) {
                  let files = await fs.legacyList(path);
                  let fullPaths = files.map(f => path + '/' + f);
                  return Promise.all(fullPaths.map(getBasicInfo));
                }
                let nameParts = parts.pop().split('.');
                if (nameParts.length > 1) {
                  let ext = nameParts.pop().toUpperCase();
                  if (ext === 'JPEG' || ext === 'JPG' || ext === 'PNG' || ext === 'BMP') {
                    let name = nameParts.join('.');
                    let dir = parts.pop();
                    return { path, dir, name };
                  }
                }

                return null;
              };
              return Util.flattenArray(await getBasicInfo('/system/wallpapers')).filter(Util.identity);
            },
          }),
        ],
        true, true),
        /*
      createSettingBox(
        "Automatic Cycling",
        [
          div(
            "Automatically cycle through various images in the same group."
          ),
          div(
            inputCheckbox({ checked: settings.bgCycle.get() }, v => settings.bgCycle.set(v)),
            ' ',
            "Enable automatic cycling"),
          div(
            "Time between changes: ",
            ItemList({
              border: '1px solid #888',
              renderItem: v => v.label,
              getId: v => v.id,
              getItems: () => {
                return [
                  { id: '10', label: "Rapid Marquee: 10 seconds" },
                  { id: '60', label: "Slow Marquee: 1 minute" },
                  { id: '600', label: "Rapid: 10 minutes" },
                  { id: 30 * 60 + '', label: "Medium: 30 minutes" },
                  { id: 2 * 3600 + '', label: "Slow: 2 hours" },
                  { id: 24 * 3600 + '', label: "Daily: 24 hours" },
                ];
              },
            })
          )
        ],
        false, true),
      */
    ]
  );
};

let buildAppearanceScreensaver = async os => {
  let { div, canvas, span, inputText } = HtmlUtil;
  const { ItemList } = HtmlUtil.Components;

  let previewSurface = canvas();
  previewSurface.width = 640;
  previewSurface.height = 480;

  let fs = os.FsRoot;
  const DIR = '/system/screensavers';
  let allScreensaverFileNames = (await fs.legacyList(DIR)).filter(f => f.toLowerCase().endsWith('.scr'));
  let allScreensavers = await Promise.all(allScreensaverFileNames.map(async file => {
    let path = DIR + '/' + file;
    let info = await fs.getVirtualJsInfo(path);
    if (!info.isValid || info.category !== 'screensaver') return null;
    return { id: info.id, path, ...info.data, name: info.data.getName() };
  }));
  allScreensavers = allScreensavers.filter(Util.identity);
  allScreensavers.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
  allScreensavers = [{ name: '(no screensaver)', path: '' }, ...allScreensavers];

  let lastInitiailizedScreensaver = null;
  let runScreenSaver = async () => {
    let render;
    let state = {};
    let gfx = previewSurface.getContext('2d');
    while (HtmlUtil.inUiTree(previewSurface)) {
      let currentScreenSaver = os.Settings.getString('screenSaverPath', '');
      if (lastInitiailizedScreensaver !== currentScreenSaver) {
        lastInitiailizedScreensaver = currentScreenSaver;
        let info = await fs.getVirtualJsInfo(currentScreenSaver);
        gfx.fillStyle = '#000';
        gfx.fillRect(0, 0, 640, 480);
        if (info.isValid && info.category === 'screensaver') {
          state = info.data.init ? await Promise.resolve(info.data.init()) : {};
          render = info.data.render;
        } else {
          state = {};
          render = () => {
            let sz = 6;
            let offset = Math.PI * 2 * (Util.getTime() % 1000);
            let i = 0;
            for (let y = 0; y < 480; y += sz * (2 + Math.sin(offset + Math.PI * 2 * i++ / 20)) / 3) {
              for (let x = 0; x < 640; x += sz) {
                gfx.fillStyle = Math.random() < 0.5 ? '#000' : '#fff';
                gfx.fillRect(x, y, sz, sz);
              }
            }
          };
        }
      }

      await Promise.resolve(render(state, previewSurface, gfx, 640, 480));
      await Util.pause(1 / 30);
    }
  };

  Util.pause(0).then(runScreenSaver);

  let idleAmount = os.Settings.getInt('screenSaverTimeout', 120);
  let idleInput = inputText({ value: '' + idleAmount }, v => {
    idleAmount = Util.ensurePositiveInteger(v);
    if (idleAmount >= 30) {
      os.Settings.set('screenSaverTimeout', idleAmount);
    }
    populateIdleFeedback();
  });
  let populateIdleFeedback = () => {
    idleFeedback.clear().set(
      idleAmount >= 30
        ? [
          "Screensaver will appear after " + Util.formatHrMin(idleAmount, true) + " of inactivity.",
          { color: '#000'},
        ] : [
          "Please enter a valid integer greater than 30",
          { color: '#f00' },
        ]);
  };
  let idleFeedback = div({ margin: 8, backgroundColor: 'rgba(128, 128, 128, 0.3)', borderRadius: 4, color: '#888', padding: 8, fontSize: '0.8rem', });
  populateIdleFeedback();

  return createDetailsPanel(
    "Screensaver",
    [
      createSettingBox("Current Screen Saver", [
        div(
          { textAlign: 'center' },
          div(
            { border: '2px solid #888', size: [240, 180], display: 'inline-block', position: 'relative', textAlign: 'left' },
            previewSurface.set({ fullSize: true })),
          ),
        div(ItemList({
          marginLeft: 30,
          marginRight: 30,
          height: 90,
          border: '1px solid #888',
          selectedId: os.Settings.getString('screenSaverPath', ''),
          getItems: () => [...allScreensavers],
          renderItem: item => div(item.name),
          getId: item => item.path,
          onSelectionChanged: id => os.Settings.set('screenSaverPath', id),
        })),
      ], true, false),
      createSettingBox("Idle Time Trigger", [
        div("Seconds: ", idleInput),
        div(idleFeedback)
      ], false, true),
    ]);
};

let buildAppearanceTheme = async os => {

  let fs = os.FsRoot;

  let getThemeInfo = async (path) => {
    let info = await fs.getVirtualJsInfo(path);
    let { id, isValid, category } = info;
    if (!isValid || category !== 'theme') return null;
    let { name, author } = await os.Themes.getThemeMetadata(id);
    return { id, path, name, author };
  };

  let choose = async path => {
    if (!path) return;
    let theme = await getThemeInfo(path);
    if (theme) await os.Themes.setActiveTheme(theme.id);
  };

  let initTheme = os.Themes.getActiveTheme().getMetadata().id;

  let getThemes = async () => {
    let dir = '/system/themes';
    let files = await fs.legacyList(dir);
    files = files.filter(f => f.toLowerCase().endsWith('.theme'));
    let output = [];
    for (let file of files) {
      let info = await getThemeInfo(dir + '/' + file);
      if (info) output.push(info);
    }
    return output;
  };
  let themes = await getThemes();

  let items = ItemList({
    height: 130,
    border: '1px solid #888',
    getItems: () => themes,
    getId: v => v.path,
    onSelectionChanged: path => choose(path),
    selectedId: initTheme,
    renderItem: item => {
      return div(
        { whiteSpace: 'nowrap', overflow: 'hidden' },
        span({ bold: true }, item.name),
        ': ',
        span({ opacity: 0.5 }, item.author)
      )
    },
  });

  return createDetailsPanel(
    "Theme",
    [
      createSettingBox("Currently applied theme:", [
        items,
      ], true, true),
    ]
  );
};

let buildAppearanceTaskbar = async os => {

  let { button, inputCheckbox } = HtmlUtil;
  let { DockButton } = await HtmlUtil.loadComponents('DockButton');

  let resetTheme = () => {
    os.Themes.setActiveTheme(os.Themes.getActiveTheme().getMetadata().id);
  };

  return createDetailsPanel(
    "Taskbar",
    [
      createSettingBox("Taskbar Dock Direction", [
        div(
          { maxWidth: 300, height: 40, position: 'relative' },
          DockButton({ os, fullSize: true }),
        )
      ], true, false),
      createSettingBox("Tray Clock", [
        div(inputCheckbox({ checked: os.Settings.getBool('clock_show_seconds')}, checked => {
          os.Settings.set('clock_show_seconds', checked);
          resetTheme();
        }), ' ', "Show seconds"),
        div(inputCheckbox({ checked: os.Settings.getBool('clock_24_hour')}, checked => {
          os.Settings.set('clock_24_hour', checked);
          resetTheme();
        }), ' ', "Use 24-hour time"),
      ]),
      createSettingBox("Tray Icons", [
        div(inputCheckbox({ checked: !os.Settings.getBool('tray_hide_battery')}, checked => {
          os.Settings.set('tray_hide_battery', !checked);
          resetTheme();
        }), ' ', "Battery status")
      ], false, true),
    ]
  );
};

let buildAppearanceEffects = async os => {
  let { div, span, inputCheckbox, inputRange } = HtmlUtil;

  let opacityCurrent = span();
  let getOpacity = () => Util.ensureRange(os.Settings.getInt('windowOpacity', 100), 80, 100);
  let refreshOpacity = () => {
    let o = getOpacity();
    opacityCurrent.clear().set(o === 100 ? 'OFF' : (o + '%'));
  };
  refreshOpacity();


  return createDetailsPanel(
    "Visual Effects",
    [
      createSettingBox("Window Effects", [
        div(
          "Window opacity: ",
          inputRange(
            { min: 80, max: 100, value: getOpacity() },
            async v => {
              os.Settings.set('windowOpacity', v);
              refreshOpacity();
              os.Shell.refreshWindowVisualSettings();
            }),
          opacityCurrent),

          div(
            inputCheckbox({
              marginRight: 10,
              checked: !os.Settings.getBool('disableWindowOutlineShadows'),
              onToggle: (v) => {
                os.Settings.set('disableWindowOutlineShadows', !v);
                os.Shell.refreshWindowVisualSettings();
              }
            }),
            "Enable outline shadows"),

      ], true, true),
    ]
  );
};
let buildAccountAppearance = async os => {
  return createDetailsPanel(
    "Basic Account Settings",
    [
      createSettingBox("Not applicable", [
        div("You are currently running " + os.getName() + " anonymously. There is no account to customize."),
      ], true, true),
    ]
  );
};

let buildAccountSecurity = async os => {

  return createDetailsPanel(
    "Account Password & Security",
    [
      createSettingBox("Not applicable", [
        div("You are currently running " + os.getName() + " anonymously. There is no account to customize."),
      ], true, true),
    ]
  );
};
const TITLE = "Settings";
const BG_COLOR = 'rgb(230, 236, 242)';
const { button, div, inputCheckbox, inputText, span } = HtmlUtil;
const { ItemList } = HtmlUtil.Components;

let createBox = (title, args) => {
  return div(
    { borderRadius: '3px', backgroundColor: '#fff' },
    div({ fontSize: '1.2rem', bold: true, borderBottom: '1px solid #888' }, title),
    args.map(a => div(a)),
  );
};

let createDetailsPanel = (title, elements) => {
  let outer = div(
    {
      fullSize: true,
      backgroundColor: BG_COLOR,
    },
    div({ fontSize: '1.4rem', padding: 20, bold: true, northDock: 50 }, title),
    div(
      { overflowX: 'hidden', overflowY: 'auto', southStretchDock: 50 },
      elements,
      div({ html: '&nbsp;' }),
    )
  );
  return outer;
};

let createSettingBox = (title, interior, isTop, isBottom) => {
  return div(
    {
      backgroundColor: '#fff',
      marginLeft: 20,
      marginRight: 20,
      padding: 8,
      fontSize: '0.75rem',
    },

    isTop ? { borderTopLeftRadius: 3, borderTopRightRadius: 3 } : null,
    isBottom ? { borderBottomLeftRadius: 3, borderBottomRightRadius: 3 } : null,

    isTop ? null : { borderTop: '1px solid ' + BG_COLOR },

    div({ bold: true, marginBottom: 3, }, title),
    div({ color: '#555' }, interior),
  );
};
let buildProgramsInstalled = async (os, pid) => {

  let getIconCopy = icon => {
    return Util.copyImage(icon || os.IconStore.getIconByPurpose('EXEC', true));
  };

  let getAllApps = () => {
    let apps = os.ApplicationRegistry.getInstalled();
    apps.sort((a, b) => a.sortKey.localeCompare(b.sortKey));
    return apps;
  };
  let apps = getAllApps();

  let refresh = () => {
    apps = getAllApps();
    appList.refreshItems();
  };

  let appList = ItemList({
    height: 180,
    border: '1px solid #888',
    getItems: () => {
      return [...apps];
    },
    renderItem: (app) => {
      return div(
        { whiteSpace: 'nowrap', padding: 2 },
        getIconCopy(app.icon).set({ width: 16, height: 16 }), ' ',
        span({ bold: true }, app.name), ' ',
        span({ opacity: 0.7 }, app.id)
      );
    },
    getId: (item) => item.id,
    onSelectionChanged: async id => {
      await refreshOptions(id);
    },
  });

  let refreshOptions = async (id) => {

    diskUsage.clear().set({ bold: false }, "Calculating...");
    let appDir = await getAppDataDir(id);

    let total = 0;
    if (appDir) {
      let files = await os.FsRoot.listRecursive(appDir);
      for (let file of files) {
        let { ok, size } = await os.FsRoot.getProps(file);
        if (ok) total += size;
      }
    }

    removeBtn.disabled = !id;
    clearDataBtn.disabled = !total;
    openFolderBtn.disabled = !appDir;

    diskUsage
      .clear()
      .set({ bold: true }, id ? Util.byteSizeToText(total) : "No app selected");
  };

  let removeApp = async (id) => {
    let includeUserData = false;
    let app = await os.ApplicationRegistry.getInfo(id, true);
    let result = await os.Shell.DialogFactory.showYesNoToBool(
      pid,
      "Remove App",
      [
        div(
          { width: '100%', height: 80, position: 'relative' },
          div({ westDock: 100 }, getIconCopy(app.icon).set({ width: 53, height: 64 })),
          div({ eastStretchDock: 100, textAlign: 'left' },
            div("Are you sure you want to remove the following app?"),
            div({ marginTop: 8 }, span({ bold: true }, app.name), ' ', span({ opacity: 0.6 }, id)),
          ),
        ),
        div(
          { marginTop: 15 },
          inputCheckbox(v => { includeUserData = v; }), ' ',
          "Also remove user data and settings"
        )
      ],
    );

    if (!result) return;

    await os.ApplicationRegistry.removeApp(id, includeUserData);
    refresh();
  };

  let getCurrentId = () => appList.getSelectedId();

  let getAppDataDir = async (id) => {
    if (!id) return null;
    let path = '/appdata/' + id;
    return (await os.FsRoot.dirExists(path)) ? path : null;
  };

  let diskUsage = span({ bold: true });

  let removeBtn = button(
    "Remove",
    () => removeApp(getCurrentId()),
  );
  let clearDataBtn = button(
    "Clear Data",
    async () => {
      let id = getCurrentId();
      let appDir = await getAppDataDir(id);
      if (appDir) {
        await os.FsRoot.del(appDir);
        await refreshOptions(id);
      }
    },
  );
  let openFolderBtn = button(
    "OpenSettings Folder",
    async () => {
      let appDir = await getAppDataDir(getCurrentId());
      if (!appDir) {
        return os.Shell.DialogFactory.showOkCancelToBool(pid, TITLE, "There is no stored data for this app.");
      }
      os.ExecutionEngine.launchFile('/system/tools/files', [appDir], appDir);
    }
  );

  return createDetailsPanel(
    "Installed Programs",
    [
      createSettingBox("All installed programs", [
        div(appList),
        div(
          "Settings disk usage: ", diskUsage
        ),
        div(
          removeBtn, ' ',
          clearDataBtn, ' ',
          openFolderBtn,
        ),
      ], true, true)
    ]
  );
};

let buildFileTypes = async (os, pid) => {

  let files = await os.FileActions.getAllFileTypes();

  let icons = {};
  for (let file of files) {
    let ext = file.extension;
    let icon = os.IconStore.getIconByExtension(ext, true);
    icons[ext] = icon;
  }

  let getIconCopy = ext => {
    let icon = icons[ext];
    if (!icon) {
      icon = os.IconStore.getIconByPurpose('FILE', true);
      icons[ext] = icon;
    }
    return Util.copyImage(icon);
  };

  let fileList = ItemList({
    border: '1px solid #888',
    height: 180,
    getItems: () => [...files],
    onSelectionChanged: async () => {
      await refreshAppList();
    },
    renderItem: item => {
      return div(
        { padding: 4, whiteSpace: 'nowrap', overflow: 'hidden' },
        getIconCopy(item.extension).set({ width: 12, height: 12 }),
        ' ',
        span({ bold: true }, item.name),
        ' ',
        span({ opacity: 0.5 }, '.' + item.extension)
      );
    },
    getId: item => item.extension,
  });

  let getAssociatedApps = async ext => os.FileActions.getAppsForExt(ext);

  let refreshAppList = async () => {
    let ext = fileList.getSelectedId();
    if (!ext) {
      appsList.clear().set("Select a file to see which programs are associated with it.");
    } else {
      let apps = await getAssociatedApps(ext);
      if (apps.length) {
        appsList.clear().set(
          div({ marginTop: 10, marginBottom: 5 }, "Apps associated with this type of file extension: "),
          div(
            { border: '1px solid #888', padding: 4 },
            await Promise.all(apps.map(async app => {
              let { isValid, appId } = await os.FsRoot.getExecInfo(app);
              if (isValid && appId) {

                let appInfo = await os.ApplicationRegistry.getInfo(appId, true);
                if (appInfo) {
                  let { icon, name } = appInfo;
                  return div(
                    { whiteSpace: 'nowrap', overflow: 'hidden' },
                    Util.copyImage(icon).set({ width: 24, height: 24 }),
                    ' ',
                    span({ bold: true }, name),
                    ' ',
                    span({ opacity: 0.5 }, app),
                  );
                }
              }
              return div(app, ' ', span({ color: '#f00' }, "Not found!"));
            }))
          ),
        );
      } else {
        appsList.clear().set("There are no apps associated with this file extension.");
      }
      appsList.set(div(
        { fontSize: 8, opacity: 0.8, margin: 4 },
        "To change the associated apps, use the \"Open With...\" context menu option on any file with this extension."
      ));
    }
  };
  let appsList = div("Select a file to see which programs are associated with it.");

  let addBtn = button("Add...");
  let removeBtn = button("Remove...");
  let makePrimaryBtn = button("Make default...");

  return createDetailsPanel(
    "File Types",
    [
      createSettingBox("File extensions", [
        div(
          fileList,
        ),
        div(
          appsList,
        ),
        // div(addBtn, removeBtn, makePrimaryBtn)
      ], true, true),
      // createSettingBox("Register new file type", [
      //   'TODO: this',
      // ], false, true),
    ]
  );
};

let buildProgramsDevSettings = async os => {

  const key = 'devModeRegistryFreeExecution';
  return createDetailsPanel(
    "Developer Settings",
    [
      createSettingBox("Developer Mode", [
        div(
          inputCheckbox(
            { checked: os.Settings.getBool(key) },
            v => {
              os.Settings.set(key, !!v);
            },
          ),
          ' ',
          "Enable execution of programs that aren't installed to the app registry."
        ),
      ], true, true),
    ]
  );
};
PlexiOS.registerJavaScript('app', 'io.plexi.tools.settings', APP_MAIN);
})();
