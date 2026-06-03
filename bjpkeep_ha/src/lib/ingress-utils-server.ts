import { headers } from "next/headers";

/**
 * Gets the current ingress path server-side from headers
 */
export async function getServerIngressPath(): Promise<string> {
  const headerList = await headers();
  return headerList.get("x-ingress-path") || "";
}

/**
 * Prefixes a path with the current ingress path (server-side)
 */
export async function getServerPrefixedPath(path: string): Promise<string> {
  const prefix = await getServerIngressPath();
  if (prefix && path.startsWith("/") && !path.startsWith(prefix)) {
    return prefix + path;
  }
  return path;
}
