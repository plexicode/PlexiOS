PlexiOS.Util.loadImageB64(PLEXI_IMAGE_B64('tools/screensaver/icon.png')).then(icon => {
  PlexiOS.staticAppRegistry.registerAppMetadata('io.plexi.tools.screensaver', "Screensaver Runner", icon);
});
