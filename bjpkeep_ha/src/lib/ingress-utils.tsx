"use client";

import Link, { LinkProps } from "next/link";
import { ReactNode, createContext, useContext } from "react";

declare global {
  interface Window {
    __BJPKEEP_INGRESS_PATH__?: string;
  }
}

// Context to store the ingress path
const IngressContext = createContext<string>("");

export function IngressProvider({ children, path }: { children: ReactNode, path: string }) {
  return <IngressContext.Provider value={path}>{children}</IngressContext.Provider>;
}

/**
 * Gets the current ingress path from context.
 */
export function useIngressPath(): string {
  return useContext(IngressContext);
}

/**
 * Prefixes a path with the current ingress path
 */
export function getPrefixedPath(path: string, prefix: string): string {
  const normalizedPath = normalizeApiPath(path);

  if (prefix && normalizedPath.startsWith("/") && !normalizedPath.startsWith(prefix)) {
    return prefix + normalizedPath;
  }
  // Force relative path if not prefixed
  if (normalizedPath.startsWith("/")) {
    return "." + normalizedPath;
  }
  return normalizedPath;
}

function normalizeApiPath(path: string): string {
  if (!path.startsWith("/api/")) {
    return path;
  }

  const queryIndex = path.indexOf("?");
  const pathname = queryIndex === -1 ? path : path.slice(0, queryIndex);
  const search = queryIndex === -1 ? "" : path.slice(queryIndex);

  if (pathname.endsWith("/")) {
    return path;
  }

  return `${pathname}/${search}`;
}

function getBrowserIngressPath(): string {
  if (typeof window === "undefined") {
    return "";
  }

  if (window.__BJPKEEP_INGRESS_PATH__) {
    return window.__BJPKEEP_INGRESS_PATH__;
  }

  const metaPath = document
    .querySelector<HTMLMetaElement>('meta[name="bjpkeep-ingress-path"]')
    ?.content;

  if (metaPath) {
    window.__BJPKEEP_INGRESS_PATH__ = metaPath;
    return metaPath;
  }

  const match = window.location.pathname.match(/^\/api\/hassio_ingress\/[^/]+/);
  const prefix = match ? match[0] : "";
  window.__BJPKEEP_INGRESS_PATH__ = prefix;

  return prefix;
}

/**
 * A fetch wrapper that automatically adds the Ingress prefix (Client-side)
 */
export function usePrefixedFetch() {
  const prefix = useIngressPath();
  return async (url: string, options?: RequestInit) => {
    return fetch(getPrefixedPath(url, prefix || getBrowserIngressPath()), options);
  };
}

/**
 * Legacy support for components not yet converted to usePrefixedFetch hook.
 * NOTE: This is less robust than usePrefixedFetch.
 */
export async function prefixedFetch(url: string, options?: RequestInit) {
  const prefix = getBrowserIngressPath();
  return fetch(getPrefixedPath(url, prefix), options);
}

interface BaseLinkProps extends LinkProps {
  children: ReactNode;
  className?: string;
  href: string;
}

/**
 * A wrapper around Next.js Link that automatically prepends the Ingress path.
 */
export function BaseLink({ href, children, ...props }: BaseLinkProps) {
  const prefix = useIngressPath();
  const prefixedHref = getPrefixedPath(href as string, prefix);

  return (
    <Link href={prefixedHref} {...props}>
      {children}
    </Link>
  );
}
