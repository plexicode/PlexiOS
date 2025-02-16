(async () => {
const { Util, HtmlUtil } = PlexiOS;
const APP_RAW_IMAGE_DATA = await Util.loadImageB64Lookup({

  'icon.png': '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',
});

const TITLE = "Solitaire";
const APP_ID = 'io.plexi.apps.solitaire';
let createDeck = (cardImages) => {
  let cards = [];
  let faceLookup = ' A23456789XJQK';
  for (let suit of 'SCHD'.split('')) {
    for (let num = 1; num <= 13; num++) {
      let canvas = Util.copyImage(cardImages[suit + faceLookup[num]]);
      canvas.set({ width: canvas.width, height: canvas.height });
      let isBlack = suit === 'S' || suit === 'C';
      let card = {
        isBlack,
        num,
        suit,
        face: faceLookup[num].trim(),
        canvas,
        faceUp: false,
        lastRenderedBoundingBox: null,
        back: Util.copyImage(cardImages.back),
      };
      cards.push({ ...card, isRed: !card.isBlack, color: isBlack ? 'BLACK' : 'RED', id: suit + card.face });
    }
  }

  Util.shuffle(cards);
  return cards;
};

let createGame = async (os, pid, w, h, isActive) => {
  let settings = os.AppSettings.getScope(APP_ID);
  let cardStyle = await settings.getString('cardStyle');
  let cardImages = await HtmlUtil.Components.GameCards().generateImages(cardStyle);

  let cards = createDeck(cardImages);
  let piles = Util.range(7).map(() => []);
  for (let i = 0; i < piles.length; i++) {
    let pile = piles[i];
    for (let j = 0; j <= i; j++) {
      pile.push(cards.pop());
    }
    pile[pile.length - 1].faceUp = true;
  }
  let acePiles = [[], [], [], []];

  let inBox = (bb, x, y) => (bb && x >= bb[0] && x < bb[2] && y >= bb[1] && y < bb[3]);
  let checkStackTop = (stack, x, y) => !!(stack.length && inBox(stack[stack.length - 1].lastRenderedBoundingBox, x, y));

  let clickUndrawnPile = () => {
    releaseFloat();
    if (game.undrawn.length) {
      game.drawnCollapseSize = game.drawn.length;
      for (let i = 0; i < 3 && game.undrawn.length > 0; i++) {
        let card = game.undrawn.pop();
        card.faceUp = true;
        game.drawn.push(card);
      }
    }
  };

  let isVictory = () => {
    if (game.state !== 'PLAY') return false;

    for (let i = 0; i < 4; i++) {
      if (game.acePiles[i].length !== 13) return false;
    }
    return true;
  };
  let checkVictory = () => {
    if (isVictory()) {
      let back = game.cardImages.back;
      game.state = 'WIN-ANIM';
      game.floating.cards = [];
      let animCards = [];
      for (let i = 12; i >= 0; i--) {
        for (let j = 0; j < 4; j++) {
          let card = game.acePiles[j][i];
          let r = game.coords.aceStack[j];
          card.lastRenderedBoundingBox = [...r, r[0] + back.width, r[1] + back.height];
          card.faceUp = true;
          animCards.push(card);
          game.winAnim = {
            started: false,
            cards: animCards,
            counter: -1,
            x: -999,
            y: -999,
          };
        }
      }
      return true;
    }
    return false;
  };

  let releaseFloat = () => {
    if (!game.floating.cards.length) return;
    let float = game.floating;
    let origin = float.originPile;
    let pile = null;
    if (origin === 'DRAWN') {
      pile = game.drawn;
    } else if (('' + origin).startsWith('ACE:')) {
      let index = parseInt(origin.split(':')[1]);
      pile = game.acePiles[index];
    } else {
      pile = game.piles[float.originPile];
    }
    pile.push(...float.cards);
    float.cards = [];
  };

  let clickDrawnPile = () => {
    if (!game.drawn.length) return;
    floatCards('DRAWN', game.drawn.pop());
  };

  let lastSingleFloat = null;

  let floatCards = (origin, cardOrCards) => {
    releaseFloat();
    let cards = Util.flattenArray([cardOrCards]);
    let float = game.floating;
    float.cards = cards;
    float.originPile = origin;
    let r = cards[0].lastRenderedBoundingBox;

    float.currentLeft = r[0];
    float.currentTop = r[1];
    float.startLeft = r[0];
    float.startTop = r[1];

    let singleFloat = cards.length === 1 ? {
      card: cards[0],
      time: Util.getTime(),
    } : null;

    if (singleFloat && lastSingleFloat && singleFloat.time - lastSingleFloat.time < 0.25 && singleFloat.card === lastSingleFloat.card) {
      // double click on the same card
      let card = cards[0];
      for (let i = 0; i < 4; i++) {
        let acePile = game.acePiles[i];
        let isMatch = false;
        if (acePile.length) {
          let top = acePile[acePile.length - 1];
          if (top.suit === card.suit && top.num === card.num - 1) {
            isMatch = true;
          }
        } else if (card.num === 1) {
          isMatch = true;
        }

        if (isMatch) {
          acePile.push(card);
          float.cards = [];
          checkVictory();
          break;
        }
      }
    }

    lastSingleFloat = singleFloat;
  };

  let clickPile = (pileNum, index, x, y) => {
    releaseFloat();
    let pile = game.piles[pileNum];
    let card = pile[index];
    if (!card.faceUp) {
      if (index + 1 === pile.length) {
        card.faceUp = true;
        return;
      }
      return;
    }

    let floatThese = pile.slice(index);
    for (let i = 0; i < floatThese.length; i++) {
      pile.pop();
    }
    floatCards(pileNum, floatThese);
  };

  let clickReset = () => {
    releaseFloat();
    if (!game.undrawn.length) {
      while (game.drawn.length) {
        let card = game.drawn.pop();
        card.faceUp = false;
        game.undrawn.push(card);
      }
    }
  };

  let clickAce = (num) => {
    releaseFloat();
    let pile = game.acePiles[num];
    if (pile.length) {
      floatCards('ACE:' + num, pile.pop());
    }
  };

  let doAnimationSequence = async () => {
    for (let i = 0; i < 12; i++) {
      if (!game.isActive() || game.state !== 'PLAY') return;
      game.cardAnimCounter = i;
      await renderGame(game);
      game.cardAnimCounter = 0;
      await Util.pause(0.25);
    }
    await renderGame(game);
  };

  os.ProcessManager.setInterval(pid, doAnimationSequence, 60_000);

  let hitTestImpl = (x, y, topOnly) => {
    const CARD_WIDTH = game.cardImages.back.width;
    const CARD_HEIGHT = game.cardImages.back.height;

    let getStackCenter = stack => {
      return getBoundsCenter(stack[stack.length - 1].lastRenderedBoundingBox);
    };
    let getBoundsCenter = b => [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2];

    if (checkStackTop(game.undrawn, x, y)) return { pile: 'UNDRAW', point: getStackCenter(game.undrawn) };
    if (checkStackTop(game.drawn, x, y)) return { pile: 'DRAWN', point: getStackCenter(game.drawn) };

    if (!game.undrawn.length) {
      let drawXY = game.coords.drawStack;
      if (inBox([...drawXY, drawXY[0] + CARD_WIDTH, drawXY[1] + CARD_HEIGHT], x, y)) {
        return { pile: 'RESET-DRAW', point: getBoundsCenter(...drawXY, CARD_WIDTH, CARD_HEIGHT) };
      }
    }

    for (let i = 0; i < 4; i++) {
      let acePile = game.acePiles[i];
      if (acePile.length) {
        if (checkStackTop(acePile, x, y)) {
          return { pile: 'ACE', pileNum: i, point: getStackCenter(acePile) };
        }
      } else {
        let [ax, ay] = game.coords.aceStack[i];
        let bounds = [ax, ay, ax + CARD_WIDTH, ay + CARD_HEIGHT];
        if (inBox(bounds, x, y)) {
          return { pile: 'ACE-EMPTY', pileNum: i, point: getBoundsCenter(bounds) };
        }
      }
    }

    for (let i = 0; i < 7; i++) {
      let pile = game.piles[i];
      if (pile.length) {
        for (let j = pile.length - 1; j >= 0; j--) {
          let card = pile[j];
          if (inBox(card.lastRenderedBoundingBox, x, y)) {
            return { pile: 'PILE', pileNum: i, index: j, point: getBoundsCenter(card.lastRenderedBoundingBox) };
          }
          if (topOnly) break;
        }
      } else {
        let [px, py] = game.coords.piles[i];
        let bounds = [px, py, px + CARD_WIDTH, py + CARD_HEIGHT];
        if (inBox(bounds, x, y)) {
          return { pile: 'PILE-EMPTY', pileNum: i, point: getBoundsCenter(bounds) };
        }
      }
    }

    return null;
  };

  let game = {
    os,
    pid,
    state: 'PLAY',
    width: w,
    height: h,
    windowWidth: w,
    windowHeight: h,
    acePiles,
    piles,
    undrawn: cards,
    drawn: [],
    drawnCollapseSize: 0,
    winAnim: null,
    floating: {
      cards: [],
      currentLeft: null,
      currentTop: null,
      startLeft: null,
      startTop: null,
      originPile: -1,
    },
    canvas: null,
    cardImages,
    isActive: () => isActive(game),

    checkVictory,

    handleMouseDown: (pile, pileNum, index, x, y) => {
      switch (pile) {
        case 'UNDRAW': clickUndrawnPile(); break;
        case 'DRAWN': clickDrawnPile(); break;
        case 'PILE': clickPile(pileNum, index, x, y); break;
        case 'RESET-DRAW': clickReset(); break;
        case 'ACE': clickAce(pileNum); break;

        case 'PILE-EMPTY':
        case 'ACE-EMPTY':
          return;

        default:
          throw new Error("TODO: handle clicking on " + pile);
      }
    },

    handleMouseUp: (pile, pileNum) => {
      let float = game.floating;
      if (!float || !float.cards.length) return;
      let firstCard = float.cards[0];
      let dropAllowed = false;
      if (pile === 'PILE') {
        let stack = game.piles[pileNum];
        if (pileNum === float.originPile) {
          dropAllowed = true;
        } else {
          if (stack.length) {
            let lastCard = stack[stack.length - 1];
            if (!lastCard.faceUp) {
              dropAllowed = false;
            } else {
              if (firstCard.isBlack !== lastCard.isBlack && lastCard.num == firstCard.num + 1) {
                dropAllowed = true;
              } else {
                dropAllowed = false;
              }
            }
          }
        }

        if (dropAllowed) {
          stack.push(...float.cards);
          float.cards = [];
          return;
        }
      } else if (pile === 'PILE-EMPTY') {
        if (firstCard.num === 13) {
          game.piles[pileNum].push(...float.cards);
          float.cards = [];
          return;
        }
      } else if (pile === 'ACE') {
        if (float.cards.length === 1) {
          let card = float.cards[0];
          let stack = game.acePiles[pileNum];
          let top = stack[stack.length - 1];
          if (top.suit === card.suit && top.num === card.num - 1) {
            stack.push(card);
            float.cards = [];
            checkVictory();
            return;
          }
        }
      } else if (pile === 'ACE-EMPTY') {
        if (float.cards.length === 1) {
          let card = float.cards[0];
          if (card.num === 1) {
            game.acePiles[pileNum].push(card);
            float.cards = [];
            return;
          }
        }
      }

      releaseFloat();
    },

    handleMouseMove: (ox, oy, cx, cy) => {
      if (game.floating.cards.length) {
        let dx = cx - ox;
        let dy = cy - oy;
        game.floating.currentLeft = game.floating.startLeft + dx;
        game.floating.currentTop = game.floating.startTop + dy;
      }
    },

    releaseFloat,

    hitTest: (x, y, allowFuzzy) => {
      let topOnly = !!allowFuzzy;
      let candidate = hitTestImpl(x, y, topOnly);
      if (candidate) return candidate;
      if (allowFuzzy) {
        const CARD_WIDTH = game.cardImages.back.width;
        const CARD_HEIGHT = game.cardImages.back.height;
        let ux = CARD_WIDTH * 0.45;
        let uy = CARD_HEIGHT * 0.45;
        let t = [-1, 0, 1];
        let candidates = [];
        for (let ox of t) {
          for (let oy of t) {
            candidates.push(hitTestImpl(x + ox * ux, y + oy * uy, topOnly));
          }
        }
        candidates = candidates.filter(Util.identity);
        if (candidates.length) {
          let closest = candidates.pop();
          let calcDist = c => {
            let dx = c.point[0] - x;
            let dy = c.point[1] - y;
            return dx ** 2 + dy ** 2;
          }
          while (candidates.length) {
            let next = candidates.pop();
            if (calcDist(closest) > calcDist(next)) {
              closest = next;
            }
          }
          return closest;
        }
      }

      return { pile: null };
    },
  };

  return game;
};
let deckPickerWindow = async (os, pid, game) => {
  let { GameCards, ItemList } = await HtmlUtil.loadComponents('GameCards', 'ItemList');
  cards = GameCards();
  let { div, button } = HtmlUtil;
  let settings = os.AppSettings.getScope(APP_ID);
  let defaultSelectedId = await settings.getString('cardStyle');
  let deckIds = cards.getChoices();
  let choices = deckIds.map(id => {
    return {
      id,
      image: cards.getBackSample(id),
      name: cards.getDeckName(id),
    }
  });

  await os.Shell.showWindow(pid, {
    title: TITLE,
    innerWidth: 400,
    innerHeight: 300,
    onInit: (contentHost, winData) => {
      let selectedId = defaultSelectedId || choices[0].id;

      let refresh = () => {
        let current = choices.filter(t => t.id === selectedId)[0];
        if (current) {
          imgHost.clear().set(Util.copyImage(current.image));
        }
      };

      let imgHost = div({ height: 150, padding: 25 });
      let root = div({ fullSize: true, backgroundColor: '#080' },
        div({ westDock: 200, },
          div({ position: 'absolute', left: 10, top: 10, bottom: 10, right: 0 },
            ItemList({
              backgroundColor: '#fff',
              fullSize: true,
              getItems: () => choices,
              getId: item => item.id,
              renderItem: item => div(item.name),
              selectedId,
              onSelectionChanged: (id) => {
                selectedId = id;
                refresh();
              },
            })
          ),
        ),
        div({ eastStretchDock: 200, textAlign: 'center' },
          div(imgHost),
          button("Pick This Deck", async () => {
            settings.setString('cardStyle', selectedId);
            game.cardImages = await cards.generateImages(selectedId);
            renderGame(game);
            winData.closeHandler();
          }),
        ),
      );
      contentHost.set(root);

      refresh();
    },
  });
};
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
const APP_MAIN = async (os, procInfo, args) => {
  const { div } = HtmlUtil;
  const { pid } = procInfo;

  await HtmlUtil.loadComponent('GameCards');

  let onClose = null;
  let promise = new Promise(res => { onClose = res; });

  let gameWidth = 600;
  let gameHeight = 480;
  let windowWidth = gameWidth;
  let windowHeight = gameHeight;

  let reset = async () => {
    // use old width and height
    game = await createGame(os, pid, game.width, game.height, isGameActive);
    game.reset = reset;
    game.windowWidth = windowWidth;
    game.windowHeight = windowHeight;
    renderGame(game);
    contentDiv.clear().set(game.canvas.set({ width: '100%', height: '100%' }));

    // Lol, iOS Safari
    let r = contentDiv.getBoundingClientRect();
    onResize(Math.floor(r.width), Math.floor(r.height));
  };

  let isGameActive = g => {
    return g === game && !!os.ProcessManager.getProcess(pid);
  };

  let game = await createGame(os, pid, gameWidth, gameHeight, isGameActive);
  game.reset = reset;

  let {
    createCommand, createMenu, createMenuItem, createMenuSep, MENU_CTRL_CMD, MENU_CTRL, MENU_SHIFT, MENU_ALT
  } = os.Shell.MenuBuilder;
  let getMenu = (idChain) => {
    switch (idChain.join('|')) {
      case '':
        return createMenu(
          createMenuItem('game', '_Game'),
          createMenuItem('help', '_Help'),
        );
      case 'game':
        return createMenu(
          createMenuItem('new', '_New Game').withShortcut('F2'),
          createMenuItem('card', '_Pick Card Style').withShortcut('F3'),
          // createMenuItem('undo', '_Undo Last Move').withShortcut(MENU_CTRL_CMD, 'Z'),
          createMenuSep(),
          // createMenuItem('solve', '_Solve'),
          createMenuSep(),
          createMenuItem('exit', 'E_xit').withShortcut(MENU_CTRL_CMD, 'W'),
        );
      case 'help':
        return createMenu(
          createMenuItem('how', '_How to Play'),
          createMenuSep(),
          createMenuItem('about', '_About'),
        );

      case 'game|new': return createCommand(() => game.reset());
      case 'game|card': return createCommand(() => deckPickerWindow(os, pid, game));
      case 'game|undo': return createCommand(() => console.log("TODO: undo"));
      case 'game|exit': return createCommand(() => closeMe());
      case 'help|how': return createCommand(() => console.log("TODO: how to play"));
      case 'help|about': return createCommand(() => console.log("TODO: About"));

      case 'game|solve': return createCommand(() => {
        let allPiles = Util.flattenArray([game.piles, game.acePiles, game.drawn, game.undrawn, game.floating.cards]);
        game.piles = Util.range(7).map(_ => []);
        game.drawn = [];
        game.undrawn = [];
        for (let i = 0; i < 4; i++) {
          game.acePiles[i] = [];
          for (let j = 0; j < 13; j++) {
            let card = allPiles.pop();
            card.faceUp = true;
            game.acePiles[i].push(card);
          }
        }
        game.checkVictory();
        renderGame(game);
      });

      default:
        throw new Error("Not implemented: " + idChain.join(" -> "));
    }
  };

  let contentDiv = null;

  let closeMe = Util.noop;

  let winDataRef = null;

  let onResize = (w, h) => {
    windowWidth = w;
    windowHeight = h;
    game.windowWidth = w;
    game.windowHeight = h;
    renderGame(game);
  };

  os.Shell.showWindow(pid, {
    title: TITLE,
    menuBuilder: getMenu,
    innerWidth: gameWidth,
    innerHeight: gameHeight,
    destroyProcessUponClose: true,
    onResize: (w, h) => onResize(w, h),
    onClosed: () => onClose(true),
    onInit: (contentHost, winData) => {
      winDataRef = winData;

      winData.shortcutKeyRouter
        .addKey('F2', () => game.reset())
        .addKey('F3', () => deckPickerWindow(os, pid, game))
        .addKey('CTRL+Z', () => console.log("TODO: undo"));

      closeMe = winData.closeHandler;

      renderGame(game);

      contentDiv = div({
        fullSize: true,
        backgroundColor: '#888',
        color: '#fff',
        overflow: 'hidden',
      }, game.canvas);

      contentHost.append(contentDiv);
    },
    onShown: () => {
      let { width, height } = winDataRef.contentHost.getBoundingClientRect();
      game.windowWidth = width;
      game.windowHeight = height;
      renderGame(game);
    },
  });
  return promise;
};
PlexiOS.registerJavaScript('app', 'io.plexi.tools.solitaire', APP_MAIN);
})();
