PlexiOS.registerJavaScript('image', 'devbasic', async (imgUtil) => {

    // Put an image on the desktop
    let instr = ['W,300','H,300'];
    for (let i = 0; i < 100; i++) {
      instr.push(['R', i * 3, 0, 4, 300, 0, Math.floor(i * 128 / 100), i * 255 / 100].join(','));
    }
    await imgUtil.drawImageFile('/home/desktop/test.png', instr.join('|'));

});
