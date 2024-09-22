const APP_MAIN = async (os, procInfo, args) => {
  const { pid } = procInfo;

  let onClose = null;
  let promise = new Promise(res => { onClose = res; });

  os.Shell.showWindow(pid, {
    title: os.getName() + " Settings",
    width: 600,
    height: 400,
    destroyProcessUponClose: true,
    onClosed: () => onClose(true),
    onInit: (contentHost) => {
      let locSpan = (...args) => LOC(...[os, ...args]);
      let content = div({
        fullSize: true,
        backgroundColor: '#fff',
        color: '#000',
      });

      let panels = [
        { title: locSpan('HEADER_ACCOUNT') },
        { id: 'ACCT_NAME', option: locSpan('ACCT_NAME_AND_IMAGE'), builder: buildAccountAppearance },
        { id: 'ACCT_PASS', option: locSpan('ACCT_PASS_SEC'), builder: buildAccountSecurity },
        { title: locSpan('HEADER_PROGRAMS') },
        { id: 'PROG_INSTALLED', option: locSpan('PROG_INSTALLED'), builder: buildProgramsInstalled },
        { id: 'FILE_TYPES', option: locSpan('PROG_FILE_TYPES'), builder: buildFileTypes },
        { id: 'PROG_DEV', option: locSpan('PROG_DEV_SETTINGS'), builder: buildProgramsDevSettings },
        { title: locSpan('HEADER_APPEARANCE') },
        { id: 'BACKGROUND', option: locSpan('VIS_BACKGROUND'), builder: buildAppearanceBackground },
        { id: 'SCREENSAVER', option: locSpan('VIS_SCREENSAVER'), builder: buildAppearanceScreensaver },
        { id: 'THEME', option: locSpan('VIS_THEME'), builder: buildAppearanceTheme },
        { id: 'TASKBAR', option: locSpan('VIS_TASKBAR'), builder: buildAppearanceTaskbar },
        { id: 'EFFECTS', option: locSpan('VIS_EFFECTS'), builder: buildAppearanceEffects },
        { title: locSpan('HEADER_LANG_REG') },
        { id: 'LANG', option: locSpan('LANG'), builder: buildLanguage },
        { id: 'DATETIME', option: locSpan('DATE_TIME'), builder: buildClockSettings },
        { title: locSpan('HEADER_SYSTEM') },
        { id: 'ENV_VARS', option: locSpan('SYS_ENV_VAR'), builder: buildEnvVar },
        { id: 'DISK_EXPORT', option: locSpan('SYS_DISK_EXPORT'), builder: buildExportDisk },
        // { id: 'PERMISSIONS', option: locSpan('SYS_PERMISSIONS'), builder: buildPermissions },
      ];

      let loadPanel = async id => {
        let builder = (panels.filter(p => p.id === id)[0] || {}).builder || (() => div('not implemented'));
        let panel = await Promise.resolve(builder(os, pid));
        page.clear().set(panel);
      };

      let nav = div(
        {
          westDock: 200,
          overflowX: 'hidden',
          overflowY: 'auto',
          backgroundColor: BG_COLOR,
        }, panels.map(item => {
          let cell = div(
            { marginBottom: '1px', padding: '8px' }
          );
          if (item.title) {
            cell.set({ bold: true, backgroundColor: '#fff' }, item.title);
          } else {
            cell.set({ cursor: 'pointer' }, item.option);
            cell.addEventListener('mouseover', () => cell.set({ backgroundColor: 'rgba(255, 255, 255, 0.7)' }));
            cell.addEventListener('mouseout', () => cell.set({ backgroundColor: '' }));
            cell.addEventListener('click', () => loadPanel(item.id));
          }
          return cell;
        }));
      let page = div({ eastStretchDock: 200 });
      content.set(nav, page);
      contentHost.append(content);

      if (args[0]) loadPanel(args[0]);
    },
  });
  return promise;
};
