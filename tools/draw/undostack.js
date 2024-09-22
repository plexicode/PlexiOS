let getTempSurface = (ctx, cleared) => {
  if (ctx.tempSurfaces.length) {
    let ts = ctx.tempSurfaces.pop();
    if (ts.width === ctx.doc.image.width && ts.height === ctx.doc.image.height) {
      if (cleared) ts.clear();
      return ts;
    }
    ctx.tempSurfaces = [];
  }
  return newCanvas(ctx.doc.image.width, ctx.doc.image.height);
};

let releaseTempSurface = (ctx, surf) => {
  ctx.tempSurfaces.push(surf);
};

let createUndoUnit = (ctx, type, options) => {

  options = options || {};
  let isTempSurf = type === 'TEMP_SURF';
  let isTransOverlay = type === 'TRANSPARENT_OVERLAY';
  let isSelection = type === 'FLOATING_SELECTION';
  let isFullTransplant = type === 'FULL_TRANSPLANT';
  let isNoop = type === 'NOOP';
  if (!isTempSurf && !isTransOverlay && !isSelection && !isNoop && !isFullTransplant) throw new Error();

  let boxesBefore = [];
  let boxesAfter = [];
  let left = null;
  let right = null;
  let top = null;
  let bottom = null;
  let alpha = 255;

  let original = ctx.doc.image;
  let mutable = (isNoop || isFullTransplant) ? null : getTempSurface(ctx, true);
  let floating = null;
  let floatDim = null;

  if (isNoop) {
    if (options.selectionBounds) {
      let b = options.selectionBounds;
      if (b) {
        floatDim = { left: b.left, top: b.top, width: b.width, height: b.height };
      }
    }
  } else if (isFullTransplant) {
    mutable = newCanvas(options.img.width, options.img.height).blit(options.img, 0, 0)
  } else if (isTempSurf) {
    mutable.blit(original, 0, 0);
  } else if (isSelection) {
    mutable.blit(original, 0, 0);
    if (options.injectImage) {
      let img = options.injectImage;
      floating = newCanvas(img.width, img.height);
      floating.blit(img, 0, 0);
      let dim = { left: 0, top: 0, width: img.width, height: img.height };
      floatDim = { ...dim, original: { ...dim }, vacated: null };
    } else {
      let { left, top, right, bottom } = options.selectionBounds;
      let width = right - left;
      let height = bottom - top;

      mutable.clear(left, top, width, height);
      floating = newCanvas(width, height, false);
      floating.blit(original, -left, -top);
      let dim = { left, top, width, height };
      floatDim = { ...dim, original: { ...dim }, vacated: { ...dim } };
    }
  }

  let applyBoxes = (boxes) => {
    if (uu.isMutationMode) throw new Error();
    if (isFullTransplant) {
      ctx.doc.image = newCanvas(boxes[0].box.width, boxes[0].box.height);
    }
    for (let box of boxes) {
      ctx.doc.image.clear(box.x, box.y, box.w, box.h);
      ctx.doc.image.blit(box.box, box.x, box.y);
    }
  };

  let uu = {
    isTempSurf,
    isTransOverlay,
    undo: () => {
      applyBoxes(boxesBefore);
    },
    redo: () => {
      applyBoxes(boxesAfter);
    },

    isMutationMode: true,
    getMutableSurface: () => mutable,
    getFloatData: () => {
      if (floating) {
        let { original, vacated } = floatDim;
        return {
          img: floating,
          ...floatDim,
          original: { ...original },
          vacated: vacated ? { ...vacated } : null,
        };
      }
      return null;
    },
    swapOutFloatImage: (img) => {
      if (!floating) return;
      let w = img.width;
      let h = img.height;
      floating = newCanvas(w, h);
      floating.blit(img, 0, 0);
      floatDim.width = w;
      floatDim.height = h;
    },
    isFloat: isSelection,
    setFloatOffset: (x, y) => {
      if (floatDim) {
        floatDim.left = x;
        floatDim.top = y;
      }
    },
    clearFloatingSurface: () => {
      floating = null;
      render(ctx);
    },
    getSelectionBounds: () => {
      if (floatDim) {
        let { left, top, width, height } = floatDim;
        return { left, top, width, height, right: left + width, bottom: top + height };
      }
      return null;
    },
    isNoop: () => {

      // well, by definition
      if (isNoop) return true;

      // Pasting in content, but then deleting it
      if (isSelection && !floating && !floatDim.vacated) return true;

      // if it's a region selection but nothing actually changed position while it was selected...
      if (isSelection && floating) {
        let { left, top, width, height } = floatDim.left;
        let o = floatDim.original;
        if (o.left === left && o.width === width && o.top === top && o.height === height) return true;
      }

      return false;
    },
    clearTouchedPixels: () => {
      left = null;
      return uu;
    },
    touchPixel: (x, y) => {
      x = Math.floor(x);
      y = Math.floor(y);
      if (left === null) {
        left = x - 2;
        right = x + 2;
        top = y - 2;
        bottom = y + 2;
      } else {
        left = Math.min(x - 2, left);
        right = Math.max(x + 2, right);
        top = Math.min(y - 2, top);
        bottom = Math.max(y + 2, bottom);
      }
      return uu;
    },
    setTransparency: a => {
      alpha = Math.max(0, Math.min(255, Math.floor(a)));
      return uu;
    },
    getTransparency: () => alpha,
    lock: () => {
      if (!uu.isMutationMode) throw new Error();
      if (left === null) uu.touchPixel(0, 0);
      left = Math.max(0, left);
      right = Math.min(right, ctx.doc.image.width);
      top = Math.max(0, top);
      bottom = Math.min(bottom, ctx.doc.image.height);
      let width = right - left;
      let height = bottom - top;
      uu.touchPixel = undefined;

      if (isFullTransplant) {
        boxesBefore.push({
          box: newCanvas(original.width, original.height).blit(original, 0, 0),
          x: 0, y: 0,
          w: original.width, h: original.height,
        });
        boxesAfter.push({
          box: newCanvas(mutable.width, mutable.height).blit(mutable, 0, 0),
          x: 0, y: 0,
          w: mutable.width, h: mutable.height,
        });
      } else {
        if (!isSelection) {
          // selection doesn't use the touched pixels system and will calculate its own before boxes.
          boxesBefore.push({ box: newCanvas(width, height).blit(original, -left, -top), x: left, y: top, w: width, h: height });
        }

        if (isTempSurf) {
          boxesAfter.push({ box: newCanvas(width, height).blit(mutable, -left, -top), x: left, y: top, w: width, h: height });
        } else if (isTransOverlay) {
          let newBox = newCanvas(width, height).blit(original, -left, -top);
          mutable.pushAlpha(alpha);
          newBox.blit(mutable, -left, -top)
          mutable.popAlpha();
          boxesAfter.push({ box: newBox, x: left, y: top, w: width, h: height });
        } else if (isSelection) {
          // TODO: convert this for real. For now, just copy the entire before and after versions.
          let img = original;
          let imgWidth = img.width;
          let imgHeight = img.height;
          let canvasBefore = newCanvas(imgWidth, imgHeight).blit(original, 0, 0);
          let canvasAfter = newCanvas(imgWidth, imgHeight).blit(original, 0, 0);
          let vac = floatDim.vacated;
          if (vac) {
            canvasAfter.clear(vac.left, vac.top, vac.width, vac.height);
          }
          if (floating) {
            canvasAfter.blit(floating, floatDim.left, floatDim.top);
          }
          boxesBefore.push({ box: canvasBefore, x: 0, y: 0, w: imgWidth, h: imgHeight });
          boxesAfter.push({ box: canvasAfter, x: 0, y: 0, w: imgWidth, h: imgHeight });
        } else {
          throw new Error();
        }
      }

      releaseTempSurface(ctx, mutable);
      uu.isMutationMode = false;

      // prevent memory leak
      mutable = null;
      original = null;

      return Object.freeze(uu);
    },
  };
  return uu;
};

let commitLingeringUndoUnit = (ctx) => {
  let uu = ctx.doc.previewUndoUnit;
  if (!uu) return false;

  // Undo units that do nothing should just be discarded outright.
  if (uu.isNoop()) {
    ctx.doc.previewUndoUnit = null;
    render(ctx);
    return false;
  }

  while (ctx.doc.undoStack.length > ctx.doc.undoIndex) ctx.doc.undoStack.pop();
  uu.lock();
  ctx.doc.undoStack.push(uu);
  ctx.doc.previewUndoUnit = null;
  ctx.doc.undoIndex = ctx.doc.undoStack.length;
  uu.redo();
  render(ctx);
  return true;
};

let doUndo = (ctx) => {
  ctx.doc.previewUndoUnit = null;
  if (ctx.doc.undoIndex - 1 >= 0) {
    let uu = ctx.doc.undoStack[--ctx.doc.undoIndex];
    uu.undo();
  }
  ctx.compositeSurface.clear().blit(ctx.doc.image, 0, 0);
  render(ctx);
  ctx.refreshTitle();
};

let doRedo = (ctx) => {
  ctx.doc.previewUndoUnit = null;
  if (ctx.doc.undoIndex < ctx.doc.undoStack.length) {
    let uu = ctx.doc.undoStack[ctx.doc.undoIndex++];
    uu.redo();
  }
  ctx.compositeSurface.clear().blit(ctx.doc.image, 0, 0);
  render(ctx);
  ctx.refreshTitle();
};
