let toolOptions_brush = (ctx) => {
  let { div, inputRange } = HtmlUtil;
  let { ItemList } = HtmlUtil.Components;

  let sliderSize = ctx.brushSizeSliderValue;

  let customOptionLabel = null;

  let applySize = sz => {
    sz = Math.max(1, Math.min(100, Util.ensureNumber(sz)));
    ctx.brushSize = sz;
  };

  let presets = [1, 2, 3, 4, 5, 8, 12, 20].map(n => ({ id: '' + n, size: n }));

  let selectedItem = presets.filter(v => v.id === ctx.brushSize + '')[0] || { id: 'custom' };
  let sizes = ItemList({
    fontSize: 6,
    getItems: () => {
      return [...presets, { id: 'custom' }];
    },
    getId: v => v.id,
    onSelectionChanged: id => {
      let sz = id === 'custom' ? ctx.brushSizeSliderValue : parseInt(id);
      applySize(sz);
    },
    renderItem: item => {
      let isCustom = item.id === 'custom';
      if (isCustom) {
        customOptionLabel = span({ bold: true, color: '#08f' }, sliderSize + '');
      }
      let o = div(
        { padding: 1, paddingLeft: 3, paddingRight: 3 },
        isCustom
          ? [customOptionLabel , " px"]
          : [span({ bold: true }, '' + item.size), ' px']
      );
      return o;
    },
    applyState: (e, states, id, defApply) => {
      defApply(e, states);
      if (id === 'custom') {
        customOptionLabel.set({ color: states.SELECTED ? '#8cf' : '#05f' });
      }
    },
    selectedId: selectedItem.id,
    border: '1px solid #888',
    backgroundColor: '#fff',
    color: '#000',
    margin: 4,
    fontSize: 8,
  });

  let ratioToSize = r => {
    return Math.floor(Math.max(1, Math.min(100, 1 + 99 * (r ** 2))));
  };
  let sizeToRatio = sz => {
    return Math.max(0, Math.min(1, Math.sqrt((sz - 1) / 99)));
  };

  let slider = inputRange(
    {
      min: 0,
      max: 1000,
      value: Math.floor(1000 * sizeToRatio(ctx.brushSizeSliderValue)),
      width: '100%',
    },
    v => {
      let ratio = Math.max(0, Math.min(1, v / 1000));
      let sz = ratioToSize(ratio);
      customOptionLabel.clear().set(sz + '');
      ctx.brushSizeSliderValue = sz;
      sizes.setSelectedId('custom');
      applySize(sz);
    });

  return div(
    { position: 'relative', width: '100%' },
    sizes,
    div({ margin: 4, marginLeft: 2 }, slider),
  );
};
