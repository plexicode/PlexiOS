let createShortcutKeyHandler = () => {

  let items = {};

  let addKey = (keyCombo, cb, isCtrlStrict) => {
    let parts = keyCombo.toUpperCase().split('+');
    let key = parts.pop();
    let shift = false;
    let ctrl = false;
    let alt = false;
    let cmd = false;
    let cmdrl = false;
    for (let m of [...new Set(parts)]) {
      shift = shift || m === 'SHIFT';
      ctrl = ctrl || m === 'CTRL';
      cmd = cmd || m === 'CMD';
      alt = alt || m === 'ALT';
    }
    if (ctrl && !cmd && !isCtrlStrict) {
      ctrl = false;
      cmdrl = true;
    }

    items[[
      cmdrl ? 'CMDRL' : '',
      ctrl ? 'CTRL' : '',
      cmd ? 'CMD' : '',
      alt ? 'ALT' : '',
      shift ? 'SHIFT' : '',
      key
    ].filter(Util.identity).join('+')] = cb;

    return o;
  };

  let lookup = {
    Enter: 1,
    Escape: 1,
    Space: 1,
    Tab: 1,
    Equal: 'PLUS',
    Minus: 1,
    Delete: 1,
  };
  Util.range(12).forEach(n => { lookup['F' + (n + 1)] = 1; });

  let invoke = (keys) => {
    let ver1 = keys;
    let ver2 = '';
    let parts = ver1.split('CTRL+');
    if (parts.length > 1) {
      ver2 = parts.join('CMDRL+');
    }
    let cb = items[ver1] || items[ver2];
    if (cb) {
      cb({ preventDefault: Util.noop });
    }
    return !!cb;
  };

  let empty = [''];
  let getHandler = ev => {
    let k = ev.code;
    let ctrls = (ev.ctrlKey && ev.metaKey)
      ? ['CTRL+CMD+']
      : ev.ctrlKey
        ? ['CMDRL+', 'CTRL+']
        : ev.metaKey
          ? ['CMDRL+', 'CMD+']
          : empty;
    for (let sb of ctrls) {
      if (ev.altKey) sb += 'ALT+';
      if (ev.shiftKey) sb += 'SHIFT+';
      if (k.startsWith('Key') && k.length === 4) {
        sb += k[3];
      } else if (k.startsWith('Digit') && k.length === 6) {
        sb += k[5];
      } else if (k.startsWith('Arrow')) {
        sb += k.substring(5);
      } else if (lookup[k] === 1) {
        sb += k;
      } else if (lookup[k]) {
        sb += lookup[k];
      }
      sb = sb.toUpperCase();
      if (items[sb]) return items[sb];
    }
  };

  let handle = ev => {
    let cb = getHandler(ev);
    if (cb) {
      ev.preventDefault();
      ev.stopPropagation();
      cb(ev);
    }
    return !!cb;
  };

  let o = Object.freeze({
    handle,
    invoke,
    addKey,
  });
  return o;
};
