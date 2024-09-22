(async () => {
const { Util, HtmlUtil } = PlexiOS;
const APP_RAW_IMAGE_DATA = await Util.loadImageB64Lookup({

  'icon.png': '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',
  'images/tool_brush.png': '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',
  'images/tool_dropper.png': 'iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAj2SURBVHhe7ZsJcJVXFcf/WYSQkM0QkrbQhRCS0rIGBphiBDshLUyQ0kbtYskgFh1k7FSqzLhkHBgKTlvEGjpR61iVShcHLWISEcLisGUBKhESS5SBECCFGJYsjUn8/+97Lz7i2xPegvnN/Hn3u18G+M4795xzz/2CQQb5/ybM+umIJ6iZVIS5+i//pN6k/mWubkMSqD9SPS70EfV9KpkKafp6wCepvdSDSLkPWPg8EB1nbhi6/g1U7gAOv08zdGvmKvUc9bYuQpG+BvgttRgZ9Pzn6eUx8ZbZvnx0Ftj+GrDnVzSEscQ3qVfMvRDDfn3Pp9YiNgn47nY+vFaCE6JpmCk5wKj7gaNlYejumqdZ6s/mfghhb4CfU3dj6ctA2lTLjDvuGgekTweqS4HOjoc4M5JS/AgZbAbQt1eMxFTgS68C4eGWWU9IvhsYPxuoKgE+bqM1oCWxz9wLAWxP+gnzp9w/ItIMvWLMFEaBd4Ahw3T1PWqGBqGAzQAM76TtuvnwiXseBL5QqJEs+EvKWCPYsRngBlWLpjPAhXrLjC88vMSyHAAGB7yuQbBjv9iVAoFdvzAfPhHGrPrlTVxKKidAa+Az1B3Us9S71N+oD6g3qDupgGNfB9xD1XIdD8XaXUDqGMusL+x9i4/4gkZXKFVSjgLLHmquZRg47D2A/o+XGcmBouWMCp2WWV/IfhKYqC/fVJaR5vrr9KzXTwGbjjNZ3qt7c6iJGgSSvhsdpa/5aLl0pyl7H8i2zHqLlsL4T1lK5rZrwCNfYV5YyCwRxdA4HGi+APz9iH7yJGUGgcLeA4SywdPUNewoAk4dNJM+kcCaSEWVeO+lmz3q3t4vvh/rbGDoawBRR71gNjtvfANo1X7HRyZyiadlAZcbgBq72ijSUnYEA44MIH5GleIiU2JhrmXz4yvP/QhY8DVg7DTrBLn4D+sAF62fAcOZAcTnqXLzn13D9dtQa5n1ljvS+Dd95+ad5alD1gFqrJ8Bw5UB5Pva5f0azY3AuscYsg6YG/2ipQk4bjaNaqqUaRBIXBlAKCh+kSrCNab0lxZzz/gi68Z+dMMq/mBrpvyV6tIgkLgzgA0uYrA4oFeoCfLth5nGKswNrzn6J+vAFEFaC3eZqwDhqQHETyh5A+s7RvVXmC3lzt5Qx5R/Yi/i4+ORnp6uGUXGv1D36yIQeGMA7e5eNaOYREt6rD9qLj2ijh6zkVsCuv+SJUuwefNmZGebQktloQoOuzThP/pWgq5YTy0w1eG3uPdXOTttgWf9g93cHb+2TA0TLFq0CMuWLUNkZCTmzp2LtrY21NTUsETEU9QOyq+psW9T1Bl6yssIj4jDD5gJRmrf5AFaIu+sBfa/bR545cqVWLyYgdSOnp4eFBcXY8uWLbrUmcMUym9nDp4ugUwqDpmzPHv4S9xXvbkaeJE/z4fXml+/fv3/PLwI475h+fLlmD3b9BG0HH6sgb/w1ANUvB/vdX9HqJtUsZ1x/fesFxjXuJnSt56Xl4elS5ciIcFFl5k0NzejoKAAV65oB41nKOMStxpPDRBDnaMS8FA+zcE0qM2O6GgFPtjFWP4u0N7bUmunohITE7Fx40akpbEa9IADBw5g9erVWhYtvNRS6K2ZbxWeGkCoKtxKMQU4pIP6HaV+oEq9n1LPDh8+HGvWrMG0aZ4F+aKiImzdqn8GVZR6Bv1oVLrHGwOIVOpz1H2UzadV1qmmf4viRr8XxZdNlIoo5OfnmyCoNe+Kzs5OrFixAidPqlWAU1Qe9aEubgXeGsAXtJ5/SCUpHqxatQrhbs4dFA9khLNnzS5Ue4ZHKHnEgONNHeAraoIqv+fX1dXFdHR0YPp0nZ84Z9iwYZg1axZ2796tOkGHNo9TqqHtPWxA8IcBhGrmUuqpEydORKWmptpKYafExsaaQunQoUO4evWqjKCzS6Wga7o/UPjLAOISVUk9ffjw4fCMjAyMGjXK3HCGAqjqg7KyMtBz1FDIofRyhuUgZwDwpwGETl2au7u7H923bx9mzJiBESNGWO44QUaYOXMmqqur0dLSksIpFWVOihHv8bcBhLrAkV1dXdly73nz5pk17wrVE7m5uThy5IgKpfGc0qGK7S2WfhEIA4hyKuPGjRsT6uvrkZOT4zY9DhkyBFlZWaZYun79ehan1Ezp9yl0oAwg1A57oqGhISkqKgoTJkywzLogLi7OGKGkpAT0IDVU9P/XCZPPBNIAH1NqMhZUVVVFJicnY9w4nam6Rsth8uTJqKysBD3o05x6gHqf8qm9FkgDiEZK9X4eXTsiJSXFbXoU+jnVEuXl5coOigmPUqqfVY57RaANINQc1anxooMHD0ZkZma6TY9CnqAAyroCTU1NCoryhvcor4wQDAYQKvwvcBeYx281TIXS2LFjLXdcEB0dbQLo+fPnwWA6mlPqWW6jPG6oBIsBRDV1hTVCzv79+8MVE1QsuUM9hzlz5pg+Qm1trY7iZbnfmJseEEwGEKoRtLN8jNVixOjRozFmjGfnp7bs0NraqkiqNKvjfrcEmwGElsNZesJCVothngZGeYJ2mTScLtVY3aWBO7xpi/sT1fvP0AhdGzZswJ49nqV6GcuKNk8eEawGEFrHX6URegoLC7Ftm2Kba2Ji1LkzWPt17gnGJWCPAuOHzA6fZYoMT0pKgtKkM1RRWttpejWnmHL7nk+wG0CoTtAR1OMVFRUR6i2OHOn4C9am6vTp0zhz5kwsL3XcpjfTXG6YQsEAQm+taBs9X10ipUhndcLUqVNNzOCGSQbQ2VsJpfcgHRIqBhA6jh7S2dk5m3VCmMpgVYHcD0DpUllAyAvUZ6C3qJOk5u2TlNppDk9y/dEUHWjUKtdbqL3BQEtCzVb1EW20t7dj3bp1Zr9AmikdTujzJkLJA2zo/LCI0iut+u2WeHpB+s6dO9HY2Gh2ikOHDjUeodNnVoc4d+6cOi7yINNrtycUPcAR2gPoN1aStT/Qg0+aNMk0WUpLS3Hs2DH9TAGl+uK2RalPp1JKffa/4CWpIeuwpr5dPMAeGSKXsnVXVBYrHV42V4MMMsggg9gA/gNsj5f9rFuYKwAAAABJRU5ErkJggg==',
  'images/tool_fill.png': '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',
  'images/tool_line.png': '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',
  'images/tool_pan.png': 'iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAO5SURBVHhe7ZtLSBVRGMf/PRAqH1FpQfayFj0pe0EklREWSLhoIQW1qyAicqWLihYuemAPKBJcBGmQJG16QNETUioJe2hFmBW1iGpRET3UmP7fzDmOV517Je+M3XvmB3++c84M4vefc87c+x0uQgaHpdRb6pjdMwxJ/gtlKZ2kjMFNfsUmC2ljjDLBTb5wp4UzHyyU3zTGhN7Jaw2yCcNU9BNJ/hqVweSB4j32YBcZmcC8fKDxItD+cwlHsqgr9rUA8NuARdR1KgPZM4Hctdz7W4DxU4HhKfYNeNUEvHsOjGberQ9lREyQ2XBHOolOLaWnt6uKRncJFGztfR34SAXCUBX94jC1v5veUF6co/R9O2QgGblFec2AIrkhaPyeAf89oQEqGktogIrGEhqgorGEBqhoLKEBKhpLaICKxhLNgBFUJdVCTZKBBOI01UDNt3tR8DJAkr9EbadmUzlUIrGKWkZJVUlKcp70ZYBOfrXdS2wyKKlHepowREWNm7zU8MZOBB7fkPHd1CNpDBA5CVqAikYgU62qmr38F6ukJdXSu9KIA1JdmmAXYS+fkP5XqoB6IB0vJHnJ1mLyFk40W8gr7l6ni59i1wTjI/n7UoZ3+lKW7zUT9AyIfPJldUD6OOD2WeBlVNP+jY37gLSxTrvhAtDsUwF423En1pZ7zgQxYDh1lYpMPtmINCGfapKObILTKGfDKypJzuSF9bu4JcqZi70xbpCGoJdAKXUAKVwJJdXAnDxn9PcPoLPDaceTEWm0Xr2A2n8CHe1OO96MklzJj2/AoWKgzX7o9ylZBhyMREywaIKF0jpnA0mGTbDypYWcXD12j0qnuuj5GoycCfXn+WKSwx20Ut+lMUBmUKker8HXlKzPeCAf3lKYfL+efE/cmSCvQ8e5lXIhDgR1MCJmRn3ymr4+CR6kyuy1+f6FM5Ko9OPJe30XcExIfGJOey8DBDFBDinlrP6ZDCQQNRQ3sdhrPpoBwimqkPpk9xIH7qzYQsXc8GIZkPSEBqhoLKEBKhpLaICKxhIaoKKxhAaoaCyhASoaS2iAin4xkpITWq1Uygspz+v77Pp1EPhtgNQT5ExRazHlxVFK39coA0HgtwHuYWfmFGDhOkdSddZkz3LG5kbUXcWEQOhZFveDvg9duiMHMEc2A8/rpfeUkpOqz9LxmyB+MyRZ/cKfzjX274KmcxVkTXauCIOYfND0PnmqarMwa7mu3T+hkvRg0sU1oaTauOQ1jgmujEpeo00wMnlNLpXmNAcL4C+wVZ96h2KeywAAAABJRU5ErkJggg==',
  'images/tool_rect.png': 'iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAOiSURBVHhe7Zp5iE1RGMB/8x4SmoYJWWJI9hnLkK2ZQTGSki1r+QOTtSwNY4lQQxhbGESWIbL/IY11kC0NDSn7EtmXsYexfWfueXqeMdOYefPufc6vTu+c73u9ur/uO985514MBoPBYDAYDIb/kxD96U0HaaWsblDxWtolq5s/2dJ+BGHLkPYHed0BSkBYbq9ybWjQNrfrWD59gMz9qndcWifV8SZ/AYruo6WNgdBwHXAYzx/ApNaql6cAl/78nXKhMDoVKlSCA6tgcnu4elYng4u8BSja9oKkXdCiK3x8Awv6yRRyVCeDh78LUNRqDOM3weC5UKm61IYyOhE85C9AESLTRPwISDkPdZtDYjtYMw6+5egvOJuCBXijZHyVCz+9E/Ys0kFnUzgBZSvAtD1QrxVUraODzqZwAhSVa8FMqauxA3TA2RRegC9n90q1iHVshSi6ALXSenQDlgyFg+vg+zedcAZFF9BpCAxfKr8kP7V1BqSv1QlnUHQBCjUfTJHK0L4vNJW/g4cf33XHvhSPAEWDNjByhSyemljj7XNgbFNZQp+yxjal+AT4Ur4ivHsF8+SuWCrzwwe1Hbcf/hPQYyyMWAYVq8HFg5B1RCfshf8EqFVjTH9YKLtItZ9o01Mn7IX/BHgoUxZaxstGqrQ1vnsZDq+3Tbn0vwBfDshEmTYdFg2CN890MHCUvIB+cvFVIuDKCZjeWeaHdJ0IDCUvoEptmHMI4uQOePsC1k3QicBQ8gIU6sht2GJI3A4Jy3UwMARGgIfIjtC8ix4I5/ZBRpqsINUpdskQWAG+7EuBDYmyeOoDNzN10L/YS8DIlRBeA66dgbk9YJaUz1sXdNI/2EtARJR19qjmh+r1Zc1wCZJ7+3XNYC8BCpfbqhDJGdY2e+h8K5bz2Tp0UWeSxYj9BHhQF6222XEDrfFJqRgpg2FqnHUKVUx3hX0F+BLdDRp2gKd3IHUUJImI9+opXtFwjoCwqjBtN0zZAY1ExOvH8PmjTv47zhHgoUms/A1EROp1q2IoTm6DY5v/af3gPAEe3F7vcOySiXLjZKtsqoc2OV90omCcK8CbiVukhDaDe7LVVo/t0lfrRMEEh4CISJgtu0olIj4BWnW34i8fwpPbVv8v5P2CRLnQMFbf0EMHkxQDj2955oZCvCESEhJGeE09dDDZT349xXa5XG+joqIis7Ky7ucG8iEoX5Jyu93Z0dHRumwYDAaDwWAwGAwGg+F/Bn4CJjg6Xg44jvEAAAAASUVORK5CYII=',
  'images/tool_select.png': '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',
  'images/tool_smudge.png': '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',
});

let newCanvas = (w, h, isUi) => {
  let c = isUi ? HtmlUtil.canvas() : document.createElement('canvas');
  c.style.imageRendering = 'pixelated';
  return wrapCanvas(c, w, h);
};

let wrapCanvas = (c, optWidth, optHeight) => {

  let width = c.width;
  let height = c.height;
  if (optWidth) {
    width = optWidth;
    height = optHeight;
    c.width = width;
    c.height = height;
  }

  let ctx = c.getContext('2d');
  let alphas = [255];
  let o = {
    IS_WRAPPED: true,
    canvas: c,
    ctx,
    width,
    height,
    pushAlpha: a => {
      alphas.push(Math.max(0, Math.min(255, Math.floor(a))) / 255);
      ctx.globalAlpha = alphas[alphas.length - 1];
      return o;
    },
    enableNearestNeighbor: () => {
      ctx.imageSmoothingEnabled = true;
      return o;
    },
    popAlpha: () => {
      alphas.pop();
      ctx.globalAlpha = alphas[alphas.length - 1];
      return o;
    },
    clear: (x, y, width, height) => {
      if (x === undefined) {
        x = 0;
        y = 0;
        width = o.width;
        height = o.height;
      }
      ctx.clearRect(x, y, width, height);
      return o;
    },
    blit: (img, x, y, optDstWidth, optDstHeight, optSrcX, optSrcY, optSrcWidth, optSrcHeight) => {
      let src = img.IS_WRAPPED ? img.canvas : img;
      if (optSrcX === undefined) {
        if (optSrcWidth === undefined) {
          ctx.drawImage(src, x, y);
        } else {
          ctx.drawImage(src, x, y, optDstWidth, optDstHeight)
        }
      } else {
        ctx.drawImage(src, optSrcX, optSrcY, optSrcWidth, optSrcHeight, x, y, optDstWidth, optDstHeight);
      }
      return o;
    },
    drawRect: (x, y, width, height, r, g, b, a) => {
      if (a === undefined) a = 255;
      if (a <= 0) return;
      ctx.fillStyle = a === 255 ? ('rgb(' + r + ',' + g + ','+ b + ')') : ('rgba(' + r + ',' + g + ',' + b + ',' + a / 255 + ')');
      ctx.fillRect(x, y, width, height);
      return o;
    },
  };

  if (c.set) o.set = (...args) => { c.set(args); return o; };

  return o;
};
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
const TITLE = "Draw";
const { button, canvas, div, span, inputText } = HtmlUtil;
const FULLSZ = Object.freeze({ fullSize: true });
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
let getClockVector = (hr, min, rad, offsetX, offsetY) => {
  let rot = (hr + min / 60) / 12;
  let theta = (0.25 - rot) * Math.PI * 2;
  return [
    offsetX + rad * Math.cos(theta),
    offsetY + rad * -Math.sin(theta)
  ];
};

let anchorControl = () => {

  let outer = div({ position: 'relative', width: 120, height: 120 });
  let refs = [];
  let activeCol = 0;
  let activeRow = 0;
  let xInv = 1;
  let yInv = 1;

  let getKey = (x, y) => ('XN SX'[y + 2] + 'XW EX'[x + 2]).trim() || 'C';

  for (let y = 0; y < 3; y++) {
    for (let x = 0; x < 3; x++) {
      let cell = div({
        position: 'absolute',
        width: 40,
        height: 40,
        left: x * 40,
        top: y * 40,
      });
      let col = x - 1;
      let row = y - 1;
      let icon = canvas({ position: 'relative', width: 30, height: 30 });
      let btn = button(icon, { boxSizing: 'border-box', width: 40, height: 40, padding: 0, textAlign: 'center', verticalAlign: 'middle' });
      refs.push({ icon, col, row });
      btn.addEventListener('click', () => {
        activeCol = col;
        activeRow = row;
        outer.refresh();
      });
      cell.set(btn);

      outer.set(cell);
    }
  }

  outer.getAnchorDirection = () => ({
    col: activeCol,
    row: activeRow,
    id: getKey(activeCol, activeRow),
  });

  outer.refresh = () => {

    let getArrowPts = (h, m) => {
      return Util.range(3).map(i => getClockVector(h + (i - 1) * 4.5, m || 0, 25, 40, 40));
    };

    Object.values(refs).forEach(btn => {
      let { icon, col, row } = btn;
      let symCol = col - activeCol;
      let symRow = row - activeRow;

      let iconCtx = icon.getDrawContext();
      iconCtx.setSize(80, 80).clear();

      let pts = null;
      switch (getKey(xInv * symCol, yInv * symRow)) {
        case 'NW': pts = getArrowPts(10, 30); break;
        case 'N': pts = getArrowPts(12); break;
        case 'NE': pts = getArrowPts(1, 30); break;
        case 'E': pts = getArrowPts(3); break;
        case 'SE': pts = getArrowPts(4, 30); break;
        case 'S': pts = getArrowPts(6); break;
        case 'SW': pts = getArrowPts(7, 30); break;
        case 'W': pts = getArrowPts(9); break;
        case 'C':
        iconCtx
            .rectangle(0, 0, 80, 80, '#000')
            .rectangle(5, 5, 70, 70, '#fff')
            .ellipse(35, 35, 10, 10, '#888');
          return;
        default: return;
      }
      iconCtx.polygon(pts, '#000');
    });

    return outer;
  };

  outer.setYInvert = v => { yInv = v ? -1 : 1; return outer; };
  outer.setXInvert = v => { xInv = v ? -1 : 1; return outer; };
  outer.refresh();

  return outer;

};
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
let createPaletteBar = (ctx) => {
  let { div } = HtmlUtil;

  let RED = [255, 0, 0];
  let ORANGE = [255, 128, 0];
  let YELLOW = [255, 255, 0];
  let GREEN = [0, 160, 40];
  let BLUE = [0, 50, 255];
  let PURPLE = [128, 0, 128];

  let darken = rgb => rgb.map(n => n * .7);
  let lighten = rgb => rgb.map(n => Math.floor(255 - ((255 - n) * 0.5)));

  let colors = [
    [255, 255, 255],
    [128, 128, 128],
    [0, 0, 0],

    [192, 192, 192],
    [96, 96, 96],
    [40, 40, 40],

    lighten(RED),
    RED,
    darken(RED),

    lighten(ORANGE),
    ORANGE,
    darken(ORANGE),

    lighten(YELLOW),
    YELLOW,
    darken(YELLOW),

    [0, 255, 0],
    GREEN,
    darken(GREEN),

    lighten(BLUE),
    BLUE,
    darken(BLUE),

    lighten(PURPLE),
    PURPLE,
    darken(PURPLE),

  ].reverse();

  const TILE_SIZE = 16;

  let activeColorTile = newCanvas(TILE_SIZE * 3, TILE_SIZE * 3, true).set({
    position: 'absolute',
    left: 0,
    top: 0,
    width: TILE_SIZE * 3,
    height: TILE_SIZE * 3,
  });
  let refreshActiveColorTile = () => {
    let c = activeColorTile;
    let color = [...ctx.activeColor];
    c
      .drawRect(0, 0, c.width, c.height, 0, 0, 0)
      .drawRect(1, 1, c.width - 2, c.height - 2, 255, 255, 255);

    if (color[3] < 255) {
      let sz = TILE_SIZE * 3 - 4;
      let checkerSize = Math.ceil(sz / 4);
      for (let y = 0; y < sz; y += checkerSize) {
        for (let x = 0; x < sz; x += checkerSize) {
          let cc = (x + y) % 2 ? 255 : 192;
          c.drawRect(x + 2, y + 2, checkerSize, checkerSize, cc, cc, cc);
        }
      }
    }
    c.drawRect(2, 2, c.width - 4, c.height - 4, ...color);

  };
  ctx.setActiveColor = (...rgba) => {
    ctx.activeColor = Util.flattenArray([rgba, 255]).slice(0, 4);
    refreshActiveColorTile();
  };

  refreshActiveColorTile();

  return div(
    { position: 'absolute', left: 2, right: 0, top: 2, bottom: 2, },
    activeColorTile.canvas,
    Util.range(12).map(x => Util.range(3).map(y => {
      if (!colors.length) return null;
      let color = [...colors.pop()];
      let tile = div(
        {
          position: 'absolute',
          size: TILE_SIZE,
          left: TILE_SIZE * 3 + x * TILE_SIZE,
          top: y * TILE_SIZE,
          onRightClick: () => {
            console.log("Color picker");
          },
        },
        newCanvas(TILE_SIZE, TILE_SIZE, true)
          .drawRect(0, 0, TILE_SIZE, TILE_SIZE, 0, 0, 0)
          .drawRect(1, 1, TILE_SIZE - 2, TILE_SIZE - 2, 255, 255, 255)
          .drawRect(2, 2, TILE_SIZE - 4, TILE_SIZE - 4, ...color)
          .set({ position: 'absolute', width: TILE_SIZE, heigth: TILE_SIZE }).canvas
      );
      tile.addEventListener('pointerdown', () => {
        ctx.setActiveColor([...color, 255]);
      });
      return tile;
    })),
  );
};
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
let showResizeMenu = async ctx => {

  let { ItemList } = HtmlUtil.Components;

  let uu = ctx.doc.previewUndoUnit;
  let hasSelection = uu && uu.isFloat;
  let floatData = hasSelection ? uu.getFloatData() : {};

  let anchor = anchorControl();

  let docSize = { w: ctx.doc.image.width, h: ctx.doc.image.height };
  let selSize = hasSelection ? { w: floatData.img.width, h: floatData.img.height } : null;
  let newSize = { ...(hasSelection ? selSize : docSize) };

  let errPanel = div({
    color: '#400',
    backgroundColor: '#fcd',
    opacity: 0,
    padding: 3,
    textAlign: 'center',
    border: '1px solid #f00',
    borderRadius: 3,
    margin: 3,
    html: '&nbsp;',
  });
  let toValidNum = str => {
    str = `${str}`.trim();
    let num = Math.max(1, Math.min(65535, Util.ensurePositiveInteger(parseInt(str))));
    if (num + '' !== str) return false;
    return num;
  };

  let refresh = () => {
    let width = newSize.w;
    let height = newSize.h;
    let err = '';
    if (width === false && height === false) {
      err = "Invalid width and height.";
    } else if (width === false) {
      err = "Invalid width.";
    } else if (height === false) {
      err = "Invalid height.";
    }

    errPanel
      .clear()
      .set(err, { opacity: err ? 1 : 0 })
      .set(span({ html: '&nbsp;' }));
    if (err) {
      // TODO: disable the OK button
    }

    anchor
      .setXInvert(newSize.w < docSize.w)
      .setYInvert(newSize.h < docSize.h)
      .refresh();

    return !err;
  };

  let toggleAnchorEnabled = v => {
    anchor.set({
      opacity: v ? 1 : 0.3,
      userSelect: v,
      pointerEvents: v ? 'auto' : 'none',
    });
  };
  toggleAnchorEnabled(false);

  let items = [
    { id: 'doc-crop', name: "Crop/extend document", alg: "By anchor..." },
    { id: 'doc-scale-nn', name: "Scale document", alg: "Nearest-neighbor (pixelated)",  },
    { id: 'doc-scale-bl', name: "Scale document", alg: "Bilinear (blended)" },
    ...(!hasSelection ? [] : [
      { id: 'selection-nn', name: "Scale selection", alg: "Nearest-neighbor (pixelated)" },
      { id: 'selection-bl', name: "Scale selection", alg: "Bilinear (blended)" },
    ])
  ];
  let selectedMode = hasSelection ? 'selection-bl' : 'doc-scale-bl';
  let modePicker = ItemList({
    getId: v => v.id,
    getItems: () => [...items],
    onSelectionChanged: id => {
      selectedMode = id;
      toggleAnchorEnabled(id === 'doc-crop');
    },
    renderItem: item => div(
      { padding: 3, },
      span({ bold: true }, item.name), ' ',
      div({ opacity: 0.7 }, item.alg),
    ),
    selectedId: selectedMode,
    border: '1px solid #888',
    fontSize: 8,
    textAlign: 'left',
    backgroundColor: '#fff',
  });

  let widthEditor = inputText({ width: 40, value: `${newSize.w}` }, v => { newSize.w = toValidNum(v); refresh(); });
  let heightEditor = inputText({ width: 40, value: `${newSize.h}` }, v => { newSize.h = toValidNum(v); refresh(); });

  // TODO: onShown for dialogs or default selected element option.
  setTimeout(
    () => { widthEditor.focus(); widthEditor.select(); },
    50);

  let ui = [
    div(
      { fontSize: 9, position: 'relative', textAlign: 'left' },
      div(
        { marginBottom: 5 },
        div("Document size: ", span({ bold: true }, `${docSize.w}`, span({ html: ' &times; ' }), `${docSize.h}`)),
        hasSelection ? div("Selection size: ", span({ bold: true }, `${selSize.w}`, span({ html: ' &times; ' }), `${selSize.h}`)) : null,
      ),
      div(
        "New size: ",
        widthEditor,
        span({ html: ' &times; ' }),
        heightEditor,
      ),
      errPanel,
    ),
    div(
      { position: 'relative', height: 180 },
      div(
        { westStretchDock: 150 },
        div("Resize Mode:"),
        modePicker,
      ),
      div(
        { eastDock: 150, textAlign: 'center' },
        div({ paddingBottom: 8 }, "Anchor direction:"),
        div({ position: 'relative', width: 200, height: 150, left: 15 }, anchor),
      ),
    )
  ];

  let result = await ctx.os.Shell.DialogFactory.showOkCancelToBool(ctx.pid, "Draw: Resize", ui, { height: 330 });
  if (result) {

    let isOkay = refresh();
    if (!isOkay) return ctx.os.Shell.DialogFactory.showOkCancelToBool(ctx.pid, "Resize Error", "Invalid size");

    let docSizeSame = docSize.w === newSize.w && docSize.h === newSize.h;
    switch (selectedMode) {
      case 'doc-crop':
        {
          if (docSizeSame) return;
          if (uu) commitLingeringUndoUnit(ctx);

          let newImg = newCanvas(newSize.w, newSize.h);
          let oldImg = ctx.doc.image;

          let dir = anchor.getAnchorDirection().id;

          let x;
          if (dir.endsWith('W')) x = 0;
          else if (dir.endsWith('E')) x = newImg.width - oldImg.width;
          else x = Math.floor((newImg.width - oldImg.width) / 2);

          let y;
          if (dir.startsWith('N')) y = 0;
          else if (dir.startsWith('S')) y = newImg.height - oldImg.height;
          else y = Math.floor((newImg.height - oldImg.height) / 2);

          newImg.clear().blit(oldImg, x, y);

          ctx.doc.previewUndoUnit = createUndoUnit(ctx, 'FULL_TRANSPLANT', { img: newImg });
          commitLingeringUndoUnit(ctx);
          render(ctx);
        }
        break;

      case 'doc-scale-nn':
      case 'doc-scale-bl':
        {
          if (docSizeSame) return;
          if (uu) commitLingeringUndoUnit(ctx);

          let newImg = newCanvas(newSize.w, newSize.h);
          let oldImg = ctx.doc.image;

          let drawCtx = newImg.canvas.getContext('2d');
          if (selectedMode === 'doc-scale-nn') {
            drawCtx.imageSmoothingEnabled = false;
          }

          drawCtx.drawImage(oldImg.canvas, 0, 0, oldImg.width, oldImg.height, 0, 0, newSize.w, newSize.h);

          ctx.doc.previewUndoUnit = createUndoUnit(ctx, 'FULL_TRANSPLANT', { img: newImg });
          commitLingeringUndoUnit(ctx);
          render(ctx);
        }
        break;

      case 'selection-nn':
      case 'selection-bl':
        {
          if (selSize.w === newSize.w && selSize.h === newSize.h) return;
          if (!uu || !uu.isFloat) return;
          let { img } = uu.getFloatData();
          if (!img) return;

          let newImg = newCanvas(newSize.w, newSize.h);
          let drawCtx = newImg.canvas.getContext('2d');
          if (selectedMode === 'selection-nn') {
            drawCtx.imageSmoothingEnabled = false;
          }
          drawCtx.drawImage(img.canvas, 0, 0, img.width, img.height, 0, 0, newSize.w, newSize.h);

          uu.swapOutFloatImage(newImg);
          render(ctx);
        }
        break;
    }
  }
};
const toolImages = [
  { id: 'BRUSH', image: APP_RAW_IMAGE_DATA['images/tool_brush.png'] },
  { id: 'DROPPER', image: APP_RAW_IMAGE_DATA['images/tool_dropper.png'] },
  { id: 'FILL', image: APP_RAW_IMAGE_DATA['images/tool_fill.png'] },
  { id: 'SELECT', image: APP_RAW_IMAGE_DATA['images/tool_select.png'] },
  { id: 'RECTANGLE', image: APP_RAW_IMAGE_DATA['images/tool_rect.png'] },
  { id: 'LINE', image: APP_RAW_IMAGE_DATA['images/tool_line.png'] },
  { id: 'SMUDGE', image: APP_RAW_IMAGE_DATA['images/tool_smudge.png'] },
  { id: 'PAN', image: APP_RAW_IMAGE_DATA['images/tool_pan.png'] },
].reduce((lookup, t) => {
  lookup[t.id] = t.image;
  return lookup;
}, {});

let createToolbar = (ctx) => {
  const { button, div } = HtmlUtil;

  // touch screens on some operating systems will attempt to "nudge" touch event
  // coordinates towards well-known clickable elements, such as buttons. Because
  // there is a menu bar directly above the toolbar, touch events to File can get
  // redirected to the toolbar. We fix this by inserting a small gap between the
  // buttons and the top of the toolbar.
  const TOP_GAP = 20;

  let toolOptions = div();

  let shownId = '';
  ctx.onToolUpdated.push(id => {
    if (id !== shownId) {
      shownId = id;
      toolOptions.clear();
      switch (id) {
        case 'BRUSH':
        case 'LINE':
          toolOptions.set(toolOptions_brush(ctx));
          break;

        case 'DROPPER':
        case 'FILL':
        case 'SELECT':
          return null;

        default:
          // toolOptions.set("TODO: " + id + " panel");
          // break;
          return null;
      }
    }
  });

  let allButtons = [
    { id: 'SELECT', name: "Selection", lbl: 'Slct' },
    { id: 'BRUSH', name: "Brush", lbl: 'Brsh' },
    { id: 'FILL', name: "Bucket", lbl: 'Bckt' },
    { id: 'RECTANGLE', name: "Rectangle", lbl: 'Rect' },
    { id: 'LINE', name: "Line", lbl: 'Line' },
    { id: 'SMUDGE', name: "Smudge", lbl: 'Smdg' },
    { id: 'DROPPER', name: "Dropper", lbl: 'Drpr' },
    { id: 'PAN', name: "Pan", lbl: 'Pan' },
  ];

  return div(
    { overflow: 'hidden', height: '100%' },
    div(
      { position: 'relative', width: '100%', height: Math.ceil(allButtons.length / 2) * 30, marginTop: TOP_GAP },
      allButtons.map((btn, i) => {
        return div(
          {
            position: 'absolute',
            left: i % 2 === 0 ? 0 : 30,
            top: Math.floor(i / 2) * 30,
            size: 30,
            fontSize: 7,
          },
          button(
            {
              fullSize: true,
              padding: 0,
              textAlign: 'center',
              fontSize: 7,
              title: btn.name
            },
            Util.copyImage(toolImages[btn.id]).set({ size: 24 }),
            () => setActiveTool(ctx, btn.id)
          )
        );
      }),
    ),
    toolOptions,
  );
};

let setActiveTool = (ctx, id) => {
  if (ctx.activeTool === id) return;
  commitLingeringUndoUnit(ctx);
  ctx.activeTool = id;
  ctx.onToolUpdated.forEach(fn => fn(id));
};

// Cache the math for calculating the coordinates of pixels in circular areas
// and the distance each pixel is from the center.
let circleCoordsByRadii = {};
let getCoordsForRadius = r => {
  if (r <= 0) return [];
  if (!circleCoordsByRadii[r]) {
    let coords = [];
    for (let y = -r; y <= r; y++) {
      for (let x = -r; x <= r; x++) {
        let dist = Math.sqrt(x ** 2 + y ** 2);
        coords.push([x, y, dist, Math.floor(dist)]);
      }
    }
    circleCoordsByRadii[r] = coords;
  }
  return circleCoordsByRadii[r];
};

let twoPointsToRect = (x1, y1, x2, y2) => {
  let left = Math.min(x1, x2);
  let right = Math.max(x1, x2);
  let top = Math.min(y1, y2);
  let bottom = Math.max(y1, y2);
  return { left, top, right, bottom, width: right - left, height: bottom - top };
};

let TOOLS = {
  PAN: {
    onDown: (ctx, gesture) => {
      gesture.data.startCenterX = ctx.doc.viewport.centerX;
      gesture.data.startCenterY = ctx.doc.viewport.centerY;
    },
    onDrag: (ctx, gesture) => {
      let { startCenterX, startCenterY } = gesture.data;
      if (Util.isNullish(startCenterX)) return;
      let { x, y } = gesture.start;
      let dx = gesture.current.x - x;
      let dy = gesture.current.y - y;
      let ratio = ctx.doc.viewport.zoom;
      ctx.doc.viewport.centerX = startCenterX - dx / ratio;
      ctx.doc.viewport.centerY = startCenterY - dy / ratio;
      render(ctx);
    },
    onRelease: (ctx, gesture) => {
      gesture.data.startCenterX = undefined;
      gesture.data.startCenterY = undefined;
    },
  },
  SELECT: {
    // SELECT is not a real tool. It looks at where the gesture begins and the current state of things
    // and re-routes the action to a more specific tool action.
    onDown: (ctx, gesture) => {
      let uu = ctx.doc.previewUndoUnit;

      if (uu) {
        let float = uu.getFloatData();
        if (float) {
          let { px, py } = gesture.current;
          if (px >= float.left && px < float.left + float.width &&
              py >= float.top && py < float.top + float.height) {
            ctx.activeTool = 'SELECT_TRANSFORM';
          } else {
            console.log("You clicked outside of the region. Committing the old selection and trying the gesture again.");
            commitLingeringUndoUnit(ctx);
          }
        } else {
          console.log("Looks like there's a lingering undo unit. Committing it.");
          commitLingeringUndoUnit(ctx);
        }
      } else {
        ctx.activeTool = 'SELECT_SETBOUNDS';
      }

      // Now that a different tool has been chosen OR the lingering undo unit has been committed,
      // let's replay the event.
      TOOLS[ctx.activeTool].onDown(ctx, gesture);
    },
  },
  SELECT_SETBOUNDS: {
    onDown: (ctx, gesture) => { },
    onDrag: (ctx, gesture) => {
      let { start, current } = gesture;
      ctx.doc.previewUndoUnit = createUndoUnit(ctx, 'NOOP', {
        selectionBounds: twoPointsToRect(start.px, start.py, current.px, current.py)
      });
      render(ctx);
    },
    onRelease: (ctx, gesture) => {
      let { start, current } = gesture;
      console.log("The bounds have been set! Creating a floating undo unit", start, current);
      ctx.doc.previewUndoUnit = createUndoUnit(ctx, 'FLOATING_SELECTION', {
        selectionBounds: twoPointsToRect(start.px, start.py, current.px, current.py),
      });
      ctx.activeTool = 'SELECT';
      render(ctx);
    },
  },
  SELECT_TRANSFORM: {
    onDown: (ctx, gesture) => {
      console.log("You clicked on a selection region");
      let uu = ctx.doc.previewUndoUnit;
      if (!uu || !uu.isFloat) {
        if (uu) ctx.commitLingeringUndoUnit(ctx);
        ctx.activeTool = 'SELECT';
        TOOLS.SELECT.onDown(ctx, gesture);
        return;
      }

      let f = uu.getFloatData();
      gesture.data.floatStartX = f.left;
      gesture.data.floatStartY = f.top;
      render(ctx);
    },
    onDrag: (ctx, gesture) => {
      let uu = ctx.doc.previewUndoUnit;
      if (!uu) return;
      let startX = gesture.start.px;
      let startY = gesture.start.py;
      let endX = gesture.current.px;
      let endY = gesture.current.py;
      let dx = endX - startX;
      let dy = endY - startY;
      uu.setFloatOffset(gesture.data.floatStartX + dx, gesture.data.floatStartY + dy);
      render(ctx);
    },
    onRelease: (ctx, gesture) => {
      ctx.activeTool = 'SELECT';
      render(ctx);
      console.log("Drag released. Going back to SELECT tool");
    },
  },

  SMUDGE: {
    onDown: (ctx, gesture) => {
      commitLingeringUndoUnit(ctx);
      ctx.doc.previewUndoUnit = createUndoUnit(ctx, 'TEMP_SURF');
      let churn = document.createElement('canvas');
      churn.width = 24;
      churn.height = 24;
      gesture.data.churnSurf = churn;
      gesture.data.churnCtx = churn.getContext('2d', { willReadFrequently: true });

      TOOLS.SMUDGE.onDrag(ctx, gesture);
    },
    onDrag: (ctx, gesture) => {
      let uu = ctx.doc.previewUndoUnit;
      if (!uu) return;
      let surf = uu.getMutableSurface();
      let { current } = gesture;
      let x = Math.floor(current.px);
      let y = Math.floor(current.py);
      if (x < 0 || y < 0 || x >= surf.width || y >= surf.height) return;

      let { churnSurf, churnCtx } = gesture.data;
      let width = churnSurf.width;
      let height = churnSurf.height;
      let cx = width >> 1;
      let cy = height >> 1;
      churnCtx.clearRect(0, 0, width, height);
      churnCtx.drawImage(surf.canvas, -x + cx, -y + cy);
      let imageData = churnCtx.getImageData(0, 0, width, height);
      let pixels = imageData.data;
      let clrContribs = [];
      let px, py, dist, idx, contribX, contribY, rgb, rgbTotal, pixelCount, influence, clr;
      let finalColors = [];

      for (let coord of getCoordsForRadius(5)) { // loop through all coordinates within a 5 pixel radius
        px = coord[0] + cx;
        py = coord[1] + cy;
        dist = coord[3];
        let contribCoords = getCoordsForRadius(6 - dist); // loop through all adjacent pixels within a distance that diminishes as you go further from the center.
        if (contribCoords.length > 0) {

          for (let contribCoord of contribCoords) {
            contribX = px + contribCoord[0];
            contribY = py + contribCoord[1];
            idx = (contribX + contribY * width) * 4;
            clrContribs.push([pixels[idx], pixels[idx + 1], pixels[idx + 2], pixels[idx + 3]]);
          }
          rgb = [0, 0, 0];
          rgbTotal = 0;
          pixelCount = clrContribs.length;
          while (clrContribs.length) {
            clr = clrContribs.pop();
            influence = clr[3] / 255;
            rgb[0] += clr[0] * influence
            rgb[1] += clr[1] * influence;
            rgb[2] += clr[2] * influence;
            rgbTotal += influence;
          }

          rgbTotal = Math.max(1, rgbTotal);
          finalColors.push([
            px, py, // the coordintae
            Math.floor(rgb[0] / rgbTotal), Math.floor(rgb[1] / rgbTotal), Math.floor(rgb[2] / rgbTotal), // the RGB value
            rgbTotal / pixelCount, // The alpha is just an average
            pixelCount,
          ]);
        }
      }

      for (let action of finalColors) {
        px = action[0];
        py = action[1];
        churnCtx.clearRect(px, py, 1, 1);
        churnCtx.fillStyle = `rgba(${action[2]}, ${action[3]}, ${action[4]}, ${action[5]})`;
        churnCtx.fillRect(px, py, 1, 1);
      }

      let tx = x - cx;
      let ty = y - cy;
      surf.clear(tx, ty, width, height);
      surf.blit(churnSurf, tx, ty);
      uu.touchPixel(tx, ty);
      uu.touchPixel(tx + width - 1, ty + height - 1);
      render(ctx);
    },
    onRelease: (ctx, gesture) => {
      commitLingeringUndoUnit(ctx);
    },
  },
  FILL: {
    onDown: (ctx, gesture) => {
      commitLingeringUndoUnit(ctx);
      let uu = createUndoUnit(ctx, 'TRANSPARENT_OVERLAY');
      ctx.doc.previewUndoUnit = uu;

      let ts = document.createElement('canvas');
      let original = ctx.doc.image.canvas;
      const WIDTH = original.width;
      const HEIGHT = original.height;
      ts.width = WIDTH;
      ts.height = HEIGHT;
      let g = ts.getContext('2d');
      g.drawImage(ctx.doc.image.canvas, 0, 0);
      let pixels = g.getImageData(0, 0, WIDTH, HEIGHT).data;


      let { px, py } = gesture.current;
      let idx4 = (py * WIDTH + px) * 4;
      let targetColor = (pixels[idx4++] << 24) | (pixels[idx4++] << 16) | (pixels[idx4++] << 8) | pixels[idx4];
      let visited = {};
      let first = [px, py];
      let q = [first];
      let hits = [first];

      visited[px + py * WIDTH] = true;
      let cur, x, y, idx, color, alpha;
      while (q.length) {
        cur = q.pop();
        x = cur[0];
        y = cur[1];
        idx = x + y * WIDTH;

        idx4 = idx * 4;
        color = (pixels[idx4++] << 24) | (pixels[idx4++] << 16) | (pixels[idx4++] << 8);
        alpha = pixels[idx4];
        if (alpha === 0) color = 0;
        color |= alpha;

        if (color === targetColor) {
          hits.push(cur);
          if (x > 0 && !visited[idx - 1]) {
            visited[idx - 1] = true;
            q.push([x - 1, y]);
          }
          if (y > 0 && !visited[idx - WIDTH]) {
            visited[idx - WIDTH] = true;
            q.push([x, y - 1]);
          }
          if (x + 1 < WIDTH && !visited[idx + 1]) {
            visited[idx + 1] = true;
            q.push([x + 1, y]);
          }
          if (y + 1 < HEIGHT && !visited[idx + WIDTH]) {
            visited[idx + WIDTH] = true;
            q.push([x, y + 1]);
          }
        }
      }

      let surf = uu.getMutableSurface();
      let newColor = ctx.activeColor;
      let uuCtx = surf.canvas.getContext('2d');
      uuCtx.fillStyle = 'rgb(' + newColor.slice(0, 3).join(',') + ')';

      let maxX = hits[0][0];
      let maxY = hits[0][1];
      let minX = maxX;
      let minY = maxY;
      for (let hit of hits) {
        x = hit[0];
        y = hit[1];
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        uuCtx.fillRect(x, y, 1, 1);
      }

      uu
        .setTransparency(newColor[3])
        .clearTouchedPixels()
        .touchPixel(minX, minY)
        .touchPixel(maxX, maxY);

      render(ctx);
      commitLingeringUndoUnit(ctx);
    },
  },
  DROPPER: {
    onDown: (ctx, gesture) => {
      commitLingeringUndoUnit(ctx);
      let onePx = document.createElement('canvas');
      onePx.width = 1;
      onePx.height = 1;
      gesture.data = {
        tempSurf: onePx.getContext('2d', { willReadFrequently: true }),
      };
      TOOLS.DROPPER.onDrag(ctx, gesture);
    },
    onDrag: (ctx, gesture) => {
      let ts = gesture.data.tempSurf;
      if (!ts) return;

      let { px, py } = gesture.current;
      ts.clearRect(0, 0, 1, 1);
      ts.drawImage(ctx.doc.image.canvas, -px, -py);
      let color = ts.getImageData(0, 0, 1, 1);
      let [r, g, b, a] = [...color.data];
      ctx.setActiveColor(r, g, b, a);
    },
    onRelease: (ctx, gesture) => {
      gesture.data.tempSurf = null;
    },
  },
  BRUSH: {
    onDown: (ctx, gesture) => {
      commitLingeringUndoUnit(ctx);
      ctx.doc.previewUndoUnit = createUndoUnit(ctx, 'TEMP_SURF');
      TOOLS.BRUSH.onDrag(ctx, gesture);
    },
    onDrag: (ctx, gesture) => {
      let uu = ctx.doc.previewUndoUnit;
      if (!uu) return;
      let surf = uu.getMutableSurface();
      let x1 = gesture.current.px;
      let y1 = gesture.current.py;
      let x2 = gesture.prev.px;
      let y2 = gesture.prev.py;
      let g = surf.ctx;
      let rad = ctx.brushSize / 2;
      let style = 'rgba(' + ctx.activeColor.join(',') + ')';
      for (let xy of [[x1, y1], [x2, y2]]) {
        g.beginPath();
        g.fillStyle = style;
        g.ellipse(xy[0], xy[1], rad, rad, 0, 0, Math.PI * 2);
        g.fill();
      }
      g.beginPath();
      g.moveTo(x1, y1);
      g.lineTo(x2, y2);
      g.lineWidth = rad * 2;
      g.strokeStyle = style;
      g.stroke();

      uu
        .touchPixel(Math.min(x1, x2) - rad, Math.floor(Math.min(y1, y2) - rad - 1))
        .touchPixel(Math.max(x1, x2) + rad, Math.ceil(Math.max(y1, y2) + rad + 1));
      render(ctx);
    },
    onRelease: (ctx, gesture) => {
      commitLingeringUndoUnit(ctx);
    },
  },
  LINE: {
    onDown: (ctx, gesture) => {
      commitLingeringUndoUnit(ctx);
      ctx.doc.previewUndoUnit = createUndoUnit(ctx, 'TRANSPARENT_OVERLAY');
      TOOLS.RECTANGLE.onDrag(ctx, gesture);
    },
    onDrag: (ctx, gesture) => {
      let uu = ctx.doc.previewUndoUnit;
      if (!uu) return;

      let x1 = gesture.start.px;
      let y1 = gesture.start.py;
      let x2 = gesture.current.px;
      let y2 = gesture.current.py;
      let rad = ctx.brushSize / 2;
      let surf = uu.getMutableSurface();
      let color = ctx.activeColor;
      let style = 'rgba(' + color.slice(0, 3).join(',') + ')';
      surf.clear()
      let g = surf.ctx;

      for (let xy of [[x1, y1], [x2, y2]]) {
        g.beginPath();
        g.fillStyle = style;
        g.ellipse(xy[0], xy[1], rad, rad, 0, 0, Math.PI * 2);
        g.fill();
      }
      g.beginPath();
      g.moveTo(x1, y1);
      g.lineTo(x2, y2);
      g.lineWidth = rad * 2;
      g.strokeStyle = style;
      g.stroke();

      uu
        .setTransparency(color[3])
        .clearTouchedPixels()
        .touchPixel(Math.min(x1, x2) - rad, Math.floor(Math.min(y1, y2) - rad - 1))
        .touchPixel(Math.max(x1, x2) + rad, Math.ceil(Math.max(y1, y2) + rad + 1));


      render(ctx);
    },
    onRelease: (ctx, gesture) => {
      commitLingeringUndoUnit(ctx);
    },
  },
  RECTANGLE: {
    onDown: (ctx, gesture) => {
      commitLingeringUndoUnit(ctx);
      ctx.doc.previewUndoUnit = createUndoUnit(ctx, 'TRANSPARENT_OVERLAY');
      TOOLS.RECTANGLE.onDrag(ctx, gesture);
    },
    onDrag: (ctx, gesture) => {
      let uu = ctx.doc.previewUndoUnit;
      if (!uu) return;

      let x1 = gesture.start.px;
      let y1 = gesture.start.py;
      let x2 = gesture.current.px;
      let y2 = gesture.current.py;
      let { left, top, width, height, right, bottom } = twoPointsToRect(x1, y1, x2, y2);
      let surf = uu.getMutableSurface();
      let color = ctx.activeColor;
      surf
        .clear()
        .drawRect(left, top, width + 1, height + 1, color[0], color[1], color[2], 255);
      uu
        .setTransparency(color[3])
        .clearTouchedPixels()
        .touchPixel(left, top)
        .touchPixel(right, bottom);
      render(ctx);
    },
    onRelease: (ctx, gesture) => {
      commitLingeringUndoUnit(ctx);
    },
  },
};
let toolOptions_brush = (ctx) => {
  let { div, inputRange } = HtmlUtil;
  let { ItemList } = HtmlUtil.Components;

  let sliderSize = ctx.brushSizeSliderValue;

  let customOptionLabel = null;

  let applySize = sz => {
    sz = Math.max(1, Math.min(100, Util.ensureNumber(sz)));
    ctx.brushSize = sz;
  };

  let presets = [1, 2, 3, 4, 5, 8, 12, 20].map(n => ({ id: '' + n, size: n }));

  let selectedItem = presets.filter(v => v.id === ctx.brushSize + '')[0] || { id: 'custom' };
  let sizes = ItemList({
    fontSize: 6,
    getItems: () => {
      return [...presets, { id: 'custom' }];
    },
    getId: v => v.id,
    onSelectionChanged: id => {
      let sz = id === 'custom' ? ctx.brushSizeSliderValue : parseInt(id);
      applySize(sz);
    },
    renderItem: item => {
      let isCustom = item.id === 'custom';
      if (isCustom) {
        customOptionLabel = span({ bold: true, color: '#08f' }, sliderSize + '');
      }
      let o = div(
        { padding: 1, paddingLeft: 3, paddingRight: 3 },
        isCustom
          ? [customOptionLabel , " px"]
          : [span({ bold: true }, '' + item.size), ' px']
      );
      return o;
    },
    applyState: (e, states, id, defApply) => {
      defApply(e, states);
      if (id === 'custom') {
        customOptionLabel.set({ color: states.SELECTED ? '#8cf' : '#05f' });
      }
    },
    selectedId: selectedItem.id,
    border: '1px solid #888',
    backgroundColor: '#fff',
    color: '#000',
    margin: 4,
    fontSize: 8,
  });

  let ratioToSize = r => {
    return Math.floor(Math.max(1, Math.min(100, 1 + 99 * (r ** 2))));
  };
  let sizeToRatio = sz => {
    return Math.max(0, Math.min(1, Math.sqrt((sz - 1) / 99)));
  };

  let slider = inputRange(
    {
      min: 0,
      max: 1000,
      value: Math.floor(1000 * sizeToRatio(ctx.brushSizeSliderValue)),
      width: '100%',
    },
    v => {
      let ratio = Math.max(0, Math.min(1, v / 1000));
      let sz = ratioToSize(ratio);
      customOptionLabel.clear().set(sz + '');
      ctx.brushSizeSliderValue = sz;
      sizes.setSelectedId('custom');
      applySize(sz);
    });

  return div(
    { position: 'relative', width: '100%' },
    sizes,
    div({ margin: 4, marginLeft: 2 }, slider),
  );
};
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
PlexiOS.registerJavaScript('app', 'io.plexi.tools.draw', APP_MAIN);
})();
