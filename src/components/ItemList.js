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
