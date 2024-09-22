PlexiOS.Util.loadImageB64(PLEXI_IMAGE_B64('tools/youtube/icon.png')).then(icon => {
  PlexiOS.staticAppRegistry.registerAppMetadata('io.plexi.tools.youtube', "YouTube Player", icon);
});
