const toolImages = [
  { id: 'BRUSH', image: APP_RAW_IMAGE_DATA['images/tool_brush.png'] },
  { id: 'DROPPER', image: APP_RAW_IMAGE_DATA['images/tool_dropper.png'] },
  { id: 'FILL', image: APP_RAW_IMAGE_DATA['images/tool_fill.png'] },
  { id: 'SELECT', image: APP_RAW_IMAGE_DATA['images/tool_select.png'] },
  { id: 'RECTANGLE', image: APP_RAW_IMAGE_DATA['images/tool_rect.png'] },
  { id: 'LINE', image: APP_RAW_IMAGE_DATA['images/tool_line.png'] },
  { id: 'SMUDGE', image: APP_RAW_IMAGE_DATA['images/tool_smudge.png'] },
  { id: 'PAN', image: APP_RAW_IMAGE_DATA['images/tool_pan.png'] },
].reduce((lookup, t) => {
  lookup[t.id] = t.image;
  return lookup;
}, {});

let createToolbar = (ctx) => {
  const { button, div } = HtmlUtil;

  // touch screens on some operating systems will attempt to "nudge" touch event
  // coordinates towards well-known clickable elements, such as buttons. Because
  // there is a menu bar directly above the toolbar, touch events to File can get
  // redirected to the toolbar. We fix this by inserting a small gap between the
  // buttons and the top of the toolbar.
  const TOP_GAP = 20;

  let toolOptions = div();

  let shownId = '';
  ctx.onToolUpdated.push(id => {
    if (id !== shownId) {
      shownId = id;
      toolOptions.clear();
      switch (id) {
        case 'BRUSH':
        case 'LINE':
          toolOptions.set(toolOptions_brush(ctx));
          break;

        case 'DROPPER':
        case 'FILL':
        case 'SELECT':
          return null;

        default:
          // toolOptions.set("TODO: " + id + " panel");
          // break;
          return null;
      }
    }
  });

  let allButtons = [
    { id: 'SELECT', name: "Selection", lbl: 'Slct' },
    { id: 'BRUSH', name: "Brush", lbl: 'Brsh' },
    { id: 'FILL', name: "Bucket", lbl: 'Bckt' },
    { id: 'RECTANGLE', name: "Rectangle", lbl: 'Rect' },
    { id: 'LINE', name: "Line", lbl: 'Line' },
    { id: 'SMUDGE', name: "Smudge", lbl: 'Smdg' },
    { id: 'DROPPER', name: "Dropper", lbl: 'Drpr' },
    { id: 'PAN', name: "Pan", lbl: 'Pan' },
  ];

  return div(
    { overflow: 'hidden', height: '100%' },
    div(
      { position: 'relative', width: '100%', height: Math.ceil(allButtons.length / 2) * 30, marginTop: TOP_GAP },
      allButtons.map((btn, i) => {
        return div(
          {
            position: 'absolute',
            left: i % 2 === 0 ? 0 : 30,
            top: Math.floor(i / 2) * 30,
            size: 30,
            fontSize: 7,
          },
          button(
            {
              fullSize: true,
              padding: 0,
              textAlign: 'center',
              fontSize: 7,
              title: btn.name
            },
            Util.copyImage(toolImages[btn.id]).set({ size: 24 }),
            () => setActiveTool(ctx, btn.id)
          )
        );
      }),
    ),
    toolOptions,
  );
};

let setActiveTool = (ctx, id) => {
  if (ctx.activeTool === id) return;
  commitLingeringUndoUnit(ctx);
  ctx.activeTool = id;
  ctx.onToolUpdated.forEach(fn => fn(id));
};

// Cache the math for calculating the coordinates of pixels in circular areas
// and the distance each pixel is from the center.
let circleCoordsByRadii = {};
let getCoordsForRadius = r => {
  if (r <= 0) return [];
  if (!circleCoordsByRadii[r]) {
    let coords = [];
    for (let y = -r; y <= r; y++) {
      for (let x = -r; x <= r; x++) {
        let dist = Math.sqrt(x ** 2 + y ** 2);
        coords.push([x, y, dist, Math.floor(dist)]);
      }
    }
    circleCoordsByRadii[r] = coords;
  }
  return circleCoordsByRadii[r];
};

let twoPointsToRect = (x1, y1, x2, y2) => {
  let left = Math.min(x1, x2);
  let right = Math.max(x1, x2);
  let top = Math.min(y1, y2);
  let bottom = Math.max(y1, y2);
  return { left, top, right, bottom, width: right - left, height: bottom - top };
};

let TOOLS = {
  PAN: {
    onDown: (ctx, gesture) => {
      gesture.data.startCenterX = ctx.doc.viewport.centerX;
      gesture.data.startCenterY = ctx.doc.viewport.centerY;
    },
    onDrag: (ctx, gesture) => {
      let { startCenterX, startCenterY } = gesture.data;
      if (Util.isNullish(startCenterX)) return;
      let { x, y } = gesture.start;
      let dx = gesture.current.x - x;
      let dy = gesture.current.y - y;
      let ratio = ctx.doc.viewport.zoom;
      ctx.doc.viewport.centerX = startCenterX - dx / ratio;
      ctx.doc.viewport.centerY = startCenterY - dy / ratio;
      render(ctx);
    },
    onRelease: (ctx, gesture) => {
      gesture.data.startCenterX = undefined;
      gesture.data.startCenterY = undefined;
    },
  },
  SELECT: {
    // SELECT is not a real tool. It looks at where the gesture begins and the current state of things
    // and re-routes the action to a more specific tool action.
    onDown: (ctx, gesture) => {
      let uu = ctx.doc.previewUndoUnit;

      if (uu) {
        let float = uu.getFloatData();
        if (float) {
          let { px, py } = gesture.current;
          if (px >= float.left && px < float.left + float.width &&
              py >= float.top && py < float.top + float.height) {
            ctx.activeTool = 'SELECT_TRANSFORM';
          } else {
            console.log("You clicked outside of the region. Committing the old selection and trying the gesture again.");
            commitLingeringUndoUnit(ctx);
          }
        } else {
          console.log("Looks like there's a lingering undo unit. Committing it.");
          commitLingeringUndoUnit(ctx);
        }
      } else {
        ctx.activeTool = 'SELECT_SETBOUNDS';
      }

      // Now that a different tool has been chosen OR the lingering undo unit has been committed,
      // let's replay the event.
      TOOLS[ctx.activeTool].onDown(ctx, gesture);
    },
  },
  SELECT_SETBOUNDS: {
    onDown: (ctx, gesture) => { },
    onDrag: (ctx, gesture) => {
      let { start, current } = gesture;
      ctx.doc.previewUndoUnit = createUndoUnit(ctx, 'NOOP', {
        selectionBounds: twoPointsToRect(start.px, start.py, current.px, current.py)
      });
      render(ctx);
    },
    onRelease: (ctx, gesture) => {
      let { start, current } = gesture;
      console.log("The bounds have been set! Creating a floating undo unit", start, current);
      ctx.doc.previewUndoUnit = createUndoUnit(ctx, 'FLOATING_SELECTION', {
        selectionBounds: twoPointsToRect(start.px, start.py, current.px, current.py),
      });
      ctx.activeTool = 'SELECT';
      render(ctx);
    },
  },
  SELECT_TRANSFORM: {
    onDown: (ctx, gesture) => {
      console.log("You clicked on a selection region");
      let uu = ctx.doc.previewUndoUnit;
      if (!uu || !uu.isFloat) {
        if (uu) ctx.commitLingeringUndoUnit(ctx);
        ctx.activeTool = 'SELECT';
        TOOLS.SELECT.onDown(ctx, gesture);
        return;
      }

      let f = uu.getFloatData();
      gesture.data.floatStartX = f.left;
      gesture.data.floatStartY = f.top;
      render(ctx);
    },
    onDrag: (ctx, gesture) => {
      let uu = ctx.doc.previewUndoUnit;
      if (!uu) return;
      let startX = gesture.start.px;
      let startY = gesture.start.py;
      let endX = gesture.current.px;
      let endY = gesture.current.py;
      let dx = endX - startX;
      let dy = endY - startY;
      uu.setFloatOffset(gesture.data.floatStartX + dx, gesture.data.floatStartY + dy);
      render(ctx);
    },
    onRelease: (ctx, gesture) => {
      ctx.activeTool = 'SELECT';
      render(ctx);
      console.log("Drag released. Going back to SELECT tool");
    },
  },

  SMUDGE: {
    onDown: (ctx, gesture) => {
      commitLingeringUndoUnit(ctx);
      ctx.doc.previewUndoUnit = createUndoUnit(ctx, 'TEMP_SURF');
      let churn = document.createElement('canvas');
      churn.width = 24;
      churn.height = 24;
      gesture.data.churnSurf = churn;
      gesture.data.churnCtx = churn.getContext('2d', { willReadFrequently: true });

      TOOLS.SMUDGE.onDrag(ctx, gesture);
    },
    onDrag: (ctx, gesture) => {
      let uu = ctx.doc.previewUndoUnit;
      if (!uu) return;
      let surf = uu.getMutableSurface();
      let { current } = gesture;
      let x = Math.floor(current.px);
      let y = Math.floor(current.py);
      if (x < 0 || y < 0 || x >= surf.width || y >= surf.height) return;

      let { churnSurf, churnCtx } = gesture.data;
      let width = churnSurf.width;
      let height = churnSurf.height;
      let cx = width >> 1;
      let cy = height >> 1;
      churnCtx.clearRect(0, 0, width, height);
      churnCtx.drawImage(surf.canvas, -x + cx, -y + cy);
      let imageData = churnCtx.getImageData(0, 0, width, height);
      let pixels = imageData.data;
      let clrContribs = [];
      let px, py, dist, idx, contribX, contribY, rgb, rgbTotal, pixelCount, influence, clr;
      let finalColors = [];

      for (let coord of getCoordsForRadius(5)) { // loop through all coordinates within a 5 pixel radius
        px = coord[0] + cx;
        py = coord[1] + cy;
        dist = coord[3];
        let contribCoords = getCoordsForRadius(6 - dist); // loop through all adjacent pixels within a distance that diminishes as you go further from the center.
        if (contribCoords.length > 0) {

          for (let contribCoord of contribCoords) {
            contribX = px + contribCoord[0];
            contribY = py + contribCoord[1];
            idx = (contribX + contribY * width) * 4;
            clrContribs.push([pixels[idx], pixels[idx + 1], pixels[idx + 2], pixels[idx + 3]]);
          }
          rgb = [0, 0, 0];
          rgbTotal = 0;
          pixelCount = clrContribs.length;
          while (clrContribs.length) {
            clr = clrContribs.pop();
            influence = clr[3] / 255;
            rgb[0] += clr[0] * influence
            rgb[1] += clr[1] * influence;
            rgb[2] += clr[2] * influence;
            rgbTotal += influence;
          }

          rgbTotal = Math.max(1, rgbTotal);
          finalColors.push([
            px, py, // the coordintae
            Math.floor(rgb[0] / rgbTotal), Math.floor(rgb[1] / rgbTotal), Math.floor(rgb[2] / rgbTotal), // the RGB value
            rgbTotal / pixelCount, // The alpha is just an average
            pixelCount,
          ]);
        }
      }

      for (let action of finalColors) {
        px = action[0];
        py = action[1];
        churnCtx.clearRect(px, py, 1, 1);
        churnCtx.fillStyle = `rgba(${action[2]}, ${action[3]}, ${action[4]}, ${action[5]})`;
        churnCtx.fillRect(px, py, 1, 1);
      }

      let tx = x - cx;
      let ty = y - cy;
      surf.clear(tx, ty, width, height);
      surf.blit(churnSurf, tx, ty);
      uu.touchPixel(tx, ty);
      uu.touchPixel(tx + width - 1, ty + height - 1);
      render(ctx);
    },
    onRelease: (ctx, gesture) => {
      commitLingeringUndoUnit(ctx);
    },
  },
  FILL: {
    onDown: (ctx, gesture) => {
      commitLingeringUndoUnit(ctx);
      let uu = createUndoUnit(ctx, 'TRANSPARENT_OVERLAY');
      ctx.doc.previewUndoUnit = uu;

      let ts = document.createElement('canvas');
      let original = ctx.doc.image.canvas;
      const WIDTH = original.width;
      const HEIGHT = original.height;
      ts.width = WIDTH;
      ts.height = HEIGHT;
      let g = ts.getContext('2d');
      g.drawImage(ctx.doc.image.canvas, 0, 0);
      let pixels = g.getImageData(0, 0, WIDTH, HEIGHT).data;


      let { px, py } = gesture.current;
      let idx4 = (py * WIDTH + px) * 4;
      let targetColor = (pixels[idx4++] << 24) | (pixels[idx4++] << 16) | (pixels[idx4++] << 8) | pixels[idx4];
      let visited = {};
      let first = [px, py];
      let q = [first];
      let hits = [first];

      visited[px + py * WIDTH] = true;
      let cur, x, y, idx, color, alpha;
      while (q.length) {
        cur = q.pop();
        x = cur[0];
        y = cur[1];
        idx = x + y * WIDTH;

        idx4 = idx * 4;
        color = (pixels[idx4++] << 24) | (pixels[idx4++] << 16) | (pixels[idx4++] << 8);
        alpha = pixels[idx4];
        if (alpha === 0) color = 0;
        color |= alpha;

        if (color === targetColor) {
          hits.push(cur);
          if (x > 0 && !visited[idx - 1]) {
            visited[idx - 1] = true;
            q.push([x - 1, y]);
          }
          if (y > 0 && !visited[idx - WIDTH]) {
            visited[idx - WIDTH] = true;
            q.push([x, y - 1]);
          }
          if (x + 1 < WIDTH && !visited[idx + 1]) {
            visited[idx + 1] = true;
            q.push([x + 1, y]);
          }
          if (y + 1 < HEIGHT && !visited[idx + WIDTH]) {
            visited[idx + WIDTH] = true;
            q.push([x, y + 1]);
          }
        }
      }

      let surf = uu.getMutableSurface();
      let newColor = ctx.activeColor;
      let uuCtx = surf.canvas.getContext('2d');
      uuCtx.fillStyle = 'rgb(' + newColor.slice(0, 3).join(',') + ')';

      let maxX = hits[0][0];
      let maxY = hits[0][1];
      let minX = maxX;
      let minY = maxY;
      for (let hit of hits) {
        x = hit[0];
        y = hit[1];
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        uuCtx.fillRect(x, y, 1, 1);
      }

      uu
        .setTransparency(newColor[3])
        .clearTouchedPixels()
        .touchPixel(minX, minY)
        .touchPixel(maxX, maxY);

      render(ctx);
      commitLingeringUndoUnit(ctx);
    },
  },
  DROPPER: {
    onDown: (ctx, gesture) => {
      commitLingeringUndoUnit(ctx);
      let onePx = document.createElement('canvas');
      onePx.width = 1;
      onePx.height = 1;
      gesture.data = {
        tempSurf: onePx.getContext('2d', { willReadFrequently: true }),
      };
      TOOLS.DROPPER.onDrag(ctx, gesture);
    },
    onDrag: (ctx, gesture) => {
      let ts = gesture.data.tempSurf;
      if (!ts) return;

      let { px, py } = gesture.current;
      ts.clearRect(0, 0, 1, 1);
      ts.drawImage(ctx.doc.image.canvas, -px, -py);
      let color = ts.getImageData(0, 0, 1, 1);
      let [r, g, b, a] = [...color.data];
      ctx.setActiveColor(r, g, b, a);
    },
    onRelease: (ctx, gesture) => {
      gesture.data.tempSurf = null;
    },
  },
  BRUSH: {
    onDown: (ctx, gesture) => {
      commitLingeringUndoUnit(ctx);
      ctx.doc.previewUndoUnit = createUndoUnit(ctx, 'TEMP_SURF');
      TOOLS.BRUSH.onDrag(ctx, gesture);
    },
    onDrag: (ctx, gesture) => {
      let uu = ctx.doc.previewUndoUnit;
      if (!uu) return;
      let surf = uu.getMutableSurface();
      let x1 = gesture.current.px;
      let y1 = gesture.current.py;
      let x2 = gesture.prev.px;
      let y2 = gesture.prev.py;
      let g = surf.ctx;
      let rad = ctx.brushSize / 2;
      let style = 'rgba(' + ctx.activeColor.join(',') + ')';
      for (let xy of [[x1, y1], [x2, y2]]) {
        g.beginPath();
        g.fillStyle = style;
        g.ellipse(xy[0], xy[1], rad, rad, 0, 0, Math.PI * 2);
        g.fill();
      }
      g.beginPath();
      g.moveTo(x1, y1);
      g.lineTo(x2, y2);
      g.lineWidth = rad * 2;
      g.strokeStyle = style;
      g.stroke();

      uu
        .touchPixel(Math.min(x1, x2) - rad, Math.floor(Math.min(y1, y2) - rad - 1))
        .touchPixel(Math.max(x1, x2) + rad, Math.ceil(Math.max(y1, y2) + rad + 1));
      render(ctx);
    },
    onRelease: (ctx, gesture) => {
      commitLingeringUndoUnit(ctx);
    },
  },
  LINE: {
    onDown: (ctx, gesture) => {
      commitLingeringUndoUnit(ctx);
      ctx.doc.previewUndoUnit = createUndoUnit(ctx, 'TRANSPARENT_OVERLAY');
      TOOLS.RECTANGLE.onDrag(ctx, gesture);
    },
    onDrag: (ctx, gesture) => {
      let uu = ctx.doc.previewUndoUnit;
      if (!uu) return;

      let x1 = gesture.start.px;
      let y1 = gesture.start.py;
      let x2 = gesture.current.px;
      let y2 = gesture.current.py;
      let rad = ctx.brushSize / 2;
      let surf = uu.getMutableSurface();
      let color = ctx.activeColor;
      let style = 'rgba(' + color.slice(0, 3).join(',') + ')';
      surf.clear()
      let g = surf.ctx;

      for (let xy of [[x1, y1], [x2, y2]]) {
        g.beginPath();
        g.fillStyle = style;
        g.ellipse(xy[0], xy[1], rad, rad, 0, 0, Math.PI * 2);
        g.fill();
      }
      g.beginPath();
      g.moveTo(x1, y1);
      g.lineTo(x2, y2);
      g.lineWidth = rad * 2;
      g.strokeStyle = style;
      g.stroke();

      uu
        .setTransparency(color[3])
        .clearTouchedPixels()
        .touchPixel(Math.min(x1, x2) - rad, Math.floor(Math.min(y1, y2) - rad - 1))
        .touchPixel(Math.max(x1, x2) + rad, Math.ceil(Math.max(y1, y2) + rad + 1));


      render(ctx);
    },
    onRelease: (ctx, gesture) => {
      commitLingeringUndoUnit(ctx);
    },
  },
  RECTANGLE: {
    onDown: (ctx, gesture) => {
      commitLingeringUndoUnit(ctx);
      ctx.doc.previewUndoUnit = createUndoUnit(ctx, 'TRANSPARENT_OVERLAY');
      TOOLS.RECTANGLE.onDrag(ctx, gesture);
    },
    onDrag: (ctx, gesture) => {
      let uu = ctx.doc.previewUndoUnit;
      if (!uu) return;

      let x1 = gesture.start.px;
      let y1 = gesture.start.py;
      let x2 = gesture.current.px;
      let y2 = gesture.current.py;
      let { left, top, width, height, right, bottom } = twoPointsToRect(x1, y1, x2, y2);
      let surf = uu.getMutableSurface();
      let color = ctx.activeColor;
      surf
        .clear()
        .drawRect(left, top, width + 1, height + 1, color[0], color[1], color[2], 255);
      uu
        .setTransparency(color[3])
        .clearTouchedPixels()
        .touchPixel(left, top)
        .touchPixel(right, bottom);
      render(ctx);
    },
    onRelease: (ctx, gesture) => {
      commitLingeringUndoUnit(ctx);
    },
  },
};
