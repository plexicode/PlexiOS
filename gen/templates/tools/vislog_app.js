(async () => {
const { Util, HtmlUtil } = PlexiOS;
const APP_RAW_IMAGE_DATA = await Util.loadImageB64Lookup({

  'icon.png': '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',
});

const TITLE = "Visual Logger";
const APP_ID = 'io.plexi.tools.vislog';

const APP_MAIN = async (os, procInfo, args) => {
  const { button, div, inputText, span } = HtmlUtil;
  const { pid } = procInfo;

  let otherProc = os.ProcessManager.getProcessesByAppId('io.plexi.tools.vislog').filter(p => p.pid !== pid)[0] || null;
  if (otherProc) {
    os.Shell.giveProcessFocus(otherProc.pid);
    return;
  }

  let italic = v => span({ italic: true, color: '#080' }, v);
  let serialize = obj => {
    if (obj === undefined || obj === true || obj === false || obj === null) return italic(`${obj}`);

    switch (typeof obj) {
      case 'number':
        if (isNaN(obj)) return italic('NaN');
        if (!isFinite(obj)) return italic((obj < 0 ? '-' : '') + 'Infinity');
        return span({ bold: true, color: '#00f' }, `${obj}`);

      case 'string':
        return obj;

      case 'function':
        return span({ color: '#840' }, "I am a function");

      case 'object':
        let data = span();

        let lbl = span({ cursor: 'pointer', bold: true, color: '#888' }, Array.isArray(obj) ? `Array (${obj.length})` : '[Object object]');
        lbl.addEventListener('click', () => {
          let items = [];
          if (Array.isArray(obj)) {
            items.push('[ ');
            for (let i = 0; i < obj.length; i++) {
              if (i > 0) items.push(' , ');
              items.push(serialize(obj[i]));
            }
            items.push(' ]');
          } else {
            items.push('{ ');
            let keys = Object.keys(obj);
            for (let i = 0; i < keys.length; i++) {
              if (i > 0) items.push(' , ');
              items.push(span({ italic: true, color: '#555', bold: true }, keys[i]));
              items.push(': ');
              items.push(serialize(obj[keys[i]]));
            }
            items.push(' }');
          }
          data.clear().set(items);
        });

        return data.set(lbl)

      default:
        return span({ color: '#f0f', backgroundColor: '#ffd' }, `${obj}`); // here be dragons
    }
  };

  await os.Shell.showWindow(pid, {
    title: TITLE,
    innerWidth: 280,
    innerHeight: 400,
    destroyProcessUponClose: true,
    onInit: (contentHost) => {

      let logList = div({ fontSize: 8, fontFamily: 'monospace' });

      let content = div({
        fullSize: true,
        backgroundColor: '#fff',
        color: '#000',
        overflow: 'hidden',
      },
        div(
          { northDock: 60 },
          button("Clear", () => logList.clear())
        ),
        div(
          { southStretchDock: 60, overflowY: 'auto', overflowX: 'hidden', },
          logList,
        ),
      );

      contentHost.append(content);

      let scrollToBottom = () => {
        logList.scrollTop = logList.scrollHeight;
      };

      let colors = {
        INFO: { color: '#000' },
        WARNING: { backgroundColor: '#ff8', color: '#330' },
        ERROR: { backgroundColor: '#fce', color: '#300' },
      };
      os.ProcessManager.addIpcListener(pid, msg => {
        if (msg.level) {
          let items = msg.isSingleItem ? [msg.data] : msg.items;
          let row = div(
            colors[Util.ensureString(msg.level).toUpperCase()] || colors.INFO,
            { borderBottom: '1px solid #ddd', padding: 2 },
            items.map(item => [serialize(item), ' '])
          );
          logList.set(row);
          scrollToBottom();
        }
      });
    },
  });
};
PlexiOS.registerJavaScript('app', 'io.plexi.tools.vislog', APP_MAIN);
})();
