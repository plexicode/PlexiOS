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
