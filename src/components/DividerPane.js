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
