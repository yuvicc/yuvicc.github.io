// Minimal static server for tests: serves dist/ under the configured base path,
// the same way a static host would.
import { createServer, type Server } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BASE_PATH } from '../site.config.mjs';

export const DIST = fileURLToPath(new URL('../dist/', import.meta.url));

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.xml': 'application/xml',
  '.json': 'application/json',
  '.txt': 'text/plain',
};

/** Map a URL path under the base to a file in dist/, or null. */
export async function resolveFile(pathname: string): Promise<string | null> {
  if (!pathname.startsWith(BASE_PATH)) return null;
  const rel = normalize(decodeURIComponent(pathname.slice(BASE_PATH.length)));
  if (rel.startsWith('..')) return null;
  let file = join(DIST, rel);
  try {
    if ((await stat(file)).isDirectory()) file = join(file, 'index.html');
    await stat(file);
    return file;
  } catch {
    return null;
  }
}

export async function startServer(): Promise<{ server: Server; origin: string }> {
  const server = createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    const file = await resolveFile(url.pathname);
    if (!file) {
      res.writeHead(404, { 'content-type': 'text/plain' }).end('not found');
      return;
    }
    res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
    res.end(await readFile(file));
  });
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  const addr = server.address();
  const port = typeof addr === 'object' && addr ? addr.port : 0;
  return { server, origin: `http://127.0.0.1:${port}` };
}
