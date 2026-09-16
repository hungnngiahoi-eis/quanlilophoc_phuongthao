import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { DEFAULT_GS_URL } from "./src/config/appConfig";

const HARDCODED_DEFAULT_GS_URL = DEFAULT_GS_URL;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // API Route: Health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // API Route: Proxy Google Apps Script GET (bypass CORS & handle 302 redirects automatically)
  app.get("/api/gs/fetch", async (req, res) => {
    try {
      const gsUrl = ((req.query.url as string) || "").trim() || HARDCODED_DEFAULT_GS_URL;

      const targetUrl = new URL(gsUrl);
      targetUrl.searchParams.set("action", "getData");
      targetUrl.searchParams.set("_t", Date.now().toString());

      console.log(`[Proxy] Fetching from Apps Script: ${targetUrl.toString()}`);
      const response = await fetch(targetUrl.toString(), {
        method: "GET",
        headers: {
          Accept: "application/json, text/plain, */*",
          "User-Agent": "MathTeacherApp/1.0",
        },
        redirect: "follow",
      });

      const text = await response.text();
      let parsedData: any;
      try {
        parsedData = JSON.parse(text);
      } catch {
        parsedData = { raw: text };
      }

      return res.json({ success: true, data: parsedData });
    } catch (err: any) {
      console.error("[Proxy] Error fetching GS data:", err);
      return res.status(500).json({ success: false, error: err.message || "Lỗi kết nối tới Google Apps Script" });
    }
  });

  // API Route: Proxy Google Apps Script POST (Save data to Sheet/Drive)
  app.post("/api/gs/save", async (req, res) => {
    try {
      let { url, payload } = req.body;
      const targetUrl = (url && String(url).trim()) ? String(url).trim() : HARDCODED_DEFAULT_GS_URL;

      console.log(`[Proxy] Posting data to Apps Script: ${targetUrl}`);
      // Send as text/plain or application/json to avoid preflight issues in Google Apps Script
      const response = await fetch(targetUrl, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },
        body: JSON.stringify(payload),
        redirect: "follow",
      });

      const text = await response.text();
      let parsedResult: any;
      try {
        parsedResult = JSON.parse(text);
      } catch {
        parsedResult = { message: text };
      }

      if (parsedResult && parsedResult.success === false) {
        return res.status(400).json({ 
          success: false, 
          error: parsedResult.error || parsedResult.message || "Google Apps Script thông báo lưu không thành công" 
        });
      }

      return res.json({ success: true, result: parsedResult });
    } catch (err: any) {
      console.error("[Proxy] Error saving GS data:", err);
      return res.status(500).json({ success: false, error: err.message || "Lỗi lưu dữ liệu lên Google Sheets" });
    }
  });

  // Vite middleware for development / Static file serving for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
