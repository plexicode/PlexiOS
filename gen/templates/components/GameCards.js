(async () => {

  const { HtmlUtil, Util } = PlexiOS;

  let CARD_IMAGE_ATLAS = await Util.loadImageB64(PLEXI_IMAGE_B64('resources/cards.png'));

  CARD_IMAGE_ATLAS.style.imageRendering = 'pixelated';

  PlexiOS.HtmlUtil.registerComponent('GameCards', () => {

    const { canvas } = HtmlUtil;

    const CARD_WIDTH = Math.floor(CARD_IMAGE_ATLAS.width / 13); // 71
    const CARD_HEIGHT = Math.floor(CARD_IMAGE_ATLAS.height / 6); // 96

    let getFreshImageBase = () => {
      let img = canvas();
      img.width = CARD_WIDTH;
      img.height = CARD_HEIGHT;
      img.set({ size: [img.width, img.height], imageRendering: 'pixelated' });
      return img;
    };

    let backLookup = {
      texture1: { name: "Basic 1", x: 0, y: 4 },
      texture2: { name: "Basic 2", x: 1, y: 4 },
      fishLight: { name: "Fish (light)", x: 2, y: 4 },
      fishDark: { name: "Fish (dark)", x: 3, y: 4 },
      flowers: { name: "Flowers", x: 5, y: 4 },
      roses: { name: "Roses", x: 9, y: 4 },
      robot: { name: "Robot", x: 6, y: 4, animFrames: [0, 1, 2, 1] },
      shell: { name: "Shell", x: 0, y: 5 },
      castle: { name: "Castle", x: 1, y: 5, animFrames: [0, 1] },
      beach: { name: "Beach", x: 3, y: 5, animFrames: [1, 1, 1, 2, 1, 2, 1, 1, 0, 0, 0, 0] },
      sleeve: { name: "Trick Sleeve", x: 6, y: 5, animFrames: [1, 1, 1, 2, 2, 2, 1, 1, 1, 0, 0, 0] },
    };

    let getChoices = () => Object.keys(backLookup).sort((a, b) => getDeckName(a).localeCompare(getDeckName(b)));
    let getDeckName = id => backLookup[id].name;
    let getBackSample = (id) => {
      let { x, y } = backLookup[id];
      return getImage(x, y);
    }

    let getRandomChoice = () => Util.shuffle(Object.keys(backLookup))[0];

    let getImage = (col, row) => {
      let img = getFreshImageBase();
      let ctx = img.getContext('2d');
      ctx.drawImage(CARD_IMAGE_ATLAS, -CARD_WIDTH * col, -CARD_HEIGHT * row);
      return img;
    };

    let buildBackImages = (pattern) => {
      let { x, y, animFrames } = backLookup[pattern] || backLookup[getRandomChoice()];
      if (!animFrames) animFrames = [0];
      let numMax = Math.max(...animFrames);
      let images = [];
      for (let i = 0; i <= numMax; i++) {
        images.push(getImage(x++, y));
      }
      return {
        regular: images[0],
        animation: animFrames.map(n => images[n]),
      };
    };

    let generateImages = async (optPattern) => {
      let backs = buildBackImages(optPattern);
      let suits = 'SHCD'.split('');
      let nums = 'A23456789XJQK'.split('');
      let arr = [];
      for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 13; x++) {
          let num = nums[x];
          let suit = suits[y];
          arr.push(suit + num, getImage(x, y));
        }
      }
      let output = { backAnim: backs.animation, back: backs.regular };
      for (let i = 0; i < arr.length; i += 2) {
        output[arr[i]] = arr[i + 1];
      }
      return Object.freeze(output);
    };

    return Object.freeze({
      generateImages,
      getChoices,
      getDeckName,
      getBackSample,
      getSize: () => ({ width: CARD_WIDTH, height: CARD_HEIGHT }),
    });
  });
})();
