let newMainScene = (w, h) => {

  let scene = {};

  let mousePushed = false;
  scene.sprites = [];
  let player = newSprite('player', 0.0, 0.0);
  scene.sprites.push(player);
  let time = 0;
  let bestDistancePromise = null;
  let bestDistance = 0;

  let gameSize = [w, h];
  scene.getGameSize = () => [...gameSize];

  for (let i = 0; i < 20; ++i) {
      while (true) {
          let tx = (Math.random() * 3 - 1.5) * gameSize[0];
          let ty = (Math.random() * 1.5 - .25) * gameSize[1];
          let playerDist = (tx ** 2 + ty ** 2) ** .5;
          if (playerDist > 100) {
              scene.sprites.push(newSprite('tree', tx, ty));
              break;
          }
      }
  }

  let getRenderOffsets = () => {
    return [
      gameSize[0] / 2 - player.x,
      gameSize[1] / 4 - player.y
    ];
  };

  scene.update = (gameCtx) => {

    if (!bestDistancePromise) {
      bestDistancePromise = gameCtx.settings.getString('highScore').then(Util.ensurePositiveInteger);
      bestDistancePromise.then(x => {
        bestDistance = x;
      });
    }
    let events = gameCtx.flushEventQueue();

    time++;

    for (let ev of events) {
      if (ev.type == 'MOUSE_DOWN') {
        mousePushed = true;
      } else if (ev.type == 'MOUSE_UP') {
        mousePushed = false;
      }
    }

    player.updatePlayer(mousePushed, scene);

    let o = getRenderOffsets();
    let offsetX = o[0];
    let offsetY = o[1];

    let newSprites = [];
    let treeCount = 0;
    for (let sprite of scene.sprites) {
      sprite.update();
      if (!sprite.dead && sprite.y + offsetY > -200) {
        newSprites.push(sprite);
        if (sprite.type == 'tree') {
          treeCount++;
        }

        if (sprite.collidable) {
          let dx = player.x - sprite.x;
          let dy = player.y - sprite.y;
          if (dx ** 2 + dy ** 2 < ((player.radius + sprite.radius) * 0.75) ** 2) {
            let oldBest = gameCtx.settings.getString('highScore').then(Util.ensurePositiveInteger);
            gameCtx.setNextScene(newCrashScene(scene, getCurrentDistance(), oldBest));
          }
        }
      }
    }
    newSprites.sort((a, b) => {
      let k = a.y - b.y;
      if (k === 0) return a.x - b.x;
      return k;
    });
    scene.sprites = newSprites;

    let targetTreeCount = 3 * time / FPS + 30;
    while (treeCount < targetTreeCount) {
      let tx = player.x + (5 * Math.random() - 2.5) * gameSize[0];
      let ty = player.y + gameSize[1] * (1.2 + Math.random() * .2);
      scene.sprites.push(newSprite('tree', tx, ty));

      treeCount++;
    }
  };

  let getCurrentDistance = () => {
    return Math.floor(player.y / (player.radius * 2));
  };

  scene.render = (gfx, rc, renderText) => {

    gameSize = [gfx.getWidth(), gfx.getHeight()];

    let o = getRenderOffsets();
    let offsetX = o[0];
    let offsetY = o[1];
    gfx.fill(255, 255, 255);

    let renderOrder = scene.sprites.slice(0);
    renderOrder.sort(item => {
        return item.y * 1000 + item.x % 1000 + (item == player ? 10 : 0);
    });

    let counts = {};
    for (let sprite of renderOrder) {
      sprite.render(gfx, offsetX, offsetY, rc);
      counts[sprite.type] = 1 + (counts[sprite.type] || 0);
    }

    renderText("Best: " + bestDistance + "\nDistance: " + getCurrentDistance(), '#000');
    /*
    let x = TextEngine.render(gfx, 'Best: ', 5, 5, { size: 'M', color: TextColor.BLUE });
    x = 150;
    TextEngine.render(gfx, bestDistance.value, 5 + x, 5, { size: 'M', color: TextColor.BLACK });

    x = TextEngine.render(gfx, 'Distance: ', 5, 55, { size: 'M', color: TextColor.BLACK });
    x = 150;
    TextEngine.render(gfx, getCurrentDistance(), 5 + x, 55, { size: 'M', color: TextColor.BLACK });
    */
  };

  return scene;
};
