const TITLE = "Ski Flea";
const APP_ID = 'io.plexi.apps.skiflea';
const FPS = 60;

const APP_MAIN = async (os, procInfo, args) => {
  const { div } = HtmlUtil;
  const { pid } = procInfo;

  let onClose = null;
  let promise = new Promise(res => { onClose = res; });

  let width = 500;
  let height = 380;
  let screen = HtmlUtil.canvas({ fullSize: true, imageRendering: 'pixelated' });
  let ctx = screen.getContext('2d');
  let setColor = (r, g, b, a) => {
    if (!a) {
      if (a !== undefined) return false;
      ctx.fillStyle = 'rgb(' + r + ',' + g + ',' + b + ')';
    } else {
      ctx.fillStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + (a / 255) + ')';
    }
    return true;
  };
  const TWO_PI = Math.PI * 2;
  let gfx = {
    fill: (r, g, b) => {
      setColor(r, g, b);
      ctx.fillRect(0, 0, screen.width, screen.height);
    },
    getWidth: () => width,
    getHeight: () => height,
    rectangle: (x, y, w, h, r, g, b, a) => {
      if (setColor(r, g, b, a)) ctx.fillRect(x, y, w, h);
    },
    ellipse: (left, top, w, h, r, g, b, a) => {
      if (setColor(r, g, b, a)) {
        ctx.beginPath();
        ctx.ellipse(left + w / 2, top + h / 2, w / 2, h / 2, 0, 0, TWO_PI);
        ctx.fill();
      }
    },
    image: (img, x, y) => {
      ctx.drawImage(img, x, y);
    },
  };

  let activeScene = null;
  let evQueue = [];
  let gameCtx = {
    os,
    settings: os.AppSettings.getScope(APP_ID),
    setTitle: Util.noop,
    setNextScene: (scene) => {
      activeScene = scene;
    },
    flushEventQueue: () => {
      let q = evQueue;
      evQueue = [];
      return q;
    },
  };

  let stillHere = true;
  let mainLoop = async () => {
    activeScene = newMainScene(width, height);
    let rc = 1;
    while (stillHere) {
      let start = Util.getTime();

      activeScene.update(gameCtx);
      activeScene.render(gfx, rc++, renderText);

      let end = Util.getTime();
      let diff = end - start;
      let delay = 1 / FPS - diff;
      if (delay > 0) {
        await Util.pause(delay);
      }
    }
  };

  let updateSize = () => {
    screen.width = width;
    screen.height = height;
    ctx = screen.getContext('2d');
  };

  updateSize();

  let textPanel = div({ userSelect: 'none', pointerEvents: 'none', fullSize: true, padding: 8, fontSize: 14, bold: true });

  let lastShown = null;
  let brs = Util.range(20).map(() => document.createElement('br'));
  let renderText = (txt, color) => {
    let k = (txt || '') + '\t' + color;
    if (lastShown !== k) {
      lastShown = k;
      textPanel.clear().set({ color: color }, txt.split('\n').map((line, i) => [line, brs[i]]));
    }
  };

  os.Shell.showWindow(pid, {
    title: TITLE,
    innerWidth: width,
    innerHeight: height,
    destroyProcessUponClose: true,
    onClosed: () => {
      stillHere = false;
      onClose(true);
    },
    onResize: (w, h) => {
      width = w;
      height = h;
      updateSize();
    },
    onInit: (contentHost, winData) => {
      gameCtx.setTitle = winData.setTitle;

      let content = div({
        fullSize: true,
        backgroundColor: '#fff',
        color: '#000',
        overflow: 'hidden',
      }, screen, textPanel);

      let stahp = ev => {
        ev.stopPropagation();
        ev.preventDefault();
      };
      let onDown = ev => { stahp(ev); evQueue.push({ type: 'MOUSE_DOWN', x: 0, y: 0 }); };
      let onUp = ev => { stahp(ev); evQueue.push({ type: 'MOUSE_UP', x: 0, y: 0 }); };

      screen.addEventListener('mousedown', onDown);
      screen.addEventListener('mouseup', onUp);
      screen.addEventListener('touchstart', onDown);
      screen.addEventListener('touchend', onUp);
      screen.addEventListener('touchmove', ev => { stahp(ev); });
      screen.addEventListener('touchcancel', ev => { stahp(ev); });

      contentHost.append(content);
    },
    onShown: () => mainLoop(renderText),
    onKey: (ev, isDown) => {
      if (ev.code == 'Space') {
        evQueue.push({ type: isDown ? 'MOUSE_DOWN' : 'MOUSE_UP', x: 0, y: 0 });
      }
    },
  });
  return promise;
};
