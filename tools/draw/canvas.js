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
