PlexiOS.Util.loadImageB64(PLEXI_IMAGE_B64('tools/minesweeper/icon.png')).then(icon => {
  PlexiOS.staticAppRegistry.registerAppMetadata('io.plexi.tools.minesweeper', "Minesweeper", icon);
});
