import { formatTimeOrPlaceholder, positionKey } from "../core/board";
import { DIFFICULTY_SETTINGS, ResolvedSudokuConfig } from "../core/config";
import { isRelatedCell, StateSnapshot, SudokuEngine } from "../core/state";

export interface DomRenderer {
  mount(): void;
  destroy(): void;
}

export function createDomRenderer(target: HTMLElement, engine: SudokuEngine, config: ResolvedSudokuConfig): DomRenderer {
  const root = document.createElement("div");
  root.className = "gsudoku";
  root.tabIndex = 0;

  let unsubscribe: (() => void) | null = null;
  let currentState: StateSnapshot | null = null;
  let modalHideTimer: number | null = null;

  const refs = buildShell(root, config);
  buildNumberPad(refs.numberPad, engine);

  return {
    mount() {
      target.innerHTML = "";
      target.appendChild(root);
      bindEvents();
      unsubscribe = engine.subscribe((state) => {
        currentState = state;
        render(state);
      });
    },
    destroy() {
      unsubscribe?.();
      clearModalHideTimer();
      root.remove();
      document.removeEventListener("keydown", handleKeydown);
    },
  };

  function bindEvents(): void {
    refs.difficulty.addEventListener("change", (event) => {
      engine.setDifficulty((event.target as HTMLSelectElement).value as typeof config.difficulty);
    });

    refs.liveValidation.addEventListener("change", (event) => {
      config.liveValidation = (event.target as HTMLInputElement).checked;
      if (currentState) {
        render(engine.getStateSnapshot());
      }
    });

    refs.themeToggle.addEventListener("click", () => {
      engine.setTheme(currentState?.theme === "github-dark" ? "github-light" : "github-dark");
    });

    refs.notesToggle.addEventListener("click", () => engine.toggleNotesMode());
    refs.eraseButton.addEventListener("click", () => engine.clearSelectedCell());
    refs.hintButton.addEventListener("click", () => engine.applyHint());
    refs.restartButton.addEventListener("click", () => engine.restart());
    refs.newGameButton.addEventListener("click", () => engine.newGame());
    refs.playAgainButton.addEventListener("click", () => {
      hideWinModal();
      window.setTimeout(() => {
        engine.newGame();
      }, 180);
    });

    document.addEventListener("keydown", handleKeydown);
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (!config.allowKeyboardInput) {
      return;
    }

    const activeInside = document.activeElement === root || root.contains(document.activeElement);
    if (!activeInside) {
      return;
    }

    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
      event.preventDefault();
      const direction = {
        ArrowUp: "up",
        ArrowDown: "down",
        ArrowLeft: "left",
        ArrowRight: "right",
      }[event.key] as "up" | "down" | "left" | "right";
      engine.moveSelection(direction);
      return;
    }

    if (/^[1-9]$/.test(event.key)) {
      event.preventDefault();
      engine.inputValue(Number(event.key));
      return;
    }

    if (event.key === "Backspace" || event.key === "Delete" || event.key === "0") {
      event.preventDefault();
      engine.clearSelectedCell();
      return;
    }

    if (event.key.toLowerCase() === "n" && config.allowNotes) {
      event.preventDefault();
      engine.toggleNotesMode();
    }
  }

  function render(state: StateSnapshot): void {
    root.dataset.theme = state.theme;
    applyColorOverrides(root, config);
    refs.title.textContent = config.labels.title;
    refs.subtitle.textContent = config.labels.subtitle;
    refs.timerCard.hidden = !config.showTimer;
    refs.mistakesCard.hidden = !config.showMistakes;
    refs.hintButton.hidden = !config.showHints;
    refs.notesToggle.hidden = !config.allowNotes;
    refs.timer.textContent = formatTimeOrPlaceholder(state.timer);
    refs.mistakes.textContent = String(state.mistakes);
    refs.liveValidation.checked = config.liveValidation;
    refs.notesToggle.textContent = state.notesMode ? config.labels.notesOn : config.labels.notesOff;
    refs.notesToggle.classList.toggle("is-active", state.notesMode);
    refs.bestTimeLabel.textContent = `${config.labels.bestTimePrefix} ${state.difficulty}: ${formatTimeOrPlaceholder(
      state.bestTimes[state.difficulty]
    )}`;
    refs.completion.textContent = `${state.completion}%`;
    refs.bestEasy.textContent = formatTimeOrPlaceholder(state.bestTimes.easy);
    refs.bestMedium.textContent = formatTimeOrPlaceholder(state.bestTimes.medium);
    refs.bestHard.textContent = formatTimeOrPlaceholder(state.bestTimes.hard);
    refs.selectionHint.textContent = engine.getSelectionMessage();
    refs.winEyebrow.textContent = config.labels.winEyebrow;
    refs.winTitle.textContent = config.labels.winTitle;
    refs.winMessage.textContent = engine.getWinMessage();
    refs.playAgainButton.textContent = config.labels.playAgain;
    refs.instructions.textContent = config.labels.instructions;
    refs.difficulty.value = state.difficulty;
    syncWinModal(state.status === "won");

    refs.board.innerHTML = "";
    const fragment = document.createDocumentFragment();
    const selectedValue = state.selected ? state.board[state.selected.row][state.selected.col] : 0;

    for (let row = 0; row < 9; row += 1) {
      for (let col = 0; col < 9; col += 1) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "gsudoku-cell";
        button.dataset.row = String(row);
        button.dataset.col = String(col);
        button.setAttribute("role", "gridcell");
        button.setAttribute("aria-label", `Row ${row + 1} column ${col + 1}`);

        const cellPosition = { row, col };
        const value = state.board[row][col];
        const isSelected = state.selected?.row === row && state.selected?.col === col;
        const isMatching = selectedValue !== 0 && value === selectedValue;
        const isHinted = state.hintedCells.includes(positionKey(cellPosition));
        const isInvalid = state.invalidCells.includes(positionKey(cellPosition));

        if (state.fixed[row][col]) button.classList.add("is-fixed");
        if (isSelected) button.classList.add("is-selected");
        if (isRelatedCell(state.selected, cellPosition) && !isSelected) button.classList.add("is-related");
        if (isMatching) button.classList.add("is-matching");
        if (isHinted) button.classList.add("is-hinted");
        if (isInvalid) button.classList.add("is-invalid");

        button.addEventListener("click", () => engine.selectCell(row, col));

        const content = document.createElement("div");
        content.className = "gsudoku-cell-content";

        if (value !== 0) {
          const valueNode = document.createElement("span");
          valueNode.className = "gsudoku-value";
          valueNode.textContent = String(value);
          content.appendChild(valueNode);
        } else if (state.notes[row][col].length > 0) {
          const notesGrid = document.createElement("div");
          notesGrid.className = "gsudoku-notes";
          for (let note = 1; note <= 9; note += 1) {
            const noteNode = document.createElement("span");
            noteNode.textContent = state.notes[row][col].includes(note) ? String(note) : "";
            notesGrid.appendChild(noteNode);
          }
          content.appendChild(notesGrid);
        }

        button.appendChild(content);
        fragment.appendChild(button);
      }
    }

    refs.board.appendChild(fragment);
  }

  function syncWinModal(isVisible: boolean): void {
    clearModalHideTimer();

    if (isVisible) {
      refs.winModal.hidden = false;
      refs.winModal.classList.remove("is-hiding");
      refs.winModal.classList.add("is-visible");
      return;
    }

    if (!refs.winModal.classList.contains("is-visible")) {
      refs.winModal.hidden = true;
      refs.winModal.classList.remove("is-hiding");
      return;
    }

    refs.winModal.classList.remove("is-visible");
    refs.winModal.classList.add("is-hiding");
    modalHideTimer = window.setTimeout(() => {
      refs.winModal.hidden = true;
      refs.winModal.classList.remove("is-hiding");
      modalHideTimer = null;
    }, 180);
  }

  function hideWinModal(): void {
    syncWinModal(false);
  }

  function clearModalHideTimer(): void {
    if (modalHideTimer !== null) {
      window.clearTimeout(modalHideTimer);
      modalHideTimer = null;
    }
  }
}

function buildShell(root: HTMLElement, config: ResolvedSudokuConfig) {
  root.innerHTML = `
    <div class="gsudoku-shell">
      <header class="gsudoku-topbar">
        <div class="gsudoku-brand">
          <p class="gsudoku-eyebrow">Developer Edition</p>
          <h1 class="gsudoku-title"></h1>
          <p class="gsudoku-subtitle"></p>
        </div>
        <div class="gsudoku-topbar-controls">
          <label class="gsudoku-field">
            <span>${config.labels.difficulty}</span>
            <select class="gsudoku-select">
              <option value="easy">${DIFFICULTY_SETTINGS.easy.label}</option>
              <option value="medium">${DIFFICULTY_SETTINGS.medium.label}</option>
              <option value="hard">${DIFFICULTY_SETTINGS.hard.label}</option>
            </select>
          </label>
          <div class="gsudoku-stat-card">
            <span>${config.labels.timer}</span>
            <strong>00:00</strong>
          </div>
          <div class="gsudoku-stat-card">
            <span>${config.labels.mistakes}</span>
            <strong>0</strong>
          </div>
          <button class="gsudoku-icon-button" type="button">Theme</button>
        </div>
      </header>

      <div class="gsudoku-layout">
        <section class="gsudoku-panel gsudoku-board-panel">
          <div class="gsudoku-panel-header">
            <div class="gsudoku-panel-heading">
              <h2>${config.labels.currentPuzzle}</h2>
              <p class="gsudoku-best-time"></p>
            </div>
            <label class="gsudoku-toggle">
              <input type="checkbox" checked />
              <span>${config.labels.liveValidation}</span>
            </label>
          </div>
          <div class="gsudoku-board-frame">
            <div class="gsudoku-board" role="grid" aria-label="Sudoku board"></div>
          </div>
          <div class="gsudoku-hint-strip"></div>
        </section>

        <aside class="gsudoku-panel gsudoku-control-panel">
          <div class="gsudoku-number-pad"></div>
          <div class="gsudoku-actions">
            <button class="gsudoku-button gsudoku-notes-toggle" type="button">${config.labels.notesOff}</button>
            <button class="gsudoku-button" data-action="erase" type="button">${config.labels.erase}</button>
            <button class="gsudoku-button" data-action="hint" type="button">${config.labels.hint}</button>
            <button class="gsudoku-button" data-action="restart" type="button">${config.labels.restart}</button>
            <button class="gsudoku-button gsudoku-button-primary" data-action="new" type="button">${config.labels.newGame}</button>
          </div>
          <div class="gsudoku-stats-card">
            <h3>Stats</h3>
            <dl>
              <div><dt>${config.labels.completion}</dt><dd data-stat="completion">0%</dd></div>
              <div><dt>${config.labels.bestEasy}</dt><dd data-stat="easy">--:--</dd></div>
              <div><dt>${config.labels.bestMedium}</dt><dd data-stat="medium">--:--</dd></div>
              <div><dt>${config.labels.bestHard}</dt><dd data-stat="hard">--:--</dd></div>
            </dl>
          </div>
        </aside>
      </div>

      <footer class="gsudoku-footer"></footer>

      <div class="gsudoku-win-modal" hidden>
        <div class="gsudoku-win-card">
          <p class="gsudoku-eyebrow"></p>
          <h2></h2>
          <p class="gsudoku-win-message"></p>
          <button class="gsudoku-button gsudoku-button-primary" type="button"></button>
        </div>
      </div>
    </div>
  `;

  return {
    title: root.querySelector(".gsudoku-title") as HTMLHeadingElement,
    subtitle: root.querySelector(".gsudoku-subtitle") as HTMLParagraphElement,
    difficulty: root.querySelector(".gsudoku-select") as HTMLSelectElement,
    timerCard: root.querySelectorAll(".gsudoku-stat-card")[0] as HTMLDivElement,
    mistakesCard: root.querySelectorAll(".gsudoku-stat-card")[1] as HTMLDivElement,
    timer: root.querySelectorAll(".gsudoku-stat-card strong")[0] as HTMLElement,
    mistakes: root.querySelectorAll(".gsudoku-stat-card strong")[1] as HTMLElement,
    themeToggle: root.querySelector(".gsudoku-icon-button") as HTMLButtonElement,
    board: root.querySelector(".gsudoku-board") as HTMLDivElement,
    numberPad: root.querySelector(".gsudoku-number-pad") as HTMLDivElement,
    notesToggle: root.querySelector(".gsudoku-notes-toggle") as HTMLButtonElement,
    eraseButton: root.querySelector('[data-action="erase"]') as HTMLButtonElement,
    hintButton: root.querySelector('[data-action="hint"]') as HTMLButtonElement,
    restartButton: root.querySelector('[data-action="restart"]') as HTMLButtonElement,
    newGameButton: root.querySelector('[data-action="new"]') as HTMLButtonElement,
    liveValidation: root.querySelector(".gsudoku-toggle input") as HTMLInputElement,
    bestTimeLabel: root.querySelector(".gsudoku-best-time") as HTMLParagraphElement,
    selectionHint: root.querySelector(".gsudoku-hint-strip") as HTMLDivElement,
    completion: root.querySelector('[data-stat="completion"]') as HTMLElement,
    bestEasy: root.querySelector('[data-stat="easy"]') as HTMLElement,
    bestMedium: root.querySelector('[data-stat="medium"]') as HTMLElement,
    bestHard: root.querySelector('[data-stat="hard"]') as HTMLElement,
    instructions: root.querySelector(".gsudoku-footer") as HTMLElement,
    winModal: root.querySelector(".gsudoku-win-modal") as HTMLDivElement,
    winEyebrow: root.querySelector(".gsudoku-win-card .gsudoku-eyebrow") as HTMLElement,
    winTitle: root.querySelector(".gsudoku-win-card h2") as HTMLElement,
    winMessage: root.querySelector(".gsudoku-win-message") as HTMLElement,
    playAgainButton: root.querySelector(".gsudoku-win-card button") as HTMLButtonElement,
  };
}

function buildNumberPad(target: HTMLDivElement, engine: SudokuEngine): void {
  target.innerHTML = "";

  for (let value = 1; value <= 9; value += 1) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "gsudoku-number-button";
    button.textContent = String(value);
    button.addEventListener("click", () => engine.inputValue(value));
    target.appendChild(button);
  }

  const clearButton = document.createElement("button");
  clearButton.type = "button";
  clearButton.className = "gsudoku-number-button";
  clearButton.textContent = "Clear";
  clearButton.addEventListener("click", () => engine.clearSelectedCell());
  target.appendChild(clearButton);
}

function applyColorOverrides(root: HTMLElement, config: ResolvedSudokuConfig): void {
  root.style.setProperty("--gsudoku-bg", config.colors.bg ?? "");
  root.style.setProperty("--gsudoku-panel", config.colors.panel ?? "");
  root.style.setProperty("--gsudoku-panel-strong", config.colors.panelStrong ?? "");
  root.style.setProperty("--gsudoku-panel-subtle", config.colors.panelSubtle ?? "");
  root.style.setProperty("--gsudoku-text", config.colors.text ?? "");
  root.style.setProperty("--gsudoku-text-strong", config.colors.textStrong ?? "");
  root.style.setProperty("--gsudoku-muted", config.colors.muted ?? "");
  root.style.setProperty("--gsudoku-border", config.colors.border ?? "");
  root.style.setProperty("--gsudoku-border-strong", config.colors.borderStrong ?? "");
  root.style.setProperty("--gsudoku-accent", config.colors.accent ?? "");
  root.style.setProperty("--gsudoku-accent-hover", config.colors.accentHover ?? "");
  root.style.setProperty("--gsudoku-selection", config.colors.selection ?? "");
  root.style.setProperty("--gsudoku-selection-strong", config.colors.selectionStrong ?? "");
  root.style.setProperty("--gsudoku-matching", config.colors.matching ?? "");
  root.style.setProperty("--gsudoku-danger", config.colors.danger ?? "");
  root.style.setProperty("--gsudoku-cell", config.colors.cell ?? "");
  root.style.setProperty("--gsudoku-cell-user", config.colors.cellUser ?? "");
  root.style.setProperty("--gsudoku-cell-fixed", config.colors.cellFixed ?? "");
  root.style.setProperty("--gsudoku-notes", config.colors.notes ?? "");
}
