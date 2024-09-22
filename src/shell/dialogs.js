const createDialogFactory = (os) => {

  let { button, div, inputText, span } = HtmlUtil;

  let showPrompt = (pid, options) => {
    let labels = {
      YES: "Yes",
      NO: "No",
      CANCEL: "Cancel",
      OK: options.okLabelOverride || "OK",
    };
    let choices = [];
    switch (options.style) {
      case 'YESNO': choices = ['YES', 'NO']; break;
      case 'OKCANCEL': choices = ['OK', 'CANCEL']; break;
      case 'OK': choices = ['OK']; break;
      default: throw new Error();
    }
    let buttons = choices.map(c => ({ id: c, label: labels[c] }));

    let desktopSize = os.Shell.getSize();
    let w = Math.min(desktopSize.width, options.width || 340);
    let h = Math.min(desktopSize.height, options.height || 180);
    let left = Math.floor((desktopSize.width - w) / 2);
    let top = Math.floor((desktopSize.height - h) / 2);

    let res;
    let promise = new Promise(r => { res = r; });

    let isOkEnabled = options.isOkEnabled || (() => true);
    let buttonsById = {};

    let result = null;
    let _winData = null;

    let proc = os.ProcessManager.getProcess(pid);
    let parent = null;
    if (proc) {
      let wins = proc.uiHandles;
      if (wins.length) parent = wins[wins.length - 1];
    }

    os.Shell.showWindow(pid, {
      isModal: true,
      x: left,
      y: top,
      innerWidth: w,
      innerHeight: h,
      title: options.title || '',
      parentWindow: parent,
      onClosed: () => { if (result === null) res('CANCEL'); },
      onInit: (host, winData) => {
        _winData = winData;
        host.set(div(
          {
            fullSize: true,
            backgroundColor: '#ccc',
            padding: 20,
            textAlign: 'center',
          },
          div(options.message, { marginBottom: 10 }),
          div(buttons.map(b => {
            let btn = button(
              b.label,
              {
                onClick: async () => {
                  result = b.id;
                  await winData.closeHandler();
                  res(result);
                }
              });
            buttonsById[b.id] = btn;
            return btn;
          }))
        ));
      },
      onShown: () => {
        if (options.onShown) options.onShown();
      },
    });

    if (!isOkEnabled()) buttonsById.OK.disabled = true;

    let closeMe = async (resId) => {
      res(resId);
      await _winData.closeHandler();
    };
    return Object.freeze({
      getResult: () => promise,
      okayEnabledChanged: () => {
        buttonsById.OK.disabled = !isOkEnabled();
      },
      pushButton: id => {
        if (id === 'OK' && !isOkEnabled()) return;
        closeMe(buttonsById[id] ? id : null);
      },
      close: async () => closeMe(null),
    });
  };

  // options: promptOverwrite, title
  let showFileDialog = async (pid, startingDir, type, options) => {
    options = options || {};
    let isSave = type === 'SAVE';
    let isOpen = type === 'OPEN';
    if (!isSave && !isOpen) throw new Error();
    let fs = os.FsRoot;
    let curDir = fs.getAbsolutePath(startingDir || '/');
    let curDirLabel = span({ paddingLeft: 8, bold: true }, curDir);

    const NAV_HEIGHT = 40;
    const FILE_HEIGHT = 250;
    const NAME_HEIGHT = 40;
    let refreshView = () => {
      curDirLabel.clear().set(curDir);
      icons.refresh();
      upBtn.disabled = curDir === '/';
    };

    let upBtn = button("Up", () => {
      if (curDir === '/') return;
      curDir = fs.getAbsolutePath(curDir + '/..');
      refreshView();
    });

    let topNav = div(
      { northDock: NAV_HEIGHT },
      div({ westDock: 60 }, upBtn),
      div({ eastStretchDock: 60 }, curDirLabel),
    );

    let doubleClickedFile = null;

    let selectFile = async fullPath => {
      if (await fs.dirExists(fullPath)) {
        curDir = fullPath;
        nameSpecify.value = '';
        refreshView();
      } else {
        doubleClickedFile = fullPath;
        prompt.close();
      }
    };

    let icons = HtmlUtil.Components.IconBrowser({
      os,
      getDir: () => curDir,
      onOpenFile: ev => {
        ev.preventDefault();
        selectFile(ev.fullPath);
      },
      onOpenDir: ev => {
        ev.preventDefault();
        selectFile(ev.fullPath);
      },
      onSelectionChanged: icons => {
        if (icons.length !== 1) return;
        let path = icons[0].fullPath;
        let filename = path.split('/').pop();
        nameSpecify.value = filename;
      },
      fullSize: true,
    });
    let iconWrapper = div(
      { w100: true, height: FILE_HEIGHT, top: NAV_HEIGHT },
      icons,
    );
    let nameSpecify = inputText({
      width: '100%',
      value: `${options.initialName || ''}`,
      marginTop: 8,
      onEnter: async v => {
        await selectFile(fs.getAbsolutePath(curDir + '/' + v.trim()));
        nameSpecify.value = '';
      },
    });
    let nameBox = div(
      { w100: true, height: NAME_HEIGHT, top: NAV_HEIGHT + FILE_HEIGHT },
      nameSpecify,
    );
    let outer = div(
      {
        position: 'relative',
        size: ['100%', NAV_HEIGHT + FILE_HEIGHT + NAME_HEIGHT],
        textAlign: 'left',
      },
      topNav,
      iconWrapper,
      nameBox,
    );

    refreshView();

    let prompt = showPrompt(pid, {
      title: isSave ? 'Save File' : 'Open File',
      message: outer,
      height: NAV_HEIGHT + FILE_HEIGHT + NAME_HEIGHT + 60,
      width: Math.min(500, Math.floor(os.Shell.getSize().width * .9)),
      style: 'OKCANCEL',
      okLabelOverride: isSave ? 'Save' : 'Open',
    });

    let result = await prompt.getResult();
    let filePath;
    if (doubleClickedFile) {
      filePath = doubleClickedFile;
    } else {
      if (result !== 'OK') return null;
      if (!nameSpecify.value) return null; // TODO: the OK button should be disabled here
      filePath = doubleClickedFile || fs.getAbsolutePath(curDir + '/' + nameSpecify.value);
    }

    // TODO: this is kind of janky. Should intercept OK button handler instead of re-launching the dialog.
    if (await fs.dirExists(filePath)) {
      return showFileDialog(pid, filePath, type, options);
    }

    let fileExists = await fs.fileExists(filePath);
    if (options.promptOverwrite && fileExists) {
      let overwriteOk = await dialogs.showOverwriteFileConfirm(pid, options.title || "Save Overwrite");
      if (!overwriteOk) {
        return showFileDialog(pid, curDir, type, options);
      }
    }

    let tryAgainPath = null;
    if (isOpen && !fileExists) {
      tryAgainPath = filePath;
    } else {
      let t = fs.getAbsolutePath(filePath + '/..').split('/');
      let parent = t.join('/') || '/';
      if (!await fs.dirExists(parent)) {
        tryAgainPath = parent;
      }
    }

    if (tryAgainPath) {
      let tryAgain = await dialogs.showPathDoesNotExist(pid, options.title || "Error", tryAgainPath);
      if (!tryAgain) return null;
      return showFileDialog(pid, curDir, type, options);
    }

    return filePath;
  };

  let showToBool = async (pid, title, message, style, trueOption, options) => {
    let args = { title, message, style, ...(options || {}) };
    let result = await showPrompt(pid, args).getResult();
    return result === trueOption;
  };
  let showYesNoToBool = async (pid, title, message, options) => showToBool(pid, title, message, 'YESNO', 'YES', options);
  let showOkCancelToBool = async (pid, title, message, options) => showToBool(pid, title, message, 'OKCANCEL', 'OK', options);
  let showOk = async (pid, title, message, options) => showToBool(pid, title, message, 'OK', 'OK', options);

  let showRenameDialog = async (pid, fullPath) => {
    let fs = os.FsRoot;
    let dir = fs.getParent(fullPath);
    let name = fullPath.split('/').pop();
    let errorPanel = div({ color: '#f00', html: '&nbsp;' });
    let hasError = false;
    let showError = (err) => {
      hasError = !!err;
      pr.okayEnabledChanged();
      errorPanel.clear().set(err || { html: '&nbsp;' });
    };
    let activePath = fullPath;
    let inputField = inputText(
      {
        value: name,
        onEnter: () => pr.pushButton('OK'),
      },
      async newName => {
        let newFullPath = FsPathUtil.join(dir, newName);
        if (!FsPathUtil.isValidName(newName)) {
          showError("That is not a valid file name.");
        } else if (await fs.pathExists(newFullPath) && newFullPath !== fullPath) {
          showError("A file with that name already exists.");
        } else {
          activePath = newFullPath;
          showError('');
        }
      }
    );
    let renameUi = div(
      errorPanel,
      inputField,
    );
    let pr = showPrompt(pid, {
      title: "Rename File",
      message: renameUi,
      style: 'OKCANCEL',
      isOkEnabled: () => !hasError,
      onShown: () => {
        inputField.focus();
        let parts = name.split('.');
        let endIndex;
        if (parts.length > 1) {
          parts.pop();
          endIndex = parts.join('.').length;
        } else {
          endIndex = name.length;
        }
        inputField.setSelectionRange(0, endIndex);
      },
    });

    let doRename = 'OK' === await pr.getResult();
    if (doRename) {
      await fs.move(fullPath, activePath);
    }
    return doRename;
  };

  let dialogs = {
    showPrompt,

    showYesNoToBool,
    showOkCancelToBool,
    showOk,

    saveFile: async (pid, dir, options) => showFileDialog(pid, dir, 'SAVE', options),
    openFile: async (pid, dir, options) => showFileDialog(pid, dir, 'OPEN', options),

    showPathDoesNotExist: async (pid, title, dir) => showOkCancelToBool(pid, title, "The path does not exist: " + dir),
    showOverwriteFileConfirm: async (pid, title) => showYesNoToBool(pid, title, "This file already exists. Are you sure you want to overwrite it?"),
    showUnsavedChangesConfirmExit: async (pid, title) => showYesNoToBool(pid, title, "You have unsaved changes. Are you sure you want to exit?"),
    showRename: async (pid, path) => showRenameDialog(pid, path),
  };
  return Object.freeze(dialogs);
};
