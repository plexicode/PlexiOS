let toolbarIcons = {};
let initToolbarIcons = async os => {
  await Promise.all(['details', 'tiles', 'thumbs'].map(async n => {
    let icon = toolbarIcons[n];
    if (!icon) {
      let t = await os.FsRoot.fileReadImage('/system/res/files-' + n + '.png', true);
      if (t.ok) {
        icon = t.img;
      }
    }
    if (!icon) {
      icon = HtmlUtil.canvasOfSize(24, 24);
    }
    toolbarIcons[n] = Util.copyImage(icon);
  }));

  let up = os.IconStore.getIconByPurpose('FOLDER_CLOSED');
  let ctx = up.getContext('2d');
  toolbarIcons.up = up;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  let x1 = 17;
  let x3 = 45;
  let x2 = (x1 + x3) / 2;
  let y1 = 46;
  let y2 = 31;
  let y3 = y1;
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.lineTo(x3, y3);
  ctx.fill();
  toolbarIcons.up = up;
};

let getToolbarIcons = () => {
  let o = {};
  Object.keys(toolbarIcons).forEach(k => {
    o[k] = Util.copyImage(toolbarIcons[k]).set({ width: 24, height: 24 });
  });
  return o;
};

let createToolbar = (path, onViewChanged, onDirChanged, goUpCb) => {
  let { button, div, inputText, span } = HtmlUtil;

  let toolbarIcons = getToolbarIcons();
  let viewModeBtn = { display: 'inline-block', width: 32, height: 32, borderRadius: 0, padding: 2 };
  let curveLeft = { borderTopLeftRadius: 4, borderBottomLeftRadius: 4 };
  let curveRight = { borderTopRightRadius: 4, borderBottomRightRadius: 4 };

  let typedPath = path;
  let textField = inputText(
    {
      value: path,
      onEnter: () => {
        onDirChanged(typedPath);
      },
    },
    v => { typedPath = v },
  );
  ['keydown', 'keyup'].forEach(t => textField.addEventListener(t, ev => ev.stopPropagation()));

  let upBtn = button(viewModeBtn, curveLeft, curveRight, toolbarIcons.up, () => goUpCb());

  let outer = div(
    { fullSize: true },
    div(
      { eastDock: 150, fontSize: 8, bold: true },
      div(
        { padding: 4, textAlign: 'right' },
        span({ position: 'relative', top: -8 }, "View: "),
        button({ title: 'Tiles' }, viewModeBtn, curveLeft, toolbarIcons.tiles, () => onViewChanged('TILE')),
        button({ title: 'Details' }, viewModeBtn, toolbarIcons.details, () => onViewChanged('DETAILS')),
        button({ title: 'Thumbnails' }, viewModeBtn, curveRight, toolbarIcons.thumbs, () => onViewChanged('THUMBNAILS')),
      ),
    ),
    div(
      { westStretchDock: 100 },
      div(
        { fullSize: true },
        div(
          { position: 'absolute', left: 4, width: 32, top: 4, height: 32 },
          upBtn,
        ),
        textField.set({ position: 'absolute', left: 40, top: 4, bottom: 4, right: 4 }),
      )
    ),

  );

  outer.getShownPath = () => path;
  outer.refresh = () => {
    textField.value = path;
    typedPath = path;
    upBtn.disabled = path === '/';
  };
  outer.setDir = dir => {
    if (dir === '.') dir = '/';
    if (path !== dir) {
      path = dir;
      outer.refresh();
    }
  }

  outer.refresh();

  return outer;
};
