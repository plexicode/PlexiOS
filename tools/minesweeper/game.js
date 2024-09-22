const initializeGame = (game) => {
  let slots = [];
  for (let y = 0; y < game.rows; y++) {
    for (let x = 0; x < game.cols; x++) {
      game.grid[x][y] = {
        count: null, // lazy init
        hasMine: false,
        state: 'HIDDEN', // HIDDEN | FLAGGED | CLEARED
      };
      slots.push([x, y]);
    }
  }

  for (let i = 0; i < slots.length; i++) {
    let j = Math.floor(slots.length * Math.random());
    let t = slots[i];
    slots[i] = slots[j];
    slots[j] = t;
  }

  let mineCount = MINE_COUNT[game.difficulty];
  for (let i = 0; i < mineCount; i++) {
    let [x, y] = slots[i];
    game.grid[x][y].hasMine = true;
  }
  game.minesTotal = mineCount;
};

let safetySwap = (game, x, y) => {
  let choices = [];
  for (let y = 0; y < game.rows; y++) {
    for (let x = 0; x < game.cols; x++) {
      if (!game.grid[x][y].hasMine) {
        choices.push([x, y]);
      }
    }
  }
  let [tx, ty] = choices[Math.floor(Math.random() * choices.length)];
  game.grid[tx][ty].hasMine = true;
  game.grid[x][y].hasMine = false;
};

let propagateClick = (game, x, y) => {
  let visited = {};
  let q = [[x, y]];
  let { cols, rows } = game;
  let neighbors = [[-1, -1], [-1, 0], [-1, 1], [1, -1], [1, 0], [1, 1], [0, -1], [0, 1]];
  while (q.length) {
    let current = q.pop();
    if (getCellCount(game, ...current) === 0) {
      for (let [ox, oy] of neighbors) {
        let nx = current[0] + ox;
        let ny = current[1] + oy;
        if (nx >= 0 && ny >= 0 && nx < cols && ny < rows) {
          let k = `${nx}:${ny}`;
          if (!visited[k]) {
            let xy = [nx, ny];
            visited[k] = xy;
            q.push(xy);
          }
        }
      }
    }
  }
  Object.values(visited).forEach(xy => {
    let cell = game.grid[xy[0]][xy[1]];
    if (cell.state === 'HIDDEN') {
      cell.state = 'SHOWN';
    }
  });
};

let setCellState = (game, cell, newState) => {
  if (cell.state === newState) return;
  if (cell.state === 'FLAGGED') game.minesMarked--;
  if (newState === 'FLAGGED') game.minesMarked++;
  cell.state = newState;
};

let applyClick = (game, x, y, isRightClick) => {
  if (game.state === 'NOT_STARTED') {
    game.state = 'PLAYING';
    if (game.grid[x][y].hasMine) {
      safetySwap(game, x, y);
    }
    game.startTime = Util.getTime();
    // TODO: animate timer
  }
  if (game.state !== 'PLAYING') return;

  let cell = game.grid[x][y];

  if (isRightClick) {
    if (cell.state === 'HIDDEN') {
      cell.state = 'FLAGGED';
      game.minesMarked++;
      updateHeader(game);
      cell.wasClicked = true;
    } else if (cell.state === 'FLAGGED') {
      cell.state = 'QMARK';
      game.minesMarked--;
      updateHeader(game);
      cell.wasClicked = false;
    } else if (cell.state === 'QMARK') {
      cell.state = 'HIDDEN';
      cell.wasClicked = false;
    }
  } else if (cell.state !== 'HIDDEN') {
    return;
  } else if (cell.hasMine) {
    cell.wasClicked = true;
    game.state = 'FAIL';
    game.timeFinished = Util.getTime();
  } else {
    cell.state = 'SHOWN';
    cell.wasClicked = true;
    if (getCellCount(game, x, y) === 0) {
      propagateClick(game, x, y);
    }
  }

  if (game.state === 'PLAYING') {

    let cleared = 0;

    for (let x = 0; x < game.cols; x++) {
      for (let y = 0; y < game.rows; y++) {
        cell = game.grid[x][y];
        if (cell.state === 'SHOWN' && !cell.hasMine) {
          cleared++;
        }
      }
    }

    if (cleared + game.minesTotal === game.cols * game.rows) {
      game.state = 'WIN';
      game.timeFinished = Util.getTime();
    }
  }
};

const createGameUi = (difficulty, newGameCb, szOut, onFlagBtnPushed, isFlagModeEnabled) => {
  const { button, div, span } = HtmlUtil;
  let [cols, rows] = SIZES[difficulty];
  let canvas = createCanvas(TILE_SIZE * cols, TILE_SIZE * rows);

  let game = {
    difficulty,
    cols,
    rows,
    startTime: null,
    grid: makeGrid(cols, rows),
    canvas,
    pressed: null,
    state: 'NOT_STARTED',
    remainingHost: span(),
    timeHost: span(),
    minesMarked: 0,
    minesTotal: 0,
    startTime: Util.getTime(),
    newGameBtn: button(':)', () => newGameCb()),
    timeFinished: null,
  };

  initializeGame(game);

  render(game);

  let getCoord = (e) => {
    let rect = game.canvas.getBoundingClientRect();
    let x = e.pageX - rect.left;
    let y = e.pageY - rect.top;
    let col = Math.floor(x / TILE_SIZE);
    let row = Math.floor(y / TILE_SIZE);
    if (col < 0 || row < 0 || col >= game.cols || row >= game.rows) return null;
    return [col, row];
  };

  let initialPress = null;

  canvas.addEventListener('pointerdown', e => {
    if (game.state === 'FAIL' || game.state === 'WIN') return;
    e.preventDefault();
    let xy = getCoord(e);
    if (!xy) return;
    let [x, y] = xy;
    initialPress = xy;
    game.pressed = xy;

    render(game);
    updateHeader(game);
  });
  canvas.addEventListener('pointerup', e => {
    e.preventDefault();
    game.pressed = null;
    if (!initialPress) return;
    let xy = getCoord(e);
    if (!xy) return;
    let [x, y] = xy;
    initialPress = null;
    applyClick(game, x, y, e.button === 2 || isFlagModeEnabled());
    onFlagBtnPushed(false);
    render(game);
    updateHeader(game);
  });
  canvas.addEventListener('pointermove', e => {
    e.preventDefault();
    if (!initialPress) return;
    let xy = getCoord(e);
    if (!xy) {
      game.pressed = null;
      return;
    }
    let [x, y] = xy;
    game.pressed = (x === initialPress[0] && y === initialPress[1]) ? xy : null;

    render(game);
  });
  canvas.addEventListener('contextmenu', e => { e.preventDefault(); });

  let uiWidth = TILE_SIZE * cols;
  let uiHeight = TILE_SIZE * rows + HEADER_HEIGHT;

  szOut[0] = uiWidth;

  updateHeader(game);

  let mineImg = Util.copyImage(APP_RAW_IMAGE_DATA['bigmine.png'].canvas);
  let timeImg = Util.copyImage(APP_RAW_IMAGE_DATA['clock.png'].canvas);

  game.mineBtn = button(
    Util.copyImage(APP_RAW_IMAGE_DATA['flag.png'].canvas).set({ size: 24, userSelect: 'none', pointerEvents: 'none' }),
    () => onFlagBtnPushed(),
    { backgroundColor: '#fff' });
  let output = div(
    {
      position: 'absolute',
      size: [uiWidth, uiHeight],
    },
    div(
      { northDock: HEADER_HEIGHT },
      div(
        {
          position: 'absolute',
          top: 10,
          width: 100,
        },
        mineImg.set({ size: 24 }), ' ', game.remainingHost.set({ position: 'relative', top: -4 }),
      ),
      div(
        {
          position: 'absolute',
          left: '40%',
          width: 0,
          top: 2,
        },
        game.newGameBtn.set({ position: 'absolute', left: -15, padding: 4, boxSizing: 'border-box', paddingBottom: 2 }),
      ),
      div(
        {
          position: 'absolute',
          right: 0,
          top: 10,
          width: 120,
          textAlign: 'right',
        },
        timeImg.set({ size: 16 }), ' ', game.timeHost,
        game.mineBtn.set({ padding: 2, boxSizing: 'border-box', marginLeft: 3 }),
      ),
    ),
    canvas.set({ position: 'absolute', top: HEADER_HEIGHT, width: '100%' })
  );

  output.GAME_INSTANCE = game;

  return output;
};

let getFaceImage = (game, type) => {
  if (!game.cachedFaces) game.cachedFaces = {};
  if (!game.cachedFaces[type]) {
    let file = 'face-' + type.toLowerCase() + '.png';
    let img = Util.copyImage(APP_RAW_IMAGE_DATA[file].canvas);
    img.set({ size: 25, userSelect: 'none', pointerEvents: 'none' });
    game.cachedFaces[type] = img;
  }
  return game.cachedFaces[type];
};

let updateHeader = (game) => {
  let mines = game.minesTotal - game.minesMarked;
  let renderedRemaining = mines >= 0
    ? Util.ensureNumLen(mines, 3)
    : ('-' + Util.ensureNumLen(mines, 2));
  if (game.lastRenderedMines !== renderedRemaining) {
    game.remainingHost.innerText = renderedRemaining;
    game.lastRenderedMines = renderedRemaining;
  }

  let end = game.timeFinished || Util.getTime();
  let timeRemaining = Math.floor(end - game.startTime);
  let mins = Math.floor(timeRemaining / 60);
  let secs = timeRemaining - mins * 60;
  let renderTime = mins + ':' + Util.ensureNumLen(secs, 2);
  if (game.state === 'NOT_STARTED') renderTime = '0:00';
  if (game.lastRenderedTime !== renderTime) {
    game.lastRenderedTime = renderTime;
    game.timeHost.innerText = renderTime;
  }

  let expectedFace;
  if (game.state === 'FAIL') expectedFace = 'DEAD';
  else if (game.state === 'WIN') expectedFace = 'WIN';
  else if (game.pressed) expectedFace = 'GASP';
  else expectedFace = 'HAPPY';
  let faceImg = getFaceImage(game, expectedFace);
  if (game.newGameBtn.firstChild !== faceImg) {
    game.newGameBtn.clear().set(faceImg);
  }
};

const getCellCount = (game, x, y) => {
  if (x < 0 || y < 0 || x >= game.cols || y >= game.rows) throw new Error();
  let cell = game.grid[x][y];
  if (cell.count !== null) return cell.count;
  if (cell.hasMine) throw new Error();

  let left = Math.max(0, x - 1);
  let right = Math.min(game.cols - 1, x + 1);
  let top = Math.max(0, y - 1);
  let bottom = Math.min(game.rows - 1, y + 1);

  let total = 0;
  for (let col = left; col <= right; col++) {
    for (let row = top; row <= bottom; row++) {
      total += +game.grid[col][row].hasMine;
    }
  }
  cell.count = total;
  return total;
};
