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
