PlexiOS.Util.loadImageB64(PLEXI_IMAGE_B64('tools/terminal/icon.png')).then(icon => {
  PlexiOS.staticAppRegistry.registerAppMetadata('io.plexi.tools.terminal', "Terminal", icon);
});
