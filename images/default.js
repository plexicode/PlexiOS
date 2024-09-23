PlexiOS.registerJavaScript('image', 'default', async (imgUtil) => {

  imgUtil.setEnvironmentVariable('PATH', [
    '/apps',
    '/system/tools',
  ].join(';'));
  imgUtil.setEnvironmentVariable('TMPDIR', '/tmp');

  for (let dir of [
    'appdata',
    'apps',
    'system',
    'system/config',
    'system/libraries',
    'system/res',
    'system/screensavers',
    'system/themes',
    'system/tools',
    'system/wallpapers',
    'home/config',
    'home/desktop',
    'home/documents',
    'tmp',
    'volumes',
  ]) {
    await imgUtil.ensureDirExists(dir);
  }

  await imgUtil.makeVirtualJsFile('/system/screensavers/blank.scr', 'screensaver', 'io.plexi.screensaver.blank');

  await imgUtil.makeTextFile('/system/config/settings.json', '{}');

  await imgUtil.installApp('/system/tools/fileprops', 'io.plexi.tools.fileprops', { name: "File Properties", iconB64: PLEXI_IMAGE_B64('tools/fileprops/icon.png') });
  await imgUtil.installApp('/system/tools/files', 'io.plexi.tools.files', { name: "File Browser", inLauncher: true, iconB64: PLEXI_IMAGE_B64('tools/files/icon.png') });
  await imgUtil.installApp('/system/tools/openwith', 'io.plexi.tools.openwith', { name: "Open with...", iconB64: PLEXI_IMAGE_B64('tools/openwith/icon.png') });
  await imgUtil.installApp('/system/tools/proclist', 'io.plexi.tools.proclist', { name: "Process List", iconB64: PLEXI_IMAGE_B64('tools/proclist/icon.png') });
  await imgUtil.installApp('/system/tools/screensaver', 'io.plexi.tools.screensaver', { name: "Screensaver", iconB64: PLEXI_IMAGE_B64('tools/screensaver/icon.png') });
  await imgUtil.installApp('/system/tools/settings', 'io.plexi.tools.settings', { name: "Settings", inLauncher: true, iconB64: PLEXI_IMAGE_B64('tools/settings/icon.png') });
  await imgUtil.installApp('/system/tools/sleep', 'io.plexi.tools.sleep', { name: "Sleep", iconB64: PLEXI_IMAGE_B64('tools/sleep/icon.png') });
  await imgUtil.installApp('/system/tools/terminal', 'io.plexi.tools.terminal', { name: "Terminal", inLauncher: true, iconB64: PLEXI_IMAGE_B64('tools/terminal/icon.png') });
  await imgUtil.installApp('/system/tools/themeloader', 'io.plexi.tools.themeloader', { name: "Theme Loader", iconB64: PLEXI_IMAGE_B64('tools/themeloader/icon.png') });

  for (let t of 'cat cd chmod cp echo grep head less ls mkdir more mv pwd rm rmdir set tail touch'.split(' ')) {
    await imgUtil.installApp('/system/tools/' + t, 'io.plexi.terminal.' + t, { name: t });
  }

  await imgUtil.pinToTaskbar('/system/tools/files');

  {
    let launcherIcon = PlexiOS.HtmlUtil.canvasOfSize(64, 64);
    let ctx = launcherIcon.getContext('2d');
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.roundRect(0, 0, 64, 64, 6);
    ctx.fill();
    for (let y = 0; y < 3; y++) {
      for (let x = 0; x < 3; x++) {
        let px = 10 + x * 2 * 9;
        let py = 10 + y * 2 * 9;
        ctx.fillStyle = '#fff';
        ctx.fillRect(px, py, 8, 8);
      }
    }
    await imgUtil.makeCanvasBasedImageFile('/system/res/launcher-btn.png', launcherIcon);
  }

  {
    // TODO: unless this starts being used in multiple places, just embed these canvas generators into the files app itself.
    let drawIcons = (cols, count, tileSize, margin) => {
      let canvas = PlexiOS.HtmlUtil.canvasOfSize(64, 64);
      let ctx = canvas.getContext('2d');
      for (let i = 0; i < count; i++) {
        let x = (i % cols) * (tileSize + margin) + margin;
        let y = Math.floor(i / cols) * (tileSize + margin) + margin;
        ctx.fillStyle = '#000';
        ctx.fillRect(x, y, tileSize, tileSize);
        ctx.fillStyle = '#fff';
        ctx.fillRect(x + 1, y + 1, tileSize - 2, tileSize - 2);
      }
      return { canvas, ctx}
    };

    // default icons
    let img = drawIcons(3, 5, 13, 8);
    await imgUtil.makeCanvasBasedImageFile('/system/res/files-tiles.png', img.canvas);

    // details
    img = drawIcons(1, 4, 11, 4);
    img.ctx.fillStyle = '#808080';
    for (let i = 0; i < 4; i++) {
      img.ctx.fillRect(19, 6 + 15 * i, 30, 4);
    }
    await imgUtil.makeCanvasBasedImageFile('/system/res/files-details.png', img.canvas);

    // thumbnails
    img = drawIcons(1, 1, 50, 7);
    let g = img.ctx.createLinearGradient(20, 10, 40, 40);
    g.addColorStop(0, "#32b0e7");
    g.addColorStop(1, "#26a455");
    img.ctx.fillStyle = g;
    img.ctx.fillRect(12, 12, 40, 40);
    await imgUtil.makeCanvasBasedImageFile('/system/res/files-thumbs.png', img.canvas);

  }

  await imgUtil.installTheme('io.plexi.theme.default', "Plexi Default");
});
