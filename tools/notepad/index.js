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
