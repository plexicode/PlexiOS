const TITLE = "Theme Loader";

const APP_MAIN = async (os, procInfo, args) => {
  const { pid } = procInfo;

  let fs = os.FileSystem(procInfo.cwd);
  let themeData = await fs.getVirtualJsInfo(args[0] || '');
  if (!themeData.isValid || themeData.category !== 'theme') {
    await os.Shell.DialogFactory.showOkCancelToBool(pid, TITLE, "The given path does not exist or is not a valid theme file.");
    return;
  }

  await os.Themes.setActiveTheme(themeData.id);
};
