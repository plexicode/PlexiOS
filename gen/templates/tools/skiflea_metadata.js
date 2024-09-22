PlexiOS.Util.loadImageB64(PLEXI_IMAGE_B64('tools/skiflea/icon.png')).then(icon => {
  PlexiOS.staticAppRegistry.registerAppMetadata('io.plexi.tools.skiflea', "Ski Flea", icon);
});
