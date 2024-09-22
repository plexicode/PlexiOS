let createMenu = (id, ctx, os) => {
  let {
    createCommand, createMenu, createMenuItem, createMenuSep, MENU_CTRL_CMD, MENU_CTRL, MENU_SHIFT, MENU_ALT
  } = os.Shell.MenuBuilder;

  switch (id) {
    case '': return createMenu([
      createMenuItem('file', "_File"),
      createMenuItem('edit', "_Edit"),
      createMenuItem('view', "_View"),
      createMenuItem('image', "_Image"),
    ]);

    case 'file': return createMenu([
      createMenuItem('new', "_New").withShortcut('F2'),
      createMenuItem('open', "_Open").withShortcut(MENU_CTRL_CMD, 'O'),
      createMenuItem('save', "_Save").withShortcut(MENU_CTRL_CMD, 'S'),
      createMenuItem('saveas', "Save _As").withShortcut(MENU_CTRL_CMD, MENU_SHIFT, 'S'),
      createMenuSep(),
      createMenuItem('exit', "E_xit"),
    ]);

    case 'edit': return createMenu([
      createMenuItem('undo', "_Undo").withShortcut(MENU_CTRL_CMD, 'Z'),
      createMenuItem('redo', "_Redo").withShortcut(MENU_CTRL_CMD, 'Y'),
      createMenuSep(),
      createMenuItem('cut', "Cu_t").withShortcut(MENU_CTRL_CMD, 'X'),
      createMenuItem('copy', "_Copy").withShortcut(MENU_CTRL_CMD, 'C'),
      createMenuItem('paste', "_Paste").withShortcut(MENU_CTRL_CMD, 'V'),
      createMenuSep(),
      createMenuItem('selectall', "Select _All").withShortcut(MENU_CTRL_CMD, 'A'),
      createMenuItem('delete', "_Delete Selection").withShortcut('Delete'),
    ]);

    case 'view': return createMenu([
      createMenuItem('zoomin', "Zoom _In"),
      createMenuItem('zoomout', "Zoom _Out"),
      createMenuItem('zoomdef', "Default Zoom"),
      //createMenuSep(),
      //createMenuItem('fullscreen', "Show Full Screen"),
    ]);

    case 'image': return createMenu([
      createMenuItem('size', "Document Size").withShortcut(MENU_CTRL_CMD, 'E'),
    ]);

    case 'file:new': return createCommand(() => newDocument(ctx));
    case 'file:save': return createCommand(() => saveFile(ctx));
    case 'file:saveas': return createCommand(() => saveFileAs(ctx));
    case 'file:exit': return createCommand(() => ctx.tryCloseWindow());
    case 'file:open': return createCommand(() => showOpenFileDialog(os, ctx));
    case 'edit:undo': return createCommand(() => doUndo(ctx));
    case 'edit:redo': return createCommand(() => doRedo(ctx));
    case 'edit:copy': return createCommand(() => clipboardCopy(ctx));
    case 'edit:cut': return createCommand(() => clipboardCopy(ctx, true));
    case 'edit:paste': return createCommand(() => clipboardPaste(ctx));
    case 'edit:selectall': return createCommand(() => selectAll(ctx));
    case 'edit:delete': return createCommand(() => deleteSelection(ctx));
    case 'view:zoomin': return createCommand(() => setZoom(ctx, 1));
    case 'view:zoomout': return createCommand(() => setZoom(ctx, -1));
    case 'view:zoomdef': return createCommand(() => setZoom(ctx, 0));
    case 'image:size': return createCommand(() => showResizeMenu(ctx));

    default: createCommand(() => console.log("TODO: " + id));
  }
};
