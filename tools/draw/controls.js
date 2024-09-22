let getClockVector = (hr, min, rad, offsetX, offsetY) => {
  let rot = (hr + min / 60) / 12;
  let theta = (0.25 - rot) * Math.PI * 2;
  return [
    offsetX + rad * Math.cos(theta),
    offsetY + rad * -Math.sin(theta)
  ];
};

let anchorControl = () => {

  let outer = div({ position: 'relative', width: 120, height: 120 });
  let refs = [];
  let activeCol = 0;
  let activeRow = 0;
  let xInv = 1;
  let yInv = 1;

  let getKey = (x, y) => ('XN SX'[y + 2] + 'XW EX'[x + 2]).trim() || 'C';

  for (let y = 0; y < 3; y++) {
    for (let x = 0; x < 3; x++) {
      let cell = div({
        position: 'absolute',
        width: 40,
        height: 40,
        left: x * 40,
        top: y * 40,
      });
      let col = x - 1;
      let row = y - 1;
      let icon = canvas({ position: 'relative', width: 30, height: 30 });
      let btn = button(icon, { boxSizing: 'border-box', width: 40, height: 40, padding: 0, textAlign: 'center', verticalAlign: 'middle' });
      refs.push({ icon, col, row });
      btn.addEventListener('click', () => {
        activeCol = col;
        activeRow = row;
        outer.refresh();
      });
      cell.set(btn);

      outer.set(cell);
    }
  }

  outer.getAnchorDirection = () => ({
    col: activeCol,
    row: activeRow,
    id: getKey(activeCol, activeRow),
  });

  outer.refresh = () => {

    let getArrowPts = (h, m) => {
      return Util.range(3).map(i => getClockVector(h + (i - 1) * 4.5, m || 0, 25, 40, 40));
    };

    Object.values(refs).forEach(btn => {
      let { icon, col, row } = btn;
      let symCol = col - activeCol;
      let symRow = row - activeRow;

      let iconCtx = icon.getDrawContext();
      iconCtx.setSize(80, 80).clear();

      let pts = null;
      switch (getKey(xInv * symCol, yInv * symRow)) {
        case 'NW': pts = getArrowPts(10, 30); break;
        case 'N': pts = getArrowPts(12); break;
        case 'NE': pts = getArrowPts(1, 30); break;
        case 'E': pts = getArrowPts(3); break;
        case 'SE': pts = getArrowPts(4, 30); break;
        case 'S': pts = getArrowPts(6); break;
        case 'SW': pts = getArrowPts(7, 30); break;
        case 'W': pts = getArrowPts(9); break;
        case 'C':
        iconCtx
            .rectangle(0, 0, 80, 80, '#000')
            .rectangle(5, 5, 70, 70, '#fff')
            .ellipse(35, 35, 10, 10, '#888');
          return;
        default: return;
      }
      iconCtx.polygon(pts, '#000');
    });

    return outer;
  };

  outer.setYInvert = v => { yInv = v ? -1 : 1; return outer; };
  outer.setXInvert = v => { xInv = v ? -1 : 1; return outer; };
  outer.refresh();

  return outer;

};
