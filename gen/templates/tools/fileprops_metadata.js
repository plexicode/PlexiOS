PlexiOS.Util.loadImageB64(PLEXI_IMAGE_B64('tools/fileprops/icon.png')).then(icon => {
  PlexiOS.staticAppRegistry.registerAppMetadata('io.plexi.tools.fileprops', "Properties", icon);
});
