(async () => {
const { Util, HtmlUtil } = PlexiOS;
const APP_RAW_IMAGE_DATA = await Util.loadImageB64Lookup({

  'icon.png': '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',
});

const APP_MAIN = async (os, procInfo, args) => {
  const { div, span } = HtmlUtil;

  // pre-emptively ensure the commands are loaded to potentially reduce the initial delay.
  PlexiOS.HtmlUtil.loadComponent('TerminalCommands');

  let cwd = args[0] || procInfo.cwd;
  let session = await PlexiOS.terminalSession(os, cwd, procInfo.env);

  let replayBuffer = null;
  let history = [];
  let preStdinBuffer = [];
  let onTextUpdated;
  let modifiers = { ctrl: false, cmd: false, shift: false, alt: false };
  let actualToModifierId = { control: 'ctrl', meta: 'cmd' };
  let onKey = (e, isDown) => {

    let cmd = 'KEY';
    let k = e.key.toLowerCase();
    let isFKey = false;

    if (e.ctrlKey && (k === 'c' || k === 'd' || k === 'z')) {
      // don't exempt Ctrl + C, D, or Z from the handler.
    } else if (isFKey || e.altKey || e.ctrlKey || e.metaKey) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    switch (k) {
      case 'enter': cmd = 'ENTER'; break;
      case 'arrowleft': cmd = 'LEFT'; break;
      case 'arrowright': cmd = 'RIGHT'; break;
      case 'arrowup': cmd = 'UP'; break;
      case 'arrowdown': cmd = 'DOWN'; break;
      case 'backspace': cmd = 'BACKSPACE'; break;
      case 'tab': cmd = 'TAB'; break;
      case 'escape': cmd = 'ESCAPE'; break;

      case 'control':
      case 'shift':
      case 'meta':
      case 'alt':
        modifiers[actualToModifierId[k] || k] = isDown;
        return;

      default:
        if (k.startsWith('f') && !isNaN(parseInt(k.substring(1)))) {
          cmd = k.toUpperCase();
          isFKey = true;
        }
        break;
    }

    if (cmd === 'KEY' && e.key.length !== 1) {
      console.log(e.key, e);
      return;
    }

    if (cmd === 'KEY' && modifiers.ctrl) {
      cmd = 'CTRL+' + k.toUpperCase();
    }

    if (cmd !== 'KEY' && !isFKey) {
      e.preventDefault();
    }
    if (!isDown) return;

    onTextUpdated(e.key, cmd);
  };
  let fakeInput;
  let mainDiv;

  os.Shell.showWindow(procInfo.pid, {
    title: "Terminal",
    width: 400,
    height: 300,
    onKey,
    destroyProcessUponClose: true,
    onFocusing: () => fakeInput.focus(),
    onInit: (contentHost) => {
      let top = div(os.getName() + " v0.1 Terminal");
      let lines = div();
      let bottom = div();
      let bottomHost = div(bottom, { minHeight: '40px', position: 'relative' });
      let entryForm = null;
      fakeInput = HtmlUtil.inputText({ size: 1, opacity: 0, position: 'absolute', left: 0, bottom: 0 });
      fakeInput.addEventListener('keydown', ev => { onKey(ev, true); fakeInput.value = ''; });
      fakeInput.addEventListener('keyup', ev => { onKey(ev, false); fakeInput.value = ''; });
      let resetBottom = () => {
        entryForm = span(preStdinBuffer.join(''));
        let wd = session.getCwd().split('/').pop() || '/';
        let promptPrefix = session.isIdle() ? span(wd + ' $ ', { color: '#888' }) : span();
        bottom = div(promptPrefix, entryForm);
        bottomHost.clear().set(bottom);
        scrollBottom();
      };

      let scrollBottom = () => { mainDiv.scrollTop = mainDiv.scrollHeight; };

      let insertLine = (text, color) => {
        lines.append(div(text, { color }));
        scrollBottom();
      };
      session.out(line => { insertLine(line, '#fff'); });
      session.err(line => { insertLine(line, '#f00'); });

      mainDiv = div(
        {
          fullSize: true,
          wordBreak: 'break-all',
          padding: '4px',
          overflowY: 'auto',
          overflowX: 'hidden',
          color: '#fff',
          fontFamily: '"Consolas", monospace',
          backgroundColor: '#000',
          whiteSpace: 'pre-wrap',
        },
        top,
        lines,
        bottomHost,
      );

      let outer = div(
        {
          fullSize: true,
          backgroundColor: '#0f0',
        },
        div({ position: 'absolute', left: 0, bottom: 0 }, fakeInput),
        mainDiv,
      );

      resetBottom();
      onTextUpdated = async (text, special) => {
        let refresh = false;
        switch (special || 'KEY') {
          case 'NOOP':
            refresh = true;
            break;
          case 'TAB':
            {
              let parts = preStdinBuffer.join('').split(' ').map(t => t.trim()).filter(Util.identity);
              if (parts.length) {
                let part = parts.pop();
                let files = await os.FileSystem(session.getCwd()).legacyList('.');
                let matches = files.filter(t => t.startsWith(part));
                if (matches.length) {
                  let longestCommonStart = matches.length === 1
                    ? matches[0]
                    : matches.reduce((a, b) => {
                      let len = Math.min(a.length, b.length);
                      a = a.substring(0, len);
                      b = b.substring(0, len);
                      while (a !== b) {
                        a = a.substring(0, a.length - 1);
                        b = b.substring(0, b.length - 1);
                      }
                      return a;
                    });
                  preStdinBuffer.push(...longestCommonStart.substring(part.length).split(""));
                  refresh = true;
                }
              }
            }
            break;
          case 'ENTER':
          case 'CTRL+C':
            let isAbort = special === 'CTRL+C';
            lines.append(bottom);
            let send = preStdinBuffer.join('');
            if (!isAbort) {
              if (history.length === 0 || history[history.length - 1] !== send) {
                history.push(send);
                if (replayBuffer) replayBuffer = null;
              }
            }
            preStdinBuffer = [];
            if (isAbort) {
              await session.killAllProcs();
              resetBottom();
            } else {
              await session.in(send + '\n');
              resetBottom();
              session.awaitProcs().then(() => resetBottom());
            }

            break;
          case 'KEY':
            preStdinBuffer.push(text);
            refresh = true;
            break;
          case 'BACKSPACE':
            if (preStdinBuffer.length) {
              preStdinBuffer.pop();
              refresh = true;
            }
            break;
          case 'UP':
            if (!replayBuffer && history.length) {
              replayBuffer = { index: history.length };
            }
            if (replayBuffer) {
              replayBuffer.index = Math.max(0, replayBuffer.index - 1);
              preStdinBuffer = history[replayBuffer.index].split("");
              refresh = true;
            }
            break;
          case 'DOWN':
            if (replayBuffer) {
              replayBuffer.index = Math.min(history.length - 1, replayBuffer.index + 1);
              preStdinBuffer = history[replayBuffer.index].split("");
              refresh = true;
            }
            break;
          default:
            break;
        }
        if (refresh) {
          entryForm.innerText = preStdinBuffer.join("");
          scrollBottom();
        }
      };

      mainDiv.addEventListener('pointerdown', () => {
        fakeInput.focus();
      });

      contentHost.append(outer);
    },
  });


  return new Promise(() => {}); // never ends
};
PlexiOS.registerJavaScript('app', 'io.plexi.tools.terminal', APP_MAIN);
})();
