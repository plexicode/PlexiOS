PlexiOS.Util.loadImageB64(PLEXI_IMAGE_B64('tools/imageviewer/icon.png')).then(icon => {
  PlexiOS.staticAppRegistry.registerAppMetadata('io.plexi.tools.imageviewer', "Image Viewer", icon);
});
