let getCanvasGraphics = (canvas, renderFrequently) => {
  let key = ['2d', renderFrequently].join();
  if (!canvas.PX_GFX_CACHE) canvas.PX_GFX_CACHE = {};
  let gfx = canvas.PX_GFX_CACHE[key];
  if (!gfx) {
    let getCtx = () => canvas.getContext('2d', renderFrequently ? { willRenderFrequently: true } : undefined);
    let ctx = null;
    let getColor = (r, g, b, a) => {
      if (g === undefined) {
        if (Array.isArray(r)) {
          g = r[1];
          b = r[2];
          a = r[3];
          r = r[0];
        } else {
          return r; // string direct
        }
      }
      if (a === undefined || a >= 255) {
        return 'rgb(' + [r, g, b].join(',') + ')';
      }
      return 'rgba(' + [r, g, b, a / 255].join(',') + ')';
    };

    gfx = {
      getSize: () => [canvas.width, canvas.height],
      setSize: (w, h) => {
        canvas.width = w;
        canvas.height = h;
        return gfx;
      },
      clear: (x, y, w, h) => {
        ctx = ctx || getCtx();
        if (x === undefined) {
          x = 0;
          y = 0;
          w = canvas.width;
          h = canvas.height;
        }
        ctx.clearRect(x, y, w, h);
        return gfx;
      },
      rectangle: (x, y, w, h, r, g, b, a) => {
        ctx = ctx || getCtx();
        ctx.fillStyle = getColor(r, g, b, a);
        ctx.fillRect(x, y, w, h);
        return gfx;
      },
      ellipse: (x, y, w, h, r, g, b, a) => {
        ctx = ctx || getCtx();
        ctx.fillStyle = getColor(r, g, b, a);
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        return gfx;
      },
      polygon: (pts, r, g, b, a) => {
        ctx = ctx || getCtx();
        ctx.fillStyle = getColor(r, g, b, a);
        ctx.beginPath();
        ctx.moveTo(...pts[0]);
        for (let i = 1; i < pts.length; i++) ctx.lineTo(...pts[i]);
        ctx.fill();
        return gfx;
      },
      triangle: (x1, y1, x2, y2, x3, y3, r, g, b, a) => {
        return gfx.polygon([[x1, y1], [x2, y2], [x3, y3]], r, g, b, a);
      },
    };
    canvas.PX_GFX_CACHE[key] = Object.freeze(gfx);
  }

  return gfx;
};
