let createClipboard = () => {

  let copyText = async (str, optTypeOverride) => {
    let textType = 'text/plain';
    let type = optTypeOverride || textType;
    let blob = new Blob([`${str}`.toWellFormed()], { type });
    await copyBlob(blob, type);
  };
  let copyImage = async (img, x, y, width, height) => {
    const type = 'image/png';
    let dataUri;
    if (x == undefined || (x === 0 && y === 0 && width === img.width && height === img.height)) {
      dataUri = img.toDataURL(type);
    } else {
      let canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(img, -x, -y);
      dataUri = img.toDataURL(type);
    }
    let res = await fetch(dataUri);
    await copyBlob(await res.blob(), type);
  };
  let destructionId = 1;
  let copyFiles = async (paths, isCut) => {
    if (!paths.length) return;
    await copyText(JSON.stringify({ isCut: !!isCut, paths, cutDestructiveId: destructionId++ }), 'web plexisys/files');
  };

  let copyBlob = async (blob, type) => {
    let item = {};
    item[type] = blob;
    await navigator.clipboard.write([new ClipboardItem(item)]);
  };

  let preferredTypeOrder = [
    'web plexisys/files',
    'image/png',
    'image/jpeg',
    'image/jpg',
    'text/plain',
  ];

  let readTextFromBlob = async (blob) => {
    return new Promise(result => {
      let reader = new FileReader();
      reader.addEventListener('loadend', e => {
        result(e.target.result);
      });
      reader.readAsText(blob);
    });
  };

  let lastDestructionPerformed = null;
  let pasteImpl = async () => {
    let items = await navigator.clipboard.read();
    let pasteData = await Promise.all([...items].map(async item => {
      for (let type of preferredTypeOrder) {
        if (item.types.includes(type)) {
          let rootType = type.split('/')[0];
          const blob = await item.getType(type);
          switch (rootType) {
            case 'web plexisys':
              switch (type) {
                case 'web plexisys/files':
                  {
                    let fileData = JSON.parse(await readTextFromBlob(blob));
                    if (fileData.isCut && lastDestructionPerformed === fileData.cutDestructiveId) {
                      return { type: 'NONE' }; // the cut has already been performed. Ignore this paste payload.
                    }
                    lastDestructionPerformed = fileData.cutDestructiveId;
                    return {
                      type: 'FILES',
                      isCut: !!fileData.isCut,
                      paths: [...fileData.paths],
                    };
                  }
              }
              throw new Error();
            case 'image':
              let dataUri = URL.createObjectURL(blob);
              return { type: 'IMAGE', image: Util.loadImageUri(dataUri) };
            case 'text':
              return { type: 'TEXT', text: await readTextFromBlob(blob) };
          }
        }
      }
      return null;
    }));

    return pasteData.filter(Util.identity);
  };

  let paste = async (optType) => {
    let items = await pasteImpl();
    if (optType) items = items.filter(t => t.type === optType.toUpperCase());
    return items[0] || { type: 'NONE' };
  };

  return Object.freeze({
    copyText,
    copyImage,
    copyFiles,
    paste,
  });
};
