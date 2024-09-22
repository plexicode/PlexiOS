(() => {
  let { HtmlUtil, Util } = PlexiOS;
  let { div } = HtmlUtil;

  let regProps = [
    'innerPadding',
    'onValueChanged',
    'onContextMenu',
    'value',
    'isMonospace',
    'lineHeight',
    'shortcutKeys',
    'os',
  ];
  HtmlUtil.registerComponent('TextEditor', (...args) => {
    let fn = null;
    let newArgs = [];
    args = Util.flattenArray(args);
    for (let arg of args) {
      if (typeof arg === 'function') {
        fn = arg;
      } else {
        newArgs.push(arg);
      }
    }
    let { htmlArgs, props } = Util.argInterceptor(newArgs, regProps);
    let { innerPadding, value, shortcutKeys, os } = props;
    let onValueChanged = props.onValueChanged || fn || Util.noop;
    let onContextMenu = props.onContextMenu || Util.noop;

    let ta = HtmlUtil.textarea(
      {
        boxSizing: 'border-box',
        spellcheck: false,
        resize: 'none',
        outline: 'none',
        border: 'none',
        margin: 0,
        overflow: 'auto',
        padding: innerPadding || 0,
        fontFamily: props.isMonospace ? 'monospace' : 'sans-serif',
        fontSize: 11,
        lineHeight: props.lineHeight,
        dummyId: true,
      }
    );

    ta.addEventListener('keydown', ev => {
      if (shortcutKeys && shortcutKeys.handle(ev)) {
        ev.preventDefault();
        ev.stopPropagation();
      }
    });

    ta.value = value || '';

    ta.addEventListener('contextmenu', async ev => {
      ev.preventDefault();
      ev.stopPropagation();
      let el = await os.Shell.MenuBuilder.buildRootMenuElement(onContextMenu, true);
      os.Shell.openModalAtMouseEvent(ev, el);
    });

    let lastChangeFire = null;
    let onChange = (t) => {
      if (lastChangeFire !== t) {
        lastChangeFire = t;
        onValueChanged(t);
      }
    };

    [
      'keydown',
      'keyup',
      'input',
      'change',
    ].forEach(ev => ta.addEventListener(ev, () => onChange(ta.value)));

    let outer = div(
      { position: 'relative' },
      htmlArgs,
      ta.set({ fullSize: true }),
    );

    outer.setValue = t => {
      ta.value = t;
      return outer;
    };
    outer.getValue = () => ta.value;

    outer.getSelection = () => {
      let start = ta.selectionStart;
      let end = ta.selectionEnd;
      let length = end - start;
      return { start, end, length };
    };
    outer.setSelection = (start, optEnd) => {
      ta.selectionStart = start;
      ta.selectionEnd = optEnd === undefined ? start : optEnd;
      return outer;
    };
    outer.getSelectedText = () => ta.value.substring(ta.selectionStart, ta.selectionEnd);
    outer.focus = () => { ta.focus(); return outer; };
    outer.setSize = sz => {
      ta.set({ fontSize: Math.floor(10 * sz + 0.5) / 10 });
      return outer;
    };

    return outer;
  });
})();
