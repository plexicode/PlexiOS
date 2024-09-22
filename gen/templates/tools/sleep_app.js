(async () => {
const { Util, HtmlUtil } = PlexiOS;
const APP_RAW_IMAGE_DATA = await Util.loadImageB64Lookup({

  'icon.png': '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',
});

const APP_MAIN = async (os, procInfo, args) => {
  let seconds = parseFloat(args[0]);
  if (isNaN(seconds) || seconds < 0) seconds = 0;
  return new Promise(r => {
    setTimeout(() => r(true), Math.floor(seconds * 1000 + .5));
  });
};
PlexiOS.registerJavaScript('app', 'io.plexi.tools.sleep', APP_MAIN);
})();