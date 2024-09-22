let buildProgramsInstalled = async (os, pid) => {

  let getIconCopy = icon => {
    return Util.copyImage(icon || os.IconStore.getIconByPurpose('EXEC', true));
  };

  let getAllApps = () => {
    let apps = os.ApplicationRegistry.getInstalled();
    apps.sort((a, b) => a.sortKey.localeCompare(b.sortKey));
    return apps;
  };
  let apps = getAllApps();

  let refresh = () => {
    apps = getAllApps();
    appList.refreshItems();
  };

  let appList = ItemList({
    height: 180,
    border: '1px solid #888',
    getItems: () => {
      return [...apps];
    },
    renderItem: (app) => {
      return div(
        { whiteSpace: 'nowrap', padding: 2 },
        getIconCopy(app.icon).set({ width: 16, height: 16 }), ' ',
        span({ bold: true }, app.name), ' ',
        span({ opacity: 0.7 }, app.id)
      );
    },
    getId: (item) => item.id,
    onSelectionChanged: async id => {
      await refreshOptions(id);
    },
  });

  let refreshOptions = async (id) => {

    diskUsage.clear().set({ bold: false }, "Calculating...");
    let appDir = await getAppDataDir(id);

    let total = 0;
    if (appDir) {
      let files = await os.FsRoot.listRecursive(appDir);
      for (let file of files) {
        let { ok, size } = await os.FsRoot.getProps(file);
        if (ok) total += size;
      }
    }

    removeBtn.disabled = !id;
    clearDataBtn.disabled = !total;
    openFolderBtn.disabled = !appDir;

    diskUsage
      .clear()
      .set({ bold: true }, id ? Util.byteSizeToText(total) : "No app selected");
  };

  let removeApp = async (id) => {
    let includeUserData = false;
    let app = await os.ApplicationRegistry.getInfo(id, true);
    let result = await os.Shell.DialogFactory.showYesNoToBool(
      pid,
      "Remove App",
      [
        div(
          { width: '100%', height: 80, position: 'relative' },
          div({ westDock: 100 }, getIconCopy(app.icon).set({ width: 53, height: 64 })),
          div({ eastStretchDock: 100, textAlign: 'left' },
            div("Are you sure you want to remove the following app?"),
            div({ marginTop: 8 }, span({ bold: true }, app.name), ' ', span({ opacity: 0.6 }, id)),
          ),
        ),
        div(
          { marginTop: 15 },
          inputCheckbox(v => { includeUserData = v; }), ' ',
          "Also remove user data and settings"
        )
      ],
    );

    if (!result) return;

    await os.ApplicationRegistry.removeApp(id, includeUserData);
    refresh();
  };

  let getCurrentId = () => appList.getSelectedId();

  let getAppDataDir = async (id) => {
    if (!id) return null;
    let path = '/appdata/' + id;
    return (await os.FsRoot.dirExists(path)) ? path : null;
  };

  let diskUsage = span({ bold: true });

  let removeBtn = button(
    "Remove",
    () => removeApp(getCurrentId()),
  );
  let clearDataBtn = button(
    "Clear Data",
    async () => {
      let id = getCurrentId();
      let appDir = await getAppDataDir(id);
      if (appDir) {
        await os.FsRoot.del(appDir);
        await refreshOptions(id);
      }
    },
  );
  let openFolderBtn = button(
    "OpenSettings Folder",
    async () => {
      let appDir = await getAppDataDir(getCurrentId());
      if (!appDir) {
        return os.Shell.DialogFactory.showOkCancelToBool(pid, TITLE, "There is no stored data for this app.");
      }
      os.ExecutionEngine.launchFile('/system/tools/files', [appDir], appDir);
    }
  );

  return createDetailsPanel(
    "Installed Programs",
    [
      createSettingBox("All installed programs", [
        div(appList),
        div(
          "Settings disk usage: ", diskUsage
        ),
        div(
          removeBtn, ' ',
          clearDataBtn, ' ',
          openFolderBtn,
        ),
      ], true, true)
    ]
  );
};

let buildFileTypes = async (os, pid) => {

  let files = await os.FileActions.getAllFileTypes();

  let icons = {};
  for (let file of files) {
    let ext = file.extension;
    let icon = os.IconStore.getIconByExtension(ext, true);
    icons[ext] = icon;
  }

  let getIconCopy = ext => {
    let icon = icons[ext];
    if (!icon) {
      icon = os.IconStore.getIconByPurpose('FILE', true);
      icons[ext] = icon;
    }
    return Util.copyImage(icon);
  };

  let fileList = ItemList({
    border: '1px solid #888',
    height: 180,
    getItems: () => [...files],
    onSelectionChanged: async () => {
      await refreshAppList();
    },
    renderItem: item => {
      return div(
        { padding: 4, whiteSpace: 'nowrap', overflow: 'hidden' },
        getIconCopy(item.extension).set({ width: 12, height: 12 }),
        ' ',
        span({ bold: true }, item.name),
        ' ',
        span({ opacity: 0.5 }, '.' + item.extension)
      );
    },
    getId: item => item.extension,
  });

  let getAssociatedApps = async ext => os.FileActions.getAppsForExt(ext);

  let refreshAppList = async () => {
    let ext = fileList.getSelectedId();
    if (!ext) {
      appsList.clear().set("Select a file to see which programs are associated with it.");
    } else {
      let apps = await getAssociatedApps(ext);
      if (apps.length) {
        appsList.clear().set(
          div({ marginTop: 10, marginBottom: 5 }, "Apps associated with this type of file extension: "),
          div(
            { border: '1px solid #888', padding: 4 },
            await Promise.all(apps.map(async app => {
              let { isValid, appId } = await os.FsRoot.getExecInfo(app);
              if (isValid && appId) {

                let appInfo = await os.ApplicationRegistry.getInfo(appId, true);
                if (appInfo) {
                  let { icon, name } = appInfo;
                  return div(
                    { whiteSpace: 'nowrap', overflow: 'hidden' },
                    Util.copyImage(icon).set({ width: 24, height: 24 }),
                    ' ',
                    span({ bold: true }, name),
                    ' ',
                    span({ opacity: 0.5 }, app),
                  );
                }
              }
              return div(app, ' ', span({ color: '#f00' }, "Not found!"));
            }))
          ),
        );
      } else {
        appsList.clear().set("There are no apps associated with this file extension.");
      }
      appsList.set(div(
        { fontSize: 8, opacity: 0.8, margin: 4 },
        "To change the associated apps, use the \"Open With...\" context menu option on any file with this extension."
      ));
    }
  };
  let appsList = div("Select a file to see which programs are associated with it.");

  let addBtn = button("Add...");
  let removeBtn = button("Remove...");
  let makePrimaryBtn = button("Make default...");

  return createDetailsPanel(
    "File Types",
    [
      createSettingBox("File extensions", [
        div(
          fileList,
        ),
        div(
          appsList,
        ),
        // div(addBtn, removeBtn, makePrimaryBtn)
      ], true, true),
      // createSettingBox("Register new file type", [
      //   'TODO: this',
      // ], false, true),
    ]
  );
};

let buildProgramsDevSettings = async os => {

  const key = 'devModeRegistryFreeExecution';
  return createDetailsPanel(
    "Developer Settings",
    [
      createSettingBox("Developer Mode", [
        div(
          inputCheckbox(
            { checked: os.Settings.getBool(key) },
            v => {
              os.Settings.set(key, !!v);
            },
          ),
          ' ',
          "Enable execution of programs that aren't installed to the app registry."
        ),
      ], true, true),
    ]
  );
};
