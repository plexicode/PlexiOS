let parseOsBaseConfiguration = config => {
  let {
    shell,
    files,
    images,
    defaultTheme,
    auth,
    portal,
    appServers,
    startup,
    defaultLang,
    osName,
  } = config || {};

  shell = Util.ensureObject(shell);
  files = Util.ensureObject(files);
  images = Util.ensureArray(images);
  defaultTheme = [...Util.ensureString(defaultTheme).split(',').map(v => v.trim()).filter(v => !!v), 'default'];
  auth = Util.ensureObject(auth);
  portal = Util.ensureObject(portal);
  appServers = Util.ensureArray(appServers);
  startup = Util.ensureObject(startup);
  osName = Util.ensureString(osName) || "Plexi OS";

  let baseConfig = {
    osName,
    shell: {
      headless: !!shell.headless,
      fullScreen: !!shell.fullScreen,
    },
    files: { ...files },
    images: [...images],
    defaultTheme: [...defaultTheme],
    auth: {
      allowAnonymous: !!auth.allowAnonymous,
      allowCustomAuthServer: !!auth.allowCustomAuthServer,
      authServers: Util.ensureArray(auth.authServers),
    },
    portal: {
      getCredFrom: Util.ensureString(portal.getCredFrom) || 'NONE',
      onCredNotFound: Util.ensureString(portal.onCredNotFound) || 'PROMPT',
    },
    appServers: [...appServers],
    startup: {
      actions: [...Util.ensureArray(startup.actions)],
    },
    defaultLang: Util.ensureString(defaultLang) || 'EN',
  };

  if (baseConfig.onCredNotFound === 'ANON' && !baseConfig.auth.allowAnonymous) {
    throw new Error();
  }

  return baseConfig;
};
