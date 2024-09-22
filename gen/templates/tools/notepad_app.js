(async () => {
const { Util, HtmlUtil } = PlexiOS;
const APP_RAW_IMAGE_DATA = await Util.loadImageB64Lookup({

  'icon.png': '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',
});

let createActions = (os, procInfo, titleSetter, tryCloseWin) => {
  let { pid, cwd } = procInfo;
  let textEditor = null;
  let fs = os.FileSystem(cwd);
  let lastFiredTextChangeValue = '';
  let lastDisplayedTitle = null;
  let dirty = false;
  let filePath = null;

  let unsavedOkayToProceed = async () => {
    return !dirty ||
      await os.Shell.DialogFactory.showYesNoToBool(pid, TITLE, "Current file is unsaved. Are you sure you want to continue?");
  };

  let focus = () => {
    if (textEditor) {
      // While I'm not 100% certain, I believe the issue here is that context menus are being cleared away after
      // a synchronous .focus() is called and thus causes the focus to get stolen again. By yielding trivially to the
      // event loop, the .focus() actually goes through.
      setTimeout(() => textEditor.focus(), 0);
    }
  };

  let currentSize = 11;
  let setFontSize = sz => {
    sz = Math.max(7, Math.min(72, sz));
    currentSize = sz;
    textEditor.setSize(sz);
  };

  let actions = {
    setEditor: t => { textEditor = t; },
    isDirty: () => dirty,
    makeDirty: () => { dirty = true; },
    clearDirty: () => { dirty = false; },
    isTextSelected: () => !!textEditor.getSelection().length,
    invalidateTitle: () => {
      let name = (filePath || '').split('/').pop() || 'Untitled';
      let title = TITLE + ": " + name + (dirty ? "*" : "");
      if (lastDisplayedTitle !== title) {
        lastDisplayedTitle = title;
        titleSetter(title);
      }
    },
    exit: () => {
      tryCloseWin();
    },
    save: () => {
      let text = textEditor.getValue();
      if (!filePath) return actions.saveAs()
      fs.fileWriteText(filePath, text);
      actions.clearDirty();
      actions.invalidateTitle();
      focus();
    },
    saveAs: async () => {
      let text = textEditor.getValue();
      let dir = filePath
        ? fs.getAbsolutePath(filePath + '/..')
        : procInfo.cwd;
      let targetFile = await os.Shell.DialogFactory.saveFile(pid, dir, { promptOverwrite: true, title: TITLE });
      if (!targetFile) return;
      let result = await fs.fileWriteText(targetFile, text);
      if (!result.ok) {
        os.Shell.DialogFactory.showPathDoesNotExist(pid, TITLE, targetFile);
        return;
      }
      console.log(result);
      actions.clearDirty();
      filePath = targetFile;
      actions.invalidateTitle();
      focus();
    },
    open: async () => {
      if (!await unsavedOkayToProceed()) return;
      let path = await os.Shell.DialogFactory.openFile(pid, procInfo.cwd, { title: TITLE });
      if (path) return actions.doOpen(path);
      focus();
    },
    doOpen: async (path) => {
      let data = await fs.fileReadText(path);
      if (!data.ok) {
        return os.Shell.DialogFactory.showOkCancelToBool(pid, TITLE, "File could not be opened");
      }
      let text = data.text;
      filePath = path;
      textEditor.setValue(text);
      textEditor.setSelection(0);
      lastFiredTextChangeValue = text;
      actions.clearDirty();
      actions.invalidateTitle();
      focus();
    },
    onTextChangedWithDuplicates: (text) => {
      if (text !== lastFiredTextChangeValue) {
        lastFiredTextChangeValue = text;
        actions.makeDirty();
        actions.invalidateTitle();
      }
    },
    newFile: async () => {
      if (!await unsavedOkayToProceed()) return;
      filePath = null;
      textEditor.setValue('');
      actions.clearDirty();
      actions.invalidateTitle();
      focus();
    },
    cut: () => actions.copyImpl(true),
    copy: () => actions.copyImpl(),
    copyImpl: async (deleteSelection) => {
      let text = textSnipSnip(textEditor, null, !deleteSelection);
      if (text) await os.Clipboard.copyText(text);
      focus();
    },
    paste: async () => {
      let data = await os.Clipboard.paste('TEXT');
      if (data.type === 'TEXT') {
        textSnipSnip(textEditor, data.text);
      }
      focus();
    },
    undo: () => {
      throw new Error();
    },
    redo: () => {
      throw new Error();
    },
    selectAll: () => {
      textEditor.setSelection(0, textEditor.getValue().length);
      focus();
    },
    doDelete: () => {
      textSnipSnip(textEditor, '', false);
      focus();
    },
    indent: () => {
      let sel = textEditor.getSelection();
      if (sel.length) {
        let { left, center, right } = getLineSelections();
        center = center.split('\n').map(line => '\t' + line).join('\n');
        textEditor.setValue(left + center + right);
        textEditor.setSelection(left.length, left.length + center.length);
      } else {
        textSnipSnip(textEditor, "\t", false);
      }
      focus();
    },
    unindent: () => {
      let { left, center, right } = getLineSelections();
      center = center
        .split('\n')
        .map(line => {
          if (!line.length) return '';
          if (line[0] === '\t') return line.substring(1);
          if (line.startsWith('  ')) return line.substring(2);
          return line;
        })
        .join('\n');
      textEditor.setValue(left + center + right);
      textEditor.setSelection(left.length, left.length + center.length);
      focus();
    },
    zoomIn: () => { setFontSize(currentSize + 1); },
    zoomOut: () => { setFontSize(currentSize - 1); },
    defaultZoom: () => { setFontSize(11); },
  };

  let getLineSelections = () => {
    let sel = textEditor.getSelection();
    let text = textEditor.getValue();
    let left = text.substring(0, sel.start);
    let center = text.substring(sel.start, sel.end);
    let right = text.substring(sel.end);
    let leftParts = left.split('\n');
    let rightParts = right.split('\n');

    if (leftParts.length === 1) {
      left = '';
      center = leftParts[0] + center;
    } else {
      center = leftParts.pop() + center;
      left = leftParts.join('\n') + '\n';
    }

    if (rightParts.length === 1) {
      right = '';
      center += rightParts[0];
    } else {
      center += rightParts[0];
      right = '\n' + rightParts.slice(1).join('\n');
    }
    return { left, center, right };
  };

  return actions;
};

// remove-and/or-return and/or inserts text at the current editor selection range.
// It's like a mix of splice or substring, I guess. I couldn't think of a better name.
let textSnipSnip = (editor, newText, actuallyLetsKeepIt) => {
  let { start, end } = editor.getSelection();
  let allText = editor.getValue();
  let selText = allText.substring(start, end);
  if (actuallyLetsKeepIt) return selText;

  let left = allText.substring(0, start);
  let right = allText.substring(end);
  if (newText) {
    left += newText;
  }
  editor.setValue(left + right);
  editor.setSelection(left.length);
  return selText;
};
const TITLE = "Notepad";

const APP_MAIN = async (os, procInfo, args) => {

  const { TextEditor } = await HtmlUtil.loadComponents('TextEditor');
  const { pid } = procInfo;

  let onClose = null;
  let promise = new Promise(res => { onClose = res; });
  let initialFileToLoad = args[0];
  let actions = null;

  os.Shell.showWindow(pid, {
    title: TITLE,
    width: 400,
    height: 300,
    destroyProcessUponClose: true,
    menuBuilder: idChain => getMenu(idChain.join('|'), os, actions),
    onClosing: async () => {
      if (actions.isDirty()) {
        let sure = await os.Shell.DialogFactory.showUnsavedChangesConfirmExit(pid, TITLE);
        return !sure;
      }
      return false;
    },
    onInit: (contentHost, winData) => {

      actions = createActions(os, procInfo, winData.setTitle, winData.closeHandler);

      winData.shortcutKeyRouter
        .addKey('F2', () => actions.newFile())
        .addKey('CTRL+O', () => actions.open())
        .addKey('CTRL+S', () => actions.save())
        .addKey('CTRL+SHIFT+S', () => actions.saveAs())
        .addKey('CTRL+A', () => actions.selectAll())
        .addKey('CTRL+U', () => actions.toggleWordWrap())
        .addKey('CTRL+X', () => actions.cut())
        .addKey('CTRL+C', () => actions.copy())
        .addKey('CTRL+V', () => actions.paste())
        .addKey('CTRL+G', () => actions.goToLine())
        .addKey('CTRL+H', () => actions.replace())
        .addKey('CTRL+L', () => actions.toggleLineNumbers())
        .addKey('CTRL+E', () => actions.toggleStatusBar())
        .addKey('CTRL+Z', () => actions.undo())
        .addKey('CTRL+Y', () => actions.redo())
        .addKey('CTRL+SHIFT+Z', () => actions.redo())
        .addKey('TAB', () => actions.indent())
        .addKey('SHIFT+TAB', () => actions.unindent())
        .addKey('CTRL+F', () => actions.find())
        .addKey('CTRL+PLUS', () => actions.zoomIn())
        .addKey('CTRL+MINUS', () => actions.zoomOut())
        .addKey('CTRL+0', () => actions.defaultZoom())
        .addKey('F3', () => actions.findNext())
        .addKey('CTRL+SHIFT+C', () => actions.showWordCount())
        .addKey('SHIFT+F3', () => actions.findPrevious());

      let textEditorElement = TextEditor(
        {
          os,
          fullSize: true,
          shortcutKeys: winData.shortcutKeyRouter,
          isMonospace: true,
          lineHeight: '180%',
          innerPadding: 8,
          onValueChanged: txt => actions.onTextChangedWithDuplicates(txt),
          onContextMenu: idChain => editorContextMenu(idChain.join('|'), os, actions),
        },
      );

      actions.setEditor(textEditorElement);
      contentHost.append(textEditorElement);
      if (initialFileToLoad) actions.doOpen(initialFileToLoad);
      actions.invalidateTitle();
    },
  });

  return promise;
};
// returns a list of menu item objects
let getMenu = (id, os, actions) => {

  let {
    createCommand, createMenu, createMenuItem, createMenuSep, MENU_CTRL_CMD, MENU_CTRL, MENU_SHIFT, MENU_ALT
  } = os.Shell.MenuBuilder;

  switch (id) {
    case '':
      return createMenu(
        createMenuItem('file', '_File'),
        createMenuItem('edit', '_Edit'),
        createMenuItem('view', '_View'),
      );
    case 'file':
      return createMenu(
        createMenuItem('new', '_New').withShortcut(MENU_CTRL_CMD, 'N'),
        createMenuItem('open', '_Open').withShortcut(MENU_CTRL_CMD, 'O'),
        createMenuItem('save', '_Save').withShortcut(MENU_CTRL_CMD, 'S'),
        createMenuItem('saveas', 'Save _As').withShortcut(MENU_CTRL_CMD, MENU_SHIFT, 'S'),
        createMenuSep(),
        createMenuItem('exit', 'E_xit').withShortcut(MENU_CTRL_CMD, 'W'),
      );
    case 'edit':
      return createMenu(
        createMenuItem('cut', 'Cu_t').withShortcut(MENU_CTRL_CMD, 'X'),
        createMenuItem('copy', '_Copy').withShortcut(MENU_CTRL_CMD, 'C'),
        createMenuItem('paste', '_Paste').withShortcut(MENU_CTRL_CMD, 'V'),
        createMenuSep(),
        createMenuItem('selectall', '_Select All').withShortcut(MENU_CTRL_CMD, 'A'),
      );
    case 'view':
      return createMenu(
        //createMenuItem('font', '_Font').disabled(),
        //createMenuSep(),
        createMenuItem('zoomdef', 'Default _Zoom').withShortcut(MENU_CTRL_CMD, '0'),
        createMenuItem('zoomin', 'Zoom _In').withShortcut(MENU_CTRL_CMD, '+'),
        createMenuItem('zoomout', 'Zoom _Out').withShortcut(MENU_CTRL_CMD, '-')
      );

    case 'file|new': return createCommand(() => actions.newFile());
    case 'file|open': return createCommand(() => actions.open());
    case 'file|save': return createCommand(() => actions.save());
    case 'file|saveas': return createCommand(() => actions.saveAs());
    case 'file|exit': return createCommand(() => actions.exit());
    case 'edit|cut': return createCommand(() => actions.cut());
    case 'edit|copy': return createCommand(() => actions.copy());
    case 'edit|paste': return createCommand(() => actions.paste());
    case 'edit|selectall': return createCommand(() => actions.selectAll());
    case 'view|font': return createCommand(() => actions.changeFont());
    case 'view|zoomdef': return createCommand(() => actions.defaultZoom());
    case 'view|zoomin': return createCommand(() => actions.zoomIn());
    case 'view|zoomout': return createCommand(() => actions.zoomOut());

    default:
      throw new Error("Not implemented: " + id);
  }
};

let editorContextMenu = (id, os, actions) => {

  let {
    createCommand, createMenu, createMenuItem, createMenuSep, MENU_CTRL_CMD, MENU_CTRL, MENU_SHIFT, MENU_ALT
  } = os.Shell.MenuBuilder;

  switch (id) {
    case '':
      {
        let hasSelection = actions.isTextSelected();
        let noSelection = !hasSelection;
        return createMenu([
          createMenuItem('undo', "Undo"),
          createMenuItem('redo', "Redo"),
          createMenuSep(),
          noSelection ? null : createMenuItem('cut', "Cut"),
          noSelection ? null : createMenuItem('copy', "Copy"),
          createMenuItem('paste', "Paste"),
          noSelection ? null : createMenuItem('delete', "Delete"),

        ]);
      }
    case 'undo': return createCommand(() => actions.undo());
    case 'redo': return createCommand(() => actions.redo());
    case 'cut': return createCommand(() => actions.cut());
    case 'copy': return createCommand(() => actions.copy());
    case 'paste': return createCommand(() => actions.paste());
    case 'delete': return createCommand(() => actions.doDelete());
    default: return createCommand(() => console.log("WAT", id));
  }
};
PlexiOS.registerJavaScript('app', 'io.plexi.tools.notepad', APP_MAIN);
})();
