PlexiOS.Util.loadImageB64(PLEXI_IMAGE_B64('tools/themeloader/icon.png')).then(icon => {
  PlexiOS.staticAppRegistry.registerAppMetadata('io.plexi.tools.themeloader', "Theme Loader", icon);
});
