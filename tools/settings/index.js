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
      let content = div({
        fullSize: true,
        backgroundColor: '#fff',
        color: '#000',
      });

      let panels = [
        { title: span("Account") },
        { id: 'ACCT_NAME', option: span("Account Name & Image"), builder: buildAccountAppearance },
        { id: 'ACCT_PASS', option: span("Password & Security"), builder: buildAccountSecurity },
        { title: span("Programs") },
        { id: 'PROG_INSTALLED', option: span("Installed"), builder: buildProgramsInstalled },
        { id: 'FILE_TYPES', option: span("File Types"), builder: buildFileTypes },
        { id: 'PROG_DEV', option: span("Developer Settings"), builder: buildProgramsDevSettings },
        { title: span("Appearance") },
        { id: 'BACKGROUND', option: span("Background"), builder: buildAppearanceBackground },
        { id: 'SCREENSAVER', option: span("Screensaver"), builder: buildAppearanceScreensaver },
        { id: 'THEME', option: span("Theme"), builder: buildAppearanceTheme },
        { id: 'TASKBAR', option: span("Taskbar"), builder: buildAppearanceTaskbar },
        { id: 'EFFECTS', option: span("Visual Effects"), builder: buildAppearanceEffects },
        { title: span("Language & Region") },
        { id: 'LANG', option: span("Language"), builder: buildLanguage },
        { id: 'DATETIME', option: span("Date & Time"), builder: buildClockSettings },
        { title: span("System Settings") },
        { id: 'ENV_VARS', option: span("Environment Variables"), builder: buildEnvVar },
        { id: 'DISK_EXPORT', option: span("Export Disk"), builder: buildExportDisk },
        // { id: 'PERMISSIONS', option: span("Permissions"), builder: buildPermissions },
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
