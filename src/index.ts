import "./styles/base.css";
import { resolveConfig, SudokuConfig } from "./core/config";
import { createSudokuController } from "./core/sudoku";
import { createDomRenderer } from "./renderers/domRenderer";

export * from "./core/config";
export type { SudokuController } from "./core/sudoku";

export function createSudoku(config: SudokuConfig) {
  const resolvedConfig = resolveConfig(config);
  const target = resolveTarget(resolvedConfig.target);
  const { engine, controller } = createSudokuController(resolvedConfig);
  const renderer = createDomRenderer(target, engine, resolvedConfig);
  renderer.mount();

  return {
    ...controller,
    destroy() {
      renderer.destroy();
      controller.destroy();
    },
  };
}

function resolveTarget(target: string | HTMLElement): HTMLElement {
  if (typeof target !== "string") {
    return target;
  }

  const element = document.querySelector<HTMLElement>(target);
  if (!element) {
    throw new Error(`Sudoku target "${target}" was not found.`);
  }
  return element;
}
