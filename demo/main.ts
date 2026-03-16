import { createSudoku } from "../src";

const game = createSudoku({
  target: "#demo-app",
  theme: "github-dark",
  difficulty: "medium",
  showTimer: true,
  showMistakes: true,
  allowNotes: true,
  showHints: true,
  callbacks: {
    onWin(state) {
      console.log("Solved", state);
    },
  },
});

game.start();

const theme = document.querySelector<HTMLSelectElement>("#theme");
const difficulty = document.querySelector<HTMLSelectElement>("#difficulty");
const notes = document.querySelector<HTMLButtonElement>("#notes");
const restart = document.querySelector<HTMLButtonElement>("#restart");
const nextGame = document.querySelector<HTMLButtonElement>("#new");

theme?.addEventListener("change", () => game.setTheme(theme.value as "github-dark" | "github-light"));
difficulty?.addEventListener("change", () => game.setDifficulty(difficulty.value as "easy" | "medium" | "hard"));
notes?.addEventListener("click", () => game.toggleNotesMode());
restart?.addEventListener("click", () => game.restart());
nextGame?.addEventListener("click", () => game.newGame());
