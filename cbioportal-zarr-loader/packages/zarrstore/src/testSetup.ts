import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { readFile } from "node:fs/promises";
import { join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll } from "vitest";

declare global {
  var __TEST_BASE_URL__: string;
}

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const FIXTURES_DIR = join(__dirname, "..", "fixtures");

const server = createServer(async (req, res) => {
  const urlPath = decodeURIComponent(new URL(req.url!, "http://localhost").pathname);
  const filePath = normalize(join(FIXTURES_DIR, urlPath));

  if (!filePath.startsWith(FIXTURES_DIR)) {
    res.writeHead(403);
    res.end();
    return;
  }

  try {
    const data = await readFile(filePath);
    res.writeHead(200, {
      "Access-Control-Allow-Origin": "*",
      "Content-Length": data.byteLength,
    });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end();
  }
});

await new Promise<void>((resolve) => {
  server.listen(0, "127.0.0.1", resolve);
});

const { port } = server.address() as AddressInfo;
globalThis.__TEST_BASE_URL__ = `http://127.0.0.1:${port}`;

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});
