PlexiOS.Util.loadImageB64(PLEXI_IMAGE_B64('tools/notepad/icon.png')).then(icon => {
  PlexiOS.staticAppRegistry.registerAppMetadata('io.plexi.tools.notepad', "Notepad", icon);
});
