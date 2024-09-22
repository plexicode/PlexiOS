const APP_MAIN = async (os, procInfo, args) => {
  let seconds = parseFloat(args[0]);
  if (isNaN(seconds) || seconds < 0) seconds = 0;
  return new Promise(r => {
    setTimeout(() => r(true), Math.floor(seconds * 1000 + .5));
  });
};
