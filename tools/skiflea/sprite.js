const _SPRITE_RADIUS = 20;


let imageCache = {};

let getTreeImage = (top, middle, bottom) => {
  let fp = ['tree', top, middle, bottom].join('_');
  if (!imageCache[fp]) {
    let img = Util.copyImage(APP_RAW_IMAGE_DATA['tree-base.png'].canvas);
    let g = img.getContext('2d');
    if (top) g.drawImage(APP_RAW_IMAGE_DATA['tree-snow' + top + 'a.png'].canvas, 0, 0);
    if (middle) g.drawImage(APP_RAW_IMAGE_DATA['tree-snow' + middle + 'b.png'].canvas, 0, 0);
    if (bottom) g.drawImage(APP_RAW_IMAGE_DATA['tree-snow' + bottom + 'c.png'].canvas, 0, 0);
    imageCache[fp] = img;
  }
  return imageCache[fp];
};

let fleaImages = {
  W: APP_RAW_IMAGE_DATA['flea-w.png'].canvas,
  E: APP_RAW_IMAGE_DATA['flea-e.png'].canvas,
  S: APP_RAW_IMAGE_DATA['flea-s.png'].canvas,
};
let getPlayerImage = (angle) => {
  let r = angle / (Math.PI / 4);
  if (r < -.4) {
    return fleaImages.W;
  } else if (r > 0.4) {
    return fleaImages.E;
  } else {
    return fleaImages.S;
  }
};

let newSprite = (type, _x, _y) => {
  let SPRITE_RADIUS =  _SPRITE_RADIUS
  let sprite = {};
  sprite.type = type;
  sprite.x = _x;
  sprite.y = _y;
  sprite.dead = false;
  let lifetimeCounter = 0;
  sprite.collidable = false;
  let velocity = 0.0;
  let angle = 0.0;
  let vx = 0.0;
  let vy = 0.0;
  let trailFade = 192;
  let image = null;
  if (type === 'tree') {
    sprite.collidable = true;
    SPRITE_RADIUS = 32;
    image = getTreeImage(
      (Math.floor(Math.random() * 10 / 3) + 1) % 4,
      (Math.floor(Math.random() * 10 / 3) + 1) % 4,
      (Math.floor(Math.random() * 10 / 3) + 1) % 4,
    );
  }

  sprite.radius = SPRITE_RADIUS;

  let update = () => {
    sprite.x += vx;
    sprite.y += vy;
    lifetimeCounter++;
  };

  let updatePlayer = (mousePushed, playScene) => {
    if (type != 'player') throw new Exception();
    velocity = Math.min(velocity + .15, 6);

    let angleChangePerSecond = Math.PI;
    let angleChangePerFrame = angleChangePerSecond / FPS;
    angle += angleChangePerFrame * (mousePushed ? 1 : -1);
    angle = Math.min(Math.max(angle, -Math.PI / 4), Math.PI / 4);

    vx = velocity * Math.sin(angle);
    vy = velocity * Math.cos(angle);

    if (true) { // if (lifetimeCounter % 3 == 0) {
      let trail1 = newSprite('trail', sprite.x - SPRITE_RADIUS * .6, sprite.y);
      let trail2 = newSprite('trail', sprite.x + SPRITE_RADIUS * .6, sprite.y);
      playScene.sprites.push(trail1, trail2);
    }
  };

  let render = (gfx, offsetX, offsetY, rc) => {
    switch (type) {
      case 'player':
        let img = getPlayerImage(angle);
        gfx.image(img, Math.floor(sprite.x + offsetX - img.width / 2 + 0.1), Math.floor(sprite.y + offsetY - img.height * 0.7));
        /*
        gfx.ellipse(
          sprite.x + offsetX - SPRITE_RADIUS, sprite.y + offsetY - SPRITE_RADIUS,
          SPRITE_RADIUS * 2, SPRITE_RADIUS * 2,
          0, 0, 0);
        //*/
        break;

      case 'trail':
        if (trailFade >= 255) {
          sprite.dead = true;
          return;
        }
        gfx.ellipse(
          sprite.x + offsetX - SPRITE_RADIUS / 5,
          sprite.y + offsetY - SPRITE_RADIUS / 2 + SPRITE_RADIUS * 0.8,
          SPRITE_RADIUS / 2.5, SPRITE_RADIUS / 2.5,
          trailFade, trailFade, trailFade);
        trailFade += 1;
        break;

      case 'tree':
        let lx = sprite.x + offsetX - SPRITE_RADIUS;
        let mx = lx + SPRITE_RADIUS;
        let rx = mx + SPRITE_RADIUS;
        let ty = sprite.y - SPRITE_RADIUS + offsetY;
        let by = sprite.y + SPRITE_RADIUS + offsetY;

        // gfx.triangle(lx, by, rx, by, mx, ty, 20, 108, 30);
        //gfx.rectangle(lx, ty, rx - lx, by - ty, 20, 108, 30);
        //gfx.rectangle(mx - 2, by, 4, 8, 128, 64, 20);
        gfx.image(image, lx, ty);
        break;

      default:
        throw new Exception();
    }
  };

  sprite.update = update;
  sprite.updatePlayer = updatePlayer;
  sprite.render = render;

  return sprite;
};
