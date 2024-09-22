PlexiOS.HtmlUtil.registerComponent('FileContextMenu', (os, absPathOrPaths, isDirInterior, options) => {

  let { Util } = PlexiOS;
  let { openOverride, refreshCb, pid } = Util.ensureObject(options);
  refreshCb = refreshCb || Util.noop;

  pid = pid || -1;

  let absPaths = Util.flattenArray([absPathOrPaths]);
  let absPath = absPaths.length === 1 ? absPaths[0] : null;
  let isMulti = absPath === null;

  let {
    buildRootMenuElement,
    createMenu,
    createMenuItem,
    createCommand,
    createMenuSep,
  } = os.Shell.MenuBuilder;

  let fs = os.FsRoot;

  let buildExtMenu = (idChain) => {
    if (options.extendedOptionsBuilder) {
      return options.extendedOptionsBuilder(idChain, absPaths, isDirInterior);
    }
    return null;

  };

  let fileContentCopiers = {
    TEXT: async path => {
      let d = await fs.fileReadText(path);
      if (d.ok) os.Clipboard.copyText(d.text);
    },
    IMAGE: async path => {
      let d = await fs.fileReadImage(path, true);
      if (d.ok) os.Clipboard.copyImage(d.img)
    },
  };

  let quickTypeDetermination = async (fs, absPath) => {
    let name = absPath.split('/').pop().toLowerCase();
    let t = name.split('.');
    if (t.length > 1) {
      let ext = t.pop().split('.').pop();
      if (ext === 'jpg' || ext === 'jpeg' || ext === 'png') return 'IMAGE';
      // TODO: determine if node content is valid UTF-8 string
      return 'IMAGE';
    }
    return '';
  };

  let buildRoot = async () => {
    let openOptions = [];

    let isDir = await fs.dirExists(absPath); // fileType === 'DIR';
    let isCopiableContent = !isMulti && !isDir && !!fileContentCopiers[await quickTypeDetermination(fs, absPath)];

    let extOptions = await Promise.resolve(buildExtMenu([]));

    if (!isMulti) {
      if (isDir) {
        if (isDirInterior) {
          openOptions = [
            // createMenuItem('view', "View Mode >"),
            // createMenuItem('ordering', "Order By >"),
          ];
        } else {
          openOptions = [
            createMenuItem('open', "Open"),
            createMenuItem('open:/system/tools/files', "Open in New Window"),
          ];
        }
      } else {
        let execCheck = await fs.getExecInfo(absPath);
        if (execCheck.isValid) {
          openOptions = [
            createMenuItem('run', "Run"),
          ];
        } else {
          let t = absPath.split('/').pop().split('.');
          let appPaths = [];
          if (t.length > 1) {
            let ext = t.pop();
            appPaths = await os.FileActions.getAppsForExt(ext);
          }
          if (appPaths.length > 0) {
            openOptions = await Promise.all(appPaths.map(async path => {
              let app = await fs.getExecInfo(path);
              if (app.isValid) {
                let m = createMenuItem('open:' + path, "Open in " + app.name);
                m.withIcon(app.icon || os.IconStore.getIconByPurpose('EXEC', true));
                return m;
              }
            }));
          }
        }
      }
    }

    return createMenu(
      openOptions,
      (!isMulti && !isDir) ? createMenuItem('openwith', "Open With...") : null,
      createMenuSep(),
      isDirInterior ? [
        createMenuItem('paste', "Paste"),
        // createMenuItem('pasteas', "Paste As"),
        // createMenuItem('bulkrename', "Bulk Rename"),
      ] : [
        createMenuItem('cut', "Cut"),
        createMenuItem('copy', "Copy"),
        isCopiableContent ? createMenuItem('copycontent', "Copy Content") : null,
        !isMulti ? createMenuItem('rename', "Rename") : null,
        createMenuItem('del', "Delete"),
      ],
      createMenuSep(),
      isDirInterior ? [
        // createMenuItem('new', 'New >'),
        createMenuSep(),
      ] : null,
      !isMulti && isDir ? [
        createMenuItem('openterm', "Open in Terminal"),
        createMenuSep(),
      ] : null,
      createMenuItem('copypath', isMulti ? "Copy Paths" : "Copy Path"),
      !isMulti ? createMenuItem('prop', 'Properties') : null,
      extOptions,
    );
  };

  let launchFile = () => os.FileActions.launchFile(absPath, fs.getParent(absPath));
  let launchApp = (appPath) => os.ExecutionEngine.launchFile(appPath, [absPath], fs.getParent(absPath));

  let buildMenu = async idChain => {
    if (idChain.length === 0) return buildRoot();

    let extOptions = await Promise.resolve(buildExtMenu(idChain))

    switch (idChain[0]) {
      case 'open':
        return createCommand(async () => {
          if (openOverride) {
            let stopper = Util.createEventStopper();
            await Promise.resolve(openOverride(stopper.buildEvent()));
            if (stopper.isStopped()) return;
          }
          launchFile();
        });

      case 'openwith': return createCommand(() => launchApp('/system/tools/openwith'));

      case 'run': return createCommand(launchFile);
      case 'prop': return createCommand(() => launchApp('/system/tools/fileprops'));
      case 'openterm': return createCommand(() => launchApp('/system/tools/terminal'));
      case 'del': return createCommand(async () => {
        let fs = os.FsRoot;
        let dir = Math.floor(Util.getTime()) + '_' + Util.generateId(7);
        await Promise.all(absPaths.map(path => {
          if (path.startsWith('/deleted/')) {
            return fs.del(path);
          }
          return fs.move(path, '/deleted/' + dir + '/' + path + '.tmp');
        }));
        refreshCb();
      });
      case 'rename': return createCommand(() => {
        os.Shell.DialogFactory.showRename(pid, absPath);
      });

      case 'cut':
      case 'copy':
        return createCommand(() => os.Clipboard.copyFiles(absPaths, idChain[0] === 'cut'));

      case 'copypath':
        return createCommand(() => os.Clipboard.copyText(absPaths.join('\n')));

      case 'copycontent':
        return createCommand(async () => {
          let path = absPaths[0];
          let type = await quickTypeDetermination(fs, path);
          let copier = fileContentCopiers[type] || Util.noop;
          copier(path);
        });

      case 'paste': return createCommand(async () => {
        let files = await os.Clipboard.paste('FILES');
        if (files.type === 'FILES') {
          let fs = os.FsRoot;
          for (let file of files.paths) {
            if (file === '/') return;
            let parent = fs.getParent(file);
            if (absPath === parent && files.isCut) continue;

            let targetFileName = file.split('/').pop();
            let parts = targetFileName.split('.');
            let ext;
            let name;
            if (parts.length > 1) {
              ext = '.' + parts.pop();
              name = parts.join('.');
              if (!name.length) {
                name += ext;
                ext = '';
              }
            } else {
              name = targetFileName;
              ext = '';
            }

            let counter = 0;
            let targetPath = null;
            while (!targetPath) {
              if (counter === 0) {
                targetPath = fs.join(absPath, name + ext);
              } else if (counter === 1) {
                targetPath = fs.join(absPath, name + ' (Copy)' + ext);
              } else {
                targetPath = fs.join(absPath, name + ' (Copy ' + counter + ')' + ext);
              }
              if (await fs.pathExists(targetPath)) {
                targetPath = null;
                counter++;
              }
            }

            if (files.isCut) {
              await fs.move(file, targetPath);
            } else {
              await fs.copy(file, targetPath);
            }
          }
        }
      });
    }

    if (idChain[0].startsWith('open:')) {
      let path = idChain[0].substring(5);
      return createCommand(() => launchApp(path));
    }

    if (extOptions) return extOptions;
  };

  let showAtPointerEvent = async (ev) => {
    let el = await buildRootMenuElement(buildMenu, true);
    os.Shell.openModalAtMouseEvent(ev, el);
  };

  return Object.freeze({
    showAtPointerEvent,
  });
});
