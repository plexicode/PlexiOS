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
