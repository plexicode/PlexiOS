const APP_MAIN = async (os, procInfo, args) => {
  const { div, span } = HtmlUtil;

  // pre-emptively ensure the commands are loaded to potentially reduce the initial delay.
  PlexiOS.loadJavaScript('app', 'io.plexi.terminal.ls');

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

  os.Shell.showWindow(procInfo.pid, {
    title: "Terminal",
    width: 400,
    height: 300,
    onKey,
    destroyProcessUponClose: true,
    onFocused: () => fakeInput.focus(),
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

      let scrollBottom = () => { main.scrollTop = main.scrollHeight; };

      let insertLine = (text, color) => {
        lines.append(div(text, { color }));
        scrollBottom();
      };
      session.out(line => { insertLine(line, '#fff'); });
      session.err(line => { insertLine(line, '#f00'); });

      let main = div(
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
        div({ position: 'absolute', left: 0, bottom: 0 }, fakeInput),
        bottomHost,
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

      main.addEventListener('pointerdown', () => {
        fakeInput.focus();
      });

      contentHost.append(main);
    },
  });


  return new Promise(() => {}); // never ends
};
