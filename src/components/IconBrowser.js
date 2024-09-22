(() => {
  const TILE_DEFAULT_WIDTH = 64;
  const TILE_DEFAULT_HEIGHT = 80;
  const TILE_DEFAULT_MARGIN = 8;

  const TILE_X_SPACING = TILE_DEFAULT_WIDTH + TILE_DEFAULT_MARGIN;
  const TILE_Y_SPACING = TILE_DEFAULT_HEIGHT + TILE_DEFAULT_MARGIN;

  let regProps = [
    'os', 'getIcons', 'getDir',
    'bgTransparent', 'highContrastText',
    'fileContextMenuExtBuilder',
    'onSelectionChanged', 'onDoubleClick',
    'onOpenDir', 'onOpenFile',
    'onBackspace',
    'defaultLayoutMode',
    'onFileDrop',
  ];
  PlexiOS.HtmlUtil.registerComponent('IconBrowser', (...args) => {
    let { HtmlUtil, Util } = PlexiOS;
    let { div, span } = HtmlUtil;
    let { htmlArgs, props } = Util.argInterceptor(args, regProps);
    let {
      os, getDir, getIcons,
      bgTransparent, highContrastText,
      onDoubleClick, onSelectionChanged,
      onOpenDir, onOpenFile, onFileDrop,
      onBackspace, defaultLayoutMode,
      fileContextMenuExtBuilder,
    } = props;
    if (!os) throw new Error();
    let fs = os.FsRoot;
    let isRealDir = !getIcons && getDir;
    if (isRealDir) {
      getIcons = async () => {
        let d = fs.getAbsolutePath(await Promise.resolve(getDir()));
        let files = await fs.list(d);
        if (!files.ok) return null;
        let paths = files.items.map(f => (d === '/' ? '' : d) + '/' + f.name);
        // directories should go first.
        let sortObjs = await Promise.all(paths.map(async p => {
          return { path: p, sortKey: ((await fs.dirExists(p)) ? '0:' : '1:') + p };
        }));
        sortObjs.sort((a, b) => a.sortKey.localeCompare(b.sortKey));
        return sortObjs.map(o => o.path);
      }
    }
    getIcons = getIcons || (() => []);

    let getPid = () => os.Shell.getPidFromElement(outer);

    let modes = new Set(['TILE', 'ARRANGE', 'DETAILS', 'THUMBNAILS']);
    let layoutMode = `${defaultLayoutMode}`.toUpperCase();
    if (!modes.has(layoutMode)) layoutMode = 'TILE';

    let dictOfDictShouldResetMutualProps = (dictOfDict) => {
      // each style should also reset other properties from the other styles.
      let reset = {};
      Object.values(dictOfDict).forEach(d => {
        Object.keys(d).forEach(k => { reset[k] = ''; });
      });
      Object.keys(dictOfDict).forEach(k => {
        dictOfDict[k] = { ...reset, ...dictOfDict[k] };
      });
      return dictOfDict;
    };

    let iconStyles = {
      TILE: {
        display: 'inline-block',
        size: [TILE_DEFAULT_WIDTH, TILE_DEFAULT_HEIGHT],
        margin: TILE_DEFAULT_MARGIN,
        textAlign: 'center',
        fontSize: 9,
        userSelect: 'none',
        verticalAlign: 'top',
        borderRadius: 2,
        position: 'relative',
      },
      DETAILS: {
        display: 'block',
        userSelect: 'none',
        fontSize: 8,
        verticalAlign: 'middle',
      },
      THUMBNAILS: null,
    };
    iconStyles.ARRANGE = { ...iconStyles.TILE, display: 'block', position: 'absolute', left: 0, top: 0 };
    iconStyles.THUMBNAILS = { ...iconStyles.TILE, size: 100 };
    dictOfDictShouldResetMutualProps(iconStyles);

    const IMAGE_FILES = new Set(['jpg', 'jpeg', 'png', 'gif', 'bmp']);

    let applyIconLayoutStyle = (icon) => {
      icon.set(iconStyles[layoutMode]);
      let isDetails = layoutMode === 'DETAILS';
      let isThumbs = layoutMode === 'THUMBNAILS';
      let ui = icon._PX_UI;
      ui.icon.set({
        textAlign: isDetails ? '' : 'center',
        display: 'inline-block',
        size: isDetails ? 16 : 32,
      });
      icon.setPreviewMode(isThumbs);
      ui.label.set({
        display: isDetails ? 'inline-block' : 'block',
        position: isDetails ? 'relative' : '',
        top: isDetails ? -2 : '',
        width: isDetails ? 200 : '',
        marginLeft: isDetails ? 5 : 0,
      });
    };

    let inner = div();
    let blueBoxLayer = div({ fullSize: true });
    let outer = div(
      htmlArgs,
      {
        overflowX: 'hidden',
        overflowY: 'auto',
        position: 'set',
        textAlign: 'left',
      },
      bgTransparent ? null : { backgroundColor: '#fff' },
      highContrastText ? { color: '#fff', textShadow: '0px 0px 5px #000' } : null,
      blueBoxLayer,
      inner
    );

    let iconIdAlloc = 1;
    let selection = {
      cursor: 0,
      icons: new Set(),
      fp: '',
      multiMode: false,
    };

    let refreshIconVisualStyle = () => {
      let selectedIcons = [];
      Array.from(inner.children).forEach(e => {
        let isSelected = selection.icons.has(e._PX_ICON_ID);
        let isCursor = e._PX_ICON_ID === selection.cursor;
        if (isSelected) selectedIcons.push(e._PX_ICON);
        e.set(
          isSelected
            ? { backgroundColor: '#008', color: '#fff' }
            : { backgroundColor: '', color: '' },
          isCursor
            ? { border: '1px dashed rgba(0, 0, 0, 0.5)', padding: 2 }
            : { border: 'none', padding: 3 }
        );
      });
      let iconIdList = [...selection.icons];
      iconIdList.sort((a, b) => a - b);
      let newFp = iconIdList.join(',');
      if (newFp !== selection.fp) {
        selection.fp = newFp;
        if (selectedIcons.length && onSelectionChanged) {
          onSelectionChanged(selectedIcons);
        }
      }
    };

    let setPosition = async (curDir, file, x, y) => {
      let coordFile = await getCoordFilePath(curDir, true);
      let data = await fs.fileReadJson(coordFile);
      let obj = (data.data || {});
      obj[file] = [x, y];
      await fs.fileWriteText(coordFile, JSON.stringify(obj));
    };

    let getCoordFilePath = async (dir, createIfNotExists) => {
      let dataDir = '/appdata/io.plexi.tools.files';
      let manifestPath = dataDir + '/manifest.txt';
      await fs.mkdirs(dataDir);
      let manifest = await fs.fileReadText(manifestPath);
      let lines = (manifest.ok ? manifest.text.split('\n') : []).filter(Util.identity);
      for (let line of lines) {
        let parts = line.split('|');
        if (parts[0] === dir) {
          return dataDir + '/' + parts[1].trim() + '.txt';
        }
      }
      if (createIfNotExists) {
        let id = Util.generateId(12) + '';
        path = dataDir + '/' + id + '.txt';
        await fs.fileWriteText(path, '{}');
        await fs.fileWriteText(manifestPath, [...lines, dir + '|' + id].join('\n').trim());
        return path;
      }
      return null;
    };

    let getArrangePosition = async (curDir, files, height) => {
      let positions = {};

      let coordFile = await getCoordFilePath(curDir);
      if (coordFile) {
        let coords = await fs.fileReadJson(coordFile);
        if (coords.ok) {
          Object.keys(coords.data).forEach(name => {
            let nums = Util.ensureArray(coords.data[name]).map(n => Math.max(0, Util.ensureNumber(n)));
            let [x, y] = [...nums, 0, 0].slice(0, 2);
            positions[name] = { name, x, y };
          });
        }
      }

      let takenTiles = {};

      Object.values(positions).forEach(pos => {
        let left = Math.floor(pos.x);
        let right = pos.x === left ? left : (left + 1);
        let top = Math.floor(pos.y);
        let bottom = pos.y === top ? top : (top + 1);
        for (let y = top; y <= bottom; y++) {
          for (let x = left; x <= right; x++) {
            takenTiles[`${x},${y}`] = true;
          }
        }
      });
      let allocFiles = files.filter(f => !positions[f]).reverse();
      for (let x = 0; allocFiles.length; x++) {
        for (let y = 0; allocFiles.length && y < height; y++) {
          if (!takenTiles[`${x},${y}`]) {
            positions[allocFiles.pop()] = { x, y };
          }
        }
      }
      return positions;
    };

    let buildIcon = async (icon) => {
      if (typeof icon === 'string') {
        let fullPath = icon;
        let name = fullPath.split('/').pop();
        icon = {
          img: await os.IconStore.getIconByPath(fs, fullPath),
          label: name,
          fullPath,
        };
      }

      let iconHost = div({ size: 32 }, icon.img.set({ size: '100%' }));
      let label = div(icon.label);
      let wrapper = div(
        iconHost,
        label,
      );

      let setIcon = (canvas) => {
        iconHost.clear().set(Util.copyImage(canvas).set({ size: '100%' }));
      };
      setIcon(icon.img);

      wrapper._PX_ICON_ID = iconIdAlloc++;
      wrapper._PX_ICON = icon;
      wrapper._PX_UI = { icon: iconHost, label };

      let openItem = async () => {
        let fullPath = icon.fullPath;
        if (fullPath) {
          let stopper = Util.createEventStopper();
          let ev = Object.freeze({ ...stopper.buildEvent(), fullPath });
          if (await fs.dirExists(fullPath)) {
            if (onOpenDir) await Promise.resolve(onOpenDir(ev));
          } else {
            if (onOpenFile) await Promise.resolve(onOpenFile(ev));
          }

          if (!stopper.isStopped()) {
            os.FileActions.launchFile(fullPath, os.FsRoot.getParent(fullPath));
            return true;
          }
          return false;
        }
      };

      HtmlUtil.applyDoubleClickHandler(wrapper, () => {
        selection.cursor = wrapper._PX_ICON_ID;
        if (onDoubleClick) onDoubleClick(icon);
        openItem();
      });
      wrapper.addEventListener('pointerdown', e => {
        os.Shell.giveKeyboardFocusToElement(outer);
        let id = wrapper._PX_ICON_ID;
        let inSelection = selection.icons.has(id);
        e.stopPropagation();
        if (e.button === 2 && inSelection) return;

        if (e.ctrlKey) {
          if (inSelection) {
            selection.icons.delete(id);
          } else {
            selection.icons.add(id);
          }
        } else {
          selection.icons = new Set([id]);
        }
        selection.cursor = id;
        refreshIconVisualStyle();
      });
      wrapper.addEventListener('pointerup', e => {
        e.stopPropagation();
      });

      wrapper.set({
        onRightClick: ev1 => {
          let options = {
            openOverride: async (ev2) => {
              ev2.preventDefault();
              await openItem();
            },
            refreshCb: populate,
            pid: getPid(),
            extendedOptionsBuilder: fileContextMenuExtBuilder,
          };
          let paths = getIconPaths(selection.icons);
          HtmlUtil.Components.FileContextMenu(os, paths, false, options).showAtPointerEvent(ev1);
        },
      });

      HtmlUtil.applyClickDragHandler(
        wrapper,
        async (ev) => {
          let file = { path: icon.fullPath, name: icon.label, icon: await os.IconStore.getIconByPath(os.FsRoot, icon.fullPath) };
          os.Shell.FileDrag.start(ev, [file]);
        },
        (ev) => os.Shell.FileDrag.move(ev),
        (ev) => os.Shell.FileDrag.release(ev),
        true);

      wrapper.openFile = () => openItem();

      let isPreview = false;
      wrapper.setPreviewMode = async (enabled) => {
        if (isPreview === enabled) return;
        isPreview = enabled;
        let img = null;

        if (enabled && icon.fullPath) {
          let path = icon.fullPath;
          let ext = path.split('.').pop().toLowerCase();
          if (IMAGE_FILES.has(ext)) {
            let imgData = await fs.fileReadImage(path);
            if (imgData.ok) {
              setIcon(imgData.img);
              return;
            }
          } else if (ext === 'scr') {
            let scrInfo = await fs.getVirtualJsInfo(path);
            if (scrInfo.isValid && scrInfo.category === 'screensaver') {
              let { init, render } = await PlexiOS.loadJavaScript('screensaver', scrInfo.id);
              let dummyCanv = HtmlUtil.canvas();
              dummyCanv.width = 100;
              dummyCanv.height = 100;
              setIcon(dummyCanv);
              Util.pause(0.1).then(() => runScreenSaver(iconHost.firstChild, init, render));
            }
          }
        }
        setIcon(img || icon.img);
      };

      applyIconLayoutStyle(wrapper);

      return wrapper;
    };

    let runScreenSaver = async (canvas, init, render) => {
      init = init || Util.noop;
      let state = await Promise.resolve(init());
      let inTree = () => {
        let walker = canvas;
        while (walker) {
          if (walker === inner) return true;
          walker = walker.parentElement;
        }
      };

      let ctx = canvas.getContext('2d');
      while (inTree()) {
        await Util.pause(1 / 30);
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        await Promise.resolve(render(state, canvas, ctx, canvas.width, canvas.height));
      }
    };

    let getIconElement = id => {
      return Array.from(inner.children).filter(e => e._PX_ICON_ID === id)[0] || null;
    };
    let getIconPaths = ids => {
      let lookup = new Set(ids);
      return Array.from(inner.children)
        .filter(e => lookup.has(e._PX_ICON_ID))
        .map(e => e._PX_ICON.fullPath)
        .filter(Util.identity);
    };

    let populate = async () => {
      let icons = await Promise.resolve(getIcons());
      if (!icons) {
        inner.clear().set("Directory does not exist");
      }
      let positions = null;
      let isArrange = layoutMode === 'ARRANGE';
      if (isArrange) {
        let dir = await Promise.resolve(getDir());
        await Util.pause(0.05);
        let bcr = outer.getBoundingClientRect();
        let filesRaw = await fs.list(dir);
        let files = filesRaw.ok ? filesRaw.items.map(f => f.name) : [];
        positions = await getArrangePosition(dir, files, Math.max(1, Math.floor(bcr.height / (TILE_Y_SPACING))));
      }
      if (icons) {
        let iconElements = await Promise.all(icons.map(buildIcon));
        let first = iconElements[0];
        if (first) selection.cursor = first._PX_ICON_ID;
        inner.clear().set(iconElements);
        iconElements.forEach(applyIconLayoutStyle);
        refreshIconVisualStyle();
        if (isArrange) {
          iconElements.forEach(icon => {
            let fullPath = icon._PX_ICON.fullPath;
            let name = fullPath.split('/').pop();
            let pos = positions[name] || {};
            icon.set({ left: pos.x * (TILE_X_SPACING), top: pos.y * (TILE_Y_SPACING) });
          });
        }
      }
    };

    inner.addEventListener('pointerdown', () => {
      os.Shell.giveKeyboardFocusToElement(outer);
      selection.icons = new Set();
      refreshIconVisualStyle();
    });

    HtmlUtil.applyClickDragHandler(
      blueBoxLayer,
      (ev) => {
        let bcr = blueBoxLayer.getBoundingClientRect();
        let startX = ev.pageX - bcr.left;
        let startY = ev.pageY - bcr.top;
        selection.icons = new Set();
        return { startX, startY, layerSize: { left: bcr.left, top: bcr.top, width: bcr.width, height: bcr.height } };
      },
      (_ev, sess, dx, dy) => {
        let { startX, startY, layerSize } = sess;

        if (!blueBoxLayer.firstChild) {
          blueBoxLayer.set(div({ position: 'absolute', border: '1px solid #00f', backgroundColor: 'rgba(0, 0, 128, 0.5)' }));
        }

        let box = blueBoxLayer.firstChild;
        let x1 = startX;
        let y1 = startY;
        let x2 = startX + dx;
        let y2 = startY + dy;
        let left = Math.min(x1, x2);
        let right = Math.max(x1, x2);
        let top = Math.min(y1, y2);
        let bottom = Math.max(y1, y2);
        let width = right - left;
        let height = bottom - top;
        box.set({ left, top, width, height });

        let boxClientRect = {
          left: left + layerSize.left,
          top: top + layerSize.top,
          right: right + layerSize.left,
          bottom: bottom + layerSize.top,
        };
        let hits = Array.from(inner.children).filter(icon => {
          let rect = icon.getBoundingClientRect();
          let x = rect.left + rect.width / 2;
          let y = rect.top + rect.height / 2;
          return x > boxClientRect.left && x < boxClientRect.right && y > boxClientRect.top && y < boxClientRect.bottom;
        });

        selection.icons = new Set(hits.map(icon => icon._PX_ICON_ID));
        refreshIconVisualStyle();
      },
      () => {
        blueBoxLayer.clear();
      },
      false);

    outer.addEventListener('pointerdown', () => {
      os.Shell.giveKeyboardFocusToElement(outer);
    });

    outer.addEventListener('pointerup', async ev => {
      refreshIconVisualStyle();
      if (ev.button === 2 && getDir) {
        let options = { pid: getPid(), extendedOptionsBuilder: fileContextMenuExtBuilder };
        HtmlUtil.Components.FileContextMenu(os, await Promise.resolve(getDir()), true, options).showAtPointerEvent(ev);
      }
    });

    let moveCursor = (dx, dy, ctrl) => {
      let newIcon = findIconFromCardinalOffset(dx, dy);
      if (!newIcon && selection.cursor) newIcon = getIconElement(selection.cursor);

      if (newIcon) {
        selection.cursor = newIcon._PX_ICON_ID;
        if (!ctrl) {
          selection.icons = new Set([selection.cursor]);
        }
        refreshIconVisualStyle();
      }
    };
    let jumpToLetter = c => {};

    let renameFile = () => {
      let icon = getIconElement(selection.cursor);
      let fullPath = icon ? icon._PX_ICON.fullPath : '';
      if (fullPath) {
        os.Shell.DialogFactory.showRename(getPid(), fullPath);
      }
    };

    let openFile = () => {
      let targetId = 0;

      if (selection.icons.has(selection.cursor)) targetId = selection.cursor;
      else if (selection.icons.size() === 1) targetId = [...selection.icons][0];
      else if (selection.icons.size() === 0) return;
      else {
        // TODO: prompt "Are you sure you want to open these n files?"
      }

      let icon = getIconElement(targetId);
      if (icon) icon.openFile();
    };

    let setSelectionToCursor = (ctrl) => {
      let cursor = selection.cursor;
      if (!cursor && icons[0]) cursor = icons[0]._PX_ICON_ID;
      if (!cursor) return;

      if (!selection.icons.has(cursor)) {
        selection.icons.add(cursor);
      } else if (ctrl) {
        selection.icons.delete(cursor);
      }
      refreshIconVisualStyle();
    };

    let findIconFromCardinalOffset = (dx, dy) => {
      let icons = Array.from(inner.children).map(e => {
        let bcr = e.getBoundingClientRect();
        return { id: e._PX_ICON_ID, x: bcr.left + bcr.width / 2, y: bcr.top + bcr.height / 2, w: bcr.width, h: bcr.height };
      });
      let start = (selection.cursor ? icons.filter(icon => icon.id === selection.cursor)[0] : null) || icons[0];
      icons = icons
        .filter(t => !(
          (dx < 0 && t.x >= start.x) ||
          (dx > 0 && t.x <= start.x) ||
          (dy < 0 && t.y >= start.y) ||
          (dy > 0 && t.y <= start.y)));
      if (!icons.length) return null;
      let tx = start.x + dx * start.w;
      let ty = start.y + dy * start.h;
      let best = null;
      let bestDist = null;
      for (let icon of icons) {
        if (icon.id !== start.id) {
          let diffX = (tx - icon.x) ** 2;
          let diffY = (ty - icon.y) ** 2;
          if (dx && diffY >= diffX * 0.7) continue;
          if (dy && diffX >= diffY * 0.7) continue;
          let dist = diffX + diffY;
          if (!best || bestDist > dist) {
            best = icon;
            bestDist = dist;
          }
        }
      }

      return best ? getIconElement(best.id) : null;
    };

    let navigateUp = () => {
      if (onBackspace) onBackspace();
    };

    outer.onShellKey = (ev, isDown) => {
      if (!isDown) return;

      let c = `${ev.code}`;
      switch (c) {
        case 'ArrowLeft': moveCursor(-1, 0, ev.ctrlKey); break;
        case 'ArrowRight': moveCursor(1, 0, ev.ctrlKey); break;
        case 'ArrowUp': moveCursor(0, -1, ev.ctrlKey); break;
        case 'ArrowDown': moveCursor(0, 1, ev.ctrlKey); break;
        case 'Backspace': navigateUp(); break;
        case 'Space': setSelectionToCursor(ev.ctrlKey); break;
        case 'Enter': openFile(); break;
        case 'F2': renameFile(); break;
        case 'Escape': break;
        default:
          if (c.startsWith('Key') && c.length === 4) {
            jumpToLetter(c.toUpperCase());
          }
          break;
      }
    };

    let defaultDropFile = async (files, ev) => {
      let curDir = await Promise.resolve(getDir());
      let bcr = outer.getBoundingClientRect();
      let pos = {
        x: Math.floor(1000 * (ev.pageX - bcr.left) / TILE_X_SPACING) / 1000 - 0.5,
        y: Math.floor(1000 * (ev.pageY - bcr.top) / TILE_Y_SPACING) / 1000 - 0.5,
      };

      for (let file of files) {
        let target = fs.join(curDir, file.name);
        if (file.isInternal) {
          let source = file.path;
          if (fs.getParent(source) === curDir) {
            if (layoutMode === 'ARRANGE') {
              setPosition(curDir, file.name, pos.x, pos.y);
            }
          } else {
            if (await fs.pathExists(target)) {
              console.log("TODO: dry run with prompt to overwrite");
            }
            await fs.move(source, target);
          }
        } else {
          if (file.isText) {
            await fs.fileWriteText(target, await file.text);
          } else {
            let arrBuf = new Uint8Array(await file.bytes);
            let fileType = Util.getCommonFileType(file.name, arrBuf);
            if (fileType && fileType.type === 'image' && (fileType.format === 'JPEG' || fileType.format === 'PNG')) {
              await fs.fileWriteImageBase64(target, Util.bytesToBase64(arrBuf));
            } else {
              console.log("TODO: raw binary data files", arrBuf.slice(0, 10).join(', ') + '...');
            }
          }
        }
      }

      populate();
    };

    let dropHandler = onFileDrop || (isRealDir ? defaultDropFile : null);
    if (dropHandler) {
      outer.set({
        onDragDrop: (files, ev) => dropHandler(files, ev),
        onDragOver: (files) => { },
        onDragOut: (files) => { },
      });
    }

    populate();
    outer.refresh = populate;

    outer.setLayoutMode = (mode) => {
      mode = `${mode}`.toUpperCase();
      if (modes.has(mode)) {
        layoutMode = mode;
        populate();
      }
    };

    return outer;
  });
})();
