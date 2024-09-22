const APP_MAIN = async (os, procInfo, args) => {
  const { pid } = procInfo;

  let fs = os.FileSystem(procInfo.cwd);
  let initialImage = null;
  let initialFilePath = null;
  if (args[0] && await fs.fileExists(args[0])) {
    let imageInfo = await fs.fileReadImage(args[0]);
    if (!imageInfo.ok) {
      await os.Shell.DialogFactory.showPathDoesNotExist(pid, TITLE, fs.getAbsolutePath(args[0]));
    } else {
      initialImage = imageInfo.img;
      initialFilePath = fs.getAbsolutePath(args[0]);
    }
  }


  let ctx = createAppContext(os, procInfo, initialImage);
  ctx.doc.filePath = initialFilePath;

  let getTitle = () => {
    return [
      TITLE,
      ": ",
      (ctx.doc.dirtyUndoIndex !== ctx.doc.undoIndex) ? "*" : '',
      ctx.doc.filePath ? ctx.doc.filePath.split('/').pop() : 'Untitled Image'
    ].join('');
  };

  await os.Shell.showWindow(pid, {
    title: TITLE,
    width: 500,
    height: 400,
    destroyProcessUponClose: true,
    menuBuilder: idChain => createMenu(idChain.join(':'), ctx, os),
    onInit: (contentHost, winData) => {
      ctx.tryCloseWindow = () => winData.closeHandler();
      winData.shortcutKeyRouter
        .addKey('F2', () => newDocument(ctx))
        .addKey('CTRL+S', () => saveFile(ctx))
        .addKey('CTRL+SHIFT+S', () => saveFileAs(ctx))
        .addKey('CTRL+O', () => showOpenFileDialog(os, ctx))
        .addKey('CTRL+Z', () => doUndo(ctx))
        .addKey('CTRL+Y', () => doRedo(ctx))
        .addKey('CTRL+C', () => clipboardCopy(ctx))
        .addKey('CTRL+X', () => clipboardCopy(ctx, true))
        .addKey('CTRL+V', () => clipboardPaste(ctx))
        .addKey('CTRL+A', () => selectAll(ctx))
        .addKey('DELETE', () => deleteSelection(ctx))
        .addKey('CTRL+SHIFT+Z', () => doRedo(ctx))
        .addKey('CTRL+E', () => showResizeMenu(ctx))
        .addKey('B', () => setActiveTool(ctx, 'BRUSH'))
        .addKey('H', () => setActiveTool(ctx, 'PAN'))
        .addKey('F', () => setActiveTool(ctx, 'FILL'))
        .addKey('R', () => setActiveTool(ctx, 'RECTANGLE'))
        .addKey('E', () => setActiveTool(ctx, 'DROPPER'))
        .addKey('D', () => setActiveTool(ctx, 'SMUDGE'))
        .addKey('CTRL+MINUS', () => setZoom(ctx, -1))
        .addKey('CTRL+PLUS', () => setZoom(ctx, 1))
        .addKey('CTRL+0', () => setZoom(ctx, 0));

      let lastShownTitle = null;
      ctx.refreshTitle = () => {
        let title = getTitle();
        if (lastShownTitle !== title) winData.setTitle(title);
      };

      contentHost.append(createLayout(ctx));
      render(ctx);
    },
    onKey: (ev, isDown) => {
      if (ev.code === 'Space') {
        ctx.panMode = isDown;
      }
    },
    onResize: (w, h) => {
      let {
        artboard,
        decorators,
      } = ctx.ui;
      artboard.width = w;
      artboard.height = h;
      decorators.width = w;
      decorators.height = h;
      render(ctx);
    },
    onShown: () => {
      ctx.refreshColorTile();
      setActiveTool(ctx, 'BRUSH');
    },
  });
};
