const PlexiOS = (() => {

const HtmlUtil = (() => {

  const BB = { boxSizing: 'border-box' };
  let defaultProps = {
    canvas: { drawCtxAccessor: true },
    input: { dummyId: true },
    inputRange: { type: 'range' },
    inputText: { type: 'text', ...BB },
    inputCheckbox: { type: 'checkbox' },
    inputPassword: { type: 'password', ...BB },
    textarea: { ...BB },
    button: { borderRadius: 4 },
    div: BB,
    span: BB,
  };

  let makeElementFactory = (tagType, actualTag) => {
    actualTag = actualTag || tagType;
    let props = {
      ...(defaultProps[actualTag] || {}),
      ...(defaultProps[tagType] || {}),
    };
    return (...initialArgs) => {
      let e = document.createElement(actualTag);
      e.set = (...args) => { applyValue(e, tagType, actualTag, args); return e; };
      e.clear = () => html.clear(e);
      applyValue(e, tagType, actualTag, [props, ...initialArgs]);
      return e;
    };
  };

  let initOnValueChanged = (e, fn, getValue, events) => {
    let oldValue = []; // unique instance, will fail equality check regardless of type.
    for (let ev of Util.flattenArray([events])) {
      e.addEventListener(ev, () => {
        let newValue = getValue();
        if (newValue !== oldValue) {
          oldValue = newValue;
          fn(newValue);
        }
      });
    }
  };

  let selfApply = (e, k, v) => { e[k] = v; };
  let textChanged = (e, _, v) => {
    let lastFire = [];
    ['keydown', 'keyup', 'input', 'change', 'paste'].forEach(evType => {
      e.addEventListener(evType, () => {
        let value = e.value;
        if (value !== lastFire) {
          lastFire = value;
          v(value);
        }
      });
    });
  };

  let onEnter = (e, _, v) => { e.addEventListener('keydown', ev => { if (ev.code === 'Enter') v(e.value); })};

  let propApplicators = {
    'title': selfApply,
    'a.href': selfApply,
    'a.target': selfApply,
    'button.enabled': (e, _, v) => { e.disabled = !v; },
    'canvas.drawCtxAccessor': e => { e.getDrawContext = (...args) => getCanvasGraphics(e, ...args); },
    'img.src': selfApply,
    'input.type': selfApply,
    'input.readOnly': selfApply,
    'option.value': selfApply,
    'textarea.spellcheck': selfApply,
    'dummyId': (e) => { e.id = 'PX_RND_' + Util.generateId(20) },
    'inputText.onEnter': onEnter,
    'inputText.value': selfApply,
    'inputText.onTextChanged': textChanged,
    'inputPassword.onTextChanged': textChanged,
    'inputPassword.onEnter': onEnter,
    'inputRange.value': selfApply,
    'inputRange.min': selfApply,
    'inputRange.max': selfApply,
    'inputCheckbox.checked': selfApply,
    'inputCheckbox.onToggle': (e, _, v) => initOnValueChanged(e, v, () => !!e.checked, 'change'),
    'jslink.onAction': (e, _, v) => { e.href = 'javascript:void(0);'; e.addEventListener('click', ev => { ev.preventDefault(); v(); }); },
  };

  let numSuffix = {
    fontSize: 'pt',
    opacity: '',
  };
  [
    'height', 'margin', 'margin*', 'padding*', 'padding', 'width', '*',
    'borderRadius', 'borderTopLeftRadius', 'borderTopRightRadius', 'borderBottomLeftRadius', 'borderBottomRightRadius',
  ].forEach(t => {
    ['Left', 'Top', 'Right', 'Bottom'].forEach(d => {
      let p = t.split('*').join(d);
      p = p[0].toLowerCase() + p.substring(1);
      numSuffix[p] = 'px';
    });
  });

  let applyDragDropHandler = (e, fn, evType) => {
    if (!e._PX_ON_DRAG_DROP) {
      e.classList.add('PX_FILE_DROP_RECV');
      e._PX_ON_DRAG_DROP_HANDLER = {};
      e._PX_ON_DRAG_DROP = (fileList, eventType, rawEv) => {
        let evFn = e._PX_ON_DRAG_DROP_HANDLER[eventType];
        if (evFn) evFn(fileList.map(f => ({ ...f, isInternal: !f.isExternal })), rawEv);
      };
    }
    e._PX_ON_DRAG_DROP_HANDLER[evType] = fn;
  };

  let applyProp = (e, tag, actualTag, k, v) => {
    let applicator = propApplicators[`${tag}.${k}`] || propApplicators[`${actualTag}.${k}`] || propApplicators[k];
    if (applicator) {
      applicator(e, k, v);
      return e;
    }

    let s = e.style;

    switch (k) {
      case 'absMargin': e.set({ position: 'absolute', left: v, right: v, top: v, bottom: v }); return;
      case 'bold': s.fontWeight = v ? 'bold' : 'normal'; return;
      case 'html': e.innerHTML += v; return;
      case 'italic': s.fontStyle = v ? 'italic' : 'normal'; return;
      case 'position': s.position = v === 'set' ? (e.style.position || 'static') : v; return;
      case 'shadow': s.boxShadow = v ? '5px 5px 8px rgba(0, 0, 0, 0.2)' : ''; return;
      case 'size': e.set(Array.isArray(v) ? { width: v[0], height: v[1] } : { width: v, height: v }); break;
      case 'text': e.innerText += v; break;
      case 'visibleBlock': s.display = v ? 'block' : 'none'; break;
      case 'visibleInline': s.display = v ? 'inline' : 'none'; break;
      case 'z': s.zIndex = v; break;

      case 'userSelect':
        v = typeof v !== 'string' ? (v ? 'auto' : 'none') : v;
        s.userSelect = v;
        s.WebKitUserSelect = v;
        if (v === 'none') { s.WebKitTouchCallout = 'none'; }
        break;

      case 'onClick': e.addEventListener('click', t => v(t)); return;
      case 'onDragDrop': applyDragDropHandler(e, v, 'drop'); return;
      case 'onDragOut': applyDragDropHandler(e, v, 'out'); return;
      case 'onDragOver': applyDragDropHandler(e, v, 'over'); return;
      case 'onInput': e.addEventListener('input', () => v(e.value)); return;
      case 'onRightClick': applyRightClick(e, v); return;

      case 'fullSize': e.set({ w100: 1, h100: 1}); break;
      case 'w100': if (v) e.set({ position: 'absolute', width: '100%' }); break;
      case 'h100': if (v) e.set({ position: 'absolute', height: '100%' }); break;
      case 'northStretchDock': e.set({ w100: 1, top: 0, bottom: v }); break;
      case 'northDock': e.set({ w100: 1, top: 0, height: v }); break;
      case 'southStretchDock': e.set({ w100: 1, bottom: 0, top: v }); break;
      case 'southDock': e.set({ w100: 1, bottom: 0, height: v }); break;
      case 'eastStretchDock': e.set({ h100: 1, right: 0, left: v }); break;
      case 'eastDock': e.set({ h100: 1, right: 0, width: v }); break;
      case 'westStretchDock': e.set({ h100: 1, left: 0, right: v }); break;
      case 'westDock': e.set({ h100: 1, left: 0, width: v }); break;

      default:
        if (typeof v === 'number' && numSuffix[k] !== undefined) {
          v += numSuffix[k];
        }
        s[k] = v;
        break;
    }
    return e;
  };

  let functionFields = {
    'button': 'onClick',
    'inputRange': 'onInput',
    'inputCheckbox': 'onToggle',
    'inputText': 'onTextChanged',
    'inputPassword': 'onTextChanged',
    'jslink': 'onAction',
  };

  let applyValue = (e, tagType, actualTag, v) => {
    let t = typeof v;
    switch (Util.getType(v)) {
      case 'NaN':
      case 'undefined':
      case 'null':
        break;
      case 'array':
        for (let item of v) applyValue(e, tagType, actualTag, item);
        break;
      case 'element':
        e.append(v);
        break;
      case 'object':
        for (let k of Object.keys(v)) {
          applyProp(e, tagType, actualTag, k, v[k]);
        }
        break;
      case 'function':
        let f = functionFields[tagType] || functionFields[actualTag];
        if (f) applyProp(e, tagType, actualTag, f, v);
        else throw new Error(); // unknown target/events
        break;
      case 'string':
        e.append(v);
        break;
      default:
        e.append(`${t}`);
        break;
    }
  };

  // This applies the callback as both a mouse right click and touch screen long-press handler
  let applyRightClick = (e, fn) => {

    let touchId = 0;
    let touchIdAlloc = 1;
    let touchStartPos = null;

    e.addEventListener('pointerdown', ev => {
      if (ev.button === 2) {

      } else if (ev.pointerType === 'touch') {
        touchStartPos = [ev.pageX, ev.pageY];
        touchId = ++touchIdAlloc;
        ev.stopPropagation();
        e.setPointerCapture(ev.pointerId);
        setTimeout(() => {
          if (touchId === touchIdAlloc && html.inUiTree(e)) {
            touchId = 0;
            fn({ ...ev, pageX: touchStartPos[0], pageY: touchStartPos[1] });
          }
        }, 800);
      }
    });
    e.addEventListener('pointermove', ev => {
      if (ev.pointerType === 'touch') {
        if (!touchStartPos) return;
        ev.stopPropagation();
        let dx = ev.pageX - touchStartPos[0];
        let dy = ev.pageY - touchStartPos[1];
        if (dx ** 2 + dy ** 2 > 6 ** 2) {
          touchId = 0;
        }
      }
    });
    e.addEventListener('pointerup', (ev) => {
      if (ev.pointerType === 'touch') {
        touchId = 0;
        touchStartPos = null;
        e.releasePointerCapture(ev.pointerId);
      } else if (ev.button === 2) {
        ev.preventDefault();
        ev.stopPropagation();
        fn(ev);
      }
    });
  };

  let loadComponent = async (id) => {
    html.Components[id] = await staticVirtualJsLoader.loadJavaScript('component', id);
    return html.Components[id];
  };

  let loadComponents = async (...args) => {
    let keys = Util.flattenArray([args]);
    let comps = await Promise.all(keys.map(loadComponent));
    let o = {};
    for (let i = 0; i < keys.length; i++) {
      o[keys[i]] = comps[i];
    }
    return o;
  };

  let html = {
    Components: {},
    loadComponent,
    loadComponents,
    registerComponent: (id, fn) => {
      html.Components[id] = fn;
      PlexiOS.registerJavaScript('component', id, fn);
    },
    clear: (e) => {
      while (e.firstChild) e.removeChild(e.firstChild);
      return e;
    },
    clearExcept: (e, survivor) => {
      while (e.firstChild && e.firstChild !== survivor) e.removeChild(e.firstChild);
      while (e.lastChild && e.lastChild !== survivor) e.removeChild(e.lastChild);
      return e.firstChild === survivor;
    },
    resetStyle: (e) => {
      e.removeAttribute('style');
      return e;
    },
    applyStyle: (e, styles) => {
      for (let key in styles) {
        e.style[key] = styles[key];
      }
      return e;
    },
    inUiTree: e => html.childIsDescendentOf(e, document.body),
    childIsDescendentOf: (child, ancestor) => {
      let walker = child;
      while (walker) {
        if (walker === ancestor) return true;
        walker = walker.parentElement;
      }
      return false;
    },
    applyDoubleClickHandler: (e, handler, includeModifierKeys) => {
      let lastInvocation = 0;
      let modSkip = ev => !includeModifierKeys && (ev.ctrlKey || ev.shiftKey);
      let wrappedHandler = (ev) => {
        let now = Util.getTime();
        if (now - lastInvocation < 0.35) return;
        lastInvocation = now;
        ev.preventDefault();
        setTimeout(() => handler(ev), 0);
      };
      /*
      e.addEventListener('dblclick', ev => {
        if (modSkip(ev)) return;
        wrappedHandler(ev);
      });
      //*/
      let timeoutSec = .4;
      let lastClick = 0;
      e.addEventListener('pointerdown', ev => {
        if (modSkip(ev)) return;
        let now = Util.getTime();
        if (now - lastClick < timeoutSec) {
          lastClick = 0;
          wrappedHandler(ev);
        } else {
          lastClick = now;
        }
      });
      return e;
    },
    applyClickDragHandler: (element, onDown, onDrag, optionalOnUp, requireSomeDragFirst) => {
      element.set({ touchAction: 'none' });
      let session = null;
      let realStartX = 0;
      let realStartY = 0;

      let getOffset = ev => {
        let dx = ev.pageX - realStartX;
        let dy = ev.pageY - realStartY;
        return [dx, dy];
      };
      let startDrag = e => {
        session = {
          startX: realStartX,
          startY: realStartY,
          userSession: null,
        };
        if (onDown) session.userSession = onDown(e);
      };
      let moveDrag = e => {
        if (!session) return;
        if (onDrag) onDrag(e, session.userSession, ...getOffset(e));
      };
      let releaseDrag = e => {
        if (!session) return;
        session = null;
        if (optionalOnUp) optionalOnUp(e);
      };
      let delayedDragFlag = false;
      element.addEventListener('pointerdown', e => {
        e.preventDefault();
        element.setPointerCapture(e.pointerId);
        realStartX = e.pageX;
        realStartY = e.pageY;
        if (requireSomeDragFirst) {
          delayedDragFlag = true;
        } else {
          startDrag(e);
        }
      });
      element.addEventListener('pointermove', async e => {
        e.preventDefault();
        if (delayedDragFlag) {
          let [dx, dy] = getOffset(e);
          if (dx ** 2 + dy ** 2 > 6 ** 2) {
            delayedDragFlag = false;
            await Promise.resolve(startDrag(e));
            moveDrag(e);
          }
        } else {
          moveDrag(e);
        }
      });
      element.addEventListener('pointerup', e => {
        e.preventDefault();
        element.releasePointerCapture(e.pointerId);
        delayedDragFlag = false;
        releaseDrag(e);
      });
    },
    injectNineGrid: (host, leftWidth, topHeight, rightWidth, bottomHeight, existingC) => {
      if (existingC && !existingC.PX_NINE_GRID_C) existingC = null;
      let output = {};
      let sizes = {
        W: { left: 0, width: leftWidth },
        E: { right: 0, width: rightWidth },
        XC: { left: leftWidth, right: rightWidth },
        N: { top: 0, height: topHeight },
        S: { bottom: 0, height: bottomHeight },
        YC: { top: topHeight, bottom: bottomHeight },
      };
      let ids = [];
      let addThese = [];
      let center = null;
      for (let x of ['W', '', 'E']) {
        for (let y of ['N', '', 'S']) {
          let id = (y + x) || 'C';
          ids.push(id);
          let isCenter = id === 'C';
          if (existingC && isCenter) {
            center = existingC.set({ ...sizes.XC, ...sizes.YC });
          } else {
            let el = html.div(
              {
                position: 'absolute',
                ...sizes[x || 'XC'],
                ...sizes[y || 'YC'],
              });
            if (isCenter) {
              center = el;
            } else {
              addThese.push(el);
              output[id] = el;
            }
          }
        }
      }
      output.C = center;
      center.PX_NINE_GRID_C = true;
      html.clearExcept(host, center);
      if (host.lastChild !== center) host.append(center);
      host.prepend(...addThese.reverse());

      return output;
    },
    unwrapPointerEvent: ev => {
      let pid = ev.pointerId;
      let x = ev.clientX;
      let y = ev.clientY;
      return { pid, x, y };
    },
    createBevelDiv: (rgb, size) => {
      let mid = 'rgb(' + rgb.join(',') + ')';
      let light = 'rgb(' + rgb.map(x => Math.floor(255 - (255 - x) * .7)).join(',') + ')';
      let dark = 'rgb(' + rgb.map(x => Math.floor(x * .7)).join(',') + ')';
      let d = html.div({
        fullSize: true,
        backgroundColor: mid,
        border: (size || 1) + 'px solid #000',
      });
      d.updateBevel = (isConvex, isHighlight) => {
        let nw = isConvex ? light : dark;
        let se = isConvex ? dark : light;
        return d.set({
          backgroundColor: isHighlight ? light : mid,
          borderLeftColor: nw, borderTopColor: nw,
          borderBottomColor: se, borderRightColor: se,
        });
      };
      return d.updateBevel(true);
    },
    buildBevelButton: (color) => {
      let btn = html.buildButtonLikeDiv();
      let bevel = html.createBevelDiv(color);
      btn.getStyleHost().set(bevel);
      btn.setVisualUpdater((isPushed, _hasFocus, isMouseOver) => bevel.updateBevel(!isPushed, isMouseOver));
      return btn;
    },
    buildButtonLikeDiv: () => {
      let div = HtmlUtil.div;
      let isPushed = false;
      let artificialPush = null;
      let hasKeyboardFocus = false;
      let hasCapture = false;
      let action = null;
      let updater = null;
      let inner = div({ fullSize: true });
      let styleHost = div({ fullSize: true });
      let outer = div({ position: 'relative' }, styleHost, inner);
      let isOver = false;
      outer.addEventListener('pointerdown', e => {
        hasCapture = true;
        isPushed = true;
        artificialPush = true;
        outer.setPointerCapture(e.pointerId)
        updateVisualState();
        e.stopPropagation();
      });
      outer.addEventListener('pointerup', e => {
        hasCapture = false;
        isPushed = false;
        outer.releasePointerCapture(e.pointerId);
        if (artificialPush) {
          if (action) setTimeout(() => action(), 0);
        }
        artificialPush = null;
        updateVisualState();
        e.stopPropagation();
      });
      outer.addEventListener('pointermove', e => {
        if (hasCapture) {
          let x = e.pageX;
          let y = e.pageY;
          let bcr = outer.getBoundingClientRect();
          let isOver = x >= bcr.left && x < bcr.right && y >= bcr.top && y < bcr.bottom;
          artificialPush = isOver;
          updateVisualState();
        }
      });
      outer.addEventListener('mouseleave', e => {
        isOver = false;
        updateVisualState();
      });
      outer.addEventListener('mouseenter', e => {
        isOver = true;
        updateVisualState();
      });
      let updateVisualState = () => {
        let seemsPushed = artificialPush === null ? isPushed : artificialPush;
        if (updater) updater(seemsPushed, hasKeyboardFocus, isOver);
      };
      outer.setInner = (...args) => { inner.set(...args); return outer; };
      outer.getStyleHost = () => styleHost;
      outer.setAction = a => { action = a; return outer; };
      outer.setVisualUpdater = u => { updater = u; return outer; };
      return outer;
    },
    createColorInterpolator: (points) => {
      let colors = Util.deepCopy(points);
      colors.sort((a, b) => a.ratio - b.ratio);
      let len = colors.length;
      return ratio => {
        if (!len) return [0, 0, 0];
        if (len === 1 || ratio <= colors[0].ratio) return [...colors[0].rgb];
        if (ratio >= colors[len - 1].ratio) return [...colors[len - 1].rgb];
        for (let i = 1; i < len; i++) {
          let left = colors[i - 1];
          let right = colors[i];
          if (ratio >= left.ratio && ratio <= right.ratio) {
            let d = right.ratio - left.ratio;
            if (d === 0) return [...colors[i].rgb];
            let amt = (ratio - left.ratio) / d;
            let invAmt = 1 - amt;
            let o = [];
            for (let j = 0; j < 3; j++) {
              o.push(Math.floor(left.rgb[j] * invAmt + right.rgb[j] * amt + 0.5));
            }
            return o;
          }
        }
        return [...colors[len - 1].rgb];
      };
    },
  };

  "div span button ul li textarea canvas img a option p select sup sub script link style input h1 h2 h3 h4 h5 h6".split(' ').forEach(h => {
    html[h] = makeElementFactory(h);
  });

  html.inputText = makeElementFactory('inputText', 'input');
  html.inputPassword = makeElementFactory('inputPassword', 'input');
  html.inputRange = makeElementFactory('inputRange', 'input');
  html.inputCheckbox = makeElementFactory('inputCheckbox', 'input');
  html.jslink = makeElementFactory('jslink', 'a');
  html.fullSize = Object.freeze({ position: 'absolute', width: '100%', height: '100%' });
  html.canvasOfSize = (w, h) => {
    let c = html.canvas();
    c.width = w;
    c.height = h;
    return c;
  };

  return Object.freeze(html);
})();


const Util = (() => {

  let loadImageUri = async (uri) => {
    return new Promise(res => {
      let loader = HtmlUtil.img();
      loader.addEventListener('load', () => {
        let canv = HtmlUtil.canvas();
        canv.width = loader.width;
        canv.height = loader.height;
        let drawCtx = canv.getContext('2d');
        drawCtx.drawImage(loader, 0, 0);
        res(canv);
      });
      loader.src = uri;
    });
  };

  let loadImageByteArray = async (arr) => {
    let b64 = bytesToBase64(arr);
    let uri = 'data:image/' + (b64.startsWith('iV') ? 'png' : 'jpeg') + ';base64,' + b64;
    return loadImageUri(uri);
  };

  let _loadDup = {};
  let loadScript = (path) => {
    // Put a 5-second throttle on this for identical paths.
    // Sometimes multiple virtual JS file IDs will be loaded at once that are
    // actually consolidated into the same physical file in the current deployment.
    // Terminal commands, for example.
    if (_loadDup[path]) return;
    _loadDup[path] = true;
    setTimeout(() => { _loadDup = {}; }, 5_000);

    let s = document.createElement('script');
    s.src = path;
    document.head.append(s);
  };

  let getTime = () => new Date().getTime() / 1000;

  let pause = async (seconds) => {
    return new Promise(res => {
      setTimeout(() => res(true), Math.floor(seconds * 1000 + .5));
    });
  };

  // TODO: this needs to go through the localization engine.
  let formatHrMin = (seconds, includeSec) => {
    let mins = Math.floor(seconds / 60);
    seconds -= mins * 60;
    let hrs = Math.floor(mins / 60);
    mins -= hrs * 60;
    let incHrs = !!hrs;
    let incMins = mins || (incHrs && seconds);
    let incSec = includeSec && (seconds || (!mins && !hrs));
    let pl = n => n === 1 ? '' : 's';
    return [
      incHrs ? (hrs + " hour" + pl(hrs)) : '',
      incMins ? (mins + " minute" + pl(mins)) : '',
      incSec ? (seconds + " second" + pl(seconds)) : '',
    ].filter(Util.identity).join(', ');
  };

  let sequentialAsyncForEach = async (arr, fn) => {
    for (let i = 0; i < arr.length; i++) {
      await Promise.resolve(fn(arr[i], i, arr));
    };
  };

  let letters = 'abcdefghijklmnopqrstuvwxyz';
  let idChars = letters + letters.toUpperCase() + '0123456789';
  let generateId = (size) => {
    let id = '';
    while (size--) {
      id += idChars.charAt(Math.floor(Math.random() * idChars.length));
    }
    return id;
  };

  let b64Alphabet = (letters.toUpperCase() + letters.toLowerCase() + '0123456789+/').split('');
  let b64Lookup = {};
  b64Alphabet.forEach((c, i) => { b64Lookup[c] = i; });

  let textToBase64 = txt => {
    let arr = new TextEncoder().encode(txt || '');
    return bytesToBase64(arr);
  };

  let textToBytes = txt => {
    return new TextEncoder().encode(txt || '');
  };

  let bytesToBase64 = arr => {
    let pairs = [];
    let len = arr.length;
    let b;
    for (let i = 0; i < len; i++) {
      b = arr[i];
      pairs.push((b >> 6) & 3, (b >> 4) & 3, (b >> 2) & 3, b & 3);
    }
    while (pairs.length % 3 != 0) pairs.push(0);
    let sb = [];
    let pairLen = pairs.length;
    for (let i = 0; i < pairLen; i += 3) {
      sb.push(b64Alphabet[(pairs[i] << 4) | (pairs[i + 1] << 2) | (pairs[i + 2])]);
    }
    while (sb.length % 4 != 0) sb.push('=');
    return sb.join('');
  };

  let base64ToBytes = b64 => {
    let pairs = [];
    let chars = b64.split('');
    while (chars.length && chars[chars.length - 1] === '=') chars.pop();
    let b;
    for (let c of chars) {
      b = b64Lookup[c] || 0;
      pairs.push((b >> 4) & 3, (b >> 2) & 3, b & 3);
    }
    while (pairs.length % 4) pairs.pop();
    let bytes = [];
    let len = pairs.length;

    for (let i = 0; i < len; i += 4) {
      bytes.push((pairs[i] << 6) | (pairs[i + 1] << 4) | (pairs[i + 2] << 2) | pairs[i + 3]);
    }
    return new Uint8Array(bytes);
  };

  let base64ToText = (b64) => {
    return new TextDecoder().decode(base64ToBytes(b64));
  };

  let tryParseJson = obj => {
    try {
      return JSON.parse(obj);
    } catch (e) {
      return null;
    }
  };

  let flattenArrayImpl = (a, builder) => {
    for (let item of a) {
      if (Array.isArray(item)) flattenArrayImpl(item, builder);
      else builder.push(item);
    }
  };
  let flattenArray = (...a) => {
    let builder = [];
    flattenArrayImpl(a, builder);
    return builder;
  };

  let getType = o => {
    if (o === null) return 'null';
    let t = typeof o;
    if (t === 'object') {
      if (Array.isArray(o)) return 'array';
      if (o instanceof HTMLElement) return 'element';
    } else if (t === 'number') {
      if (isNaN(o)) return 'NaN';
      if (!isFinite(o)) return 'infinity';
    }
    return t;
  };

  let isFunction = o => typeof o === 'function';
  let asFunction = o => typeof o === 'function' ? o : null;
  let fail = err => { throw new Error(err || 'FAILURE'); };

  let argInterceptor = (args, interceptThese) => {
    let htmlArgs = [];
    let intercepted = {};
    if (!Array.isArray(interceptThese)) throw new Error();
    let lookup = new Set(interceptThese);
    for (let arg of Util.flattenArray(args)) {
      let t = getType(arg);
      if (t === 'object') {
        let props = {};
        for (let k of Object.keys(arg)) {
          if (lookup.has(k)) {
            intercepted[k] = arg[k];
          } else {
            props[k] = arg[k];
          }
        }
        htmlArgs.push(props);
      } else {
        htmlArgs.push(arg);
      }
    }
    return { htmlArgs, props: intercepted };
  };

  let getCommonFileType = (path, bytes) => {
    if (bytes.length > 4) {
      let firstBytes = bytes[0] + ',' + bytes[1];
      let file = path.split('/').pop();
      let t = file.split('.');
      if (t.length > 1) {
        let ext = t.pop().toUpperCase();
        if (ext === 'PNG') {
          if (firstBytes === '137,80') return { type: 'image', format: 'PNG' };
        } else if (ext === 'JPEG' || ext === 'JPG') {
          if (firstBytes === '255,216') return { type: 'image', format: 'JPEG' };
        } else if (ext === 'BMP') {
          if (firstBytes === '66,77') return { type: 'image', format: 'BMP' };
        } else if (ext === 'GIF') {
          if (firstBytes === '71,73') return { type: 'image', format: 'GIF' };
        }
      }
    }
    return null;
  };

  let loadImageB64 = (b64) => {
    let uri = 'data:image/' + (b64.startsWith('iV') ? 'png' : 'jpeg') + ';base64,' + b64;
    return loadImageUri(uri);
  };

  let loadImageB64Lookup = async (lookup) => {
    let keys = Object.keys(lookup);
    let images = await Promise.all(keys.map(async k => {
      let b64 = lookup[k];
      return { name: k, b64, canvas: await loadImageB64(b64) };
    }));
    let o = {};
    for (let i = 0; i < keys.length; i++) {
      o[keys[i]] = images[i];
    }
    return Object.freeze(o);
  };

  let copyImage = (img, optPixelated) => {
    let canvas = HtmlUtil.canvas();
    canvas.width = img.width;
    canvas.height = img.height;
    let g = canvas.getContext('2d');
    if (optPixelated) {
      canvas.set({ imageRendering: 'pixelated' });
      g.imageSmoothingEnabled = false;
    }
    g.drawImage(img, 0, 0);
    return canvas;
  };

  let tasks = [];
  let runPromiseTask = (pr) => {
    tasks.push(pr);
  };

  let awaitPromiseTasks = async () => {
    while (tasks.length) {
      await Promise.resolve(tasks.pop());
    }
  };

  let range = n => {
    let a = [];
    while (n --> 0) a.push(a.length);
    return a;
  };

  let deepCopy = o => JSON.parse(JSON.stringify(o));

  let ensureNumber = n => {
    let t = typeof n;
    if (t !== 'number') {
      if (t === 'string') n = parseFloat(n);
      else return 0;
    }
    if (isNaN(n) || !isFinite(n)) return 0;
    return n;
  };

  let ensureInteger = n => {
    let t = typeof n;
    if (t === 'string') {
      n = n.trim();
      let num = parseInt(n);
      if (num + '' !== n) return 0; // do not allow spurious character trimming
      n = num;
    } else if (t !== 'number') return 0;
    if (isNaN(n) || !isFinite(n)) return 0;
    return Math.floor(n);
  };

  let ensurePositiveInteger = n => Math.max(0, ensureInteger(n));
  let ensureArray = arr => Array.isArray(arr) ? arr : [arr];
  let ensureString = s => {
    if (typeof s === 'string') return s;
    if (!s) return '';
    return s + '';
  };
  let ensureTrimmedString = s => ensureString(s).trim();

  let posMod = (n, d) => {
    let x = n % d;
    return x < 0 ? x + d : x;
  };

  let shuffle = (arr) => {
    for (let i = 0; i < arr.length; i++) {
      let j = Math.floor(Math.random() * arr.length);
      let t = arr[i];
      arr[i] = arr[j];
      arr[j] = t;
    }
    return arr;
  };

  let ensureRange = (v, a, b) => a > v ? a : b < v ? b : v;

  let ensureNumLen = (n, len) => {
    let t = `${n}`;
    while (t.length < len) t = '0' + t;
    return t;
  };

  let isNullish = v => v === null || v === undefined || isNaN(v);

  let createEventStopper = () => {
    let stop = false;
    return {
      isStopped: () => stop,
      buildEvent: () => Object.freeze({ preventDefault: () => { stop = true; } }),
    };
  };

  let ensureObject = o => {
    if (typeof o !== 'object') return {};
    if (!o) return {};
    if (Array.isArray(o)) return {};
    return o;
  };

  let replace = (s, a, b) => `${s}`.split(a).join(b);

  let identity = v => v;

  let blockTillFirstPromiseResolution = async (promises) => {
    return new Promise(res => {
      promises.forEach(p => {
        p.then(v => res(v));
      });
    });
  };

  let byteSizeToText = c => {
    for (let suffix of ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB']) {
      if (c < 1024 || suffix === 'EB') {
        if (suffix === 'Bytes' && c === 1) suffix = 'Byte';
        return Math.floor(100 * c) / 100 + ' ' + suffix;
      }
      c /= 1024;
    }
  };

  let parseArgs = (args) => {
    let ordered = [];
    let shortFlags = {};
    let longFlags = {};
    for (let i = 0; i < args.length; i++) {
      let arg = args[i];
      if (arg.startsWith('-')) {
        if (arg.startsWith('--')) {
          let parts = arg.substring(2).split('=');
          let name = parts[0];
          let value = parts.slice(1).join('=');
          longFlags[name] = value;
        } else {
          for (let j = 1; j < arg.length; j++) {
            shortFlags[arg[j]] = true;
          }
        }
      } else {
        ordered.push(arg);
      }
    }
    return { orderedArgs: ordered, flags: { ...shortFlags, ...longFlags } };
  };

  let isBeta = () => {
    let host = window.location.hostname;
    if (host === 'localhost') return true;
    let t = host.split('.');
    let tld = t.pop();
    let dom = t.pop();
    if (dom === 'plexi' && tld === 'io') {
      if (t.length && t.pop().startsWith('beta')) {
        return true;
      }
    }
    return false;
  };

  let getTermCmdSet = () => {
    return new Set('cat cd chmod cp echo grep head less ls mkdir more mv pwd rm rmdir set tail touch'.split(' '));
  };

  return Object.freeze({
    argInterceptor,
    asFunction,
    awaitPromiseTasks,
    base64ToBytes,
    base64ToText,
    blockTillFirstPromiseResolution,
    byteSizeToText,
    bytesToBase64,
    copyImage,
    createEventStopper,
    deepCopy,
    ensureArray,
    ensureInteger,
    ensureNumber,
    ensureNumLen,
    ensureObject,
    ensurePositiveInteger,
    ensureRange,
    ensureString,
    ensureTrimmedString,
    fail,
    flattenArray,
    formatHrMin,
    generateId,
    getCommonFileType,
    getTermCmdSet,
    getTime,
    getType,
    identity,
    isFunction,
    isNullish,
    loadImageByteArray,
    loadImageUri,
    loadImageB64,
    loadImageB64Lookup,
    loadScript,
    noop: () => {},
    parseArgs,
    pause,
    posMod,
    range,
    replace,
    runPromiseTask,
    sequentialAsyncForEach,
    shuffle,
    textToBase64,
    textToBytes,
    tryParseJson,
  });
})();


let getCanvasGraphics = (canvas, renderFrequently) => {
  let key = ['2d', renderFrequently].join();
  if (!canvas.PX_GFX_CACHE) canvas.PX_GFX_CACHE = {};
  let gfx = canvas.PX_GFX_CACHE[key];
  if (!gfx) {
    let getCtx = () => canvas.getContext('2d', renderFrequently ? { willRenderFrequently: true } : undefined);
    let ctx = null;
    let getColor = (r, g, b, a) => {
      if (g === undefined) {
        if (Array.isArray(r)) {
          g = r[1];
          b = r[2];
          a = r[3];
          r = r[0];
        } else {
          return r; // string direct
        }
      }
      if (a === undefined || a >= 255) {
        return 'rgb(' + [r, g, b].join(',') + ')';
      }
      return 'rgba(' + [r, g, b, a / 255].join(',') + ')';
    };

    gfx = {
      getSize: () => [canvas.width, canvas.height],
      setSize: (w, h) => {
        canvas.width = w;
        canvas.height = h;
        return gfx;
      },
      clear: (x, y, w, h) => {
        ctx = ctx || getCtx();
        if (x === undefined) {
          x = 0;
          y = 0;
          w = canvas.width;
          h = canvas.height;
        }
        ctx.clearRect(x, y, w, h);
        return gfx;
      },
      rectangle: (x, y, w, h, r, g, b, a) => {
        ctx = ctx || getCtx();
        ctx.fillStyle = getColor(r, g, b, a);
        ctx.fillRect(x, y, w, h);
        return gfx;
      },
      ellipse: (x, y, w, h, r, g, b, a) => {
        ctx = ctx || getCtx();
        ctx.fillStyle = getColor(r, g, b, a);
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        return gfx;
      },
      polygon: (pts, r, g, b, a) => {
        ctx = ctx || getCtx();
        ctx.fillStyle = getColor(r, g, b, a);
        ctx.beginPath();
        ctx.moveTo(...pts[0]);
        for (let i = 1; i < pts.length; i++) ctx.lineTo(...pts[i]);
        ctx.fill();
        return gfx;
      },
      triangle: (x1, y1, x2, y2, x3, y3, r, g, b, a) => {
        return gfx.polygon([[x1, y1], [x2, y2], [x3, y3]], r, g, b, a);
      },
    };
    canvas.PX_GFX_CACHE[key] = Object.freeze(gfx);
  }

  return gfx;
};


const createImageUtil = (os) => {
  let fs = os.FsRoot;
  let imgUtil = {
    setSetting: async (k, v) => {
      os.Settings.preInitSet(k, v);
      return;
      let settingsPath = '/system/config/settings.json';
      let settings = JSON.parse((await fs.fileReadText(settingsPath)).text);
      settings[k] = v;
      await fs.fileWriteText(settingsPath, JSON.stringify(settings));
    },
    makeTextFile: async (path, text, overrideIfExists) => {
      if (!overrideIfExists && await fs.fileExists(path)) return;
      await fs.mkdirs(fs.getParent(path));
      await fs.fileWriteText(path, text);
    },
    makeUrlBasedAudioFile: async (path, url, optMetadata) => {
      await fs.mkdirs(fs.getParent(path));
      await fs.fileWriteAudioByUrl(path, url, optMetadata);
    },
    makeUrlBasedBinaryFile: async (path, url) => {
      await fs.mkdirs(fs.getParent(path));
      await fs.fileWriteBinaryByUrl(path, url);
    },
    makeVirtualJsFile: async (path, category, id) => {
      if (await fs.fileExists(path)) return;
      await fs.mkdirs(fs.getParent(path));
      await fs.fileWriteVirtualJS(path, category, id);
    },
    makeCanvasBasedImageFile: async (path, canvas) => {
      await fs.mkdirs(fs.getParent(path));
      await fs.fileWriteImageCanvas(path, canvas);
    },
    makeUrlBasedImageFile: async (path, url, optMetadata) => {
      if (await fs.fileExists(path)) return;
      await fs.mkdirs(fs.getParent(path));
      await fs.fileWriteImageByUrl(path, url, optMetadata);
    },
    ensureDirExists: async (path) => {
      await fs.mkdirs(path);
    },
    setEnvironmentVariable: (name, value) => {
      os.EnvVars.set(name, Util.ensureString(value));
    },
    installApp: async (path, id, optOptions) => {
      let { name, inLauncher, mruBump, iconB64 } = optOptions || {};
      await fs.mkdirs(fs.getParent(path));
      await fs.fileCreateExecJs(path, id, name, iconB64);
      if (inLauncher) {
        os.LauncherRegistry.registerApp(path, !!mruBump);
      }
      os.ApplicationRegistry.registerApp(id, path, !!mruBump, !inLauncher);
    },
    installTheme: async (id, optShortName) => {
      let dir = '/system/themes';
      let shortName = optShortName || id.split('.').pop();
      await fs.mkdirs(dir);
      await imgUtil.makeVirtualJsFile(dir + '/' + shortName + '.theme', 'theme', id);
    },
    listFiles: async (dir) => fs.list(dir),
    pinToTaskbar: async (path) => {
      let pins = [];
      let pinCfg = '/home/config/taskbar-pins.txt';
      if (await fs.fileExists(pinCfg)) {
        let { text } = await fs.fileReadText(pinCfg);
        pins = Util.ensureString(text || '').split('\n').filter(Util.identity);
      }
      pins = [...pins, path];
      await imgUtil.makeTextFile(pinCfg, pins.join('\n'), true);
    },
  };
  return Object.freeze(imgUtil);
};


let staticVirtualJsLoader = (() => {

  let locked = false;

  let createDefaultLoader = (category) => {
    return id => PlexiOS.Util.loadScript(`/${category}/${id}.js`);
  };

  let bareLoaders = {};
  let loaders = {};
  let loading = {};
  let loaded = {};

  let loadJavaScript = async (category, id) => {
    let k = getLoadKey(category, id);
    if (loaded[k]) return loaded[k];
    if (locked) throw new Error("JS loader is locked");

    let loader = loaders[category];
    if (!loader) {
      let bareLoader = bareLoaders[category] || createDefaultLoader(category);
      loader = async (id_) => {
        let k_ = getLoadKey(category, id_);
        if (loaded[k_]) return loaded[k_];
        let resolver;
        let promise = new Promise(r => { resolver = r; });
        loading[k_] = { promise, resolver };
        bareLoader(id_);
        return promise;
      };
      loaders[category] = loader;
    }
    return loader(id);
  };

  let registerJavaScriptLoader = (category, fn) => {
    bareLoaders[category] = (id) => fn(id);
  };

  let getLoadKey = (category, id) => category + ' ' + id;

  let registerJavaScript = (category, id, payload) => {
    if (locked) return;
    let k = getLoadKey(category, id);
    loaded[k] = payload;
    if (loading[k]) loading[k].resolver(payload);
  };

  let awaitAllJavaScriptLoaders = async () => {
    await Promise.all(Object.values(loading).map(t => t.promise));
  };

  return Object.freeze({
    loadJavaScript,
    registerJavaScriptLoader,
    registerJavaScript,
    awaitAllJavaScriptLoaders,
    lockJavaScriptLoader: () => { locked = true; },
  });
})();

let {
  loadJavaScript,
  awaitAllJavaScriptLoaders,
  registerJavaScriptLoader,
  registerJavaScript,
  lockJavaScriptLoader,
} = staticVirtualJsLoader;


let createExecutionEngine = os => {

  let defaultPipes = {
    stdin: createPipe(),
    stdout: createPipe().setListener(t => console.log(t)),
    stderr: createPipe().setListener(t => console.error(t)),
  };

  let termLookup = Util.getTermCmdSet();

  let launchVirtualJavaScript = async (id, procInfo, args) => {
    if (termLookup.has(id.split('.').pop())) {
      await HtmlUtil.loadComponent('TerminalCommands');
    }
    let runnerFn = await staticVirtualJsLoader.loadJavaScript('app', id);
    await Promise.resolve(runnerFn(os, procInfo, args));
  };

  let launchPlexiScript = async (byteCode, procInfo, args) => {
    let [_, newPlexiRt] = await Promise.all([
      HtmlUtil.loadComponent('CommonScript_0_1_0'),
      HtmlUtil.loadComponent('PlexiScript_0_1_0'),
    ]);
    let plexiRt = newPlexiRt(os);
    if (typeof(byteCode) === 'string') {
      byteCode = Util.base64ToBytes(byteCode);
    }
    return getPlexiScriptBlockingPromise(plexiRt, byteCode, args, procInfo);
  };

  let getPlexiScriptBlockingPromise = async (plexiRt, byteCode, args, procInfo) => {
    let resolver;
    let p = new Promise(res => { resolver = res; });
    Util.pause(0).then(async () => {
      let pid = await procInfo.pid;
      let rtCtx = plexiRt.createRuntimeContext(byteCode, [...args], { procInfo: { ...procInfo, pid }, resolver });
      let mainTask = rtCtx.getMainTask();
      runPlexiTask(mainTask, resolver);
    });
    return p;
  };

  let runPlexiTask = async (task, resolver) => {
    let result = task.resume();
    while (true) {
      if (result.isSuccess()) return resolver(true);
      if (result.isError()) {
        console.error(result.getError()[0]);
        return resolver(false);
      }
      if (result.isSuspend()) return null;
      if (result.isTimedSleep()) {
        await Util.pause(result.getSleepAmountMillis() / 1000);
        result = task.resume();
      }
    }
  };

  let launchFileNonBlocking = (path, optArgs, optCwd, optPipes) => {
    let pipes = { ...defaultPipes, ...(optPipes || {}) };
    let env = os.EnvVars.snapshot();
    let cwd = optCwd || '/';
    let pid;
    let args = (optArgs || []).map(v => `${v}`);

    let procStartedResolver;
    let procStartedPromise = new Promise(r => { procStartedResolver = r; });

    let impl = async () => {

      let execInfo = await os.FsRoot.getExecInfo(path);
      if (!execInfo) throw new Error("not found");
      let { isValid, isPlx, isJs } = execInfo;
      if (!isValid) throw new Error("not an executable file");

      // TOO: allocProcess also reads the icon using execInfo. You should
      // pass it in with the icon information already fetched here.

      pid = os.ProcessManager.allocProc(path, '~' + path);
      let procInfo = { pid, cwd, env, ...pipes };

      let appPromise;
      if (isJs) {
        appPromise = launchVirtualJavaScript(execInfo.appId, procInfo, args);
      } else if (isPlx) {
        appPromise = launchPlexiScript(execInfo.byteCode, procInfo, args);
      } else {
        throw new Error("Not implemented");
      }

      // Wait for the app runner to finish OR if the process was artificially killed.
      await Util.blockTillFirstPromiseResolution([
        appPromise,
        os.ProcessManager.awaitProcess(pid),
      ]);

      // If the process finished naturally, we'll need to clean up the process manually.
      os.ProcessManager.killProcess(pid);
    };

    let procEndedPromise = impl().then(async () => {
      // For early-return errors, we need to make sure no one is blocked on
      // the start signal. No-op if already fired in normal circumstances.
      await procStartedResolver(true);
    });

    return {
      getPid: async () => {
        await procStartedPromise;
        return pid;
      },
      procEndedPromise,
      procStartedPromise,

      // TODO: these are the old names. Migrate them to the above more descriptive field names.
      startPromise: procStartedPromise,
      promise: procEndedPromise,
    };

  };

  let launchFile = async (path, optArgs, optCwd, optPipes) => {
    await launchFileNonBlocking(path, optArgs, optCwd, optPipes).procEndedPromise;
  };

  return Object.freeze({
    launchFile,
    launchFileNonBlocking,
  });
};


let createPlexiNativeInterface = (os, proc, cwd) => {
  let pni = {};
  pni.game_create_window = (task, args) => {};
  return Object.freeze({ ...pni });
};


const staticAppRegistry = (() => {
  let apps = {};
  let appLoaders = {};
  let appNames = {};
  let appIcons = {};
  let loadAppById = id => Util.loadScript('apps/' + id + '.js');
  return Object.freeze({
    setAppLoader: f => { loadAppById = f; },
    loadApp: async (id) => {
      if (apps[id]) return true;
      if (appLoaders[id]) return appLoaders[id].promise;

      let res = null;
      let p = new Promise(r => { res = r; });
      appLoaders[id] = { promise: p, resolver: res };
      loadAppById(id);
      return p;
    },
    registerApp: async (id, runner, iconUri) => {
      apps[id] = runner;
      if (iconUri) {
        appIcons[id] = await Util.loadImageUri(iconUri);
      }
      if (appLoaders[id]) appLoaders[id].resolver(true);
    },
    registerAppMetadata: async (id, name, iconUriOrCanvas) => {
      if (name) appNames[id] = name;
      if (iconUriOrCanvas) appIcons[id] = typeof iconUriOrCanvas === 'string' ? await Util.loadImageUri(iconUri) : iconUriOrCanvas;
    },
    getApp: id => {
      return apps[id] ? { runner: apps[id], icon: appIcons[id] || null } : null;
    },
    getAppMetadata: id => {
      return appNames[id] ? { id, name: appNames[id], icon: appIcons[id], isLoaded: !!apps[id] } : null;
    },
  });
})();

const createAppRegistry = () => {
  let appById = {};
  let mru = {};

  let registerApp = (id, path, useArtificialMru, omitFromLauncher) => {
    let staticData = staticAppRegistry.getAppMetadata(id);
    if (!staticData) staticData = { id, name: id.split('.').pop() };

    appById[id] = { ...staticData, path, mru: 0, isLoaded: false, inLauncher: !omitFromLauncher };
    if (useArtificialMru) mru[id] = 1; // this will cause it to show up in the launcher first
  };

  let getApp = async (id, tickleMru, metadataOnly) => {
    let app = appById[id];
    if (!app) return null;
    if (tickleMru) mru[id] = Util.getTime();
    if (!metadataOnly && !app.isLoaded) {
      await staticAppRegistry.loadApp(id);
      app.isLoaded = true;
    }

    let stApp = { ...(staticAppRegistry.getApp(id) || {}), ...(staticAppRegistry.getAppMetadata(id) || {}) };
    app.icon = app.icon || stApp.icon;
    app.runner = app.runner || stApp.runner;
    app.name = stApp.name || app.name; // not a typo

    return app;
  };

  let getLauncherApps = () => {
    let apps = Object.values(appById).filter(app => app.inLauncher)
      .map(app => {
        return {
          mru: mru[app.id] || 0,
          app,
          name: app.name,
          id: app.id,
          icon: app.icon,
          path: app.path,
        };
      });
    apps.sort((a, b) => {
      let c = -(a.mru - b.mru);
      if (c) return c;
      return a.name.localeCompare(b.name);
    });
    return apps.map(app => {
      return { id: app.id, name: app.name, icon: app.icon };
    });
  };

  let listAll = () => {
    return Object.values(appById).map(app => {
      let md = staticAppRegistry.getAppMetadata(app.id) || {};
      let a = {
        id: app.id,
        icon: app.icon || md.icon,
        name: app.name || md.name,
      };
      a.sortKey = app.name.toLowerCase() + '\n' + app.id;
      return a;
    });
  };

  let removeApp = async (os, id, includeUserData) => {
    if (appById[id]) {
      let path = appById[id].path;
      os.LauncherRegistry.removeApp(id);
      await os.Shell.Taskbar.toggleAppPin(path, false);
      await os.FileActions.removeApp(path);
      delete appById[id];
      if (await os.FsRoot.fileExists(path)) {
        await os.FsRoot.del(path);
      }
      let userDir = '/appdata/' + id;
      if (includeUserData && await os.FsRoot.dirExists(userDir)) {
        await os.FsRoot.del(userDir);
      }
    }
  };

  return Object.freeze({
    getApp,
    getLauncherApps,
    listAll,
    registerApp,
    removeApp,
  });
};


let createAppSettingsStore = (fs) => {
  let getScope = (id) => {
    let dir = '/appdata/' + id + '/';
    let jsonPath = dir + 'settings.json';

    let loadSettings = async () => {
      if (!await fs.fileExists(jsonPath)) return {};
      let d = await fs.fileReadText(jsonPath);
      if (d.ok) return Util.tryParseJson(d.text);
      return {};
    };

    let resolver;
    let settingsPromise = new Promise(r => {
      resolver = r;
    });

    let settings = null;

    let wait = async () => { await settingsPromise; };
    loadSettings().then(s => {
      settings = s;
      resolver(true);
    });

    let setFlush = async (k, v) => {
      if (!settings) { await wait(); }
      settings[k] = v;
      await fs.mkdirs(dir);
      await fs.fileWriteText(dir + 'settings.json', JSON.stringify(settings));
    };
    let getStringSync = k => settings[k] || '';
    let getBooleanSync = k => !!settings[k];
    return Object.freeze({
      wait,
      invalidate: async () => { settings = await loadSettings(); },
      getString: async k => { await wait(); return getStringSync(k); },
      getStringSync,
      setString: async (k, v) => setFlush(k, v),
      getBoolean: async k => { await wait(); return getBooleanSync(k); },
      getBooleanSync,
      setBoolean: async (k, v) => setFlush(k, !!v),
    });
  };

  return Object.freeze({
    getScope,
  });
};


const staticMetadata = (()=> {

    let metadata = {};

    let registerMetadataHint = async (appId, name, iconCanvasOrB64) => {
        throw new Error();
    };

    let getMetadataHint = appId => {
        throw new Error();
    };

    return Object.freeze({
        registerMetadataHint,
        getMetadataHint,
    });
})();


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


const PlexiFS = (() => {

  let now = () => new Date().getTime() / 1000;
  let pause = async (sec) => new Promise(r => setTimeout(() => r(true), Math.floor(Math.max(0, sec * 1000 + .5))));

  let throttle = (fn, timeout) => {
    let queued = false;
    return () => {
      if (queued) return;
      queued = true;
      let delayMillis = Math.floor(1000 * timeout);
      setTimeout(
        () => { queued = false; fn(); },
        delayMillis);
    };
  };

  let letters = 'abcdefghijklmnopqrstuvwxyz';
  let b64 = (letters.toUpperCase() + letters + '0123456789+/').split('');
  let b64Lookup = {};
  b64.forEach((c, i) => { b64Lookup[c] = i; });

  let bytesToBase64 = bytes => {
    let pairs = [];
    let b;
    for (let i = 0; i < bytes.length; i++) {
      b = bytes[i];
      pairs.push((b >> 6) & 3, (b >> 4) & 3, (b >> 2) & 3, b & 3);
    }
    while (pairs.length % 3 !== 0) pairs.push(0);
    let sb = '';
    for (let i = 0; i < pairs.length; i += 3) {
      b = (pairs[i] << 4) | (pairs[i + 1] << 2) | pairs[i + 2];
      sb += b64[b];
    }
    while (sb.length % 4 !== 0) sb += '=';
    return sb;
  };

  let base64ToBytes = b64 => {
    let pairs = [];
    let chars = b64.split('');
    while (chars.length && chars[chars.length - 1] === '=') chars.pop();
    let b;
    for (let c of chars) {
      b = b64Lookup[c] || 0;
      pairs.push((b >> 4) & 3, (b >> 2) & 3, b & 3);
    }
    while (pairs.length % 4) pairs.pop();
    let bytes = [];
    let len = pairs.length;

    for (let i = 0; i < len; i += 4) {
      bytes.push((pairs[i] << 6) | (pairs[i + 1] << 4) | (pairs[i + 2] << 2) | pairs[i + 3]);
    }
    return new Uint8Array(bytes);
  };

  let base64ToLength = b64 => {
    let equals = 0;
    if (b64.length > 0 && b64[b64.length - 1] === '=') equals++;
    if (b64.length > 1 && b64[b64.length - 2] === '=') equals++;
    let bits = (b64.length - equals) * 6;
    let bytes = Math.floor(bits / 8);
    return bytes;
  };

  let gbc = [...b64];
  gbc.pop();
  gbc.pop();
  let generateGibberish = sz => {
    let s = '';
    while (sz --> 0) s += gbc[Math.floor(Math.random() * gbc.length)];
    return s;
  };

  let sendJsonPost = async (url, payload) => {
    let res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'appiclation/json',
      },
      body: JSON.stringify(payload),
    });
    return await res.json();
  };

  let sendApiPost = async (authToken, apiUrl, payload) => {
    return sendJsonPost(apiUrl, { auth: authToken, ...payload });
  };

  let apiSenderPerAuthAndApi = {};

  let getSenderBucket = (authToken, apiUrl) => {
    let key = JSON.stringify([authToken, apiUrl]);
    if (!apiSenderPerAuthAndApi[key]) {
      apiSenderPerAuthAndApi[key] = {
        volumes: {},
        blobsByString: {},
        blobsByBase64: {},
      };
    }
    return apiSenderPerAuthAndApi[key];
  };

  let getVolumeBucket = (authToken, apiUrl, volId) => {
    let bucket = getSenderBucket(authToken, apiUrl);
    let volumeBucket = bucket.volumes[volId];
    if (!volumeBucket) {
      volumeBucket = { id: volId, reads: [], mutates: [] };
      bucket.volumes[volId] = volumeBucket;
    }
    return bucket.volumes[volId];
  };

  let addMutateCommand = (authToken, apiUrl, volId, command) => {
    getVolumeBucket(authToken, apiUrl, volId).mutates.push({ payload: command });
    setTimeout(() => tryFlush(authToken, apiUrl), 8000);
  };

  let sendReadAction = async (authToken, apiUrl, volId, command, priority) => {
    let resolver;
    let promise = new Promise(r => { resolver = r; });
    getVolumeBucket(authToken, apiUrl, volId).reads.push({ payload: { ...command }, resolver });
    setTimeout(() => tryFlush(authToken, apiUrl), priority ? 50 : 8000);
    return promise;
  };

  let tryFlush = async (authToken, apiUrl) => {
    // TODO: check throttling
    doFlush(authToken, apiUrl);
  }

  let doFlush = async (authToken, apiUrl) => {
    let senderBucket = getSenderBucket(authToken, apiUrl);
    let { volumes, blobsByString, blobsByBase64 } = senderBucket;
    senderBucket.volumes = [];
    senderBucket.blobsByString = {};
    senderBucket.blobsByBase64 = {};
    let transitResolver;
    senderBucket.transitPromise = new Promise(r => { transitResolver = r; });

    let request = {
      blobs: [],
      volumes: [],
    };

    let index = 0;
    for (let blob of Object.values(blobsByString)) {
      request.blobs.push({ type: 'TEXT', value: blob.data });
      blob.index = index++;
    }
    for (let blob of Object.values(blobsByBase64)) {
      request.blobs.push({ type: 'BINARY', value: blob.data });
      blob.index = index++;
    }
    let resolverByTag = {};
    let resolversByVolumeId = {};
    let tagAlloc = 1;
    for (let volume of Object.values(volumes)) {
      let actions = [];
      request.volumes.push({
        id: volume.id,
        actions: actions,
      });
      for (let command of [...volume.mutates, ...volume.reads]) {
        let { payload, resolver } = command;
        if (resolver) {
          if (payload.action === 'LATEST') {
            resolversByVolumeId[volume.id] = { resolver, next: resolversByVolumeId[volume.id] };
          } else {
            let tag = tagAlloc++;
            payload = { ...payload, tag };
            resolverByTag[tag] = resolver;
          }
        };
        actions.push(payload);
      }
    }

    let response = await sendApiPost(authToken, apiUrl, swapTempRefForBlobIndex(request));

    if (!response.ok) throw new Error(JSON.stringify(response));
    for (let volumeRes of response.volumes) {
      let { id, ver, steps } = volumeRes;
      for (let resNode = resolversByVolumeId[id]; !!resNode; resNode = resNode.next) {
        resNode.resolver({ ver, initSteps: steps });
      }
    }

    senderBucket.transitPromise = null;
    transitResolver(true);
  };

  let swapTempRefForBlobIndex = data => {
    if (typeof data === 'object') {
      if (Array.isArray(data)) return data.map(swapTempRefForBlobIndex);
      let output = {};
      for (let k of Object.keys(data)) {
        if (k === 'TEMP_REF') {
          output.blobIndex = data[k].index;
        } else {
          output[k] = swapTempRefForBlobIndex(data[k]);
        }
      }
      return output;
    }
    return data;
  };

  let addBlobToLookupAndGetRef = (lookup, blob, size, isBinary) => {
    if (!lookup[blob]) {
      lookup[blob] = { data: blob, size, isBinary };
    }
    return lookup[blob];
  };
  let addStringBlob = (authToken, apiUrl, str) => {
    let lookup = getSenderBucket(authToken, apiUrl).blobsByString;
    str += '';
    let size = new TextEncoder().encode(str).length;
    return addBlobToLookupAndGetRef(lookup, str, size, false);
  };
  let addBinaryBlob = (authToken, apiUrl, byteBuf) => {
    return addBase64Blob(authToken, apiUrl, bytesToBase64(byteBuf), byteBuf.length);
  };
  let addBase64Blob = (authToken, apiUrl, b64Str, sz = null) => {
    let lookup = getSenderBucket(authToken, apiUrl).blobsByBase64;
    let size = sz || base64ToLength(b64Str);
    return addBlobToLookupAndGetRef(lookup, b64Str, size, true);
  };

  let createNode = (name, isDir, parent) => {
    let node = { name, isDir, parent };
    if (isDir) {
      node.children = {};
    } else {
      node.content = {};
      node.isLoaded = false;
      node.size = 0;
      node.cacheObj = {};
      node.locKeys = {}; // local storage only
    }
    return node;
  };

  let init = (type, volId, authToken, apiUrl) => {
    let onReady;
    let readyPromise = new Promise(res => { onReady = res; });

    let version = null;
    let lastSync = 0;

    let root = createNode('', true, null);

    let isMem = type === 'MEM';
    let isSync = type === 'SYNC';
    let isLocal = type === 'LOCAL';

    let syncPromise = null;

    if (isSync) {
      pause(0.001).then(async () => {
        await performRemoteSync(true);
        onReady(true);
      });
    } else if (isLocal) {
      apiUrl = '##LOCAL##';
      authToken = '';
    }

    let getSyncVerVerifyDelay = important => {
      if (isLocal) return important ? 2 : 5;
      if (isSync) return important ? 5 : 15;
      return 1;
    };

    let ensureReasonablyUpToDate = async (itsImportant) => {

      if (isMem) return;

      if (syncPromise) {
        await syncPromise;
        return;
      }

      let delay = getSyncVerVerifyDelay(itsImportant);
      if (now() - lastSync > delay) {
        if (isLocal) {
          performLocalStorageSync(true);
        } else if (isSync) {
          await performRemoteSync(true);
        }
      }
    };

    let handleSyncInitSteps = (steps) => {
      let unwrapString = raw => {
        if (raw[0] === '@') return atob(raw.substring(1));
        return raw;
      };
      let lines = steps.split('\n').map(line => line.trim()).map(line => {
        let parts = line.split(',');
        switch (parts[0]) {
          case '^':
            return { up: true };
          case 'D':
            return { dir: true, name: unwrapString(parts[1]) };
          case 'F':
            return { file: true, name: unwrapString(parts[1]), size: parseInt(parts[2]) || 0, hasIcon: parts[3] === 'ico' };
          default:
            return null;
        }
      }).filter(v => v);

      root.children = {};
      let cwd = root;
      for (let instr of lines) {
        if (instr.file) {
          let node = createNode(instr.name, false, cwd);
          cwd.children[instr.name] = node;
          node.size = instr.size;
        } else if (instr.dir) {
          let node = createNode(instr.name, true, cwd);
          cwd.children[instr.name] = node;
          cwd = node;
        } else if (instr.up) {
          cwd = cwd.parent;
        } else {
          throw new Error();
        }
      }
    };

    let localData = (() => {

      let tryParseJson = s => {
        if (s === null) return null;
        try {
          return JSON.parse(s);
        } catch (e) {
          return null;
        }
      };
      let LOC_RAW = {
        get: (k, defaultVal) => {
          let v = tryParseJson(localStorage.getItem(k));
          if (v === null) return defaultVal;
          return v;
        },
        set: (k, v) => {
          localStorage.setItem(k, JSON.stringify(v));
        },
        remove: (k) => {
          localStorage.removeItem(k);
        },
        list: () => {
          let sz = localStorage.length;
          let o = [];
          for (let i = 0; i < sz; i++) {
            o.push(localStorage.key(i));
          }
          return o;
        },
      };

      let key = null;
      let volInfo = null;
      let getKey = () => {
        if (key) return key;
        let vols = LOC_RAW.get('PLXFS_vols', []);
        while (vols.length & 1) vols.pop();
        for (let i = 0; i < vols.length; i += 2) {
          if (vols[i] === volId) return vols[i + 1];
        }
        key = generateGibberish(7);
        vols.push(volId, key);
        LOC_RAW.set('PLXFS_vol_' + key, { name: volId, key, size: 0, nextId: 1, versionId: generateGibberish(10) });
        LOC_RAW.set('PLXFS_vols', vols);
        return key;
      };
      let LOC = {
        updateVol: (size, optNextId) => {
          LOC_RAW.set(
            'PLXFS_vol_' + getKey(),
            {
              ...LOC.getVolInfo(),
              ...(optNextId ? { nextId: optNextId } : {}),
              ...{ size, versionId: generateGibberish(10) }
            });
        },
        getActualVolVersion: () => (LOC.getVolInfo(true) || {}).versionId || '',
        getVolInfo: (skipCache) => {
          if (!skipCache && volInfo) return volInfo;
          let k = 'PLXFS_vol_' + getKey();
          let v = LOC_RAW.get(k, null);
          if (v === null) { init(); v = LOC_RAW.get(k, null); }
          volInfo = v;
          return v;
        },
        getFileList: () => {
          let k = 'PLXFS_list_' + getKey();
          let v = LOC_RAW.get(k, null);
          if (v === null) { init(); v = LOC_RAW.get(k, []); }
          return v;
        },
        getFileContent: (id) => {
          let k = 'PLXFS_file_' + getKey() + '_' + id;
          let v = LOC_RAW.get(k, null);
          if (v === null) { LOC.getVolInfo(); v = LOC_RAW.get(k, null); }
          return v;
        },
      };

      let getKeyedFileContent = (keysToIds) => {
        let output = {};
        for (let k of Object.keys(keysToIds)) {
          let id = keysToIds[k]
          let v = LOC.getFileContent(id) || null;
          if (v && typeof v === 'object') {
            let isBinary = !!v.isBinary;
            let data = v.data;
            let size = base64ToLength(data);
            if (isBinary) size = Math.floor(size * 3 / 4);
            output[k] = { isBinary, data, size };
          }
        }
        return output;
      };

      let saveNodeContent = (node) => {

        let parts = [];
        let walker = node;
        while (walker) {
          parts.push(walker.name);
          walker = walker.parent;
        }

        let volInfo = LOC.getVolInfo(true);
        let path = parts.reverse().join('/');
        let fileList = LOC.getFileList();
        let oldIdHints = {};
        fileList = fileList.filter(item => {
          let [ itemPath, isDir, sz, oldKeys ] = item;
          if (itemPath !== path) {
            return true;
          }
          if (isDir) throw new Error(); // writing to directory is not allowed
          oldIdHints = oldKeys;
          return false;
        });

        let nextId = volInfo.nextId;
        let finalIds = {};

        for (let key of Object.keys(node.content)) {
          let blob = node.content[key];
          let newData = blob.data;
          let isBinary = blob.isBinary;
          let oldId = oldIdHints[key];
          let oldData = oldId ? LOC.getFileContent(oldId) : null;
          let id;
          if (!oldData || oldData.isBinary !== isBinary || oldData.data !== newData) {
            id = nextId++;
            LOC_RAW.set('PLXFS_file_' + getKey() + '_' + id, { isBinary, data: newData });
          } else {
            id = oldId;
          }
          finalIds[key] = id;
        }

        node.locKeys = finalIds;

        fileList.push([path, 0, node.size, finalIds]);
        saveFileList(fileList, nextId);
      };

      let saveFileList = (items, optNextId) => {
        let allPaths = {};
        allPaths['/'] = true;
        for (let item of items) {
          allPaths[item[0]] = item;
        }
        for (let i = 0; i < items.length; i++) {
          let t = items[i][0].split('/');
          t.pop();
          let parent = t.join('/') || '/';
          if (!allPaths[parent]) {
            let newItem = [parent, 1];
            allPaths[parent] = newItem;
            items.push(newItem);
          }
        }
        delete allPaths['/'];
        let newItemList = Object.values(allPaths);
        let volumeSize = newItemList.reduce((acc, item) => acc + (item[2] || 0), 0);
        LOC_RAW.set('PLXFS_list_' + getKey(), newItemList);
        LOC.updateVol(volumeSize, optNextId);
        version = localData.getLocVer();
      };

      let mkdir = node => {
        let pathParts = [];
        let walker = node;
        while (walker) {
          pathParts.push(walker.name);
          walker = walker.parent;
        }
        let fullPath = pathParts.reverse().join('/');
        let oldFileList = LOC.getFileList() || [];
        saveFileList([...oldFileList, [fullPath, 1]]);
      };

      let isSyncNecessary = () => !version || version !== LOC.getActualVolVersion();

      return {
        getFileList: () => LOC.getFileList(),
        getLocVer: () => LOC.getActualVolVersion(),
        getKeyedFileContent,
        saveNodeContent,
        mkdir,
        isSyncNecessary,
      };
    })();

    let performRemoteSync = async (important) => {
      let delay = important ? 5 : 15;
      if (now() - lastSync < delay) return;

      let { ver, initSteps } = await sendReadAction(authToken, apiUrl, volId, { action: 'LATEST' }, important);
      handleSyncInitSteps(initSteps);
      lastSync = now();
      version = ver;
      tickleRecursive('/');
    };

    let performLocalStorageSync = async (important) => {
      let delay = getSyncVerVerifyDelay(important);
      if (now() - lastSync < delay) return;

      if (!localData.isSyncNecessary()) return;

      let volItems = localData.getFileList();

      let files = [];
      let dirs = [];
      for (let volItem of volItems) {
        let [path, isDir, size, keys] = volItem;
        if (!isDir) {
          files.push({ path, size, keys });
        } else {
          dirs.push(path);
        }
      }
      let getParent = path => {
        if (path === '/') throw new Error();
        let t = path.split('/');
        t.pop();
        let walker = root;
        for (let i = 1; i < t.length; i++) {
          walker = walker.children[t[i]];
        }
        return walker;
      };
      dirs.sort((a, b) => a.length - b.length);
      let items = [...dirs.map(d => ({ path: d, isDir: true })), ...files];
      for (let item of items) {
        let name = item.path.split('/').pop();
        let parent = getParent(item.path);
        let node = createNode(name, item.isDir, parent);
        parent.children[name] = node;
        if (!item.isDir) {
          node.size = item.size;
          node.isLoaded = false;
          node.locKeys = item.keys;
        }
      }

      version = localData.getLocVer();
      lastSync = now();
      tickleRecursive('/');
    };

    let syncImpl = {
      MEM: () => {},
      LOCAL: performLocalStorageSync,
      SYNC: performRemoteSync,
    }[type];

    let trySync = async (important) => {
      if (syncPromise) return syncPromise;
      syncPromise = new Promise(async onComplete => {
        // imperceptible delay to help minimize race conditions in consumer code when toggling storage modes
        await pause(0.001);

        await Promise.resolve(syncImpl(important));
        syncPromise = null;
        onComplete(null);
      });
      return syncPromise;
    };

    let toCanonParts = (path, returnNullOnFailure) => {
      let parts = path.split('/');
      let builder = [];
      for (let part of parts) {
        if (part === '.' || part === '') { }
        else if (part === '..') {
          if (builder.length) builder.pop();
          else {
            if (returnNullOnFailure) return null;
            throw new Error("Invalid path: " + path);
          }
        } else {
          builder.push(part);
        }
      }
      return builder;
    };

    let toCanonPath = (path, returnNullOnFailure) => {
      let parts = toCanonParts(path, returnNullOnFailure);
      if (parts === null) return null;
      return parts.length ? '/' + parts.join('/') : '/';
    };

    let getNode = path => {
      let current = root;
      for (let part of toCanonParts(path)) {
        if (!current.isDir || !current.children[part]) return null;
        current = current.children[part];
      }
      if (isLocal && !current.isDir && !current.isLoaded) {
        current.content = localData.getKeyedFileContent(current.locKeys);
        current.isLoaded = true;
      }

      return current;
    };

    let list = async (path) => {
      await ensureReasonablyUpToDate();
      let node = getNode(path);
      if (!node || !node.isDir) return { ok: false };
      let items = Object.keys(node.children).sort().map(name => {
        let child = node.children[name];
        return { name, isDir: child.isDir, size: child.isDir ? 0 : child.size };
      });
      return { ok: true, items };
    };

    let writeBlob = (blobPayload, imageIsJpeg) => {
      if (blobPayload === false || blobPayload === null || blobPayload === undefined) {
        return { size: 0, data: '' };
      } else if (blobPayload instanceof HTMLCanvasElement) {
        let b64Str = blobPayload.toDataURL(imageIsJpeg ? 'image/png' : 'image/jpeg').split(',').pop();
        return addBase64Blob(authToken, apiUrl, b64Str);
      } else if (typeof blobPayload === 'object') {
        return addBinaryBlob(authToken, apiUrl, blobPayload);
      } else if (typeof blobPayload === 'string') {
        return addStringBlob(authToken, apiUrl, blobPayload);
      } else {
        throw new Error();
      }
    };

    let endsWithJpeg = name => {
      let parts = name.split('/').pop().split('.');
      if (parts.length < 2) return false;
      let ext = parts.pop().toLowerCase();
      return ext === 'jpg' || ext === 'jpeg';
    };

    let write = async (path, mainData, keyedData) => {
      let canonPath = toCanonPath(path);
      await ensureReasonablyUpToDate();
      let parent = getNode(canonPath + '/..');
      if (!parent || !parent.isDir) return false;
      let name = canonPath.split('/').pop();
      let isJpeg = endsWithJpeg(name);
      let mainBlob = writeBlob(mainData, isJpeg);
      let keyedBlobs = { '': mainBlob };
      let size = mainBlob.size;
      for (let key of Object.keys(keyedData || {})) {
        let blob = writeBlob(keyedData[key], false);
        if (blob) {
          keyedBlobs[key] = blob;
          size += blob.size;
        }
      }

      let node = createNode(name, false, parent);
      parent.children[name] = node;
      node.content = keyedBlobs;
      node.size = size;

      if (isLocal) {
        localData.saveNodeContent(node);
      }

      if (isSync) {
        addMutateCommand(
          authToken,
          apiUrl,
          volId,
          {
            action: 'WRITE',
            path,
            blobs: Object.keys(keyedBlobs).map(k => ({ key: k, TEMP_REF: keyedBlobs[k] })),
          });
      }

      tickleDirect(canonPath);

      return true;
    };

    let mkdir = async (path, recursive) => {
      await ensureReasonablyUpToDate();
      let node = mkdirImpl(path, recursive);
      if (isSync) {
        addMutateCommand(authToken, apiUrl, volId, {
          action: 'MKDIR',
          path,
        });
      }

      if (isLocal) localData.mkdir(node);
    };

    let mkdirImpl = (path, recursive) => {
      let canonPath = toCanonPath(path);
      if (canonPath === '/') return;
      let parent = getNode(canonPath + '/..');
      if (!parent || !parent.isDir) {
        if (!recursive) return null;
        parent = mkdirImpl(getParent(path), true);
      }
      let name = canonPath.split('/').pop();
      let existingChild = parent.children[name];
      if (existingChild && existingChild.isDir) return existingChild;
      let node = createNode(name, true, parent);
      parent.children[name] = node;
      tickleDirect(canonPath);
      return node;
    };

    let move = async (fromPath, toPath, isCopy) => {
      fromPath = toCanonPath(fromPath);
      toPath = toCanonPath(toPath);
      if (fromPath === '/' || toPath === '/') throw new Error("Moving root");
      let a = fromPath + '\n';
      let b = toPath + '\n';
      if (a.startsWith(b) || b.startsWith(a)) throw new Error("Nested move");
      let name = toPath.split('/').pop();

      await ensureReasonablyUpToDate();

      let fromNode = getNode(fromPath);
      if (!fromNode) throw new Error("From path does not exist");
      let node = { ...fromNode, name };
      if (node.content) node.content = { ...node.content };
      let toNode = getNode(toPath);
      if (toNode) throw new Error("Target already exists");
      let fromParent = fromNode.parent;
      let toParent = getNode(toPath + '/..');
      if (!isCopy) delete fromParent.children[fromNode.name];
      toParent.children[node.name] = node;

      tickleDirect(fromPath);
      tickleDirect(toPath);
      tickleRecursive(fromPath);
      tickleRecursive(toPath);

      if (isSync) {
        addMutateCommand(authToken, apiUrl, volId, {
          action: isCopy ? 'CP' : 'MV',
          fromPath,
          toPath,
        });
      }
    };

    let del = async (path, idempotent) => {
      path = toCanonPath(path);
      if (path === '/') throw new Error("Cannot delete root");
      await ensureReasonablyUpToDate();
      let node = getNode(path);
      if (!node) {
        if (idempotent) return;
        throw new Error("Path does not exist");
      }
      let parent = node.parent;
      if (!parent) throw new Error(); // should not happen
      delete parent.children[node.name];

      tickleDirect(parent, true);
      tickleRecursive(path);

      if (isSync) {
        addMutateCommand(authToken, apiUrl, volId, {
          action: 'DEL',
          path,
        });
      }
    };

    let calculateDirSize = node => {
      if (!node || !node.isDir) return 0;
      let q = [node];
      let size = 0;
      while (q.length) {
        let cur = q.pop();
        for (let child of Object.values(cur.children)) {
          if (child.isDir) q.push(child);
          else size += child.size;
        }
      }
      return size;
    };

    let read = async (path, metadataOnly, includeRecursiveSize) => {
      path = toCanonPath(path);
      await ensureReasonablyUpToDate();

      let node = getNode(path);
      if (!node) return null;

      if (node.isDir) {
        if (includeRecursiveSize) {
          return { isDir: true, size: calculateDirSize(node) };
        }
        return { isDir: true };
      }

      let { size, content } = node;
      let keyContent = {};
      for (let k of Object.keys(content)) {
        let { data, isBinary } = content[k];
        keyContent[k] = isBinary ? base64ToBytes(data) : data;
      }
      let mainContent = keyContent[''] || null;

      if (metadataOnly) {
        return { isDir: false, size };
      }

      return { isDir: false, size, content: mainContent, keyedContent: keyContent, cache: node.cacheObj };
    };

    let flushUpdates = async () => {
      await performRemoteSync(true);
    };

    let watcherIdAlloc = 1;
    let watcherById = {};
    let watchersByPath = {};

    let tickledWatcherIds = {};

    let tickleDirect = (path, skipParent) => {
      for (let w of (watchersByPath[path] || [])) {
        tickledWatcherIds[w.id] = w.id;
      }
      if (!skipParent) {
        let t = toCanonParts(path);
        if (t.length) {
          t.pop();
          let parent = '/' + t.join('/');
          tickleDirect(parent, true);
        }
      }
      queueTickleFlush();
    };

    let tickleRecursive = path => {
      let allPaths = Object.keys(watchersByPath);
      let affectedPaths;
      if (path === '/') {
        affectedPaths = allPaths;
      } else {
        let pathPlusDelim = path + '/';
        for (let aPath of allPaths) {
          if (aPath.startsWith(pathPlusDelim)) {
            affectedPaths.push(aPath);
          }
        }
      }
      queueTickleFlush();
    };

    let performTickles = () => {
      let ids = Object.values(tickledWatcherIds);
      if (!ids.length) return;
      tickledWatcherIds = {};
      let watchers = ids.map(id => watcherById[id]).filter(v => !!v);
      for (let watcher of watchers) {
        let stillNeeded = watcher.fn();
        if (!stillNeeded) {
          removeWatcher(watcher.id);
        }
      }
    };

    let queueTickleFlush = throttle(() => performTickles(), 0.005);

    let removeWatcher = id => {
      let watcher = watcherById[id];
      if (watcher) {
        delete watcherById[id];
        let path = watcher.path;
        let bucket = watchersByPath[path].filter(w => w.id !== id);
        watchersByPath[path] = bucket;
        if (!bucket.length) delete watchersByPath[path];
      }
    };

    let addWatcher = (path, fn) => {
      let id = watcherIdAlloc++;
      let watcher = {
        id,
        path: toCanonPath(path),
        fn,
      };
      watcherById[id] = watcher;
      let bucket = watchersByPath[watcher.path];
      if (!bucket) {
        bucket = [];
        watchersByPath[watcher.path] = bucket;
      }
      bucket.push(watcher);
      return id;
    };

    let probe = async (path) => {
      path = toCanonPath(path);
      await ensureReasonablyUpToDate();
      let node = getNode(path);
      if (!node) return { status: '' };
      if (node.isDir) return { status: 'DIR' };
      return { status: 'FILE', size: node.size };
    };

    let getAbsolutePath = (cwd, path) => {
      return toCanonPath(path.startsWith('/') ? path : (cwd || '/') + '/' + path);
    };
    let getParent = path => {
      let parts = toCanonParts(path);
      if (!parts.length) return null;
      parts.pop();
      return '/' + parts.join('/');
    };

    let listRecursive = async (path, options) => {
      let { useStructs, useAbsolutePaths } = options || {};
      await ensureReasonablyUpToDate();
      path = toCanonPath(path);
      let node = getNode(path);
      if (!node) return null;
      let output = [];
      let impl = (current, rel, abs) => {
        if (current.isDir) {
          for (let child of Object.values(current.children)) {
            let childRel = rel === '' ? child.name : (rel + '/' + child.name);
            let childAbs = abs === '/' ? ('/' + child.name) : (abs + '/' + child.name);
            impl(child, childRel, childAbs);
          }
        }
        if (useStructs) {
          output.push({ isDir: current.isDir, name: current.name, relative: rel, absolute: abs });
        } else {
          output.push(useAbsolutePaths ? abs : rel);
        }
      };
      impl(node, '', path);
      output.pop(); // don't include input path
      return useStructs
        ? output.sort((a, b) => a.absolute.localeCompare(b.absolute))
        : output.sort();
    };

    let getProperties = async (paths) => {
      await ensureReasonablyUpToDate();
      return paths.map(path => {
        let cPath = toCanonPath(path);
        let node = cPath ? getNode(path) : null;
        let name = cPath.split('/').pop();
        let t = name.split('.');
        let ext = t.length > 1 ? t.pop().toUpperCase() : null;
        if (!ext || !/^[A-Z0-9]+$/.test(ext)) ext = null;
        let data = { path: cPath, name, found: true };
        if (!node) return { ...data, found: false };
        if (node.isDir) return { ...data, isDir: true, memberCount: Object.keys(node.children).length };
        return { ...data, isDir: false, size: node.size, ext };
      });
    };

    return Object.freeze({
      isReady: async () => !isSync || readyPromise.then(() => true),
      flushUpdates,
      addWatcher,
      removeWatcher,

      copy: async (fromPath, toPath) => move(fromPath, toPath, true),
      del,
      dirExists: async (path) => (await probe(path)).status === 'DIR',
      fileExists: async (path) => (await probe(path)).status === 'FILE',
      getAbsolutePath,
      getBatchProperties: async paths => getProperties(paths),
      getFileProperties: async path => (await getProperties([path]))[0],
      getParent,
      list,
      listRecursive,
      mkdir: async (path) => mkdir(path, false),
      mkdirs: async (path) => mkdir(path, true),
      move: async (fromPath, toPath) => move(fromPath, toPath, false),
      pathExists: async (path) => (await probe(path)).status !== '',
      read: async (path, metadataOnly, calculateSizeRecursive) => read(path, metadataOnly, calculateSizeRecursive),
      write,
    });
  };

  let ensureExistsOnServer = async (auth, url, volId, optOptions) => {
    let options = optOptions || {};
    let payload = {
      ensureVolume: true,
      volumeId: volId,
      ttl: options.ttl || null,
    };
    let result = await sendApiPost(auth, url, payload);
    console.log(result);
    return { ok: true };
  };

  return Object.freeze({
    initializeInMemoryFs: () => init('MEM'),
    initializeSyncedFs: (id, auth, url) => init('SYNC', id, auth, url),
    initializeLocalStorageFs: (id) => init('LOCAL', id),

    ensureSyncVolumeExists: async (auth, url, id, options) => ensureExistsOnServer(auth, url, id, options),
  });

})();


let createFsRouter = async () => {
  let [
    home,
    system,
    tmp,
    root,
    apps,
    appdata,
    volumesFsTemp,
    deleted,
  ] = await Promise.all([
    // PlexiFS.initializeSyncedFs('#home', 'auth', 'https://files.plexi.io/api'),
    // PlexiFS.initializeSyncedFs('#system', 'auth', 'https://files.plexi.io/api'),
    PlexiFS.initializeLocalStorageFs('home'),
    PlexiFS.initializeInMemoryFs(),
    PlexiFS.initializeInMemoryFs(),
    PlexiFS.initializeInMemoryFs(),
    PlexiFS.initializeInMemoryFs(),
    PlexiFS.initializeInMemoryFs(),
    PlexiFS.initializeInMemoryFs(),
    PlexiFS.initializeInMemoryFs(),
  ].map(async v => {
    await v.isReady()
    return v;
  }));
  let volLookup = {};
  let volIdAlloc = 1;
  let volumes = [
    { prefix: '/home', fs: home, id: volIdAlloc++ },
    { prefix: '/system', fs: system, id: volIdAlloc++ },
    { prefix: '/tmp', fs: tmp, id: volIdAlloc++ },
    { prefix: '/deleted', fs: deleted, id: volIdAlloc++ },
    { prefix: '/apps', fs: apps, id: volIdAlloc++ },
    { prefix: '/appdata', fs: appdata, id: volIdAlloc++ },
    { prefix: '/volumes', fs: volumesFsTemp, id: volIdAlloc++ },
    { prefix: '/', fs: root, isRoot: true, id: volIdAlloc++ },
  ].map(v => {
    v.initialized = false;
    let size = v.prefix.split('/').length - 1;
    v.trimPath = path => ('/' + path.split('/').slice(size + 1).join('/'));
    volLookup[v.prefix] = v;
    return v;
  });
  let rootVol = volLookup['/'];

  let getVolumeByPath = path => {
    if (path === '/') return rootVol;
    let parts = path.split('/')
    let p1 = volLookup['/' + parts[1]] || '';
    let p2 = parts.length > 1 ? volLookup['/' + parts[1] + '/' + parts[2]] : '';
    return p2 || p1 || rootVol;
  };

  // wraps the file system function such that it will find the volume for
  // the given path arguments and call the function with those paths scoped
  // and trimmed.
  let wrapVolFunc = (fnName, pathArgs, mixedVolCallback, returnVols) => {
    return (...args) => {
      let vols = pathArgs.map(argIndex => getVolumeByPath(args[argIndex]));
      if (vols.length >= 2) {
        let allSame = vols[0] === vols[1];
        for (let i = 2; i < vols.length; i++) {
          allSame = allSame && vols[i - 1] === vols[i];
        }
        if (!allSame) return mixedVolCallback(args, vols);
      }
      let safeArgs = [...args];
      let vol = vols[0];
      let fn = vol.fs[fnName];
      for (let pathIndex of pathArgs) {
        safeArgs[pathIndex] = vol.trimPath(args[pathIndex]);
        if (vol.isRoot) {
          switch (fnName) {
            case 'write':
              throw new Error("Cannot write file here.");
            case 'del':
              throw new Error("Cannot delete this file/directory.");
            case 'mkdir':
            case 'mkdirs':
              if (args[pathIndex] === '/') break;
              throw new Error("Cannot create directory here.");
          }
        }
      }
      return returnVols
        ? { value: fn(...safeArgs), vols }
        : fn(...safeArgs);
    };
  };

  let addWatcherDirect = wrapVolFunc('addWatcher', [0], null, true);
  let delDirect = wrapVolFunc('del', [0]);
  let dirExistsDirect = wrapVolFunc('dirExists', [0]);
  let fileExistsDirect = wrapVolFunc('fileExists', [0]);
  let pathExistsDirect = wrapVolFunc('pathExists', [0]);
  let getFilePropertiesDirect = wrapVolFunc('getFileProperties', [0]);
  let listDirect = wrapVolFunc('list', [0]);
  let readDirect = wrapVolFunc('read', [0]);
  let mkdirDirect = wrapVolFunc('mkdir', [0]);
  let mkdirsDirect = wrapVolFunc('mkdirs', [0]);
  let writeDirect = wrapVolFunc('write', [0]);
  let listRecursiveDirect = wrapVolFunc('listRecursive', [0], null, true);

  let copyDirect = wrapVolFunc('copy', [0, 1], async (args, vols) => {
    let [fromPathFull, toPathFull] = args;
    let [fromVol, toVol] = vols;
    let fromPath = fromVol.trimPath(fromPathFull);
    let toPath = toVol.trimPath(toPathFull);
    let data = await fromVol.fs.read(fromPath, false);
    if (!data) return { ok: false };

    let copies;
    if (data.isDir) {
      let paths = await fromVol.fs.listRecursive(fromPath, { useStructs: true });

      copies = await Promise.all(paths.map(async pathInfo => {
        let { isDir, absolute, relative } = pathInfo;
        return { isDir, toPath: toPath + '/' + relative, fromPath: absolute };
      }));
      copies.push({ isDir: true, toPath });
      copies.sort((a, b) => a.toPath.length - b.toPath.length)

      await Promise.all(copies.filter(v => !v.isDir).map(async v => {
        v.data = await fromVol.fs.read(v.fromPath, false);
      }));
    } else {
      copies = [
        { isDir: false, data, fromPath, toPath },
      ];
    }

    await Promise.all(copies.map(async v => {
      if (v.isDir) {
        await toVol.fs.mkdirs(v.toPath);
      } else {
        let kc = { ...v.data.keyedContent, "": 0 };
        delete kc[''];
        await toVol.fs.write(v.toPath, v.data.content, kc);
      }
    }));

    return { ok: true };
  });
  let moveDirect = wrapVolFunc('move', [0, 1], async (args) => {
    let [fromPath, toPath] = args;
    // TODO: somehow check if deletion is possible before attempting to copy.
    await unifiedFs.copy(fromPath, toPath);
    await unifiedFs.del(fromPath, true);
  });

  let mkdirImpl = (path, recursive) => {
    if (volLookup[path]) return;
    let parts = path.split('/');
    if (parts[1] === 'volumes') throw new Error("Not implemented");
    return recursive ? mkdirsDirect(path) : mkdirDirect(path);
  };

  // special watchers act just like regular watchers, but watch
  // virtual directories of mounted volumes. Such as / or /appdata.
  // They should get fired when new volumes are mounted or removed.
  // Because there's probably so few, it's easiest to just store them
  // in one big ol' list.
  let specialWatcherIdAlloc = 1;
  let specialWatchers = [];

  let unifiedFs = {
    isReady: async () => {
      await Promise.all(volumes.map(v => {
        return v.fs.isReady();
      }));
    },

    addWatcher: (path, fn) => {
      if (path === '/' || path === '/appdata' || path === '/volumes') {
        let w = { isSpecial: true, id: specialWatcherIdAlloc++, path, fn };
        specialWatchers.push(w);
        return w;
      }
      let { value, vols } = addWatcherDirect(path, fn);
      return { isSpecial: false, id: value, fs: vols[0].fs };
    },
    removeWatcher: (watcher) => {
      if (watcher.isSpecial) {
        specialWatchers = specialWatchers.filter(w => w.id !== watcher.id);
      } else {
        watcher.fs.removeWatcher(watcher.id);
      }
    },

    getAbsolutePath: path => root.getAbsolutePath(path),
    getParent: path => root.getParent(path),

    copy: async (fromPath, toPath) => copyDirect(fromPath, toPath),
    del: async (path, idempotent) => delDirect(path, idempotent),
    dirExists: async (path) => dirExistsDirect(path),
    fileExists: async (path) => fileExistsDirect(path),
    getFileProperties: async (path) => getFilePropertiesDirect(path),
    mkdir: async (path) => mkdirImpl(path, false),
    mkdirs: async (path) => mkdirImpl(path, true),
    move: async (fromPath, toPath) => moveDirect(fromPath, toPath),
    pathExists: async (path) => pathExistsDirect(path),
    read: async (path, metadataOnly) => readDirect(path, metadataOnly),
    write: async (path, mainData, keyedData) => writeDirect(path, mainData, keyedData),

    getBatchProperties: async (paths) => {
      let pathsByVolumeId = {};
      let argInfo = paths.map((path, index) => ({ path, index, volume: getVolumeByPath(path) }));
      for (let arg of argInfo) {
        let volId = argInfo.volume.id;
        if (!pathsByVolumeId[volId]) pathsByVolumeId[volId] = [];
        pathsByVolumeId[volId].push(arg);
      }
      let allResults = [];
      for (let volGroup of Object.values(pathsByVolumeId)) {
        let vol = volGroup[0].volume;
        let resultsPr = vol.getBatchProperties(volGroup.map(v => v.path)).then(infos => {
          for (let i = 0; i < volGroup.length; i++) {
            volGroup[i].result = infos[i];
          }
        });
        allResults.push(resultsPr);
      }
      await Promise.all(allResults); // assigns to argInfo items directly
      return argInfo.map(a => a.result);
    },

    list: async path => {
      if (path === '/') {
        let names = Object.values(volLookup).map(v => v.prefix.split('/')[1]);
        names = [...new Set(names.filter(v => !!v))].sort();
        return { ok: true, items: names.map(name => ({ name, isDir: true, size: 0 })) };
      }
      if (path === '/volumes') {
        throw new Error('not implemented');
      }
      return listDirect(path);
    },

    listRecursive: async (path, options) => {
      let { useStructs, useAbsolutePaths } = options || {};
      if (path === '/') {
        let fullResults = [];
        await Promise.all(Object.values(volumes).map(async v => {
          let { prefix } = v;
          if (prefix === '/') return;
          let relPrefix = prefix.substring(1);

          if (useStructs) {
            fullResults.push({ isDir: true, name: prefix.split('/').pop(), relative: relPrefix, absolute: prefix });
          } else if (useAbsolutePaths) {
            fullResults.push(prefix);
          } else {
            fullResults.push(relPrefix);
          }

          let items = await v.fs.listRecursive(path, options);

          for (let item of items) {
            if (useStructs) {
              fullResults.push({ ...item, relative: relPrefix + '/' + item.relative, absolute: prefix + item.absolute });
            } else if (useAbsolutePaths) {
              fullResults.push(prefix + item);
            } else {
              fullResults.push(relPrefix + '/' + item);
            }
          }
        }));
        if (useStructs) return fullResults.sort((a, b) => a.absolute.localeCompare(b.absolute));
        return fullResults.sort();
      }
      if (path === '/volumes') {
        throw new Error("Not implemented");
      }
      let { value, vols } = await listRecursiveDirect(path, options);
      let vol = vols[0];
      value = await Promise.resolve(value);
      if (useStructs) {
        return value.map(v => {
          v.absolute = vol.prefix + v.absolute;
          return v;
        });
      }
      if (useAbsolutePaths) {
        return value.map(v => vol.prefix + v);
      }
      return value;
    },
  };

  let watchersByPid = {};

  let addWatcher = (path, pid, cb) => {
    let watcherRef = unifiedFs.addWatcher(path, cb);
    if (!watchersByPid[pid]) watchersByPid[pid] = [];
    watchersByPid[pid].push(watcherRef);
    return { ref: watcherRef };
  };

  let removeWatchersByProcess = (pid) => {
    let arr = watchersByPid[pid];
    if (arr) {
      delete watchersByPid[pid];
      arr.forEach(w => unifiedFs.removeWatcher(w));
    }
  };

  let removeWatchersByRef = w => {
    unifiedFs.removeWatcher(w.ref);
  };

  let createAccessor = cwd => {
    let wrapPath = path => {
      return root.getAbsolutePath(cwd, path);
    };

    let fs = {
      addWatcher: (path, pid, fn) => addWatcher(wrapPath(path), pid, fn),
      copy: async (fromPath, toPath) => unifiedFs.copy(wrapPath(fromPath), wrapPath(toPath)),
      del: async (path, idempotent) => unifiedFs.del(wrapPath(path), idempotent),
      dirExists: async (path) => unifiedFs.dirExists(wrapPath(path)),
      fileExists: async (path) => unifiedFs.fileExists(wrapPath(path)),
      getAbsolutePath: (path) => wrapPath(path),
      getBatchProperties: async (paths) => unifiedFs.getBatchProperties(paths.map(wrapPath)),
      getFileProperties: async (path) => unifiedFs.getFileProperties(wrapPath(path)),
      getParent: path => unifiedFs.getParent(wrapPath(path)),
      list: async (path) => unifiedFs.list(wrapPath(path)),
      listRecursive: async (path, options) => unifiedFs.listRecursive(path, options),
      mkdir: async (path) => unifiedFs.mkdir(wrapPath(path)),
      mkdirs: async (path) => unifiedFs.mkdirs(wrapPath(path)),
      move: async (fromPath, toPath) => unifiedFs.move(wrapPath(fromPath), wrapPath(toPath)),
      pathExists: async (path) => unifiedFs.pathExists(wrapPath(path)),
      removeWatcher: (w) => removeWatchersByRef(w),
      removeWatchersByProcess: (pid) => removeWatchersByProcess(pid),

      // .read() and .write() are hidden from the rest of the OS and are used by FsHelper
      // with context-specific wrappers.
    };
    return Object.freeze({
      ...fs,
      ...getFsHelper(unifiedFs, wrapPath),
      join: (...args) => args.join('/'),
    });
  };

  return Object.freeze({
    isReady: async () => { await unifiedFs.isReady(); return true; },
    FsRoot: createAccessor('/'),
    createAccessor,
  });
};


let createFileActionRegistry = (osGetter, fs) => {

  let getAppForExt = async (ext) => {
    let apps = await getAppsForExt(ext);
    return apps[0] || null;
  };

  const CONFIG_FILE = '/home/config/file-ext-apps.json';

  let getRawJson = async () => {
    let { ok, data } = await fs.fileReadJson(CONFIG_FILE);
    if (!ok) {
      let os = osGetter();
      let appFileExtInfo = [
        // TODO: rebuild this list. This used to come from an HTTP request to the old PlexiStore.
      ];

      let systemToolEditable = [
        // TODO: implement textedit
        /*'TXT:T:Text File',
        'JSON:T:JSON File',
        'XML:T:XML File',
        'CRY:T:Crayon Source Code',
        'BUILD:T:Build File',*/

        // TODO: implement imageshow
        /*'PNG:I:PNG Image',
        'JPG:I:JPEG Image',
        'BMP:I:Bitmap Image',
        'GIF:I:GIF Image',*/

        // TODO: implement soundplay
        /*'MP3:A:MP3 Audio',
        'OGG:A:Ogg Vorbis Audio',
        'WAV:A:PCM Wave Sound',
        'MID:A:MIDI Song',*/

        // TODO: implement videoplay
        /*'AVI:V:AVI Video',
        'MPG:V:MPEG Video',*/
      ];

      let assoc = [
        { ext: 'SCR', app: '/system/tools/screensaver', name: "Screensaver" },
        { ext: 'THEME', app: '/system/tools/themeloader', name: "Theme" },
        ...systemToolEditable.map(t => {
          let [ext, fmt, name] = t.split(':');
          let app = '/system/tools/' + ({ T: 'textedit', I: 'imageshow', A: 'soundplay', V: 'videoplay' })[fmt];
          return { ext, app, name };
        })
      ];
      let prefix = [];
      let suffix = [];
      appFileExtInfo.filter(a => a.fileExt).forEach(app => {
        let { primary, secondary } = app.fileExt;

        (primary || []).forEach(ext => {
          prefix.push({ ext, name: ext + ' File', app: '/apps/' + app.id });
        });
        (secondary || []).forEach(ext => {
          suffix.push({ ext, name: ext + ' File', app: '/apps/' + app.id });
        });
      });
      let entries = [...prefix, ...assoc, ...suffix ];
      data = { entries };
      await fs.fileWriteText(CONFIG_FILE, JSON.stringify(data));
    }
    return { entries: Util.ensureArray(Util.ensureObject(data).entries).map(Util.ensureObject) };
  };

  // Given a file extension and an application, promote the entry in the action list
  // that applies to this up to the top of the list so that it occurs by default in the future.
  let promoteActionToDefault = async (ext, path) => {
    let { isValid, isPlx, isLib } = await fs.getExecInfo(path);
    if (!isValid || (isPlx && isLib)) return false;

    let { entries } = await getRawJson();
    let targetEntry = null;
    ext = canonicalizeExt(ext);
    let otherEntries = entries.filter(entry => {
      if (targetEntry) return true; // we already found it, ignore all others.
      if (entry.app !== path) return true;

      let extensions = new Set(Util.ensureArray(entry.ext).map(canonicalizeExt));
      if (extensions.has(ext)) {
        // we found it!
        targetEntry = entry;
        return false;
      }
      return true;
    });
    if (!targetEntry) return false;
    let newJson = { entries: [targetEntry, ...otherEntries] };
    await fs.fileWriteText(CONFIG_FILE, JSON.stringify(newJson));
    return true;
  };

  let removeApp = async (path) => {
    let { entries } = await getRawJson();
    entries = entries.filter(entry => entry.app !== path);
    await fs.fileWriteText(CONFIG_FILE, JSON.stringify({ entries }));
  };

  let getReasonableNameForExt = async (ext) => {
    ext = canonicalizeExt(ext);
    if (ext) {
      let info = await getFileInfo(ext);
      if (info && info.name) {
        return info.name;
      }
      return ext.toUpperCase() + " File";
    }
    return "File";
  };

  let getAllFileTypes = async () => {
    let { apps, names } = await getFileExtData();
    let extensions = Object.keys(names);
    let types = extensions.map(ext => {
      return {
        extension: ext,
        name: names[ext],
        apps: apps[ext],
      }
    });
    types.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
    return types;
  };

  let getFileExtData = async () => {
    let apps = {};
    let names = {};

    let { entries } = await getRawJson();

    for (let entry of entries) {
      let ext = canonicalizeExt(entry.ext);
      let name = Util.ensureString(entry.name);
      let app = Util.ensureString(entry.app);
      if (!app.startsWith('/')) continue;
      if (!apps[ext]) apps[ext] = [];
      apps[ext].push(app);
      if (!names[ext]) names[ext] = name;
    }

    let extensions = Object.keys(names);
    let defaultApps = {};
    extensions.forEach(ext => {
      if (!names[ext]) names[ext] = ext.toUpperCase() + " File";
      if (!defaultApps[ext]) defaultApps[ext] = apps[ext][0];
    });

    return { apps, names, defaultApps };
  };

  let canonicalizeExt = ext => Util.ensureString(ext).split('.').pop().trim().toLowerCase();

  let addFileAssociation = async (extension, name, app, isDefault) => {
    let { entries } = await getRawJson();
    let newEntry = {
      ext: canonicalizeExt(extension),
      app: Util.ensureString(app),
    };
    if (name) newEntry.name = name;

    entries = isDefault
      ? [ newEntry, ...entries ]
      : [ ...entries, newEntry ];

    await fs.fileWriteText(CONFIG_FILE, JSON.stringify({ entries }));
  };

  let getAppsForExt = async (ext, optCachedLookupData) => {
    let info = await getFileInfo(ext, optCachedLookupData);
    return info ? info.paths : [];
  };

  let getFileInfo = async (ext, optCachedLookupData) => {
    ext = canonicalizeExt(ext);
    let data = optCachedLookupData || await getFileExtData();
    let name = data.names[ext];
    if (!name) return null;
    let paths = data.apps[ext];
    return { name, paths, defaultApp: paths[0] };
  };

  let getCommand = async (path) => {
    if (await fs.dirExists(path)) {
      return { app: '/system/tools/files', args: [path] };
    }
    if (await fs.fileExists(path)) {
      let exec = await fs.getExecInfo(path);
      if (exec && exec.isValid) {
        return { app: path };
      }
      let t = path.split('.');
      if (t.length > 1) {
        let ext = t.pop();
        let appPath = await getAppForExt(ext);
        if (appPath) {
          return { app: appPath, args: [path] };
        }
      }
      return { app: '/system/tools/openwith', args: [path] };
    }
    return { warn: 'FILE_DOES_NOT_EXIST', arg: path };
  };

  let launchFile = async (os, path, optCwd) => {
    let command = await getCommand(path);
    if (command.warn) {
      console.log("TODO: system warning message boxes", command.warn);
      return;
    }
    let { app, args } = command;
    await os.ExecutionEngine.launchFile(app, args, optCwd || '/');
  };

  return Object.freeze({
    addFileAssociation,
    removeApp,
    getAllFileTypes,
    getAppsForExt,
    getFileInfo,
    getReasonableNameForExt,
    launchFile,
    promoteActionToDefault,
  });
};


let getFsHelper = (fs, wrapPath) => {

  // Text
  let isText = data => {
    if (!data || data.isDir) return false;
    if (typeof data.content !== 'string') return false;
    switch (data.keyedContent.type || '') {
      case 'IMG':
        return false;
    }
    return true;
  };
  let isEmptyFile = data => {
    if (!data || data.isDir) return false;
    let isEmptyFile = !data.content && data.size === 0 && !data.keyedContent.type;
    return !!isEmptyFile;
  };
  let fileReadText = async (path) => {
    let data = await fs.read(wrapPath(path), false);
    if (!data) return { ok: false, error: 'PATH_NOT_FOUND' };
    if (!isText(data)) {
      if (isEmptyFile(data)) return { ok: true, text: '' };
      return { ok: false, error: 'NON_TEXT_FILE' };
    }
    return { ok: true, text: data.content };
  };
  let NOT_JSON = { ok: false, error: 'NON_JSON_FILE' };
  let fileReadJson = async (path) => {
    let txt = await fileReadText(path);
    if (!txt.ok) {
      if (txt.error === 'NON_TEXT_FILE') return NOT_JSON;
      return { ok: false, error: 'PATH_NOT_FOUND' };
    }
    let data = Util.tryParseJson(txt.text);
    if (data) return { ok: true, data };
    return NOT_JSON;
  };
  let fileWriteText = async (path, text) => {
    let ok = await fs.write(wrapPath(path), text + '');
    if (!ok) return { ok: 'PARENT_NOT_DIRECTORY' };
    return { ok };
  };
  let fileCreateEmptyText = async (path) => fileWriteText(path, '');
  let text = {
    fileReadText,
    fileReadJson,
    fileWriteText,
    fileCreateEmptyText,
  };

  // Images
  let isCanvas = o => o && typeof o === 'object' && o instanceof HTMLCanvasElement;
  let isByteArray = o => o && typeof o === 'object' && o instanceof Uint8Array;
  let fileWriteImage = async (path, data, optMetadata) => {
    let keyedData = { ...data, type: 'IMG' };
    if (optMetadata) keyedData.metadata = JSON.stringify(optMetadata);
    await fs.write(wrapPath(path), null, keyedData);
  };
  let fileWriteImageByUrl = async (path, url, optMetadata) => {
    return fileWriteImage(path, { url }, optMetadata);
  };
  let fileWriteImageBase64 = async (path, base64, optMetadata) => {
    return fileWriteImage(path, { b64: base64 }, optMetadata);
  };
  let jpegExts = new Set('jpg jpeg jfif'.split(' '));
  let fileWriteImageCanvas = async (path, canvas, optMetadata) => {
    let isJpeg = jpegExts.has(path.split('.').pop().toLowerCase());
    let b64 = canvas.toDataURL(isJpeg ? 'image/jpeg' : 'image/png').split(',').pop();
    await fileWriteImageBase64(path, b64, optMetadata);
    let data = await fs.read(path);
    if (!data) return;
    data.cache[''] = canvas;
  };
  let fileGetDirectCanvasFromData = async (data, optKey) => {
    if (!data || data.isDir) return null;
    let key = optKey || '';
    if (isCanvas(data.cache[key])) return data.cache[key];
    let canvas = null;
    let arr = key ? data.keyedContent[key] : data.content;
    if (!isByteArray(arr) || arr.length < 4) {
      let url = key ? null : data.keyedContent.url;
      if (!url) return null;
      canvas = await Util.loadImageUri(url);
    } else {
      let isPng = arr[0] === 137 && arr[1] == 80 && arr[2] === 78 && arr[3] === 71;
      let isJpeg = arr[0] === 255 && arr[1] === 216 && arr[2] === 255 && arr[3] === 224;
      if (!isPng && !isJpeg) return null;
      canvas = await Util.loadImageByteArray(arr);
    }
    if (canvas) {
      data.cache[optKey] = canvas;
    }
    return canvas;
  };
  let fileReadImage = async (path, directRef) => {
    let data = await fs.read(wrapPath(path));
    if (!data) return { ok: false, error: 'PATH_NOT_FOUND' };
    let canvas = await fileGetDirectCanvasFromData(data, '');
    if (!canvas) return { ok: false, error: 'NON_IMAGE_FILE' };
    let img = directRef ? canvas : await Util.copyImage(canvas);
    let metadata = data.keyedContent.metadata;
    if (metadata) metadata = Util.tryParseJson(metadata);
    return { ok: true, img, metadata };
  };
  let images = {
    fileWriteImageByUrl,
    fileWriteImageBase64,
    fileWriteImageCanvas,
    fileReadImage,
  };

  let getVirtualJsInfo = async (path) => {
    let data = await fs.read(wrapPath(path));
    if (!data) return { ok: false, error: 'PATH_NOT_FOUND' };
    if (data.isDir || !data.keyedContent.vjs) return { isValid: false };
    let { id, category, arg } = Util.tryParseJson(data.keyedContent.vjs);
    if (!id || !category) return { isValid: false };
    if (!data.cache['']) {
      let vjsPayload = await staticVirtualJsLoader.loadJavaScript(category, id);
      data.cache[''] = vjsPayload;
    }
    return {
      isValid: true,
      category,
      id,
      arg,
      data: data.cache[''],
    };
  };
  let fileWriteVirtualJS = async (path, category, id, optArg) => {
    await fs.write(
      wrapPath(path),
      '',
      // TODO: include icon information
      { vjs: JSON.stringify({ category, id, arg: optArg }) });
  };
  let fileCreateExecJs = async (path, appId, name, iconB64, isStore) => {
    let category = isStore ? 'appSt' : 'app';
    let kd = { name, vjs: JSON.stringify({ category, id: appId }) };
    if (iconB64) kd.ico = Util.base64ToBytes(iconB64);
    await fs.write(wrapPath(path), '', kd);
  };
  let getExecInfo = async (path) => {
    let data = await fs.read(path);
    if (!data || data.isDir) return { isValid: false };
    let kc = data.keyedContent;
    if (!kc.vjs && !kc.plexidata) {
      let { ok, text } = await fileReadText(path);
      // TODO: This will obviously be updated to be more robust. Right?
      if (ok && text.startsWith("UF")) {
        let icon = await fileGetDirectCanvasFromData(data, 'ico');
        return {
          isPlx: true,
          isValid: true,
          icon,
          byteCode: text,
        };
      }
      return { isValid: false };
    }
    let { vjs } = kc;
    let icon = await fileGetDirectCanvasFromData(data, 'ico');
    vjs = vjs ? Util.tryParseJson(vjs) : null;
    if (vjs) {
      return {
        isJs: true,
        isStore: vjs.category === 'appSt',
        isValid: true,
        icon,
        appId: vjs.id,
        name: kc.name,
      };
    }
    if (kc.plexidata) {
      let plexiData = Util.tryParseJson(kc.plexidata);
      if (!plexiData) return { isValid: false };
      return {
        isPlx: true,
        isValid: true,
        icon,
        blockId: plexiData.PLXID,
        blockInfo: plexiData,
        name: "Untitled Plexi App",
      };
    }
  };

  let virtualJs = {
    // TODO: fix the capitalization consistency of JS vs Js when this refactoring is complete
    fileWriteVirtualJS,
    fileCreateExecJs,
    getVirtualJsInfo,
    getExecInfo,
  };

  // Plexi files
  let fileCreateExecPlexi = async (path, plexiPayload, isLib) => {
    let keyedData = {
      // TODO: icon
      plexidata: JSON.stringify(plexiPayload),
      lib: isLib ? '1' : '0',
    };
    await fs.write(wrapPath(path), '', keyedData);
  };
  let plexiExec = {
    fileCreateExecPlexi,
  };

  // Audio files
  let fileWriteAudioByUrl = async (path, url, optMetadata) => {
    let kd = { url };
    if (optMetadata) kd.metadata = JSON.stringify(optMetadata);
    await fs.write(wrapPath(path), '', kd);
  };
  let fileReadAudioOrUrl = async (path) => {
    let data = await fs.read(wrapPath(path));
    if (!data) return { ok: false, error: 'PATH_NOT_FOUND' };
    let kc = data.keyedContent;
    let metadata = kc.metadata ? Util.tryParseJson(kc.metadata) : null;
    if (kc.url) return { ok: true, type: 'url', url: kc.url, metadata };
    if (typeof data.content === 'object') return { ok: true, type: 'binary', bytes: data.content, metadata };
    return { ok: false, error: 'NON_AUDIO_FILE' };
  };
  let audio = {
    fileReadAudioOrUrl,
    fileWriteAudioByUrl,
  };

  // Raw Binary files
  let fileReadBinaryOrUrl = async (path) => {
    let data = await fs.read(wrapPath(path));
    if (!data) return { ok: false, error: 'PATH_NOT_FOUND' };
    let { url, metadata } = data.keyedContent;
    if (url) {
      return {
        ok: true,
        type: 'url',
        url,
        metadata: metadata ? Util.tryParseJson(metadata) : null
      };
    }
    if (isByteArray(data.content)) return data.content;
    if (typeof data.content === 'string') {
      return Util.textToBytes(data.content);
    }
    return { ok: false, error: 'INVALID_FILE' };
  };
  let fileWriteBinaryByUrl = async (path, url, optMetadata) => {
    let kd = { url };
    if (optMetadata) kd.metadata = JSON.stringify(optMetadata);
    await fs.write(wrapPath(path), '', kd);
  };
  let binaryData = {
    fileReadBinaryOrUrl,
    fileWriteBinaryByUrl,
  };

  let throwForLegacy = x => () => { throw new Error("Legacy FS method: " + x); };
  let legacy = {
    // Need to assess if and how these are used.
    getNodeType: throwForLegacy('getNodeType'),
    getProps: throwForLegacy('getProps'),

    legacyList: async path => {
      let o = await fs.list(wrapPath(path));
      if (!o.ok) return [];
      return o.items.map(v => v.name);
    },
    join: (...args) => {
      let p = Util.flattenArray(args).join('/');
      if (p.startsWith('//')) return p.substring(1);
      return p;
    },
  };

  return {
    ...text,
    ...images,
    ...virtualJs,
    ...plexiExec,
    ...binaryData,
    ...audio,
    ...legacy,
  };
};


const FsPathUtil = (() => {
  return Object.freeze({
    join: (...args) => {
      let p = Util.flattenArray(args).join('/');
      if (p.startsWith('//')) return p.substring(1);
      return p;
    },
    getParentFullPath: (cwd, path) => FsPathUtil.canonicalize(cwd, path + '/..'),
    canonicalize: (cwd, path) => {
      let fullPath = cwd === null || path[0] === '/' ? path : (cwd + '/./' + path);
      let parts = fullPath.split('/').map(t => t.trim());
      let filtered = [];
      for (let part of parts) {
        if (part === '' || part === '.') {
          // skip
        } else if (part === '..' && filtered.length > 0) {
          filtered.pop();
        } else {
          filtered.push(part);
        }
      }
      if (filtered.length === 0) return '/';
      if (filtered[0] === '..') return null;
      return '/' + filtered.join('/');
    },
    isValidName: (() => {
      let badNames = new Set(Util.flattenArray(".git .ds_store thumbs.db desktop.ini con prn aux nul com# lpt#"
        .split(' ')
        .map(n => {
          let p = n.split('#');
          if (p.length > 1) return Util.range(10).map(i => p.join('' + i));
          return n;
        })));
      let badChars = new Set('\\/:?!@$*"<>|'.split(''));

      return (n) => {
        if (!n ||
            n.trim() !== n ||
            n.endsWith('.') ||
            n.length > 240 ||
            badNames.has(n.toLowerCase()) ||
            n.split('').filter(c => badChars.has(c)).length) return false;
        return true;
      };
    })(),
  });
})();


const createPlexiOs = async (options, config) => {
  let os = null;
  let {
    headless,
    images,
    lang,
    loadAppById,
    shellHost,
    useDefaultFullScreenShell,
    osName,
  } = options;

  // currently this is only used for static app registry
  // TODO: apps should be dynamically loaded and tools should be in a big
  // atlas that is embedded and then this will just go away.
  await Util.awaitPromiseTasks();

  // TODO: this isn't at all used yet.
  // The base config never changes. However, the portal may allow the user to
  // pick options that can be imprinted on the config.
  let baseConfig = parseOsBaseConfiguration(config);

  if (loadAppById) staticAppRegistry.setAppLoader(loadAppById);
  let loadApp = async (id) => {
    return staticAppRegistry.loadApp(id);
  };

  let envVars = {};
  let appRegistry = createAppRegistry();

  let getIcon = (appIdOrCbxPath) => {
    if (appIdOrCbxPath.startsWith('~')) {
      return null;
    }
    return (staticAppRegistry.getAppMetadata(appIdOrCbxPath) || {}).icon || null;
  };

  let fs = await createFsRouter();
  await fs.isReady();

  let settings = await createSettingsManager(fs);

  let getEnvVarImpl = (n, cycleCheck) => {
    if (cycleCheck[n]) throw new Error("ENV VAR REF CYCLE");
    cycleCheck[n] = true;
    let value = envVars[n] || '';
    let parts = value.split('%');
    for (let i = 1; i < parts.length; i += 2) {
      parts[i] = getEnvVarImpl(parts[i], cycleCheck);
    }
    cycleCheck[n] = false;
    return parts.join('');
  };

  let fsRootAccessor = fs.FsRoot;

  let doLog = (level, args) => {
    let proc = os.ProcessManager.getProcessesByAppId('io.plexi.tools.vislog')[0] || null;
    if (proc) {
      os.ProcessManager.sendIpcMessage(proc.pid, {
        level,
        items: args,
      });
    } else {
      // Be annoying about this so log messages don't get left behind in prod
      // as this can make internal data more visible and also be a perf hog.
      console.log("visLog message unhandled!");
    }
  };

  os = {
    ApplicationRegistry: Object.freeze({
      loadApp,
      registerApp: appRegistry.registerApp,
      getInfo: async (appId, optMetadataOnly) => {
        let info = await appRegistry.getApp(appId, false, !!optMetadataOnly);
        return info ? { ...info } : null;
      },
      getIcon,
      getLauncherAppList: () => appRegistry.getLauncherApps(),
      getInstalled: () => appRegistry.listAll(),
      removeApp: (id, optIncludeUserData) => appRegistry.removeApp(os, id, !!optIncludeUserData),
    }),
    AppSettings: createAppSettingsStore(fsRootAccessor),
    createTerminalSession: async (optCwd) => {
      return PlexiOS.terminalSession(os, optCwd || '/', os.EnvVars.snapshot())
    },
    Clipboard: createClipboard(),
    EnvVars: Object.freeze({
      get: n => getEnvVarImpl(n, {}),
      getRaw: n => envVars[n] || '',
      set: (n, v) => {
        let oldValue = envVars[n] || '';
        envVars[n] = v + '';
        try {
          getEnvVarImpl(n, {});
        } catch (ex) {
          envVars[n] = oldValue;
          return false;
        }
        return true;
      },
      remove: (n) => {
        if (envVars[n] !== undefined) delete envVars[n];
      },
      list: () => Object.keys(envVars).filter(n => envVars[n]).sort(),
      snapshot: () => {
        return os.EnvVars.list().reduce((lookup, k) => { lookup[k] = os.EnvVars.get(k); return lookup }, {});
      },
    }),
    FileActions: (() => {
      let fa = createFileActionRegistry(() => os, fsRootAccessor);
      return Object.freeze({
        ...fa,
        launchFile: (path, optCwd) => fa.launchFile(os, path, optCwd),
      });
    })(),
    FileSystem: cwd => cwd === '/' ? fsRootAccessor : fs.createAccessor(cwd),
    FsRoot: fsRootAccessor,
    getName: () => osName || "PlexiOS",
    IconStore: createIconStore(),
    log: (...args) => doLog('INFO', args),
    logWarning: (...args) => doLog('WARNING', args),
    logError: (...args) => doLog('ERROR', args),
    PowerManager: createPowerManager(),
    Settings: settings,
    Localization: Object.freeze({
      getLanguage: () => activeLanguage,
      setLanguage: lang => {
        let loc = os.Localization.getLocaleList().filter(o => lang === o.id)[0];
        if (!loc) throw new Error();
        if (loc.id === activeLanguage) return;
        activeLanguage = loc.id;
        os.Settings.set('lang', loc.id);
        if (os.Shell) os.Shell.onLocaleChange();
      },
      getLocaleList: () => {
        return 'en:English|ja:日本語'.split('|').map(t => t.split(':')).map(t => ({ id: t[0], name: t[1] }));
      },
    }),
    ProcessManager: null,
    Shell: null,
    Themes: null,
  };

  os.LauncherRegistry = createLauncherRegistry(os);
  os.ProcessManager = createProcessManager(os);
  os.ExecutionEngine = createExecutionEngine(os);

  await os.IconStore.init();

  let imageList = images || ['default'];
  if (!new Set(imageList).has('default')) imageList = ['default', ...imageList];

  let imgUtil = createImageUtil(os);
  for (let imageName of imageList) {
    let imageBuilder = await staticVirtualJsLoader.loadJavaScript('image', imageName);
    await imageBuilder(imgUtil);
  }

  await os.Settings.init();

  let activeLanguage = settings.getString('lang', '') || lang || 'en';

  if (!headless) {
    os.Shell = createPlexiShell(os);
    os.Themes = createThemeManager(os);

    let root = shellHost || (useDefaultFullScreenShell ? document.body : null);
    if (!root) throw new Error("No valid shell host was configured.");

    Array.from(root.childNodes)
      .filter(e => e.tagName !== 'NOSCRIPT')
      .forEach(e => root.removeChild(e));

    await os.Shell.init(root, options.initialTheme);

    if (useDefaultFullScreenShell) {
      window.addEventListener('keydown', os.Shell.systemKeyDownListener);
      window.addEventListener('keyup', os.Shell.systemKeyUpListener);
      window.addEventListener('resize', os.Shell.systemWindowResizeListener);

      if (root === document.body && useDefaultFullScreenShell) {
        [document.body.parentElement, document.body].forEach(e => {
          let s = e.style;
          s.margin = 0;
          s.height = '100%';
          s.width = '100%';
          s.overflow = 'hidden';
        });
      }
    }
  }

  return Object.freeze(os);
};


let createPowerManager = () => {
  let properties = null;
  let watchers = [];

  let fireWatchers = async () => {
    let newWatchers = [];
    updateBattery(await navigator.getBattery());
    let status = Object.freeze({ ...properties });
    for (let watcher of watchers) {
      let { callback, isStillValid } = watcher;
      if (isStillValid()) {
        callback(status);
        newWatchers.push(watcher);
      }
    }
    watchers = newWatchers;
  };

  let updateBattery = b => {
    let percent = Math.floor(b.level * 100 + 0.5);
    let isPluggedIn = b.charging;
    let timeTill = isPluggedIn ? b.chargingTime : b.dischargingTime;

    properties = {
      percent,
      isPluggedIn,
      timeTill: !isFinite(timeTill) ? 0 : timeTill,
    };
  };

  let initRes = null;
  let initPr = null;

  let ensureInitialized = async () => {
    if (initPr) return initPr;
    initPr = new Promise(r => { initRes = r; });

    let bat = await navigator.getBattery();
    updateBattery(bat);
    [
      'charging',
      'chargingtime',
      'dischargingtime',
      'level'
    ].forEach(ev => bat.addEventListener(ev + 'change', fireWatchers));

    initRes(1);
    return initPr;
  };

  let getProperties = async () => ensureInitialized().then(() => Object.freeze({ ...properties }));

  let addWatcher = (callback, isStillValid) => {
    if (!isStillValid) throw new Error();
    watchers.push({ callback, isStillValid });
  };

  return Object.freeze({
    getProperties,
    addWatcher,
  });
};


let createProcessManager = (os) => {

  let processLookup = {};
  let nextPid = 1;
  let procman = {
    getProcess: (pid) => {
      return processLookup[pid] || null;
    },
    getProcessesByAppId: appId => {
      return Object.values(processLookup).filter(p => p.appId === appId);
    },
    awaitProcess: async (pid) => {
      let p = procman.getProcess(pid);
      if (p) await p.promise;
    },
    allocProc: async (path, optAppId) => {
      let execInfo = await os.FsRoot.getExecInfo(path);
      let icon = execInfo.isValid
        ? execInfo.icon
        : os.IconStore.getIconByPurpose('EXEC', true);
      let res;
      let proc = {
        pid: nextPid++,
        uiHandles: [],
        path,
        appId: optAppId || ('~' + path),
        icon,
        promise: new Promise(r => { res = r; }),
        ipcListeners: [],
      };
      proc.res = res;
      processLookup[proc.pid] = proc;
      return proc.pid;
    },
    addIpcListener: (pid, cb) => {
      let p = procman.getProcess(pid);
      if (p) p.ipcListeners.push(cb);
    },
    sendIpcMessage: (pid, msg) => {
      let p = procman.getProcess(pid);
      if (p) p.ipcListeners.forEach(f => f(msg));
    },
    registerUiHandle: (pid, obj) => {
      let p = processLookup[pid];
      if (!p) return;
      p.uiHandles.push(obj);
    },
    killProcess: (pid) => {
      let p = processLookup[pid];
      if (!p) return;
      let uiHandles = p.uiHandles.map(h => h.id);
      if (uiHandles.length) os.Shell.killWindows(uiHandles);
      os.FsRoot.removeWatchersByProcess(pid);
      delete processLookup[pid];
      p.res(true);
    },
    unregisterUiHandle: (pid, obj) => {
      let p = processLookup[pid];
      if (!p) return;
      p.uiHandles = p.uiHandles.filter(o => o !== obj);
    },
    getProcesses: (onlyUi) => {
      let output = Object.values(processLookup);
      if (onlyUi) output = output.filter(p => p.uiHandles.length);
      return output;
    },
    setTimeout: (pid, fn, millis, recur) => {
      let tick = () => {
        if (!procman.getProcess(pid)) return;
        fn();
        if (recur) setTimeout(tick, millis);
      };
      setTimeout(tick, millis);
    },
    setInterval: (pid, fn, millis) => {
      procman.setTimeout(pid, fn, millis, true);
    },
    pause: (pid, millis) => {
      return new Promise(res => {
        setTimeout(() => {
          res(!!procman.getProcess(pid));
        }, millis);
      });
    },
  };

  return Object.freeze(procman);
};


const createSettingsManager = async (fs) => {

  const SETTING_PATH = '/system/config/settings.json';
  let fsRoot = fs.FsRoot;
  let settings = null;

  let save = async () => {
    await fsRoot.fileWriteText(SETTING_PATH, JSON.stringify(settings || {}));
  };

  let init = async () => {
    let d = await fsRoot.fileReadText(SETTING_PATH);
    if (!d.ok) {
      // TODO: ensure dir exists in FsHelper
      if (!await fsRoot.dirExists('/system/config')) {
        if (!await fsRoot.dirExists('/system')) {
          await fsRoot.mkdir('/system');
        }
        await fsRoot.mkdir('/system/config');
      }
      await fsRoot.fileWriteText(SETTING_PATH, '{}');
      d = { text: '{}' };
    }
    settings = Util.tryParseJson(d.text) || {};
    let keys = Object.keys(preInitSettings);
    if (keys.length) {
      for (let key of keys) {
        settings[key] = preInitSettings[key];
      }
      await save();
    }
  };

  let get = (setting, defaultValue) => {
    let output = settings[setting];
    if (output === undefined || output === null) {
      if (defaultValue === undefined) return null;
      return Util.deepCopy(defaultValue);
    }
    return Util.deepCopy(output);
  };
  let preInitSettings = {};
  let o = {
    init,
    preInitSet: (setting, value) => {
      preInitSettings[setting] = value;
    },
    setMultiple: async (newSettings) => {
        settings = { ...settings, ...Util.deepCopy(newSettings) };
        await save();
    },
    set: async (setting, value) => {
      settings[setting] = Util.deepCopy(value);
      await save();
    },
    get,
    getInt: (...a) => {
      let v = o.get(...a);
      if (typeof v !== 'number') v = parseInt(`${v}`);
      if (isNaN(v) || !isFinite(v)) v = 0;
      return v;
    },
    getBool: s => !!o.get(s, false),
    getString: (s, def) => `${o.get(s, def || '')}`,
  };

  return Object.freeze(o);
};


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


const createDialogFactory = (os) => {

  let { button, div, inputText, span } = HtmlUtil;

  let showPrompt = (pid, options) => {
    let labels = {
      YES: "Yes",
      NO: "No",
      CANCEL: "Cancel",
      OK: options.okLabelOverride || "OK",
    };
    let choices = [];
    switch (options.style) {
      case 'YESNO': choices = ['YES', 'NO']; break;
      case 'OKCANCEL': choices = ['OK', 'CANCEL']; break;
      case 'OK': choices = ['OK']; break;
      default: throw new Error();
    }
    let buttons = choices.map(c => ({ id: c, label: labels[c] }));

    let desktopSize = os.Shell.getSize();
    let w = Math.min(desktopSize.width, options.width || 340);
    let h = Math.min(desktopSize.height, options.height || 180);
    let left = Math.floor((desktopSize.width - w) / 2);
    let top = Math.floor((desktopSize.height - h) / 2);

    let res;
    let promise = new Promise(r => { res = r; });

    let isOkEnabled = options.isOkEnabled || (() => true);
    let buttonsById = {};

    let result = null;
    let _winData = null;

    let proc = os.ProcessManager.getProcess(pid);
    let parent = null;
    if (proc) {
      let wins = proc.uiHandles;
      if (wins.length) parent = wins[wins.length - 1];
    }

    os.Shell.showWindow(pid, {
      isModal: true,
      x: left,
      y: top,
      innerWidth: w,
      innerHeight: h,
      title: options.title || '',
      parentWindow: parent,
      onClosed: () => { if (result === null) res('CANCEL'); },
      onInit: (host, winData) => {
        _winData = winData;
        host.set(div(
          {
            fullSize: true,
            backgroundColor: '#ccc',
            padding: 20,
            textAlign: 'center',
          },
          div(options.message, { marginBottom: 10 }),
          div(buttons.map(b => {
            let btn = button(
              b.label,
              {
                onClick: async () => {
                  result = b.id;
                  await winData.closeHandler();
                  res(result);
                }
              });
            buttonsById[b.id] = btn;
            return btn;
          }))
        ));
      },
      onShown: () => {
        if (options.onShown) options.onShown();
      },
    });

    if (!isOkEnabled()) buttonsById.OK.disabled = true;

    let closeMe = async (resId) => {
      res(resId);
      await _winData.closeHandler();
    };
    return Object.freeze({
      getResult: () => promise,
      okayEnabledChanged: () => {
        buttonsById.OK.disabled = !isOkEnabled();
      },
      pushButton: id => {
        if (id === 'OK' && !isOkEnabled()) return;
        closeMe(buttonsById[id] ? id : null);
      },
      close: async () => closeMe(null),
    });
  };

  // options: promptOverwrite, title
  let showFileDialog = async (pid, startingDir, type, options) => {
    options = options || {};
    let isSave = type === 'SAVE';
    let isOpen = type === 'OPEN';
    if (!isSave && !isOpen) throw new Error();
    let fs = os.FsRoot;
    let curDir = fs.getAbsolutePath(startingDir || '/');
    let curDirLabel = span({ paddingLeft: 8, bold: true }, curDir);

    const NAV_HEIGHT = 40;
    const FILE_HEIGHT = 250;
    const NAME_HEIGHT = 40;
    let refreshView = () => {
      curDirLabel.clear().set(curDir);
      icons.refresh();
      upBtn.disabled = curDir === '/';
    };

    let upBtn = button("Up", () => {
      if (curDir === '/') return;
      curDir = fs.getAbsolutePath(curDir + '/..');
      refreshView();
    });

    let topNav = div(
      { northDock: NAV_HEIGHT },
      div({ westDock: 60 }, upBtn),
      div({ eastStretchDock: 60 }, curDirLabel),
    );

    let doubleClickedFile = null;

    let selectFile = async fullPath => {
      if (await fs.dirExists(fullPath)) {
        curDir = fullPath;
        nameSpecify.value = '';
        refreshView();
      } else {
        doubleClickedFile = fullPath;
        prompt.close();
      }
    };

    let icons = HtmlUtil.Components.IconBrowser({
      os,
      getDir: () => curDir,
      onOpenFile: ev => {
        ev.preventDefault();
        selectFile(ev.fullPath);
      },
      onOpenDir: ev => {
        ev.preventDefault();
        selectFile(ev.fullPath);
      },
      onSelectionChanged: icons => {
        if (icons.length !== 1) return;
        let path = icons[0].fullPath;
        let filename = path.split('/').pop();
        nameSpecify.value = filename;
      },
      fullSize: true,
    });
    let iconWrapper = div(
      { w100: true, height: FILE_HEIGHT, top: NAV_HEIGHT },
      icons,
    );
    let nameSpecify = inputText({
      width: '100%',
      value: `${options.initialName || ''}`,
      marginTop: 8,
      onEnter: async v => {
        await selectFile(fs.getAbsolutePath(curDir + '/' + v.trim()));
        nameSpecify.value = '';
      },
    });
    let nameBox = div(
      { w100: true, height: NAME_HEIGHT, top: NAV_HEIGHT + FILE_HEIGHT },
      nameSpecify,
    );
    let outer = div(
      {
        position: 'relative',
        size: ['100%', NAV_HEIGHT + FILE_HEIGHT + NAME_HEIGHT],
        textAlign: 'left',
      },
      topNav,
      iconWrapper,
      nameBox,
    );

    refreshView();

    let prompt = showPrompt(pid, {
      title: isSave ? 'Save File' : 'Open File',
      message: outer,
      height: NAV_HEIGHT + FILE_HEIGHT + NAME_HEIGHT + 60,
      width: Math.min(500, Math.floor(os.Shell.getSize().width * .9)),
      style: 'OKCANCEL',
      okLabelOverride: isSave ? 'Save' : 'Open',
    });

    let result = await prompt.getResult();
    let filePath;
    if (doubleClickedFile) {
      filePath = doubleClickedFile;
    } else {
      if (result !== 'OK') return null;
      if (!nameSpecify.value) return null; // TODO: the OK button should be disabled here
      filePath = doubleClickedFile || fs.getAbsolutePath(curDir + '/' + nameSpecify.value);
    }

    // TODO: this is kind of janky. Should intercept OK button handler instead of re-launching the dialog.
    if (await fs.dirExists(filePath)) {
      return showFileDialog(pid, filePath, type, options);
    }

    let fileExists = await fs.fileExists(filePath);
    if (options.promptOverwrite && fileExists) {
      let overwriteOk = await dialogs.showOverwriteFileConfirm(pid, options.title || "Save Overwrite");
      if (!overwriteOk) {
        return showFileDialog(pid, curDir, type, options);
      }
    }

    let tryAgainPath = null;
    if (isOpen && !fileExists) {
      tryAgainPath = filePath;
    } else {
      let t = fs.getAbsolutePath(filePath + '/..').split('/');
      let parent = t.join('/') || '/';
      if (!await fs.dirExists(parent)) {
        tryAgainPath = parent;
      }
    }

    if (tryAgainPath) {
      let tryAgain = await dialogs.showPathDoesNotExist(pid, options.title || "Error", tryAgainPath);
      if (!tryAgain) return null;
      return showFileDialog(pid, curDir, type, options);
    }

    return filePath;
  };

  let showToBool = async (pid, title, message, style, trueOption, options) => {
    let args = { title, message, style, ...(options || {}) };
    let result = await showPrompt(pid, args).getResult();
    return result === trueOption;
  };
  let showYesNoToBool = async (pid, title, message, options) => showToBool(pid, title, message, 'YESNO', 'YES', options);
  let showOkCancelToBool = async (pid, title, message, options) => showToBool(pid, title, message, 'OKCANCEL', 'OK', options);
  let showOk = async (pid, title, message, options) => showToBool(pid, title, message, 'OK', 'OK', options);

  let showRenameDialog = async (pid, fullPath) => {
    let fs = os.FsRoot;
    let dir = fs.getParent(fullPath);
    let name = fullPath.split('/').pop();
    let errorPanel = div({ color: '#f00', html: '&nbsp;' });
    let hasError = false;
    let showError = (err) => {
      hasError = !!err;
      pr.okayEnabledChanged();
      errorPanel.clear().set(err || { html: '&nbsp;' });
    };
    let activePath = fullPath;
    let inputField = inputText(
      {
        value: name,
        onEnter: () => pr.pushButton('OK'),
      },
      async newName => {
        let newFullPath = FsPathUtil.join(dir, newName);
        if (!FsPathUtil.isValidName(newName)) {
          showError("That is not a valid file name.");
        } else if (await fs.pathExists(newFullPath) && newFullPath !== fullPath) {
          showError("A file with that name already exists.");
        } else {
          activePath = newFullPath;
          showError('');
        }
      }
    );
    let renameUi = div(
      errorPanel,
      inputField,
    );
    let pr = showPrompt(pid, {
      title: "Rename File",
      message: renameUi,
      style: 'OKCANCEL',
      isOkEnabled: () => !hasError,
      onShown: () => {
        inputField.focus();
        let parts = name.split('.');
        let endIndex;
        if (parts.length > 1) {
          parts.pop();
          endIndex = parts.join('.').length;
        } else {
          endIndex = name.length;
        }
        inputField.setSelectionRange(0, endIndex);
      },
    });

    let doRename = 'OK' === await pr.getResult();
    if (doRename) {
      await fs.move(fullPath, activePath);
    }
    return doRename;
  };

  let dialogs = {
    showPrompt,

    showYesNoToBool,
    showOkCancelToBool,
    showOk,

    saveFile: async (pid, dir, options) => showFileDialog(pid, dir, 'SAVE', options),
    openFile: async (pid, dir, options) => showFileDialog(pid, dir, 'OPEN', options),

    showPathDoesNotExist: async (pid, title, dir) => showOkCancelToBool(pid, title, "The path does not exist: " + dir),
    showOverwriteFileConfirm: async (pid, title) => showYesNoToBool(pid, title, "This file already exists. Are you sure you want to overwrite it?"),
    showUnsavedChangesConfirmExit: async (pid, title) => showYesNoToBool(pid, title, "You have unsaved changes. Are you sure you want to exit?"),
    showRename: async (pid, path) => showRenameDialog(pid, path),
  };
  return Object.freeze(dialogs);
};


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


let showLauncher = (() => {
  let { div, span } = HtmlUtil;

  let getAppEntry = async (appPath, os) => {
    let fs = os.FsRoot;
    let appInfo = await fs.getExecInfo(appPath);
    if (!appInfo.isValid) return null;
    let { name } = appInfo;
    let iconCanvas = Util.copyImage(appInfo.icon || await os.IconStore.getIconByPath(fs, appPath));

    let output = div(
      {
        margin: 8,
        height: 32,
        position: 'relative',
        onClick: () => {
          os.ExecutionEngine.launchFile(appPath);
          os.Shell.clearModal();
        },
      },
      div(
        { westDock: 32 },
        iconCanvas.set({ size: 32 })
      ),
      div({
        eastStretchDock: 32,
        padding: 4,
      }, name),
    );
    output.addEventListener('mouseover', () => output.set({ backgroundColor: 'rgba(128, 128, 128, 0.2)'}));
    output.addEventListener('mouseout', () => output.set({ backgroundColor: 'rgba(128, 128, 128, 0.0)'}));
    return output;
  };

  return async (os) => {
    let appPaths = await os.LauncherRegistry.getLauncherAppPaths();
    let appsDir = (await os.FsRoot.legacyList('/apps')).map(v => '/apps/' + v);
    appPaths = [...appPaths, ...appsDir];

    let launcher = div(
      {
        size: ['70%', '50%'],
        left: '15%',
        top: '15%',
        position: 'absolute',
        color: '#000',
        onClick: e => e.stopPropagation(),
      },
      os.Themes.buildPanelBackground().set(
        div(
          { position: 'absolute', left: 20, top: 20, right: 20, bottom: 20 },
          div({ northDock: 30 }, "Applications"),
          div(
            { southStretchDock: 30, overflowX: 'hidden', overflowY: 'auto' },
            await Promise.all(appPaths.map(path => getAppEntry(path, os))),
          ),
        ),
      ),
    );

    await os.Shell.setModal(launcher);
  };

})();


let createLauncherRegistry = os => {
  let launcherAppPaths = {};
  let cachedAppMetadata = {};
  let mruByPath = {};

  let fs = os.FsRoot;
  let launcherReg = {
    registerApp: (path, useMruBump) => {
      launcherAppPaths[path] = true;
      if (useMruBump) mruByPath[path] = 1;
    },

    removeApp: (path) => {
      if (cachedAppMetadata[path]) delete cachedAppMetadata[path];
      if (launcherAppPaths[path]) delete launcherAppPaths[path];
      if (mruByPath[path]) delete mruByPath[path];
    },

    getLauncherAppPaths: async () => {
      let paths = Object.keys(launcherAppPaths);
      let metadatas = await Promise.all(paths.map(async path => {
        let md = await launcherReg.getAppMetadata(path, true);
        if (!md) return null;
        let sortKey = [
          Util.ensureNumLen(Math.floor((0xFFFFFFFFFFFF - (mruByPath[path] || 0))), 15),
          md.name.toLowerCase(),
          path
        ].join(':');
        return {
          ...md,
          path,
          sortKey,
        };
      }));
      return metadatas
        .filter(Util.identity)
        .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
        .map(md => md.path);
    },

    getAppMetadata: async (path, directIcons) => {
      if (cachedAppMetadata[path]) {
        let metadata = cachedAppMetadata[path];
        if (!directIcons) metadata = { ...metadata, icon: Util.copyImage(metadata.icon) };
        return metadata;
      }

      let info = await fs.getExecInfo(path);
      if (!info.isValid && launcherAppPaths[path]) {
        delete launcherAppPaths[path];
        return null;
      }

      let icon = info.icon;
      if (!icon) {
        icon = os.IconStore.getIconByPurpose('EXEC', directIcons);
      }

      let name = info.name;
      if (!name) {
        if (info.isJs) name = info.appId.split('.').pop();
        else name = path.split('/').pop();
      }
      cachedAppMetadata[path] = {
        name,
        icon,
        path,
      };
      return launcherReg.getAppMetadata(path, directIcons);
    },
  };
  return Object.freeze(launcherReg);
};


const createPlexiShell = (os) => {

  const DELAY_FOR_GIVING_WINDOW_FOCUS_ON_FILE_DRAG_HESITATE = 0.7; // seconds

  const { div, span } = HtmlUtil;

  let createBackground = () => div({ fullSize: true, backgroundColor: '#088' });
  let createDesktopHost = () => div({ position: 'absolute' });
  let createWinHost = () => div({ position: 'absolute', size: 0 });
  let createModalHost = () => div({ position: 'absolute', size: 0 });
  let createDragDropLayer = () => div(
    { fullSize: true, visibleBlock: false, userSelect: 'none' },
    div({ fullSize: true }),
    div({ fullSize: true }));

  let createAuthorizedHost = () => div({ fullSize: true, visibleBlock: true, overflow: 'hidden' });

  let windowList = [];
  let nextWinId = 1;

  let focusedWindow = null;
  let eventCounter = 0;

  let getWinOpacity = () => Util.ensureRange(os.Settings.getInt('windowOpacity', 100) / 100.0, 0, 1);
  let getWinShadowEnabled = () => !os.Settings.getBool('disableWindowOutlineShadows', false);

  let queuedTicks = [];
  let tickIdAlloc = 1;
  let shellSetTimeout = async (callback, timeoutMillis, isSysMaintenance) => {
    let resolver;
    let promise = new Promise(r => { resolver = r; });
    let id = tickIdAlloc++;
    let item = { time: Util.getTime() + timeoutMillis / 1000, id, callback, resolver, isSysMaintenance };
    queuedTicks.push(item);
    setTimeout(() => performRenderTick(id), Math.floor(timeoutMillis));
    return promise;
  };

  let performRenderTick = (forcedId) => {
    if (queuedTicks.length) {

      let now = Util.getTime();
      let q = [...queuedTicks];
      queuedTicks = [];
      for (let item of q) {
        if (item.id === forcedId || item.time < now) {
          Promise.resolve(item.callback()).then(v => item.resolver(v));
        } else {
          queuedTicks.push(item);
        }
      }
      ensureSysMaintenanceRunning();
    }
  };

  let ensureSysMaintenanceRunning = () => {
    if (!queuedTicks.some(item => item.isSysMaintenance)) {
      shellSetTimeout(doSysMaintenance, 1, true);
    }
  };

  let doSysMaintenance = () => {

    pollForScreenSaverInvocation();
    os.Themes.updateClock();
    sysResizeCheck();

    // Aspire to run the updater at 20 milliseconds after the second changes.
    // This ensures that the clock will appear to run in real time and avoids any problems
    // if the maintenance cycle happened to start at nearly exactly on the second change
    // where the time would appear to skip or stop.
    let now = Util.getTime();
    let fraction = now % 1;
    let delay = 0.02 - fraction;
    if (delay < 0) delay = 1.02 - fraction;

    shellSetTimeout(doSysMaintenance, Math.floor(1000 * delay), true);
  };

  let refreshWindowVisualSettings = () => {
    let winOpacity = getWinOpacity();
    let shadow = getWinShadowEnabled();
    windowList.forEach(w => {
      w.outerFrame.set({ opacity: `${winOpacity}` });
      w.outerFrame.set({ shadow });
    });
  };

  let giveProcessFocus = (pid) => {
    let proc = os.ProcessManager.getProcess(pid);
    if (!proc || !proc.uiHandles.length) return;
    let winData = proc.uiHandles[proc.uiHandles.length - 1];
    giveWindowFocus(winData);
  };

  let isWindowInList = wd => {
    for (let e of windowList) {
      if (e === wd) return true;
    }
    return false;
  };

  let getTopZPriority = () => {
    let m = 0;
    for (let wd of windowList) {
      m = Math.max(wd.zPriority, m);
    }
    return m + 1;
  };

  let winDepthCheck = (depth, win) => {
    if (depth[win.id]) return depth[win.id];
    if (!win.parent) throw new Error();
    let v = winDepthCheck(depth, win.parent) + 1;
    depth[win.id] = v;
    return v;;
  };

  let sortWindows = () => {
    let windowById = {};

    for (let win of windowList) {
      let id = win.id;
      windowById[id] = win;
    }

    let ultimateParentByWinId = {};
    for (let win of windowList) {
      let id = win.id;
      let walker = win;
      while (walker.parent) {
        walker = walker.parent;
      }
      ultimateParentByWinId[id] = walker;
    }

    let bucketLookup = {};
    for (let win of windowList) {
      let bucketId = ultimateParentByWinId[win.id].id;
      if (!bucketLookup[bucketId]) {
        bucketLookup[bucketId] = {
          wins: [],
          id: bucketId,
          z: windowById[bucketId].zPriority,
        };
      }
      bucketLookup[bucketId].wins.push(win);
    }

    let buckets = Object.values(bucketLookup);
    buckets.sort((a, b) => a.z - b.z);

    for (let bucket of buckets) {
      let depthByWinId = {};
      depthByWinId[bucket.id] = 1;
      for (let w of bucket.wins) {
        winDepthCheck(depthByWinId, w);
      }
      let sortedWins = [...bucket.wins];
      sortedWins.sort((a, b) => (depthByWinId[a.id] - depthByWinId[b.id]));
      bucket.sortedWindows = sortedWins;
    }

    let allWins = [];
    for (let bucket of buckets) {
      allWins.push(...bucket.sortedWindows);
    }

    for (let i = 0; i < allWins.length; i++) {
      allWins[i].outerFrame.set({ z: i })
    }
  };

  let giveWindowFocus = (winData) => {
    if (!winData || focusedWindow === winData || !isWindowInList(winData)) return;

    winData.onFocusing();

    focusedWindow = winData;
    winData.zPriority = getTopZPriority();

    sortWindows();

    invalidateTaskbar();
    if (focusedWindow.transform.target === 'MINIMIZE') {
      focusedWindow.setTransform(focusedWindow.isMaximized ? 'MAXIMIZE' : 'NORMAL');
    }
    winData.onFocused();
  };

  let removeWindow = (winData) => {
    ui.winHost.removeChild(winData.outerFrame);
    windowList = windowList.filter(w => w.id !== winData.id);
    os.ProcessManager.unregisterUiHandle(winData.pid, winData);
    if (focusedWindow === winData) {
      focusedWindow = null;
      invalidateTaskbar();
    }
  };

  let defaultX = 20;
  let defaultY = 20;

  let showWindow = async (pid, options) => {

    let onCloseResolver;
    let lifetime = new Promise(res => { onCloseResolver = res; });

    let winOpacity = getWinOpacity();
    let outerFrame = div(winOpacity === 1 ? null : { opacity: `${winOpacity}` });
    let contentHost = div();
    let menuBuilder = options.menuBuilder;
    let menuBar = null;
    if (menuBuilder) {
      menuBar = div();
      outerFrame.append(menuBar);
    }

    outerFrame.append(contentHost);
    let parent = options.parentWindow || null;
    if (parent) {
      if (pid && parent.pid !== pid) throw new Error();
      pid = parent.pid;
    }
    let process = os.ProcessManager.getProcess(pid);
    if (!process && !pid) throw new Error();
    let title = '';
    let lastResizeFire = '';
    let winData = {
      getTitle: () => title,
      setTitle: (t) => { if (title !== t) { title = `${t}`; winData.themeDataCache.titleBar.innerText = title; } },
      pid,
      parent,
      icon: Util.copyImage(options.icon || (process ? process.icon : null) || os.IconStore.getIconByPurpose('EXEC')),
      outerFrame,
      contentHost,
      id: nextWinId++,
      zPriority: getTopZPriority(),
      menuBuilder,
      menuBar,
      mode: options.isFullScreen // NORMAL | MAXIMIZED | MINIMIZED | FULLSCREEN | MANAGED
        ? 'FULLSCREEN'
        : options.managedFrame
          ? 'MANAGED'
          : 'NORMAL',
      onClosing: options.onClosing || (() => {}),
      onClosed: options.onClosed || (() => {}),
      closeHandler: async () => {
        if (await Promise.resolve(winData.onClosing())) return false; // allow program to intercept close event
        removeWindow(winData);
        if (winData.parent) {
          inputMask.enableWindow(winData.parent);
          giveWindowFocus(winData.parent);
        }
        onCloseResolver(true);
        winData.onClosed();
        let proc = os.ProcessManager.getProcess(pid);
        if (proc && options.destroyProcessUponClose) {
          os.ProcessManager.killProcess(pid);
        }
        invalidateTaskbar();
        return true;
      },
      minimizeHandler: () => setTransform('MINIMIZE'),
      maximizeHandler: () => setTransform(winData.isMaximized ? 'NORMAL' : 'MAXIMIZE'),
      downloadHandler: () => { console.log("Download pushed"); },
      onResize: () => {
        if (!options.onResize) return;
        let r = winData.contentHost.getBoundingClientRect();
        let w = Math.floor(r.width);
        let h = Math.floor(r.height);
        let k = `${w}:${h}`;
        if (k === lastResizeFire) return;
        lastResizeFire = k;
        options.onResize(w, h);
      },
      setInteriorSize: (w, h) => {
        if (winData.isMaximized || winData.mode === 'FULLSCREEN' || winData.mode === 'MANAGED') return;
        let { margin, menubar, titlebar } = os.Themes.getChromePadding();
        let outerWidth = w + margin * 2;
        let outerHeight = h + (winData.menuBar ? menubar : 0) + titlebar + margin * 2;
        winData.setWindowBounds(outerWidth, outerHeight);
      },
      isClosed: false,
      openOrder: eventCounter++,
      sendKeyEvent: (jsEvent, isDown) => {
        if (isDown && winData.shortcutKeyRouter.handle(jsEvent)) return;

        if (options.onKeyDown && isDown) {
          options.onKeyDown(jsEvent);
        } else if (options.onKeyUp && !isDown) {
          options.onKeyUp(jsEvent);
        } else if (options.onKey) {
          options.onKey(jsEvent, isDown);
        } else if (winData.focusedElement && winData.focusedElement.onShellKey) {
          winData.focusedElement.onShellKey(jsEvent, isDown);
        }
      },
      focus: () => giveWindowFocus(winData),
      onFocused: () => { if (options.onFocused) options.onFocused(); },
      onFocusing: () => { if (options.onFocusing) options.onFocusing(); },
      themeDataCache: {},
      isMaximized: false,
      transform: {
        target: 'NORMAL',
        progress: 1,
        oldTarget: 'NORMAL',
        regularBounds: [0, 0, 100, 100],
        maximizedBoundsApplied: false,
      },
      setTransform: null,
      chromeBtns: {
        maximize: !options.hideMaximize,
        minimize: true,
        download: false,
      },
      resizeEnabled: !options.disableResize,
      shortcutKeyRouter: createShortcutKeyHandler(),
    };

    windowList.push(winData);
    ui.winHost.append(outerFrame);
    outerFrame.PX_WINDATA = winData;

    let isTransforming = false;
    let setTransform = async (type) => {
      let tfm = winData.transform;
      if (tfm.target === type) return;

      if (type === 'MAXIMIZE') winData.isMaximized = true;
      if (type === 'NORMAL') winData.isMaximized = false;
      if (type === 'MINIMIZE' && focusedWindow === winData) focusedWindow = null;

      tfm.oldTarget = tfm.target;
      tfm.target = type;
      tfm.progress = 0;

      if (!isTransforming) {
        isTransforming = true;
        await performTransform(winData);
        isTransforming = false;
      }

      os.Themes.applyThemedChromeToWindow(winData);
    };
    winData.setTransform = setTransform;
    winData.getActualBounds = () => {
      let winRect = outerFrame.getBoundingClientRect();
      let hostRect = getDesktopBounds(winData.mode === 'FULLSCREEN');
      let r = {
        x: winRect.left - hostRect.left,
        y: winRect.top - hostRect.top,
        width: winRect.width,
        height: winRect.height,
      };
      r.right = r.x + r.width;
      r.bottom = r.y + r.height;
      return r;
    };
    winData.getInteriorSize = () => {
      let r = contentHost.getBoundingClientRect();
      return { width: r.width, height: r.height };
    };

    winData.setWindowBounds = (optWidth, optHeight, optX, optY, optSkipOnResize) => {
      if (winData.transform.target === 'MINIMIZE') return;
      let outerFrame = winData.outerFrame;
      let oldBounds = outerFrame.getBoundingClientRect();
      let desktopBounds = getDesktopBounds(winData.mode === 'FULLSCREEN');
      let winHostBounds = ui.winHost.getBoundingClientRect();
      let oldWidth = oldBounds.width;
      let oldHeight = oldBounds.height;
      let oldLeft = oldBounds.left;
      let oldTop = oldBounds.top;
      let newLeft = Util.isNullish(optX) ? oldLeft : (desktopBounds.left + optX);
      let newTop = Util.isNullish(optY) ? oldTop : (desktopBounds.top + optY);
      let newWidth = Util.isNullish(optWidth) ? oldWidth : optWidth;
      let newHeight = Util.isNullish(optHeight) ? oldHeight : optHeight;

      // Aspire to be larger than this.
      if (newWidth < 140) newWidth = 140;
      if (newHeight < 80) newHeight = 80;

      // Don't allow the window to be bigger than the allocated area.
      if (newWidth > desktopBounds.width) newWidth = desktopBounds.width;
      if (newHeight > desktopBounds.height) newHeight = desktopBounds.height;

      // Don't let the title bar hide
      const toleranceMargin = 20;
      if (newTop < desktopBounds.top) newTop = desktopBounds.top;
      if (newTop > desktopBounds.bottom - toleranceMargin) newTop = desktopBounds.bottom - toleranceMargin;
      if (newLeft > desktopBounds.right - toleranceMargin) newLeft = desktopBounds.right - toleranceMargin;
      if (newLeft + newWidth < desktopBounds.left + toleranceMargin) newLeft = desktopBounds.left - newWidth + toleranceMargin;

      let sizeChanged = newWidth !== oldWidth || newHeight !== oldHeight;

      let x = newLeft - desktopBounds.left;
      let y = newTop - desktopBounds.top;
      let width = newWidth;
      let height = newHeight;

      let adjustedLeft = x + (desktopBounds.left - winHostBounds.left);
      let adjustedTop = y + (desktopBounds.top - winHostBounds.top);
      outerFrame.set({ width, height, left: adjustedLeft, top: adjustedTop });
      if (!winData.transform.maximizedBoundsApplied) {
        winData.transform.regularBounds = [x, y, width, height];
      }

      if (sizeChanged && !optSkipOnResize) {
        winData.onResize();
      }
    };

    let chromePadding = os.Themes.getChromePadding();
    let width = options.width || (options.innerWidth ? (options.innerWidth + chromePadding.margin * 2) : 400);
    let height = options.height || (options.innerHeight ? (options.innerHeight + chromePadding.margin * 2 + (menuBuilder ? chromePadding.menubar : 0) + chromePadding.titlebar) : 300);
    let x = options.x || defaultX;
    let y = options.y || defaultY;
    defaultX += 20;
    defaultY += 20;
    if (defaultX > 200) defaultX = 20;
    if (defaultY > 200) defaultY = 20;
    let scrSz = getSize();

    if (x + width > scrSz.width) x = scrSz.width - width;
    if (y + height > scrSz.height) y = scrSz.height - height;
    if (x < 0) x = 0;
    if (y < 0) y = 0;

    if (winData.mode === 'FULLSCREEN' || winData.mode === 'MANAGED') {
      winData.setWindowBounds(scrSz.width, scrSz.height, 0, 0, true);
      if (winData.mode === 'MANAGED') {
        winData.outerFrame.set({ pointerEvents: 'none' });
      }
    } else {
      winData.setWindowBounds(width, height, x, y, true);
    }
    os.Themes.applyThemedChromeToWindow(winData);
    winData.setTitle(options.title);
    (options.onInit || (() => {}))(contentHost, winData);

    if (process) process.uiHandles.push(winData);
    ['mousedown', 'touchstart', 'pointerdown'].forEach(ev => {
      outerFrame.addEventListener(ev, e => {
        if (winData.transform.target !== 'MINIMIZE') {
          e.stopPropagation();
          giveWindowFocus(winData);
        }
      });
    });
    if (winData.parent) {
      inputMask.disableWindow(winData.parent);
    }
    setTimeout(() => {
      giveWindowFocus(winData);
      let f = options.onShown;
      if (f) f();
    }, 0);
    invalidateTaskbar();
    return lifetime;
  };

  let getDesktopBounds = (fullScreen) => {
    let boundEl = fullScreen ? ui.authorizedHost : ui.desktop.firstChild;
    return boundEl.getBoundingClientRect();
  };

  let getBoundsForTransformState = (winData, state) => {
    let rect = null;
    switch (state) {
      case 'MAXIMIZE':
        rect = getDesktopBounds(false);
        let winHostRect = ui.winHost.getBoundingClientRect();
        return [rect.left + winHostRect.left - rect.left, rect.top + winHostRect.top - rect.top, rect.width, rect.height];

      case 'NORMAL':
      return winData.transform.regularBounds;

      case 'MINIMIZE':
        rect = getSize();
        // TODO: find its tile in the taskbar. For now, just shrink to an inspecific point in the bottom of the screen.
        return [rect.width / 3 - 4, rect.height - 8, 8, 8];
      default: return [0, 0, 100, 100];
    }
  };

  let performTransform = async (winData) => {
    const FPS = 60;
    const DURATION = 0.2;
    const EPSILON = 0.000001;
    let frames = Math.max(1, Math.floor(DURATION * FPS));
    let progPerFrame = 1.0 / frames + EPSILON;
    let tfm = winData.transform;
    while (tfm.progress < 1) {
      await Util.pause(1 / FPS);
      tfm.progress = Math.min(1, tfm.progress + progPerFrame);
      let prog = tfm.progress;
      let invProg = 1 - prog;
      let oldBounds = getBoundsForTransformState(winData, tfm.oldTarget);
      let newBounds = getBoundsForTransformState(winData, tfm.target);
      let desiredBounds = Util.range(4).map(i => Math.floor(oldBounds[i] * invProg + newBounds[i] * prog));
      let actualBounds = tfm.maximizedBoundsApplied
        ? getBoundsForTransformState(winData, 'MAXIMIZE')
        : winData.transform.regularBounds;

      let scaleX = 1;
      let scaleY = 1;
      let transX = 0;
      let transY = 0;
      if (actualBounds[2] !== 0) scaleX = desiredBounds[2] / actualBounds[2];
      if (actualBounds[3] !== 0) scaleY = desiredBounds[3] / actualBounds[3];
      transX = Math.floor(desiredBounds[0] - actualBounds[0]);
      transY = Math.floor(desiredBounds[1] - actualBounds[1]);

      winData.outerFrame.set({
        visibleBlock: true,
        transform: `translateX(${transX}px) translateY(${transY}px) scaleX(${scaleX}) scaleY(${scaleY})`,
        transformOrigin: 'top left',
      });
    }

    let clearTransform = { transform: '', transformOrigin: '' };
    switch (tfm.target) {
      case 'MAXIMIZE':
      case 'NORMAL':
        let useMaxBounds = tfm.target === 'MAXIMIZE';
        if (tfm.maximizedBoundsApplied !== useMaxBounds) {
          let b = useMaxBounds ? getBoundsForTransformState(winData, 'MAXIMIZE') : tfm.regularBounds;
          tfm.maximizedBoundsApplied = useMaxBounds;
          winData.setWindowBounds(b[2], b[3], b[0], b[1]);
        }
        winData.outerFrame.set(clearTransform);
        winData.onResize();
        break;

      case 'MINIMIZE':
        winData.outerFrame.set(clearTransform, { display: 'none' });
        break;

      default: break;
    }
  };

  let getInputMask = winData => Array.from(winData.outerFrame.children).filter(e => e.PX_INPUT_MASK)[0] || null;
  let inputMask = {
    disableWindow: winData => {
      if (!getInputMask(winData)) {
        let im = div({ fullSize: true, userSelect: 'none' });
        im.PX_INPUT_MASK = true;
        winData.outerFrame.set(im);
        let ae = document.activeElement;
        if (ae && HtmlUtil.childIsDescendentOf(ae, winData.outerFrame)) {
          ae.blur();
        }
      }
    },
    enableWindow: winData => {
      let im = getInputMask(winData);
      if (im) winData.outerFrame.removeChild(im);
    },
  };

  let killWindows = ids => {
    let idLookup = new Set(ids);
    let frames = [];
    let newWinList = [];
    for (let w of windowList) {
      if (focusedWindow === w) focusedWindow = null;
      if (idLookup.has(w.id)) {
        frames.push(w.outerFrame);
        let proc = os.ProcessManager.getProcess(w.pid);
        if (proc) {
          proc.uiHandles = proc.uiHandles.filter(h => h.id !== w.id);
        }
      } else {
        newWinList.push(w);

      }
    }
    windowList = newWinList;
    frames.forEach(f => ui.winHost.removeChild(f));

    invalidateTaskbar();
  };

  let getWindowHandles = () => [...windowList];

  let initialized = false;
  let ui = null;

  let hostId = 'PX_' + Util.generateId(30);

  let init = async (uiHost, optionalTheme) => {
    if (initialized) return;
    initialized = true;

    ui = {
      host: uiHost,
      taskbar: div(),
      bg: createBackground(),
      desktop: createDesktopHost(),
      winHost: createWinHost(),
      modalHost: createModalHost(),
      dragDropLayer: createDragDropLayer(),
      authorizedHost: createAuthorizedHost(),
    };

    let tickleScreensaver = () => { timeOfLastInput = Util.getTime(); };
    ui.authorizedHost.addEventListener('contextmenu', e => e.preventDefault());
    // ui.host.addEventListener('drop', e => { e.preventDefault(); });
    ui.host.addEventListener('drop', e => {
      e.preventDefault();
      performExternalFileDragEvent(e, 'drop');
    }, true);
    ui.host.addEventListener('dragenter', e => {
      e.preventDefault();
      performExternalFileDragEvent(e, 'start');
    }, true);
    ui.host.addEventListener('dragleave', e => {
      if (e.fromElement && HtmlUtil.childIsDescendentOf(e.fromElement, ui.host)) return;
      if (activeDrag) performExternalFileDragEvent(e, 'end', true);
    }, true);
    ui.host.addEventListener('dragover', e => {
      e.preventDefault();
      tickleScreensaver();
      performExternalFileDragEvent(e, 'move');
    }, true);

    ui.authorizedHost.addEventListener('pointerdown', tickleScreensaver);
    ui.authorizedHost.addEventListener('pointermove', tickleScreensaver);

    uiHost.classList.add(hostId);
    let s = uiHost.style;
    s.overflow = 'hidden';
    s.fontFamily = '"Arial", sans-serif',
    HtmlUtil.clear(uiHost).append(
      ui.authorizedHost.set(
        ui.bg.set({ z: 1 }),
        ui.desktop.set({ z: 2 }),
        ui.winHost.set({ z: 3 }),
        ui.taskbar.set({ z: 4 }),
        ui.modalHost.set({ z: 5 }),
        ui.dragDropLayer.set({ z: 6 })
      ).set({ z: 1 }));

    // Load the theme
    let themeId = 'io.plexi.theme.default';
    if (optionalTheme) {
      let themeInfo = await os.FsRoot.getVirtualJsInfo(optionalTheme || '/system/themes/Plexi Default.theme');
      if (!themeInfo.isValid || themeInfo.category !== 'theme') {
        throw new Error("Invalid initial theme.");
      }
      themeId = themeInfo.id;
    }
    await os.Themes.setActiveTheme(themeId);

    let bg = os.Settings.get('shellBg');
    if (bg) await setBackground(bg);

    doSysMaintenance();
  };

  let getTaskbarHost = () => ui.taskbar;

  let taskbarFingerprint = '';
  let invalidateTaskbar = async () => {
    let hideTaskbar = !!(focusedWindow && focusedWindow.mode === 'FULLSCREEN');
    let isHidden = ui.taskbar.style.display === 'none';
    if (hideTaskbar !== isHidden) {
      taskbarFingerprint = 'INVALID';
      ui.taskbar.set({ visibleBlock: !hideTaskbar });
      if (hideTaskbar) return;
    }
    let fp = os.Shell.Taskbar.getTaskbarStateFingerprint();
    if (fp !== taskbarFingerprint) {
      taskbarFingerprint = fp;
      await os.Themes.redrawTaskbar()
    }
  };

  let getFocusedWindowPid = () => focusedWindow ? focusedWindow.pid : 0;
  let getFocusedWindow = () => {
    if (focusedWindow) return { winId: focusedWindow.id, pid: focusedWindow.pid };
    return null;
  };

  let screenSaverPid = null;
  let timeOfLastInput = Util.getTime();
  let registerProcIdAsScreenSaver = pid => {

    // Kill all previous screensavers.
    os.ProcessManager.getProcessesByAppId('io.plexi.tools.screensaver').forEach(p => {
      if (p.pid !== pid) os.ProcessManager.killProcess(p.pid);
    });

    screenSaverPid = pid;
  };
  let terminateScreenSaver = () => {
    if (screenSaverPid) {
      os.ProcessManager.killProcess(screenSaverPid);
      screenSaverPid = null;
    }
    timeOfLastInput = Util.getTime();
  };
  let pollForScreenSaverInvocation = () => {
    if (screenSaverPid && !os.ProcessManager.getProcess(screenSaverPid)) {
      screenSaverPid = null;
    }
    let screenSaverTimeout = os.Settings.getInt('screenSaverTimeout', 120);
    let screenSaverPath = os.Settings.getString('screenSaverPath', '');
    if (!screenSaverPid && screenSaverTimeout && screenSaverPath && Util.getTime() - timeOfLastInput > screenSaverTimeout) {

      // Race condition: if there are multiple polls before the screensaver pid
      // is registered, then multiple screensavers can launch. Set the time of last
      // input to now to prevent this condition from being true in the next poll.
      timeOfLastInput = Util.getTime();

      os.ExecutionEngine.launchFile('/system/tools/screensaver', [screenSaverPath]);
    }
  };

  let keyListener = (ev, isDown) => {
    if (isDown) terminateScreenSaver();

    if (focusedWindow) {
      focusedWindow.sendKeyEvent(ev, isDown);
    } else if (ui.desktopIcons) {
      ui.desktopIcons.onShellKey(ev, isDown);
    }
  };

  let getWindowIndex = winData => {
    let windows = Array.from(ui.winHost.children);
    for (let i = 0; i < windows.length; i++) {
      if (winData.outerFrame === windows[i]) return i;
    }
    return -1;
  };

  let dropPriority = {
    DESKTOP: 1,
    TASKBAR: 2,
    WINDOW: 3,
    MODAL: 4,
  };
  let getDropZone = (ev) => {
    let mx = ev.pageX;
    let my = ev.pageY;
    let dropReceivers = document.querySelectorAll(`.${hostId} .PX_FILE_DROP_RECV`);
    let atCursor = Array.from(dropReceivers).filter(dr => {
      let bcr = dr.getBoundingClientRect();
      return mx >= bcr.left && mx <= bcr.right && my >= bcr.top && my <= bcr.bottom;
    });
    let candidates = atCursor.map(e => {
      let z = getZoneInfo(e);
      if (!z) return { element: e, zone: '?' };
      let output = z;
      if (output.zone === 'WINDOW') return { ...z, winOrder: getWindowIndex(z.winData) };
      return output;
    });

    if (!candidates.length) return null;

    candidates.sort((a, b) => {
      let pri1 = dropPriority[a.zone] || 999;
      let pri2 = dropPriority[b.zone] || 999;
      if (pri1 !== pri2) return pri1 - pri2;
      if (a.zone === 'WINDOW') return a.winOrder - b.winOrder;
      return 0;
    });

    let candidate = candidates.pop();
    // TODO: check if candidate is obscured by a window, taskbar, or modal.

    return candidate;
  };

  let getZoneInfo = e => {
    let walker = e;
    let prev = null;
    while (walker && walker !== ui.host) {
      if (walker === ui.winHost && prev) {
        let winData = prev.PX_WINDATA;
        return { element: e, zone: 'WINDOW', winData };
      } else if (walker === ui.modalHost && prev) {
        return { element: e, zone: 'MODAL', modal: prev };
      } else if (walker === ui.desktop) {
        return { element: e, zone: 'DESKTOP' };
      } else if (walker === ui.taskbar) {
        return { element: e, zone: 'TASKBAR' };
      }
      prev = walker;
      walker = walker.parentElement;
    }
    return null;
  };

  let activeDrag = null;

  let FileDrag = Object.freeze({
    start: (ev, files) => {
      if (!files.length) return;
      activeDrag = { files, isInternal: true };
      commonFileDragStart(ev, activeDrag);
    },
    move: (ev) => {
      if (activeDrag) {
        commonFileDragMove(ev, activeDrag);
      }
    },
    release: (ev) => {
      if (activeDrag) {
        commonFileDragEnd(ev, true, activeDrag); // all internal drag releases are commits
        activeDrag = null;
      }
    },
  });

  let commonFileDragStart = (ev, drag) => {
    let dropZone = getDropZone(ev);
    drag.element = dropZone ? dropZone.element : null;
    drag.hoverSince = Util.getTime();
    let originalIcon = drag.files[0].icon || os.IconStore.getIconByPurpose('FILE');
    let ghostIcon = Util.copyImage(originalIcon).set({ size: 32 });
    let label = drag.files.length > 1 ? (drag.files.length + " Items") : drag.files[0].name;
    drag.ghostWidget = div(
      { position: 'absolute', size: 80, bold: true, opacity: 0.5, textAlign: 'center', pointerEvents: 'none' },
      ghostIcon,
      div(div(label, { padding: 4, fontSize: 9, display: 'inline-block', color: '#fff', backgroundColor: '#008' })));
    ui.dragDropLayer.set({ display: 'block', pointerEvents: 'none', userSelect: 'none' }).firstChild.clear().set(
      drag.ghostWidget
    );
    commonFileUpdateGhostWidget(ev, drag);
  };

  let commonFileUpdateGhostWidget = (ev, drag) => {
    if (drag.ghostWidget) {
      let bcr = ui.dragDropLayer.getBoundingClientRect();
      let x = ev.pageX - bcr.left;
      let y = ev.pageY - bcr.top;
      drag.ghostWidget.set({ left: x - 40, top: y - 40 });
    }
  };

  let commonFileDragMove = (ev, drag) => {
    commonFileUpdateGhostWidget(ev, drag);
    let dropZone = getDropZone(ev);
    let element = dropZone ? dropZone.element : null;
    if (drag.element !== element) {
      drag.element = element;
      drag.hoverSince = Util.getTime();
      drag.firedHoverHesitate = false;
    }

    if (element &&
        !drag.firedHoverHesitate &&
        Util.getTime() - activeDrag.hoverSince > DELAY_FOR_GIVING_WINDOW_FOCUS_ON_FILE_DRAG_HESITATE) {
      activeDrag.firedHoverHesitate = true;
      if (dropZone.zone === 'WINDOW') {
        giveWindowFocus(dropZone.winData);
      }
    }
  };

  let commonFileDragEnd = (ev, isCommit, drag) => {
    let dropZone = getDropZone(ev);
    if (isCommit && dropZone && dropZone.element) {
      dropZone.element._PX_ON_DRAG_DROP(drag.files, 'drop', ev);
    }
    ui.dragDropLayer.set({ display: 'none' }).firstChild.clear();
  };

  let getExternalFiles = (ev, isPreview) => {
    let files;
    if (ev.dataTransfer.items) {
      files = Array.from(ev.dataTransfer.items).map(item => {
        if (item.kind === 'file') {
          if (isPreview) return { };
          return item.getAsFile();
        }
      });
    } else {
      files = Array.from(ev.dataTransfer.files)
    }

    return files.filter(Util.identity).map(file => {
      if (isPreview) return { name: "Upload File" };

      let output = { name: file.name, size: file.size, isExternal: true };
      output.isText = file.type.split('/')[0] === 'text'
      if (output.isText) {
        output.text = file.text();
      } else {
        output.bytes = file.arrayBuffer();
      }
      return output;
    });
  };

  let performExternalFileDragEvent = async (ev, type, allowDefault) => {
    if (!allowDefault) ev.preventDefault();

    switch (type) {
      case 'end':
        if (activeDrag) {
          commonFileDragEnd(ev, false, activeDrag);
          activeDrag = null;
        }
        break;

      case 'start':
        let files = getExternalFiles(ev, true);
        if (files.length) {
          activeDrag = { files, externalData: ev };
          commonFileDragStart(ev, activeDrag);
        }
        break;

      case 'move':
        if (activeDrag) {
          activeDrag.externalData = ev;
          commonFileDragMove(ev, activeDrag);
        }
        break;

      case 'drop':
        if (activeDrag) {
          activeDrag.files = getExternalFiles(ev);
          activeDrag.externalData = ev;
          commonFileDragEnd(ev, true, activeDrag);
          activeDrag = null;
        }
        break;
    }
  };

  let dirInv = (() => {
    let lu = { n: 'south', s: 'north', w: 'east', e: 'west' };
    return d => lu[d[0].toLowerCase()];
  })();

  let updateUsableDesktopBounds = () => {
    let tbParams = os.Themes.getTaskbarParams();

    let area = {};
    area[dirInv(tbParams.dock) + 'StretchDock'] = tbParams.thickness;

    let desktopIcons = HtmlUtil.Components.IconBrowser({
      os,
      getDir: () => '/home/desktop',
      bgTransparent: true,
      highContrastText: true,
      defaultLayoutMode: 'ARRANGE',
      fullSize: true,
      fileContextMenuExtBuilder: (idChain, _, isDirInterior) => {
        let mb = os.Shell.MenuBuilder;
        switch (idChain.join(':')) {
          case '': return isDirInterior ? [mb.createMenuSep(), mb.createMenuItem('bgchange', "Change Background")] : null;
          case 'bgchange': return mb.createCommand(() => { os.ExecutionEngine.launchFile('/system/tools/settings', ['BACKGROUND']); });
        }
      },
    });
    os.FsRoot.addWatcher('/home/desktop', -1, () => desktopIcons.refresh());
    ui.desktopIcons = desktopIcons;
    ui.desktop.clear().set(
      { width: '', height: '', top: '', left: '', bottom: '', right: '' }, // explicit reset of bounds
      area,
      desktopIcons,
    );
  };

  let setBackground = async (path) => {
    let { ok, img } = await os.FsRoot.fileReadImage(path, true);
    if (!ok) return;
    os.Settings.set('shellBg', path);
    ui.bg.set({
      backgroundImage: 'url("' + img.toDataURL() + '")',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    });
  };

  let onCurrentModalDismiss = null;

  let setModal = async (e) => {
    let wrapper = div(e, { fullSize: true });
    wrapper.addEventListener('pointerdown', () => clearModal());
    ui.modalHost.clear().set({ fullSize: true }).append(wrapper);

    // clicking the modal should not clear it.
    e.addEventListener('pointerdown', e => {
      e.stopPropagation();
    });

    return new Promise(r => { onCurrentModalDismiss = r; });
  };

  let clearModal = () => {
    ui.modalHost.clear().set({ size: 0 });
    if (onCurrentModalDismiss) {
      onCurrentModalDismiss(true);
      onCurrentModalDismiss = null;
    }
  };

  let pushModal = (e) => {
    throw new Error();
  };

  let createLocalizedSpan = (...args) => {
    let getContent = () => {};
    args = args.filter(a => {
      if (typeof a !== 'function') return true;
      getContent = a;
    });
    let e = HtmlUtil.span(args);
    e.classList.add('PLEXI_LOC_CHANGE_SUBSCRIBER');
    e.PLEXI_onLocUpdate = async lang => {
      let c = getContent(lang);
      if (typeof c === 'string') e.clear().set(c);
      else e.clear().set(await Promise.resolve(c));
    };
    e.PLEXI_onLocUpdate(os.Localization.getLanguage());
    return e;
  };

  let onLocaleChange = () => {
    let lang = os.Localization.getLanguage();
    let tickles = Array.from(document.querySelectorAll('.' + hostId + ' .PLEXI_LOC_CHANGE_SUBSCRIBER'));
    for (let i = 0; i < tickles.length; i++) {
      tickles[i].PLEXI_onLocUpdate(lang);
    }
  };

  let openModalAtMouseEvent = (ev, el) => {
    let r = getBounds();
    let x = Math.floor(ev.pageX - r.left);
    let y = Math.floor(ev.pageY - r.top);

    os.Shell.setModal(el.set({ position: 'absolute', left: x, top: y }));

    let pos = el.getBoundingClientRect();
    if (pos.top < r.top) el.set({ top: 0 });
    else if (pos.bottom > r.bottom) el.set({ top: r.height - pos.height});
    if (pos.left < r.left) el.set({ left: 0 });
    else if (pos.right > r.right) el.set({ left: r.width - pos.width });
  };

  let getBounds = () => {
    return ui.authorizedHost.getBoundingClientRect();
  };

  let buildRootMenuElement;

  let updateWindowMenu = (winData) => {
    if (!winData.menuBar) return;
    buildRootMenuElement(winData.menuBuilder, false).then(menu => {
      winData.menuBar.firstChild.clear().set(menu);
    });
  };

  let MenuBuilder = (() => {

    buildRootMenuElement = async (idChainToMenuFactory, isVertical) => {
      let idChain = [];
      let topLevelMenu = await generateMenuForIdChain(idChainToMenuFactory, idChain);
      return buildMenuDivs(
        topLevelMenu,
        idChainToMenuFactory, idChain, true, isVertical);
    };

    let generateMenuForIdChain = async (idChainToMenuFactory, idChain) => {
      let menu = await Promise.resolve(idChainToMenuFactory(idChain));
      if (!menu) return null;
      if (menu.isCommand) return menu;
      if (!menu._PX_IS_MENU) return null;
      for (let item of menu.items || []) {
        if (item.isSep) continue;
        idChain.push(item.id);
        let itemChildren = await generateMenuForIdChain(idChainToMenuFactory, idChain);
        idChain.pop();
        if (itemChildren && !itemChildren.isCommand) {
          item.hasChildren = true;
        }
      }
      return menu;
    };

    let isMac = navigator.platform.indexOf("Mac") === 0;

    let renderShortcut = sc => {
      let sb = [];
      sc = sc.map(t => t === 'CTRL_CMD' ? isMac ? 'CMD' : 'CTRL' : t);
      for (let i = 0; i < sc.length; i++) {
        if (i > 0) sb.push(span({ opacity: 0.5 }, ' + '));
        switch (sc[i]) {
          case 'CMD': sb.push(span({ html: '&#8984;' })); break;
          case 'CTRL': sb.push("Ctrl"); break;
          case 'SHIFT': sb.push("Shift"); break;
          case 'ALT': sb.push("Alt"); break;
          default: sb.push(sc[i]); break;
        }
      }
      return span({ whiteSpace: 'nowrap' }, sb);
    };

    let buildMenuDivs = (menu, idChainToMenuFactory, idChain, isRoot, isVertical) => {
      let isHorizontal = !isVertical;
      let ctxMenuStyles = os.Themes.getContextMenuStyles();

      if (menu._PX_TYPE !== 'MENU') return [div("INVALID")];

      let anyIcons = menu.items.filter(item => item.icon).length;

      let divList = menu.items.map(item => {
        if (item.isSep && isHorizontal) return null;
        if (item.isSep) return div(ctxMenuStyles.sep);
        if (item._PX_TYPE !== 'ITEM') return div("INVALID");
        let label = item.label;

        let el = div(
          item.icon
            ? item.icon.set({ size: 16, marginRight: 8 })
            : anyIcons
              ? div({ display: 'inline-block', width: 24 })
              : null,
          label,
          { cursor: 'pointer', whiteSpace: 'nowrap' },
          isHorizontal
            ? { display: 'inline-block', marginRight: 12 }
            : { margin: 4 },
          isVertical ? ctxMenuStyles.itemVertical : ctxMenuStyles.itemHorizontal,
          item.shortcut ? renderShortcut(item.shortcut).set({ marginLeft: 10, opacity: 0.7 }) : null,
        );
        el.addEventListener(isVertical ? 'pointerup' : 'pointerdown', async (e) => {
          e.preventDefault();
          e.stopPropagation();
          let nextIdChain = [...idChain, item.id];
          if (item.hasChildren) {
            let subMenu = await generateMenuForIdChain(idChainToMenuFactory, nextIdChain);
            let subDivs = buildMenuDivs(subMenu, idChainToMenuFactory, nextIdChain, false, true);
            let bcr = el.getBoundingClientRect();
            let origin;
            if (isRoot) {
              origin = [bcr.left, bcr.bottom];
              os.Shell.clearModal();
            } else {
              origin = [bcr.right, bcr.top];
              throw new Error(); // Not implemented
            }
            os.Shell.setModal(subDivs.set({ left: origin[0], top: origin[1] }));
          } else {
            let cmd = await generateMenuForIdChain(idChainToMenuFactory, nextIdChain);
            if (!cmd || !cmd.isCommand) throw new Error("Invalid menu ID", nextIdChain.join(' '));
            cmd.handler();
            os.Shell.clearModal();
          }
        });
        el.addEventListener('mouseenter', () => {
          el.set(isVertical ? ctxMenuStyles.itemVerticalHover : ctxMenuStyles.itemHorizontalHover);
        });
        el.addEventListener('mouseleave', () => {
          el.set(isVertical ? ctxMenuStyles.itemVertical : ctxMenuStyles.itemHorizontal);
        });
        return el;
      }).filter(Util.identity);

      return div(
        { userSelect: 'none' },
        isVertical ? [
          { position: 'absolute', left: 0, top: 0 },
          ctxMenuStyles.wrapper,
        ] : null,
        divList,
      );
    };

    let createMenu = (...items) => {
      let flatItems = Util.flattenArray([items]).filter(Util.identity);

      // remove unnecessary separators
      for (let i = flatItems.length - 1; i >= 0; i--) {
        let item = flatItems[i];
        if (item.isSep && (i === 0 || i === flatItems.length - 1 || flatItems[i + 1].isSep)) {
          flatItems.splice(i, 1);
          i++;
        }
      }

      return {
        _PX_TYPE: 'MENU',
        _PX_IS_MENU: true,
        items: flatItems.filter(Util.identity).map(item => {
          if (item.isSep || item._PX_TYPE === 'ITEM') {
            return item;
          }
          return { _PX_TYPE: 'INVALID' };
        }),
      };
    };

    let createMenuItem = (id, label) => {
      let t = Util.ensureString(label).split('_');
      let accel = null;
      let accelIndex = -1;
      if (t.length > 1) {
        accel = t[1][0] || null;
        t[1] = t[0] + t[1];
        accelIndex = t[0].length;
        label = t.slice(1).join('_');
      }

      id = Util.ensureString(id);
      if (!id || !label) return { _PX_TYPE: 'INVALID' };
      let o = {
        _PX_TYPE: 'ITEM', id, label, accel, accelIndex, shortcut: null, icon: null,
        withShortcut: (...args) => {
          o.shortcut = args.join('+').split('+');
          return o;
        },
        withIcon: (canvas) => {
          o.icon = Util.copyImage(canvas).set({ size: 16 });
          return o;
        },
        isDisabled: false,
        disabled: () => {
          o.isDisabled = true;
          return o;
        },
      };
      return o;
    };

    let createMenuSep = () => ({ _PX_TYPE: 'SEP', isSep: true });

    let createCommand = (fn) => {
      return {
        _PX_TYPE: 'COMMAND',
        isCommand: true,
        handler: fn,
      };
    };

    return Object.freeze({
      buildRootMenuElement,

      createCommand,
      createMenu,
      createMenuSep,
      createMenuItem,

      MENU_CTRL_CMD: 'CTRL_CMD',
      MENU_CTRL: 'CTRL',
      MENU_SHIFT: 'SHIFT',
      MENU_ALT: 'ALT',
      MENU_OPTION: 'OPTION',
      MENU_CMD: 'CMD',
    });
  })();

  let lastSize = {};
  let sysResizeCheck = () => {
    let { width, height } = getBounds();
    if (lastSize.width !== width || lastSize.height !== height) {
      lastSize = { width, height };
      for (let wd of windowList) {
        if (wd.mode === 'FULLSCREEN' || wd.mode === 'MANAGED' || wd.transform.maximizedBoundsApplied) {
          wd.setWindowBounds(width, height);
        } else {
          let b = wd.transform.regularBounds || wd.getActualBounds();
          wd.setWindowBounds(b[2], b[3], b[0], b[1]);
        }
      }
    }
    return lastSize;
  };

  let getSize = () => ({ ...sysResizeCheck() });

  let giveKeyboardFocusToElement = (e) => {
    let w = getWindowFromElement(e);
    if (w) w.focusedElement = e;
  };

  let getWindowFromElement = e => {
    let walker = e;
    while (walker && walker !== document.body) {
      if (walker.PX_WINDATA) {
        return walker.PX_WINDATA;
      }
      walker = walker.parentElement;
    }
    return null;
  };

  let getPidFromElement = e => {
    let w = getWindowFromElement(e);
    return w ? w.pid : 0;
  };

  let systemWindowResizeListener = () => sysResizeCheck();

  return Object.freeze({
    DialogFactory: createDialogFactory(os),
    MenuBuilder,
    Taskbar: createTaskbar(os, invalidateTaskbar),
    FileDrag,

    clearModal,
    createLocalizedSpan,
    enableInputMask: inputMask.disableWindow,
    getDesktopBounds,
    getFocusedWindow,
    getFocusedWindowPid,
    getPidFromElement,
    getRootElement: () => ui.host,
    getSize,
    getTaskbarHost,
    getWindowHandles,
    giveProcessFocus,
    getUi: () => ui,
    init,
    isInitialized: () => initialized,
    killWindows,
    onLocaleChange,
    openModalAtMouseEvent,
    pushModal,
    refreshWindowVisualSettings,
    registerProcIdAsScreenSaver,
    setBackground,
    setModal,
    showWindow,
    systemKeyDownListener: (ev) => keyListener(ev, true),
    systemKeyUpListener: (ev) => keyListener(ev, false),
    systemWindowResizeListener,
    giveKeyboardFocusToElement,
    updateUsableDesktopBounds,
    updateWindowMenu,
  });
};


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


let showSysPane = (() => {

  let { button, div, span } = HtmlUtil;

  let createFsButton = (os) => {

    // full screen API support is spotty. Use all the prefixes
    let getBrowserSpecificObjAttribute = (root, suffix) => {
      for (let p of ['', 'webkit', 'moz', 'ms']) {
        let name = p + suffix;
        name = name[0].toLowerCase() + name.substring(1);

        if (p === 'moz') {
          name = name.split('Fullscreen').join('FullScreen'); // Honestly, I respect them for wanting to die on this hill.
          name = name.split('mozExit').join('mozCancel');
        }

        let thing = typeof root[name] === 'function' ? (...args) => root[name](...args) : root[name];
        if (thing) return thing;
      }
      return null;
    };
    let isFs = () => !!getBrowserSpecificObjAttribute(document, 'FullscreenElement');
    let updateLabel = () => btn.clear().set({ html: isFs() ? "&#8999;&nbsp;Exit" : "&#9974;&nbsp;Enable" });

    let btn = button(
      { background: 'transparent', padding: 1, color: '#fff' },
      ev => {
        ev.stopPropagation();
        if (isFs()) {
          getBrowserSpecificObjAttribute(document, 'ExitFullscreen')();
        } else {
          let fn = getBrowserSpecificObjAttribute(os.Shell.getRootElement(), 'RequestFullscreen');
          fn();
        }
        setTimeout(updateLabel, 150);
      },
    );
    updateLabel();
    return btn;
  };

  return async os => {
    let { DockButton, Calendar } = await HtmlUtil.loadComponents('DockButton', 'Calendar');

    let { percent, isPluggedIn } = await os.PowerManager.getProperties();

    let settingsApp = await os.FsRoot.getExecInfo('/system/tools/settings');

    let root = div(
      { position: 'absolute', size: [300, 400], fontSize: 8 },
      div(
        { absMargin: 10, bottom: 110 },
        os.Themes.buildPanelBackground().set(
          div(
            { absMargin: 10 },
            Calendar({ year: 2023, month: 11, day: 29 })
          )
        )
      ),
      div(
        { position: 'absolute', left: 10, height: 90, bottom: 10, right: 10 },
        os.Themes.buildPanelBackground().set(
          div({ westDock: 70 },
            div({ northDock: 15, textAlign: 'center' }, span({ position: 'relative', top: 4 }, "Battery")),
            div({ southStretchDock: 15 },
              div(
                { position: 'absolute', left: 8, top: 6, right: 8, bottom: 6, textAlign: 'center' },
                os.Shell.Taskbar.renderBatteryImage(HtmlUtil.canvas(), false, true, percent).set({ size: 32, marginBottom: 2 }),
                div({ bold: true, fontSize: 10 }, percent + '%'),
                div(
                  { fontSize: 7 },
                  isPluggedIn
                    ? (percent === 100 ? " (Charged)" : " (Charging)")
                    : ""),
              )
            )
          ),

          div({ eastStretchDock: 70 },
            div(
              { northDock: 47 },
              div({ textAlign: 'center', height: 14 }, span({ position: 'relative', top: 4 }, "Taskbar Dock")),
              div({ height: 30, position: 'relative' }, DockButton({ os, fullSize: true }))
            ),

            div(
              { southStretchDock: 52 },
              div(
                { westStretchDock: 30 },
                span({ marginLeft: 4 }, "Full Screen"), ' ',
                createFsButton(os)
              ),
              div(
                { eastDock: 30 },
                settingsApp.isValid
                  ? button(
                    () => { os.ExecutionEngine.launchFile('/system/tools/settings'); os.Shell.clearModal() },
                    { title: "Settings", padding: 2, background: 'transparent' },
                    Util.copyImage(settingsApp.icon).set({ width: 16, height: 16 }))
                  : null
              )
            ),
          ),
        )
      )
    );

    let tb = os.Themes.getTaskbarParams();
    let pos;
    switch (tb.dock[0]) {
      case 'N': pos = { right: 0, top: tb.thickness }; break;
      case 'W': pos = { left: tb.thickness, bottom: 0 }; break;
      case 'E': pos = { bottom: 0, right: tb.thickness }; break;
      default: pos = { bottom: tb.thickness, right: 0 }; break;
    }

    os.Shell.setModal(root.set(pos));
  };

})();


let createTaskbar = (os, invalidateTaskbar) => {

  let iconCache = {};
  const PIN_FILE = '/home/config/taskbar-pins.txt'

  // pinCache and the code that populates it should be in the launcherRegistry
  let pinCache = null;
  let pinCacheCounter = 0;
  let getPinnedAppPaths = async () => {
    if (!pinCache) {
      let fs = os.FsRoot;
      let pinRawData = await fs.fileReadText(PIN_FILE);
      pinCache = (pinRawData.ok ? pinRawData.text.split('\n') : [])
        .map(v => v.trim())
        .filter(Util.identity);
    }
    return [...pinCache];
  };
  let clearPinCache = () => { pinCache = null; pinCacheCounter++ };

  let isAppPinned = async path => {
    let paths = await getPinnedAppPaths();
    return !!paths.filter(p => p === path).length;
  };

  let toggleAppPin = async (path, isPin) => {
    let apps = await getPinnedAppPaths();
    let alreadyPinned = new Set(apps).has(path);
    if (alreadyPinned === isPin) return;
    if (isPin) apps.push(path);
    else apps = apps.filter(p => p !== path);

    let fs = os.FsRoot;
    await fs.fileWriteText(PIN_FILE, apps.join('\n'));
    clearPinCache();
    invalidateTaskbar();
  };

  let getTaskbarStateFingerprint = () => {
    let procs = os.ProcessManager.getProcesses(true);
    return [
      ...procs.map(p => p.pid),
      os.Shell.getFocusedWindowPid(),
      pinCacheCounter,
    ].join('|');
  };

  let processesToTaskEntities = async (procs) => {
    let appBucket = {};

    let fs = os.FsRoot;

    (await getPinnedAppPaths())
      .forEach((path, i) => {
        appBucket[path] = { appPath: path, isPinned: true, pids: [], isFocused: false, order: '0:' + Util.ensureNumLen(i, 4) };
      });

    procs.forEach(proc => {
      let { pid, isFocused, path } = proc;
      if (!appBucket[path]) {
        appBucket[path] = { appPath: path, isPinned: false, pids: [], isFocused: false, order: '1:' };
      }
      let app = appBucket[path];
      app.pids.push(pid);
      if (isFocused) app.isFocused = true;
      iconCache[path] = proc.icon || iconCache[path];
    });

    let appNameCache = {};

    let items = await Promise.all(Object.values(appBucket)
      .map(async app => {
        let path = app.appPath;
        app.order += Util.ensureNumLen(Math.min(...app.pids), 9);
        app.count = app.pids.length;
        app.multiIndicator = app.count > 1 ? app.count : null;
        app.icon = iconCache[path];
        if (!app.icon) {
          app.icon = await os.IconStore.getIconByPath(fs, path, true);
          iconCache[path] = app.icon;
        }

        // TODO: find a better way.
        let appNameCacheEntry = appNameCache[path] || {};
        if (Util.getTime() - appNameCacheEntry.age > 120) appNameCacheEntry = null;
        let appName = appNameCacheEntry.name;
        if (!appName) {
          let { isValid, appId } = await os.FsRoot.getExecInfo(path);
          if (isValid) {
            let { name } = await os.ApplicationRegistry.getInfo(appId, true) || {};
            appName = name || appId;
            if (!name) {
              if (app.pids.length) {
                let proc = os.ProcessManager.getProcess(app.pids[0]);
                if (proc && proc.uiHandles.length) {
                  let winData = proc.uiHandles[0];
                  appName = winData.getTitle();
                }
              }
            }
          }

          appNameCache[path] = { name: appName, age: Util.getTime() };
        }
        app.name = appNameCache[path].name;

        return app;
      }));
    items.sort((a, b) => a.order.localeCompare(b.order));
    return items;
  };

  let showTaskMenu = async (ev, appPath, pid) => {

    let {
      buildRootMenuElement,
      createMenu,
      createMenuItem,
      createCommand,
      createMenuSep,
    } = os.Shell.MenuBuilder;

    let buildMenu = async (idChain) => {
      switch (idChain.join(':')) {
        case '':
          clearPinCache();
          let isPinned = new Set(await getPinnedAppPaths()).has(appPath);

          return createMenu(
            createMenuItem('open', "Open"),
            isPinned ? createMenuItem('unpin', "Unpin Item") : createMenuItem('pin', "Pin App"),
            pid ? [
              createMenuSep(),
              createMenuItem('close', "Close"),
            ] : null,
          );
        case 'pin':
          return createCommand(() => toggleAppPin(appPath, true));
        case 'unpin':
          return createCommand(() => toggleAppPin(appPath, false));
        case 'open':
          return createCommand(() => {
            if (pid) os.Shell.giveProcessFocus(pid);
            else os.ExecutionEngine.launchFile(appPath);
          });
        case 'close':
          return createCommand(() => {
            let proc = os.ProcessManager.getProcess(pid);
            if (proc) {
              if (proc.uiHandles.length === 1) {
                let winData = proc.uiHandles[0];
                winData.closeHandler();
              } else {
                console.log("TODO: close all or check for modal");
              }
            } else {
              // This should not happen, since window-free processes shouldn't appear here.
              os.ProcessManager.killProcess(pid);
            }
          });
      }
    };

    let el = await buildRootMenuElement(buildMenu, true);
    os.Shell.openModalAtMouseEvent(ev, el);
  };

  let batteryColorPicker = HtmlUtil.createColorInterpolator([
    { ratio: 1, rgb: [0, 100, 255] },
    { ratio: 0.97, rgb: [0, 160, 255] },
    { ratio: 0.9, rgb: [0, 160, 0] },
    { ratio: 0.5, rgb: [255, 255, 0] },
    { ratio: 0.25, rgb: [255, 128, 0] },
    { ratio: 0.05, rgb: [255, 0, 0] },
    { ratio: 0, rgb: [150, 0, 60] },
  ]);

  let renderBatteryImage = (canvas, isDark, useColor, percent) => {
    canvas.width = 64;
    canvas.height = 64;
    let g = canvas.getContext('2d');
    g.clearRect(0, 0, 64, 64);

    let lineSz = 4;
    let left = 10;
    let right = 54;
    let bottom = 64;
    let top = lineSz;
    let tipSize = lineSz * 4;

    g.fillStyle = isDark ? '#000' : '#fff';
    g.fillRect(left, top, lineSz, bottom - top);
    g.fillRect(right - lineSz, top, lineSz, bottom - top);
    g.fillRect(left, top, right - left, lineSz);
    g.fillRect(left, bottom - lineSz, right - left, lineSz);
    let mid = (left + right) >> 1;
    g.fillRect(mid - (tipSize >> 1), top - lineSz, tipSize, lineSz);

    let intLeft = left + lineSz * 2;
    let intRight = right - lineSz * 2;
    let intTop = top + lineSz * 2;
    let intBottom = bottom - lineSz * 2;
    let intHeight = intBottom - intTop;
    intHeight = Math.floor(Math.max(lineSz, intHeight * percent / 100 + 0.5));
    intTop = intBottom - intHeight;

    if (useColor) {
      g.fillStyle = `rgb(${batteryColorPicker(percent / 100).join(',')})`;
    }

    g.fillRect(intLeft, intTop, intRight - intLeft, intHeight);
    return canvas;
  };

  return Object.freeze({
    getTaskbarStateFingerprint,
    isAppPinned,
    processesToTaskEntities,
    renderBatteryImage,
    showTaskMenu,
    toggleAppPin,
  });
};


let createThemeManager = (os) => {

  const { buildBevelButton, div, span } = HtmlUtil;

  let activeTheme = null;
  let activeUiElements = null;

  let lastDisplayedTime = null;
  let maybeUpdateClock = (host) => {
    if (!activeTheme) return;
    let now = new Date();
    let is24 = os.Settings.getBool('clock_24_hour');
    let mins = now.getMinutes() + "";
    if (mins.length < 2) mins = "0" + mins;
    let hours = now.getHours();
    let displayTime = (is24 ? hours : ((hours % 12) || 12)) + ":" + mins;
    if (os.Settings.getBool('clock_show_seconds')) {
      displayTime += ":" + Util.ensureNumLen(now.getSeconds(), 2);
    }
    if (!is24) displayTime += hours < 12 ? " AM" : " PM";
    if (displayTime !== lastDisplayedTime) {
      let clockUpdater = activeTheme.taskbar.clockUpdater || defaultClockUpdater;
      clockUpdater(host, displayTime);
      lastDisplayedTime = displayTime;
    }
  };

  let defaultClockUpdater = (host, timeStr) => { host.clear().innerText = timeStr; };

  let defaultTbParams = {
    thickness: 48,
    allowOverflow: false,
    verticalThicknessOverride: 64,
    disallowedDockPositions: [],
    preferredDockPosition: 'SOUTH',
  };
  let getTaskbarParams = () => {
    let getParams = activeTheme.taskbar.getParams;
    if (!getParams) getParams = () => ({});
    let out = { ...defaultTbParams, ...getParams() };

    out.thickness = Util.ensurePositiveInteger(out.thickness);

    out.dock = os.Settings.getString('taskbardock', 'SOUTH');
    out.dock = new Set(['SOUTH', 'NORTH', 'EAST', 'WEST']).has(out.dock) ? out.dock : defaultTbParams.preferredDockPosition;
    if (new Set(defaultTbParams.disallowedDockPositions).has(out.dock)) out.dock = defaultTbParams.preferredDockPosition;

    out.allowOverflow = !!out.allowOverflow;
    out.isHorizontal = out.dock === 'SOUTH' || out.dock === 'NORTH';
    out.isVertical = !out.isHorizontal;
    if (out.isVertical && !Util.isNullish(out.verticalThicknessOverride)) {
      out.thickness = Util.ensurePositiveInteger(out.verticalThicknessOverride);
    }
    out.verticalThicknessOverride = undefined;

    return out;
  };

  let applyTheme = async (id) => {
    let themeInitializer = await staticVirtualJsLoader.loadJavaScript('theme', id);

    let actions = {
      showLauncher: () => showLauncher(os),
    };
    activeTheme = {
      taskbar: {},
      window: {},
      menu: {},
      symbols: {},
      ...themeInitializer(os, actions),
    };

    let symbolColor = (activeTheme.symbols.symbolColor || (() => [0, 0, 0]))();
    let symbolCache = {};
    for (let gen of [defaultSymbolGenerator, activeTheme.symbols.generateSymbols]) {
      if (gen) {
        let newSymbols = gen(os.IconStore.monochromeSymbolFactory, symbolColor) || {};
        symbolCache = { ...symbolCache, ...newSymbols };
      }
    }
    activeTheme.symbols.symbolCache = symbolCache;

    os.Shell.updateUsableDesktopBounds();

    let tbUi = generateTaskbar();
    activeUiElements = {
      taskbar: tbUi,
    };
    cachedMenuStyles = null;

    os.Shell.getWindowHandles().forEach(winData => {
      applyThemedChromeToWindow(winData);
    });

    lastDisplayedTime = '';
    extUpdateClock = () => maybeUpdateClock(activeUiElements.taskbar.clockTextHost);
    extUpdateClock();

    return activeTheme;
  };

  let extUpdateClock = Util.noop;

  let defaultSymbolGenerator = (symbolFactory, color) => {
    let f = fn => symbolFactory(fn, [...color]);
    return {
      minimize: f(gfx => {
        gfx.rect(0.1, 0.65, .8, .2);
      }),
      maximize: f(gfx => {
        let top = 0.15;
        let bottom = 0.85;
        let left = 0.05;
        let right = 0.85;
        let width = right - left;
        let height = bottom - top;
        let thk = 0.2;
        gfx
          .rect(left, top, width, thk)
          .rect(left, top, thk, height)
          .rect(left, bottom - thk, width, thk)
          .rect(right - thk, top, thk, height);
      }),
      download: f(gfx => {
        gfx
          .line(0.5, 0.1, 0.5, 0.5, 0.2)
          .triangle(0.1, 0.5, 0.9, 0.5, 0.5, 0.9);
      }),
      close: f(gfx => {
        gfx
          .line(0.2, 0.2, 0.8, 0.8, 0.2)
          .line(0.2, 0.8, 0.8, 0.2, 0.2);
      }),
    };
  };

  let generateTaskbar = () => {
    let taskbarHost = os.Shell.getTaskbarHost();
    taskbarHost.clear();
    let tbParams = getTaskbarParams();
    let { dock, thickness, allowOverflow } = tbParams;
    let isHorizontal = dock === 'SOUTH' || dock === 'NORTH';
    let showBattery = !os.Settings.getBool('tray_hide_battery');
    tbParams = { ...tbParams, isHorizontal, isVertical: !isHorizontal };
    taskbarHost.set({
      position: 'absolute',
      size: '',
      top: '',
      bottom: '',
      left: '',
      right: '',
      overflow: allowOverflow ? 'visible' : 'hidden',
    });
    let t = {};
    t[dock.toLowerCase() + 'Dock'] = thickness;
    taskbarHost.set(t);

    let abs = { position: 'absolute' };
    let tbUi = {
      bg: div({ fullSize: true }),
      startHost: div(abs),
      itemHost: div(abs),
      clockHost: div(abs),
      clockTextHost: span(),
      batteryHost: span(),
    };
    taskbarHost.set(
      tbUi.bg,
      tbUi.itemHost,
      tbUi.startHost,
      tbUi.clockHost,
      tbUi.clockTextHost,
    );
    tbUi.clockHost.set(
      {
        onClick: () => {
          showSysPane(os);
        }
      },
      tbUi.clockTextHost,
      tbUi.batteryHost);

    let p = Object.freeze({ ...tbParams, showBattery });

    (activeTheme.taskbar.styleBackdrop || defaultStyleTaskbarBackdrop)(tbUi.bg, p);
    (activeTheme.taskbar.styleStartHost || defaultStyleTaskbarStartHost)(tbUi.startHost, p);
    (activeTheme.taskbar.styleClockHost || defaultStyleTaskbarClockHost)(tbUi.clockHost, tbUi.clockTextHost, tbUi.batteryHost, p);
    (activeTheme.taskbar.styleItemsHost || defaultStyleTaskbarItemsHost)(tbUi.itemHost, p);

    tbUi.startHost.addEventListener('click', () => showLauncher(os));

    return tbUi;
  };

  let defaultStyleTaskbarItemsHost = (itemHost, params) => {
    let front = params.thickness + 4;
    let back = 100 + 4;
    let margin = 6;
    itemHost.set(
      params.isHorizontal
        ? { left: front, right: back, top: margin, bottom: margin }
        : { top: front, bottom: back, left: margin, right: margin });
  };

  let defaultStyleTaskbarClockHost = (clockHost, clockTextHost, batteryHost, params) => {

    let isVertical = params.isVertical;
    let isHorizontal = !isVertical;

    let { showBattery } = params;
    let showSeconds = os.Settings.get('clock_show_seconds');
    let show24Hr = os.Settings.get('clock_24_hour');
    let isSuperWide = showSeconds && !show24Hr;

    let wrappedClockText = div(
      isHorizontal
        ? { top: 6 }
        : { top: isSuperWide ? 2 : 4 },
      {
        position: 'absolute',
        right: 4,
        textAlign: (showSeconds && isHorizontal) ? 'left' : 'center',
        left: 4,
        height: 14,
      },
      clockTextHost,
    );
    let wrappedBatteryHost = div(
      { absMargin: 0, textAlign: 'center' },
      isHorizontal
        ? { top: 7 }
        : null,
      batteryHost,
    );

    clockHost.set(
      div(
        {
          fullSize: true,
          border: '1px solid rgba(255, 255, 255, 0.25)',
          borderTopColor: 'rgba(0, 0, 0, .25)',
          borderLeftColor: 'rgba(0, 0, 0, .25)',
          borderRadius: 2,
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          color: '#fff',
          fontSize: isVertical ? 7 : 9,
        },
        div(
          { marginTop: 2 },
          showBattery
            ? isHorizontal
              ? [
                  div({ westDock: 20 }, wrappedBatteryHost),
                  div({ eastStretchDock: 20 }, wrappedClockText),
                ]
              : [
                  div({ northStretchDock: isSuperWide ? 15 : 20 }, wrappedClockText),
                  div({ southDock: isSuperWide ? 15 : 20, textAlign: 'center' }, wrappedBatteryHost),
                ]
            : [
                div({ fullSize: true }, wrappedClockText)
              ]
        )
      )
    );

    let margin = 8;

    if (isVertical) {
      let size = 60;
      clockHost.set({
        bottom: margin,
        left: margin,
        size: [params.thickness - margin * 2, size - margin * 2],
      });
    } else {
      let size = 125;
      clockHost.set({
        right: margin,
        bottom: margin,
        size: [size - margin * 2, params.thickness - margin * 2],
      });
    }

    if (showBattery) {

      batteryHost.set(
        { display: 'inline-block'}
      );

      let updateBattery = props => {
        batteryHost.title = [
          props.percent,
          '% (',
          props.isPluggedIn
            ? props.timeTill === 0
              ? "Charged"
              : (Util.formatHrMin(props.timeTill) + " till charged")
            : (Util.formatHrMin(props.timeTill) + " remaining"),
          ')',
        ].join('');

        let batteryIcon = batteryHost.firstChild;
        if (batteryIcon && `${batteryIcon.tagName}`.toLowerCase() !== 'canvas') batteryIcon = null;
        if (!batteryIcon) {
          batteryIcon = HtmlUtil.canvas({ size: 12 });
          batteryHost.clear().set(batteryIcon);
        }

        os.Shell.Taskbar.renderBatteryImage(batteryIcon, false, true, props.percent);
      };

      os.PowerManager.addWatcher(bat => updateBattery(bat), () => HtmlUtil.inUiTree(batteryHost));
      os.PowerManager.getProperties().then(updateBattery);

    }
  };

  let defaultStyleTaskbarStartHost = (host, params) => {
    let margin = Math.floor(params.thickness / 10);
    let sz = params.thickness - margin * 2
    host.set({
      left: margin,
      top: margin,
      size: sz,
    });

    os.FsRoot.fileReadImage('/system/res/launcher-btn.png').then(file => {
      let { ok, img } = file;
      if (ok) {
        host.set(img.set({ size: ['80%', '80%'], left: '10%', top: '10%', position: 'absolute'}));
      }
    });

  };

  let defaultStyleTaskbarBackdrop = (bg, params) => {
    let s = { backgroundColor: '#444' };
    switch (params.dock) {
      case 'SOUTH': s.borderTop = '1px solid #888'; break;
      case 'NORTH': s.borderBottom = '1px solid #888'; break;
      case 'EAST': s.borderLeft = '1px solid #888'; break;
      case 'WEST': s.borderRight = '1px solid #888'; break;
    }
    bg.set(s);
  };

  let defaultApplyTaskStyle = (host, params, index, name, isFocused, numProcs, icon, iconChanged) => {
    let iconSize = params.thickness - 6 * 2;
    host.title = `${name}`;
    host.set(
      {
        position: 'absolute', size: iconSize,
        borderRadius: 2,
        backgroundColor: isFocused ? 'rgba(255, 255, 255, 0.3)' : '',
      },
      params.isHorizontal
        ? { top: 0, left: index * (iconSize + 4) }
        : { left: 0, top: index * (iconSize + 4) },
    );

    if (iconChanged) {
      host.clear().set(icon.set({ position: 'absolute', size: iconSize - 8, left: 4, top: 4 }));
    }

    // TODO: use numProcs to add dots
  };

  let updateTaskbar = (tbUi, params, entities) => {
    let allAppPaths = new Set(entities.map(e => e.appPath));
    let slotById = {};

    let slots = Array.from(tbUi.itemHost.children);
    slots.forEach(slot => {
      let path = slot.PLX_APP_PATH;
      if (!allAppPaths.has(path)) {
        tbUi.itemHost.removeChild(slot);
      } else {
        slotById[path] = slot;
      }
    });

    for (let i = 0; i < entities.length; i++) {
      let { appPath, isFocused, icon, pids, name, multiIndicator } = entities[i];
      let slot = slotById[appPath];
      if (!slot) {
        slot = div({
          onRightClick: (ev) => {
            os.Shell.Taskbar.showTaskMenu(ev, slot.PLX_APP_PATH, slot.PLX_DEFAULT_PID);
          },
          onClick: () => {
            if (slot.PLX_DEFAULT_PID) {
              os.Shell.giveProcessFocus(slot.PLX_DEFAULT_PID);
            } else {
              os.ExecutionEngine.launchFile(appPath);
            }
          },
        });
        slot.PLX_APP_PATH = appPath;
        tbUi.itemHost.append(slot);
      }
      slot.PLX_DEFAULT_PID = pids.length ? pids[pids.length - 1] : 0;

      let canvasIfChanged = null;
      if (slot.PLX_LAST_CANVAS !== icon) {
        slot.PLX_LAST_CANVAS = icon;
        let canvas = HtmlUtil.canvas();
        canvas.width = 64;
        canvas.height = 64;
        let g = canvas.getContext('2d');
        g.drawImage(icon, 0, 0);
        slot.PLX_ICON_CACHE = canvas;
        canvasIfChanged = canvas;
      }
      let applyTaskStyle = activeTheme.taskbar.applyTaskStyle || defaultApplyTaskStyle;
      applyTaskStyle(slot, params, i, name, isFocused, pids.length, slot.PLX_ICON_CACHE, !!canvasIfChanged, multiIndicator);
    }
  };

  let applyThemedChromeToWindow = (winData) => {
    let { isMaximized } = winData;

    let btns = winData.chromeBtns;
    let handlers = {
      minimize: btns.minimize ? winData.minimizeHandler : null,
      maximize: btns.maximize ? winData.maximizeHandler : null,
      download: btns.download ? winData.downloadHandler : null,
      close: winData.closeHandler,
    };
    let abs = { position: 'absolute' };
    let frame = winData.outerFrame.set(abs);
    let titleIcon = HtmlUtil.canvas({ fullSize: true });
    titleIcon.width = 64;
    titleIcon.height = 64;
    titleIcon.getContext('2d').drawImage(winData.icon, 0, 0);

    let ui = {
      content: winData.contentHost.set(abs),
      menuBar: winData.menuBar ? winData.menuBar.set(abs) : null,
      titleBar: div(abs),
      titleIconHost: div(abs, titleIcon),
      titleTextHost: div(abs),
      titleButtonsHost: div(abs),
      backdrop: div({ fullSize: true }),
    };

    winData.themeDataCache.titleBar = ui.titleTextHost;

    let {
      margin,
      menubar,
      titlebar,
    } = getChromePadding();

    let frameMembers = Array.from(frame.children);
    let hasInputMask = !!frameMembers.filter(e => e.PX_INPUT_MASK).length;

    if (winData.mode === 'FULLSCREEN' || winData.mode === 'MANAGED') {
      HtmlUtil.clearExcept(frame, ui.content);
      if (!frame.firstChild) frame.set(ui.content);
      ui.content.set({ width: '100%', top: 0, bottom: 0 });

      if (hasInputMask) os.Shell.enableInputMask(winData);
      return;
    }

    if (winData.isMaximized) {
      margin = 0;
    }

    let nineGridCenter = frameMembers.filter(e => e.PX_NINE_GRID_C)[0] || null;
    HtmlUtil.clearExcept(frame, nineGridCenter);
    ui.backdrop.set({
      shadow: true, // This is a system setting
    });
    let nineGrid = os.Themes.injectResizeNineGrid(winData, margin, winData.isMaximized);

    HtmlUtil.clearExcept(nineGrid.C, ui.content);
    if (!nineGrid.C.firstChild) nineGrid.C.set(ui.content);
    if (ui.menuBar) nineGrid.C.append(ui.menuBar);
    nineGrid.C.prepend(ui.titleBar);

    frame.prepend(ui.backdrop);
    if (hasInputMask) os.Shell.enableInputMask(winData);

    ui.titleBar.set({ northDock:titlebar, userSelect: 'none' });
    if (ui.menuBar) ui.menuBar.set({ size: ['100%', menubar], top: titlebar });
    ui.content.set({ southStretchDock: titlebar + (ui.menuBar ? menubar : 0) });

    ui.titleBar.set(ui.titleIconHost, ui.titleTextHost, ui.titleButtonsHost);
    ui.titleButtonsHost.addEventListener('pointerdown', e => e.stopPropagation());

    ui.content.set({ backgroundColor: '#fff' });

    let f = activeTheme.window.styleWindowBackdrop || defaultStyleWindowBackdrop;
    f(ui.backdrop, !!ui.menuBar, isMaximized);

    defaultTitleBarLayout(ui.titleIconHost, ui.titleTextHost, ui.titleButtonsHost, isMaximized);
    f = activeTheme.window.applyTitleBarLayout;
    if (f) f(ui.titleIconHost, ui.titleTextHost, ui.titleButtonsHost, isMaximized);

    f = activeTheme.window.buildWindowButtons || defaultBuildWindowButtons;
    f(ui.titleButtonsHost, handlers.minimize, handlers.maximize, handlers.download, handlers.close, isMaximized, activeTheme.symbols.symbolCache);

    if (ui.menuBar) {
      let menuInner = div({ fullSize: true });
      let styles = getContextMenuStyles();
      ui.menuBar.clear().set(menuInner.set(styles.windowMenuBar));
    }

    f = activeTheme.window.styleWindowTitleText || defaultStyleWindowTitleText;
    f(ui.titleTextHost);

    f = activeTheme.window.applyAdditionalWindowStyle;
    if (f) f(ui);

    os.Shell.updateWindowMenu(winData);

    ui.titleBar.addEventListener('pointerdown', e => { e.stopPropagation(); });
    applyTitleBarGrabber(winData, ui.titleBar); // TODO: this should be title bar, but the other elements should not have click-through

    ui.titleTextHost.innerText = winData.getTitle();

    ui.titleIconHost.set()

    // Ensure that the window isn't violating any positioning rules.
    if (winData.isMaximized) {
      winData.setWindowBounds(window.innerWidth, window.innerHeight, 0, 0); // over-sized, but constraints will get applied
    } else {
      winData.setWindowBounds(); // using all defaults will forcce it to re-apply its existing bounds through constraint checking
    }
  };

  let defaultStyleWindowBackdrop = backdrop => {
    backdrop.set(HtmlUtil.createBevelDiv([64, 64, 64]));
  };

  let defaultStyleWindowTitleText = textHost => {
    textHost.set({ color: '#fff', fontSize: 11 });
  };

  let defaultBuildWindowButtons = (host, min, max, dl, cls, isMax, symbols) => {
    let btnStyle = {
      size: [24, '100%'],
      fontSize: 9,
      bold: true,
      marginLeft: 4,
      color: '#000',
      display: 'inline-block',
      textAlign: 'center',
    };
    let gray = [180, 190, 204];
    let iconStyle = { width: 14, height: 14, position: 'relative', top: 2 };
    let btns = [
      min ? buildBevelButton(gray).setAction(min).setInner(symbols.minimize(64, 64).set(iconStyle)) : null,
      max ? buildBevelButton(gray).setAction(max).setInner(symbols.maximize(64, 64).set(iconStyle)) : null,
      dl ? buildBevelButton(gray).setAction(dl).setInner(symbols.download(64, 64).set(iconStyle)) : null,
      close ? buildBevelButton([220, 30, 50]).setAction(cls).setInner(symbols.close(64, 64).set(iconStyle)) : null,
    ].filter(Util.identity);
    btns.forEach(b => b.set(btnStyle));
    host.set(btns);
  };

  let getDefaultChromePadding = () => ({ margin: 6, menubar: 26, titlebar: 24 })
  let getChromePadding = () => (activeTheme.window.getChromePadding || getDefaultChromePadding)();
  let defaultTitleBarLayout = (iconHost, textHost, buttonHost, isMaximized) => {
    let sizes = getChromePadding();
    let margin = isMaximized ? 0 : sizes.margin;
    let invMargin = sizes.margin - margin;
    let halfInvMargin = invMargin >> 1;
    let iconSize = sizes.titlebar - sizes.margin;
    iconHost.set({
      left: halfInvMargin,
      top: halfInvMargin,
      size: iconSize,
    });
    textHost.set({
      left: sizes.titlebar + 2,
      right: 114,
      top: halfInvMargin,
      height: sizes.titlebar - invMargin,
      textOverflow: 'ellipsis',
      overflow: 'hidden',
      whiteSpace: 'nowrap',
    });
    buttonHost.set({
      right: halfInvMargin,
      top: halfInvMargin,
      size: [112, sizes.titlebar - sizes.margin],
      textAlign: 'right',
    });
  };

  let defaultGetWrapperStyle = () => {
    return {
      backgroundColor: '#aaa',
      color: '#000',
      shadow: true,
      padding: 2,
      border: '1px solid #888',
      borderLeftColor: '#ccc',
      borderTopColor: '#fff',
    };
  };

  let defaultGetSeparatorStyle = () => ({ height: 0, borderBottom: '1px solid #888' });

  let defaultGetMenuItemStyle = (isHover, isVertical) => {
    let s = {
      fontSize: 9,
      backgroundColor: isHover ? '#444' : '',
      color: isHover ? '#fff' : '#000',
      padding: 4,
    };
    if (isVertical) {
      s.paddingRight = 20;
    } else {
      s.padding = 2;
    }
    return s;
  };

  let defaultGetWindowMenuBarStyle = (menuBar) => {
    return { padding: 3, backgroundColor: '#aaa', color: '#000', borderBottom: '1px solid #888' };
  };

  let cachedMenuStyles = null;
  let getContextMenuStyles = () => {
    if (!cachedMenuStyles) {
      let wrapper = (activeTheme.menu.getWrapperStyle || defaultGetWrapperStyle)() || defaultGetWrapperStyle();
      let sep = (activeTheme.menu.getSeparatorStyle || defaultGetSeparatorStyle)() || defaultGetSeparatorStyle();
      let windowMenuBar = (activeTheme.menu.getWindowMenuBarStyle || defaultGetWindowMenuBarStyle)() || defaultGetWindowMenuBarStyle();
      let itemGetter = activeTheme.menu.getItemStyle || defaultGetMenuItemStyle;
      let itemVertical = itemGetter(false, true) || defaultGetMenuItemStyle(false, true);
      let itemHorizontal = itemGetter(false, false) || defaultGetMenuItemStyle(false, false);
      let itemVerticalHover = itemGetter(true, true) || defaultGetMenuItemStyle(true, true);
      let itemHorizontalHover = itemGetter(true, false) || defaultGetMenuItemStyle(true, false);
      cachedMenuStyles = { wrapper, sep, windowMenuBar, itemVertical, itemVerticalHover, itemHorizontal, itemHorizontalHover };
    }
    return Util.deepCopy(cachedMenuStyles);
  };

  let applyTitleBarGrabber = (winData, element) => {
    let onDown = () => {
      winData.focus();
      return winData.getActualBounds();
    };
    let onDrag = (_ev, start, dx, dy) => {
      if (winData.isMaximized) return;
      let x = start.x + dx;
      let y = start.y + dy;
      winData.setWindowBounds(null, null, x, y);
      let b = winData.transform.regularBounds;
      b[0] = x;
      b[1] = y;
    };

    HtmlUtil.applyClickDragHandler(element, onDown, onDrag);
  };

  let defaultBuildPanelBackground = () => {
    return div({
      fullSize: true,
      color: '#fff',
      backgroundColor: '#444',
      border: '1px solid #000',
      borderTopColor: '#aaa',
      borderLeftColor: '#888',
      padding: 4,
    });
  };

  let themeMan = {
    buildPanelBackground: () => {
      return (activeTheme.buildPanelBackground || defaultBuildPanelBackground)();
    },

    setActiveTheme: async (id) => {
      activeTheme = await applyTheme(id);
      themeMan.redrawTaskbar();
    },

    getActiveTheme: () => activeTheme,

    getThemeMetadata: async (id) => {
      let themeFn = await staticVirtualJsLoader.loadJavaScript('theme', id);
      let theme = themeFn(os, {});
      let md = theme.getMetadata();
      return Object.freeze({ id: md.id, name: md.name || "Untitled Theme", author: md.author || "Unknown" });
    },

    getChromePadding,

    getAvailableThemes: async () => {
      let themeDir = '/system/themes';
      let fs = os.FsRoot;
      let themeFileNames = (await fs.list(themeDir)).filter(t => t.toLowerCase().endsWith('.theme'));
      let themes = [];
      for (let file of themeFileNames) {
        let theme = await fs.getVirtualJsInfo(themeDir + '/' + file);
        if (theme && theme.isValid) {
          let themeCtor = theme.data;
          themes.push(themeCtor().getMetadata());
        }
      }
      themes.sort((a, b) => a.name.localeCompare(b.name.localeCompare));
      return themes;
    },

    redrawTaskbar: async () => {
      let focusedPid = (os.Shell.getFocusedWindow() || {}).pid;
      let procs = os.ProcessManager.getProcesses(true).map(p => ({
        pid: p.pid,
        appId: p.appId,
        path: p.path,
        isFocused: p.pid === focusedPid,
        icon: os.ApplicationRegistry.getIcon(p.appId),
      }));

      let entities = await os.Shell.Taskbar.processesToTaskEntities(procs);
      updateTaskbar(activeUiElements.taskbar, getTaskbarParams(), entities);
    },

    applyThemedChromeToWindow,

    getContextMenuStyles,

    getTaskbarParams,

    injectResizeNineGrid: (winData, margin, isMaximized) => {

      let frame = winData.outerFrame;
      let C = frame.lastChild || null;
      if (C && !C.PX_NINE_GRID_C) C = null;

      if (isMaximized || !winData.resizeEnabled) {
        let m = isMaximized ? 0 : margin;
        let props = { position: 'absolute', left: m, top: m, right: m, bottom: m };
        if (!C) {
          C = div(props);
          frame.set(C);
        } else {
          C.set(props);
        }
        HtmlUtil.clearExcept(frame, C);
        return { C };
      }

      let output = HtmlUtil.injectNineGrid(frame, margin, margin, margin, margin, C);
      let cursors = {
        NW: 'nwse-resize',
        SE: 'nwse-resize',
        NE: 'nesw-resize',
        SW: 'nesw-resize',
        N: 'ns-resize',
        S: 'ns-resize',
        E: 'ew-resize',
        W: 'ew-resize',
      };
      let handleDown = (dir) => {
        winData.focus();
        let { x, y, width, height } = winData.getActualBounds();
        return {
          startWidth: width,
          startHeight: height,
          startLeft: x,
          startTop: y,
          isLeftAdjust: dir.includes('W'),
          isRightAdjust: dir.includes('E'),
          isTopAdjust: dir.includes('N'),
          isBottomAdjust: dir.includes('S'),
        };
      };
      let handleMove = (_ev, session, dx, dy) => {
        let newBounds = {};
        if (session.isRightAdjust) {
          newBounds.width = session.startWidth + dx;
        }
        if (session.isLeftAdjust) {
          newBounds.width = session.startWidth - dx;
          newBounds.x = session.startLeft + dx;
        }
        if (session.isBottomAdjust) {
          newBounds.height = session.startHeight + dy;
        }
        if (session.isTopAdjust) {
          newBounds.height = session.startHeight - dy;
          newBounds.y = session.startTop + dy;
        }
        winData.setWindowBounds(newBounds.width, newBounds.height, newBounds.x, newBounds.y);
      };
      Object.keys(cursors).forEach(k => {
        let e = output[k];
        HtmlUtil.applyClickDragHandler(e, () => handleDown(k), handleMove);
        output[k].set({ cursor: cursors[k] });
      });

      return output;
    },
    updateClock: () => extUpdateClock(),
  };

  return Object.freeze(themeMan);
};


let createPipe = () => {
  let listener = Util.noop;
  let linesHead = null;
  let linesTail = null;
  let queuedPartial = '';
  let write = async (text) => {
    let newLines = text.split('\n');
    newLines[0] = queuedPartial + newLines[0];
    for (let i = 0; i < newLines.length - 1; i++) {
      if (!linesHead) {
        linesHead = { text: newLines[i], next: null };
        linesTail = linesHead;
      } else {
        linesTail.next = { text: newLines[i], next: null };
        linesTail = linesTail.next;
      }
    }
    queuedPartial = newLines[newLines.length - 1];

    while (linesHead) {
      let line = linesHead.text;
      linesHead = linesHead.next;
      if (!linesHead) linesTail = null;
      await Promise.resolve(listener(line));
    }
  };
  let p = Object.freeze({
    write,
    writeln: async t => write(t + '\n'),
    setListener: (onData) => { listener = onData; return p; },
  });
  return p;
};

const terminalSession = async (os, initialCwd, envVars) => {

  let resolveString = (str) => {
    str = str.substring(1, str.length - 1);
    let sb = '';
    for (let i = 0; i < str.length; i++) {
      if (str[i] === '\\') {
        sb += str[++i];
      } else {
        sb += str[i];
      }
    }
    return sb;
  };

  let tokenize = (cmd) => {
    let tokens = [];
    cmd = Util.replace(cmd, '\r\n', '\n');
    cmd = Util.replace(cmd, '\r', '\n');

    let mode = 'NORMAL';
    let whitespace = new Set(' \t\r\n'.split(''));
    let special = new Set('<>|`"()&'.split(''));
    let quoted = new Set(' \r\n|&;<>()$`\\"\''.split(''));
    let twoCharCtrl = new Set('<< >> || && <& <> >& >|'.split(' '));
    let tokenStart = 0;
    for (let i = 0; i <= cmd.length; i++) {
      let c = i === cmd.length ? ' ' : cmd[i]; // invisible space at the end
      let c2 = c + (cmd[i + 1] || '');
      switch (mode) {
        case 'NORMAL':
          if (whitespace.has(c)) {
            // do nothing
          } else if (c === '\\' && quoted.has(cmd[i + 1])) {
            mode = 'WORD';
            tokenStart = i--;
          } else if (special.has(c)) {
            if (c === '"') {
              mode = 'STRING';
              tokenStart = i;
            } else if (twoCharCtrl.has(c2)) {
              tokens.push({ type: 'CTRL', value: c2 });
              i++;
            } else {
              tokens.push({ type: 'CTRL', value: c });
            }
          } else {
            mode = 'WORD';
            tokenStart = i;
            --i;
          }
          break;

        case 'STRING':
          if (c === '"') {
            let str = cmd.substring(tokenStart, i + 1);
            tokens.push({ type: 'WORD', value: resolveString(str) });
            mode = 'NORMAL';
          } else if (c === '\\') {
            i++;
          } else {
            // do nothing
          }
          break;

        case 'WORD':
          if (c === '\\') {
            i++;
          } else if (whitespace.has(c) || special.has(c) || c2 === '\\\n') {
            tokens.push({ type: 'WORD', value: cmd.substring(tokenStart, i) });
            --i;
            mode = 'NORMAL';
          }
          break;
      }
    }

    return (() => {
      let i = 0;
      let len = tokens.length;

      return {
        hasMore: () => i < len,
        peek: () => i < len ? tokens[i] : null,
        peekValue: () => i < len ? tokens[i].value : '',
        peekType: () => i < len ? tokens[i].type : '',
        peekCtrl: () => i < len && tokens[i].type === 'CTRL' ? tokens[i].value : '',
        isNext: v => i < len && tokens[i].value === v,
        isNextCtrl: v => i < len && tokens[i].value === v && tokens[i].type === 'CTRL',
        pop: () => i < len ? tokens[i++] : null,
      };
    })();
  };

  // This does not fully implement the proper standard.
  // However, here is a link to the grammar for reference:
  // https://pubs.opengroup.org/onlinepubs/9699919799/utilities/V3_chap02.html
  let terminalParse = (line) => {
    let tokens = tokenize(line);

    let incomplete = false;

    let parse = () => {
      let root = parseItemChain(tokens);
      if (tokens.isNext('&&') || tokens.isNext('||')) {
        let expressions = [root];
        let ops = [];
        while (tokens.isNext('&&') || tokens.isNext('||')) {
          ops.push(tokens.pop().value);
          expressions.push(parseItemChain(tokens));
        }
        return { type: 'BOOL_JOIN', expressions, ops };
      }
      return root;
    };

    let redirOps = new Set('| < > << <> <& >& >>'.split(' '));
    let parseItemChain = () => {
      let root = parseItem();
      while (redirOps.has(tokens.peekCtrl())) {
        let left = root;
        let op = tokens.pop();
        let right = parseItem();
        root = { type: 'OP', left, op, right };
      }
      return root;
    };

    let parseItem = () => {
      let next = tokens.peek();
      if (!next) return { type: 'EOL' };
      if (tokens.isNextCtrl('(')) {
        tokens.pop();
        let root = parse();
        if (tokens.isNextCtrl(')')) {
          tokens.pop();
        } else {
          incomplete = true;
        }
        return root;
      }
      let entities = [];
      let nextType = tokens.peekType();
      while (nextType === 'WORD' || nextType === 'STRING') {
        entities.push(tokens.pop().value);
        nextType = tokens.peekType();
      }
      return { type: 'ENTITY', entities };
    };

    return { ...parse(tokenize(line)), incomplete };
  };

  let cwd = initialCwd;
  let fs = os.FileSystem(initialCwd);
  const STDIN = createPipe();
  const STDOUT = createPipe();
  const STDERR = createPipe();
  const VARS = { PATH: '', ...envVars };
  const PATH = VARS.PATH.split(';').map(v => v.trim()).filter(Util.identity);

  let getAbs = (name) => fs.getAbsolutePath(name);

  let cd = async (path) => {
    let newPath = getAbs(path);
    if (await fs.dirExists(newPath)) {
      cwd = newPath;
      fs = os.FileSystem(cwd);
      return true;
    }

    await STDERR.writeln(`cd: can't cd to ${path}: No such directory`);
    return false;
  };

  await cd(initialCwd);

  let interpretCommand = async (cmd, killSwitch, pipes, session) => {
    switch (cmd.type) {
      case 'ENTITY':
        let args = cmd.entities;

        // cd is a little different because it affects the current working directory
        // and cannot be implemented as an external program.
        if (args[0] === 'cd') {
          if (!await cd(args[1] || '')) {
            killSwitch.stop = true;
          }
          return;
        }

        for (let dir of [cwd, ...PATH]) {
          let execPath = FsPathUtil.canonicalize(dir, args[0]);
          let execInfo = await fs.getExecInfo(execPath);
          if (execInfo.isValid) {
            let proc = os.ExecutionEngine.launchFileNonBlocking(
              execPath,
              args.slice(1), // TODO: this is wrong, the executable should be included.
              cwd,
              { ...pipes });

            await proc.procStartedPromise;

            let pid = await proc.getPid();
            session.registerProcStart(pid);
            proc.procEndedPromise.then(() => session.registerProcEnd(pid));
            return;
          }
        }

        await pipes.stderr.writeln('command not found: ' + args[0]);
        return;

      case 'OP':
        switch (cmd.op) {
          case '|':
            let joinPipe = createPipe();
            await Promise.all([
              interpretCommand(cmd.left, killSwitch, { ...pipes, stdout: joinPipe }, session),
              interpretCommand(cmd.right, killSwitch, { ...pipes, stdin: joinPipe }, session),
            ]);
            break;

          default:
            throw new Error("Not implemented: " + cmd.op);
        }
        return;

      case 'BOOL_JOIN':
        break;

      default:
        throw new Error(cmd);
    }
  };

  let session = (() => {
    let procs = {};

    let s = {
      registerProcStart: pid => {
        let res;
        procs[pid] = { pid, res: null, pr: new Promise(r => { res = r; }) };
        procs[pid].res = res;
      },
      registerProcEnd: pid => {
        let proc = procs[pid];
        if (proc) {
          proc.res(true);
          delete procs[pid];
        }
      },
      awaitProcs: async () => {
        await Promise.all(Object.values(procs).map(p => p.pr));
      },
      isIdle: () => !Object.keys(procs).length,
      killAll: async () => {
        Object.values(procs).forEach(proc => {
          os.ProcessManager.killProcess(proc.pid);
          proc.res(true);
        });
        await s.awaitProcs();
      },
    };
    return Object.freeze(s);

  })();

  STDIN.setListener(async line => {
    let args = line.split(' ').map(v => v.trim()).filter(Util.identity);
    if (!args.length) return;

    let command = terminalParse(line);
    if (command.incomplete) {
      STDERR.writeln('sh: syntax error');
      return;
    }

    // This await ONLY blocks on interpreting the meaning of the command and launching the
    // proper processes/actions, it does NOT block on waiting for them those processes to complete.
    // Otherwise it would prevent further STDIN input to reach the process itself.
    await interpretCommand(
      command,
      { stop: false },
      { stdin: STDIN, stdout: STDOUT, stderr: STDERR },
      session);
  });
  return Object.freeze({
    in: STDIN.write,
    out: STDOUT.setListener,
    err: STDERR.setListener,
    run: async cmd => {
      await STDIN.writeln(cmd);
      await session.awaitProcs();
    },
    getCwd: () => cwd,
    awaitProcs: async () => {
      await session.awaitProcs();
    },
    isIdle: () => session.isIdle(),
    killAllProcs: async () => {
      await session.killAll();
    },
  });
};


let PlexiOS = { Util, HtmlUtil, registerJavaScript };
(() => {
  let regProps = 'getItems renderItem getId applyState onSelectionChanged selectedId'.split(' ');
  PlexiOS.HtmlUtil.registerComponent('ItemList', (...args) => {
    let { HtmlUtil, Util } = PlexiOS;
    let { div, span } = HtmlUtil;
    let { htmlArgs, props } = Util.argInterceptor(args, regProps);
    let { getItems, renderItem, getId, onSelectionChanged, applyState } = props;

    if (typeof getItems !== 'function') getItems = () => [];
    if (typeof getId !== 'function') getId = item => `${item}`;
    if (typeof renderItem !== 'function') renderItem = getId;

    let defaultApplyState = (e, states) => {
      if (states['SELECTED']) {
        e.set({ backgroundColor: '#008', color: '#fff' });
      } else if (states['HOVER']) {
        e.set({ backgroundColor: 'rgba(128, 128, 128, 0.2)', color: '' });
      } else {
        e.set({ backgroundColor: '', color: '' });
      }
    };
    if (typeof applyState !== 'function') applyState = defaultApplyState;

    let outer = div({
      overflowY: 'auto',
      overflowX: 'hidden',
      position: 'relative',
    }, htmlArgs);

    let ids = [];
    let idLookup = {};
    let selectedId = props.selectedId === undefined ? null : props.selectedId;
    let lastSelectionFireId = selectedId;
    outer.refreshItems = async (forceRender) => {
      let items = [...(await Promise.resolve(getItems()))];
      let newIds = [];
      let newIdLookup = {};

      if (forceRender) {
        outer.clear();
        idLookup = {};
      }

      let maybeFireSelectionChanged = (id) => {
        if (onSelectionChanged && id !== lastSelectionFireId) {
          lastSelectionFireId = id;
          onSelectionChanged(id);
        }
      };

      items.forEach(item => {
        let id = '' + getId(item);
        if (newIdLookup[id]) return; // skip duplicates
        newIds.push(id);
        // recycle old ID if possible
        let e = idLookup[id];
        if (!e) {
          let el = div({ width: '100%', cursor: 'pointer' }, renderItem(item));
          let states = {};
          el.PX_REFRESH_STATES = () => {
            let isSelected = selectedId === el.PX_ITEM_LIST_ID;
            applyState(el, { ...states, SELECTED: isSelected }, el.PX_ITEM_LIST_ID, defaultApplyState);
            if (isSelected) maybeFireSelectionChanged(selectedId);
          };
          el.PX_ITEM_LIST_ID = id;
          el.addEventListener('mouseenter', () => {
            states['HOVER'] = true;
            el.PX_REFRESH_STATES();
          });
          el.addEventListener('mouseleave', () => {
            states['HOVER'] = false;
            el.PX_REFRESH_STATES();
          });
          el.addEventListener('mousedown', () => {
            let newId = el.PX_ITEM_LIST_ID;
            outer.setSelectedId(newId);
          });
          e = el;
          if (forceRender) e.PX_REFRESH_STATES();
        }
        newIdLookup[id] = e;
      });
      let oldIds = ids;
      ids = newIds;
      let oldIdLookup = idLookup;
      idLookup = newIdLookup;

      if (!idLookup[selectedId]) {
        selectedId = null;
        maybeFireSelectionChanged(null);
      }

      if (!ids.length) {
        outer.clear();
        return;
      }

      let removeThese = oldIds.filter(id => !idLookup[id]).map(id => oldIdLookup[id]).filter(Util.identity);
      removeThese.forEach(e => outer.removeChild(e));
      if (!ids.length) {
        return;
      }

      if (!outer.children.length || ids[0] !== outer.firstChild.PX_ITEM_LIST_ID) {
        outer.prepend(idLookup[ids[0]]);
      }
      let lastId = ids[ids.length - 1];
      if (ids[ids.length - 1] !== outer.lastChild.PX_ITEM_LIST_ID) {
        outer.append(idLookup[lastId]);
      }

      for (let i = 1; i < ids.length; i++) {
        let expectedId = ids[i];
        let actualId = outer.children[i].PX_ITEM_LIST_ID;
        if (expectedId !== actualId) {
          outer.insertBefore(idLookup[expectedId], outer.children[i]);
        }
      }
    };

    outer.setSelectedId = id => {
      let el = idLookup[id];
      if (!el) return;
      let oldSelectedId = selectedId;
      selectedId = id;
      let oldSelected = idLookup[oldSelectedId];
      if (oldSelected) oldSelected.PX_REFRESH_STATES();
      el.PX_REFRESH_STATES();
    };

    outer.getSelectedId = () => selectedId;

    outer.refreshItems().then(() => {
      outer.setSelectedId(selectedId);
    });

    return outer;
  });
})();

(async () => {
  let regProps = 'root renderItem getChildren getId toggleExpand hasExpand autoExpandRoot hasChildren onSelectionChanged'.split(' ');
  PlexiOS.HtmlUtil.registerComponent('TreeList', (...args) => {

    let { HtmlUtil, Util } = PlexiOS;
    let { div, span } = HtmlUtil;
    let RIGHT_ARROW = () => span({ html: '&#9654;' });
    let DOWN_ARROW = () => span({ html: '&#9660;' });

    let { ItemList } = HtmlUtil.Components;
    let { htmlArgs, props } = Util.argInterceptor(args, regProps);
    let asFunc = Util.asFunction;
    let { root, renderItem, getChildren, hasChildren, getId, autoExpandRoot, onSelectionChanged } = props;
    getChildren = asFunc(getChildren) || (o => (o.children || null));
    hasChildren = asFunc(hasChildren) || (o => getChildren(o) !== null);
    getId = asFunc(getId) || Util.fail('getId');
    renderItem = asFunc(renderItem) || getId;
    autoExpandRoot = !!autoExpandRoot;

    let idIsExpanded = {};
    if (root && autoExpandRoot) {
      idIsExpanded[getId(root)] = true;
    }
    let idDepth = {};
    let nodeById = {};

    let buildIdList = async (node, idsOut, depth) => {
      let id = getId(node);
      nodeById[id] = node;
      idsOut.push(id);
      idDepth[id] = depth;
      if (idIsExpanded[id] && hasChildren(node)) {
        for (let child of await Promise.resolve(getChildren(node))) {
          await buildIdList(child, idsOut, depth + 1);
        }
      }
      return idsOut;
    };

    let toggleExpansion = async id => {
      idIsExpanded[id] = !idIsExpanded[id];
      await outer.refreshItems();
    };

    let renderWrapper = (node, depth, hasExpander, getExpandState, toggleExpandState) => {
      let e = renderItem(node, depth === 0);
      let expander = null;

      if (hasExpander) {
        expander = span({ marginRight: '5px', opacity: 0.5, fontSize: '0.7rem' }, getExpandState() ? DOWN_ARROW() : RIGHT_ARROW());
        expander.addEventListener('click', (ev) => {
          toggleExpandState();
          expander.clear().set(getExpandState() ? DOWN_ARROW() : RIGHT_ARROW());
          ev.preventDefault();
        });
      }
      let wrapper = div({
        whiteSpace: 'nowrap',
        paddingLeft: (3 + depth * 10) + 'px',
      }, expander, e);
      return wrapper;
    };

    let outer = ItemList(
      {
        onSelectionChanged,
        getItems: async () => {
          if (!root) return [];
          let ids = await buildIdList(root, [], 0);
          return ids.map(id => nodeById[id]);
        },
        renderItem: (node) => {
          let id = getId(node);
          return renderWrapper(
            node,
            idDepth[id] || 0,
            hasChildren(node),
            () => idIsExpanded[id],
            () => toggleExpansion(id),
          );
        },
        getId,
      },
      htmlArgs,
    );

    outer.setRoot = async val => {
      root = val;
      await outer.refreshItems();
    };

    outer.ensureIdExpanded = async (id) => {
      if (!idIsExpanded[id]) {
        await toggleExpansion(id);
      }
    };

    if (root) outer.refreshItems();

    return outer;
  });
})();

(() => {
  let regProps = 'os rootDir rootNameOverride foldersOnly onSelectionChanged'.split(' ');
  PlexiOS.HtmlUtil.registerComponent('FileList', (...args) => {

    let { HtmlUtil, Util } = PlexiOS;
    let { div, span } = HtmlUtil;
    let { TreeList } = HtmlUtil.Components;
    let { htmlArgs, props } = Util.argInterceptor(args, regProps);
    let { foldersOnly, os, rootDir, noIcons, onSelectionChanged, rootNameOverride } = props;
    if (!rootDir || !os) throw new Error();

    let fs = os.FileSystem(rootDir);
    let createFileNode = async (relPath) => {
      return {
        isDir: await fs.dirExists(relPath),
        path: relPath,
        name: relPath.split('/').pop(),
        isValid: await fs.pathExists(relPath),
      };
    };

    let outer = TreeList({
      onSelectionChanged,
      root: null,
      renderItem: (item, isRoot) => {
        let icon = null;
        if (!noIcons) {
          if (item.isDir) {
            img = os.IconStore.getIconByPurpose(isRoot ? 'FOLDER_CLOSED' : 'FOLDER_CLOSED');
          } else {
            // TODO: use getIconByPath, but that will require this to be async or moving this around so that it's pre-cached.
            img = os.IconStore.getIconByPurpose('FILE');
          }
          icon = span(img.set({ size: 16, margin: 2, verticalAlign: 'middle', }));
        }
        let name = isRoot ? (rootNameOverride || '/') : item.name;
        let out = div(
          { display: 'inline-block', italic: true, whiteSpace: 'nowrap' },
          noIcons ? null : icon,
          name);
        out.addEventListener('pointerup', ev => {
          if (ev.button === 2) {
            let options = { pid: os.Shell.getPidFromElement(out) };
            HtmlUtil.Components.FileContextMenu(os, item.path, false, options).showAtPointerEvent(ev);
            ev.stopPropagation();
          }
        });
        return out;
      },
      getChildren: async (item) => {
        let names = await fs.list(item.path);
        if (!names.ok) return [];
        let fullPaths = names.items.map(f => fs.getAbsolutePath(item.path + '/' + f.name));
        if (foldersOnly) {
          let fullPathCheck = await Promise.all(fullPaths.map(async f => {
            if (!await fs.dirExists(f)) return null;
            return f;
           }));
          fullPaths = fullPathCheck.filter(Util.identity);
        }
        return Promise.all(fullPaths.map(path => createFileNode(path)));
      },
      hasChildren: (item) => item.isDir,
      getId: (item) => item.path,
      autoExpandRoot: false,
    }, htmlArgs);

    createFileNode('.').then(n => outer.setRoot(n));

    outer.ensurePathExpanded = async (path) => {
      let parts = path.split('/').slice(1);
      let pathBuilder = '';
      outer.ensureIdExpanded('.');
      for (let i = 0; i < parts.length; i++) {
        pathBuilder += '/' + parts[i];
        await outer.ensureIdExpanded(pathBuilder);
      }
    };

    outer.setSelectedPath = (path) => {
      if (path === '' || path === '/') {
        outer.setSelectedId('.');
      } else {
        outer.setSelectedId(path);
      }
    };

    return outer;
  });
})();

(() => {
  const TILE_DEFAULT_WIDTH = 64;
  const TILE_DEFAULT_HEIGHT = 80;
  const TILE_DEFAULT_MARGIN = 8;

  const TILE_X_SPACING = TILE_DEFAULT_WIDTH + TILE_DEFAULT_MARGIN;
  const TILE_Y_SPACING = TILE_DEFAULT_HEIGHT + TILE_DEFAULT_MARGIN;

  let regProps = [
    'os', 'getIcons', 'getDir',
    'bgTransparent', 'highContrastText',
    'fileContextMenuExtBuilder',
    'onSelectionChanged', 'onDoubleClick',
    'onOpenDir', 'onOpenFile',
    'onBackspace',
    'defaultLayoutMode',
    'onFileDrop',
  ];
  PlexiOS.HtmlUtil.registerComponent('IconBrowser', (...args) => {
    let { HtmlUtil, Util } = PlexiOS;
    let { div, span } = HtmlUtil;
    let { htmlArgs, props } = Util.argInterceptor(args, regProps);
    let {
      os, getDir, getIcons,
      bgTransparent, highContrastText,
      onDoubleClick, onSelectionChanged,
      onOpenDir, onOpenFile, onFileDrop,
      onBackspace, defaultLayoutMode,
      fileContextMenuExtBuilder,
    } = props;
    if (!os) throw new Error();
    let fs = os.FsRoot;
    let isRealDir = !getIcons && getDir;
    if (isRealDir) {
      getIcons = async () => {
        let d = fs.getAbsolutePath(await Promise.resolve(getDir()));
        let files = await fs.list(d);
        if (!files.ok) return null;
        let paths = files.items.map(f => (d === '/' ? '' : d) + '/' + f.name);
        // directories should go first.
        let sortObjs = await Promise.all(paths.map(async p => {
          return { path: p, sortKey: ((await fs.dirExists(p)) ? '0:' : '1:') + p };
        }));
        sortObjs.sort((a, b) => a.sortKey.localeCompare(b.sortKey));
        return sortObjs.map(o => o.path);
      }
    }
    getIcons = getIcons || (() => []);

    let getPid = () => os.Shell.getPidFromElement(outer);

    let modes = new Set(['TILE', 'ARRANGE', 'DETAILS', 'THUMBNAILS']);
    let layoutMode = `${defaultLayoutMode}`.toUpperCase();
    if (!modes.has(layoutMode)) layoutMode = 'TILE';

    let dictOfDictShouldResetMutualProps = (dictOfDict) => {
      // each style should also reset other properties from the other styles.
      let reset = {};
      Object.values(dictOfDict).forEach(d => {
        Object.keys(d).forEach(k => { reset[k] = ''; });
      });
      Object.keys(dictOfDict).forEach(k => {
        dictOfDict[k] = { ...reset, ...dictOfDict[k] };
      });
      return dictOfDict;
    };

    let iconStyles = {
      TILE: {
        display: 'inline-block',
        size: [TILE_DEFAULT_WIDTH, TILE_DEFAULT_HEIGHT],
        margin: TILE_DEFAULT_MARGIN,
        textAlign: 'center',
        fontSize: 9,
        userSelect: 'none',
        verticalAlign: 'top',
        borderRadius: 2,
        position: 'relative',
      },
      DETAILS: {
        display: 'block',
        userSelect: 'none',
        fontSize: 8,
        verticalAlign: 'middle',
      },
      THUMBNAILS: null,
    };
    iconStyles.ARRANGE = { ...iconStyles.TILE, display: 'block', position: 'absolute', left: 0, top: 0 };
    iconStyles.THUMBNAILS = { ...iconStyles.TILE, size: 100 };
    dictOfDictShouldResetMutualProps(iconStyles);

    const IMAGE_FILES = new Set(['jpg', 'jpeg', 'png', 'gif', 'bmp']);

    let applyIconLayoutStyle = (icon) => {
      icon.set(iconStyles[layoutMode]);
      let isDetails = layoutMode === 'DETAILS';
      let isThumbs = layoutMode === 'THUMBNAILS';
      let ui = icon._PX_UI;
      ui.icon.set({
        textAlign: isDetails ? '' : 'center',
        display: 'inline-block',
        size: isDetails ? 16 : 32,
      });
      icon.setPreviewMode(isThumbs);
      ui.label.set({
        display: isDetails ? 'inline-block' : 'block',
        position: isDetails ? 'relative' : '',
        top: isDetails ? -2 : '',
        width: isDetails ? 200 : '',
        marginLeft: isDetails ? 5 : 0,
      });
    };

    let inner = div();
    let blueBoxLayer = div({ fullSize: true });
    let outer = div(
      htmlArgs,
      {
        overflowX: 'hidden',
        overflowY: 'auto',
        position: 'set',
        textAlign: 'left',
      },
      bgTransparent ? null : { backgroundColor: '#fff' },
      highContrastText ? { color: '#fff', textShadow: '0px 0px 5px #000' } : null,
      blueBoxLayer,
      inner
    );

    let iconIdAlloc = 1;
    let selection = {
      cursor: 0,
      icons: new Set(),
      fp: '',
      multiMode: false,
    };

    let refreshIconVisualStyle = () => {
      let selectedIcons = [];
      Array.from(inner.children).forEach(e => {
        let isSelected = selection.icons.has(e._PX_ICON_ID);
        let isCursor = e._PX_ICON_ID === selection.cursor;
        if (isSelected) selectedIcons.push(e._PX_ICON);
        e.set(
          isSelected
            ? { backgroundColor: '#008', color: '#fff' }
            : { backgroundColor: '', color: '' },
          isCursor
            ? { border: '1px dashed rgba(0, 0, 0, 0.5)', padding: 2 }
            : { border: 'none', padding: 3 }
        );
      });
      let iconIdList = [...selection.icons];
      iconIdList.sort((a, b) => a - b);
      let newFp = iconIdList.join(',');
      if (newFp !== selection.fp) {
        selection.fp = newFp;
        if (selectedIcons.length && onSelectionChanged) {
          onSelectionChanged(selectedIcons);
        }
      }
    };

    let setPosition = async (curDir, file, x, y) => {
      let coordFile = await getCoordFilePath(curDir, true);
      let data = await fs.fileReadJson(coordFile);
      let obj = (data.data || {});
      obj[file] = [x, y];
      await fs.fileWriteText(coordFile, JSON.stringify(obj));
    };

    let getCoordFilePath = async (dir, createIfNotExists) => {
      let dataDir = '/appdata/io.plexi.tools.files';
      let manifestPath = dataDir + '/manifest.txt';
      await fs.mkdirs(dataDir);
      let manifest = await fs.fileReadText(manifestPath);
      let lines = (manifest.ok ? manifest.text.split('\n') : []).filter(Util.identity);
      for (let line of lines) {
        let parts = line.split('|');
        if (parts[0] === dir) {
          return dataDir + '/' + parts[1].trim() + '.txt';
        }
      }
      if (createIfNotExists) {
        let id = Util.generateId(12) + '';
        path = dataDir + '/' + id + '.txt';
        await fs.fileWriteText(path, '{}');
        await fs.fileWriteText(manifestPath, [...lines, dir + '|' + id].join('\n').trim());
        return path;
      }
      return null;
    };

    let getArrangePosition = async (curDir, files, height) => {
      let positions = {};

      let coordFile = await getCoordFilePath(curDir);
      if (coordFile) {
        let coords = await fs.fileReadJson(coordFile);
        if (coords.ok) {
          Object.keys(coords.data).forEach(name => {
            let nums = Util.ensureArray(coords.data[name]).map(n => Math.max(0, Util.ensureNumber(n)));
            let [x, y] = [...nums, 0, 0].slice(0, 2);
            positions[name] = { name, x, y };
          });
        }
      }

      let takenTiles = {};

      Object.values(positions).forEach(pos => {
        let left = Math.floor(pos.x);
        let right = pos.x === left ? left : (left + 1);
        let top = Math.floor(pos.y);
        let bottom = pos.y === top ? top : (top + 1);
        for (let y = top; y <= bottom; y++) {
          for (let x = left; x <= right; x++) {
            takenTiles[`${x},${y}`] = true;
          }
        }
      });
      let allocFiles = files.filter(f => !positions[f]).reverse();
      for (let x = 0; allocFiles.length; x++) {
        for (let y = 0; allocFiles.length && y < height; y++) {
          if (!takenTiles[`${x},${y}`]) {
            positions[allocFiles.pop()] = { x, y };
          }
        }
      }
      return positions;
    };

    let buildIcon = async (icon) => {
      if (typeof icon === 'string') {
        let fullPath = icon;
        let name = fullPath.split('/').pop();
        icon = {
          img: await os.IconStore.getIconByPath(fs, fullPath),
          label: name,
          fullPath,
        };
      }

      let iconHost = div({ size: 32 }, icon.img.set({ size: '100%' }));
      let label = div(icon.label);
      let wrapper = div(
        iconHost,
        label,
      );

      let setIcon = (canvas) => {
        iconHost.clear().set(Util.copyImage(canvas).set({ size: '100%' }));
      };
      setIcon(icon.img);

      wrapper._PX_ICON_ID = iconIdAlloc++;
      wrapper._PX_ICON = icon;
      wrapper._PX_UI = { icon: iconHost, label };

      let openItem = async () => {
        let fullPath = icon.fullPath;
        if (fullPath) {
          let stopper = Util.createEventStopper();
          let ev = Object.freeze({ ...stopper.buildEvent(), fullPath });
          if (await fs.dirExists(fullPath)) {
            if (onOpenDir) await Promise.resolve(onOpenDir(ev));
          } else {
            if (onOpenFile) await Promise.resolve(onOpenFile(ev));
          }

          if (!stopper.isStopped()) {
            os.FileActions.launchFile(fullPath, os.FsRoot.getParent(fullPath));
            return true;
          }
          return false;
        }
      };

      HtmlUtil.applyDoubleClickHandler(wrapper, () => {
        selection.cursor = wrapper._PX_ICON_ID;
        if (onDoubleClick) onDoubleClick(icon);
        openItem();
      });
      wrapper.addEventListener('pointerdown', e => {
        os.Shell.giveKeyboardFocusToElement(outer);
        let id = wrapper._PX_ICON_ID;
        let inSelection = selection.icons.has(id);
        e.stopPropagation();
        if (e.button === 2 && inSelection) return;

        if (e.ctrlKey) {
          if (inSelection) {
            selection.icons.delete(id);
          } else {
            selection.icons.add(id);
          }
        } else {
          selection.icons = new Set([id]);
        }
        selection.cursor = id;
        refreshIconVisualStyle();
      });
      wrapper.addEventListener('pointerup', e => {
        e.stopPropagation();
      });

      wrapper.set({
        onRightClick: ev1 => {
          let options = {
            openOverride: async (ev2) => {
              ev2.preventDefault();
              await openItem();
            },
            refreshCb: populate,
            pid: getPid(),
            extendedOptionsBuilder: fileContextMenuExtBuilder,
          };
          let paths = getIconPaths(selection.icons);
          HtmlUtil.Components.FileContextMenu(os, paths, false, options).showAtPointerEvent(ev1);
        },
      });

      HtmlUtil.applyClickDragHandler(
        wrapper,
        async (ev) => {
          let file = { path: icon.fullPath, name: icon.label, icon: await os.IconStore.getIconByPath(os.FsRoot, icon.fullPath) };
          os.Shell.FileDrag.start(ev, [file]);
        },
        (ev) => os.Shell.FileDrag.move(ev),
        (ev) => os.Shell.FileDrag.release(ev),
        true);

      wrapper.openFile = () => openItem();

      let isPreview = false;
      wrapper.setPreviewMode = async (enabled) => {
        if (isPreview === enabled) return;
        isPreview = enabled;
        let img = null;

        if (enabled && icon.fullPath) {
          let path = icon.fullPath;
          let ext = path.split('.').pop().toLowerCase();
          if (IMAGE_FILES.has(ext)) {
            let imgData = await fs.fileReadImage(path);
            if (imgData.ok) {
              setIcon(imgData.img);
              return;
            }
          } else if (ext === 'scr') {
            let scrInfo = await fs.getVirtualJsInfo(path);
            if (scrInfo.isValid && scrInfo.category === 'screensaver') {
              let { init, render } = await PlexiOS.loadJavaScript('screensaver', scrInfo.id);
              let dummyCanv = HtmlUtil.canvas();
              dummyCanv.width = 100;
              dummyCanv.height = 100;
              setIcon(dummyCanv);
              Util.pause(0.1).then(() => runScreenSaver(iconHost.firstChild, init, render));
            }
          }
        }
        setIcon(img || icon.img);
      };

      applyIconLayoutStyle(wrapper);

      return wrapper;
    };

    let runScreenSaver = async (canvas, init, render) => {
      init = init || Util.noop;
      let state = await Promise.resolve(init());
      let inTree = () => {
        let walker = canvas;
        while (walker) {
          if (walker === inner) return true;
          walker = walker.parentElement;
        }
      };

      let ctx = canvas.getContext('2d');
      while (inTree()) {
        await Util.pause(1 / 30);
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        await Promise.resolve(render(state, canvas, ctx, canvas.width, canvas.height));
      }
    };

    let getIconElement = id => {
      return Array.from(inner.children).filter(e => e._PX_ICON_ID === id)[0] || null;
    };
    let getIconPaths = ids => {
      let lookup = new Set(ids);
      return Array.from(inner.children)
        .filter(e => lookup.has(e._PX_ICON_ID))
        .map(e => e._PX_ICON.fullPath)
        .filter(Util.identity);
    };

    let populate = async () => {
      let icons = await Promise.resolve(getIcons());
      if (!icons) {
        inner.clear().set("Directory does not exist");
      }
      let positions = null;
      let isArrange = layoutMode === 'ARRANGE';
      if (isArrange) {
        let dir = await Promise.resolve(getDir());
        await Util.pause(0.05);
        let bcr = outer.getBoundingClientRect();
        let filesRaw = await fs.list(dir);
        let files = filesRaw.ok ? filesRaw.items.map(f => f.name) : [];
        positions = await getArrangePosition(dir, files, Math.max(1, Math.floor(bcr.height / (TILE_Y_SPACING))));
      }
      if (icons) {
        let iconElements = await Promise.all(icons.map(buildIcon));
        let first = iconElements[0];
        if (first) selection.cursor = first._PX_ICON_ID;
        inner.clear().set(iconElements);
        iconElements.forEach(applyIconLayoutStyle);
        refreshIconVisualStyle();
        if (isArrange) {
          iconElements.forEach(icon => {
            let fullPath = icon._PX_ICON.fullPath;
            let name = fullPath.split('/').pop();
            let pos = positions[name] || {};
            icon.set({ left: pos.x * (TILE_X_SPACING), top: pos.y * (TILE_Y_SPACING) });
          });
        }
      }
    };

    inner.addEventListener('pointerdown', () => {
      os.Shell.giveKeyboardFocusToElement(outer);
      selection.icons = new Set();
      refreshIconVisualStyle();
    });

    HtmlUtil.applyClickDragHandler(
      blueBoxLayer,
      (ev) => {
        let bcr = blueBoxLayer.getBoundingClientRect();
        let startX = ev.pageX - bcr.left;
        let startY = ev.pageY - bcr.top;
        selection.icons = new Set();
        return { startX, startY, layerSize: { left: bcr.left, top: bcr.top, width: bcr.width, height: bcr.height } };
      },
      (_ev, sess, dx, dy) => {
        let { startX, startY, layerSize } = sess;

        if (!blueBoxLayer.firstChild) {
          blueBoxLayer.set(div({ position: 'absolute', border: '1px solid #00f', backgroundColor: 'rgba(0, 0, 128, 0.5)' }));
        }

        let box = blueBoxLayer.firstChild;
        let x1 = startX;
        let y1 = startY;
        let x2 = startX + dx;
        let y2 = startY + dy;
        let left = Math.min(x1, x2);
        let right = Math.max(x1, x2);
        let top = Math.min(y1, y2);
        let bottom = Math.max(y1, y2);
        let width = right - left;
        let height = bottom - top;
        box.set({ left, top, width, height });

        let boxClientRect = {
          left: left + layerSize.left,
          top: top + layerSize.top,
          right: right + layerSize.left,
          bottom: bottom + layerSize.top,
        };
        let hits = Array.from(inner.children).filter(icon => {
          let rect = icon.getBoundingClientRect();
          let x = rect.left + rect.width / 2;
          let y = rect.top + rect.height / 2;
          return x > boxClientRect.left && x < boxClientRect.right && y > boxClientRect.top && y < boxClientRect.bottom;
        });

        selection.icons = new Set(hits.map(icon => icon._PX_ICON_ID));
        refreshIconVisualStyle();
      },
      () => {
        blueBoxLayer.clear();
      },
      false);

    outer.addEventListener('pointerdown', () => {
      os.Shell.giveKeyboardFocusToElement(outer);
    });

    outer.addEventListener('pointerup', async ev => {
      refreshIconVisualStyle();
      if (ev.button === 2 && getDir) {
        let options = { pid: getPid(), extendedOptionsBuilder: fileContextMenuExtBuilder };
        HtmlUtil.Components.FileContextMenu(os, await Promise.resolve(getDir()), true, options).showAtPointerEvent(ev);
      }
    });

    let moveCursor = (dx, dy, ctrl) => {
      let newIcon = findIconFromCardinalOffset(dx, dy);
      if (!newIcon && selection.cursor) newIcon = getIconElement(selection.cursor);

      if (newIcon) {
        selection.cursor = newIcon._PX_ICON_ID;
        if (!ctrl) {
          selection.icons = new Set([selection.cursor]);
        }
        refreshIconVisualStyle();
      }
    };
    let jumpToLetter = c => {};

    let renameFile = () => {
      let icon = getIconElement(selection.cursor);
      let fullPath = icon ? icon._PX_ICON.fullPath : '';
      if (fullPath) {
        os.Shell.DialogFactory.showRename(getPid(), fullPath);
      }
    };

    let openFile = () => {
      let targetId = 0;

      if (selection.icons.has(selection.cursor)) targetId = selection.cursor;
      else if (selection.icons.size() === 1) targetId = [...selection.icons][0];
      else if (selection.icons.size() === 0) return;
      else {
        // TODO: prompt "Are you sure you want to open these n files?"
      }

      let icon = getIconElement(targetId);
      if (icon) icon.openFile();
    };

    let setSelectionToCursor = (ctrl) => {
      let cursor = selection.cursor;
      if (!cursor && icons[0]) cursor = icons[0]._PX_ICON_ID;
      if (!cursor) return;

      if (!selection.icons.has(cursor)) {
        selection.icons.add(cursor);
      } else if (ctrl) {
        selection.icons.delete(cursor);
      }
      refreshIconVisualStyle();
    };

    let findIconFromCardinalOffset = (dx, dy) => {
      let icons = Array.from(inner.children).map(e => {
        let bcr = e.getBoundingClientRect();
        return { id: e._PX_ICON_ID, x: bcr.left + bcr.width / 2, y: bcr.top + bcr.height / 2, w: bcr.width, h: bcr.height };
      });
      let start = (selection.cursor ? icons.filter(icon => icon.id === selection.cursor)[0] : null) || icons[0];
      icons = icons
        .filter(t => !(
          (dx < 0 && t.x >= start.x) ||
          (dx > 0 && t.x <= start.x) ||
          (dy < 0 && t.y >= start.y) ||
          (dy > 0 && t.y <= start.y)));
      if (!icons.length) return null;
      let tx = start.x + dx * start.w;
      let ty = start.y + dy * start.h;
      let best = null;
      let bestDist = null;
      for (let icon of icons) {
        if (icon.id !== start.id) {
          let diffX = (tx - icon.x) ** 2;
          let diffY = (ty - icon.y) ** 2;
          if (dx && diffY >= diffX * 0.7) continue;
          if (dy && diffX >= diffY * 0.7) continue;
          let dist = diffX + diffY;
          if (!best || bestDist > dist) {
            best = icon;
            bestDist = dist;
          }
        }
      }

      return best ? getIconElement(best.id) : null;
    };

    let navigateUp = () => {
      if (onBackspace) onBackspace();
    };

    outer.onShellKey = (ev, isDown) => {
      if (!isDown) return;

      let c = `${ev.code}`;
      switch (c) {
        case 'ArrowLeft': moveCursor(-1, 0, ev.ctrlKey); break;
        case 'ArrowRight': moveCursor(1, 0, ev.ctrlKey); break;
        case 'ArrowUp': moveCursor(0, -1, ev.ctrlKey); break;
        case 'ArrowDown': moveCursor(0, 1, ev.ctrlKey); break;
        case 'Backspace': navigateUp(); break;
        case 'Space': setSelectionToCursor(ev.ctrlKey); break;
        case 'Enter': openFile(); break;
        case 'F2': renameFile(); break;
        case 'Escape': break;
        default:
          if (c.startsWith('Key') && c.length === 4) {
            jumpToLetter(c.toUpperCase());
          }
          break;
      }
    };

    let defaultDropFile = async (files, ev) => {
      let curDir = await Promise.resolve(getDir());
      let bcr = outer.getBoundingClientRect();
      let pos = {
        x: Math.floor(1000 * (ev.pageX - bcr.left) / TILE_X_SPACING) / 1000 - 0.5,
        y: Math.floor(1000 * (ev.pageY - bcr.top) / TILE_Y_SPACING) / 1000 - 0.5,
      };

      for (let file of files) {
        let target = fs.join(curDir, file.name);
        if (file.isInternal) {
          let source = file.path;
          if (fs.getParent(source) === curDir) {
            if (layoutMode === 'ARRANGE') {
              setPosition(curDir, file.name, pos.x, pos.y);
            }
          } else {
            if (await fs.pathExists(target)) {
              console.log("TODO: dry run with prompt to overwrite");
            }
            await fs.move(source, target);
          }
        } else {
          if (file.isText) {
            await fs.fileWriteText(target, await file.text);
          } else {
            let arrBuf = new Uint8Array(await file.bytes);
            let fileType = Util.getCommonFileType(file.name, arrBuf);
            if (fileType && fileType.type === 'image' && (fileType.format === 'JPEG' || fileType.format === 'PNG')) {
              await fs.fileWriteImageBase64(target, Util.bytesToBase64(arrBuf));
            } else {
              console.log("TODO: raw binary data files", arrBuf.slice(0, 10).join(', ') + '...');
            }
          }
        }
      }

      populate();
    };

    let dropHandler = onFileDrop || (isRealDir ? defaultDropFile : null);
    if (dropHandler) {
      outer.set({
        onDragDrop: (files, ev) => dropHandler(files, ev),
        onDragOver: (files) => { },
        onDragOut: (files) => { },
      });
    }

    populate();
    outer.refresh = populate;

    outer.setLayoutMode = (mode) => {
      mode = `${mode}`.toUpperCase();
      if (modes.has(mode)) {
        layoutMode = mode;
        populate();
      }
    };

    return outer;
  });
})();

(() => {
  let regProps = [
    'leadContent', 'tailContent',
    'orientation', 'pixels', 'ratio', 'isMeasuredFromTail',
    'thickness', 'adjusterStyle',
  ];
  PlexiOS.HtmlUtil.registerComponent('DividerPane', (...args) => {

    let { HtmlUtil, Util } = PlexiOS;
    let { div, span } = HtmlUtil;
    let { htmlArgs, props } = Util.argInterceptor(args, regProps);
    let {
      leadContent, tailContent, orientation,
      pixels, ratio, isMeasuredFromTail,
      thickness, adjusterStyle,
    } = props;

    let isHorizontal = `${orientation}`.toUpperCase()[0] === 'H'; // lol
    let isMeasuredFromLead = !isMeasuredFromTail;
    thickness = thickness || 6;

    let toPercent = r => (100 * r) + '%';

    let sz = {
      position: 'absolute',
      ...(isHorizontal ? { width: '100%' } : { height: '100%' }),
    };

    // keep all terminology in vertical terms and use these CSS setters that flip based on actual orientation.
    let setWidth = (el, amt) => el.set(isHorizontal ? { height: amt } : { width: amt });
    let setLeft = (el, amt) => el.set(isHorizontal ? { top: amt } : { left: amt });
    let setRight = (el, amt) => el.set(isHorizontal ? { bottom: amt } : { right: amt });
    let left = div(sz, leadContent);
    let right = div(sz, tailContent);
    let adjuster = div(sz, { cursor: isHorizontal ? 'ns-resize' : 'ew-resize' });
    let sizingBucket = div(sz);

    // TODO: get this from the theme and put a re-style class on this.
    adjusterStyle = adjusterStyle || { backgroundColor: '#888', border: '1px solid #444', borderLeftColor: '#bbb', borderTopColor: '#eee' };
    if (typeof adjusterStyle === 'function') adjusterStyle(adjuster, thickness, isHorizontal);
    else adjuster.set(adjusterStyle);

    setWidth(adjuster, thickness);

    let outer = div(htmlArgs);

    let sizeData = {
      preferPercent: pixels === undefined,
      pixels,
      ratio,
    };

    if (isMeasuredFromLead) {
      outer.set(left, sizingBucket.set(adjuster, right));
    } else {
      outer.set(sizingBucket.set(left, adjuster), right);
    }

    let syncToSize = () => {
      let splitSz = sizeData.preferPercent
        ? toPercent(sizeData.ratio)
        : sizeData.pixels;

      setLeft(left, 0);
      setWidth(adjuster, thickness);
      setRight(right, 0);

      if (isMeasuredFromLead) {
        setWidth(left, splitSz);
        setLeft(sizingBucket, splitSz);
        setRight(sizingBucket, 0);
        setLeft(adjuster, 0);
        setLeft(right, thickness);
      } else {

        setLeft(sizingBucket, 0);
        setRight(sizingBucket, splitSz);

        setLeft(left, 0);
        setRight(left, thickness);

        setRight(adjuster, 0);
        setWidth(adjuster, thickness);

        setWidth(right, splitSz);
        setRight(right, 0);
      }
    };

    let getPixelSize = () => {
      let bcr = (isMeasuredFromLead ? left : right).getBoundingClientRect();
      return isHorizontal ? bcr.height : bcr.width;
    };

    let setPixelSize = (size) => {
      let bcr = outer.getBoundingClientRect();
      let fullSize = isHorizontal ? bcr.height : bcr.width;

      size = Math.max(0, Math.min(size, fullSize));

      if (sizeData.preferPercent) {
        sizeData.ratio = size / fullSize;
      } else {
        sizeData.pixels = size;
      }
    };

    HtmlUtil.applyClickDragHandler(
      adjuster,
      () => {
        return { originalSize: getPixelSize() };
      },
      (_ev, sess, dx, dy) => {
        let newSize = sess.originalSize + (isHorizontal ? dy : dx) * (isMeasuredFromTail ? -1 : 1);
        setPixelSize(newSize);
        syncToSize();
      },
    );
    adjuster.addEventListener('pointerdown', () => {});

    syncToSize();

    return outer;
  });
})();

return Object.freeze({ Util, HtmlUtil, PlexiFS, create: createPlexiOs, staticAppRegistry, awaitAllJavaScriptLoaders, registerJavaScriptLoader, registerJavaScript, loadJavaScript, lockJavaScriptLoader, createImageUtil, terminalSession });
})();
