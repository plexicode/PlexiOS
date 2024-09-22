PlexiOS.Util.loadImageB64(PLEXI_IMAGE_B64('tools/sleep/icon.png')).then(icon => {
  PlexiOS.staticAppRegistry.registerAppMetadata('io.plexi.tools.sleep', "Sleep", icon);
});
