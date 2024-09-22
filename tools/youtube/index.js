const TITLE = "YouTube";
const { div } = HtmlUtil;

let createAppContext = (host, winData) => {
  let ctx = {
    host,
    closeHandler: winData.closeHandler,
    setTitle: winData.setTitle,
    currentFilePath: null,
    currentProps: null,
    currentError: 'NO_VIDEO',
  };
  return ctx;
};

let menuBuilder = (id, ctx, os) => {
  let { createMenu, createMenuItem, createMenuSep, createCommand } = os.Shell.MenuBuilder;
  switch (id) {
    case '': return createMenu([
      createMenuItem('file', "_File"),
    ]);

    case 'file': return createMenu([
      createMenuItem('openfile', "O_pen File"),
      createMenuItem('openurl', "Open _Url"),
      createMenuItem('saveas', "Save URL as .yt File"),
      createMenuSep(),
      createMenuItem('exit', "E_xit"),
    ]);

    case 'file:openfile': return createCommand(() => console.log("TODO"));
    case 'file:openurl': return createCommand(() => console.log("TODO"));
    case 'file:saveas': return createCommand(() => console.log("TODO"));
    case 'file:exit': return createCommand(() => ctx.closeHandler());
  }
};

let refreshVideoSurface = (ctx) => {
  let { host, currentProps, currentError } = ctx;

  host.clear();
  if (!currentProps || currentError) {
    host.set(div(
      { backgroundColor: '#444', color: '#fff', fullSize: true },
      div({ position: 'absolute', top: '40%', textAlign: 'center' }, currentError),
    ));
    return;
  }
  host.innerHTML = [
    '<iframe',
    ' style="position: absolute; width: 100%; height: 100%;"',
    ' src="https://www.',
    'youtube',
    currentProps.anon ? '-nocookie' : '',
    '.com/embed/',
    currentProps.id,
    '?',
    [
      currentProps.startTime ? 'start=' + currentProps.startTime : '',
      'autoplay=1',
    ].filter(Util.identity).join('&amp;'),
    '"',
    ' frameborder="0"',
    ' allow="', [
      // 'accelerometer',
      'autoplay',
      'clipboard-write',
      'encrypted-media',
      // 'gyroscope',
      // 'picture-in-picture',
      // 'web-share',
    ].join('; '),
    '"',
    // ' allowfullscreen',
    '></iframe>',
  ].join('');
};

let loadFile = async (ctx, fs, path) => {
  let text = await fs.fileReadText(path);
  let props = null;
  if (text.ok) props = Util.tryParseJson(text.text);
  let name = fs.getAbsolutePath(path).split('/').pop();
  if (name.toLowerCase().endsWith('.yt')) name = name.substring(0, name.length - 3);

  if (!props || !props.id) {
    ctx.currentProps = null;
    ctx.currentError = 'INVALID_YT_FILE';
  } else {
    ctx.currentProps = props;
    ctx.currentError = null;
  }

  ctx.setTitle("YouTube: " + name);

  refreshVideoSurface(ctx);
};

const APP_MAIN = async (os, procInfo, args) => {
  const { pid } = procInfo;

  let onClose = null;
  let promise = new Promise(res => { onClose = res; });

  let fs = os.FileSystem(procInfo.cwd);

  let ctx;

  os.Shell.showWindow(pid, {
    title: TITLE,
    innerWidth: 500,
    innerHeight: 380,
    destroyProcessUponClose: true,
    onClosed: () => onClose(true),
    menuBuilder: ids => menuBuilder(ids.join(':'), ctx, os),
    onInit: (contentHost, winData) => {

      let content = div({
        fullSize: true,
        backgroundColor: '#fff',
        color: '#000',
        overflow: 'hidden',
      });
      ctx = createAppContext(content, winData);
      refreshVideoSurface(ctx);
      contentHost.append(content);

      if (args[0]) {
        loadFile(ctx, fs, args[0]);
      } else {
        refreshVideoSurface(ctx);
      }
    },
    onShown: () => {
    },
  });
  return promise;
};
