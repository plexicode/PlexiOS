let buildLanguage = async os => {

  let langs = os.Localization.getLocaleList();

  let langPicker = ItemList({
    margin: 8,
    border: '1px solid #888',
    height: 140,
    getItems: () => {
      return langs;
    },
    getId: item => item.id,
    renderItem: item => {
      return div(span({ bold: true }, item.id.toUpperCase()), ": ", span({ color: '#555' }, item.name));
    },
    selectedId: os.Localization.getLanguage(),
    onSelectionChanged: langId => {
      os.Localization.setLanguage(langId);
    },
  });

  return createDetailsPanel(
    "Language",
    [
      createSettingBox(
        "System Language",
        //langPicker,
        div("Localization is not ready yet. Please check back later."),
        true, true)
    ]
  );
};

let buildClockSettings = async os => {

  return createDetailsPanel(
    "Date & Time",
    [
      createSettingBox("Not implemented.", [
        div("This feature is not implemented yet. However, if you are trying to change the appearance of the clock, this is located in Taskbar settings."),
      ], true, true),
    ]
  );
};
