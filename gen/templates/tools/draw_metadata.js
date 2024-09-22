PlexiOS.Util.loadImageB64(PLEXI_IMAGE_B64('tools/draw/icon.png')).then(icon => {
  PlexiOS.staticAppRegistry.registerAppMetadata('io.plexi.tools.draw', "Draw", icon);
});
