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
