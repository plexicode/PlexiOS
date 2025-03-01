const APP_MAIN = async (os, procInfo, args) => {
  const { pid } = procInfo;
  let onClose = null;
  let promise = new Promise(res => { onClose = res; });

  let scopedFs = os.FileSystem(procInfo.cwd);
  let startingDir = scopedFs.getAbsolutePath(args.length ? args[0] : '/');

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


  console.log(dir);

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
