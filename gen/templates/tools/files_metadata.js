PlexiOS.Util.loadImageB64(PLEXI_IMAGE_B64('tools/files/icon.png')).then(icon => {
  PlexiOS.staticAppRegistry.registerAppMetadata('io.plexi.tools.files', "Files", icon);
});
