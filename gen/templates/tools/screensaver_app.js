(async () => {
const { Util, HtmlUtil } = PlexiOS;
const APP_RAW_IMAGE_DATA = await Util.loadImageB64Lookup({

  'icon.png': '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',
});

const TITLE = "Screen Saver";

let update = async (scrSv, state, bg, width, height) => {
  width = Math.floor(width);
  height = Math.floor(height);
  let g = bg.getContext('2d');
  if (bg.width !== width || bg.height !== height) {
    bg.width = width;
    bg.height = height;
    g = bg.getContext('2d');
    g.fillStyle = '#000';
    g.fillRect(0, 0, width, height);
  }

  await scrSv.render(state, bg, g, width, height);
};

const APP_MAIN = async (os, procInfo, args) => {
  const { canvas, div } = HtmlUtil;
  const { pid } = procInfo;

  let bg = canvas();

  let scrPath = Util.ensureString(args[0] || '');
  if (!scrPath) {
    await os.Shell.DialogFactory.showOkCancelToBool(pid, "Screen Saver", "Application must be launched with a path to a screensaver");
    return;
  }

  let fs = os.FileSystem(procInfo.cwd);
  let scrInfo = await fs.getVirtualJsInfo(scrPath);
  if (!scrInfo.isValid || scrInfo.category !== 'screensaver') {
    await os.Shell.DialogFactory.showOkCancelToBool(pid, "Screen Saver", "Invalid screensaver path.");
    return;
  }
  let scrSv = scrInfo.data;

  let init = scrSv.init || (() => {});
  let state = await Promise.resolve(init() || {});

  let onClose = null;
  let promise = new Promise(res => { onClose = res; });
  os.Shell.showWindow(pid, {
    title: TITLE,
    innerWidth: 500,
    innerHeight: 380,
    isFullScreen: true,
    destroyProcessUponClose: true,
    onClosed: () => onClose(true),
    onResize: (w, h) => {

    },
    onInit: (contentHost, wd) => {
      let content = div(
        {
          fullSize: true,
          backgroundColor: '#000',
          color: '#000',
          overflow: 'hidden',
        },
        bg.set({ fullSize: true, cursor: 'none' })
      );

      os.Shell.clearModal();

      // Give a quarter-second grace period to the event interceptors before killing the screensaver.
      let startTime = Util.getTime();
      ['pointerdown', 'pointermove'].forEach(e => content.addEventListener(e, () => {
        if (Util.getTime() - startTime > .25) {
          wd.closeHandler();
        }
      }));

      setTimeout(() => os.Shell.registerProcIdAsScreenSaver(pid), 250);

      os.ProcessManager.setInterval(pid, async () => {
        let r = os.Shell.getSize(); // Shell.getSize() will tickle full screen app dimensions, which doesn't happen automatically.
        await update(scrSv, state, bg, r.width, r.height);
      }, 33);

      contentHost.append(content);
    },
  });
  return promise;
};
PlexiOS.registerJavaScript('app', 'io.plexi.tools.screensaver', APP_MAIN);
})();
