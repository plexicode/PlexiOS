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
