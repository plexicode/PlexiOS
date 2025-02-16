(async () => {
const { Util, HtmlUtil } = PlexiOS;
const APP_RAW_IMAGE_DATA = await Util.loadImageB64Lookup({

  'icon.png': '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',
});

let createLayout = (ctx, root) => {
  let { button, div } = HtmlUtil;

  let ui = {
    viewerArea: div(),
    navPanel: div(),
    optionPanel: div(),
    buttons: {
      navLeft: button({ html: '&larr;' }, () => cycleImage(ctx, -1)),
      navRight: button({ html: '&rarr;' }, () => cycleImage(ctx, 1)),
      actualSize: button('act sz'),
      fitSize: button('fit to scr'),
      zoomIn: button('zoom in'),
      zoomOut: button('zoom out'),
      rotateCCW: button({ html: '&#8630;' }, () => rotateImage(ctx, 1).then(() => refreshImage(ctx))),
      rotateCW: button({ html: '&#8631;' }, () => rotateImage(ctx).then(() => refreshImage(ctx))),
      crop: button('crop'),
      effects: button('effects'),
    },
  };

  root.set(
    { fullSize: true },
    ui.viewerArea.set({ northStretchDock: 64 }),
    div(
      { southDock: 64, backgroundColor: '#000', borderTop: '1px solid #444' },
      ui.navPanel.set(
        { westDock: 100 },
        ui.buttons.navLeft, ui.buttons.navRight,
      ),
      ui.optionPanel.set(
        { eastStretchDock: 100, textAlign: 'right' },
        //ui.buttons.actualSize,
        //ui.buttons.fitSize,
        //ui.buttons.zoomIn,
        //ui.buttons.zoomOut,
        ui.buttons.rotateCCW,
        ui.buttons.rotateCW,
        //ui.buttons.crop,
        //ui.buttons.effects,
      ),
    ),
  );

  return ui;
};
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
let createSurface = (ctx, host) => {

  let canvas = HtmlUtil.canvas({ fullSize: true });
  let g = canvas.getContext('2d');

  let srcWidth = ctx.canvas.width;
  let srcHeight = ctx.canvas.height;
  let srcWhRatio = srcWidth / srcHeight;

  let dstWidth = 100;
  let dstHeight = 100;

  host.clear().set({ cursor: 'grab', backgroundColor: '#445' }, canvas);

  let render = () => {

    let dstWhRatio = Math.max(1, dstWidth) / Math.max(1, dstHeight);
    let dstRenderWidth;
    let dstRenderHeight;
    if (dstWhRatio < srcWhRatio) {
      dstRenderWidth = dstWidth;
      dstRenderHeight = dstRenderWidth / srcWhRatio;
    } else {
      dstRenderHeight = dstHeight;
      dstRenderWidth = dstHeight * srcWhRatio;
    }

    let xOffset = (dstWidth - dstRenderWidth) >> 1;
    let yOffset = (dstHeight - dstRenderHeight) >> 1;

    g.fillStyle = '#42454b';
    g.fillRect(0, 0, dstWidth, dstHeight);

    g.drawImage(
      ctx.canvas,
      xOffset, yOffset,
      Math.floor(dstRenderWidth + 0.5), Math.floor(dstRenderHeight + 0.5));
  };

  return {
    updateSize: (w, h) => {
      dstWidth = w;
      dstHeight = h;
      canvas.width = w;
      canvas.height = h;
      render();
    },
  };
};
let openImageDialog = async (ctx) => {
  let { os, pid, fs, cwd } = ctx;
  let newFilePath = await showOpenDialog(os, pid, cwd);
  if (!newFilePath) return;
  if (!await fs.fileExists(newFilePath)) {
    return os.Shell.DialogFactory.showPathDoesNotExist(pid, TITLE, newFilePath);
  }
  return loadImage(ctx, newFilePath);
};

let loadImage = async (ctx, path) => {
  ctx.fullPath = ctx.fs.getAbsolutePath(path);
  if (!await ctx.fs.fileExists(ctx.fullPath)) {
    await ctx.os.Shell.DialogFactory.showPathDoesNotExist(ctx.pid, TITLE, ctx.fullPath);
    return false;
  }

  let fileInfo = await ctx.fs.fileReadImage(ctx.fullPath);
  if (!fileInfo.ok) {
    await ctx.os.Shell.DialogFactory.showOkCancelToBool(ctx.pid, TITLE, "The file " + ctx.fullPath + " is not a valid image file.");
    return false;
  }

  ctx.canvas = fileInfo.img;
  ctx.surface = createSurface(ctx, ctx.ui.viewerArea);
  let { width, height } = ctx.winSize;
  ctx.surface.updateSize(width, height - 64);

  return true;
};

let refreshImage = (ctx) => loadImage(ctx, ctx.fullPath);

let rotateImage = async (ctx, isCcw) => {
  let imgInfo = await ctx.fs.fileReadImage(ctx.fullPath);
  if (imgInfo.ok) {
    let oldImg = imgInfo.img;
    let w = oldImg.width;
    let h = oldImg.height;
    let newImg = document.createElement('canvas');
    newImg.width = h;
    newImg.height = w;
    let g = newImg.getContext('2d');
    g.save();
    let cx = newImg.width / 2;
    let cy = newImg.height / 2;
    let ang = Math.PI / 2 * (isCcw ? -1 : 1);
    g.translate(cx, cy);
    g.rotate(ang);
    g.translate(-cy, -cx); // x-y swap intentional
    g.drawImage(oldImg, 0, 0);
    g.restore();
    await ctx.fs.fileWriteImageCanvas(ctx.fullPath, newImg, imgInfo.metadata);
  }
};

let cycleImage = async (ctx, direction) => {
  let fs = ctx.os.FsRoot;
  let parent = fs.getParent(ctx.fullPath);
  let allImageFiles = [];
  for (let file of await fs.legacyList(parent)) {
    let t = file.split('.');
    if (t.length > 1) {
      let ext = t.pop().toLowerCase();
      if (ext === 'png' || ext === 'jpg' || ext === 'jpeg') {
        allImageFiles.push(fs.join(parent, file));
      }
    }
  }
  let currentIndex = allImageFiles.indexOf(ctx.fullPath);
  let nextIndex = currentIndex === -1 ? 0 : (direction + currentIndex);
  if (!allImageFiles.length) return;
  let nextPath = allImageFiles[Util.posMod(nextIndex, allImageFiles.length)];
  if (nextPath !== ctx.fullPath) {
    await loadImage(ctx, nextPath);
  }
};

let saveImageCopy = async (ctx) => {
  let dir = ctx.fs.getParent(ctx.fullPath);
  let path = await ctx.os.Shell.DialogFactory.saveFile(ctx.pid, dir, { promptOverwrite: true, title: TITLE });
  console.log("TODO: save a copy of this file to:", path);
  if (path) {
    await ctx.fs.copy(ctx.fullPath, path);
  }
};

let setBackground = (ctx) => {
  ctx.os.Shell.setBackground(ctx.fullPath);
};
PlexiOS.registerJavaScript('app', 'io.plexi.tools.imageviewer', APP_MAIN);
})();
