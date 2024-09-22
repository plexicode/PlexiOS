const TITLE = "Minesweeper";
const APP_ID = 'io.plexi.apps.minesweeper';

const APP_MAIN = async (os, procInfo, args) => {
  const { div } = HtmlUtil;
  const { pid } = procInfo;

  const WAT = 2; // There's a rogue 1-pixel border being added to the window chrome somewhere and I don't know how to get rid of it.

  let resizer = null;
  let tryCloseWindow = Util.noop;
  let settings = os.AppSettings.getScope(APP_ID);
  let mobileFriendlyEnabled = await settings.getBoolean('mobilefriendly');
  let flagButtonPushed = false;
  let toggleFlagButton = (optValue) => {
    flagButtonPushed = optValue === undefined ? !flagButtonPushed : !!optValue;
    refreshMineButton();
  };

  let onClose = null;
  let promise = new Promise(res => { onClose = res; });

  let sz = [0, 0];

  let currentDifficulty = 'MEDIUM';

  let getSize = () => {
    let [cols, rows] = SIZES[currentDifficulty];
    let width = cols * TILE_SIZE + 16 + WAT;
    let height = rows * TILE_SIZE + HEADER_HEIGHT + 16 + WAT;
    return [width, height];
  };

  let game = null;
  let createGame = () => {
    let gameUi = createGameUi(currentDifficulty, createGame, sz, toggleFlagButton, () => flagButtonPushed);
    game = gameUi.GAME_INSTANCE;
    if (resizer) resizer(...getSize());
    content.clear().set(gameUi);
    refreshMineButton();
  };

  let refreshMineButton = () => {
    game.mineBtn.style.display = mobileFriendlyEnabled ? 'inline-block' : 'none';
    game.mineBtn.set({ backgroundColor: flagButtonPushed ? '#f00' : '#fff' });
  };

  let content = div({
    fullSize: true,
    backgroundColor: '#ccc',
    color: '#000',
    padding: 8,
    overflow: 'hidden',
  });

  let actions = {
    newGame: () => createGame(),
    showScores: () => console.log("TODO: score tracking"),
    exit: () => tryCloseWindow(),
    setDifficulty: lvl => { currentDifficulty = lvl; createGame(); },
    howToPlay: () => {
      os.Shell.showWindow(pid, {
        title: TITLE + ': ' + "How to Play",
        menuBuilder: (id) => buildMenu(os, id),
        innerWidth: 350,
        innerHeight: 500,
        onInit: (contentHost, winData) => {
          contentHost.set(div(
            {
              fullSize: true,
              overflowX: 'hidden',
              overflowY: 'auto',
              backgroundColor: '#fff',
            },
            div({ padding: 10 }, generateHowToPlay())
            )
          );
        },
      });
    },
    about: () => console.log("TODO: about minesweeper"),
    toggleSound: () => console.log("TODO: sound"),
  };

  let buildMenu = (os, idChain) => {
    let {
      createCommand, createMenu, createMenuItem, createMenuSep, MENU_CTRL_CMD, MENU_CTRL, MENU_SHIFT, MENU_ALT
    } = os.Shell.MenuBuilder;

    switch (idChain.join('|')) {
      case '':
        return createMenu(
          createMenuItem('game', '_Game'),
          createMenuItem('settings', '_Settings'),
          createMenuItem('help', '_Help'),
        );

      case 'game':
        return createMenu(
          createMenuItem('new', '_New').withShortcut('F2'),
          createMenuItem('scores', '_High Scores'),
          createMenuItem('exit', '_Exit'),
        );
      case 'settings':
        return createMenu(
          createMenuItem('easy', '_Easy').withShortcut('CTRL', '1'),
          createMenuItem('intermediate', '_Intermediate').withShortcut('CTRL', '2'),
          createMenuItem('hard', '_Hard').withShortcut('CTRL', '3'),
          createMenuSep(),
          createMenuItem('minebtn', mobileFriendlyEnabled ? "Disable mobile-friendly button" : "Enable mobile-friendly button"),
          //createMenuItem('sound', 'Sound')
        );
      case 'help':
        return createMenu(
          createMenuItem('how', '_How to play').withShortcut('F1'),
          //createMenuItem('about', '_About'),
        );

      case 'game|new': return createCommand(actions.newGame);
      case 'game|scores': return createCommand(actions.showScores);
      case 'game|exit': return createCommand(actions.exit);

      case 'settings|easy': return createCommand(() => actions.setDifficulty('EASY'));
      case 'settings|intermediate': return createCommand(() => actions.setDifficulty('MEDIUM'));
      case 'settings|hard': return createCommand(() => actions.setDifficulty('HARD'));
      case 'settings|sound': return createCommand(actions.toggleSound);
      case 'settings|minebtn': return createCommand(() => {
        mobileFriendlyEnabled = !mobileFriendlyEnabled;
        settings.setBoolean('mobilefriendly', mobileFriendlyEnabled);
        flagButtonPushed = false;
        refreshMineButton();
      });

      case 'help|how': return createCommand(actions.howToPlay);
      case 'help|about': return createCommand(actions.about);
    }
  };

  actions.newGame();
  os.ProcessManager.setInterval(pid, () => { if (game) updateHeader(game); }, 100);

  let [ innerWidth, innerHeight ] = getSize();
  os.Shell.showWindow(pid, {
    title: TITLE,
    menuBuilder: (id) => buildMenu(os, id),
    innerWidth,
    innerHeight,
    hideMaximize: true,
    disableResize: true,
    destroyProcessUponClose: true,
    onClosed: () => onClose(true),
    onInit: (contentHost, winData) => {
      tryCloseWindow = () => winData.closeHandler();
      resizer = winData.setInteriorSize;
      contentHost.append(content);
      refreshMineButton();

      winData.shortcutKeyRouter
        .addKey('F2', actions.newGame)
        .addKey('CTRL+1', () => actions.setDifficulty('EASY'))
        .addKey('CTRL+2', () => actions.setDifficulty('MEDIUM'))
        .addKey('CTRL+3', () => actions.setDifficulty('HARD'))
        .addKey('F1', actions.howToPlay)
    },
  });
  return promise;
};
