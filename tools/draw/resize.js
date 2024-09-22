let showResizeMenu = async ctx => {

  let { ItemList } = HtmlUtil.Components;

  let uu = ctx.doc.previewUndoUnit;
  let hasSelection = uu && uu.isFloat;
  let floatData = hasSelection ? uu.getFloatData() : {};

  let anchor = anchorControl();

  let docSize = { w: ctx.doc.image.width, h: ctx.doc.image.height };
  let selSize = hasSelection ? { w: floatData.img.width, h: floatData.img.height } : null;
  let newSize = { ...(hasSelection ? selSize : docSize) };

  let errPanel = div({
    color: '#400',
    backgroundColor: '#fcd',
    opacity: 0,
    padding: 3,
    textAlign: 'center',
    border: '1px solid #f00',
    borderRadius: 3,
    margin: 3,
    html: '&nbsp;',
  });
  let toValidNum = str => {
    str = `${str}`.trim();
    let num = Math.max(1, Math.min(65535, Util.ensurePositiveInteger(parseInt(str))));
    if (num + '' !== str) return false;
    return num;
  };

  let refresh = () => {
    let width = newSize.w;
    let height = newSize.h;
    let err = '';
    if (width === false && height === false) {
      err = "Invalid width and height.";
    } else if (width === false) {
      err = "Invalid width.";
    } else if (height === false) {
      err = "Invalid height.";
    }

    errPanel
      .clear()
      .set(err, { opacity: err ? 1 : 0 })
      .set(span({ html: '&nbsp;' }));
    if (err) {
      // TODO: disable the OK button
    }

    anchor
      .setXInvert(newSize.w < docSize.w)
      .setYInvert(newSize.h < docSize.h)
      .refresh();

    return !err;
  };

  let toggleAnchorEnabled = v => {
    anchor.set({
      opacity: v ? 1 : 0.3,
      userSelect: v,
      pointerEvents: v ? 'auto' : 'none',
    });
  };
  toggleAnchorEnabled(false);

  let items = [
    { id: 'doc-crop', name: "Crop/extend document", alg: "By anchor..." },
    { id: 'doc-scale-nn', name: "Scale document", alg: "Nearest-neighbor (pixelated)",  },
    { id: 'doc-scale-bl', name: "Scale document", alg: "Bilinear (blended)" },
    ...(!hasSelection ? [] : [
      { id: 'selection-nn', name: "Scale selection", alg: "Nearest-neighbor (pixelated)" },
      { id: 'selection-bl', name: "Scale selection", alg: "Bilinear (blended)" },
    ])
  ];
  let selectedMode = hasSelection ? 'selection-bl' : 'doc-scale-bl';
  let modePicker = ItemList({
    getId: v => v.id,
    getItems: () => [...items],
    onSelectionChanged: id => {
      selectedMode = id;
      toggleAnchorEnabled(id === 'doc-crop');
    },
    renderItem: item => div(
      { padding: 3, },
      span({ bold: true }, item.name), ' ',
      div({ opacity: 0.7 }, item.alg),
    ),
    selectedId: selectedMode,
    border: '1px solid #888',
    fontSize: 8,
    textAlign: 'left',
    backgroundColor: '#fff',
  });

  let widthEditor = inputText({ width: 40, value: `${newSize.w}` }, v => { newSize.w = toValidNum(v); refresh(); });
  let heightEditor = inputText({ width: 40, value: `${newSize.h}` }, v => { newSize.h = toValidNum(v); refresh(); });

  // TODO: onShown for dialogs or default selected element option.
  setTimeout(
    () => { widthEditor.focus(); widthEditor.select(); },
    50);

  let ui = [
    div(
      { fontSize: 9, position: 'relative', textAlign: 'left' },
      div(
        { marginBottom: 5 },
        div("Document size: ", span({ bold: true }, `${docSize.w}`, span({ html: ' &times; ' }), `${docSize.h}`)),
        hasSelection ? div("Selection size: ", span({ bold: true }, `${selSize.w}`, span({ html: ' &times; ' }), `${selSize.h}`)) : null,
      ),
      div(
        "New size: ",
        widthEditor,
        span({ html: ' &times; ' }),
        heightEditor,
      ),
      errPanel,
    ),
    div(
      { position: 'relative', height: 180 },
      div(
        { westStretchDock: 150 },
        div("Resize Mode:"),
        modePicker,
      ),
      div(
        { eastDock: 150, textAlign: 'center' },
        div({ paddingBottom: 8 }, "Anchor direction:"),
        div({ position: 'relative', width: 200, height: 150, left: 15 }, anchor),
      ),
    )
  ];

  let result = await ctx.os.Shell.DialogFactory.showOkCancelToBool(ctx.pid, "Draw: Resize", ui, { height: 330 });
  if (result) {

    let isOkay = refresh();
    if (!isOkay) return ctx.os.Shell.DialogFactory.showOkCancelToBool(ctx.pid, "Resize Error", "Invalid size");

    let docSizeSame = docSize.w === newSize.w && docSize.h === newSize.h;
    switch (selectedMode) {
      case 'doc-crop':
        {
          if (docSizeSame) return;
          if (uu) commitLingeringUndoUnit(ctx);

          let newImg = newCanvas(newSize.w, newSize.h);
          let oldImg = ctx.doc.image;

          let dir = anchor.getAnchorDirection().id;

          let x;
          if (dir.endsWith('W')) x = 0;
          else if (dir.endsWith('E')) x = newImg.width - oldImg.width;
          else x = Math.floor((newImg.width - oldImg.width) / 2);

          let y;
          if (dir.startsWith('N')) y = 0;
          else if (dir.startsWith('S')) y = newImg.height - oldImg.height;
          else y = Math.floor((newImg.height - oldImg.height) / 2);

          newImg.clear().blit(oldImg, x, y);

          ctx.doc.previewUndoUnit = createUndoUnit(ctx, 'FULL_TRANSPLANT', { img: newImg });
          commitLingeringUndoUnit(ctx);
          render(ctx);
        }
        break;

      case 'doc-scale-nn':
      case 'doc-scale-bl':
        {
          if (docSizeSame) return;
          if (uu) commitLingeringUndoUnit(ctx);

          let newImg = newCanvas(newSize.w, newSize.h);
          let oldImg = ctx.doc.image;

          let drawCtx = newImg.canvas.getContext('2d');
          if (selectedMode === 'doc-scale-nn') {
            drawCtx.imageSmoothingEnabled = false;
          }

          drawCtx.drawImage(oldImg.canvas, 0, 0, oldImg.width, oldImg.height, 0, 0, newSize.w, newSize.h);

          ctx.doc.previewUndoUnit = createUndoUnit(ctx, 'FULL_TRANSPLANT', { img: newImg });
          commitLingeringUndoUnit(ctx);
          render(ctx);
        }
        break;

      case 'selection-nn':
      case 'selection-bl':
        {
          if (selSize.w === newSize.w && selSize.h === newSize.h) return;
          if (!uu || !uu.isFloat) return;
          let { img } = uu.getFloatData();
          if (!img) return;

          let newImg = newCanvas(newSize.w, newSize.h);
          let drawCtx = newImg.canvas.getContext('2d');
          if (selectedMode === 'selection-nn') {
            drawCtx.imageSmoothingEnabled = false;
          }
          drawCtx.drawImage(img.canvas, 0, 0, img.width, img.height, 0, 0, newSize.w, newSize.h);

          uu.swapOutFloatImage(newImg);
          render(ctx);
        }
        break;
    }
  }
};
