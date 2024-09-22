let createPipe = () => {
  let listener = Util.noop;
  let linesHead = null;
  let linesTail = null;
  let queuedPartial = '';
  let write = async (text) => {
    let newLines = text.split('\n');
    newLines[0] = queuedPartial + newLines[0];
    for (let i = 0; i < newLines.length - 1; i++) {
      if (!linesHead) {
        linesHead = { text: newLines[i], next: null };
        linesTail = linesHead;
      } else {
        linesTail.next = { text: newLines[i], next: null };
        linesTail = linesTail.next;
      }
    }
    queuedPartial = newLines[newLines.length - 1];

    while (linesHead) {
      let line = linesHead.text;
      linesHead = linesHead.next;
      if (!linesHead) linesTail = null;
      await Promise.resolve(listener(line));
    }
  };
  let p = Object.freeze({
    write,
    writeln: async t => write(t + '\n'),
    setListener: (onData) => { listener = onData; return p; },
  });
  return p;
};

const terminalSession = async (os, initialCwd, envVars) => {

  let resolveString = (str) => {
    str = str.substring(1, str.length - 1);
    let sb = '';
    for (let i = 0; i < str.length; i++) {
      if (str[i] === '\\') {
        sb += str[++i];
      } else {
        sb += str[i];
      }
    }
    return sb;
  };

  let tokenize = (cmd) => {
    let tokens = [];
    cmd = Util.replace(cmd, '\r\n', '\n');
    cmd = Util.replace(cmd, '\r', '\n');

    let mode = 'NORMAL';
    let whitespace = new Set(' \t\r\n'.split(''));
    let special = new Set('<>|`"()&'.split(''));
    let quoted = new Set(' \r\n|&;<>()$`\\"\''.split(''));
    let twoCharCtrl = new Set('<< >> || && <& <> >& >|'.split(' '));
    let tokenStart = 0;
    for (let i = 0; i <= cmd.length; i++) {
      let c = i === cmd.length ? ' ' : cmd[i]; // invisible space at the end
      let c2 = c + (cmd[i + 1] || '');
      switch (mode) {
        case 'NORMAL':
          if (whitespace.has(c)) {
            // do nothing
          } else if (c === '\\' && quoted.has(cmd[i + 1])) {
            mode = 'WORD';
            tokenStart = i--;
          } else if (special.has(c)) {
            if (c === '"') {
              mode = 'STRING';
              tokenStart = i;
            } else if (twoCharCtrl.has(c2)) {
              tokens.push({ type: 'CTRL', value: c2 });
              i++;
            } else {
              tokens.push({ type: 'CTRL', value: c });
            }
          } else {
            mode = 'WORD';
            tokenStart = i;
            --i;
          }
          break;

        case 'STRING':
          if (c === '"') {
            let str = cmd.substring(tokenStart, i + 1);
            tokens.push({ type: 'WORD', value: resolveString(str) });
            mode = 'NORMAL';
          } else if (c === '\\') {
            i++;
          } else {
            // do nothing
          }
          break;

        case 'WORD':
          if (c === '\\') {
            i++;
          } else if (whitespace.has(c) || special.has(c) || c2 === '\\\n') {
            tokens.push({ type: 'WORD', value: cmd.substring(tokenStart, i) });
            --i;
            mode = 'NORMAL';
          }
          break;
      }
    }

    return (() => {
      let i = 0;
      let len = tokens.length;

      return {
        hasMore: () => i < len,
        peek: () => i < len ? tokens[i] : null,
        peekValue: () => i < len ? tokens[i].value : '',
        peekType: () => i < len ? tokens[i].type : '',
        peekCtrl: () => i < len && tokens[i].type === 'CTRL' ? tokens[i].value : '',
        isNext: v => i < len && tokens[i].value === v,
        isNextCtrl: v => i < len && tokens[i].value === v && tokens[i].type === 'CTRL',
        pop: () => i < len ? tokens[i++] : null,
      };
    })();
  };

  // This does not fully implement the proper standard.
  // However, here is a link to the grammar for reference:
  // https://pubs.opengroup.org/onlinepubs/9699919799/utilities/V3_chap02.html
  let terminalParse = (line) => {
    let tokens = tokenize(line);

    let incomplete = false;

    let parse = () => {
      let root = parseItemChain(tokens);
      if (tokens.isNext('&&') || tokens.isNext('||')) {
        let expressions = [root];
        let ops = [];
        while (tokens.isNext('&&') || tokens.isNext('||')) {
          ops.push(tokens.pop().value);
          expressions.push(parseItemChain(tokens));
        }
        return { type: 'BOOL_JOIN', expressions, ops };
      }
      return root;
    };

    let redirOps = new Set('| < > << <> <& >& >>'.split(' '));
    let parseItemChain = () => {
      let root = parseItem();
      while (redirOps.has(tokens.peekCtrl())) {
        let left = root;
        let op = tokens.pop();
        let right = parseItem();
        root = { type: 'OP', left, op, right };
      }
      return root;
    };

    let parseItem = () => {
      let next = tokens.peek();
      if (!next) return { type: 'EOL' };
      if (tokens.isNextCtrl('(')) {
        tokens.pop();
        let root = parse();
        if (tokens.isNextCtrl(')')) {
          tokens.pop();
        } else {
          incomplete = true;
        }
        return root;
      }
      let entities = [];
      let nextType = tokens.peekType();
      while (nextType === 'WORD' || nextType === 'STRING') {
        entities.push(tokens.pop().value);
        nextType = tokens.peekType();
      }
      return { type: 'ENTITY', entities };
    };

    return { ...parse(tokenize(line)), incomplete };
  };

  let cwd = initialCwd;
  let fs = os.FileSystem(initialCwd);
  const STDIN = createPipe();
  const STDOUT = createPipe();
  const STDERR = createPipe();
  const VARS = { PATH: '', ...envVars };
  const PATH = VARS.PATH.split(';').map(v => v.trim()).filter(Util.identity);

  let getAbs = (name) => fs.getAbsolutePath(name);

  let cd = async (path) => {
    let newPath = getAbs(path);
    if (await fs.dirExists(newPath)) {
      cwd = newPath;
      fs = os.FileSystem(cwd);
      return true;
    }

    await STDERR.writeln(`cd: can't cd to ${path}: No such directory`);
    return false;
  };

  await cd(initialCwd);

  let interpretCommand = async (cmd, killSwitch, pipes, session) => {
    switch (cmd.type) {
      case 'ENTITY':
        let args = cmd.entities;

        // cd is a little different because it affects the current working directory
        // and cannot be implemented as an external program.
        if (args[0] === 'cd') {
          if (!await cd(args[1] || '')) {
            killSwitch.stop = true;
          }
          return;
        }

        for (let dir of [cwd, ...PATH]) {
          let execPath = FsPathUtil.canonicalize(dir, args[0]);
          let execInfo = await fs.getExecInfo(execPath);
          if (execInfo.isValid) {
            let proc = os.ExecutionEngine.launchFileNonBlocking(
              execPath,
              args.slice(1), // TODO: this is wrong, the executable should be included.
              cwd,
              { ...pipes });

            await proc.procStartedPromise;

            let pid = await proc.getPid();
            session.registerProcStart(pid);
            proc.procEndedPromise.then(() => session.registerProcEnd(pid));
            return;
          }
        }

        await pipes.stderr.writeln('command not found: ' + args[0]);
        return;

      case 'OP':
        switch (cmd.op) {
          case '|':
            let joinPipe = createPipe();
            await Promise.all([
              interpretCommand(cmd.left, killSwitch, { ...pipes, stdout: joinPipe }, session),
              interpretCommand(cmd.right, killSwitch, { ...pipes, stdin: joinPipe }, session),
            ]);
            break;

          default:
            throw new Error("Not implemented: " + cmd.op);
        }
        return;

      case 'BOOL_JOIN':
        break;

      default:
        throw new Error(cmd);
    }
  };

  let session = (() => {
    let procs = {};

    let s = {
      registerProcStart: pid => {
        let res;
        procs[pid] = { pid, res: null, pr: new Promise(r => { res = r; }) };
        procs[pid].res = res;
      },
      registerProcEnd: pid => {
        let proc = procs[pid];
        if (proc) {
          proc.res(true);
          delete procs[pid];
        }
      },
      awaitProcs: async () => {
        await Promise.all(Object.values(procs).map(p => p.pr));
      },
      isIdle: () => !Object.keys(procs).length,
      killAll: async () => {
        Object.values(procs).forEach(proc => {
          os.ProcessManager.killProcess(proc.pid);
          proc.res(true);
        });
        await s.awaitProcs();
      },
    };
    return Object.freeze(s);

  })();

  STDIN.setListener(async line => {
    let args = line.split(' ').map(v => v.trim()).filter(Util.identity);
    if (!args.length) return;

    let command = terminalParse(line);
    if (command.incomplete) {
      STDERR.writeln('sh: syntax error');
      return;
    }

    // This await ONLY blocks on interpreting the meaning of the command and launching the
    // proper processes/actions, it does NOT block on waiting for them those processes to complete.
    // Otherwise it would prevent further STDIN input to reach the process itself.
    await interpretCommand(
      command,
      { stop: false },
      { stdin: STDIN, stdout: STDOUT, stderr: STDERR },
      session);
  });
  return Object.freeze({
    in: STDIN.write,
    out: STDOUT.setListener,
    err: STDERR.setListener,
    run: async cmd => {
      await STDIN.writeln(cmd);
      await session.awaitProcs();
    },
    getCwd: () => cwd,
    awaitProcs: async () => {
      await session.awaitProcs();
    },
    isIdle: () => session.isIdle(),
    killAllProcs: async () => {
      await session.killAll();
    },
  });
};
