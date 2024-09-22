(() => {
  let regProps = ['month', 'day', 'year'];
  PlexiOS.HtmlUtil.registerComponent('Calendar', (...args) => {

    let { HtmlUtil, Util } = PlexiOS;
    let { button, div, span } = HtmlUtil;
    let { htmlArgs, props } = Util.argInterceptor(args, regProps);
    let { month, day, year } = props;

    let genDaySlots = () => {
      let slots = [];
      let lookup = {};
      for (let y = 0; y < 7; y++) {
        for (let x = 0; x < 7; x++) {
          let rx = 100 / 7;
          let ry = 100 / 7;
          let day = div(
            {
              textAlign: 'center',
              position: 'absolute',
              left: x * rx + '%',
              top: y * ry + '%',
              width: rx + '%',
              height: ry + '%',
            }
          );
          let inner = y === 0
            ? div({
              position: 'absolute',
              width: '100%',
              textAlign: 'center',
              bold: true,
              bottom: 0,
              height: '50%',
              fontSize: 10,
            })
            : div({
              absMargin: 2,
              border: '1px solid #888',
              borderRadius: 2,
              textAlign: 'center',
              fontSize: 11,
              paddingTop: 5,
            });
          day.set(inner);
          slots.push(day);
          lookup[x + ',' + y] = day;
        }
      }

      return { elements: slots, lookup };
    };

    let slots = genDaySlots();

    let yearLabel = span({ bold: true, margin: 4 }, "2023");
    let monthLabel = span({ bold: true, margin: 4 }, "September");

    let buildArrowButton = (isLeft, onClick) => {
      return button(
        {
          html: isLeft ? '&#9664;' : '&#9654;',
          cursor: 'pointer',
          background: 'transparent',
          // border: '1px solid rgba(128, 128, 128, 0.5)',
          borderRadius: 2,
          color: '#fff',
          padding: 2,
        },
        onClick);
    };

    let outer = div(
      { fullSize: true },
      div(
        { northDock: 18, fontSize: 10 },
        div(
          { westDock: 95 },
          buildArrowButton(true, () => applyMonth(year - 1, month)),
          yearLabel,
          buildArrowButton(false, () => applyMonth(year + 1, month)),
        ),
        div(
          { eastStretchDock: 95 },
          buildArrowButton(true, () => applyMonth(year, month - 1)),
          monthLabel,
          buildArrowButton(false, () => applyMonth(year, month + 1)),
        )
      ),
      div(
        { southStretchDock: 18 },
        slots.elements
      ),
    );

    let getDateObj = (yr, mn, dy) => {
      return new Date(yr, mn - 1, dy, 12, 0, 0);
    };

    let applyDaysToSlots = (startX, startY, startDate, dayCount, forward, yr, mn) => {
      let day = startDate;
      let step = forward ? 1 : -1;

      let x = startX;
      let y = startY;
      let bold = true;
      let today = new Date();
      let todayMonth = today.getMonth() + 1;
      let todayYear = today.getFullYear();
      let todayDay = today.getDate();

      while (true) {
        if (x < 0) { x = 6; y--; }
        if (x >= 7) { x = 0; y++; }
        if (y <= 0 || y > 6) return;

        let isToday = yr === todayYear && mn === todayMonth && todayDay === day;
        let slot = slots.lookup[x + ',' + y];
        slot.firstChild.clear().set(
          `${day}`,
          { bold },
          bold ? { opacity: 1 } : { opacity: 0.4 },
          isToday ? { backgroundColor: 'rgba(255, 255, 255, 0.8)', color: '#000' } : { backgroundColor: '', color: '' },
        );

        x += step;
        day += step;
        if (day > dayCount) { day = 1; bold = false; mn++; if (mn > 12) { mn = 1; yr++; } }
        if (day === 0) { day = dayCount; bold = false; mn--; if (mn < 1) { mn = 12; yr--; } }
      }
    };

    let monthNames = [
      '',
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    let getMonthLabel = (mn) => monthNames[mn];

    let applyMonth = (yr, mn) => {

      if (mn < 1) { mn = 12; yr--; }
      if (mn > 12) { mn = 1; yr++; }
      if (yr < 1970) { mn = 1; yr = 1970; }

      month = mn;
      year = yr;

      monthLabel.clear().set(getMonthLabel(mn));
      yearLabel.clear().set('' + yr);

      let d = getDateObj(yr, mn, 1);
      let firstDow = d.getDay();
      let daysInMonth = getDateObj(yr, mn + 1, 0).getDate();
      let daysInPrevMonth = getDateObj(yr, mn, 0).getDate();
      let [x, y] = firstDow === 0 ? [0, 2] : [firstDow, 1];

      applyDaysToSlots(x, y, 1, daysInMonth, true, year, month);
      applyDaysToSlots(x, y, 1, daysInPrevMonth, false, year, month);
    };

    let dow = [
      'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'
    ].map(d => span({ bold: true }, d));
    for (let x = 0; x < 7; x++) {
      let slot = slots.lookup[x + ',0'];
      slot.firstChild.clear().set(dow[x]);
    }

    let now = new Date();
    applyMonth(now.getFullYear(), now.getMonth() + 1);

    return outer;
  });
})();
