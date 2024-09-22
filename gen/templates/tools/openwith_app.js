(async () => {
const { Util, HtmlUtil } = PlexiOS;
const APP_RAW_IMAGE_DATA = await Util.loadImageB64Lookup({

  'icon.png': 'iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAALFSURBVHhe7ZrPixJhGMcfNSsVRDA2VHTZiJAiSFovtSKedu/9AXYKOu8hCjpsHups0HUvnjwLol46RAcvScQiHVSQdf0BQqhsxMb0PK+vSx0q3lFnHef5wGee951ZmJkvOu+7zgsMwzAMwzArik3WpaFygkvoA/QeuoleQ6+jV9BFQ9d1B72KvkDfoktBJYA36LNpE8DhcIDf7weXyyX3LJatrS04OjqCfr9PXTr3c2pcJIeoVqlUtG63q00mE23ZJJNJjc4pfYVeKCIAI4nH41owGNQSicQshNd0IReF4QF4PB5tb29PfNpSqdQshHeoE10IdllXjpOTE8Abh2g0Cm63GwqFAuzu7tKhp2gVvU2deVnZANrttqjhcFhUCqFYLEImkwGbzUYj0Sf0kTg4BysbQD6fF3U4HEKr1RLW63XY2dmB/f19OnQZfUINozD0GVAul7VAIDD73v/Nn+hcqMwDKIDHeG3TngGMRiPI5XLQ6/VE3+l0QigUgo2NDchms1AqlWj30meLMwwfBf5FOp2efQrmQuUZ8I02cma2NqgEIB7LnU5HdNYFlQDOZF0rVnYY/B92+/ml03CoG9MGQKOBJCCrLkwbAP07vghMG8Ci4ABktSwcgKyWhQOQ1bJwALJaFg5AVsvCAchqWTgAWS0LByCrZVEJYESbwWAgOuuCSgAt2hwfH4vOuqASwNzv4VYR0z4DfvtZnBZv6ca0AUQiEdmCG7LqwrQBxGIx2YL7surCtAFsbtJSRYE1X4z4fD7wer3UvCl26MQ0AYzH4/OlMmS1WoVgMEiHbok/0InK6ook+v7g4AC2t7ehVqtBo9EQqzmbzSacnp6KVV1nZ4a/RP6C3p021VEJ4CH6Ydr8gyb6FaWVE8ucK3xHu9OmgGamDfQjqnvVhkoA9Br6JUoXQjf9GaUb/4EyDMMwDMMw5gLgF9d836rgMKUqAAAAAElFTkSuQmCC',
});

const TITLE = "Open with...";

const APP_MAIN = async (os, procInfo, args) => {
  const { button, div, inputCheckbox, span } = HtmlUtil;
  const { ItemList } = HtmlUtil.Components;
  const { pid } = procInfo;

  let path = args[0] || '';
  if (!path) return;

  let fs = os.FileSystem(procInfo.cwd);
  let isFile = await fs.fileExists(path);
  if (!isFile) {
    await os.Shell.DialogFactory.showPathDoesNotExist(pid, TITLE, path);
    return;
  }
  let absPath = fs.getAbsolutePath(path);

  let showErr = async msg => {
    await os.Shell.DialogFactory.showOkCancelToBool(pid, TITLE, msg);
  };

  let parts = absPath.split('/').pop().split('.');
  let ext = parts.length > 1 ? parts.pop() : null;
  let execInfo = await fs.getExecInfo(absPath);
  if (execInfo.isValid) {
    // This should probably be toggleable by developer mode.
    await showErr("This file is executable and cannot be opened by other apps.");
    return;
  }

  let isLinkFile = false; // TODO: links
  if (isLinkFile) {
    await showErr("This is a file link and cannot be opened by other apps.");
    return;
  }

  let isGuess = false;
  let extensions;
  if (!ext) {
    isGuess = true;
    extensions = ['txt'];
  } else {
    extensions = [ext];
  }

  // Create two tiers of app choices based on the extensions searched:
  // Preferred and secondary.
  let preferredApps = [];
  let secondaryChoices = [];
  for (let extensionGuess of extensions) {
    let fileInfo = await os.FileActions.getFileInfo(extensionGuess);
    if (fileInfo) {
      if (fileInfo.defaultApp) preferredApps.push(fileInfo.defaultApp);
      secondaryChoices.push(...fileInfo.paths);
    }
  }

  // Join these lists together in order and then remove duplicates.
  let allApps = new Set();
  let appPathList = [...preferredApps, ...secondaryChoices]
    .filter(path => {
      if (allApps.has(path)) return false;
      allApps.add(path);
      return true;
    });
  if (!appPathList.length) appPathList.push('/apps/notepad'); // at least give 'em something

  let pathToAppEntry = async path => {
    let { isValid, icon, appId, name } = await fs.getExecInfo(path);
    return isValid
      ? { path, id: appId, name, icon, inFileActionRegistry: !isGuess }
      : null;
  };

  // Verify the app exists and get its metadata from the registry.
  let appList = (await Promise.all(appPathList.map(pathToAppEntry))).filter(Util.identity);

  let browseForExecutable = async () => {
    let dir = '/apps';
    while (true) {
      let path = await os.Shell.DialogFactory.openFile(pid, dir, { title: 'Find App' });
      if (!path) return null;
      let info = await fs.getExecInfo(path);
      if (info.isValid) {
        return path;
      }
      let keepTrying = await os.Shell.DialogFactory.showOkCancelToBool(pid, "Error", "This is not a valid executable file.");
      if (!keepTrying) return null;
      dir = fs.getParent(path);
    }
  };

  await os.Shell.showWindow(pid, {
    title: TITLE,
    innerWidth: 250,
    innerHeight: 350,
    onInit: (contentHost, winData) => {

      let alwaysUse = false;

      let itemList = ItemList({
        border: '1px solid #888',
        position: 'absolute',
        left: 4, top: 4, bottom: 4, right: 4,
        getItems: () => appList,
        getId: v => v.path,
        renderItem: item => {
          return div(
            { fontSize: 10, padding: 4, overflow: 'hidden', whiteSpace: 'nowrap' },
            Util.copyImage(item.icon).set({ size: 16 }), ' ',
            span({ bold: true }, item.name), ' ',
            span({ opacity: 0.5 }, item.id)
          );
        },
        onSelectionChanged: () => {
          refreshButtons()
        },
      });

      let okBtn = button("OK", async () => {
        let path = itemList.getSelectedId();
        if (alwaysUse && ext) {
          let item = appList.filter(a => a.path === path)[0];
          if (item) {
            let addNewAction = false;
            if (item.inFileActionRegistry) {
              let success = await os.FileActions.promoteActionToDefault(ext, path);
              addNewAction = !success;
            }

            if (addNewAction) {
              let name = await os.FileActions.getReasonableNameForExt(ext);
              await os.FileActions.addFileAssociation(ext, name, path, true);
            }
          }
        }
        os.ExecutionEngine.launchFile(path, [absPath], procInfo.cwd);
        winData.closeHandler();
      });

      let refreshButtons = () => {
        let hasSelection = !!itemList.getSelectedId();
        okBtn.disabled = !hasSelection;
      };

      refreshButtons();

      let content = div(
        {
          fullSize: true,
          backgroundColor: '#fff',
          color: '#000',
          overflow: 'hidden',
        },
        div(
          { northDock: 40 },
          div(
            { fontSize: 9, margin: 4 },
            "Which app would you like to open this file with?"
          )
        ),
        div(
          { southStretchDock: 40 },
          div(
            { northStretchDock: 80 },
            itemList,
          ),
          div(
            { southDock: 80 },
            div(
              { fontSize: 9, margin: 4 },
              ext
                ? div(
                    inputCheckbox(v => { alwaysUse = v; }), ' ',
                    "Always use this app to open files with this extension: ",
                    span({ bold: true }, '.' + ext.toLowerCase())
                  )
                : null,
              isGuess
                ? div("There is no file extension. The above applications may not work.")
                : null,
            ),
            div(
              { textAlign: 'center' },
              okBtn, ' ',
              button("Cancel", () => { winData.closeHandler() }), ' ',
              button("Browse...", async () => {
                let exec = await browseForExecutable();
                if (!exec) return;
                appList = [await pathToAppEntry(exec), ...appList.filter(a => a.path !== exec)];
                itemList.refreshItems();
              }),
            )
          )
        )
      );

      contentHost.append(content);
    },
  });
};
PlexiOS.registerJavaScript('app', 'io.plexi.tools.openwith', APP_MAIN);
})();
