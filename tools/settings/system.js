let buildEnvVar = async (os, pid) => {

  let envList = ItemList({
    height: 180,
    border: '1px solid #888',
    getId: item => item.id,
    renderItem: item => {
      return div(
        { width: '100%', textOverflow: 'ellipsis' },
        span({ bold: true }, item.id), ': ',
        span({ opacity: 0.5 }, item.value),
      )
    },
    getItems: async () => {
      return os.EnvVars.list().map(id => {
        return { id, value: os.EnvVars.getRaw(id) };
      })
    },
    onSelectionChanged: () => {
      updateButtons();
    },
  });

  let updateButtons = () => {
    let hasSelection = !!envList.getSelectedId();
    editButton.set({ enabled: hasSelection });
    deleteButton.set({ enabled: hasSelection });
  };

  let showCycleWarning = () => os.Shell.DialogFactory.showOkCancelToBool(
    pid,
    "Error",
    "This value cannot be set as it creates a variable cycle. Please ensure that environment variables do not refer to each other cyclically.");

  let editEnvVar = async () => {
    let id = envList.getSelectedId();
    if (!id) return;
    let value = os.EnvVars.getRaw(id);
    let result = await os.Shell.DialogFactory.showOkCancelToBool(pid, "Edit Environment Variable", div(
      div("Variable Name: ", span({ bold: true }, id)),
      div(
        "Value: ",
        inputText(
          { value },
          newValue => { value = newValue; },
        )
      ),
    ));

    if (result) {
      if (!os.EnvVars.set(id, value)) {
        await showCycleWarning();
      }
      envList.refreshItems(true);
      updateButtons();
    }
  };

  let deleteEnvVar = async () => {
    let id = envList.getSelectedId();
    let result = await os.Shell.DialogFactory.showYesNoToBool(
      pid,
      "Delete Environment Variable",
      div(
        div("Are you sure you want to delete the following environment variable? This may cause system instability."),
        div({ textAlign: 'center', bold: true }, id),
      )
    );

    if (result) {
      os.EnvVars.remove(id);
      envList.refreshItems(true);
      updateButtons();
    }
  };

  let newEnvVar = async (defaultName, defaultValue) => {
    let name = defaultName || '';
    let value = defaultValue || '';
    let tryAgain = false;
    let result = await os.Shell.DialogFactory.showOkCancelToBool(pid, "New Environment Variable", div(
      div("Create new environment variable:"),
      div("Name: ", inputText({ value: name }, v => { name = v; })),
      div("Value: ", inputText({ value: value }, v => { value = v; })),
    ));
    if (result) {
      if (os.EnvVars.getRaw(name)) {
        let collisionResult = await os.Shell.DialogFactory.showOkCancelToBool(pid, "Variable collision", "An environment variable already exists with that name.");
        if (!collisionResult) return;
        tryAgain = true;
      } else {
        if (!os.EnvVars.set(name, value)) {
          await showCycleWarning();
          tryAgain = true;
        }
      }
    }

    if (tryAgain) {
      return newEnvVar(name, value);
    }

    envList.refreshItems(true);
    updateButtons();
  };

  let editButton = button("Edit...", { enabled: false }, editEnvVar);
  let deleteButton = button("Delete...", { enabled: false }, deleteEnvVar);

  return createDetailsPanel(
    "Environment Variables",
    [
      createSettingBox(
        "Edit Existing Variables",
        [
          envList,
          div(
            { marginTop: 8 },
            editButton, ' ',
            deleteButton,
          )
        ],
        true, false),
      createSettingBox(
        "Create New Variable",
        [
          button("New...", () => newEnvVar()),
        ],
        false, true),
    ]);
};

let buildExportDisk = async os => {

  return createDetailsPanel(
    "Export Disk",
    [
      createSettingBox("Not implemented.", [
        div("This feature is not implemented yet. Please check back later."),
      ], true, true),
    ]
  );
};

let buildPermissions = async os => {

  return createDetailsPanel(
    "Permissions",
    [
      createSettingBox("Not implemented.", [
        div("This feature is not implemented yet. Please check back later."),
      ], true, true),
    ]
  );
};
