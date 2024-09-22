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
