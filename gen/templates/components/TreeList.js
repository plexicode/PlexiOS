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
