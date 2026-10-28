import { join } from "node:path";
import { env } from "../env";

/**
 * Serve the built Vite client from CLIENT_DIR, falling back to index.html
 * for extension-less paths so client-side routes resolve, and 404 otherwise.
 */
export const serveStatic = async (pathname: string): Promise<Response> => {
  const requested = pathname === "/" ? "index.html" : pathname.slice(1);
  if (requested.includes(".."))
    return new Response("Not found", { status: 404 });
  const file = Bun.file(join(env.clientDir, requested));
  if (await file.exists()) return new Response(file);
  if (!requested.includes(".")) {
    const index = Bun.file(join(env.clientDir, "index.html"));
    if (await index.exists()) return new Response(index);
  }
  return new Response("Not found", { status: 404 });
};
