const MIN_MARGIN = 8;
const OVERLAP_STACK_HEIGHT = 8;
const OVERLAP_STACK_HEIGHT_WIDE = 17;
const PAGE_MARGIN = 13;
const OVERLAP_STACK_WIDTH = 2;
const OVERLAP_STACK_WIDTH_WIDE = 12;
const MAX_DRAW_STACK_COUNT = 52 - 28;

let clearBoard = (g, w, h) => {
  g.fillStyle = '#080';
  g.fillRect(0, 0, w, h);
};

let drawRectOutline = (g, x, y, width, height, color) => {
  let left = x;
  let top = y;
  let right = x + width;
  let bottom = y + height;
  let sz = 1;
  g.fillStyle = color;
  g.fillRect(left, top, width + sz, sz);
  g.fillRect(left, top, sz, height + sz);
  g.fillRect(right, top, sz, height + sz);
  g.fillRect(left, bottom, width + sz, sz);
};

let sum = (...arr) => arr.reduce((a, b) => a + b);
let renderGame = async (game) => {
  const { cardImages } = game;
  const CARD_WIDTH = cardImages.back.width;
  const CARD_HEIGHT = cardImages.back.height;
  let requiredWidth = Math.max(
    sum(
      // 7 piles
      CARD_WIDTH * 7,
      MIN_MARGIN * 6,
      PAGE_MARGIN * 2
    ),
    sum(
      PAGE_MARGIN * 2,

      // Draw stack
      CARD_WIDTH,
      OVERLAP_STACK_WIDTH * (52 - 28 - 1),
      MIN_MARGIN,

      // Drawn stack
      CARD_WIDTH,
      OVERLAP_STACK_WIDTH_WIDE * 2,

      MIN_MARGIN * 2, // Gap between aces and draw stack

      // Ace stacks
      CARD_WIDTH * 4,
      MIN_MARGIN * 3,
    )
  );

  let requiredHeight = sum(
    PAGE_MARGIN * 2,

    CARD_HEIGHT,

    MIN_MARGIN,

    CARD_HEIGHT,
    OVERLAP_STACK_HEIGHT * 6 + OVERLAP_STACK_HEIGHT_WIDE * (13 - 2),
    // maximum depth, but let two cards hang off the edge since this is rare.
  );

  {
    let gw = Math.max(150, Math.floor(game.windowWidth));
    let gh = Math.max(150, Math.floor(game.windowHeight));
    let growthRatio = 1;
    if (gw < requiredWidth) {
      growthRatio = requiredWidth / gw;
      gw = requiredWidth;
      gh *= growthRatio;
    }
    if (gh < requiredHeight) {
      let extraGrowthRatio = requiredHeight / gh;
      growthRatio *= extraGrowthRatio;
      gh = requiredHeight;
      gw *= extraGrowthRatio;
    }

    let actualWidth = Math.floor(gw + 0.5);
    let actualHeight = Math.floor(gh + 0.5);
    game.width = actualWidth;
    game.height = actualHeight;

    if (!game.canvas || game.canvas.width !== actualWidth || game.canvas.height !== actualHeight) {
      createCanvas(game, actualWidth, actualHeight);
    }
  }

  let g = game.canvas.getContext('2d');

  if (game.state === 'WIN-ANIM') {
    let anim = game.winAnim;
    if (anim.started) return;
    let cards = anim.cards;

    anim.started = true;
    clearBoard(g, game.width, game.height);
    for (let i = 0; i < 4; i++) {
      let card = cards[i];
      drawCard(g, card, card.canvas, card.lastRenderedBoundingBox[0], card.lastRenderedBoundingBox[1]);
    }
    let counter = 0;
    for (let i = 0; i < cards.length; i++) {
      let card = cards[i];
      let [x, y] = card.lastRenderedBoundingBox;
      // vx is 1-6 in either direction with a slight preference left
      let vx = Math.floor((Math.random() * 6 + 1) * (Math.random() < 0.6 ? -1 : 1));
      let vy = Math.random() * 12 - 14; // -2 to 9

      while (x < game.width && x + CARD_WIDTH >= 0) {
        x += vx;
        y += vy;
        vy += 1.2;
        if (y + CARD_HEIGHT >= game.height) {
          y = game.height - CARD_HEIGHT;
          vy = -vy * 0.75;
        }
        if (game.state !== 'WIN-ANIM') {
          return;
        }
        drawCard(g, card, card.canvas, Math.floor(x), Math.floor(y));
        if (counter++ % 2 === 0) await Util.pause(0.016);
        if (!game.isActive()) return;
      }
    }
    game.winAnim = null;
    game.state = 'EMPTY';
    clearBoard(g, game.width, game.height);
    await promptRedeal(game);
    return;
  }

  if (game.state === 'EMPTY') {
    clearBoard(g, game.width, game.height);
    return;
  }

  clearBoard(g, game.width, game.height);

  let excessY = game.height - requiredHeight;
  let pileSpacing = (game.width - CARD_WIDTH - PAGE_MARGIN * 2) / 6.0;
  let aceXs = [game.width - PAGE_MARGIN - CARD_WIDTH];
  while (aceXs.length < 4) aceXs.push(aceXs[aceXs.length - 1] - pileSpacing);
  aceXs = aceXs.reverse().map(n => Math.floor(n));
  let coords = {
    drawStack: [PAGE_MARGIN, PAGE_MARGIN],
    drawnStack: [PAGE_MARGIN + OVERLAP_STACK_WIDTH * (MAX_DRAW_STACK_COUNT - 1) + CARD_WIDTH + MIN_MARGIN, PAGE_MARGIN],
    aceStack: aceXs.map(x => [x, PAGE_MARGIN]),
    piles: Util.range(7).map(i => {
      return [
        PAGE_MARGIN + Math.floor(i * pileSpacing),
        Math.floor(PAGE_MARGIN + CARD_HEIGHT + MIN_MARGIN + excessY / 8),
      ]
    }),
  };
  game.coords = coords;

  // render draw stack
  let drawStack = game.undrawn;

  if (drawStack.length) {
    for (let i = 0; i < drawStack.length; i++) {
      drawCard(
        g,
        drawStack[i],
        game.cardAnimCounter
          ? game.cardImages.backAnim[game.cardAnimCounter % game.cardImages.backAnim.length]
          : game.cardImages.back,
        coords.drawStack[0] + i * OVERLAP_STACK_WIDTH,
        coords.drawStack[1]);
    }
  } else {
    drawRectOutline(g, coords.drawStack[0], coords.drawStack[1], CARD_WIDTH, CARD_HEIGHT, '#000');
  }

  let drawnLen = game.drawn.length;
  if (drawnLen) {
    let [x, y] = coords.drawnStack;
    for (let i = 0; i < drawnLen; i++) {
      let card = game.drawn[i];
      drawCard(g, card, card.canvas, x, y);
      if (i >= game.drawnCollapseSize) {
        x += OVERLAP_STACK_WIDTH_WIDE;
      }
    }
  }

  let acePiles = game.acePiles;
  for (let i = 0; i < acePiles.length; i++) {
    let acePile = acePiles[i];
    let [x, y] = coords.aceStack[i];
    if (acePile.length) {
      let card = acePile[acePile.length - 1];
      drawCard(g, card, card.canvas, x, y);
    } else {
      drawRectOutline(g, x, y, CARD_WIDTH, CARD_HEIGHT, '#0f0');
    }
  }

  for (let i = 0; i < game.piles.length; i++) {
    let pile = game.piles[i];
    let [x, y] = coords.piles[i];
    if (!pile.length) {
      drawRectOutline(g, x, y, CARD_WIDTH, CARD_HEIGHT, '#0f0');
    }
    for (let j = 0; j < pile.length; j++) {
      let card = pile[j];
      let img = card.faceUp ? card.canvas : game.cardImages.back;
      drawCard(g, card, img, x, y);
      y += card.faceUp ? OVERLAP_STACK_HEIGHT_WIDE : OVERLAP_STACK_HEIGHT;
    }
  }

  let float = game.floating;
  for (let i = 0; i < float.cards.length; i++) {
    let card = float.cards[i];
    drawCard(g, card, card.canvas, float.currentLeft, float.currentTop + i * OVERLAP_STACK_HEIGHT_WIDE);
  }
};

let drawCard = (g, card, cardCanvas, x, y) => {
  card.lastRenderedBoundingBox = [x, y, x + cardCanvas.width, y + cardCanvas.height];
  g.drawImage(cardCanvas, x, y);
};

let promptRedeal = async (game) => {
  if (!game.isActive()) return;
  game.state = 'EMPTY';
  renderGame(game);
  let yes = await game.os.Shell.DialogFactory.showYesNoToBool(game.pid, "New Game", "Would you like to start a new game?");
  if (yes) {
    game.reset();
  }
};

let createCanvas = (game, w, h) => {
  let isNewCanvas = !game.canvas;
  let canvas = game.canvas || HtmlUtil.canvas();
  game.canvas = canvas;
  canvas.width = w;
  canvas.height = h;
  canvas.set({ width: '100%', height: '100%', imageRendering: 'pixelated' });

  if (!isNewCanvas) return;

  let getCoord = e => {
    let bcr = canvas.getBoundingClientRect();
    let trueX = e.pageX - bcr.left;
    let trueY = e.pageY - bcr.top;
    let gameX = Math.floor(game.width * trueX / game.windowWidth + 0.5);
    let gameY = Math.floor(game.height * trueY / game.windowHeight + 0.5);

    return [gameX, gameY];
  };

  let render = async () => renderGame(game, game.width, game.height);

  let onDown = async (x, y) => {
    if (game.state === 'WIN-ANIM') {
      await promptRedeal(game);
      return;
    }
    let { pile, pileNum, index } = game.hitTest(x, y);
    if (pile) {
      game.handleMouseDown(pile, pileNum, index, x, y);
    }
    render();
  };

  let onDrag = (originX, originY, currentX, currentY) => {
    if (game.state !== 'PLAY') return;
    if (game.floating.cards.length) {
      game.handleMouseMove(originX, originY, currentX, currentY);
    }
    render();
  };

  let onUp = (originX, originY, x, y) => {
    if (game.state !== 'PLAY') return;
    if (game.floating.cards.length) {
      let r = game.floating.cards[0].lastRenderedBoundingBox;
      x = (r[0] + r[2]) >> 1;
      y = (r[1] + r[3]) >> 1;
      let { pile, pileNum, index } = game.hitTest(x, y, true);
      if (pile) {
        game.handleMouseUp(pile, pileNum);
      }
      game.releaseFloat();
    }
    render();
  };

  let drag = null;
  canvas.set({ touchAction: 'none' });
  canvas.addEventListener('pointerdown', e => {
    e.preventDefault();
    if (drag) return;
    let [x, y] = getCoord(e);
    drag = [x, y];
    onDown(x, y);
  });

  canvas.addEventListener('pointerup', e => {
    e.preventDefault();
    if (drag) {
      let [x, y] = getCoord(e);
      let d = drag;
      drag = null;
      onUp(d[0], d[1], x, y);
    }
  });

  canvas.addEventListener('pointermove', e => {
    e.preventDefault();
    if (drag) {
      let [x, y] = getCoord(e);
      onDrag(drag[0], drag[1], x, y);
    }
  });
};
