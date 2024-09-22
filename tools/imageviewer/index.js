const TITLE = "Image Viewer";
let WINDOW_DEFAULT_WIDTH = 500;
let WINDOW_DEFAULT_HEIGHT = 380;

let showOpenDialog = async (os, pid, cwd) => {
  return os.Shell.DialogFactory.openFile(pid, cwd, { title: TITLE });
};

const APP_MAIN = async (os, procInfo, args) => {
  const { div } = HtmlUtil;
  const { pid } = procInfo;

  let fs = os.FileSystem(procInfo.cwd);
  let file = args[0];
  if (!file) {
    file = await showOpenDialog(os, pid, procInfo.cwd);
    if (!file) return;
  }

  let initialFileAbsPath = fs.getAbsolutePath(file);

  let ctx = {
    os,
    fs,
    pid,
    cwd: procInfo.cwd,
    winSize: { width: 500, height: 380 },
  };

  let menuBuilder = (idChain) => {
    let { createMenu, createMenuItem, createMenuSep, createCommand } = os.Shell.MenuBuilder;

    switch (idChain.join('|')) {
      case '':
        return createMenu(
          createMenuItem('file', "_File"),
          // createMenuItem('help', "_Help"),
        );

      case 'file':
        return createMenu(
          createMenuItem('open', "_Open").withShortcut('CTRL', 'O'),
          createMenuItem('bg', "Set as _Background").withShortcut('CTRL', 'B'),
          createMenuItem('savecopy', "Save Copy").withShortcut('CTRL', 'S'),
          createMenuSep(),
          createMenuItem('next', "View next file").withShortcut('RIGHT'),
          createMenuItem('prev', "View previous file").withShortcut('LEFT'),
          createMenuSep(),
          createMenuItem('exit', "_Exit"),
        );

      case 'file|bg': return createCommand(() => setBackground(ctx));
      case 'file|savecopy': return createCommand(() => saveImageCopy(ctx));
      case 'file|open': return createCommand(() => openImageDialog(ctx));
      case 'file|exit': return createCommand(() => ctx.win.closeHandler());
      case 'file|next': return createCommand(() => cycleImage(ctx, 1));
      case 'file|prev': return createCommand(() => cycleImage(ctx, -1));
    }
  };

  await os.Shell.showWindow(pid, {
    title: TITLE,
    menuBuilder,
    innerWidth: ctx.winSize.width,
    innerHeight: ctx.winSize.height,
    destroyProcessUponClose: true,
    onResize: (w, h) => {
      ctx.winSize = { width: w, height: h };
      ctx.surface.updateSize(w, h - 64);
    },
    onInit: async (contentHost, winData) => {
      ctx.win = winData;

      winData.shortcutKeyRouter
        .addKey('LEFT', () => cycleImage(ctx, -1))
        .addKey('RIGHT', () => cycleImage(ctx, 1))
        .addKey('CTRL+S', () => saveImageCopy(ctx))
        .addKey('CTRL+O', () => loadImage())
        .addKey('CTRL+B', () => setBackground(ctx));

      let content = div({
        fullSize: true,
        backgroundColor: '#fff',
        color: '#000',
        overflow: 'hidden',
      });

      ctx.ui = createLayout(ctx, content);
      if (!await loadImage(ctx, initialFileAbsPath)) {
        ctx.win.closeHandler();
      } else {
        contentHost.append(content);
      }
    },
  });
};
