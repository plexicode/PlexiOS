(async () => {
const { Util, HtmlUtil } = PlexiOS;
const APP_RAW_IMAGE_DATA = await Util.loadImageB64Lookup({

  'icon.png': 'iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAATQSURBVHhe7ZpdSFRpGMf/o027OmHSlItjasayiBUoq0G7Y2ZESjddbFREoN4seRUhtOxSiOvFbheBuLC3IgmRUBEMiEo10bKRQcoSg0Q4guBnCTJjWllnn+ecd2xdHJtzzjvnzMT5wd/3Sz1n/vN+Pe85cHBwcHBwcHBIUVwiTRp6LrCJ9B2pnFRM2k76ivQFSTZ8X3tIX5J+If1BSgp6DPid9JOWBTIzM+H1epGVlSVq5FJSUoJQKITZ2Vku8rV/5oyddJGUwcFBZXp6WllcXFSSTU1NjcLXFPqVZCuqAVZSVVWl+Hw+pbq6OmbCb3wjdmG5AR6PR6mvr1d7W21tbcyEP0lukhQyRJpyTE1NgT44SktLkZ2djUAggLq6Om5qJg2RyrhglpQ1YGJiQk0LCwvVlE3o6+tDe3s7XC4Xr0TDpB/URhOkrAG9vb1qOj8/j/HxcVWjo6Pw+/1oaWnhps2kHzljFZbOAQMDA0p+fn5s3MfTe5Ip9OwD2IBGujetZAGRSAQ9PT2YmZlRy263GwUFBcjLy0NnZyf6+/u5Oum7xRiWrwIb0dDQEOsFptAzByzwD7Ez+2zQY4A6LU9OTqqFzwU94+c8qWN4eBjl5bwKxeE9zUtDtEw/fAi8fi0qN8DjAXbsoLCH4p49FP8UFQFbt4rG+DQ2NqK7u5uzls0BbIBCBohRuA6dnYqybRtPk8bldivK8eOKEgyKf7o+TU1N9OvqHMDLoWHk7QPu3QMuXOCFW1QY5N074M4d4NAh4OhR4MUL0bAWXg0E+SI1hBwDolHg7Fmt+8tkcBCoqABu3hQVH+FwXAZyDLh9mzfvoiAZNvfUKSAUEhVykWMA7dGTCvcs2vgkAzkGPH4sMnHweoEnT4CTJ0WFAW7dAlZWREEe5g2gkBVjY6IQh1evQHEtcOMGcPcusGuXaNDB3Jw2HCRj3gC+sUSgSE7l8GFtPF+8SCu4ZUt4XOQMgUT477fHB6lXrgDBIAf8otIerDPg/3z4ABw8CDx9CmznE3Z7sM+ADLo0b5VPnABevhSV1mNvDzh3DnjwQFTYg3kDIhGR0cHysrYkXrsmKuzDvAF6t7/c7Y8dW3d7awfWDoGFBeDIEeD+fVGhA977c+gsGfMG7NwpMp/g6lXA7wcePRIVOtm3jw8FRUEe5g3gJezAAVHYgEAAePZMFAzAoXYSkDMEOjqS8u2sUlYGnDkjCnKRY8D+/cDly6IgGe5hHENs4tcT5CNvErx0yVy0tx61tVqkuXevqJCPHgPUBX8uXvDDgc3169ra3tys3Tzv83nHp4fcXOD0aW2y5GO23btFg/1QGAelq6tLHEsmSCSiKOFw4nrzRvzhxrS2tsYORfl1HcPo+XqMHfht2aLF/4lqs6lDXt3ImwMsJuPj0DI1O6atAUX8AEXD1CSRtgZU8HG5xrciNUTaGlBcvDr3pcCDERvIpeUyJyeHs1+rFQZJGwOi0ejqqzKsoaEh+Hw+bvpG/QWDuESaCDWkYFtbGyorKzEyMoKxsTH1bc5wOIylpSX1ra6VJJzdfwKOsChUNIYeA74n/aVl1xAmPSfxmxOSHw6uYZk0rWVVeGfKDyT+Jhl+a0OPAbxD4YiHb4Q/9D8k/uBvSQ4ODg4ODg4ODukF8C8zAFA0p5CfEAAAAABJRU5ErkJggg==',
});

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
PlexiOS.registerJavaScript('app', 'io.plexi.tools.youtube', APP_MAIN);
})();
