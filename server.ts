import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

function getCjsFilename() {
  try {
    // @ts-ignore
    return __filename;
  } catch {
    return "";
  }
}

function getCjsDirname() {
  try {
    // @ts-ignore
    return __dirname;
  } catch {
    return "";
  }
}

const cleanFilename = typeof import.meta !== "undefined" && import.meta.url
  ? fileURLToPath(import.meta.url)
  : getCjsFilename();

const cleanDirname = typeof import.meta !== "undefined" && import.meta.url
  ? path.dirname(cleanFilename)
  : getCjsDirname();

// @ts-ignore
const __filename = cleanFilename;
// @ts-ignore
const __dirname = cleanDirname;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
