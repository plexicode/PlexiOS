(async () => {
const { Util, HtmlUtil } = PlexiOS;
const APP_RAW_IMAGE_DATA = await Util.loadImageB64Lookup({

  'flea-e.png': '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',
  'flea-s.png': 'iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAUWSURBVHhe7Zs7ixVZEMe7l/ULCJqugZmw0WpksMkmmxgbCoIgmxpsNExkYCqCsGBovMkmpkZqJJgZaKrgV2j7X1N1prpunWf36SuuPzjTr/Oqfz2m7zB3HI7I9Gya+JQY74y77+doAgTjr9HPM97tL8JPfDwa440xNGCj4nsHxk6P7n+kI9reAhy1BszAeD4dhgdPfsHh/5UCx2bvCCgJ7133tNdiZLgOd8uXt5/p+PDlb3Sc2WVveywy/X3zzXDx10t8eYgYr2Ehuu/vRw3gYy8WOY9IADoauPLH6B4BPReYplfLmicvOxrbR8P9u4rQa3K80CxfcxvYQ4AfNYCPW0NxTVEgVEbDHt4HtQuIRSXjDkUoYP40yGdEdwFqmE5OTmBNqUXSt6q9vveHnO9CjcIQYDg9PcV5UQTMxvBpHdefvsBhF+9/U0UQhrPxu1Gqcq33wSKMc9EQMbx7FGwdASGX6aqR6fxvIqvnylEiAHm/AMp57WllSDK07bOR/yyo5usmQnEEZMLfLXhiyFoiImwiyhYp0FztBW98Zk6JytUirBXANb7BIHoufXJ9DatEyAnQUv0JbUylQSWM2FNhbUqyJgJWh/5alAjNUbBFDdjs5QXzVIi6SYVNCVCsKjaNzUsT5H4rdj4HnQrYb3UkxASongjGSmsBhtqxMh+LsM3vVEM2BbgAeowl3lUGRPGMr4CEaS2Inqrkfdl4xgMHhVAbK8+m3y8MN27/R+ceuTkS64NYtBZFjBsBdkN8XZQW6CsNiDGvnv9JR7mvr9Hn0t1bdA3sHDl039IxQjIFMJn2hkfuObh89cxYjb336b0fIQnvwyEhAtGv1niQTAGLMlaPcyNDxPvw+jHfGYYr1/86uG/vff7nX7ov8Jp2n4vUQx97PVOUAj/zUYOBE08SwAKyyPwsGK0X1mA8DIJn4W0Yaol5XXAMWTjH7rGFmEreK3A0MjxEAABDUQQxFvcl/0UYuS8REDNMr819DsRRxGxb4EVADJpwXtgNeaA9I8aDs3w/97ZXEwSMTYmsxLEG4lo7rojse4ADFrIteFFtkLzrhX6MwpQAtGaMms8HngBFAz0ggvYeQh3NGibCyH0YhoixkSGCSpsJgkegV+MavMlaPwJTZRZjPCQadA3wcKKmah/yVlhiQ0sKRGEvRYEw4mkxXqJBRwSDjUurobb/AVAQadCSCtNs4DR7WMZnm/RHwzmaet4K2VBih6eWpECLkjCATryCJl63z7xU4DRo9iYbr38juHPZm2I8zlcJ4CGGd8p9C9kCUvZsWgOAY0RA575Fj0uJWEH4jcBCFKVUUd4kCPmM85om46QW8P21kD0pm3RYrA1/kKwBJUiErK0BilgqkCBIAU+dqGI5JJRT4e5R278GSQVGbIMQIwSgk7lpWpU/GNdiWKqONODZEu6FE84TL0y8CXKEVIAxpUXNGN6ybgwvmml+u4h0XCMA/Wus+p/fgCeE9bYa20uA6LyeSiB2PwYEwBh8NqAjN6Cv3SZj57YVdq7Fdcl7ABSr2hA8qD8VKjCXbUSk/xpEyLCGIthT+iLkTbI5EMFLnRV4+17cEwFiSjUh3sSnw9R3BDTySVJFQlXUKVKeF/Csdf4ksjg1fBlKfSEqhu1XMmYzNvM6g83z6TmZL0O1jNmM0hrQTIEhY+Y7A13pLkArXlT04JsVgOleB7oKUJHHR0uDHkXGeq10DRqnQ3+PQth18gZaxWtkGL4CbiDoLsOYRKAAAAAASUVORK5CYII=',
  'flea-w.png': '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',
  'icon.png': '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',
  'tree-base.png': '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',
  'tree-snow1a.png': 'iVBORw0KGgoAAAANSUhEUgAAAEAAAABICAYAAABGOvOzAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAADeSURBVHhe7dSBDcIgEIVhdBRdQUfRIXUUXUFXqbkGzEmkQbwjBv8vMbXYGt4rJQDo4nS5TSKePsl4/DquFF7owHHoZWy4QnT4JaWSvK3i0VwKcdht5vNPna/3+Xjcb93mKEz/XD+51uC5VITwLuNrNcu95poSuVeX/FO8wyfWJazj0YUsX/2xei0smb1TNU+lpQC9B2hW+4HZCliakPzWMuFSeEvddtW0QvJVUBPSc/fvXkCLIQoQ70rIw9VcY6lrAUIH9AwGAAAAAAAAAAAAAAAAAAAAAAAAAMDfCeEBSydp5bruRBIAAAAASUVORK5CYIJFTkSuQmCC',
  'tree-snow1b.png': 'iVBORw0KGgoAAAANSUhEUgAAAEAAAABICAYAAABGOvOzAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAADdSURBVHhe7dTbTcMwFABQl1HaFWAUOiSMUlZoVym1ZEtRlNo3ceADzvmxJSe+DyU3AQAAAAAA/8ahrEM+Ltd72ab312P6/Lql89tpl7t7auyt8YaTzAnkopccHsp2lftD2Yblple/0vxceER5PKy8NiTnNv0qdxUtfCqazJa7W3ZvxEiCvWTq+U9oxX0pa1frkvz/Tf/BudZZVI3Ri7VWaFi0il8yH4rThFsDam2cuaVhXGM/ixuels+Sm1/cK6I3oXtxtjZpuAFrRJs1arTZAAAAAAAAAAAA8Kel9A1ySOy50K/cgAAAAABJRU5ErkJggg==',
  'tree-snow1c.png': 'iVBORw0KGgoAAAANSUhEUgAAAEAAAABICAYAAABGOvOzAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAFySURBVHhe7dQBTsMwDIXhjqPAFeAocEg4ClwBrjJwZUOV2omTBm2C/5OmttqW2i9uFwAAAAAAAAAAAAAAAAAAgH/v+fX9LB+9TDkrvbxKJz3u9DT7eH+rZ77TFz0dVgY5Y82QND+TLrtrote6WEG/2tGvv0UTvEtRftTa0ayXtw89+5mSozsnzejpEKvp6eFurcMNQI7ZELZNlrw1jgYwa4OkbgnBLcYblfKmtcZFVOTRAETvJkWkh7AYL4SIjVOmsBkBlEanohrAiNbzaWOnl03eerUAezbNTAkg07jJBtBaUxwNI3wHZNWK9N4RmeYzj5GnFkbNjR67Rc1L42Xz0njUvDRsRkbY6BKrnnWGJ0BuYrs0sttSqJ7ulOuNvuAyEzcUQJRw5oamFoDwQt1qhWL/b9U0FMAMrQCE91zXxrsMJTMFFwtg+wi19LzgyoCuNgBhxf5GEFkXDcB4Y+2F8mcDMLXnW/S8ZAEAAAAAoWX5BETKWhAWKuMvAAAAAElFTkSuQmCC',
  'tree-snow2a.png': 'iVBORw0KGgoAAAANSUhEUgAAAEAAAABICAYAAABGOvOzAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAADcSURBVHhe7dbrbcIwGAXQ0FFghXYUGBJGoSvAKq0+sCUrysMSgRByzp84ECPfGxl508zkeL78pWFz+NnNto5ZRPhS3JeFfLR2+GwVBfSFzz66hLHw2atL+ErXp4pQ++9tuluR2rfetvitEAFWHX5Izffpp15i0gNILL5vr59+r2l0N/SfEM+Wh6Mopj1/qsPT5AWkYZWuEsqgOWQUcPugkJ97tIhJCwhdJeRF1hZUhspz+sp6uwLGjJXQFWhozuIKCH2BHg2zaLXbAwAAAAAAAAAAAAAAAACATk3zDwZyfMZeA87aAAAAAElFTkSuQmCC',
  'tree-snow2b.png': 'iVBORw0KGgoAAAANSUhEUgAAAEAAAABICAYAAABGOvOzAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAEsSURBVHhe7dX/bcJADIbh0FFghXYUGLKM0q7QrgKY2pJrcr8vf0R6HymKkZKc/eVQFgAAAAAAAAAAgB63By1346DnIX7ww4OWu/Cm5y6fXz83OfRnkQQlWu7ZWtPb8o2f349a/ZfbATK8llN2in/e9ftXqz+Xj9OcnWhvWY4cu0ZvexHvb7m2R6kfk01JHrD2pmPaJpe6NKXlkzwjdX1q3R6+17X1igFoWdQyvCgFoOWL3mBS62UDiGJjuaFNanjRE0BJKqApAbTqGd5YCH4gu7dHar3NAvDDx8Zrdo7fBT6Emq9Hy06dHsDo4CYVQDT6OZ0SgB/a8wG0DO/VBDESwpQApMnYXO1/vVbc1t7IGlOaM77JWYOviWFsuRYAAAAAAAAAAAAAAAD2bVnuGjwwxoD1eOQAAAAASUVORK5CYII=',
  'tree-snow2c.png': 'iVBORw0KGgoAAAANSUhEUgAAAEAAAABICAYAAABGOvOzAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAFTSURBVHhe7deBTcMwEIXhlFHaFWAUGJKOAivAKqUX+aqra9/ZTopC+T8JtYls5+7ZATEBAAAAAAAAAAAAAAAAAAA8ql36/DNOZ+mra3eWvroWB/D+8TUX9PZyuFuY+ozX5/183csL4yl9hrQIJdf5vZzslkiXwzTc4+f3fN0rlTFLty7CXStNsrSo0gnQua3HsYUNfY0TUS0salzVArDz1wxA1U5fayha001hvY0Lb/eFF4CO0/XyBry5VvQ6Wrbeq8Vt0TX5exg1L+NLY0T+PBlb28HWIHrdLCpJ2iLyhlVPU1FIQp/TcoTXDKO6UH6kag1bS5sXve/wUqslmTclSgHUxuWiIDYTQKkh0br7ojQ2+i2/iQC85kXr8S+Ns0Zex1bDC400L3ReNO63DD/c+7vrNSUBbKV50fy/QESa0Z90q0ib/9e80wMAAAAAAO5smn4Atf7vqKfLK8IAAAAASUVORK5CYII=',
  'tree-snow3a.png': 'iVBORw0KGgoAAAANSUhEUgAAAEAAAABICAYAAABGOvOzAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAFJSURBVHhe7dcBTgIxEIXh4lHgCnoUPSQeBa+gV9F9pGMmZLpL2O6UwP8lhLqV0nnLVNyVgY6n7986LB9vh6F7SafijcY+jIfni/dGhPBSn+/CiDZID8Du8ufXz/lh/PhpPF3v36PNe87f4Wt63H4/6zzY5E180e+v+zqa3mxSh0Wnvp6ja2JnwtZBrF486mFftGkVamw+mmsdkD3CWbWAio+KjSwFIL7QuXV7fjpu/jN4bfHarC9+jl9Pr4vufM/iZdX3gNYmzdxcS9adNzcvFPV+JNpsqwU8H55C0c89Cx9KASxRwHrYuL60u/SvwiqoDv8ttYo+AeckJvVSN8P/GbLiWyHoup/rHUJqT9nmW8XaAdial97nQGoAl71sxUQ9nnXgpQcQFdYKJkNqAHN8CJkBAAAAAAAAAAAAAAAAAAAAAAAAAA+llD+QUQmrzOR8ZgAAAABJRU5ErkJggg==',
  'tree-snow3b.png': 'iVBORw0KGgoAAAANSUhEUgAAAEAAAABICAYAAABGOvOzAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAE6SURBVHhe7dSBUcMwDIXhlFHKCjAKHRJGgRVglYJyEqeKWJFTmsDl/+64hMSxrWe7AwAAAAAAAAAAwBLPr+9no4/2wxdv9NWfdtDrYlK4XJ8ejuP/0eGL3l7NQv3NPhd3NFd41Jq0FFUpSNq9vH38GE+eZU6P92nfXQFY0aJauBcLlaL09uKdfx5ZwdXxrf1cECkpfOqMR612PjhPX4/00bfqeD206wvNVPykK2nLCvpv5hKfmpCslv+uOgd/DKbaZbsgnWScgB9I2GB++1a0VkNkIXhZoVNaC9I18WtJMdlKejGIqBWMl31vVgvAr7qtVCWM3t3Va/UdoLcjH0AWyi1DWDUALx4Hv+VjUJWt/O9IkfJnYtFrudPrpuZ+8G5pswCsYDv7u7XV1gcAAAAAAAAAAAAAAHsxDJ8ZwlaaDqIWVQAAAABJRU5ErkJggq5CYII=',
  'tree-snow3c.png': 'iVBORw0KGgoAAAANSUhEUgAAAEAAAABICAYAAABGOvOzAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAGnSURBVHhe7dPtUcNADEVRpxVoAUqBIqEUaAFaCVHGyghZu9oPO8Mw9/zBSfBa7+16AQAAAAAAAAAAAAAAAAAAwD91Wv+m3j6+zuvl1cvTw3oVO12sl3d1vnj//F4/Lcvr82N1juqPGjoLG7lnARJ6vdzQMkpFbL60Oz0SXO1dgA3p164VoEpFXD/07LQu5P+359iNkBmj+exzWzfMlnErILu59CD7vSiFtydL6Totp8XfX5tXZmopQ5776wTMiIK3HE3lixQSwpdTK1LpWllJtxOgsiJaj3ZPcBGFVxrCF6GymUvliE0Bs7LgpaC1If1vo0VYdiN3KSAKLiF0+JYd9kollAoYNb2YNB+F0AJ8eGm/dI+qFaZaX8fM8CJ65HyQaHg/bO1VycJHxc2ciu4bazvuRbtkw+s9up5fQ7634Uqll7QU01VANEBrcFUqIAtv9RSRlTBUQCR7J6PgERsqG97OUyujtk5XASNscFELr3pKmHXY4i077k+NP2F+V48o45ACNLwPnr0mKnrVWu/ttfuifviZwXWto8IfJtpBAAAAAH/IsvwAdQAQc7ntbjcAAAAASUVORK5CYII=',
});

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
PlexiOS.registerJavaScript('app', 'io.plexi.tools.skiflea', APP_MAIN);
})();
