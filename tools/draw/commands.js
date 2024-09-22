let showOpenFileDialog = async (os, ctx) => {
  if (ctx.isDirty) {
    let sure = await os.Shell.DialogFactory.showYesNoToBool(ctx.pid, TITLE, "You have unsaved changes. Are you sure you want to open another file?");
    if (!sure) return;
  }
  let path = await os.Shell.DialogFactory.openFile(ctx.pid, ctx.cwd, {});
  if (path) openFile(path);
};

let openFile = path => {
  console.log("TODO: open file: " + path);
};

let saveFileAs = async (ctx) => {
  let hintPath = ctx.doc.filePath;
  let dir = hintPath ? ctx.fs.getParent(ctx.fs.getAbsolutePath(hintPath)) : ctx.cwd;
  let filename = hintPath ? hintPath.split('/').pop() : 'untitled.png';
  let target = await ctx.os.Shell.DialogFactory.saveFile(
    ctx.pid,
    dir,
    {
      promptOverwrite: true,
      title: TITLE,
      initialName: filename,
    });
  if (target) {
    ctx.doc.filePath = target;
    saveFile(ctx);
  }
};

let saveFile = async (ctx) => {
  if (!ctx.doc.filePath) return saveFileAs(ctx);
  let status = await ctx.fs.fileWriteImageCanvas(ctx.doc.filePath, ctx.doc.image.canvas);
  if (!status.ok) {
    console.error(status.error);
    return;
  }
  ctx.doc.dirtyUndoIndex = ctx.doc.undoIndex;
  ctx.refreshTitle();
};

let setZoom = (ctx, dir) => {
  if (dir === 0) ctx.doc.viewport.zoom = 1;
  else if (dir < 0) ctx.doc.viewport.zoom *= Math.sqrt(0.5);
  else ctx.doc.viewport.zoom *= Math.sqrt(2);
  ctx.doc.viewport.zoom = Math.floor(ctx.doc.viewport.zoom * 1024 + 0.5) / 1024;
  render(ctx);
};

let clipboardCopy = (ctx, isCut) => {
  let uu = ctx.doc.previewUndoUnit;
  if (!uu || !uu.isFloat) return;
  let { img } = uu.getFloatData();
  ctx.os.Clipboard.copyImage(img.canvas);
  if (isCut) {
    uu.clearFloatingSurface();
    commitLingeringUndoUnit(ctx);
  }
};

let clipboardPaste = async (ctx) => {
  let pasteData = await ctx.os.Clipboard.paste('IMAGE');
  if (pasteData.type === 'IMAGE') {
    let injectImage = await Promise.resolve(pasteData.image);
    commitLingeringUndoUnit(ctx);
    ctx.doc.previewUndoUnit = createUndoUnit(ctx, 'FLOATING_SELECTION', { injectImage });
    ctx.activeTool = 'SELECT';
    render(ctx);
  }
};

let selectAll = async (ctx) => {
  commitLingeringUndoUnit(ctx);
  setActiveTool(ctx, 'SELECT');
  ctx.doc.previewUndoUnit = createUndoUnit(ctx, 'FLOATING_SELECTION', {
    selectionBounds: twoPointsToRect(0, 0, ctx.doc.image.width, ctx.doc.image.height),
  });
  render(ctx);
};

let deleteSelection = async (ctx) => {
  let uu = ctx.doc.previewUndoUnit;
  if (!uu || !uu.isFloat) return;
  uu.clearFloatingSurface();
  commitLingeringUndoUnit(ctx);
  setTimeout(() => render(ctx), 10);
};

let newDocument = async (ctx) => {
  // TODO: check if document is dirty.

  let { inputText } = HtmlUtil;
  let { os, pid } = ctx;

  let oldImg = ctx.doc.image || {};

  let errPane = div({ color: '#f00' });
  let newWidth = oldImg.width || 400;
  let newWidthStr = newWidth + '';
  let newHeight = oldImg.height || 300;
  let newHeightStr = newHeight + '';

  let verify = () => {
    let w = Math.max(1, Math.min(Util.ensureInteger(parseInt(newWidthStr)), 65535));
    let h = Math.max(1, Math.min(Util.ensureInteger(parseInt(newHeightStr)), 65535));
    errPane.clear();
    let wValid = w + '' === newWidthStr;
    let hValid = h + '' === newHeightStr;
    let msg = "Dimensions must be valid integers between 1 and 65535.";
    if (!wValid && !hValid) errPane.set("Width and height are both invalid. " + msg);
    else if (!wValid) errPane.set("Width is not valid. " + msg);
    else if (!hValid) errPane.set("Height is not valid. " + msg);
    else return [w, h];
    return false;
  };

  let widthEdit = inputText({ value: newWidth }, (v) => { newWidthStr = v; verify(); });
  let heightEdit = inputText({ value: newHeight }, (v) => { newHeightStr = v; verify(); });

  // TODO: onShown for dialogs.
  setTimeout(() => widthEdit.focus(), 20);

  let result = await os.Shell.DialogFactory.showOkCancelToBool(
    pid,
    "Draw: New Document",
    div(
      div("Width: ", widthEdit),
      div("Height: ", heightEdit),
      errPane,
    )
  );

  if (!result) return;
  let dim = verify();
  if (!dim) return newDocument(ctx);

  ctx.resetDocument(null, newCanvas(dim[0], dim[1]));
  render(ctx);
};
