let createLayout = (ctx, root) => {
  let { button, div } = HtmlUtil;

  let ui = {
    viewerArea: div(),
    navPanel: div(),
    optionPanel: div(),
    buttons: {
      navLeft: button({ html: '&larr;' }, () => cycleImage(ctx, -1)),
      navRight: button({ html: '&rarr;' }, () => cycleImage(ctx, 1)),
      actualSize: button('act sz'),
      fitSize: button('fit to scr'),
      zoomIn: button('zoom in'),
      zoomOut: button('zoom out'),
      rotateCCW: button({ html: '&#8630;' }, () => rotateImage(ctx, 1).then(() => refreshImage(ctx))),
      rotateCW: button({ html: '&#8631;' }, () => rotateImage(ctx).then(() => refreshImage(ctx))),
      crop: button('crop'),
      effects: button('effects'),
    },
  };

  root.set(
    { fullSize: true },
    ui.viewerArea.set({ northStretchDock: 64 }),
    div(
      { southDock: 64, backgroundColor: '#000', borderTop: '1px solid #444' },
      ui.navPanel.set(
        { westDock: 100 },
        ui.buttons.navLeft, ui.buttons.navRight,
      ),
      ui.optionPanel.set(
        { eastStretchDock: 100, textAlign: 'right' },
        //ui.buttons.actualSize,
        //ui.buttons.fitSize,
        //ui.buttons.zoomIn,
        //ui.buttons.zoomOut,
        ui.buttons.rotateCCW,
        ui.buttons.rotateCW,
        //ui.buttons.crop,
        //ui.buttons.effects,
      ),
    ),
  );

  return ui;
};
