const TITLE = "Settings";
const BG_COLOR = 'rgb(230, 236, 242)';
const { button, div, inputCheckbox, inputText, span } = HtmlUtil;
const { ItemList } = HtmlUtil.Components;

let createBox = (title, args) => {
  return div(
    { borderRadius: '3px', backgroundColor: '#fff' },
    div({ fontSize: '1.2rem', bold: true, borderBottom: '1px solid #888' }, title),
    args.map(a => div(a)),
  );
};

let createDetailsPanel = (title, elements) => {
  let outer = div(
    {
      fullSize: true,
      backgroundColor: BG_COLOR,
    },
    div({ fontSize: '1.4rem', padding: 20, bold: true, northDock: 50 }, title),
    div(
      { overflowX: 'hidden', overflowY: 'auto', southStretchDock: 50 },
      elements,
      div({ html: '&nbsp;' }),
    )
  );
  return outer;
};

let createSettingBox = (title, interior, isTop, isBottom) => {
  return div(
    {
      backgroundColor: '#fff',
      marginLeft: 20,
      marginRight: 20,
      padding: 8,
      fontSize: '0.75rem',
    },

    isTop ? { borderTopLeftRadius: 3, borderTopRightRadius: 3 } : null,
    isBottom ? { borderBottomLeftRadius: 3, borderBottomRightRadius: 3 } : null,

    isTop ? null : { borderTop: '1px solid ' + BG_COLOR },

    div({ bold: true, marginBottom: 3, }, title),
    div({ color: '#555' }, interior),
  );
};
