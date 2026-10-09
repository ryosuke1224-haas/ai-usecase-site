import http from "node:http";
import type { AddressInfo } from "node:net";

export type PostResult = { status: number; body: unknown };

export type ReviewServer = {
  url: string;
  port: number;
  close: () => Promise<void>;
};

const DEFAULT_PORT = 4317;
const MAX_BODY = 32 * 1024;

/**
 * Local review server. Binds to 127.0.0.1 only, rejects foreign Host headers,
 * and requires the per-run token on every POST.
 */
export async function startReviewServer(options: {
  token: string;
  pages: Record<string, () => string>;
  state: () => unknown;
  posts: Record<string, (body: Record<string, unknown>) => PostResult>;
}): Promise<ReviewServer> {
  const server = http.createServer((req, res) => {
    void handle(req, res).catch((error: unknown) => {
      send(res, 500, { error: error instanceof Error ? error.message : "Server error" });
    });
  });

  async function handle(req: http.IncomingMessage, res: http.ServerResponse) {
    const port = (server.address() as AddressInfo | null)?.port;
    const host = (req.headers.host ?? "").toLowerCase();
    if (host !== `localhost:${port}` && host !== `127.0.0.1:${port}`) {
      send(res, 403, { error: "Unexpected host." });
      return;
    }
    const url = new URL(req.url ?? "/", `http://localhost:${port}`);
    if (req.method === "GET") {
      if (url.pathname === "/api/state") {
        send(res, 200, options.state());
        return;
      }
      const render = options.pages[url.pathname];
      if (!render) {
        send(res, 404, { error: "Not found." });
        return;
      }
      res.writeHead(200, {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
        "x-frame-options": "DENY",
        "content-security-policy":
          "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; base-uri 'none'; form-action 'none'",
      });
      res.end(render());
      return;
    }
    if (req.method === "POST") {
      const handler = options.posts[url.pathname];
      if (!handler) {
        send(res, 404, { error: "Not found." });
        return;
      }
      if (req.headers["x-atlas-token"] !== options.token) {
        send(res, 403, { error: "Missing or invalid review token. Reload the page from the localhost URL." });
        return;
      }
      const origin = req.headers.origin;
      if (origin && origin !== `http://localhost:${port}` && origin !== `http://127.0.0.1:${port}`) {
        send(res, 403, { error: "Unexpected origin." });
        return;
      }
      const body = await readBody(req);
      const result = handler(body);
      send(res, result.status, result.body);
      return;
    }
    send(res, 405, { error: "Method not allowed." });
  }

  const port = await listen(server, Number(process.env.ATLAS_AUTO_PORT) || DEFAULT_PORT);
  return {
    url: `http://localhost:${port}`,
    port,
    close: () =>
      new Promise((resolve) => {
        server.closeAllConnections?.();
        server.close(() => resolve());
      }),
  };
}

async function listen(server: http.Server, first: number): Promise<number> {
  for (let port = first; port < first + 20; port += 1) {
    const ok = await new Promise<boolean>((resolve, reject) => {
      const onError = (error: NodeJS.ErrnoException) => {
        server.off("listening", onListening);
        if (error.code === "EADDRINUSE" || error.code === "EACCES") resolve(false);
        else reject(error);
      };
      const onListening = () => {
        server.off("error", onError);
        resolve(true);
      };
      server.once("error", onError);
      server.once("listening", onListening);
      server.listen(port, "127.0.0.1");
    });
    if (ok) return port;
  }
  throw new Error(`No free port between ${first} and ${first + 19}. Set ATLAS_AUTO_PORT.`);
}

function readBody(req: http.IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BODY) {
        reject(new Error("Request body is too large."));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      try {
        const text = Buffer.concat(chunks).toString("utf8");
        const parsed: unknown = text ? JSON.parse(text) : {};
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
          reject(new Error("Body must be a JSON object."));
          return;
        }
        resolve(parsed as Record<string, unknown>);
      } catch {
        reject(new Error("Body is not valid JSON."));
      }
    });
    req.on("error", reject);
  });
}

function send(res: http.ServerResponse, status: number, body: unknown) {
  if (res.headersSent) return;
  res.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
  res.end(JSON.stringify(body));
}
