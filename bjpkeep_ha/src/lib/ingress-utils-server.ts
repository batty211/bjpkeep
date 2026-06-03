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

/**
 * Builds a browser-openable URL, preferring the Home Assistant ingress host/path.
 */
export async function getServerExternalUrl(path: string): Promise<string> {
  const headerList = await headers();
  const ingressPath = headerList.get("x-ingress-path") || "";
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const host = headerList.get("x-forwarded-host") || headerList.get("host");

  if (ingressPath && host) {
    const proto = headerList.get("x-forwarded-proto") || "http";
    return `${proto}://${host}${ingressPath}${normalizedPath}`;
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return new URL(normalizedPath, baseUrl).toString();
}
