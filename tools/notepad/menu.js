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
