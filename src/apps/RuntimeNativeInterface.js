let createPlexiNativeInterface = (os, proc, cwd) => {
  let pni = {};
  pni.game_create_window = (task, args) => {};
  return Object.freeze({ ...pni });
};
