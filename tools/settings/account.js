let buildAccountAppearance = async os => {
  return createDetailsPanel(
    "Basic Account Settings",
    [
      createSettingBox("Not applicable", [
        div("You are currently running " + os.getName() + " anonymously. There is no account to customize."),
      ], true, true),
    ]
  );
};

let buildAccountSecurity = async os => {

  return createDetailsPanel(
    "Account Password & Security",
    [
      createSettingBox("Not applicable", [
        div("You are currently running " + os.getName() + " anonymously. There is no account to customize."),
      ], true, true),
    ]
  );
};
