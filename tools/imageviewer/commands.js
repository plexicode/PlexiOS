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
