PlexiOS.Util.loadImageB64(PLEXI_IMAGE_B64('tools/vislog/icon.png')).then(icon => {
  PlexiOS.staticAppRegistry.registerAppMetadata('io.plexi.tools.vislog', "Properties", icon);
});
