PlexiOS.Util.loadImageB64(PLEXI_IMAGE_B64('tools/plexic/icon.png')).then(icon => {
  PlexiOS.staticAppRegistry.registerAppMetadata('io.plexi.tools.plexic', "Plexi Compile", icon);
});
