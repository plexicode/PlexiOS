PlexiOS.registerJavaScript('image', 'default', async (imgUtil) => {

  let initializeEnvironmentVariables = async () => {
    imgUtil.setEnvironmentVariable('PATH', [
      '/apps',
      '/system/tools',
    ].join(';'));
    imgUtil.setEnvironmentVariable('TMPDIR', '/tmp');
  };

  let initializeFileStructure = async () => {
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
  };

  let createDefaultScreensavers = async () => {
    await imgUtil.makeVirtualJsFile('/system/screensavers/blank.scr', 'screensaver', 'io.plexi.screensaver.blank');
  };

  let createSettingsFile = async () => {
    await imgUtil.makeTextFile('/system/config/settings.json', '{}');
  };

  let installSystemToolsAndTermCommands = async () => {
    let simpleIdToName = {
      'fileprops': ["File Properties", PLEXI_IMAGE_B64('tools/fileprops/icon.png')],
      'files': ["File Browser", PLEXI_IMAGE_B64('tools/files/icon.png'), true, true],
      'openwith': ["Open with...", PLEXI_IMAGE_B64('tools/openwith/icon.png')],
      'plexic': ["Plexi Compile", PLEXI_IMAGE_B64('tools/files/icon.png')],
      'proclist': ["Process List", PLEXI_IMAGE_B64('tools/proclist/icon.png')],
      'screensaver': ["Screensaver", PLEXI_IMAGE_B64('tools/screensaver/icon.png')],
      'settings': ["Settings", PLEXI_IMAGE_B64('tools/settings/icon.png'), true],
      'sleep': ["Sleep", PLEXI_IMAGE_B64('tools/sleep/icon.png')],
      'terminal': ["Terminal", PLEXI_IMAGE_B64('tools/terminal/icon.png'), true, true],
      'themeloader': ["Theme Loader", PLEXI_IMAGE_B64('tools/themeloader/icon.png')],

      // These should not be here. However, this is just where they will live
      // until they get re-written into PlexiScript.
      // Additionally some of these are a bit heavy for their purpose and there
      // should still be a lightweight alternative tool that comes with all
      // PlexiOS instances by default (such as viewing an image or simple plain
      // text editor).
      'solitaire': ["Solitaire", PLEXI_IMAGE_B64('tools/solitaire/icon.png'), true],
      'minesweeper': ["Minesweeper", PLEXI_IMAGE_B64('tools/minesweeper/icon.png'), true],
      'draw': ["Draw", PLEXI_IMAGE_B64('tools/draw/icon.png'), true],
      'imageviewer': ["Image Viewer", PLEXI_IMAGE_B64('tools/imageviewer/icon.png'), true],
      'notepad': ["Notepad", PLEXI_IMAGE_B64('tools/notepad/icon.png'), true],
      'skiflea': ["Ski Flea", PLEXI_IMAGE_B64('tools/skiflea/icon.png'), true],
      'youtube': ["YouTube", PLEXI_IMAGE_B64('tools/youtube/icon.png')],
    };

    let promises = Object.keys(simpleIdToName).map(async id => {
      let [name, iconB64, inLauncher, pinTaskbar] = simpleIdToName[id];
      await imgUtil.installApp('/system/tools/' + id, 'io.plexi.tools.' + id, { name, iconB64, inLauncher: !!inLauncher });
      if (pinTaskbar) await imgUtil.pinToTaskbar('/system/tools/' + id);
    });

    // Install terminal commands.
    for (let t of [...PlexiOS.Util.getTermCmdSet()]) {
      promises.push(imgUtil.installApp('/system/tools/' + t, 'io.plexi.tools.' + t, { name: t }));
    }

    await Promise.all(promises);
  };

  let generateLauncherIconInDefaultTheme = async () => {
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
  };

  // TODO: unless this starts being used in multiple places, just embed these canvas generators into the files app itself.
  let createFilesAppIcons = async () => {
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
  };

  let installThemes = async () => {
    await imgUtil.installTheme('io.plexi.theme.default', "Plexi Default");
  };

  let initializeFileAssociations = async () => {

    // TODO: do not build this unless the file is missing.
    let systemToolEditable = [
      'TXT:T:Text File',
      'JSON:T:JSON File',
      'XML:T:XML File',
      'PX:T:Plexi Source Code',
      'PNG:I:PNG Image',
      'JPG:I:JPEG Image',
      'BMP:I:Bitmap Image',
      'GIF:I:GIF Image',

      // TODO: implement soundplay
      /*'MP3:A:MP3 Audio',
      'OGG:A:Ogg Vorbis Audio',
      'WAV:A:PCM Wave Sound',
      'MID:A:MIDI Song',*/

      // TODO: implement videoplay
      /*'AVI:V:AVI Video',
      'MPG:V:MPEG Video',*/
    ];

    let assoc = [
      { ext: 'SCR', app: '/system/tools/screensaver', name: "Screensaver" },
      { ext: 'THEME', app: '/system/tools/themeloader', name: "Theme" },
      ...systemToolEditable.map(t => {
        let [ext, fmt, name] = t.split(':');
        let app = '/system/tools/' + ({
          T: 'notepad',
          I: 'imageviewer',
          // A: 'soundplay',
          // V: 'videoplay',
        })[fmt];
        return { ext, app, name };
      })
    ];
    let prefix = [];
    let suffix = [];
    appFileExtInfo.filter(a => a.fileExt).forEach(app => {
      let { primary, secondary } = app.fileExt;

      (primary || []).forEach(ext => {
        prefix.push({ ext, name: ext + ' File', app: '/apps/' + app.id });
      });
      (secondary || []).forEach(ext => {
        suffix.push({ ext, name: ext + ' File', app: '/apps/' + app.id });
      });
    });
    let entries = [...prefix, ...assoc, ...suffix ];
    data = { entries };
    await imgUtil.makeTextFile('/home/config/file-ext-apps.json', JSON.stringify(data));
  };

  await initializeEnvironmentVariables();
  await initializeFileStructure();
  await createDefaultScreensavers();
  await createSettingsFile();
  await installSystemToolsAndTermCommands();
  await createFilesAppIcons();
  await generateLauncherIconInDefaultTheme();
  await installThemes();
  await initializeFileAssociations();
});
