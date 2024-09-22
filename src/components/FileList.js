(() => {
  let regProps = 'os rootDir rootNameOverride foldersOnly onSelectionChanged'.split(' ');
  PlexiOS.HtmlUtil.registerComponent('FileList', (...args) => {

    let { HtmlUtil, Util } = PlexiOS;
    let { div, span } = HtmlUtil;
    let { TreeList } = HtmlUtil.Components;
    let { htmlArgs, props } = Util.argInterceptor(args, regProps);
    let { foldersOnly, os, rootDir, noIcons, onSelectionChanged, rootNameOverride } = props;
    if (!rootDir || !os) throw new Error();

    let fs = os.FileSystem(rootDir);
    let createFileNode = async (relPath) => {
      return {
        isDir: await fs.dirExists(relPath),
        path: relPath,
        name: relPath.split('/').pop(),
        isValid: await fs.pathExists(relPath),
      };
    };

    let outer = TreeList({
      onSelectionChanged,
      root: null,
      renderItem: (item, isRoot) => {
        let icon = null;
        if (!noIcons) {
          if (item.isDir) {
            img = os.IconStore.getIconByPurpose(isRoot ? 'FOLDER_CLOSED' : 'FOLDER_CLOSED');
          } else {
            // TODO: use getIconByPath, but that will require this to be async or moving this around so that it's pre-cached.
            img = os.IconStore.getIconByPurpose('FILE');
          }
          icon = span(img.set({ size: 16, margin: 2, verticalAlign: 'middle', }));
        }
        let name = isRoot ? (rootNameOverride || '/') : item.name;
        let out = div(
          { display: 'inline-block', italic: true, whiteSpace: 'nowrap' },
          noIcons ? null : icon,
          name);
        out.addEventListener('pointerup', ev => {
          if (ev.button === 2) {
            let options = { pid: os.Shell.getPidFromElement(out) };
            HtmlUtil.Components.FileContextMenu(os, item.path, false, options).showAtPointerEvent(ev);
            ev.stopPropagation();
          }
        });
        return out;
      },
      getChildren: async (item) => {
        let names = await fs.list(item.path);
        if (!names.ok) return [];
        let fullPaths = names.items.map(f => fs.getAbsolutePath(item.path + '/' + f.name));
        if (foldersOnly) {
          let fullPathCheck = await Promise.all(fullPaths.map(async f => {
            if (!await fs.dirExists(f)) return null;
            return f;
           }));
          fullPaths = fullPathCheck.filter(Util.identity);
        }
        return Promise.all(fullPaths.map(path => createFileNode(path)));
      },
      hasChildren: (item) => item.isDir,
      getId: (item) => item.path,
      autoExpandRoot: false,
    }, htmlArgs);

    createFileNode('.').then(n => outer.setRoot(n));

    outer.ensurePathExpanded = async (path) => {
      let parts = path.split('/').slice(1);
      let pathBuilder = '';
      outer.ensureIdExpanded('.');
      for (let i = 0; i < parts.length; i++) {
        pathBuilder += '/' + parts[i];
        await outer.ensureIdExpanded(pathBuilder);
      }
    };

    outer.setSelectedPath = (path) => {
      if (path === '' || path === '/') {
        outer.setSelectedId('.');
      } else {
        outer.setSelectedId(path);
      }
    };

    return outer;
  });
})();
