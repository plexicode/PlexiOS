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
