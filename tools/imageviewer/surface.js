let createSurface = (ctx, host) => {

  let canvas = HtmlUtil.canvas({ fullSize: true });
  let g = canvas.getContext('2d');

  let srcWidth = ctx.canvas.width;
  let srcHeight = ctx.canvas.height;
  let srcWhRatio = srcWidth / srcHeight;

  let dstWidth = 100;
  let dstHeight = 100;

  host.clear().set({ cursor: 'grab', backgroundColor: '#445' }, canvas);

  let render = () => {

    let dstWhRatio = Math.max(1, dstWidth) / Math.max(1, dstHeight);
    let dstRenderWidth;
    let dstRenderHeight;
    if (dstWhRatio < srcWhRatio) {
      dstRenderWidth = dstWidth;
      dstRenderHeight = dstRenderWidth / srcWhRatio;
    } else {
      dstRenderHeight = dstHeight;
      dstRenderWidth = dstHeight * srcWhRatio;
    }

    let xOffset = (dstWidth - dstRenderWidth) >> 1;
    let yOffset = (dstHeight - dstRenderHeight) >> 1;

    g.fillStyle = '#42454b';
    g.fillRect(0, 0, dstWidth, dstHeight);

    g.drawImage(
      ctx.canvas,
      xOffset, yOffset,
      Math.floor(dstRenderWidth + 0.5), Math.floor(dstRenderHeight + 0.5));
  };

  return {
    updateSize: (w, h) => {
      dstWidth = w;
      dstHeight = h;
      canvas.width = w;
      canvas.height = h;
      render();
    },
  };
};
