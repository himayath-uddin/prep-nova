import { createReadStream, existsSync } from "node:fs";
import { resolve, extname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

// MIME types for static files
const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js":   "application/javascript",
  ".css":  "text/css",
  ".png":  "image/png",
  ".jpg":  "image/jpeg",
  ".svg":  "image/svg+xml",
  ".ico":  "image/x-icon",
  ".json": "application/json",
  ".woff": "font/woff",
  ".woff2":"font/woff2",
  ".ttf":  "font/ttf",
};

export const config = { runtime: "nodejs" };

export default async function handler(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Serve static assets from dist/client  
  if (pathname.startsWith("/assets/")) {
    const filePath = resolve(__dirname, "..", "dist", "client", pathname.slice(1));
    if (existsSync(filePath)) {
      const ext = extname(filePath);
      const mime = MIME_TYPES[ext] || "application/octet-stream";
      const { readFile } = await import("node:fs/promises");
      const content = await readFile(filePath);
      return new Response(content, {
        headers: { "Content-Type": mime, "Cache-Control": "public, max-age=31536000" },
      });
    }
  }

  // Hand off all page requests to the TanStack SSR server
  try {
    const serverEntry = await import("../dist/server/server.js");
    const fetchHandler = serverEntry.default?.fetch ?? serverEntry.fetch;
    if (!fetchHandler) throw new Error("No fetch handler found in server entry");
    return await fetchHandler(request, process.env, {});
  } catch (err) {
    return new Response(
      `<pre>SSR Error:\n${err.stack ?? err}</pre>`,
      { status: 500, headers: { "content-type": "text/html" } }
    );
  }
}
