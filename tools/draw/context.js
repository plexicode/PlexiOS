let createAppContext = (os, procInfo, starterImage) => {
  let image = starterImage;
  if (image) {
    image = wrapCanvas(image);
  } else {
    image = newCanvas(400, 300);
  }

  let ctx = {
    os,
    fs: os.FileSystem(procInfo.cwd),
    pid: procInfo.pid,
    cwd: procInfo.cwd,
    tryCloseWindow: Util.noop,
    brushSize: 5,
    brushSizeSliderValue: 32,
    compositeSurface: newCanvas(image.width, image.height).blit(image, 0, 0),
    tempSurfaces: [],

    ui: {
      tools: null,
      toolsHost: null,
      palette: null,
      paletteHost: null,
      panboardHost: null,
      panboard: null,
      artboard: null,
      clickCatcher: null,
      decorators: null,
    },

    refreshTitle: Util.noop,
    refreshColorTile: Util.noop,
    fillCache: {
      visited: [],
      fillCounter: 1,
    },
    activeTool: 'NONE',
    onToolUpdated: [],
    activeColor: [0, 0, 0, 255],

    doc: null,

    resetDocument: (path, initialImage) => {
      ctx.doc = {
        filePath: path,
        image: initialImage,
        undoStack: [],
        undoIndex: 0,
        previewUndoUnit: null,
        dirtyUndoIndex: 0,
        viewport: {
          centerX: initialImage.width / 2,
          centerY: initialImage.height / 2,
          zoom: 1.0,
        },
        renderBounds: null,
      };
    },
  };

  ctx.resetDocument(null, image);

  return ctx;
};
