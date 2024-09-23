(() => {

  const { Util } = PlexiOS;

  const noSuch = "No such file or directory";

  let parseArgs = (args, expected, orderedMin, orderedMax) => {
    if (orderedMin === undefined) orderedMin = 0;
    if (orderedMax === undefined) orderedMax = orderedMin;

    let info = {};
    for (let item of expected) {
      let t = item.split(' ');
      let name = t[0];
      let size = parseInt(t[1]) || 0;
      let useEqual = t[2] === '=';
      info[name] = { size, useEqual, name };
    }

    let orderedArgs = [];
    let equalArgs = {};
    let basicArgs = {};
    let error = null;

    for (let i = 0; i < args.length; i++) {
      let arg = args[i];
      let parts = arg.split('=');
      let argInfo = info[parts[0]];
      if (argInfo) {
        if (argInfo.useEqual) {
          equalArgs[argInfo.name] = parts.slice(1).join('=');
        } else {
          let argValues = [];
          for (let j = 0; j < argInfo.size; j++) {
            i++;
            if (i >= args.length) {
              error = 'option requires an argument: ' + argInfo.name.split('-').pop();
              break;
            }
            argValues.push(args[i])
          }
          let value = true;
          if (argValues.length === 1) {
            value = argValues[0];
          } else if (argValues.length > 1) {
            value = argValues;
          }
          basicArgs[argInfo.name] = value;
        }
      } else {
        orderedArgs.push(arg);
      }
    }

    if (!error && orderedArgs.length < orderedMin) {
      error = '';
    }
    if (!error && orderedArgs.length > orderedMax) {
      error = '';
    }

    return {
      orderedArgs,
      equalArgs,
      basicArgs,
      error,
    }
  };

  let showUsage = async (stdout, name) => {
    await stdout.writeln("Usage: " + name);
    await stdout.writeln("TODO: implement this.");
  };

  let commands = {
    // CAT
    cat: async (args, fs, p, os) => {
      let { orderedArgs, error } = parseArgs(args, [], 1);
      if (error) {
        if (error.length) p.stderr.writeln(error);
        return;
      }
      if (orderedArgs.length !== 1) {
        p.stderr.writeln("STDIN Repeat not implemented yet");
        return;
      }
      let path = fs.getAbsolutePath(orderedArgs[0]);
      let fileInfo = await fs.fileReadText(path);
      if (fileInfo.ok) {
        await p.stdout.writeln(fileInfo.text);
      } else {
        if (await fs.fileExists(path)) {
          p.stderr.writeln(`cat: '${path}' is a binary file`);
        } else {
          p.stderr.writeln(`cat: '${path}' is not a file`);
        }
      }
    },

    // CD
    cd: async (args, fs, p, os) => {},

    // CHMOD
    chmod: async (args, fs, p, os) => {},

    // CP
    cp: async (args, fs, p, os) => {},

    // ECHO
    echo: async (args, fs, p, os) => {},

    // GREP
    grep: async (args, fs, p, os) => {},

    // HEAD
    head: async (args, fs, p, os) => {
      let { basicArgs, error } = parseArgs(args, ['-n 1']);
      if (error) {
        if (error.length > 0) await p.stderr.writeln(error);
        return showUsage(p.stdout, 'head');
      }

      if (basicArgs['-h'] === true) return showUsage(p.stdout, 'head');

      let n = 10;
      let nStr = basicArgs['-n'];
      if (nStr) {
        n = parseInt(nStr);
        if (n + '' !== nStr) {
          await p.stderr.writeln(`head: invalid number: '${nStr}'`);
          return;
        }
      }

      await new Promise(res => {
        let counter = 0;
        p.stdin.setListener(line => {
          p.stdout.writeln(line);
          counter++;
          if (counter >= n) {
            res(true);
          }
        });
      });
    },

    // LESS
    less: async (args, fs, p, os) => {},

    // LS
    ls: async (args, fs, p, os) => {
      let files = await fs.legacyList(p.cwd);
      await Util.sequentialAsyncForEach(files, p.stdout.writeln);
    },

    // MKDIR
    mkdir: async (args, fs, p, os) => {
      await fs.mkdir(args[0]);
    },

    // MORE
    more: async (args, fs, p, os) => {},

    // MV
    mv: async (args, fs, p, os) => {},

    // PWD
    pwd: async (args, fs, p, os) => {
      p.stdout.writeln(fs.getAbsolutePath('.'));
    },

    // RM
    rm: async (args, fs, p, os) => {
      let name = args[0];
      let absPath = fs.getAbsolutePath(name);
      let err = '';
      if (await fs.fileExists(absPath)) {
        let res = await fs.del(absPath);
        if (!res.ok) err = 'rm: ' + res.error;
      } else if (await fs.dirExists(absPath)) {
        err = `rm: '${name}' is a directory`;
      } else {
        err = `rm: can't remove '${name}': ${noSuch}`;
      }
      await p.stderr.writeln(err);
    },

    // RMDIR
    rmdir: async (args, fs, p, os) => {
      let name = args[0];
      let absPath = fs.getAbsolutePath(name);
      let err = '';
      if (await fs.dirExists(absPath)) {
        if ((await fs.list(absPath)).length) {
          err = `rmdir: '${name}': Directory not empty`;
        } else {
          await fs.del(absPath);
        }
      } else if (await fs.fileExists(absPath)) {
        err = `rmdir: '${name}': Not a directory`;
      } else {
        err = `rmdir: '${name}': ${noSuch}`;
      }
      await p.stderr.writeln(err);
    },

    // SET
    set: async (args, fs, p, os) => {},

    // TAIL
    tail: async (args, fs, p, os) => {},

    // TOUCH
    touch: async (args, fs, p, os) => {
      let name = args[0];
      let err = '';
      let absPath = fs.getAbsolutePath(name);
      let parent = fs.getParent(absPath);
      if (await fs.dirExists(parent)) {
        if (await fs.fileExists(absPath)) {
          // TODO: file access timestamps, permissions, etc.
        } else {
          await fs.fileCreateEmptyText(p.cwd + '/./' + name);
        }
      } else {
        err = `touch: ${name}: ${noSuch}`;
      }
      await p.stderr.writeln(err);
    },
  };

  Object.keys(commands).forEach(cmd => {
    PlexiOS.registerJavaScript('app', 'io.plexi.tools.' + cmd, (os, procInfo, args) => {
      let fn = commands[cmd];
      let fs = os.FileSystem(procInfo.cwd);
      return fn(args, fs, procInfo, os);
    });
  });
  PlexiOS.HtmlUtil.registerComponent('TerminalCommands', Util.noop);
})();
