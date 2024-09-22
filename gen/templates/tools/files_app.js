(async () => {
const { Util, HtmlUtil } = PlexiOS;
const APP_RAW_IMAGE_DATA = await Util.loadImageB64Lookup({

  'icon.png': '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',
});

const APP_MAIN = async (os, procInfo, args) => {
  const { pid } = procInfo;
  let onClose = null;
  let promise = new Promise(res => { onClose = res; });
  let startingDir = args.length ? args[0] : '/';
  await initToolbarIcons(os);
  os.Shell.showWindow(pid, {
    title: 'Files',
    width: Math.floor(Math.min(os.Shell.getSize().width * .95,  600)),
    height: Math.floor(Math.min(os.Shell.getSize().height / 2, 400)),
    destroyProcessUponClose: true,
    onClosed: () => onClose(true),
    onInit: (contentHost) => {
      contentHost.append(main(os, startingDir, pid));
    },
  });
  return promise;
};

const TOOLBAR_HEIGHT = 40;
let main = (os, dir, pid) => {
  const { div } = HtmlUtil;
  const { DividerPane, FileList, IconBrowser } = HtmlUtil.Components;

  let iconsDir = dir;
  let navDir = dir;
  let toolbarDir = dir;

  let ensurePanelsConsistent = async (isFirstLoad) => {
    if (iconsDir !== dir) {
      iconsDir = dir;
      await icons.refresh();
    }
    if (isFirstLoad || navDir !== dir) {
      navDir = dir;
      await navPanel.ensurePathExpanded(dir);
      navPanel.setSelectedPath(dir);
    }

    if (toolbarDir !== dir) {
      toolbarDir = dir;
      toolbarContent.setDir(dir);
    }
  };

  let fs = os.FsRoot;
  let navPanel = FileList({
    fontSize: 9,
    os,
    rootDir: '/',
    rootNameOverride: 'Virtual Disk',
    initDir: dir,
    foldersOnly: true,
    onSelectionChanged: path => {
      dir = path;
      navDir = dir;
      ensurePanelsConsistent();
    },
    onReady: () => {
      ensurePanelsConsistent();
    },
  });

  let toolbar = div(
    {
      borderBottom: '1px solid rgba(128, 128, 128, 0.4)',
    }
  );

  let onFsUpdates = () => {
    icons.refresh();
    return true;
  };

  let watcherId = fs.addWatcher(dir, pid, onFsUpdates);

  let changeDir = (newDir) => {
    dir = newDir;
    fs.removeWatcher(watcherId);
    watcherId = fs.addWatcher(newDir, pid, onFsUpdates);
  };

  let goUp = () => {
    if (dir !== '/') {
      changeDir(os.FsRoot.getParent(dir));
      ensurePanelsConsistent();
    }
  };

  let icons = IconBrowser({
    os,
    getDir: () => dir,
    onOpenDir: async ev => {
      ev.preventDefault();
      if (await fs.dirExists(ev.fullPath)) {
        changeDir(ev.fullPath);
        ensurePanelsConsistent();
      }
    },
    onBackspace: () => goUp(),
  });

  let toolbarContent = createToolbar(
    dir,
    newView => icons.setLayoutMode(newView),
    newDir => {
      changeDir(newDir);
      ensurePanelsConsistent();
    },
    goUp
  );

  ensurePanelsConsistent(true);

  return div(
    { fullSize: true },
    toolbar.set(
      { northDock: TOOLBAR_HEIGHT, backgroundColor: '#ccc' },
      toolbarContent
    ),
    div(
      { southStretchDock: TOOLBAR_HEIGHT },
      DividerPane({
        fullSize: true,
        leadContent: navPanel.set({ fullSize: true }),
        tailContent: icons.set({ fullSize: true }),
        pixels: 150,
      })
    ),
  );
};
let toolbarIcons = {};
let initToolbarIcons = async os => {
  await Promise.all(['details', 'tiles', 'thumbs'].map(async n => {
    let icon = toolbarIcons[n];
    if (!icon) {
      let t = await os.FsRoot.fileReadImage('/system/res/files-' + n + '.png', true);
      if (t.ok) {
        icon = t.img;
      }
    }
    if (!icon) {
      icon = HtmlUtil.canvasOfSize(24, 24);
    }
    toolbarIcons[n] = Util.copyImage(icon);
  }));

  let up = os.IconStore.getIconByPurpose('FOLDER_CLOSED');
  let ctx = up.getContext('2d');
  toolbarIcons.up = up;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  let x1 = 17;
  let x3 = 45;
  let x2 = (x1 + x3) / 2;
  let y1 = 46;
  let y2 = 31;
  let y3 = y1;
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.lineTo(x3, y3);
  ctx.fill();
  toolbarIcons.up = up;
};

let getToolbarIcons = () => {
  let o = {};
  Object.keys(toolbarIcons).forEach(k => {
    o[k] = Util.copyImage(toolbarIcons[k]).set({ width: 24, height: 24 });
  });
  return o;
};

let createToolbar = (path, onViewChanged, onDirChanged, goUpCb) => {
  let { button, div, inputText, span } = HtmlUtil;

  let toolbarIcons = getToolbarIcons();
  let viewModeBtn = { display: 'inline-block', width: 32, height: 32, borderRadius: 0, padding: 2 };
  let curveLeft = { borderTopLeftRadius: 4, borderBottomLeftRadius: 4 };
  let curveRight = { borderTopRightRadius: 4, borderBottomRightRadius: 4 };

  let typedPath = path;
  let textField = inputText(
    {
      value: path,
      onEnter: () => {
        onDirChanged(typedPath);
      },
    },
    v => { typedPath = v },
  );
  ['keydown', 'keyup'].forEach(t => textField.addEventListener(t, ev => ev.stopPropagation()));

  let upBtn = button(viewModeBtn, curveLeft, curveRight, toolbarIcons.up, () => goUpCb());

  let outer = div(
    { fullSize: true },
    div(
      { eastDock: 150, fontSize: 8, bold: true },
      div(
        { padding: 4, textAlign: 'right' },
        span({ position: 'relative', top: -8 }, "View: "),
        button({ title: 'Tiles' }, viewModeBtn, curveLeft, toolbarIcons.tiles, () => onViewChanged('TILE')),
        button({ title: 'Details' }, viewModeBtn, toolbarIcons.details, () => onViewChanged('DETAILS')),
        button({ title: 'Thumbnails' }, viewModeBtn, curveRight, toolbarIcons.thumbs, () => onViewChanged('THUMBNAILS')),
      ),
    ),
    div(
      { westStretchDock: 100 },
      div(
        { fullSize: true },
        div(
          { position: 'absolute', left: 4, width: 32, top: 4, height: 32 },
          upBtn,
        ),
        textField.set({ position: 'absolute', left: 40, top: 4, bottom: 4, right: 4 }),
      )
    ),

  );

  outer.getShownPath = () => path;
  outer.refresh = () => {
    textField.value = path;
    typedPath = path;
    upBtn.disabled = path === '/';
  };
  outer.setDir = dir => {
    if (dir === '.') dir = '/';
    if (path !== dir) {
      path = dir;
      outer.refresh();
    }
  }

  outer.refresh();

  return outer;
};
PlexiOS.registerJavaScript('app', 'io.plexi.tools.files', APP_MAIN);
})();
