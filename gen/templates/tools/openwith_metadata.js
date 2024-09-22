PlexiOS.Util.loadImageB64(PLEXI_IMAGE_B64('tools/openwith/icon.png')).then(icon => {
  PlexiOS.staticAppRegistry.registerAppMetadata('io.plexi.tools.openwith', "Open with...", icon);
});
