PlexiOS.Util.loadImageB64(PLEXI_IMAGE_B64('tools/solitaire/icon.png')).then(icon => {
  PlexiOS.staticAppRegistry.registerAppMetadata('io.plexi.tools.solitaire', "Solitaire", icon);
});
