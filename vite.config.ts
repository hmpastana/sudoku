import { defineConfig } from "vite";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT_DIR = fileURLToPath(new URL(".", import.meta.url));
const DEMO_DIR = resolve(ROOT_DIR, "demo");

export default defineConfig(({ command }) => {
  if (command === "serve") {
    return {
      root: DEMO_DIR,
      server: {
        open: true,
      },
    };
  }

  return {
    build: {
      emptyOutDir: false,
      lib: {
        entry: resolve(ROOT_DIR, "src/index.ts"),
        name: "GithubFriendlySudoku",
        fileName: "index",
        formats: ["es"],
      },
      rollupOptions: {
        output: {
          assetFileNames: (assetInfo) => {
            if (assetInfo.name === "style.css") {
              return "styles/base.css";
            }
            return "assets/[name][extname]";
          },
        },
      },
    },
  };
});
