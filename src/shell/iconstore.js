const createIconStore = () => {
  // TODO: #1: move this to the async init
  // TODO: #2: use an atlas instead of B64
  // TODO: #3: default image app icons should be stored in here as well and referred to from the image initializer
  let temp = {};
  temp['.BF'] = PLEXI_IMAGE_B64('resources/icons/ext/bf.png');
  temp['.BMP'] = PLEXI_IMAGE_B64('resources/icons/ext/bmp.png');
  temp['.GIF'] = PLEXI_IMAGE_B64('resources/icons/ext/gif.png');
  temp['.JPG'] = PLEXI_IMAGE_B64('resources/icons/ext/jpeg.png');
  temp['.JPEG'] = temp['.JPG'];
  temp['.JSON'] = PLEXI_IMAGE_B64('resources/icons/ext/json.png');
  temp['.LNK'] = PLEXI_IMAGE_B64('resources/icons/ext/lnk.png');
  temp['.MP3'] = PLEXI_IMAGE_B64('resources/icons/ext/wsz.png');
  temp['.OGG'] = temp['.MP3'];
  temp['.PNG'] = PLEXI_IMAGE_B64('resources/icons/ext/png.png');
  temp['.SCR'] = PLEXI_IMAGE_B64('resources/icons/ext/scr.png');
  temp['.THEME'] = PLEXI_IMAGE_B64('resources/icons/ext/theme.png');
  temp['.TXT'] = PLEXI_IMAGE_B64('resources/icons/ext/txt.png');
  temp['.YT'] = PLEXI_IMAGE_B64('resources/icons/ext/yt.png');
  temp['.WSZ'] = temp['.MP3'];
  temp['.PLS'] = temp['.WSZ'];

  temp.EXEC = PLEXI_IMAGE_B64('resources/icons/ext/exec.png');
  temp.FILE = PLEXI_IMAGE_B64('resources/icons/file.png');
  temp.FOLDER_CLOSED = PLEXI_IMAGE_B64('resources/icons/folder2.png');
  temp.FOLDER_OPEN = PLEXI_IMAGE_B64('resources/icons/folder.png');

  let ICON_DATA = Object.freeze({ ...temp });

  let iconsByExtension = {};
  let iconsByPurpose = {};

  let init = async () => {
    let icons = await Util.loadImageB64Lookup(ICON_DATA);
    Object.values(icons).forEach(icon => {
      let { name, canvas } = icon;
      if (name.startsWith('.')) {
        iconsByExtension[name.substring(1).toUpperCase()] = canvas;
      } else {
        iconsByPurpose[name] = canvas;
      }
    });
  };

  let maybeCopy = (img, directRef) => directRef ? img : Util.copyImage(img);

  let getIconByExtension = (ext, directRef) => {
    ext = (ext.startsWith('.') ? ext.substring(1) : ext).toUpperCase();
    let img = iconsByExtension[ext] || iconsByPurpose.FILE;
    if (!img) return null;
    return maybeCopy(img, directRef);
  };

  let getIconByPurpose = (id, directRef) => {
    id = id.toUpperCase();
    let img = iconsByPurpose[id] || iconsByPurpose.FILE;
    if (!img) return null;
    return maybeCopy(img, directRef);
  };

  let getIconByPath = async (fs, path, directRef) => {
    if (await fs.dirExists(path)) return getIconByPurpose('FOLDER_CLOSED', directRef);
    let { isValid, icon, isPlexiLib } = await fs.getExecInfo(path);
    if (isValid) {
      if (icon) return maybeCopy(icon, directRef);
      return getIconByPurpose(isPlexiLib ? 'FILE' : 'EXEC', directRef); // TODO: library icon
    }
    let name = path.split('/').pop();
    let parts = name.split('.');
    if (parts.length > 1 && parts[0]) {
      return getIconByExtension(parts.pop(), directRef);
    }
    return getIconByPurpose('FILE', directRef);
  };

  let monochromeSymbolFactory = (builder, rgb) => {
    let mruCache = [];
    let buildRaw = (width, height) => {
      let c = document.createElement('canvas');
      c.width = width;
      c.height = height;
      let ctx = c.getContext('2d');
      let clr = `rgb(${rgb.join(',')})`;
      ctx.fillStyle = clr;
      ctx.strokeStyle = clr;
      let gfx = {
        rect: (x, y, w, h) => {
          ctx.fillRect(Math.floor(x * width), Math.floor(y * height), Math.floor(width * w), Math.floor(height * h));
          return gfx;
        },
        line: (x1, y1, x2, y2, thk) => {
          ctx.lineWidth = thk * Math.sqrt(width * height);
          ctx.beginPath();
          ctx.moveTo(x1 * width, y1 * height);
          ctx.lineTo(x2 * width, y2 * height);
          ctx.stroke();
          return gfx;
        },
        triangle: (x1, y1, x2, y2, x3, y3, thk) => {
          if (thk) {
            ctx.lineWidth = thk * Math.sqrt(width * height);
            ctx.beginPath();
            ctx.moveTo(x1 * width, y1 * height);
            ctx.lineTo(x2 * width, y2 * height);
            ctx.lineTo(x3 * width, y3 * height);
            ctx.lineTo(x1 * width, y1 * height);
            ctx.stroke();
          } else {
            ctx.beginPath();
            ctx.moveTo(x1 * width, y1 * height);
            ctx.lineTo(x2 * width, y2 * height);
            ctx.lineTo(x3 * width, y3 * height);
            ctx.fill();
          }
          return gfx;
        },
      };
      builder(gfx);
      return c;
    };

    return (w, h) => {
      let found = null;
      mruCache = mruCache.filter(o => {
        let match = o.w === w && o.h === h;
        if (match) found = o;
        return !match;
      });
      if (!found) {
        found = { w, h, img: buildRaw(w, h) };
      }
      mruCache = [found, ...mruCache.slice(0, 5)];
      return Util.copyImage(found.img);
    };
  };

  return Object.freeze({
    getIconByExtension,
    getIconByPath,
    getIconByPurpose,
    init,
    monochromeSymbolFactory,
  });
};
