let checkers = null;
let getCheckers = () => {
  if (!checkers) {
    const size = 12;
    const rows = 8;
    const width = size * rows;
    checkers = newCanvas(width, width).drawRect(0, 0, width, width, 255, 255, 255);
    for (let y = 0; y < width; y += size * 2) {
      for (let x = 0; x < width; x += size * 2) {
        checkers
          .drawRect(x, y, size, size, 192, 192, 192)
          .drawRect(x + size, y + size, size, size, 192, 192, 192);
      }
    }
  }
  return checkers;
};
let render = ctx => {
  let checkers = getCheckers();

  let { artboard, decorators } = ctx.ui;
  let winSize = artboard.getBoundingClientRect();

  let width = Math.floor(winSize.width);
  let height = Math.floor(winSize.height);
  if (artboard.width !== width || artboard.height !== height) {
    artboard.width = width;
    artboard.height = height;
    decorators.width = width;
    decorators.height = height;
    decorators.getContext('2d').clearRect(0, 0, width, height);
  }

  let g = artboard.getContext('2d');
  g.imageSmoothingEnabled = false;

  for (let y = 0; y < height; y += checkers.height) {
    for (let x = 0; x < width; x += checkers.width) {
      g.drawImage(checkers.canvas, x, y);
    }
  }

  const SHADE_COLOR = 'rgba(0, 0, 0, 0.7)';

  if (!ctx.doc.image) {
    g.fillStyle = SHADE_COLOR;
    g.fillRect(0, 0, width, height);
    return;
  }

  generateCompositeSurface(ctx);

  let renderedImage = ctx.compositeSurface;
  // minor adjustment due to toolbar occlusion
  let actualCenterX = width / 2 + TOOLS_WIDTH / 2;
  let actualCenterY = height / 2 - PALETTE_HEIGHT / 2;

  let zoom = ctx.doc.viewport.zoom;
  let viewportCenterX = ctx.doc.viewport.centerX;
  let viewportCenterY = ctx.doc.viewport.centerY;
  let renderedLeft = Math.floor(actualCenterX - viewportCenterX * zoom);
  let renderedTop = Math.floor(actualCenterY - viewportCenterY * zoom);
  let renderedWidth = renderedImage.width * zoom;
  let renderedHeight = renderedImage.height * zoom;

  ctx.doc.renderBounds = {
    x: renderedLeft,
    y: renderedTop,
    width: renderedWidth,
    height: renderedHeight,
  };

  let shade = {
    TOP: { left: 0, top: 0, right: Math.floor(width), bottom: Math.floor(renderedTop) },
    BOTTOM: { left: 0, top: Math.floor(renderedTop + renderedHeight), right: Math.floor(width), bottom: Math.floor(height) },
    LEFT: { left: 0, right: Math.floor(renderedLeft) },
    RIGHT: { left: Math.floor(renderedLeft + renderedWidth), right: Math.floor(width) },
  };
  shade.LEFT.top = shade.TOP.bottom;
  shade.LEFT.bottom = shade.BOTTOM.top;
  shade.RIGHT.top = shade.TOP.bottom;
  shade.RIGHT.bottom = shade.BOTTOM.top;

  Object.values(shade).forEach(rect => {
    let width = rect.right - rect.left;
    let height = rect.bottom - rect.top;
    if (width > 0 && height > 0) {
      g.fillStyle = SHADE_COLOR;
      g.fillRect(rect.left, rect.top, width, height);
    }
  });

  g.drawImage(renderedImage.canvas, renderedLeft, renderedTop, renderedWidth, renderedHeight);

  let uu = ctx.doc.previewUndoUnit;
  let selection = uu ? uu.getSelectionBounds() : null;
  if (selection) {
    let { left, top, width, height } = selection;
    let right = left + Math.max(1, width);
    let bottom = top + Math.max(1, height);
    let imgWidth = ctx.doc.image.width;
    let imgHeight = ctx.doc.image.height;
    let leftRatio = left / imgWidth;
    let rightRatio = right / imgWidth;
    let topRatio = top / imgHeight;
    let bottomRatio = bottom / imgHeight;
    let finalLeft = leftRatio * renderedWidth + renderedLeft;
    let finalTop = topRatio * renderedHeight + renderedTop;
    let finalRight = rightRatio * renderedWidth + renderedLeft;
    let finalBottom = bottomRatio * renderedHeight + renderedTop;

    let lines = [
      [finalLeft, finalTop, finalRight - finalLeft, 1],
      [finalLeft, finalTop, 1, finalBottom - finalTop],
      [finalRight - 1, finalTop, 1, finalBottom - finalTop],
      [finalLeft, finalBottom - 1, finalRight - finalLeft, 1],
    ];
    g.fillStyle = '#000';
    for (let line of lines) {
      let [x, y, w, h] = line;
      g.fillRect(x - 1, y - 1, w + 2, h + 2);
    }
    g.fillStyle = '#fff';
    for (let line of lines) {
      let [x, y, w, h] = line;
      g.fillRect(x, y, w, h);
    }
  }
  ctx.refreshTitle();
};

let generateCompositeSurface = ctx => {

  let { doc, compositeSurface } = ctx;
  let { image } = doc;
  let { width, height } = image;

  if (!compositeSurface || compositeSurface.width !== width || compositeSurface.height !== height) {
    compositeSurface = newCanvas(image.width, image.height).enableNearestNeighbor();
    ctx.compositeSurface = compositeSurface;
    compositeSurface.blit(image, 0, 0);
    ctx.compositeSurfaceMode = 'BASE';
  }

  if (doc.previewUndoUnit) {
    let uu = doc.previewUndoUnit;
    if (uu.isTempSurf || uu.isFloat) {
      ctx.compositeSurface.clear();
      // TODO: to save computation, you can clear and re-blit just the affected region
      ctx.compositeSurface.blit(uu.getMutableSurface(), 0, 0);
      let float = uu.getFloatData();
      if (float) {
        ctx.compositeSurface.blit(float.img, float.left, float.top);
      }
    } else if (uu.isTransOverlay || uu.isNoop()) {
      ctx.compositeSurface.clear();
      ctx.compositeSurface.blit(ctx.doc.image, 0, 0);
      if (uu.isTransOverlay) {
        let alpha = uu.getTransparency();
        if (alpha > 0) {
          let mut = uu.getMutableSurface();
          mut.pushAlpha(alpha);
          ctx.compositeSurface
            .blit(uu.getMutableSurface(), 0, 0);
          mut.popAlpha();
        }
      }
    } else {
      throw new Error();
    }
  } else {
    ctx.compositeSurface.clear();
    ctx.compositeSurface.blit(ctx.doc.image, 0, 0);
  }
};
