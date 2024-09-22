let showLauncher = (() => {
  let { div, span } = HtmlUtil;

  let getAppEntry = async (appPath, os) => {
    let fs = os.FsRoot;
    let appInfo = await fs.getExecInfo(appPath);
    if (!appInfo.isValid) return null;
    let { name } = appInfo;
    let iconCanvas = Util.copyImage(appInfo.icon || await os.IconStore.getIconByPath(fs, appPath));

    let output = div(
      {
        margin: 8,
        height: 32,
        position: 'relative',
        onClick: () => {
          os.ExecutionEngine.launchFile(appPath);
          os.Shell.clearModal();
        },
      },
      div(
        { westDock: 32 },
        iconCanvas.set({ size: 32 })
      ),
      div({
        eastStretchDock: 32,
        padding: 4,
      }, name),
    );
    output.addEventListener('mouseover', () => output.set({ backgroundColor: 'rgba(128, 128, 128, 0.2)'}));
    output.addEventListener('mouseout', () => output.set({ backgroundColor: 'rgba(128, 128, 128, 0.0)'}));
    return output;
  };

  return async (os) => {
    let appPaths = await os.LauncherRegistry.getLauncherAppPaths();
    let appsDir = (await os.FsRoot.legacyList('/apps')).map(v => '/apps/' + v);
    appPaths = [...appPaths, ...appsDir];

    let launcher = div(
      {
        size: ['70%', '50%'],
        left: '15%',
        top: '15%',
        position: 'absolute',
        color: '#000',
        onClick: e => e.stopPropagation(),
      },
      os.Themes.buildPanelBackground().set(
        div(
          { position: 'absolute', left: 20, top: 20, right: 20, bottom: 20 },
          div({ northDock: 30 }, "Applications"),
          div(
            { southStretchDock: 30, overflowX: 'hidden', overflowY: 'auto' },
            await Promise.all(appPaths.map(path => getAppEntry(path, os))),
          ),
        ),
      ),
    );

    await os.Shell.setModal(launcher);
  };

})();
