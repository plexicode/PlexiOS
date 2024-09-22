let showSysPane = (() => {

  let { button, div, span } = HtmlUtil;

  let createFsButton = (os) => {

    // full screen API support is spotty. Use all the prefixes
    let getBrowserSpecificObjAttribute = (root, suffix) => {
      for (let p of ['', 'webkit', 'moz', 'ms']) {
        let name = p + suffix;
        name = name[0].toLowerCase() + name.substring(1);

        if (p === 'moz') {
          name = name.split('Fullscreen').join('FullScreen'); // Honestly, I respect them for wanting to die on this hill.
          name = name.split('mozExit').join('mozCancel');
        }

        let thing = typeof root[name] === 'function' ? (...args) => root[name](...args) : root[name];
        if (thing) return thing;
      }
      return null;
    };
    let isFs = () => !!getBrowserSpecificObjAttribute(document, 'FullscreenElement');
    let updateLabel = () => btn.clear().set({ html: isFs() ? "&#8999;&nbsp;Exit" : "&#9974;&nbsp;Enable" });

    let btn = button(
      { background: 'transparent', padding: 1, color: '#fff' },
      ev => {
        ev.stopPropagation();
        if (isFs()) {
          getBrowserSpecificObjAttribute(document, 'ExitFullscreen')();
        } else {
          let fn = getBrowserSpecificObjAttribute(os.Shell.getRootElement(), 'RequestFullscreen');
          fn();
        }
        setTimeout(updateLabel, 150);
      },
    );
    updateLabel();
    return btn;
  };

  return async os => {
    let { DockButton, Calendar } = await HtmlUtil.loadComponents('DockButton', 'Calendar');

    let { percent, isPluggedIn } = await os.PowerManager.getProperties();

    let settingsApp = await os.FsRoot.getExecInfo('/system/tools/settings');

    let root = div(
      { position: 'absolute', size: [300, 400], fontSize: 8 },
      div(
        { absMargin: 10, bottom: 110 },
        os.Themes.buildPanelBackground().set(
          div(
            { absMargin: 10 },
            Calendar({ year: 2023, month: 11, day: 29 })
          )
        )
      ),
      div(
        { position: 'absolute', left: 10, height: 90, bottom: 10, right: 10 },
        os.Themes.buildPanelBackground().set(
          div({ westDock: 70 },
            div({ northDock: 15, textAlign: 'center' }, span({ position: 'relative', top: 4 }, "Battery")),
            div({ southStretchDock: 15 },
              div(
                { position: 'absolute', left: 8, top: 6, right: 8, bottom: 6, textAlign: 'center' },
                os.Shell.Taskbar.renderBatteryImage(HtmlUtil.canvas(), false, true, percent).set({ size: 32, marginBottom: 2 }),
                div({ bold: true, fontSize: 10 }, percent + '%'),
                div(
                  { fontSize: 7 },
                  isPluggedIn
                    ? (percent === 100 ? " (Charged)" : " (Charging)")
                    : ""),
              )
            )
          ),

          div({ eastStretchDock: 70 },
            div(
              { northDock: 47 },
              div({ textAlign: 'center', height: 14 }, span({ position: 'relative', top: 4 }, "Taskbar Dock")),
              div({ height: 30, position: 'relative' }, DockButton({ os, fullSize: true }))
            ),

            div(
              { southStretchDock: 52 },
              div(
                { westStretchDock: 30 },
                span({ marginLeft: 4 }, "Full Screen"), ' ',
                createFsButton(os)
              ),
              div(
                { eastDock: 30 },
                settingsApp.isValid
                  ? button(
                    () => { os.ExecutionEngine.launchFile('/system/tools/settings'); os.Shell.clearModal() },
                    { title: "Settings", padding: 2, background: 'transparent' },
                    Util.copyImage(settingsApp.icon).set({ width: 16, height: 16 }))
                  : null
              )
            ),
          ),
        )
      )
    );

    let tb = os.Themes.getTaskbarParams();
    let pos;
    switch (tb.dock[0]) {
      case 'N': pos = { right: 0, top: tb.thickness }; break;
      case 'W': pos = { left: tb.thickness, bottom: 0 }; break;
      case 'E': pos = { bottom: 0, right: tb.thickness }; break;
      default: pos = { bottom: tb.thickness, right: 0 }; break;
    }

    os.Shell.setModal(root.set(pos));
  };

})();
