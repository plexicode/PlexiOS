let generateHowToPlay = () => {
  let { h1, div, p } = HtmlUtil;
  return [
    h1("How to play Minesweeper", { fontSize: 14 }),
    p("Minesweeper is a game of logic."),
    p("You are given a grid. Underneath each square is either a landmine, or nothing (i.e. it's \"safe\")."),
    p("If you click on a square, you can see what's hidden underneath."),
    p("If it's a mine, you lose the game and must start over (click the face)."),
    p("If it's not a mine, you may be shown a number from 1 to 8. This number indicates how many mines touch the current square (even diagonally)"),
    p("For example, if you click on a square and see a 2, this means that of the 8 squares around it, two of them are mines."),
    p("If you think a square is a mine, you can right-click on it to mark it with a flag. (For mobile users, there is an option in the settings menu to enable a toggle button instead)"),
    p("The game is won when you have revealed all non-mine squares."),
    h1("Other notes and tips"),
    p("If there are ZERO mines around the square you click on, the game will recursively click the squares around it until it sees a number. This saves you some clicking."),
    p("You never have to worry about the first square you click on being a mine, it will always be clear."),
    p("If the game is too easy or too hard, adjust the difficulty mode. This basically just changes the size of the board and density of mines."),
  ];
};
