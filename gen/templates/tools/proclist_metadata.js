PlexiOS.Util.loadImageB64(PLEXI_IMAGE_B64('tools/proclist/icon.png')).then(icon => {
  PlexiOS.staticAppRegistry.registerAppMetadata('io.plexi.tools.proclist', "Process List", icon);
});
