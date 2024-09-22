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
