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
