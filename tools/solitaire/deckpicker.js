let deckPickerWindow = async (os, pid, game) => {
  let { GameCards, ItemList } = await HtmlUtil.loadComponents('GameCards', 'ItemList');
  cards = GameCards();
  let { div, button } = HtmlUtil;
  let settings = os.AppSettings.getScope(APP_ID);
  let defaultSelectedId = await settings.getString('cardStyle');
  let deckIds = cards.getChoices();
  let choices = deckIds.map(id => {
    return {
      id,
      image: cards.getBackSample(id),
      name: cards.getDeckName(id),
    }
  });

  await os.Shell.showWindow(pid, {
    title: TITLE,
    innerWidth: 400,
    innerHeight: 300,
    onInit: (contentHost, winData) => {
      let selectedId = defaultSelectedId || choices[0].id;

      let refresh = () => {
        let current = choices.filter(t => t.id === selectedId)[0];
        if (current) {
          imgHost.clear().set(Util.copyImage(current.image));
        }
      };

      let imgHost = div({ height: 150, padding: 25 });
      let root = div({ fullSize: true, backgroundColor: '#080' },
        div({ westDock: 200, },
          div({ position: 'absolute', left: 10, top: 10, bottom: 10, right: 0 },
            ItemList({
              backgroundColor: '#fff',
              fullSize: true,
              getItems: () => choices,
              getId: item => item.id,
              renderItem: item => div(item.name),
              selectedId,
              onSelectionChanged: (id) => {
                selectedId = id;
                refresh();
              },
            })
          ),
        ),
        div({ eastStretchDock: 200, textAlign: 'center' },
          div(imgHost),
          button("Pick This Deck", async () => {
            settings.setString('cardStyle', selectedId);
            game.cardImages = await cards.generateImages(selectedId);
            renderGame(game);
            winData.closeHandler();
          }),
        ),
      );
      contentHost.set(root);

      refresh();
    },
  });
};
