const TOOLS_WIDTH = 60;
const PALETTE_HEIGHT = 80;

let createLayout = (ctx) => {

  let layout = div(FULLSZ, {
    backgroundColor: '#444',
    color: '#fff',
  });

  let ui = ctx.ui;
  ui.toolsHost = div({ westDock: 60, backgroundColor: '#aaa' });
  ui.tools = createToolbar(ctx);
  ui.toolsHost.set(ui.tools);
  ui.paletteHost = div({ position: 'absolute', left: 60, right: 0, bottom: 0, height: 52, backgroundColor: '#888' });
  ui.palette = createPaletteBar(ctx);
  ui.paletteHost.set(ui.palette);
  initPanBoard(ctx);

  return layout.set(
    ui.panboardHost,
    ui.toolsHost,
    ui.paletteHost);
};

let initPanBoard = (ctx) => {
  let ui = ctx.ui;

  ui.artboard = canvas(FULLSZ);
  ui.artboard.width = 100;
  ui.artboard.height = 100;

  ui.decorators = canvas(FULLSZ);
  ui.decorators.width = 100;
  ui.decorators.height = 100;

  ui.clickCatcher = div(FULLSZ, { userSelect: 'none', touchAction: 'none' });

  let getArtboardCoord = ev => {
    let bcr = ui.clickCatcher.getBoundingClientRect();
    let x = ev.pageX - bcr.left;
    let y = ev.pageY - bcr.top;
    let coord = { x, y };
    let b = ctx.doc.renderBounds;
    if (b) {
      let rx = (x - b.x) / b.width;
      let ry = (y - b.y) / b.height;
      coord.px = Math.floor(rx * ctx.doc.image.width);
      coord.py = Math.floor(ry * ctx.doc.image.height);
    }
    return coord;
  };
  let getTool = () => TOOLS[ctx.activeTool] || {};

  let activeGesture = null;
  ui.clickCatcher.addEventListener('pointerdown', ev => {
    ui.clickCatcher.setPointerCapture(ev.pointerId);
    ev.stopPropagation();
    ev.preventDefault();
    let tool = getTool();
    activeGesture = { current: getArtboardCoord(ev), data: {} };
    activeGesture.start = { ...activeGesture.current };
    activeGesture.prev = { ...activeGesture.current };
    if (tool.onDown) tool.onDown(ctx, activeGesture);
  });
  ui.clickCatcher.addEventListener('pointerup', ev => {
    if (!activeGesture) return;
    ui.clickCatcher.releasePointerCapture(ev.pointerId);
    ev.stopPropagation();
    ev.preventDefault();
    let tool = getTool();
    if (tool.onRelease) tool.onRelease(ctx, activeGesture);
  });
  ui.clickCatcher.addEventListener('pointermove', ev => {
    if (!activeGesture) return;
    ev.stopPropagation();
    ev.preventDefault();
    let tool = getTool();
    activeGesture.current = getArtboardCoord(ev);
    if (tool.onDrag) tool.onDrag(ctx, activeGesture);
    activeGesture.prev = activeGesture.current;
  });

  let wheelThrottle = 0;
  ui.clickCatcher.addEventListener('wheel', ev => {
    let now = Util.getTime();
    if (now - wheelThrottle < 0.05) return;
    wheelThrottle = now;

    let amt = Math.round(ev.deltaY / 20);
    if (amt) {
      let loc = getArtboardCoord(ev);
      // TODO: use loc once panning logic is implemented.
      if (amt < 0) {
        setZoom(ctx, 1);
      } else {
        setZoom(ctx, -1);
      }
    }
  });

  ui.panboardHost = div(
    FULLSZ,
    ui.artboard,
    ui.decorators,
    ui.clickCatcher,
  );
};
