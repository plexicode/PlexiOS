const createCanvas = (w, h) => {
  let canvas = HtmlUtil.canvas();
  canvas.width = w;
  canvas.height = h;
  return canvas.set({ size: [w, h] });
};

const render = (game) => {
  let { grid, cols, rows, canvas } = game;
  let g = canvas.getContext('2d');
  let cell;
  let palette = APP_RAW_IMAGE_DATA;
  let nums = [];
  for (let i = 0; i <= 8; i++) {
    nums.push(palette['n' + i + '.png'].canvas);
  }
  let images = {
    hidden: palette['hidden.png'].canvas,
    flag: palette['flag.png'].canvas,
    qmark: palette['qmark.png'].canvas,
    mine: palette['mine.png'].canvas,
    wrong: palette['wrong.png'].canvas,
    boom: palette['boom.png'].canvas,
    pressed: palette['pressed.png'].canvas,
    nums,
  };

  let img;
  let overrideState = (game.state === 'FAIL' || game.state === 'WIN') ? 'SHOWN' : null;
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      cell = grid[x][y];
      switch (overrideState || cell.state) {
        case 'HIDDEN':
          img = images.hidden;
          if (game.pressed && game.pressed[0] === x && game.pressed[1] === y) {
            img = images.pressed;
          }
          break;
        case 'FLAGGED':
          img = images.flag;
          break;
        case 'SHOWN':
          if (cell.hasMine) {
            img = images.mine;
            if (cell.state === 'FLAGGED') img = images.flag;
            else if (cell.wasClicked) img = images.boom;
          } else {
            img = images.nums[cell.count === null ? getCellCount(game, x, y) : cell.count];
            if (cell.state === 'FLAGGED') img = images.wrong;
          }
          break;
        case 'QMARK':
          img = images.qmark;
          break;
        default:
          throw new Error();
      }
      g.drawImage(img, x * TILE_SIZE, y * TILE_SIZE);
    }
  }
};
