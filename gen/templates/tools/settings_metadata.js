PlexiOS.Util.loadImageB64(PLEXI_IMAGE_B64('tools/settings/icon.png')).then(icon => {
  PlexiOS.staticAppRegistry.registerAppMetadata('io.plexi.tools.settings', "Settings", icon);
});
