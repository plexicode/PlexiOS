(async () => {
const { Util, HtmlUtil } = PlexiOS;
const APP_RAW_IMAGE_DATA = await Util.loadImageB64Lookup({

  'icon.png': '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',
});

const TITLE = "Properties";

let { div, inputText, span } = HtmlUtil;

let getErrorInfo = () => ({ err: true });

let getDirectoryInfo = async (os, path) => {
  return {
    isDirectory: true,
    size: 0, // TODO: calculate directory size
    name: path === '/' ? '/' : path.split('/').pop(),
  };
};

let getImageInfo = async (os, path) => {
  let { ok, img, metadata } = await os.FsRoot.fileReadImage(path, true);
  if (!ok) return getErrorInfo();
  return {
    isImage: true,
    canvas: img,
    dimensions: {
      width: img.width,
      height: img.height,
    },
    metadata: metadata || null,
  };
};

let getAudioInfo = async (os, path) => {
  return { isAudio: true };
};
let getGeneralInfo = async (os, path) => {
  return {};
};

let getProperties = async (os, path) => {
  let { found, isDir, size, ext, name } = await os.FsRoot.getFileProperties(path);
  if (!found) return getErrorInfo();
  let data = await (async () => {
    if (isDir) return getDirectoryInfo(os, path);
    let execInfo = await os.FsRoot.getExecInfo(path);
    if (execInfo.isValid) {
      return {
        isExecutable: true,
        appId: execInfo.appId,
        icon: execInfo.icon,
        appName: execInfo.name,
      };
    }
    switch (ext || '') {
      case 'PNG':
      case 'JPG':
      case 'JPEG':
      case 'GIF':
      case 'BMP':
        return getImageInfo(os, path);

      case 'WAV':
      case 'MP3':
      case 'OGG':
        return getAudioInfo(os, path);

      default:
        return getGeneralInfo(os, path);
    }
  })();

  if (data.err) return data;
  let icon = data.icon
  icon = icon || await os.IconStore.getIconByPath(os.FsRoot, path, true);
  if (!icon) return getErrorInfo();

  let typeName = ext ? await os.FileActions.getReasonableNameForExt(ext) : 'File';

  return {
    ...data,
    path,
    icon,
    isDir,
    typeName,
    ext,
    size,
    name,
  };
};

let renderProps = props => {
  let spacer = { margin: 4, marginBottom: 10 };
  return div(
    { position: 'relative', spacer },
    div(
      { position: 'relative', height: 80, width: '100%' },
      div(
        { westDock: 80 }, Util.copyImage(props.icon).set({ position: 'relative', left: 8, top: 8, width: 64, height: 64 }),
      ),
      div(
        { eastStretchDock: 80, fontSize: 12 },
        div({ position: 'relative', top: 16 },
          div({ bold: true }, props.name),
          div({ opacity: 0.5 }, props.isDir ? "Directory" : props.typeName)
        )
      ),
    ),
    div(
      spacer,
      "Full Path: ", div(inputText({ width: '100%', value: props.path, readOnly: true })),
    ),
    div(
      spacer,
      props.isDir
        ? ["Directory size: ", span({ bold: true }, "Calculating...")]
        : [
          "File Size: ",
          span({ bold: true }, Util.byteSizeToText(props.size))
          ]
    ),
    !props.isExecutable ? null : [
      div(
        spacer,
        "App ID: ",
        span({ bold: true }, props.appId))
    ],
    !props.isImage ? null : [
      div(
        spacer,
        "Dimensions: ",
        span({ bold: true }, props.dimensions.width + ''), span({ html: ' &times; ' }), span({ bold: true }, props.dimensions.height + '')),
    ],
  );
};

const APP_MAIN = async (os, procInfo, args) => {
  const { div, span } = HtmlUtil;
  const { pid } = procInfo;

  let path = args[0] || '';
  if (!path) return;

  let absPath = os.FileSystem(procInfo.cwd).getAbsolutePath(path);

  let props = await getProperties(os, absPath);

  if (props.err) {
    await os.Shell.DialogFactory.showPathDoesNotExist(pid, TITLE, absPath);
    return;
  }

  await os.Shell.showWindow(pid, {
    title: TITLE,
    innerWidth: 250,
    innerHeight: 380,
    destroyProcessUponClose: true,
    onInit: (contentHost) => {
      let content = div(
        {
          fullSize: true,
          backgroundColor: '#fff',
          color: '#000',
          overflow: 'hidden',
        },
        renderProps(props),
      );

      contentHost.append(content);
    },
  });
};
PlexiOS.registerJavaScript('app', 'io.plexi.tools.fileprops', APP_MAIN);
})();
