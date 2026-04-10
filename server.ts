import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  const nasaApiKey = process.env.NASA_API_KEY || "yu2627SjePT5hEDMpHUMhIU6XQ0qiBEhAXStOGXy";

  // API Routes
  app.get("/api/nasa/datasets", async (req, res) => {
    try {
      const { keyword } = req.query;
      const url = `https://cmr.earthdata.nasa.gov/search/collections.json?keyword=${encodeURIComponent(keyword as string)}&page_size=5&include_facets=v2`;
      
      const response = await fetch(url, {
        headers: {
          'x-api-key': nasaApiKey
        }
      });

      if (!response.ok) throw new Error("NASA CMR API failed");
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("NASA CMR Error:", error);
      res.status(500).json({ error: "Failed to fetch NASA datasets" });
    }
  });

  app.get("/api/nasa/events", async (req, res) => {
    try {
      const url = `https://eonet.gsfc.nasa.gov/api/v3/events?status=open&api_key=${nasaApiKey}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("NASA EONET API failed");
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("NASA EONET Error:", error);
      res.status(500).json({ error: "Failed to fetch NASA events" });
    }
  });

  app.get("/api/nasa/gibs/*", async (req, res) => {
    try {
      const pathSegments = req.params[0];
      // GIBS is a public service and does not use api_key query parameter.
      // Appending it can cause 400/403 errors.
      const url = `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${pathSegments}`;
      
      console.log(`Fetching GIBS imagery: ${url}`);
      const response = await fetch(url);
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`NASA GIBS API failed with status ${response.status}: ${url}`);
        console.error(`Response body: ${errorText}`);
        throw new Error(`NASA GIBS API failed with status ${response.status}`);
      }
      
      const contentType = response.headers.get("content-type");
      if (contentType) res.setHeader("Content-Type", contentType);
      
      const buffer = await response.arrayBuffer();
      res.send(Buffer.from(buffer));
    } catch (error) {
      console.error("NASA GIBS Error:", error);
      res.status(500).json({ error: "Failed to fetch NASA imagery" });
    }
  });

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
