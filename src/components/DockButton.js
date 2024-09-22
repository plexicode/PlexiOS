(() => {
  let regProps = ['os'];
  PlexiOS.HtmlUtil.registerComponent('DockButton', (...args) => {

    let { HtmlUtil, Util } = PlexiOS;
    let { button, div, span } = HtmlUtil;
    let { htmlArgs, props } = Util.argInterceptor(args, regProps);
    let { os } = props;

    let inner = div({ position: 'absolute', left: 2, right: 2, top: 4, bottom: 4 });
    let outer = div(htmlArgs, inner);

    let options = ['WEST', 'SOUTH', 'NORTH', 'EAST'];

    let clock = Util.range(12).map(n => {
      let rots = n / 12 - 0.25;
      let theta = Math.PI * 2 * rots;
      return [
        Math.cos(theta) * 0.25 + 0.5,
        Math.sin(theta) * 0.25 + 0.5,
      ];
    })

    let builders = {
      NORTH: gfx => gfx.rect(0, 0, 1, 0.2).triangle(...clock[0], ...clock[4], ...clock[8]),
      SOUTH: gfx => gfx.rect(0, 0.8, 1, 0.2).triangle(...clock[6], ...clock[10], ...clock[2]),
      EAST: gfx => gfx.rect(0.8, 0, 0.2, 1).triangle(...clock[3], ...clock[7], ...clock[11]),
      WEST: gfx => gfx.rect(0, 0, 0.2, 1).triangle(...clock[9], ...clock[1], ...clock[5]),
    };

    let populate = () => {
      let { dock } = os.Themes.getTaskbarParams();

      inner.clear().set(options.map((dir, i) => {
        let len = options.length;
        let per = Math.floor(100 / len);

        let wrapper = div(
          { h100: true },
          { left: (i * per) + '%', right: (len - i - 1) * per + '%' },
          button(
            { enabled: dock !== dir, padding: 0, bold: true },
            { h100: true, left: 2, right: 2 },
            async () => {
              os.Settings.set('taskbardock', dir);
              await os.Themes.setActiveTheme(os.Themes.getActiveTheme().getMetadata().id);
              populate();
            },
            os.IconStore.monochromeSymbolFactory(builders[dir], [0, 0, 0])(36, 36).set({ width: 12, height: 12 })
          )
        );
        inner.set(wrapper);
      }));
    };

    populate();

    return outer;
  });
})();
