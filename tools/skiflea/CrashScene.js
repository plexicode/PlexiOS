let newCrashScene = (bg, distance, bestDistancePromise) => {

  let counter = 0;
  let bestDistanceFuture = 0
  let newRecord = false;
  let alreadySet = false;
  bestDistancePromise.then(x => {
    bestDistanceFuture = x;
    newRecord = distance > x;
  });

  let text = null;

  let scene = {};

  scene.update = (gameCtx) => {
    if (newRecord && !alreadySet) {
      gameCtx.settings.setString('highScore', distance);
      alreadySet = true;
    }
    if (counter === 1) {
      gameCtx.setTitle(TITLE + " | Distance: " + distance);
    }

    counter++;
    for (let ev of gameCtx.flushEventQueue()) {
      switch (ev.type) {
        case 'MOUSE_DOWN':
          if (counter > 60) {
            gameCtx.setTitle(TITLE);
            gameCtx.setNextScene(newMainScene(...bg.getGameSize()));
          }
          break;
      }
    }
  };

  scene.render = (gfx, rc, renderText) => {

    let gameSize = [gfx.getWidth(), gfx.getHeight()];

    bg.render(gfx, rc, Util.noop);
    let dark = Math.min(counter * 4, 200);
    gfx.rectangle(0, 0, gameSize[0], gameSize[1], 0, 0, 0, dark);

    let text = [
      "Final Distance: " + distance,
      (bestDistanceFuture ? "Best Distance: " + bestDistanceFuture : ''),
      newRecord ? "New record!" : '',
    ].join('\n');

    let flash = newRecord;
    if (flash) flash = Math.floor(rc / 5) % 2 === 0;
    renderText(text, flash ? '#f00' : '#ff0');
    /*
    TextEngine.render(
      gfx,
      "CRASH!",
      40, 200,
      {
        size: 'XXL',
        color: (counter < getFps() && (counter / 3) % 2 == 0)
          ? TextColor.RED
          : TextColor.YELLOW,
      });

    TextEngine.render(gfx, "Distance travelled:", 40, 400, { 'size': 'S', 'color': TextColor.WHITE });
    let x = TextEngine.render(gfx, distance, 100, 480, { 'size': 'XXL', 'color': TextColor.LIME });
    TextEngine.render(gfx, ' cm', 100 + x, 520, { 'size': 'L', 'color': TextColor.LIME });
    */
  };

  return scene;
};
